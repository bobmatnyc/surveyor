import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';

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
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format');
    
    if (format === 'index') {
      // Return the survey index with metadata
      const surveyIndex = await dataManager.getSurveyIndex();
      const response = NextResponse.json(surveyIndex);
      return addSecurityHeaders(response);
    } else {
      // Return the full survey schemas (backward compatibility)
      const surveys = await dataManager.listSchemas();
      const response = NextResponse.json(surveys);
      return addSecurityHeaders(response);
    }
  } catch (error) {
    console.error('Error fetching surveys:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch surveys', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Input validation and sanitization
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const response = NextResponse.json(
        { success: false, error: 'Invalid content type' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    const schema = await request.json();
    
    // Basic input validation
    if (!schema || typeof schema !== 'object') {
      const response = NextResponse.json(
        { success: false, error: 'Invalid schema data' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }
    
    schema.id = schema.id || `survey-${Date.now()}`;
    schema.createdAt = new Date().toISOString();
    schema.updatedAt = new Date().toISOString();
    
    const schemaUrl = await dataManager.saveSchema(schema);
    
    const response = NextResponse.json({
      success: true,
      schemaUrl,
      schema,
      message: 'Survey created successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error creating survey:', error);
    const response = NextResponse.json(
      { success: false, error: 'Failed to create survey' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}