-- Clean up test data and fix database issues

-- Remove test student
DELETE FROM students WHERE name = 'Test Student' OR email = 'student@test.com';

-- Remove the auto-created "Main Branch" 
DELETE FROM branches WHERE name = 'Main Branch';

-- Clear all programs and keep only the three you want
DELETE FROM programs;

-- Insert only the three programs you want
INSERT INTO programs (id, name, description, is_active) VALUES
(UUID(), 'Bharatnatyam', 'Classical Indian dance form', true),
(UUID(), 'Karate', 'Traditional martial arts training', true),
(UUID(), 'Yoga', 'Physical and mental wellness program', true);

-- Keep existing batches as they are useful
-- But you can modify them if needed

-- Clean up any orphaned student_programs records
DELETE FROM student_programs WHERE student_id NOT IN (SELECT id FROM students);

-- Clean up any orphaned attendance records
DELETE FROM attendance WHERE student_id NOT IN (SELECT id FROM students);

-- Clean up any orphaned fees records  
DELETE FROM fees WHERE student_id NOT IN (SELECT id FROM students);

SELECT 'Database cleaned up successfully' as status;
SELECT COUNT(*) as remaining_students FROM students;
SELECT COUNT(*) as remaining_branches FROM branches;
SELECT name as available_programs FROM programs WHERE is_active = true;