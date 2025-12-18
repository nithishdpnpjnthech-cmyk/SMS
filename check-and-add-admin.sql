USE sms;

-- Check if admin user exists
SELECT username, role FROM users WHERE username = 'admin';

-- Add admin user if it doesn't exist
INSERT IGNORE INTO users (id, username, password, role, name, email, created_at) VALUES
(UUID(), 'admin', 'admin123', 'admin', 'System Administrator', 'admin@academy.com', NOW());

-- Show all users
SELECT username, password, role, name FROM users;