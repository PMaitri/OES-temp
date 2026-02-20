const http = require('http');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>🚀 Hostinger is Working!</h1><p>Manual mode is successful.</p>');
});

server.listen(port, () => {
    console.log(`Diagnostic server running at port ${port}`);
});
