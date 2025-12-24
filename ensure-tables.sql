-- ENSURE PROGRAMS AND BATCHES TABLES EXIST
-- This script creates the tables if they don't exist (safe to run multiple times)

CREATE TABLE IF NOT EXISTS programs (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batches (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_programs (
  student_id VARCHAR(36) NOT NULL,
  program_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (student_id, program_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- Add batch_id column to students table if it doesn't exist
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'students' 
   AND COLUMN_NAME = 'batch_id') = 0,
  'ALTER TABLE students ADD COLUMN batch_id VARCHAR(36)',
  'SELECT "batch_id column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if it doesn't exist
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'students' 
   AND COLUMN_NAME = 'batch_id' 
   AND REFERENCED_TABLE_NAME = 'batches') = 0,
  'ALTER TABLE students ADD FOREIGN KEY (batch_id) REFERENCES batches(id)',
  'SELECT "batch_id foreign key already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;