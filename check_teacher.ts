
import "dotenv/config";
import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkTeacher() {
    console.log("Checking teacher 'teacher3'...");
    const user = await db.query.users.findFirst({
        where: eq(users.username, "teacher3")
    });

    if (user) {
        console.log("Teacher3 ID:", user.id);
    } else {
        console.log("Teacher3 not found");
    }
    process.exit(0);
}

checkTeacher();
