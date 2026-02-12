
import "dotenv/config";
import { db } from "./server/db";
import { exams, classes, examClasses } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

async function debugExamClasses() {
    console.log("🔍 Debugging Exam Classes...");

    const allExams = await db.select().from(exams);
    const allClasses = await db.select().from(classes);
    const allExamClasses = await db.select().from(examClasses);

    console.log(`Total Exams: ${allExams.length}`);
    console.log(`Total Classes: ${allClasses.length}`);
    console.log(`Total Exam-Class Links: ${allExamClasses.length}`);

    console.log("\n--- Exam Class Links ---");
    for (const exam of allExams) {
        const links = allExamClasses.filter(link => link.examId === exam.id);
        const classIds = links.map(l => l.classId);

        // Also check the legacy classId column
        const legacyClassId = exam.classId;

        console.log(`Exam [${exam.title}] (${exam.id}):`);
        console.log(`  - Legacy classId: ${legacyClassId}`);
        console.log(`  - Linked classIds: ${classIds.join(", ")}`);

        const validLinks = classIds.filter(id => allClasses.some(c => c.id === id));
        const validLegacy = allClasses.some(c => c.id === legacyClassId);

        if (validLinks.length === 0 && !validLegacy) {
            console.log("  ❌ UNKNOWN CLASS: No valid class links found!");
        } else {
            const names = [];
            if (validLegacy) {
                const c = allClasses.find(c => c.id === legacyClassId);
                names.push(`Legacy: ${c?.name} ${c?.section}`);
            }
            validLinks.forEach(id => {
                const c = allClasses.find(c => c.id === id);
                names.push(`Linked: ${c?.name} ${c?.section}`);
            });
            console.log(`  ✅ Resolved to: ${names.join(", ")}`);
        }
    }

    process.exit(0);
}

debugExamClasses();
