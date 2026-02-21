var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index-prod.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express2 from "express";

// server/app.ts
import express from "express";
import cookieParser from "cookie-parser";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLogs: () => activityLogs,
  activityTypes: () => activityTypes,
  cheatingLogs: () => cheatingLogs,
  classSubjects: () => classSubjects,
  classes: () => classes,
  classesRelations: () => classesRelations,
  examAttempts: () => examAttempts,
  examAttemptsRelations: () => examAttemptsRelations,
  examClasses: () => examClasses,
  examStatuses: () => examStatuses,
  exams: () => exams,
  examsRelations: () => examsRelations,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertCheatingLogSchema: () => insertCheatingLogSchema,
  insertClassSchema: () => insertClassSchema,
  insertExamAttemptSchema: () => insertExamAttemptSchema,
  insertExamSchema: () => insertExamSchema,
  insertNumericAnswerSchema: () => insertNumericAnswerSchema,
  insertQuestionOptionSchema: () => insertQuestionOptionSchema,
  insertQuestionSchema: () => insertQuestionSchema,
  insertStudentAnswerSchema: () => insertStudentAnswerSchema,
  insertSubjectSchema: () => insertSubjectSchema,
  insertUserSchema: () => insertUserSchema,
  institutes: () => institutes,
  institutesRelations: () => institutesRelations,
  numericAnswers: () => numericAnswers,
  organizations: () => organizations,
  organizationsRelations: () => organizationsRelations,
  questionOptions: () => questionOptions,
  questionTypes: () => questionTypes,
  questions: () => questions,
  questionsRelations: () => questionsRelations,
  studentAnswers: () => studentAnswers,
  studentClasses: () => studentClasses,
  subjects: () => subjects,
  subjectsRelations: () => subjectsRelations,
  systemSettings: () => systemSettings,
  teacherClasses: () => teacherClasses,
  userRoles: () => userRoles,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, int, timestamp, boolean, mysqlEnum, double, longtext } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var userRoles = ["student", "teacher", "admin", "organization"];
var questionTypes = ["mcq", "msq", "numeric", "true_false"];
var examStatuses = ["draft", "published", "active", "completed", "cancelled"];
var activityTypes = ["tab_change", "focus_loss", "full_screen_exit", "page_reload"];
var users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: mysqlEnum("role", userRoles).notNull().default("student"),
  studentId: varchar("student_id", { length: 255 }).unique(),
  // For student login (e.g., "STU001")
  organizationId: varchar("organization_id", { length: 36 }),
  instituteId: varchar("institute_id", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var organizations = mysqlTable("organizations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: text("name").notNull(),
  description: text("description"),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }),
  address: text("address"),
  logo: text("logo"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var institutes = mysqlTable("institutes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: varchar("organization_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var classes = mysqlTable("classes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: text("name").notNull(),
  section: varchar("section", { length: 50 }),
  description: text("description"),
  instituteId: varchar("institute_id", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var subjects = mysqlTable("subjects", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var classSubjects = mysqlTable("class_subjects", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  classId: varchar("class_id", { length: 36 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var teacherClasses = mysqlTable("teacher_classes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  teacherId: varchar("teacher_id", { length: 36 }).notNull(),
  classId: varchar("class_id", { length: 36 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }),
  assignedAt: timestamp("assigned_at").notNull().defaultNow()
});
var studentClasses = mysqlTable("student_classes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  classId: varchar("class_id", { length: 36 }).notNull(),
  rollNumber: int("roll_number"),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow()
});
var exams = mysqlTable("exams", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  title: text("title").notNull(),
  description: text("description"),
  classId: varchar("class_id", { length: 36 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }),
  teacherId: varchar("teacher_id", { length: 36 }).notNull(),
  duration: int("duration").notNull(),
  totalMarks: int("total_marks").notNull(),
  passingMarks: int("passing_marks").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  status: mysqlEnum("status", examStatuses).notNull().default("draft"),
  isPublished: boolean("is_published").notNull().default(false),
  instructions: text("instructions"),
  negativeMarking: boolean("negative_marking").notNull().default(false),
  negativeMarks: int("negative_marks").default(0),
  shuffleQuestions: boolean("shuffle_questions").notNull().default(false),
  shuffleOptions: boolean("shuffle_options").notNull().default(false),
  showResults: boolean("show_results").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var examClasses = mysqlTable("exam_classes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  examId: varchar("exam_id", { length: 36 }).notNull(),
  classId: varchar("class_id", { length: 36 }).notNull()
});
var questions = mysqlTable("questions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  examId: varchar("exam_id", { length: 36 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }),
  questionText: longtext("question_text").notNull(),
  imageData: longtext("image_data"),
  questionType: mysqlEnum("question_type", questionTypes).notNull(),
  marks: double("marks").notNull(),
  difficulty: varchar("difficulty", { length: 50 }),
  orderIndex: int("order_index").notNull(),
  negativeMarks: double("negative_marks").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var questionOptions = mysqlTable("question_options", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  questionId: varchar("question_id", { length: 36 }).notNull(),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  orderIndex: int("order_index").notNull()
});
var numericAnswers = mysqlTable("numeric_answers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  questionId: varchar("question_id", { length: 36 }).notNull(),
  correctAnswer: double("correct_answer").notNull(),
  tolerance: double("tolerance")
});
var examAttempts = mysqlTable("exam_attempts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  examId: varchar("exam_id", { length: 36 }).notNull(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  submittedAt: timestamp("submitted_at"),
  isSubmitted: boolean("is_submitted").notNull().default(false),
  totalScore: int("total_score").default(0),
  percentage: int("percentage").default(0),
  isPassed: boolean("is_passed").default(false),
  timeSpent: int("time_spent").default(0)
});
var studentAnswers = mysqlTable("student_answers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  attemptId: varchar("attempt_id", { length: 36 }).notNull(),
  questionId: varchar("question_id", { length: 36 }).notNull(),
  selectedOptions: text("selected_options"),
  numericAnswer: double("numeric_answer"),
  isCorrect: boolean("is_correct").default(false),
  marksAwarded: int("marks_awarded").default(0),
  answeredAt: timestamp("answered_at").notNull().defaultNow()
});
var activityLogs = mysqlTable("activity_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  attemptId: varchar("attempt_id", { length: 36 }).notNull(),
  activityType: mysqlEnum("activity_type", activityTypes).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  details: text("details")
});
var cheatingLogs = mysqlTable("cheating_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  attemptId: varchar("attempt_id", { length: 36 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  description: text("description"),
  timestamp: timestamp("timestamp").notNull().defaultNow()
});
var systemSettings = mysqlTable("system_settings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  key: varchar("key_name", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, { fields: [users.organizationId], references: [organizations.id] }),
  institute: one(institutes, { fields: [users.instituteId], references: [institutes.id] }),
  classes: many(teacherClasses),
  enrollments: many(studentClasses),
  attempts: many(examAttempts),
  createdExams: many(exams)
}));
var organizationsRelations = relations(organizations, ({ many }) => ({
  institutes: many(institutes),
  users: many(users)
}));
var institutesRelations = relations(institutes, ({ one, many }) => ({
  organization: one(organizations, { fields: [institutes.organizationId], references: [organizations.id] }),
  users: many(users),
  classes: many(classes)
}));
var classesRelations = relations(classes, ({ one, many }) => ({
  institute: one(institutes, { fields: [classes.instituteId], references: [institutes.id] }),
  subjects: many(classSubjects),
  teachers: many(teacherClasses),
  students: many(studentClasses),
  exams: many(examClasses)
}));
var subjectsRelations = relations(subjects, ({ many }) => ({
  classes: many(classSubjects),
  teachers: many(teacherClasses),
  exams: many(exams),
  questions: many(questions)
}));
var examsRelations = relations(exams, ({ one, many }) => ({
  teacher: one(users, { fields: [exams.teacherId], references: [users.id] }),
  subject: one(subjects, { fields: [exams.subjectId], references: [subjects.id] }),
  classes: many(examClasses),
  questions: many(questions),
  attempts: many(examAttempts)
}));
var questionsRelations = relations(questions, ({ one, many }) => ({
  exam: one(exams, { fields: [questions.examId], references: [exams.id] }),
  subject: one(subjects, { fields: [questions.subjectId], references: [subjects.id] }),
  options: many(questionOptions),
  numericAnswer: one(numericAnswers, { fields: [questions.id], references: [numericAnswers.questionId] })
}));
var examAttemptsRelations = relations(examAttempts, ({ one, many }) => ({
  exam: one(exams, { fields: [examAttempts.examId], references: [exams.id] }),
  student: one(users, { fields: [examAttempts.studentId], references: [users.id] }),
  answers: many(studentAnswers),
  activityLogs: many(activityLogs),
  cheatingLogs: many(cheatingLogs)
}));
var insertUserSchema = createInsertSchema(users);
var insertClassSchema = createInsertSchema(classes);
var insertSubjectSchema = createInsertSchema(subjects);
var insertExamSchema = createInsertSchema(exams);
var insertQuestionSchema = createInsertSchema(questions);
var insertQuestionOptionSchema = createInsertSchema(questionOptions);
var insertNumericAnswerSchema = createInsertSchema(numericAnswers);
var insertExamAttemptSchema = createInsertSchema(examAttempts).omit({ startedAt: true });
var insertStudentAnswerSchema = createInsertSchema(studentAnswers);
var insertActivityLogSchema = createInsertSchema(activityLogs);
var insertCheatingLogSchema = createInsertSchema(cheatingLogs);

