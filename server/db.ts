import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "../shared/schema";

console.log("🔌 Database module loading...");

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ CRITICAL: DATABASE_URL environment variable is missing!");
}

let pool: any = null;
try {
  if (dbUrl) {
    pool = mysql.createPool(dbUrl);
    console.log("🔌 Initializing connection pool...");
  }
} catch (err) {
  console.error("❌ Error creating database pool:", err);
}

export { pool };

// Connection testing is handled on-demand to prevent startup crashes

// Create the drizzle instance
const drizzleInstance = pool ? drizzle(pool, { schema, mode: 'default' }) : null;

// Export a protected db object that gives clear// Connection testing is handled on-demand to prevent startup crashes
export const db = new Proxy({} as any, {
  get: (target, prop) => {
    if (drizzleInstance) {
      return (drizzleInstance as any)[prop];
    }
    // Instead of throwing, we log and return a dummy function to keep the server alive
    console.warn(`⚠️ DATABASE WARNING: Attempted to call '.${String(prop)}' but database is not connected. Check DATABASE_URL.`);
    return () => {
      console.error(`❌ DATABASE REJECTED: .${String(prop)} called while disconnected.`);
      return Promise.reject(new Error("Database not connected. Please check your Hostinger Environment Variables."));
    };
  }
});
