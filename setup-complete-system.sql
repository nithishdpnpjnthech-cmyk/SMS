-- Complete Academy Management System Setup with Branch Isolation
USE sms;

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

-- Create Branch Managers
INSERT IGNORE INTO users (id, username, password, role, name, email, branch_id) VALUES
(UUID(), 'manager_rammurthy', 'manager123', 'manager', 'Rammurthy Branch Manager', 'manager.rammurthy@academy.com', @rammurthy_id),
(UUID(), 'manager_kasturi', 'manager123', 'manager', 'Kasturi Branch Manager', 'manager.kasturi@academy.com', @kasturi_id),
(UUID(), 'manager_kalyan', 'manager123', 'manager', 'Kalyan Branch Manager', 'manager.kalyan@academy.com', @kalyan_id);

-- Create Receptionists
INSERT IGNORE INTO users (id, username, password, role, name, email, branch_id) VALUES
(UUID(), 'reception_rammurthy', 'reception123', 'receptionist', 'Rammurthy Receptionist', 'reception.rammurthy@academy.com', @rammurthy_id),
(UUID(), 'reception_kasturi', 'reception123', 'receptionist', 'Kasturi Receptionist', 'reception.kasturi@academy.com', @kasturi_id),
(UUID(), 'reception_kalyan', 'reception123', 'receptionist', 'Kalyan Receptionist', 'reception.kalyan@academy.com', @kalyan_id);

-- Create Trainers
SET @trainer1_id = UUID();
SET @trainer2_id = UUID();
SET @trainer3_id = UUID();
SET @trainer4_id = UUID();
SET @trainer5_id = UUID();
SET @trainer6_id = UUID();

INSERT IGNORE INTO users (id, username, password, role, name, email, branch_id) VALUES
(@trainer1_id, 'trainer_rammurthy_karate', 'trainer123', 'trainer', 'Sensei Kumar (Karate)', 'karate.rammurthy@academy.com', @rammurthy_id),
(@trainer2_id, 'trainer_rammurthy_yoga', 'trainer123', 'trainer', 'Guru Priya (Yoga)', 'yoga.rammurthy@academy.com', @rammurthy_id),
(@trainer3_id, 'trainer_kasturi_karate', 'trainer123', 'trainer', 'Sensei Raj (Karate)', 'karate.kasturi@academy.com', @kasturi_id),
(@trainer4_id, 'trainer_kasturi_dance', 'trainer123', 'trainer', 'Guru Anita (Dance)', 'dance.kasturi@academy.com', @kasturi_id),
(@trainer5_id, 'trainer_kalyan_yoga', 'trainer123', 'trainer', 'Guru Vikram (Yoga)', 'yoga.kalyan@academy.com', @kalyan_id),
(@trainer6_id, 'trainer_kalyan_dance', 'trainer123', 'trainer', 'Guru Kavya (Dance)', 'dance.kalyan@academy.com', @kalyan_id);

-- Assign trainers to batches
INSERT IGNORE INTO trainer_batches (trainer_id, batch_name, program) VALUES
-- Rammurthy trainers
(@trainer1_id, 'Morning Batch', 'Karate'),
(@trainer1_id, 'Evening Batch', 'Karate'),
(@trainer2_id, 'Morning Batch', 'Yoga'),
(@trainer2_id, 'Weekend Batch', 'Yoga'),

-- Kasturi trainers
(@trainer3_id, 'Morning Batch', 'Karate'),
(@trainer3_id, 'Evening Batch', 'Karate'),
(@trainer4_id, 'Evening Batch', 'Bharatnatyam'),
(@trainer4_id, 'Weekend Batch', 'Bharatnatyam'),

-- Kalyan trainers
(@trainer5_id, 'Morning Batch', 'Yoga'),
(@trainer5_id, 'Evening Batch', 'Yoga'),
(@trainer6_id, 'Evening Batch', 'Bharatnatyam'),
(@trainer6_id, 'Weekend Batch', 'Bharatnatyam');

