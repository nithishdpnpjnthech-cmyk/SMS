-- Clean up database and setup only required data
-- Run this to fix all the issues

-- 1. Clear all existing batches and create only 3 required ones
DELETE FROM batches;
INSERT INTO batches (id, name, is_active, created_at) VALUES 
(UUID(), 'Morning', TRUE, NOW()),
(UUID(), 'Evening', TRUE, NOW()),
(UUID(), 'Weekends', TRUE, NOW());

-- 2. Clear any mock/test data from students table
DELETE FROM students WHERE name LIKE '%Test%' OR name LIKE '%Mock%' OR name LIKE '%Sample%';

-- 3. Clear any mock attendance data
DELETE FROM attendance WHERE student_id NOT IN (SELECT id FROM students);

-- 4. Clear any mock fees data
DELETE FROM fees WHERE student_id NOT IN (SELECT id FROM students);

-- 5. Ensure only real programs exist (clear any mock programs)
DELETE FROM programs WHERE name LIKE '%Test%' OR name LIKE '%Mock%' OR name LIKE '%Sample%';

-- 6. Clean up any orphaned student_programs relationships
DELETE FROM student_programs WHERE student_id NOT IN (SELECT id FROM students);
DELETE FROM student_programs WHERE program_id NOT IN (SELECT id FROM programs);

-- 7. Reset auto-increment counters to clean state
ALTER TABLE students AUTO_INCREMENT = 1;
ALTER TABLE attendance AUTO_INCREMENT = 1;
ALTER TABLE fees AUTO_INCREMENT = 1;

-- Verify the cleanup
SELECT 'Batches' as table_name, COUNT(*) as count FROM batches
UNION ALL
SELECT 'Students', COUNT(*) FROM students WHERE status = 'active'
UNION ALL
SELECT 'Programs', COUNT(*) FROM programs WHERE is_active = TRUE
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance
UNION ALL
SELECT 'Fee Records', COUNT(*) FROM fees;