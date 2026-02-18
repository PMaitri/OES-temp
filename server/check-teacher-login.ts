import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function checkTeacherLogin() {
    try {
        console.log("🔍 Checking teacher login...\n");

        const username = "teacher1";
        const password = "teacher123";

        const [user] = await db.select().from(users).where(eq(users.username, username));

        if (!user) {
            console.log("❌ User not found!");
            process.exit(1);
        }

        console.log("✅ User found:");
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Password hash: ${user.password.substring(0, 20)}...`);

        // Test password
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`\n🔐 Password test: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

        if (!isValid) {
            console.log("\n⚠️ Password doesn't match! Resetting to 'teacher123'...");
            const newHash = await bcrypt.hash("teacher123", 10);
            await db.update(users).set({ password: newHash }).where(eq(users.id, user.id));
            console.log("✅ Password reset successfully!");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

checkTeacherLogin();
