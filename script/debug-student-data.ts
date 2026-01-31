
import { db } from "../server/db";

async function debugStudentData() {
    console.log("🔍 Debugging Student Data (Durai) - Raw SQL Mode...");

    try {
        // 1. Find Durai
        const students = await db.query("SELECT * FROM students WHERE name LIKE ? LIMIT 1", ["%Durai%"]);
        const student = students[0];

        if (!student) {
            console.error("❌ Durai not found");
            return;
        }

        console.log("\n👤 Student Profile:");
        console.log(student);

        // 2. Enrollments
        console.log("\n📚 Enrollments:");
        const enrollments = await db.query(`
      SELECT se.*, fs.name as fee_structure_name, fs.amount as fee_structure_amount
      FROM student_enrollments se 
      LEFT JOIN fee_structures fs ON se.fee_structure_id = fs.id 
      WHERE se.student_id = ?
    `, [student.id]);
        console.log(enrollments);

        // 3. Fees
        console.log("\n💰 Fee Records:");
        const fees = await db.query(`
      SELECT sf.id, sf.amount, sf.status, sf.month, sf.year,
             fs.name as linked_fee_name, fs.amount as linked_fee_amount
      FROM student_fees sf
      LEFT JOIN fee_structures fs ON sf.fee_structure_id = fs.id
      WHERE sf.student_id = ?
    `, [student.id]);
        console.log(fees);

    } catch (error) {
        console.error("Debug Error:", error);
    } finally {
        await db.close();
    }
}

debugStudentData();
