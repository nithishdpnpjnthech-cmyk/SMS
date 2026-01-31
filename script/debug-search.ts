
import { db } from "../server/db";

async function debugSearch() {
    const searchTerm = 'Durai';
    const q = `%${searchTerm}%`;

    const query = `
    SELECT s.id, s.name, s.phone, s.program, s.batch, s.branch_id,
           COALESCE(SUM(fs.amount), 0) as monthly_fee
    FROM students s
    LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.status = 'active'
    LEFT JOIN fee_structures fs ON se.fee_structure_id = fs.id
    WHERE s.status = 'active' 
    AND (s.name LIKE ? OR s.phone LIKE ? OR s.email LIKE ?)
    GROUP BY s.id 
    ORDER BY s.name LIMIT 10
  `;

    const params = [q, q, q];

    try {
        console.log("Running Query...");
        const res = await db.query(query, params);
        console.log("Result:", res);
    } catch (e) {
        console.error("Query Failed:", e);
    }
    process.exit(0);
}

debugSearch();
