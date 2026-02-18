import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const SALT_ROUNDS = 10;

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string | null;
        fullName: string;
        role: "student" | "teacher" | "admin" | "organization";
      };
    }
  }
}

// Authentication middleware
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Role-based access control middleware
const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.log(`Access denied. User role: ${req.user?.role}, Required: ${roles.join(",")}`);
      return res.status(403).json({ message: `Forbidden. Required: ${roles.join(",")}, Found: ${req.user?.role}` });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check route
  app.get("/api/health-check", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ============ AUTHENTICATION ROUTES ============


  // Public route to get classes for registration
  app.get("/api/public/classes", async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      const publicClasses = classes.map(c => ({
        id: c.id,
        name: c.name,
        section: c.section
      }));
      res.json(publicClasses);
    } catch (error: any) {
      console.error("Auth error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, fullName, role, studentId, classId, rollNumber } = req.body;

      // Validate required fields
      if (!username || !password || !fullName) {
        return res.status(400).json({ message: "Username, password, and full name are required" });
      }

      // SECURITY: Public registration is restricted to Students ONLY.
      if (role && role !== "student") {
        return res.status(403).json({
          message: "Public registration is available for Students only. Teachers and Admins must be added by an Administrator."
        });
      }

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // If student, check studentId
      if (studentId) {
        const existingStudentId = await storage.getUserByStudentId(studentId);
        if (existingStudentId) {
          return res.status(400).json({ message: "Student ID already exists" });
        }
      }

      // If student and classId provided, check roll number availability
      if (role === "student" && classId && rollNumber) {
        const isAvailable = await storage.checkRollNumberAvailability(classId, parseInt(rollNumber));
        if (!isAvailable) {
          return res.status(400).json({ message: `Roll number ${rollNumber} is already assigned in this class` });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        fullName,
        role: role || "student",
        studentId: role === "student" ? studentId : undefined,
      });

      // If student and classId provided, enroll them
      if (role === "student" && classId) {
        try {
          await storage.enrollStudent({
            studentId: user.id,
            classId,
            rollNumber: rollNumber ? parseInt(rollNumber) : undefined
          });
        } catch (enrollError: any) {
          console.error("Enrollment error during registration:", enrollError);
          // We don't fail registration if enrollment fails, but we might want to warn
          // For now, we'll just log it. The user is created.
        }
      }

      // Generate token
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // INITIAL SETUP: Create first admin if none exist
  app.get("/api/auth/setup-admin", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const adminExists = allUsers.some(u => u.role === "admin");

      if (adminExists) {
        return res.json({ message: "System already has administrators." });
      }

      const hashedPassword = await bcrypt.hash("admin123", SALT_ROUNDS);
      const admin = await storage.createUser({
        username: "admin",
        password: hashedPassword,
        fullName: "System Administrator",
        email: "admin@school.com",
        role: "admin"
      });

      res.json({
        message: "Admin account created successfully",
        credentials: { username: "admin", password: "admin123" }
      });
    } catch (error: any) {
      console.error("Setup error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, role } = req.body;

      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      if (!role) {
        return res.status(400).json({ message: "Role selection is required" });
      }

      // Try to find user by username or studentId
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByStudentId(username);
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Validate role matches
      if (user.role !== role) {
        return res.status(403).json({
          message: `Access denied: You cannot login as ${role}. Your account role is ${user.role}`
        });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          studentId: user.studentId,
        },
        token,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    res.json({ user: req.user });
  });





  app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Incorrect current password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await storage.updateUserPassword(userId, hashedPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  // ============ ADMIN ROUTES ============

  app.get("/api/admin/stats", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();


      const classes = await storage.getAllClasses();
      const subjects = await storage.getAllSubjects();

      const students = allUsers.filter(u => u.role === "student");
      const teachers = allUsers.filter(u => u.role === "teacher");
      // Check for 'admin' and 'organization'
      const admins = allUsers.filter(u => ["admin", "organization"].includes(u.role.toLowerCase().trim()));

      res.json({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalSubjects: subjects.length,
        totalAdmins: admins.length,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Classes Management
  app.get("/api/admin/classes", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/classes", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { name, section, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Class name is required" });
      }

      const newClass = await storage.createClass({ name, section, description });
      res.json(newClass);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/admin/classes/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteClass(req.params.id);
      res.json({ message: "Class deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting class:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Subjects Management
  app.get("/api/admin/subjects", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/subjects", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { name, description, classId } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Subject name is required" });
      }

      const newSubject = await storage.createSubject({ name, description });

      // Auto-assign to class if provided
      if (classId) {
        await storage.assignSubjectToClass({
          classId,
          subjectId: newSubject.id
        });
      }

      res.json(newSubject);
    } catch (error) {
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/admin/subjects/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteSubject(req.params.id);
      res.json({ message: "Subject deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Teachers Management
  app.get("/api/admin/teachers", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const teachers = await storage.getUsersByRole("teacher");
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/teachers", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { username, email, password, fullName } = req.body;

      if (!username || !email || !password || !fullName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const teacher = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        fullName,
        role: "teacher",
      });

      res.json(teacher);
    } catch (error) {
      console.error("Error creating teacher:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Students Management
  app.get("/api/admin/students", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const students = await storage.getAllStudentsWithDetails();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/students", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { username, email, password, fullName, studentId } = req.body;

      if (!username || !email || !password || !fullName || !studentId) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingStudentId = await storage.getUserByStudentId(studentId);
      if (existingStudentId) {
        return res.status(400).json({ message: "Student ID already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const student = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        fullName,
        role: "student",
        studentId,
      });

      res.json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  app.patch("/api/admin/users/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const userId = req.params.id;
      const { fullName, email, role, password, studentId, rollNumber } = req.body;

      const updateData: any = { fullName, email, role, studentId };
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
      }

      const updatedUser = await storage.updateUser(userId, updateData);

      // If rollNumber is provided, update student enrollment
      if (rollNumber !== undefined && rollNumber !== null) {
        await storage.updateStudentEnrollment(userId, parseInt(rollNumber));
      }

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Assign Teacher to Class
  app.post("/api/admin/assign-teacher", authenticateToken, requireRole("admin", "organization"), async (req, res) => {
    try {
      const { teacherId, classId, classIds, subjectId } = req.body;

      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID is required" });
      }

      if (!classId && (!classIds || classIds.length === 0)) {
        return res.status(400).json({ message: "At least one Class ID is required" });
      }

      // Handle multiple classes
      if (classIds && Array.isArray(classIds) && classIds.length > 0) {
        const results = [];
        for (const cid of classIds) {
          try {
            const assignment = await storage.assignTeacherToClass({ teacherId, classId: cid, subjectId });
            results.push(assignment);
          } catch (e: any) {
            // Ignore "already assigned" errors for batch operations, just continue
            if (!e.message.includes("already assigned")) {
              console.error(`Failed to assign class ${cid}:`, e);
            }
          }
        }
        return res.json({ message: "Assignments processed", count: results.length });
      }

      // Handle single class (legacy support)
      const assignment = await storage.assignTeacherToClass({ teacherId, classId, subjectId });
      res.json(assignment);
    } catch (error: any) {
      console.error("Error assigning teacher:", error);
      if (error.message.includes("already assigned")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/teacher-assignments", authenticateToken, requireRole("admin", "organization"), async (req, res) => {
    try {
      const assignments = await storage.getAllTeacherAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/admin/teacher-assignments/:id", authenticateToken, requireRole("admin", "organization"), async (req, res) => {
    try {
      await storage.deleteTeacherAssignment(req.params.id);
      res.json({ message: "Assignment deleted successfully" });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Enroll Student in Class
  app.post("/api/admin/enroll-student", authenticateToken, requireRole("admin", "organization"), async (req, res) => {
    try {
      const { studentId, classId, rollNumber } = req.body;

      if (!studentId || !classId) {
        return res.status(400).json({ message: "Student ID and Class ID are required" });
      }

      if (rollNumber && (rollNumber < 1 || rollNumber > 50)) {
        return res.status(400).json({ message: "Roll number must be between 1 and 50" });
      }

      const enrollment = await storage.enrollStudent({
        studentId,
        classId,
        rollNumber: rollNumber ? parseInt(rollNumber) : undefined
      });
      res.json(enrollment);
    } catch (error: any) {
      console.error("Error enrolling student:", error);
      if (error.message.includes("Roll number") || error.message.includes("already enrolled")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });


  app.get("/api/admin/list-admins", authenticateToken, requireRole("admin", "organization"), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      // Filter for admins and organization roles
      const admins = allUsers.filter(u => ["admin", "organization"].includes(u.role.toLowerCase().trim()));
      res.json(admins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Server error" });
    }
  });


  // ============ TEACHER ROUTES ============

  app.get("/api/teacher/stats", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;

      const myClasses = await storage.getClassesByTeacher(teacherId);
      const myExams = await storage.getExamsByTeacher(teacherId);
      const myStudents = await storage.getStudentsByTeacher(teacherId);

      // Calculate missed exams
      let missedExams = 0;
      const now = new Date();
      const endedExams = myExams.filter(e => e.isPublished && new Date(e.endsAt) < now);

      for (const exam of endedExams) {
        // Get students in the exam's class (or specific logic if enrolled differently)
        // Assuming students are in classes.
        // We need to know how many students are in exam.classId
        const studentsInClass = await storage.getStudentsByClass(exam.classId);
        const attempts = await storage.getAttemptsByExam(exam.id); // Valid submitted attempts
        const submittedCount = attempts.filter((a: any) => a.isSubmitted).length;

        missedExams += Math.max(0, studentsInClass.length - submittedCount);
      }

      res.json({
        totalClasses: myClasses.length,
        totalExams: myExams.length,
        totalStudents: myStudents.length,
        missedExams
      });
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/teacher/students", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      console.log(`Fetching students for teacher: ${teacherId}`);
      const students = await storage.getStudentsByTeacher(teacherId);
      console.log(`Found ${students.length} students for teacher ${teacherId}`);
      res.json(students);
    } catch (error) {
      console.error("Error fetching teacher students:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/teacher/students/:studentId/attempts", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const studentId = req.params.studentId;

      // Verify teacher has access to this student
      const students = await storage.getStudentsByTeacher(teacherId);
      const hasAccess = students.some(s => s.id === studentId);

      if (!hasAccess) {
        return res.status(403).json({ message: "You do not have access to this student" });
      }

      const attempts = await storage.getAttemptsByStudent(studentId);

      // Enrich with Exam titles
      const attemptsWithDetails = await Promise.all(attempts.map(async (attempt) => {
        const exam = await storage.getExam(attempt.examId);
        return {
          ...attempt,
          examTitle: exam?.title || "Unknown Exam",
          maxScore: exam?.totalMarks || 100
        };
      }));

      res.json(attemptsWithDetails);
    } catch (error) {
      console.error("Error fetching student attempts:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get ONLY assigned classes (for Dashboard)
  app.get("/api/teacher/classes", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const classes = await storage.getClassesByTeacher(teacherId);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching teacher classes:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get ALL classes (for Create Exam dropdown)
  app.get("/api/teacher/all-classes", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching all classes:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get students in assigned class
  app.get("/api/teacher/class/:id/students", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const classId = req.params.id;

      // Verify teacher is assigned to this class
      const myClasses = await storage.getClassesByTeacher(teacherId);
      const isAssigned = myClasses.some(c => c.id === classId);

      if (!isAssigned) {
        return res.status(403).json({ message: "You are not assigned to this class" });
      }

      const students = await storage.getStudentsByClass(classId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching class students:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get teacher's exams
  app.get("/api/teacher/exams", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const exams = await storage.getExamsByTeacher(teacherId);
      res.json(exams);
    } catch (error) {
      console.error("Error fetching teacher exams:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create exam
  app.post("/api/teacher/exams", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const { questions, classIds, ...examData } = req.body;

      console.log("=== EXAM CREATION REQUEST ===");
      console.log("Teacher ID:", teacherId);
      console.log("Class IDs:", classIds);

      const primaryClassId = (classIds && classIds.length > 0) ? classIds[0] : examData.classId;

      // Validate required fields
      if (!examData.title || !primaryClassId) {
        return res.status(400).json({ message: "Title and class are required" });
      }

      if (!questions || questions.length === 0) {
        return res.status(400).json({ message: "At least one question is required" });
      }

      // Create exam
      const exam = await storage.createExam({
        ...examData,
        classId: primaryClassId,
        scheduledAt: examData.scheduledAt ? new Date(examData.scheduledAt) : new Date(),
        endsAt: examData.endsAt ? new Date(examData.endsAt) : new Date(),
        teacherId,
        status: "draft",
        isPublished: false,
      }, classIds);

      console.log("Exam created:", exam.id);

      // Create questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        // Extract image data if questionText starts with [IMAGE]
        let questionText = q.questionText || "";
        let imageData = null;

        if (questionText.startsWith("[IMAGE]")) {
          imageData = questionText.substring(7);
          questionText = `Question ${i + 1}`;
        }

        const question = await storage.createQuestion({
          examId: exam.id,
          questionText,
          imageData,
          questionType: q.questionType || "mcq",
          marks: q.marks || 1,
          negativeMarks: q.negativeMarks || 0,
          difficulty: q.difficulty || "medium",
          subjectId: q.subjectId || null,
          orderIndex: i,
        });

        // Create options for MCQ/MSQ/True-False
        if (q.options && q.options.length > 0) {
          for (let j = 0; j < q.options.length; j++) {
            const opt = q.options[j];
            await storage.createQuestionOption({
              questionId: question.id,
              optionText: opt.text || "",
              isCorrect: opt.isCorrect || false,
              orderIndex: j,
            });
          }
        }

        // Create numeric answer
        if (q.numericAnswer !== undefined && q.numericAnswer !== null) {
          await storage.createNumericAnswer({
            questionId: question.id,
            correctAnswer: q.numericAnswer,
            tolerance: q.tolerance !== undefined ? q.tolerance : null,
          });
        }
      }

      console.log("Exam created successfully with", questions.length, "questions");
      res.json({ message: "Exam created successfully", exam });
    } catch (error) {
      console.error("Error creating exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get exam details
  app.get("/api/teacher/exam/:id", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const examId = req.params.id;

      const exam = await storage.getExam(examId);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      if (exam.teacherId !== teacherId) return res.status(403).json({ message: "Access denied" });

      const questions = await storage.getQuestionsByExam(examId);
      const classIds = await storage.getClassesByExam(examId);
      const questionsWithDetails = await Promise.all(questions.map(async (q) => {
        const options = await storage.getOptionsByQuestion(q.id);
        const numericAnswer = await storage.getNumericAnswerByQuestion(q.id);
        return {
          ...q,
          options,
          numericAnswer: numericAnswer?.correctAnswer,
          numericTolerance: numericAnswer?.tolerance,
        };
      }));

      res.json({ ...exam, classIds, questions: questionsWithDetails });
    } catch (error) {
      console.error("Error fetching exam details:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update exam (Draft only)
  app.put("/api/teacher/exam/:id", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const examId = req.params.id;
      const { questions, classIds, ...examData } = req.body;

      const exam = await storage.getExam(examId);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      if (exam.teacherId !== teacherId) return res.status(403).json({ message: "Access denied" });

      if (exam.isPublished) return res.status(400).json({ message: "Cannot edit published exam" });

      const primaryClassId = (classIds && classIds.length > 0) ? classIds[0] : examData.classId;

      // Update exam metadata
      const updatedExam = await storage.updateExam(examId, {
        ...examData,
        classId: primaryClassId || exam.classId,
        scheduledAt: examData.scheduledAt ? new Date(examData.scheduledAt) : undefined,
        endsAt: examData.endsAt ? new Date(examData.endsAt) : undefined,
      }, classIds);

      // Update questions (Delete all and recreate)
      if (questions && questions.length > 0) {
        await storage.deleteQuestionsByExam(examId);

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          let questionText = q.questionText || "";
          let imageData = null;

          if (questionText.startsWith("[IMAGE]")) {
            imageData = questionText.substring(7);
            questionText = `Question ${i + 1}`;
          }

          const question = await storage.createQuestion({
            examId: exam.id,
            questionText,
            imageData,
            questionType: q.questionType || "mcq",
            marks: q.marks || 1,
            negativeMarks: q.negativeMarks || 0,
            difficulty: q.difficulty || "medium",
            subjectId: q.subjectId || null,
            orderIndex: i,
          });

          if (q.options && q.options.length > 0) {
            for (let j = 0; j < q.options.length; j++) {
              const opt = q.options[j];
              await storage.createQuestionOption({
                questionId: question.id,
                optionText: opt.text || "",
                isCorrect: opt.isCorrect || false,
                orderIndex: j,
              });
            }
          }

          if (q.numericAnswer !== undefined && q.numericAnswer !== null) {
            await storage.createNumericAnswer({
              questionId: question.id,
              correctAnswer: q.numericAnswer,
              tolerance: q.tolerance !== undefined ? q.tolerance : null,
            });
          }
        }
      }

      res.json({ message: "Exam updated successfully", exam: updatedExam });
    } catch (error) {
      console.error("Error updating exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Publish exam
  app.put("/api/teacher/exam/:id/publish", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const examId = req.params.id;

      // Verify exam belongs to teacher
      const exam = await storage.getExam(examId);
      if (!exam) {
        console.log("Publish failed: Exam not found", examId);
        return res.status(404).json({ message: "Exam not found" });
      }

      if (exam.teacherId !== teacherId) {
        console.log("Publish failed: Access denied", { examTeacher: exam.teacherId, requestTeacher: teacherId });
        return res.status(403).json({ message: "You can only publish your own exams" });
      }

      const published = await storage.publishExam(examId);
      console.log("Exam published:", published);
      res.json({ message: "Exam published successfully", exam: published });
    } catch (error) {
      console.error("Error publishing exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ STUDENT ROUTES ============

  app.get("/api/student/stats", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user!.id;

      const myClasses = await storage.getClassesByStudent(studentId);
      const attempts = await storage.getAttemptsByStudent(studentId);

      let totalExams = 0;
      for (const cls of myClasses) {
        const exams = await storage.getPublishedExamsByClass(cls.id);
        totalExams += exams.length;
      }

      const completedExams = attempts.filter(a => a.isSubmitted).length;

      res.json({
        totalClasses: myClasses.length,
        totalExams,
        completedExams,
        pendingExams: totalExams - completedExams,
      });
    } catch (error) {
      console.error("Error fetching student stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get student's classes
  app.get("/api/student/classes", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user!.id;
      const classes = await storage.getStudentClassesWithDetails(studentId);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching student classes:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get ONLY published exams for student's classes
  app.get("/api/student/exams", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user!.id;

      // Get student's classes
      const myClasses = await storage.getClassesByStudent(studentId);

      // Get published exams for each class ID (specific section)
      const allExams = [];
      const processedExamIds = new Set<string>();

      for (const cls of myClasses) {
        const exams = await storage.getPublishedExamsByClass(cls.id);
        for (const exam of exams) {
          if (!processedExamIds.has(exam.id)) {
            allExams.push(exam);
            processedExamIds.add(exam.id);
          }
        }
      }

      const attempts = await storage.getAttemptsByStudent(studentId);
      const submittedExamIds = new Set(attempts.filter(a => a.isSubmitted).map(a => a.examId));

      const examsWithStatus = allExams.map(exam => ({
        ...exam,
        isSubmitted: submittedExamIds.has(exam.id)
      }));

      res.json(examsWithStatus);
    } catch (error) {
      console.error("Error fetching student exams:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get exam details (only if published and student is in class)
  app.get("/api/student/exam/:id", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user!.id;
      const examId = req.params.id;

      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // Check if exam is published
      if (!exam.isPublished) {
        return res.status(403).json({ message: "This exam is not published yet" });
      }

      // Check if student is in the class
      // Support both legacy classId and new exam_classes
      const myClasses = await storage.getClassesByStudent(studentId);

      // Check legacy classId
      let isInClass = myClasses.some(c => c.id === exam.classId);

      // If not found, check exam_classes
      if (!isInClass) {
        const examClassIds = await storage.getClassesByExam(examId);
        isInClass = myClasses.some(c => examClassIds.includes(c.id));
      }

      if (!isInClass) {
        return res.status(403).json({ message: "You are not enrolled in this class" });
      }

      // Get questions with options
      const questions = await storage.getQuestionsByExam(examId);
      const questionsWithOptions = await Promise.all(
        questions.map(async (q) => ({
          ...q,
          options: await storage.getOptionsByQuestion(q.id),
        }))
      );

      const attempt = await storage.getAttemptByExamAndStudent(examId, studentId);

      res.json({
        ...exam,
        questions: questionsWithOptions,
        isSubmitted: attempt?.isSubmitted || false,
      });
    } catch (error) {
      console.error("Error fetching exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Start exam attempt
  app.post("/api/student/exam/:id/start", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user!.id;
      const examId = req.params.id;

      // Check if already attempted
      const attempt = await storage.getAttemptByExamAndStudent(examId, studentId);
      if (attempt && attempt.isSubmitted) {
        return res.status(400).json({ message: "Exam already submitted" });
      }

      if (!attempt) {
        await storage.createExamAttempt({
          examId,
          studentId,
          isSubmitted: false,
        });
      }

      res.json({ message: "Exam started" });
    } catch (error) {
      console.error("Error starting exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get exam result
  app.get("/api/student/exam/:id/result", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user!.id;
      const examId = req.params.id;

      const attempt = await storage.getAttemptByExamAndStudent(examId, studentId);
      if (!attempt || !attempt.isSubmitted) {
        return res.status(404).json({ message: "Result not found" });
      }

      const exam = await storage.getExam(examId);
      const questions = await storage.getQuestionsByExam(examId);
      const studentAnswers = await storage.getAnswersByAttempt(attempt.id);

      const resultDetails = await Promise.all(questions.map(async (q) => {
        const options = await storage.getOptionsByQuestion(q.id);
        const numericAnswer = await storage.getNumericAnswerByQuestion(q.id);
        const studentAnswer = studentAnswers.find(a => a.questionId === q.id);

        let isCorrect = false;
        let studentResponse = null;

        if (q.questionType === "mcq" || q.questionType === "true_false") {
          if (studentAnswer && studentAnswer.selectedOptions && studentAnswer.selectedOptions.length > 0) {
            const selectedOptId = studentAnswer.selectedOptions[0];
            const selectedOpt = options.find(o => o.id === selectedOptId);
            if (selectedOpt) {
              studentResponse = selectedOpt.optionText;
              isCorrect = selectedOpt.isCorrect;
            }
          }
        } else if (q.questionType === "numeric") {
          if (studentAnswer && studentAnswer.numericAnswer !== null && studentAnswer.numericAnswer !== undefined) {
            studentResponse = studentAnswer.numericAnswer;
            if (numericAnswer) {
              isCorrect = Math.abs(studentAnswer.numericAnswer - numericAnswer.correctAnswer) <= (numericAnswer.tolerance || 0);
            }
          }
        }

        return {
          ...q,
          options,
          correctAnswer: numericAnswer?.correctAnswer,
          studentAnswer: studentResponse,
          isCorrect,
        };
      }));

      res.json({
        exam,
        attempt,
        questions: resultDetails
      });

    } catch (error) {
      console.error("Error fetching exam result:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Submit exam with auto-grading
  app.post("/api/student/exam/:id/submit", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user!.id;
      const examId = req.params.id;
      const { answers } = req.body;

      const attempt = await storage.getAttemptByExamAndStudent(examId, studentId);
      if (!attempt) {
        return res.status(404).json({ message: "Exam attempt not found" });
      }

      if (attempt.isSubmitted) {
        return res.status(400).json({ message: "Exam already submitted" });
      }

      // Get all questions
      const questions = await storage.getQuestionsByExam(examId);
      let totalScore = 0;

      // Grade each answer
      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question) continue;

        let isCorrect = false;
        let marksAwarded = 0;

        // Save answer
        await storage.createOrUpdateStudentAnswer({
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedOptions: answer.selectedOptions,
          isCorrect: false,
          marksAwarded: 0,
        });

        // Check if correct (MCQ or Numeric)
        if (question.questionType === "mcq") {
          const options = await storage.getOptionsByQuestion(question.id);
          const correctOption = options.find(o => o.isCorrect);
          if (correctOption && answer.selectedOptions?.[0] === correctOption.id) {
            isCorrect = true;
            marksAwarded = question.marks;
          } else {
            // Negative marking for incorrect answer
            if (question.negativeMarks && question.negativeMarks > 0) {
              marksAwarded = -question.negativeMarks;
            }
          }
        } else if (question.questionType === "numeric") {
          const numericAnswer = await storage.getNumericAnswerByQuestion(question.id);
          if (numericAnswer && answer.numericAnswer !== undefined && answer.numericAnswer !== null) {
            const tolerance = numericAnswer.tolerance || 0;
            if (Math.abs(answer.numericAnswer - numericAnswer.correctAnswer) <= tolerance) {
              isCorrect = true;
              marksAwarded = question.marks;
            } else {
              // Negative marking for incorrect answer
              if (question.negativeMarks && question.negativeMarks > 0) {
                marksAwarded = -question.negativeMarks;
              }
            }
          }
        }

        totalScore += marksAwarded;

        // Update answer with score
        await storage.createOrUpdateStudentAnswer({
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedOptions: answer.selectedOptions,
          numericAnswer: answer.numericAnswer, // Added numericAnswer field
          isCorrect,
          marksAwarded,
        });
      }

      // Calculate percentage
      const exam = await storage.getExam(examId);
      const percentage = exam ? Math.round((totalScore / exam.totalMarks) * 100) : 0;
      const isPassed = exam ? percentage >= (exam.passingMarks || 40) : false;

      // Update attempt
      await storage.updateExamAttempt(attempt.id, {
        isSubmitted: true,
        submittedAt: new Date(),
        totalScore,
        percentage,
        isPassed,
      });

      res.json({
        message: "Exam submitted successfully",
        totalScore,
        totalMarks: exam?.totalMarks,
        percentage,
        isPassed,
      });
    } catch (error) {
      console.error("Error submitting exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get student results
  app.get("/api/student/results", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user!.id;
      const attempts = await storage.getAttemptsByStudent(studentId);

      // Get exam details for each attempt
      const results = await Promise.all(
        attempts
          .filter(a => a.isSubmitted)
          .map(async (attempt) => {
            const exam = await storage.getExam(attempt.examId);
            return {
              ...attempt,
              exam,
            };
          })
      );

      res.json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ COMMON ROUTES ============

  app.get("/api/subjects", authenticateToken, async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
