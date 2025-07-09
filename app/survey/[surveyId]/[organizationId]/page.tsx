'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SurveyInterface } from '@/components/survey/survey-interface';
import { SurveySchema } from '@/lib/types';
import { useSurveyStore } from '@/lib/store';

export default function SurveyPage() {
  const params = useParams();
  const { surveyId, organizationId } = params;
  const [survey, setSurvey] = useState<SurveySchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { setSurvey: setStoreSurvey } = useSurveyStore();

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}`);
      if (!response.ok) {
        throw new Error('Survey not found');
      }
      const surveyData = await response.json();
      setSurvey(surveyData);
      setStoreSurvey(surveyData);
      
      // Set organization ID in store
      useSurveyStore.getState().organizationId = organizationId as string;
      
    } catch (error) {
      console.error('Failed to load survey:', error);
      setError(error instanceof Error ? error.message : 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Survey not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <SurveyInterface 
        survey={survey} 
        organizationId={organizationId as string} 
      />
    </div>
  );
}