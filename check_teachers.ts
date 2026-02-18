
import "dotenv/config";
import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkTeachers() {
    console.log("Listing all teachers...");
    const teachers = await db.select().from(users).where(eq(users.role, "teacher"));

    teachers.forEach(t => {
        console.log(`- [${t.id}] Username: '${t.username}', Email: '${t.email}', Name: '${t.fullName}'`);
    });
    process.exit(0);
}

checkTeachers();
