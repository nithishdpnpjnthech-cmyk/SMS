ALTER TABLE students MODIFY COLUMN status ENUM('active', 'inactive', 'suspended') DEFAULT 'active';

CREATE TABLE IF NOT EXISTS student_remarks (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  author_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);
