import {
  users,
  classes,
  studentClasses,
  exams,
  subjects,
  questions,
  questionOptions,
  numericAnswers,
  examAttempts,
  studentAnswers,
  activityLogs,
  cheatingLogs,
  systemSettings,
  type User,
  type InsertUser,
  type Class,
  type InsertClass,
  type StudentClass,
  type InsertStudentClass,
  type Exam,
  type InsertExam,
  type Subject,
  type InsertSubject,
  type Question,
  type InsertQuestion,
  type QuestionOption,
  type InsertQuestionOption,
  type NumericAnswer,
  type InsertNumericAnswer,
  type ExamAttempt,
  type InsertExamAttempt,
  type StudentAnswer,
  type InsertStudentAnswer,
  type ActivityLog,
  type InsertActivityLog,
  type CheatingLog,
  type InsertCheatingLog,
  type SystemSettings,
  type InsertSystemSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;

  // Classes
  getClass(id: string): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  getClassesByTeacher(teacherId: string): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;

  // Student Classes
  enrollStudent(data: InsertStudentClass): Promise<StudentClass>;
  getStudentsByClass(classId: string): Promise<User[]>;
  getClassesByStudent(studentId: string): Promise<Class[]>;

  // Subjects
  getAllSubjects(): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;

  // Exams
  getExam(id: string): Promise<Exam | undefined>;
  getExamsByClass(classId: string): Promise<Exam[]>;
  getExamsByTeacher(teacherId: string): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: string, exam: Partial<InsertExam>): Promise<Exam>;

  // Questions
  getQuestionsByExam(examId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // Question Options
  getOptionsByQuestion(questionId: string): Promise<QuestionOption[]>;
  createQuestionOption(option: InsertQuestionOption): Promise<QuestionOption>;

  // Numeric Answers
  getNumericAnswerByQuestion(questionId: string): Promise<NumericAnswer | undefined>;
  createNumericAnswer(answer: InsertNumericAnswer): Promise<NumericAnswer>;

  // Exam Attempts
  getExamAttempt(id: string): Promise<ExamAttempt | undefined>;
  getAttemptByExamAndStudent(examId: string, studentId: string): Promise<ExamAttempt | undefined>;
  createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt>;
  updateExamAttempt(id: string, attempt: Partial<InsertExamAttempt>): Promise<ExamAttempt>;

  // Student Answers
  getAnswersByAttempt(attemptId: string): Promise<StudentAnswer[]>;
  createOrUpdateStudentAnswer(answer: InsertStudentAnswer): Promise<StudentAnswer>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Cheating Logs
  createCheatingLog(log: InsertCheatingLog): Promise<CheatingLog>;
  getCheatingLogsByAttempt(attemptId: string): Promise<CheatingLog[]>;

  // System Settings
  getSystemSettings(): Promise<SystemSettings | undefined>;
  updateSystemSettings(settings: Partial<InsertSystemSettings>): Promise<SystemSettings>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any)).orderBy(desc(users.createdAt));
  }

  // Classes
  async getClass(id: string): Promise<Class | undefined> {
    const [classData] = await db.select().from(classes).where(eq(classes.id, id));
    return classData || undefined;
  }

  async getAllClasses(): Promise<Class[]> {
    return await db.select().from(classes).orderBy(desc(classes.createdAt));
  }

  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.teacherId, teacherId)).orderBy(desc(classes.createdAt));
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(classes).values(classData).returning();
    return newClass;
  }

  // Student Classes
  async enrollStudent(data: InsertStudentClass): Promise<StudentClass> {
    const [enrollment] = await db.insert(studentClasses).values(data).returning();
    return enrollment;
  }

  async getStudentsByClass(classId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(studentClasses)
      .innerJoin(users, eq(studentClasses.studentId, users.id))
      .where(eq(studentClasses.classId, classId));
    return result.map((r) => r.user);
  }

  async getClassesByStudent(studentId: string): Promise<Class[]> {
    const result = await db
      .select({ class: classes })
      .from(studentClasses)
      .innerJoin(classes, eq(studentClasses.classId, classes.id))
      .where(eq(studentClasses.studentId, studentId));
    return result.map((r) => r.class);
  }

  // Subjects
  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(subjects.name);
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  // Exams
  async getExam(id: string): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam || undefined;
  }

  async getExamsByClass(classId: string): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.classId, classId)).orderBy(desc(exams.scheduledAt));
  }

  async getExamsByTeacher(teacherId: string): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.teacherId, teacherId)).orderBy(desc(exams.scheduledAt));
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const [newExam] = await db.insert(exams).values(exam).returning();
    return newExam;
  }

  async updateExam(id: string, exam: Partial<InsertExam>): Promise<Exam> {
    const [updated] = await db.update(exams).set(exam).where(eq(exams.id, id)).returning();
    return updated;
  }

  // Questions
  async getQuestionsByExam(examId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.examId, examId)).orderBy(questions.orderIndex);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  // Question Options
  async getOptionsByQuestion(questionId: string): Promise<QuestionOption[]> {
    return await db
      .select()
      .from(questionOptions)
      .where(eq(questionOptions.questionId, questionId))
      .orderBy(questionOptions.orderIndex);
  }

  async createQuestionOption(option: InsertQuestionOption): Promise<QuestionOption> {
    const [newOption] = await db.insert(questionOptions).values(option).returning();
    return newOption;
  }

  // Numeric Answers
  async getNumericAnswerByQuestion(questionId: string): Promise<NumericAnswer | undefined> {
    const [answer] = await db.select().from(numericAnswers).where(eq(numericAnswers.questionId, questionId));
    return answer || undefined;
  }

  async createNumericAnswer(answer: InsertNumericAnswer): Promise<NumericAnswer> {
    const [newAnswer] = await db.insert(numericAnswers).values(answer).returning();
    return newAnswer;
  }

  // Exam Attempts
  async getExamAttempt(id: string): Promise<ExamAttempt | undefined> {
    const [attempt] = await db.select().from(examAttempts).where(eq(examAttempts.id, id));
    return attempt || undefined;
  }

  async getAttemptByExamAndStudent(examId: string, studentId: string): Promise<ExamAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(examAttempts)
      .where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, studentId)));
    return attempt || undefined;
  }

  async createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt> {
    const [newAttempt] = await db.insert(examAttempts).values(attempt).returning();
    return newAttempt;
  }

  async updateExamAttempt(id: string, attempt: Partial<InsertExamAttempt>): Promise<ExamAttempt> {
    const [updated] = await db.update(examAttempts).set(attempt).where(eq(examAttempts.id, id)).returning();
    return updated;
  }

  // Student Answers
  async getAnswersByAttempt(attemptId: string): Promise<StudentAnswer[]> {
    return await db.select().from(studentAnswers).where(eq(studentAnswers.attemptId, attemptId));
  }

  async createOrUpdateStudentAnswer(answer: InsertStudentAnswer): Promise<StudentAnswer> {
    // Check if answer already exists
    const [existing] = await db
      .select()
      .from(studentAnswers)
      .where(and(eq(studentAnswers.attemptId, answer.attemptId), eq(studentAnswers.questionId, answer.questionId)));

    if (existing) {
      const [updated] = await db
        .update(studentAnswers)
        .set(answer)
        .where(eq(studentAnswers.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newAnswer] = await db.insert(studentAnswers).values(answer).returning();
      return newAnswer;
    }
  }

  // Activity Logs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  // Cheating Logs
  async createCheatingLog(log: InsertCheatingLog): Promise<CheatingLog> {
    const [newLog] = await db.insert(cheatingLogs).values(log).returning();
    return newLog;
  }

  async getCheatingLogsByAttempt(attemptId: string): Promise<CheatingLog[]> {
    return await db.select().from(cheatingLogs).where(eq(cheatingLogs.attemptId, attemptId)).orderBy(desc(cheatingLogs.createdAt));
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings | undefined> {
    const [settings] = await db.select().from(systemSettings).limit(1);
    return settings || undefined;
  }

  async updateSystemSettings(settings: Partial<InsertSystemSettings>): Promise<SystemSettings> {
    const existing = await this.getSystemSettings();
    if (existing) {
      const [updated] = await db
        .update(systemSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(systemSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newSettings] = await db.insert(systemSettings).values(settings as InsertSystemSettings).returning();
      return newSettings;
    }
  }
}

export const storage = new DatabaseStorage();
