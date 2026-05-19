import os
import json
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

from tools import TOOLS_SCHEMA, execute_tool

load_dotenv()

# Read config from env, default to meta-llama/llama-3.1-8b-instruct:free
MODEL_NAME = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

app = FastAPI(title="Simple Chatbot")


class Message(BaseModel):
    role: str
    content: str | None = None
    tool_calls: list | None = None
    name: str | None = None
    tool_call_id: str | None = None


class ChatRequest(BaseModel):
    messages: list[Message]


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Stream a chat completion from OpenRouter, handling tool execution loop on the server."""

    def generate():
        # Convert incoming pydantic models to dicts and drop None values
        messages = []
        for m in request.messages:
            d = m.model_dump(exclude_none=True)
            messages.append(d)

        max_iterations = 5
        iteration = 0

        while iteration < max_iterations:
            iteration += 1

            # Request streaming completion from OpenRouter
            stream = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                tools=TOOLS_SCHEMA,
                tool_choice="auto",
                stream=True,
            )

            accumulated_text = ""
            tool_calls = {}

            for chunk in stream:
                if not chunk.choices:
                    continue

                delta = chunk.choices[0].delta

                # Stream content if available
                if delta.content:
                    accumulated_text += delta.content
                    yield json.dumps({"type": "text", "content": delta.content}) + "\n"

                # Accumulate tool calls
                if delta.tool_calls:
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in tool_calls:
                            tool_calls[idx] = {
                                "id": "",
                                "name": "",
                                "arguments": "",
                                "type": "function",
                            }
                        if tc.id:
                            tool_calls[idx]["id"] = tc.id
                        if tc.function:
                            if tc.function.name:
                                tool_calls[idx]["name"] = tc.function.name
                            if tc.function.arguments:
                                tool_calls[idx]["arguments"] += tc.function.arguments

            # If no tool calls were requested, we're done
            if not tool_calls:
                break

            # Process tool calls
            sorted_tcs = [tool_calls[idx] for idx in sorted(tool_calls.keys())]

            # Add assistant's message with tool calls to history
            assistant_msg = {
                "role": "assistant",
                "tool_calls": [
                    {
                        "id": tc["id"],
                        "type": "function",
                        "function": {
                            "name": tc["name"],
                            "arguments": tc["arguments"],
                        },
                    }
                    for tc in sorted_tcs
                ],
            }
            if accumulated_text:
                assistant_msg["content"] = accumulated_text

            messages.append(assistant_msg)

            for tc in sorted_tcs:
                tc_name = tc["name"]
                tc_id = tc["id"]
                tc_args_str = tc["arguments"]

                # Parse arguments
                try:
                    tc_args = json.loads(tc_args_str) if tc_args_str else {}
                except Exception:
                    tc_args = {"raw_arguments": tc_args_str}

                # Notify frontend about tool execution start
                yield json.dumps(
                    {
                        "type": "tool_start",
                        "id": tc_id,
                        "name": tc_name,
                        "arguments": tc_args,
                    }
                ) + "\n"

                # Execute tool
                output = execute_tool(tc_name, tc_args)

                # Notify frontend about tool execution end
                yield json.dumps(
                    {
                        "type": "tool_end",
                        "id": tc_id,
                        "name": tc_name,
                        "output": output,
                    }
                ) + "\n"

                # Append tool output to messages history
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc_id,
                        "name": tc_name,
                        "content": output,
                    }
                )

        # If we exceeded iterations, send an error
        if iteration >= max_iterations:
            yield json.dumps(
                {
                    "type": "text",
                    "content": "\n⚠️ [Agent terminated: maximum tool iterations reached]",
                }
            ) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")


# Serve the frontend
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return FileResponse("static/index.html")