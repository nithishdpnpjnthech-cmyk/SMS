-- MySQL Compatible Fix
CREATE TABLE IF NOT EXISTS student_uniforms (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  issued BOOLEAN DEFAULT FALSE,
  issue_date TIMESTAMP NULL,
  uniform_size ENUM('XS','S','M','L','XL','XXL','XXXL') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_uniform (student_id)
);

INSERT IGNORE INTO student_uniforms (id, student_id, issued, uniform_size, created_at)
SELECT 
  UUID() as id,
  id as student_id,
  COALESCE(uniform_issued, FALSE) as issued,
  uniform_size,
  created_at
FROM students 
WHERE status = 'active';

ALTER TABLE student_uniforms
ADD CONSTRAINT fk_uniform_student 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;