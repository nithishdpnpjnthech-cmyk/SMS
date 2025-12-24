-- Setup Indian Academy Branches in Bengaluru
USE sms;

-- Clear existing branches and create Indian branches
DELETE FROM branches;

-- Insert Bengaluru branches
INSERT INTO branches (id, name, address, phone, created_at) VALUES
(UUID(), 'Rammurthy Nagar Branch', 'Rammurthy Nagar, Bengaluru, Karnataka 560016', '+91-80-2345-6789', NOW()),
(UUID(), 'Kasturi Nagar Branch', 'Kasturi Nagar, Bengaluru, Karnataka 560043', '+91-80-3456-7890', NOW()),
(UUID(), 'Kalyan Nagar Branch', 'Kalyan Nagar, Bengaluru, Karnataka 560043', '+91-80-4567-8901', NOW());

-- Create manager users for each branch
INSERT INTO users (id, username, password, role, name, email, branch_id, created_at) 
SELECT 
    UUID(),
    CONCAT('manager_', LOWER(REPLACE(SUBSTRING_INDEX(name, ' ', 1), ' ', ''))),
    'manager123',
    'manager',
    CONCAT('Manager - ', name),
    CONCAT('manager.', LOWER(REPLACE(SUBSTRING_INDEX(name, ' ', 1), ' ', '')), '@academy.com'),
    id,
    NOW()
FROM branches;

-- Update existing admin user
UPDATE users SET 
    name = 'System Administrator',
    email = 'admin@academy.com'
WHERE username = 'admin';

SELECT 'Indian branches and managers created successfully' as status;