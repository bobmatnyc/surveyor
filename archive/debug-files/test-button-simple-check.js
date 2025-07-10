/**
 * Simple button test to verify functionality
 */

const axios = require('axios');

async function testButton() {
  console.log('=== Simple Button Test ===');
  
  try {
    console.log('Testing survey page...');
    const response = await axios.get('http://localhost:3000/survey', {
      timeout: 5000
    });
    
    console.log('✅ Survey page loads (status:', response.status, ')');
    
    const content = response.data;
    const hasStartButton = content.includes('Start Survey');
    const hasForm = content.includes('<form');
    const hasButton = content.includes('<button');
    
    console.log('- Has Start Survey text:', hasStartButton);
    console.log('- Has form element:', hasForm);
    console.log('- Has button element:', hasButton);
    
    // Test the simplified test page
    console.log('\nTesting simplified page...');
    const testResponse = await axios.get('http://localhost:3000/survey/test', {
      timeout: 5000
    });
    
    console.log('✅ Test page loads (status:', testResponse.status, ')');
    
    console.log('\n🎉 Both pages are accessible!');
    console.log('📝 Next steps:');
    console.log('1. Open http://localhost:3000/survey in your browser');
    console.log('2. Open developer console (F12)');
    console.log('3. Try clicking the Start Survey button');
    console.log('4. Check console for debug messages');
    console.log('5. Try the test page at http://localhost:3000/survey/test');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('Make sure the dev server is running: npm run dev');
  }
}

testButton();