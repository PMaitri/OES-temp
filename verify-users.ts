import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function verifyUsers() {
    try {
        console.log("🔍 Verifying users in database...\n");

        // Get all users
        const allUsers = await db.select().from(users);

        console.log(`Total users: ${allUsers.length}\n`);

        // Group by role
        const admins = allUsers.filter(u => u.role === 'admin');
        const teachers = allUsers.filter(u => u.role === 'teacher');
        const students = allUsers.filter(u => u.role === 'student');

        console.log("📊 User Summary:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`Admins: ${admins.length}`);
        admins.forEach(u => console.log(`  - ${u.username} (${u.email})`));

        console.log(`\nTeachers: ${teachers.length}`);
        teachers.forEach(u => console.log(`  - ${u.username} (${u.email})`));

        console.log(`\nStudents: ${students.length}`);
        students.forEach(u => console.log(`  - ${u.username} (${u.email})`));
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        console.log("✅ Database verification complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error verifying users:", error);
        process.exit(1);
    }
}

verifyUsers();
