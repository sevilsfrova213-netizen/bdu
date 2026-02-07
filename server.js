require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Database connection
let dbConnected = false;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('⚠️ Database connection error:', err.message);
        console.log('⚙️ Running in memory-only mode (no database persistence)');
        dbConnected = false;
    } else {
        console.log('✅ Database connected successfully');
        dbConnected = true;
        release();
    }
});

// In-memory storage for messages (auto-delete feature)
const groupMessages = {}; // { facultyName: [{id, sender_id, message_text, timestamp}] }
const privateMessages = {}; // { 'userId1-userId2': [{id, sender_id, receiver_id, message_text, timestamp}] }
const onlineUsers = new Map(); // socketId -> userId
const userSockets = new Map(); // userId -> Set of socketIds

// Faculty list
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

// Initialize group messages storage
FACULTIES.forEach(faculty => {
    groupMessages[faculty] = [];
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'bsu-chat-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Verification questions
const VERIFICATION_QUESTIONS = [
    { question: 'Mexanika-riyaziyyat fakültəsi hansı korpusda yerləşir?', answer: '3', options: ['1', '2', '3', 'əsas'] },
    { question: 'Tətbiqi riyaziyyat və kibernetika fakültəsi hansı korpusda yerləşir?', answer: '3', options: ['1', '2', '3', 'əsas'] },
    { question: 'Fizika fakültəsi hansı korpusda yerləşir?', answer: 'əsas', options: ['1', '2', '3', 'əsas'] },
    { question: 'Kimya fakültəsi hansı korpusda yerləşir?', answer: 'əsas', options: ['1', '2', '3', 'əsas'] },
    { question: 'Biologiya fakültəsi hansı korpusda yerləşir?', answer: 'əsas', options: ['1', '2', '3', 'əsas'] },
    { question: 'Ekologiya və torpaqşünaslıq fakültəsi hansı korpusda yerləşir?', answer: 'əsas', options: ['1', '2', '3', 'əsas'] },
    { question: 'Coğrafiya fakültəsi hansı korpusda yerləşir?', answer: 'əsas', options: ['1', '2', '3', 'əsas'] },
    { question: 'Geologiya fakültəsi hansı korpusda yerləşir?', answer: 'əsas', options: ['1', '2', '3', 'əsas'] },
    { question: 'Filologiya fakültəsi hansı korpusda yerləşir?', answer: '1', options: ['1', '2', '3', 'əsas'] },
    { question: 'Tarix fakültəsi hansı korpusda yerləşir?', answer: '3', options: ['1', '2', '3', 'əsas'] },
    { question: 'Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi hansı korpusda yerləşir?', answer: '1', options: ['1', '2', '3', 'əsas'] },
    { question: 'Hüquq fakültəsi hansı korpusda yerləşir?', answer: '1', options: ['1', '2', '3', 'əsas'] },
    { question: 'Jurnalistika fakültəsi hansı korpusda yerləşir?', answer: '2', options: ['1', '2', '3', 'əsas'] },
    { question: 'İnformasiya və sənəd menecmenti fakültəsi hansı korpusda yerləşir?', answer: '2', options: ['1', '2', '3', 'əsas'] },
    { question: 'Şərqşünaslıq fakültəsi hansı korpusda yerləşir?', answer: '2', options: ['1', '2', '3', 'əsas'] },
    { question: 'Sosial elmlər və psixologiya fakültəsi hansı korpusda yerləşir?', answer: '2', options: ['1', '2', '3', 'əsas'] }
];

// Helper function: Get random verification questions
function getRandomQuestions() {
    const shuffled = [...VERIFICATION_QUESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}

// Helper function: Filter bad words
async function filterMessage(text) {
    const result = await pool.query("SELECT value FROM settings WHERE key = 'filter_words'");
    const filterWords = result.rows[0]?.value || '';
    const words = filterWords.split(',').map(w => w.trim()).filter(w => w);
    
    let filteredText = text;
    words.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    
    return filteredText;
}

// Helper function: Get Baku time
function getBakuTime() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Baku' }));
}

// Helper function: Safe database query
async function safeQuery(queryText, params = []) {
    if (!dbConnected) {
        throw new Error('Database not connected');
    }
    return await pool.query(queryText, params);
}

// API: Get verification questions
app.get('/api/verification-questions', (req, res) => {
    const questions = getRandomQuestions();
    res.json(questions);
});

// API: Register
app.post('/api/register', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ error: 'Database xidməti hazırda əlçatan deyil' });
        }
        
        const { email, phone, password, full_name, faculty, degree, course, avatar_id, verification } = req.body;
        
        // Validate email format
        if (!email.endsWith('@bsu.edu.az')) {
            return res.status(400).json({ error: 'Email @bsu.edu.az ilə bitməlidir' });
        }
        
        // Validate phone format
        if (!phone.startsWith('+994') || phone.length !== 13) {
            return res.status(400).json({ error: 'Nömrə +994XXXXXXXXX formatında olmalıdır' });
        }
        
        // Check verification answers
        let correctCount = 0;
        verification.forEach(item => {
            const question = VERIFICATION_QUESTIONS.find(q => q.question === item.question);
            if (question && question.answer === item.answer) {
                correctCount++;
            }
        });
        
        if (correctCount < 2) {
            return res.status(400).json({ error: 'Doğrulama uğursuz oldu. Minimum 2 sual düzgün cavablandırılmalıdır' });
        }
        
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR phone = $2',
            [email, phone]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Bu email və ya nömrə artıq qeydiyyatdan keçib' });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Insert user
        const result = await pool.query(
            `INSERT INTO users (email, phone, password_hash, full_name, faculty, degree, course, avatar_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [email, phone, passwordHash, full_name, faculty, degree, course, avatar_id || 1]
        );
        
        res.json({ success: true, userId: result.rows[0].id });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Qeydiyyat zamanı xəta baş verdi' });
    }
});

// API: Login
app.post('/api/login', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ error: 'Database xidməti hazırda əlçatan deyil' });
        }
        
        const { email, password } = req.body;
        
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
        }
        
        const user = result.rows[0];
        
        if (!user.is_active) {
            return res.status(403).json({ error: 'Hesabınız deaktiv edilib' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
        }
        
        req.session.userId = user.id;
        
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                faculty: user.faculty,
                degree: user.degree,
                course: user.course,
                avatar_id: user.avatar_id
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Giriş zamanı xəta baş verdi' });
    }
});

// API: Admin login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check super admin credentials first
        if (username === '618ursamajor618' && password === 'majorursa618') {
            req.session.adminId = 'super';
            req.session.isSuperAdmin = true;
            return res.json({ success: true, isSuperAdmin: true });
        }
        
        // Check database for sub-admins
        const result = await pool.query(
            'SELECT * FROM admin_users WHERE username = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
        }
        
        const admin = result.rows[0];
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
        }
        
        req.session.adminId = admin.id;
        req.session.isSuperAdmin = admin.is_super_admin;
        
        res.json({ success: true, isSuperAdmin: admin.is_super_admin });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Giriş zamanı xəta baş verdi' });
    }
});

// API: Get settings
app.get('/api/settings/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const result = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
        res.json({ value: result.rows[0]?.value || '' });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Xəta baş verdi' });
    }
});

// API: Update settings (admin only)
app.post('/api/admin/settings', async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(403).json({ error: 'İcazə yoxdur' });
        }
        
        const { key, value } = req.body;
        
        await pool.query(
            `INSERT INTO settings (key, value) VALUES ($1, $2) 
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
            [key, value]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Xəta baş verdi' });
    }
});

