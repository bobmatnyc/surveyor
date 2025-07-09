'use client';

import { useState, useEffect } from 'react';
import { SurveySchema } from '@/lib/types';
import { useSurveyStore } from '@/lib/store';
import { StakeholderSelection } from './stakeholder-selection';
import { SurveyQuestions } from './survey-questions';
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

  if (isComplete) {
    return (
      <SurveyComplete
        survey={survey}
        organizationId={organizationId}
        onStartOver={handleStartOver}
      />
    );
  }

  if (!stakeholder) {
    return (
      <StakeholderSelection
        survey={survey}
        onSelect={handleStakeholderSelection}
      />
    );
  }

  return (
    <SurveyQuestions
      survey={survey}
      organizationId={organizationId}
      onComplete={handleSurveyComplete}
    />
  );
}