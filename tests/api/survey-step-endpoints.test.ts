import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getSurveyMetadata } from '@/app/api/surveys/[surveyId]/route';
import { GET as getStakeholders } from '@/app/api/surveys/[surveyId]/stakeholders/route';
import { GET as getStakeholder } from '@/app/api/surveys/[surveyId]/stakeholder/[stakeholderId]/route';
import { GET as getSurveyStep, POST as submitSurveyStep } from '@/app/api/surveys/[surveyId]/step/[stepId]/route';
import { GET as getSurveyProgress } from '@/app/api/surveys/[surveyId]/progress/route';
import { POST as completeSurvey } from '@/app/api/surveys/[surveyId]/complete/route';
import { SurveyDataManager } from '@/lib/storage';
import { SurveySchema } from '@/lib/types';

// Mock SurveyDataManager
const mockDataManager = {
  getSchema: vi.fn(),
  saveResponse: vi.fn(),
  getInstance: vi.fn(() => mockDataManager)
};

vi.mock('@/lib/storage', () => ({
  SurveyDataManager: {
    getInstance: () => mockDataManager
  }
}));

const mockSurvey: SurveySchema = {
  id: 'test-survey',
  name: 'Test Survey',
  description: 'A test survey',
  version: '1.0.0',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  isActive: true,
  settings: {
    allowMultipleResponses: true,
    requireAllStakeholders: false,
    showProgressBar: true,
    allowNavigation: true
  },
  stakeholders: [
    {
      id: 'manager',
      name: 'Manager',
      description: 'Leadership role',
      weight: 0.5,
      color: '#dc2626',
      requiredExpertise: ['strategy']
    },
    {
      id: 'user',
      name: 'User',
      description: 'End user',
      weight: 0.5,
      color: '#059669',
      requiredExpertise: ['user_experience']
    }
  ],
  domains: [
    {
      id: 'satisfaction',
      name: 'Satisfaction',
      description: 'User satisfaction',
      weight: 1.0,
      color: '#059669',
      icon: 'user'
    }
  ],
  questions: [
    {
      id: 'q1',
      text: 'How satisfied are you?',
      type: 'likert_5' as any,
      domain: 'satisfaction',
      targetStakeholders: ['manager', 'user'],
      required: true,
      options: [
        { value: 1, label: 'Very Dissatisfied' },
        { value: 2, label: 'Dissatisfied' },
        { value: 3, label: 'Neutral' },
        { value: 4, label: 'Satisfied' },
        { value: 5, label: 'Very Satisfied' }
      ]
    },
    {
      id: 'q2',
      text: 'What is your role?',
      type: 'single_select' as any,
      domain: 'satisfaction',
      targetStakeholders: ['manager'],
      required: true,
      options: [
        { value: 'executive', label: 'Executive' },
        { value: 'manager', label: 'Manager' },
        { value: 'individual', label: 'Individual Contributor' }
      ]
    },
    {
      id: 'q3',
      text: 'Any additional comments?',
      type: 'text' as any,
      domain: 'satisfaction',
      targetStakeholders: ['user'],
      required: false,
      validation: { minLength: 5, maxLength: 500 }
    }
  ],
  scoring: {
    method: 'weighted_average' as any,
    stakeholderWeights: { manager: 0.5, user: 0.5 },
    domainWeights: { satisfaction: 1.0 },
    maturityLevels: [
      {
        id: 'basic',
        name: 'Basic',
        description: 'Basic level',
        minScore: 1,
        maxScore: 5,
        color: '#dc2626',
        recommendations: ['Improve processes']
      }
    ]
  }
};

