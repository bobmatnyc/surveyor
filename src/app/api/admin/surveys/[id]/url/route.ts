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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { url } = await request.json();

    // Validate URL format if provided
    if (url && url.trim()) {
      try {
        new URL(url);
      } catch {
        const response = NextResponse.json(
          { success: false, error: 'Invalid URL format' },
          { status: 400 }
        );
        return addSecurityHeaders(response);
      }
    }

    // Get existing survey
    const surveys = await dataManager.listSchemas();
    const survey = surveys.find(s => s.id === id);

    if (!survey) {
      const response = NextResponse.json(
        { success: false, error: 'Survey not found' },
        { status: 404 }
      );
      return addSecurityHeaders(response);
    }

    // Update survey with new URL
    const updatedSurvey = {
      ...survey,
      url: url?.trim() || '',
      updatedAt: new Date()
    };

    await dataManager.saveSchema(updatedSurvey);

    const response = NextResponse.json({
      success: true,
      message: 'Survey URL updated successfully',
      survey: updatedSurvey
    });
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Error updating survey URL:', error);
    const response = NextResponse.json(
      { success: false, error: 'Failed to update survey URL' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}