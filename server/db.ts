// 🔴 MUST BE FIRST — load env HERE
import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql2/promise";

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
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD as string, // 🔑 DO NOT DEFAULT TO EMPTY
      database: process.env.DB_NAME || "sms",
      port: Number(process.env.DB_PORT) || 3306,
    };

    // 🔍 TEMP DEBUG (REMOVE AFTER CONFIRMATION)
    console.log(
      "DB CONFIG CHECK →",
      config.user,
      config.password ? "PASSWORD_LOADED" : "PASSWORD_MISSING"
    );

    this.pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      // use `query` (simple protocol) instead of `execute` (prepared statements)
      // because some control commands like START TRANSACTION are not supported
      // by the prepared-statement protocol in mysql2. Using `query` lets us run
      // those statements and still pass parameters for normal queries.
      const [rows] = await this.pool.query(sql, params);
      return rows as T[];
    } catch (error) {
      // Improved error logging with SQL and parameters for easier debugging
      console.error("Database query error:", {
        message: (error as any).message,
        code: (error as any).code,
        sql: sql,
        params: params,
        stack: (error as any).stack
      });
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
