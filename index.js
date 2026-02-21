/**
 * HOSTINGER MASTER ENTRY POINT
 * This file serves as the main entry point for the application.
 * It is compatible with both ESM and CommonJS environments.
 */

console.log("🚀 OES Master Boot: Starting up...");

// Use dynamic import to load the compiled server bundle
import('./build/index.js').catch(err => {
    console.error("❌ CRITICAL: Could not load application bundle.");
    console.error(err);
    process.exit(1);
});
