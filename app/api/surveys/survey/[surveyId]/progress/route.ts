import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';
import { SurveyProgressResponse, ApiErrorResponse } from '@/lib/api-types';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const { surveyId } = params;
    const { searchParams } = new URL(request.url);
    const stakeholderId = searchParams.get('stakeholderId');
    const organizationId = searchParams.get('organizationId');
    const currentStepId = searchParams.get('currentStepId');
    
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

    if (!stakeholderId || !organizationId) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Missing required parameters: stakeholderId and organizationId',
        code: 'MISSING_REQUIRED_PARAMS'
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
      q.targetStakeholders.includes(stakeholderId)
    );

    if (filteredQuestions.length === 0) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'No questions found for this stakeholder',
        code: 'NO_QUESTIONS_FOUND'
      };
      const response = NextResponse.json(errorResponse, { status: 404 });
      return addSecurityHeaders(response);
    }

    // Determine current step
    let currentStepNumber = 1;
    let currentStepIdResolved = filteredQuestions[0].id;
    
    if (currentStepId) {
      const stepIndex = filteredQuestions.findIndex(q => q.id === currentStepId);
      if (stepIndex >= 0) {
        currentStepNumber = stepIndex + 1;
        currentStepIdResolved = currentStepId;
      }
    }

    // TODO: Get actual completed steps from stored responses
    // For now, we'll assume the current step is the progress
    const completedSteps = Math.max(0, currentStepNumber - 1);
    
    const totalSteps = filteredQuestions.length;
    const percentageComplete = Math.round((completedSteps / totalSteps) * 100);

    const progressResponse: SurveyProgressResponse = {
      currentStepId: currentStepIdResolved,
      currentStepNumber,
      totalSteps,
      completedSteps,
      percentageComplete,
      stakeholderId,
      organizationId
    };

    const nextResponse = NextResponse.json(progressResponse);
    return addSecurityHeaders(nextResponse);

  } catch (error) {
    console.error('Error fetching survey progress:', error);
    const errorResponse: ApiErrorResponse = {
      error: true,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
    const response = NextResponse.json(errorResponse, { status: 500 });
    return addSecurityHeaders(response);
  }
}