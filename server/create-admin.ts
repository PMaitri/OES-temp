
import { storage } from "./storage";
import bcrypt from "bcrypt";

async function createAdmin() {
    const username = "admin";
    const password = "admin123";
    // Salt rounds = 10
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Checking for existing admin user...");
    const existing = await storage.getUserByUsername(username);
    if (existing) {
        console.log("Admin user 'admin' already exists.");
        process.exit(0);
    }

    console.log("Creating admin user...");
    try {
        await storage.createUser({
            username,
            password: hashedPassword,
            role: "admin",
            fullName: "System Administrator",
            email: "admin@school.com",
            // studentId is optional/null for admins
        });

        console.log("===========================================");
        console.log("Admin Account Created Successfully!");
        console.log("Username: admin");
        console.log("Password: admin123");
        console.log("===========================================");
    } catch (error) {
        console.error("Error creating admin:", error);
    }
    process.exit(0);
}

createAdmin();
