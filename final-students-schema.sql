-- FINAL STUDENTS TABLE SCHEMA - HUMAN ADMISSION LOGIC
-- Only student_id is unique, all other fields can have duplicates

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(36) PRIMARY KEY,  -- ONLY unique field
  name VARCHAR(255) NOT NULL,  -- CAN be duplicate (many Johns exist)
  email VARCHAR(255) NULL,     -- CAN be duplicate (family shares email)
  phone VARCHAR(20) NULL,      -- CAN be duplicate (family shares phone)
  parent_phone VARCHAR(20) NULL,
  guardian_name VARCHAR(100) NULL,    -- CAN be duplicate (same guardian for siblings)
  address TEXT NULL,                  -- CAN be duplicate (family shares address)
  branch_id VARCHAR(36) NOT NULL,
  batch_id VARCHAR(36) NULL,
  program VARCHAR(255) NULL,
  batch VARCHAR(255) NULL,
  uniform_issued BOOLEAN DEFAULT FALSE,
  uniform_size ENUM('XS','S','M','L','XL','XXL','XXXL') NULL,
  joining_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  password_hash VARCHAR(255) NULL,
  role VARCHAR(20) DEFAULT 'STUDENT',
  
  -- Foreign keys only
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  
  -- Performance indexes (NOT unique)
  INDEX idx_students_composite_check (name, phone, guardian_name, parent_phone, address, status),
  INDEX idx_students_branch (branch_id),
  INDEX idx_students_status (status)
);