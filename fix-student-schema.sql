-- REMOVE INCORRECT UNIQUE CONSTRAINTS
-- Only student_id (UUID) should be unique, not contact details

-- Drop any existing unique indexes on contact fields (MySQL syntax)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() AND table_name = 'students' AND index_name = 'phone') > 0,
    'ALTER TABLE students DROP INDEX phone',
    'SELECT "Index phone does not exist"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() AND table_name = 'students' AND index_name = 'email') > 0,
    'ALTER TABLE students DROP INDEX email',
    'SELECT "Index email does not exist"'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add performance indexes for duplicate detection (NOT unique)
CREATE INDEX idx_students_duplicate_check ON students (name, phone, program, batch, status);
CREATE INDEX idx_students_phone_lookup ON students (phone);
CREATE INDEX idx_students_email_lookup ON students (email);
CREATE INDEX idx_students_status ON students (status);