-- =====================================================
-- PRODUCTION FEES & BILLING SYSTEM - DATABASE SCHEMA
-- =====================================================

-- 1. COURSES TABLE (Fixed Monthly Fees)
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL UNIQUE,
  monthly_fee DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_courses_active (is_active),
  INDEX idx_courses_name (name)
);

-- 2. STUDENT_COURSES TABLE (Many-to-Many Relationship)
CREATE TABLE IF NOT EXISTS student_courses (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_course (student_id, course_id),
  INDEX idx_student_courses_student (student_id),
  INDEX idx_student_courses_course (course_id),
  INDEX idx_student_courses_active (is_active)
);

-- 3. MONTHLY_FEES TABLE (Auto-Generated Monthly Fees)
CREATE TABLE IF NOT EXISTS monthly_fees (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id VARCHAR(36) NOT NULL,
  fee_month DATE NOT NULL, -- YYYY-MM-01 format
  total_amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_month (student_id, fee_month),
  INDEX idx_monthly_fees_student (student_id),
  INDEX idx_monthly_fees_month (fee_month),
  INDEX idx_monthly_fees_status (status),
  INDEX idx_monthly_fees_due_date (due_date)
);

-- 4. PAYMENTS TABLE (Payment Records)
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  monthly_fee_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method ENUM('cash', 'card', 'online', 'cheque') NOT NULL,
  transaction_id VARCHAR(100),
  notes TEXT,
  collected_by VARCHAR(36) NOT NULL, -- User ID who collected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (monthly_fee_id) REFERENCES monthly_fees(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (collected_by) REFERENCES users(id),
  INDEX idx_payments_monthly_fee (monthly_fee_id),
  INDEX idx_payments_student (student_id),
  INDEX idx_payments_date (payment_date),
  INDEX idx_payments_method (payment_method)
);

-- 5. INSERT FIXED COURSE FEES
INSERT IGNORE INTO courses (id, name, monthly_fee, description) VALUES
(UUID(), 'Karate', 2000.00, 'Traditional Karate training program'),
(UUID(), 'Bharatanatyam', 1500.00, 'Classical Indian dance form'),
(UUID(), 'Yoga', 1000.00, 'Yoga and meditation classes');

-- 6. STORED PROCEDURE: Auto-Generate Monthly Fees
DELIMITER //
CREATE PROCEDURE GenerateMonthlyFees(IN target_month DATE)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_student_id VARCHAR(36);
    DECLARE v_total_fee DECIMAL(10,2);
    DECLARE v_due_date DATE;
    
    -- Cursor to get active students and their total monthly fees
    DECLARE student_cursor CURSOR FOR
        SELECT 
            s.id as student_id,
            SUM(c.monthly_fee) as total_fee
        FROM students s
        JOIN student_courses sc ON s.id = sc.student_id AND sc.is_active = TRUE
        JOIN courses c ON sc.course_id = c.id AND c.is_active = TRUE
        WHERE s.status = 'active'
        GROUP BY s.id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Set due date to 5th of the month
    SET v_due_date = DATE_ADD(target_month, INTERVAL 4 DAY);
    
    OPEN student_cursor;
    
    read_loop: LOOP
        FETCH student_cursor INTO v_student_id, v_total_fee;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Insert monthly fee if not exists
        INSERT IGNORE INTO monthly_fees (id, student_id, fee_month, total_amount, due_date)
        VALUES (UUID(), v_student_id, target_month, v_total_fee, v_due_date);
        
    END LOOP;
    
    CLOSE student_cursor;
END //
DELIMITER ;

-- 7. FUNCTION: Calculate Student Monthly Fee
DELIMITER //
CREATE FUNCTION GetStudentMonthlyFee(p_student_id VARCHAR(36)) 
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total_fee DECIMAL(10,2) DEFAULT 0.00;
    
    SELECT COALESCE(SUM(c.monthly_fee), 0.00) INTO total_fee
    FROM student_courses sc
    JOIN courses c ON sc.course_id = c.id
    WHERE sc.student_id = p_student_id 
      AND sc.is_active = TRUE 
      AND c.is_active = TRUE;
    
    RETURN total_fee;
END //
DELIMITER ;

-- 8. TRIGGER: Update Monthly Fee Status on Payment
DELIMITER //
CREATE TRIGGER UpdateFeeStatusOnPayment
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(10,2);
    DECLARE fee_amount DECIMAL(10,2);
    
    -- Get total amount paid for this monthly fee
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments 
    WHERE monthly_fee_id = NEW.monthly_fee_id;
    
    -- Get the fee amount
    SELECT total_amount INTO fee_amount
    FROM monthly_fees 
    WHERE id = NEW.monthly_fee_id;
    
    -- Update status based on payment
    IF total_paid >= fee_amount THEN
        UPDATE monthly_fees 
        SET status = 'paid', updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.monthly_fee_id;
    END IF;
END //
DELIMITER ;

-- 9. TRIGGER: Update Overdue Status Daily
DELIMITER //
CREATE EVENT UpdateOverdueFees
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    UPDATE monthly_fees 
    SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'pending' 
      AND due_date < CURDATE();
END //
DELIMITER ;

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;