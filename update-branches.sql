-- Update existing database with Indian branches
USE sms;

-- Clear existing branches and related data
DELETE FROM branches;

-- Insert Indian branches in Bengaluru
INSERT INTO branches (id, name, address, phone, created_at) VALUES
('branch-rammurthy', 'Rammurthy Nagar Branch', 'Rammurthy Nagar, Bengaluru, Karnataka 560016', '+91-80-2345-6789', NOW()),
('branch-kasturi', 'Kasturi Nagar Branch', 'Kasturi Nagar, Bengaluru, Karnataka 560043', '+91-80-3456-7890', NOW()),
('branch-kalyan', 'Kalyan Nagar Branch', 'Kalyan Nagar, Bengaluru, Karnataka 560043', '+91-80-4567-8901', NOW());

-- Update existing admin user
UPDATE users SET 
    name = 'System Administrator',
    email = 'admin@academy.com',
    branch_id = 'branch-rammurthy'
WHERE username = 'admin';

-- Create manager users for each branch
INSERT INTO users (id, username, password, role, name, email, branch_id, created_at) VALUES
('manager-rammurthy', 'manager_rammurthy', 'manager123', 'manager', 'Manager - Rammurthy Nagar', 'manager.rammurthy@academy.com', 'branch-rammurthy', NOW()),
('manager-kasturi', 'manager_kasturi', 'manager123', 'manager', 'Manager - Kasturi Nagar', 'manager.kasturi@academy.com', 'branch-kasturi', NOW()),
('manager-kalyan', 'manager_kalyan', 'manager123', 'manager', 'Manager - Kalyan Nagar', 'manager.kalyan@academy.com', 'branch-kalyan', NOW());

-- Update branches table to link managers
UPDATE branches SET manager_id = 'manager-rammurthy' WHERE id = 'branch-rammurthy';
UPDATE branches SET manager_id = 'manager-kasturi' WHERE id = 'branch-kasturi';  
UPDATE branches SET manager_id = 'branch-kalyan' WHERE id = 'branch-kalyan';

-- Update any existing students to be assigned to branches
UPDATE students SET branch_id = 'branch-rammurthy' WHERE branch_id IS NULL OR branch_id = '';

SELECT 'Indian branches and managers created successfully!' as status;
SELECT * FROM branches;
SELECT username, name, role, branch_id FROM users WHERE role IN ('admin', 'manager');