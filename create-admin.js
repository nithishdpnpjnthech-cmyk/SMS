// Quick script to create default admin user
import { db } from './server/db.js';
import { randomUUID } from 'crypto';

async function createAdmin() {
  try {
    // Create users table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager', 'receptionist', 'trainer') DEFAULT 'admin',
        email VARCHAR(100),
        name VARCHAR(100),
        branch_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if admin already exists
    const existing = await db.queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
    if (existing) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const id = randomUUID();
    await db.query(
      'INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)',
      [id, 'admin', 'admin', 'admin', 'Administrator']
    );

    console.log('✅ Admin user created: username=admin, password=admin');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await db.close();
  }
}

createAdmin();