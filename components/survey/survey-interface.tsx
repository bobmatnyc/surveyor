'use client';

import { useState, useEffect } from 'react';
import { SurveySchema } from '@/lib/types';
import { SimpleSurveyStore, useSimpleSurveyState } from '@/lib/simple-store';
import { StakeholderSelection } from './stakeholder-selection';
import { EnhancedSurveyQuestions } from './enhanced-survey-questions';
import { SurveyComplete } from './survey-complete';
import { SurveyEngine } from '@/lib/survey-engine';

interface SurveyInterfaceProps {
  survey: SurveySchema;
  organizationId: string;
  distributionCode?: string;
}

export function SurveyInterface({ survey, organizationId, distributionCode }: SurveyInterfaceProps) {
  const [isComplete, setIsComplete] = useState(false);
  const [stakeholder, setStakeholder] = useState<string | null>(null);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [surveyEngine] = useState(() => new SurveyEngine(survey));
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Ensure survey data is stored in SimpleSurveyStore
    SimpleSurveyStore.setSurvey(survey);
    SimpleSurveyStore.setOrganizationId(organizationId);
    
    // Load existing state if available
    const state = SimpleSurveyStore.getState();
    if (state) {
      setStakeholder(state.stakeholder);
      setExpertise(state.expertise);
    }
  }, [survey, organizationId]);

  useEffect(() => {
    // Check if survey is complete based on SimpleSurveyStore state
    const state = SimpleSurveyStore.getState();
    if (stakeholder && state) {
      const relevantQuestions = survey.questions.filter(q => 
        q.targetStakeholders.includes(stakeholder)
      );
      const allQuestionsAnswered = relevantQuestions.every(q => 
        state.responses[q.id] !== undefined && state.responses[q.id] !== null
      );
      setIsComplete(allQuestionsAnswered && state.currentQuestion >= relevantQuestions.length);
    }
  }, [stakeholder, survey, refreshKey]);

  const handleStakeholderSelection = (selectedStakeholder: string, selectedExpertise: string[]) => {
    setStakeholder(selectedStakeholder);
    setExpertise(selectedExpertise);
    SimpleSurveyStore.setStakeholder(selectedStakeholder);
    SimpleSurveyStore.setExpertise(selectedExpertise);
  };

  const handleSurveyComplete = () => {
    setIsComplete(true);
  };

  const handleStartOver = () => {
    SimpleSurveyStore.reset();
    setIsComplete(false);
    setStakeholder(null);
    setExpertise([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="relative min-h-screen">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)]" aria-hidden="true" />
        
        {/* Main Content */}
        <main className="relative z-10">
          {isComplete ? (
            <SurveyComplete
              survey={survey}
              organizationId={organizationId}
              onStartOver={handleStartOver}
            />
          ) : !stakeholder ? (
            <StakeholderSelection
              survey={survey}
              onSelect={handleStakeholderSelection}
            />
          ) : (
            <EnhancedSurveyQuestions
              survey={survey}
              organizationId={organizationId}
              distributionCode={distributionCode}
              onComplete={handleSurveyComplete}
              onBack={handleStartOver}
              useSurveyJS={true}
            />
          )}
        </main>
      </div>
    </div>
  );
}