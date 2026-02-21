/**
 * ROBUST HOSTINGER ENTRY POINT (server.cjs)
 * This file is loaded as CommonJS to ensure fast and stable startup.
 */

const express = require('express');
const { join } = require('path');
const fs = require('fs');

async function start() {
    console.log("🚀 server.cjs starting...");
    const port = process.env.PORT || 3000;

    try {
        // 1. Start a recovery/guardian server immediately
        const app = express();

        // Simple health check for Hostinger
        app.get('/_health', (req, res) => res.status(200).send('HEALTHY'));

        // Root bridge: Forward ALL requests to the main app if it's loaded
        app.use((req, res, next) => {
            if (global.mainApp) {
                // If mainApp exists, it's an express instance. Call it.
                return global.mainApp(req, res, next);
            }

            // Fallback while loading
            if (req.path === '/' || !req.path.startsWith('/api')) {
                return res.status(503).send('<h1>OES is starting up...</h1><p>Please refresh in a few seconds.</p><script>setTimeout(()=>location.reload(), 3000)</script>');
            }
            res.status(503).json({ message: "OES is starting up. Please try again in a few seconds." });
        });

        const server = app.listen(port, () => {
            console.log(`✅ Guardian listening on port ${port}`);

            // 2. Load the main application bundle (ESM)
            const bundlePath = join(process.cwd(), 'build', 'index.js');
            if (fs.existsSync(bundlePath)) {
                console.log("📦 Loading main app bundle from /build/index.js...");
                import('./build/index.js').then(() => {
                    console.log("✨ MAIN APP LOADED.");
                    global.appLoaded = true;
                }).catch(err => {
                    console.error("❌ CRITICAL: Main app bundle failed to load:");
                    console.error(err);
                });
            } else {
                console.error("❌ ERROR: Main app bundle not found at /build/index.js");
            }
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.warn(`⚠️ Port ${port} is already in use.`);
            } else {
                console.error("❌ Server Error:", err);
            }
        });

    } catch (err) {
        console.error("❌ Fatal startup error:", err);
        process.exit(1);
    }
}

start();
