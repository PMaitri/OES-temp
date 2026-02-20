import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "../shared/schema";

console.log("🔌 Database module loading...");

const defaultUrl = 'mysql://u241368025_dbadmin:PrepIQ2026Secure@localhost/u241368025_PrepIQ';
const dbUrl = process.env.DATABASE_URL || defaultUrl;

let pool: any = null;

export function getDb() {
  if (!pool) {
    try {
      console.log("🔌 Lazy-loading database pool...");
      pool = mysql.createPool(dbUrl);
    } catch (err) {
      console.error("❌ DB Pool Error:", err);
    }
  }
  return drizzle(pool, { schema, mode: 'default' });
}

// Export a proxy as 'db' so we don't have to change 100 files
export const db = new Proxy({} as any, {
  get: (target, prop) => {
    return (getDb() as any)[prop];
  }
});

export { pool };
