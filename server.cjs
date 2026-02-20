const express = require('express');
const { join } = require('path');
const fs = require('fs');

async function start() {
    console.log("🚀 server.cjs starting...");
    const port = process.env.PORT || 3000;

    try {
        const buildPath = join(__dirname, 'build', 'index.js');
        if (!fs.existsSync(buildPath)) {
            throw new Error(`Critical Error: Build file not found at ${buildPath}.`);
        }

        console.log("📦 Loading main app bundle...");
        // This is the ESM bundle created by esbuild
        await import('./build/index.js');
        console.log("✅ Main app loaded successfully.");
    } catch (err) {
        console.error("❌ FATAL STARTUP ERROR:", err);

        // Emergency fallback server to prevent 503
        const app = express();
        app.get('*', (req, res) => {
            res.status(500).send(`
                <div style="padding: 40px; font-family: sans-serif; background: #fff5f5; border: 2px solid #feb2b2; border-radius: 8px; color: #c53030; max-width: 800px; margin: 40px auto;">
                    <h1 style="margin-top: 0;">⚠️ Server Recovery Mode</h1>
                    <p>The main application failed to start, but we have intercepted the crash to prevent a 503 error.</p>
                    <div style="background: #fff; padding: 20px; border-radius: 4px; border: 1px solid #fed7d7; overflow: auto;">
                        <h3 style="margin-top: 0;">Error Details:</h3>
                        <pre style="font-size: 14px;">${err.stack || err.message}</pre>
                    </div>
                    <p style="margin-top: 20px;"><strong>Action Required:</strong> Check the File Manager to ensure <code>build/index.js</code> exists and your database credentials are correct.</p>
                </div>
            `);
        });

        app.listen(port, () => {
            console.log(`📡 Recovery server running on port ${port}`);
        });
    }
}

start();
