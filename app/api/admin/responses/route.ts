import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';

const dataManager = SurveyDataManager.getInstance();

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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const surveyId = url.searchParams.get('surveyId');

    // Get all responses from all surveys
    const surveys = await dataManager.listSchemas();
    let allResponses: any[] = [];

    for (const survey of surveys) {
      try {
        const responses = await dataManager.getAllResponses(survey.id);
        // Add survey metadata to each response
        const responsesWithMeta = responses.map(response => ({
          ...response,
          surveyId: survey.id,
          surveyName: survey.name
        }));
        allResponses = allResponses.concat(responsesWithMeta);
      } catch (error) {
        // Skip surveys with no responses or errors
        console.warn(`No responses found for survey ${survey.id}:`, error);
      }
    }

    // Filter by survey ID if specified
    if (surveyId) {
      allResponses = allResponses.filter(response => response.surveyId === surveyId);
    }

    // Sort by completion time (most recent first)
    allResponses.sort((a, b) => {
      const timeA = new Date(a.completionTime || a.createdAt || 0).getTime();
      const timeB = new Date(b.completionTime || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const response = NextResponse.json(allResponses);
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Error fetching responses:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch responses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}