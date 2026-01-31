-- Setup test users for all roles
-- This ensures login works for all dashboard types

-- Get the first branch ID for assignment
SET @branch_id = (SELECT id FROM branches LIMIT 1);

-- Insert test users
INSERT IGNORE INTO users (id, username, password, role, email, name, branch_id, created_at) VALUES
(UUID(), 'admin', 'admin123', 'admin', 'admin@academy.com', 'System Administrator', NULL, NOW()),
(UUID(), 'manager', 'manager123', 'manager', 'manager@academy.com', 'Branch Manager', @branch_id, NOW()),
(UUID(), 'receptionist', 'reception123', 'receptionist', 'reception@academy.com', 'Front Desk', @branch_id, NOW()),
(UUID(), 'trainer', 'trainer123', 'trainer', 'trainer@academy.com', 'Lead Trainer', @branch_id, NOW());

-- Create a test student for attendance and fees testing
INSERT IGNORE INTO students (
  id, name, email, phone, parent_phone, guardian_name, address, 
  branch_id, program, batch, status, created_at
) VALUES (
  UUID(), 'Test Student', 'student@test.com', '9876543210', '9876543211', 
  'Test Guardian', '123 Test Street', @branch_id, 'Karate', 'Morning Batch (6:00 AM - 8:00 AM)', 
  'active', NOW()
);

SELECT 'Test users and student created successfully' as status;
SELECT username, role, name FROM users WHERE username IN ('admin', 'manager', 'receptionist', 'trainer');