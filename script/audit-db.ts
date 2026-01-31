import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: "./server/.env" });

async function checkDB() {
    const config = {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || "sms",
        port: Number(process.env.DB_PORT) || 3306,
    };

    console.log("Connecting with:", { ...config, password: config.password ? "****" : "missing" });

    try {
        const connection = await mysql.createConnection(config);
        console.log("Connected successfully!");

        const [tables] = await connection.query("SHOW TABLES");
        console.log("Tables:", tables);

        const checkTables = ["students", "student_fees", "payments", "student_uniforms", "fees"];
        for (const table of checkTables) {
            try {
                const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`Table ${table} count:`, count);
            } catch (e: any) {
                console.log(`Table ${table} check failed: ${e.message}`);
            }
        }

        await connection.end();
    } catch (error) {
        console.error("Connection failed:", error);
    }
}

checkDB();
