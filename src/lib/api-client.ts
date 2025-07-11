import { 
  SurveyMetadataResponse, 
  StakeholderListResponse, 
  StakeholderResponse, 
  SurveyStepResponse, 
  SurveyStepSubmitRequest, 
  SurveyStepSubmitResponse, 
  SurveyProgressResponse, 
  SurveyCompleteResponse,
  ApiResponse,
  isApiError,
  isSuccessResponse
} from './api-types';

export class SurveyApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return data; // Should be an ApiErrorResponse
      }

      return data as T;
    } catch (error) {
      return {
        error: true,
        message: 'Network error',
        code: 'NETWORK_ERROR',
        details: { message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Get survey metadata
   */
  async getSurveyMetadata(surveyId: string): Promise<ApiResponse<SurveyMetadataResponse>> {
    return this.request<SurveyMetadataResponse>(`${this.baseUrl}/survey/${surveyId}`);
  }

  /**
   * Get list of stakeholders for a survey
   */
  async getStakeholders(surveyId: string): Promise<ApiResponse<StakeholderListResponse>> {
    return this.request<StakeholderListResponse>(`${this.baseUrl}/survey/${surveyId}/stakeholders`);
  }

  /**
   * Get specific stakeholder details
   */
  async getStakeholder(surveyId: string, stakeholderId: string): Promise<ApiResponse<StakeholderResponse>> {
    return this.request<StakeholderResponse>(`${this.baseUrl}/survey/${surveyId}/stakeholder/${stakeholderId}`);
  }

  /**
   * Get survey step with stakeholder-specific content
   */
  async getSurveyStep(
    surveyId: string, 
    stepId: string, 
    stakeholderId?: string, 
    organizationId?: string
  ): Promise<ApiResponse<SurveyStepResponse>> {
    const params = new URLSearchParams();
    if (stakeholderId) params.append('stakeholderId', stakeholderId);
    if (organizationId) params.append('organizationId', organizationId);
    
    const url = `${this.baseUrl}/survey/${surveyId}/step/${stepId}${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request<SurveyStepResponse>(url);
  }

  /**
   * Submit survey step response
   */
  async submitSurveyStep(
    surveyId: string, 
    stepId: string, 
    submitData: SurveyStepSubmitRequest
  ): Promise<ApiResponse<SurveyStepSubmitResponse>> {
    return this.request<SurveyStepSubmitResponse>(`${this.baseUrl}/survey/${surveyId}/step/${stepId}`, {
      method: 'POST',
      body: JSON.stringify(submitData),
    });
  }

  /**
   * Get survey progress
   */
  async getSurveyProgress(
    surveyId: string, 
    stakeholderId: string, 
    organizationId: string, 
    currentStepId?: string
  ): Promise<ApiResponse<SurveyProgressResponse>> {
    const params = new URLSearchParams({
      stakeholderId,
      organizationId,
    });
    if (currentStepId) params.append('currentStepId', currentStepId);
    
    const url = `${this.baseUrl}/survey/${surveyId}/progress?${params.toString()}`;
    return this.request<SurveyProgressResponse>(url);
  }

  /**
   * Complete survey
   */
  async completeSurvey(
    surveyId: string, 
    completeData: {
      stakeholderId: string;
      organizationId: string;
      respondentId: string;
      responses: Record<string, any>;
      expertise?: string[];
      startTime: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ApiResponse<SurveyCompleteResponse>> {
    return this.request<SurveyCompleteResponse>(`${this.baseUrl}/survey/${surveyId}/complete`, {
      method: 'POST',
      body: JSON.stringify(completeData),
    });
  }
}

// Helper functions for working with API responses
export { isApiError, isSuccessResponse };

// Default client instance
export const surveyApiClient = new SurveyApiClient();

// Usage example:
/*
const client = new SurveyApiClient();

// Get survey metadata
const metadata = await client.getSurveyMetadata('demo-survey-showcase');
if (isSuccessResponse(metadata)) {
  console.log('Survey name:', metadata.name);
} else {
  console.error('Error:', metadata.message);
}

// Get stakeholders
const stakeholders = await client.getStakeholders('demo-survey-showcase');
if (isSuccessResponse(stakeholders)) {
  console.log('Stakeholders:', stakeholders.stakeholders);
}

// Get first step for a specific stakeholder
const step = await client.getSurveyStep('demo-survey-showcase', '1', 'manager');
if (isSuccessResponse(step)) {
  console.log('First question:', step.questions[0].text);
}

// Submit step response
const submitResponse = await client.submitSurveyStep('demo-survey-showcase', '1', {
  responses: { 'q1': 4 },
  stepId: '1',
  stakeholderId: 'manager',
  organizationId: 'test-org'
});
if (isSuccessResponse(submitResponse)) {
  console.log('Next step:', submitResponse.nextStepId);
}

// Get progress
const progress = await client.getSurveyProgress('demo-survey-showcase', 'manager', 'test-org', '1');
if (isSuccessResponse(progress)) {
  console.log('Progress:', progress.percentageComplete + '%');
}

// Complete survey
const completion = await client.completeSurvey('demo-survey-showcase', {
  stakeholderId: 'manager',
  organizationId: 'test-org',
  respondentId: 'user-123',
  responses: { 'q1': 4, 'q2': 'executive' },
  expertise: ['strategy'],
  startTime: new Date().toISOString(),
  metadata: { userAgent: navigator.userAgent }
});
if (isSuccessResponse(completion)) {
  console.log('Survey completed at:', completion.completedAt);
}
*/