-- Create sample students for each branch
INSERT IGNORE INTO students (id, name, email, phone, branch_id, program, batch, status) VALUES
-- Rammurthy Nagar students
(UUID(), 'Arjun Kumar', 'arjun@email.com', '+91-9876543210', @rammurthy_id, 'Karate', 'Morning Batch', 'active'),
(UUID(), 'Priya Sharma', 'priya@email.com', '+91-9876543211', @rammurthy_id, 'Yoga', 'Morning Batch', 'active'),
(UUID(), 'Raj Patel', 'raj@email.com', '+91-9876543212', @rammurthy_id, 'Karate', 'Evening Batch', 'active'),
(UUID(), 'Meera Singh', 'meera@email.com', '+91-9876543213', @rammurthy_id, 'Yoga', 'Weekend Batch', 'active'),

-- Kasturi Nagar students  
(UUID(), 'Sneha Reddy', 'sneha@email.com', '+91-9876543214', @kasturi_id, 'Karate', 'Morning Batch', 'active'),
(UUID(), 'Vikram Singh', 'vikram@email.com', '+91-9876543215', @kasturi_id, 'Bharatnatyam', 'Evening Batch', 'active'),
(UUID(), 'Anita Gupta', 'anita@email.com', '+91-9876543216', @kasturi_id, 'Karate', 'Evening Batch', 'active'),
(UUID(), 'Deepak Kumar', 'deepak@email.com', '+91-9876543217', @kasturi_id, 'Bharatnatyam', 'Weekend Batch', 'active'),

-- Kalyan Nagar students
(UUID(), 'Rohit Mehta', 'rohit@email.com', '+91-9876543218', @kalyan_id, 'Yoga', 'Morning Batch', 'active'),
(UUID(), 'Kavya Nair', 'kavya@email.com', '+91-9876543219', @kalyan_id, 'Bharatnatyam', 'Evening Batch', 'active'),
(UUID(), 'Suresh Kumar', 'suresh@email.com', '+91-9876543220', @kalyan_id, 'Yoga', 'Evening Batch', 'active'),
(UUID(), 'Lakshmi Devi', 'lakshmi@email.com', '+91-9876543221', @kalyan_id, 'Bharatnatyam', 'Weekend Batch', 'active');

-- Add sample fees for each branch
INSERT IGNORE INTO fees (id, student_id, amount, due_date, paid_date, status, payment_method) 
SELECT 
    UUID(),
    s.id,
    CASE s.program 
        WHEN 'Karate' THEN 5000
        WHEN 'Yoga' THEN 3000  
        WHEN 'Bharatnatyam' THEN 4000
        ELSE 3500
    END,
    DATE_ADD(CURDATE(), INTERVAL -30 DAY),
    CASE WHEN RAND() > 0.3 THEN DATE_ADD(CURDATE(), INTERVAL -25 DAY) ELSE NULL END,
    CASE WHEN RAND() > 0.3 THEN 'paid' ELSE 'pending' END,
    CASE WHEN RAND() > 0.3 THEN 'cash' ELSE NULL END
FROM students s WHERE s.status = 'active';

-- Add sample attendance for today
INSERT IGNORE INTO attendance (id, student_id, date, status, check_in, created_at)
SELECT 
    UUID(),
    s.id,
    CURDATE(),
    CASE WHEN RAND() > 0.2 THEN 'present' ELSE 'absent' END,
    CASE WHEN RAND() > 0.2 THEN NOW() ELSE NULL END,
    NOW()
FROM students s WHERE s.status = 'active';

-- Show created users by role and branch
SELECT 
    u.role,
    u.username,
    u.name,
    b.name as branch_name
FROM users u 
LEFT JOIN branches b ON u.branch_id = b.id 
WHERE u.role IN ('manager', 'receptionist', 'trainer')
ORDER BY u.role, b.name, u.name;

-- Show trainer assignments
SELECT 
    u.name as trainer_name,
    b.name as branch_name,
    tb.program,
    tb.batch_name,
    COUNT(s.id) as student_count
FROM users u
JOIN branches b ON u.branch_id = b.id
JOIN trainer_batches tb ON u.id = tb.trainer_id
LEFT JOIN students s ON s.branch_id = b.id AND s.program = tb.program AND s.batch = tb.batch_name AND s.status = 'active'
WHERE u.role = 'trainer'
GROUP BY u.id, tb.program, tb.batch_name
ORDER BY b.name, u.name;