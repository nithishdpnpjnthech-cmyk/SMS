
import { storage } from "./storage";
import { randomUUID } from "crypto";

export async function ensureMonthlyFees(studentId: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Get active enrollments
    const enrollments = await storage.getStudentEnrollments(studentId);

    for (const enrollment of enrollments) {
        if (enrollment.status !== 'active') continue;

        // Check if fee exists for this month
        const existingFees = await storage.query(`
      SELECT id FROM student_fees 
      WHERE enrollment_id = ? AND month = ? AND year = ?
    `, [enrollment.id, currentMonth, currentYear]);

        if (existingFees.length === 0) {
            // Create fee record
            const id = randomUUID();
            // Calculate due date (e.g., 5th of the month)
            const dueDate = new Date(currentYear, currentMonth - 1, 5);

            await storage.query(`
        INSERT INTO student_fees (id, student_id, enrollment_id, month, year, amount, paid_amount, status, due_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', ?, NOW())
      `, [
                id,
                studentId,
                enrollment.id,
                currentMonth,
                currentYear,
                enrollment.monthly_amount, // from joined query in getStudentEnrollments
                dueDate
            ]);
            console.log(`Generated fee for student ${studentId}, enrollment ${enrollment.id} for ${currentMonth}/${currentYear}`);
        }
    }
}

export async function distributePayment(studentId: string, paymentAmount: number) {
    let remaining = paymentAmount;

    // Get all pending fees ordered by date (oldest first)
    const pendingFees = await storage.query(`
    SELECT * FROM student_fees 
    WHERE student_id = ? AND status != 'paid'
    ORDER BY year ASC, month ASC
  `, [studentId]);

    for (const fee of pendingFees) {
        if (remaining <= 0) break;

        const due = parseFloat(fee.amount) - parseFloat(fee.paid_amount);

        if (due <= 0) continue; // Should not happen if status != paid, but generic safety

        const pay = Math.min(remaining, due);
        const newPaid = parseFloat(fee.paid_amount) + pay;
        const newStatus = newPaid >= parseFloat(fee.amount) ? 'paid' : 'partial';

        await storage.query(`
      UPDATE student_fees 
      SET paid_amount = ?, status = ?
      WHERE id = ?
    `, [newPaid, newStatus, fee.id]);

        remaining -= pay;
    }

    return remaining; // Should be 0 if fully distributed or > 0 if overpayment (future credit?)
}
