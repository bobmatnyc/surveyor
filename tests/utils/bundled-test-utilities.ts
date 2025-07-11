// Bundled Test Utilities for Survey JSON Packages
import { TestDataLoader } from './test-data-loader';
import { TestDataValidator } from '../fixtures/test-data-validation-schemas';
import { ApiTestUtils } from './enhanced-api-test-utils';

export interface TestSuiteConfiguration {
  name: string;
  description: string;
  baseUrl: string;
  timeout: number;
  retries: number;
  parallel: boolean;
  tags: string[];
  environment: 'development' | 'staging' | 'production';
}

export interface TestExecutionResult {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  executionTime: number;
  results: TestResult[];
  summary: {
    successRate: number;
    averageResponseTime: number;
    errorsByCategory: Record<string, number>;
  };
}

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  details?: any;
}

export class BundledTestUtilities {
  private static readonly DEFAULT_CONFIG: TestSuiteConfiguration = {
    name: 'Survey API Test Suite',
    description: 'Comprehensive API testing using bundled survey packages',
    baseUrl: 'http://localhost:3000/api',
    timeout: 30000,
    retries: 3,
    parallel: true,
    tags: ['api', 'integration'],
    environment: 'development'
  };

  /**
   * Execute comprehensive API test suite
   */
  static async executeComprehensiveTestSuite(
    config: Partial<TestSuiteConfiguration> = {}
  ): Promise<TestExecutionResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    
    console.log(`Starting comprehensive API test suite: ${finalConfig.name}`);
    console.log(`Environment: ${finalConfig.environment}`);
    console.log(`Base URL: ${finalConfig.baseUrl}`);
    
    const results: TestResult[] = [];
    
    try {
      // Load test data
      const testData = await TestDataLoader.loadComprehensiveTestPackages({
        validateOnLoad: true,
        throwOnValidationError: false
      });
      
      console.log(`Loaded ${Object.keys(testData.surveys).length} test surveys`);
      
      // Execute survey metadata tests
      const metadataResults = await this.executeSurveyMetadataTests(testData.surveys, finalConfig);
      results.push(...metadataResults);
      
      // Execute stakeholder tests
      const stakeholderResults = await this.executeStakeholderTests(testData.surveys, finalConfig);
      results.push(...stakeholderResults);
      
      // Execute survey step tests
      const stepResults = await this.executeSurveyStepTests(testData.surveys, finalConfig);
      results.push(...stepResults);
      
      // Execute survey completion tests
      const completionResults = await this.executeSurveyCompletionTests(testData.surveys, finalConfig);
      results.push(...completionResults);
      
    } catch (error) {
      console.error('Test suite execution failed:', error);
      results.push({
        testName: 'Test Suite Setup',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message
      });
    }
    
