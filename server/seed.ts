import { db } from "./db";
import { users, classes, subjects, classSubjects, teacherClasses, studentClasses } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...\n");

  try {
    // 1. Create Admin
    console.log("1️⃣  Creating Admin...");
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      username: "admin",
      email: "admin@school.com",
      password: hashedAdminPassword,
      fullName: "System Administrator",
      role: "admin",
    });
    const [admin] = await db.select().from(users).where(eq(users.username, "admin"));
    console.log(`✅ Admin created: ${admin.fullName}`);

    // 2. Create Classes
    console.log("\n2️⃣  Creating Classes...");
    const classData = [
      { name: "Class 1", section: "A" },
      { name: "Class 2", section: "A" },
      { name: "Class 3", section: "A" },
      { name: "Class 9", section: "A" },
      { name: "Class 9", section: "B" },
      { name: "Class 10", section: "A" },
      { name: "Class 10", section: "B" },
      { name: "Class 11", section: "Science" },
      { name: "Class 12", section: "Commerce" },
    ];

    const createdClasses = [];
    for (const cls of classData) {
      await db.insert(classes).values(cls);
      const [created] = await db.select().from(classes).where(and(eq(classes.name, cls.name), eq(classes.section, cls.section)));
      createdClasses.push(created);
      console.log(`✅ Created: ${cls.name} - ${cls.section}`);
    }

    // 3. Create Subjects
    console.log("\n3️⃣  Creating Subjects...");
    const subjectData = [
      { name: "Mathematics", description: "Math and calculations" },
      { name: "Science", description: "Physics, Chemistry, Biology" },
      { name: "English", description: "Language and literature" },
      { name: "History", description: "World and national history" },
      { name: "Computer Science", description: "Programming and IT" },
      { name: "Geography", description: "Earth and environment" },
      { name: "Hindi", description: "Hindi language" },
      { name: "Physical Education", description: "Sports and fitness" },
    ];

    const createdSubjects = [];
    for (const subj of subjectData) {
      await db.insert(subjects).values(subj);
      const [created] = await db.select().from(subjects).where(eq(subjects.name, subj.name));
      createdSubjects.push(created);
      console.log(`✅ Created: ${subj.name}`);
    }

    // 4. Assign Subjects to Classes
    console.log("\n4️⃣  Assigning Subjects to Classes...");
    // Assign all subjects to all classes
    for (const cls of createdClasses) {
      for (const subj of createdSubjects) {
        await db.insert(classSubjects).values({
          classId: cls.id,
          subjectId: subj.id,
        });
      }
      console.log(`✅ Assigned all subjects to ${cls.name} - ${cls.section}`);
    }

    // 5. Create Teachers
    console.log("\n5️⃣  Creating Teachers...");
    const teacherData = [
      { username: "teacher1", email: "teacher1@school.com", fullName: "John Smith", subjects: ["Mathematics", "Science"] },
      { username: "teacher2", email: "teacher2@school.com", fullName: "Sarah Johnson", subjects: ["English", "History"] },
      { username: "teacher3", email: "teacher3@school.com", fullName: "Michael Brown", subjects: ["Computer Science"] },
      { username: "teacher4", email: "teacher4@school.com", fullName: "Emily Davis", subjects: ["Geography", "Hindi"] },
    ];

    const hashedTeacherPassword = await bcrypt.hash("teacher123", 10);
    const createdTeachers = [];

    for (const teacher of teacherData) {
      await db.insert(users).values({
        username: teacher.username,
        email: teacher.email,
        password: hashedTeacherPassword,
        fullName: teacher.fullName,
        role: "teacher",
      });
      const [created] = await db.select().from(users).where(eq(users.username, teacher.username));
      createdTeachers.push({ ...created, subjects: teacher.subjects });
      console.log(`✅ Created teacher: ${teacher.fullName}`);
    }

    // 6. Assign Teachers to Classes
    console.log("\n6️⃣  Assigning Teachers to Classes...");
    // Teacher 1 (Math & Science) -> Class 9A, 9B, 10A
    const teacher1 = createdTeachers[0];
    const mathSubject = createdSubjects.find(s => s.name === "Mathematics");
    const scienceSubject = createdSubjects.find(s => s.name === "Science");
    const class9A = createdClasses.find(c => c.name === "Class 9" && c.section === "A");
    const class9B = createdClasses.find(c => c.name === "Class 9" && c.section === "B");
    const class10A = createdClasses.find(c => c.name === "Class 10" && c.section === "A");

    if (teacher1 && mathSubject && class9A && class9B && class10A) {
      await db.insert(teacherClasses).values([
        { teacherId: teacher1.id, classId: class9A.id, subjectId: mathSubject.id },
        { teacherId: teacher1.id, classId: class9B.id, subjectId: mathSubject.id },
        { teacherId: teacher1.id, classId: class10A.id, subjectId: mathSubject.id },
      ]);
      console.log(`✅ Assigned ${teacher1.fullName} to Classes 9A, 9B, 10A (Mathematics)`);
    }

    if (teacher1 && scienceSubject && class9A) {
      await db.insert(teacherClasses).values({
        teacherId: teacher1.id,
        classId: class9A.id,
        subjectId: scienceSubject.id,
      });
      console.log(`✅ Assigned ${teacher1.fullName} to Class 9A (Science)`);
    }

    // Teacher 2 (English & History) -> Class 10A, 10B
    const teacher2 = createdTeachers[1];
    const englishSubject = createdSubjects.find(s => s.name === "English");
    const historySubject = createdSubjects.find(s => s.name === "History");
    const class10B = createdClasses.find(c => c.name === "Class 10" && c.section === "B");

    if (teacher2 && englishSubject && class10A && class10B) {
      await db.insert(teacherClasses).values([
        { teacherId: teacher2.id, classId: class10A.id, subjectId: englishSubject.id },
        { teacherId: teacher2.id, classId: class10B.id, subjectId: englishSubject.id },
      ]);
      console.log(`✅ Assigned ${teacher2.fullName} to Classes 10A, 10B (English)`);
    }

    // 7. Create Students
    console.log("\n7️⃣  Creating Students...");
    const hashedStudentPassword = await bcrypt.hash("student123", 10);
    const createdStudents = [];

    // Create 10 students for Class 9A
    for (let i = 1; i <= 10; i++) {
      await db.insert(users).values({
        username: `student${i}`,
        email: `student${i}@school.com`,
        password: hashedStudentPassword,
        fullName: `Student ${i}`,
        role: "student",
        studentId: `STU00${i}`,
      });
      const [student] = await db.select().from(users).where(eq(users.username, `student${i}`));
      createdStudents.push(student);
    }

    // Create 10 students for Class 10A
    for (let i = 11; i <= 20; i++) {
      await db.insert(users).values({
        username: `student${i}`,
        email: `student${i}@school.com`,
        password: hashedStudentPassword,
        fullName: `Student ${i}`,
        role: "student",
        studentId: `STU0${i}`,
      });
      const [student] = await db.select().from(users).where(eq(users.username, `student${i}`));
      createdStudents.push(student);
    }

    console.log(`✅ Created 20 students`);

    // 8. Enroll Students in Classes
    console.log("\n8️⃣  Enrolling Students in Classes...");

    // Enroll first 10 students in Class 9A
    if (class9A) {
      for (let i = 0; i < 10; i++) {
        await db.insert(studentClasses).values({
          studentId: createdStudents[i].id,
          classId: class9A.id,
        });
      }
      console.log(`✅ Enrolled 10 students in Class 9A`);
    }

    // Enroll next 10 students in Class 10A
    if (class10A) {
      for (let i = 10; i < 20; i++) {
        await db.insert(studentClasses).values({
          studentId: createdStudents[i].id,
          classId: class10A.id,
        });
      }
      console.log(`✅ Enrolled 10 students in Class 10A`);
    }

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - 1 Admin`);
    console.log(`   - ${createdClasses.length} Classes`);
    console.log(`   - ${createdSubjects.length} Subjects`);
    console.log(`   - ${createdTeachers.length} Teachers`);
    console.log(`   - ${createdStudents.length} Students`);
    console.log("\n🔑 Login Credentials:");
    console.log("   Admin: admin / admin123");
    console.log("   Teacher: teacher1 / teacher123");
    console.log("   Student: student1 / student123 (or STU001 / student123)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
