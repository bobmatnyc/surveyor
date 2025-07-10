// Use built-in fetch

async function testProductionFix() {
  const baseUrl = 'https://surveyor-1-m.vercel.app';
  
  console.log('Testing production fix...\n');
  
  // Test 1: Check if survey index is accessible
  console.log('1. Testing survey index access...');
  try {
    const indexResponse = await fetch(`${baseUrl}/surveys/index.json`);
    if (indexResponse.ok) {
      const indexData = await indexResponse.json();
      console.log('✅ Survey index accessible');
      console.log('   Surveys in index:', indexData.surveys.length);
    } else {
      console.log('❌ Survey index not accessible:', indexResponse.status);
    }
  } catch (error) {
    console.log('❌ Error accessing survey index:', error.message);
  }
  
  // Test 2: Check if individual survey schemas are accessible
  console.log('\n2. Testing individual survey access...');
  const surveyIds = ['jim-joseph-tech-maturity-v1', 'demo-survey-showcase'];
  
  for (const surveyId of surveyIds) {
    try {
      const surveyResponse = await fetch(`${baseUrl}/surveys/${surveyId}.json`);
      if (surveyResponse.ok) {
        const surveyData = await surveyResponse.json();
        console.log(`✅ Survey ${surveyId} accessible`);
        console.log(`   Name: ${surveyData.name}`);
        console.log(`   Active: ${surveyData.isActive}`);
      } else {
        console.log(`❌ Survey ${surveyId} not accessible:`, surveyResponse.status);
      }
    } catch (error) {
      console.log(`❌ Error accessing survey ${surveyId}:`, error.message);
    }
  }
  
  // Test 3: Check API response
  console.log('\n3. Testing API response...');
  try {
    const apiResponse = await fetch(`${baseUrl}/api/surveys`);
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ API accessible');
      console.log('   Surveys returned:', apiData.length);
      if (apiData.length > 0) {
        console.log('   First survey:', apiData[0].name);
      }
    } else {
      console.log('❌ API not accessible:', apiResponse.status);
    }
  } catch (error) {
    console.log('❌ Error accessing API:', error.message);
  }
  
  console.log('\nTest complete.');
}

testProductionFix().catch(console.error);