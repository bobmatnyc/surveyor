import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';
import { SurveyEngine } from '@/lib/survey-engine';

const dataManager = SurveyDataManager.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const results = await dataManager.getAllResults(params.id);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await request.json();
    
    // Get survey schema
    const schema = await dataManager.getSchema(params.id);
    if (!schema) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }
    
    // Get responses for organization
    const responses = await dataManager.getOrganizationResponses(params.id, organizationId);
    if (responses.length === 0) {
      return NextResponse.json(
        { error: 'No responses found for organization' },
        { status: 404 }
      );
    }
    
    // Calculate results
    const engine = new SurveyEngine(schema);
    const result = engine.calculateScore(responses);
    
    // Save results
    const resultUrl = await dataManager.saveResult(params.id, organizationId, result);
    
    return NextResponse.json({
      success: true,
      resultUrl,
      result,
      message: 'Results calculated and saved successfully'
    });
  } catch (error) {
    console.error('Error calculating results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate results' },
      { status: 500 }
    );
  }
}