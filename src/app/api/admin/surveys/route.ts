import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth, SecurityManager, SecurityAuditLogger, CSRFProtection } from '@/lib/security';
import { BlobSurveyStorage, SurveyMetadata } from '@/lib/blob-survey-storage';
import { SurveySchema } from '@/lib/types';
import { z } from 'zod';

// Validation schema for survey upload
const surveyUploadSchema = z.object({
  survey: z.object({
    name: z.string().min(1, 'Survey name is required').max(200),
    description: z.string().max(1000).optional(),
    version: z.string().default('1.0.0'),
    isActive: z.boolean().default(true),
    settings: z.object({
      allowMultipleResponses: z.boolean().default(false),
      requireAllStakeholders: z.boolean().default(true),
      showProgressBar: z.boolean().default(true),
      allowNavigation: z.boolean().default(true),
      timeLimit: z.number().optional()
    }).optional(),
    stakeholders: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      weight: z.number().min(0).max(1),
      color: z.string()
    })).min(1, 'At least one stakeholder is required'),
    domains: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      weight: z.number().min(0).max(1),
      color: z.string()
    })).min(1, 'At least one domain is required'),
    questions: z.array(z.object({
      id: z.string(),
      text: z.string().min(1),
      type: z.enum(['likert_5', 'likert_3', 'multiple_choice', 'single_select', 'text', 'number', 'boolean']),
      domain: z.string(),
      targetStakeholders: z.array(z.string()).min(1),
      required: z.boolean().default(true)
    })).min(1, 'At least one question is required'),
    scoring: z.object({
      method: z.enum(['weighted_average', 'custom']).default('weighted_average'),
      stakeholderWeights: z.record(z.number()),
      domainWeights: z.record(z.number()),
      maturityLevels: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        minScore: z.number(),
        maxScore: z.number(),
        color: z.string(),
        recommendations: z.array(z.string())
      }))
    })
  })
});

