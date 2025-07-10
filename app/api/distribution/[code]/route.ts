import { NextRequest, NextResponse } from 'next/server';
import { SecurityManager, SecurityAuditLogger, SurveyCodes } from '@/lib/security';
import { BlobSurveyStorage } from '@/lib/blob-survey-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const security = SecurityManager.getInstance();
  const { code } = params;
  
  try {
    // Validate code format
    if (!SurveyCodes.validateCodeFormat(code)) {
      SecurityAuditLogger.log('INVALID_DISTRIBUTION_CODE_FORMAT', {
        code: code,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }, request);
      
      return security.createErrorResponse(
        'Invalid distribution code format',
        400
      );
    }

    // Get survey by distribution code
    const survey = await BlobSurveyStorage.getSurveyByDistributionCode(code);
    
    if (!survey) {
      SecurityAuditLogger.log('SURVEY_NOT_FOUND', {
        distributionCode: code,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }, request);
      
      return security.createErrorResponse(
        'Survey not found or inactive',
        404
      );
    }

    SecurityAuditLogger.log('SURVEY_ACCESS_SUCCESS', {
      distributionCode: code,
      surveyId: survey.id,
      surveyName: survey.name,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    }, request);

    // Return survey data (remove sensitive information)
    const publicSurvey = {
      id: survey.id,
      name: survey.name,
      description: survey.description,
      version: survey.version,
      settings: survey.settings,
      stakeholders: survey.stakeholders,
      domains: survey.domains,
      questions: survey.questions,
      scoring: {
        method: survey.scoring.method,
        maturityLevels: survey.scoring.maturityLevels
        // Don't expose weights to public
      }
    };

    return security.createSecureResponse({
      success: true,
      data: publicSurvey
    });

  } catch (error) {
    console.error('Survey access error:', error);
    
    SecurityAuditLogger.log('SURVEY_ACCESS_SYSTEM_ERROR', {
      distributionCode: code,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    }, request);
    
    return security.createErrorResponse(
      'Survey access failed',
      500
    );
  }
}

// Submit survey response
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const security = SecurityManager.getInstance();
  const { code } = params;
  
  try {
    // Validate code format
    if (!SurveyCodes.validateCodeFormat(code)) {
      return security.createErrorResponse(
        'Invalid distribution code format',
        400
      );
    }

    // Get survey to validate it exists and is active
    const survey = await BlobSurveyStorage.getSurveyByDistributionCode(code);
    
    if (!survey) {
      return security.createErrorResponse(
        'Survey not found or inactive',
        404
      );
    }

    // Validate and sanitize request body
    const body = await security.validateAndSanitizeRequest(request);
    
    // Validate required fields
    if (!body.organizationId || !body.stakeholder || !body.responses) {
      return security.createErrorResponse(
        'Missing required fields: organizationId, stakeholder, responses',
        400
      );
    }

    // Create survey response object
    const response = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      surveyId: survey.id,
      organizationId: body.organizationId,
      respondentId: body.respondentId || `anon_${Date.now()}`,
      stakeholder: body.stakeholder,
      expertise: body.expertise || [],
      responses: body.responses,
      startTime: new Date(body.startTime || Date.now()),
      completionTime: new Date(),
      progress: 100,
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        distributionCode: code
      }
    };

    // Store response
    await BlobSurveyStorage.storeResponse(survey.id, response);

    SecurityAuditLogger.log('SURVEY_RESPONSE_SUBMITTED', {
      distributionCode: code,
      surveyId: survey.id,
      organizationId: body.organizationId,
      stakeholder: body.stakeholder,
      responseId: response.id
    }, request);

    return security.createSecureResponse({
      success: true,
      message: 'Response submitted successfully',
      data: {
        responseId: response.id,
        submittedAt: response.completionTime
      }
    }, 201);

  } catch (error) {
    console.error('Survey response submission error:', error);
    
    SecurityAuditLogger.log('SURVEY_RESPONSE_ERROR', {
      distributionCode: code,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, request);
    
    return security.createErrorResponse(
      'Response submission failed',
      500
    );
  }
}