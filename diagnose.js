const fs = require('fs');
const http = require('http');
const path = require('path');

const logFile = path.join(__dirname, 'startup-log.txt');

function log(msg) {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logFile, entry);
    console.log(msg);
}

log("--- DIAGNOSTIC START (CJS) ---");
log(`Node Version: ${process.version}`);
log(`Working Dir: ${process.cwd()}`);
log(`Port Env: ${process.env.PORT}`);

// Check for build folder
const buildPath = path.join(__dirname, 'build');
if (fs.existsSync(buildPath)) {
    log(`✅ Found 'build' folder.`);
    try {
        log(`Files in build: ${fs.readdirSync(buildPath)}`);
    } catch (e) {
        log(`Error reading build: ${e.message}`);
    }
} else {
    log(`❌ 'build' FOLDER IS MISSING!`);
}

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    if (req.url === '/logs') {
        if (fs.existsSync(logFile)) {
            res.end(fs.readFileSync(logFile, 'utf8'));
        } else {
            res.end('Log file not found yet.');
        }
    } else {
        res.end('Diagnostic server (CJS) is running. Go to /logs to see the details.');
    }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    log(`📡 Diagnostic server listening on port ${port}`);
});
