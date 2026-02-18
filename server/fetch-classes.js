const http = require('http');
http.get('http://localhost:5000/api/public/classes', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log(data));
});
