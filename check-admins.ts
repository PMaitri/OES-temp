
import "dotenv/config";
import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkAdmins() {
    console.log("Checking for admin users...");
    const admins = await db.select().from(users).where(eq(users.role, "admin"));

    if (admins.length === 0) {
        console.log("No admin users found!");
    } else {
        console.log("Found admin users:");
        admins.forEach(u => {
            console.log(`- ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, Name: ${u.fullName}`);
        });
    }
    process.exit(0);
}

checkAdmins();
