import { db } from "./db";
import { users, classes, exams, questions, questionOptions } from "@shared/schema";
import { eq } from "drizzle-orm";

async function testExamCreation() {
    try {
        console.log("🧪 Testing exam creation...\n");

        // Get teacher
        const [teacher] = await db.select().from(users).where(eq(users.username, "teacher1"));
        if (!teacher) {
            console.log("❌ Teacher not found!");
            process.exit(1);
        }
        console.log("✅ Teacher found:", teacher.fullName);

        // Get a class
        const [classData] = await db.select().from(classes).limit(1);
        if (!classData) {
            console.log("❌ No class found!");
            process.exit(1);
        }
        console.log("✅ Class found:", classData.name);

        // Create a test exam
        console.log("\n📝 Creating test exam...");
        const [exam] = await db.insert(exams).values({
            title: "Test Exam - Debug",
            description: "Testing exam creation",
            classId: classData.id,
            teacherId: teacher.id,
            duration: 60,
            totalMarks: 10,
            passingMarks: 4,
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            endsAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
            status: "draft",
            negativeMarking: false,
            shuffleQuestions: false,
            shuffleOptions: false,
            showResults: true,
        }).returning();

        console.log("✅ Exam created:", exam.id);

        // Create a test question with image data
        console.log("\n❓ Creating test question...");
        const [question] = await db.insert(questions).values({
            examId: exam.id,
            questionText: "Test Question 1",
            imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // 1x1 pixel
            questionType: "mcq",
            marks: 1,
            difficulty: "medium",
            subjectId: null,
            orderIndex: 0,
        }).returning();

        console.log("✅ Question created:", question.id);

        // Create options
        console.log("\n📋 Creating options...");
        const options = [
            { text: "A", isCorrect: true },
            { text: "B", isCorrect: false },
            { text: "C", isCorrect: false },
            { text: "D", isCorrect: false },
        ];

        for (let i = 0; i < options.length; i++) {
            await db.insert(questionOptions).values({
                questionId: question.id,
                optionText: options[i].text,
                isCorrect: options[i].isCorrect,
                orderIndex: i,
            });
        }

        console.log("✅ Options created");

        console.log("\n🎉 Test exam creation successful!");
        console.log("\nExam Details:");
        console.log(`  ID: ${exam.id}`);
        console.log(`  Title: ${exam.title}`);
        console.log(`  Class: ${classData.name}`);
        console.log(`  Questions: 1`);
        console.log(`  Total Marks: ${exam.totalMarks}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        console.error("\nError details:", error instanceof Error ? error.message : String(error));
        if (error instanceof Error && error.stack) {
            console.error("\nStack trace:", error.stack);
        }
        process.exit(1);
    }
}

testExamCreation();
