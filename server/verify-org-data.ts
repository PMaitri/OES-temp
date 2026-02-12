import { db } from "./db";
import { users, organizations, institutes } from "@shared/schema";
import { eq } from "drizzle-orm";

async function verifyOrgData() {
    try {
        console.log("🔍 Verifying organization data...\n");

        // Get the orgadmin user
        const [orgAdmin] = await db.select().from(users).where(eq(users.username, "orgadmin"));
        if (!orgAdmin) {
            console.log("❌ No orgadmin user found!");
            process.exit(1);
        }

        console.log("User Details:");
        console.log(`  Username: ${orgAdmin.username}`);
        console.log(`  Role: ${orgAdmin.role}`);
        console.log(`  Organization ID: ${orgAdmin.organizationId || 'NULL'}`);
        console.log(`  Institute ID: ${orgAdmin.instituteId || 'NULL'}`);

        if (orgAdmin.organizationId) {
            const [org] = await db.select().from(organizations).where(eq(organizations.id, orgAdmin.organizationId));
            if (org) {
                console.log(`\n✅ Organization: ${org.name}`);

                // Get institutes
                const allInstitutes = await db.select().from(institutes).where(eq(institutes.organizationId, org.id));
                console.log(`\n📚 Institutes (${allInstitutes.length}):`);
                allInstitutes.forEach(inst => {
                    console.log(`  - ${inst.name}`);
                });

                // Get users in this organization
                const orgUsers = await db.select().from(users).where(eq(users.organizationId, org.id));
                console.log(`\n👥 Users in organization (${orgUsers.length}):`);
                orgUsers.forEach(u => {
                    console.log(`  - ${u.username} (${u.role})`);
                });
            }
        } else {
            console.log("\n❌ User has no organizationId set!");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

verifyOrgData();
