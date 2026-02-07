-- BSU Chat Platform Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    faculty VARCHAR(255) NOT NULL,
    degree VARCHAR(50) NOT NULL, -- bakalavr, magistr, doktorantura
    course INTEGER NOT NULL CHECK (course >= 1 AND course <= 6),
    avatar_id INTEGER DEFAULT 1 CHECK (avatar_id >= 1 AND avatar_id <= 27),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table (stored in memory for auto-delete, this is for backup only)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER, -- NULL for group messages
    room VARCHAR(255), -- faculty name for group, NULL for private
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blocker_id, blocked_id)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reported_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert super admin
INSERT INTO admin_users (username, password_hash, is_super_admin) 
VALUES ('618ursamajor618', '$2b$10$PqzxDwrW3L.hQNuxuxoo8u1WgEKYtr8amrtlshhY/G4QNMW7Tsv/G', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
    ('rules', 'Qaydalar buraya əlavə ediləcək'),
    ('about', 'Haqqında məlumat buraya əlavə ediləcək'),
    ('daily_topic', 'Günün mövzusu'),
    ('filter_words', ''),
    ('group_message_delete_time', '60'), -- minutes
    ('group_message_delete_unit', 'minutes'), -- minutes or hours
    ('private_message_delete_time', '60'),
    ('private_message_delete_unit', 'minutes')
ON CONFLICT (key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room);
CREATE INDEX IF NOT EXISTS idx_blocked_users ON blocked_users(blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports ON reports(reported_id);
