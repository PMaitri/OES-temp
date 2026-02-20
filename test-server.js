import http from 'http';

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>🚀 Hostinger is Working!</h1><p>If you see this, the server is alive. The problem is in the main application code or database.</p>');
});

server.listen(port, () => {
    console.log(`Test server running at port ${port}`);
});
