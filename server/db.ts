import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  const errorMsg = "FATAL: DATABASE_URL must be set. Please add it to your environment variables in Hostinger.";
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const pool = mysql.createPool(process.env.DATABASE_URL);
export const db = drizzle(pool, { schema, mode: 'default' });
