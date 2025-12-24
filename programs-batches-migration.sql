-- PROGRAMS AND BATCHES MIGRATION
-- Add proper programs and batches tables for multi-select functionality

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create batches table  
CREATE TABLE IF NOT EXISTS batches (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create student_programs junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS student_programs (
  student_id VARCHAR(36) NOT NULL,
  program_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (student_id, program_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- Add batch_id column to students table
ALTER TABLE students ADD COLUMN batch_id VARCHAR(36);
ALTER TABLE students ADD FOREIGN KEY (batch_id) REFERENCES batches(id);

-- ONLY INSERT DATA IF TABLES ARE EMPTY (NO MOCK DATA)
-- These will only be inserted if the admin manually adds them through the system