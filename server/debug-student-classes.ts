
import { db } from "./db";
import { users, classes, studentClasses } from "@shared/schema";
import { storage } from "./storage";

async function run() {
    try {
        console.log("Creating classes...");
        const classA = await storage.createClass({ name: "Debug Class A", section: "A" });
        const classB = await storage.createClass({ name: "Debug Class B", section: "B" });

        console.log("Creating students...");
        const studentA = await storage.createUser({
            username: "debug_student_a_" + Date.now(),
            email: "a_" + Date.now() + "@debug.com",
            password: "password",
            fullName: "Student A",
            role: "student"
        });

        const studentB = await storage.createUser({
            username: "debug_student_b_" + Date.now(),
            email: "b_" + Date.now() + "@debug.com",
            password: "password",
            fullName: "Student B",
            role: "student"
        });

        console.log("Enrolling students...");
        await storage.enrollStudent({ studentId: studentA.id, classId: classA.id, rollNumber: 1 });
        await storage.enrollStudent({ studentId: studentB.id, classId: classB.id, rollNumber: 1 });

        console.log("Fetching classes...");
        const classesA = await storage.getClassesByStudent(studentA.id);
        const classesB = await storage.getClassesByStudent(studentB.id);

        console.log("Student A Classes:", classesA.map(c => c.name));
        console.log("Student B Classes:", classesB.map(c => c.name));

        if (classesA.length === 1 && classesA[0].name === "Debug Class A" &&
            classesB.length === 1 && classesB[0].name === "Debug Class B") {
            console.log("SUCCESS: Classes are correct.");
        } else {
            console.log("FAILURE: Classes are mixed up!");
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

run();
