import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  createApiTestSuite, 
  assertValidSurveyMetadata,
  assertValidStakeholderList,
  assertValidSurveyStep
} from '../utils/api-test-utils';

describe('Survey API Endpoints', () => {
  const apiTest = createApiTestSuite();

  beforeEach(() => {
    // Additional setup if needed
  });

  afterEach(() => {
    apiTest.server.close();
  });

  describe('GET /api/surveys/:surveyId', () => {
    it('should return survey metadata for valid survey ID', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-minimal');
      
      const metadata = apiTest.expectSuccessResponse(response);
      assertValidSurveyMetadata(metadata);
      
      expect(metadata.id).toBe('test-minimal');
      expect(metadata.name).toBe('Minimal Test Survey');
      expect(metadata.totalSteps).toBe(1);
      expect(metadata.status).toBe('active');
    });

    it('should return 404 for non-existent survey ID', async () => {
      const response = await apiTest.createFetchRequest('/survey/invalid-survey');
      
      const error = apiTest.expectErrorResponse(response);
      expect(error.code).toBe('SURVEY_NOT_FOUND');
      expect(error.message).toBe('Survey not found');
    });

    it('should handle comprehensive survey metadata', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-comprehensive');
      
      const metadata = apiTest.expectSuccessResponse(response);
      assertValidSurveyMetadata(metadata);
      
      expect(metadata.id).toBe('test-comprehensive');
      expect(metadata.totalSteps).toBe(3);
      expect(metadata.estimatedTimeMinutes).toBe(15);
    });
  });

  describe('GET /api/surveys/:surveyId/stakeholders', () => {
    it('should return stakeholder list for valid survey', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-minimal/stakeholders');
      
      const stakeholders = apiTest.expectSuccessResponse(response);
      assertValidStakeholderList(stakeholders);
      
      expect(stakeholders.stakeholders).toHaveLength(2);
      expect(stakeholders.stakeholders[0].id).toBe('ceo');
      expect(stakeholders.stakeholders[1].id).toBe('tech-lead');
    });

    it('should return comprehensive stakeholder list', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-comprehensive/stakeholders');
      
      const stakeholders = apiTest.expectSuccessResponse(response);
      assertValidStakeholderList(stakeholders);
      
      expect(stakeholders.stakeholders).toHaveLength(4);
      
      const stakeholderIds = stakeholders.stakeholders.map((s: any) => s.id);
      expect(stakeholderIds).toContain('board');
      expect(stakeholderIds).toContain('ceo');
      expect(stakeholderIds).toContain('tech-lead');
      expect(stakeholderIds).toContain('staff');
    });

    it('should return 404 for non-existent survey', async () => {
      const response = await apiTest.createFetchRequest('/survey/invalid-survey/stakeholders');
      
      const error = apiTest.expectErrorResponse(response);
      expect(error.code).toBe('SURVEY_NOT_FOUND');
    });
  });

  describe('GET /api/surveys/:surveyId/step/:stepId', () => {
    it('should return step data for valid survey and step', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-minimal/step/step-1');
      
      const step = apiTest.expectSuccessResponse(response);
      assertValidSurveyStep(step);
      
      expect(step.stepId).toBe('step-1');
      expect(step.stepNumber).toBe(1);
      expect(step.totalSteps).toBe(1);
      expect(step.questions).toHaveLength(2);
      
      // Check navigation
      expect(step.navigation.canGoBack).toBe(false);
      expect(step.navigation.canGoForward).toBe(true);
      expect(step.navigation.nextStepId).toBe(null);
      expect(step.navigation.prevStepId).toBe(null);
    });

    it('should return multi-step navigation data', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-multi-step/step/step-1');
      
      const step = apiTest.expectSuccessResponse(response);
      assertValidSurveyStep(step);
      
      expect(step.stepId).toBe('step-1');
      expect(step.stepNumber).toBe(1);
      expect(step.totalSteps).toBe(3);
      expect(step.navigation.nextStepId).toBe('step-2');
      expect(step.navigation.prevStepId).toBe(null);
    });

    it('should return middle step navigation', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-multi-step/step/step-2');
      
      const step = apiTest.expectSuccessResponse(response);
      
      expect(step.stepId).toBe('step-2');
      expect(step.stepNumber).toBe(2);
      expect(step.navigation.canGoBack).toBe(true);
      expect(step.navigation.canGoForward).toBe(true);
      expect(step.navigation.nextStepId).toBe('step-3');
      expect(step.navigation.prevStepId).toBe('step-1');
    });

    it('should return final step navigation', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-multi-step/step/step-3');
      
      const step = apiTest.expectSuccessResponse(response);
      
      expect(step.stepId).toBe('step-3');
      expect(step.stepNumber).toBe(3);
      expect(step.navigation.canGoBack).toBe(true);
      expect(step.navigation.canGoForward).toBe(false);
      expect(step.navigation.nextStepId).toBe(null);
      expect(step.navigation.prevStepId).toBe('step-2');
    });

    it('should return 404 for non-existent step', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-minimal/step/invalid-step');
      
      const error = apiTest.expectErrorResponse(response);
      expect(error.code).toBe('STEP_NOT_FOUND');
    });
  });

  describe('POST /api/surveys/:surveyId/step/:stepId/submit', () => {
    it('should accept valid step submission', async () => {
      const submitData = {
        responses: {
          'q1': 'Test answer',
          'q2': 'Good'
        },
        stakeholderId: 'ceo',
        organizationId: 'test-org'
      };

      const response = await apiTest.createFetchRequest('/survey/test-minimal/step/step-1/submit', {
        method: 'POST',
        body: JSON.stringify(submitData)
      });
      
      const result = apiTest.expectSuccessResponse(response);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Step completed successfully');
    });

    it('should reject invalid submission data', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-minimal/step/step-1/submit', {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      const error = apiTest.expectErrorResponse(response);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle malformed request body', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-minimal/step/step-1/submit', {
        method: 'POST',
        body: 'invalid json'
      });
      
      const error = apiTest.expectErrorResponse(response);
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Question Types Validation', () => {
    it('should validate text question structure', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-minimal/step/step-1');
      const step = apiTest.expectSuccessResponse(response);
      
      const textQuestion = step.questions.find((q: any) => q.type === 'text');
      expect(textQuestion).toBeDefined();
      expect(textQuestion).toMatchObject({
        id: expect.any(String),
        type: 'text',
        text: expect.any(String),
        required: expect.any(Boolean)
      });
    });

    it('should validate multiple choice question structure', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-minimal/step/step-1');
      const step = apiTest.expectSuccessResponse(response);
      
      const mcQuestion = step.questions.find((q: any) => q.type === 'multipleChoice');
      expect(mcQuestion).toBeDefined();
      expect(mcQuestion).toMatchObject({
        id: expect.any(String),
        type: 'multipleChoice',
        text: expect.any(String),
        required: expect.any(Boolean),
        options: expect.any(Array)
      });
      expect(mcQuestion.options).toContain('Excellent');
      expect(mcQuestion.options).toContain('Good');
    });

    it('should validate likert scale question structure', async () => {
      const response = await apiTest.createFetchRequest('/survey/test-multi-step/step/step-2');
      const step = apiTest.expectSuccessResponse(response);
      
      const likertQuestion = step.questions.find((q: any) => q.type === 'likert');
      expect(likertQuestion).toBeDefined();
      expect(likertQuestion).toMatchObject({
        id: expect.any(String),
        type: 'likert',
        text: expect.any(String),
        required: expect.any(Boolean),
        scale: expect.objectContaining({
          min: expect.any(Number),
          max: expect.any(Number),
          labels: expect.any(Array)
        })
      });
    });
  });
});