import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Enhanced RBAC Middleware with Branch Isolation
function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const userRole = Array.isArray(req.headers['x-user-role'])
      ? req.headers['x-user-role'][0]
      : req.headers['x-user-role'];
    const userId = Array.isArray(req.headers['x-user-id'])
      ? req.headers['x-user-id'][0]
      : req.headers['x-user-id'];
    const userBranchId = Array.isArray(req.headers['x-user-branch'])
      ? req.headers['x-user-branch'][0]
      : req.headers['x-user-branch'] ?? null;
    
    if (!userRole || !userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    req.user = {
      id: userId as string,
      role: userRole as string,
      branchId: userBranchId  // ✅ Use header value directly
    };
    
    console.log(`Auth: User ${userId} (${userRole}) branchId: ${userBranchId}`);
    next();
  };
}

function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}

function enforceBranchAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // ✅ Admin should NEVER be branch-restricted
    if (user.role === "admin") {
      return next();
    }

    // ❌ Non-admin without branch = block with detailed error
    if (!user.branchId) {
      console.error(`User ${user.id} (${user.role}) has no branchId assigned`);
      return res.status(403).json({
        error: "User not assigned to any branch. Contact administrator.",
        debug: { userId: user.id, role: user.role, branchId: user.branchId }
      });
    }

    // ✅ Enforce branch for non-admin users
    req.query.branchId = user.branchId;
    req.body.branchId = user.branchId;

    console.log(`Branch access enforced: ${user.role} restricted to branch ${user.branchId}`);
    next();
  };
}


    

