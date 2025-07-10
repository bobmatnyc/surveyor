import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';
import { SecurityManager, SecurityAuditLogger } from '@/lib/security';

const dataManager = SurveyDataManager.getInstance();
const securityManager = SecurityManager.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Input validation
    if (!params.id || typeof params.id !== 'string') {
      SecurityAuditLogger.log('INVALID_SURVEY_ID_RESPONSES', { id: params.id }, request);
      return securityManager.createErrorResponse('Invalid survey ID', 400);
    }

    // Sanitize the ID parameter
    const sanitizedId = securityManager.sanitizeInput(params.id);
    
    const responses = await dataManager.getAllResponses(sanitizedId);
    
    SecurityAuditLogger.log('RESPONSES_ACCESSED', { surveyId: sanitizedId, count: responses.length }, request);
    return securityManager.createSecureResponse(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    SecurityAuditLogger.log('RESPONSES_FETCH_ERROR', { 
      surveyId: params.id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, request);
    return securityManager.createErrorResponse('Failed to fetch responses', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Input validation
    if (!params.id || typeof params.id !== 'string') {
      SecurityAuditLogger.log('INVALID_SURVEY_ID_RESPONSE_POST', { id: params.id }, request);
      return securityManager.createErrorResponse('Invalid survey ID', 400);
    }

    // Validate and sanitize request body
    const response = await securityManager.validateAndSanitizeRequest(request);
    
    // Sanitize the ID parameter
    const sanitizedId = securityManager.sanitizeInput(params.id);
    
    // Validate required fields
    if (!response.organizationId || typeof response.organizationId !== 'string') {
      SecurityAuditLogger.log('INVALID_ORGANIZATION_ID', { surveyId: sanitizedId }, request);
      return securityManager.createErrorResponse('Invalid organization ID', 400);
    }
    
    response.id = response.id || `resp-${Date.now()}`;
    response.surveyId = sanitizedId;
    response.timestamp = new Date().toISOString();
    
    const responseUrl = await dataManager.saveResponse(
      sanitizedId,
      response.organizationId,
      response
    );
    
    SecurityAuditLogger.log('RESPONSE_SAVED', { 
      surveyId: sanitizedId, 
      organizationId: response.organizationId,
      responseId: response.id 
    }, request);
    
    return securityManager.createSecureResponse({
      success: true,
      responseUrl,
      response,
      message: 'Response saved successfully'
    });
  } catch (error) {
    console.error('Error saving response:', error);
    SecurityAuditLogger.log('RESPONSE_SAVE_ERROR', { 
      surveyId: params.id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, request);
    return securityManager.createErrorResponse('Failed to save response', 500);
  }
}