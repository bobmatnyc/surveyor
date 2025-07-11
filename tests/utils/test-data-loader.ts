// Test Data Loading Utilities
import { promises as fs } from 'fs';
import { join } from 'path';
import { TestDataValidator } from '../fixtures/test-data-validation-schemas';

export interface TestDataLoaderOptions {
  validateOnLoad?: boolean;
  throwOnValidationError?: boolean;
  includeMetadata?: boolean;
  filterByCategory?: string[];
  filterByComplexity?: ('simple' | 'medium' | 'complex')[];
}

export interface LoadedTestData {
  surveys: Record<string, any>;
  scenarios: Record<string, any>;
  metadata: any;
  validationResults?: Record<string, any>;
}

export class TestDataLoader {
  private static readonly FIXTURES_DIR = join(__dirname, '../fixtures');
  private static readonly DEFAULT_OPTIONS: TestDataLoaderOptions = {
    validateOnLoad: true,
    throwOnValidationError: false,
    includeMetadata: true,
    filterByCategory: undefined,
    filterByComplexity: undefined
  };

  /**
   * Load comprehensive test survey packages
   */
  static async loadComprehensiveTestPackages(
    options: TestDataLoaderOptions = {}
  ): Promise<LoadedTestData> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const filePath = join(this.FIXTURES_DIR, 'comprehensive-test-survey-packages.json');
    
