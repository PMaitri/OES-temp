
import "dotenv/config";
import { db } from "./server/db";
import { users, studentClasses, classes } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkStudent() {
    console.log("Checking student 'dhara'...");
    const user = await db.query.users.findFirst({
        where: eq(users.username, "dhara")
    });

    if (!user) {
        console.log("Student 'dhara' not found");
        process.exit(0);
    }

    console.log("Student ID:", user.id);

    const enrollment = await db.select({
        classId: classes.id,
        className: classes.name,
        section: classes.section
    })
        .from(studentClasses)
        .innerJoin(classes, eq(studentClasses.classId, classes.id))
        .where(eq(studentClasses.studentId, user.id));

    console.log("Enrollments:", enrollment);

    const examClassId = "ef5e7097-1952-42d1-8869-0734c35366c3";
    const isEnrolled = enrollment.some(e => e.classId === examClassId);
    console.log(`Is enrolled in Exam Class (${examClassId})? ${isEnrolled}`);

    process.exit(0);
}

checkStudent();
