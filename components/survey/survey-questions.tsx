'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SurveySchema } from '@/lib/types';
import { useSurveyStore } from '@/lib/store';
import { QuestionRenderer } from './question-renderer';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface SurveyQuestionsProps {
  survey: SurveySchema;
  organizationId: string;
  onComplete: () => void;
}

export function SurveyQuestions({ survey, organizationId, onComplete }: SurveyQuestionsProps) {
  const {
    currentQuestion,
    responses,
    filteredQuestions,
    stakeholder,
    expertise,
    nextQuestion,
    previousQuestion,
    canProceed,
    getProgress,
    respondentId,
    startTime
  } = useSurveyStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestionData = filteredQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === filteredQuestions.length - 1;
  const progress = getProgress();

  const handleNext = () => {
    if (isLastQuestion) {
      handleComplete();
    } else {
      nextQuestion();
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Create survey response
      const surveyResponse = {
        id: respondentId,
        surveyId: survey.id,
        organizationId,
        respondentId,
        stakeholder: stakeholder!,
        expertise,
        responses,
        startTime,
        completionTime: new Date(),
        progress: 100
      };

      // Submit response
      const response = await fetch(`/api/surveys/${survey.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyResponse),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey response');
      }

      // Calculate and save results
      const resultsResponse = await fetch(`/api/surveys/${survey.id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!resultsResponse.ok) {
        console.warn('Failed to calculate results, but response was saved');
      }

      onComplete();
    } catch (error) {
      console.error('Error completing survey:', error);
      // For now, still mark as complete even if there's an error
      // In a real app, you'd want better error handling
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentQuestionData) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600">No questions available for your role and expertise.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{survey.name}</h1>
            <div className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {filteredQuestions.length}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: survey.domains.find(d => d.id === currentQuestionData.domain)?.color || '#gray' 
                }}
              />
              <span className="text-sm font-medium text-gray-600">
                {survey.domains.find(d => d.id === currentQuestionData.domain)?.name || 'General'}
              </span>
            </div>
            <CardTitle className="text-xl">{currentQuestionData.text}</CardTitle>
            {currentQuestionData.description && (
              <CardDescription>{currentQuestionData.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <QuestionRenderer
              question={currentQuestionData}
              survey={survey}
            />
            
            {currentQuestionData.required && (
              <p className="text-sm text-red-600 mt-4">
                * This question is required
              </p>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Use the Previous and Next buttons to navigate</span>
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : isLastQuestion ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Survey Info */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900">Your Role</div>
                <div className="text-gray-600">
                  {survey.stakeholders.find(s => s.id === stakeholder)?.name}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Expertise</div>
                <div className="text-gray-600">
                  {expertise.length > 0 ? expertise.join(', ') : 'General'}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Questions</div>
                <div className="text-gray-600">{filteredQuestions.length} total</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Organization</div>
                <div className="text-gray-600">{organizationId}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}