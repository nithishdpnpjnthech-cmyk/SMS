-- Migration: create missing tables used by the server
-- Run this against the 'sms' database (for example: mysql -u root -p sms < create_missing_tables.sql)

-- Table: student_uniforms
-- Some server code expects a table named `student_uniforms` with at least
-- columns: student_id, issued, issue_date
CREATE TABLE IF NOT EXISTS student_uniforms (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  issued TINYINT(1) DEFAULT 0,
  issue_date DATETIME DEFAULT NULL,
  uniform_size VARCHAR(32) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_student_uniforms_student (student_id),
  CONSTRAINT fk_student_uniforms_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Table: attendance
-- Ensure the attendance table exists and has a unique key on (student_id, date)
-- so that INSERT ... ON DUPLICATE KEY UPDATE works for upserts.
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(64) NOT NULL,
  is_late TINYINT(1) DEFAULT 0,
  check_in DATETIME DEFAULT NULL,
  check_out DATETIME DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_attendance_student (student_id),
  UNIQUE KEY uq_attendance_student_date (student_id, date),
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Optional: if your students table uses another primary key type (INT) or different name,
-- adjust the foreign key definitions above accordingly.

-- Helpful: grant privileges if needed (uncomment and adjust user/database)
-- GRANT ALL PRIVILEGES ON sms.* TO 'sms_user'@'localhost';