// Upload survey endpoint
export const POST = AdminAuth.requireAuth(async (request: NextRequest, username: string) => {
  // CSRF protection check
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token');
    const sessionCookie = request.cookies.get('admin_session')?.value;
    
    if (!csrfToken || !sessionCookie) {
      SecurityAuditLogger.log('CSRF_TOKEN_MISSING', {
        method: request.method,
        path: request.nextUrl.pathname,
        hasCSRF: !!csrfToken,
        hasSession: !!sessionCookie
      }, request);
      
      return NextResponse.json({
        success: false,
        message: 'CSRF token required'
      }, { status: 403 });
    }

    if (!CSRFProtection.validateToken(sessionCookie, csrfToken)) {
      SecurityAuditLogger.log('CSRF_TOKEN_INVALID', {
        method: request.method,
        path: request.nextUrl.pathname
      }, request);
      
      return NextResponse.json({
        success: false,
        message: 'Invalid CSRF token'
      }, { status: 403 });
    }
  }
  const security = SecurityManager.getInstance();
  
  try {
    // Validate and sanitize request body
    const body = await security.validateAndSanitizeRequest(request);
    
    // Validate survey schema
    const validationResult = surveyUploadSchema.safeParse(body);
    if (!validationResult.success) {
      SecurityAuditLogger.log('SURVEY_UPLOAD_VALIDATION_ERROR', {
        username,
        errors: validationResult.error.errors
      }, request);
      
      return security.createErrorResponse(
        `Invalid survey data: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const { survey } = validationResult.data;

    // Additional validation checks
    const validationErrors = validateSurveyIntegrity(survey);
    if (validationErrors.length > 0) {
      SecurityAuditLogger.log('SURVEY_INTEGRITY_ERROR', {
        username,
        errors: validationErrors
      }, request);
      
      return security.createErrorResponse(
        `Survey integrity errors: ${validationErrors.join(', ')}`,
        400
      );
    }

    // Store survey in blob storage
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const metadata = await BlobSurveyStorage.storeSurvey(survey as SurveySchema, username, baseUrl);

    SecurityAuditLogger.log('SURVEY_UPLOAD_SUCCESS', {
      username,
      surveyId: metadata.surveyId,
      surveyName: survey.name,
      distributionCode: metadata.distributionCode,
      adminCode: metadata.adminCode
    }, request);

    return security.createSecureResponse({
      success: true,
      message: 'Survey uploaded successfully',
      data: {
        surveyId: metadata.surveyId,
        distributionCode: metadata.distributionCode,
        adminCode: metadata.adminCode,
        distributionUrl: metadata.distributionUrl,
        adminUrl: metadata.adminUrl,
        uploadedAt: metadata.uploadedAt
      }
    }, 201);

  } catch (error) {
    console.error('Survey upload error:', error);
    
    SecurityAuditLogger.log('SURVEY_UPLOAD_SYSTEM_ERROR', {
      username,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, request);
    
    return security.createErrorResponse(
      'Survey upload failed',
      500
    );
  }
});

// Get surveys uploaded by admin
export const GET = AdminAuth.requireAuth(async (request: NextRequest, username: string) => {
  const security = SecurityManager.getInstance();
  
  try {
    // Get all surveys for this admin
    const surveys = await BlobSurveyStorage.getSurveysByAdmin(username);
    
    return security.createSecureResponse({
      success: true,
      data: {
        surveys,
        total: surveys.length
      }
    });

  } catch (error) {
    console.error('Survey list error:', error);
    
    SecurityAuditLogger.log('SURVEY_LIST_ERROR', {
      username,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, request);
    
    return security.createErrorResponse(
      'Failed to retrieve surveys',
      500
    );
  }
});

/**
 * Validate survey data integrity and business rules
 */
function validateSurveyIntegrity(survey: any): string[] {
  const errors: string[] = [];

  // Check stakeholder references in questions
  const stakeholderIds = new Set(survey.stakeholders.map((s: any) => s.id));
  const domainIds = new Set(survey.domains.map((d: any) => d.id));

  for (const question of survey.questions) {
    // Validate domain reference
    if (!domainIds.has(question.domain)) {
      errors.push(`Question "${question.id}" references unknown domain "${question.domain}"`);
    }

    // Validate stakeholder references
    for (const stakeholderId of question.targetStakeholders) {
      if (!stakeholderIds.has(stakeholderId)) {
        errors.push(`Question "${question.id}" references unknown stakeholder "${stakeholderId}"`);
      }
    }
  }

  // Validate scoring weights
  if (survey.scoring) {
    // Check stakeholder weights
    for (const stakeholderId of Object.keys(survey.scoring.stakeholderWeights)) {
      if (!stakeholderIds.has(stakeholderId)) {
        errors.push(`Scoring references unknown stakeholder "${stakeholderId}"`);
      }
    }

    // Check domain weights
    for (const domainId of Object.keys(survey.scoring.domainWeights)) {
      if (!domainIds.has(domainId)) {
        errors.push(`Scoring references unknown domain "${domainId}"`);
      }
    }

    // Validate maturity levels
    const levels = survey.scoring.maturityLevels;
    if (levels && levels.length > 0) {
      levels.sort((a: any, b: any) => a.minScore - b.minScore);
      
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        
        if (level.minScore >= level.maxScore) {
          errors.push(`Maturity level "${level.name}" has invalid score range`);
        }
        
        if (i > 0 && level.minScore <= levels[i - 1].maxScore) {
          errors.push(`Maturity level "${level.name}" overlaps with previous level`);
        }
      }
    }
  }

  // Validate uniqueness
  const questionIds = survey.questions.map((q: any) => q.id);
  const uniqueQuestionIds = new Set(questionIds);
  if (questionIds.length !== uniqueQuestionIds.size) {
    errors.push('Duplicate question IDs found');
  }

  const stakeholderIdsArray = survey.stakeholders.map((s: any) => s.id);
  const uniqueStakeholderIds = new Set(stakeholderIdsArray);
  if (stakeholderIdsArray.length !== uniqueStakeholderIds.size) {
    errors.push('Duplicate stakeholder IDs found');
  }

  const domainIdsArray = survey.domains.map((d: any) => d.id);
  const uniqueDomainIds = new Set(domainIdsArray);
  if (domainIdsArray.length !== uniqueDomainIds.size) {
    errors.push('Duplicate domain IDs found');
  }

  return errors;
}