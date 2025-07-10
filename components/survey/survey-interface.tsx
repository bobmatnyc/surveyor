'use client';

import { useState, useEffect } from 'react';
import { SurveySchema } from '@/lib/types';
import { useSurveyStore } from '@/lib/store';
import { StakeholderSelection } from './stakeholder-selection';
import { EnhancedSurveyQuestions } from './enhanced-survey-questions';
import { SurveyComplete } from './survey-complete';
import { SurveyEngine } from '@/lib/survey-engine';

interface SurveyInterfaceProps {
  survey: SurveySchema;
  organizationId: string;
}

export function SurveyInterface({ survey, organizationId }: SurveyInterfaceProps) {
  const {
    stakeholder,
    expertise,
    responses,
    filteredQuestions,
    currentQuestion,
    setStakeholder,
    setExpertise,
    setSurvey,
    reset
  } = useSurveyStore();
  
  const [isComplete, setIsComplete] = useState(false);
  const [surveyEngine] = useState(() => new SurveyEngine(survey));

  useEffect(() => {
    setSurvey(survey);
    useSurveyStore.getState().organizationId = organizationId;
  }, [survey, organizationId, setSurvey]);

  useEffect(() => {
    // Check if survey is complete
    if (stakeholder && filteredQuestions.length > 0) {
      const allQuestionsAnswered = filteredQuestions.every(q => 
        responses[q.id] !== undefined && responses[q.id] !== null
      );
      setIsComplete(allQuestionsAnswered && currentQuestion >= filteredQuestions.length);
    }
  }, [stakeholder, filteredQuestions, responses, currentQuestion]);

  const handleStakeholderSelection = (selectedStakeholder: string, selectedExpertise: string[]) => {
    setStakeholder(selectedStakeholder);
    setExpertise(selectedExpertise);
  };

  const handleSurveyComplete = () => {
    setIsComplete(true);
  };

  const handleStartOver = () => {
    reset();
    setIsComplete(false);
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