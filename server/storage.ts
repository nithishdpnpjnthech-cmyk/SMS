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
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Students
  getStudents(branchId?: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<Student>): Promise<Student | undefined>;

  // Trainers
  getTrainers(branchId?: string): Promise<Trainer[]>;
  createTrainer(trainer: InsertTrainer): Promise<Trainer>;

  // Branches
  getBranches(): Promise<Branch[]>;
  createBranch(branch: InsertBranch): Promise<Branch>;

  // Attendance
  getAttendance(studentId?: string, date?: Date): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;

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
