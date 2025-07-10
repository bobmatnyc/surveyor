import { QAReport, QATestResult, QAAgentConfig } from './types';
import { DEFAULT_QA_CONFIG, TEST_ROUTES } from './config';
import { HTTPTester } from './http-tester';
import { BrowserTester } from './browser-tester';
import { VisualTester } from './visual-tester';
import { AccessibilityTester } from './accessibility-tester';
import { PerformanceTester } from './performance-tester';
import { SecurityTester } from './security-tester';
import { HTMLValidator } from './html-validator';
import { ReportGenerator } from './report-generator';
import path from 'path';

export class FrontendQAAgent {
  private config: QAAgentConfig;
  private httpTester: HTTPTester;
  private browserTester: BrowserTester;
  private visualTester: VisualTester;
  private reportGenerator: ReportGenerator;
  private testResults: QATestResult[] = [];

  constructor(config: Partial<QAAgentConfig> = {}) {
    this.config = { ...DEFAULT_QA_CONFIG, ...config };
    this.httpTester = new HTTPTester(this.config.baseUrl, this.config.testTimeout);
    this.browserTester = new BrowserTester(this.config);
    this.visualTester = new VisualTester(this.config.screenshotPath, this.config.visualThreshold);
    this.reportGenerator = new ReportGenerator();
  }

  async runComprehensiveQA(targetUrl?: string): Promise<QAReport> {
    const url = targetUrl || this.config.baseUrl;
    console.log(`\n🎯 Starting Frontend QA Analysis for: ${url}`);
    console.log('═══════════════════════════════════════════════════════════════════\n');

    this.testResults = [];
    let httpResult: any;
    let accessibilityResult: any;
    let performanceResult: any;
    let visualResult: any;
    let securityResult: any;
    let htmlValidationResult: any;

    try {
      // Phase A: HTTP Testing & Content Validation
      console.log('📡 Phase A: HTTP Testing & Content Validation');
      console.log('─────────────────────────────────────────────────────────────────────');
      
      httpResult = await this.httpTester.testUrl();
      const httpTests = await this.httpTester.validateHTTPResponse(httpResult);
      this.testResults.push(...httpTests);
      
      // HTML Validation
      if (httpResult.body) {
        const htmlValidator = new HTMLValidator();
        htmlValidationResult = await htmlValidator.validateHTML(httpResult.body);
        const htmlTests = await htmlValidator.generateValidationTests(httpResult.body);
        this.testResults.push(...htmlTests);
      }

      // Security Testing
      const securityTester = new SecurityTester(httpResult.headers);
      securityResult = await securityTester.validateSecurity();
      const securityTests = await securityTester.generateSecurityTests();
      this.testResults.push(...securityTests);

      this.logPhaseResults('A');

      // Phase B: Browser Automation & Performance Testing
      console.log('\n🌐 Phase B: Browser Automation & Performance Testing');
      console.log('─────────────────────────────────────────────────────────────────────');
      
      // Initialize browser with visual launching capabilities
      console.log(`🚀 Launching ${this.config.browser} browser...`);
      if (this.config.visualBrowserMode) {
        console.log('👁️  Visual mode: Browser window will be displayed for user interaction');
      }
      
      await this.browserTester.initialize();
      
      // Navigate to page with browser launch verification
      const navigationTests = await this.browserTester.navigateToUrl(url);
      this.testResults.push(...navigationTests);
      
      // Page structure validation
      const structureTests = await this.browserTester.validatePageStructure();
      this.testResults.push(...structureTests);
      
      // Interactivity tests with visual verification
      const interactivityTests = await this.browserTester.testInteractivity();
      this.testResults.push(...interactivityTests);
      
      // Accessibility testing
      const page = this.browserTester.getPage();
      if (page) {
        const accessibilityTester = new AccessibilityTester(page);
        accessibilityResult = await accessibilityTester.runAccessibilityTests();
        const a11yTests = await accessibilityTester.validateAccessibility();
        this.testResults.push(...a11yTests);
        
        // Performance testing
        const performanceTester = new PerformanceTester(page, url);
        performanceResult = await performanceTester.runLighthouseAudit();
        const perfTests = await performanceTester.validatePerformance();
        this.testResults.push(...perfTests);
        
        const customMetricTests = await performanceTester.measureCustomMetrics();
        this.testResults.push(...customMetricTests);
      }

      this.logPhaseResults('B');

      // Phase C: Visual Testing & Screenshot Analysis
      console.log('\n📸 Phase C: Visual Testing & Screenshot Analysis');
      console.log('─────────────────────────────────────────────────────────────────────');
      
      // Capture screenshot
      const screenshotPath = await this.browserTester.captureScreenshot(`qa-test-${Date.now()}.png`);
      
      // Visual validation
      const visualValidationTests = await this.visualTester.validateScreenshot(screenshotPath, 'main-page');
      this.testResults.push(...visualValidationTests);
      
      // Visual regression testing
      const visualRegressionTests = await this.visualTester.performVisualRegression(screenshotPath, 'main-page');
      this.testResults.push(...visualRegressionTests);
      
      // Visual content analysis
      const visualContentTests = await this.visualTester.analyzeVisualContent(screenshotPath);
      this.testResults.push(...visualContentTests);
      
      // Set visual test result
      visualResult = {
        baseline: path.join(this.config.screenshotPath, 'baseline', 'main-page.png'),
        current: screenshotPath,
        diff: path.join(this.config.screenshotPath, 'main-page-diff.png'),
        pixelDifference: 0,
        threshold: this.config.visualThreshold,
        passed: visualRegressionTests.every(t => t.status === 'PASS')
      };

      this.logPhaseResults('C');

      // Cleanup
      await this.browserTester.cleanup();

      // Generate comprehensive report
      const qaReport: QAReport = {
        timestamp: new Date().toISOString(),
        url,
        testResults: this.testResults,
        httpTest: httpResult,
        accessibilityTest: accessibilityResult,
        performanceTest: performanceResult,
        visualTest: visualResult,
        securityTest: securityResult,
        htmlValidation: htmlValidationResult,
        overallScore: 0,
        recommendation: 'NEEDS_REVIEW',
        summary: ''
      };

      // Calculate final scores and recommendations
      qaReport.overallScore = this.reportGenerator.calculateOverallScore(qaReport);
      qaReport.recommendation = this.reportGenerator.determineRecommendation(qaReport);
      qaReport.summary = this.reportGenerator.generateExecutiveSummary(qaReport);

      // Generate reports
      this.reportGenerator.generateReport(qaReport);

      this.logFinalResults(qaReport);

      return qaReport;

    } catch (error) {
      console.error('❌ QA Analysis failed:', error);
      
      // Cleanup browser if needed
      try {
        await this.browserTester.cleanup();
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      throw error;
    }
  }

  private logPhaseResults(phase: string): void {
    const phaseTests = this.testResults.filter(t => t.phase === phase);
    const passed = phaseTests.filter(t => t.status === 'PASS').length;
    const failed = phaseTests.filter(t => t.status === 'FAIL').length;
    const warnings = phaseTests.filter(t => t.status === 'WARNING').length;

    console.log(`\n📊 Phase ${phase} Results:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   📈 Total: ${phaseTests.length}`);

    if (failed > 0) {
      console.log('\n🔍 Failed Tests:');
      phaseTests.filter(t => t.status === 'FAIL').forEach(test => {
        console.log(`   • ${test.testType}: ${test.message}`);
      });
    }
  }

  private logFinalResults(qaReport: QAReport): void {
    console.log('\n🎯 FINAL QA ANALYSIS RESULTS');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`📊 Overall Score: ${qaReport.overallScore}%`);
    console.log(`🌐 Browser: ${this.config.browser} (${this.config.visualBrowserMode ? 'Visual' : 'Headless'} mode)`);
    console.log(`📋 Total Tests: ${qaReport.testResults.length}`);
    console.log(`✅ Passed: ${qaReport.testResults.filter(t => t.status === 'PASS').length}`);
    console.log(`❌ Failed: ${qaReport.testResults.filter(t => t.status === 'FAIL').length}`);
    console.log(`⚠️  Warnings: ${qaReport.testResults.filter(t => t.status === 'WARNING').length}`);
    
    // Show browser launch results
    const browserLaunchTests = qaReport.testResults.filter(t => t.testType === 'Browser Launch');
    if (browserLaunchTests.length > 0) {
      console.log('\n🚀 Browser Launch Results:');
      browserLaunchTests.forEach(test => {
        const statusEmoji = test.status === 'PASS' ? '✅' : '❌';
        console.log(`   ${statusEmoji} ${test.message}`);
      });
    }
    
    console.log('\n📈 Category Scores:');
    console.log(`   🚀 Performance: ${Math.round(qaReport.performanceTest.categories.performance.score * 100)}%`);
    console.log(`   ♿ Accessibility: ${Math.round(qaReport.performanceTest.categories.accessibility.score * 100)}%`);
    console.log(`   🔒 Security: ${Math.round(qaReport.securityTest.score)}%`);
    console.log(`   📝 HTML Validation: ${qaReport.htmlValidation.isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   🎨 Visual Tests: ${qaReport.visualTest.passed ? '✅ Passed' : '❌ Failed'}`);
    
    console.log('\n🏆 RECOMMENDATION:');
    const recommendationEmoji = qaReport.recommendation === 'APPROVE' ? '✅' : 
                               qaReport.recommendation === 'REJECT' ? '❌' : '🔍';
    console.log(`   ${recommendationEmoji} ${qaReport.recommendation}`);
    
    console.log('\n📄 Summary:');
    console.log(`   ${qaReport.summary}`);
    
    console.log('\n═══════════════════════════════════════════════════════════════════');
  }

