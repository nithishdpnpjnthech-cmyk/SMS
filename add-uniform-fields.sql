-- ADD NEW UNIFORM FIELDS TO STUDENTS TABLE
-- This script safely adds the new fields without affecting existing data

USE sms;

-- Add guardian_name field (optional)
ALTER TABLE students 
ADD COLUMN guardian_name VARCHAR(100) NULL AFTER parent_phone;

-- Add uniform_issued field (boolean, default false)
ALTER TABLE students 
ADD COLUMN uniform_issued BOOLEAN DEFAULT FALSE AFTER guardian_name;

-- Add uniform_size field (enum, nullable)
ALTER TABLE students 
ADD COLUMN uniform_size ENUM('XS','S','M','L','XL','XXL','XXXL') NULL AFTER uniform_issued;

-- Verify the changes
DESCRIBE students;

-- Show sample of existing data to ensure no data loss
SELECT id, name, guardian_name, uniform_issued, uniform_size 
FROM students 
LIMIT 5;