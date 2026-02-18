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
  // If we are in dist/index.js, __dirname is the dist folder.
  // Static files are in dist/public/
  const distPath = path.resolve(__dirname, "public");

  console.log(`[STARTUP] Static files directory: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    console.error(`[STARTUP] ❌ ERROR: Static directory NOT FOUND at ${distPath}`);
    // List files to help debug
    try {
      console.log(`[STARTUP] Files in ${__dirname}:`, fs.readdirSync(__dirname));
    } catch (e) { }
  } else {
    console.log(`[STARTUP] ✅ Static directory found.`);
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      console.log(`[STARTUP] ✅ index.html found.`);
    } else {
      console.warn(`[STARTUP] ⚠️ index.html NOT FOUND at ${indexPath}`);
    }
  }

  app.use(express.static(distPath));

  app.use("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "API route not found" });
    }
    const indexPath = path.resolve(distPath, "index.html");
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
  } catch (error) {
    console.error("❌ FATAL ERROR DURING STARTUP:", error);
    process.exit(1);
  }
})();
