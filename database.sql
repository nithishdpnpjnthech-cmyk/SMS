-- ============================================================
-- SMS ACADEMY — MASTER DATABASE SETUP SCRIPT
-- ============================================================
-- Run this ONCE on your fresh MySQL database (AWS RDS or local).
-- This creates all required tables + default admin user.
-- Version: Production-Ready
-- Tables: 18
-- ============================================================

CREATE DATABASE IF NOT EXISTS sms;
USE sms;

-- ============================================================
-- 1. BRANCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
  id          VARCHAR(36)  PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  address     TEXT         DEFAULT NULL,
  phone       VARCHAR(20)  DEFAULT NULL,
  manager_id  VARCHAR(36)  DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_branches_manager (manager_id)
);

-- ============================================================
-- 2. USERS  (admin / manager / receptionist / trainer)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(36)  PRIMARY KEY,
  username    VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'admin',
  email       VARCHAR(255) DEFAULT NULL,
  name        VARCHAR(255) DEFAULT NULL,
  branch_id   VARCHAR(36)  DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_username  (username),
  INDEX idx_users_email     (email),
  INDEX idx_users_branch    (branch_id)
);

-- ============================================================
-- 3. PROGRAMS  (Karate, Yoga, Swimming, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS programs (
  id          VARCHAR(36)  PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT         DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. BATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS batches (
  id          VARCHAR(36)  PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  program_id  VARCHAR(36)  DEFAULT NULL,
  branch_id   VARCHAR(36)  DEFAULT NULL,
  schedule    VARCHAR(255) DEFAULT NULL,
  capacity    INT          DEFAULT 30,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_batches_branch   (branch_id),
  INDEX idx_batches_program  (program_id)
);

-- ============================================================
-- 5. TRAINERS
-- ============================================================
CREATE TABLE IF NOT EXISTS trainers (
  id              VARCHAR(36)  PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) DEFAULT NULL,
  phone           VARCHAR(20)  DEFAULT NULL,
  specialization  VARCHAR(255) DEFAULT NULL,
  branch_id       VARCHAR(36)  NOT NULL,
  user_id         VARCHAR(36)  DEFAULT NULL,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trainers_branch (branch_id),
  INDEX idx_trainers_user   (user_id)
);

-- ============================================================
-- 6. STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id               VARCHAR(36)   PRIMARY KEY,
  name             VARCHAR(255)  NOT NULL,
  email            VARCHAR(255)  DEFAULT NULL,
  phone            VARCHAR(20)   DEFAULT NULL,
  parent_phone     VARCHAR(20)   DEFAULT NULL,
  guardian_name    VARCHAR(100)  DEFAULT NULL,
  address          TEXT          DEFAULT NULL,
  branch_id        VARCHAR(36)   NOT NULL,
  batch_id         VARCHAR(36)   DEFAULT NULL,
  program          VARCHAR(255)  DEFAULT NULL,
  batch            VARCHAR(255)  DEFAULT NULL,
  uniform_issued   TINYINT(1)    DEFAULT 0,
  uniform_size     ENUM('XS','S','M','L','XL','XXL','XXXL') DEFAULT NULL,
  joining_date     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  status           VARCHAR(20)   DEFAULT 'active',
  -- Auth columns
  password_hash    VARCHAR(255)  DEFAULT NULL,
  role             VARCHAR(20)   DEFAULT 'STUDENT',
  last_login       TIMESTAMP     DEFAULT NULL,
  login_attempts   INT           DEFAULT 0,
  locked_until     TIMESTAMP     DEFAULT NULL,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_students_branch  (branch_id),
  INDEX idx_students_email   (email),
  INDEX idx_students_phone   (phone),
  INDEX idx_students_status  (status),
  INDEX idx_students_batch   (batch_id)
);

-- ============================================================
-- 7. STUDENT PORTAL CREDENTIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS student_portal_credentials (
  id             VARCHAR(36)  PRIMARY KEY,
  student_id     VARCHAR(36)  NOT NULL UNIQUE,
  username       VARCHAR(100) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_spc_student  (student_id),
  INDEX idx_spc_username (username)
);

-- ============================================================
-- 8. ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id          VARCHAR(36)  PRIMARY KEY,
  student_id  VARCHAR(36)  NOT NULL,
  date        DATETIME     NOT NULL,
  status      VARCHAR(20)  NOT NULL,
  is_late     TINYINT(1)   DEFAULT 0,
  check_in    DATETIME     DEFAULT NULL,
  check_out   DATETIME     DEFAULT NULL,
  notes       TEXT         DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attendance_student (student_id),
  INDEX idx_attendance_date    (date)
);

