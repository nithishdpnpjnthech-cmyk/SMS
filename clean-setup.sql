-- Clean Academy Management System Setup - NO MOCK DATA
USE sms;

-- Clean up any existing mock data
DELETE FROM trainer_batches;
DELETE FROM attendance;
DELETE FROM fees;
DELETE FROM students WHERE name LIKE '%Kumar%' OR name LIKE '%Priya%' OR name LIKE '%Guru%' OR name LIKE '%Sensei%';
DELETE FROM users WHERE role IN ('manager', 'receptionist', 'trainer');

-- Create trainer_batches table if not exists
CREATE TABLE IF NOT EXISTS trainer_batches (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    trainer_id VARCHAR(36) NOT NULL,
    batch_name VARCHAR(100) NOT NULL,
    program VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trainer_id (trainer_id),
    INDEX idx_batch_name (batch_name),
    UNIQUE KEY unique_trainer_batch (trainer_id, batch_name, program)
);

-- Get branch IDs
SET @rammurthy_id = (SELECT id FROM branches WHERE name LIKE '%Rammurthy%' LIMIT 1);
SET @kasturi_id = (SELECT id FROM branches WHERE name LIKE '%Kasturi%' LIMIT 1);
SET @kalyan_id = (SELECT id FROM branches WHERE name LIKE '%Kalyan%' LIMIT 1);

-- Create ONLY essential users - NO MOCK NAMES
INSERT INTO users (id, username, password, role, name, email, branch_id) VALUES
-- Branch Managers
(UUID(), 'manager_rammurthy', 'manager123', 'manager', 'Branch Manager', 'manager.rammurthy@academy.com', @rammurthy_id),
(UUID(), 'manager_kasturi', 'manager123', 'manager', 'Branch Manager', 'manager.kasturi@academy.com', @kasturi_id),
(UUID(), 'manager_kalyan', 'manager123', 'manager', 'Branch Manager', 'manager.kalyan@academy.com', @kalyan_id),

-- Receptionists
(UUID(), 'reception_rammurthy', 'reception123', 'receptionist', 'Receptionist', 'reception.rammurthy@academy.com', @rammurthy_id),
(UUID(), 'reception_kasturi', 'reception123', 'receptionist', 'Receptionist', 'reception.kasturi@academy.com', @kasturi_id),
(UUID(), 'reception_kalyan', 'reception123', 'receptionist', 'Receptionist', 'reception.kalyan@academy.com', @kalyan_id),

-- Trainers - SIMPLE NAMES ONLY
(UUID(), 'trainer_rammurthy', 'trainer123', 'trainer', 'Trainer', 'trainer.rammurthy@academy.com', @rammurthy_id),
(UUID(), 'trainer_kasturi', 'trainer123', 'trainer', 'Trainer', 'trainer.kasturi@academy.com', @kasturi_id),
(UUID(), 'trainer_kalyan', 'trainer123', 'trainer', 'Trainer', 'trainer.kalyan@academy.com', @kalyan_id);

-- Show created users
SELECT 
    u.role,
    u.username,
    u.name,
    b.name as branch_name
FROM users u 
LEFT JOIN branches b ON u.branch_id = b.id 
WHERE u.role IN ('manager', 'receptionist', 'trainer')
ORDER BY u.role, b.name;