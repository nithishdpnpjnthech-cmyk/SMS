-- Migration: Add batch field to attendance table
USE sms;

-- Add batch column to attendance table if it doesn't exist
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS batch VARCHAR(100) AFTER notes;

-- Add index for batch field
CREATE INDEX IF NOT EXISTS idx_batch ON attendance(batch);

-- Update column names to match the code (snake_case)
ALTER TABLE attendance 
CHANGE COLUMN studentId student_id VARCHAR(36) NOT NULL,
CHANGE COLUMN checkIn check_in DATETIME,
CHANGE COLUMN checkOut check_out DATETIME,
CHANGE COLUMN createdAt created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Update other tables to match snake_case naming
ALTER TABLE users 
CHANGE COLUMN branchId branch_id VARCHAR(36),
CHANGE COLUMN createdAt created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE branches 
CHANGE COLUMN managerId manager_id VARCHAR(36),
CHANGE COLUMN createdAt created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE students 
CHANGE COLUMN branchId branch_id VARCHAR(36) NOT NULL,
CHANGE COLUMN parentPhone parent_phone VARCHAR(50),
CHANGE COLUMN joiningDate joining_date DATETIME DEFAULT CURRENT_TIMESTAMP,
CHANGE COLUMN createdAt created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE trainers 
CHANGE COLUMN branchId branch_id VARCHAR(36) NOT NULL,
CHANGE COLUMN userId user_id VARCHAR(36),
CHANGE COLUMN createdAt created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE fees 
CHANGE COLUMN studentId student_id VARCHAR(36) NOT NULL,
CHANGE COLUMN dueDate due_date DATETIME NOT NULL,
CHANGE COLUMN paidDate paid_date DATETIME,
CHANGE COLUMN paymentMethod payment_method VARCHAR(50),
CHANGE COLUMN createdAt created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Update indexes to match new column names
DROP INDEX IF EXISTS idx_student_date ON attendance;
CREATE INDEX idx_student_date ON attendance(student_id, date);

DROP INDEX IF EXISTS idx_student_id ON attendance;
CREATE INDEX idx_student_id ON attendance(student_id);