const express = require('express');
const { join } = require('path');
const fs = require('fs');

async function start() {
    console.log("🚀 server.cjs starting...");
    const port = process.env.PORT || 3000;

    try {
        const buildPath = join(__dirname, 'build', 'index.js');
        if (!fs.existsSync(buildPath)) {
            throw new Error(`Critical Error: Build file not found at ${buildPath}. Did you run 'npm run build'?`);
        }

        console.log("📦 Loading main app from ./build/index.js...");
        // Dynamic import is allowed in CJS to load ESM
        await import('./build/index.js');
        console.log("✅ Main app loaded successfully.");
    } catch (err) {
        console.error("❌ FATAL STARTUP ERROR:", err);

        const app = express();
        app.get('*', (req, res) => {
            res.status(500).send(`
                <div style="padding: 20px; font-family: sans-serif; line-height: 1.5; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
                    <h2 style="margin-top: 0;">⚠️ Site Startup Error (CJS)</h2>
                    <p>The application failed to start correctly.</p>
                    <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow: auto;">${err.stack || err.message}</pre>
                </div>
            `);
        });

        app.listen(port, () => {
            console.log(`📡 Fallback error server running on port ${port}`);
        });
    }
}

start();
