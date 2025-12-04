// DOM Elements
const sessionSelect = document.getElementById('session-select');
const sessionList = document.getElementById('session-list');
const chatMessages = document.getElementById('chat-messages');
const emptyState = document.getElementById('empty-state');
const currentSessionTitle = document.getElementById('current-session-title');
const messageCount = document.getElementById('message-count');
const totalSessions = document.getElementById('total-sessions');
const totalMessages = document.getElementById('total-messages');

// State
let sessions = [];
let currentSessionId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    fetchSessions();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    sessionSelect.addEventListener('change', (e) => {
        const sessionId = e.target.value;
        if (sessionId) {
            loadSession(sessionId);
        } else {
            showEmptyState();
        }
    });
}

// Fetch all sessions
async function fetchSessions() {
    try {
        showLoading();
        const response = await fetch('/api/sessions');
        sessions = await response.json();

        updateSessionDropdown();
        updateSessionList();
        updateStats();

        // Auto-load first session if available
        if (sessions.length > 0) {
            loadSession(sessions[0].session_id);
            sessionSelect.value = sessions[0].session_id;
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error fetching sessions:', error);
        showError('Error al cargar las sesiones');
    }
}

// Update session dropdown options
function updateSessionDropdown() {
    sessionSelect.innerHTML = '<option value="">Todas las sesiones</option>';

    sessions.forEach(session => {
        const option = document.createElement('option');
        option.value = session.session_id;
        option.textContent = `Sesión ${session.session_id}`;
        sessionSelect.appendChild(option);
    });
}

// Update session list in sidebar
function updateSessionList() {
    const header = sessionList.querySelector('.session-list-header');
    sessionList.innerHTML = '';
    sessionList.appendChild(header);

    sessions.forEach(session => {
        const item = document.createElement('div');
        item.className = 'session-item';
        item.dataset.sessionId = session.session_id;
        item.innerHTML = `
            <div class="session-id">📱 ${session.session_id}</div>
            <div class="session-meta">${session.message_count} mensajes</div>
        `;

        item.addEventListener('click', () => {
            loadSession(session.session_id);
            sessionSelect.value = session.session_id;
        });

        sessionList.appendChild(item);
    });
}

// Update stats
function updateStats() {
    totalSessions.textContent = sessions.length;

    const msgCount = sessions.reduce((acc, s) => acc + parseInt(s.message_count), 0);
    totalMessages.textContent = msgCount;
}

// Load session messages
async function loadSession(sessionId) {
    try {
        currentSessionId = sessionId;
        showLoading();

        // Update active state in sidebar
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.toggle('active', item.dataset.sessionId === sessionId);
        });

        const response = await fetch(`/api/messages/${sessionId}`);
        const messages = await response.json();

        renderMessages(messages);
        updateHeader(sessionId, messages.length);
    } catch (error) {
        console.error('Error loading session:', error);
        showError('Error al cargar los mensajes');
    }
}

// Render messages
function renderMessages(messages) {
    chatMessages.innerHTML = '';

    if (messages.length === 0) {
        showEmptyState();
        return;
    }

    messages.forEach((msg, index) => {
        const messageData = msg.message;
        const type = messageData.type; // 'human' or 'ai'
        const content = messageData.content;

        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.style.animationDelay = `${index * 0.05}s`;

        const avatar = type === 'human' ? '👤' : '🤖';
        const label = type === 'human' ? 'Usuario' : 'Asistente IA';

        messageEl.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-label">${label}</div>
                <div class="message-text">${formatContent(content)}</div>
            </div>
        `;

        chatMessages.appendChild(messageEl);
    });

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format content (basic markdown-like formatting)
function formatContent(content) {
    if (!content) return '';

    // Escape HTML
    content = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Bold text with **
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Emoji handling (already works)

    return content;
}

// Update header
function updateHeader(sessionId, count) {
    currentSessionTitle.textContent = `Sesión ${sessionId}`;
    messageCount.textContent = `${count} mensajes en la conversación`;
}

// Show empty state
function showEmptyState() {
    chatMessages.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🗂️</div>
            <h3>Selecciona una sesión</h3>
            <p>Elige una sesión del panel izquierdo para ver la conversación</p>
        </div>
    `;
    currentSessionTitle.textContent = 'Selecciona una sesión';
    messageCount.textContent = '';
}

// Show loading state
function showLoading() {
    chatMessages.innerHTML = `
        <div class="loading">
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
            <span>Cargando mensajes...</span>
        </div>
    `;
}

// Show error
function showError(message) {
    chatMessages.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}
