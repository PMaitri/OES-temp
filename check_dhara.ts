
import "dotenv/config";
import { db } from "./server/db";
import { users, studentClasses, classes } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkStudentDhara() {
    const studentId = "e0e1c117-3d3d-4442-9e86-3cbd392843f4";
    console.log(`Checking student ID: ${studentId}`);

    const enrollment = await db.select({
        classId: classes.id,
        className: classes.name,
        section: classes.section
    })
        .from(studentClasses)
        .innerJoin(classes, eq(studentClasses.classId, classes.id))
        .where(eq(studentClasses.studentId, studentId));

    console.log("Enrollments:", enrollment);

    const examClassId = "ef5e7097-1952-42d1-8869-0734c35366c3";
    const isEnrolled = enrollment.some(e => e.classId === examClassId);
    console.log(`Is enrolled in Exam Class (${examClassId})? ${isEnrolled}`);

    process.exit(0);
}

checkStudentDhara();
