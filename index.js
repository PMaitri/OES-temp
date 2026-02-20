/**
 * MASTER ENTRY POINT FOR HOSTINGER
 * This file just imports the compiled server bundle.
 */
console.log("🚀 Powering up the OES Server...");

import('./build/index.js').catch(err => {
    console.error("❌ CRITICAL: Could not load the main application bundle.");
    console.error(err);
    process.exit(1);
});
