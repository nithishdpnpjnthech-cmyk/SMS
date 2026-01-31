import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function cleanupDatabase() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'academy_management',
      multipleStatements: true
    });

    console.log('Connected to database...');

    // 1. Clear all existing batches and create only 3 required ones
    console.log('Cleaning up batches...');
    await connection.execute('DELETE FROM batches');
    await connection.execute(`
      INSERT INTO batches (id, name, is_active, created_at) VALUES 
      (UUID(), 'Morning', TRUE, NOW()),
      (UUID(), 'Evening', TRUE, NOW()),
      (UUID(), 'Weekends', TRUE, NOW())
    `);

    // 2. Clear any mock/test data from students table
    console.log('Cleaning up mock student data...');
    await connection.execute(`
      DELETE FROM students 
      WHERE name LIKE '%Test%' OR name LIKE '%Mock%' OR name LIKE '%Sample%' 
      OR name LIKE '%Demo%' OR name LIKE '%Example%'
    `);

    // 3. Clear orphaned attendance data
    console.log('Cleaning up orphaned attendance data...');
    await connection.execute('DELETE FROM attendance WHERE student_id NOT IN (SELECT id FROM students)');

    // 4. Clear orphaned fees data
    console.log('Cleaning up orphaned fees data...');
    await connection.execute('DELETE FROM fees WHERE student_id NOT IN (SELECT id FROM students)');

    // 5. Clear mock programs
    console.log('Cleaning up mock programs...');
    await connection.execute(`
      DELETE FROM programs 
      WHERE name LIKE '%Test%' OR name LIKE '%Mock%' OR name LIKE '%Sample%'
      OR name LIKE '%Demo%' OR name LIKE '%Example%'
    `);

    // 6. Clean up orphaned student_programs relationships
    console.log('Cleaning up orphaned relationships...');
    await connection.execute('DELETE FROM student_programs WHERE student_id NOT IN (SELECT id FROM students)');
    await connection.execute('DELETE FROM student_programs WHERE program_id NOT IN (SELECT id FROM programs)');

    // 7. Verify the cleanup
    console.log('\n=== CLEANUP RESULTS ===');
    const [batches] = await connection.execute('SELECT COUNT(*) as count FROM batches');
    console.log(`Batches: ${batches[0].count}`);
    
    const [students] = await connection.execute('SELECT COUNT(*) as count FROM students WHERE status = "active"');
    console.log(`Active Students: ${students[0].count}`);
    
    const [programs] = await connection.execute('SELECT COUNT(*) as count FROM programs WHERE is_active = TRUE');
    console.log(`Active Programs: ${programs[0].count}`);
    
    const [attendance] = await connection.execute('SELECT COUNT(*) as count FROM attendance');
    console.log(`Attendance Records: ${attendance[0].count}`);
    
    const [fees] = await connection.execute('SELECT COUNT(*) as count FROM fees');
    console.log(`Fee Records: ${fees[0].count}`);

    // Show batch names
    const [batchNames] = await connection.execute('SELECT name FROM batches ORDER BY name');
    console.log('\nAvailable Batches:');
    batchNames.forEach(batch => console.log(`- ${batch.name}`));

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('Only real data remains. Mock data has been removed.');
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the cleanup
cleanupDatabase();