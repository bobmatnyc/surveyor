import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEnhancedApiTestSuite, apiAssertions, TestDataFactory } from '../../utils/enhanced-api-test-utils';
import { ApiTestConfig } from '../../config/api-test-config';
import comprehensiveFixtures from '../../fixtures/comprehensive-api-fixtures.json';

describe('Comprehensive Survey Step Endpoints Tests', () => {
  let apiTestSuite: any;
  
  beforeEach(async () => {
    const config: Partial<ApiTestConfig> = {
      performance: {
        enabled: true,
        maxResponseTime: 2000,
        loadTestConcurrency: 8,
        loadTestRequests: 40
      },
      security: {
        enabled: true,
        checkHeaders: true,
        checkCors: true,
        checkRateLimit: false
      }
    };

    apiTestSuite = createEnhancedApiTestSuite(config);
    apiTestSuite.beforeEach();
  });

  afterEach(() => {
    apiTestSuite.afterEach();
  });

  describe('GET /api/surveys/:surveyId/step/:stepId', () => {
    describe('Happy Path Tests', () => {
      it('should return step data for valid survey and step', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-minimal/step/q1?stakeholderId=ceo');
        
        expect(response.status).toBe(200);
        apiAssertions.isValidSurveyStep(data);
        apiAssertions.hasSecurityHeaders(response);
        
        expect(data.stepId).toBe('q1');
        expect(data.stepNumber).toBe(1);
        expect(data.questions).toHaveLength(1);
        expect(data.questions[0].id).toBe('q1');
        expect(data.questions[0].type).toBe('text');
        expect(data.questions[0].required).toBe(true);
      });

      it('should return step with stakeholder filtering', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-comprehensive/step/q1?stakeholderId=ceo');
        
        expect(response.status).toBe(200);
        expect(data.stepId).toBe('q1');
        expect(data.stakeholderId).toBe('ceo');
        expect(data.questions).toHaveLength(1);
        expect(data.questions[0].id).toBe('q1');
      });

      it('should return step by number instead of ID', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-minimal/step/1?stakeholderId=ceo');
        
        expect(response.status).toBe(200);
        expect(data.stepNumber).toBe(1);
        expect(data.questions).toHaveLength(1);
      });

      it('should include navigation information', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-comprehensive/step/q1?stakeholderId=ceo');
        
        expect(response.status).toBe(200);
        expect(data.navigation).toBeDefined();
        expect(data.navigation.canGoBack).toBe(false); // First step
        expect(data.navigation.canGoForward).toBe(true);
        expect(data.navigation.nextStepId).toBeTruthy();
        expect(data.navigation.prevStepId).toBe(null);
      });

      it('should handle middle step navigation', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-comprehensive/step/q3?stakeholderId=ceo');
        
        expect(response.status).toBe(200);
        expect(data.navigation.canGoBack).toBe(true);
        expect(data.navigation.canGoForward).toBe(true);
        expect(data.navigation.nextStepId).toBeTruthy();
        expect(data.navigation.prevStepId).toBeTruthy();
      });

      it('should handle final step navigation', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-comprehensive/step/q6?stakeholderId=ceo');
        
        expect(response.status).toBe(200);
        expect(data.navigation.canGoBack).toBe(true);
        expect(data.navigation.canGoForward).toBe(false); // Last step
        expect(data.navigation.nextStepId).toBe(null);
        expect(data.navigation.prevStepId).toBeTruthy();
      });

      it('should include progress information', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-comprehensive/step/q2?stakeholderId=ceo&organizationId=test-org');
        
        expect(response.status).toBe(200);
        expect(data.stepNumber).toBeDefined();
        expect(data.totalSteps).toBeDefined();
        expect(data.stakeholderId).toBe('ceo');
        expect(data.organizationId).toBe('test-org');
        expect(data.stepNumber).toBeLessThanOrEqual(data.totalSteps);
      });
    });

    describe('Question Type Tests', () => {
      it('should return text question with validation rules', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-minimal/step/q1?stakeholderId=ceo');
        
        expect(response.status).toBe(200);
        const textQuestion = data.questions[0];
        expect(textQuestion.type).toBe('text');
        expect(textQuestion.text).toBeTruthy();
        expect(textQuestion.required).toBe(true);
        expect(textQuestion.validation).toBeDefined();
        expect(textQuestion.validation.minLength).toBeDefined();
        expect(textQuestion.validation.maxLength).toBeDefined();
      });

      it('should return multiple choice question with options', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-minimal/step/q2?stakeholderId=ceo');
        
        expect(response.status).toBe(200);
        const mcQuestion = data.questions[0];
        expect(mcQuestion.type).toBe('multipleChoice');
        expect(mcQuestion.options).toBeDefined();
        expect(Array.isArray(mcQuestion.options)).toBe(true);
        expect(mcQuestion.options.length).toBeGreaterThan(0);
        expect(mcQuestion.options).toContain('Excellent');
        expect(mcQuestion.options).toContain('Good');
      });

      it('should return likert scale question with scale information', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-comprehensive/step/q3?stakeholderId=ceo');
        
        expect(response.status).toBe(200);
        const likertQuestion = data.questions[0];
        expect(likertQuestion.type).toBe('likert');
        expect(likertQuestion.scale).toBeDefined();
        expect(likertQuestion.scale.min).toBe(1);
        expect(likertQuestion.scale.max).toBe(5);
        expect(likertQuestion.scale.labels).toBeDefined();
        expect(Array.isArray(likertQuestion.scale.labels)).toBe(true);
      });

      it('should return boolean question', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-comprehensive/step/q4?stakeholderId=ceo');
        
        expect(response.status).toBe(200);
        const booleanQuestion = data.questions[0];
        expect(booleanQuestion.type).toBe('boolean');
        expect(booleanQuestion.required).toBe(true);
      });

      it('should return number question with validation', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-comprehensive/step/q5?stakeholderId=ceo');
        
        expect(response.status).toBe(200);
        const numberQuestion = data.questions[0];
        expect(numberQuestion.type).toBe('number');
        expect(numberQuestion.required).toBe(false);
        expect(numberQuestion.validation).toBeDefined();
        expect(numberQuestion.validation.min).toBeDefined();
        expect(numberQuestion.validation.max).toBeDefined();
      });
    });

    describe('Error Handling Tests', () => {
      it('should return 404 for non-existent survey', async () => {
        const { response, data } = await apiTestSuite.get('/survey/non-existent/step/q1', 404);
        
        expect(response.status).toBe(404);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('SURVEY_NOT_FOUND');
      });

      it('should return 404 for non-existent step', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-minimal/step/invalid-step', 404);
        
        expect(response.status).toBe(404);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('STEP_NOT_FOUND');
      });

      it('should return 404 for step not accessible to stakeholder', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-comprehensive/step/q1?stakeholderId=staff', 404);
        
        expect(response.status).toBe(404);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('STEP_NOT_FOUND');
      });

      it('should return 400 for invalid survey ID', async () => {
        const { response, data } = await apiTestSuite.get('/survey//step/q1', 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_SURVEY_ID');
      });

      it('should return 400 for invalid step ID', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-minimal/step/', 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_STEP_ID');
      });

      it('should return 403 for inactive survey', async () => {
        const { response, data } = await apiTestSuite.get('/survey/test-inactive/step/q1', 403);
        
        expect(response.status).toBe(403);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('SURVEY_INACTIVE');
      });
    });
  });

  describe('POST /api/surveys/:surveyId/step/:stepId', () => {
    describe('Happy Path Tests', () => {
      it('should accept valid step submission', async () => {
        const submitData = {
          responses: { q1: 'Growing our market share and expanding internationally' },
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', submitData);
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBeTruthy();
        expect(data.isComplete).toBe(false);
        expect(data.nextStepId).toBeTruthy();
        apiAssertions.hasSecurityHeaders(response);
      });

      it('should accept submission with multiple question types', async () => {
        const submitData = {
          responses: {
            q1: 'Our mission is to revolutionize digital transformation',
            q2: 'cloud',
            q3: 4,
            q4: true,
            q5: 25
          },
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-comprehensive/step/q1', submitData);
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.nextStepId).toBeTruthy();
      });

      it('should handle final step submission', async () => {
        const submitData = {
          responses: { q6: 4 },
          stepId: 'q6',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-comprehensive/step/q6', submitData);
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.isComplete).toBe(true);
        expect(data.nextStepId).toBe(null);
        expect(data.message).toContain('completed');
      });

      it('should handle optional question submission', async () => {
        const submitData = {
          responses: { q5: 25 }, // Optional question
          stepId: 'q5',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-comprehensive/step/q5', submitData);
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should handle partial submission flag', async () => {
        const submitData = {
          responses: { q1: 'Partial response' },
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org',
          partialSubmission: true
        };

        const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', submitData);
        
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Validation Tests', () => {
      it('should reject submission with missing required fields', async () => {
        const submitData = {
          responses: { q2: 'good' }, // Missing required q1
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', submitData, 400);
        
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.errors).toBeDefined();
        expect(data.errors.q1).toBe('This field is required');
      });

      it('should validate text field length', async () => {
        const submitData = {
          responses: { q1: 'Too short' }, // Below minimum length
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', submitData, 400);
        
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.errors).toBeDefined();
        expect(data.errors.q1).toContain('at least');
      });

      it('should validate number field type', async () => {
        const submitData = {
          responses: { q5: 'not a number' }, // Invalid number
          stepId: 'q5',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-comprehensive/step/q5', submitData, 400);
        
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.errors).toBeDefined();
        expect(data.errors.q5).toContain('valid number');
      });

      it('should validate boolean field type', async () => {
        const submitData = {
          responses: { q4: 'maybe' }, // Invalid boolean
          stepId: 'q4',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-comprehensive/step/q4', submitData, 400);
        
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.errors).toBeDefined();
        expect(data.errors.q4).toContain('true or false');
      });

      it('should validate missing stakeholder ID', async () => {
        const submitData = {
          responses: { q1: 'Valid response' },
          stepId: 'q1',
          organizationId: 'test-org'
          // Missing stakeholderId
        };

        const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', submitData, 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
      });

      it('should validate missing organization ID', async () => {
        const submitData = {
          responses: { q1: 'Valid response' },
          stepId: 'q1',
          stakeholderId: 'ceo'
          // Missing organizationId
        };

        const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', submitData, 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
      });
    });

    describe('Error Handling Tests', () => {
      it('should return 400 for invalid JSON', async () => {
        const { response, data } = await apiTestSuite.makeRequest('/survey/test-minimal/step/q1', {
          method: 'POST',
          body: 'invalid json'
        }, 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_JSON');
      });

      it('should return 400 for missing content type', async () => {
        const { response, data } = await apiTestSuite.makeRequest('/survey/test-minimal/step/q1', {
          method: 'POST',
          headers: {}, // Missing content-type
          body: JSON.stringify({ test: 'data' })
        }, 400);
        
        expect(response.status).toBe(400);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('INVALID_CONTENT_TYPE');
      });

      it('should return 404 for non-existent survey', async () => {
        const submitData = {
          responses: { q1: 'Valid response' },
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/non-existent/step/q1', submitData, 404);
        
        expect(response.status).toBe(404);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('SURVEY_NOT_FOUND');
      });

      it('should return 404 for non-existent step', async () => {
        const submitData = {
          responses: { invalid: 'response' },
          stepId: 'invalid-step',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/invalid-step', submitData, 404);
        
        expect(response.status).toBe(404);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('STEP_NOT_FOUND');
      });

      it('should return 403 for inactive survey', async () => {
        const submitData = {
          responses: { q1: 'Valid response' },
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-inactive/step/q1', submitData, 403);
        
        expect(response.status).toBe(403);
        apiAssertions.isValidApiError(data);
        expect(data.code).toBe('SURVEY_INACTIVE');
      });
    });

    describe('Security Tests', () => {
      it('should sanitize malicious input in responses', async () => {
        const submitData = {
          responses: { 
            q1: '<script>alert("xss")</script>' 
          },
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', submitData, 400);
        
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        // Should reject or sanitize malicious input
      });

      it('should prevent SQL injection in responses', async () => {
        const submitData = {
          responses: { 
            q1: "'; DROP TABLE responses; --" 
          },
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', submitData, 400);
        
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        // Should reject malicious SQL
      });

      it('should validate content length limits', async () => {
        const submitData = {
          responses: { 
            q1: 'A'.repeat(10000) // Extremely long response
          },
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { response, data } = await apiTestSuite.post('/survey/test-minimal/step/q1', submitData, 400);
        
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.errors.q1).toContain('exceed');
      });
    });

    describe('Performance Tests', () => {
      it('should handle step submissions efficiently', async () => {
        const submitData = {
          responses: { q1: 'Performance test response' },
          stepId: 'q1',
          stakeholderId: 'ceo',
          organizationId: 'test-org'
        };

        const { metrics } = await apiTestSuite.post('/survey/test-minimal/step/q1', submitData);
        
        expect(metrics.responseTime).toBeLessThan(2000); // 2 seconds max
      });

      it('should handle concurrent submissions', async () => {
        const performanceResults = await apiTestSuite.performanceTest('/survey/test-minimal/step/q1', {
          concurrency: 5,
          requests: 25,
          maxResponseTime: 3000
        });
        
        expect(performanceResults.errorRate).toBeLessThan(0.1); // Allow slightly higher error rate for POST
        expect(performanceResults.avgResponseTime).toBeLessThan(3000);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should maintain step flow consistency', async () => {
      // Get first step
      const { data: step1 } = await apiTestSuite.get('/survey/test-minimal/step/q1?stakeholderId=ceo');
      
      // Submit first step
      const submitData = {
        responses: { q1: 'Integration test response' },
        stepId: 'q1',
        stakeholderId: 'ceo',
        organizationId: 'test-org'
      };
      
      const { data: submitResponse } = await apiTestSuite.post('/survey/test-minimal/step/q1', submitData);
      
      // Verify navigation consistency
      expect(step1.navigation.nextStepId).toBe(submitResponse.nextStepId);
      expect(step1.stepId).toBe(submitResponse.stepId || 'q1');
    });

    it('should handle multi-step survey progression', async () => {
      const stakeholderId = 'ceo';
      const organizationId = 'test-org';
      
      // Get survey steps for stakeholder
      const { data: step1 } = await apiTestSuite.get(`/survey/test-comprehensive/step/q1?stakeholderId=${stakeholderId}`);
      
      // Submit each step in sequence
      const responses = [
        { q1: 'Mission statement response' },
        { q2: 'cloud' },
        { q3: 4 },
        { q4: true },
        { q5: 25 }
      ];
      
      let currentStepId = step1.stepId;
      let stepIndex = 0;
      
      while (currentStepId && stepIndex < responses.length) {
        const submitData = {
          responses: responses[stepIndex],
          stepId: currentStepId,
          stakeholderId,
          organizationId
        };
        
        const { data: submitResponse } = await apiTestSuite.post(`/survey/test-comprehensive/step/${currentStepId}`, submitData);
        
        expect(submitResponse.success).toBe(true);
        currentStepId = submitResponse.nextStepId;
        stepIndex++;
      }
    });
  });
});