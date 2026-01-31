-- PRODUCTION FEES SYSTEM - SIMPLIFIED
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  monthly_fee DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS student_courses (
  student_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

INSERT IGNORE INTO courses (id, name, monthly_fee) VALUES
(UUID(), 'Karate', 2000.00),
(UUID(), 'Bharatanatyam', 1500.00),
(UUID(), 'Yoga', 1000.00);