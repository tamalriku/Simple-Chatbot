// ========================================
// State
// ========================================
const conversationHistory = [];
let isStreaming = false;

// ========================================
// DOM Elements
// ========================================
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatArea = document.getElementById('chatArea');
const messagesDiv = document.getElementById('messages');
const welcome = document.getElementById('welcome');
const clearBtn = document.getElementById('clearBtn');
const suggestions = document.querySelectorAll('.suggestion');

// ========================================
// Auto-resize textarea
// ========================================
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
    sendBtn.disabled = !userInput.value.trim() || isStreaming;
});

// Enter to send (Shift+Enter for newline)
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (userInput.value.trim() && !isStreaming) {
            chatForm.dispatchEvent(new Event('submit'));
        }
    }
});

// ========================================
// Suggestion Buttons
// ========================================
suggestions.forEach(btn => {
    btn.addEventListener('click', () => {
        userInput.value = btn.dataset.prompt;
        userInput.dispatchEvent(new Event('input'));
        chatForm.dispatchEvent(new Event('submit'));
    });
});

// ========================================
// Clear Chat
// ========================================
clearBtn.addEventListener('click', () => {
    conversationHistory.length = 0;
    messagesDiv.innerHTML = '';
    welcome.classList.remove('hidden');
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;
});

// ========================================
// Create message element
// ========================================
function createMessageEl(role, content = '') {
    const msg = document.createElement('div');
    msg.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'Y' : 'AI';

    const body = document.createElement('div');
    body.className = 'message-body';

    const roleLabel = document.createElement('div');
    roleLabel.className = 'message-role';
    roleLabel.textContent = role === 'user' ? 'You' : 'Assistant';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    body.appendChild(roleLabel);
    body.appendChild(contentDiv);
    msg.appendChild(avatar);
    msg.appendChild(body);

    return { msg, contentDiv };
}

// ========================================
// Scroll to bottom
// ========================================
function scrollToBottom() {
    chatArea.scrollTo({
        top: chatArea.scrollHeight,
        behavior: 'smooth'
    });
}

// ========================================
// Format text with basic markdown
// ========================================
function formatContent(text) {
    // Escape HTML
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Line breaks → paragraphs
    html = html
        .split(/\n\n+/)
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');

    return html;
}

