import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';
import { StakeholderListResponse, ApiErrorResponse } from '@/lib/api-types';
import { isValidId } from '@/lib/utils';

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
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const { surveyId } = params;

    // Validate surveyId parameter
    if (!surveyId || !isValidId(surveyId)) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Invalid survey ID format',
        code: 'INVALID_SURVEY_ID',
        details: { surveyId }
      };
      return addSecurityHeaders(NextResponse.json(errorResponse, { status: 400 }));
    }

    console.log(`[StakeholderList] Loading stakeholders for survey: ${surveyId}`);

    // Get survey data
    const survey = await dataManager.getSchema(surveyId);
    if (!survey) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Survey not found',
        code: 'SURVEY_NOT_FOUND',
        details: { surveyId }
      };
      return addSecurityHeaders(NextResponse.json(errorResponse, { status: 404 }));
    }

    // Extract stakeholders from survey data
    const stakeholders = survey.stakeholders?.map(stakeholder => ({
      id: stakeholder.id,
      name: stakeholder.name,
      description: stakeholder.description,
      color: stakeholder.color,
      expertise: stakeholder.requiredExpertise || []
    })) || [];

    if (stakeholders.length === 0) {
      console.warn(`[StakeholderList] No stakeholders found for survey: ${surveyId}`);
    }

    const response: StakeholderListResponse = {
      stakeholders
    };

    console.log(`[StakeholderList] Returning ${stakeholders.length} stakeholders for survey: ${surveyId}`);
    return addSecurityHeaders(NextResponse.json(response));

  } catch (error) {
    console.error('[StakeholderList] Error loading stakeholders:', error);
    
    const errorResponse: ApiErrorResponse = {
      error: true,
      message: 'Failed to load stakeholders',
      code: 'INTERNAL_ERROR',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        surveyId: params.surveyId 
      }
    };
    
    return addSecurityHeaders(NextResponse.json(errorResponse, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return addSecurityHeaders(new NextResponse(null, { status: 200 }));
}