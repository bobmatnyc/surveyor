#!/usr/bin/env ts-node
// Bundled Test Runner for Survey JSON Packages

import { BundledTestUtilities } from '../utils/bundled-test-utilities';

interface RunnerOptions {
  suite?: 'comprehensive' | 'edge-cases' | 'error-scenarios' | 'performance' | 'all';
  baseUrl?: string;
  environment?: 'development' | 'staging' | 'production';
  timeout?: number;
  verbose?: boolean;
  outputFile?: string;
}

class BundledTestRunner {
  private options: RunnerOptions;

  constructor(options: RunnerOptions = {}) {
    this.options = {
      suite: 'comprehensive',
      baseUrl: 'http://localhost:3000/api',
      environment: 'development',
      timeout: 30000,
      verbose: false,
      ...options
    };
  }

  async run(): Promise<void> {
    console.log('🧪 Bundled Test Runner Starting...');
    console.log(`Suite: ${this.options.suite}`);
    console.log(`Environment: ${this.options.environment}`);
    console.log(`Base URL: ${this.options.baseUrl}`);
    console.log('');

    const config = {
      baseUrl: this.options.baseUrl!,
      environment: this.options.environment!,
      timeout: this.options.timeout!
    };

    try {
      let result: any;

      switch (this.options.suite) {
        case 'comprehensive':
          result = await BundledTestUtilities.executeComprehensiveTestSuite(config);
          break;
        case 'edge-cases':
          result = await BundledTestUtilities.executeEdgeCaseTestSuite(config);
          break;
        case 'error-scenarios':
          result = await BundledTestUtilities.executeErrorScenarioTestSuite(config);
          break;
        case 'performance':
          result = await BundledTestUtilities.executePerformanceTestSuite(config);
          break;
        case 'all':
          result = await BundledTestUtilities.executeAllTestSuites(config);
          break;
        default:
          throw new Error(`Unknown test suite: ${this.options.suite}`);
      }

      this.displayResults(result);
      
      if (this.options.outputFile) {
        await this.saveResults(result);
      }

      // Exit with appropriate code
      const success = this.isSuccessful(result);
      process.exit(success ? 0 : 1);

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  private displayResults(result: any): void {
    console.log('\\n📊 Test Results Summary');
    console.log('========================');

    if (result.overall) {
      // All suites result
      console.log(`Overall Results:`);
      console.log(`  Total Tests: ${result.overall.totalTests}`);
      console.log(`  Passed: ${result.overall.totalPassed} ✅`);
      console.log(`  Failed: ${result.overall.totalFailed} ❌`);
      console.log(`  Skipped: ${result.overall.totalSkipped} ⏭️`);
      console.log(`  Success Rate: ${result.overall.overallSuccessRate.toFixed(2)}%`);
      console.log(`  Total Time: ${result.overall.totalExecutionTime}ms`);
      console.log('');

      console.log('Individual Suite Results:');
      ['comprehensive', 'edgeCases', 'errorScenarios', 'performance'].forEach(suite => {
        if (result[suite]) {
          console.log(`  ${suite}:`);
          console.log(`    Tests: ${result[suite].totalTests}`);
          console.log(`    Passed: ${result[suite].passedTests}`);
          console.log(`    Failed: ${result[suite].failedTests}`);
          console.log(`    Success Rate: ${result[suite].summary.successRate.toFixed(2)}%`);
        }
      });
    } else {
      // Single suite result
      console.log(`Suite: ${result.suiteName}`);
      console.log(`Total Tests: ${result.totalTests}`);
      console.log(`Passed: ${result.passedTests} ✅`);
      console.log(`Failed: ${result.failedTests} ❌`);
      console.log(`Skipped: ${result.skippedTests} ⏭️`);
      console.log(`Success Rate: ${result.summary.successRate.toFixed(2)}%`);
      console.log(`Average Response Time: ${result.summary.averageResponseTime.toFixed(2)}ms`);
      console.log(`Execution Time: ${result.executionTime}ms`);

      if (result.summary.errorsByCategory && Object.keys(result.summary.errorsByCategory).length > 0) {
        console.log('');
        console.log('Errors by Category:');
        Object.entries(result.summary.errorsByCategory).forEach(([category, count]) => {
          console.log(`  ${category}: ${count}`);
        });
      }
    }

    if (this.options.verbose && result.results) {
      console.log('\\n📋 Detailed Test Results');
      console.log('==========================');
      result.results.forEach((test: any) => {
        const status = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
        console.log(`${status} ${test.testName} (${test.duration}ms)`);
        if (test.error && this.options.verbose) {
          console.log(`    Error: ${test.error}`);
        }
      });
    }
  }

  private isSuccessful(result: any): boolean {
    if (result.overall) {
      return result.overall.totalFailed === 0;
    } else {
      return result.failedTests === 0;
    }
  }

  private async saveResults(result: any): Promise<void> {
    const fs = await import('fs/promises');
    const path = this.options.outputFile!;
    
    const output = {
      timestamp: new Date().toISOString(),
      options: this.options,
      results: result
    };

    await fs.writeFile(path, JSON.stringify(output, null, 2));
    console.log(`\\n💾 Results saved to: ${path}`);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: RunnerOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const value = args[i + 1];

    switch (arg) {
      case '--suite':
        options.suite = value as any;
        i++;
        break;
      case '--base-url':
        options.baseUrl = value;
        i++;
        break;
      case '--environment':
        options.environment = value as any;
        i++;
        break;
      case '--timeout':
        options.timeout = parseInt(value);
        i++;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--output-file':
        options.outputFile = value;
        i++;
        break;
      case '--help':
        console.log(`
Bundled Test Runner

Usage: ts-node bundled-test-runner.ts [options]

Options:
  --suite <suite>           Test suite to run (comprehensive, edge-cases, error-scenarios, performance, all)
  --base-url <url>          API base URL (default: http://localhost:3000/api)
  --environment <env>       Environment (development, staging, production)
  --timeout <ms>            Request timeout in milliseconds (default: 30000)
  --verbose                 Show detailed test results
  --output-file <path>      Save results to JSON file
  --help                    Show this help message

Examples:
  ts-node bundled-test-runner.ts --suite comprehensive
  ts-node bundled-test-runner.ts --suite all --verbose
  ts-node bundled-test-runner.ts --suite performance --base-url http://staging.example.com/api
        `);
        process.exit(0);
        break;
    }
  }

  const runner = new BundledTestRunner(options);
  runner.run().catch(error => {
    console.error('Runner failed:', error);
    process.exit(1);
  });
}

export { BundledTestRunner };
export default BundledTestRunner;