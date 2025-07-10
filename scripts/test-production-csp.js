#!/usr/bin/env node

/**
 * Test script to verify CSP configuration in production mode
 */

// Temporarily set NODE_ENV to production for testing
process.env.NODE_ENV = 'production';

const { generateCSP } = require('../lib/security');

function testProductionCSP() {
  console.log('🔍 Testing Production CSP Configuration...\n');
  
  // Test regular page CSP
  const pageCSP = generateCSP({ nonce: 'test-nonce-123' });
  console.log('Page CSP (Production):');
  console.log(pageCSP);
  
  // Should not contain unsafe-eval in production
  if (pageCSP.includes('unsafe-eval')) {
    console.log('❌ ERROR: unsafe-eval found in production CSP');
    return false;
  } else {
    console.log('✅ PASS: No unsafe-eval in production CSP');
  }
  
  // Should contain nonce
  if (pageCSP.includes('nonce-test-nonce-123')) {
    console.log('✅ PASS: Nonce properly included');
  } else {
    console.log('❌ ERROR: Nonce not found in production CSP');
    return false;
  }
  
  // Should not contain WebSocket connections in production
  if (pageCSP.includes('ws:') || pageCSP.includes('wss:')) {
    console.log('❌ ERROR: WebSocket connections allowed in production');
    return false;
  } else {
    console.log('✅ PASS: No WebSocket connections in production CSP');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test API CSP
  const apiCSP = generateCSP({ isDevelopment: false, isAPI: true });
  console.log('API CSP (Production):');
  console.log(apiCSP);
  
  // Should be very restrictive for API
  if (apiCSP.includes("default-src 'none'")) {
    console.log('✅ PASS: API CSP is restrictive (default-src none)');
  } else {
    console.log('❌ ERROR: API CSP is not restrictive enough');
    return false;
  }
  
  console.log('\n✅ All production CSP tests passed!');
  return true;
}

function testDevelopmentCSP() {
  console.log('\n🔍 Testing Development CSP Configuration...\n');
  
  // Test development page CSP
  const devPageCSP = generateCSP({ nonce: 'test-nonce-456', isDevelopment: true });
  console.log('Page CSP (Development):');
  console.log(devPageCSP);
  
  // Should contain unsafe-eval in development
  if (devPageCSP.includes('unsafe-eval')) {
    console.log('✅ PASS: unsafe-eval allowed in development CSP');
  } else {
    console.log('❌ ERROR: unsafe-eval not found in development CSP');
    return false;
  }
  
  // Should contain WebSocket connections in development
  if (devPageCSP.includes('ws:') && devPageCSP.includes('wss:')) {
    console.log('✅ PASS: WebSocket connections allowed in development');
  } else {
    console.log('❌ ERROR: WebSocket connections not allowed in development');
    return false;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test development API CSP
  const devApiCSP = generateCSP({ isDevelopment: true, isAPI: true });
  console.log('API CSP (Development):');
  console.log(devApiCSP);
  
  // Should allow unsafe-eval even for API in development
  if (devApiCSP.includes('unsafe-eval')) {
    console.log('✅ PASS: unsafe-eval allowed in development API CSP');
  } else {
    console.log('❌ ERROR: unsafe-eval not allowed in development API CSP');
    return false;
  }
  
  console.log('\n✅ All development CSP tests passed!');
  return true;
}

async function main() {
  console.log('🛡️  CSP Security Configuration Test Suite\n');
  
  let allPassed = true;
  
  // Test production configuration
  if (!testProductionCSP()) {
    allPassed = false;
  }
  
  // Test development configuration
  if (!testDevelopmentCSP()) {
    allPassed = false;
  }
  
  if (allPassed) {
    console.log('\n🎉 All CSP tests passed! Security configuration is working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some CSP tests failed. Please review the configuration.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}