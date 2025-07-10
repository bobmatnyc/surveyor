'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SurveyInterface } from '@/components/survey/survey-interface';
import { WithSurveyErrorBoundary } from '@/components/survey/survey-error-boundary';
import { SurveySchema } from '@/lib/types';
import { SimpleSurveyStore } from '@/lib/simple-store';
import { demoSurvey } from '@/lib/static-surveys';

export default function DistributionSurveyPage() {
  const params = useParams();
  const distributionCode = params?.distributionCode as string;
  const [survey, setSurvey] = useState<SurveySchema | null>(null);
  const [organizationId, setOrganizationId] = useState<string>('');

  useEffect(() => {
    // Load survey data from simple store or use static data
    const loadSurveyData = () => {
      try {
        // Try to get from simple store first (set by survey selection)
        const storedState = SimpleSurveyStore.getState();
        
        if (storedState && storedState.currentSurvey) {
          setSurvey(storedState.currentSurvey);
          setOrganizationId(storedState.organizationId || '');
        } else {
          // Fallback to static demo survey
          setSurvey(demoSurvey);
          setOrganizationId('demo-organization');
          // Store the demo data for consistency
          SimpleSurveyStore.setSurvey(demoSurvey);
          SimpleSurveyStore.setOrganizationId('demo-organization');
        }
      } catch (error) {
        console.warn('Error loading survey data, using static demo:', error);
        // Always fallback to demo survey if anything fails
        setSurvey(demoSurvey);
        setOrganizationId('demo-organization');
      }
    };

    loadSurveyData();
  }, [distributionCode]);

  // No loading states needed - survey data loads immediately from static sources
  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading survey data...</p>
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