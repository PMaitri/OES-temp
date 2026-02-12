
import "dotenv/config";
import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function resetAdminPassword() {
    const username = "admin";
    const newPassword = "admin123";
    console.log(`🔐 Resetting password for ${username}...`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.username, username))
        .returning();

    if (result.length > 0) {
        console.log(`✅ Password for '${username}' reset to: ${newPassword}`);
    } else {
        console.log(`❌ User '${username}' not found.`);
    }
    process.exit(0);
}

resetAdminPassword();
