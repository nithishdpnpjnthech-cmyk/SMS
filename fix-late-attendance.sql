-- Fix Late Attendance - Add is_late column to attendance table
USE sms;

-- Add is_late boolean column to attendance table
ALTER TABLE attendance 
ADD COLUMN is_late BOOLEAN DEFAULT FALSE AFTER status;

-- Update any existing 'LATE' status records to PRESENT with is_late=true
UPDATE attendance 
SET status = 'PRESENT', is_late = TRUE 
WHERE status = 'LATE' OR status = 'late';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_attendance_is_late ON attendance(is_late);

-- Verify the fix
SELECT 
  status,
  is_late,
  COUNT(*) as count
FROM attendance 
GROUP BY status, is_late
ORDER BY status, is_late;