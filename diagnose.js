import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, 'startup-log.txt');

function log(msg) {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logFile, entry);
    console.log(msg);
}

log("--- DIAGNOSTIC START ---");
log(`Node Version: ${process.version}`);
log(`Working Dir: ${process.cwd()}`);
log(`Port Env: ${process.env.PORT}`);

// Check for build folder
const buildPath = path.join(__dirname, 'build');
if (fs.existsSync(buildPath)) {
    log(`✅ Found 'build' folder. Files: ${fs.readdirSync(buildPath)}`);
} else {
    log(`❌ 'build' FOLDER IS MISSING!`);
}

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    if (req.url === '/logs') {
        res.end(fs.readFileSync(logFile, 'utf8'));
    } else {
        res.end('Diagnostic server is running. Go to /logs to see the details.');
    }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    log(`📡 Diagnostic server listening on port ${port}`);
});
