// Chat application logic
const socket = io();

let currentUser = null;
let currentRoom = null;
let currentPrivateChat = null;
let blockedUsers = new Set();

const FACULTIES = [
    'Mexanika-riyaziyyat fakültəsi',
    'Tətbiqi riyaziyyat və kibernetika fakültəsi',
    'Fizika fakültəsi',
    'Kimya fakültəsi',
    'Biologiya fakültəsi',
    'Ekologiya və torpaqşünaslıq fakültəsi',
    'Coğrafiya fakültəsi',
    'Geologiya fakültəsi',
    'Filologiya fakültəsi',
    'Tarix fakültəsi',
    'Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi',
    'Hüquq fakültəsi',
    'Jurnalistika fakültəsi',
    'İnformasiya və sənəd menecmenti fakültəsi',
    'Şərqşünaslıq fakültəsi',
    'Sosial elmlər və psixologiya fakültəsi'
];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const userId = localStorage.getItem('userId');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!userId) {
        window.location.href = '/';
        return;
    }
    
    currentUser = { id: parseInt(userId), ...userData };
    
    // Authenticate with socket
    socket.emit('authenticate', currentUser.id);
    
    // Setup UI
    setupFaculties();
    setupMessageInput();
    setupModals();
    setupContextMenu();
    loadSettings();
    
    // Socket events
    socket.on('authenticated', (data) => {
        if (!data.success) {
            alert('Giriş uğursuz oldu');
            window.location.href = '/';
        }
    });
    
    socket.on('load_messages', (messages) => {
        displayMessages(messages);
    });
    
    socket.on('new_group_message', (message) => {
        if (currentRoom && !isMessageBlocked(message)) {
            appendMessage(message);
        }
    });
    
    socket.on('load_private_messages', (messages) => {
        displayPrivateMessages(messages);
    });
    
    socket.on('new_private_message', (message) => {
        if (currentPrivateChat && 
            (message.sender_id === currentPrivateChat || message.receiver_id === currentPrivateChat)) {
            appendPrivateMessage(message);
        }
    });
    
    socket.on('user_blocked', () => {
        alert('İstifadəçi əngəlləndi');
    });
    
    socket.on('user_reported', () => {
        alert('Şikayət göndərildi');
    });
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/';
    });
});

function setupFaculties() {
    const facultyButtons = document.getElementById('facultyButtons');
    
    FACULTIES.forEach(faculty => {
        const btn = document.createElement('button');
        btn.className = 'faculty-btn';
        btn.textContent = faculty;
        btn.addEventListener('click', () => joinFaculty(faculty));
        facultyButtons.appendChild(btn);
    });
}

function joinFaculty(faculty) {
    if (currentRoom) {
        socket.emit('leave_faculty');
    }
    
    currentRoom = faculty;
    document.getElementById('currentRoom').textContent = faculty;
    document.getElementById('sendBtn').disabled = false;
    
    // Update active button
    document.querySelectorAll('.faculty-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === faculty) {
            btn.classList.add('active');
        }
    });
    
    socket.emit('join_faculty', faculty);
}

function setupMessageInput() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
    });
    
    // Send on Enter (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    sendBtn.addEventListener('click', sendMessage);
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || !currentRoom) return;
    
    socket.emit('send_group_message', {
        faculty: currentRoom,
        message: message
    });
    
    messageInput.value = '';
    messageInput.style.height = 'auto';
}

function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-messages"><p>Hələ heç bir mesaj yoxdur</p></div>';
        return;
    }
    
    messages.forEach(message => {
        if (!isMessageBlocked(message)) {
            appendMessage(message, false);
        }
    });
    
    scrollToBottom();
}

function appendMessage(message, autoScroll = true) {
    const container = document.getElementById('messagesContainer');
    const isOwn = message.sender_id === currentUser.id;
    
    // Check if should auto-scroll (if user is at bottom)
    const shouldScroll = autoScroll && (container.scrollHeight - container.scrollTop - container.clientHeight < 100);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble ${isOwn ? 'own' : ''}`;
    messageDiv.dataset.senderId = message.sender_id;
    messageDiv.dataset.messageId = message.id;
    
    const time = new Date(message.timestamp).toLocaleTimeString('az-AZ', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <img src="/images/avatar-${message.sender.avatar_id}.svg" alt="Avatar" class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-sender">${message.sender.full_name}</span>
                <span class="message-info">${message.sender.degree} ${message.sender.course}</span>
            </div>
            <div class="message-text-wrapper">
                ${isOwn ? '' : '<div class="message-options">⋮</div>'}
                <div class="message-text">${escapeHtml(message.message_text)}</div>
                <span class="message-time">${time}</span>
            </div>
        </div>
    `;
    
    // Add context menu listener
    if (!isOwn) {
        const options = messageDiv.querySelector('.message-options');
        options.addEventListener('click', (e) => {
            e.stopPropagation();
            showContextMenu(e, message.sender_id);
        });
    }
    
    container.appendChild(messageDiv);
    
    if (shouldScroll) {
        scrollToBottom();
    }
}

