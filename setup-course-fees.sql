-- Production Course-Based Fee Structure
-- Execute this to set up proper fee calculation

-- 1. Create courses table with fixed monthly fees
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL UNIQUE,
  monthly_fee DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create student_courses junction table
CREATE TABLE IF NOT EXISTS student_courses (
  student_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  enrolled_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 3. Insert fixed course fees (as per your requirements)
INSERT IGNORE INTO courses (id, name, monthly_fee, is_active) VALUES
(UUID(), 'Karate', 2000.00, TRUE),
(UUID(), 'Bharatanatyam', 1500.00, TRUE),
(UUID(), 'Yoga', 1000.00, TRUE);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_courses_student ON student_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course ON student_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);

-- 5. Ensure fees table has proper decimal type
ALTER TABLE fees MODIFY COLUMN amount DECIMAL(10,2) NOT NULL;