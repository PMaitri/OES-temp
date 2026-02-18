
import "dotenv/config";
import { db } from "./server/db";
import { exams } from "@shared/schema";
import { eq } from "drizzle-orm";

async function fixExamOwnership() {
    const examId = "764b892e-7043-40c0-83fd-c0836ab919b5";
    const newTeacherId = "1cb5ff9c-abf7-4fb6-95e2-bed094eee4c9"; // teacher3 (Michael Brown)

    console.log(`Updating exam ${examId} to be owned by ${newTeacherId}...`);

    await db.update(exams)
        .set({ teacherId: newTeacherId })
        .where(eq(exams.id, examId));

    console.log("✅ Ownership updated.");
    process.exit(0);
}

fixExamOwnership();