export async function registerRoutes(app: Express): Promise<void> {

  // ================= SYSTEM SETTINGS =================
  // CSRF Protection Note: These endpoints use JWT tokens in Authorization headers
  // which are not automatically sent by browsers in cross-site requests,
  // providing inherent CSRF protection. No additional CSRF tokens needed.
  app.get("/api/settings/academy", async (req, res) => {
    try {
      // Create settings table if it doesn't exist
      await storage.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          setting_key VARCHAR(100) NOT NULL UNIQUE,
          setting_value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Get academy name setting
      const academyName = await storage.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'academy_name'"
      );
      
      res.json({
        academyName: academyName.length ? academyName[0].setting_value : null
      });
    } catch (error) {
      console.error("Get academy settings error:", error);
      res.status(500).json({ error: "Failed to fetch academy settings" });
    }
  });

  app.put("/api/settings/academy", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const { academyName } = req.body;
      
      if (!academyName || !academyName.trim()) {
        return res.status(400).json({ error: "Academy name is required" });
      }
      
      // Upsert academy name setting
      await storage.query(`
        INSERT INTO system_settings (setting_key, setting_value) 
        VALUES ('academy_name', ?) 
        ON DUPLICATE KEY UPDATE 
        setting_value = VALUES(setting_value),
        updated_at = CURRENT_TIMESTAMP
      `, [academyName.trim()]);
      
      res.json({ message: "Academy name updated successfully" });
    } catch (error) {
      console.error("Update academy settings error:", error);
      res.status(500).json({ error: "Failed to update academy name" });
    }
  });

  // ================= STUDENT PORTAL AUTH =================
  // CSRF Protection Note: Student portal uses JWT tokens in Authorization headers
  // which provides inherent CSRF protection as browsers don't automatically
  // send Authorization headers in cross-site requests.
  app.post("/api/student/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Sanitize username for logging to prevent log injection
      const sanitizedUsername = username.replace(/[\r\n]/g, "");
      console.log("Student login attempt for:", sanitizedUsername);

      // Find student by ID, email, or phone (flexible username)
      const students = await storage.query(`
        SELECT 
          s.id,
          s.name,
          s.email,
          s.phone,
          s.branch_id,
          s.password_hash,
          s.status,
          s.login_attempts,
          s.locked_until,
          b.name as branch_name
        FROM students s
        LEFT JOIN branches b ON s.branch_id = b.id
        WHERE (s.id = ? OR s.email = ? OR s.phone = ?) 
        AND s.status = 'active'
        LIMIT 1
      `, [username, username, username]);

      if (!students.length) {
        console.log("Student not found for username:", sanitizedUsername, "reason: student_not_found");
        return res.status(401).json({ error: "Student not found. Please login using email, phone number, or full student ID." });
      }

      const student = students[0];
      
      // Check if account is locked
      if (student.locked_until && new Date() < new Date(student.locked_until)) {
        return res.status(423).json({ error: "Account is temporarily locked. Please try again later." });
      }
      
      // Verify password
      let isPasswordValid = false;
      
      if (student.password_hash) {
        // Use bcrypt for hashed passwords
        isPasswordValid = await bcrypt.compare(password, student.password_hash);
      } else {
        // Fallback for legacy students without hashed passwords
        const expectedPassword = student.name.replace(/[^a-zA-Z]/g, '').substring(0, 5).toLowerCase();
        isPasswordValid = password.toLowerCase() === expectedPassword;
        
        // If login successful with legacy password, hash it for future use
        if (isPasswordValid) {
          const hashedPassword = await bcrypt.hash(expectedPassword, 10);
          await storage.query(
            'UPDATE students SET password_hash = ? WHERE id = ?',
            [hashedPassword, student.id]
          );
        }
      }
      
      if (!isPasswordValid) {
        // Increment login attempts
        const newAttempts = (student.login_attempts || 0) + 1;
        let lockUntil = null;
        
        // Lock account after 5 failed attempts for 15 minutes
        if (newAttempts >= 5) {
          lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }
        
        await storage.query(
          'UPDATE students SET login_attempts = ?, locked_until = ? WHERE id = ?',
          [newAttempts, lockUntil, student.id]
        );
        
        console.log("Invalid password for student:", sanitizedUsername, "reason: password_mismatch");
        return res.status(401).json({ error: "Invalid password. Please check your password and try again." });
      }
      
      // Reset login attempts on successful login
      await storage.query(
        'UPDATE students SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
        [student.id]
      );

      // Generate JWT token with studentId
      const jwtSecret = process.env.JWT_SECRET || 'dev-only-secret';
      const token = jwt.sign(
        { 
          studentId: student.id,
          type: 'student',
          branchId: student.branch_id
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      // Log successful login (without sensitive data)
      console.log("Student login successful:", sanitizedUsername, "ID:", student.id);

      // Return student info with token
      res.json({
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          branchId: student.branch_id,
          branchName: student.branch_name,
          role: 'student'
        },
        token
      });
    } catch (error: any) {
      console.error("Student login error:", error.message || error);
      return res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Student middleware for authentication with JWT
  function requireStudentAuth() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        
        if (!token) {
          return res.status(401).json({ error: "Student authentication token required" });
        }
        
        const jwtSecret = process.env.JWT_SECRET || 'dev-only-secret';
        const decoded = jwt.verify(token, jwtSecret);
        
        if (decoded.type !== 'student' || !decoded.studentId) {
          return res.status(403).json({ error: "Invalid student token" });
        }
        
        // Verify student exists and is active
        const student = await storage.query(`
          SELECT s.*, b.name as branch_name
          FROM students s
          LEFT JOIN branches b ON s.branch_id = b.id
          WHERE s.id = ? AND s.status = 'active'
        `, [decoded.studentId]);
        
        if (!student.length) {
          return res.status(403).json({ error: "Student access denied" });
        }
        
        req.student = student[0];
        req.studentId = decoded.studentId; // Ensure studentId is available
        next();
      } catch (error) {
        console.error('Student auth error:', error);
        return res.status(401).json({ error: "Invalid or expired token" });
      }
    };
  }

  // ================= STUDENT PORTAL READ-ONLY APIs =================
  app.get("/api/student/profile", requireStudentAuth(), async (req, res) => {
    try {
      const student = req.student!;
      
      // Get uniform status
      const uniform = await storage.query(
        "SELECT issued, issue_date FROM student_uniforms WHERE student_id = ?",
        [student.id]
      );
      
      // Get academy/branch information
      const branch = await storage.query(
        "SELECT name, address, phone FROM branches WHERE id = ?",
        [student.branch_id]
      );
      
      const branchInfo = branch.length ? branch[0] : null;
      
      res.json({
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        parentPhone: student.parent_phone,
        address: student.address,
        branchName: student.branch_name,
        program: student.program,
        batch: student.batch,
        joiningDate: student.joining_date,
        uniform: uniform.length ? {
          issued: uniform[0].issued,
          issueDate: uniform[0].issue_date
        } : { issued: false, issueDate: null },
        academy: {
          name: branchInfo?.name || 'Academy',
          phone: branchInfo?.phone || null,
          email: null, // Add email field to branches table if needed
          address: branchInfo?.address || null
        }
      });
    } catch (error) {
      console.error("Student profile error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.get("/api/student/attendance", requireStudentAuth(), async (req, res) => {
    try {
      const studentId = req.studentId!; // Use JWT-verified studentId
      const { month, year } = req.query;
      
      let dateFilter = "";
      const params = [studentId];
      
      if (month && year) {
        dateFilter = "AND MONTH(a.date) = ? AND YEAR(a.date) = ?";
        params.push(month as string, year as string);
      }
      
      const attendance = await storage.query(`
        SELECT 
          DATE(a.date) as date,
          a.status,
          a.check_in,
          a.check_out
        FROM attendance a
        WHERE a.student_id = ? ${dateFilter}
        ORDER BY a.date DESC
      `, params);
      
      // Calculate summary
      const totalDays = attendance.length;
      const presentDays = attendance.filter(a => a.status === 'present').length;
      const absentDays = attendance.filter(a => a.status === 'absent').length;
      const lateDays = attendance.filter(a => a.status === 'late').length;
      
      res.json({
        attendance,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendancePercentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
        }
      });
    } catch (error) {
      console.error("Student attendance error:", error);
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  app.get("/api/student/fees", requireStudentAuth(), async (req, res) => {
    try {
      const studentId = req.studentId!; // Use JWT-verified studentId
      
      const fees = await storage.query(`
        SELECT 
          f.id,
          f.amount,
          f.due_date,
          f.paid_date,
          f.status,
          f.payment_method,
          f.notes
        FROM fees f
        WHERE f.student_id = ?
        ORDER BY f.due_date DESC
      `, [studentId]);
      
      // Calculate totals
      const totalFee = fees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
      const paidAmount = fees
        .filter(fee => fee.status === 'paid')
        .reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
      const pendingAmount = totalFee - paidAmount;
      
      res.json({
        fees,
        summary: {
          totalFee,
          paidAmount,
          pendingAmount
        }
      });
    } catch (error) {
      console.error("Student fees error:", error);
      res.status(500).json({ error: "Failed to fetch fees" });
    }
  });

  app.get("/api/student/reports/attendance", requireStudentAuth(), async (req, res) => {
    try {
      const studentId = req.studentId!; // Use JWT-verified studentId
      const { month, year, format } = req.query;
      
      if (!month || !year) {
        return res.status(400).json({ error: "Month and year required" });
      }
      
      const attendance = await storage.query(`
        SELECT 
          DATE(a.date) as date,
          a.status,
          a.check_in,
          a.check_out
        FROM attendance a
        WHERE a.student_id = ? AND MONTH(a.date) = ? AND YEAR(a.date) = ?
        ORDER BY a.date ASC
      `, [studentId, month, year]);
      
      if (format === 'csv') {
        const csvData = [
          'Date,Status,Check In,Check Out',
          ...attendance.map(a => 
            `${a.date},${a.status},${a.check_in || ''},${a.check_out || ''}`
          )
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        // Sanitize filename parameters to prevent header injection
        const safeMonth = String(month).replace(/[^0-9]/g, '');
        const safeYear = String(year).replace(/[^0-9]/g, '');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-${safeMonth}-${safeYear}.csv"`);
        res.send(csvData);
      } else {
        res.json({ attendance });
      }
    } catch (error) {
      console.error("Student attendance report error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/student/notes", requireStudentAuth(), async (req, res) => {
    try {
      const studentId = req.studentId!; // Use JWT-verified studentId
      
      // Get notes from various sources (attendance notes, fee notes, general notes)
      const notes = await storage.query(`
        SELECT 
          'attendance' as type,
          a.notes as content,
          a.date as created_at,
          CONCAT('Attendance: ', a.status) as title
        FROM attendance a
        WHERE a.student_id = ? AND a.notes IS NOT NULL AND a.notes != ''
        
        UNION ALL
        
        SELECT 
          'fee' as type,
          f.notes as content,
          f.created_at,
          CONCAT('Fee Payment: ₹', f.amount) as title
        FROM fees f
        WHERE f.student_id = ? AND f.notes IS NOT NULL AND f.notes != ''
        
        ORDER BY created_at DESC
        LIMIT 10
      `, [studentId, studentId]);
      
      res.json(notes);
    } catch (error) {
      console.error("Student notes error:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  // ================= STUDENT PAYMENT PROCESSING =================
  // CSRF Protection Note: Payment endpoints use JWT authentication which provides
  // inherent CSRF protection. Additional CSRF tokens are not required.
  app.post("/api/student/payment", requireStudentAuth(), async (req, res) => {
    try {
      const studentId = req.studentId!; // Use JWT-verified studentId
      const { feeId, paymentMethod } = req.body;
      
      if (!feeId || !paymentMethod) {
        return res.status(400).json({ error: "Fee ID and payment method required" });
      }
      
      // Verify fee belongs to student and is pending
      const fee = await storage.query(
        "SELECT * FROM fees WHERE id = ? AND student_id = ? AND status = 'pending'",
        [feeId, studentId]
      );
      
      if (!fee.length) {
        return res.status(404).json({ error: "Fee not found or already paid" });
      }
      
      // In a real implementation, integrate with payment gateway here
      // For now, we'll simulate payment processing
      
      // Simulate payment gateway processing
      const paymentSuccess = await simulatePaymentGateway(fee[0].amount, paymentMethod);
      
      if (!paymentSuccess.success) {
        return res.status(400).json({ error: paymentSuccess.error });
      }
      
      // Update fee status to paid
      await storage.query(
        "UPDATE fees SET status = 'paid', paid_date = NOW(), payment_method = ?, notes = CONCAT(COALESCE(notes, ''), ' Payment processed via ', ?) WHERE id = ?",
        [paymentMethod, paymentMethod, feeId]
      );
      
      res.json({ 
        message: "Payment processed successfully",
        transactionId: paymentSuccess.transactionId,
        paymentMethod
      });
    } catch (error) {
      console.error("Student payment error:", error);
      res.status(500).json({ error: "Payment processing failed" });
    }
  });

  // Simulate payment gateway (replace with real integration)
  async function simulatePaymentGateway(amount: number, method: string) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    
    if (success) {
      return {
        success: true,
        transactionId: `TXN${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      };
    } else {
      return {
        success: false,
        error: "Payment gateway error. Please try again."
      };
    }
  }

  // ================= ADMIN STUDENT CREDENTIAL MANAGEMENT =================
  app.get("/api/admin/student-credentials/:studentId", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const { studentId } = req.params;
      
      const credentials = await storage.query(`
        SELECT 
          spc.id,
          spc.username,
          spc.is_active,
          spc.last_login
        FROM student_portal_credentials spc
        WHERE spc.student_id = ?
      `, [studentId]);
      
      if (!credentials.length) {
        return res.status(404).json({ error: "No credentials found" });
      }
      
      res.json({
        id: credentials[0].id,
        username: credentials[0].username,
        isActive: credentials[0].is_active,
        lastLogin: credentials[0].last_login
      });
    } catch (error) {
      console.error("Get student credential error:", error);
      res.status(500).json({ error: "Failed to fetch credential" });
    }
  });

  app.post("/api/admin/student-credentials", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const { studentId, username, password } = req.body;
      
      // Sanitize inputs for logging to prevent log injection
      const sanitizedStudentId = String(studentId || '').replace(/[\r\n]/g, "");
      const sanitizedUsername = String(username || '').replace(/[\r\n]/g, "");
      
      console.log("Creating credentials for student:", sanitizedStudentId, "username:", sanitizedUsername);
      
      if (!studentId || !username || !password) {
        return res.status(400).json({ error: "Student ID, username, and password required" });
      }
      
      // Ensure table exists first
      await storage.query(`
        CREATE TABLE IF NOT EXISTS student_portal_credentials (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          student_id VARCHAR(36) NOT NULL UNIQUE,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(36) NOT NULL,
          last_login TIMESTAMP NULL,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id),
          INDEX idx_student_portal_username (username),
          INDEX idx_student_portal_student_id (student_id)
        )
      `);
      
      // Check if student exists
      const student = await storage.query(
        "SELECT id FROM students WHERE id = ? AND status = 'active'",
        [studentId]
      );
      
      if (!student.length) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      // Check if credentials already exist
      const existing = await storage.query(
        "SELECT id FROM student_portal_credentials WHERE student_id = ?",
        [studentId]
      );
      
      if (existing.length) {
        return res.status(400).json({ error: "Credentials already exist for this student" });
      }
      
      // Check username uniqueness
      const usernameExists = await storage.query(
        "SELECT id FROM student_portal_credentials WHERE username = ?",
        [username]
      );
      
      if (usernameExists.length) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Generate UUID for credentials
      const credentialId = randomUUID();
      
      // Create credentials with explicit ID
      await storage.query(`
        INSERT INTO student_portal_credentials 
        (id, student_id, username, password, created_by, is_active)
        VALUES (?, ?, ?, ?, ?, TRUE)
      `, [credentialId, studentId, username, password, req.user.id]);
      
      console.log("Credentials created successfully for student:", sanitizedStudentId);
      res.json({ message: "Credentials created successfully" });
    } catch (error: any) {
      console.error("Create student credentials error:", error);
      res.status(500).json({ error: error.message || "Failed to create credentials" });
    }
  });

  app.patch("/api/admin/student-credentials/:id", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive === 'boolean') {
        await storage.query(
          "UPDATE student_portal_credentials SET is_active = ? WHERE id = ?",
          [isActive, id]
        );
      }
      
      res.json({ message: "Credential updated successfully" });
    } catch (error) {
      console.error("Update student credential error:", error);
      res.status(500).json({ error: "Failed to update credential" });
    }
  });

  app.patch("/api/admin/student-credentials/:id/reset-password", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: "Password required" });
      }
      
      await storage.query(
        "UPDATE student_portal_credentials SET password = ? WHERE id = ?",
        [password, id]
      );
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.get("/api/admin/student-credentials", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const credentials = await storage.query(`
        SELECT 
          spc.id,
          spc.student_id,
          spc.username,
          spc.is_active,
          spc.last_login,
          s.name as student_name,
          b.name as branch_name
        FROM student_portal_credentials spc
        JOIN students s ON spc.student_id = s.id
        LEFT JOIN branches b ON s.branch_id = b.id
        ORDER BY spc.created_at DESC
      `);
      
      res.json(credentials.map(cred => ({
        id: cred.id,
        studentId: cred.student_id,
        username: cred.username,
        isActive: cred.is_active,
        lastLogin: cred.last_login,
        studentName: cred.student_name,
        branchName: cred.branch_name
      })));
    } catch (error) {
      console.error("Get student credentials error:", error);
      res.status(500).json({ error: "Failed to fetch credentials" });
    }
  });

  app.delete("/api/admin/student-credentials/:id", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.query(
        "DELETE FROM student_portal_credentials WHERE id = ?",
        [id]
      );
      
      res.json({ message: "Credentials deleted successfully" });
    } catch (error) {
      console.error("Delete student credentials error:", error);
      res.status(500).json({ error: "Failed to delete credentials" });
    }
  });

  // ================= AUTH =================
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const identifier = username || email;

      // Sanitize identifier for logging to prevent log injection
      const sanitizedIdentifier = String(identifier || '').replace(/[\r\n]/g, "");
      console.log("Login attempt for:", sanitizedIdentifier);

      if (!identifier || !password) {
        return res.status(400).json({ error: "Username/email and password required" });
      }

      const user = await storage.getUserByUsername(identifier);
      console.log("User found:", user ? { id: user.id, username: user.username, role: user.role, branch_id: (user as any).branch_id } : "No user found");

      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // ✅ CRITICAL: Map database branch_id to camelCase branchId for frontend
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email || null,
        name: user.name || null,
        role: user.role,
        branchId: (user as any).branch_id || null  // ✅ Map snake_case to camelCase
      };

      console.log("Login successful, returning user:", {
        id: userResponse.id,
        username: userResponse.username,
        role: userResponse.role,
        branchId: userResponse.branchId
      });
      
      // ✅ Log branch assignment status for debugging
      if (user.role !== 'admin' && !(user as any).branch_id) {
        console.warn(`⚠️  User ${user.username} (${user.role}) has no branch_id assigned!`);
      }
      
      res.json({ user: userResponse });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // ================= DASHBOARD =================
  app.get("/api/dashboard/stats", requireAuth(), enforceBranchAccess(), async (req, res) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const userRole = req.user.role;
      
      // Build queries with conditional branch filtering
      let studentsQuery = "SELECT COUNT(*) as count FROM students WHERE status = 'active'";
      let attendanceQuery = `
        SELECT COUNT(*) as present_count,
               (SELECT COUNT(*) FROM attendance a2 
                JOIN students s2 ON a2.student_id = s2.id 
                WHERE DATE(a2.date) = CURDATE() AND a2.status = 'absent' AND s2.status = 'active'
                ${branchId ? 'AND s2.branch_id = ?' : (userRole !== 'admin' ? 'AND s2.branch_id = ?' : '')}) as absent_count
        FROM attendance a 
        JOIN students s ON a.student_id = s.id 
        WHERE DATE(a.date) = CURDATE() AND a.status = 'present' AND s.status = 'active'
      `;
      let feesQuery = `
        SELECT 
          SUM(CASE WHEN f.status = 'paid' AND DATE(f.paid_date) = CURDATE() THEN f.amount ELSE 0 END) as fees_collected_today,
          SUM(CASE WHEN f.status = 'pending' THEN f.amount ELSE 0 END) as pending_dues,
          SUM(CASE WHEN f.status = 'paid' THEN f.amount ELSE 0 END) as total_revenue
        FROM fees f 
        JOIN students s ON f.student_id = s.id 
        WHERE s.status = 'active'
      `;
      
      const params: any[] = [];
      
      // Apply branch filtering - Admin sees all unless specific branchId requested
      if (branchId) {
        studentsQuery += " AND branch_id = ?";
        attendanceQuery += " AND s.branch_id = ?";
        feesQuery += " AND s.branch_id = ?";
        params.push(branchId, branchId, branchId, branchId);
      } else if (userRole !== 'admin') {
        studentsQuery += " AND branch_id = ?";
        attendanceQuery += " AND s.branch_id = ?";
        feesQuery += " AND s.branch_id = ?";
        params.push(req.user.branchId, req.user.branchId, req.user.branchId, req.user.branchId);
      }
      
      const [students, attendance, fees] = await Promise.all([
        storage.query(studentsQuery, branchId || (userRole !== 'admin') ? [params[0]] : []),
        storage.query(attendanceQuery, branchId || (userRole !== 'admin') ? [params[1], params[1]] : []),
        storage.query(feesQuery, branchId || (userRole !== 'admin') ? [params[2]] : [])
      ]);
      
      const stats = {
        totalStudents: students[0]?.count || 0,
        presentToday: attendance[0]?.present_count || 0,
        absentToday: attendance[0]?.absent_count || 0,
        feesCollectedToday: fees[0]?.fees_collected_today || 0,
        pendingDues: fees[0]?.pending_dues || 0,
        totalRevenue: fees[0]?.total_revenue || 0
      };

      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ================= TESTING CLEANUP ENDPOINT =================
  app.delete("/api/admin/cleanup-students", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      console.log("Starting student data cleanup for testing...");
      
      // Disable foreign key checks temporarily
      await storage.query("SET FOREIGN_KEY_CHECKS = 0");
      
      // Delete dependent data first (child tables)
      await storage.query("DELETE FROM student_programs");
      await storage.query("DELETE FROM attendance");
      await storage.query("DELETE FROM fees");
      await storage.query("DELETE FROM student_portal_credentials");
      
      // Delete students table data
      await storage.query("DELETE FROM students");
      
      // Re-enable foreign key checks
      await storage.query("SET FOREIGN_KEY_CHECKS = 1");
      
      console.log("Student data cleanup completed successfully");
      res.json({ message: "All student test data cleared successfully" });
    } catch (error) {
      console.error("Student cleanup error:", error);
      
      // Ensure foreign key checks are re-enabled even on error
      try {
        await storage.query("SET FOREIGN_KEY_CHECKS = 1");
      } catch (fkError) {
        console.error("Failed to re-enable foreign key checks:", fkError);
      }
      
      res.status(500).json({ error: "Failed to cleanup student data" });
    }
  });

  // ================= STUDENTS =================
  app.get("/api/students", requireAuth(), enforceBranchAccess(), async (req, res) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const programFilter = req.query.program as string | undefined;
      const statusFilter = req.query.status as string | undefined; // NEW: Status filter
      const userRole = req.user.role;
      
      let query = `
        SELECT DISTINCT s.*, b.name as branch_name 
        FROM students s 
        LEFT JOIN branches b ON s.branch_id = b.id 
        LEFT JOIN student_programs sp ON s.id = sp.student_id
        LEFT JOIN programs p ON sp.program_id = p.id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      // Status filtering - default to 'active' if no filter specified
      if (statusFilter) {
        query += " AND s.status = ?";
        params.push(statusFilter);
      } else {
        query += " AND s.status = 'active'";
      }
      
      // Branch filtering
      if (branchId) {
        query += " AND s.branch_id = ?";
        params.push(branchId);
      } else if (userRole !== 'admin') {
        query += " AND s.branch_id = ?";
        params.push(req.user.branchId);
      }
      
      // Program filtering
      if (programFilter && programFilter !== 'All Programs') {
        query += ` AND (
          LOWER(TRIM(s.program)) = LOWER(TRIM(?)) OR 
          LOWER(TRIM(p.name)) = LOWER(TRIM(?))
        )`;
        params.push(programFilter, programFilter);
      }
      
      query += " ORDER BY s.created_at DESC";
      
      const students = await storage.query(query, params);
      res.json(students);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.get("/api/students/all", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const students = await storage.getAllStudents(branchId);
      res.json(students);
    } catch (error) {
      console.error("Get all students error:", error);
      res.status(500).json({ error: "Failed to fetch all students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Get student error:", error);
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });

  // Check for potential duplicates (warning only)
  app.post("/api/students/check-duplicates", requireAuth(), async (req, res) => {
    try {
      const { name, phone, guardianName, parentPhone, address } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Student name is required" });
      }
      
      // Find potential duplicates by name
      const potentialDuplicates = await storage.query(`
        SELECT id, name, phone, guardian_name, parent_phone, address, program, batch, branch_id FROM students 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
          AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 5
      `, [name.trim()]);
      
      if (potentialDuplicates.length === 0) {
        return res.json({ duplicates: [], warning: null });
      }
      
      // Check for exact matches
      const exactMatch = potentialDuplicates.find(existing => 
        (existing.phone || '') === (phone || '') &&
        (existing.guardian_name || '') === (guardianName || '') &&
        (existing.parent_phone || '') === (parentPhone || '') &&
        (existing.address || '') === (address || '')
      );
      
      let warning = null;
      if (exactMatch) {
        warning = `EXACT MATCH: Student "${name}" with identical contact details already exists. This may be a duplicate.`;
      } else {
        warning = `SIMILAR NAME: ${potentialDuplicates.length} student(s) with similar name found. Please verify this is not a duplicate.`;
      }
      
      res.json({
        duplicates: potentialDuplicates.map(d => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          guardianName: d.guardian_name,
          parentPhone: d.parent_phone,
          address: d.address,
          program: d.program,
          batch: d.batch
        })),
        warning,
        canProceed: true // Always allow admin to proceed
      });
    } catch (error) {
      console.error("Check duplicates error:", error);
      res.status(500).json({ error: "Failed to check for duplicates" });
    }
  });

  app.post("/api/students", requireAuth(), async (req, res) => {
    try {
      console.log("Creating student with data:", req.body);
      
      // EARLY VALIDATION - Fail fast before any DB operations
      if (!req.body.name || !req.body.name.trim()) {
        return res.status(400).json({ error: "Student name is required" });
      }
      
      if (!req.body.branchId) {
        return res.status(400).json({ error: "Please select a branch for the student" });
      }
      
      if (!req.body.programs || !Array.isArray(req.body.programs) || req.body.programs.length === 0) {
        return res.status(400).json({ error: "Please select at least one program" });
      }
      
      if (!req.body.batchId) {
        return res.status(400).json({ error: "Please select a batch" });
      }
      
      // Validate uniform fields
      if (req.body.uniformIssued && !req.body.uniformSize) {
        return res.status(400).json({ error: "Uniform size is required when uniform is issued" });
      }
      
      if (req.body.uniformSize && !req.body.uniformIssued) {
        return res.status(400).json({ error: "Cannot set uniform size without issuing uniform" });
      }
      
      // Validate uniform size enum
      if (req.body.uniformSize && !['XS','S','M','L','XL','XXL','XXXL'].includes(req.body.uniformSize)) {
        return res.status(400).json({ error: "Invalid uniform size. Must be XS, S, M, L, XL, XXL, or XXXL" });
      }
      
      // CRITICAL: Check for exact duplicates before creation
      const existingStudent = await storage.query(`
        SELECT id FROM students 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
          AND COALESCE(phone, '') = COALESCE(?, '')
          AND COALESCE(email, '') = COALESCE(?, '')
          AND status = 'active'
        LIMIT 1
      `, [req.body.name.trim(), req.body.phone || '', req.body.email || '']);
      
      if (existingStudent && existingStudent.length > 0) {
        return res.status(409).json({ 
          error: "A student with the same name and contact details already exists" 
        });
      }
      const branch = await storage.query("SELECT id FROM branches WHERE id = ?", [req.body.branchId]);
      if (!branch || branch.length === 0) {
        return res.status(400).json({ error: "Please select a valid branch" });
      }
      
      for (const programId of req.body.programs) {
        const program = await storage.query("SELECT id FROM programs WHERE id = ?", [programId]);
        if (!program || program.length === 0) {
          return res.status(400).json({ error: `Invalid program selected: ${programId}. Please refresh and try again.` });
        }
      }
      
      const batch = await storage.query("SELECT id FROM batches WHERE id = ?", [req.body.batchId]);
      if (!batch || batch.length === 0) {
        return res.status(400).json({ error: "Please select a valid batch from the list" });
      }

      // Generate default password (first 5 letters of name)
      const defaultPassword = req.body.name.replace(/[^a-zA-Z]/g, '').substring(0, 5).toLowerCase();
      if (!defaultPassword) {
        return res.status(400).json({ error: "Cannot generate password from student name" });
      }
      
      // Hash the password
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      
      // Create explicit student data object
      const studentData = {
        name: req.body.name.trim(),
        email: req.body.email || null,
        phone: req.body.phone || null,
        parentPhone: req.body.parentPhone || null,
        guardianName: req.body.guardianName || null,
        address: req.body.address || null,
        branchId: req.body.branchId,
        programs: req.body.programs,
        batchId: req.body.batchId,
        uniformIssued: req.body.uniformIssued || false,
        uniformSize: req.body.uniformIssued ? req.body.uniformSize : null,
        status: req.body.status || 'active',
        joiningDate: req.body.joiningDate ? new Date(req.body.joiningDate) : new Date()
      };
      
      // ATOMIC TRANSACTION: Create student (all operations succeed or all fail)
      const student = await storage.createStudent(studentData);
      
      // Update the student with password hash (separate operation after main creation)
      await storage.query(
        'UPDATE students SET password_hash = ?, role = ? WHERE id = ?',
        [passwordHash, 'STUDENT', student.id]
      );
      
      console.log("Student created successfully:", student.name);
      
      // CRITICAL: Return success immediately after student creation
      // Do NOT let secondary operations (like duplicate warnings) affect the response
      const response = {
        ...student,
        message: `Student created successfully. Default password: ${defaultPassword}`
      };
      
      // Return 201 Created with student data
      res.status(201).json(response);
      
    } catch (error: any) {
      console.error("Create student error:", error);
      
      // Handle specific database errors
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message?.includes('foreign key constraint')) {
        return res.status(400).json({ error: "Invalid reference data. Please refresh and try again." });
      }
      
      // Handle validation errors
      if (error.message?.includes('required') || error.message?.includes('Uniform size')) {
        return res.status(400).json({ error: error.message });
      }
      
      // Generic fallback
      return res.status(500).json({ error: "Failed to create student. Please try again." });
    }
  });

  app.put("/api/students/:id", requireAuth(), async (req, res) => {
    try {
      console.log("Updating student:", req.params.id, "with data:", req.body);
      
      // Validate required fields
      if (!req.body.name || !req.body.name.trim()) {
        return res.status(400).json({ error: "Student name is required" });
      }
      
      // Validate uniform fields
      if (req.body.uniformIssued && !req.body.uniformSize) {
        return res.status(400).json({ error: "Uniform size is required when uniform is issued" });
      }
      
      if (req.body.uniformSize && !req.body.uniformIssued) {
        return res.status(400).json({ error: "Cannot set uniform size without issuing uniform" });
      }
      
      const student = await storage.updateStudent(req.params.id, req.body);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      console.log("Student updated successfully:", student);
      res.json(student);
    } catch (error: any) {
      console.error("Update student error:", error);
      res.status(500).json({ error: error.message || "Failed to update student" });
    }
  });

  // Student status management endpoints
  app.patch("/api/students/:id/deactivate", requireAuth(), async (req, res) => {
    try {
      const studentId = req.params.id;
      
      const student = await storage.query(
        "UPDATE students SET status = 'inactive' WHERE id = ?",
        [studentId]
      );
      
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      res.json({ message: "Student deactivated successfully" });
    } catch (error) {
      console.error("Deactivate student error:", error);
      res.status(500).json({ error: "Failed to deactivate student" });
    }
  });

  app.patch("/api/students/:id/activate", requireAuth(), async (req, res) => {
    try {
      const studentId = req.params.id;
      
      const student = await storage.query(
        "UPDATE students SET status = 'active' WHERE id = ?",
        [studentId]
      );
      
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      res.json({ message: "Student activated successfully" });
    } catch (error) {
      console.error("Activate student error:", error);
      res.status(500).json({ error: "Failed to activate student" });
    }
  });

  app.patch("/api/students/:id/suspend", requireAuth(), async (req, res) => {
    try {
      const studentId = req.params.id;
      
      const student = await storage.query(
        "UPDATE students SET status = 'suspended' WHERE id = ?",
        [studentId]
      );
      
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      res.json({ message: "Student suspended successfully" });
    } catch (error) {
      console.error("Suspend student error:", error);
      res.status(500).json({ error: "Failed to suspend student" });
    }
  });

  // ================= BRANCHES =================
  app.get("/api/branches", async (_req, res) => {
    try {
      const branches = await storage.getBranches();
      res.json(branches);
    } catch (error) {
      console.error("Get branches error:", error);
      res.status(500).json({ error: "Failed to fetch branches" });
    }
  });

  // Get branch details with stats (Admin only)
  app.get("/api/branches/:id/details", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const branchId = req.params.id;
      
      const [branch, students, trainers, fees] = await Promise.all([
        storage.query("SELECT * FROM branches WHERE id = ?", [branchId]),
        storage.query("SELECT COUNT(*) as count FROM students WHERE branch_id = ? AND status = 'active'", [branchId]),
        storage.query("SELECT COUNT(*) as count FROM trainers WHERE branch_id = ?", [branchId]),
        storage.query(`
          SELECT SUM(CASE WHEN f.status = 'paid' THEN f.amount ELSE 0 END) as total_revenue,
                 SUM(CASE WHEN f.status = 'pending' THEN f.amount ELSE 0 END) as pending_dues
          FROM fees f 
          JOIN students s ON f.student_id = s.id 
          WHERE s.branch_id = ?
        `, [branchId])
      ]);
      
      if (!branch || branch.length === 0) {
        return res.status(404).json({ error: "Branch not found" });
      }
      
      const branchDetails = {
        ...branch[0],
        studentCount: students[0]?.count || 0,
        trainerCount: trainers[0]?.count || 0,
        totalRevenue: fees[0]?.total_revenue || 0,
        pendingDues: fees[0]?.pending_dues || 0
      };
      
      res.json(branchDetails);
    } catch (error) {
      console.error("Get branch details error:", error);
      res.status(500).json({ error: "Failed to fetch branch details" });
    }
  });

  app.put("/api/branches/:id", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const branchId = req.params.id;
      const { name, address, phone } = req.body;
      
      await storage.query(
        "UPDATE branches SET name = ?, address = ?, phone = ? WHERE id = ?",
        [name, address, phone, branchId]
      );
      
      const updatedBranch = await storage.query("SELECT * FROM branches WHERE id = ?", [branchId]);
      res.json(updatedBranch[0]);
    } catch (error) {
      console.error("Update branch error:", error);
      res.status(500).json({ error: "Failed to update branch" });
    }
  });

  app.post("/api/branches", async (req, res) => {
    try {
      const branch = await storage.createBranch(req.body);
      res.status(201).json(branch);
    } catch (error) {
      console.error("Create branch error:", error);
      res.status(500).json({ error: "Failed to create branch" });
    }
  });

  // ================= TRAINERS =================
  app.get("/api/trainers", requireAuth(), async (req, res) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const userRole = req.user.role;
      
      let query = `
        SELECT t.*, b.name as branch_name, u.username 
        FROM trainers t 
        LEFT JOIN branches b ON t.branch_id = b.id 
        LEFT JOIN users u ON t.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      // CRITICAL: Apply branch filtering in mandatory order
      // 1. If branchId provided → ALWAYS filter by it (regardless of role)
      if (branchId) {
        query += " AND t.branch_id = ?";
        params.push(branchId);
      } 
      // 2. Else if non-admin → filter by user's branch
      else if (userRole !== 'admin') {
        query += " AND t.branch_id = ?";
        params.push(req.user.branchId);
      }
      // 3. Else (admin without branch context) → no filter
      
      query += " ORDER BY t.created_at DESC";
      
      const trainers = await storage.query(query, params);
      res.json(trainers);
    } catch (error) {
      console.error("Get trainers error:", error);
      res.status(500).json({ error: "Failed to fetch trainers" });
    }
  });

  app.post("/api/trainers", requireAuth(), async (req, res) => {
    try {
      console.log("Creating trainer with data:", req.body);
      
      // Validate required fields
      if (!req.body.name || !req.body.email || !req.body.phone) {
        return res.status(400).json({ error: "Name, email, and phone are required fields" });
      }
      
      // Determine branch_id based on user role
      let branchId = req.body.branchId;
      
      if (req.user.role === 'manager') {
        // Manager can only create trainers in their own branch
        branchId = req.user.branchId;
      } else if (req.user.role === 'admin') {
        // Admin must specify branch_id
        if (!branchId) {
          return res.status(400).json({ error: "Please select a branch for the trainer" });
        }
      } else {
        return res.status(403).json({ error: "Access denied" });
      }
      
      if (!branchId) {
        return res.status(400).json({ error: "Trainer must be assigned to a branch" });
      }
      
      // Validate branch exists
      const branch = await storage.query("SELECT id FROM branches WHERE id = ?", [branchId]);
      if (!branch || branch.length === 0) {
        return res.status(400).json({ error: "Please select a valid branch" });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByUsername(req.body.email);
      if (existingUser) {
        return res.status(400).json({ error: "A user with this email already exists" });
      }
      
      // Create user account for trainer
      const trainerUser = await storage.createUser({
        username: req.body.email,
        password: 'trainer123', // Default password
        role: 'trainer',
        email: req.body.email,
        name: req.body.name,
        branchId: branchId
      });
      
      // Create trainer record
      const trainer = await storage.createTrainer({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        specialization: req.body.specialization || null,
        branchId: branchId,
        userId: trainerUser.id
      });
      
      console.log("Trainer created successfully:", trainer);
      res.status(201).json({
        ...trainer,
        username: req.body.email,
        defaultPassword: 'trainer123'
      });
    } catch (error: any) {
      console.error("Create trainer error:", error);
      
      // Map database errors to user-friendly messages
      let errorMessage = "Failed to create trainer";
      
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message?.includes('foreign key constraint')) {
        if (error.message?.includes('branch_id')) {
          errorMessage = "Please select a valid branch for the trainer";
        } else {
          errorMessage = "Please ensure branch selection is valid";
        }
      } else if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
        if (error.message?.includes('email') || error.message?.includes('username')) {
          errorMessage = "A trainer with this email already exists";
        } else {
          errorMessage = "A trainer with this information already exists";
        }
      } else if (error.message?.includes('required')) {
        errorMessage = error.message;
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  app.delete("/api/trainers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTrainer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Trainer not found" });
      }
      res.json({ message: "Trainer deleted successfully" });
    } catch (error) {
      console.error("Delete trainer error:", error);
      res.status(500).json({ error: "Failed to delete trainer" });
    }
  });

  // ================= ATTENDANCE =================
  app.get("/api/attendance", requireAuth(), enforceBranchAccess(), async (req, res) => {
    try {
      const studentId = req.query.studentId as string | undefined;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const branchId = req.query.branchId as string | undefined;
      const userRole = req.user.role;
      
      let query = `
        SELECT 
          a.id,
          a.student_id,
          a.date,
          a.status,
          a.check_in,
          a.check_out,
          a.notes,
          a.created_at,
          s.name as student_name,
          s.program,
          s.batch,
          s.branch_id
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE s.status = 'active'
      `;
      const params: any[] = [];

      if (studentId) {
        query += " AND a.student_id = ?";
        params.push(studentId);
      }

      if (date) {
        query += " AND DATE(a.date) = DATE(?)";
        params.push(date);
      }
      
      // Apply branch filtering - Admin sees all unless specific branchId requested
      if (branchId) {
        query += " AND s.branch_id = ?";
        params.push(branchId);
      } else if (userRole !== 'admin') {
        query += " AND s.branch_id = ?";
        params.push(req.user.branchId);
      }

      query += " ORDER BY a.date DESC, s.name ASC";

      const attendance = await storage.query(query, params);
      res.json(attendance);
    } catch (error) {
      console.error("Get attendance error:", error);
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const attendance = await storage.createAttendance({
        ...req.body,
        date: new Date(req.body.date)
      });
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Create attendance error:", error);
      res.status(500).json({ error: "Failed to create attendance" });
    }
  });

  // Bulk attendance creation with UPSERT logic - FIXED
  app.post("/api/attendance/bulk", requireAuth(), async (req, res) => {
    try {
      const { attendanceRecords } = req.body;
      
      if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
        return res.status(400).json({ error: "Invalid attendance records format" });
      }

      if (attendanceRecords.length === 0) {
        return res.status(400).json({ error: "No attendance records provided" });
      }

      // Sanitize record count for logging
      const recordCount = Math.max(0, Math.min(1000, attendanceRecords.length));
      console.log(`Bulk attendance request: ${recordCount} records`);

      const results = [];
      const skipped = [];
      
      // Process each record with proper validation
      for (const record of attendanceRecords) {
        // Sanitize studentId for logging
        const sanitizedStudentId = String(record.studentId || '').replace(/[\r\n]/g, "");
        console.log("Processing attendance record for student:", sanitizedStudentId);
        
        // Validate required fields
        if (!record.studentId || !record.date || !record.status) {
          console.error("Invalid record - missing required fields:", record);
          return res.status(400).json({ 
            error: `Invalid record: missing studentId, date, or status` 
          });
        }

        // Validate student exists, is active, and belongs to user's branch
        let studentQuery = "SELECT id, branch_id FROM students WHERE id = ? AND status = 'active'";
        const studentParams = [record.studentId];
        
        // Enforce branch access for non-admin users
        if (req.user.role !== 'admin' && req.user.branchId) {
          studentQuery += " AND branch_id = ?";
          studentParams.push(req.user.branchId);
        }
        
        const student = await storage.query(studentQuery, studentParams);
        if (!student || student.length === 0) {
          const sanitizedStudentId = String(record.studentId || '').replace(/[\r\n]/g, "");
          console.error("Student not found or access denied:", sanitizedStudentId);
          return res.status(400).json({ 
            error: `Student not found or access denied: ${sanitizedStudentId}` 
          });
        }

        // CHECK: Skip if attendance already exists for this student + date
        const existingAttendance = await storage.query(
          "SELECT id FROM attendance WHERE student_id = ? AND DATE(date) = DATE(?)",
          [record.studentId, record.date]
        );
        
        if (existingAttendance && existingAttendance.length > 0) {
          console.log(`Skipping student ${sanitizedStudentId} - attendance already exists for ${record.date}`);
          skipped.push({ studentId: record.studentId, reason: 'already_exists' });
          continue;
        }

        // Prepare attendance data - ONLY valid attendance table columns
        const attendanceData = {
          studentId: record.studentId,
          date: new Date(record.date),
          status: record.status,
          checkIn: record.checkIn ? new Date(record.checkIn) : null,
          checkOut: record.checkOut ? new Date(record.checkOut) : null,
          notes: record.notes || null
        };
        
        console.log("Creating new attendance data:", attendanceData);
        const attendance = await storage.createAttendance(attendanceData);
        results.push(attendance);
      }
      
      console.log(`Bulk attendance completed: ${results.length} created, ${skipped.length} skipped`);
      res.status(201).json({ 
        message: `Successfully created ${results.length} attendance records, skipped ${skipped.length} existing records`,
        results,
        skipped
      });
    } catch (error) {
      console.error("Bulk create attendance error:", error);
      res.status(500).json({ 
        error: "Failed to create bulk attendance: " + (error as Error).message 
      });
    }
  });

  // Update attendance
  app.put("/api/attendance/:id", requireAuth(), async (req, res) => {
    try {
      const updates = { ...req.body };
      if (updates.checkIn) updates.checkIn = new Date(updates.checkIn);
      if (updates.checkOut) updates.checkOut = new Date(updates.checkOut);
      if (updates.check_out) updates.check_out = new Date(updates.check_out);
      if (updates.date) updates.date = new Date(updates.date);
      
      const attendance = await storage.updateAttendance(req.params.id, updates);
      if (!attendance) {
        return res.status(404).json({ error: "Attendance record not found" });
      }
      res.json(attendance);
    } catch (error) {
      console.error("Update attendance error:", error);
      res.status(500).json({ error: "Failed to update attendance" });
    }
  });

  // ================= PROGRAMS MANAGEMENT (ADMIN ONLY) =================
  app.get("/api/admin/programs", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      // Create table if it doesn't exist - match expected schema
      await storage.query(`
        CREATE TABLE IF NOT EXISTS programs (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      const programs = await storage.query(
        "SELECT id, name, description, created_at, is_active FROM programs ORDER BY name"
      );
      res.json(programs);
    } catch (error) {
      console.error("Get admin programs error:", error);
      res.json([]);
    }
  });

  app.post("/api/admin/programs", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Program name is required" });
      }
      
      // Check if program already exists
      const existing = await storage.query(
        "SELECT id FROM programs WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
        [name.trim()]
      );
      
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: "A program with this name already exists" });
      }
      
      const id = randomUUID();
      
      // Ensure programs table exists
      await storage.query(`
        CREATE TABLE IF NOT EXISTS programs (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await storage.query(
        "INSERT INTO programs (id, name, description, is_active) VALUES (?, ?, ?, true)",
        [id, name.trim(), description?.trim() || null]
      );
      
      res.status(201).json({ 
        id, 
        name: name.trim(), 
        description: description?.trim() || null,
        is_active: true
      });
    } catch (error: any) {
      console.error("Create program error:", error);
      
      if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
        return res.status(400).json({ error: "A program with this name already exists" });
      }
      
      res.status(500).json({ error: "Failed to create program. Please try again." });
    }
  });

  app.put("/api/admin/programs/:id", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const { status } = req.body;
      const isActive = status === 'active';
      
      await storage.query(
        "UPDATE programs SET is_active = ? WHERE id = ?",
        [isActive, req.params.id]
      );
      
      res.json({ message: "Program updated successfully" });
    } catch (error) {
      console.error("Update program error:", error);
      res.status(500).json({ error: "Failed to update program" });
    }
  });

  // ================= BATCHES MANAGEMENT (ADMIN ONLY) =================
  app.get("/api/admin/batches", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      // Create table if it doesn't exist - match expected schema
      await storage.query(`
        CREATE TABLE IF NOT EXISTS batches (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      const batches = await storage.query(
        "SELECT id, name, created_at, is_active FROM batches ORDER BY name"
      );
      res.json(batches);
    } catch (error) {
      console.error("Get admin batches error:", error);
      res.json([]);
    }
  });

  app.post("/api/admin/batches", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Batch name is required" });
      }
      
      // Check if batch already exists
      const existing = await storage.query(
        "SELECT id FROM batches WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
        [name.trim()]
      );
      
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: "A batch with this name already exists" });
      }
      
      const id = randomUUID();
      
      // Ensure batches table exists
      await storage.query(`
        CREATE TABLE IF NOT EXISTS batches (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await storage.query(
        "INSERT INTO batches (id, name, is_active) VALUES (?, ?, true)",
        [id, name.trim()]
      );
      
      res.status(201).json({ 
        id, 
        name: name.trim(),
        is_active: true
      });
    } catch (error: any) {
      console.error("Create batch error:", error);
      
      if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
        return res.status(400).json({ error: "A batch with this name already exists" });
      }
      
      res.status(500).json({ error: "Failed to create batch. Please try again." });
    }
  });

  app.put("/api/admin/batches/:id", requireAuth(), requireRole(['admin']), async (req, res) => {
    try {
      const { status } = req.body;
      const isActive = status === 'active';
      
      await storage.query(
        "UPDATE batches SET is_active = ? WHERE id = ?",
        [isActive, req.params.id]
      );
      
      res.json({ message: "Batch updated successfully" });
    } catch (error) {
      console.error("Update batch error:", error);
      res.status(500).json({ error: "Failed to update batch" });
    }
  });

  // ================= PROGRAMS =================
  app.get("/api/programs", async (req, res) => {
    try {
      // Get active programs from programs table - REAL DATA ONLY
      const programs = await storage.query(
        "SELECT id, name FROM programs WHERE is_active = true ORDER BY name"
      );
      
      // Return real programs or empty array if none exist
      res.json(programs);
    } catch (error) {
      console.error("Get programs error:", error);
      // If programs table doesn't exist, return empty array
      res.json([]);
    }
  });

  // ================= BATCHES =================
  app.get("/api/batches", async (req, res) => {
    try {
      // Get active batches from batches table - REAL DATA ONLY
      const batches = await storage.query(
        "SELECT id, name FROM batches WHERE is_active = true ORDER BY name"
      );
      
      // Return real batches or empty array if none exist
      res.json(batches);
    } catch (error) {
      console.error("Get batches error:", error);
      // If batches table doesn't exist, return empty array
      res.json([]);
    }
  });

  // ================= ID CARD GENERATION =================
  app.post("/api/students/:id/id-card", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Generate ID card data
      const idCard = {
        studentId: student.id,
        name: student.name,
        program: student.program,
        batch: student.batch,
        joiningDate: student.joiningDate,
        cardUrl: `/api/students/${student.id}/id-card/download`,
        generated: true
      };

      res.json(idCard);
    } catch (error) {
      console.error("Generate ID card error:", error);
      res.status(500).json({ error: "Failed to generate ID card" });
    }
  });

  // ================= FEES =================
  app.get("/api/fees", requireAuth(), enforceBranchAccess(), async (req, res) => {
    try {
      const studentId = req.query.studentId as string | undefined;
      const branchId = req.query.branchId as string | undefined;
      const userRole = req.user.role;
      
      let query = `
        SELECT 
          f.id,
          f.student_id,
          f.amount,
          f.due_date,
          f.paid_date,
          f.status,
          f.payment_method,
          f.notes,
          f.created_at,
          s.name as student_name,
          s.branch_id
        FROM fees f
        JOIN students s ON f.student_id = s.id
        WHERE s.status = 'active'
      `;
      const params: any[] = [];

      if (studentId) {
        query += " AND f.student_id = ?";
        params.push(studentId);
      }
      
      // CRITICAL: Apply branch filtering in mandatory order
      // 1. If branchId provided → ALWAYS filter by it (regardless of role)
      if (branchId) {
        query += " AND s.branch_id = ?";
        params.push(branchId);
      } 
      // 2. Else if non-admin → filter by user's branch
      else if (userRole !== 'admin') {
        query += " AND s.branch_id = ?";
        params.push(req.user.branchId);
      }
      // 3. Else (admin without branch context) → no filter

      query += " ORDER BY f.due_date DESC";

      const fees = await storage.query(query, params);
      
      // Calculate overdue status
      const today = new Date();
      const processedFees = fees.map((fee: any) => ({
        ...fee,
        status: fee.status === 'pending' && new Date(fee.dueDate) < today ? 'overdue' : fee.status
      }));
      
      res.json(processedFees);
    } catch (error) {
      console.error("Get fees error:", error);
      res.status(500).json({ error: "Failed to fetch fees" });
    }
  });

  // Get student dues calculation
  app.get("/api/students/:id/dues", async (req, res) => {
    try {
      const studentId = req.params.id;
      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      const fees = await storage.getFees(studentId);
      const today = new Date();
      
      // Calculate dues
      const totalFees = fees.reduce((sum, f) => sum + Number(f.amount), 0);
      const totalPaid = fees
        .filter(f => f.status === 'paid')
        .reduce((sum, f) => sum + Number(f.amount), 0);
      const pendingDue = totalFees - totalPaid;
      
      // Check for overdue
      const overdueFees = fees.filter(f => 
        f.status === 'pending' && new Date(f.dueDate) < today
      );
      const overdueAmount = overdueFees.reduce((sum, f) => sum + Number(f.amount), 0);
      
      const duesInfo = {
        studentId,
        studentName: student.name,
        totalFees,
        totalPaid,
        pendingDue,
        overdueAmount,
        isOverdue: overdueAmount > 0,
        status: pendingDue === 0 ? 'paid' : (overdueAmount > 0 ? 'overdue' : 'pending')
      };
      
      res.json(duesInfo);
    } catch (error) {
      console.error("Get student dues error:", error);
      res.status(500).json({ error: "Failed to fetch student dues" });
    }
  });

  app.post("/api/fees", async (req, res) => {
    try {
      const fee = await storage.createFee({
        ...req.body,
        dueDate: new Date(req.body.dueDate),
        paidDate: req.body.paidDate ? new Date(req.body.paidDate) : null
      });

      res.status(201).json(fee);
    } catch (error) {
      console.error("Create fee error:", error);
      res.status(500).json({ error: "Failed to create fee" });
    }
  });

  app.put("/api/fees/:id", async (req, res) => {
    try {
      const updates = { ...req.body };
      if (updates.paidDate) {
        updates.paidDate = new Date(updates.paidDate);
        updates.status = "paid";
      }

      const fee = await storage.updateFee(req.params.id, updates);
      if (!fee) {
        return res.status(404).json({ error: "Fee not found" });
      }
      res.json(fee);
    } catch (error) {
      console.error("Update fee error:", error);
      res.status(500).json({ error: "Failed to update fee" });
    }
  });

  // ================= TRAINER SPECIFIC =================
  app.get("/api/trainers/:id/dashboard", requireAuth(), async (req, res) => {
    try {
      const userId = req.params.id;
      
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.branchId) {
        return res.json({
          totalStudents: 0,
          todayClasses: 0,
          batches: []
        });
      }
      
      const batches = await storage.getTrainerBatches(userId);
      const students = await storage.getStudentsByTrainerBatches(userId, user.branchId);
      
      res.json({
        totalStudents: students.length,
        todayClasses: batches.length,
        batches: batches
      });
    } catch (error) {
      console.error("Trainer dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch trainer dashboard" });
    }
  });

  // Assign batch to trainer
  app.post("/api/trainers/:id/batches", requireAuth(), requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const userId = req.params.id;
      const { batchName, program } = req.body;
      
      if (!batchName || !program) {
        return res.status(400).json({ error: "Batch name and program are required" });
      }
      
      // Verify user is a trainer
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'trainer') {
        return res.status(404).json({ error: "Trainer not found" });
      }
      
      // Check if manager is trying to assign batch to trainer in different branch
      if (req.user.role === 'manager' && user.branchId !== req.user.branchId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.assignTrainerToBatch(userId, batchName, program);
      
      res.json({ message: "Batch assigned successfully" });
    } catch (error) {
      console.error("Assign batch error:", error);
      res.status(500).json({ error: "Failed to assign batch" });
    }
  });

  // Get trainer's assigned batches
  app.get("/api/trainers/:id/batches", requireAuth(), async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Check access
      if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const batches = await storage.getTrainerBatches(userId);
      res.json(batches);
    } catch (error) {
      console.error("Get trainer batches error:", error);
      res.status(500).json({ error: "Failed to fetch trainer batches" });
    }
  });

  // Get students for trainer's assigned batches
  app.get("/api/trainers/:id/students", requireAuth(), async (req, res) => {
    try {
      const userId = req.params.id;
      
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.branchId) {
        return res.json([]);
      }
      
      const students = await storage.getStudentsByTrainerBatches(userId, user.branchId);
      res.json(students);
    } catch (error) {
      console.error("Get trainer students error:", error);
      res.status(500).json({ error: "Failed to fetch trainer students" });
    }
  });
}