    try {
      const data = await this.loadJsonFile(filePath);
      return await this.processTestData(data, finalOptions);
    } catch (error) {
      throw new Error(`Failed to load comprehensive test packages: ${error.message}`);
    }
  }

  /**
   * Load edge case test packages
   */
  static async loadEdgeCaseTestPackages(
    options: TestDataLoaderOptions = {}
  ): Promise<LoadedTestData> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const filePath = join(this.FIXTURES_DIR, 'edge-case-test-packages.json');
    
    try {
      const data = await this.loadJsonFile(filePath);
      return await this.processTestData(data, finalOptions);
    } catch (error) {
      throw new Error(`Failed to load edge case test packages: ${error.message}`);
    }
  }

  /**
   * Load error scenario test packages
   */
  static async loadErrorScenarioTestPackages(
    options: TestDataLoaderOptions = {}
  ): Promise<any> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const filePath = join(this.FIXTURES_DIR, 'error-scenario-test-packages.json');
    
    try {
      const data = await this.loadJsonFile(filePath);
      
      if (finalOptions.validateOnLoad) {
        const validationResult = TestDataValidator.validateErrorTestPackage(data);
        if (!validationResult.success) {
          const message = `Error scenario validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`;
          if (finalOptions.throwOnValidationError) {
            throw new Error(message);
          }
          console.warn(message);
        }
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to load error scenario test packages: ${error.message}`);
    }
  }

  /**
   * Load performance test packages
   */
  static async loadPerformanceTestPackages(
    options: TestDataLoaderOptions = {}
  ): Promise<any> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const filePath = join(this.FIXTURES_DIR, 'performance-test-packages.json');
    
    try {
      const data = await this.loadJsonFile(filePath);
      
      if (finalOptions.validateOnLoad) {
        const validationResult = TestDataValidator.validatePerformanceTestPackage(data);
        if (!validationResult.success) {
          const message = `Performance test validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`;
          if (finalOptions.throwOnValidationError) {
            throw new Error(message);
          }
          console.warn(message);
        }
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to load performance test packages: ${error.message}`);
    }
  }

  /**
   * Load all test packages
   */
  static async loadAllTestPackages(
    options: TestDataLoaderOptions = {}
  ): Promise<{
    comprehensive: LoadedTestData;
    edgeCases: LoadedTestData;
    errorScenarios: any;
    performance: any;
  }> {
    const [comprehensive, edgeCases, errorScenarios, performance] = await Promise.all([
      this.loadComprehensiveTestPackages(options),
      this.loadEdgeCaseTestPackages(options),
      this.loadErrorScenarioTestPackages(options),
      this.loadPerformanceTestPackages(options)
    ]);

    return {
      comprehensive,
      edgeCases,
      errorScenarios,
      performance
    };
  }

  /**
   * Load specific survey by ID
   */
  static async loadSurveyById(
    surveyId: string,
    options: TestDataLoaderOptions = {}
  ): Promise<any> {
    const allPackages = await this.loadAllTestPackages(options);
    
    // Search in comprehensive packages
    if (allPackages.comprehensive.surveys[surveyId]) {
      return allPackages.comprehensive.surveys[surveyId];
    }
    
    // Search in edge case packages
    if (allPackages.edgeCases.surveys[surveyId]) {
      return allPackages.edgeCases.surveys[surveyId];
    }
    
    // Search in performance packages
    if (allPackages.performance.performanceTestSurveys?.[surveyId]) {
      return allPackages.performance.performanceTestSurveys[surveyId];
    }
    
    throw new Error(`Survey with ID '${surveyId}' not found in test packages`);
  }

  /**
   * Load surveys by category
   */
  static async loadSurveysByCategory(
    category: string,
    options: TestDataLoaderOptions = {}
  ): Promise<any[]> {
    const allPackages = await this.loadAllTestPackages(options);
    const surveys: any[] = [];
    
    // Search in comprehensive packages
    Object.values(allPackages.comprehensive.surveys).forEach((survey: any) => {
      if (survey.category === category) {
        surveys.push(survey);
      }
    });
    
    // Search in edge case packages
    Object.values(allPackages.edgeCases.surveys).forEach((survey: any) => {
      if (survey.category === category) {
        surveys.push(survey);
      }
    });
    
    return surveys;
  }

  /**
   * Load surveys by complexity level
   */
  static async loadSurveysByComplexity(
    complexity: 'simple' | 'medium' | 'complex',
    options: TestDataLoaderOptions = {}
  ): Promise<any[]> {
    const allPackages = await this.loadAllTestPackages(options);
    const surveys: any[] = [];
    
    // Search in comprehensive packages
    Object.values(allPackages.comprehensive.surveys).forEach((survey: any) => {
      if (survey.complexity === complexity) {
        surveys.push(survey);
      }
    });
    
    // Search in edge case packages
    Object.values(allPackages.edgeCases.surveys).forEach((survey: any) => {
      if (survey.complexity === complexity) {
        surveys.push(survey);
      }
    });
    
    return surveys;
  }

  /**
   * Load test scenarios by type
   */
  static async loadTestScenariosByType(
    scenarioType: string,
    options: TestDataLoaderOptions = {}
  ): Promise<any[]> {
    const allPackages = await this.loadAllTestPackages(options);
    const scenarios: any[] = [];
    
    // Search in comprehensive packages
    if (allPackages.comprehensive.scenarios[scenarioType]) {
      scenarios.push(...Object.values(allPackages.comprehensive.scenarios[scenarioType]));
    }
    
    // Search in edge case packages
    if (allPackages.edgeCases.scenarios[scenarioType]) {
      scenarios.push(...Object.values(allPackages.edgeCases.scenarios[scenarioType]));
    }
    
    return scenarios;
  }

  /**
   * Generate test data for specific scenario
   */
  static async generateTestDataForScenario(
    scenarioId: string,
    count: number = 1,
    options: TestDataLoaderOptions = {}
  ): Promise<any[]> {
    const allPackages = await this.loadAllTestPackages(options);
    const generatedData: any[] = [];
    
    // Find the scenario template
    let scenarioTemplate: any = null;
    
    // Search in comprehensive packages
    Object.values(allPackages.comprehensive.scenarios).forEach((scenarioGroup: any) => {
      if (scenarioGroup[scenarioId]) {
        scenarioTemplate = scenarioGroup[scenarioId];
      }
    });
    
    // Search in edge case packages
    if (!scenarioTemplate) {
      Object.values(allPackages.edgeCases.scenarios).forEach((scenarioGroup: any) => {
        if (scenarioGroup[scenarioId]) {
          scenarioTemplate = scenarioGroup[scenarioId];
        }
      });
    }
    
    if (!scenarioTemplate) {
      throw new Error(`Scenario '${scenarioId}' not found in test packages`);
    }
    
    // Generate multiple instances of the scenario
    for (let i = 0; i < count; i++) {
      const generatedScenario = {
        ...scenarioTemplate,
        organizationId: `${scenarioTemplate.organizationId}-${i}`,
        id: `${scenarioId}-${i}`,
        timestamp: new Date().toISOString()
      };
      
      generatedData.push(generatedScenario);
    }
    
    return generatedData;
  }

  /**
   * Create test data for API endpoint testing
   */
  static async createApiTestData(
    endpoint: string,
    options: TestDataLoaderOptions = {}
  ): Promise<{
    validRequests: any[];
    invalidRequests: any[];
    edgeCaseRequests: any[];
  }> {
    const allPackages = await this.loadAllTestPackages(options);
    
    const validRequests: any[] = [];
    const invalidRequests: any[] = [];
    const edgeCaseRequests: any[] = [];
    
    // Create valid requests from comprehensive test data
    Object.values(allPackages.comprehensive.surveys).forEach((survey: any) => {
      survey.stakeholders.forEach((stakeholder: any) => {
        validRequests.push({
          surveyId: survey.id,
          stakeholderId: stakeholder.id,
          organizationId: 'test-org',
          endpoint,
          expectedStatus: 200
        });
      });
    });
    
    // Create invalid requests from error scenarios
    if (allPackages.errorScenarios.errorScenarios) {
      Object.values(allPackages.errorScenarios.errorScenarios).forEach((errorGroup: any) => {
        Object.values(errorGroup).forEach((scenario: any) => {
          if (scenario.scenario === endpoint) {
            invalidRequests.push({
              ...scenario.testData,
              endpoint,
              expectedStatus: scenario.expectedError.status,
              expectedError: scenario.expectedError
            });
          }
        });
      });
    }
    
    // Create edge case requests
    Object.values(allPackages.edgeCases.surveys).forEach((survey: any) => {
      survey.stakeholders.forEach((stakeholder: any) => {
        edgeCaseRequests.push({
          surveyId: survey.id,
          stakeholderId: stakeholder.id,
          organizationId: 'test-org',
          endpoint,
          expectedStatus: 200
        });
      });
    });
    
    return {
      validRequests,
      invalidRequests,
      edgeCaseRequests
    };
  }

  /**
   * Load legacy test packages for backward compatibility
   */
  static async loadLegacyTestPackages(): Promise<any> {
    const filePath = join(this.FIXTURES_DIR, 'survey-test-packages.json');
    
    try {
      return await this.loadJsonFile(filePath);
    } catch (error) {
      throw new Error(`Failed to load legacy test packages: ${error.message}`);
    }
  }

  /**
   * Private helper methods
   */
  private static async loadJsonFile(filePath: string): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load JSON file '${filePath}': ${error.message}`);
    }
  }

  private static async processTestData(
    data: any,
    options: TestDataLoaderOptions
  ): Promise<LoadedTestData> {
    const result: LoadedTestData = {
      surveys: {},
      scenarios: {},
      metadata: options.includeMetadata ? data.metadata : undefined
    };

    // Process surveys
    if (data.testSurveys) {
      result.surveys = data.testSurveys;
      
      // Apply filters
      if (options.filterByCategory || options.filterByComplexity) {
        const filteredSurveys: Record<string, any> = {};
        
        Object.entries(result.surveys).forEach(([key, survey]) => {
          let include = true;
          
          if (options.filterByCategory && !options.filterByCategory.includes(survey.category)) {
            include = false;
          }
          
          if (options.filterByComplexity && !options.filterByComplexity.includes(survey.complexity)) {
            include = false;
          }
          
          if (include) {
            filteredSurveys[key] = survey;
          }
        });
        
        result.surveys = filteredSurveys;
      }
    }

    // Process scenarios
    if (data.testScenarios) {
      result.scenarios = data.testScenarios;
    }

    // Validate data if requested
    if (options.validateOnLoad) {
      const validationResults: Record<string, any> = {};
      
      Object.entries(result.surveys).forEach(([key, survey]) => {
        const validationResult = TestDataValidator.validateSurvey(survey);
        if (!validationResult.success) {
          validationResults[key] = {
            isValid: false,
            errors: validationResult.error.errors.map(e => e.message)
          };
          
          if (options.throwOnValidationError) {
            throw new Error(`Survey '${key}' validation failed: ${validationResults[key].errors.join(', ')}`);
          }
        } else {
          validationResults[key] = { isValid: true, errors: [] };
        }
      });
      
      result.validationResults = validationResults;
    }

    return result;
  }
}

// Convenience functions for common use cases
export const loadTestSurveys = TestDataLoader.loadComprehensiveTestPackages;
export const loadEdgeCaseTests = TestDataLoader.loadEdgeCaseTestPackages;
export const loadErrorScenarios = TestDataLoader.loadErrorScenarioTestPackages;
export const loadPerformanceTests = TestDataLoader.loadPerformanceTestPackages;
export const loadAllTests = TestDataLoader.loadAllTestPackages;
export const loadSurveyById = TestDataLoader.loadSurveyById;
export const generateTestData = TestDataLoader.generateTestDataForScenario;
export const createApiTestData = TestDataLoader.createApiTestData;

export default TestDataLoader;