// REST API Response Types for Survey System

export interface SurveyMetadataResponse {
  id: string;
  name: string;
  description: string;
  totalSteps: number;
  estimatedTimeMinutes: number;
  status: 'active' | 'completed' | 'draft';
  version: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    allowMultipleResponses: boolean;
    requireAllStakeholders: boolean;
    showProgressBar: boolean;
    allowNavigation: boolean;
    timeLimit?: number;
    customStyling?: {
      primaryColor?: string;
      secondaryColor?: string;
      backgroundColor?: string;
      logoUrl?: string;
      fontFamily?: string;
    };
  };
}

export interface StakeholderResponse {
  id: string;
  name: string;
  description: string;
  color: string;
  expertise: string[];
  weight?: number;
  requiredExpertise?: string[];
}

export interface StakeholderListResponse {
  stakeholders: StakeholderResponse[];
}

export interface SurveyQuestion {
  id: string;
  type: 'text' | 'multipleChoice' | 'likert' | 'boolean' | 'number';
  text: string;
  description?: string;
  required: boolean;
  domain?: string;
  options?: string[]; // for multipleChoice
  scale?: {
    min: number;
    max: number;
    labels?: string[];
  }; // for likert
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    required?: boolean;
  };
  conditional?: {
    dependsOn: string;
    condition: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
    value: any;
  };
}

export interface SurveyStepNavigation {
  canGoBack: boolean;
  canGoForward: boolean;
  nextStepId: string | null;
  prevStepId: string | null;
}

export interface SurveyStepResponse {
  stepId: string;
  stepNumber: number;
  totalSteps: number;
  questions: SurveyQuestion[];
  navigation: SurveyStepNavigation;
  stakeholderId?: string;
  organizationId?: string;
  progress?: {
    currentStep: number;
    totalSteps: number;
    percentageComplete: number;
  };
}

export interface SurveyStepSubmitRequest {
  responses: Record<string, any>;
  stepId: string;
  stakeholderId: string;
  organizationId: string;
  partialSubmission?: boolean;
  timestamp?: string;
}

