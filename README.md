---
title: Simple Chatbot
emoji: 🤖
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# 🤖 Simple Chatbot
A sleek, real-time AI chatbot built with **FastAPI** and vanilla **HTML/CSS/JS**, powered by [OpenRouter](https://openrouter.ai/) for free access to various AI models.
URL - https://huggingface.co/spaces/Tamal321/Simple-Chatbot

![Python](https://img.shields.io/badge/Python-3.13+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136+-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔄 **Streaming Responses** | AI replies appear in real-time, token by token — no waiting for the full response |
| 💬 **Conversation Memory** | Full chat history is maintained within a session so the AI remembers context |
| 🎨 **Premium Dark UI** | Glassmorphism design with ambient gradient blobs and smooth animations |
| ⚡ **Quick Suggestions** | Clickable prompt starters on the welcome screen to get started fast |
| 📝 **Markdown Rendering** | Supports bold, italic, inline code, and code blocks in responses |
| 📱 **Responsive Design** | Works beautifully on desktop and mobile screens |
| 🔁 **New Chat** | One-click reset to clear history and start fresh |

---

## 📁 Project Structure

```
Simple Chatbot/
├── main.py              # FastAPI backend — API routes & OpenRouter integration
├── static/
│   ├── index.html       # Frontend HTML — chat UI layout
│   ├── style.css        # Styling — dark theme, glassmorphism, animations
│   └── script.js        # Frontend logic — streaming, history, markdown
├── .env                 # Environment variables (API key)
├── pyproject.toml       # Python project config & dependencies
├── uv.lock              # Dependency lock file
└── README.md            # You are here!
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.13+** installed
- **[uv](https://docs.astral.sh/uv/)** package manager (recommended) or `pip`
- An **OpenRouter API key** — get one free at [openrouter.ai/keys](https://openrouter.ai/keys)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "Simple Chatbot"
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

> ⚠️ **Never commit your `.env` file to version control.** It's already in `.gitignore`.

### 3. Install Dependencies

**Using uv (recommended):**

```bash
uv sync
```

**Using pip:**

```bash
pip install fastapi uvicorn openai python-dotenv
```

### 4. Run the Server

```bash
uv run python -m uvicorn main:app --reload --port 8000
```

### 5. Open the Chatbot

Navigate to **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser. That's it! 🎉

---

## 🔧 How It Works

### Architecture Overview

```
┌──────────────┐       POST /api/chat        ┌──────────────┐      Stream      ┌──────────────┐
│              │  ───────────────────────────► │              │ ───────────────► │              │
│   Browser    │   { messages: [...] }        │   FastAPI    │   completions    │  OpenRouter  │
│  (Frontend)  │  ◄─────────────────────────  │  (Backend)   │ ◄─────────────  │   (AI API)   │
│              │   Streaming text chunks      │              │   SSE chunks     │              │
└──────────────┘                              └──────────────┘                  └──────────────┘
```

### Step-by-Step Flow

1. **User types a message** in the textarea and hits Enter (or clicks send)
2. **Frontend** appends the message to the local `conversationHistory` array
3. **Frontend sends** the full conversation history to `POST /api/chat`
4. **Backend** forwards the messages to OpenRouter's API with `stream=True`
5. **Backend streams** each text chunk back to the frontend as it arrives
6. **Frontend renders** each chunk in real-time with a blinking cursor animation
7. **Assistant response** is saved to `conversationHistory` for context in future messages

### API Endpoint

#### `POST /api/chat`

Streams a chat completion from the AI model.

**Request Body:**

```json
{
  "messages": [
    { "role": "user", "content": "Hello, who are you?" },
    { "role": "assistant", "content": "I'm an AI assistant..." },
    { "role": "user", "content": "Tell me a joke" }
  ]
}
```

**Response:** `text/plain` streamed response (chunked transfer encoding)

---

## 🧠 Memory & Context

The chatbot maintains **in-session memory**:

- ✅ **Within a session** — the AI remembers everything you've said
- ❌ **Across page refreshes** — memory is lost (stored in browser JS only)
- ❌ **Across sessions** — no database persistence

The full conversation history is sent with every request, so the AI model has complete context to generate relevant responses.

---

## ⚙️ Configuration

### Changing the AI Model

In `main.py`, modify the `model` parameter:

```python
stream = client.chat.completions.create(
    model="openrouter/free",  # ← Change this
    messages=[m.model_dump() for m in request.messages],
    stream=True,
)
```

**Popular free models on OpenRouter:**

| Model | ID |
|-------|----|
| Auto (free tier) | `openrouter/free` |
| Gemma 3 | `google/gemma-3-27b-it:free` |
| Llama 4 Scout | `meta-llama/llama-4-scout:free` |
| Mistral Small | `mistralai/mistral-small-3.1-24b-instruct:free` |

Browse all models at [openrouter.ai/models](https://openrouter.ai/models).

### Changing the Port

```bash
uv run python -m uvicorn main:app --reload --port 3000
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework for the API server |
| `uvicorn` | ASGI server to run FastAPI |
| `openai` | OpenAI-compatible client (works with OpenRouter) |
| `python-dotenv` | Loads `.env` variables into the environment |

---

## 🛠️ Development

### Hot Reload

The server runs with `--reload`, so any changes to Python files will auto-restart the server. For frontend changes (HTML/CSS/JS), just refresh the browser.

### Project Dependencies

All dependencies are managed via `pyproject.toml` and locked in `uv.lock`. To add a new package:

```bash
uv add <package-name>
```

---

## ☁️ Deploying to Hugging Face Spaces

You can deploy this chatbot for free on [Hugging Face Spaces](https://huggingface.co/spaces) using Docker.

### 1. Create a Hugging Face Account

Sign up at [huggingface.co/join](https://huggingface.co/join) if you don't have an account.

### 2. Create a New Space

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. Fill in:
   - **Space name:** `simple-chatbot`
   - **SDK:** Select **Docker**
   - **Visibility:** Public or Private
3. Click **Create Space**

### 3. Set Your API Key as a Secret

> ⚠️ **Do NOT push your `.env` file.** Use Space Secrets instead.

1. In your Space, go to **Settings** → **Variables and secrets**
2. Click **New secret**
3. Set:
   - **Name:** `OPENROUTER_API_KEY`
   - **Value:** Your OpenRouter API key
4. Save — HF automatically injects secrets as environment variables

### 4. Push Your Code

**Option A — Add HF as a remote (recommended if you already have a git repo):**

```bash
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/simple-chatbot
git push hf main
```

**Option B — Clone and copy:**

```bash
git clone https://huggingface.co/spaces/YOUR_USERNAME/simple-chatbot
# Copy your project files into the cloned repo
cd simple-chatbot
git add .
git commit -m "Initial deployment"
git push
```

> 💡 Replace `YOUR_USERNAME` with your Hugging Face username.

### 5. Wait for Build & Go Live

1. Visit `https://huggingface.co/spaces/YOUR_USERNAME/simple-chatbot`
2. Watch the build logs under the **"Building"** status badge
3. Once it shows **"Running"**, your chatbot is live at:

```
https://YOUR_USERNAME-simple-chatbot.hf.space
```

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on `requirements.txt` | Make sure the file is committed and not in `.dockerignore` |
| "API key not found" crash | Verify the secret name is exactly `OPENROUTER_API_KEY` in Space Settings |
| Port mismatch error | Ensure `app_port: 7860` in README frontmatter matches `EXPOSE 7860` in Dockerfile |
| Space is sleeping | Free Spaces sleep after inactivity — visit the URL to wake it, or upgrade for persistent uptime |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) — Free AI model access
- [FastAPI](https://fastapi.tiangolo.com/) — Modern Python web framework
- [Inter Font](https://rsms.me/inter/) — Clean UI typography
