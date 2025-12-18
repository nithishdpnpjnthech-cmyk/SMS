USE sms;

INSERT INTO users (id, username, password, role, name, email, created_at) VALUES
(UUID(), 'manager', 'manager123', 'manager', 'Branch Manager', 'manager@academy.com', NOW()),
(UUID(), 'receptionist', 'reception123', 'receptionist', 'Front Desk', 'reception@academy.com', NOW()),
(UUID(), 'trainer', 'trainer123', 'trainer', 'Martial Arts Trainer', 'trainer@academy.com', NOW());

SELECT username, role, name FROM users;