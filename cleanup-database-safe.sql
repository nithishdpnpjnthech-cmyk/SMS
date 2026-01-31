-- Clean up test data safely handling foreign key constraints

-- Remove test student
DELETE FROM student_programs WHERE student_id IN (SELECT id FROM students WHERE name = 'Test Student' OR email = 'student@test.com');
DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE name = 'Test Student' OR email = 'student@test.com');
DELETE FROM fees WHERE student_id IN (SELECT id FROM students WHERE name = 'Test Student' OR email = 'student@test.com');
DELETE FROM students WHERE name = 'Test Student' OR email = 'student@test.com';

-- Update users to remove branch reference before deleting branches
UPDATE users SET branch_id = NULL WHERE branch_id IN (SELECT id FROM branches WHERE name = 'Main Branch');

-- Update trainers to remove branch reference
UPDATE trainers SET branch_id = NULL WHERE branch_id IN (SELECT id FROM branches WHERE name = 'Main Branch');

-- Now safely remove the auto-created "Main Branch" 
DELETE FROM branches WHERE name = 'Main Branch';

-- Clear all programs and keep only the three you want
DELETE FROM student_programs; -- Clear relationships first
DELETE FROM programs;

-- Insert only the three programs you want
INSERT INTO programs (id, name, description, is_active) VALUES
(UUID(), 'Bharatnatyam', 'Classical Indian dance form', true),
(UUID(), 'Karate', 'Traditional martial arts training', true),
(UUID(), 'Yoga', 'Physical and mental wellness program', true);

SELECT 'Database cleaned up successfully' as status;
SELECT COUNT(*) as remaining_students FROM students;
SELECT COUNT(*) as remaining_branches FROM branches;
SELECT name as available_programs FROM programs WHERE is_active = true;