import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SurveyApiClient } from '@/lib/api-client';
import { isSuccessResponse, isApiError } from '@/lib/api-types';

// Mock fetch for testing
global.fetch = vi.fn();

const mockFetch = fetch as any;

describe('Survey Step API Integration', () => {
  let client: SurveyApiClient;

  beforeEach(() => {
    client = new SurveyApiClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Survey Flow', () => {
    it('should complete a full survey flow', async () => {
      // Mock responses for the complete flow
      const mockResponses = [
        // 1. Get survey metadata
        {
          ok: true,
          json: () => Promise.resolve({
            id: 'test-survey',
            name: 'Test Survey',
            description: 'A test survey',
            totalSteps: 2,
            estimatedTimeMinutes: 4,
            status: 'active'
          })
        },
        // 2. Get stakeholders
        {
          ok: true,
          json: () => Promise.resolve({
            stakeholders: [
              {
                id: 'manager',
                name: 'Manager',
                description: 'Leadership role',
                color: '#dc2626',
                expertise: ['strategy']
              },
              {
                id: 'user',
                name: 'User',
                description: 'End user',
                color: '#059669',
                expertise: ['user_experience']
              }
            ]
          })
        },
        // 3. Get first step
        {
          ok: true,
          json: () => Promise.resolve({
            stepId: 'q1',
            stepNumber: 1,
            totalSteps: 2,
            questions: [
              {
                id: 'q1',
                type: 'likert',
                text: 'How satisfied are you?',
                required: true,
                scale: { min: 1, max: 5, labels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'] }
              }
            ],
            navigation: {
              canGoBack: false,
              canGoForward: true,
              nextStepId: 'q2',
              prevStepId: null
            },
            stakeholderId: 'manager',
            organizationId: 'test-org'
          })
        },
        // 4. Submit first step
        {
          ok: true,
          json: () => Promise.resolve({
            success: true,
            nextStepId: 'q2',
            isComplete: false,
            message: 'Step completed successfully'
          })
        },
        // 5. Get progress
        {
          ok: true,
          json: () => Promise.resolve({
            currentStepId: 'q2',
            currentStepNumber: 2,
            totalSteps: 2,
            completedSteps: 1,
            percentageComplete: 50,
            stakeholderId: 'manager',
            organizationId: 'test-org'
          })
        },
        // 6. Get second step
        {
          ok: true,
          json: () => Promise.resolve({
            stepId: 'q2',
            stepNumber: 2,
            totalSteps: 2,
            questions: [
              {
                id: 'q2',
                type: 'multipleChoice',
                text: 'What is your role?',
                required: true,
                options: ['Executive', 'Manager', 'Individual Contributor']
              }
            ],
            navigation: {
              canGoBack: true,
              canGoForward: false,
              nextStepId: null,
              prevStepId: 'q1'
            },
            stakeholderId: 'manager',
            organizationId: 'test-org'
          })
        },
        // 7. Submit second step
        {
          ok: true,
          json: () => Promise.resolve({
            success: true,
            nextStepId: null,
            isComplete: true,
            message: 'Survey completed successfully'
          })
        },
        // 8. Complete survey
        {
          ok: true,
          json: () => Promise.resolve({
            success: true,
            surveyId: 'test-survey',
            completedAt: '2025-07-11T10:30:00.000Z',
            resultId: 'test-org-manager-user-123',
            message: 'Survey completed successfully'
          })
        }
      ];

      let callIndex = 0;
      mockFetch.mockImplementation(() => {
        const response = mockResponses[callIndex++];
        return Promise.resolve(response);
      });

      // 1. Get survey metadata
      const metadata = await client.getSurveyMetadata('test-survey');
      expect(isSuccessResponse(metadata)).toBe(true);
      if (isSuccessResponse(metadata)) {
        expect(metadata.id).toBe('test-survey');
        expect(metadata.name).toBe('Test Survey');
        expect(metadata.totalSteps).toBe(2);
      }

      // 2. Get stakeholders
      const stakeholders = await client.getStakeholders('test-survey');
      expect(isSuccessResponse(stakeholders)).toBe(true);
      if (isSuccessResponse(stakeholders)) {
        expect(stakeholders.stakeholders).toHaveLength(2);
        expect(stakeholders.stakeholders[0].id).toBe('manager');
      }

      // 3. Get first step
      const step1 = await client.getSurveyStep('test-survey', 'q1', 'manager', 'test-org');
      expect(isSuccessResponse(step1)).toBe(true);
      if (isSuccessResponse(step1)) {
        expect(step1.stepId).toBe('q1');
        expect(step1.stepNumber).toBe(1);
        expect(step1.questions).toHaveLength(1);
        expect(step1.navigation.canGoBack).toBe(false);
        expect(step1.navigation.canGoForward).toBe(true);
      }

      // 4. Submit first step
      const submit1 = await client.submitSurveyStep('test-survey', 'q1', {
        responses: { q1: 4 },
        stepId: 'q1',
        stakeholderId: 'manager',
        organizationId: 'test-org'
      });
      expect(isSuccessResponse(submit1)).toBe(true);
      if (isSuccessResponse(submit1)) {
        expect(submit1.success).toBe(true);
        expect(submit1.nextStepId).toBe('q2');
        expect(submit1.isComplete).toBe(false);
      }

      // 5. Get progress
      const progress = await client.getSurveyProgress('test-survey', 'manager', 'test-org', 'q2');
      expect(isSuccessResponse(progress)).toBe(true);
      if (isSuccessResponse(progress)) {
        expect(progress.currentStepId).toBe('q2');
        expect(progress.currentStepNumber).toBe(2);
        expect(progress.percentageComplete).toBe(50);
      }

      // 6. Get second step
      const step2 = await client.getSurveyStep('test-survey', 'q2', 'manager', 'test-org');
      expect(isSuccessResponse(step2)).toBe(true);
      if (isSuccessResponse(step2)) {
        expect(step2.stepId).toBe('q2');
        expect(step2.stepNumber).toBe(2);
        expect(step2.navigation.canGoBack).toBe(true);
        expect(step2.navigation.canGoForward).toBe(false);
      }

      // 7. Submit second step
      const submit2 = await client.submitSurveyStep('test-survey', 'q2', {
        responses: { q2: 'Manager' },
        stepId: 'q2',
        stakeholderId: 'manager',
        organizationId: 'test-org'
      });
      expect(isSuccessResponse(submit2)).toBe(true);
      if (isSuccessResponse(submit2)) {
        expect(submit2.success).toBe(true);
        expect(submit2.nextStepId).toBe(null);
        expect(submit2.isComplete).toBe(true);
      }

      // 8. Complete survey
      const completion = await client.completeSurvey('test-survey', {
        stakeholderId: 'manager',
        organizationId: 'test-org',
        respondentId: 'user-123',
        responses: { q1: 4, q2: 'Manager' },
        expertise: ['strategy'],
        startTime: '2025-07-11T10:00:00.000Z',
        metadata: { userAgent: 'test-browser' }
      });
      expect(isSuccessResponse(completion)).toBe(true);
      if (isSuccessResponse(completion)) {
        expect(completion.success).toBe(true);
        expect(completion.surveyId).toBe('test-survey');
        expect(completion.completedAt).toBeDefined();
      }

      // Verify all API calls were made
      expect(mockFetch).toHaveBeenCalledTimes(8);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: true,
          message: 'Survey not found',
          code: 'SURVEY_NOT_FOUND'
        })
      });

      const result = await client.getSurveyMetadata('non-existent');
      expect(isApiError(result)).toBe(true);
      if (isApiError(result)) {
        expect(result.code).toBe('SURVEY_NOT_FOUND');
        expect(result.message).toBe('Survey not found');
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await client.getSurveyMetadata('test-survey');
      expect(isApiError(result)).toBe(true);
      if (isApiError(result)) {
        expect(result.code).toBe('NETWORK_ERROR');
        expect(result.message).toBe('Network error');
      }
    });
  });

  describe('Stakeholder-Specific Filtering', () => {
    it('should filter questions based on stakeholder', async () => {
      // Mock different responses for different stakeholders
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            stepId: 'q1',
            stepNumber: 1,
            totalSteps: 2,
            questions: [{ id: 'q1', type: 'likert', text: 'Manager question', required: true }],
            navigation: { canGoBack: false, canGoForward: true, nextStepId: 'q2', prevStepId: null }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            stepId: 'q1',
            stepNumber: 1,
            totalSteps: 1,
            questions: [{ id: 'q1', type: 'likert', text: 'User question', required: true }],
            navigation: { canGoBack: false, canGoForward: false, nextStepId: null, prevStepId: null }
          })
        });

      // Get step for manager
      const managerStep = await client.getSurveyStep('test-survey', 'q1', 'manager');
      expect(isSuccessResponse(managerStep)).toBe(true);
      if (isSuccessResponse(managerStep)) {
        expect(managerStep.totalSteps).toBe(2);
        expect(managerStep.questions[0].text).toBe('Manager question');
      }

      // Get step for user
      const userStep = await client.getSurveyStep('test-survey', 'q1', 'user');
      expect(isSuccessResponse(userStep)).toBe(true);
      if (isSuccessResponse(userStep)) {
        expect(userStep.totalSteps).toBe(1);
        expect(userStep.questions[0].text).toBe('User question');
      }
    });
  });

  describe('Validation', () => {
    it('should validate required fields in submission', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          nextStepId: null,
          isComplete: false,
          message: 'Validation errors found',
          errors: { q1: 'This field is required' }
        })
      });

      const result = await client.submitSurveyStep('test-survey', 'q1', {
        responses: {}, // Empty responses should trigger validation error
        stepId: 'q1',
        stakeholderId: 'manager',
        organizationId: 'test-org'
      });

      expect(isSuccessResponse(result)).toBe(false);
      // Note: In this case, the API returns a structured response with success: false
      // but with HTTP 200/400 status. The client should handle this appropriately.
    });
  });
});