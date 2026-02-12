import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, and, desc, sql } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";
const SALT_ROUNDS = 10;

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        fullName: string;
        role: "student" | "teacher" | "admin";
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
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // ============ Authentication Routes ============
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, fullName, role } = req.body;

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
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
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

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
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

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
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  // ============ Student Routes ============
  app.get("/api/student/stats", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user!.id;

      // Get student's classes
      const studentClasses = await storage.getClassesByStudent(studentId);

      // Get all exams for student's classes
      const allExams = [];
      for (const cls of studentClasses) {
        const exams = await storage.getExamsByClass(cls.id);
        allExams.push(...exams);
      }

      const totalExams = allExams.length;

      // Count completed exams and calculate average score
      let completedExams = 0;
      let totalScore = 0;
      let scoredExams = 0;

      for (const exam of allExams) {
        const attempt = await storage.getAttemptByExamAndStudent(exam.id, studentId);
        if (attempt && attempt.isSubmitted) {
          completedExams++;
          if (attempt.totalScore !== null && attempt.totalScore !== undefined) {
            totalScore += attempt.percentage || 0;
            scoredExams++;
          }
        }
      }

      const averageScore = scoredExams > 0 ? Math.round(totalScore / scoredExams) : 0;

      // Count upcoming exams
      const now = new Date();
      const upcomingExams = allExams.filter((exam) => {
        const endsAt = new Date(exam.endsAt);
        return (exam.status === "scheduled" || exam.status === "active") && endsAt > now;
      }).length;

      res.json({
        totalExams,
        completedExams,
        averageScore,
        upcomingExams,
      });
    } catch (error) {
      console.error("Error fetching student stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/student/exams/upcoming", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user!.id;
      const studentClasses = await storage.getClassesByStudent(studentId);

      // Get all exams for student's classes
      const allExams = [];
      for (const cls of studentClasses) {
        const exams = await storage.getExamsByClass(cls.id);
        allExams.push(...exams);
      }

      // Filter upcoming and active exams
      const now = new Date();
      const upcomingExams = allExams
        .filter((exam) => {
          const scheduledAt = new Date(exam.scheduledAt);
          const endsAt = new Date(exam.endsAt);
          return (exam.status === "scheduled" || exam.status === "active") && endsAt > now;
        })
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 5)
        .map((exam) => ({
          id: exam.id,
          title: exam.title,
          description: exam.description,
          scheduledAt: exam.scheduledAt,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          status: exam.status,
        }));

      res.json(upcomingExams);
    } catch (error) {
      console.error("Error fetching upcoming exams:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/student/results/recent", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user!.id;
      const studentClasses = await storage.getClassesByStudent(studentId);

      // Get all exams for student's classes
      const allExams = [];
      for (const cls of studentClasses) {
        const exams = await storage.getExamsByClass(cls.id);
        allExams.push(...exams);
      }

      // Get attempts for these exams
      const recentResults = [];
      for (const exam of allExams) {
        const attempt = await storage.getAttemptByExamAndStudent(exam.id, studentId);
        if (attempt && attempt.isSubmitted) {
          recentResults.push({
            examTitle: exam.title,
            score: attempt.totalScore || 0,
            percentage: attempt.percentage || 0,
          });
        }
      }

      res.json(recentResults.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent results:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/student/results", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user!.id;
      const studentClasses = await storage.getClassesByStudent(studentId);

      // Get all exams for student's classes
      const allExams = [];
      for (const cls of studentClasses) {
        const exams = await storage.getExamsByClass(cls.id);
        allExams.push(...exams);
      }

      // Get attempts for these exams
      const results = [];
      for (const exam of allExams) {
        const attempt = await storage.getAttemptByExamAndStudent(exam.id, studentId);
        if (attempt && attempt.isSubmitted) {
          results.push({
            id: attempt.id,
            examTitle: exam.title,
            submittedAt: attempt.submittedAt || attempt.startedAt,
            totalScore: attempt.totalScore || 0,
            totalMarks: exam.totalMarks,
            percentage: attempt.percentage || 0,
            isPassed: attempt.isPassed || false,
          });
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/student/exam/:id", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const examId = req.params.id;
      const studentId = req.user!.id;

      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // Get or create attempt
      let attempt = await storage.getAttemptByExamAndStudent(examId, studentId);
      if (!attempt) {
        attempt = await storage.createExamAttempt({
          examId,
          studentId,
          timeRemaining: exam.duration * 60,
        });
      }

      // Get questions with options
      const questions = await storage.getQuestionsByExam(examId);
      const questionsWithOptions = await Promise.all(
        questions.map(async (q) => {
          const options = await storage.getOptionsByQuestion(q.id);
          return { ...q, options };
        })
      );

      res.json({
        id: exam.id,
        title: exam.title,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        instructions: exam.instructions,
        questions: questionsWithOptions,
        attemptId: attempt.id,
        timeRemaining: attempt.timeRemaining || exam.duration * 60,
      });
    } catch (error) {
      console.error("Error fetching exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/student/exam/:id/answer", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const { questionId, answer } = req.body;

      await storage.createOrUpdateStudentAnswer({
        attemptId: answer.attemptId,
        questionId: answer.questionId,
        selectedOptions: answer.selectedOptions,
        numericAnswer: answer.numericAnswer,
        isVisited: answer.isVisited,
        isMarkedForReview: answer.isMarkedForReview,
        isCorrect: null,
        marksAwarded: null,
      });

      res.json({ message: "Answer saved successfully" });
    } catch (error) {
      console.error("Error saving answer:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/student/exam/:id/submit", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const examId = req.params.id;
      const studentId = req.user!.id;

      const attempt = await storage.getAttemptByExamAndStudent(examId, studentId);
      if (!attempt) {
        return res.status(404).json({ message: "Attempt not found" });
      }

      // Auto-evaluate
      const answers = await storage.getAnswersByAttempt(attempt.id);
      const questions = await storage.getQuestionsByExam(examId);

      let totalScore = 0;
      for (const question of questions) {
        const answer = answers.find((a) => a.questionId === question.id);
        if (!answer) continue;

        let isCorrect = false;
        let marksAwarded = 0;

        if (question.questionType === "mcq") {
          const options = await storage.getOptionsByQuestion(question.id);
          const correctOption = options.find((o) => o.isCorrect);
          if (correctOption && answer.selectedOptions?.[0] === correctOption.id) {
            isCorrect = true;
            marksAwarded = question.marks;
          }
        } else if (question.questionType === "msq") {
          const options = await storage.getOptionsByQuestion(question.id);
          const correctOptions = options.filter((o) => o.isCorrect).map((o) => o.id);
          const selectedOptions = answer.selectedOptions || [];

          if (
            correctOptions.length === selectedOptions.length &&
            correctOptions.every((id) => selectedOptions.includes(id))
          ) {
            isCorrect = true;
            marksAwarded = question.marks;
          }
        } else if (question.questionType === "numeric") {
          const numericAnswer = await storage.getNumericAnswerByQuestion(question.id);
          if (numericAnswer && answer.numericAnswer === numericAnswer.correctAnswer) {
            isCorrect = true;
            marksAwarded = question.marks;
          }
        } else if (question.questionType === "true_false") {
          const options = await storage.getOptionsByQuestion(question.id);
          const correctOption = options.find((o) => o.isCorrect);
          if (correctOption && answer.selectedOptions?.[0] === correctOption.id) {
            isCorrect = true;
            marksAwarded = question.marks;
          }
        }

        totalScore += marksAwarded;

        // Update answer with evaluation
        await storage.createOrUpdateStudentAnswer({
          ...answer,
          isCorrect,
          marksAwarded,
        });
      }

      const exam = await storage.getExam(examId);
      const percentage = exam ? Math.round((totalScore / exam.totalMarks) * 100) : 0;
      const isPassed = exam ? percentage >= (exam.passingMarks || 40) : false;

      await storage.updateExamAttempt(attempt.id, {
        isSubmitted: true,
        submittedAt: new Date(),
        totalScore,
        percentage,
        isPassed,
      });

      res.json({ message: "Exam submitted successfully", totalScore, percentage, isPassed });
    } catch (error) {
      console.error("Error submitting exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/student/exam/:id/cheating-log", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const examId = req.params.id;
      const studentId = req.user!.id;
      const { activityType, description } = req.body;

      const attempt = await storage.getAttemptByExamAndStudent(examId, studentId);
      if (!attempt) {
        return res.status(404).json({ message: "Attempt not found" });
      }

      await storage.createCheatingLog({
        attemptId: attempt.id,
        activityType,
        description,
        count: 1,
      });

      res.json({ message: "Activity logged" });
    } catch (error) {
      console.error("Error logging cheating activity:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ Teacher Routes ============
  app.get("/api/teacher/stats", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;

      const exams = await storage.getExamsByTeacher(teacherId);
      const classes = await storage.getClassesByTeacher(teacherId);

      // Count total students across all classes
      let totalStudents = 0;
      for (const cls of classes) {
        const students = await storage.getStudentsByClass(cls.id);
        totalStudents += students.length;
      }

      const activeExams = exams.filter((e) => e.status === "active").length;

      res.json({
        totalExams: exams.length,
        totalStudents,
        totalQuestions: 0, // Will be calculated when question bank is populated
        activeExams,
      });
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/teacher/exams/recent", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const exams = await storage.getExamsByTeacher(teacherId);

      const recentExams = await Promise.all(
        exams.slice(0, 5).map(async (exam) => {
          const classData = await storage.getClass(exam.classId);
          const students = await storage.getStudentsByClass(exam.classId);

          return {
            id: exam.id,
            title: exam.title,
            scheduledAt: exam.scheduledAt,
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            status: exam.status,
            className: classData?.name || "Unknown",
            studentCount: students.length,
          };
        })
      );

      res.json(recentExams);
    } catch (error) {
      console.error("Error fetching recent exams:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/teacher/classes", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const classes = await storage.getClassesByTeacher(teacherId);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/subjects", authenticateToken, async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/teacher/exams", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const { questions, ...examData } = req.body;

      // Create exam
      const exam = await storage.createExam({
        ...examData,
        teacherId,
        status: "draft",
      });

      // Create questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const question = await storage.createQuestion({
          examId: exam.id,
          questionText: q.questionText,
          questionType: q.questionType,
          marks: q.marks,
          difficulty: q.difficulty,
          subjectId: q.subjectId || null,
          orderIndex: i,
        });

        // Create options for MCQ/MSQ/True-False
        if (q.options && q.options.length > 0) {
          for (let j = 0; j < q.options.length; j++) {
            const opt = q.options[j];
            await storage.createQuestionOption({
              questionId: question.id,
              optionText: opt.text,
              isCorrect: opt.isCorrect,
              orderIndex: j,
            });
          }
        }

        // Create numeric answer
        if (q.numericAnswer) {
          await storage.createNumericAnswer({
            questionId: question.id,
            correctAnswer: q.numericAnswer,
            tolerance: null,
          });
        }
      }

      res.json({ message: "Exam created successfully", exam });
    } catch (error) {
      console.error("Error creating exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============ Admin Routes ============
  app.get("/api/admin/stats", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const students = allUsers.filter((u) => u.role === "student");
      const teachers = allUsers.filter((u) => u.role === "teacher");

      const allClasses = await storage.getAllClasses();

      res.json({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalExams: 0, // Will be calculated from all exams
        totalClasses: allClasses.length,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/activity", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      // Return simulated activity data
      const activityData: any[] = [];
      res.json(activityData);
    } catch (error) {
      console.error("Error fetching activity data:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/users", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
