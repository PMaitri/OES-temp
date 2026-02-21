/**
 * HOSTINGER MASTER ENTRY POINT
 * This file serves as the main entry point for the application.
 * It is compatible with both ESM and CommonJS environments.
 */

import fs from 'fs';
import path from 'path';

console.log("🚀 OES Master Boot: Starting up...");
console.log("📍 Current Dir:", process.cwd());

const bundlePath = path.resolve('build/index.js');
console.log("👀 Looking for bundle at:", bundlePath);

if (fs.existsSync(bundlePath)) {
    console.log("✅ Bundle found, importing...");
    import('./build/index.js').catch(err => {
        console.error("❌ CRITICAL: Error inside application bundle.");
        console.error(err);
        process.exit(1);
    });
} else {
    console.error("❌ CRITICAL: build/index.js not found! Did the build step fail?");
    process.exit(1);
}
