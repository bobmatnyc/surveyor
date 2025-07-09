import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';

const dataManager = SurveyDataManager.getInstance();

export async function GET(request: NextRequest) {
  try {
    const surveys = await dataManager.listSchemas();
    return NextResponse.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const schema = await request.json();
    schema.id = schema.id || `survey-${Date.now()}`;
    schema.createdAt = new Date().toISOString();
    schema.updatedAt = new Date().toISOString();
    
    const schemaUrl = await dataManager.saveSchema(schema);
    
    return NextResponse.json({
      success: true,
      schemaUrl,
      schema,
      message: 'Survey created successfully'
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create survey' },
      { status: 500 }
    );
  }
}