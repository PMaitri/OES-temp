/**
 * ROBUST HOSTINGER ENTRY POINT (server.cjs)
 * Improved with debug logging and globalThis support.
 */

const express = require('express');
const { join, resolve } = require('path');
const fs = require('fs');

const logs = [];
function debugLog(msg) {
    const entry = `${new Date().toISOString()} - ${msg}`;
    console.log(entry);
    logs.push(entry);
    if (logs.length > 100) logs.shift();
}

async function start() {
    debugLog("🚀 server.cjs starting...");
    const port = process.env.PORT || 3000;

    try {
        const app = express();

        // 1. Health check for Hostinger
        app.get('/_health', (req, res) => res.status(200).send('HEALTHY'));

        // 2. Debug endpoint to see what's happening
        app.get('/_debug', (req, res) => {
            res.json({
                status: globalThis.mainApp ? "READY" : "LOADING",
                cwd: process.cwd(),
                bundleExists: fs.existsSync(join(process.cwd(), 'build', 'index.js')),
                logs: logs
            });
        });

        // 3. Request Bridge
        app.use((req, res, next) => {
            if (globalThis.mainApp) {
                debugLog(`Forwarding: ${req.method} ${req.url}`);
                return globalThis.mainApp(req, res, next);
            }

            if (req.path === '/' || !req.path.startsWith('/api')) {
                return res.status(503).send(`
                    <html>
                        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f9f9f9;">
                            <h1 style="color: #333;">OES is starting up...</h1>
                            <p style="color: #666;">Please Wait. This usually takes 10-20 seconds on first load.</p>
                            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite;"></div>
                            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                            <script>setTimeout(() => location.reload(), 5000);</script>
                        </body>
                    </html>
                `);
            }
            res.status(503).json({ message: "Server is starting. Please try again in 5 seconds." });
        });

        const server = app.listen(port, () => {
            debugLog(`✅ Guardian listening on port ${port}`);

            // Start loading application in the background
            const bundlePath = resolve(__dirname, 'build', 'index.js');
            debugLog(`👀 Checking for bundle at: ${bundlePath}`);

            if (fs.existsSync(bundlePath)) {
                debugLog("📦 Bundle found, starting import...");
                // Note: Using file:// URL for absolute path import in ESM to be bulletproof
                const bundleUrl = `file://${bundlePath.replace(/\\/g, '/')}`;

                import(bundleUrl).then(() => {
                    debugLog("✨ MAIN APP BUNDLE IMPORTED.");
                    // The bundle sets globalThis.mainApp
                    if (!globalThis.mainApp) {
                        debugLog("⚠️ Bundle loaded but globalThis.mainApp is still missing!");
                    } else {
                        debugLog("🚀 mainApp is now ready to handle traffic.");
                    }
                }).catch(err => {
                    debugLog(`❌ BUNDLE LOAD ERROR: ${err.message}`);
                    debugLog(err.stack);
                });
            } else {
                debugLog("❌ ERROR: Main app bundle not found at /build/index.js");
            }
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                debugLog(`⚠️ Port ${port} is already in use.`);
            } else {
                debugLog(`❌ Server Error: ${err.message}`);
            }
        });

    } catch (err) {
        debugLog(`❌ Fatal startup error: ${err.message}`);
        process.exit(1);
    }
}

start();
