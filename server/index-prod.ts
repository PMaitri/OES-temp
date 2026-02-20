import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";
import { fileURLToPath } from "node:url";

import express, { type Express } from "express";
import runApp from "./app";

// Robust __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function serveStatic(app: Express, _server: Server) {
  const rootDir = process.cwd();
  const possiblePaths = [
    path.join(rootDir, "build", "public"),
    path.join(rootDir, "dist", "public"),
    path.join(__dirname, "public"),
    path.join(__dirname, "..", "dist", "public")
  ];

  let staticPath = "";
  for (const p of possiblePaths) {
    console.log(`[STARTUP] Checking path: ${p}`);
    if (fs.existsSync(p)) {
      staticPath = p;
      console.log(`[STARTUP] ✅ Found static files at: ${staticPath}`);
      break;
    }
  }

  if (!staticPath) {
    console.error(`[STARTUP] ❌ ERROR: Static directory NOT FOUND in any of: ${possiblePaths.join(", ")}`);
    // Fallback to current dir public if everything else fails
    staticPath = path.resolve(__dirname, "public");
  }

  app.use(express.static(staticPath));

  app.use("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: `API route not found: ${req.method} ${req.path}` });
    }
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend files are missing. Please ensure 'npm run build' was successful.");
    }
  });
}

(async () => {
  console.log("-----------------------------------------");
  console.log("🚀 PRODUCTION SERVER STARTING...");
  console.log(`📅 Time: ${new Date().toISOString()}`);
  console.log(`🆔 Node Version: ${process.version}`);
  console.log(`📂 Working Dir: ${process.cwd()}`);
  console.log(`🌐 PORT: ${process.env.PORT || '5000'}`);

  if (!process.env.DATABASE_URL) {
    console.error("❌ FATAL: DATABASE_URL is missing from environment variables!");
  } else {
    console.log("✅ DATABASE_URL is present.");
  }

  try {
    await runApp(serveStatic);
    console.log("✅ Server components initialized successfully.");
  } catch (error: any) {
    console.error("❌ FATAL ERROR DURING STARTUP:", error);
    // Let server.cjs catch this rethrown error
    throw error;
  }
})();
