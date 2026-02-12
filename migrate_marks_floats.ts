
import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("🔄 Migrating marks and negative_marks columns to FLOAT...");

    try {
        console.log("Updating marks column...");
        await db.execute(sql`ALTER TABLE questions ALTER COLUMN marks TYPE double precision;`);

        console.log("Updating negative_marks column...");
        await db.execute(sql`ALTER TABLE questions ALTER COLUMN negative_marks TYPE double precision;`);

        console.log("✅ Migration successful: Columns now support float values.");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    }
    process.exit(0);
}

main();
