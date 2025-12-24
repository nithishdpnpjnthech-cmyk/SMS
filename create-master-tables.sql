-- CREATE MASTER DATA TABLES
-- Run this SQL script in your database first

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
ALTER TABLE students ADD COLUMN IF NOT EXISTS batch_id VARCHAR(36);

-- Add foreign key constraint
ALTER TABLE students ADD CONSTRAINT fk_students_batch 
FOREIGN KEY (batch_id) REFERENCES batches(id);