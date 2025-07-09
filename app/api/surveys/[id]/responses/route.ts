import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';

const dataManager = SurveyDataManager.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const responses = await dataManager.getAllResponses(params.id);
    return NextResponse.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await request.json();
    response.id = response.id || `resp-${Date.now()}`;
    response.surveyId = params.id;
    
    const responseUrl = await dataManager.saveResponse(
      params.id,
      response.organizationId,
      response
    );
    
    return NextResponse.json({
      success: true,
      responseUrl,
      response,
      message: 'Response saved successfully'
    });
  } catch (error) {
    console.error('Error saving response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save response' },
      { status: 500 }
    );
  }
}