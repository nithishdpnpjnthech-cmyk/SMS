import { randomUUID } from "crypto";
import { db } from "./db";
import { IStorage } from "./storage";
import type {
  User, InsertUser,
  Student, InsertStudent,
  Trainer, InsertTrainer,
  Branch, InsertBranch,
  Attendance, InsertAttendance,
  Fee, InsertFee
} from "@shared/schema";

export class MySQLStorage implements IStorage {
  // Raw query method
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return await db.query<T>(sql, params);
  }

  // Convenience: return first row or undefined
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
    return await db.queryOne<T>(sql, params);
  }

  // ============= USERS =============
  async getUser(id: string): Promise<User | undefined> {
    return await db.queryOne<User>("SELECT * FROM users WHERE id = ?", [id]);
  }

  async getUserByUsername(identifier: string): Promise<User | undefined> {
    return await db.queryOne<User>(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [identifier, identifier]
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();

    await db.query(
      `INSERT INTO users (id, username, password, role, email, name, branch_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        insertUser.username,
        insertUser.password,
        insertUser.role || "admin",
        insertUser.email || null,
        insertUser.name || null,
        insertUser.branchId || null,
        now
      ]
    );

    return {
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role || "admin",
      email: insertUser.email || null,
      name: insertUser.name || null,
      branch_id: insertUser.branchId || null,
      created_at: now
    } as any;
  }

  // ============= STUDENTS =============
  async getStudents(branchId?: string): Promise<Student[]> {
    if (branchId) {
      return await db.query<Student>(
        "SELECT * FROM students WHERE branch_id = ? AND status = 'active' ORDER BY created_at DESC",
        [branchId]
      );
    }
    return await db.query<Student>("SELECT * FROM students WHERE status = 'active' ORDER BY created_at DESC");
  }

  async getAllStudents(branchId?: string): Promise<Student[]> {
    if (branchId) {
      return await db.query<Student>(
        "SELECT * FROM students WHERE branch_id = ? ORDER BY created_at DESC",
        [branchId]
      );
    }
    return await db.query<Student>("SELECT * FROM students ORDER BY created_at DESC");
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return await db.queryOne<Student>("SELECT * FROM students WHERE id = ?", [id]);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const now = new Date();

    try {
      // Create student_programs table if it doesn't exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS student_programs (
          student_id VARCHAR(36) NOT NULL,
          program_id VARCHAR(36) NOT NULL,
          PRIMARY KEY (student_id, program_id),
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (program_id) REFERENCES programs(id)
        )
      `);

      // Add batch_id column to students table if it doesn't exist
      try {
        await db.query("ALTER TABLE students ADD COLUMN batch_id VARCHAR(36)");
      } catch (error) {
        // Column already exists, ignore error
      }

      // Get batch name for legacy program/batch columns
      let batchName = null;
      if (insertStudent.batchId) {
        const batch = await db.queryOne("SELECT name FROM batches WHERE id = ?", [insertStudent.batchId]);
        batchName = batch?.name || null;
      }

      // Get program names for legacy program column (comma-separated)
      let programNames = null;
      if (insertStudent.programs && insertStudent.programs.length > 0) {
        const programs = await db.query(
          `SELECT name FROM programs WHERE id IN (${insertStudent.programs.map(() => '?').join(',')})`,
          insertStudent.programs
        );
        programNames = programs.map((p: any) => p.name).join(', ');
      }

      // Insert student record
      await db.query(
        `INSERT INTO students
         (id, name, email, phone, parent_phone, guardian_name, address, branch_id, batch_id, program, batch, uniform_issued, uniform_size, joining_date, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          insertStudent.name,
          insertStudent.email || null,
          insertStudent.phone || null,
          insertStudent.parentPhone || null,
          insertStudent.guardianName || null,
          insertStudent.address || null,
          insertStudent.branchId,
          insertStudent.batchId || null,
          programNames,
          batchName,
          insertStudent.uniformIssued || false,
          insertStudent.uniformSize || null,
          insertStudent.joiningDate || now,
          insertStudent.status || "active",
          now
        ]
      );


      // Insert student-program relationships
      if (insertStudent.programs && insertStudent.programs.length > 0) {
        for (const programId of insertStudent.programs) {
          await db.query(
            "INSERT INTO student_programs (student_id, program_id) VALUES (?, ?)",
            [id, programId]
          );
        }

        // Systemic Fee Integrity: Auto-enroll in matching fee structures
        // Get program names again to match with fee structures
        const programs = await db.query(
          `SELECT name FROM programs WHERE id IN (${insertStudent.programs.map(() => '?').join(',')})`,
          insertStudent.programs
        );

        for (const prog of programs) {
          // Find fee structure with same name (case-insensitive)
          const feeStructure = await db.queryOne("SELECT id FROM fee_structures WHERE LOWER(name) = LOWER(?)", [(prog as any).name]);

          if (feeStructure) {
            console.log(`Auto-enrolling student ${id} in fee structure ${(prog as any).name}`);
            await this.createStudentEnrollment({
              studentId: id,
              feeStructureId: (feeStructure as any).id,
              startDate: now,
              status: 'active'
            });
          }
        }
      }


      return {
        id,
        name: insertStudent.name,
        email: insertStudent.email || null,
        phone: insertStudent.phone || null,
        parent_phone: insertStudent.parentPhone || null,
        guardian_name: insertStudent.guardianName || null,
        address: insertStudent.address || null,
        branch_id: insertStudent.branchId,
        batch_id: insertStudent.batchId || null,
        program: programNames,
        batch: batchName,
        uniform_issued: insertStudent.uniformIssued || false,
        uniform_size: insertStudent.uniformSize || null,
        joining_date: insertStudent.joiningDate || now,
        status: insertStudent.status || "active",
        created_at: now
      } as any;
    } catch (error) {
      console.error('Student creation error:', error);
      throw error;
    }
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const columnMap: Record<string, string> = {
      branchId: "branch_id",
      parentPhone: "parent_phone",
      guardianName: "guardian_name",
      uniformIssued: "uniform_issued",
      uniformSize: "uniform_size",
      joiningDate: "joining_date",
      createdAt: "created_at"
    };

    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key === "id") continue;
      const column = columnMap[key] || key;
      fields.push(`${column} = ?`);
      values.push(value);
    }

    if (!fields.length) return this.getStudent(id);

    values.push(id);
    await db.query(`UPDATE students SET ${fields.join(", ")} WHERE id = ?`, values);
    return this.getStudent(id);
  }

  async deleteStudent(id: string): Promise<boolean> {
    // Soft delete: Mark student as inactive instead of hard delete
    // This preserves historical data integrity for attendance and fees
    const result = await db.query(
      "UPDATE students SET status = 'inactive' WHERE id = ?",
      [id]
    );
    return (result as any).affectedRows > 0;
  }

  // ============= BRANCHES =============
  async getBranches(): Promise<Branch[]> {
    return await db.query<Branch>("SELECT * FROM branches ORDER BY created_at DESC");
  }

  async createBranch(insertBranch: InsertBranch): Promise<Branch> {
    const id = randomUUID();
    const now = new Date();

    await db.query(
      `INSERT INTO branches (id, name, address, phone, manager_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        insertBranch.name,
        insertBranch.address || null,
        insertBranch.phone || null,
        insertBranch.managerId || null,
        now
      ]
    );

    return {
      id,
      name: insertBranch.name,
      address: insertBranch.address || null,
      phone: insertBranch.phone || null,
      manager_id: insertBranch.managerId || null,
      created_at: now
    } as any;
  }

  // ============= TRAINERS =============
  async getTrainers(branchId?: string): Promise<Trainer[]> {
    if (branchId) {
      return await db.query<Trainer>(
        "SELECT * FROM trainers WHERE branch_id = ? ORDER BY created_at DESC",
        [branchId]
      );
    }
    return await db.query<Trainer>("SELECT * FROM trainers ORDER BY created_at DESC");
  }

  async getTrainer(id: string): Promise<Trainer | undefined> {
    const trainers = await db.query<Trainer>("SELECT * FROM trainers WHERE id = ?", [id]);
    return trainers[0];
  }

  async updateTrainer(id: string, updates: Partial<Trainer>): Promise<Trainer | undefined> {
    const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
    if (keys.length === 0) return this.getTrainer(id);

    const setClause = keys.map(k => `${k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)} = ?`).join(', ');
    const values = keys.map(k => (updates as any)[k]);

    await db.query(`UPDATE trainers SET ${setClause} WHERE id = ?`, [...values, id]);
    return this.getTrainer(id);
  }

  async createTrainer(insertTrainer: InsertTrainer): Promise<Trainer> {
    const id = randomUUID();
    const now = new Date();

    await db.query(
      `INSERT INTO trainers
       (id, name, email, phone, specialization, branch_id, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        insertTrainer.name,
        insertTrainer.email || null,
        insertTrainer.phone || null,
        insertTrainer.specialization || null,
        insertTrainer.branchId,
        insertTrainer.userId || null,
        now
      ]
    );

    return {
      id,
      name: insertTrainer.name,
      email: insertTrainer.email || null,
      phone: insertTrainer.phone || null,
      specialization: insertTrainer.specialization || null,
      branch_id: insertTrainer.branchId,
      user_id: insertTrainer.userId || null,
      created_at: now
    } as any;
  }

  async deleteTrainer(id: string): Promise<boolean> {
    const result = await db.query("DELETE FROM trainers WHERE id = ?", [id]);
    return (result as any).affectedRows > 0;
  }

  // ============= ATTENDANCE =============
  async getAttendance(studentId?: string, date?: Date): Promise<Attendance[]> {
    let sql = `
      SELECT 
        a.*,
        s.name as student_name,
        s.program,
        s.batch
      FROM attendance a
      LEFT JOIN students s ON a.student_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (studentId) {
      sql += " AND a.student_id = ?";
      params.push(studentId);
    }

    if (date) {
      sql += " AND DATE(a.date) = DATE(?)";
      params.push(date);
    }

    sql += " ORDER BY a.date DESC, s.name ASC";

    return await db.query<Attendance>(sql, params);
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = randomUUID();
    const now = new Date();

    await db.query(
      `INSERT INTO attendance
       (id, student_id, date, status, is_late, check_in, check_out, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        insertAttendance.studentId,
        insertAttendance.date,
        insertAttendance.status,
        insertAttendance.isLate || false,
        insertAttendance.checkIn || null,
        insertAttendance.checkOut || null,
        insertAttendance.notes || null,
        now
      ]
    );

    return { id, ...insertAttendance, created_at: now } as any;
  }

  async upsertAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    // Check if attendance already exists for this student and date
    const existing = await db.queryOne<Attendance>(
      "SELECT * FROM attendance WHERE student_id = ? AND DATE(date) = DATE(?)",
      [insertAttendance.studentId, insertAttendance.date]
    );

    if (existing) {
      // Update existing record
      await db.query(
        `UPDATE attendance SET 
         status = ?, is_late = ?, check_in = ?, check_out = ?, notes = ?
         WHERE id = ?`,
        [
          insertAttendance.status,
          insertAttendance.isLate || false,
          insertAttendance.checkIn || null,
          insertAttendance.checkOut || null,
          insertAttendance.notes || null,
          existing.id
        ]
      );

      return { ...existing, ...insertAttendance } as any;
    } else {
      // Create new record
      return this.createAttendance(insertAttendance);
    }
  }

  async updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance | undefined> {
    const columnMap: Record<string, string> = {
      studentId: "student_id",
      checkIn: "check_in",
      checkOut: "check_out",
      check_out: "check_out",  // Handle both camelCase and snake_case
      isLate: "is_late",
      createdAt: "created_at"
    };

    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key === "id") continue;
      const column = columnMap[key] || key;
      fields.push(`${column} = ?`);
      values.push(value);
    }

    if (!fields.length) {
      return await db.queryOne<Attendance>("SELECT * FROM attendance WHERE id = ?", [id]);
    }

    values.push(id);
    await db.query(`UPDATE attendance SET ${fields.join(", ")} WHERE id = ?`, values);
    return await db.queryOne<Attendance>("SELECT * FROM attendance WHERE id = ?", [id]);
  }

  // ============= FEES =============
  async getFees(studentId?: string): Promise<Fee[]> {
    let sql = `
      SELECT f.*, s.name as student_name
      FROM fees f
      LEFT JOIN students s ON f.student_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (studentId) {
      sql += " AND f.student_id = ?";
      params.push(studentId);
    }

    sql += " ORDER BY f.due_date DESC";

    const fees = await db.query<Fee>(sql, params);

    // Calculate overdue status
    const today = new Date();
    return fees.map(fee => ({
      ...fee,
      status: fee.status === 'pending' && new Date((fee as any).due_date) < today ? 'overdue' : fee.status
    }));
  }

  async createFee(insertFee: InsertFee): Promise<Fee> {
    const id = randomUUID();
    const now = new Date();

    await db.query(
      `INSERT INTO fees
       (id, student_id, amount, due_date, paid_date, status, payment_method, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        insertFee.studentId,
        insertFee.amount,
        insertFee.dueDate,
        insertFee.paidDate || null,
        insertFee.status || "pending",
        insertFee.paymentMethod || null,
        insertFee.notes || null,
        now
      ]
    );

    return { id, ...insertFee, created_at: now } as any;
  }

  async updateFee(id: string, updates: Partial<Fee>): Promise<Fee | undefined> {
    const columnMap: Record<string, string> = {
      paidDate: "paid_date",
      dueDate: "due_date",
      paymentMethod: "payment_method",
      createdAt: "created_at"
    };

    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key === "id") continue;
      const column = columnMap[key] || key;
      fields.push(`${column} = ?`);
      values.push(value);
    }

    if (!fields.length) {
      return await db.queryOne<Fee>("SELECT * FROM fees WHERE id = ?", [id]);
    }

    values.push(id);
    await db.query(`UPDATE fees SET ${fields.join(", ")} WHERE id = ?`, values);
    return await db.queryOne<Fee>("SELECT * FROM fees WHERE id = ?", [id]);
  }

  // ============= TRAINER BATCHES =============
  async getTrainerBatches(userId: string): Promise<any[]> {
    return await db.query(
      "SELECT * FROM trainer_batches WHERE trainer_id = ?",
      [userId]
    );
  }

  async assignTrainerToBatch(userId: string, batchName: string, program: string): Promise<void> {
    // Get batch_id from batch name
    const batch = await db.queryOne("SELECT id FROM batches WHERE LOWER(name) = LOWER(?)", [batchName]);
    if (!batch) {
      throw new Error(`Batch '${batchName}' not found`);
    }

    await db.query(
      `INSERT IGNORE INTO trainer_batches (trainer_id, batch_name, program)
       VALUES (?, ?, ?)`,
      [userId, batchName, program]
    );
  }

  async getStudentsByTrainerBatches(userId: string, branchId: string): Promise<Student[]> {
    return await db.query<Student>(
      `SELECT DISTINCT s.* FROM students s
       JOIN trainer_batches tb ON (
         (LOWER(TRIM(s.batch)) = LOWER(TRIM(tb.batch_name)) OR 
          EXISTS(SELECT 1 FROM batches b WHERE b.id = s.batch_id AND LOWER(TRIM(b.name)) = LOWER(TRIM(tb.batch_name))))
         AND LOWER(TRIM(s.program)) = LOWER(TRIM(tb.program))
       )
       WHERE tb.trainer_id = ? AND s.branch_id = ? AND s.status = 'active'
       ORDER BY s.name`,
      [userId, branchId]
    );
  }
  // ============= NEW FEES MODULE =============

  async getFeeStructures(): Promise<any[]> {
    return await db.query("SELECT * FROM fee_structures ORDER BY name");
  }

  async getStudentEnrollments(studentId: string): Promise<any[]> {
    return await db.query(`
      SELECT se.*, fs.name as fee_structure_name, fs.amount as monthly_amount
      FROM student_enrollments se
      JOIN fee_structures fs ON se.fee_structure_id = fs.id
      WHERE se.student_id = ? AND se.status = 'active'
    `, [studentId]);
  }

  async createStudentEnrollment(enrollment: any): Promise<any> {
    const id = randomUUID();
    const now = new Date();
    await db.query(`
      INSERT INTO student_enrollments (id, student_id, fee_structure_id, start_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, enrollment.studentId, enrollment.feeStructureId, enrollment.startDate || now, 'active', now]);
    return { id, ...enrollment };
  }

  async getStudentFees(studentId: string): Promise<any[]> {
    return await db.query(`
      SELECT sf.*, fs.name as fee_name
      FROM student_fees sf
      LEFT JOIN student_enrollments se ON sf.enrollment_id = se.id
      LEFT JOIN fee_structures fs ON se.fee_structure_id = fs.id
      WHERE sf.student_id = ?
      ORDER BY sf.year DESC, sf.month DESC
    `, [studentId]);
  }

  async getStudentFee(id: string): Promise<any | undefined> {
    return await db.queryOne("SELECT * FROM student_fees WHERE id = ?", [id]);
  }

  async createStudentFee(fee: any): Promise<any> {
    const id = randomUUID();
    const now = new Date();
    await db.query(`
      INSERT INTO student_fees (id, student_id, enrollment_id, month, year, amount, paid_amount, status, due_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      fee.studentId,
      fee.enrollmentId,
      fee.month,
      fee.year,
      fee.amount,
      fee.paidAmount || 0,
      fee.status || 'pending',
      fee.dueDate || null,
      now
    ]);
    return { id, ...fee };
  }

  async updateStudentFee(id: string, updates: any): Promise<any | undefined> {
    const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
    if (keys.length === 0) return this.getStudentFee(id);

    const columnMap: Record<string, string> = {
      paidAmount: "paid_amount",
      dueDate: "due_date",
    };

    const setClause = keys.map(k => `${columnMap[k] || k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);

    await db.query(`UPDATE student_fees SET ${setClause} WHERE id = ?`, [...values, id]);
    return this.getStudentFee(id);
  }

  async createPayment(payment: any): Promise<any> {
    const id = randomUUID();
    const now = new Date();
    await db.query(`
      INSERT INTO payments (id, student_id, amount, payment_date, payment_method, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      payment.studentId,
      payment.amount,
      payment.paymentDate || now,
      payment.paymentMethod,
      payment.notes || null,
      now
    ]);
    return { id, ...payment };
  }

  async getPayments(studentId: string): Promise<any[]> {
    return await db.query("SELECT * FROM payments WHERE student_id = ? ORDER BY payment_date DESC", [studentId]);
  }

  // ============= TRAINER ATTENDANCE (STUBS TO SATISFY INTERFACE) =============
  async ensureTrainerAttendanceTable(): Promise<void> {
    // Stub
  }
  async getTrainerOpenAttendance(trainerId: string): Promise<any | undefined> {
    return undefined;
  }
  async clockInTrainerAttendance(trainerId: string, payload: any): Promise<any> {
    throw new Error("Not implemented");
  }
  async clockOutTrainerAttendance(trainerId: string, notes?: string | null): Promise<any> {
    throw new Error("Not implemented");
  }
  async getTrainerAttendanceToday(trainerId: string): Promise<any[]> {
    return [];
  }
  async getTrainerAttendanceRange(trainerId: string, from: string, to: string, limit?: number, offset?: number): Promise<any[]> {
    return [];
  }
  async getTrainerAttendanceSummary(trainerId: string, from?: string, to?: string): Promise<any> {
    return {};
  }
}
