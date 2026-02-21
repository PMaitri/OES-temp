import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "../shared/schema";
import fs from 'fs';
import path from 'path';

console.log("🔌 Database module loading...");

let pool: any = null;
let drizzleInstance: any = null;

// Helper to find and read .env if process.env is empty
function getEnvDbUrl() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/DATABASE_URL=(.*)/);
      if (match && match[1]) {
        return match[1].trim().replace(/['"]/g, '');
      }
    }
  } catch (e) {
    console.warn("⚠️ Could not manually read .env file.");
  }
  return null;
}

export function getDb() {
  if (drizzleInstance) return drizzleInstance;

  const envUrl = process.env.DATABASE_URL || getEnvDbUrl();

  try {
    if (envUrl) {
      console.log("🔋 Using DATABASE_URL.");
      pool = mysql.createPool(envUrl);
    } else {
      console.log("🔋 Using hardcoded fallback.");
      // Last working configuration approach
      pool = mysql.createPool({
        host: '127.0.0.1',
        user: 'u241368025_dbadmin',
        password: 'PrepIQ2026Secure', // Trying the original password
        database: 'u241368025_PrepIQ',
        waitForConnections: true,
        connectionLimit: 10
      });
    }

    drizzleInstance = drizzle(pool, { schema, mode: 'default' });
    return drizzleInstance;
  } catch (err) {
    console.error("❌ Database Initialization Error:", err);
    throw err;
  }
}

export const db = new Proxy({} as any, {
  get: (target, prop) => {
    const instance = getDb();
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export { pool };
