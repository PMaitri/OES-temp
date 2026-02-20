/**
 * HOSTINGER MASTER ENTRY POINT
 */
console.log("🚀 OES Server starting...");

// Import the application bundle
import('./build/index.js').catch(err => {
    console.error("❌ FATAL: Could not load application bundle.");
    console.error(err);
    process.exit(1);
});
