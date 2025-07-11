import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';
import { SurveyCompleteResponse, ApiErrorResponse } from '@/lib/api-types';
import { SurveyResponse } from '@/lib/types';

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

interface SurveyCompleteRequest {
  stakeholderId: string;
  organizationId: string;
  respondentId: string;
  responses: Record<string, any>;
  expertise?: string[];
  startTime: string;
  metadata?: Record<string, any>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const { surveyId } = params;
    
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
    let completeData: SurveyCompleteRequest;
    try {
      completeData = await request.json();
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
    if (!completeData.stakeholderId || !completeData.organizationId || !completeData.respondentId) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Missing required fields: stakeholderId, organizationId, and respondentId',
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
      q.targetStakeholders.includes(completeData.stakeholderId)
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

    // Validate that all required questions are answered
    const missingRequiredQuestions = filteredQuestions
      .filter(q => q.required && !completeData.responses[q.id])
      .map(q => q.id);

    if (missingRequiredQuestions.length > 0) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Missing responses for required questions',
        code: 'MISSING_REQUIRED_RESPONSES',
        details: { missingQuestions: missingRequiredQuestions }
      };
      const response = NextResponse.json(errorResponse, { status: 400 });
      return addSecurityHeaders(response);
    }

    // Build survey response object
    const surveyResponse: SurveyResponse = {
      id: `${completeData.organizationId}-${completeData.stakeholderId}-${completeData.respondentId}`,
      surveyId,
      organizationId: completeData.organizationId,
      respondentId: completeData.respondentId,
      stakeholder: completeData.stakeholderId,
      expertise: completeData.expertise || [],
      responses: completeData.responses,
      startTime: new Date(completeData.startTime),
      completionTime: new Date(),
      progress: 100,
      metadata: completeData.metadata || {}
    };

    // Save response to data store
    try {
      await dataManager.saveResponse(surveyId, completeData.organizationId, surveyResponse);
    } catch (error) {
      console.error('Error saving survey response:', error);
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Failed to save survey response',
        code: 'SAVE_ERROR'
      };
      const response = NextResponse.json(errorResponse, { status: 500 });
      return addSecurityHeaders(response);
    }

    const completionTime = new Date().toISOString();
    const completeResponse: SurveyCompleteResponse = {
      success: true,
      surveyId,
      completedAt: completionTime,
      resultId: surveyResponse.id,
      message: 'Survey completed successfully'
    };

    const nextResponse = NextResponse.json(completeResponse);
    return addSecurityHeaders(nextResponse);

  } catch (error) {
    console.error('Error completing survey:', error);
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