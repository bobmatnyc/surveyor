// Simple test to verify the circular dependency fix
import { SurveyDataManager } from './lib/storage';

async function testFix() {
  console.log('Testing circular dependency fix...');
  
  try {
    const dataManager = SurveyDataManager.getInstance();
    
    // Test listSchemas method
    console.log('Testing listSchemas...');
    const schemas = await dataManager.listSchemas();
    console.log(`Found ${schemas.length} schemas:`);
    schemas.forEach(schema => {
      console.log(`- ${schema.name} (${schema.id})`);
    });
    
    // Test getSurveyIndex method
    console.log('\nTesting getSurveyIndex...');
    const index = await dataManager.getSurveyIndex();
    console.log(`Index contains ${index.surveys.length} survey entries`);
    
    // Test getSchema method
    if (schemas.length > 0) {
      console.log('\nTesting getSchema...');
      const schema = await dataManager.getSchema(schemas[0].id);
      console.log(`Retrieved schema: ${schema ? schema.name : 'null'}`);
    }
    
    console.log('\n✅ All tests passed - no circular dependency!');
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

testFix();