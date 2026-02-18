
import "dotenv/config";
import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkExamOwner() {
    const ownerId = "9d32fd9c-1325-41e5-b87b-3501adcf471d";
    console.log(`Checking user ${ownerId}...`);

    const user = await db.query.users.findFirst({
        where: eq(users.id, ownerId)
    });

    if (user) {
        console.log("Owner found:", user.username, user.fullName);
    } else {
        console.log("Owner not found");
    }
    process.exit(0);
}

checkExamOwner();
