import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/db";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: dbUrl,
  },
});
