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

  // ============= USERS =============
  async getUser(id: string): Promise<User | undefined> {
    try {
      return await db.queryOne<User>("SELECT * FROM users WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log("Searching for user:", username);
      const result = await db.queryOne<User>("SELECT * FROM users WHERE username = ?", [username]);
      console.log("Database result:", result);
      return result;
    } catch (error) {
      console.error("Database error in getUserByUsername:", error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const id = randomUUID();
      const now = new Date();

      await db.query(
        `INSERT INTO users (id, username, password, role, email, name, branchId, createdAt) 
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
        branchId: insertUser.branchId || null,
        createdAt: now
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // ============= STUDENTS =============
  async getStudents(branchId?: string): Promise<Student[]> {
    try {
      if (branchId) {
        return await db.query<Student>(
          "SELECT * FROM students WHERE branchId = ? ORDER BY createdAt DESC",
          [branchId]
        );
      }
      return await db.query<Student>("SELECT * FROM students ORDER BY createdAt DESC");
    } catch (error) {
      console.error("Error getting students:", error);
      throw error;
    }
  }

  async getStudent(id: string): Promise<Student | undefined> {
    try {
      return await db.queryOne<Student>("SELECT * FROM students WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error getting student:", error);
      throw error;
    }
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    try {
      const id = randomUUID();
      const now = new Date();

      console.log("Creating student with data:", insertStudent);

      await db.query(
        `INSERT INTO students (id, name, email, phone, parentPhone, address, branchId, program, batch, joiningDate, status, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          insertStudent.name,
          insertStudent.email || null,
          insertStudent.phone || null,
          insertStudent.parentPhone || null,
          insertStudent.address || null,
          insertStudent.branchId,
          insertStudent.program || null,
          insertStudent.batch || null,
          insertStudent.joiningDate || now,
          insertStudent.status || "active",
          now
        ]
      );

      const student = {
        id,
        name: insertStudent.name,
        email: insertStudent.email || null,
        phone: insertStudent.phone || null,
        parentPhone: insertStudent.parentPhone || null,
        address: insertStudent.address || null,
        branchId: insertStudent.branchId,
        program: insertStudent.program || null,
        batch: insertStudent.batch || null,
        joiningDate: insertStudent.joiningDate || now,
        status: insertStudent.status || "active",
        createdAt: now
      };

      console.log("Student created successfully:", student);
      return student;
    } catch (error) {
      console.error("Error creating student:", error);
      throw error;
    }
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      for (const [key, value] of Object.entries(updates)) {
        if (key !== "id" && key !== "createdAt") {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        return await this.getStudent(id);
      }

      values.push(id);
      await db.query(`UPDATE students SET ${fields.join(", ")} WHERE id = ?`, values);
      return await this.getStudent(id);
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  }

  // ============= BRANCHES =============
  async getBranches(): Promise<Branch[]> {
    try {
      return await db.query<Branch>("SELECT * FROM branches ORDER BY createdAt DESC");
    } catch (error) {
      console.error("Error getting branches:", error);
      throw error;
    }
  }

  async createBranch(insertBranch: InsertBranch): Promise<Branch> {
    try {
      const id = randomUUID();
      const now = new Date();

      await db.query(
        `INSERT INTO branches (id, name, address, phone, managerId, createdAt)
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
        managerId: insertBranch.managerId || null,
        createdAt: now
      };
    } catch (error) {
      console.error("Error creating branch:", error);
      throw error;
    }
  }

  // ============= TRAINERS =============
  async getTrainers(branchId?: string): Promise<Trainer[]> {
    try {
      if (branchId) {
        return await db.query<Trainer>(
          "SELECT * FROM trainers WHERE branchId = ? ORDER BY createdAt DESC",
          [branchId]
        );
      }
      return await db.query<Trainer>("SELECT * FROM trainers ORDER BY createdAt DESC");
    } catch (error) {
      console.error("Error getting trainers:", error);
      throw error;
    }
  }

  async createTrainer(insertTrainer: InsertTrainer): Promise<Trainer> {
    try {
      const id = randomUUID();
      const now = new Date();

      await db.query(
        `INSERT INTO trainers (id, name, email, phone, specialization, branchId, userId, createdAt)
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
        branchId: insertTrainer.branchId,
        userId: insertTrainer.userId || null,
        createdAt: now
      };
    } catch (error) {
      console.error("Error creating trainer:", error);
      throw error;
    }
  }

  // ============= ATTENDANCE =============
  async getAttendance(studentId?: string, date?: Date): Promise<Attendance[]> {
    try {
      let sql = "SELECT * FROM attendance WHERE 1=1";
      const params: any[] = [];

      if (studentId) {
        sql += " AND studentId = ?";
        params.push(studentId);
      }

      if (date) {
        sql += " AND DATE(date) = DATE(?)";
        params.push(date);
      }

      sql += " ORDER BY date DESC";
      return await db.query<Attendance>(sql, params);
    } catch (error) {
      console.error("Error getting attendance:", error);
      throw error;
    }
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    try {
      const id = randomUUID();
      const now = new Date();

      await db.query(
        `INSERT INTO attendance (id, studentId, date, status, checkIn, checkOut, notes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          insertAttendance.studentId,
          insertAttendance.date,
          insertAttendance.status,
          insertAttendance.checkIn || null,
          insertAttendance.checkOut || null,
          insertAttendance.notes || null,
          now
        ]
      );

      return {
        id,
        studentId: insertAttendance.studentId,
        date: insertAttendance.date,
        status: insertAttendance.status,
        checkIn: insertAttendance.checkIn || null,
        checkOut: insertAttendance.checkOut || null,
        notes: insertAttendance.notes || null,
        createdAt: now
      };
    } catch (error) {
      console.error("Error creating attendance:", error);
      throw error;
    }
  }

  // ============= FEES =============
  async getFees(studentId?: string): Promise<Fee[]> {
    try {
      if (studentId) {
        return await db.query<Fee>(
          "SELECT * FROM fees WHERE studentId = ? ORDER BY dueDate DESC",
          [studentId]
        );
      }
      return await db.query<Fee>("SELECT * FROM fees ORDER BY dueDate DESC");
    } catch (error) {
      console.error("Error getting fees:", error);
      throw error;
    }
  }

  async createFee(insertFee: InsertFee): Promise<Fee> {
    try {
      const id = randomUUID();
      const now = new Date();

      await db.query(
        `INSERT INTO fees (id, studentId, amount, dueDate, paidDate, status, paymentMethod, notes, createdAt)
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

      return {
        id,
        studentId: insertFee.studentId,
        amount: insertFee.amount,
        dueDate: insertFee.dueDate,
        paidDate: insertFee.paidDate || null,
        status: insertFee.status || "pending",
        paymentMethod: insertFee.paymentMethod || null,
        notes: insertFee.notes || null,
        createdAt: now
      };
    } catch (error) {
      console.error("Error creating fee:", error);
      throw error;
    }
  }

  async updateFee(id: string, updates: Partial<Fee>): Promise<Fee | undefined> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      for (const [key, value] of Object.entries(updates)) {
        if (key !== "id" && key !== "createdAt") {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        return await db.queryOne<Fee>("SELECT * FROM fees WHERE id = ?", [id]);
      }

      values.push(id);
      await db.query(`UPDATE fees SET ${fields.join(", ")} WHERE id = ?`, values);
      return await db.queryOne<Fee>("SELECT * FROM fees WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error updating fee:", error);
      throw error;
    }
  }
}