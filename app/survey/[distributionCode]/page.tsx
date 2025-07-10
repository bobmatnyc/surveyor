'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SurveyInterface } from '@/components/survey/survey-interface';
import { WithSurveyErrorBoundary } from '@/components/survey/survey-error-boundary';
import { SurveySchema } from '@/lib/types';
import { SimpleSurveyStore } from '@/lib/simple-store';
import { demoSurvey } from '@/lib/static-surveys';
import { DebugUtils } from '@/lib/debug-utils';

export default function DistributionSurveyPage() {
  const params = useParams();
  const distributionCode = params?.distributionCode as string;
  
  // Initialize with demo survey immediately to avoid loading states
  const [survey, setSurvey] = useState<SurveySchema | null>(() => {
    // Check if we have stored data first
    if (typeof window !== 'undefined') {
      try {
        const storedState = SimpleSurveyStore.getState();
        if (storedState && storedState.currentSurvey) {
          return storedState.currentSurvey;
        }
      } catch (error) {
        console.warn('Error loading stored survey:', error);
      }
    }
    // Always fallback to demo survey for immediate rendering
    return demoSurvey;
  });
  
  const [organizationId, setOrganizationId] = useState<string>(() => {
    // Initialize organization ID immediately
    if (typeof window !== 'undefined') {
      try {
        const storedState = SimpleSurveyStore.getState();
        if (storedState && storedState.organizationId) {
          return storedState.organizationId;
        }
      } catch (error) {
        console.warn('Error loading stored organization ID:', error);
      }
    }
    return 'demo-organization';
  });

  useEffect(() => {
    console.log('[DistributionSurveyPage] Survey data loaded:', {
      surveyId: survey?.id,
      distributionCode,
      organizationId,
      stakeholderCount: survey?.stakeholders?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Ensure survey data is always stored in SimpleSurveyStore for consistency
    if (survey) {
      SimpleSurveyStore.setSurvey(survey);
      SimpleSurveyStore.setOrganizationId(organizationId);
      
      // If we're using the demo survey (fallback), reset any existing survey state
      if (survey.id === 'demo-survey-showcase') {
        const storedState = SimpleSurveyStore.getState();
        if (!storedState || !storedState.currentSurvey || storedState.currentSurvey.id !== survey.id) {
          console.log('[DistributionSurveyPage] Resetting survey state for fresh demo');
          SimpleSurveyStore.setState({
            stakeholder: null,
            expertise: [],
            currentQuestion: 0,
            responses: {},
            startTime: new Date()
          });
        }
      }
    }
  }, [survey, organizationId, distributionCode]);

  // Survey data loads immediately from static sources
  // Only show loading if we're still initializing
  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Initializing survey...</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700">Debug: Survey failed to load</p>
              <button
                onClick={() => {
                  console.log('[Debug] Distribution Code:', distributionCode);
                  console.log('[Debug] Demo Survey:', demoSurvey);
                  SimpleSurveyStore.debugStorage();
                }}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Debug Survey Loading
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Additional validation for survey data
  if (!survey.stakeholders || survey.stakeholders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Survey Data Error</h2>
          <p className="text-gray-600 mb-6">
            The survey data appears to be corrupted or missing stakeholder information.
          </p>
          <button
            onClick={() => {
              console.log('[Debug] Forcing cache clear and reload');
              DebugUtils.forceClearBrowserData();
              SimpleSurveyStore.forceReset();
              window.location.reload();
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Cache & Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <WithSurveyErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <SurveyInterface survey={survey} organizationId={organizationId} distributionCode={distributionCode} />
      </div>
    </WithSurveyErrorBoundary>
  );
}