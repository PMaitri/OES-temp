import { db } from "./db";
import { users, classes, studentClasses, subjects, exams, questions, questionOptions } from "@shared/schema";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";

const SALT_ROUNDS = 10;

async function seed() {
  console.log("Starting database seed...");

  try {
    // Create demo users
    const hashedPassword = await bcrypt.hash("password", SALT_ROUNDS);

    console.log("Creating demo users...");

    // Admin
    const [admin] = await db
      .insert(users)
      .values({
        username: "admin",
        email: "admin@school.edu",
        password: hashedPassword,
        fullName: "Admin User",
        role: "admin",
      })
      .returning()
      .catch(() => []);

    // Teacher
    const [teacher] = await db
      .insert(users)
      .values({
        username: "teacher",
        email: "teacher@school.edu",
        password: hashedPassword,
        fullName: "Dr. Sarah Johnson",
        role: "teacher",
      })
      .returning()
      .catch(() => []);

    // Students
    const [student1] = await db
      .insert(users)
      .values({
        username: "student",
        email: "student@school.edu",
        password: hashedPassword,
        fullName: "John Smith",
        role: "student",
      })
      .returning()
      .catch(() => []);

    const [student2] = await db
      .insert(users)
      .values({
        username: "student2",
        email: "student2@school.edu",
        password: hashedPassword,
        fullName: "Emily Davis",
        role: "student",
      })
      .returning()
      .catch(() => []);

    console.log("Created demo users");

    if (teacher && student1 && student2) {
      // Create subjects
      console.log("Creating subjects...");
      const [math] = await db
        .insert(subjects)
        .values({ name: "Mathematics", description: "Math related topics" })
        .returning()
        .catch(() => []);

      const [science] = await db
        .insert(subjects)
        .values({ name: "Science", description: "Science related topics" })
        .returning()
        .catch(() => []);

      const [english] = await db
        .insert(subjects)
        .values({ name: "English", description: "English language and literature" })
        .returning()
        .catch(() => []);

      console.log("Created subjects");

      // Create classes
      console.log("Creating classes...");
      const [class1] = await db
        .insert(classes)
        .values({
          name: "Grade 10 - Mathematics",
          description: "Advanced mathematics for 10th grade",
          teacherId: teacher.id,
        })
        .returning()
        .catch(() => []);

      const [class2] = await db
        .insert(classes)
        .values({
          name: "Grade 10 - Science",
          description: "General science for 10th grade",
          teacherId: teacher.id,
        })
        .returning()
        .catch(() => []);

      console.log("Created classes");

      if (class1 && class2) {
        // Enroll students
        console.log("Enrolling students...");
        await db
          .insert(studentClasses)
          .values([
            { studentId: student1.id, classId: class1.id },
            { studentId: student1.id, classId: class2.id },
            { studentId: student2.id, classId: class1.id },
            { studentId: student2.id, classId: class2.id },
          ])
          .catch(() => {});

        console.log("Enrolled students");

        // Create sample exams
        if (math && science) {
          console.log("Creating sample exams...");

          const now = new Date();
          const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const nextWeekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000);

          // Math Exam
          const [exam1] = await db
            .insert(exams)
            .values({
              title: "Mathematics Mid-Term Exam",
              description: "Covering algebra and geometry topics",
              classId: class1.id,
              teacherId: teacher.id,
              duration: 60,
              totalMarks: 20,
              passingMarks: 12,
              scheduledAt: tomorrow,
              endsAt: nextWeek,
              status: "active",
              instructions: "Answer all questions. Each question carries equal marks.",
              negativeMarking: false,
              shuffleQuestions: true,
              shuffleOptions: true,
              showResults: true,
            })
            .returning()
            .catch(() => []);

          if (exam1) {
            // Create math questions
            const [q1] = await db
              .insert(questions)
              .values({
                examId: exam1.id,
                subjectId: math.id,
                questionText: "What is 2 + 2?",
                questionType: "mcq",
                marks: 2,
                difficulty: "easy",
                orderIndex: 0,
              })
              .returning()
              .catch(() => []);

            if (q1) {
              await db
                .insert(questionOptions)
                .values([
                  { questionId: q1.id, optionText: "3", isCorrect: false, orderIndex: 0 },
                  { questionId: q1.id, optionText: "4", isCorrect: true, orderIndex: 1 },
                  { questionId: q1.id, optionText: "5", isCorrect: false, orderIndex: 2 },
                  { questionId: q1.id, optionText: "6", isCorrect: false, orderIndex: 3 },
                ])
                .catch(() => {});
            }

            const [q2] = await db
              .insert(questions)
              .values({
                examId: exam1.id,
                subjectId: math.id,
                questionText: "Which of the following are even numbers?",
                questionType: "msq",
                marks: 3,
                difficulty: "medium",
                orderIndex: 1,
              })
              .returning()
              .catch(() => []);

            if (q2) {
              await db
                .insert(questionOptions)
                .values([
                  { questionId: q2.id, optionText: "2", isCorrect: true, orderIndex: 0 },
                  { questionId: q2.id, optionText: "3", isCorrect: false, orderIndex: 1 },
                  { questionId: q2.id, optionText: "4", isCorrect: true, orderIndex: 2 },
                  { questionId: q2.id, optionText: "5", isCorrect: false, orderIndex: 3 },
                ])
                .catch(() => {});
            }

            const [q3] = await db
              .insert(questions)
              .values({
                examId: exam1.id,
                subjectId: math.id,
                questionText: "Is the square root of 16 equal to 4?",
                questionType: "true_false",
                marks: 2,
                difficulty: "easy",
                orderIndex: 2,
              })
              .returning()
              .catch(() => []);

            if (q3) {
              await db
                .insert(questionOptions)
                .values([
                  { questionId: q3.id, optionText: "True", isCorrect: true, orderIndex: 0 },
                  { questionId: q3.id, optionText: "False", isCorrect: false, orderIndex: 1 },
                ])
                .catch(() => {});
            }

            console.log("Created math exam with questions");
          }

          // Science Exam (scheduled for next week)
          const [exam2] = await db
            .insert(exams)
            .values({
              title: "Science Chapter Test",
              description: "Test on Physics and Chemistry basics",
              classId: class2.id,
              teacherId: teacher.id,
              duration: 45,
              totalMarks: 15,
              passingMarks: 9,
              scheduledAt: nextWeek,
              endsAt: nextWeekEnd,
              status: "scheduled",
              instructions: "Read each question carefully before answering.",
              negativeMarking: false,
              shuffleQuestions: false,
              shuffleOptions: true,
              showResults: true,
            })
            .returning()
            .catch(() => []);

          console.log("Created sample exams");
        }
      }
    }

    console.log("✅ Database seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("Seed script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });
