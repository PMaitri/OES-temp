/**
 * ROBUST HOSTINGER ENTRY POINT (server.cjs)
 * Now with File System Explorer for debugging.
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

function listFiles(dir, depth = 0) {
    if (depth > 1) return [];
    try {
        const files = fs.readdirSync(dir);
        let result = [];
        for (const file of files) {
            const fullPath = join(dir, file);
            const isDir = fs.statSync(fullPath).isDirectory();
            result.push({ name: file, isDir, path: fullPath });
            if (isDir && !file.includes('node_modules') && !file.includes('.git')) {
                result.push(...listFiles(fullPath, depth + 1).map(f => ({ ...f, name: '  ' + f.name })));
            }
        }
        return result;
    } catch (e) {
        return [{ name: `Error reading ${dir}: ${e.message}`, isDir: false }];
    }
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
                cwd: process.cwd(),
                files: listFiles(process.cwd()),
                bundleError: bundleError ? bundleError.message : null,
                logs: logs
            });
        });

        app.use((req, res, next) => {
            if (globalThis.mainApp) {
                return globalThis.mainApp(req, res, next);
            }

            if (req.path === '/' || !req.path.startsWith('/api')) {
                const files = listFiles(process.cwd());
                const fileListHtml = files.map(f => `<div>${f.isDir ? '📁' : '📄'} ${f.name}</div>`).join('');

                return res.status(503).send(`
                    <html>
                        <body style="font-family: -apple-system, sans-serif; padding: 20px; background: #f0f2f5;">
                            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-width: 800px; margin: auto;">
                                <h1 style="color: #1a1a1a;">OES Startup Diagnostic</h1>
                                
                                <div style="margin: 20px 0; padding: 15px; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px;">
                                    <h3 style="color: #c53030;">Status: ${bundleError ? 'ERROR' : 'LOADING...'}</h3>
                                    ${bundleError ? `<p style="color: #742a2a; white-space: pre-wrap;"><b>Error:</b> ${bundleError.message}</p>` : '<p>The application is still initializing. Please wait.</p>'}
                                </div>

                                <div style="margin-top: 20px;">
                                    <h3>📁 Directory Structure (CWD: ${process.cwd()}):</h3>
                                    <div style="font-family: monospace; background: #2d3748; color: #a0aec0; padding: 15px; border-radius: 6px; max-height: 300px; overflow-y: auto;">
                                        ${fileListHtml}
                                    </div>
                                </div>

                                <div style="margin-top: 20px; text-align: center;">
                                    <button onclick="location.reload()" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                                        Refresh Status
                                    </button>
                                </div>
                                
                                <div style="margin-top: 20px; font-size: 0.8rem; color: #999;">
                                    <details>
                                        <summary>Show Recent Logs</summary>
                                        <pre style="white-space: pre-wrap; font-size: 0.7rem;">${logs.join('\n')}</pre>
                                    </details>
                                </div>
                            </div>
                            <script>if (!${!!bundleError}) setTimeout(() => location.reload(), 5000);</script>
                        </body>
                    </html>
                `);
            }
            res.status(503).json({ message: "Starting...", error: bundleError ? bundleError.message : "Loading bundle" });
        });

        const server = app.listen(port, () => {
            debugLog(`✅ Guardian listening on port ${port}`);

            // Search for bundle in multiple possible locations
            const possiblePaths = [
                join(process.cwd(), 'build', 'index.js'),
                join(process.cwd(), 'dist', 'index.js'),
                join(process.cwd(), 'index.js'), // Just in case it's in root
                resolve(__dirname, 'build', 'index.js')
            ];

            debugLog("🔍 Searching for application bundle...");
            let foundPath = null;
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    foundPath = p;
                    debugLog(`✅ Found at: ${p}`);
                    break;
                }
                debugLog(`❌ Not at: ${p}`);
            }

            if (foundPath) {
                const bundleUrl = `file://${foundPath.replace(/\\/g, '/')}`;
                import(bundleUrl).then(() => {
                    debugLog("✨ MAIN APP BUNDLE LOADED.");
                }).catch(err => {
                    bundleError = err;
                    debugLog(`❌ BUNDLE LOAD ERROR: ${err.message}`);
                    debugLog(err.stack);
                });
            } else {
                debugLog("⚠️ Bundle missing. Attempting emergency build...");
                try {
                    const { execSync } = require('child_process');
                    debugLog("🏗️ Running 'npm run build'...");
                    const output = execSync('npm run build', { encoding: 'utf8' });
                    debugLog("✅ Emergency build output: " + output.substring(0, 500) + "...");

                    if (fs.existsSync(resolve(__dirname, 'build', 'index.js'))) {
                        debugLog("🚀 Success! Bundle created. Restarting...");
                        process.exit(0); // Hostinger will restart the process and find the bundle
                    } else {
                        throw new Error("Build command finished but build/index.js is still missing.");
                    }
                } catch (e) {
                    bundleError = new Error(`Emergency build failed: ${e.message}. Files in root: ${fs.readdirSync(process.cwd()).join(', ')}`);
                    debugLog("❌ EMERGENCY BUILD FAILED.");
                }
            }
        });

    } catch (err) {
        debugLog(`❌ Fatal startup error: ${err.message}`);
        process.exit(1);
    }
}

start();
