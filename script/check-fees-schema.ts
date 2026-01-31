
import { db } from "../server/db";

async function checkSchema() {
    console.log("🔍 Checking student_fees schema...");
    try {
        const rows = await db.query("DESCRIBE student_fees");
        console.log(rows);

        // Also check fee_structures to find Karate
        const structures = await db.query("SELECT * FROM fee_structures");
        console.log("\nFee Structures:", structures);

    } catch (e) {
        console.error(e);
    } finally {
        await db.close();
    }
}

checkSchema();
