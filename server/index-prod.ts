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
  const distPath = path.resolve(__dirname, "public");

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }

  app.use("*", (req, res) => {
    if (req.originalUrl.includes("/api/")) {
      return res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
    }
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend files missing.");
    }
  });
}

(async () => {
  console.log("🚀 PRODUCTION SERVER STARTING...");
  try {
    await runApp(serveStatic);
    console.log("✅ Server components initialized.");
  } catch (error: any) {
    console.error("❌ STARTUP ERROR:", error);
  }
})();
