import { NextRequest, NextResponse } from 'next/server';
import { SecurityManager, SecurityAuditLogger, SurveyCodes } from '@/lib/security';
import { BlobSurveyStorage } from '@/lib/blob-survey-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { adminCode: string } }
) {
  const security = SecurityManager.getInstance();
  const { adminCode } = params;
  
  try {
    // Validate code format
    if (!SurveyCodes.validateCodeFormat(adminCode)) {
      SecurityAuditLogger.log('INVALID_ADMIN_CODE_FORMAT', {
        code: adminCode,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }, request);
      
      return security.createErrorResponse(
        'Invalid admin code format',
        400
      );
    }

    // Get survey results by admin code
    const data = await BlobSurveyStorage.getResultsByAdminCode(adminCode);
    
    if (!data) {
      SecurityAuditLogger.log('ADMIN_RESULTS_NOT_FOUND', {
        adminCode,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }, request);
      
      return security.createErrorResponse(
        'Survey results not found',
        404
      );
    }

    const { survey, metadata, responses, results } = data;

    // Calculate response statistics
    const responseStats = calculateResponseStatistics(responses);
    
    // Calculate completion statistics by stakeholder
    const stakeholderStats = calculateStakeholderStatistics(survey, responses);
    
    // Calculate domain coverage
    const domainCoverage = calculateDomainCoverage(survey, responses);

    SecurityAuditLogger.log('ADMIN_RESULTS_ACCESS', {
      adminCode,
      surveyId: survey.id,
      surveyName: survey.name,
      responseCount: responses.length,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    }, request);

    return security.createSecureResponse({
      success: true,
      data: {
        survey: {
          id: survey.id,
          name: survey.name,
          description: survey.description,
          version: survey.version,
          stakeholders: survey.stakeholders,
          domains: survey.domains,
          questions: survey.questions,
          scoring: survey.scoring
        },
        metadata,
        responses,
        results: results || [],
        statistics: {
          ...responseStats,
          stakeholderBreakdown: stakeholderStats,
          domainCoverage
        }
      }
    });

  } catch (error) {
    console.error('Admin results access error:', error);
    
    SecurityAuditLogger.log('ADMIN_RESULTS_SYSTEM_ERROR', {
      adminCode,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    }, request);
    
    return security.createErrorResponse(
      'Results access failed',
      500
    );
  }
}

/**
 * Calculate basic response statistics
 */
function calculateResponseStatistics(responses: any[]) {
  const totalResponses = responses.length;
  const completedResponses = responses.filter(r => r.progress === 100).length;
  const partialResponses = totalResponses - completedResponses;
  
  const organizationCounts = responses.reduce((acc, response) => {
    acc[response.organizationId] = (acc[response.organizationId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const uniqueOrganizations = Object.keys(organizationCounts).length;
  
  // Calculate average completion time for completed responses
  const completedWithTimes = responses.filter(r => 
    r.progress === 100 && r.startTime && r.completionTime
  );
  
  const averageCompletionTime = completedWithTimes.length > 0
    ? completedWithTimes.reduce((acc, r) => {
        const duration = new Date(r.completionTime).getTime() - new Date(r.startTime).getTime();
        return acc + duration;
      }, 0) / completedWithTimes.length
    : 0;

  return {
    totalResponses,
    completedResponses,
    partialResponses,
    completionRate: totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0,
    uniqueOrganizations,
    organizationCounts,
    averageCompletionTimeMs: averageCompletionTime,
    averageCompletionTimeMinutes: Math.round(averageCompletionTime / (1000 * 60))
  };
}

/**
 * Calculate statistics by stakeholder
 */
function calculateStakeholderStatistics(survey: any, responses: any[]) {
  const stakeholderStats: Record<string, any> = {};
  
  for (const stakeholder of survey.stakeholders) {
    const stakeholderResponses = responses.filter(r => r.stakeholder === stakeholder.id);
    const completed = stakeholderResponses.filter(r => r.progress === 100);
    
    stakeholderStats[stakeholder.id] = {
      name: stakeholder.name,
      totalResponses: stakeholderResponses.length,
      completedResponses: completed.length,
      completionRate: stakeholderResponses.length > 0 
        ? (completed.length / stakeholderResponses.length) * 100 
        : 0,
      uniqueOrganizations: [...new Set(stakeholderResponses.map(r => r.organizationId))].length
    };
  }
  
  return stakeholderStats;
}

/**
 * Calculate domain coverage statistics
 */
function calculateDomainCoverage(survey: any, responses: any[]) {
  const domainCoverage: Record<string, any> = {};
  
  for (const domain of survey.domains) {
    const domainQuestions = survey.questions.filter((q: any) => q.domain === domain.id);
    const questionIds = domainQuestions.map((q: any) => q.id);
    
    let totalAnswers = 0;
    let possibleAnswers = 0;
    
    for (const response of responses) {
      if (response.progress === 100) {
        for (const questionId of questionIds) {
          possibleAnswers++;
          if (response.responses[questionId] !== undefined && response.responses[questionId] !== null) {
            totalAnswers++;
          }
        }
      }
    }
    
    domainCoverage[domain.id] = {
      name: domain.name,
      questionCount: domainQuestions.length,
      totalAnswers,
      possibleAnswers,
      coverageRate: possibleAnswers > 0 ? (totalAnswers / possibleAnswers) * 100 : 0
    };
  }
  
  return domainCoverage;
}