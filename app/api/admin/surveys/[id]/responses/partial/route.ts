import { NextRequest, NextResponse } from 'next/server';
import { SurveyDataManager } from '@/lib/storage';
import { SecurityManager, SecurityAuditLogger } from '@/lib/security';
import { SurveyResponse } from '@/lib/types';

const dataManager = SurveyDataManager.getInstance();
const securityManager = SecurityManager.getInstance();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const surveyId = params.id;
    const partialResponse: Partial<SurveyResponse> = await request.json();

    // Validate required fields
    if (!partialResponse.organizationId || !partialResponse.stakeholder) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Load existing responses to avoid duplicates
    const existingResponses = await dataManager.getAllResponses(surveyId);
    const existingIndex = existingResponses.findIndex(
      r => r.organizationId === partialResponse.organizationId && 
           r.stakeholder === partialResponse.stakeholder
    );

    const responseData: SurveyResponse = {
      id: partialResponse.id || `${partialResponse.organizationId}_${partialResponse.stakeholder}_${Date.now()}`,
      surveyId,
      organizationId: partialResponse.organizationId,
      respondentId: partialResponse.respondentId || partialResponse.id || `${partialResponse.organizationId}_${partialResponse.stakeholder}`,
      stakeholder: partialResponse.stakeholder,
      expertise: partialResponse.expertise || [],
      responses: partialResponse.responses || {},
      startTime: partialResponse.startTime || new Date(),
      progress: partialResponse.progress || 0,
      metadata: {
        ...partialResponse.metadata,
        isPartial: true,
        lastSaved: new Date().toISOString()
      }
    };

    // Save partial response
    await dataManager.saveResponse(surveyId, responseData.organizationId, responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Partial response saved successfully'
    });

  } catch (error) {
    console.error('Error saving partial response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save partial response' },
      { status: 500 }
    );
  }
}