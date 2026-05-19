import os
import sys
import subprocess
import tempfile
import pathlib
import httpx
from bs4 import BeautifulSoup
from datetime import datetime

# Initialize Notes Directory
NOTES_DIR = pathlib.Path(__file__).parent.resolve() / "workspace_notes"

def _ensure_notes_dir():
    NOTES_DIR.mkdir(exist_ok=True)

def safe_note_path(title: str) -> pathlib.Path:
    _ensure_notes_dir()
    clean_title = "".join(c for c in title if c.isalnum() or c in (" ", "_", "-")).strip()
    if not clean_title:
        raise ValueError("Invalid note title.")
    
    file_path = (NOTES_DIR / f"{clean_title}.txt").resolve()
    if NOTES_DIR.resolve() not in file_path.parents and NOTES_DIR.resolve() != file_path.parent:
        raise ValueError("Access denied: Path traversal detected.")
    return file_path

# ========================================
# Tool Implementations
# ========================================

def get_current_time() -> str:
    """Returns the current date and time."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S Local Time")

def web_search(query: str) -> str:
    """Search DuckDuckGo and return the top results."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        url = "https://html.duckduckgo.com/html/"
        with httpx.Client(follow_redirects=True) as client:
            response = client.get(url, headers=headers, params={"q": query}, timeout=12.0)
        
        if response.status_code != 200:
            return f"Error: DuckDuckGo search failed with status code {response.status_code}."
        
        soup = BeautifulSoup(response.text, "html.parser")
        results = []
        for result in soup.find_all("div", class_="result")[:5]:
            title_el = result.find("a", class_="result__a")
            snippet_el = result.find("a", class_="result__snippet")
            
            if title_el:
                title = title_el.get_text(strip=True)
                href = title_el["href"]
                # Clean up DuckDuckGo outbound redirect links
                import urllib.parse
                parsed_href = urllib.parse.urlparse(href)
                queries = urllib.parse.parse_qs(parsed_href.query)
                if "uddg" in queries:
                    href = queries["uddg"][0]
                elif href.startswith("//"):
                    href = "https:" + href
                snippet = snippet_el.get_text(strip=True) if snippet_el else ""
                results.append(f"Title: {title}\nURL: {href}\nSnippet: {snippet}\n---")
        
        if not results:
            return "No results found. The query might be too specific or search returned no matches."
        
        return "\n".join(results)
    except Exception as e:
        return f"Error searching the web: {str(e)}"

def fetch_webpage(url: str) -> str:
    """Fetches text content from a given URL."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        with httpx.Client(follow_redirects=True) as client:
            response = client.get(url, headers=headers, timeout=12.0)
            
        if response.status_code != 200:
            return f"Error: Failed to fetch webpage, returned status code {response.status_code}."
            
        soup = BeautifulSoup(response.text, "html.parser")
        for bad_tag in soup(["script", "style", "meta", "noscript", "header", "footer", "nav"]):
            bad_tag.decompose()
            
        text = soup.get_text(separator="\n")
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        clean_text = "\n".join(chunk for chunk in chunks if chunk)
        
        if len(clean_text) > 8000:
            clean_text = clean_text[:8000] + "\n... [Truncated due to page length] ..."
            
        if not clean_text.strip():
            return "Webpage fetched successfully, but no readable text content was found."
            
        return clean_text
    except Exception as e:
        return f"Error fetching webpage: {str(e)}"

def python_interpreter(code: str) -> str:
    """Runs python code and returns stdout and stderr."""
    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False, encoding="utf-8") as f:
        f.write(code)
        temp_file_name = f.name
        
    try:
        result = subprocess.run(
            [sys.executable, temp_file_name],
            capture_output=True,
            text=True,
            timeout=15.0,
        )
        output = ""
        if result.stdout:
            output += f"STDOUT:\n{result.stdout}\n"
        if result.stderr:
            output += f"STDERR:\n{result.stderr}\n"
        
        if not output:
            output = "Execution complete with no output (exit code 0)."
        return output
    except subprocess.TimeoutExpired:
        return "Error: Execution timed out (limit: 15 seconds)."
    except Exception as e:
        return f"Error executing Python code: {str(e)}"
    finally:
        try:
            os.unlink(temp_file_name)
        except Exception:
            pass

def write_note(title: str, content: str) -> str:
    """Saves a note file locally in workspace notes."""
    try:
        path = safe_note_path(title)
        path.write_text(content, encoding="utf-8")
        return f"Note '{title}' saved successfully."
    except Exception as e:
        return f"Error saving note: {str(e)}"

def read_note(title: str) -> str:
    """Reads a note file locally from workspace notes."""
    try:
        path = safe_note_path(title)
        if not path.exists():
            return f"Error: Note '{title}' not found."
        return path.read_text(encoding="utf-8")
    except Exception as e:
        return f"Error reading note: {str(e)}"

def list_notes() -> str:
    """Lists all notes in workspace notes."""
    try:
        _ensure_notes_dir()
        notes = [f.stem for f in NOTES_DIR.glob("*.txt")]
        if not notes:
            return "No notes found in workspace."
        return "Notes found:\n" + "\n".join(f"- {note}" for note in notes)
    except Exception as e:
        return f"Error listing notes: {str(e)}"

# ========================================
# Tool Metadata for OpenAI API
# ========================================

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "Returns the current local date and time. Use this when the user asks about the time, date, or relative days (like today, yesterday, tomorrow, next week).",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Searches the web for a query using DuckDuckGo search and returns top result snippets and URLs. Use this for general queries that require recent info.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to run on DuckDuckGo",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_webpage",
            "description": "Fetches raw text content of a specific webpage URL. Use this to read details of a specific URL mentioned in search results or user requests.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The full URL of the webpage to fetch",
                    }
                },
                "required": ["url"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "python_interpreter",
            "description": "Executes arbitrary Python code in a sandboxed process. Use this for calculations, algorithmic logic, list manipulation, date math, data analysis, etc. Print the results to stdout to see them.",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "The Python source code to execute",
                    }
                },
                "required": ["code"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_note",
            "description": "Creates or updates a note file in the local workspace directory. Useful for remembering information across messages, saving summaries, or note-taking.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The title of the note (alphanumeric, spaces, dashes only)",
                    },
                    "content": {
                        "type": "string",
                        "description": "The content body to write to the note",
                    },
                },
                "required": ["title", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_note",
            "description": "Reads the content of an existing note from the local workspace by its title.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The title of the note to read",
                    }
                },
                "required": ["title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_notes",
            "description": "Lists the titles of all notes currently stored in the workspace notes directory.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
]

# ========================================
# Tool Execution Router
# ========================================

def execute_tool(name: str, args: dict) -> str:
    """Executes a tool by name with the given arguments."""
    try:
        if name == "get_current_time":
            return get_current_time()
        elif name == "web_search":
            return web_search(args["query"])
        elif name == "fetch_webpage":
            return fetch_webpage(args["url"])
        elif name == "python_interpreter":
            return python_interpreter(args["code"])
        elif name == "write_note":
            return write_note(args["title"], args["content"])
        elif name == "read_note":
            return read_note(args["title"])
        elif name == "list_notes":
            return list_notes()
        else:
            return f"Error: Tool '{name}' is not recognized."
    except Exception as e:
        return f"Error executing tool '{name}': {str(e)}"
