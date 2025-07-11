#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface TestSuite {
  name: string;
  description: string;
  path: string;
  category: 'core' | 'performance' | 'security' | 'integration';
  timeout: number;
  retries: number;
  critical: boolean;
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  tests: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  errors?: string[];
}

interface TestReport {
  timestamp: string;
  environment: string;
  totalDuration: number;
  overallStatus: 'PASS' | 'FAIL' | 'PARTIAL';
  summary: {
    totalSuites: number;
    passedSuites: number;
    failedSuites: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
  };
  results: TestResult[];
  coverage: {
    overall: number;
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  criticalFailures: string[];
}

class ComprehensiveTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Core Survey Endpoints',
      description: 'Comprehensive tests for core survey API endpoints',
      path: 'tests/api/comprehensive/survey-endpoints.test.ts',
      category: 'core',
      timeout: 300000, // 5 minutes
      retries: 2,
      critical: true
    },
    {
      name: 'Survey Step Endpoints',
      description: 'Comprehensive tests for survey step API endpoints',
      path: 'tests/api/comprehensive/survey-step-endpoints.test.ts',
      category: 'core',
      timeout: 300000,
      retries: 2,
      critical: true
    },
    {
      name: 'Admin Endpoints',
      description: 'Comprehensive tests for admin API endpoints',
      path: 'tests/api/comprehensive/admin-endpoints.test.ts',
      category: 'core',
      timeout: 400000, // 6.5 minutes
      retries: 2,
      critical: false
    },
    {
      name: 'Stakeholder Endpoints',
      description: 'Tests for stakeholder-related endpoints',
      path: 'tests/api/stakeholder-endpoints.test.ts',
      category: 'core',
      timeout: 200000,
      retries: 2,
      critical: true
    },
    {
      name: 'Load Testing Suite',
      description: 'Performance and load testing for all endpoints',
      path: 'tests/api/performance/load-test-suite.test.ts',
      category: 'performance',
      timeout: 600000, // 10 minutes
      retries: 1,
      critical: false
    },
    {
      name: 'Security Test Suite',
      description: 'Security vulnerability and penetration testing',
      path: 'tests/api/security/security-test-suite.test.ts',
      category: 'security',
      timeout: 300000,
      retries: 2,
      critical: true
    },
    {
      name: 'Integration Tests',
      description: 'End-to-end integration tests',
      path: 'tests/api/survey-step-integration.test.ts',
      category: 'integration',
      timeout: 200000,
      retries: 2,
      critical: true
    }
  ];

  private reportDir: string;
  private environment: string;

  constructor() {
    this.reportDir = join(process.cwd(), 'tests', 'reports', 'comprehensive');
    this.environment = process.env.NODE_ENV || 'test';
    
    // Ensure report directory exists
    if (!existsSync(this.reportDir)) {
      mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async runAllTests(): Promise<TestReport> {
    const startTime = Date.now();
    const results: TestResult[] = [];
    const criticalFailures: string[] = [];

    console.log('🚀 Starting Comprehensive API Test Suite');
    console.log(`📊 Environment: ${this.environment}`);
    console.log(`📁 Report Directory: ${this.reportDir}`);
    console.log(`🧪 Total Test Suites: ${this.testSuites.length}`);
    console.log('=' .repeat(60));

    // Run test suites based on category priority
    const categories = ['core', 'security', 'integration', 'performance'];
    
    for (const category of categories) {
      const categorySuites = this.testSuites.filter(suite => suite.category === category);
      console.log(`\n📋 Running ${category.toUpperCase()} tests (${categorySuites.length} suites)`);
      
      for (const suite of categorySuites) {
        const result = await this.runTestSuite(suite);
        results.push(result);
        
        if (!result.passed && suite.critical) {
          criticalFailures.push(suite.name);
        }
        
        // Stop if critical test fails
        if (criticalFailures.length > 0 && category === 'core') {
          console.log(`❌ Critical test failure detected. Stopping execution.`);
          break;
        }
      }
      
      // Stop if critical failures in core tests
      if (criticalFailures.length > 0 && category === 'core') {
        break;
      }
    }

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    // Generate test report
    const report = this.generateTestReport(results, totalDuration, criticalFailures);
    
    // Save report
    await this.saveTestReport(report);
    
    // Print summary
    this.printTestSummary(report);
    
    return report;
  }

  private async runTestSuite(suite: TestSuite): Promise<TestResult> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: string | null = null;

    console.log(`\n🧪 Running: ${suite.name}`);
    console.log(`   📝 ${suite.description}`);
    console.log(`   📁 ${suite.path}`);
    console.log(`   ⏱️  Timeout: ${suite.timeout / 1000}s`);

    while (attempt <= suite.retries) {
      try {
        const command = `npx vitest run ${suite.path} --reporter=json --timeout=${suite.timeout}`;
        const output = execSync(command, { 
          cwd: process.cwd(),
          encoding: 'utf8',
          timeout: suite.timeout + 30000 // Add 30s buffer
        });

        const testOutput = this.parseVitestOutput(output);
        const endTime = Date.now();
        const duration = endTime - startTime;

        const result: TestResult = {
          suite: suite.name,
          passed: testOutput.success,
          duration,
          tests: {
            total: testOutput.numTotalTests,
            passed: testOutput.numPassedTests,
            failed: testOutput.numFailedTests,
            skipped: testOutput.numPendingTests
          },
          coverage: testOutput.coverage,
          errors: testOutput.errors
        };

        console.log(`   ✅ ${result.passed ? 'PASSED' : 'FAILED'} (${duration}ms)`);
        console.log(`   📊 Tests: ${result.tests.passed}/${result.tests.total} passed`);
        
        return result;

      } catch (error) {
        attempt++;
        lastError = error instanceof Error ? error.message : String(error);
        
        if (attempt <= suite.retries) {
          console.log(`   ⚠️  Attempt ${attempt} failed, retrying...`);
          console.log(`   📝 Error: ${lastError}`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
        }
      }
    }

    // All attempts failed
    const endTime = Date.now();
    const duration = endTime - startTime;

    const result: TestResult = {
      suite: suite.name,
      passed: false,
      duration,
      tests: {
        total: 0,
        passed: 0,
        failed: 1,
        skipped: 0
      },
      errors: [lastError || 'Unknown error']
    };

    console.log(`   ❌ FAILED after ${suite.retries + 1} attempts (${duration}ms)`);
    console.log(`   📝 Final Error: ${lastError}`);

    return result;
  }

  private parseVitestOutput(output: string): any {
    try {
      // Parse JSON output from Vitest
      const lines = output.split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{'));
      
      if (jsonLine) {
        return JSON.parse(jsonLine);
      }
      
      // Fallback parsing
      return {
        success: output.includes('PASSED') && !output.includes('FAILED'),
        numTotalTests: this.extractNumber(output, /(\d+) tests?/),
        numPassedTests: this.extractNumber(output, /(\d+) passed/),
        numFailedTests: this.extractNumber(output, /(\d+) failed/),
        numPendingTests: this.extractNumber(output, /(\d+) skipped/),
        errors: output.includes('FAILED') ? [output] : []
      };
    } catch (error) {
      return {
        success: false,
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 1,
        numPendingTests: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private extractNumber(text: string, pattern: RegExp): number {
    const match = text.match(pattern);
    return match ? parseInt(match[1], 10) : 0;
  }

  private generateTestReport(results: TestResult[], totalDuration: number, criticalFailures: string[]): TestReport {
    const totalSuites = results.length;
    const passedSuites = results.filter(r => r.passed).length;
    const failedSuites = totalSuites - passedSuites;
    
    const totalTests = results.reduce((sum, r) => sum + r.tests.total, 0);
    const passedTests = results.reduce((sum, r) => sum + r.tests.passed, 0);
    const failedTests = results.reduce((sum, r) => sum + r.tests.failed, 0);
    const skippedTests = results.reduce((sum, r) => sum + r.tests.skipped, 0);

    // Calculate overall coverage
    const coverageResults = results.filter(r => r.coverage);
    const overallCoverage = coverageResults.length > 0 ? {
      overall: coverageResults.reduce((sum, r) => sum + (r.coverage?.statements || 0), 0) / coverageResults.length,
      lines: coverageResults.reduce((sum, r) => sum + (r.coverage?.lines || 0), 0) / coverageResults.length,
      functions: coverageResults.reduce((sum, r) => sum + (r.coverage?.functions || 0), 0) / coverageResults.length,
      branches: coverageResults.reduce((sum, r) => sum + (r.coverage?.branches || 0), 0) / coverageResults.length,
      statements: coverageResults.reduce((sum, r) => sum + (r.coverage?.statements || 0), 0) / coverageResults.length
    } : {
      overall: 0,
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0
    };

    const overallStatus: 'PASS' | 'FAIL' | 'PARTIAL' = 
      criticalFailures.length > 0 ? 'FAIL' :
      failedSuites === 0 ? 'PASS' : 'PARTIAL';

    return {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      totalDuration,
      overallStatus,
      summary: {
        totalSuites,
        passedSuites,
        failedSuites,
        totalTests,
        passedTests,
        failedTests,
        skippedTests
      },
      results,
      coverage: overallCoverage,
      criticalFailures
    };
  }

  private async saveTestReport(report: TestReport): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(this.reportDir, `comprehensive-test-report-${timestamp}.json`);
    const htmlReportPath = join(this.reportDir, `comprehensive-test-report-${timestamp}.html`);
    
    // Save JSON report
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHtmlReport(report);
    writeFileSync(htmlReportPath, htmlReport);
    
    // Save latest report
    const latestJsonPath = join(this.reportDir, 'latest-report.json');
    const latestHtmlPath = join(this.reportDir, 'latest-report.html');
    writeFileSync(latestJsonPath, JSON.stringify(report, null, 2));
    writeFileSync(latestHtmlPath, htmlReport);
    
    console.log(`\n📊 Test reports saved:`);
    console.log(`   📄 JSON: ${reportPath}`);
    console.log(`   🌐 HTML: ${htmlReportPath}`);
    console.log(`   📄 Latest JSON: ${latestJsonPath}`);
    console.log(`   🌐 Latest HTML: ${latestHtmlPath}`);
  }

  private generateHtmlReport(report: TestReport): string {
    const statusColor = report.overallStatus === 'PASS' ? '#22c55e' : 
                       report.overallStatus === 'FAIL' ? '#ef4444' : '#f59e0b';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive API Test Report - ${report.timestamp}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: ${statusColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1f2937; }
        .metric-label { font-size: 14px; color: #6b7280; margin-top: 4px; }
        .test-suite { border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 20px; overflow: hidden; }
        .suite-header { background: #f9fafb; padding: 15px; border-bottom: 1px solid #e5e7eb; }
        .suite-name { font-weight: 600; color: #1f2937; }
        .suite-status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .status-pass { background: #dcfce7; color: #166534; }
        .status-fail { background: #fef2f2; color: #991b1b; }
        .suite-details { padding: 15px; }
        .coverage-bar { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin-top: 10px; }
        .coverage-fill { background: #22c55e; height: 100%; transition: width 0.3s ease; }
        .error-list { background: #fef2f2; padding: 15px; border-radius: 6px; margin-top: 10px; }
        .error-item { color: #991b1b; font-family: monospace; font-size: 14px; margin-bottom: 5px; }
        .critical-failures { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .critical-failures h3 { color: #991b1b; margin-top: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Comprehensive API Test Report</h1>
            <p>Status: ${report.overallStatus} | Environment: ${report.environment} | Duration: ${(report.totalDuration / 1000).toFixed(2)}s</p>
            <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="content">
            ${report.criticalFailures.length > 0 ? `
            <div class="critical-failures">
                <h3>⚠️ Critical Failures</h3>
                <ul>
                    ${report.criticalFailures.map(failure => `<li>${failure}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            <div class="summary">
                <div class="metric">
                    <div class="metric-value">${report.summary.totalSuites}</div>
                    <div class="metric-label">Total Suites</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${report.summary.passedSuites}</div>
                    <div class="metric-label">Passed Suites</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${report.summary.totalTests}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${report.summary.passedTests}</div>
                    <div class="metric-label">Passed Tests</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${report.coverage.overall.toFixed(1)}%</div>
                    <div class="metric-label">Coverage</div>
                </div>
            </div>
            
            <h2>Test Suite Results</h2>
            ${report.results.map(result => `
            <div class="test-suite">
                <div class="suite-header">
                    <span class="suite-name">${result.suite}</span>
                    <span class="suite-status ${result.passed ? 'status-pass' : 'status-fail'}">
                        ${result.passed ? 'PASSED' : 'FAILED'}
                    </span>
                    <span style="float: right; color: #6b7280;">${(result.duration / 1000).toFixed(2)}s</span>
                </div>
                <div class="suite-details">
                    <p><strong>Tests:</strong> ${result.tests.passed}/${result.tests.total} passed</p>
                    ${result.coverage ? `
                    <p><strong>Coverage:</strong> ${result.coverage.statements.toFixed(1)}%</p>
                    <div class="coverage-bar">
                        <div class="coverage-fill" style="width: ${result.coverage.statements}%"></div>
                    </div>
                    ` : ''}
                    ${result.errors && result.errors.length > 0 ? `
                    <div class="error-list">
                        <strong>Errors:</strong>
                        ${result.errors.map(error => `<div class="error-item">${error}</div>`).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `;
  }

  private printTestSummary(report: TestReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`🎯 Overall Status: ${report.overallStatus}`);
    console.log(`⏱️  Total Duration: ${(report.totalDuration / 1000).toFixed(2)}s`);
    console.log(`🧪 Test Suites: ${report.summary.passedSuites}/${report.summary.totalSuites} passed`);
    console.log(`✅ Tests: ${report.summary.passedTests}/${report.summary.totalTests} passed`);
    console.log(`📈 Coverage: ${report.coverage.overall.toFixed(1)}%`);
    
    if (report.criticalFailures.length > 0) {
      console.log(`⚠️  Critical Failures: ${report.criticalFailures.length}`);
      report.criticalFailures.forEach(failure => {
        console.log(`   - ${failure}`);
      });
    }
    
    console.log('\n📋 Suite Results:');
    report.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(2);
      console.log(`   ${status} ${result.suite} (${duration}s) - ${result.tests.passed}/${result.tests.total} tests`);
    });
    
    console.log('\n='.repeat(60));
  }
}

// Run the comprehensive test suite
async function main() {
  const runner = new ComprehensiveTestRunner();
  
  try {
    const report = await runner.runAllTests();
    
    // Exit with appropriate code
    if (report.overallStatus === 'FAIL' || report.criticalFailures.length > 0) {
      process.exit(1);
    } else if (report.overallStatus === 'PARTIAL') {
      process.exit(2);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ComprehensiveTestRunner };