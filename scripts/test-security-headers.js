#!/usr/bin/env node

/**
 * Security Headers Testing Script
 * Verifies all OWASP-compliant security headers are properly configured
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3002';

// Expected security headers and their validation patterns
const SECURITY_HEADERS = {
  'x-frame-options': /^(DENY|SAMEORIGIN|ALLOW-FROM .+)$/i,
  'x-content-type-options': /^nosniff$/i,
  'x-xss-protection': /^1; mode=block$/i,
  'strict-transport-security': /^max-age=\d+.*$/i,
  'content-security-policy': /^default-src\s+.*$/i,
  'referrer-policy': /^.+$/i,
  'permissions-policy': /^.*$/i,
  'x-dns-prefetch-control': /^(on|off)$/i,
};

// API-specific headers
const API_HEADERS = {
  'cache-control': /^no-store.*$/i,
  'pragma': /^no-cache$/i,
  'expires': /^0$/i,
};

/**
 * Make HTTP request and return headers
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, {
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent': 'Security-Headers-Test/1.0'
      }
    }, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.end();
  });
}

/**
 * Test security headers for a specific endpoint
 */
async function testSecurityHeaders(endpoint, isApi = false) {
  console.log(`\n🔍 Testing: ${endpoint}`);
  console.log('─'.repeat(60));
  
  try {
    const response = await makeRequest(endpoint);
    const headers = response.headers;
    
    let passed = 0;
    let failed = 0;
    let total = 0;
    
    // Test general security headers
    for (const [headerName, pattern] of Object.entries(SECURITY_HEADERS)) {
      total++;
      const headerValue = headers[headerName];
      
      if (headerValue && pattern.test(headerValue)) {
        console.log(`✅ ${headerName}: ${headerValue}`);
        passed++;
      } else {
        console.log(`❌ ${headerName}: ${headerValue || 'MISSING'}`);
        failed++;
      }
    }
    
    // Test API-specific headers if it's an API endpoint
    if (isApi) {
      for (const [headerName, pattern] of Object.entries(API_HEADERS)) {
        total++;
        const headerValue = headers[headerName];
        
        if (headerValue && pattern.test(headerValue)) {
          console.log(`✅ ${headerName}: ${headerValue}`);
          passed++;
        } else {
          console.log(`❌ ${headerName}: ${headerValue || 'MISSING'}`);
          failed++;
        }
      }
    }
    
    const score = Math.round((passed / total) * 100);
    console.log(`\n📊 Security Score: ${score}% (${passed}/${total} headers)`);
    
    return { passed, failed, total, score };
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}: ${error.message}`);
    return { passed: 0, failed: 1, total: 1, score: 0 };
  }
}

/**
 * Test rate limiting functionality
 */
async function testRateLimiting(endpoint) {
  console.log(`\n🚦 Testing Rate Limiting: ${endpoint}`);
  console.log('─'.repeat(60));
  
  const requests = [];
  const maxRequests = 10;
  
  // Send multiple requests quickly
  for (let i = 0; i < maxRequests; i++) {
    requests.push(makeRequest(endpoint));
  }
  
  try {
    const responses = await Promise.all(requests);
    let successCount = 0;
    let rateLimitedCount = 0;
    
    responses.forEach((response, index) => {
      if (response.statusCode === 200) {
        successCount++;
      } else if (response.statusCode === 429) {
        rateLimitedCount++;
      }
      console.log(`Request ${index + 1}: ${response.statusCode}`);
    });
    
    console.log(`\n📊 Rate Limiting Results:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`🚦 Rate Limited: ${rateLimitedCount}`);
    
    return { successCount, rateLimitedCount };
  } catch (error) {
    console.error(`❌ Error testing rate limiting: ${error.message}`);
    return { successCount: 0, rateLimitedCount: 0 };
  }
}

/**
 * Test CSP nonce functionality
 */
async function testCSPNonce(endpoint) {
  console.log(`\n🔐 Testing CSP Nonce: ${endpoint}`);
  console.log('─'.repeat(60));
  
  try {
    const response = await makeRequest(endpoint);
    const nonce = response.headers['x-nonce'];
    const csp = response.headers['content-security-policy'];
    
    if (nonce) {
      console.log(`✅ Nonce header present: ${nonce}`);
    } else {
      console.log(`❌ Nonce header missing`);
    }
    
    if (csp && csp.includes('nonce-')) {
      console.log(`✅ CSP contains nonce directive`);
    } else {
      console.log(`❌ CSP missing nonce directive`);
    }
    
    return { noncePresent: !!nonce, cspHasNonce: !!(csp && csp.includes('nonce-')) };
  } catch (error) {
    console.error(`❌ Error testing CSP nonce: ${error.message}`);
    return { noncePresent: false, cspHasNonce: false };
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🛡️  SECURITY HEADERS TESTING SUITE');
  console.log('═'.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  const testEndpoints = [
    { url: `${BASE_URL}/`, isApi: false, name: 'Home Page' },
    { url: `${BASE_URL}/survey`, isApi: false, name: 'Survey Page' },
    { url: `${BASE_URL}/admin`, isApi: false, name: 'Admin Page' },
    { url: `${BASE_URL}/api/surveys`, isApi: true, name: 'Surveys API' },
  ];
  
  const results = [];
  
  // Test each endpoint
  for (const endpoint of testEndpoints) {
    const result = await testSecurityHeaders(endpoint.url, endpoint.isApi);
    results.push({ ...result, name: endpoint.name, url: endpoint.url });
  }
  
  // Test rate limiting
  await testRateLimiting(`${BASE_URL}/api/surveys`);
  
  // Test CSP nonce
  await testCSPNonce(`${BASE_URL}/`);
  
  // Summary
  console.log('\n📊 OVERALL SECURITY SUMMARY');
  console.log('═'.repeat(60));
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;
  
  results.forEach(result => {
    totalPassed += result.passed;
    totalFailed += result.failed;
    totalTests += result.total;
    console.log(`${result.name}: ${result.score}% (${result.passed}/${result.total})`);
  });
  
  const overallScore = Math.round((totalPassed / totalTests) * 100);
  console.log(`\n🎯 Overall Security Score: ${overallScore}%`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`📊 Total Tests: ${totalTests}`);
  
  if (overallScore >= 90) {
    console.log('\n🎉 SECURITY COMPLIANCE: EXCELLENT');
  } else if (overallScore >= 70) {
    console.log('\n⚠️  SECURITY COMPLIANCE: GOOD');
  } else {
    console.log('\n❌ SECURITY COMPLIANCE: NEEDS IMPROVEMENT');
  }
  
  console.log('\n═'.repeat(60));
  console.log('🛡️  Security testing completed!');
}

// Run the tests
main().catch(console.error);