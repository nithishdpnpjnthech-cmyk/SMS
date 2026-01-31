
import { db } from "../server/db";

async function migrate() {
    console.log("Running safe migration for Fees Module...");

    // Fee Structures
    await db.query(`
    CREATE TABLE IF NOT EXISTS fee_structures (
      id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    console.log("Verified fee_structures");

    // Student Enrollments
    await db.query(`
    CREATE TABLE IF NOT EXISTS student_enrollments (
      id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
      student_id VARCHAR(255) NOT NULL,
      fee_structure_id VARCHAR(255) NOT NULL,
      start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);

    try {
        await db.query(`CREATE INDEX idx_enrollment_student ON student_enrollments(student_id)`);
    } catch (e: any) {
        if (e.code !== 'ER_DUP_KEYNAME') console.log("Index idx_enrollment_student check: " + e.message);
    }
    console.log("Verified student_enrollments");

    // Student Fees (Monthly)
    await db.query(`
    CREATE TABLE IF NOT EXISTS student_fees (
      id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
      student_id VARCHAR(255) NOT NULL,
      enrollment_id VARCHAR(255),
      month INT NOT NULL,
      year INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      paid_amount DECIMAL(10, 2) DEFAULT 0.00,
      status VARCHAR(50) DEFAULT 'pending',
      due_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);
    try {
        await db.query(`CREATE INDEX idx_student_fees_student ON student_fees(student_id)`);
    } catch (e: any) {
        if (e.code !== 'ER_DUP_KEYNAME') console.log("Index idx_student_fees_student check: " + e.message);
    }
    try {
        await db.query(`CREATE INDEX idx_student_fees_month_year ON student_fees(month, year)`);
    } catch (e: any) {
        if (e.code !== 'ER_DUP_KEYNAME') console.log("Index idx_student_fees_month_year check: " + e.message);
    }
    console.log("Verified student_fees");

    // Payments
    await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
      student_id VARCHAR(255) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      payment_method VARCHAR(50) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);
    try {
        await db.query(`CREATE INDEX idx_payments_student ON payments(student_id)`);
    } catch (e: any) {
        if (e.code !== 'ER_DUP_KEYNAME') console.log("Index idx_payments_student check: " + e.message);
    }
    console.log("Verified payments");

    console.log("Migration complete.");
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
