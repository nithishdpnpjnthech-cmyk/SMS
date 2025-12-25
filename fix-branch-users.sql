-- Check and fix branch assignments for managers and receptionists
USE sms;

-- Show current users and their branch assignments
SELECT 
    u.id,
    u.username, 
    u.name, 
    u.role, 
    u.branch_id,
    b.name as branch_name 
FROM users u 
LEFT JOIN branches b ON u.branch_id = b.id 
WHERE u.role IN ('manager', 'receptionist', 'admin')
ORDER BY u.role, u.username;

-- Show available branches
SELECT id, name, address FROM branches ORDER BY name;

-- If managers don't have branch_id, assign them to branches
-- Get branch IDs
SET @rammurthy_id = (SELECT id FROM branches WHERE name LIKE '%Rammurthy%' LIMIT 1);
SET @kasturi_id = (SELECT id FROM branches WHERE name LIKE '%Kasturi%' LIMIT 1);
SET @kalyan_id = (SELECT id FROM branches WHERE name LIKE '%Kalyan%' LIMIT 1);

-- Update existing managers if they don't have branch assignments
UPDATE users SET branch_id = @rammurthy_id WHERE username LIKE '%rammurthy%' AND role = 'manager' AND branch_id IS NULL;
UPDATE users SET branch_id = @kasturi_id WHERE username LIKE '%kasturi%' AND role = 'manager' AND branch_id IS NULL;
UPDATE users SET branch_id = @kalyan_id WHERE username LIKE '%kalyan%' AND role = 'manager' AND branch_id IS NULL;

-- Create managers if they don't exist
INSERT IGNORE INTO users (id, username, password, role, name, email, branch_id) VALUES
(UUID(), 'manager_rammurthy', 'manager123', 'manager', 'Rammurthy Branch Manager', 'manager.rammurthy@academy.com', @rammurthy_id),
(UUID(), 'manager_kasturi', 'manager123', 'manager', 'Kasturi Branch Manager', 'manager.kasturi@academy.com', @kasturi_id),
(UUID(), 'manager_kalyan', 'manager123', 'manager', 'Kalyan Branch Manager', 'manager.kalyan@academy.com', @kalyan_id);

-- Create receptionists if they don't exist
INSERT IGNORE INTO users (id, username, password, role, name, email, branch_id) VALUES
(UUID(), 'reception_rammurthy', 'reception123', 'receptionist', 'Rammurthy Reception', 'reception.rammurthy@academy.com', @rammurthy_id),
(UUID(), 'reception_kasturi', 'reception123', 'receptionist', 'Kasturi Reception', 'reception.kasturi@academy.com', @kasturi_id),
(UUID(), 'reception_kalyan', 'reception123', 'receptionist', 'Kalyan Reception', 'reception.kalyan@academy.com', @kalyan_id);

-- Show final result
SELECT 
    u.username, 
    u.name, 
    u.role, 
    u.branch_id,
    b.name as branch_name 
FROM users u 
LEFT JOIN branches b ON u.branch_id = b.id 
WHERE u.role IN ('manager', 'receptionist', 'admin')
ORDER BY u.role, u.username;