// ========================================
// Helper functions for Agentic Chatbot
// ========================================
function clearTypingIndicator(container) {
    const indicator = container.querySelector('.typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function formatToolName(name) {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getToolIcon(name) {
    switch (name) {
        case 'get_current_time':
            return `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
            `;
        case 'web_search':
            return `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
            `;
        case 'fetch_webpage':
            return `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
            `;
        case 'python_interpreter':
            return `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                </svg>
            `;
        case 'write_note':
        case 'read_note':
        case 'list_notes':
            return `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
            `;
        default:
            return `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                </svg>
            `;
    }
}

// ========================================
// Send Message (Agentic with JSON-lines)
// ========================================
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text || isStreaming) return;

    // Hide welcome
    welcome.classList.add('hidden');

    // Add user message
    const { msg: userMsg } = createMessageEl('user', text);
    messagesDiv.appendChild(userMsg);

    // Track in history
    conversationHistory.push({ role: 'user', content: text });

    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;
    isStreaming = true;

    scrollToBottom();

    // Create assistant message placeholder
    const { msg: assistantMsg, contentDiv } = createMessageEl('assistant');
    contentDiv.innerHTML = `
        <div class="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    messagesDiv.appendChild(assistantMsg);
    assistantMsg.classList.add('streaming');
    scrollToBottom();

    let currentTextDiv = null;
    let currentTextRaw = '';
    let activeMessages = [];
    let buffer = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversationHistory }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep the last incomplete line in buffer

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const event = JSON.parse(line);
                    
                    if (event.type === 'text') {
                        clearTypingIndicator(contentDiv);
                        
                        // Text logic
                        if (!currentTextDiv) {
                            currentTextDiv = document.createElement('div');
                            currentTextDiv.className = 'message-text';
                            contentDiv.appendChild(currentTextDiv);
                        }
                        currentTextRaw += event.content;
                        currentTextDiv.innerHTML = formatContent(currentTextRaw);
                        
                        // Track history
                        if (activeMessages.length === 0 || activeMessages[activeMessages.length - 1].role !== 'assistant') {
                            activeMessages.push({ role: 'assistant', content: event.content });
                        } else {
                            activeMessages[activeMessages.length - 1].content += event.content;
                        }
                    } 
                    else if (event.type === 'tool_start') {
                        clearTypingIndicator(contentDiv);
                        
                        // Reset text rendering container so next text block starts anew
                        currentTextDiv = null;
                        currentTextRaw = '';
                        
                        const toolBlock = document.createElement('div');
                        toolBlock.className = 'tool-block';
                        toolBlock.id = `tool-${event.id}`;
                        
                        const iconSvg = getToolIcon(event.name);
                        const prettyName = formatToolName(event.name);
                        const argsStr = JSON.stringify(event.arguments, null, 2);
                        
                        toolBlock.innerHTML = `
                            <div class="tool-header">
                                <div class="tool-header-left">
                                    <span class="tool-icon">${iconSvg}</span>
                                    <span class="tool-name">${prettyName}</span>
                                </div>
                                <div class="tool-header-right" style="display: flex; align-items: center; gap: 8px;">
                                    <span class="tool-status-icon running"></span>
                                    <span class="tool-toggle-icon">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="6 9 12 15 18 9"/>
                                        </svg>
                                    </span>
                                </div>
                            </div>
                            <div class="tool-body">
                                <div class="tool-arg-label">Arguments</div>
                                <pre class="tool-arg-value">${argsStr}</pre>
                                <div class="tool-output-label" style="display: none;">Output</div>
                                <pre class="tool-output-value" style="display: none;"></pre>
                            </div>
                        `;
                        
                        // Add toggle click listener
                        const toolHeader = toolBlock.querySelector('.tool-header');
                        toolHeader.addEventListener('click', () => {
                            toolBlock.classList.toggle('collapsed');
                        });
                        
                        contentDiv.appendChild(toolBlock);
                        
                        // Track history (Assistant's tool_calls)
                        let lastMsg = activeMessages[activeMessages.length - 1];
                        if (!lastMsg || lastMsg.role !== 'assistant') {
                            lastMsg = { role: 'assistant', content: null, tool_calls: [] };
                            activeMessages.push(lastMsg);
                        }
                        if (!lastMsg.tool_calls) {
                            lastMsg.tool_calls = [];
                        }
                        lastMsg.tool_calls.push({
                            id: event.id,
                            type: 'function',
                            function: {
                                name: event.name,
                                arguments: JSON.stringify(event.arguments)
                            }
                        });
                    } 
                    else if (event.type === 'tool_end') {
                        // Tool end logic
                        const toolBlock = contentDiv.querySelector(`#tool-${event.id}`);
                        if (toolBlock) {
                            const statusIcon = toolBlock.querySelector('.tool-status-icon');
                            if (statusIcon) {
                                statusIcon.className = 'tool-status-icon success';
                                statusIcon.innerHTML = `
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                `;
                            }
                            
                            const outputLabel = toolBlock.querySelector('.tool-output-label');
                            const outputValue = toolBlock.querySelector('.tool-output-value');
                            if (outputLabel && outputValue) {
                                outputLabel.style.display = 'block';
                                outputValue.style.display = 'block';
                                outputValue.textContent = event.output;
                            }
                            
                            // Auto-collapse
                            toolBlock.classList.add('collapsed');
                        }
                        
                        // Track history (Tool message)
                        activeMessages.push({
                            role: 'tool',
                            tool_call_id: event.id,
                            name: event.name,
                            content: event.output
                        });
                    }
                    scrollToBottom();
                } catch (e) {
                    console.error("Failed to parse JSON event", line, e);
                }
            }
        }
    } catch (err) {
        clearTypingIndicator(contentDiv);
        const errorText = `⚠️ Error: ${err.message}. Please check the server and try again.`;
        const errDiv = document.createElement('div');
        errDiv.className = 'message-error';
        errDiv.style.color = '#f87171';
        errDiv.innerHTML = `<p>${errorText}</p>`;
        contentDiv.appendChild(errDiv);
        
        activeMessages.push({ role: 'assistant', content: errorText });
    }

    // Finalize
    clearTypingIndicator(contentDiv);
    assistantMsg.classList.remove('streaming');
    
    // Add all streamed/generated active messages to conversation history
    for (const msg of activeMessages) {
        conversationHistory.push(msg);
    }
    
    isStreaming = false;
    sendBtn.disabled = !userInput.value.trim();
    scrollToBottom();
});


