USE sms;

-- Insert test users with exact credentials
INSERT IGNORE INTO users (id, username, password, role, name, email, created_at) VALUES
(UUID(), 'admin', 'admin', 'admin', 'System Administrator', 'admin@academy.com', NOW()),
(UUID(), 'manager', 'manager', 'manager', 'Branch Manager', 'manager@academy.com', NOW()),
(UUID(), 'receptionist', 'receptionist', 'receptionist', 'Front Desk Staff', 'receptionist@academy.com', NOW()),
(UUID(), 'trainer', 'trainer', 'trainer', 'Martial Arts Trainer', 'trainer@academy.com', NOW());

SELECT username, role, name FROM users;