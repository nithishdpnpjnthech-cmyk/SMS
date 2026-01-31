
import { db } from "../server/db";

async function auditMismatches() {
    console.log("🔍 Auditing Program vs Fee Structure Mismatches...");

    try {
        // Join students -> enrollments -> fee_structures
        // Check if Student.program != FeeStructure.name
        const rows = await db.query(`
      SELECT s.id, s.name, s.program, fs.name as fee_name
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN fee_structures fs ON se.fee_structure_id = fs.id
      WHERE se.status = 'active'
    `);

        let errorCount = 0;
        rows.forEach((row: any) => {
            // Normalize comparison (case-insensitive, trim)
            const program = (row.program || "").trim().toLowerCase();
            const feeName = (row.fee_name || "").trim().toLowerCase();

            // Check for mismatch
            if (program !== feeName) {
                console.error(`❌ Mismatch: ${row.name} (${row.id})`);
                console.error(`   Program: '${row.program}' != Fee: '${row.fee_name}'`);
                errorCount++;
            } else {
                console.log(`✅ Match: ${row.name} - ${row.program}`);
            }
        });

        console.log(`\nAudit Complete. ${errorCount} mismatches found.`);

    } catch (e) {
        console.error(e);
    } finally {
        await db.close();
    }
}

auditMismatches();
