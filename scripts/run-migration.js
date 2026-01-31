// Lightweight migration runner that uses dotenv and mysql2/promise
// Reads sql/create_missing_tables.sql and executes statements sequentially.

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SQL_FILE = path.resolve(process.cwd(), 'sql', 'create_missing_tables.sql');

async function run() {
  if (!fs.existsSync(SQL_FILE)) {
    console.error('Migration file not found:', SQL_FILE);
    process.exit(1);
  }

  const raw = fs.readFileSync(SQL_FILE, 'utf8');
  // remove /* ... */ comments
  let cleaned = raw.replace(/\/\*[\s\S]*?\*\//g, '\n');
  // remove -- style comments
  cleaned = cleaned.split('\n').map(line => line.replace(/--.*/, '')).join('\n');

  // split on semicolon followed by optional newline/space
  const statements = cleaned
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sms',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    multipleStatements: false,
  };

  console.log('Connecting to DB', config.user, config.host, config.database ? config.database : '(no db)');

  const conn = await mysql.createConnection(config);
  try {
    for (const stmt of statements) {
      // some statements may have trailing semicolons removed; ensure they are valid
      console.log('Running statement:', stmt.split('\n')[0].slice(0, 150));
      try {
        await conn.query(stmt);
      } catch (e) {
        console.error('Statement failed:', e.message);
        console.error('Failing SQL (truncated):', stmt.slice(0, 500));
        throw e;
      }
    }

    console.log('Migration completed successfully.');
  } finally {
    await conn.end();
  }
}

run().catch(err => {
  console.error('Migration runner error:', err);
  process.exit(1);
});
