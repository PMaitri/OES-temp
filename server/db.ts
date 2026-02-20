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

// Export a protected db object that gives clear errors if accessed while unconfigured
export const db = new Proxy({} as any, {
  get: (target, prop) => {
    if (drizzleInstance) {
      return (drizzleInstance as any)[prop];
    }
    const errorMsg = `Database Error: Cannot call '.${String(prop)}' because DATABASE_URL is not configured in Hostinger settings.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
});