    const endTime = Date.now();
    return this.generateTestExecutionResult(finalConfig.name, results, endTime - startTime);
  }

  /**
   * Execute edge case test suite
   */
  static async executeEdgeCaseTestSuite(
    config: Partial<TestSuiteConfiguration> = {}
  ): Promise<TestExecutionResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    
    console.log(`Starting edge case test suite: ${finalConfig.name}`);
    
    const results: TestResult[] = [];
    
    try {
      const testData = await TestDataLoader.loadEdgeCaseTestPackages({
        validateOnLoad: true,
        throwOnValidationError: false
      });
      
      console.log(`Loaded ${Object.keys(testData.surveys).length} edge case surveys`);
      
      // Execute boundary condition tests
      const boundaryResults = await this.executeBoundaryConditionTests(testData.surveys, finalConfig);
      results.push(...boundaryResults);
      
      // Execute validation limit tests
      const validationResults = await this.executeValidationLimitTests(testData.surveys, finalConfig);
      results.push(...validationResults);
      
      // Execute unicode and internationalization tests
      const unicodeResults = await this.executeUnicodeTests(testData.surveys, finalConfig);
      results.push(...unicodeResults);
      
      // Execute conditional logic tests
      const conditionalResults = await this.executeConditionalLogicTests(testData.surveys, finalConfig);
      results.push(...conditionalResults);
      
    } catch (error) {
      console.error('Edge case test suite execution failed:', error);
      results.push({
        testName: 'Edge Case Test Suite Setup',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message
      });
    }
    
    const endTime = Date.now();
    return this.generateTestExecutionResult(finalConfig.name, results, endTime - startTime);
  }

  /**
   * Execute error scenario test suite
   */
  static async executeErrorScenarioTestSuite(
    config: Partial<TestSuiteConfiguration> = {}
  ): Promise<TestExecutionResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    
    console.log(`Starting error scenario test suite: ${finalConfig.name}`);
    
    const results: TestResult[] = [];
    
    try {
      const errorScenarios = await TestDataLoader.loadErrorScenarioTestPackages({
        validateOnLoad: true,
        throwOnValidationError: false
      });
      
      console.log(`Loaded error scenarios from ${Object.keys(errorScenarios.errorScenarios).length} categories`);
      
      // Execute validation error tests
      const validationResults = await this.executeValidationErrorTests(errorScenarios.errorScenarios, finalConfig);
      results.push(...validationResults);
      
      // Execute not found error tests
      const notFoundResults = await this.executeNotFoundErrorTests(errorScenarios.errorScenarios, finalConfig);
      results.push(...notFoundResults);
      
      // Execute authentication error tests
      const authResults = await this.executeAuthenticationErrorTests(errorScenarios.errorScenarios, finalConfig);
      results.push(...authResults);
      
      // Execute malformed request tests
      const malformedResults = await this.executeMalformedRequestTests(errorScenarios.errorScenarios, finalConfig);
      results.push(...malformedResults);
      
    } catch (error) {
      console.error('Error scenario test suite execution failed:', error);
      results.push({
        testName: 'Error Scenario Test Suite Setup',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message
      });
    }
    
    const endTime = Date.now();
    return this.generateTestExecutionResult(finalConfig.name, results, endTime - startTime);
  }

  /**
   * Execute performance test suite
   */
  static async executePerformanceTestSuite(
    config: Partial<TestSuiteConfiguration> = {}
  ): Promise<TestExecutionResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    
    console.log(`Starting performance test suite: ${finalConfig.name}`);
    
    const results: TestResult[] = [];
    
    try {
      const performanceData = await TestDataLoader.loadPerformanceTestPackages({
        validateOnLoad: true,
        throwOnValidationError: false
      });
      
      console.log(`Loaded performance test data with ${Object.keys(performanceData.performanceTestSurveys).length} surveys`);
      
      // Execute load tests
      const loadResults = await this.executeLoadTests(performanceData.performanceTestData, finalConfig);
      results.push(...loadResults);
      
      // Execute stress tests
      const stressResults = await this.executeStressTests(performanceData.performanceTestData, finalConfig);
      results.push(...stressResults);
      
    } catch (error) {
      console.error('Performance test suite execution failed:', error);
      results.push({
        testName: 'Performance Test Suite Setup',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message
      });
    }
    
    const endTime = Date.now();
    return this.generateTestExecutionResult(finalConfig.name, results, endTime - startTime);
  }

  /**
   * Execute all test suites
   */
  static async executeAllTestSuites(
    config: Partial<TestSuiteConfiguration> = {}
  ): Promise<{
    comprehensive: TestExecutionResult;
    edgeCases: TestExecutionResult;
    errorScenarios: TestExecutionResult;
    performance: TestExecutionResult;
    overall: {
      totalTests: number;
      totalPassed: number;
      totalFailed: number;
      totalSkipped: number;
      overallSuccessRate: number;
      totalExecutionTime: number;
    };
  }> {
    const startTime = Date.now();
    
    console.log('Starting execution of all test suites...');
    
    const [comprehensive, edgeCases, errorScenarios, performance] = await Promise.all([
      this.executeComprehensiveTestSuite({ ...config, name: 'Comprehensive Test Suite' }),
      this.executeEdgeCaseTestSuite({ ...config, name: 'Edge Case Test Suite' }),
      this.executeErrorScenarioTestSuite({ ...config, name: 'Error Scenario Test Suite' }),
      this.executePerformanceTestSuite({ ...config, name: 'Performance Test Suite' })
    ]);
    
    const endTime = Date.now();
    const totalExecutionTime = endTime - startTime;
    
    const overall = {
      totalTests: comprehensive.totalTests + edgeCases.totalTests + errorScenarios.totalTests + performance.totalTests,
      totalPassed: comprehensive.passedTests + edgeCases.passedTests + errorScenarios.passedTests + performance.passedTests,
      totalFailed: comprehensive.failedTests + edgeCases.failedTests + errorScenarios.failedTests + performance.failedTests,
      totalSkipped: comprehensive.skippedTests + edgeCases.skippedTests + errorScenarios.skippedTests + performance.skippedTests,
      overallSuccessRate: 0,
      totalExecutionTime
    };
    
    overall.overallSuccessRate = overall.totalTests > 0 ? (overall.totalPassed / overall.totalTests) * 100 : 0;
    
    console.log(`\nOverall Test Results:`);
    console.log(`Total Tests: ${overall.totalTests}`);
    console.log(`Passed: ${overall.totalPassed}`);
    console.log(`Failed: ${overall.totalFailed}`);
    console.log(`Skipped: ${overall.totalSkipped}`);
    console.log(`Success Rate: ${overall.overallSuccessRate.toFixed(2)}%`);
    console.log(`Total Execution Time: ${totalExecutionTime}ms`);
    
    return {
      comprehensive,
      edgeCases,
      errorScenarios,
      performance,
      overall
    };
  }

  /**
   * Private helper methods for specific test categories
   */
  private static async executeSurveyMetadataTests(
    surveys: Record<string, any>,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const [surveyId, survey] of Object.entries(surveys)) {
      const startTime = Date.now();
      
      try {
        const response = await ApiTestUtils.makeRequest({
          method: 'GET',
          url: `${config.baseUrl}/survey/${surveyId}`,
          params: { organizationId: 'test-org' },
          timeout: config.timeout
        });
        
        const isValid = response.status === 200 && response.data.id === surveyId;
        
        results.push({
          testName: `Survey Metadata - ${surveyId}`,
          status: isValid ? 'passed' : 'failed',
          duration: Date.now() - startTime,
          error: isValid ? undefined : 'Invalid response format or data'
        });
        
      } catch (error) {
        results.push({
          testName: `Survey Metadata - ${surveyId}`,
          status: 'failed',
          duration: Date.now() - startTime,
          error: error.message
        });
      }
    }
    
    return results;
  }

  private static async executeStakeholderTests(
    surveys: Record<string, any>,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const [surveyId, survey] of Object.entries(surveys)) {
      const startTime = Date.now();
      
      try {
        const response = await ApiTestUtils.makeRequest({
          method: 'GET',
          url: `${config.baseUrl}/survey/${surveyId}/stakeholders`,
          params: { organizationId: 'test-org' },
          timeout: config.timeout
        });
        
        const isValid = response.status === 200 && 
                       Array.isArray(response.data.stakeholders) &&
                       response.data.stakeholders.length === survey.stakeholders.length;
        
        results.push({
          testName: `Stakeholder List - ${surveyId}`,
          status: isValid ? 'passed' : 'failed',
          duration: Date.now() - startTime,
          error: isValid ? undefined : 'Invalid stakeholder response'
        });
        
      } catch (error) {
        results.push({
          testName: `Stakeholder List - ${surveyId}`,
          status: 'failed',
          duration: Date.now() - startTime,
          error: error.message
        });
      }
    }
    
    return results;
  }

  private static async executeSurveyStepTests(
    surveys: Record<string, any>,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const [surveyId, survey] of Object.entries(surveys)) {
      for (const stakeholder of survey.stakeholders) {
        const startTime = Date.now();
        
        try {
          const response = await ApiTestUtils.makeRequest({
            method: 'GET',
            url: `${config.baseUrl}/survey/${surveyId}/step/1`,
            params: { 
              organizationId: 'test-org',
              stakeholderId: stakeholder.id
            },
            timeout: config.timeout
          });
          
          const isValid = response.status === 200 && 
                         response.data.stepId &&
                         Array.isArray(response.data.questions);
          
          results.push({
            testName: `Survey Step - ${surveyId} - ${stakeholder.id}`,
            status: isValid ? 'passed' : 'failed',
            duration: Date.now() - startTime,
            error: isValid ? undefined : 'Invalid step response'
          });
          
        } catch (error) {
          results.push({
            testName: `Survey Step - ${surveyId} - ${stakeholder.id}`,
            status: 'failed',
            duration: Date.now() - startTime,
            error: error.message
          });
        }
      }
    }
    
    return results;
  }

  private static async executeSurveyCompletionTests(
    surveys: Record<string, any>,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const [surveyId, survey] of Object.entries(surveys)) {
      const startTime = Date.now();
      
      try {
        const mockResponses = this.generateMockResponses(survey.questions);
        
        const response = await ApiTestUtils.makeRequest({
          method: 'POST',
          url: `${config.baseUrl}/survey/${surveyId}/complete`,
          data: {
            organizationId: 'test-org',
            stakeholderId: survey.stakeholders[0].id,
            finalResponses: mockResponses
          },
          timeout: config.timeout
        });
        
        const isValid = response.status === 200 && response.data.success;
        
        results.push({
          testName: `Survey Completion - ${surveyId}`,
          status: isValid ? 'passed' : 'failed',
          duration: Date.now() - startTime,
          error: isValid ? undefined : 'Survey completion failed'
        });
        
      } catch (error) {
        results.push({
          testName: `Survey Completion - ${surveyId}`,
          status: 'failed',
          duration: Date.now() - startTime,
          error: error.message
        });
      }
    }
    
    return results;
  }

  private static async executeBoundaryConditionTests(
    surveys: Record<string, any>,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    // Implementation for boundary condition tests
    // This would test min/max values, empty strings, etc.
    return [];
  }

  private static async executeValidationLimitTests(
    surveys: Record<string, any>,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    // Implementation for validation limit tests
    // This would test validation rules, pattern matching, etc.
    return [];
  }

  private static async executeUnicodeTests(
    surveys: Record<string, any>,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    // Implementation for unicode and internationalization tests
    return [];
  }

  private static async executeConditionalLogicTests(
    surveys: Record<string, any>,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    // Implementation for conditional logic tests
    return [];
  }

  private static async executeValidationErrorTests(
    errorScenarios: any,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    // Implementation for validation error tests
    return [];
  }

  private static async executeNotFoundErrorTests(
    errorScenarios: any,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    // Implementation for not found error tests
    return [];
  }

  private static async executeAuthenticationErrorTests(
    errorScenarios: any,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    // Implementation for authentication error tests
    return [];
  }

  private static async executeMalformedRequestTests(
    errorScenarios: any,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    // Implementation for malformed request tests
    return [];
  }

  private static async executeLoadTests(
    performanceData: any,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    // Implementation for load tests
    return [];
  }

  private static async executeStressTests(
    performanceData: any,
    config: TestSuiteConfiguration
  ): Promise<TestResult[]> {
    // Implementation for stress tests
    return [];
  }

  private static generateMockResponses(questions: any[]): Record<string, any> {
    const responses: Record<string, any> = {};
    
    questions.forEach(question => {
      switch (question.type) {
        case 'text':
          responses[question.id] = 'Test response';
          break;
        case 'multipleChoice':
          responses[question.id] = question.options?.[0] || 'Option 1';
          break;
        case 'likert':
          responses[question.id] = question.scale ? Math.floor((question.scale.min + question.scale.max) / 2) : 3;
          break;
        case 'boolean':
          responses[question.id] = true;
          break;
        case 'number':
          responses[question.id] = 42;
          break;
        default:
          responses[question.id] = 'Default response';
      }
    });
    
    return responses;
  }

  private static generateTestExecutionResult(
    suiteName: string,
    results: TestResult[],
    executionTime: number
  ): TestExecutionResult {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const skippedTests = results.filter(r => r.status === 'skipped').length;
    
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const averageResponseTime = results.length > 0 ? results.reduce((sum, r) => sum + r.duration, 0) / results.length : 0;
    
    const errorsByCategory: Record<string, number> = {};
    results.filter(r => r.status === 'failed').forEach(r => {
      const category = r.testName.split(' - ')[0];
      errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;
    });
    
    return {
      suiteName,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      executionTime,
      results,
      summary: {
        successRate,
        averageResponseTime,
        errorsByCategory
      }
    };
  }
}

export default BundledTestUtilities;