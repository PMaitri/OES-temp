
import "dotenv/config";
import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function resetPassword() {
    console.log("🔐 Resetting password for Divya...");

    // Hash new password "divya123"
    const newPassword = "divya123";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.username, "Divya"));

    console.log(`✅ Password for 'Divya' reset to: ${newPassword}`);
    process.exit(0);
}

resetPassword();
