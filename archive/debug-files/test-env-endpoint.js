// Simple HTTP server to test environment variable loading
const http = require('http');

// Simulate Next.js environment loading
require('dotenv').config({ path: '.env.local' });

console.log('NODE_ENV at server start:', process.env.NODE_ENV || 'undefined');

const server = http.createServer((req, res) => {
  if (req.url === '/test-env') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      isDevelopment: process.env.NODE_ENV === 'development',
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('NODE'))
    }, null, 2));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3005, () => {
  console.log('Test server running on http://localhost:3005/test-env');
});