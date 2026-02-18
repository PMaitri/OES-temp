import { db } from "./db";
import { users, classes, teacherClasses, subjects } from "@shared/schema";
import { eq } from "drizzle-orm";

async function verifyAndFix() {
    console.log("🔍 Checking teacher assignments...\n");

    try {
        // Get teacher1
        const [teacher1] = await db.select().from(users).where(eq(users.username, "teacher1"));
        if (!teacher1) {
            console.log("❌ Teacher1 not found");
            return;
        }
        console.log("✅ Found teacher1:", teacher1.fullName);

        // Get all classes
        const allClasses = await db.select().from(classes);
        console.log(`\n📚 Total classes in database: ${allClasses.length}`);
        allClasses.forEach(cls => {
            console.log(`   - ${cls.name} - ${cls.section}`);
        });

        // Get teacher1's assignments
        const assignments = await db
            .select()
            .from(teacherClasses)
            .where(eq(teacherClasses.teacherId, teacher1.id));

        console.log(`\n👨‍🏫 Teacher1 assignments: ${assignments.length}`);

        if (assignments.length === 0) {
            console.log("\n⚠️  No assignments found! Creating assignments...");

            // Get Math and Science subjects
            const [mathSubject] = await db.select().from(subjects).where(eq(subjects.name, "Mathematics"));
            const [scienceSubject] = await db.select().from(subjects).where(eq(subjects.name, "Science"));

            // Get Class 9A, 9B, 10A
            const class9A = allClasses.find(c => c.name === "Class 9" && c.section === "A");
            const class9B = allClasses.find(c => c.name === "Class 9" && c.section === "B");
            const class10A = allClasses.find(c => c.name === "Class 10" && c.section === "A");

            if (class9A && class9B && class10A && mathSubject) {
                // Assign teacher1 to these classes
                await db.insert(teacherClasses).values([
                    { teacherId: teacher1.id, classId: class9A.id, subjectId: mathSubject.id },
                    { teacherId: teacher1.id, classId: class9B.id, subjectId: mathSubject.id },
                    { teacherId: teacher1.id, classId: class10A.id, subjectId: mathSubject.id },
                ]);
                console.log("✅ Assigned teacher1 to Classes 9A, 9B, 10A (Mathematics)");

                if (scienceSubject && class9A) {
                    await db.insert(teacherClasses).values({
                        teacherId: teacher1.id,
                        classId: class9A.id,
                        subjectId: scienceSubject.id,
                    });
                    console.log("✅ Assigned teacher1 to Class 9A (Science)");
                }
            }
        } else {
            console.log("✅ Teacher1 already has assignments");
            for (const assignment of assignments) {
                const [cls] = await db.select().from(classes).where(eq(classes.id, assignment.classId));
                const [subj] = assignment.subjectId
                    ? await db.select().from(subjects).where(eq(subjects.id, assignment.subjectId))
                    : [null];
                console.log(`   - ${cls?.name} - ${cls?.section} (${subj?.name || "No subject"})`);
            }
        }

        console.log("\n✅ Verification complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

verifyAndFix();
