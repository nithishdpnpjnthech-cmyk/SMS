-- Student Portal Credentials Table
-- This table stores login credentials for students (managed by Admin only)
CREATE TABLE IF NOT EXISTS student_portal_credentials (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36) NOT NULL,
  last_login TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_student_portal_username (username),
  INDEX idx_student_portal_student_id (student_id)
);

-- Add uniform tracking table if needed
CREATE TABLE IF NOT EXISTS student_uniforms (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL,
  issued BOOLEAN DEFAULT FALSE,
  issue_date DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_uniform (student_id)
);