function displayPrivateMessages(messages) {
    const container = document.getElementById('privateChatMessages');
    container.innerHTML = '';
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-messages"><p>Hələ heç bir mesaj yoxdur</p></div>';
        return;
    }
    
    messages.forEach(message => {
        appendPrivateMessage(message, false);
    });
    
    scrollToBottomPrivate();
}

function appendPrivateMessage(message, autoScroll = true) {
    const container = document.getElementById('privateChatMessages');
    const isOwn = message.sender_id === currentUser.id;
    
    const shouldScroll = autoScroll && (container.scrollHeight - container.scrollTop - container.clientHeight < 100);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble ${isOwn ? 'own' : ''}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString('az-AZ', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <img src="/images/avatar-${message.sender.avatar_id}.svg" alt="Avatar" class="message-avatar">
        <div class="message-content">
            <div class="message-text-wrapper">
                <div class="message-text">${escapeHtml(message.message_text)}</div>
                <span class="message-time">${time}</span>
            </div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    
    if (shouldScroll) {
        scrollToBottomPrivate();
    }
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

function scrollToBottomPrivate() {
    const container = document.getElementById('privateChatMessages');
    container.scrollTop = container.scrollHeight;
}

function setupModals() {
    const rulesBtn = document.getElementById('rulesBtn');
    const aboutBtn = document.getElementById('aboutBtn');
    const rulesModal = document.getElementById('rulesModal');
    const aboutModal = document.getElementById('aboutModal');
    const privateChatModal = document.getElementById('privateChatModal');
    
    rulesBtn.addEventListener('click', () => {
        rulesModal.classList.add('show');
    });
    
    aboutBtn.addEventListener('click', () => {
        aboutModal.classList.add('show');
    });
    
    // Close modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            rulesModal.classList.remove('show');
            aboutModal.classList.remove('show');
            privateChatModal.classList.remove('show');
        });
    });
    
    // Close on outside click
    [rulesModal, aboutModal, privateChatModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // Private chat send
    document.getElementById('privateSendBtn').addEventListener('click', sendPrivateMessage);
    document.getElementById('privateChatInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPrivateMessage();
        }
    });
}

function sendPrivateMessage() {
    const input = document.getElementById('privateChatInput');
    const message = input.value.trim();
    
    if (!message || !currentPrivateChat) return;
    
    socket.emit('send_private_message', {
        receiverId: currentPrivateChat,
        message: message
    });
    
    input.value = '';
}

function setupContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    
    // Hide context menu on click outside
    document.addEventListener('click', () => {
        contextMenu.classList.remove('show');
    });
    
    // Context menu actions
    contextMenu.querySelectorAll('.context-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            const userId = parseInt(contextMenu.dataset.userId);
            
            switch (action) {
                case 'private':
                    openPrivateChat(userId);
                    break;
                case 'block':
                    blockUser(userId);
                    break;
                case 'report':
                    reportUser(userId);
                    break;
            }
            
            contextMenu.classList.remove('show');
        });
    });
}

function showContextMenu(event, userId) {
    event.preventDefault();
    
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.dataset.userId = userId;
    
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.classList.add('show');
}

function openPrivateChat(userId) {
    currentPrivateChat = userId;
    
    // Get user info
    const userMessage = document.querySelector(`[data-sender-id="${userId}"]`);
    if (userMessage) {
        const userName = userMessage.querySelector('.message-sender').textContent;
        document.getElementById('privateChatUser').textContent = userName;
        
        // Load messages
        socket.emit('load_private_messages', userId);
        
        // Show modal
        document.getElementById('privateChatModal').classList.add('show');
    }
}

function blockUser(userId) {
    if (confirm('Bu istifadəçini əngəlləmək istədiyinizə əminsiniz?')) {
        socket.emit('block_user', userId);
        blockedUsers.add(userId);
        
        // Hide messages from this user
        document.querySelectorAll(`[data-sender-id="${userId}"]`).forEach(msg => {
            msg.style.display = 'none';
        });
    }
}

function reportUser(userId) {
    if (confirm('Bu istifadəçi haqqında şikayət göndərmək istədiyinizə əminsiniz?')) {
        socket.emit('report_user', userId);
    }
}

function isMessageBlocked(message) {
    return blockedUsers.has(message.sender_id);
}

async function loadSettings() {
    try {
        // Load daily topic
        const dailyTopicRes = await fetch('/api/settings/daily_topic');
        const dailyTopicData = await dailyTopicRes.json();
        document.getElementById('dailyTopic').textContent = dailyTopicData.value || '';
        
        // Load rules
        const rulesRes = await fetch('/api/settings/rules');
        const rulesData = await rulesRes.json();
        document.getElementById('rulesContent').textContent = rulesData.value || '';
        
        // Load about
        const aboutRes = await fetch('/api/settings/about');
        const aboutData = await aboutRes.json();
        document.getElementById('aboutContent').textContent = aboutData.value || '';
    } catch (error) {
        console.error('Load settings error:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
