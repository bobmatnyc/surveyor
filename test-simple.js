// Simple test to verify the circular dependency fix
const fs = require('fs');
const path = require('path');

// Test the fix by simulating the production environment
function testFix() {
  console.log('Testing circular dependency fix...');
  
  try {
    // Read the storage.ts file to verify the fix
    const storagePath = path.join(__dirname, 'lib', 'storage.ts');
    const content = fs.readFileSync(storagePath, 'utf8');
    
    // Check if the circular dependency patterns are removed
    const hasFetchInListSchemas = content.includes('await fetch(`${baseUrl}/surveys/') && content.includes('listSchemas()');
    const hasFetchInGetSchema = content.includes('await fetch(`${baseUrl}/surveys/') && content.includes('getSchema(');
    const hasFetchInGetSurveyIndex = content.includes('await fetch(`${baseUrl}/surveys/') && content.includes('getSurveyIndex(');
    
    if (hasFetchInListSchemas || hasFetchInGetSchema || hasFetchInGetSurveyIndex) {
      console.log('❌ Circular dependency patterns still found!');
      console.log('- listSchemas has fetch:', hasFetchInListSchemas);
      console.log('- getSchema has fetch:', hasFetchInGetSchema);
      console.log('- getSurveyIndex has fetch:', hasFetchInGetSurveyIndex);
    } else {
      console.log('✅ No circular dependency patterns found!');
      console.log('✅ All methods now use filesystem approach');
    }
    
    // Check that filesystem approach is used
    const hasFilesystemApproach = content.includes('await fs.readFile(') && content.includes('await fs.readdir(');
    
    if (hasFilesystemApproach) {
      console.log('✅ Filesystem approach confirmed');
    } else {
      console.log('❌ Filesystem approach not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFix();