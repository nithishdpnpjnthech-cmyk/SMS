-- Create default users for all roles
USE sms;

-- Insert users with different roles
INSERT INTO users (id, username, password, role, name, email, created_at) VALUES
(UUID(), 'admin', 'admin123', 'admin', 'System Administrator', 'admin@academy.com', NOW()),
(UUID(), 'manager', 'manager123', 'manager', 'Branch Manager', 'manager@academy.com', NOW()),
(UUID(), 'receptionist', 'reception123', 'receptionist', 'Front Desk', 'reception@academy.com', NOW()),
(UUID(), 'trainer', 'trainer123', 'trainer', 'Martial Arts Trainer', 'trainer@academy.com', NOW());

-- Insert default branch
INSERT INTO branches (id, name, address, phone, created_at) VALUES
(UUID(), 'Main Branch', '123 Academy Street, City', '+1234567890', NOW());

-- Show created users
SELECT username, role, name FROM users;