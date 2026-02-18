import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "../shared/schema";

console.log("🔌 Database module loading...");

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ CRITICAL: DATABASE_URL environment variable is missing!");
}

export const pool = dbUrl ? mysql.createPool(dbUrl) : null;

if (pool) {
  console.log("🔌 Initializing connection pool...");
  pool.getConnection()
    .then(() => console.log("✅ Database connection successful!"))
    .catch((err) => {
      console.error("❌ Database connection failed:", err.message);
      console.error("Check your credentials in the Hostinger panel.");
    });
}

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
