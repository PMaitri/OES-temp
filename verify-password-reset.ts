
import "dotenv/config";
import { storage } from "./server/storage";
import bcrypt from "bcrypt";
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function verifyReset() {
    console.log("🔍 Starting Password Reset Verification...");

    const username = "test_reset_user";
    const oldPassword = "oldPassword123";
    const newPassword = "newPassword456";

    // 1. Cleanup previous test run
    await db.delete(users).where(eq(users.username, username));

    // 2. Create User
    console.log("Creating test user...");
    const hashedOld = await bcrypt.hash(oldPassword, 10);
    const user = await storage.createUser({
        username,
        email: "testreset@example.com",
        password: hashedOld,
        fullName: "Test Reset User",
        role: "student"
    });
    console.log(`User created: ${user.id} with password '${oldPassword}'`);

    // 3. Simulate Admin Reset (Logic from routes.ts)
    console.log("Simulating Admin Reset...");
    const hashedNew = await bcrypt.hash(newPassword, 10);
    const updatedUser = await storage.updateUser(user.id, {
        password: hashedNew
    });
    console.log("User updated via storage.updateUser");

    // 4. Verify Login
    console.log("Verifying login with new password...");
    const freshUser = await storage.getUser(user.id);

    if (!freshUser) {
        console.error("❌ User not found!");
        process.exit(1);
    }

    const isMatch = await bcrypt.compare(newPassword, freshUser.password);

    if (isMatch) {
        console.log("✅ SUCCESS: Login with new password successful!");
        console.log("The password reset flow logic is correct.");
    } else {
        console.error("❌ FAILURE: Password mismatch. Reset failed.");
    }

    // Cleanup
    await db.delete(users).where(eq(users.username, username));
    process.exit(0);
}

verifyReset().catch(console.error);
