/**
 * Production Button Test - Comprehensive debugging
 * Run this script to test the button functionality
 */

const axios = require('axios');
const fs = require('fs');

async function testProductionButton() {
  console.log('=== PRODUCTION BUTTON TEST ===');
  console.log('Testing at:', new Date().toISOString());
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      total: 0
    }
  };
  
  // Test 1: Check if survey page loads
  try {
    console.log('\n1. Testing survey page load...');
    const response = await axios.get('http://localhost:3000/survey', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TestBot/1.0)'
      }
    });
    
    const pageContent = response.data;
    const hasStartButton = pageContent.includes('Start Survey');
    const hasForm = pageContent.includes('<form');
    const hasButton = pageContent.includes('<button');
    
    const test1Result = {
      name: 'Survey Page Load',
      passed: response.status === 200,
      details: {
        status: response.status,
        hasStartButton,
        hasForm,
        hasButton,
        contentLength: pageContent.length
      }
    };
    
    testResults.tests.push(test1Result);
    if (test1Result.passed) testResults.summary.passed++;
    else testResults.summary.failed++;
    
    console.log('✅ Survey page loads successfully');
    console.log('- Start button found:', hasStartButton);
    console.log('- Form found:', hasForm);
    console.log('- Button element found:', hasButton);
    
  } catch (error) {
    console.error('❌ Survey page load failed:', error.message);
    testResults.tests.push({
      name: 'Survey Page Load',
      passed: false,
      error: error.message
    });
    testResults.summary.failed++;
  }
  
  // Test 2: Check test page
  try {
    console.log('\n2. Testing simplified test page...');
    const response = await axios.get('http://localhost:3000/survey/test', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TestBot/1.0)'
      }
    });
    
    const test2Result = {
      name: 'Test Page Load',
      passed: response.status === 200,
      details: {
        status: response.status,
        contentLength: response.data.length
      }
    };
    
    testResults.tests.push(test2Result);
    if (test2Result.passed) testResults.summary.passed++;
    else testResults.summary.failed++;
    
    console.log('✅ Test page loads successfully');
    
  } catch (error) {
    console.error('❌ Test page load failed:', error.message);
    testResults.tests.push({
      name: 'Test Page Load',
      passed: false,
      error: error.message
    });
    testResults.summary.failed++;
  }
  
  // Test 3: Check static survey data
  try {
    console.log('\n3. Testing static survey data...');
    const { getActiveSurveys } = require('./lib/static-surveys');
    const surveys = getActiveSurveys();
    
    const test3Result = {
      name: 'Static Survey Data',
      passed: surveys.length > 0,
      details: {
        surveyCount: surveys.length,
        firstSurvey: surveys[0]?.id || 'none'
      }
    };
    
    testResults.tests.push(test3Result);
    if (test3Result.passed) testResults.summary.passed++;
    else testResults.summary.failed++;
    
    console.log('✅ Static survey data loaded:', surveys.length, 'surveys');
    
  } catch (error) {
    console.error('❌ Static survey data failed:', error.message);
    testResults.tests.push({
      name: 'Static Survey Data',
      passed: false,
      error: error.message
    });
    testResults.summary.failed++;
  }
  
  testResults.summary.total = testResults.tests.length;
  
  // Save results
  const resultsFile = `test-results-${Date.now()}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  
  console.log('\n=== TEST SUMMARY ===');
  console.log('Total tests:', testResults.summary.total);
  console.log('Passed:', testResults.summary.passed);
  console.log('Failed:', testResults.summary.failed);
  console.log('Results saved to:', resultsFile);
  
  if (testResults.summary.failed === 0) {
    console.log('🎉 All tests passed! Button should be working.');
  } else {
    console.log('⚠️  Some tests failed. Check the issues above.');
  }
  
  return testResults;
}

if (require.main === module) {
  testProductionButton().catch(console.error);
}

module.exports = { testProductionButton };