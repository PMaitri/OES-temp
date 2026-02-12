
import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("🔧 Fixing database schema...");

    try {
        // Add negative_marks to questions if it doesn't exist
        console.log("Checking questions table...");
        await db.execute(sql`
            ALTER TABLE questions 
            ADD COLUMN IF NOT EXISTS negative_marks INTEGER DEFAULT 0;
        `);
        console.log("✅ verified negative_marks column");

        // Add tolerance to numeric_answers if it doesn't exist
        console.log("Checking numeric_answers table...");
        await db.execute(sql`
            ALTER TABLE numeric_answers 
            ADD COLUMN IF NOT EXISTS tolerance DOUBLE PRECISION;
        `);
        console.log("✅ verified tolerance column");

        console.log("🎉 Schema fix completed successfully!");
    } catch (error) {
        console.error("❌ Schema fix failed:", error);
    }
    process.exit(0);
}

main();
