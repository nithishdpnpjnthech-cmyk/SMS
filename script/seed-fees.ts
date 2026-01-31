
import { db } from "../server/db";
import { randomUUID } from "crypto";

async function seedFees() {
    console.log("Seeding fee structures...");

    const fees = [
        { name: "Karate", amount: "2000.00", description: "Monthly Karate Fee" },
        { name: "Bharatnatyam", amount: "1500.00", description: "Monthly Bharatnatyam Fee" },
        { name: "Yoga", amount: "2000.00", description: "Monthly Yoga Fee" },
    ];

    for (const fee of fees) {
        const existing = await db.query("SELECT * FROM fee_structures WHERE name = ?", [fee.name]);

        if (existing.length === 0) {
            const id = randomUUID();
            await db.query(`
        INSERT INTO fee_structures (id, name, amount, description, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [id, fee.name, fee.amount, fee.description]);
            console.log(`Added ${fee.name}`);
        } else {
            console.log(`${fee.name} already exists`);
        }
    }

    console.log("Done!");
    process.exit(0);
}

seedFees().catch((err) => {
    console.error(err);
    process.exit(1);
});
