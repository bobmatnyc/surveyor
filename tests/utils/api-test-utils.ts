import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ApiResponse, ApiErrorResponse } from '@/lib/api-types';
import surveyTestPackages from '../fixtures/survey-test-packages.json';
import mockResponses from '../fixtures/api-mock-responses.json';

export const createMockServer = () => {
  const server = setupServer(
    // Survey metadata endpoint
    http.get('/api/surveys/:surveyId', ({ params }) => {
      const { surveyId } = params;
      const metadata = mockResponses.surveyMetadata[surveyId as string];
      
      if (!metadata) {
        return HttpResponse.json(mockResponses.errorResponses['survey-not-found'], { status: 404 });
      }
      
      return HttpResponse.json(metadata);
    }),

    // Stakeholder list endpoint
    http.get('/api/surveys/:surveyId/stakeholders', ({ params }) => {
      const { surveyId } = params;
      const stakeholders = mockResponses.stakeholderLists[surveyId as string];
      
      if (!stakeholders) {
        return HttpResponse.json(mockResponses.errorResponses['survey-not-found'], { status: 404 });
      }
      
      return HttpResponse.json(stakeholders);
    }),

    // Survey step endpoint
    http.get('/api/surveys/:surveyId/step/:stepId', ({ params }) => {
      const { surveyId, stepId } = params;
      const stepKey = `${surveyId}-${stepId}`;
      const stepData = mockResponses.surveySteps[stepKey];
      
      if (!stepData) {
        return HttpResponse.json({
          error: true,
          message: 'Step not found',
          code: 'STEP_NOT_FOUND'
        }, { status: 404 });
      }
      
      return HttpResponse.json(stepData);
    }),

    // Submit step endpoint
    http.post('/api/surveys/:surveyId/step/:stepId/submit', async ({ request, params }) => {
      const { surveyId, stepId } = params;
      
      try {
        const body = await request.json();
        
        // Simple validation check
        if (!body || typeof body !== 'object') {
          return HttpResponse.json(mockResponses.errorResponses['validation-error'], { status: 400 });
        }
        
        // Check for required fields
        if (!body.stakeholderId || !body.organizationId || !body.responses) {
          return HttpResponse.json(mockResponses.errorResponses['validation-error'], { status: 400 });
        }
        
        // Return success response
        return HttpResponse.json(mockResponses.submitResponses.success);
      } catch (error) {
        return HttpResponse.json(mockResponses.errorResponses['validation-error'], { status: 400 });
      }
    }),

    // Error fallback
    http.get('*', () => {
      return HttpResponse.json({
        error: true,
        message: 'Endpoint not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    })
  );

  return server;
};

export const createApiTestSuite = (baseUrl: string = '/api') => {
  const server = createMockServer();

  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  return {
    server,
    testSurveys: surveyTestPackages.testSurveys,
    testScenarios: surveyTestPackages.testScenarios,
    mockResponses: mockResponses,
    
    // Helper methods
    expectSuccessResponse: <T>(response: ApiResponse<T>): T => {
      expect(response).toBeDefined();
      expect('error' in response && response.error).toBe(false);
      return response as T;
    },

    expectErrorResponse: (response: ApiResponse<any>): ApiErrorResponse => {
      expect(response).toBeDefined();
      expect('error' in response && response.error).toBe(true);
      return response as ApiErrorResponse;
    },

    createFetchRequest: async (endpoint: string, options: RequestInit = {}) => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return errorData;
      }

      return await response.json();
    }
  };
};

// Test data factories
export const createTestOrganization = (overrides: Partial<any> = {}) => ({
  id: 'test-org-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Organization',
  ...overrides
});

export const createTestStakeholder = (overrides: Partial<any> = {}) => ({
  id: 'stakeholder-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Stakeholder',
  description: 'Test stakeholder description',
  color: '#3B82F6',
  expertise: ['testing'],
  ...overrides
});

export const createTestSurveyResponse = (overrides: Partial<any> = {}) => ({
  surveyId: 'test-survey',
  stakeholderId: 'test-stakeholder',
  organizationId: 'test-org',
  responses: {},
  ...overrides
});

// Common test assertions
export const assertValidSurveyMetadata = (metadata: any) => {
  expect(metadata).toMatchObject({
    id: expect.any(String),
    name: expect.any(String),
    description: expect.any(String),
    totalSteps: expect.any(Number),
    estimatedTimeMinutes: expect.any(Number),
    status: expect.stringMatching(/^(active|completed|draft)$/)
  });
};

export const assertValidStakeholderList = (stakeholders: any) => {
  expect(stakeholders).toHaveProperty('stakeholders');
  expect(Array.isArray(stakeholders.stakeholders)).toBe(true);
  
  stakeholders.stakeholders.forEach((stakeholder: any) => {
    expect(stakeholder).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      color: expect.any(String),
      expertise: expect.any(Array)
    });
  });
};

export const assertValidSurveyStep = (step: any) => {
  expect(step).toMatchObject({
    stepId: expect.any(String),
    stepNumber: expect.any(Number),
    totalSteps: expect.any(Number),
    questions: expect.any(Array),
    navigation: expect.objectContaining({
      canGoBack: expect.any(Boolean),
      canGoForward: expect.any(Boolean)
    })
  });
};