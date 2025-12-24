-- Create Branch Managers for All Three Branches
USE sms;

-- First, get the branch IDs
SET @rammurthy_id = (SELECT id FROM branches WHERE name LIKE '%Rammurthy%' LIMIT 1);
SET @kasturi_id = (SELECT id FROM branches WHERE name LIKE '%Kasturi%' LIMIT 1);
SET @kalyan_id = (SELECT id FROM branches WHERE name LIKE '%Kalyan%' LIMIT 1);

-- Create Branch Managers
INSERT INTO users (id, username, password, role, name, email, branch_id) VALUES
(UUID(), 'manager_rammurthy', 'manager123', 'manager', 'Rammurthy Branch Manager', 'manager.rammurthy@academy.com', @rammurthy_id),
(UUID(), 'manager_kasturi', 'manager123', 'manager', 'Kasturi Branch Manager', 'manager.kasturi@academy.com', @kasturi_id),
(UUID(), 'manager_kalyan', 'manager123', 'manager', 'Kalyan Branch Manager', 'manager.kalyan@academy.com', @kalyan_id);

-- Create some sample students for each branch
INSERT INTO students (id, name, email, phone, branch_id, program, batch, status) VALUES
-- Rammurthy Nagar students
(UUID(), 'Arjun Kumar', 'arjun@email.com', '+91-9876543210', @rammurthy_id, 'Karate', 'Morning Batch', 'active'),
(UUID(), 'Priya Sharma', 'priya@email.com', '+91-9876543211', @rammurthy_id, 'Yoga', 'Evening Batch', 'active'),
(UUID(), 'Raj Patel', 'raj@email.com', '+91-9876543212', @rammurthy_id, 'Bharatnatyam', 'Weekend Batch', 'active'),

-- Kasturi Nagar students  
(UUID(), 'Sneha Reddy', 'sneha@email.com', '+91-9876543213', @kasturi_id, 'Karate', 'Morning Batch', 'active'),
(UUID(), 'Vikram Singh', 'vikram@email.com', '+91-9876543214', @kasturi_id, 'Yoga', 'Evening Batch', 'active'),
(UUID(), 'Anita Gupta', 'anita@email.com', '+91-9876543215', @kasturi_id, 'Bharatnatyam', 'Weekend Batch', 'active'),

-- Kalyan Nagar students
(UUID(), 'Rohit Mehta', 'rohit@email.com', '+91-9876543216', @kalyan_id, 'Karate', 'Morning Batch', 'active'),
(UUID(), 'Kavya Nair', 'kavya@email.com', '+91-9876543217', @kalyan_id, 'Yoga', 'Evening Batch', 'active'),
(UUID(), 'Suresh Kumar', 'suresh@email.com', '+91-9876543218', @kalyan_id, 'Bharatnatyam', 'Weekend Batch', 'active');

-- Add some sample fees for each branch
INSERT INTO fees (id, student_id, amount, due_date, paid_date, status, payment_method) 
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

-- Show the created managers
SELECT 
    u.username,
    u.name,
    u.role,
    b.name as branch_name,
    b.address
FROM users u 
JOIN branches b ON u.branch_id = b.id 
WHERE u.role = 'manager'
ORDER BY b.name;