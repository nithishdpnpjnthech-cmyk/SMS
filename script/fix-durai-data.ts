
import { db } from "../server/db";

async function fixDuraiData() {
    console.log("🛠️ Fixing Durai Data...");

    try {
        // 1. Get IDs
        const students = await db.query("SELECT id FROM students WHERE name LIKE ? LIMIT 1", ["%Durai%"]);
        if (!students[0]) throw new Error("Durai not found");
        const duraiId = students[0].id;

        const karate = await db.query("SELECT id, amount FROM fee_structures WHERE name = 'Karate' LIMIT 1");
        if (!karate[0]) throw new Error("Karate fee structure not found");
        const karateId = karate[0].id;
        const karateAmount = karate[0].amount;

        console.log(`Found Durai: ${duraiId}`);
        console.log(`Found Karate: ${karateId} (Amount: ${karateAmount})`);

        // 2. Update Enrollment
        console.log("Updating Enrollment...");
        const updateEnrollment = await db.query(`
      UPDATE student_enrollments 
      SET fee_structure_id = ? 
      WHERE student_id = ?
    `, [karateId, duraiId]);
        console.log("Enrollment Updated:", (updateEnrollment as any).affectedRows);

        // 3. Update Fees (Amount)
        // We need to find fees linked to his enrollment
        // But student_fees has enrollment_id
        console.log("Updating Fee Amounts...");
        const updateFees = await db.query(`
      UPDATE student_fees 
      SET amount = ? 
      WHERE student_id = ?
    `, [karateAmount, duraiId]);
        console.log("Fees Updated:", (updateFees as any).affectedRows);

        console.log("✅ Fix Applied Successfully");

    } catch (e) {
        console.error("Fix Check Failed:", e);
    } finally {
        await db.close();
    }
}

fixDuraiData();
