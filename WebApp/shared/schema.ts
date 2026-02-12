import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "teacher", "admin"]);
export const questionTypeEnum = pgEnum("question_type", ["mcq", "msq", "numeric", "true_false"]);
export const examStatusEnum = pgEnum("exam_status", ["draft", "scheduled", "active", "completed", "cancelled"]);
export const activityTypeEnum = pgEnum("activity_type", ["tab_change", "focus_loss", "full_screen_exit", "page_reload"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Classes table
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Student-Class relationship (many-to-many)
export const studentClasses = pgTable("student_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  classId: varchar("class_id").notNull().references(() => classes.id),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
});

// Exams table
export const exams = pgTable("exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  classId: varchar("class_id").notNull().references(() => classes.id),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  duration: integer("duration").notNull(), // in minutes
  totalMarks: integer("total_marks").notNull(),
  passingMarks: integer("passing_marks").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  status: examStatusEnum("status").notNull().default("draft"),
  instructions: text("instructions"),
  negativeMarking: boolean("negative_marking").notNull().default(false),
  negativeMarks: integer("negative_marks").default(0),
  shuffleQuestions: boolean("shuffle_questions").notNull().default(false),
  shuffleOptions: boolean("shuffle_options").notNull().default(false),
  showResults: boolean("show_results").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Subjects table (for categorizing questions)
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull().references(() => exams.id),
  subjectId: varchar("subject_id").references(() => subjects.id),
  questionText: text("question_text").notNull(),
  questionType: questionTypeEnum("question_type").notNull(),
  marks: integer("marks").notNull(),
  difficulty: text("difficulty"), // easy, medium, hard
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Question options table (for MCQ, MSQ, True/False)
export const questionOptions = pgTable("question_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  orderIndex: integer("order_index").notNull(),
});

// Numeric answers table (for numeric type questions)
export const numericAnswers = pgTable("numeric_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  correctAnswer: text("correct_answer").notNull(),
  tolerance: text("tolerance"), // for range-based answers
});

// Exam attempts table
export const examAttempts = pgTable("exam_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull().references(() => exams.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  submittedAt: timestamp("submitted_at"),
  isSubmitted: boolean("is_submitted").notNull().default(false),
  timeRemaining: integer("time_remaining"), // in seconds
  totalScore: integer("total_score"),
  percentage: integer("percentage"),
  isPassed: boolean("is_passed"),
});

// Student answers table
export const studentAnswers = pgTable("student_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull().references(() => examAttempts.id),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  selectedOptions: text("selected_options").array(), // array of option IDs for MCQ/MSQ
  numericAnswer: text("numeric_answer"), // for numeric questions
  isCorrect: boolean("is_correct"),
  marksAwarded: integer("marks_awarded"),
  isVisited: boolean("is_visited").notNull().default(false),
  isMarkedForReview: boolean("is_marked_for_review").notNull().default(false),
  savedAt: timestamp("saved_at").notNull().defaultNow(),
});

// Activity logs table (for general activities)
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(),
  description: text("description"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Cheating logs table (for exam-specific violations)
export const cheatingLogs = pgTable("cheating_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull().references(() => examAttempts.id),
  activityType: activityTypeEnum("activity_type").notNull(),
  description: text("description").notNull(),
  count: integer("count").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// System settings table
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolName: text("school_name").notNull(),
  schoolLogo: text("school_logo"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  maxTabSwitches: integer("max_tab_switches").default(3),
  maxFocusLoss: integer("max_focus_loss").default(5),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teacherClasses: many(classes),
  studentClasses: many(studentClasses),
  teacherExams: many(exams),
  examAttempts: many(examAttempts),
  activityLogs: many(activityLogs),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  students: many(studentClasses),
  exams: many(exams),
}));

export const studentClassesRelations = relations(studentClasses, ({ one }) => ({
  student: one(users, {
    fields: [studentClasses.studentId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [studentClasses.classId],
    references: [classes.id],
  }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  class: one(classes, {
    fields: [exams.classId],
    references: [classes.id],
  }),
  teacher: one(users, {
    fields: [exams.teacherId],
    references: [users.id],
  }),
  questions: many(questions),
  attempts: many(examAttempts),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  exam: one(exams, {
    fields: [questions.examId],
    references: [exams.id],
  }),
  subject: one(subjects, {
    fields: [questions.subjectId],
    references: [subjects.id],
  }),
  options: many(questionOptions),
  numericAnswers: many(numericAnswers),
  studentAnswers: many(studentAnswers),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id],
  }),
}));

export const numericAnswersRelations = relations(numericAnswers, ({ one }) => ({
  question: one(questions, {
    fields: [numericAnswers.questionId],
    references: [questions.id],
  }),
}));

export const examAttemptsRelations = relations(examAttempts, ({ one, many }) => ({
  exam: one(exams, {
    fields: [examAttempts.examId],
    references: [exams.id],
  }),
  student: one(users, {
    fields: [examAttempts.studentId],
    references: [users.id],
  }),
  answers: many(studentAnswers),
  cheatingLogs: many(cheatingLogs),
}));

export const studentAnswersRelations = relations(studentAnswers, ({ one }) => ({
  attempt: one(examAttempts, {
    fields: [studentAnswers.attemptId],
    references: [examAttempts.id],
  }),
  question: one(questions, {
    fields: [studentAnswers.questionId],
    references: [questions.id],
  }),
}));

export const cheatingLogsRelations = relations(cheatingLogs, ({ one }) => ({
  attempt: one(examAttempts, {
    fields: [cheatingLogs.attemptId],
    references: [examAttempts.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

export const insertStudentClassSchema = createInsertSchema(studentClasses).omit({
  id: true,
  enrolledAt: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionOptionSchema = createInsertSchema(questionOptions).omit({
  id: true,
});

export const insertNumericAnswerSchema = createInsertSchema(numericAnswers).omit({
  id: true,
});

export const insertExamAttemptSchema = createInsertSchema(examAttempts).omit({
  id: true,
  startedAt: true,
});

export const insertStudentAnswerSchema = createInsertSchema(studentAnswers).omit({
  id: true,
  savedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertCheatingLogSchema = createInsertSchema(cheatingLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type StudentClass = typeof studentClasses.$inferSelect;
export type InsertStudentClass = z.infer<typeof insertStudentClassSchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type QuestionOption = typeof questionOptions.$inferSelect;
export type InsertQuestionOption = z.infer<typeof insertQuestionOptionSchema>;

export type NumericAnswer = typeof numericAnswers.$inferSelect;
export type InsertNumericAnswer = z.infer<typeof insertNumericAnswerSchema>;

export type ExamAttempt = typeof examAttempts.$inferSelect;
export type InsertExamAttempt = z.infer<typeof insertExamAttemptSchema>;

export type StudentAnswer = typeof studentAnswers.$inferSelect;
export type InsertStudentAnswer = z.infer<typeof insertStudentAnswerSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type CheatingLog = typeof cheatingLogs.$inferSelect;
export type InsertCheatingLog = z.infer<typeof insertCheatingLogSchema>;

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
