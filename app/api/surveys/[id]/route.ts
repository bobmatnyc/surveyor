import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';

const dataManager = SurveyDataManager.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schema = await dataManager.getSchema(params.id);
    if (!schema) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(schema);
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json(
      { error: 'Failed to fetch survey' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schema = await request.json();
    schema.id = params.id;
    schema.updatedAt = new Date().toISOString();
    
    const schemaUrl = await dataManager.saveSchema(schema);
    
    return NextResponse.json({
      success: true,
      schemaUrl,
      schema,
      message: 'Survey updated successfully'
    });
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update survey' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dataManager.deleteSchema(params.id);
    return NextResponse.json({
      success: true,
      message: 'Survey deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete survey' },
      { status: 500 }
    );
  }
}