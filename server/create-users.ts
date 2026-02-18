import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function createUsers() {
    try {
        console.log("🔐 Starting user creation...\n");

        // Hash passwords
        const hashedAdminPassword = await bcrypt.hash("admin123", 10);
        const hashedTeacherPassword = await bcrypt.hash("teacher123", 10);
        const hashedStudentPassword = await bcrypt.hash("student123", 10);

        // Create Admin User
        console.log("Creating Admin user...");
        await db.insert(users).values({
            username: "admin",
            email: "admin@school.com",
            password: hashedAdminPassword,
            fullName: "System Administrator",
            role: "admin",
        });
        const [admin] = await db.select().from(users).where(eq(users.username, "admin"));
        console.log("✅ Admin created:", admin.username, "-", admin.email);

        // Create Teacher Users
        console.log("\nCreating Teacher users...");
        await db.insert(users).values({
            username: "teacher1",
            email: "teacher1@school.com",
            password: hashedTeacherPassword,
            fullName: "John Smith",
            role: "teacher",
        });
        const [teacher1] = await db.select().from(users).where(eq(users.username, "teacher1"));
        console.log("✅ Teacher created:", teacher1.username, "-", teacher1.email);

        await db.insert(users).values({
            username: "teacher2",
            email: "teacher2@school.com",
            password: hashedTeacherPassword,
            fullName: "Sarah Johnson",
            role: "teacher",
        });
        const [teacher2] = await db.select().from(users).where(eq(users.username, "teacher2"));
        console.log("✅ Teacher created:", teacher2.username, "-", teacher2.email);

        // Create Student Users
        console.log("\nCreating Student users...");
        const studentNames = [
            { username: "student1", email: "student1@school.com", fullName: "Alice Brown" },
            { username: "student2", email: "student2@school.com", fullName: "Bob Wilson" },
            { username: "student3", email: "student3@school.com", fullName: "Charlie Davis" },
            { username: "student4", email: "student4@school.com", fullName: "Diana Martinez" },
            { username: "student5", email: "student5@school.com", fullName: "Ethan Anderson" },
        ];

        for (const student of studentNames) {
            await db.insert(users).values({
                username: student.username,
                email: student.email,
                password: hashedStudentPassword,
                fullName: student.fullName,
                role: "student",
            });
            const [createdStudent] = await db.select().from(users).where(eq(users.username, student.username));
            console.log("✅ Student created:", createdStudent.username, "-", createdStudent.email);
        }

        console.log("\n🎉 All users created successfully!\n");
        console.log("📝 Login Credentials:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Admin:");
        console.log("  Username: admin");
        console.log("  Password: admin123");
        console.log("\nTeachers:");
        console.log("  Username: teacher1 | Password: teacher123");
        console.log("  Username: teacher2 | Password: teacher123");
        console.log("\nStudents:");
        console.log("  Username: student1-5 | Password: student123");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating users:", error);
        process.exit(1);
    }
}

createUsers();
