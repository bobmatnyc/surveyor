#!/usr/bin/env ts-node

import { FrontendQAAgent } from './index';
import { QAAgentConfig } from './types';
import { DEFAULT_QA_CONFIG } from './config';

interface QARunOptions {
  url?: string;
  routes?: boolean;
  config?: Partial<QAAgentConfig>;
}

async function runQA(options: QARunOptions = {}) {
  // Use the enhanced default configuration with MS Edge and visual browser mode
  const config = { ...DEFAULT_QA_CONFIG, ...options.config };
  const qaAgent = new FrontendQAAgent(config);

  try {
    console.log('🚀 Frontend QA Agent Starting...');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`🌐 Target URL: ${config.baseUrl}`);
    console.log(`⏱️  Timeout: ${config.testTimeout}ms`);
    console.log(`📱 Viewport: ${config.viewport?.width}x${config.viewport?.height}`);
    console.log(`🌍 Browser: ${config.browser} (${config.visualBrowserMode ? 'Visual' : 'Headless'} mode)`);
    console.log(`⏰ Visual Delay: ${config.visualInteractionDelay}ms`);
    console.log('═══════════════════════════════════════════════════════════════════');

    if (options.routes) {
      console.log('\n🔄 Running multi-route testing...');
      const reports = await qaAgent.runMultiRouteTest();
      console.log(`\n✅ Completed testing ${reports.length} routes`);
      
      // Generate summary of all routes
      const overallScore = reports.reduce((sum, report) => sum + report.overallScore, 0) / reports.length;
      console.log(`📊 Overall Multi-Route Score: ${overallScore.toFixed(1)}%`);
      
      const approvedRoutes = reports.filter(r => r.recommendation === 'APPROVE').length;
      const rejectedRoutes = reports.filter(r => r.recommendation === 'REJECT').length;
      const reviewRoutes = reports.filter(r => r.recommendation === 'NEEDS_REVIEW').length;
      
      console.log(`✅ Approved Routes: ${approvedRoutes}`);
      console.log(`❌ Rejected Routes: ${rejectedRoutes}`);
      console.log(`🔍 Review Required: ${reviewRoutes}`);
      
    } else {
      console.log('\n🎯 Running comprehensive QA analysis...');
      const report = await qaAgent.runComprehensiveQA(options.url);
      
      console.log('\n🎉 QA Analysis completed successfully!');
      console.log(`📊 Final Score: ${report.overallScore}%`);
      console.log(`🏆 Recommendation: ${report.recommendation}`);
    }

  } catch (error) {
    console.error('\n💥 QA Analysis failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: QARunOptions = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--url' && i + 1 < args.length) {
    options.url = args[i + 1];
    i++;
  } else if (arg === '--routes') {
    options.routes = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
🎯 Frontend QA Agent - Usage

Basic usage:
  npm run qa                    # Test default URL (http://localhost:3000)
  npm run qa -- --url <URL>    # Test specific URL
  npm run qa -- --routes       # Test multiple routes

Options:
  --url <URL>      Target URL to test
  --routes         Run multi-route testing
  --help, -h       Show this help message

Examples:
  npm run qa
  npm run qa -- --url http://localhost:3000
  npm run qa -- --routes
  npm run qa -- --url http://localhost:3000 --routes
`);
    process.exit(0);
  }
}

// Run the QA analysis
runQA(options);