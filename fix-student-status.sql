-- Fix student status column and ensure data integrity
USE sms;

-- Ensure status column exists with proper default
ALTER TABLE students 
MODIFY COLUMN status VARCHAR(50) DEFAULT 'active';

-- Update any NULL status values to 'active'
UPDATE students 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Verify the changes
SELECT COUNT(*) as total_students, 
       COUNT(CASE WHEN status = 'active' THEN 1 END) as active_students,
       COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_students
FROM students;