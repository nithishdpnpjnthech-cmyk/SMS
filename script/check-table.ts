
import { db } from "../server/db";

async function checkTable() {
    try {
        const columns = await db.query("DESCRIBE payments");
        console.log(columns);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkTable();
