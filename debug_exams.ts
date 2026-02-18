import "dotenv/config";
import { db } from "./server/db";
import { exams, users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function debugExams() {
    console.log("🔍 Debugging Exams...");

    try {
        const allExams = await db.select().from(exams);
        console.log(`Total Exams found: ${allExams.length}`);

        if (allExams.length > 0) {
            console.log("Listing first 5 exams:");
            allExams.slice(0, 5).forEach(e => {
                console.log(`- [${e.id}] ${e.title} (Teacher: ${e.teacherId}, Published: ${e.isPublished})`);
            });
        } else {
            console.log("❌ No exams found in the database!");
        }

        const targetId = "764b892e-7043-40c0-83fd-c0836ab919b5";
        const targetExam = await db.select().from(exams).where(eq(exams.id, targetId));

        if (targetExam.length > 0) {
            console.log(`\n✅ Target Exam ${targetId} FOUND:`, targetExam[0]);
        } else {
            console.log(`\n❌ Target Exam ${targetId} NOT FOUND.`);
        }

    } catch (error) {
        console.error("Error querying database:", error);
    }

    process.exit(0);
}

debugExams();
