import { db } from "./db";
import { users, classes, subjects } from "@shared/schema";
import { eq } from "drizzle-orm";

async function createSampleData() {
    try {
        console.log("📚 Creating sample classes and subjects...\n");

        // Get teacher1
        const [teacher] = await db.select().from(users).where(eq(users.username, "teacher1"));
        if (!teacher) {
            console.log("❌ Teacher not found!");
            process.exit(1);
        }

        console.log(`✅ Found teacher: ${teacher.fullName}`);

        // Create subjects
        console.log("\n📖 Creating subjects...");
        const subjectData = [
            { name: "Mathematics", description: "Math and calculations" },
            { name: "Science", description: "Physics, Chemistry, Biology" },
            { name: "English", description: "English language and literature" },
            { name: "History", description: "World and national history" },
            { name: "Computer Science", description: "Programming and IT" },
        ];

        const createdSubjects = [];
        for (const subject of subjectData) {
            // Check if subject already exists
            const [existing] = await db.select().from(subjects).where(eq(subjects.name, subject.name));
            if (!existing) {
                const [newSubject] = await db.insert(subjects).values(subject).returning();
                createdSubjects.push(newSubject);
                console.log(`  ✅ Created: ${newSubject.name}`);
            } else {
                createdSubjects.push(existing);
                console.log(`  ℹ️  Already exists: ${existing.name}`);
            }
        }

        // Create classes
        console.log("\n🏫 Creating classes...");
        const classData = [
            { name: "Class 10 - A", description: "Grade 10, Section A" },
            { name: "Class 10 - B", description: "Grade 10, Section B" },
            { name: "Class 9 - A", description: "Grade 9, Section A" },
            { name: "Class 11 - Science", description: "Grade 11, Science Stream" },
            { name: "Class 12 - Commerce", description: "Grade 12, Commerce Stream" },
        ];

        for (const classInfo of classData) {
            // Check if class already exists
            const [existing] = await db.select().from(classes).where(eq(classes.name, classInfo.name));
            if (!existing) {
                const [newClass] = await db.insert(classes).values({
                    ...classInfo,
                    teacherId: teacher.id,
                }).returning();
                console.log(`  ✅ Created: ${newClass.name}`);
            } else {
                console.log(`  ℹ️  Already exists: ${existing.name}`);
            }
        }

        console.log("\n🎉 Sample data created successfully!");
        console.log("\n📊 Summary:");
        console.log(`  Subjects: ${createdSubjects.length}`);
        console.log(`  Classes: ${classData.length}`);
        console.log(`  Teacher: ${teacher.fullName}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

createSampleData();
