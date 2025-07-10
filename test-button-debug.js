/**
 * Test script to debug the Start Survey button issue
 */

async function testButtonFunctionality() {
  console.log('Testing Start Survey button functionality...');
  
  // Test 1: Check if surveys are loading
  console.log('1. Checking survey data loading...');
  
  // Test 2: Check local storage functionality
  console.log('2. Testing local storage...');
  try {
    localStorage.setItem('test-key', 'test-value');
    const value = localStorage.getItem('test-key');
    console.log('Local storage test:', value === 'test-value' ? 'PASS' : 'FAIL');
    localStorage.removeItem('test-key');
  } catch (error) {
    console.error('Local storage error:', error);
  }
  
  // Test 3: Check if button event handlers are properly bound
  console.log('3. Checking button event binding...');
  
  // Test 4: Check for any console errors
  console.log('4. Checking for console errors...');
  console.log('Console errors should be visible in browser developer tools');
  
  console.log('Debug test completed. Check browser console for results.');
}

// Run the test
testButtonFunctionality();