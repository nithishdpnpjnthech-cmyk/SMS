/**
 * COMPREHENSIVE STUDENT AUTHENTICATION FIX
 * 
 * This file contains all the fixes needed for proper student authentication:
 * 1. Database schema updates
 * 2. Password hashing with bcrypt
 * 3. Admin student creation with proper password setup
 * 4. Student login with bcrypt verification
 * 5. Data migration for existing students
 * 6. Security improvements
 */

import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

// SALT ROUNDS for bcrypt (industry standard)
const SALT_ROUNDS = 10;

/**
 * 1. DATABASE SCHEMA UPDATES
 * Add password_hash column to students table
 */
export const createStudentPasswordSchema = `
  ALTER TABLE students 
  ADD COLUMN password_hash VARCHAR(255) NULL,
  ADD COLUMN role VARCHAR(20) DEFAULT 'STUDENT',
  ADD COLUMN last_login TIMESTAMP NULL,
  ADD COLUMN login_attempts INT DEFAULT 0,
  ADD COLUMN locked_until TIMESTAMP NULL;
`;

/**
 * 2. GENERATE DEFAULT PASSWORD
 * Creates password from first 5 letters of student name
 */
export function generateDefaultPassword(studentName: string): string {
  if (!studentName || typeof studentName !== 'string') {
    throw new Error('Student name is required for password generation');
  }
  
  // Extract first 5 letters, lowercase, trimmed
  const password = studentName
    .replace(/[^a-zA-Z]/g, '') // Remove non-alphabetic characters
    .substring(0, 5)
    .toLowerCase()
    .trim();
    
  if (password.length === 0) {
    throw new Error('Cannot generate password: student name contains no letters');
  }
  
  return password;
}

/**
 * 3. HASH PASSWORD SECURELY
 * Uses bcrypt with proper salt rounds
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password is required for hashing');
  }
  
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * 4. VERIFY PASSWORD SECURELY
 * Uses bcrypt.compare for timing-attack resistant comparison
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  if (!plainPassword || !hashedPassword) {
    return false;
  }
  
  try {
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    return isValid;
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

/**
 * 5. ADMIN STUDENT CREATION WITH PROPER PASSWORD
 * Enhanced student creation that sets up authentication
 */