export interface SurveyStepSubmitResponse {
  success: boolean;
  nextStepId: string | null;
  isComplete: boolean;
  message: string;
  errors?: Record<string, string>;
  validationResults?: Record<string, {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

export interface SurveyProgressResponse {
  currentStepId: string;
  currentStepNumber: number;
  totalSteps: number;
  completedSteps: number;
  percentageComplete: number;
  stakeholderId: string;
  organizationId: string;
  lastActivityAt?: string;
  estimatedTimeRemaining?: number;
  completedQuestions?: string[];
  totalQuestions?: number;
}

export interface SurveyCompleteResponse {
  success: boolean;
  surveyId: string;
  completedAt: string;
  resultId?: string;
  message: string;
  summary?: {
    totalQuestions: number;
    answeredQuestions: number;
    completionRate: number;
    timeSpent: number;
  };
  nextSteps?: {
    resultsUrl: string;
    canTakeAnother: boolean;
    shareable: boolean;
  };
}

export interface ApiErrorResponse {
  error: true;
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp?: string;
  requestId?: string;
}

// API Client Response Types
export type ApiResponse<T> = T | ApiErrorResponse;

// Helper type guards
export function isApiError(response: any): response is ApiErrorResponse {
  return response && response.error === true;
}

export function isSuccessResponse<T>(response: ApiResponse<T>): response is T {
  return !isApiError(response);
}

// Stakeholder Selection State Types
export interface StakeholderSelectionRequest {
  organizationId: string;
  selectedStakeholderId: string;
  selectedExpertise: string[];
  sessionId?: string;
}

export interface StakeholderSelectionStateResponse {
  state: StakeholderSelectionState | null;
  exists: boolean;
}

export interface StakeholderSelectionState {
  surveyId: string;
  organizationId: string;
  selectedStakeholderId: string;
  selectedExpertise: string[];
  timestamp: string;
  sessionId?: string;
}

// Stakeholder Preferences Types
export interface StakeholderPreferencesResponse {
  preferences: {
    surveyId: string;
    availableExpertise: string[];
    stakeholderGroups: StakeholderGroup[];
    filters: StakeholderFilters;
    recommendations: StakeholderRecommendation[];
  };
}

export interface StakeholderGroup {
  id: string;
  name: string;
  description: string;
  stakeholderIds: string[];
  defaultExpertise: string[];
}

export interface StakeholderFilters {
  byExpertise: string[];
  byRole: string[];
  byDepartment: string[];
}

export interface StakeholderRecommendation {
  stakeholderId: string;
  reason: string;
  confidence: number;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// Extended Error Codes
export const API_ERROR_CODES = {
  INVALID_SURVEY_ID: 'INVALID_SURVEY_ID',
  INVALID_STAKEHOLDER_ID: 'INVALID_STAKEHOLDER_ID',
  INVALID_ORGANIZATION_ID: 'INVALID_ORGANIZATION_ID',
  SURVEY_NOT_FOUND: 'SURVEY_NOT_FOUND',
  STAKEHOLDER_NOT_FOUND: 'STAKEHOLDER_NOT_FOUND',
  MISSING_ORGANIZATION_ID: 'MISSING_ORGANIZATION_ID',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_REQUEST_BODY: 'INVALID_REQUEST_BODY',
  STAKEHOLDER_SELECTION_REQUIRED: 'STAKEHOLDER_SELECTION_REQUIRED',
  EXPERTISE_VALIDATION_FAILED: 'EXPERTISE_VALIDATION_FAILED'
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// Utility functions for API validation
export function createValidationError(
  field: string,
  message: string,
  code: ApiErrorCode
): ValidationError {
  return { field, message, code };
}

export function createApiError(
  message: string,
  code: ApiErrorCode,
  details?: Record<string, any>
): ApiErrorResponse {
  return {
    error: true,
    message,
    code,
    details
  };
}

export function validateStakeholderRequest(
  request: Partial<StakeholderSelectionRequest>
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!request.organizationId) {
    errors.push(createValidationError(
      'organizationId',
      'Organization ID is required',
      API_ERROR_CODES.MISSING_ORGANIZATION_ID
    ));
  }

  if (!request.selectedStakeholderId) {
    errors.push(createValidationError(
      'selectedStakeholderId',
      'Stakeholder ID is required',
      API_ERROR_CODES.STAKEHOLDER_SELECTION_REQUIRED
    ));
  }

  if (request.selectedExpertise && !Array.isArray(request.selectedExpertise)) {
    errors.push(createValidationError(
      'selectedExpertise',
      'Selected expertise must be an array',
      API_ERROR_CODES.EXPERTISE_VALIDATION_FAILED
    ));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

// Extended API Types for Dynamic Survey Architecture

export interface StakeholderDetailResponse extends StakeholderResponse {
  availableQuestions: string[];
  totalQuestions: number;
  estimatedTimeMinutes: number;
}

export interface SurveyNavigationResponse {
  availableSteps: Array<{
    stepId: string;
    stepNumber: number;
    title: string;
    isAccessible: boolean;
    isCompleted: boolean;
    questionCount: number;
  }>;
  currentStepId: string;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
  nextStepId: string | null;
  prevStepId: string | null;
}

export interface SurveyStateRequest {
  stakeholderId: string;
  organizationId: string;
  currentStepId: string;
  responses: Record<string, any>;
  timestamp?: string;
}

export interface SurveyStateResponse {
  success: boolean;
  message: string;
  savedAt: string;
  stateId: string;
}

export interface SurveyStateLoadResponse {
  stateId: string;
  currentStepId: string;
  responses: Record<string, any>;
  lastSavedAt: string;
  progress: {
    currentStep: number;
    totalSteps: number;
    percentageComplete: number;
  };
}

export interface SurveyCompleteRequest {
  stakeholderId: string;
  organizationId: string;
  finalResponses: Record<string, any>;
  completionTimestamp?: string;
}

export interface DistributionResponse {
  surveyId: string;
  organizationId: string;
  distributionCode: string;
  isActive: boolean;
  expiresAt?: string;
  allowedStakeholders?: string[];
  metadata: {
    surveyName: string;
    description: string;
    estimatedTime: number;
  };
}

// Admin API Types

export interface SurveyListResponse {
  surveys: Array<{
    id: string;
    name: string;
    description: string;
    status: 'active' | 'completed' | 'draft';
    createdAt: string;
    updatedAt: string;
    responseCount: number;
    completionRate: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SurveyCreateRequest {
  name: string;
  description: string;
  stakeholders: Array<{
    id: string;
    name: string;
    description: string;
    color: string;
    expertise: string[];
    weight: number;
  }>;
  questions: Array<{
    id: string;
    type: 'text' | 'multipleChoice' | 'likert' | 'boolean' | 'number';
    text: string;
    description?: string;
    required: boolean;
    domain?: string;
    targetStakeholders: string[];
    options?: string[];
    scale?: {
      min: number;
      max: number;
      labels?: string[];
    };
  }>;
  settings: {
    allowMultipleResponses: boolean;
    requireAllStakeholders: boolean;
    showProgressBar: boolean;
    allowNavigation: boolean;
    timeLimit?: number;
  };
}

export interface AdminResponsesResponse {
  responses: Array<{
    id: string;
    surveyId: string;
    organizationId: string;
    stakeholderId: string;
    responses: Record<string, any>;
    startTime: string;
    completionTime?: string;
    progress: number;
    isComplete: boolean;
  }>;
  total: number;
  organizationCounts: Record<string, number>;
  stakeholderCounts: Record<string, number>;
  completionRate: number;
}

export interface AdminResultsResponse {
  results: Array<{
    surveyId: string;
    organizationId: string;
    overallScore: number;
    domainScores: Record<string, number>;
    stakeholderContributions: Record<string, Record<string, number>>;
    maturityLevel: {
      id: string;
      name: string;
      description: string;
      minScore: number;
      maxScore: number;
      color: string;
    };
    recommendations: string[];
    completionDate: string;
    responseCount: number;
  }>;
  aggregatedMetrics: {
    averageScore: number;
    completionRate: number;
    participationByStakeholder: Record<string, number>;
    domainAverages: Record<string, number>;
  };
}