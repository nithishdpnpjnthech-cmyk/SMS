
import { db } from "../server/db";

async function checkSchema() {
    try {
        console.log("Students Table:");
        console.table(await db.query("DESCRIBE students"));

        console.log("\nStudent Enrollments Table:");
        console.table(await db.query("DESCRIBE student_enrollments"));

        console.log("\nFee Structures Table:");
        console.table(await db.query("DESCRIBE fee_structures"));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkSchema();
