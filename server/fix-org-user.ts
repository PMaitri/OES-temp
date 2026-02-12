import { db } from "./db";
import { users, organizations } from "@shared/schema";
import { eq } from "drizzle-orm";

async function fixOrganizationUser() {
    try {
        console.log("🔧 Fixing organization user...\n");

        // Get the organization
        const [org] = await db.select().from(organizations).limit(1);
        if (!org) {
            console.log("❌ No organization found!");
            process.exit(1);
        }

        console.log(`Found organization: ${org.name} (${org.id})`);

        // Get the orgadmin user
        const [orgAdmin] = await db.select().from(users).where(eq(users.username, "orgadmin"));
        if (!orgAdmin) {
            console.log("❌ No orgadmin user found!");
            process.exit(1);
        }

        console.log(`Found user: ${orgAdmin.username}`);

        // Update the user with the organizationId
        await db.update(users)
            .set({ organizationId: org.id })
            .where(eq(users.id, orgAdmin.id));

        console.log(`✅ Updated orgadmin user with organizationId: ${org.id}`);
        console.log("\n🎉 Organization user fixed successfully!\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error fixing organization user:", error);
        process.exit(1);
    }
}

fixOrganizationUser();
