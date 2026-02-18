
import "dotenv/config";
import { db } from "./server/db";
import { exams, classes, examClasses, users, studentClasses } from "@shared/schema";
import { eq, and } from "drizzle-orm";

async function debugAccess() {
    const examId = "b99e96ef-115b-4a4a-b8d9-a14c60bfddf0";
    const studentUsername = "Dhara"; // Assuming this is the student

    console.log(`🔍 Debugging Access for Exam: ${examId}`);
    console.log(`👤 Student: ${studentUsername}`);

    // 1. Get Student Info
    const student = await db.query.users.findFirst({
        where: eq(users.username, studentUsername)
    });

    if (!student) {
        console.log("❌ Student not found!");
        process.exit(1);
    }
    console.log(`✅ Student Found: ID=${student.id}`);

    // 2. Get Student Classes
    const enrollments = await db
        .select({
            classId: classes.id,
            className: classes.name,
            section: classes.section
        })
        .from(studentClasses)
        .innerJoin(classes, eq(studentClasses.classId, classes.id))
        .where(eq(studentClasses.studentId, student.id));

    console.log("\n📚 Student Enrollments:");
    enrollments.forEach(e => console.log(`  - [${e.classId}] ${e.className} ${e.section}`));
    const studentClassIds = enrollments.map(e => e.classId);

    // 3. Get Exam Info
    const exam = await db.query.exams.findFirst({
        where: eq(exams.id, examId)
    });

    if (!exam) {
        console.log("❌ Exam not found in DB!");
        process.exit(1);
    }
    console.log(`\n📝 Exam Details:`);
    console.log(`  - Title: ${exam.title}`);
    console.log(`  - Legacy ClassId: ${exam.classId}`);
    console.log(`  - Published: ${exam.isPublished}`);

    // 4. Get Exam Classes (New Table)
    const linkedClasses = await db
        .select({
            classId: classes.id,
            className: classes.name,
            section: classes.section
        })
        .from(examClasses)
        .innerJoin(classes, eq(examClasses.classId, classes.id))
        .where(eq(examClasses.examId, examId));

    console.log("\n🔗 Exam Linked Classes:");
    linkedClasses.forEach(e => console.log(`  - [${e.classId}] ${e.className} ${e.section}`));
    const examClassIds = linkedClasses.map(e => e.classId);

    // 5. Check Access Logic
    console.log("\n🔐 Access Check:");

    // Check Legacy
    const legacyMatch = studentClassIds.includes(exam.classId || "");
    console.log(`  - Legacy Match (Student has Exam's Legacy ClassId?): ${legacyMatch}`);

    // Check New Links
    const linkMatch = studentClassIds.some(id => examClassIds.includes(id));
    console.log(`  - Linked Match (Student has one of Exam's Linked ClassIds?): ${linkMatch}`);

    if (legacyMatch || linkMatch) {
        console.log("\n✅ ACCESS SHOULD BE GRANTED");
    } else {
        console.log("\n❌ ACCESS DENIED - No matching class found");
    }

    process.exit(0);
}

debugAccess();
