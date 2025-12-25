import type { Express } from "express";
import { storage } from "./storage";
import { randomUUID } from "crypto";

// Enhanced RBAC Middleware with Branch Isolation
function requireAuth() {
  return async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];
    const userBranchId = req.headers['x-user-branch'];
    
    if (!userRole || !userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    req.user = {
      id: userId,
      role: userRole,
      branchId: userBranchId
    };
    
    next();
  };
}

function requireRole(allowedRoles: string[]) {
  return async (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}

function enforceBranchAccess() {
  return async (req: any, res: any, next: any) => {
    // Admin can access all branches
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Non-admin users MUST be restricted to their branch
    if (!req.user.branchId) {
      return res.status(403).json({ error: "User not assigned to any branch" });
    }
    
    // Force branch filtering for non-admin users
    req.query.branchId = req.user.branchId;
    req.body.branchId = req.user.branchId;
    
    next();
  };
}

export async function registerRoutes(app: Express): Promise<void> {

  // ================= CORS =================
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-role, x-user-id, x-user-branch");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // ================= AUTH =================
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const identifier = username || email;

      console.log("Login attempt for:", identifier);

      if (!identifier || !password) {
        return res.status(400).json({ error: "Username/email and password required" });
      }

      const user = await storage.getUserByUsername(identifier);
      console.log("User found:", user ? { id: user.id, username: user.username, role: user.role } : "No user found");

      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        branch_id: user.branch_id
      };

      console.log("Login successful, returning user:", userResponse);
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

  // ================= STUDENTS =================
  app.get("/api/students", requireAuth(), enforceBranchAccess(), async (req, res) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const programFilter = req.query.program as string | undefined;
      const userRole = req.user.role;
      
      let query = `
        SELECT DISTINCT s.*, b.name as branch_name 
        FROM students s 
        LEFT JOIN branches b ON s.branch_id = b.id 
        LEFT JOIN student_programs sp ON s.id = sp.student_id
        LEFT JOIN programs p ON sp.program_id = p.id
        WHERE s.status = 'active'
      `;
      const params: any[] = [];
      
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
      
      // Apply program filtering if specified
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

  app.post("/api/students", requireAuth(), async (req, res) => {
    try {
      console.log("Creating student with data:", req.body);
      
      // Validate required fields
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
      
      // Validate branch exists
      const branch = await storage.query("SELECT id FROM branches WHERE id = ?", [req.body.branchId]);
      if (!branch || branch.length === 0) {
        return res.status(400).json({ error: "Please select a valid branch" });
      }
      
      // Validate programs exist
      for (const programId of req.body.programs) {
        const program = await storage.query("SELECT id FROM programs WHERE id = ?", [programId]);
        if (!program || program.length === 0) {
          return res.status(400).json({ error: `Invalid program selected: ${programId}. Please refresh and try again.` });
        }
      }
      
      // Validate batch exists
      const batch = await storage.query("SELECT id FROM batches WHERE id = ?", [req.body.batchId]);
      if (!batch || batch.length === 0) {
        return res.status(400).json({ error: "Please select a valid batch from the list" });
      }

      const student = await storage.createStudent({
        ...req.body,
        joiningDate: req.body.joiningDate
          ? new Date(req.body.joiningDate)
          : new Date()
      });

      console.log("Student created successfully:", student);
      res.status(201).json(student);
    } catch (error: any) {
      console.error("Create student error:", error);
      
      // Map database errors to user-friendly messages
      let errorMessage = "Failed to create student";
      
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message?.includes('foreign key constraint')) {
        if (error.message?.includes('branch_id')) {
          errorMessage = "Please select a valid branch for the student";
        } else if (error.message?.includes('batch_id')) {
          errorMessage = "Please select a valid batch for the student";
        } else {
          errorMessage = "Please ensure all selections are valid and try again";
        }
      } else if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
        errorMessage = "A student with this information already exists";
      } else if (error.message?.includes('student_programs')) {
        errorMessage = "Error saving student programs. Please ensure programs are selected correctly.";
      } else if (error.message?.includes('required')) {
        errorMessage = error.message;
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.updateStudent(req.params.id, req.body);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Update student error:", error);
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteStudent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Delete student error:", error);
      res.status(500).json({ error: "Failed to delete student" });
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
      console.log("Bulk attendance request:", req.body);
      const { attendanceRecords } = req.body;
      
      if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
        return res.status(400).json({ error: "Invalid attendance records format" });
      }

      if (attendanceRecords.length === 0) {
        return res.status(400).json({ error: "No attendance records provided" });
      }

      const results = [];
      
      // Process each record with proper validation
      for (const record of attendanceRecords) {
        console.log("Processing attendance record:", record);
        
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
          console.error("Student not found or access denied:", record.studentId);
          return res.status(400).json({ 
            error: `Student not found or access denied: ${record.studentId}` 
          });
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
        
        console.log("Upserting attendance data:", attendanceData);
        const attendance = await storage.upsertAttendance(attendanceData);
        results.push(attendance);
      }
      
      console.log(`Bulk attendance completed: ${results.length} records processed`);
      res.status(201).json({ 
        message: `Successfully processed ${results.length} attendance records`,
        results 
      });
    } catch (error) {
      console.error("Bulk create attendance error:", error);
      res.status(500).json({ 
        error: "Failed to create bulk attendance: " + (error as Error).message 
      });
    }
  });

  // Update attendance
  app.put("/api/attendance/:id", async (req, res) => {
    try {
      const updates = { ...req.body };
      if (updates.checkIn) updates.checkIn = new Date(updates.checkIn);
      if (updates.checkOut) updates.checkOut = new Date(updates.checkOut);
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
        joiningDate: student.joining_date,
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
        status: fee.status === 'pending' && new Date(fee.due_date) < today ? 'overdue' : fee.status
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
        f.status === 'pending' && new Date(f.due_date) < today
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
      if (!user || !user.branch_id) {
        return res.json({
          totalStudents: 0,
          todayClasses: 0,
          batches: []
        });
      }
      
      const batches = await storage.getTrainerBatches(userId);
      const students = await storage.getStudentsByTrainerBatches(userId, user.branch_id);
      
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
      if (req.user.role === 'manager' && user.branch_id !== req.user.branchId) {
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
      if (!user || !user.branch_id) {
        return res.json([]);
      }
      
      const students = await storage.getStudentsByTrainerBatches(userId, user.branch_id);
      res.json(students);
    } catch (error) {
      console.error("Get trainer students error:", error);
      res.status(500).json({ error: "Failed to fetch trainer students" });
    }
  });
}
