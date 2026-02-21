import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "../shared/schema";

console.log("🔌 Database module loading...");

const defaultUrl = 'mysql://u241368025_dbadmin:School2026Secure%21@localhost/u241368025_PrepIQ';
const dbUrl = process.env.DATABASE_URL || defaultUrl;

let pool: any = null;
let drizzleInstance: any = null;

export function getDb() {
  if (!drizzleInstance) {
    try {
      if (!pool) {
        console.log("🔌 Initializing MySQL pool for Hostinger...");
        pool = mysql.createPool(dbUrl);
      }
      drizzleInstance = drizzle(pool, { schema, mode: 'default' });
      console.log("✅ Drizzle instance created successfully.");
    } catch (err) {
      console.error("❌ Database Initialization Error:", err);
    }
  }
  return drizzleInstance;
}

// Export a robust proxy that preserves method binding
export const db = new Proxy({} as any, {
  get: (target, prop) => {
    const instance = getDb();
    if (!instance) {
      throw new Error(`Database not initialized. Cannot access property '${String(prop)}'`);
    }
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export { pool };
