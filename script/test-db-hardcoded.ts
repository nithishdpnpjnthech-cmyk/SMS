import mysql from "mysql2/promise";

async function checkDB() {
    const config = {
        host: "localhost",
        user: "root",
        password: "KAMAKSHI@@dk",
        database: "sms",
        port: 3306,
    };

    console.log("Connecting with hardcoded config...");

    try {
        const connection = await mysql.createConnection(config);
        console.log("Connected successfully!");
        const [rows]: any = await connection.query("SELECT DATABASE()");
        console.log("Current DB:", rows[0]);
        await connection.end();
    } catch (error) {
        console.error("Connection failed:", error);
    }
}

checkDB();
