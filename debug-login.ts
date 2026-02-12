
import "dotenv/config";
import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function debugUser() {
    console.log("🔍 Debugging User Login...");
    const username = "Divya"; // Based on screenshot

    const [user] = await db.select().from(users).where(eq(users.username, username));

    if (!user) {
        console.log(`❌ User '${username}' not found in database.`);
    } else {
        console.log(`✅ User found:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Password Hash: ${user.password.substring(0, 10)}...`);
    }

    // Also list all users to see if there's a case sensitivity issue or similar
    console.log("\n📋 All Users:");
    const allUsers = await db.select().from(users);
    allUsers.forEach(u => {
        console.log(`   - ${u.username} (${u.role})`);
    });

    process.exit(0);
}

debugUser();
