
import "dotenv/config";
import { storage } from "./server/storage";
import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function debugAssignments() {
    console.log("Fetching all teacher assignments...");
    const assignments = await storage.getAllTeacherAssignments();
    console.log(`Found ${assignments.length} assignments.`);

    if (assignments.length > 0) {
        console.log("Sample assignment:", assignments[0]);
    }

    console.log("\nFetching specific teacher 'Divya'...");
    const user = await storage.getUserByUsername("Divya");
    if (user) {
        console.log("Divya ID:", user.id);
        const userAssignments = assignments.filter(a => a.teacherId === user.id);
        console.log(`Assignments for Divya (ID match): ${userAssignments.length}`);

        // Check for loose match
        const looseAssignments = assignments.filter(a => a.teacherName === "Divya");
        console.log(`Assignments for Divya (Name match): ${looseAssignments.length}`);

        if (looseAssignments.length > 0) {
            console.log("First loose assignment teacherId:", looseAssignments[0].teacherId);
            console.log("Do IDs match?", looseAssignments[0].teacherId === user.id);
        }
    } else {
        console.log("User 'Divya' not found.");
    }

    process.exit(0);
}

debugAssignments();
