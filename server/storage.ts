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
  // Convenience: return first row or undefined
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined>;

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
  getTrainer(id: string): Promise<Trainer | undefined>;
  createTrainer(trainer: InsertTrainer): Promise<Trainer>;
  updateTrainer(id: string, trainer: Partial<Trainer>): Promise<Trainer | undefined>;
  deleteTrainer(id: string): Promise<boolean>;
  getTrainerBatches(userId: string): Promise<any[]>;
  getStudentsByTrainerBatches(userId: string, branchId: string): Promise<any[]>;
  assignTrainerToBatch(userId: string, batchName: string, program: string): Promise<void>;

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
  // Fees Module
  getFeeStructures(): Promise<any[]>;
  getStudentEnrollments(studentId: string): Promise<any[]>;
  createStudentEnrollment(enrollment: any): Promise<any>;

  getStudentFees(studentId: string): Promise<any[]>;
  getStudentFee(id: string): Promise<any | undefined>;
  createStudentFee(fee: any): Promise<any>;
  updateStudentFee(id: string, updates: any): Promise<any | undefined>;

  createPayment(payment: any): Promise<any>;
  getPayments(studentId: string): Promise<any[]>;
}

/**
 * Single storage instance used by the entire app
 * This connects routes → MySQL
 */
export const storage = new MySQLStorage();
