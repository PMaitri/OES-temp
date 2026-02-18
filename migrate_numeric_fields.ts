
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Migrating numeric fields to double precision...");
    try {
        await db.execute(sql`ALTER TABLE numeric_answers ALTER COLUMN correct_answer TYPE double precision;`);
        await db.execute(sql`ALTER TABLE numeric_answers ALTER COLUMN tolerance TYPE double precision;`);
        await db.execute(sql`ALTER TABLE student_answers ALTER COLUMN numeric_answer TYPE double precision;`);
        console.log("Migration successful!");
    } catch (error) {
        console.error("Migration failed:", error);
    }
    process.exit(0);
}

main();
