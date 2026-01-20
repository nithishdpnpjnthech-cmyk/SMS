-- REMOVE ALL INCORRECT UNIQUE CONSTRAINTS
-- Human admission logic: Only student_id should be unique

-- Drop existing unique indexes if they exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() AND table_name = 'students' AND index_name = 'phone') > 0,
    'ALTER TABLE students DROP INDEX phone',
    'SELECT "phone index not found"'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() AND table_name = 'students' AND index_name = 'email') > 0,
    'ALTER TABLE students DROP INDEX email',
    'SELECT "email index not found"'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add composite index for human duplicate detection (address limited to 255 chars)
CREATE INDEX idx_students_human_duplicate ON students (name, phone, guardian_name, parent_phone, address(255), status);