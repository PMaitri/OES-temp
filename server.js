import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function start() {
    console.log("🚀 Server.js starting...");
    const port = process.env.PORT || 5000;

    try {
        const buildPath = join(__dirname, 'build', 'index.js');
        if (!fs.existsSync(buildPath)) {
            throw new Error(`Critical Error: Build file not found at ${buildPath}.`);
        }

        console.log("📦 Loading main app from ./build/index.js...");
        await import('./build/index.js');
        console.log("✅ Main app loaded successfully.");
    } catch (err) {
        console.error("❌ FATAL STARTUP ERROR:", err);

        const app = express();
        app.get('*', (req, res) => {
            res.status(500).send(`
                <div style="padding: 20px; font-family: sans-serif; line-height: 1.5; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
                    <h2 style="margin-top: 0;">⚠️ Site Startup Error</h2>
                    <p>Error: ${err.message}</p>
                    <pre>${err.stack}</pre>
                </div>
            `);
        });

        app.listen(port, () => {
            console.log(`📡 Fallback error server running on port ${port}`);
        });
    }
}

start();
