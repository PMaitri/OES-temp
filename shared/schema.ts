import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, int, timestamp, boolean, mysqlEnum, double, longtext } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum Values for reuse in tables
export const userRoles = ["student", "teacher", "admin", "organization"] as const;
export const questionTypes = ["mcq", "msq", "numeric", "true_false"] as const;
export const examStatuses = ["draft", "published", "active", "completed", "cancelled"] as const;
export const activityTypes = ["tab_change", "focus_loss", "full_screen_exit", "page_reload"] as const;

// Users table
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: mysqlEnum("role", userRoles).notNull().default("student"),
  studentId: varchar("student_id", { length: 255 }).unique(), // For student login (e.g., "STU001")
  organizationId: varchar("organization_id", { length: 36 }),
  instituteId: varchar("institute_id", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Organizations table
export const organizations = mysqlTable("organizations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: text("name").notNull(),
  description: text("description"),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }),
  address: text("address"),
  logo: text("logo"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Institutes table
export const institutes = mysqlTable("institutes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  organizationId: varchar("organization_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Classes table
export const classes = mysqlTable("classes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: text("name").notNull(),
  section: varchar("section", { length: 50 }),
  description: text("description"),
  instituteId: varchar("institute_id", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Subjects table
export const subjects = mysqlTable("subjects", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Class-Subject relationship
export const classSubjects = mysqlTable("class_subjects", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  classId: varchar("class_id", { length: 36 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Teacher-Class assignment
export const teacherClasses = mysqlTable("teacher_classes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  teacherId: varchar("teacher_id", { length: 36 }).notNull(),
  classId: varchar("class_id", { length: 36 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

// Student-Class relationship
export const studentClasses = mysqlTable("student_classes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  classId: varchar("class_id", { length: 36 }).notNull(),
  rollNumber: int("roll_number"),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
});

// Exams table
export const exams = mysqlTable("exams", {
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Exam-Class relationship
export const examClasses = mysqlTable("exam_classes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  examId: varchar("exam_id", { length: 36 }).notNull(),
  classId: varchar("class_id", { length: 36 }).notNull(),
});

// Questions table
export const questions = mysqlTable("questions", {
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Question options table
export const questionOptions = mysqlTable("question_options", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  questionId: varchar("question_id", { length: 36 }).notNull(),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  orderIndex: int("order_index").notNull(),
});

// Numeric answers table
export const numericAnswers = mysqlTable("numeric_answers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  questionId: varchar("question_id", { length: 36 }).notNull(),
  correctAnswer: double("correct_answer").notNull(),
  tolerance: double("tolerance"),
});

// Exam attempts table
export const examAttempts = mysqlTable("exam_attempts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  examId: varchar("exam_id", { length: 36 }).notNull(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  submittedAt: timestamp("submitted_at"),
  isSubmitted: boolean("is_submitted").notNull().default(false),
  totalScore: int("total_score").default(0),
  percentage: int("percentage").default(0),
  isPassed: boolean("is_passed").default(false),
  timeSpent: int("time_spent").default(0),
});

// Student answers table
export const studentAnswers = mysqlTable("student_answers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  attemptId: varchar("attempt_id", { length: 36 }).notNull(),
  questionId: varchar("question_id", { length: 36 }).notNull(),
  selectedOptions: text("selected_options"),
  numericAnswer: double("numeric_answer"),
  isCorrect: boolean("is_correct").default(false),
  marksAwarded: int("marks_awarded").default(0),
  answeredAt: timestamp("answered_at").notNull().defaultNow(),
});

// Activity logs table
export const activityLogs = mysqlTable("activity_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  attemptId: varchar("attempt_id", { length: 36 }).notNull(),
  activityType: mysqlEnum("activity_type", activityTypes).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  details: text("details"),
});

// Cheating logs table
export const cheatingLogs = mysqlTable("cheating_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  attemptId: varchar("attempt_id", { length: 36 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  description: text("description"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// System settings table
export const systemSettings = mysqlTable("system_settings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  key: varchar("key_name", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, { fields: [users.organizationId], references: [organizations.id] }),
  institute: one(institutes, { fields: [users.instituteId], references: [institutes.id] }),
  classes: many(teacherClasses),
  enrollments: many(studentClasses),
  attempts: many(examAttempts),
  createdExams: many(exams),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  institutes: many(institutes),
  users: many(users),
}));

export const institutesRelations = relations(institutes, ({ one, many }) => ({
  organization: one(organizations, { fields: [institutes.organizationId], references: [organizations.id] }),
  users: many(users),
  classes: many(classes),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  institute: one(institutes, { fields: [classes.instituteId], references: [institutes.id] }),
  subjects: many(classSubjects),
  teachers: many(teacherClasses),
  students: many(studentClasses),
  exams: many(examClasses),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  classes: many(classSubjects),
  teachers: many(teacherClasses),
  exams: many(exams),
  questions: many(questions),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  teacher: one(users, { fields: [exams.teacherId], references: [users.id] }),
  subject: one(subjects, { fields: [exams.subjectId], references: [subjects.id] }),
  classes: many(examClasses),
  questions: many(questions),
  attempts: many(examAttempts),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  exam: one(exams, { fields: [questions.examId], references: [exams.id] }),
  subject: one(subjects, { fields: [questions.subjectId], references: [subjects.id] }),
  options: many(questionOptions),
  numericAnswer: one(numericAnswers, { fields: [questions.id], references: [numericAnswers.questionId] }),
}));

export const examAttemptsRelations = relations(examAttempts, ({ one, many }) => ({
  exam: one(exams, { fields: [examAttempts.examId], references: [exams.id] }),
  student: one(users, { fields: [examAttempts.studentId], references: [users.id] }),
  answers: many(studentAnswers),
  activityLogs: many(activityLogs),
  cheatingLogs: many(cheatingLogs),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertClassSchema = createInsertSchema(classes);
export const insertSubjectSchema = createInsertSchema(subjects);
export const insertExamSchema = createInsertSchema(exams);
export const insertQuestionSchema = createInsertSchema(questions);
export const insertQuestionOptionSchema = createInsertSchema(questionOptions);
export const insertNumericAnswerSchema = createInsertSchema(numericAnswers);
export const insertExamAttemptSchema = createInsertSchema(examAttempts).omit({ startedAt: true });
export const insertStudentAnswerSchema = createInsertSchema(studentAnswers);
export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const insertCheatingLogSchema = createInsertSchema(cheatingLogs);

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;
export type Institute = typeof institutes.$inferSelect;
export type InsertInstitute = typeof institutes.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;
export type ClassSubject = typeof classSubjects.$inferSelect;
export type InsertClassSubject = typeof classSubjects.$inferInsert;
export type TeacherClass = typeof teacherClasses.$inferSelect;
export type InsertTeacherClass = typeof teacherClasses.$inferInsert;
export type StudentClass = typeof studentClasses.$inferSelect;
export type InsertStudentClass = typeof studentClasses.$inferInsert;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = typeof exams.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;
export type QuestionOption = typeof questionOptions.$inferSelect;
export type InsertQuestionOption = typeof questionOptions.$inferInsert;
export type NumericAnswer = typeof numericAnswers.$inferSelect;
export type InsertNumericAnswer = typeof numericAnswers.$inferInsert;
export type ExamAttempt = typeof examAttempts.$inferSelect;
export type InsertExamAttempt = typeof examAttempts.$inferInsert;
export type StudentAnswer = typeof studentAnswers.$inferSelect;
export type InsertStudentAnswer = typeof studentAnswers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type CheatingLog = typeof cheatingLogs.$inferSelect;
export type InsertCheatingLog = typeof cheatingLogs.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
