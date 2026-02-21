/**
 * ROBUST HOSTINGER ENTRY POINT (server.cjs)
 * Now with on-screen error reporting.
 */

const express = require('express');
const { join, resolve } = require('path');
const fs = require('fs');

const logs = [];
function debugLog(msg) {
    const entry = `${new Date().toISOString()} - ${msg}`;
    console.log(entry);
    logs.push(entry);
    if (logs.length > 200) logs.shift();
}

async function start() {
    debugLog("🚀 server.cjs starting...");
    const port = process.env.PORT || 3000;
    let bundleError = null;

    try {
        const app = express();

        app.get('/_health', (req, res) => res.status(200).send('HEALTHY'));

        app.get('/_debug', (req, res) => {
            res.json({
                status: globalThis.mainApp ? "READY" : "LOADING",
                bundleError: bundleError ? bundleError.message : null,
                bundleStack: bundleError ? bundleError.stack : null,
                logs: logs
            });
        });

        app.use((req, res, next) => {
            if (globalThis.mainApp) {
                return globalThis.mainApp(req, res, next);
            }

            if (req.path === '/' || !req.path.startsWith('/api')) {
                return res.status(503).send(`
                    <html>
                        <body style="font-family: -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, helvetica, arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #f0f2f5; margin: 0; padding: 20px; text-align: center;">
                            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; width: 100%;">
                                <h1 style="color: #1a1a1a; margin-bottom: 8px;">OES is Powering Up</h1>
                                <p style="color: #666; font-size: 1.1rem; margin-bottom: 24px;">Please wait while we initialize the system. This usually takes 10-20 seconds.</p>
                                
                                ${bundleError ? `
                                    <div style="background: #fff5f5; border: 1px solid #feb2b2; padding: 16px; border-radius: 8px; text-align: left; margin-bottom: 24px;">
                                        <h3 style="color: #c53030; margin-top: 0;">⚠️ Startup Error Detected:</h3>
                                        <code style="font-family: monospace; display: block; white-space: pre-wrap; font-size: 0.9rem; color: #742a2a;">${bundleError.message}</code>
                                        <details style="margin-top: 10px; cursor: pointer;">
                                            <summary style="font-size: 0.8rem; color: #9b2c2c;">Show Technical Details</summary>
                                            <pre style="font-size: 0.7rem; color: #9b2c2c; mt: 8px; overflow-x: auto;">${bundleError.stack}</pre>
                                        </details>
                                    </div>
                                ` : `
                                    <div style="display: flex; justify-content: center; margin-bottom: 24px;">
                                        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 48px; height: 48px; animation: spin 1s linear infinite;"></div>
                                    </div>
                                `}

                                <button onclick="location.reload()" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                                    Refresh Page
                                </button>
                                
                                <div style="margin-top: 24px; font-size: 0.8rem; color: #999;">
                                    Status: ${globalThis.mainApp ? "Ready" : "Loading..."} | Instance ID: ${process.pid}
                                </div>
                            </div>
                            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                            <script>if (!${!!bundleError}) setTimeout(() => location.reload(), 5000);</script>
                        </body>
                    </html>
                `);
            }
            res.status(503).json({
                message: "Server is starting.",
                error: bundleError ? bundleError.message : "Initialization in progress"
            });
        });

        const server = app.listen(port, () => {
            debugLog(`✅ Guardian listening on port ${port}`);

            const bundlePath = join(process.cwd(), 'build', 'index.js');
            if (fs.existsSync(bundlePath)) {
                debugLog("📦 Bundle found, importing...");

                // Try importing WITHOUT file:// first, then with it if it fails
                const performImport = async (path) => {
                    try {
                        await import(path);
                        debugLog("✨ MAIN APP BUNDLE IMPORTED.");
                    } catch (err) {
                        debugLog(`❌ IMPORT ATTEMPT FAILED (${path}): ${err.message}`);
                        throw err;
                    }
                };

                performImport('./build/index.js')
                    .catch(() => performImport(`file://${bundlePath.replace(/\\/g, '/')}`))
                    .catch(err => {
                        bundleError = err;
                        debugLog(`❌ FATAL BUNDLE ERROR: ${err.message}`);
                        debugLog(err.stack);
                    });
            } else {
                bundleError = new Error("Main application bundle (build/index.js) not found. Please ensure the build process completed successfully.");
                debugLog("❌ ERROR: Main app bundle not found.");
            }
        });

    } catch (err) {
        debugLog(`❌ Fatal startup error: ${err.message}`);
        process.exit(1);
    }
}

start();
