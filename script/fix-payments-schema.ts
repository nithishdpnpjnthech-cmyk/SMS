
import { db } from "../server/db";

async function fixSchema() {
    console.log("Fixing payments table schema...");
    try {
        await db.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        await db.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT");
        console.log("Fixed payments table.");
    } catch (e) {
        // try catch for older mysql that might not support ADD COLUMN IF NOT EXISTS (MariaDB 10.2+)
        try {
            await db.query("ALTER TABLE payments ADD COLUMN payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
            console.log("Added payment_date");
        } catch (e: any) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log("payment_date exists or error: " + e.message);
        }
        try {
            await db.query("ALTER TABLE payments ADD COLUMN notes TEXT");
            console.log("Added notes");
        } catch (e: any) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log("notes exists or error: " + e.message);
        }
    }
    process.exit(0);
}

fixSchema();
