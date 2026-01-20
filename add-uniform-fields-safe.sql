-- SAFE MySQL ALTER TABLE statements to add uniform fields
-- These commands will NOT affect existing data

-- Add guardian_name column (optional field)
ALTER TABLE students 
ADD COLUMN guardian_name VARCHAR(100) NULL 
COMMENT 'Guardian name - optional field';

-- Add uniform_issued column (boolean with default false)
ALTER TABLE students 
ADD COLUMN uniform_issued BOOLEAN DEFAULT FALSE NOT NULL 
COMMENT 'Whether uniform has been issued to student';

-- Add uniform_size column (ENUM with allowed sizes)
ALTER TABLE students 
ADD COLUMN uniform_size ENUM('XS','S','M','L','XL','XXL','XXXL') NULL 
COMMENT 'Uniform size - required only if uniform_issued = true';

-- Verify the changes (optional check query)
-- SELECT guardian_name, uniform_issued, uniform_size FROM students LIMIT 5;