describe('Survey Step Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataManager.getSchema.mockResolvedValue(mockSurvey);
    mockDataManager.saveResponse.mockResolvedValue('saved-response-id');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/surveys/[surveyId]', () => {
    it('should return survey metadata', async () => {
      const request = new NextRequest('http://localhost/api/surveys/test-survey');
      const params = { surveyId: 'test-survey' };
      
      const response = await getSurveyMetadata(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.id).toBe('test-survey');
      expect(data.name).toBe('Test Survey');
      expect(data.totalSteps).toBe(3);
      expect(data.status).toBe('active');
    });

    it('should return 404 for non-existent survey', async () => {
      mockDataManager.getSchema.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/surveys/non-existent');
      const params = { surveyId: 'non-existent' };
      
      const response = await getSurveyMetadata(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe(true);
      expect(data.code).toBe('SURVEY_NOT_FOUND');
    });

    it('should return 403 for inactive survey', async () => {
      mockDataManager.getSchema.mockResolvedValue({ ...mockSurvey, isActive: false });
      
      const request = new NextRequest('http://localhost/api/surveys/test-survey');
      const params = { surveyId: 'test-survey' };
      
      const response = await getSurveyMetadata(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toBe(true);
      expect(data.code).toBe('SURVEY_INACTIVE');
    });
  });

  describe('GET /api/surveys/[surveyId]/stakeholders', () => {
    it('should return stakeholders list', async () => {
      const request = new NextRequest('http://localhost/api/surveys/test-survey/stakeholders');
      const params = { surveyId: 'test-survey' };
      
      const response = await getStakeholders(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.stakeholders).toHaveLength(2);
      expect(data.stakeholders[0].id).toBe('manager');
      expect(data.stakeholders[0].name).toBe('Manager');
      expect(data.stakeholders[0].expertise).toEqual(['strategy']);
    });
  });

  describe('GET /api/surveys/[surveyId]/stakeholder/[stakeholderId]', () => {
    it('should return specific stakeholder', async () => {
      const request = new NextRequest('http://localhost/api/surveys/test-survey/stakeholder/manager');
      const params = { surveyId: 'test-survey', stakeholderId: 'manager' };
      
      const response = await getStakeholder(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.id).toBe('manager');
      expect(data.name).toBe('Manager');
      expect(data.expertise).toEqual(['strategy']);
    });

    it('should return 404 for non-existent stakeholder', async () => {
      const request = new NextRequest('http://localhost/api/surveys/test-survey/stakeholder/non-existent');
      const params = { surveyId: 'test-survey', stakeholderId: 'non-existent' };
      
      const response = await getStakeholder(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe(true);
      expect(data.code).toBe('STAKEHOLDER_NOT_FOUND');
    });
  });

  describe('GET /api/surveys/[surveyId]/step/[stepId]', () => {
    it('should return survey step for specific stakeholder', async () => {
      const request = new NextRequest('http://localhost/api/surveys/test-survey/step/q1?stakeholderId=manager');
      const params = { surveyId: 'test-survey', stepId: 'q1' };
      
      const response = await getSurveyStep(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.stepId).toBe('q1');
      expect(data.stepNumber).toBe(1);
      expect(data.questions).toHaveLength(1);
      expect(data.questions[0].id).toBe('q1');
      expect(data.questions[0].type).toBe('likert');
      expect(data.navigation.canGoBack).toBe(false);
      expect(data.navigation.canGoForward).toBe(true);
    });

    it('should return step by number', async () => {
      const request = new NextRequest('http://localhost/api/surveys/test-survey/step/1?stakeholderId=manager');
      const params = { surveyId: 'test-survey', stepId: '1' };
      
      const response = await getSurveyStep(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.stepNumber).toBe(1);
    });

    it('should filter questions by stakeholder', async () => {
      const request = new NextRequest('http://localhost/api/surveys/test-survey/step/q2?stakeholderId=user');
      const params = { surveyId: 'test-survey', stepId: 'q2' };
      
      const response = await getSurveyStep(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.code).toBe('STEP_NOT_FOUND');
    });

    it('should return 404 for non-existent step', async () => {
      const request = new NextRequest('http://localhost/api/surveys/test-survey/step/non-existent');
      const params = { surveyId: 'test-survey', stepId: 'non-existent' };
      
      const response = await getSurveyStep(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe(true);
      expect(data.code).toBe('STEP_NOT_FOUND');
    });
  });

  describe('POST /api/surveys/[surveyId]/step/[stepId]', () => {
    it('should submit valid step response', async () => {
      const submitData = {
        responses: { q1: 4 },
        stepId: 'q1',
        stakeholderId: 'manager',
        organizationId: 'test-org'
      };
      
      const request = new NextRequest('http://localhost/api/surveys/test-survey/step/q1', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(submitData)
      });
      const params = { surveyId: 'test-survey', stepId: 'q1' };
      
      const response = await submitSurveyStep(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.nextStepId).toBe('q2');
      expect(data.isComplete).toBe(false);
    });

    it('should validate required fields', async () => {
      const submitData = {
        responses: {},
        stepId: 'q1',
        stakeholderId: 'manager',
        organizationId: 'test-org'
      };
      
      const request = new NextRequest('http://localhost/api/surveys/test-survey/step/q1', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(submitData)
      });
      const params = { surveyId: 'test-survey', stepId: 'q1' };
      
      const response = await submitSurveyStep(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
      expect(data.errors.q1).toBe('This field is required');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/surveys/test-survey/step/q1', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json'
      });
      const params = { surveyId: 'test-survey', stepId: 'q1' };
      
      const response = await submitSurveyStep(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe(true);
      expect(data.code).toBe('INVALID_JSON');
    });
  });

  describe('GET /api/surveys/[surveyId]/progress', () => {
    it('should return progress information', async () => {
      const request = new NextRequest('http://localhost/api/surveys/test-survey/progress?stakeholderId=manager&organizationId=test-org&currentStepId=q1');
      const params = { surveyId: 'test-survey' };
      
      const response = await getSurveyProgress(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.currentStepId).toBe('q1');
      expect(data.currentStepNumber).toBe(1);
      expect(data.totalSteps).toBe(2); // Filtered for manager
      expect(data.stakeholderId).toBe('manager');
      expect(data.organizationId).toBe('test-org');
    });

    it('should return 400 for missing parameters', async () => {
      const request = new NextRequest('http://localhost/api/surveys/test-survey/progress');
      const params = { surveyId: 'test-survey' };
      
      const response = await getSurveyProgress(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe(true);
      expect(data.code).toBe('MISSING_REQUIRED_PARAMS');
    });
  });

  describe('POST /api/surveys/[surveyId]/complete', () => {
    it('should complete survey with valid data', async () => {
      const completeData = {
        stakeholderId: 'manager',
        organizationId: 'test-org',
        respondentId: 'user-123',
        responses: { q1: 4, q2: 'manager' },
        expertise: ['strategy'],
        startTime: new Date().toISOString(),
        metadata: { userAgent: 'test' }
      };
      
      const request = new NextRequest('http://localhost/api/surveys/test-survey/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(completeData)
      });
      const params = { surveyId: 'test-survey' };
      
      const response = await completeSurvey(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.surveyId).toBe('test-survey');
      expect(data.completedAt).toBeDefined();
      expect(data.resultId).toBeDefined();
      expect(mockDataManager.saveResponse).toHaveBeenCalledWith(
        'test-survey',
        'test-org',
        expect.objectContaining({
          stakeholder: 'manager',
          organizationId: 'test-org',
          responses: { q1: 4, q2: 'manager' }
        })
      );
    });

    it('should return 400 for missing required responses', async () => {
      const completeData = {
        stakeholderId: 'manager',
        organizationId: 'test-org',
        respondentId: 'user-123',
        responses: { q1: 4 }, // Missing q2 which is required
        startTime: new Date().toISOString()
      };
      
      const request = new NextRequest('http://localhost/api/surveys/test-survey/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(completeData)
      });
      const params = { surveyId: 'test-survey' };
      
      const response = await completeSurvey(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe(true);
      expect(data.code).toBe('MISSING_REQUIRED_RESPONSES');
      expect(data.details.missingQuestions).toContain('q2');
    });

    it('should return 500 if save fails', async () => {
      mockDataManager.saveResponse.mockRejectedValue(new Error('Save failed'));
      
      const completeData = {
        stakeholderId: 'manager',
        organizationId: 'test-org',
        respondentId: 'user-123',
        responses: { q1: 4, q2: 'manager' },
        startTime: new Date().toISOString()
      };
      
      const request = new NextRequest('http://localhost/api/surveys/test-survey/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(completeData)
      });
      const params = { surveyId: 'test-survey' };
      
      const response = await completeSurvey(request, { params });
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe(true);
      expect(data.code).toBe('SAVE_ERROR');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in all responses', async () => {
      const request = new NextRequest('http://localhost/api/surveys/test-survey');
      const params = { surveyId: 'test-survey' };
      
      const response = await getSurveyMetadata(request, { params });
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate, proxy-revalidate');
      expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
    });
  });
});