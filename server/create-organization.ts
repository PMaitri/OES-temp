import { db } from "./db";
import { users, organizations, institutes } from "@shared/schema";
import bcrypt from "bcrypt";

async function createOrganizationData() {
    try {
        console.log("🏢 Creating organization data...\n");

        // Create Organization
        console.log("Creating Organization...");
        const [org] = await db.insert(organizations).values({
            name: "EduTech Solutions",
            description: "Leading educational technology provider managing multiple institutes",
            contactEmail: "contact@edutech.com",
            contactPhone: "+1-555-0100",
            address: "123 Education Street, Tech City, TC 12345",
            isActive: true,
        }).returning();
        console.log("✅ Organization created:", org.name);

        // Create Institutes under the organization
        console.log("\nCreating Institutes...");
        const [institute1] = await db.insert(institutes).values({
            organizationId: org.id,
            name: "Springfield High School",
            description: "Premier high school in Springfield",
            address: "456 School Ave, Springfield, SP 67890",
            contactEmail: "info@springfield-hs.edu",
            contactPhone: "+1-555-0101",
            isActive: true,
        }).returning();
        console.log("✅ Institute created:", institute1.name);

        const [institute2] = await db.insert(institutes).values({
            organizationId: org.id,
            name: "Riverside College",
            description: "Excellence in higher education",
            address: "789 College Rd, Riverside, RS 11223",
            contactEmail: "admin@riverside-college.edu",
            contactPhone: "+1-555-0102",
            isActive: true,
        }).returning();
        console.log("✅ Institute created:", institute2.name);

        // Create Organization Admin User
        console.log("\nCreating Organization Admin user...");
        const hashedPassword = await bcrypt.hash("org123", 10);
        const [orgAdmin] = await db.insert(users).values({
            username: "orgadmin",
            email: "orgadmin@edutech.com",
            password: hashedPassword,
            fullName: "Organization Administrator",
            role: "organization",
            organizationId: org.id,
        }).returning();
        console.log("✅ Organization Admin created:", orgAdmin.username);

        console.log("\n🎉 Organization data created successfully!\n");
        console.log("📝 Organization Login Credentials:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Organization Admin:");
        console.log("  Username: orgadmin");
        console.log("  Password: org123");
        console.log("  Email: orgadmin@edutech.com");
        console.log("\nOrganization Details:");
        console.log(`  Name: ${org.name}`);
        console.log(`  ID: ${org.id}`);
        console.log("\nInstitutes:");
        console.log(`  1. ${institute1.name} (ID: ${institute1.id})`);
        console.log(`  2. ${institute2.name} (ID: ${institute2.id})`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating organization data:", error);
        process.exit(1);
    }
}

createOrganizationData();
