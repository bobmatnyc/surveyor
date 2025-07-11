import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';
import { StakeholderResponse, ApiErrorResponse } from '@/lib/api-types';
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
  { params }: { params: { surveyId: string; stakeholderId: string } }
): Promise<NextResponse<StakeholderResponse | ApiErrorResponse>> {
  try {
    const { surveyId, stakeholderId } = params;

    // Validate parameters
    if (!surveyId || !isValidId(surveyId)) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Invalid survey ID format',
        code: 'INVALID_SURVEY_ID',
        details: { surveyId }
      };
      return addSecurityHeaders(NextResponse.json(errorResponse, { status: 400 }));
    }

    if (!stakeholderId || !isValidId(stakeholderId)) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Invalid stakeholder ID format',
        code: 'INVALID_STAKEHOLDER_ID',
        details: { stakeholderId }
      };
      return addSecurityHeaders(NextResponse.json(errorResponse, { status: 400 }));
    }

    console.log(`[StakeholderDetail] Loading stakeholder: ${stakeholderId} for survey: ${surveyId}`);

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

    // Find specific stakeholder
    const stakeholder = survey.stakeholders?.find(s => s.id === stakeholderId);
    if (!stakeholder) {
      const errorResponse: ApiErrorResponse = {
        error: true,
        message: 'Stakeholder not found',
        code: 'STAKEHOLDER_NOT_FOUND',
        details: { surveyId, stakeholderId }
      };
      return addSecurityHeaders(NextResponse.json(errorResponse, { status: 404 }));
    }

    // Transform stakeholder data for API response
    const response: StakeholderResponse = {
      id: stakeholder.id,
      name: stakeholder.name,
      description: stakeholder.description,
      color: stakeholder.color,
      expertise: stakeholder.requiredExpertise || []
    };

    console.log(`[StakeholderDetail] Returning stakeholder: ${stakeholder.name} (${stakeholder.id})`);
    return addSecurityHeaders(NextResponse.json(response));

  } catch (error) {
    console.error('[StakeholderDetail] Error loading stakeholder:', error);
    
    const errorResponse: ApiErrorResponse = {
      error: true,
      message: 'Failed to load stakeholder',
      code: 'INTERNAL_ERROR',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        surveyId: params.surveyId,
        stakeholderId: params.stakeholderId
      }
    };
    
    return addSecurityHeaders(NextResponse.json(errorResponse, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return addSecurityHeaders(new NextResponse(null, { status: 200 }));
}