-- =====================================================
-- STUDENT IDENTIFIER MISMATCH FIX
-- Production ERP System - Backend Data Contract Fix
-- =====================================================

-- 1. ENSURE STUDENT_UNIFORMS TABLE EXISTS WITH CORRECT SCHEMA
CREATE TABLE IF NOT EXISTS student_uniforms (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL,
  issued BOOLEAN DEFAULT FALSE,
  issue_date TIMESTAMP NULL,
  uniform_size ENUM('XS','S','M','L','XL','XXL','XXXL') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_uniform (student_id)
);

-- 2. MIGRATE EXISTING UNIFORM DATA FROM STUDENTS TABLE TO STUDENT_UNIFORMS
INSERT IGNORE INTO student_uniforms (student_id, issued, uniform_size, created_at)
SELECT 
  id as student_id,
  COALESCE(uniform_issued, FALSE) as issued,
  uniform_size,
  created_at
FROM students 
WHERE status = 'active';

-- 3. ENSURE ALL FOREIGN KEY CONSTRAINTS USE STUDENT.ID (UUID)
-- Check and fix attendance table
ALTER TABLE attendance 
ADD CONSTRAINT fk_attendance_student 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Check and fix fees table  
ALTER TABLE fees 
ADD CONSTRAINT fk_fees_student 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- 4. CREATE INDEXES FOR PERFORMANCE (CRITICAL FOR PRODUCTION)
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_fees_student_status ON fees(student_id, status);
CREATE INDEX IF NOT EXISTS idx_students_status_branch ON students(status, branch_id);

-- 5. VERIFY DATA INTEGRITY - FIND ORPHANED RECORDS
SELECT 'ORPHANED ATTENDANCE RECORDS' as issue_type, COUNT(*) as count
FROM attendance a 
LEFT JOIN students s ON a.student_id = s.id 
WHERE s.id IS NULL

UNION ALL

SELECT 'ORPHANED FEE RECORDS' as issue_type, COUNT(*) as count  
FROM fees f
LEFT JOIN students s ON f.student_id = s.id
WHERE s.id IS NULL

UNION ALL

SELECT 'STUDENTS WITHOUT UNIFORM RECORDS' as issue_type, COUNT(*) as count
FROM students s
LEFT JOIN student_uniforms su ON s.id = su.student_id
WHERE s.status = 'active' AND su.student_id IS NULL;

-- 6. CREATE MISSING UNIFORM RECORDS FOR ACTIVE STUDENTS
INSERT IGNORE INTO student_uniforms (student_id, issued, uniform_size)
SELECT 
  s.id,
  COALESCE(s.uniform_issued, FALSE),
  s.uniform_size
FROM students s
LEFT JOIN student_uniforms su ON s.id = su.student_id
WHERE s.status = 'active' AND su.student_id IS NULL;