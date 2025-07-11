import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';
import { 
  SurveyStepResponse, 
  SurveyStepSubmitRequest, 
  SurveyStepSubmitResponse, 
  SurveyQuestion, 
  SurveyStepNavigation,
  ApiErrorResponse 
} from '@/lib/api-types';
import { QuestionType } from '@/lib/types';

const dataManager = SurveyDataManager.getInstance();

// Enhanced security headers for API responses
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

// Map internal QuestionType to API QuestionType
function mapQuestionType(internalType: QuestionType): "number" | "boolean" | "text" | "likert" | "multipleChoice" {
  switch (internalType) {
    case QuestionType.LIKERT_5:
    case QuestionType.LIKERT_3:
      return 'likert';
    case QuestionType.MULTIPLE_CHOICE:
      return 'multipleChoice';
    case QuestionType.SINGLE_SELECT:
      return 'multipleChoice';
    case QuestionType.TEXT:
      return 'text';
    case QuestionType.NUMBER:
      return 'number';
    case QuestionType.BOOLEAN:
      return 'boolean';
    default:
      return 'text';
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { surveyId: string; stepId: string } }
) {
  try {
    const { surveyId, stepId } = params;
    const { searchParams } = new URL(request.url);
    const stakeholderId = searchParams.get('stakeholderId');
    const organizationId = searchParams.get('organizationId');
    
    // Validate parameters
    if (!surveyId || typeof surveyId !== 'string') {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Invalid survey ID',
        code: 'INVALID_SURVEY_ID'
      };
      const response = NextResponse.json(errorResponse, { status: 400 });
      return addSecurityHeaders(response);
    }

    if (!stepId || typeof stepId !== 'string') {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Invalid step ID',
        code: 'INVALID_STEP_ID'
      };
      const response = NextResponse.json(errorResponse, { status: 400 });
      return addSecurityHeaders(response);
    }

    // Fetch survey schema
    const survey = await dataManager.getSchema(surveyId);
    if (!survey) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Survey not found',
        code: 'SURVEY_NOT_FOUND'
      };
      const response = NextResponse.json(errorResponse, { status: 404 });
      return addSecurityHeaders(response);
    }

    // Check if survey is active
    if (!survey.isActive) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Survey is not active',
        code: 'SURVEY_INACTIVE'
      };
      const response = NextResponse.json(errorResponse, { status: 403 });
      return addSecurityHeaders(response);
    }

    // Filter questions by stakeholder if provided
    let filteredQuestions = survey.questions;
    if (stakeholderId) {
      filteredQuestions = survey.questions.filter(q => 
        q.targetStakeholders.includes(stakeholderId)
      );
    }

    // Find the step by ID or index
    let stepIndex: number;
    let targetQuestion;
    
    // Try to find question by ID first
    targetQuestion = filteredQuestions.find(q => q.id === stepId);
    if (targetQuestion) {
      stepIndex = filteredQuestions.findIndex(q => q.id === stepId);
    } else {
      // Try to parse as step number
      const stepNumber = parseInt(stepId, 10);
      if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > filteredQuestions.length) {
        const errorResponse: ApiErrorResponse = {
          error: true,
          message: 'Step not found',
          code: 'STEP_NOT_FOUND'
        };
        const response = NextResponse.json(errorResponse, { status: 404 });
        return addSecurityHeaders(response);
      }
      
      stepIndex = stepNumber - 1;
      targetQuestion = filteredQuestions[stepIndex];
    }

    if (!targetQuestion) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Step not found',
        code: 'STEP_NOT_FOUND'
      };
      const response = NextResponse.json(errorResponse, { status: 404 });
      return addSecurityHeaders(response);
    }

    // Build question data for API response
    const apiQuestion: SurveyQuestion = {
      id: targetQuestion.id,
      type: mapQuestionType(targetQuestion.type),
      text: targetQuestion.text,
      required: targetQuestion.required,
      options: targetQuestion.options?.map(opt => opt.label) || undefined,
      scale: targetQuestion.type === QuestionType.LIKERT_5 ? 
        { min: 1, max: 5, labels: targetQuestion.options?.map(opt => opt.label) } :
        targetQuestion.type === QuestionType.LIKERT_3 ?
        { min: 1, max: 3, labels: targetQuestion.options?.map(opt => opt.label) } :
        undefined
    };

    // Build navigation data
    const navigation: SurveyStepNavigation = {
      canGoBack: stepIndex > 0,
      canGoForward: stepIndex < filteredQuestions.length - 1,
      nextStepId: stepIndex < filteredQuestions.length - 1 ? 
        filteredQuestions[stepIndex + 1].id : null,
      prevStepId: stepIndex > 0 ? 
        filteredQuestions[stepIndex - 1].id : null
    };

    // Build step response
    const stepResponse: SurveyStepResponse = {
      stepId: targetQuestion.id,
      stepNumber: stepIndex + 1,
      totalSteps: filteredQuestions.length,
      questions: [apiQuestion],
      navigation,
      stakeholderId: stakeholderId || undefined,
      organizationId: organizationId || undefined
    };

    const nextResponse = NextResponse.json(stepResponse);
    return addSecurityHeaders(nextResponse);

  } catch (error) {
    console.error('Error fetching survey step:', error);
    const errorResponse: ApiErrorResponse = {
      error: true,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: { message: error instanceof Error ? error.message : 'Unknown error' }
    };
    const response = NextResponse.json(errorResponse, { status: 500 });
    return addSecurityHeaders(response);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { surveyId: string; stepId: string } }
) {
  try {
    const { surveyId, stepId } = params;
    
    // Validate parameters
    if (!surveyId || typeof surveyId !== 'string') {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Invalid survey ID',
        code: 'INVALID_SURVEY_ID'
      };
      const response = NextResponse.json(errorResponse, { status: 400 });
      return addSecurityHeaders(response);
    }

    if (!stepId || typeof stepId !== 'string') {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Invalid step ID',
        code: 'INVALID_STEP_ID'
      };
      const response = NextResponse.json(errorResponse, { status: 400 });
      return addSecurityHeaders(response);
    }

    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Invalid content type',
        code: 'INVALID_CONTENT_TYPE'
      };
      const response = NextResponse.json(errorResponse, { status: 400 });
      return addSecurityHeaders(response);
    }

    // Parse request body
    let submitData: SurveyStepSubmitRequest;
    try {
      submitData = await request.json();
    } catch (error) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Invalid JSON data',
        code: 'INVALID_JSON'
      };
      const response = NextResponse.json(errorResponse, { status: 400 });
      return addSecurityHeaders(response);
    }

    // Validate required fields
    if (!submitData.stakeholderId || !submitData.organizationId) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Missing required fields: stakeholderId and organizationId',
        code: 'MISSING_REQUIRED_FIELDS'
      };
      const response = NextResponse.json(errorResponse, { status: 400 });
      return addSecurityHeaders(response);
    }

    // Fetch survey schema
    const survey = await dataManager.getSchema(surveyId);
    if (!survey) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Survey not found',
        code: 'SURVEY_NOT_FOUND'
      };
      const response = NextResponse.json(errorResponse, { status: 404 });
      return addSecurityHeaders(response);
    }

    // Check if survey is active
    if (!survey.isActive) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Survey is not active',
        code: 'SURVEY_INACTIVE'
      };
      const response = NextResponse.json(errorResponse, { status: 403 });
      return addSecurityHeaders(response);
    }

    // Filter questions by stakeholder
    const filteredQuestions = survey.questions.filter(q => 
      q.targetStakeholders.includes(submitData.stakeholderId)
    );

    // Find the current step
    let stepIndex: number;
    let targetQuestion;
    
    targetQuestion = filteredQuestions.find(q => q.id === stepId);
    if (targetQuestion) {
      stepIndex = filteredQuestions.findIndex(q => q.id === stepId);
    } else {
      const stepNumber = parseInt(stepId, 10);
      if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > filteredQuestions.length) {
        const errorResponse: ApiErrorResponse = {
          error: true,
          message: 'Step not found',
          code: 'STEP_NOT_FOUND'
        };
        const response = NextResponse.json(errorResponse, { status: 404 });
        return addSecurityHeaders(response);
      }
      
      stepIndex = stepNumber - 1;
      targetQuestion = filteredQuestions[stepIndex];
    }

    if (!targetQuestion) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Step not found',
        code: 'STEP_NOT_FOUND'
      };
      const response = NextResponse.json(errorResponse, { status: 404 });
      return addSecurityHeaders(response);
    }

    // Validate responses
    const errors: Record<string, string> = {};
    
    // Check required fields
    if (targetQuestion.required && !submitData.responses[targetQuestion.id]) {
      errors[targetQuestion.id] = 'This field is required';
    }

    // Validate specific field types
    const response = submitData.responses[targetQuestion.id];
    if (response !== undefined && response !== null) {
      switch (targetQuestion.type) {
        case QuestionType.NUMBER:
          if (typeof response !== 'number' && isNaN(Number(response))) {
            errors[targetQuestion.id] = 'Must be a valid number';
          }
          break;
        case QuestionType.BOOLEAN:
          if (typeof response !== 'boolean') {
            errors[targetQuestion.id] = 'Must be true or false';
          }
          break;
        case QuestionType.TEXT:
          if (typeof response !== 'string') {
            errors[targetQuestion.id] = 'Must be a string';
          } else if (targetQuestion.validation) {
            const validation = targetQuestion.validation;
            if (validation.minLength && response.length < validation.minLength) {
              errors[targetQuestion.id] = `Must be at least ${validation.minLength} characters`;
            }
            if (validation.maxLength && response.length > validation.maxLength) {
              errors[targetQuestion.id] = `Must not exceed ${validation.maxLength} characters`;
            }
          }
          break;
      }
    }

    // If validation errors, return them
    if (Object.keys(errors).length > 0) {
      const submitResponse: SurveyStepSubmitResponse = {
        success: false,
        nextStepId: null,
        isComplete: false,
        message: 'Validation errors found',
        errors
      };
      const response = NextResponse.json(submitResponse, { status: 400 });
      return addSecurityHeaders(response);
    }

    // Determine next step
    const isLastStep = stepIndex >= filteredQuestions.length - 1;
    const nextStepId = isLastStep ? null : filteredQuestions[stepIndex + 1].id;

    // TODO: Save response to data store
    // This would typically save the response to the database
    // For now, we'll just return a success response
    
    const submitResponse: SurveyStepSubmitResponse = {
      success: true,
      nextStepId,
      isComplete: isLastStep,
      message: isLastStep ? 'Survey completed successfully' : 'Step completed successfully'
    };

    const nextResponse = NextResponse.json(submitResponse);
    return addSecurityHeaders(nextResponse);

  } catch (error) {
    console.error('Error submitting survey step:', error);
    const errorResponse: ApiErrorResponse = {
      error: true,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: { message: error instanceof Error ? error.message : 'Unknown error' }
    };
    const response = NextResponse.json(errorResponse, { status: 500 });
    return addSecurityHeaders(response);
  }
}