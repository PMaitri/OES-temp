try {
    console.log("Starting server from server.js...");
    await import('./dist/index.js');
} catch (err) {
    console.error("FATAL STARTUP ERROR:", err);
    // Keep process alive for a while so we can see error instead of 503
    setTimeout(() => {
        process.exit(1);
    }, 30000);
}
