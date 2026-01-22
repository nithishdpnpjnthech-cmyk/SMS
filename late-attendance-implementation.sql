-- Late Attendance Implementation for MySQL
-- Add is_late column to attendance table

USE sms;

-- Add is_late column to attendance table
ALTER TABLE attendance 
ADD COLUMN is_late BOOLEAN DEFAULT FALSE AFTER status;

-- Update existing 'late' status records to PRESENT with is_late = true
UPDATE attendance 
SET status = 'PRESENT', is_late = TRUE 
WHERE status = 'late';

-- Add index for better performance on is_late queries
CREATE INDEX IF NOT EXISTS idx_attendance_is_late ON attendance(is_late);

-- Verify the changes
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'PRESENT' AND is_late = FALSE THEN 1 END) as present_on_time,
  COUNT(CASE WHEN status = 'PRESENT' AND is_late = TRUE THEN 1 END) as present_late,
  COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent
FROM attendance;

-- Show table structure to confirm changes
DESCRIBE attendance;