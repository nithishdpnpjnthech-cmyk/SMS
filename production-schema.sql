-- PRODUCTION DATABASE SCHEMA - NO MOCK DATA

-- Branches (3 Indian branches)
CREATE TABLE branches (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  manager_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (Admin + Branch Staff)
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'receptionist', 'trainer') NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  branch_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- Students (Branch-specific)
CREATE TABLE students (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  parent_phone VARCHAR(20),
  address TEXT,
  branch_id VARCHAR(36) NOT NULL,
  program VARCHAR(100),
  batch VARCHAR(100),
  joining_date DATE,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- Trainers (Branch-specific)
CREATE TABLE trainers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  specialization VARCHAR(255),
  branch_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Attendance (Student-specific)
CREATE TABLE attendance (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL,
  check_in TIME,
  check_out TIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE KEY unique_student_date (student_id, date)
);

-- Fees (Student-specific)
CREATE TABLE fees (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Trainer Batch Assignments
CREATE TABLE trainer_batches (
  trainer_id VARCHAR(36) NOT NULL,
  batch_name VARCHAR(100) NOT NULL,
  program VARCHAR(100) NOT NULL,
  PRIMARY KEY (trainer_id, batch_name, program),
  FOREIGN KEY (trainer_id) REFERENCES users(id)
);

-- Insert ONLY essential branches (NO MOCK DATA)
INSERT INTO branches (id, name, address, phone) VALUES
('branch-ramamurthy', 'Ramamurthy Nagar', 'Ramamurthy Nagar, Bengaluru, Karnataka', '+91-80-2345-6789'),
('branch-kasturi', 'Kasturi Nagar', 'Kasturi Nagar, Bengaluru, Karnataka', '+91-80-3456-7890'),
('branch-kalyan', 'Kalyan Nagar', 'Kalyan Nagar, Bengaluru, Karnataka', '+91-80-4567-8901');

-- Insert ONLY essential users (NO MOCK DATA)
INSERT INTO users (id, username, password, role, name, branch_id) VALUES
('user-admin', 'admin', 'admin123', 'admin', 'Admin', NULL),
('user-manager-ramamurthy', 'manager_ramamurthy', 'manager123', 'manager', 'Branch Manager', 'branch-ramamurthy'),
('user-manager-kasturi', 'manager_kasturi', 'manager123', 'manager', 'Branch Manager', 'branch-kasturi'),
('user-manager-kalyan', 'manager_kalyan', 'manager123', 'manager', 'Branch Manager', 'branch-kalyan'),
('user-reception-ramamurthy', 'reception_ramamurthy', 'reception123', 'receptionist', 'Receptionist', 'branch-ramamurthy'),
('user-reception-kasturi', 'reception_kasturi', 'reception123', 'receptionist', 'Receptionist', 'branch-kasturi'),
('user-reception-kalyan', 'reception_kalyan', 'reception123', 'receptionist', 'Receptionist', 'branch-kalyan');

-- NO STUDENTS, NO ATTENDANCE, NO FEES - EMPTY DATABASE
-- System will show zeros until real data is added