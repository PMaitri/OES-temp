import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "../shared/schema";

console.log("🔌 Database module loading...");

const defaultUrl = 'mysql://u241368025_dbadmin:PrepIQ2026Secure@localhost/u241368025_PrepIQ';
const dbUrl = process.env.DATABASE_URL || defaultUrl;

console.log(`🔌 Preparing database connection to: ${dbUrl.split('@')[1]}`);

let pool: any = null;
try {
  pool = mysql.createPool(dbUrl);
  console.log("✅ Database pool created.");
} catch (err) {
  console.error("❌ CRITICAL: Failed to create database pool:", err);
}

export const db = drizzle(pool, { schema, mode: 'default' });
export { pool };
