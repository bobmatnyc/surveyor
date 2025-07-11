# API Client Examples

This document provides comprehensive examples of how to use the REST API endpoints for the dynamic survey system.

## Client Setup

```typescript
import { 
  SurveyMetadataResponse,
  StakeholderListResponse,
  SurveyStepResponse,
  SurveyStepSubmitRequest,
  SurveyStepSubmitResponse,
  SurveyProgressResponse,
  SurveyCompleteResponse,
  ApiResponse,
  isApiError,
  API_ERROR_CODES
} from '@/lib/api-types';

class SurveyApiClient {
  private baseUrl: string;
  private csrfToken: string | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}),
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return data as ApiResponse<T>;
    }
    
    return data;
  }

  // Survey Metadata
  async getSurveyMetadata(surveyId: string): Promise<ApiResponse<SurveyMetadataResponse>> {
    return this.request<SurveyMetadataResponse>(`/survey/${surveyId}`);
  }

  // Stakeholder Management
  async getStakeholders(surveyId: string): Promise<ApiResponse<StakeholderListResponse>> {
    return this.request<StakeholderListResponse>(`/survey/${surveyId}/stakeholders`);
  }

  async getStakeholderDetails(
    surveyId: string, 
    stakeholderId: string
  ): Promise<ApiResponse<StakeholderDetailResponse>> {
    return this.request<StakeholderDetailResponse>(`/survey/${surveyId}/stakeholder/${stakeholderId}`);
  }

  // Survey Steps
  async getSurveyStep(
    surveyId: string,
    stepId: string,
    params: {
      stakeholderId: string;
      organizationId: string;
      expertise?: string[];
    }
  ): Promise<ApiResponse<SurveyStepResponse>> {
    const queryParams = new URLSearchParams({
      stakeholderId: params.stakeholderId,
      organizationId: params.organizationId,
      ...(params.expertise?.length ? { expertise: params.expertise.join(',') } : {}),
    });

    return this.request<SurveyStepResponse>(`/survey/${surveyId}/step/${stepId}?${queryParams}`);
  }

  async submitSurveyStep(
    surveyId: string,
    stepId: string,
    data: SurveyStepSubmitRequest
  ): Promise<ApiResponse<SurveyStepSubmitResponse>> {
    return this.request<SurveyStepSubmitResponse>(`/survey/${surveyId}/step/${stepId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Progress & Navigation
  async getSurveyProgress(
    surveyId: string,
    stakeholderId: string,
    organizationId: string
  ): Promise<ApiResponse<SurveyProgressResponse>> {
    const queryParams = new URLSearchParams({
      stakeholderId,
      organizationId,
    });

    return this.request<SurveyProgressResponse>(`/survey/${surveyId}/progress?${queryParams}`);
  }

  async getSurveyNavigation(
    surveyId: string,
    stakeholderId: string,
    organizationId: string,
    currentStepId?: string
  ): Promise<ApiResponse<SurveyNavigationResponse>> {
    const queryParams = new URLSearchParams({
      stakeholderId,
      organizationId,
      ...(currentStepId ? { currentStepId } : {}),
    });

    return this.request<SurveyNavigationResponse>(`/survey/${surveyId}/navigation?${queryParams}`);
  }

  // Survey Completion
  async completeSurvey(
    surveyId: string,
    data: SurveyCompleteRequest
  ): Promise<ApiResponse<SurveyCompleteResponse>> {
    return this.request<SurveyCompleteResponse>(`/survey/${surveyId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // State Management
  async saveSurveyState(
    surveyId: string,
    data: SurveyStateRequest
  ): Promise<ApiResponse<SurveyStateResponse>> {
    return this.request<SurveyStateResponse>(`/survey/${surveyId}/state`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async loadSurveyState(
    surveyId: string,
    stakeholderId: string,
    organizationId: string
  ): Promise<ApiResponse<SurveyStateLoadResponse>> {
    const queryParams = new URLSearchParams({
      stakeholderId,
      organizationId,
    });

    return this.request<SurveyStateLoadResponse>(`/survey/${surveyId}/state?${queryParams}`);
  }
}
```

## Usage Examples

### 1. Basic Survey Flow

```typescript
const apiClient = new SurveyApiClient();

async function startSurvey(surveyId: string, organizationId: string) {
  try {
    // Get survey metadata
    const metadataResponse = await apiClient.getSurveyMetadata(surveyId);
    
    if (isApiError(metadataResponse)) {
      throw new Error(`Failed to load survey: ${metadataResponse.message}`);
    }
    
    console.log('Survey loaded:', metadataResponse.name);
    
    // Get available stakeholders
    const stakeholdersResponse = await apiClient.getStakeholders(surveyId);
    
    if (isApiError(stakeholdersResponse)) {
      throw new Error(`Failed to load stakeholders: ${stakeholdersResponse.message}`);
    }
    
    console.log('Available stakeholders:', stakeholdersResponse.stakeholders.length);
    
    return {
      survey: metadataResponse,
      stakeholders: stakeholdersResponse.stakeholders,
    };
  } catch (error) {
    console.error('Error starting survey:', error);
    throw error;
  }
}
```

### 2. Survey Step Navigation

```typescript
async function navigateSurveyStep(
  surveyId: string,
  stepId: string,
  stakeholderId: string,
  organizationId: string
) {
  try {
    // Get current step data
    const stepResponse = await apiClient.getSurveyStep(surveyId, stepId, {
      stakeholderId,
      organizationId,
    });
    
    if (isApiError(stepResponse)) {
      if (stepResponse.code === API_ERROR_CODES.STEP_NOT_FOUND) {
        console.error('Step not found');
        return null;
      }
      throw new Error(`Failed to load step: ${stepResponse.message}`);
    }
    
    console.log(`Step ${stepResponse.stepNumber} of ${stepResponse.totalSteps}`);
    console.log(`Questions: ${stepResponse.questions.length}`);
    
    // Check navigation options
    const navigationResponse = await apiClient.getSurveyNavigation(
      surveyId,
      stakeholderId,
      organizationId,
      stepId
    );
    
    if (isApiError(navigationResponse)) {
      console.warn('Navigation info not available');
    } else {
      console.log('Navigation options:', {
        canGoBack: navigationResponse.canNavigateBack,
        canGoForward: navigationResponse.canNavigateForward,
        availableSteps: navigationResponse.availableSteps.length,
      });
    }
    
    return {
      step: stepResponse,
      navigation: isApiError(navigationResponse) ? null : navigationResponse,
    };
  } catch (error) {
    console.error('Error navigating survey step:', error);
    throw error;
  }
}
```

### 3. Submit Survey Responses

```typescript
async function submitStepResponses(
  surveyId: string,
  stepId: string,
  stakeholderId: string,
  organizationId: string,
  responses: Record<string, any>
) {
  try {
    const submitData: SurveyStepSubmitRequest = {
      responses,
      stepId,
      stakeholderId,
      organizationId,
      timestamp: new Date().toISOString(),
    };
    
    const submitResponse = await apiClient.submitSurveyStep(surveyId, stepId, submitData);
    
    if (isApiError(submitResponse)) {
      if (submitResponse.code === API_ERROR_CODES.VALIDATION_ERROR) {
        console.error('Validation errors:', submitResponse.details);
        return { success: false, errors: submitResponse.details };
      }
      throw new Error(`Failed to submit responses: ${submitResponse.message}`);
    }
    
    console.log('Responses submitted successfully');
    
    if (submitResponse.isComplete) {
      console.log('Survey completed!');
      return { success: true, completed: true };
    }
    
    if (submitResponse.nextStepId) {
      console.log('Next step:', submitResponse.nextStepId);
      return { success: true, nextStepId: submitResponse.nextStepId };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error submitting responses:', error);
    throw error;
  }
}
```

### 4. Progress Tracking

```typescript
async function trackSurveyProgress(
  surveyId: string,
  stakeholderId: string,
  organizationId: string
) {
  try {
    const progressResponse = await apiClient.getSurveyProgress(
      surveyId,
      stakeholderId,
      organizationId
    );
    
    if (isApiError(progressResponse)) {
      throw new Error(`Failed to get progress: ${progressResponse.message}`);
    }
    
    console.log('Survey progress:', {
      currentStep: progressResponse.currentStepNumber,
      totalSteps: progressResponse.totalSteps,
      percentage: progressResponse.percentageComplete,
      completedQuestions: progressResponse.completedQuestions?.length || 0,
      totalQuestions: progressResponse.totalQuestions || 0,
      estimatedTimeRemaining: progressResponse.estimatedTimeRemaining,
    });
    
    return progressResponse;
  } catch (error) {
    console.error('Error tracking progress:', error);
    throw error;
  }
}
```

### 5. State Management

```typescript
async function saveAndRestoreState(
  surveyId: string,
  stakeholderId: string,
  organizationId: string,
  currentStepId: string,
  responses: Record<string, any>
) {
  try {
    // Save current state
    const saveResponse = await apiClient.saveSurveyState(surveyId, {
      stakeholderId,
      organizationId,
      currentStepId,
      responses,
      timestamp: new Date().toISOString(),
    });
    
    if (isApiError(saveResponse)) {
      console.warn('Failed to save state:', saveResponse.message);
    } else {
      console.log('State saved successfully:', saveResponse.stateId);
    }
    
    // Later, restore state
    const loadResponse = await apiClient.loadSurveyState(
      surveyId,
      stakeholderId,
      organizationId
    );
    
    if (isApiError(loadResponse)) {
      console.log('No saved state found');
      return null;
    }
    
    console.log('State restored:', {
      stateId: loadResponse.stateId,
      currentStepId: loadResponse.currentStepId,
      progress: loadResponse.progress,
      lastSaved: loadResponse.lastSavedAt,
    });
    
    return loadResponse;
  } catch (error) {
    console.error('Error managing state:', error);
    throw error;
  }
}
```

### 6. Complete Survey Flow

```typescript
async function completeSurveyFlow(
  surveyId: string,
  stakeholderId: string,
  organizationId: string,
  finalResponses: Record<string, any>
) {
  try {
    const completeResponse = await apiClient.completeSurvey(surveyId, {
      stakeholderId,
      organizationId,
      finalResponses,
      completionTimestamp: new Date().toISOString(),
    });
    
    if (isApiError(completeResponse)) {
      throw new Error(`Failed to complete survey: ${completeResponse.message}`);
    }
    
    console.log('Survey completed successfully!');
    console.log('Summary:', completeResponse.summary);
    
    if (completeResponse.nextSteps) {
      console.log('Next steps:', {
        resultsUrl: completeResponse.nextSteps.resultsUrl,
        canTakeAnother: completeResponse.nextSteps.canTakeAnother,
        shareable: completeResponse.nextSteps.shareable,
      });
    }
    
    return completeResponse;
  } catch (error) {
    console.error('Error completing survey:', error);
    throw error;
  }
}
```

### 7. Error Handling Patterns

```typescript
function handleApiError(error: ApiResponse<any>, context: string) {
  if (isApiError(error)) {
    switch (error.code) {
      case API_ERROR_CODES.SURVEY_NOT_FOUND:
        console.error(`Survey not found in ${context}`);
        // Redirect to survey selection
        break;
      
      case API_ERROR_CODES.STAKEHOLDER_NOT_FOUND:
        console.error(`Invalid stakeholder in ${context}`);
        // Reset stakeholder selection
        break;
      
      case API_ERROR_CODES.VALIDATION_ERROR:
        console.error(`Validation failed in ${context}:`, error.details);
        // Show validation errors to user
        break;
      
      case API_ERROR_CODES.RATE_LIMITED:
        console.warn(`Rate limited in ${context}`);
        // Implement backoff strategy
        break;
      
      case API_ERROR_CODES.UNAUTHORIZED:
        console.error(`Unauthorized access in ${context}`);
        // Redirect to login
        break;
      
      default:
        console.error(`API error in ${context}:`, error.message);
        // Show generic error message
    }
  } else {
    console.error(`Unexpected error in ${context}:`, error);
  }
}
```

### 8. React Hook Integration

```typescript
import { useState, useEffect, useCallback } from 'react';

function useSurveyApi(surveyId: string) {
  const [client] = useState(() => new SurveyApiClient());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoading = useCallback(async <T>(
    operation: () => Promise<ApiResponse<T>>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await operation();
      
      if (isApiError(response)) {
        setError(response.message);
        return null;
      }
      
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSurveyMetadata = useCallback(() => {
    return withLoading(() => client.getSurveyMetadata(surveyId));
  }, [client, surveyId, withLoading]);

  const getStakeholders = useCallback(() => {
    return withLoading(() => client.getStakeholders(surveyId));
  }, [client, surveyId, withLoading]);

  const getSurveyStep = useCallback((
    stepId: string,
    stakeholderId: string,
    organizationId: string
  ) => {
    return withLoading(() => client.getSurveyStep(surveyId, stepId, {
      stakeholderId,
      organizationId,
    }));
  }, [client, surveyId, withLoading]);

  const submitStep = useCallback((
    stepId: string,
    data: SurveyStepSubmitRequest
  ) => {
    return withLoading(() => client.submitSurveyStep(surveyId, stepId, data));
  }, [client, surveyId, withLoading]);

  return {
    loading,
    error,
    getSurveyMetadata,
    getStakeholders,
    getSurveyStep,
    submitStep,
    client,
  };
}
```

## Best Practices

1. **Error Handling**: Always check for API errors using `isApiError()` before processing responses.

2. **Loading States**: Implement loading indicators for better user experience.

3. **State Management**: Use the state management endpoints to save user progress.

4. **Validation**: Handle validation errors gracefully and provide clear feedback.

5. **Rate Limiting**: Implement retry logic with exponential backoff for rate-limited requests.

6. **Type Safety**: Use TypeScript interfaces for full type safety.

7. **Security**: Always include CSRF tokens and validate responses.

8. **Caching**: Consider implementing client-side caching for frequently accessed data.

This API client provides a comprehensive interface for interacting with the dynamic survey system, supporting all the features defined in the REST API endpoint schema.