  async testSpecificRoute(route: string): Promise<QATestResult[]> {
    const url = `${this.config.baseUrl}${route}`;
    console.log(`\n🎯 Testing specific route: ${url}`);
    
    const httpResult = await this.httpTester.testUrl(route);
    const httpTests = await this.httpTester.validateHTTPResponse(httpResult);
    
    return httpTests;
  }

  async runMultiRouteTest(): Promise<QAReport[]> {
    const reports: QAReport[] = [];
    
    for (const route of TEST_ROUTES) {
      console.log(`\n🔄 Testing route: ${route}`);
      try {
        const report = await this.runComprehensiveQA(`${this.config.baseUrl}${route}`);
        reports.push(report);
      } catch (error) {
        console.error(`❌ Failed to test route ${route}:`, error);
      }
    }
    
    return reports;
  }
}

// Export for direct usage
export * from './types';
export * from './config';
export { HTTPTester } from './http-tester';
export { BrowserTester } from './browser-tester';
export { VisualTester } from './visual-tester';
export { AccessibilityTester } from './accessibility-tester';
export { PerformanceTester } from './performance-tester';
export { SecurityTester } from './security-tester';
export { HTMLValidator } from './html-validator';
export { ReportGenerator } from './report-generator';

// CLI entry point
if (require.main === module) {
  const qaAgent = new FrontendQAAgent();
  
  qaAgent.runComprehensiveQA()
    .then(report => {
      console.log('\n🎉 QA Analysis completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 QA Analysis failed:', error);
      process.exit(1);
    });
}