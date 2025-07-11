// Integration Tests for Bundled Test Survey JSON Packages
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDataLoader } from '../utils/test-data-loader';
import { TestDataValidator } from '../fixtures/test-data-validation-schemas';
import { BundledTestUtilities } from '../utils/bundled-test-utilities';
import { ApiTestUtils } from '../utils/enhanced-api-test-utils';

describe('Bundled Test Survey JSON Packages Integration', () => {
  let testData: any;
  let edgeCaseData: any;
  let errorScenarios: any;
  let performanceData: any;

  beforeAll(async () => {
    // Load all test packages
    const allPackages = await TestDataLoader.loadAllTestPackages({
      validateOnLoad: true,
      throwOnValidationError: false
    });

    testData = allPackages.comprehensive;
    edgeCaseData = allPackages.edgeCases;
    errorScenarios = allPackages.errorScenarios;
    performanceData = allPackages.performance;
  });

  describe('Test Data Loading', () => {
    it('should load comprehensive test packages successfully', async () => {
      expect(testData).toBeDefined();
      expect(testData.surveys).toBeDefined();
      expect(testData.metadata).toBeDefined();
      
      // Verify we have the expected surveys
      expect(testData.surveys.simple).toBeDefined();
      expect(testData.surveys.stakeholderSurvey).toBeDefined();
      expect(testData.surveys.technicalAssessment).toBeDefined();
      expect(testData.surveys.feedbackForm).toBeDefined();
    });

    it('should load edge case test packages successfully', async () => {
      expect(edgeCaseData).toBeDefined();
      expect(edgeCaseData.surveys).toBeDefined();
      
      // Verify edge case surveys
      expect(edgeCaseData.surveys.singleStakeholder).toBeDefined();
      expect(edgeCaseData.surveys.unicodeSupport).toBeDefined();
      expect(edgeCaseData.surveys.maxLengthSurvey).toBeDefined();
      expect(edgeCaseData.surveys.conditionalLogic).toBeDefined();
      expect(edgeCaseData.surveys.validationLimits).toBeDefined();
    });

    it('should load error scenario packages successfully', async () => {
      expect(errorScenarios).toBeDefined();
      expect(errorScenarios.errorScenarios).toBeDefined();
      
      // Verify error scenario categories
      expect(errorScenarios.errorScenarios.validationErrors).toBeDefined();
      expect(errorScenarios.errorScenarios.notFoundErrors).toBeDefined();
      expect(errorScenarios.errorScenarios.authenticationErrors).toBeDefined();
      expect(errorScenarios.errorScenarios.malformedRequests).toBeDefined();
    });

    it('should load performance test packages successfully', async () => {
      expect(performanceData).toBeDefined();
      expect(performanceData.performanceTestSurveys).toBeDefined();
      expect(performanceData.performanceTestData).toBeDefined();
      
      // Verify performance test surveys
      expect(performanceData.performanceTestSurveys.lightweightSurvey).toBeDefined();
      expect(performanceData.performanceTestSurveys.mediumSurvey).toBeDefined();
      expect(performanceData.performanceTestSurveys.heavySurvey).toBeDefined();
    });

    it('should load specific survey by ID', async () => {
      const survey = await TestDataLoader.loadSurveyById('test-stakeholder-survey');
      
      expect(survey).toBeDefined();
      expect(survey.id).toBe('test-stakeholder-survey');
      expect(survey.name).toBe('Multi-Stakeholder Assessment');
      expect(survey.stakeholders).toHaveLength(4);
      expect(survey.questions).toHaveLength(6);
    });

    it('should load surveys by category', async () => {
      const technicalSurveys = await TestDataLoader.loadSurveysByCategory('technical');
      
      expect(technicalSurveys).toHaveLength(1);
      expect(technicalSurveys[0].id).toBe('test-technical-assessment');
      expect(technicalSurveys[0].category).toBe('technical');
    });

    it('should load surveys by complexity', async () => {
      const simpleSurveys = await TestDataLoader.loadSurveysByComplexity('simple');
      
      expect(simpleSurveys.length).toBeGreaterThan(0);
      simpleSurveys.forEach(survey => {
        expect(survey.complexity).toBe('simple');
      });
    });
  });

  describe('Test Data Validation', () => {
    it('should validate comprehensive survey structures', () => {
      Object.entries(testData.surveys).forEach(([key, survey]) => {
        const validationResult = TestDataValidator.validateSurvey(survey);
        
        if (!validationResult.success) {
          console.error(`Validation failed for survey ${key}:`, validationResult.error.errors);
        }
        
        expect(validationResult.success).toBe(true);
      });
    });

    it('should validate edge case survey structures', () => {
      Object.entries(edgeCaseData.surveys).forEach(([key, survey]) => {
        const validationResult = TestDataValidator.validateSurvey(survey);
        
        if (!validationResult.success) {
          console.error(`Validation failed for edge case survey ${key}:`, validationResult.error.errors);
        }
        
        expect(validationResult.success).toBe(true);
      });
    });

    it('should validate survey integrity', () => {
      const survey = testData.surveys.stakeholderSurvey;
      const integrityResult = TestDataValidator.validateSurveyIntegrity(survey);
      
      expect(integrityResult.isValid).toBe(true);
      expect(integrityResult.errors).toHaveLength(0);
    });

    it('should validate stakeholder references in questions', () => {
      const survey = testData.surveys.technicalAssessment;
      const stakeholderIds = survey.stakeholders.map((s: any) => s.id);
      
      survey.questions.forEach((question: any) => {
        const validation = TestDataValidator.validateQuestionTargetStakeholders(
          question,
          stakeholderIds
        );
        
        expect(validation.isValid).toBe(true);
      });
    });

    it('should validate conditional logic in questions', () => {
      const survey = edgeCaseData.surveys.conditionalLogic;
      
      survey.questions.forEach((question: any) => {
        const validation = TestDataValidator.validateConditionalLogic(
          question,
          survey.questions
        );
        
        expect(validation.isValid).toBe(true);
      });
    });
  });

  describe('Test Data Filtering', () => {
    it('should filter surveys by category', async () => {
      const filteredData = await TestDataLoader.loadComprehensiveTestPackages({
        filterByCategory: ['stakeholder', 'technical']
      });
      
      const categories = Object.values(filteredData.surveys).map((s: any) => s.category);
      expect(categories).toEqual(expect.arrayContaining(['stakeholder', 'technical']));
      expect(categories).not.toContain('basic');
    });

    it('should filter surveys by complexity', async () => {
      const filteredData = await TestDataLoader.loadComprehensiveTestPackages({
        filterByComplexity: ['simple', 'medium']
      });
      
      const complexities = Object.values(filteredData.surveys).map((s: any) => s.complexity);
      expect(complexities).toEqual(expect.arrayContaining(['simple', 'medium']));
      expect(complexities).not.toContain('complex');
    });
  });

  describe('Test Data Generation', () => {
    it('should generate test data for scenarios', async () => {
      const generatedData = await TestDataLoader.generateTestDataForScenario(
        'happyPath',
        3
      );
      
      expect(generatedData).toHaveLength(3);
      generatedData.forEach((scenario, index) => {
        expect(scenario.organizationId).toBe(`test-org-${index}`);
        expect(scenario.id).toBe(`happyPath-${index}`);
        expect(scenario.timestamp).toBeDefined();
      });
    });

    it('should create API test data for endpoints', async () => {
      const apiTestData = await TestDataLoader.createApiTestData('survey_metadata');
      
      expect(apiTestData.validRequests).toBeDefined();
      expect(apiTestData.invalidRequests).toBeDefined();
      expect(apiTestData.edgeCaseRequests).toBeDefined();
      
      expect(apiTestData.validRequests.length).toBeGreaterThan(0);
      expect(apiTestData.validRequests[0].endpoint).toBe('survey_metadata');
      expect(apiTestData.validRequests[0].expectedStatus).toBe(200);
    });
  });

  describe('Survey Content Validation', () => {
    it('should have proper survey metadata', () => {
      const survey = testData.surveys.stakeholderSurvey;
      
      expect(survey.id).toBe('test-stakeholder-survey');
      expect(survey.name).toBe('Multi-Stakeholder Assessment');
      expect(survey.version).toBe('1.0.0');
      expect(survey.isActive).toBe(true);
      expect(survey.estimatedTimeMinutes).toBe(15);
      expect(survey.category).toBe('stakeholder');
      expect(survey.complexity).toBe('medium');
    });

    it('should have proper stakeholder configuration', () => {
      const survey = testData.surveys.stakeholderSurvey;
      
      expect(survey.stakeholders).toHaveLength(4);
      
      const ceoStakeholder = survey.stakeholders.find((s: any) => s.id === 'ceo');
      expect(ceoStakeholder).toBeDefined();
      expect(ceoStakeholder.name).toBe('CEO');
      expect(ceoStakeholder.weight).toBe(0.4);
      expect(ceoStakeholder.expertise).toContain('strategy');
      expect(ceoStakeholder.requiredExpertise).toContain('strategy');
    });

    it('should have proper question configuration', () => {
      const survey = testData.surveys.technicalAssessment;
      
      expect(survey.questions).toHaveLength(8);
      
      const question = survey.questions.find((q: any) => q.id === 'arch_scalability');
      expect(question).toBeDefined();
      expect(question.type).toBe('likert');
      expect(question.domain).toBe('architecture');
      expect(question.required).toBe(true);
      expect(question.targetStakeholders).toContain('cto');
      expect(question.scale).toBeDefined();
      expect(question.scale.min).toBe(1);
      expect(question.scale.max).toBe(5);
    });

    it('should have proper domain configuration', () => {
      const survey = testData.surveys.stakeholderSurvey;
      
      expect(survey.domains).toHaveLength(4);
      
      const strategyDomain = survey.domains.find((d: any) => d.id === 'strategy');
      expect(strategyDomain).toBeDefined();
      expect(strategyDomain.name).toBe('Strategic Planning');
      expect(strategyDomain.weight).toBe(0.3);
      expect(strategyDomain.color).toBe('#DC2626');
    });
  });

  describe('Edge Case Content Validation', () => {
    it('should handle single stakeholder surveys', () => {
      const survey = edgeCaseData.surveys.singleStakeholder;
      
      expect(survey.stakeholders).toHaveLength(1);
      expect(survey.stakeholders[0].weight).toBe(1.0);
      expect(survey.questions).toHaveLength(1);
    });

    it('should handle unicode characters', () => {
      const survey = edgeCaseData.surveys.unicodeSupport;
      
      const internationalStakeholder = survey.stakeholders[0];
      expect(internationalStakeholder.name).toBe('用户');
      expect(internationalStakeholder.description).toBe('国际用户测试');
      
      const unicodeQuestion = survey.questions.find((q: any) => q.id === 'unicode-text');
      expect(unicodeQuestion.text).toContain('请输入您的姓名');
      
      const emojiQuestion = survey.questions.find((q: any) => q.id === 'emoji-question');
      expect(emojiQuestion.text).toContain('😊');
      expect(emojiQuestion.options).toContain('😊 Happy');
    });

    it('should handle maximum length configurations', () => {
      const survey = edgeCaseData.surveys.maxLengthSurvey;
      
      const longQuestion = survey.questions.find((q: any) => q.id === 'very-long-question');
      expect(longQuestion.text.length).toBeGreaterThan(200);
      expect(longQuestion.validation.maxLength).toBe(2000);
      
      const manyOptionsQuestion = survey.questions.find((q: any) => q.id === 'many-options-question');
      expect(manyOptionsQuestion.options).toHaveLength(25);
    });

    it('should handle conditional logic properly', () => {
      const survey = edgeCaseData.surveys.conditionalLogic;
      
      const conditionalQuestion = survey.questions.find((q: any) => q.id === 'satisfied-followup');
      expect(conditionalQuestion.conditional).toBeDefined();
      expect(conditionalQuestion.conditional.dependsOn).toBe('trigger-question');
      expect(conditionalQuestion.conditional.condition).toBe('equals');
      expect(conditionalQuestion.conditional.value).toBe(true);
    });

    it('should handle validation limits correctly', () => {
      const survey = edgeCaseData.surveys.validationLimits;
      
      const minLengthQuestion = survey.questions.find((q: any) => q.id === 'min-length-text');
      expect(minLengthQuestion.validation.minLength).toBe(5);
      expect(minLengthQuestion.validation.maxLength).toBe(50);
      
      const numberQuestion = survey.questions.find((q: any) => q.id === 'number-min-max');
      expect(numberQuestion.validation.min).toBe(1);
      expect(numberQuestion.validation.max).toBe(100);
    });
  });

  describe('Error Scenario Content Validation', () => {
    it('should have proper validation error scenarios', () => {
      const validationErrors = errorScenarios.errorScenarios.validationErrors;
      
      expect(validationErrors.missingRequiredFields).toBeDefined();
      expect(validationErrors.invalidFieldTypes).toBeDefined();
      expect(validationErrors.exceedingLimits).toBeDefined();
      
      const missingFieldsScenario = validationErrors.missingRequiredFields;
      expect(missingFieldsScenario.expectedError.code).toBe('VALIDATION_ERROR');
      expect(missingFieldsScenario.expectedError.status).toBe(400);
    });

    it('should have proper not found error scenarios', () => {
      const notFoundErrors = errorScenarios.errorScenarios.notFoundErrors;
      
      expect(notFoundErrors.invalidSurveyId).toBeDefined();
      expect(notFoundErrors.invalidStakeholderId).toBeDefined();
      expect(notFoundErrors.invalidOrganizationId).toBeDefined();
      
      const invalidSurveyScenario = notFoundErrors.invalidSurveyId;
      expect(invalidSurveyScenario.expectedError.code).toBe('SURVEY_NOT_FOUND');
      expect(invalidSurveyScenario.expectedError.status).toBe(404);
    });

    it('should have proper authentication error scenarios', () => {
      const authErrors = errorScenarios.errorScenarios.authenticationErrors;
      
      expect(authErrors.missingAuthToken).toBeDefined();
      expect(authErrors.invalidAuthToken).toBeDefined();
      expect(authErrors.expiredAuthToken).toBeDefined();
      expect(authErrors.insufficientPermissions).toBeDefined();
      
      const missingTokenScenario = authErrors.missingAuthToken;
      expect(missingTokenScenario.expectedError.code).toBe('UNAUTHORIZED');
      expect(missingTokenScenario.expectedError.status).toBe(401);
    });
  });

  describe('Performance Test Content Validation', () => {
    it('should have proper performance test surveys', () => {
      const lightweightSurvey = performanceData.performanceTestSurveys.lightweightSurvey;
      
      expect(lightweightSurvey.id).toBe('perf-lightweight');
      expect(lightweightSurvey.estimatedTimeMinutes).toBe(2);
      expect(lightweightSurvey.category).toBe('performance-lightweight');
      expect(lightweightSurvey.questions).toHaveLength(2);
    });

    it('should have proper load test scenarios', () => {
      const loadTests = performanceData.performanceTestData.loadTestScenarios;
      
      expect(loadTests.lightLoad).toBeDefined();
      expect(loadTests.mediumLoad).toBeDefined();
      expect(loadTests.heavyLoad).toBeDefined();
      
      const lightLoadTest = loadTests.lightLoad;
      expect(lightLoadTest.concurrentUsers).toBe(10);
      expect(lightLoadTest.duration).toBe('5m');
      expect(lightLoadTest.expectedMetrics).toBeDefined();
    });

    it('should have proper stress test scenarios', () => {
      const stressTests = performanceData.performanceTestData.stressTestScenarios;
      
      expect(stressTests.peakLoad).toBeDefined();
      expect(stressTests.breakingPoint).toBeDefined();
      
      const peakLoadTest = stressTests.peakLoad;
      expect(peakLoadTest.concurrentUsers).toBe(200);
      expect(peakLoadTest.duration).toBe('20m');
    });
  });

  describe('Integration with Test Framework', () => {
    it('should integrate with existing test utilities', () => {
      // Verify that the test packages work with existing API test utilities
      expect(ApiTestUtils).toBeDefined();
      expect(ApiTestUtils.makeRequest).toBeDefined();
    });

    it('should support test execution utilities', () => {
      // Verify that bundled test utilities are available
      expect(BundledTestUtilities).toBeDefined();
      expect(BundledTestUtilities.executeComprehensiveTestSuite).toBeDefined();
      expect(BundledTestUtilities.executeAllTestSuites).toBeDefined();
    });
  });
});

describe('Test Package Compatibility', () => {
  it('should maintain backward compatibility', async () => {
    // Test that legacy test packages can still be loaded
    const legacyPackages = await TestDataLoader.loadLegacyTestPackages();
    
    expect(legacyPackages).toBeDefined();
    expect(legacyPackages.testSurveys).toBeDefined();
    expect(legacyPackages.testScenarios).toBeDefined();
  });

  it('should support mixed test data usage', async () => {
    // Test that new and legacy packages can be used together
    const newPackages = await TestDataLoader.loadComprehensiveTestPackages();
    const legacyPackages = await TestDataLoader.loadLegacyTestPackages();
    
    expect(newPackages).toBeDefined();
    expect(legacyPackages).toBeDefined();
    
    // Verify both can coexist
    expect(Object.keys(newPackages.surveys).length).toBeGreaterThan(0);
    expect(Object.keys(legacyPackages.testSurveys).length).toBeGreaterThan(0);
  });
});