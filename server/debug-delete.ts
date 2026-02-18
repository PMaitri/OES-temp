
import { DatabaseStorage } from "./storage";
import { db } from "./db";

const storage = new DatabaseStorage();

async function run() {
    console.log("Creating dummy class...");
    try {
        const cls = await storage.createClass({
            name: "Debug Class",
            section: "D",
            description: "To be deleted"
        });
        console.log("Class created:", cls.id);

        console.log("Deleting class...");
        await storage.deleteClass(cls.id);
        console.log("Class deleted successfully!");
    } catch (e) {
        console.error("DELETE FAILED:", e);
    }
    process.exit(0);
}

run();