// API: Get all users (admin only)
app.get('/api/admin/users', async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(403).json({ error: 'İcazə yoxdur' });
        }
        
        const result = await pool.query(`
            SELECT id, email, phone, full_name, faculty, degree, course, avatar_id, is_active, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        
        res.json({ users: result.rows });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Xəta baş verdi' });
    }
});

// API: Toggle user active status (admin only)
app.post('/api/admin/users/:id/toggle', async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(403).json({ error: 'İcazə yoxdur' });
        }
        
        const { id } = req.params;
        
        await pool.query(
            'UPDATE users SET is_active = NOT is_active WHERE id = $1',
            [id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Toggle user error:', error);
        res.status(500).json({ error: 'Xəta baş verdi' });
    }
});

// API: Get reported users (admin only)
app.get('/api/admin/reported-users', async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(403).json({ error: 'İcazə yoxdur' });
        }
        
        const result = await pool.query(`
            SELECT u.id, u.email, u.phone, u.full_name, u.faculty, u.degree, u.course, 
                   u.avatar_id, u.is_active, COUNT(r.id) as report_count
            FROM users u
            INNER JOIN reports r ON u.id = r.reported_id
            GROUP BY u.id
            HAVING COUNT(r.id) >= 8
            ORDER BY report_count DESC
        `);
        
        res.json({ users: result.rows });
    } catch (error) {
        console.error('Get reported users error:', error);
        res.status(500).json({ error: 'Xəta baş verdi' });
    }
});

// API: Create sub-admin (super admin only)
app.post('/api/admin/sub-admins', async (req, res) => {
    try {
        if (!req.session.isSuperAdmin) {
            return res.status(403).json({ error: 'Yalnız super admin bu əməliyyatı edə bilər' });
        }
        
        const { username, password } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        
        await pool.query(
            'INSERT INTO admin_users (username, password_hash, is_super_admin) VALUES ($1, $2, FALSE)',
            [username, passwordHash]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Create sub-admin error:', error);
        res.status(500).json({ error: 'Xəta baş verdi' });
    }
});

// API: Delete sub-admin (super admin only)
app.delete('/api/admin/sub-admins/:id', async (req, res) => {
    try {
        if (!req.session.isSuperAdmin) {
            return res.status(403).json({ error: 'Yalnız super admin bu əməliyyatı edə bilər' });
        }
        
        const { id } = req.params;
        
        await pool.query(
            'DELETE FROM admin_users WHERE id = $1 AND is_super_admin = FALSE',
            [id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Delete sub-admin error:', error);
        res.status(500).json({ error: 'Xəta baş verdi' });
    }
});

// API: Get sub-admins (super admin only)
app.get('/api/admin/sub-admins', async (req, res) => {
    try {
        if (!req.session.isSuperAdmin) {
            return res.status(403).json({ error: 'Yalnız super admin bu əməliyyatı edə bilər' });
        }
        
        const result = await pool.query(
            'SELECT id, username, created_at FROM admin_users WHERE is_super_admin = FALSE'
        );
        
        res.json({ admins: result.rows });
    } catch (error) {
        console.error('Get sub-admins error:', error);
        res.status(500).json({ error: 'Xəta baş verdi' });
    }
});

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('authenticate', async (userId) => {
        try {
            const result = await pool.query('SELECT * FROM users WHERE id = $1 AND is_active = TRUE', [userId]);
            
            if (result.rows.length > 0) {
                onlineUsers.set(socket.id, userId);
                
                if (!userSockets.has(userId)) {
                    userSockets.set(userId, new Set());
                }
                userSockets.get(userId).add(socket.id);
                
                socket.userId = userId;
                socket.emit('authenticated', { success: true });
            } else {
                socket.emit('authenticated', { success: false, error: 'İstifadəçi tapılmadı' });
            }
        } catch (error) {
            console.error('Authentication error:', error);
            socket.emit('authenticated', { success: false, error: 'Xəta baş verdi' });
        }
    });
    
    socket.on('join_faculty', async (faculty) => {
        if (!socket.userId) return;
        
        socket.join(faculty);
        socket.currentFaculty = faculty;
        
        // Send existing messages
        socket.emit('load_messages', groupMessages[faculty] || []);
    });
    
    socket.on('leave_faculty', () => {
        if (socket.currentFaculty) {
            socket.leave(socket.currentFaculty);
            socket.currentFaculty = null;
        }
    });
    
    socket.on('send_group_message', async (data) => {
        try {
            if (!socket.userId) return;
            
            const { faculty, message } = data;
            
            // Check if user is blocked
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [socket.userId]);
            const sender = result.rows[0];
            
            // Filter message
            const filteredMessage = await filterMessage(message);
            
            const messageObj = {
                id: Date.now(),
                sender_id: socket.userId,
                sender: {
                    id: sender.id,
                    full_name: sender.full_name,
                    faculty: sender.faculty,
                    degree: sender.degree,
                    course: sender.course,
                    avatar_id: sender.avatar_id
                },
                message_text: filteredMessage,
                timestamp: getBakuTime().toISOString()
            };
            
            // Store in memory
            if (!groupMessages[faculty]) {
                groupMessages[faculty] = [];
            }
            groupMessages[faculty].push(messageObj);
            
            // Get blocked users for this sender
            const blockedResult = await pool.query(
                'SELECT blocked_id FROM blocked_users WHERE blocker_id = $1',
                [socket.userId]
            );
            const blockedByMe = blockedResult.rows.map(r => r.blocked_id);
            
            const blockersResult = await pool.query(
                'SELECT blocker_id FROM blocked_users WHERE blocked_id = $1',
                [socket.userId]
            );
            const blockingMe = blockersResult.rows.map(r => r.blocker_id);
            
            // Send to all users in faculty except blocked ones
            const sockets = await io.in(faculty).fetchSockets();
            sockets.forEach(s => {
                const receiverId = onlineUsers.get(s.id);
                if (receiverId && !blockedByMe.includes(receiverId) && !blockingMe.includes(receiverId)) {
                    s.emit('new_group_message', messageObj);
                }
            });
            
        } catch (error) {
            console.error('Send group message error:', error);
        }
    });
    
    socket.on('send_private_message', async (data) => {
        try {
            if (!socket.userId) return;
            
            const { receiverId, message } = data;
            
            // Check if blocked
            const blockedCheck = await pool.query(
                'SELECT * FROM blocked_users WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
                [socket.userId, receiverId]
            );
            
            if (blockedCheck.rows.length > 0) {
                return socket.emit('error', { message: 'Mesaj göndərilə bilmədi' });
            }
            
            // Get sender info
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [socket.userId]);
            const sender = result.rows[0];
            
            // Filter message
            const filteredMessage = await filterMessage(message);
            
            const messageObj = {
                id: Date.now(),
                sender_id: socket.userId,
                receiver_id: receiverId,
                sender: {
                    id: sender.id,
                    full_name: sender.full_name,
                    faculty: sender.faculty,
                    degree: sender.degree,
                    course: sender.course,
                    avatar_id: sender.avatar_id
                },
                message_text: filteredMessage,
                timestamp: getBakuTime().toISOString()
            };
            
            // Store in memory
            const chatKey = [socket.userId, receiverId].sort().join('-');
            if (!privateMessages[chatKey]) {
                privateMessages[chatKey] = [];
            }
            privateMessages[chatKey].push(messageObj);
            
            // Send to receiver
            const receiverSockets = userSockets.get(receiverId);
            if (receiverSockets) {
                receiverSockets.forEach(socketId => {
                    io.to(socketId).emit('new_private_message', messageObj);
                });
            }
            
            // Send back to sender
            socket.emit('new_private_message', messageObj);
            
        } catch (error) {
            console.error('Send private message error:', error);
        }
    });
    
    socket.on('load_private_messages', async (otherUserId) => {
        try {
            if (!socket.userId) return;
            
            const chatKey = [socket.userId, otherUserId].sort().join('-');
            socket.emit('load_private_messages', privateMessages[chatKey] || []);
        } catch (error) {
            console.error('Load private messages error:', error);
        }
    });
    
    socket.on('block_user', async (blockedUserId) => {
        try {
            if (!socket.userId) return;
            
            await pool.query(
                'INSERT INTO blocked_users (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [socket.userId, blockedUserId]
            );
            
            socket.emit('user_blocked', { success: true });
        } catch (error) {
            console.error('Block user error:', error);
        }
    });
    
    socket.on('report_user', async (reportedUserId) => {
        try {
            if (!socket.userId) return;
            
            await pool.query(
                'INSERT INTO reports (reporter_id, reported_id) VALUES ($1, $2)',
                [socket.userId, reportedUserId]
            );
            
            socket.emit('user_reported', { success: true });
        } catch (error) {
            console.error('Report user error:', error);
        }
    });
    
    socket.on('disconnect', () => {
        const userId = onlineUsers.get(socket.id);
        if (userId) {
            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(userId);
                }
            }
            onlineUsers.delete(socket.id);
        }
        console.log('User disconnected:', socket.id);
    });
});

// Auto-delete messages based on admin settings
setInterval(async () => {
    // Skip if database not connected
    if (!dbConnected) return;
    
    try {
        const groupSettings = await pool.query(
            "SELECT key, value FROM settings WHERE key IN ('group_message_delete_time', 'group_message_delete_unit')"
        );
        
        const privateSettings = await pool.query(
            "SELECT key, value FROM settings WHERE key IN ('private_message_delete_time', 'private_message_delete_unit')"
        );
        
        const groupTime = parseInt(groupSettings.rows.find(r => r.key === 'group_message_delete_time')?.value || 60);
        const groupUnit = groupSettings.rows.find(r => r.key === 'group_message_delete_unit')?.value || 'minutes';
        const privateTime = parseInt(privateSettings.rows.find(r => r.key === 'private_message_delete_time')?.value || 60);
        const privateUnit = privateSettings.rows.find(r => r.key === 'private_message_delete_unit')?.value || 'minutes';
        
        const now = getBakuTime();
        
        // Delete group messages
        const groupDeleteAfter = groupUnit === 'hours' ? groupTime * 60 * 60 * 1000 : groupTime * 60 * 1000;
        Object.keys(groupMessages).forEach(faculty => {
            groupMessages[faculty] = groupMessages[faculty].filter(msg => {
                const msgTime = new Date(msg.timestamp);
                return (now - msgTime) < groupDeleteAfter;
            });
        });
        
        // Delete private messages
        const privateDeleteAfter = privateUnit === 'hours' ? privateTime * 60 * 60 * 1000 : privateTime * 60 * 1000;
        Object.keys(privateMessages).forEach(chatKey => {
            privateMessages[chatKey] = privateMessages[chatKey].filter(msg => {
                const msgTime = new Date(msg.timestamp);
                return (now - msgTime) < privateDeleteAfter;
            });
        });
        
    } catch (error) {
        console.error('Auto-delete error:', error);
    }
}, 60000); // Check every minute

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
