import type {
  User,
  InsertUser,
  Student,
  InsertStudent,
  Trainer,
  InsertTrainer,
  Branch,
  InsertBranch,
  Attendance,
  InsertAttendance,
  Fee,
  InsertFee
} from "@shared/schema";

import { MySQLStorage } from "./mysql-storage";

/**
 * Storage interface
 * Defines all operations used by routes
 */
export interface IStorage {
  // Raw query method for custom queries
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Students
  getStudents(branchId?: string): Promise<Student[]>;
  getAllStudents(branchId?: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;

  // Trainers
  getTrainers(branchId?: string): Promise<Trainer[]>;
  createTrainer(trainer: InsertTrainer): Promise<Trainer>;
  deleteTrainer(id: string): Promise<boolean>;

  // Branches
  getBranches(): Promise<Branch[]>;
  createBranch(branch: InsertBranch): Promise<Branch>;

  // Attendance
  getAttendance(studentId?: string, date?: Date): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  upsertAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<Attendance>): Promise<Attendance | undefined>;

  // Fees
  getFees(studentId?: string): Promise<Fee[]>;
  createFee(fee: InsertFee): Promise<Fee>;
  updateFee(id: string, fee: Partial<Fee>): Promise<Fee | undefined>;
}

/**
 * Single storage instance used by the entire app
 * This connects routes → MySQL
 */
export const storage = new MySQLStorage();
