-- Setup initial data for programs and batches
-- This will ensure dropdowns work properly

-- Create programs table if not exists
CREATE TABLE IF NOT EXISTS programs (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create batches table if not exists
CREATE TABLE IF NOT EXISTS batches (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial programs
INSERT IGNORE INTO programs (id, name, description, is_active) VALUES
(UUID(), 'Karate', 'Traditional martial arts training', true),
(UUID(), 'Yoga', 'Physical and mental wellness program', true),
(UUID(), 'Bharatnatyam', 'Classical Indian dance form', true),
(UUID(), 'Music', 'Vocal and instrumental music training', true),
(UUID(), 'Art & Craft', 'Creative arts and handicrafts', true);

-- Insert initial batches
INSERT IGNORE INTO batches (id, name, is_active) VALUES
(UUID(), 'Morning Batch (6:00 AM - 8:00 AM)', true),
(UUID(), 'Morning Batch (8:00 AM - 10:00 AM)', true),
(UUID(), 'Evening Batch (4:00 PM - 6:00 PM)', true),
(UUID(), 'Evening Batch (6:00 PM - 8:00 PM)', true),
(UUID(), 'Weekend Batch (Saturday)', true),
(UUID(), 'Weekend Batch (Sunday)', true);

-- Ensure branches table has at least one branch
INSERT IGNORE INTO branches (id, name, address, phone, created_at) VALUES
(UUID(), 'Main Branch', '123 Academy Street, City', '+91-9876543210', NOW());

SELECT 'Initial data setup completed successfully' as status;