export async function createStudentWithAuth(storage: any, studentData: any): Promise<any> {
  // Validate required fields
  if (!studentData.name || !studentData.name.trim()) {
    throw new Error('Student name is required');
  }
  
  // Generate default password
  const defaultPassword = generateDefaultPassword(studentData.name);
  
  // Hash the password
  const passwordHash = await hashPassword(defaultPassword);
  
  // Create student with password hash
  const studentId = randomUUID();
  const now = new Date();
  
  await storage.query(`
    INSERT INTO students 
    (id, name, email, phone, parent_phone, address, branch_id, batch_id, 
     program, batch, joining_date, status, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    studentId,
    studentData.name,
    studentData.email || null,
    studentData.phone || null,
    studentData.parentPhone || null,
    studentData.address || null,
    studentData.branchId,
    studentData.batchId || null,
    studentData.program || null,
    studentData.batch || null,
    studentData.joiningDate || now,
    studentData.status || 'active',
    passwordHash,
    'STUDENT',
    now
  ]);
  
  return {
    id: studentId,
    name: studentData.name,
    defaultPassword: defaultPassword, // Return for admin reference
    ...studentData
  };
}

/**
 * 6. SECURE STUDENT LOGIN
 * Enhanced login with bcrypt verification and security features
 */
export async function authenticateStudent(storage: any, username: string, password: string): Promise<any> {
  // Input validation
  if (!username || !password) {
    throw new Error('Username and password are required');
  }
  
  // Sanitize username for logging
  const sanitizedUsername = username.replace(/[\r\n]/g, '');
  console.log('Student login attempt for:', sanitizedUsername);
  
  // Find student by ID, email, or phone
  const students = await storage.query(`
    SELECT 
      s.id,
      s.name,
      s.email,
      s.phone,
      s.branch_id,
      s.password_hash,
      s.status,
      s.role,
      s.login_attempts,
      s.locked_until,
      b.name as branch_name
    FROM students s
    LEFT JOIN branches b ON s.branch_id = b.id
    WHERE (s.id = ? OR s.email = ? OR s.phone = ?) 
    AND s.status = 'active'
    LIMIT 1
  `, [username, username, username]);
  
  if (!students.length) {
    console.log('Student not found:', sanitizedUsername);
    throw new Error('Student not found. Please login using email, phone number, or full student ID.');
  }
  
  const student = students[0];
  
  // Check if account is locked
  if (student.locked_until && new Date() < new Date(student.locked_until)) {
    throw new Error('Account is temporarily locked. Please try again later.');
  }
  
  // Verify password
  let isPasswordValid = false;
  
  if (student.password_hash) {
    // Use bcrypt for hashed passwords
    isPasswordValid = await verifyPassword(password, student.password_hash);
  } else {
    // Fallback for legacy students without hashed passwords
    const expectedPassword = generateDefaultPassword(student.name);
    isPasswordValid = password.toLowerCase() === expectedPassword;
    
    // If login successful with legacy password, hash it for future use
    if (isPasswordValid) {
      const hashedPassword = await hashPassword(expectedPassword);
      await storage.query(
        'UPDATE students SET password_hash = ? WHERE id = ?',
        [hashedPassword, student.id]
      );
    }
  }
  
  if (!isPasswordValid) {
    // Increment login attempts
    const newAttempts = (student.login_attempts || 0) + 1;
    let lockUntil = null;
    
    // Lock account after 5 failed attempts for 15 minutes
    if (newAttempts >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }
    
    await storage.query(
      'UPDATE students SET login_attempts = ?, locked_until = ? WHERE id = ?',
      [newAttempts, lockUntil, student.id]
    );
    
    console.log('Invalid password for student:', sanitizedUsername);
    throw new Error('Invalid password. Please check your password and try again.');
  }
  
  // Reset login attempts on successful login
  await storage.query(
    'UPDATE students SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
    [student.id]
  );
  
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    phone: student.phone,
    branchId: student.branch_id,
    branchName: student.branch_name,
    role: 'student'
  };
}

/**
 * 7. DATA MIGRATION FOR EXISTING STUDENTS
 * One-time migration to hash existing passwords
 */
export async function migrateExistingStudentPasswords(storage: any): Promise<void> {
  console.log('Starting student password migration...');
  
  // Get all students without password_hash
  const students = await storage.query(`
    SELECT id, name, password_hash 
    FROM students 
    WHERE status = 'active' 
    AND (password_hash IS NULL OR password_hash = '')
  `);
  
  console.log(`Found ${students.length} students to migrate`);
  
  for (const student of students) {
    try {
      // Generate default password
      const defaultPassword = generateDefaultPassword(student.name);
      
      // Hash the password
      const passwordHash = await hashPassword(defaultPassword);
      
      // Update student record
      await storage.query(
        'UPDATE students SET password_hash = ?, role = ? WHERE id = ?',
        [passwordHash, 'STUDENT', student.id]
      );
      
      console.log(`Migrated password for student: ${student.name}`);
    } catch (error) {
      console.error(`Failed to migrate password for student ${student.name}:`, error);
    }
  }
  
  console.log('Student password migration completed');
}

/**
 * 8. RATE LIMITING FOR LOGIN ATTEMPTS
 * Simple in-memory rate limiting (use Redis in production)
 */
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = identifier.toLowerCase();
  const attempts = loginAttempts.get(key);
  
  if (!attempts || now > attempts.resetTime) {
    // Reset or initialize
    loginAttempts.set(key, { count: 1, resetTime: now + 15 * 60 * 1000 }); // 15 minutes
    return true;
  }
  
  if (attempts.count >= 10) {
    return false; // Rate limited
  }
  
  attempts.count++;
  return true;
}

/**
 * 9. SECURITY UTILITIES
 */
export function sanitizeForLog(input: string): string {
  return String(input || '').replace(/[\r\n\t]/g, '').substring(0, 100);
}

export function isValidStudentRole(student: any): boolean {
  return student && student.role === 'STUDENT' && student.status === 'active';
}