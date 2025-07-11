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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('survey') as File;

    if (!file) {
      const response = NextResponse.json(
        { success: false, error: 'No survey file provided' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      const response = NextResponse.json(
        { success: false, error: 'Only JSON files are allowed' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const response = NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Read and parse JSON
    const text = await file.text();
    let surveySchema;
    
    try {
      surveySchema = JSON.parse(text);
    } catch (parseError) {
      const response = NextResponse.json(
        { success: false, error: 'Invalid JSON format' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Basic validation of survey schema
    if (!surveySchema.name || !surveySchema.questions || !Array.isArray(surveySchema.questions)) {
      const response = NextResponse.json(
        { success: false, error: 'Invalid survey schema. Must have name and questions array' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Add metadata
    surveySchema.id = surveySchema.id || `survey-${Date.now()}`;
    surveySchema.createdAt = new Date().toISOString();
    surveySchema.updatedAt = new Date().toISOString();
    surveySchema.status = 'active';
    surveySchema.url = surveySchema.url || '';

    // Save the survey
    const schemaUrl = await dataManager.saveSchema(surveySchema);

    const response = NextResponse.json({
      success: true,
      surveyId: surveySchema.id,
      schemaUrl,
      message: 'Survey uploaded successfully'
    });
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Error uploading survey:', error);
    const response = NextResponse.json(
      { success: false, error: 'Failed to upload survey' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}