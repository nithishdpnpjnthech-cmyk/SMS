import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"), // admin, manager, receptionist, trainer
  email: text("email"),
  name: text("name"),
  branchId: varchar("branch_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  managerId: varchar("manager_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  parentPhone: text("parent_phone"),
  guardianName: varchar("guardian_name", { length: 100 }), // New field
  address: text("address"),
  branchId: varchar("branch_id").notNull(),
  program: text("program"), // Legacy field - kept for compatibility
  batch: text("batch"), // Legacy field - kept for compatibility
  batchId: varchar("batch_id"), // New field for proper batch relationship
  uniformIssued: boolean("uniform_issued").default(false), // New field
  uniformSize: text("uniform_size"), // New field - ENUM('XS','S','M','L','XL','XXL','XXXL')
  joiningDate: timestamp("joining_date").defaultNow(),
  status: text("status").default("active"), // active, inactive, suspended
  createdAt: timestamp("created_at").defaultNow(),
});

export const trainers = pgTable("trainers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  specialization: text("specialization"),
  branchId: varchar("branch_id").notNull(),
  userId: varchar("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull(), // present, absent (late is handled by is_late flag)
  isLate: boolean("is_late").default(false), // New field for late attendance
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fees = pgTable("fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  status: text("status").default("pending"), // pending, paid, overdue
  paymentMethod: text("payment_method"), // cash, card, online
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// NEW FEES MODULE TABLES

export const feeStructures = pgTable("fee_structures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Karate, Yoga, etc.
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studentEnrollments = pgTable("student_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  feeStructureId: varchar("fee_structure_id").notNull(), // Activity they are enrolled in
  startDate: timestamp("start_date").defaultNow(),
  status: text("status").default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
});

export const studentFees = pgTable("student_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  enrollmentId: varchar("enrollment_id"),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status").default("pending"), // pending, partial, paid
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").defaultNow(),
  paymentMethod: text("payment_method").notNull(), // cash, card, online, cheque
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports
export const insertUserSchema = createInsertSchema(users);
export const insertBranchSchema = createInsertSchema(branches);
export const insertStudentSchema = createInsertSchema(students).extend({
  programs: z.array(z.string()).optional(),
});
export const insertTrainerSchema = createInsertSchema(trainers);
export const insertAttendanceSchema = createInsertSchema(attendance);
export const insertFeeSchema = createInsertSchema(fees);

export const insertFeeStructureSchema = createInsertSchema(feeStructures);
export const insertStudentEnrollmentSchema = createInsertSchema(studentEnrollments);
export const insertStudentFeeSchema = createInsertSchema(studentFees);
export const insertPaymentSchema = createInsertSchema(payments);

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Trainer = typeof trainers.$inferSelect;
export type InsertTrainer = z.infer<typeof insertTrainerSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Fee = typeof fees.$inferSelect;
export type InsertFee = z.infer<typeof insertFeeSchema>;

export type FeeStructure = typeof feeStructures.$inferSelect;
export type StudentEnrollment = typeof studentEnrollments.$inferSelect;
export type StudentFee = typeof studentFees.$inferSelect;
export type Payment = typeof payments.$inferSelect;