-- ============================================================
-- 9. FEE STRUCTURES  (Monthly fee per program/activity)
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_structures (
  id          VARCHAR(36)     PRIMARY KEY,
  name        VARCHAR(255)    NOT NULL,
  amount      DECIMAL(10,2)   NOT NULL,
  description TEXT            DEFAULT NULL,
  created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 10. STUDENT ENROLLMENTS  (which student is in which program)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_enrollments (
  id                VARCHAR(36)  PRIMARY KEY,
  student_id        VARCHAR(36)  NOT NULL,
  fee_structure_id  VARCHAR(36)  NOT NULL,
  start_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  status            VARCHAR(20)  DEFAULT 'active',
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_enrollments_student       (student_id),
  INDEX idx_enrollments_fee_structure (fee_structure_id)
);

-- ============================================================
-- 11. STUDENT FEES  (monthly fee records per student)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_fees (
  id             VARCHAR(36)   PRIMARY KEY,
  student_id     VARCHAR(36)   NOT NULL,
  enrollment_id  VARCHAR(36)   DEFAULT NULL,
  month          INT           NOT NULL,
  year           INT           NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  paid_amount    DECIMAL(10,2) DEFAULT 0.00,
  status         VARCHAR(20)   DEFAULT 'pending',
  due_date       TIMESTAMP     DEFAULT NULL,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_fees_student (student_id),
  INDEX idx_student_fees_month   (month, year)
);

-- ============================================================
-- 12. PAYMENTS  (actual payment transactions)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id              VARCHAR(36)   PRIMARY KEY,
  student_id      VARCHAR(36)   NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  payment_date    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  payment_method  VARCHAR(50)   NOT NULL,
  notes           TEXT          DEFAULT NULL,
  razorpay_order_id    VARCHAR(100) DEFAULT NULL,
  razorpay_payment_id  VARCHAR(100) DEFAULT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payments_student (student_id),
  INDEX idx_payments_date    (payment_date)
);

-- ============================================================
-- 13. FEES  (legacy simple fee tracking — kept for compatibility)
-- ============================================================
CREATE TABLE IF NOT EXISTS fees (
  id              VARCHAR(36)   PRIMARY KEY,
  student_id      VARCHAR(36)   NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  due_date        TIMESTAMP     NOT NULL,
  paid_date       TIMESTAMP     DEFAULT NULL,
  status          VARCHAR(20)   DEFAULT 'pending',
  payment_method  VARCHAR(50)   DEFAULT NULL,
  notes           TEXT          DEFAULT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fees_student (student_id),
  INDEX idx_fees_status  (status)
);

-- ============================================================
-- 14. STUDENT REMARKS
-- ============================================================
CREATE TABLE IF NOT EXISTS student_remarks (
  id          VARCHAR(36)  PRIMARY KEY,
  student_id  VARCHAR(36)  NOT NULL,
  author_id   VARCHAR(36)  NOT NULL,
  content     TEXT         NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_remarks_student (student_id),
  INDEX idx_remarks_author  (author_id)
);

-- ============================================================
-- 15. STUDENT UNIFORMS
-- ============================================================
CREATE TABLE IF NOT EXISTS student_uniforms (
  id          VARCHAR(36)  PRIMARY KEY,
  student_id  VARCHAR(36)  NOT NULL UNIQUE,
  size        VARCHAR(10)  DEFAULT NULL,
  issued_date TIMESTAMP    DEFAULT NULL,
  issued_by   VARCHAR(36)  DEFAULT NULL,
  notes       TEXT         DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_uniforms_student (student_id)
);

-- ============================================================
-- 16. TRAINER ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS trainer_attendance (
  id              VARCHAR(36)   PRIMARY KEY,
  trainer_id      VARCHAR(36)   NOT NULL,
  date            DATE          DEFAULT NULL,
  clock_in_time   DATETIME(3)   NOT NULL,
  clock_out_time  DATETIME(3)   DEFAULT NULL,
  worked_minutes  INT           DEFAULT 0,
  location_type   VARCHAR(50)   NOT NULL,
  location_name   VARCHAR(100)  NOT NULL,
  notes           TEXT          DEFAULT NULL,
  status          VARCHAR(20)   DEFAULT 'open',
  updated_at      DATETIME(3)   DEFAULT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trainer_att_trainer (trainer_id),
  INDEX idx_trainer_att_time    (clock_in_time)
);

-- ============================================================
-- 17. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          VARCHAR(36)  PRIMARY KEY,
  user_id     VARCHAR(36)  DEFAULT NULL,
  student_id  VARCHAR(36)  DEFAULT NULL,
  type        VARCHAR(20)  NOT NULL,
  title       TEXT         NOT NULL,
  message     TEXT         NOT NULL,
  is_read     TINYINT(1)   DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user    (user_id),
  INDEX idx_notifications_student (student_id),
  INDEX idx_notifications_created (created_at)
);

-- ============================================================
-- 18. SYSTEM SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id           INT          PRIMARY KEY AUTO_INCREMENT,
  setting_key  VARCHAR(100) NOT NULL UNIQUE,
  value        TEXT         DEFAULT NULL,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- DEFAULT ADMIN USER
-- (password: Admin@123 — CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN)
-- Hash generated with bcrypt rounds=10
-- ============================================================
INSERT IGNORE INTO users (id, username, password, role, name, email, created_at)
VALUES (
  'admin-default-001',
  'admin',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'Super Admin',
  'admin@smsacademy.com',
  NOW()
);

-- ============================================================
-- DEFAULT SYSTEM SETTINGS
-- ============================================================
INSERT IGNORE INTO system_settings (setting_key, value) VALUES
  ('academy_name',     'SMS Academy'),
  ('payment_cycle',    'monthly'),
  ('currency',         'INR'),
  ('smtp_configured',  'false'),
  ('sms_configured',   'false');

-- ============================================================
-- VERIFY: Show all created tables
-- ============================================================
SHOW TABLES;
SELECT 'Setup complete! Total tables:' AS status, COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE();
