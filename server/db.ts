import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "../shared/schema";

console.log("🔌 Database module loading...");

let pool: any = null;
let drizzleInstance: any = null;

export function getDb() {
  if (drizzleInstance) return drizzleInstance;

  try {
    // 1. Try Environment Variable first
    if (process.env.DATABASE_URL) {
      console.log("🔋 Using DATABASE_URL from environment.");
      pool = mysql.createPool(process.env.DATABASE_URL);
    } else {
      // 2. Fallback to Object Config (Better for special characters like !)
      console.log("🔋 Using hardcoded fallback configuration.");
      pool = mysql.createPool({
        host: '127.0.0.1', // Use IPv4 for stability
        user: 'u241368025_dbadmin',
        password: 'School2026Secure!',
        database: 'u241368025_PrepIQ',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
    }

    drizzleInstance = drizzle(pool, { schema, mode: 'default' });
    return drizzleInstance;
  } catch (err) {
    console.error("❌ Database Initialization Error:", err);
    throw err;
  }
}

// Export a robust proxy that preserves method binding
export const db = new Proxy({} as any, {
  get: (target, prop) => {
    const instance = getDb();
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export { pool };
