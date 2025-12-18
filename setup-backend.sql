-- Drop and recreate database with correct schema
DROP DATABASE IF EXISTS sms;
CREATE DATABASE sms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sms;

-- Users table with correct field names
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    email VARCHAR(255),
    name VARCHAR(255),
    branchId VARCHAR(36),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_branch_id (branchId)
);

-- Branches table
CREATE TABLE branches (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    managerId VARCHAR(36),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_manager_id (managerId)
);

-- Students table
CREATE TABLE students (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    parentPhone VARCHAR(50),
    address TEXT,
    branchId VARCHAR(36) NOT NULL,
    program VARCHAR(100),
    batch VARCHAR(100),
    joiningDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_branch_id (branchId),
    INDEX idx_status (status),
    INDEX idx_program (program)
);

-- Trainers table
CREATE TABLE trainers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    specialization VARCHAR(255),
    branchId VARCHAR(36) NOT NULL,
    userId VARCHAR(36),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_branch_id (branchId),
    INDEX idx_user_id (userId)
);

-- Attendance table
CREATE TABLE attendance (
    id VARCHAR(36) PRIMARY KEY,
    studentId VARCHAR(36) NOT NULL,
    date DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    checkIn DATETIME,
    checkOut DATETIME,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_id (studentId),
    INDEX idx_date (date),
    INDEX idx_student_date (studentId, date)
);

-- Fees table
CREATE TABLE fees (
    id VARCHAR(36) PRIMARY KEY,
    studentId VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    dueDate DATETIME NOT NULL,
    paidDate DATETIME,
    status VARCHAR(50) DEFAULT 'pending',
    paymentMethod VARCHAR(50),
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_id (studentId),
    INDEX idx_status (status),
    INDEX idx_due_date (dueDate)
);

-- Insert default users for all roles
INSERT INTO users (id, username, password, role, name, email, createdAt) VALUES
(UUID(), 'admin', 'admin123', 'admin', 'System Administrator', 'admin@academy.com', NOW()),
(UUID(), 'manager', 'manager123', 'manager', 'Branch Manager', 'manager@academy.com', NOW()),
(UUID(), 'receptionist', 'reception123', 'receptionist', 'Front Desk', 'reception@academy.com', NOW()),
(UUID(), 'trainer', 'trainer123', 'trainer', 'Martial Arts Trainer', 'trainer@academy.com', NOW());

-- Insert default branch
INSERT INTO branches (id, name, address, phone, createdAt) VALUES
(UUID(), 'Main Branch', '123 Academy Street, City', '+1234567890', NOW());

-- Verify setup
SELECT 'Users created:' as info;
SELECT username, role, name FROM users;

SELECT 'Branches created:' as info;
SELECT name, address FROM branches;