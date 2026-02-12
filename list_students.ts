
import "dotenv/config";
import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function listStudents() {
    console.log("Listing students...");
    const students = await db.select().from(users).where(eq(users.role, "student"));

    students.forEach(s => {
        console.log(`- [${s.id}] Username: '${s.username}', Name: '${s.fullName}'`);
    });
    process.exit(0);
}

listStudents();
