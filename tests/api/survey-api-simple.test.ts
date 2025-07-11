import { describe, it, expect, vi } from 'vitest';
import { SurveyApiClient } from '@/lib/api-client';
import { isSuccessResponse, isApiError } from '@/lib/api-types';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Survey API Client', () => {
  let client: SurveyApiClient;

  beforeEach(() => {
    client = new SurveyApiClient();
    vi.clearAllMocks();
  });

  describe('getSurveyMetadata', () => {
    it('should return survey metadata for valid survey', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-survey',
          name: 'Test Survey',
          description: 'A test survey',
          totalSteps: 3,
          estimatedTimeMinutes: 6,
          status: 'active'
        })
      });

      const result = await client.getSurveyMetadata('test-survey');
      
      expect(isSuccessResponse(result)).toBe(true);
      if (isSuccessResponse(result)) {
        expect(result.id).toBe('test-survey');
        expect(result.name).toBe('Test Survey');
        expect(result.totalSteps).toBe(3);
        expect(result.status).toBe('active');
      }
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValue({
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
  });

  describe('getStakeholders', () => {
    it('should return stakeholders list', async () => {
      (global.fetch as any).mockResolvedValue({
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
      });

      const result = await client.getStakeholders('test-survey');
      
      expect(isSuccessResponse(result)).toBe(true);
      if (isSuccessResponse(result)) {
        expect(result.stakeholders).toHaveLength(2);
        expect(result.stakeholders[0].id).toBe('manager');
        expect(result.stakeholders[0].name).toBe('Manager');
        expect(result.stakeholders[0].expertise).toEqual(['strategy']);
      }
    });
  });

  describe('getSurveyStep', () => {
    it('should return survey step with questions', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          stepId: 'q1',
          stepNumber: 1,
          totalSteps: 3,
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
      });

      const result = await client.getSurveyStep('test-survey', 'q1', 'manager', 'test-org');
      
      expect(isSuccessResponse(result)).toBe(true);
      if (isSuccessResponse(result)) {
        expect(result.stepId).toBe('q1');
        expect(result.stepNumber).toBe(1);
        expect(result.questions).toHaveLength(1);
        expect(result.questions[0].id).toBe('q1');
        expect(result.questions[0].type).toBe('likert');
        expect(result.navigation.canGoBack).toBe(false);
        expect(result.navigation.canGoForward).toBe(true);
        expect(result.navigation.nextStepId).toBe('q2');
      }
    });

    it('should construct URL with query parameters', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          stepId: 'q1',
          stepNumber: 1,
          totalSteps: 1,
          questions: [],
          navigation: { canGoBack: false, canGoForward: false, nextStepId: null, prevStepId: null }
        })
      });

      await client.getSurveyStep('test-survey', 'q1', 'manager', 'test-org');
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/surveys/test-survey/step/q1?stakeholderId=manager&organizationId=test-org',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('submitSurveyStep', () => {
    it('should submit step responses', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          nextStepId: 'q2',
          isComplete: false,
          message: 'Step completed successfully'
        })
      });

      const submitData = {
        responses: { q1: 4 },
        stepId: 'q1',
        stakeholderId: 'manager',
        organizationId: 'test-org'
      };

      const result = await client.submitSurveyStep('test-survey', 'q1', submitData);
      
      expect(isSuccessResponse(result)).toBe(true);
      if (isSuccessResponse(result)) {
        expect(result.success).toBe(true);
        expect(result.nextStepId).toBe('q2');
        expect(result.isComplete).toBe(false);
        expect(result.message).toBe('Step completed successfully');
      }

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/surveys/test-survey/step/q1',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(submitData)
        })
      );
    });
  });

  describe('getSurveyProgress', () => {
    it('should return progress information', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          currentStepId: 'q2',
          currentStepNumber: 2,
          totalSteps: 3,
          completedSteps: 1,
          percentageComplete: 33,
          stakeholderId: 'manager',
          organizationId: 'test-org'
        })
      });

      const result = await client.getSurveyProgress('test-survey', 'manager', 'test-org', 'q2');
      
      expect(isSuccessResponse(result)).toBe(true);
      if (isSuccessResponse(result)) {
        expect(result.currentStepId).toBe('q2');
        expect(result.currentStepNumber).toBe(2);
        expect(result.totalSteps).toBe(3);
        expect(result.completedSteps).toBe(1);
        expect(result.percentageComplete).toBe(33);
        expect(result.stakeholderId).toBe('manager');
        expect(result.organizationId).toBe('test-org');
      }
    });
  });

  describe('completeSurvey', () => {
    it('should complete survey', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          surveyId: 'test-survey',
          completedAt: '2025-07-11T10:30:00.000Z',
          resultId: 'test-org-manager-user-123',
          message: 'Survey completed successfully'
        })
      });

      const completeData = {
        stakeholderId: 'manager',
        organizationId: 'test-org',
        respondentId: 'user-123',
        responses: { q1: 4, q2: 'Manager' },
        expertise: ['strategy'],
        startTime: '2025-07-11T10:00:00.000Z',
        metadata: { userAgent: 'test-browser' }
      };

      const result = await client.completeSurvey('test-survey', completeData);
      
      expect(isSuccessResponse(result)).toBe(true);
      if (isSuccessResponse(result)) {
        expect(result.success).toBe(true);
        expect(result.surveyId).toBe('test-survey');
        expect(result.completedAt).toBe('2025-07-11T10:30:00.000Z');
        expect(result.resultId).toBe('test-org-manager-user-123');
        expect(result.message).toBe('Survey completed successfully');
      }

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/surveys/test-survey/complete',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(completeData)
        })
      );
    });
  });

  describe('network errors', () => {
    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await client.getSurveyMetadata('test-survey');
      
      expect(isApiError(result)).toBe(true);
      if (isApiError(result)) {
        expect(result.code).toBe('NETWORK_ERROR');
        expect(result.message).toBe('Network error');
      }
    });
  });
});