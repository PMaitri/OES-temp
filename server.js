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
        const distPath = join(__dirname, 'dist', 'index.js');
        if (!fs.existsSync(distPath)) {
            throw new Error(`Critical Error: Build file not found at ${distPath}. Did you run 'npm run build'?`);
        }

        console.log("📦 Loading main app from ./dist/index.js...");
        await import('./dist/index.js');
        console.log("✅ Main app loaded successfully.");
    } catch (err) {
        console.error("❌ FATAL STARTUP ERROR:", err);

        // Fallback server to stop 503 and show error
        const app = express();
        app.get('*', (req, res) => {
            res.status(500).send(`
                <div style="padding: 20px; font-family: sans-serif; line-height: 1.5; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
                    <h2 style="margin-top: 0;">⚠️ Site Startup Error</h2>
                    <p>The application failed to start correctly on Hostinger.</p>
                    <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow: auto;">${err.stack || err.message}</pre>
                    <p><strong>Common Fixes:</strong></p>
                    <ul>
                        <li>Ensure "Entry file" is set to <strong>server.js</strong> in Hostinger.</li>
                        <li>Ensure "Build command" ran successfully.</li>
                        <li>Check if <strong>dist/index.js</strong> exists in File Manager.</li>
                    </ul>
                </div>
            `);
        });

        app.listen(port, () => {
            console.log(`📡 Fallback error server running on port ${port}`);
        });
    }
}

start();
