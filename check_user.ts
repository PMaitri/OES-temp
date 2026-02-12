
import { db } from "./server/db";
import { users, studentClasses, classes, examAttempts, exams } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkUser() {
    console.log("Checking user 'Araju'...");
    const user = await db.query.users.findFirst({
        where: eq(users.username, "Araju")
    });

    if (!user) {
        console.log("User 'Araju' not found!");
        // Try to find by partial match or just list recent users
        const recentUsers = await db.select().from(users).limit(5).orderBy(users.createdAt);
        console.log("Recent users:", recentUsers.map(u => u.username));
        process.exit(0);
    }

    console.log("User found:", user);

    const enrollment = await db.select({
        className: classes.name,
        section: classes.section,
        rollNumber: studentClasses.rollNumber
    })
        .from(studentClasses)
        .innerJoin(classes, eq(studentClasses.classId, classes.id))
        .where(eq(studentClasses.studentId, user.id));

    console.log("Enrollment:", enrollment);

    const attempts = await db.select().from(examAttempts).where(eq(examAttempts.studentId, user.id));
    console.log("Attempts:", attempts);

    process.exit(0);
}

checkUser();
