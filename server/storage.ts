import {
  users,
  classes,
  subjects,
  classSubjects,
  teacherClasses,
  studentClasses,
  exams,
  examClasses,
  questions,
  questionOptions,
  numericAnswers,
  examAttempts,
  studentAnswers,
  activityLogs,
  cheatingLogs,
  type User,
  type InsertUser,
  type Class,
  type InsertClass,
  type Subject,
  type InsertSubject,
  type ClassSubject,
  type InsertClassSubject,
  type TeacherClass,
  type InsertTeacherClass,
  type StudentClass,
  type InsertStudentClass,
  type Exam,
  type InsertExam,
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
  systemSettings,
} from "../shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray, isNull } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getAllStudentsWithDetails(): Promise<(User & { className: string | null; section: string | null; rollNumber: number | null })[]>;
  deleteUser(id: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User>;
  createPasswordResetToken(email: string): Promise<string>;
  resetPasswordWithToken(token: string, newPassword: string): Promise<void>;


  // Classes
  getClass(id: string): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  deleteClass(id: string): Promise<void>;

  // Subjects
  getAllSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  deleteSubject(id: string): Promise<void>;

  // Class-Subject relationships
  assignSubjectToClass(data: InsertClassSubject): Promise<ClassSubject>;
  getSubjectsByClass(classId: string): Promise<Subject[]>;

  // Teacher-Class
  assignTeacherToClass(data: InsertTeacherClass): Promise<TeacherClass>;
  getClassesByTeacher(teacherId: string): Promise<(Class & { subjectName?: string | null })[]>;
  getAllTeacherAssignments(): Promise<{ id: string; teacherId: string; teacherName: string; className: string; section: string | null; subjectName: string | null }[]>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<User>;
  deleteTeacherAssignment(id: string): Promise<void>;
  getTeachersByClass(classId: string): Promise<User[]>;
  getStudentsByTeacher(teacherId: string): Promise<any[]>;

  // Student-Class enrollments
  enrollStudent(data: InsertStudentClass): Promise<StudentClass>;
  getStudentsByClass(classId: string): Promise<User[]>;
  checkRollNumberAvailability(classId: string, rollNumber: number): Promise<boolean>;
  getClassesByStudent(studentId: string): Promise<Class[]>;
  getStudentClassesWithDetails(studentId: string): Promise<{ id: string; name: string; section: string | null; rollNumber: number | null }[]>;

  // Exams
  getExam(id: string): Promise<Exam | undefined>;
  getExamsByClass(classId: string): Promise<Exam[]>;
  getPublishedExamsByClass(classId: string): Promise<Exam[]>;
  getPublishedExamsByClassName(className: string): Promise<Exam[]>;
  getExamsByTeacher(teacherId: string): Promise<(Exam & { classNames: string[] })[]>;
  createExam(exam: InsertExam, classIds?: string[]): Promise<Exam>;
  updateExam(id: string, exam: Partial<InsertExam>, classIds?: string[]): Promise<Exam>;
  getClassesByExam(examId: string): Promise<string[]>;
  publishExam(id: string): Promise<Exam>;

  // Questions
  getQuestionsByExam(examId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  deleteQuestionsByExam(examId: string): Promise<void>;

  // Question Options
  getOptionsByQuestion(questionId: string): Promise<QuestionOption[]>;
  createQuestionOption(option: InsertQuestionOption): Promise<QuestionOption>;

  // Numeric Answers
  getNumericAnswerByQuestion(questionId: string): Promise<NumericAnswer | undefined>;
  createNumericAnswer(answer: InsertNumericAnswer): Promise<NumericAnswer>;

  // Exam Attempts
  getExamAttempt(id: string): Promise<ExamAttempt | undefined>;
  getAttemptByExamAndStudent(examId: string, studentId: string): Promise<ExamAttempt | undefined>;
  getAttemptsByExam(examId: string): Promise<ExamAttempt[]>;
  createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt>;
  updateExamAttempt(id: string, attempt: Partial<InsertExamAttempt>): Promise<ExamAttempt>;
  getAttemptsByStudent(studentId: string): Promise<ExamAttempt[]>;

  // Student Answers
  createOrUpdateStudentAnswer(answer: InsertStudentAnswer): Promise<StudentAnswer>;
  getAnswersByAttempt(attemptId: string): Promise<StudentAnswer[]>;
  updateStudentEnrollment(studentId: string, rollNumber: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ============ USERS ============
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.studentId, studentId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    await db.insert(users).values({ ...user, id });
    const [newUser] = await db.select().from(users).where(eq(users.id, id));
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
    const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));
    return updatedUser;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id));
    const [updatedUser] = await db.select().from(users).where(eq(users.id, id));
    return updatedUser;
  }

  async createPasswordResetToken(email: string): Promise<string> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 3600000; // 1 hour
    const data = JSON.stringify({ userId: user.id, expires });

    await db.insert(systemSettings).values({
      key: `reset_token:${token}`,
      value: data,
      description: `Password reset token for ${email}`
    });

    return token;
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, `reset_token:${token}`));

    if (!setting) {
      throw new Error("Invalid or expired token");
    }

    const data = JSON.parse(setting.value);
    if (Date.now() > data.expires) {
      await db.delete(systemSettings).where(eq(systemSettings.key, `reset_token:${token}`));
      throw new Error("Token expired");
    }

    const bcrypt = await import("bcrypt");
    const hashFn = (bcrypt.default && bcrypt.default.hash) || bcrypt.hash;
    const hashedPassword = await hashFn(newPassword, 10);

    await this.updateUserPassword(data.userId, hashedPassword);

    await db.delete(systemSettings).where(eq(systemSettings.key, `reset_token:${token}`));
  }

  async getAllStudentsWithDetails() {
    const rows = await db
      .select({
        user: users,
        className: classes.name,
        section: classes.section,
        rollNumber: studentClasses.rollNumber,
      })
      .from(users)
      .leftJoin(studentClasses, eq(users.id, studentClasses.studentId))
      .leftJoin(classes, eq(studentClasses.classId, classes.id))
      .where(eq(users.role, "student"));

    return rows.map(row => ({
      ...row.user,
      className: row.className,
      section: row.section,
      rollNumber: row.rollNumber,
    }));
  }

  async deleteUser(id: string): Promise<void> {
    // 1. Handle Student Data
    // Find all attempts by this student
    const attempts = await db.select().from(examAttempts).where(eq(examAttempts.studentId, id));
    if (attempts.length > 0) {
      const attemptIds = attempts.map(a => a.id);
      // Delete logs first
      await db.delete(activityLogs).where(inArray(activityLogs.attemptId, attemptIds));
      await db.delete(cheatingLogs).where(inArray(cheatingLogs.attemptId, attemptIds));
      // Delete answers for these attempts
      await db.delete(studentAnswers).where(inArray(studentAnswers.attemptId, attemptIds));
      // Delete the attempts
      await db.delete(examAttempts).where(eq(examAttempts.studentId, id));
    }

    // Delete enrollments
    await db.delete(studentClasses).where(eq(studentClasses.studentId, id));

    // 2. Handle Teacher Data
    await db.delete(teacherClasses).where(eq(teacherClasses.teacherId, id));

    // Delete exams created by the teacher (and all related data)
    const teacherExams = await db.select().from(exams).where(eq(exams.teacherId, id));
    if (teacherExams.length > 0) {
      const examIds = teacherExams.map(e => e.id);

      // Delete attempts & logs
      const attempts = await db.select().from(examAttempts).where(inArray(examAttempts.examId, examIds));
      if (attempts.length > 0) {
        const attemptIds = attempts.map(a => a.id);
        await db.delete(activityLogs).where(inArray(activityLogs.attemptId, attemptIds));
        await db.delete(cheatingLogs).where(inArray(cheatingLogs.attemptId, attemptIds));
        await db.delete(studentAnswers).where(inArray(studentAnswers.attemptId, attemptIds));
        await db.delete(examAttempts).where(inArray(examAttempts.examId, examIds));
      }

      // Delete questions
      const examQuestions = await db.select().from(questions).where(inArray(questions.examId, examIds));
      if (examQuestions.length > 0) {
        const questionIds = examQuestions.map(q => q.id);
        await db.delete(questionOptions).where(inArray(questionOptions.questionId, questionIds));
        await db.delete(numericAnswers).where(inArray(numericAnswers.questionId, questionIds));
        await db.delete(questions).where(inArray(questions.examId, examIds));
      }

      // Delete exam classes
      await db.delete(examClasses).where(inArray(examClasses.examId, examIds));

      await db.delete(exams).where(eq(exams.teacherId, id));
    }

    // Finally delete user
    await db.delete(users).where(eq(users.id, id));
  }

  // ============ CLASSES ============
  async getClass(id: string): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.id, id));
    return cls;
  }

  async getAllClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const id = crypto.randomUUID();
    await db.insert(classes).values({ ...classData, id });
    const [newClass] = await db.select().from(classes).where(eq(classes.id, id));
    return newClass;
  }

  async deleteClass(id: string): Promise<void> {
    // 1. Delete Enrollments & Assignments
    await db.delete(studentClasses).where(eq(studentClasses.classId, id));
    await db.delete(teacherClasses).where(eq(teacherClasses.classId, id));
    await db.delete(classSubjects).where(eq(classSubjects.classId, id));

    // 2. Delete Exams (and related data)
    // This is complex. For now, we'll try to delete exams.
    // If exams have attempts/questions, this might fail without cascading.
    // We'll fetch exams first.
    const classExams = await db.select().from(exams).where(eq(exams.classId, id));
    if (classExams.length > 0) {
      const examIds = classExams.map(e => e.id);

      // Delete attempts for these exams
      const attempts = await db.select().from(examAttempts).where(inArray(examAttempts.examId, examIds));
      if (attempts.length > 0) {
        const attemptIds = attempts.map(a => a.id);
        // Delete logs first
        await db.delete(activityLogs).where(inArray(activityLogs.attemptId, attemptIds));
        await db.delete(cheatingLogs).where(inArray(cheatingLogs.attemptId, attemptIds));

        await db.delete(studentAnswers).where(inArray(studentAnswers.attemptId, attemptIds));
        await db.delete(examAttempts).where(inArray(examAttempts.examId, examIds));
      }

      // Delete questions (and options/answers)
      const examQuestions = await db.select().from(questions).where(inArray(questions.examId, examIds));
      if (examQuestions.length > 0) {
        const questionIds = examQuestions.map(q => q.id);
        await db.delete(questionOptions).where(inArray(questionOptions.questionId, questionIds));
        await db.delete(numericAnswers).where(inArray(numericAnswers.questionId, questionIds));
        await db.delete(questions).where(inArray(questions.examId, examIds));
      }

      await db.delete(exams).where(eq(exams.classId, id));
    }

    // Finally delete class
    await db.delete(classes).where(eq(classes.id, id));
  }

  // ============ SUBJECTS ============
  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const id = crypto.randomUUID();
    await db.insert(subjects).values({ ...subject, id });
    const [newSubject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return newSubject;
  }

  async deleteSubject(id: string): Promise<void> {
    // Unlink from exams, questions, and teacher assignments (set to null)
    await db.update(exams).set({ subjectId: null }).where(eq(exams.subjectId, id));
    await db.update(questions).set({ subjectId: null }).where(eq(questions.subjectId, id));
    await db.update(teacherClasses).set({ subjectId: null }).where(eq(teacherClasses.subjectId, id));

    // Delete class relationships
    await db.delete(classSubjects).where(eq(classSubjects.subjectId, id));

    // Delete subject
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  // ============ CLASS-SUBJECT RELATIONSHIPS ============
  async assignSubjectToClass(data: InsertClassSubject): Promise<ClassSubject> {
    const id = crypto.randomUUID();
    await db.insert(classSubjects).values({ ...data, id });
    const [assignment] = await db.select().from(classSubjects).where(eq(classSubjects.id, id));
    return assignment;
  }

  async getSubjectsByClass(classId: string): Promise<Subject[]> {
    const result = await db
      .select({ subject: subjects })
      .from(classSubjects)
      .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
      .where(eq(classSubjects.classId, classId));

    return result.map(r => r.subject);
  }

  // ============ TEACHER-CLASS ASSIGNMENTS ============
  async assignTeacherToClass(data: InsertTeacherClass): Promise<TeacherClass> {
    // Check for existing assignment
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

  async getClassesByTeacher(teacherId: string): Promise<(Class & { subjectName?: string | null })[]> {
    const result = await db
      .select({
        class: classes,
        subjectName: subjects.name
      })
      .from(teacherClasses)
      .innerJoin(classes, eq(teacherClasses.classId, classes.id))
      .leftJoin(subjects, eq(teacherClasses.subjectId, subjects.id))
      .where(eq(teacherClasses.teacherId, teacherId));

    return result.map(r => ({
      ...r.class,
      subjectName: r.subjectName
    }));
  }

  async getAllTeacherAssignments() {
    return await db
      .select({
        id: teacherClasses.id,
        teacherId: teacherClasses.teacherId,
        teacherName: users.fullName,
        className: classes.name,
        section: classes.section,
        subjectName: subjects.name
      })
      .from(teacherClasses)
      .innerJoin(users, eq(teacherClasses.teacherId, users.id))
      .innerJoin(classes, eq(teacherClasses.classId, classes.id))
      .leftJoin(subjects, eq(teacherClasses.subjectId, subjects.id));
  }

  async deleteTeacherAssignment(id: string): Promise<void> {
    await db.delete(teacherClasses).where(eq(teacherClasses.id, id));
  }

  async getTeachersByClass(classId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(teacherClasses)
      .innerJoin(users, eq(teacherClasses.teacherId, users.id))
      .where(eq(teacherClasses.classId, classId));

    return result.map(r => r.user);
  }

  async getStudentsByTeacher(teacherId: string): Promise<any[]> {
    // 1. Get classes taught by teacher
    const teacherClassesList = await db
      .select({ classId: teacherClasses.classId })
      .from(teacherClasses)
      .where(eq(teacherClasses.teacherId, teacherId));

    const classIds = teacherClassesList.map(tc => tc.classId);

    if (classIds.length === 0) return [];

    // 2. Get students in those classes
    const students = await db
      .select({
        student: users,
        className: classes.name,
        section: classes.section,
        rollNumber: studentClasses.rollNumber
      })
      .from(studentClasses)
      .innerJoin(users, eq(studentClasses.studentId, users.id))
      .innerJoin(classes, eq(studentClasses.classId, classes.id))
      .where(inArray(studentClasses.classId, classIds));

    // 3. Get exam attempts
    const studentIds = students.map(s => s.student.id);
    if (studentIds.length === 0) return [];

    const attempts = await db
      .select()
      .from(examAttempts)
      .where(inArray(examAttempts.studentId, studentIds));

    // Combine data
    return students.map(s => {
      const studentAttempts = attempts.filter(a => a.studentId === s.student.id);
      const completedAttempts = studentAttempts.filter(a => a.isSubmitted);
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
  async enrollStudent(data: InsertStudentClass): Promise<StudentClass> {
    // Check if student is already enrolled in this class
    const existingStudent = await db
      .select()
      .from(studentClasses)
      .where(
        and(
          eq(studentClasses.classId, data.classId),
          eq(studentClasses.studentId, data.studentId)
        )
      );

    if (existingStudent.length > 0) {
      throw new Error("Student is already enrolled in this class");
    }

    // Check if roll number already exists in this class
    if (data.rollNumber) {
      const existing = await db
        .select()
        .from(studentClasses)
        .where(
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

  async getStudentsByClass(classId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(studentClasses)
      .innerJoin(users, eq(studentClasses.studentId, users.id))
      .where(eq(studentClasses.classId, classId));

    return result.map(r => r.user);
  }

  async checkRollNumberAvailability(classId: string, rollNumber: number): Promise<boolean> {
    const existing = await db
      .select()
      .from(studentClasses)
      .where(
        and(
          eq(studentClasses.classId, classId),
          eq(studentClasses.rollNumber, rollNumber)
        )
      );
    return existing.length === 0;
  }

  async getClassesByStudent(studentId: string): Promise<Class[]> {
    const result = await db
      .select({ class: classes })
      .from(studentClasses)
      .innerJoin(classes, eq(studentClasses.classId, classes.id))
      .where(eq(studentClasses.studentId, studentId));

    return result.map(r => r.class);
  }

  async getStudentClassesWithDetails(studentId: string) {
    return await db
      .select({
        id: classes.id,
        name: classes.name,
        section: classes.section,
        rollNumber: studentClasses.rollNumber
      })
      .from(studentClasses)
      .innerJoin(classes, eq(studentClasses.classId, classes.id))
      .where(eq(studentClasses.studentId, studentId));
  }

  // ============ EXAMS ============
  async getExam(id: string): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async getExamsByClass(classId: string): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.classId, classId));
  }

  async getPublishedExamsByClass(classId: string): Promise<Exam[]> {
    // 1. Get exams linked via exam_classes
    const linkedExams = await db
      .select({ exam: exams })
      .from(examClasses)
      .innerJoin(exams, eq(examClasses.examId, exams.id))
      .where(and(eq(examClasses.classId, classId), eq(exams.isPublished, true)));

    // 2. Get exams linked via legacy classId
    const legacyExams = await db
      .select()
      .from(exams)
      .where(and(eq(exams.classId, classId), eq(exams.isPublished, true)));

    // 3. Merge and deduplicate
    const allExams = [...linkedExams.map(r => r.exam), ...legacyExams];
    const uniqueExams = Array.from(new Map(allExams.map(item => [item.id, item])).values());

    return uniqueExams;
  }

  async getPublishedExamsByClassName(className: string): Promise<Exam[]> {
    // This is less critical but good to fix for consistency
    const rows = await db
      .select({ exam: exams })
      .from(examClasses)
      .innerJoin(exams, eq(examClasses.examId, exams.id))
      .innerJoin(classes, eq(examClasses.classId, classes.id))
      .where(and(eq(classes.name, className), eq(exams.isPublished, true)));

    return rows.map(r => r.exam);
  }

  async getExamsByTeacher(teacherId: string): Promise<(Exam & { classNames: string[] })[]> {
    const teacherExams = await db.select().from(exams).where(eq(exams.teacherId, teacherId)).orderBy(desc(exams.createdAt));

    const examsWithClasses = await Promise.all(teacherExams.map(async (exam) => {
      // Get linked classes
      const classesForExam = await db
        .select({ name: classes.name, section: classes.section })
        .from(examClasses)
        .innerJoin(classes, eq(examClasses.classId, classes.id))
        .where(eq(examClasses.examId, exam.id));

      let classNames = classesForExam.map(c => `${c.name}${c.section ? ` - ${c.section}` : ''}`);

      // If no linked classes, try legacy classId
      if (classNames.length === 0 && exam.classId) {
        const legacyClass = await db.select().from(classes).where(eq(classes.id, exam.classId));
        if (legacyClass.length > 0) {
          const c = legacyClass[0];
          classNames = [`${c.name}${c.section ? ` - ${c.section}` : ''}`];
        }
      }

      return { ...exam, classNames };
    }));

    return examsWithClasses;
  }

  async createExam(exam: InsertExam, classIds?: string[]): Promise<Exam> {
    const id = crypto.randomUUID();
    await db.insert(exams).values({ ...exam, id });
    const [newExam] = await db.select().from(exams).where(eq(exams.id, id));

    if (classIds && classIds.length > 0) {
      await db.insert(examClasses).values(
        classIds.map(classId => ({
          id: crypto.randomUUID(),
          examId: id,
          classId,
        }))
      );
    }

    return newExam;
  }

  async updateExam(id: string, exam: Partial<InsertExam>, classIds?: string[]): Promise<Exam> {
    await db.update(exams).set(exam).where(eq(exams.id, id));
    const [updated] = await db.select().from(exams).where(eq(exams.id, id));

    if (classIds) {
      await db.delete(examClasses).where(eq(examClasses.examId, id));
      if (classIds.length > 0) {
        await db.insert(examClasses).values(
          classIds.map(classId => ({
            id: crypto.randomUUID(),
            examId: id,
            classId,
          }))
        );
      }
    }

    return updated;
  }

  async getClassesByExam(examId: string): Promise<string[]> {
    const rows = await db.select({ classId: examClasses.classId }).from(examClasses).where(eq(examClasses.examId, examId));
    return rows.map(r => r.classId);
  }

  async publishExam(id: string): Promise<Exam> {
    await db
      .update(exams)
      .set({ isPublished: true, status: "published" })
      .where(eq(exams.id, id));
    const [published] = await db.select().from(exams).where(eq(exams.id, id));
    return published;
  }

  // ============ QUESTIONS ============
  async getQuestionsByExam(examId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.examId, examId));
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = crypto.randomUUID();
    await db.insert(questions).values({ ...question, id });
    const [newQuestion] = await db.select().from(questions).where(eq(questions.id, id));
    return newQuestion;
  }

  // ============ QUESTION OPTIONS ============
  async getOptionsByQuestion(questionId: string): Promise<QuestionOption[]> {
    return await db.select().from(questionOptions).where(eq(questionOptions.questionId, questionId));
  }

  async createQuestionOption(option: InsertQuestionOption): Promise<QuestionOption> {
    const id = crypto.randomUUID();
    await db.insert(questionOptions).values({ ...option, id });
    const [newOption] = await db.select().from(questionOptions).where(eq(questionOptions.id, id));
    return newOption;
  }

  async deleteQuestionsByExam(examId: string): Promise<void> {
    const examQuestions = await db.select().from(questions).where(eq(questions.examId, examId));
    if (examQuestions.length > 0) {
      const questionIds = examQuestions.map(q => q.id);
      await db.delete(questionOptions).where(inArray(questionOptions.questionId, questionIds));
      await db.delete(numericAnswers).where(inArray(numericAnswers.questionId, questionIds));
      await db.delete(questions).where(eq(questions.examId, examId));
    }
  }

  // ============ NUMERIC ANSWERS ============
  async getNumericAnswerByQuestion(questionId: string): Promise<NumericAnswer | undefined> {
    const [answer] = await db.select().from(numericAnswers).where(eq(numericAnswers.questionId, questionId));
    return answer;
  }

  async createNumericAnswer(answer: InsertNumericAnswer): Promise<NumericAnswer> {
    const id = crypto.randomUUID();
    await db.insert(numericAnswers).values({ ...answer, id });
    const [newAnswer] = await db.select().from(numericAnswers).where(eq(numericAnswers.id, id));
    return newAnswer;
  }

  // ============ EXAM ATTEMPTS ============
  async getExamAttempt(id: string): Promise<ExamAttempt | undefined> {
    const [attempt] = await db.select().from(examAttempts).where(eq(examAttempts.id, id));
    return attempt;
  }

  async getAttemptByExamAndStudent(examId: string, studentId: string): Promise<ExamAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(examAttempts)
      .where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, studentId)));
    return attempt;
  }

  async createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt> {
    const id = crypto.randomUUID();
    await db.insert(examAttempts).values({ ...attempt, id });
    const [newAttempt] = await db.select().from(examAttempts).where(eq(examAttempts.id, id));
    return newAttempt;
  }

  async updateExamAttempt(id: string, attempt: Partial<InsertExamAttempt>): Promise<ExamAttempt> {
    await db.update(examAttempts).set(attempt).where(eq(examAttempts.id, id));
    const [updated] = await db.select().from(examAttempts).where(eq(examAttempts.id, id));
    return updated;
  }

  async getAttemptsByStudent(studentId: string): Promise<ExamAttempt[]> {
    return await db.select().from(examAttempts).where(eq(examAttempts.studentId, studentId)).orderBy(desc(examAttempts.startedAt));
  }

  async getAttemptsByExam(examId: string): Promise<ExamAttempt[]> {
    return await db.select().from(examAttempts).where(eq(examAttempts.examId, examId));
  }

  // ============ STUDENT ANSWERS ============
  async createOrUpdateStudentAnswer(answer: InsertStudentAnswer): Promise<StudentAnswer> {
    const id = crypto.randomUUID();
    // Handle JSON serialization for MySQL
    const values = {
      ...answer,
      id,
      selectedOptions: Array.isArray(answer.selectedOptions)
        ? JSON.stringify(answer.selectedOptions)
        : (answer.selectedOptions as string || null)
    };
    await db.insert(studentAnswers).values(values);
    const [newAnswer] = await db.select().from(studentAnswers).where(eq(studentAnswers.id, id));
    return newAnswer;
  }

  async getAnswersByAttempt(attemptId: string): Promise<StudentAnswer[]> {
    return await db.select().from(studentAnswers).where(eq(studentAnswers.attemptId, attemptId));
  }

  async updateStudentEnrollment(studentId: string, rollNumber: number): Promise<void> {
    await db
      .update(studentClasses)
      .set({ rollNumber })
      .where(eq(studentClasses.studentId, studentId));
  }
}

export const storage = new DatabaseStorage();