// server/db.ts
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
console.log("\u{1F50C} Database module loading...");
var defaultUrl = "mysql://u241368025_dbadmin:PrepIQ2026Secure@localhost/u241368025_PrepIQ";
var dbUrl = process.env.DATABASE_URL || defaultUrl;
var pool = null;
var drizzleInstance = null;
function getDb() {
  if (!drizzleInstance) {
    try {
      if (!pool) {
        console.log("\u{1F50C} Initializing MySQL pool for Hostinger...");
        pool = mysql.createPool(dbUrl);
      }
      drizzleInstance = drizzle(pool, { schema: schema_exports, mode: "default" });
      console.log("\u2705 Drizzle instance created successfully.");
    } catch (err) {
      console.error("\u274C Database Initialization Error:", err);
    }
  }
  return drizzleInstance;
}
var db = new Proxy({}, {
  get: (target, prop) => {
    const instance = getDb();
    if (!instance) {
      throw new Error(`Database not initialized. Cannot access property '${String(prop)}'`);
    }
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  }
});

// server/storage.ts
import { eq, and, desc, inArray, isNull } from "drizzle-orm";
import crypto from "crypto";
var DatabaseStorage = class {
  // ============ USERS ============
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async getUserByStudentId(studentId) {
    const [user] = await db.select().from(users).where(eq(users.studentId, studentId));
    return user;
  }
  async createUser(user) {
    const id = crypto.randomUUID();
    await db.insert(users).values({ ...user, id });
    const [newUser] = await db.select().from(users).where(eq(users.id, id));
    return newUser;
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  async getUsersByRole(role) {
    return await db.select().from(users).where(eq(users.role, role));
  }
  async updateUserPassword(userId, hashedPassword) {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
    const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));
    return updatedUser;
  }
  async updateUser(id, userData) {
    await db.update(users).set(userData).where(eq(users.id, id));
    const [updatedUser] = await db.select().from(users).where(eq(users.id, id));
    return updatedUser;
  }
  async createPasswordResetToken(email) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 36e5;
    const data = JSON.stringify({ userId: user.id, expires });
    await db.insert(systemSettings).values({
      key: `reset_token:${token}`,
      value: data,
      description: `Password reset token for ${email}`
    });
    return token;
  }
  async resetPasswordWithToken(token, newPassword) {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, `reset_token:${token}`));
    if (!setting) {
      throw new Error("Invalid or expired token");
    }
    const data = JSON.parse(setting.value);
    if (Date.now() > data.expires) {
      await db.delete(systemSettings).where(eq(systemSettings.key, `reset_token:${token}`));
      throw new Error("Token expired");
    }
    const bcrypt2 = await import("bcrypt");
    const hashFn = bcrypt2.default && bcrypt2.default.hash || bcrypt2.hash;
    const hashedPassword = await hashFn(newPassword, 10);
    await this.updateUserPassword(data.userId, hashedPassword);
    await db.delete(systemSettings).where(eq(systemSettings.key, `reset_token:${token}`));
  }
  async getAllStudentsWithDetails() {
    const rows = await db.select({
      user: users,
      className: classes.name,
      section: classes.section,
      rollNumber: studentClasses.rollNumber
    }).from(users).leftJoin(studentClasses, eq(users.id, studentClasses.studentId)).leftJoin(classes, eq(studentClasses.classId, classes.id)).where(eq(users.role, "student"));
    return rows.map((row) => ({
      ...row.user,
      className: row.className,
      section: row.section,
      rollNumber: row.rollNumber
    }));
  }
  async deleteUser(id) {
    const attempts = await db.select().from(examAttempts).where(eq(examAttempts.studentId, id));
    if (attempts.length > 0) {
      const attemptIds = attempts.map((a) => a.id);
      await db.delete(activityLogs).where(inArray(activityLogs.attemptId, attemptIds));
      await db.delete(cheatingLogs).where(inArray(cheatingLogs.attemptId, attemptIds));
      await db.delete(studentAnswers).where(inArray(studentAnswers.attemptId, attemptIds));
      await db.delete(examAttempts).where(eq(examAttempts.studentId, id));
    }
    await db.delete(studentClasses).where(eq(studentClasses.studentId, id));
    await db.delete(teacherClasses).where(eq(teacherClasses.teacherId, id));
    const teacherExams = await db.select().from(exams).where(eq(exams.teacherId, id));
    if (teacherExams.length > 0) {
      const examIds = teacherExams.map((e) => e.id);
      const attempts2 = await db.select().from(examAttempts).where(inArray(examAttempts.examId, examIds));
      if (attempts2.length > 0) {
        const attemptIds = attempts2.map((a) => a.id);
        await db.delete(activityLogs).where(inArray(activityLogs.attemptId, attemptIds));
        await db.delete(cheatingLogs).where(inArray(cheatingLogs.attemptId, attemptIds));
        await db.delete(studentAnswers).where(inArray(studentAnswers.attemptId, attemptIds));
        await db.delete(examAttempts).where(inArray(examAttempts.examId, examIds));
      }
      const examQuestions = await db.select().from(questions).where(inArray(questions.examId, examIds));
      if (examQuestions.length > 0) {
        const questionIds = examQuestions.map((q) => q.id);
        await db.delete(questionOptions).where(inArray(questionOptions.questionId, questionIds));
        await db.delete(numericAnswers).where(inArray(numericAnswers.questionId, questionIds));
        await db.delete(questions).where(inArray(questions.examId, examIds));
      }
      await db.delete(examClasses).where(inArray(examClasses.examId, examIds));
      await db.delete(exams).where(eq(exams.teacherId, id));
    }
    await db.delete(users).where(eq(users.id, id));
  }
  // ============ CLASSES ============
  async getClass(id) {
    const [cls] = await db.select().from(classes).where(eq(classes.id, id));
    return cls;
  }
  async getAllClasses() {
    return await db.select().from(classes);
  }
  async createClass(classData) {
    const id = crypto.randomUUID();
    await db.insert(classes).values({ ...classData, id });
    const [newClass] = await db.select().from(classes).where(eq(classes.id, id));
    return newClass;
  }
  async deleteClass(id) {
    await db.delete(studentClasses).where(eq(studentClasses.classId, id));
    await db.delete(teacherClasses).where(eq(teacherClasses.classId, id));
    await db.delete(classSubjects).where(eq(classSubjects.classId, id));
    const classExams = await db.select().from(exams).where(eq(exams.classId, id));
    if (classExams.length > 0) {
      const examIds = classExams.map((e) => e.id);
      const attempts = await db.select().from(examAttempts).where(inArray(examAttempts.examId, examIds));
      if (attempts.length > 0) {
        const attemptIds = attempts.map((a) => a.id);
        await db.delete(activityLogs).where(inArray(activityLogs.attemptId, attemptIds));
        await db.delete(cheatingLogs).where(inArray(cheatingLogs.attemptId, attemptIds));
        await db.delete(studentAnswers).where(inArray(studentAnswers.attemptId, attemptIds));
        await db.delete(examAttempts).where(inArray(examAttempts.examId, examIds));
      }
      const examQuestions = await db.select().from(questions).where(inArray(questions.examId, examIds));
      if (examQuestions.length > 0) {
        const questionIds = examQuestions.map((q) => q.id);
        await db.delete(questionOptions).where(inArray(questionOptions.questionId, questionIds));
        await db.delete(numericAnswers).where(inArray(numericAnswers.questionId, questionIds));
        await db.delete(questions).where(inArray(questions.examId, examIds));
      }
      await db.delete(exams).where(eq(exams.classId, id));
    }
    await db.delete(classes).where(eq(classes.id, id));
  }
  // ============ SUBJECTS ============
  async getAllSubjects() {
    return await db.select().from(subjects);
  }
  async getSubject(id) {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }
  async createSubject(subject) {
    const id = crypto.randomUUID();
    await db.insert(subjects).values({ ...subject, id });
    const [newSubject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return newSubject;
  }
  async deleteSubject(id) {
    await db.update(exams).set({ subjectId: null }).where(eq(exams.subjectId, id));
    await db.update(questions).set({ subjectId: null }).where(eq(questions.subjectId, id));
    await db.update(teacherClasses).set({ subjectId: null }).where(eq(teacherClasses.subjectId, id));
    await db.delete(classSubjects).where(eq(classSubjects.subjectId, id));
    await db.delete(subjects).where(eq(subjects.id, id));
  }
  // ============ CLASS-SUBJECT RELATIONSHIPS ============
  async assignSubjectToClass(data) {
    const id = crypto.randomUUID();
    await db.insert(classSubjects).values({ ...data, id });
    const [assignment] = await db.select().from(classSubjects).where(eq(classSubjects.id, id));
    return assignment;
  }
  async getSubjectsByClass(classId) {
    const result = await db.select({ subject: subjects }).from(classSubjects).innerJoin(subjects, eq(classSubjects.subjectId, subjects.id)).where(eq(classSubjects.classId, classId));
    return result.map((r) => r.subject);
  }
  // ============ TEACHER-CLASS ASSIGNMENTS ============
  async assignTeacherToClass(data) {
    const existing = await db.select().from(teacherClasses).where(
      and(
        eq(teacherClasses.teacherId, data.teacherId),
        eq(teacherClasses.classId, data.classId),
        data.subjectId ? eq(teacherClasses.subjectId, data.subjectId) : isNull(teacherClasses.subjectId)
      )
    );
    if (existing.length > 0) {
      throw new Error("Teacher is already assigned to this class/subject");
    }
    const id = crypto.randomUUID();
    await db.insert(teacherClasses).values({ ...data, id });
    const [assignment] = await db.select().from(teacherClasses).where(eq(teacherClasses.id, id));
    return assignment;
  }
  async getClassesByTeacher(teacherId) {
    const result = await db.select({
      class: classes,
      subjectName: subjects.name
    }).from(teacherClasses).innerJoin(classes, eq(teacherClasses.classId, classes.id)).leftJoin(subjects, eq(teacherClasses.subjectId, subjects.id)).where(eq(teacherClasses.teacherId, teacherId));
    return result.map((r) => ({
      ...r.class,
      subjectName: r.subjectName
    }));
  }
  async getAllTeacherAssignments() {
    return await db.select({
      id: teacherClasses.id,
      teacherId: teacherClasses.teacherId,
      teacherName: users.fullName,
      className: classes.name,
      section: classes.section,
      subjectName: subjects.name
    }).from(teacherClasses).innerJoin(users, eq(teacherClasses.teacherId, users.id)).innerJoin(classes, eq(teacherClasses.classId, classes.id)).leftJoin(subjects, eq(teacherClasses.subjectId, subjects.id));
  }
  async deleteTeacherAssignment(id) {
    await db.delete(teacherClasses).where(eq(teacherClasses.id, id));
  }
  async getTeachersByClass(classId) {
    const result = await db.select({ user: users }).from(teacherClasses).innerJoin(users, eq(teacherClasses.teacherId, users.id)).where(eq(teacherClasses.classId, classId));
    return result.map((r) => r.user);
  }
  async getStudentsByTeacher(teacherId) {
    const teacherClassesList = await db.select({ classId: teacherClasses.classId }).from(teacherClasses).where(eq(teacherClasses.teacherId, teacherId));
    const classIds = teacherClassesList.map((tc) => tc.classId);
    if (classIds.length === 0) return [];
    const students = await db.select({
      student: users,
      className: classes.name,
      section: classes.section,
      rollNumber: studentClasses.rollNumber
    }).from(studentClasses).innerJoin(users, eq(studentClasses.studentId, users.id)).innerJoin(classes, eq(studentClasses.classId, classes.id)).where(inArray(studentClasses.classId, classIds));
    const studentIds = students.map((s) => s.student.id);
    if (studentIds.length === 0) return [];
    const attempts = await db.select().from(examAttempts).where(inArray(examAttempts.studentId, studentIds));
    return students.map((s) => {
      const studentAttempts = attempts.filter((a) => a.studentId === s.student.id);
      const completedAttempts = studentAttempts.filter((a) => a.isSubmitted);
      const totalScore = completedAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0);
      const avgScore = completedAttempts.length > 0 ? totalScore / completedAttempts.length : 0;
      return {
        id: s.student.id,
        fullName: s.student.fullName,
        email: s.student.email,
        className: s.className,
        section: s.section,
        rollNumber: s.rollNumber,
        totalExamsTaken: completedAttempts.length,
        averageScore: avgScore.toFixed(1),
        username: s.student.username
      };
    });
  }
  // ============ STUDENT-CLASS ENROLLMENTS ============
  async enrollStudent(data) {
    const existingStudent = await db.select().from(studentClasses).where(
      and(
        eq(studentClasses.classId, data.classId),
        eq(studentClasses.studentId, data.studentId)
      )
    );
    if (existingStudent.length > 0) {
      throw new Error("Student is already enrolled in this class");
    }
    if (data.rollNumber) {
      const existing = await db.select().from(studentClasses).where(
        and(
          eq(studentClasses.classId, data.classId),
          eq(studentClasses.rollNumber, data.rollNumber)
        )
      );
      if (existing.length > 0) {
        throw new Error(`Roll number ${data.rollNumber} is already assigned in this class`);
      }
    }
    const id = crypto.randomUUID();
    await db.insert(studentClasses).values({ ...data, id });
    const [enrollment] = await db.select().from(studentClasses).where(eq(studentClasses.id, id));
    return enrollment;
  }
  async getStudentsByClass(classId) {
    const result = await db.select({ user: users }).from(studentClasses).innerJoin(users, eq(studentClasses.studentId, users.id)).where(eq(studentClasses.classId, classId));
    return result.map((r) => r.user);
  }
  async checkRollNumberAvailability(classId, rollNumber) {
    const existing = await db.select().from(studentClasses).where(
      and(
        eq(studentClasses.classId, classId),
        eq(studentClasses.rollNumber, rollNumber)
      )
    );
    return existing.length === 0;
  }
  async getClassesByStudent(studentId) {
    const result = await db.select({ class: classes }).from(studentClasses).innerJoin(classes, eq(studentClasses.classId, classes.id)).where(eq(studentClasses.studentId, studentId));
    return result.map((r) => r.class);
  }
  async getStudentClassesWithDetails(studentId) {
    return await db.select({
      id: classes.id,
      name: classes.name,
      section: classes.section,
      rollNumber: studentClasses.rollNumber
    }).from(studentClasses).innerJoin(classes, eq(studentClasses.classId, classes.id)).where(eq(studentClasses.studentId, studentId));
  }
  // ============ EXAMS ============
  async getExam(id) {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }
  async getExamsByClass(classId) {
    return await db.select().from(exams).where(eq(exams.classId, classId));
  }
  async getPublishedExamsByClass(classId) {
    const linkedExams = await db.select({ exam: exams }).from(examClasses).innerJoin(exams, eq(examClasses.examId, exams.id)).where(and(eq(examClasses.classId, classId), eq(exams.isPublished, true)));
    const legacyExams = await db.select().from(exams).where(and(eq(exams.classId, classId), eq(exams.isPublished, true)));
    const allExams = [...linkedExams.map((r) => r.exam), ...legacyExams];
    const uniqueExams = Array.from(new Map(allExams.map((item) => [item.id, item])).values());
    return uniqueExams;
  }
  async getPublishedExamsByClassName(className) {
    const rows = await db.select({ exam: exams }).from(examClasses).innerJoin(exams, eq(examClasses.examId, exams.id)).innerJoin(classes, eq(examClasses.classId, classes.id)).where(and(eq(classes.name, className), eq(exams.isPublished, true)));
    return rows.map((r) => r.exam);
  }
  async getExamsByTeacher(teacherId) {
    const teacherExams = await db.select().from(exams).where(eq(exams.teacherId, teacherId)).orderBy(desc(exams.createdAt));
    const examsWithClasses = await Promise.all(teacherExams.map(async (exam) => {
      const classesForExam = await db.select({ name: classes.name, section: classes.section }).from(examClasses).innerJoin(classes, eq(examClasses.classId, classes.id)).where(eq(examClasses.examId, exam.id));
      let classNames = classesForExam.map((c) => `${c.name}${c.section ? ` - ${c.section}` : ""}`);
      if (classNames.length === 0 && exam.classId) {
        const legacyClass = await db.select().from(classes).where(eq(classes.id, exam.classId));
        if (legacyClass.length > 0) {
          const c = legacyClass[0];
          classNames = [`${c.name}${c.section ? ` - ${c.section}` : ""}`];
        }
      }
      return { ...exam, classNames };
    }));
    return examsWithClasses;
  }
  async createExam(exam, classIds) {
    const id = crypto.randomUUID();
    await db.insert(exams).values({ ...exam, id });
    const [newExam] = await db.select().from(exams).where(eq(exams.id, id));
    if (classIds && classIds.length > 0) {
      await db.insert(examClasses).values(
        classIds.map((classId) => ({
          id: crypto.randomUUID(),
          examId: id,
          classId
        }))
      );
    }
    return newExam;
  }
  async updateExam(id, exam, classIds) {
    await db.update(exams).set(exam).where(eq(exams.id, id));
    const [updated] = await db.select().from(exams).where(eq(exams.id, id));
    if (classIds) {
      await db.delete(examClasses).where(eq(examClasses.examId, id));
      if (classIds.length > 0) {
        await db.insert(examClasses).values(
          classIds.map((classId) => ({
            id: crypto.randomUUID(),
            examId: id,
            classId
          }))
        );
      }
    }
    return updated;
  }
  async getClassesByExam(examId) {
    const rows = await db.select({ classId: examClasses.classId }).from(examClasses).where(eq(examClasses.examId, examId));
    return rows.map((r) => r.classId);
  }
  async publishExam(id) {
    await db.update(exams).set({ isPublished: true, status: "published" }).where(eq(exams.id, id));
    const [published] = await db.select().from(exams).where(eq(exams.id, id));
    return published;
  }
  // ============ QUESTIONS ============
  async getQuestionsByExam(examId) {
    return await db.select().from(questions).where(eq(questions.examId, examId));
  }
  async createQuestion(question) {
    const id = crypto.randomUUID();
    await db.insert(questions).values({ ...question, id });
    const [newQuestion] = await db.select().from(questions).where(eq(questions.id, id));
    return newQuestion;
  }
  // ============ QUESTION OPTIONS ============
  async getOptionsByQuestion(questionId) {
    return await db.select().from(questionOptions).where(eq(questionOptions.questionId, questionId));
  }
  async createQuestionOption(option) {
    const id = crypto.randomUUID();
    await db.insert(questionOptions).values({ ...option, id });
    const [newOption] = await db.select().from(questionOptions).where(eq(questionOptions.id, id));
    return newOption;
  }
  async deleteQuestionsByExam(examId) {
    const examQuestions = await db.select().from(questions).where(eq(questions.examId, examId));
    if (examQuestions.length > 0) {
      const questionIds = examQuestions.map((q) => q.id);
      await db.delete(questionOptions).where(inArray(questionOptions.questionId, questionIds));
      await db.delete(numericAnswers).where(inArray(numericAnswers.questionId, questionIds));
      await db.delete(questions).where(eq(questions.examId, examId));
    }
  }
  // ============ NUMERIC ANSWERS ============
  async getNumericAnswerByQuestion(questionId) {
    const [answer] = await db.select().from(numericAnswers).where(eq(numericAnswers.questionId, questionId));
    return answer;
  }
  async createNumericAnswer(answer) {
    const id = crypto.randomUUID();
    await db.insert(numericAnswers).values({ ...answer, id });
    const [newAnswer] = await db.select().from(numericAnswers).where(eq(numericAnswers.id, id));
    return newAnswer;
  }
  // ============ EXAM ATTEMPTS ============
  async getExamAttempt(id) {
    const [attempt] = await db.select().from(examAttempts).where(eq(examAttempts.id, id));
    return attempt;
  }
  async getAttemptByExamAndStudent(examId, studentId) {
    const [attempt] = await db.select().from(examAttempts).where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, studentId)));
    return attempt;
  }
  async createExamAttempt(attempt) {
    const id = crypto.randomUUID();
    await db.insert(examAttempts).values({ ...attempt, id });
    const [newAttempt] = await db.select().from(examAttempts).where(eq(examAttempts.id, id));
    return newAttempt;
  }
  async updateExamAttempt(id, attempt) {
    await db.update(examAttempts).set(attempt).where(eq(examAttempts.id, id));
    const [updated] = await db.select().from(examAttempts).where(eq(examAttempts.id, id));
    return updated;
  }
  async getAttemptsByStudent(studentId) {
    return await db.select().from(examAttempts).where(eq(examAttempts.studentId, studentId)).orderBy(desc(examAttempts.startedAt));
  }
  async getAttemptsByExam(examId) {
    return await db.select().from(examAttempts).where(eq(examAttempts.examId, examId));
  }
  // ============ STUDENT ANSWERS ============
  async createOrUpdateStudentAnswer(answer) {
    const id = crypto.randomUUID();
    const values = {
      ...answer,
      id,
      selectedOptions: Array.isArray(answer.selectedOptions) ? JSON.stringify(answer.selectedOptions) : answer.selectedOptions || null
    };
    await db.insert(studentAnswers).values(values);
    const [newAnswer] = await db.select().from(studentAnswers).where(eq(studentAnswers.id, id));
    return newAnswer;
  }
  async getAnswersByAttempt(attemptId) {
    return await db.select().from(studentAnswers).where(eq(studentAnswers.attemptId, attemptId));
  }
  async updateStudentEnrollment(studentId, rollNumber) {
    await db.update(studentClasses).set({ rollNumber }).where(eq(studentClasses.studentId, studentId));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { sql as sql2 } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
var SALT_ROUNDS = 10;
var authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    };
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
var requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.log(`Access denied. User role: ${req.user?.role}, Required: ${roles.join(",")}`);
      return res.status(403).json({ message: `Forbidden. Required: ${roles.join(",")}, Found: ${req.user?.role}` });
    }
    next();
  };
};
async function registerRoutes(app2) {
  app2.get("/api/health-check", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.get("/api/admin/upgrade-db", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      console.log("\u{1F6E0}\uFE0F Upgrading database columns for large images...");
      await db.execute(sql2`ALTER TABLE questions MODIFY COLUMN question_text LONGTEXT`);
      await db.execute(sql2`ALTER TABLE questions MODIFY COLUMN image_data LONGTEXT`);
      console.log("\u2705 Database upgrade successful.");
      res.json({ message: "Database columns upgraded to LONGTEXT successfully." });
    } catch (error) {
      console.error("\u274C Database upgrade failed:", error);
      res.status(500).json({ message: "Upgrade failed", error: error.message });
    }
  });
  app2.get("/api/public/classes", async (req, res) => {
    try {
      const classes2 = await storage.getAllClasses();
      const publicClasses = classes2.map((c) => ({
        id: c.id,
        name: c.name,
        section: c.section
      }));
      res.json(publicClasses);
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, fullName, role, studentId, classId, rollNumber } = req.body;
      if (!username || !password || !fullName) {
        return res.status(400).json({ message: "Username, password, and full name are required" });
      }
      if (role && role !== "student") {
        return res.status(403).json({
          message: "Public registration is available for Students only. Teachers and Admins must be added by an Administrator."
        });
      }
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
      if (studentId) {
        const existingStudentId = await storage.getUserByStudentId(studentId);
        if (existingStudentId) {
          return res.status(400).json({ message: "Student ID already exists" });
        }
      }
      if (role === "student" && classId && rollNumber) {
        const isAvailable = await storage.checkRollNumberAvailability(classId, parseInt(rollNumber));
        if (!isAvailable) {
          return res.status(400).json({ message: `Roll number ${rollNumber} is already assigned in this class` });
        }
      }
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        fullName,
        role: role || "student",
        studentId: role === "student" ? studentId : void 0
      });
      if (role === "student" && classId) {
        try {
          await storage.enrollStudent({
            studentId: user.id,
            classId,
            rollNumber: rollNumber ? parseInt(rollNumber) : void 0
          });
        } catch (enrollError) {
          console.error("Enrollment error during registration:", enrollError);
        }
      }
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
      });
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  app2.get("/api/auth/setup-admin", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const adminExists = allUsers.some((u) => u.role === "admin");
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
    } catch (error) {
      console.error("Setup error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, role } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      if (!role) {
        return res.status(400).json({ message: "Role selection is required" });
      }
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByStudentId(username);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
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
        maxAge: 7 * 24 * 60 * 60 * 1e3
      });
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          studentId: user.studentId
        },
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    res.json({ user: req.user });
  });
  app2.post("/api/auth/change-password", authenticateToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
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
  app2.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });
  app2.get("/api/admin/stats", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const classes2 = await storage.getAllClasses();
      const subjects2 = await storage.getAllSubjects();
      const students = allUsers.filter((u) => u.role === "student");
      const teachers = allUsers.filter((u) => u.role === "teacher");
      const admins = allUsers.filter((u) => ["admin", "organization"].includes(u.role.toLowerCase().trim()));
      res.json({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes2.length,
        totalSubjects: subjects2.length,
        totalAdmins: admins.length
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/admin/classes", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const classes2 = await storage.getAllClasses();
      res.json(classes2);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/admin/classes", authenticateToken, requireRole("admin"), async (req, res) => {
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
  app2.delete("/api/admin/classes/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteClass(req.params.id);
      res.json({ message: "Class deleted successfully" });
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  app2.get("/api/admin/subjects", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const subjects2 = await storage.getAllSubjects();
      res.json(subjects2);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/admin/subjects", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { name, description, classId } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Subject name is required" });
      }
      const newSubject = await storage.createSubject({ name, description });
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
  app2.delete("/api/admin/subjects/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteSubject(req.params.id);
      res.json({ message: "Subject deleted successfully" });
    } catch (error) {
      console.error("Error deleting subject:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  app2.get("/api/admin/teachers", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const teachers = await storage.getUsersByRole("teacher");
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/admin/teachers", authenticateToken, requireRole("admin"), async (req, res) => {
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
        role: "teacher"
      });
      res.json(teacher);
    } catch (error) {
      console.error("Error creating teacher:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/admin/students", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const students = await storage.getAllStudentsWithDetails();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/admin/students", authenticateToken, requireRole("admin"), async (req, res) => {
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
        studentId
      });
      res.json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.delete("/api/admin/users/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  app2.patch("/api/admin/users/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const userId = req.params.id;
      const { fullName, email, role, password, studentId, rollNumber } = req.body;
      const updateData = { fullName, email, role, studentId };
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
      }
      const updatedUser = await storage.updateUser(userId, updateData);
      if (rollNumber !== void 0 && rollNumber !== null) {
        await storage.updateStudentEnrollment(userId, parseInt(rollNumber));
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });
  app2.post("/api/admin/assign-teacher", authenticateToken, requireRole("admin", "organization"), async (req, res) => {
    try {
      const { teacherId, classId, classIds, subjectId } = req.body;
      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID is required" });
      }
      if (!classId && (!classIds || classIds.length === 0)) {
        return res.status(400).json({ message: "At least one Class ID is required" });
      }
      if (classIds && Array.isArray(classIds) && classIds.length > 0) {
        const results = [];
        for (const cid of classIds) {
          try {
            const assignment2 = await storage.assignTeacherToClass({ teacherId, classId: cid, subjectId });
            results.push(assignment2);
          } catch (e) {
            if (!e.message.includes("already assigned")) {
              console.error(`Failed to assign class ${cid}:`, e);
            }
          }
        }
        return res.json({ message: "Assignments processed", count: results.length });
      }
      const assignment = await storage.assignTeacherToClass({ teacherId, classId, subjectId });
      res.json(assignment);
    } catch (error) {
      console.error("Error assigning teacher:", error);
      if (error.message.includes("already assigned")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/admin/teacher-assignments", authenticateToken, requireRole("admin", "organization"), async (req, res) => {
    try {
      const assignments = await storage.getAllTeacherAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.delete("/api/admin/teacher-assignments/:id", authenticateToken, requireRole("admin", "organization"), async (req, res) => {
    try {
      await storage.deleteTeacherAssignment(req.params.id);
      res.json({ message: "Assignment deleted successfully" });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/admin/enroll-student", authenticateToken, requireRole("admin", "organization"), async (req, res) => {
    try {
      const { studentId, classId, rollNumber } = req.body;
      if (!studentId || !classId) {
        return res.status(400).json({ message: "Student ID and Class ID are required" });
      }
      if (rollNumber && rollNumber < 1) {
        return res.status(400).json({ message: "Roll number must be at least 1" });
      }
      const enrollment = await storage.enrollStudent({
        studentId,
        classId,
        rollNumber: rollNumber ? parseInt(rollNumber) : void 0
      });
      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling student:", error);
      if (error.message.includes("Roll number") || error.message.includes("already enrolled")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/admin/list-admins", authenticateToken, requireRole("admin", "organization"), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const admins = allUsers.filter((u) => ["admin", "organization"].includes(u.role.toLowerCase().trim()));
      res.json(admins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/teacher/stats", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const myClasses = await storage.getClassesByTeacher(teacherId);
      const myExams = await storage.getExamsByTeacher(teacherId);
      const myStudents = await storage.getStudentsByTeacher(teacherId);
      let missedExams = 0;
      const now = /* @__PURE__ */ new Date();
      const endedExams = myExams.filter((e) => e.isPublished && new Date(e.endsAt) < now);
      for (const exam of endedExams) {
        const studentsInClass = await storage.getStudentsByClass(exam.classId);
        const attempts = await storage.getAttemptsByExam(exam.id);
        const submittedCount = attempts.filter((a) => a.isSubmitted).length;
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
  app2.get("/api/teacher/students", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user.id;
      console.log(`Fetching students for teacher: ${teacherId}`);
      const students = await storage.getStudentsByTeacher(teacherId);
      console.log(`Found ${students.length} students for teacher ${teacherId}`);
      res.json(students);
    } catch (error) {
      console.error("Error fetching teacher students:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/teacher/students/:studentId/attempts", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const studentId = req.params.studentId;
      const students = await storage.getStudentsByTeacher(teacherId);
      const hasAccess = students.some((s) => s.id === studentId);
      if (!hasAccess) {
        return res.status(403).json({ message: "You do not have access to this student" });
      }
      const attempts = await storage.getAttemptsByStudent(studentId);
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
  app2.get("/api/teacher/classes", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const classes2 = await storage.getClassesByTeacher(teacherId);
      res.json(classes2);
    } catch (error) {
      console.error("Error fetching teacher classes:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/teacher/all-classes", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const classes2 = await storage.getAllClasses();
      res.json(classes2);
    } catch (error) {
      console.error("Error fetching all classes:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/teacher/class/:id/students", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const classId = req.params.id;
      const myClasses = await storage.getClassesByTeacher(teacherId);
      const isAssigned = myClasses.some((c) => c.id === classId);
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
  app2.get("/api/teacher/exams", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const exams2 = await storage.getExamsByTeacher(teacherId);
      res.json(exams2);
    } catch (error) {
      console.error("Error fetching teacher exams:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/teacher/exams", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const { questions: questions2, classIds, ...examData } = req.body;
      console.log("=== EXAM CREATION REQUEST ===");
      console.log("Teacher ID:", teacherId);
      console.log("Class IDs:", classIds);
      const primaryClassId = classIds && classIds.length > 0 ? classIds[0] : examData.classId;
      if (!examData.title || !primaryClassId) {
        return res.status(400).json({ message: "Title and class are required" });
      }
      if (!questions2 || questions2.length === 0) {
        return res.status(400).json({ message: "At least one question is required" });
      }
      const exam = await storage.createExam({
        ...examData,
        classId: primaryClassId,
        scheduledAt: examData.scheduledAt ? new Date(examData.scheduledAt) : /* @__PURE__ */ new Date(),
        endsAt: examData.endsAt ? new Date(examData.endsAt) : /* @__PURE__ */ new Date(),
        teacherId,
        status: "draft",
        isPublished: false
      }, classIds);
      console.log("Exam created:", exam.id);
      for (let i = 0; i < questions2.length; i++) {
        const q = questions2[i];
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
          orderIndex: i
        });
        if (q.options && q.options.length > 0) {
          for (let j = 0; j < q.options.length; j++) {
            const opt = q.options[j];
            await storage.createQuestionOption({
              questionId: question.id,
              optionText: opt.text || "",
              isCorrect: opt.isCorrect || false,
              orderIndex: j
            });
          }
        }
        if (q.numericAnswer !== void 0 && q.numericAnswer !== null) {
          await storage.createNumericAnswer({
            questionId: question.id,
            correctAnswer: q.numericAnswer,
            tolerance: q.tolerance !== void 0 ? q.tolerance : null
          });
        }
      }
      console.log("Exam created successfully with", questions2.length, "questions");
      res.json({ message: "Exam created successfully", exam });
    } catch (error) {
      console.error("Error creating exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/teacher/exam/:id", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const examId = req.params.id;
      const exam = await storage.getExam(examId);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      if (exam.teacherId !== teacherId) return res.status(403).json({ message: "Access denied" });
      const questions2 = await storage.getQuestionsByExam(examId);
      const classIds = await storage.getClassesByExam(examId);
      const questionsWithDetails = await Promise.all(questions2.map(async (q) => {
        const options = await storage.getOptionsByQuestion(q.id);
        const numericAnswer = await storage.getNumericAnswerByQuestion(q.id);
        return {
          ...q,
          options,
          numericAnswer: numericAnswer?.correctAnswer,
          numericTolerance: numericAnswer?.tolerance
        };
      }));
      res.json({ ...exam, classIds, questions: questionsWithDetails });
    } catch (error) {
      console.error("Error fetching exam details:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.put("/api/teacher/exam/:id", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const examId = req.params.id;
      const { questions: questions2, classIds, ...examData } = req.body;
      const exam = await storage.getExam(examId);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      if (exam.teacherId !== teacherId) return res.status(403).json({ message: "Access denied" });
      if (exam.isPublished) return res.status(400).json({ message: "Cannot edit published exam" });
      const primaryClassId = classIds && classIds.length > 0 ? classIds[0] : examData.classId;
      const updatedExam = await storage.updateExam(examId, {
        ...examData,
        classId: primaryClassId || exam.classId,
        scheduledAt: examData.scheduledAt ? new Date(examData.scheduledAt) : void 0,
        endsAt: examData.endsAt ? new Date(examData.endsAt) : void 0
      }, classIds);
      if (questions2 && questions2.length > 0) {
        await storage.deleteQuestionsByExam(examId);
        for (let i = 0; i < questions2.length; i++) {
          const q = questions2[i];
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
            orderIndex: i
          });
          if (q.options && q.options.length > 0) {
            for (let j = 0; j < q.options.length; j++) {
              const opt = q.options[j];
              await storage.createQuestionOption({
                questionId: question.id,
                optionText: opt.text || "",
                isCorrect: opt.isCorrect || false,
                orderIndex: j
              });
            }
          }
          if (q.numericAnswer !== void 0 && q.numericAnswer !== null) {
            await storage.createNumericAnswer({
              questionId: question.id,
              correctAnswer: q.numericAnswer,
              tolerance: q.tolerance !== void 0 ? q.tolerance : null
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
  app2.put("/api/teacher/exam/:id/publish", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const examId = req.params.id;
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
  app2.put("/api/teacher/exam/:id/unpublish", authenticateToken, requireRole("teacher"), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const examId = req.params.id;
      const exam = await storage.getExam(examId);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      if (exam.teacherId !== teacherId) {
        return res.status(403).json({ message: "You can only unpublish your own exams" });
      }
      const now = /* @__PURE__ */ new Date();
      if (now >= new Date(exam.scheduledAt)) {
        return res.status(400).json({ message: "Cannot unpublish an exam that has already started" });
      }
      const updatedExam = await storage.updateExam(examId, {
        isPublished: false,
        status: "draft"
      });
      console.log("Exam unpublished:", examId);
      res.json({ message: "Exam unpublished successfully", exam: updatedExam });
    } catch (error) {
      console.error("Error unpublishing exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/student/stats", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user.id;
      const myClasses = await storage.getClassesByStudent(studentId);
      const attempts = await storage.getAttemptsByStudent(studentId);
      let totalExams = 0;
      for (const cls of myClasses) {
        const exams2 = await storage.getPublishedExamsByClass(cls.id);
        totalExams += exams2.length;
      }
      const completedExams = attempts.filter((a) => a.isSubmitted).length;
      res.json({
        totalClasses: myClasses.length,
        totalExams,
        completedExams,
        pendingExams: totalExams - completedExams
      });
    } catch (error) {
      console.error("Error fetching student stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/student/classes", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user.id;
      const classes2 = await storage.getStudentClassesWithDetails(studentId);
      res.json(classes2);
    } catch (error) {
      console.error("Error fetching student classes:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/student/exams", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user.id;
      const myClasses = await storage.getClassesByStudent(studentId);
      const allExams = [];
      const processedExamIds = /* @__PURE__ */ new Set();
      for (const cls of myClasses) {
        const exams2 = await storage.getPublishedExamsByClass(cls.id);
        for (const exam of exams2) {
          if (!processedExamIds.has(exam.id)) {
            allExams.push(exam);
            processedExamIds.add(exam.id);
          }
        }
      }
      const attempts = await storage.getAttemptsByStudent(studentId);
      const submittedExamIds = new Set(attempts.filter((a) => a.isSubmitted).map((a) => a.examId));
      const examsWithStatus = allExams.map((exam) => ({
        ...exam,
        isSubmitted: submittedExamIds.has(exam.id)
      }));
      res.json(examsWithStatus);
    } catch (error) {
      console.error("Error fetching student exams:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/student/exam/:id", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user.id;
      const examId = req.params.id;
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      if (!exam.isPublished) {
        return res.status(403).json({ message: "This exam is not published yet" });
      }
      const myClasses = await storage.getClassesByStudent(studentId);
      let isInClass = myClasses.some((c) => c.id === exam.classId);
      if (!isInClass) {
        const examClassIds = await storage.getClassesByExam(examId);
        isInClass = myClasses.some((c) => examClassIds.includes(c.id));
      }
      if (!isInClass) {
        return res.status(403).json({ message: "You are not enrolled in this class" });
      }
      const questions2 = await storage.getQuestionsByExam(examId);
      const questionsWithOptions = await Promise.all(
        questions2.map(async (q) => ({
          ...q,
          options: await storage.getOptionsByQuestion(q.id)
        }))
      );
      const attempt = await storage.getAttemptByExamAndStudent(examId, studentId);
      res.json({
        ...exam,
        questions: questionsWithOptions,
        isSubmitted: attempt?.isSubmitted || false
      });
    } catch (error) {
      console.error("Error fetching exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/student/exam/:id/start", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user.id;
      const examId = req.params.id;
      const attempt = await storage.getAttemptByExamAndStudent(examId, studentId);
      if (attempt && attempt.isSubmitted) {
        return res.status(400).json({ message: "Exam already submitted" });
      }
      if (!attempt) {
        await storage.createExamAttempt({
          examId,
          studentId,
          isSubmitted: false
        });
      }
      res.json({ message: "Exam started" });
    } catch (error) {
      console.error("Error starting exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/student/exam/:id/result", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user.id;
      const examId = req.params.id;
      const attempt = await storage.getAttemptByExamAndStudent(examId, studentId);
      if (!attempt || !attempt.isSubmitted) {
        return res.status(404).json({ message: "Result not found" });
      }
      const exam = await storage.getExam(examId);
      const questions2 = await storage.getQuestionsByExam(examId);
      const studentAnswers2 = await storage.getAnswersByAttempt(attempt.id);
      const resultDetails = await Promise.all(questions2.map(async (q) => {
        const options = await storage.getOptionsByQuestion(q.id);
        const numericAnswer = await storage.getNumericAnswerByQuestion(q.id);
        const studentAnswer = studentAnswers2.find((a) => a.questionId === q.id);
        let isCorrect = false;
        let studentResponse = null;
        if (q.questionType === "mcq" || q.questionType === "true_false") {
          if (studentAnswer && studentAnswer.selectedOptions && studentAnswer.selectedOptions.length > 0) {
            const selectedOptId = studentAnswer.selectedOptions[0];
            const selectedOpt = options.find((o) => o.id === selectedOptId);
            if (selectedOpt) {
              studentResponse = selectedOpt.optionText;
              isCorrect = selectedOpt.isCorrect;
            }
          }
        } else if (q.questionType === "numeric") {
          if (studentAnswer && studentAnswer.numericAnswer !== null && studentAnswer.numericAnswer !== void 0) {
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
          isCorrect
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
  app2.post("/api/student/exam/:id/submit", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user.id;
      const examId = req.params.id;
      const { answers } = req.body;
      const attempt = await storage.getAttemptByExamAndStudent(examId, studentId);
      if (!attempt) {
        return res.status(404).json({ message: "Exam attempt not found" });
      }
      if (attempt.isSubmitted) {
        return res.status(400).json({ message: "Exam already submitted" });
      }
      const questions2 = await storage.getQuestionsByExam(examId);
      let totalScore = 0;
      for (const answer of answers) {
        const question = questions2.find((q) => q.id === answer.questionId);
        if (!question) continue;
        let isCorrect = false;
        let marksAwarded = 0;
        await storage.createOrUpdateStudentAnswer({
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedOptions: answer.selectedOptions,
          isCorrect: false,
          marksAwarded: 0
        });
        if (question.questionType === "mcq") {
          const options = await storage.getOptionsByQuestion(question.id);
          const correctOption = options.find((o) => o.isCorrect);
          if (correctOption && answer.selectedOptions?.[0] === correctOption.id) {
            isCorrect = true;
            marksAwarded = question.marks;
          } else {
            if (question.negativeMarks && question.negativeMarks > 0) {
              marksAwarded = -question.negativeMarks;
            }
          }
        } else if (question.questionType === "numeric") {
          const numericAnswer = await storage.getNumericAnswerByQuestion(question.id);
          if (numericAnswer && answer.numericAnswer !== void 0 && answer.numericAnswer !== null) {
            const tolerance = numericAnswer.tolerance || 0;
            if (Math.abs(answer.numericAnswer - numericAnswer.correctAnswer) <= tolerance) {
              isCorrect = true;
              marksAwarded = question.marks;
            } else {
              if (question.negativeMarks && question.negativeMarks > 0) {
                marksAwarded = -question.negativeMarks;
              }
            }
          }
        }
        totalScore += marksAwarded;
        await storage.createOrUpdateStudentAnswer({
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedOptions: answer.selectedOptions,
          numericAnswer: answer.numericAnswer,
          // Added numericAnswer field
          isCorrect,
          marksAwarded
        });
      }
      const exam = await storage.getExam(examId);
      const percentage = exam ? Math.round(totalScore / exam.totalMarks * 100) : 0;
      const isPassed = exam ? percentage >= (exam.passingMarks || 40) : false;
      await storage.updateExamAttempt(attempt.id, {
        isSubmitted: true,
        submittedAt: /* @__PURE__ */ new Date(),
        totalScore,
        percentage,
        isPassed
      });
      res.json({
        message: "Exam submitted successfully",
        totalScore,
        totalMarks: exam?.totalMarks,
        percentage,
        isPassed
      });
    } catch (error) {
      console.error("Error submitting exam:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/student/results", authenticateToken, requireRole("student"), async (req, res) => {
    try {
      const studentId = req.user.id;
      const attempts = await storage.getAttemptsByStudent(studentId);
      const results = await Promise.all(
        attempts.filter((a) => a.isSubmitted).map(async (attempt) => {
          const exam = await storage.getExam(attempt.examId);
          return {
            ...attempt,
            exam
          };
        })
      );
      res.json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/subjects", authenticateToken, async (req, res) => {
    try {
      const subjects2 = await storage.getAllSubjects();
      res.json(subjects2);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/app.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express();
app.use(cookieParser());
app.use(express.json({
  limit: "100mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: "100mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function runApp(setup) {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  await setup(app, server);
  if (!server.listening) {
    const port = parseInt(process.env.PORT || "3000", 10);
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  } else {
    log("Server is already listening (managed by entry point).");
  }
}

// server/index-prod.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function serveStatic(app2, _server) {
  const distPath = path.resolve(__dirname, "public");
  if (fs.existsSync(distPath)) {
    app2.use(express2.static(distPath));
  }
  app2.use("*", (req, res) => {
    if (req.originalUrl.includes("/api/")) {
      return res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
    }
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend files missing.");
    }
  });
}
(async () => {
  console.log("\u{1F680} PRODUCTION BUNDLE INITIALIZING...");
  try {
    await runApp(serveStatic);
    console.log("\u2705 Application routes and static files initialized.");
  } catch (error) {
    console.error("\u274C BUNDLE ERROR:", error);
  }
})();
export {
  serveStatic
};
