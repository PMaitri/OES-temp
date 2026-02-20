import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logPath = join(__dirname, 'hostinger-debug.log');

function quickLog(msg) {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
}

quickLog("APPLICATION ATTEMPTING STARTUP");

try {
    const port = process.env.PORT || 3000;
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Server is Alive</h1><p>Check hostinger-debug.log in File Manager for details.</p>');
    });

    server.listen(port, () => {
        quickLog(`SUCCESS: Listening on port ${port}`);
    });
} catch (err) {
    quickLog(`FATAL ERROR: ${err.message}`);
    quickLog(err.stack);
}
