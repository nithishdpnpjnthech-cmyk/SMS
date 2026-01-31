-- SAFE STUDENT IDENTIFIER FIX
-- Handle existing data without breaking constraints

-- 1. Create student_uniforms table
CREATE TABLE IF NOT EXISTS student_uniforms (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL,
  issued BOOLEAN DEFAULT FALSE,
  issue_date TIMESTAMP NULL,
  uniform_size ENUM('XS','S','M','L','XL','XXL','XXXL') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_uniform (student_id)
);

-- 2. Migrate uniform data from students table
INSERT IGNORE INTO student_uniforms (student_id, issued, uniform_size, created_at)
SELECT 
  id as student_id,
  COALESCE(uniform_issued, FALSE) as issued,
  uniform_size,
  created_at
FROM students 
WHERE status = 'active';

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_fees_student_status ON fees(student_id, status);
CREATE INDEX IF NOT EXISTS idx_students_status_branch ON students(status, branch_id);

-- 4. Clean orphaned records first, then add constraints
DELETE a FROM attendance a 
LEFT JOIN students s ON a.student_id = s.id 
WHERE s.id IS NULL;

DELETE f FROM fees f
LEFT JOIN students s ON f.student_id = s.id
WHERE s.id IS NULL;

-- 5. Now add foreign key constraints safely
ALTER TABLE attendance 
ADD CONSTRAINT fk_attendance_student 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE fees 
ADD CONSTRAINT fk_fees_student 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE student_uniforms
ADD CONSTRAINT fk_uniform_student 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;