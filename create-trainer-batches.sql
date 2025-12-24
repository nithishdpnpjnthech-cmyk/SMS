-- Create trainer-batch assignment table for proper access control
USE sms;

-- Create trainer_batches mapping table
CREATE TABLE IF NOT EXISTS trainer_batches (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    trainer_id VARCHAR(36) NOT NULL,
    batch_name VARCHAR(100) NOT NULL,
    program VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trainer_id (trainer_id),
    INDEX idx_batch_name (batch_name),
    UNIQUE KEY unique_trainer_batch (trainer_id, batch_name, program)
);

-- Update users table to ensure proper branch assignment
ALTER TABLE users 
MODIFY COLUMN branch_id VARCHAR(36) NULL;

-- Add proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role_branch ON users(role, branch_id);
CREATE INDEX IF NOT EXISTS idx_students_branch_status ON students(branch_id, status);

-- Verify table structure
DESCRIBE trainer_batches;