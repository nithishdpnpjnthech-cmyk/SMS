import mysql from "mysql2/promise";

async function listTrainers() {
    const config = {
        host: "localhost",
        user: "root",
        password: "KAMAKSHI@@dk",
        database: "sms",
        port: 3306,
    };

    try {
        const connection = await mysql.createConnection(config);
        const [users]: any = await connection.query("SELECT * FROM users WHERE role = 'trainer'");
        console.log("Trainers:", users.map((u: any) => ({ username: u.username, id: u.id })));
        await connection.end();
    } catch (error) {
        console.error("Failed to list trainers:", error);
    }
}

listTrainers();
