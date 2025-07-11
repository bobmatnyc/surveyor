import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';
import { SurveyMetadataResponse, ApiErrorResponse } from '@/lib/api-types';

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
    
    // Validate surveyId
    if (!surveyId || typeof surveyId !== 'string') {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Invalid survey ID',
        code: 'INVALID_SURVEY_ID'
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

    // Calculate total steps based on stakeholder-specific questions
    const totalSteps = survey.questions.length;
    
    // Estimate time (2 minutes per question on average)
    const estimatedTimeMinutes = Math.ceil(totalSteps * 2);

    // Build metadata response
    const metadata: SurveyMetadataResponse = {
      id: survey.id,
      name: survey.name,
      description: survey.description,
      version: survey.version,
      createdAt: survey.createdAt.toISOString(),
      updatedAt: (survey.updatedAt || survey.createdAt).toISOString(),
      totalSteps,
      estimatedTimeMinutes,
      status: survey.isActive ? 'active' : 'draft',
      settings: survey.settings
    };

    const response = NextResponse.json(metadata);
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Error fetching survey metadata:', error);
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