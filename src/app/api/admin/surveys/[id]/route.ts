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
      SecurityAuditLogger.log('INVALID_SURVEY_ID', { id: params.id }, request);
      return securityManager.createErrorResponse('Invalid survey ID', 400);
    }

    // Sanitize the ID parameter
    const sanitizedId = securityManager.sanitizeInput(params.id);
    
    const schema = await dataManager.getSchema(sanitizedId);
    if (!schema) {
      SecurityAuditLogger.log('SURVEY_NOT_FOUND', { id: sanitizedId }, request);
      return securityManager.createErrorResponse('Survey not found', 404);
    }
    
    SecurityAuditLogger.log('SURVEY_ACCESSED', { id: sanitizedId }, request);
    return securityManager.createSecureResponse(schema);
  } catch (error) {
    console.error('Error fetching survey:', error);
    SecurityAuditLogger.log('SURVEY_FETCH_ERROR', { 
      id: params.id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, request);
    return securityManager.createErrorResponse('Failed to fetch survey', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Input validation
    if (!params.id || typeof params.id !== 'string') {
      SecurityAuditLogger.log('INVALID_SURVEY_ID_UPDATE', { id: params.id }, request);
      return securityManager.createErrorResponse('Invalid survey ID', 400);
    }

    // Validate and sanitize request body
    const schema = await securityManager.validateAndSanitizeRequest(request);
    
    // Sanitize the ID parameter
    const sanitizedId = securityManager.sanitizeInput(params.id);
    
    schema.id = sanitizedId;
    schema.updatedAt = new Date().toISOString();
    
    const schemaUrl = await dataManager.saveSchema(schema);
    
    SecurityAuditLogger.log('SURVEY_UPDATED', { id: sanitizedId }, request);
    return securityManager.createSecureResponse({
      success: true,
      schemaUrl,
      schema,
      message: 'Survey updated successfully'
    });
  } catch (error) {
    console.error('Error updating survey:', error);
    SecurityAuditLogger.log('SURVEY_UPDATE_ERROR', { 
      id: params.id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, request);
    return securityManager.createErrorResponse('Failed to update survey', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Input validation
    if (!params.id || typeof params.id !== 'string') {
      SecurityAuditLogger.log('INVALID_SURVEY_ID_DELETE', { id: params.id }, request);
      return securityManager.createErrorResponse('Invalid survey ID', 400);
    }

    // Sanitize the ID parameter
    const sanitizedId = securityManager.sanitizeInput(params.id);
    
    await dataManager.deleteSchema(sanitizedId);
    
    SecurityAuditLogger.log('SURVEY_DELETED', { id: sanitizedId }, request);
    return securityManager.createSecureResponse({
      success: true,
      message: 'Survey deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting survey:', error);
    SecurityAuditLogger.log('SURVEY_DELETE_ERROR', { 
      id: params.id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, request);
    return securityManager.createErrorResponse('Failed to delete survey', 500);
  }
}