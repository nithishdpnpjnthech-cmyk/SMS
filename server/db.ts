import mysql from 'mysql2/promise';

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
}

class Database {
  private pool: mysql.Pool;

  constructor() {
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sms',
      port: parseInt(process.env.DB_PORT || '3306'),
    };

    this.pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
    const results = await this.query<T>(sql, params);
    return results[0];
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new Database();