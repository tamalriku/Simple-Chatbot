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
// Send Message
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

    // Stream the response
    let fullResponse = '';

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

            const chunk = decoder.decode(value, { stream: true });
            fullResponse += chunk;
            contentDiv.innerHTML = formatContent(fullResponse);
            scrollToBottom();
        }
    } catch (err) {
        fullResponse = `⚠️ Error: ${err.message}. Please check the server and try again.`;
        contentDiv.innerHTML = `<p style="color: #f87171;">${fullResponse}</p>`;
    }

    // Finalize
    assistantMsg.classList.remove('streaming');
    conversationHistory.push({ role: 'assistant', content: fullResponse });
    isStreaming = false;
    sendBtn.disabled = !userInput.value.trim();
    scrollToBottom();
});
