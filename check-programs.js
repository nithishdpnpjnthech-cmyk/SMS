const mysql = require('mysql2/promise');

async function checkPrograms() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'academy_db'
  });

  try {
    console.log('=== CURRENT PROGRAMS IN DATABASE ===');
    const [programs] = await connection.execute('SELECT * FROM programs ORDER BY created_at');
    console.table(programs);
    
    console.log('\n=== ACTIVE PROGRAMS ONLY ===');
    const [activePrograms] = await connection.execute('SELECT * FROM programs WHERE is_active = true ORDER BY name');
    console.table(activePrograms);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkPrograms();