import { SurveyDataManager } from '../../src/lib/storage';
import { sampleSurveySchema } from '../../src/lib/sample-survey';
import { SampleDataGenerator } from '../../src/lib/sample-data-generator';
import { AnalyticsGenerator } from '../../src/lib/analytics-generator';
import { promises as fs } from 'fs';
import path from 'path';

async function initializeData() {
  console.log('🚀 Initializing comprehensive survey data...');
  console.log('=====================================');
  
  try {
    const dataManager = SurveyDataManager.getInstance();
    const dataGenerator = SampleDataGenerator.getInstance();
    const analyticsGenerator = AnalyticsGenerator.getInstance();
    
    // Step 1: Clear existing data (development only)
    console.log('\n📦 Preparing data directories...');
    await dataManager.clearAllData();
    console.log('✅ Data directories cleared and prepared');
    
    // Step 2: Save the sample survey schema
    console.log('\n📋 Saving survey schema...');
    const schemaUrl = await dataManager.saveSchema(sampleSurveySchema);
    console.log('✅ Survey schema saved:', schemaUrl);
    
    // Step 3: Verify the schema was saved
    const savedSchema = await dataManager.getSchema(sampleSurveySchema.id);
    if (savedSchema) {
      console.log('✅ Schema verification successful:', savedSchema.name);
    } else {
      console.error('❌ Schema verification failed');
      process.exit(1);
    }
    
    // Step 4: Generate comprehensive sample data
    console.log('\n🏢 Generating comprehensive sample data...');
    const { organizations, responses, results } = dataGenerator.generateComprehensiveDataset(savedSchema);
    
    console.log(`📊 Generated data for ${organizations.length} organizations`);
    console.log(`📝 Generated ${responses.length} survey responses`);
    console.log(`📈 Generated ${results.length} survey results`);
    
    // Step 5: Save all responses
    console.log('\n💾 Saving survey responses...');
    let responseCount = 0;
    for (const response of responses) {
      await dataManager.saveResponse(response.surveyId, response.organizationId, response);
      responseCount++;
      if (responseCount % 10 === 0) {
        console.log(`  📝 Saved ${responseCount}/${responses.length} responses`);
      }
    }
    console.log(`✅ All ${responses.length} survey responses saved`);
    
    // Step 6: Save all results
    console.log('\n📊 Saving survey results...');
    for (const result of results) {
      await dataManager.saveResult(result.surveyId, result.organizationId, result);
    }
    console.log(`✅ All ${results.length} survey results saved`);
    
    // Step 7: Generate analytics and benchmarking data
    console.log('\n📈 Generating analytics and benchmarking data...');
    const benchmarkData = analyticsGenerator.generateBenchmarkData(
      savedSchema,
      results,
      organizations,
      responses
    );
    
    // Save benchmark data
    const benchmarkPath = path.join(process.cwd(), 'data', 'results', 'benchmark-data.json');
    await fs.writeFile(benchmarkPath, JSON.stringify(benchmarkData, null, 2));
    console.log('✅ Benchmark data saved to:', benchmarkPath);
    
    // Step 8: Generate detailed organization analyses
    console.log('\n🔍 Generating detailed organization analyses...');
    const orgAnalyses = [];
    for (const org of organizations) {
      const analysis = analyticsGenerator.generateDetailedOrgAnalysis(
        org.id,
        organizations,
        results,
        benchmarkData
      );
      orgAnalyses.push(analysis);
    }
    
    // Save organization analyses
    const analysesPath = path.join(process.cwd(), 'data', 'results', 'organization-analyses.json');
    await fs.writeFile(analysesPath, JSON.stringify(orgAnalyses, null, 2));
    console.log('✅ Organization analyses saved to:', analysesPath);
    
    // Step 9: Generate summary statistics
    console.log('\n📊 Generating summary statistics...');
    const summaryStats = {
      totalOrganizations: organizations.length,
      totalResponses: responses.length,
      totalResults: results.length,
      maturityDistribution: benchmarkData.maturityDistribution,
      sectorBreakdown: Object.keys(benchmarkData.sectorAnalysis).reduce((acc, sector) => {
        acc[sector] = benchmarkData.sectorAnalysis[sector].count;
        return acc;
      }, {} as Record<string, number>),
      sizeBreakdown: Object.keys(benchmarkData.organizationSizeAnalysis).reduce((acc, size) => {
        acc[size] = benchmarkData.organizationSizeAnalysis[size].count;
        return acc;
      }, {} as Record<string, number>),
      averageScoreOverall: benchmarkData.overallMetrics.averageScore,
      domainAverages: benchmarkData.domainAverages,
      completionRate: benchmarkData.overallMetrics.completionRate,
      generatedAt: new Date().toISOString()
    };
    
    const summaryPath = path.join(process.cwd(), 'data', 'results', 'summary-statistics.json');
    await fs.writeFile(summaryPath, JSON.stringify(summaryStats, null, 2));
    console.log('✅ Summary statistics saved to:', summaryPath);
    
    // Step 10: Verification and final checks
    console.log('\n🔍 Running final verification...');
    const verificationResults = await runVerificationChecks(dataManager, savedSchema, organizations.length);
    
    if (verificationResults.success) {
      console.log('✅ All verification checks passed');
    } else {
      console.error('❌ Verification failed:', verificationResults.errors);
      process.exit(1);
    }
    
    // Step 11: Display initialization summary
    console.log('\n🎉 Data initialization complete!');
    console.log('=====================================');
    console.log('📊 Summary:');
    console.log(`  • Organizations: ${organizations.length}`);
    console.log(`  • Survey Responses: ${responses.length}`);
    console.log(`  • Survey Results: ${results.length}`);
    console.log(`  • Maturity Levels:`);
    console.log(`    - Building: ${benchmarkData.maturityDistribution.building}`);
    console.log(`    - Emerging: ${benchmarkData.maturityDistribution.emerging}`);
    console.log(`    - Thriving: ${benchmarkData.maturityDistribution.thriving}`);
    console.log(`  • Average Score: ${benchmarkData.overallMetrics.averageScore.toFixed(2)}`);
    console.log(`  • Completion Rate: ${benchmarkData.overallMetrics.completionRate}%`);
    console.log('\n🚀 The surveyor platform is now ready for testing!');
    console.log('\n💡 You can now:');
    console.log('  • Access the admin dashboard to view results');
    console.log('  • Test survey completion flows');
    console.log('  • Explore analytics and benchmarking data');
    console.log('  • Review organization-specific analyses');
    
  } catch (error) {
    console.error('\n❌ Error initializing data:', error);
    console.error('Stack trace:', (error as Error).stack);
    process.exit(1);
  }
}

async function runVerificationChecks(
  dataManager: SurveyDataManager,
  schema: any,
  expectedOrgCount: number
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    // Check if schema exists
    const retrievedSchema = await dataManager.getSchema(schema.id);
    if (!retrievedSchema) {
      errors.push('Schema not found after initialization');
    }
    
    // Check if responses exist
    const allResponses = await dataManager.getAllResponses(schema.id);
    if (allResponses.length === 0) {
      errors.push('No responses found after initialization');
    }
    
    // Check if results exist
    const allResults = await dataManager.getAllResults(schema.id);
    if (allResults.length !== expectedOrgCount) {
      errors.push(`Expected ${expectedOrgCount} results, found ${allResults.length}`);
    }
    
    // Check if all required stakeholders have responses
    const stakeholderTypes = schema.stakeholders.map((s: any) => s.id);
    const responseStakeholders = Array.from(new Set(allResponses.map(r => r.stakeholder)));
    const missingStakeholders = stakeholderTypes.filter((type: string) => !responseStakeholders.includes(type));
    
    if (missingStakeholders.length > 0) {
      errors.push(`Missing responses for stakeholders: ${missingStakeholders.join(', ')}`);
    }
    
    // Check if all domains have data
    const domainIds = schema.domains.map((d: any) => d.id);
    const resultDomains = allResults.flatMap(r => Object.keys(r.domainScores));
    const uniqueResultDomains = Array.from(new Set(resultDomains));
    const missingDomains = domainIds.filter((domain: string) => !uniqueResultDomains.includes(domain));
    
    if (missingDomains.length > 0) {
      errors.push(`Missing domain data for: ${missingDomains.join(', ')}`);
    }
    
    // Check if files exist
    const expectedFiles = [
      'data/results/benchmark-data.json',
      'data/results/organization-analyses.json',
      'data/results/summary-statistics.json'
    ];
    
    for (const file of expectedFiles) {
      const filePath = path.join(process.cwd(), file);
      try {
        await fs.access(filePath);
      } catch {
        errors.push(`Expected file not found: ${file}`);
      }
    }
    
  } catch (error) {
    errors.push(`Verification error: ${(error as Error).message}`);
  }
  
  return {
    success: errors.length === 0,
    errors
  };
}

// Run initialization
initializeData();