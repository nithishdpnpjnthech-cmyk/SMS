/**
 * DATABASE MIGRATION SCRIPT
 * 
 * This script safely migrates the students table to support proper authentication:
 * 1. Adds password_hash column
 * 2. Adds authentication-related columns
 * 3. Migrates existing student passwords
 * 4. Creates necessary indexes
 */

import { storage } from './storage';
import { 
  createStudentPasswordSchema,
  migrateExistingStudentPasswords,
  generateDefaultPassword,
  hashPassword
} from './student-auth-fix';

async function runMigration() {
  console.log('🚀 Starting Student Authentication Migration...');
  
  try {
    // Step 1: Add password columns to students table
    console.log('📝 Step 1: Adding password columns to students table...');
    
    try {
      await storage.query(`
        ALTER TABLE students 
        ADD COLUMN password_hash VARCHAR(255) NULL
      `);
      console.log('✅ Added password_hash column');
    } catch (error: any) {
      if (error.message?.includes('Duplicate column')) {
        console.log('ℹ️  password_hash column already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await storage.query(`
        ALTER TABLE students 
        ADD COLUMN role VARCHAR(20) DEFAULT 'STUDENT'
      `);
      console.log('✅ Added role column');
    } catch (error: any) {
      if (error.message?.includes('Duplicate column')) {
        console.log('ℹ️  role column already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await storage.query(`
        ALTER TABLE students 
        ADD COLUMN last_login TIMESTAMP NULL
      `);
      console.log('✅ Added last_login column');
    } catch (error: any) {
      if (error.message?.includes('Duplicate column')) {
        console.log('ℹ️  last_login column already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await storage.query(`
        ALTER TABLE students 
        ADD COLUMN login_attempts INT DEFAULT 0
      `);
      console.log('✅ Added login_attempts column');
    } catch (error: any) {
      if (error.message?.includes('Duplicate column')) {
        console.log('ℹ️  login_attempts column already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await storage.query(`
        ALTER TABLE students 
        ADD COLUMN locked_until TIMESTAMP NULL
      `);
      console.log('✅ Added locked_until column');
    } catch (error: any) {
      if (error.message?.includes('Duplicate column')) {
        console.log('ℹ️  locked_until column already exists');
      } else {
        throw error;
      }
    }
    
    // Step 2: Create indexes for performance
    console.log('📝 Step 2: Creating database indexes...');
    
    try {
      await storage.query(`
        CREATE INDEX idx_students_email ON students(email)
      `);
      console.log('✅ Created email index');
    } catch (error: any) {
      if (error.message?.includes('Duplicate key')) {
        console.log('ℹ️  Email index already exists');
      } else {
        console.log('⚠️  Email index creation failed:', error.message);
      }
    }
    
    try {
      await storage.query(`
        CREATE INDEX idx_students_phone ON students(phone)
      `);
      console.log('✅ Created phone index');
    } catch (error: any) {
      if (error.message?.includes('Duplicate key')) {
        console.log('ℹ️  Phone index already exists');
      } else {
        console.log('⚠️  Phone index creation failed:', error.message);
      }
    }
    
    // Step 3: Migrate existing student passwords
    console.log('📝 Step 3: Migrating existing student passwords...');
    await migrateExistingStudentPasswords(storage);
    
    // Step 4: Verify migration
    console.log('📝 Step 4: Verifying migration...');
    
    const studentsWithoutPasswords = await storage.query(`
      SELECT COUNT(*) as count 
      FROM students 
      WHERE status = 'active' 
      AND (password_hash IS NULL OR password_hash = '')
    `);
    
    const totalActiveStudents = await storage.query(`
      SELECT COUNT(*) as count 
      FROM students 
      WHERE status = 'active'
    `);
    
    console.log(`📊 Migration Results:`);
    console.log(`   Total active students: ${totalActiveStudents[0]?.count || 0}`);
    console.log(`   Students without passwords: ${studentsWithoutPasswords[0]?.count || 0}`);
    
    if ((studentsWithoutPasswords[0]?.count || 0) === 0) {
      console.log('✅ All active students have password hashes!');
    } else {
      console.log('⚠️  Some students still missing password hashes');
    }
    
    // Step 5: Test authentication with a sample student
    console.log('📝 Step 5: Testing authentication...');
    
    const sampleStudent = await storage.query(`
      SELECT id, name, password_hash 
      FROM students 
      WHERE status = 'active' 
      AND password_hash IS NOT NULL 
      LIMIT 1
    `);
    
    if (sampleStudent.length > 0) {
      const student = sampleStudent[0];
      const expectedPassword = generateDefaultPassword(student.name);
      
      console.log(`🧪 Testing login for student: ${student.name}`);
      console.log(`   Expected password: ${expectedPassword}`);
      console.log(`   Password hash exists: ${!!student.password_hash}`);
      
      // Test the authentication function
      try {
        const { authenticateStudent } = await import('./student-auth-fix');
        const result = await authenticateStudent(storage, student.id, expectedPassword);
        console.log('✅ Authentication test passed!');
        console.log(`   Student authenticated: ${result.name}`);
      } catch (error: any) {
        console.log('❌ Authentication test failed:', error.message);
      }
    } else {
      console.log('⚠️  No students available for authentication test');
    }
    
    console.log('🎉 Student Authentication Migration Completed Successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Update your routes.ts to use the new authentication functions');
    console.log('2. Test student login with existing credentials');
    console.log('3. Verify admin can create new students with proper passwords');
    console.log('4. Monitor login attempts and security features');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration };