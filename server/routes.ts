import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  _httpServer: Server,
  app: Express
): Promise<Server> {

  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // ================= AUTH =================
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("Login attempt:", { username, password });

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      console.log("User found:", user ? { username: user.username, role: user.role } : "No user found");

      if (!user || user.password !== password) {
        console.log("Login failed - invalid credentials");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log("Login successful for:", user.username);
      res.json({
        user: { ...user, password: undefined },
        token: "mock-jwt-token"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // ================= DASHBOARD =================
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const students = await storage.getStudents();
      const fees = await storage.getFees();
      const today = new Date();
      const attendance = await storage.getAttendance(undefined, today);

      const stats = {
        totalStudents: students.length,
        presentToday: attendance.filter(a => a.status === "present").length,
        absentToday: attendance.filter(a => a.status === "absent").length,
        feesCollectedToday: fees
          .filter(f => f.paidDate && new Date(f.paidDate).toDateString() === today.toDateString())
          .reduce((sum, f) => sum + Number(f.amount), 0),
        pendingDues: fees
          .filter(f => f.status === "pending")
          .reduce((sum, f) => sum + Number(f.amount), 0)
      };

      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ================= STUDENTS =================
  app.get("/api/students", async (req, res) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const students = await storage.getStudents(branchId);
      res.json(students);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ error: "Failed to fetch students" });
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

  app.post("/api/students", async (req, res) => {
    try {
      console.log("Creating student with payload:", req.body);

      // Ensure we have a branch
      let branchId = req.body.branchId;
      if (!branchId) {
        const branches = await storage.getBranches();
        if (branches.length === 0) {
          // Create default branch
          const defaultBranch = await storage.createBranch({
            name: "Main Branch",
            address: "123 Academy Street",
            phone: "+1234567890"
          });
          branchId = defaultBranch.id;
        } else {
          branchId = branches[0].id;
        }
      }

      const studentData = {
        ...req.body,
        branchId,
        joiningDate: req.body.joiningDate ? new Date(req.body.joiningDate) : new Date()
      };

      const student = await storage.createStudent(studentData);
      console.log("Student created successfully:", student.id);
      res.status(201).json(student);
    } catch (error) {
      console.error("Create student error:", error);
      res.status(500).json({ error: "Failed to create student: " + error.message });
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
  app.get("/api/trainers", async (req, res) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const trainers = await storage.getTrainers(branchId);
      res.json(trainers);
    } catch (error) {
      console.error("Get trainers error:", error);
      res.status(500).json({ error: "Failed to fetch trainers" });
    }
  });

  app.post("/api/trainers", async (req, res) => {
    try {
      const trainer = await storage.createTrainer(req.body);
      res.status(201).json(trainer);
    } catch (error) {
      console.error("Create trainer error:", error);
      res.status(500).json({ error: "Failed to create trainer" });
    }
  });

  // ================= ATTENDANCE =================
  app.get("/api/attendance", async (req, res) => {
    try {
      const studentId = req.query.studentId as string | undefined;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const attendance = await storage.getAttendance(studentId, date);
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

  // ================= FEES =================
  app.get("/api/fees", async (req, res) => {
    try {
      const studentId = req.query.studentId as string | undefined;
      const fees = await storage.getFees(studentId);
      res.json(fees);
    } catch (error) {
      console.error("Get fees error:", error);
      res.status(500).json({ error: "Failed to fetch fees" });
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

  return _httpServer;
}