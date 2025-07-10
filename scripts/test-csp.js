#!/usr/bin/env node

/**
 * Test script to verify CSP configuration
 */

const http = require('http');
const url = require('url');

function testCSP(baseUrl, endpoint = '/') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.parse(baseUrl).hostname,
      port: url.parse(baseUrl).port || 80,
      path: endpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'CSP-Test-Agent/1.0'
      }
    };

    const req = http.request(options, (res) => {
      const cspHeader = res.headers['content-security-policy'];
      
      resolve({
        status: res.statusCode,
        csp: cspHeader,
        headers: res.headers
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Testing CSP Configuration...\n');
  
  const testUrls = [
    { name: 'Homepage', url: 'http://localhost:3002/' },
    { name: 'Survey Page', url: 'http://localhost:3002/survey' },
    { name: 'API Endpoint', url: 'http://localhost:3002/api/surveys' }
  ];

  for (const test of testUrls) {
    try {
      console.log(`Testing ${test.name}...`);
      const result = await testCSP(test.url);
      
      if (result.csp) {
        console.log(`✅ CSP Header found: ${result.csp}`);
        
        // Check for development-specific directives
        if (result.csp.includes('unsafe-eval')) {
          console.log('  ✅ Development mode: unsafe-eval allowed');
        } else {
          console.log('  ⚠️  Production mode: unsafe-eval not allowed');
        }
        
        if (result.csp.includes('nonce-')) {
          console.log('  ✅ Nonce-based CSP detected');
        }
        
        if (result.csp.includes('ws:') || result.csp.includes('wss:')) {
          console.log('  ✅ WebSocket connections allowed for hot reloading');
        }
      } else {
        console.log('❌ No CSP header found');
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ Error testing ${test.name}: ${error.message}\n`);
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCSP };