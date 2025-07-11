'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SurveySchema } from '@/lib/types';
import { useSurveyStore } from '@/lib/store';
import { SurveyJSWrapper } from './surveyjs-wrapper';
import { SurveyQuestions } from './survey-questions';
import { ArrowLeft, Settings, AlertCircle, User, Award, CheckCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedSurveyQuestionsProps {
  survey: SurveySchema;
  organizationId: string;
  distributionCode?: string;
  stakeholder: string;
  expertise?: string[];
  onComplete: () => void;
  onBack?: () => void;
  useSurveyJS?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
};

export function EnhancedSurveyQuestions({ 
  survey, 
  organizationId, 
  distributionCode,
  stakeholder,
  expertise = [],
  onComplete, 
  onBack,
  useSurveyJS = true
}: EnhancedSurveyQuestionsProps) {
  const {
    stakeholder: storeStakeholder,
    expertise: storeExpertise,
    responses,
    filteredQuestions,
    respondentId,
    startTime,
    reset
  } = useSurveyStore();

  // Use props as fallback if store values are not available
  const effectiveStakeholder = storeStakeholder || stakeholder;
  const effectiveExpertise = storeExpertise.length > 0 ? storeExpertise : expertise;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentMode, setCurrentMode] = useState<'original' | 'surveyjs'>('surveyjs');

  // Initialize store with props if store values are not available
  useEffect(() => {
    if (!storeStakeholder && stakeholder) {
      useSurveyStore.getState().setStakeholder(stakeholder);
    }
    if (storeExpertise.length === 0 && expertise.length > 0) {
      useSurveyStore.getState().setExpertise(expertise);
    }
  }, [stakeholder, expertise, storeStakeholder, storeExpertise]);

  const handleSurveyJSComplete = async (responses: Record<string, any>) => {
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
      const submitUrl = distributionCode 
        ? `/api/distribution/${distributionCode}`
        : `/api/admin/surveys/${survey.id}/responses`;
      
      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyResponse),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey response');
      }

      // Calculate and save results (only for admin surveys)
      if (!distributionCode) {
        const resultsResponse = await fetch(`/api/admin/surveys/${survey.id}/results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organizationId }),
        });
        
        if (!resultsResponse.ok) {
          console.warn('Failed to calculate results, but response was saved');
        }
      }

      onComplete();
    } catch (error) {
      console.error('Error completing survey:', error);
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePartialSave = async (responses: Record<string, any>) => {
    // Save partial responses for auto-save functionality
    try {
      const partialResponse = {
        id: respondentId,
        surveyId: survey.id,
        organizationId,
        respondentId,
        stakeholder: stakeholder!,
        expertise,
        responses,
        startTime,
        progress: Object.keys(responses).length / filteredQuestions.length * 100
      };

      // Auto-save partial response (only for admin surveys)
      if (!distributionCode) {
        await fetch(`/api/admin/surveys/${survey.id}/responses/partial`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(partialResponse),
        });
      }
    } catch (error) {
      console.warn('Failed to save partial response:', error);
    }
  };

  const handleModeSwitch = () => {
    setCurrentMode(currentMode === 'original' ? 'surveyjs' : 'original');
  };

  const handleRestart = () => {
    reset();
    setCurrentMode('original');
  };

  if (!effectiveStakeholder) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Please select your stakeholder role first.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="relative min-h-screen">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)]" aria-hidden="true" />
        
        {/* Back Button */}
        {onBack && (
          <div className="absolute top-6 left-6 z-10">
            <Button
              variant="outline"
              onClick={onBack}
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-md"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Role Selection
            </Button>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center pt-16 pb-12">
          <div className="max-w-4xl mx-auto px-6">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 mb-6">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2" />
              Survey in Progress
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {survey.name}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {survey.description}
            </p>
          </div>
        </div>

        {/* Survey Content */}
        <div className="max-w-4xl mx-auto px-6 pb-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="wait">
              {currentMode === 'surveyjs' ? (
                <motion.div
                  key="surveyjs"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.5 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl ring-1 ring-blue-100/50">
                    <CardContent className="p-0">
                      <SurveyJSWrapper
                        survey={survey}
                        organizationId={organizationId}
                        stakeholder={stakeholder}
                        expertise={expertise}
                        onComplete={handleSurveyJSComplete}
                        onPartialSave={handlePartialSave}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="original"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.5 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl ring-1 ring-blue-100/50">
                    <CardContent className="p-8">
                      <SurveyQuestions
                        survey={survey}
                        organizationId={organizationId}
                        onComplete={onComplete}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Progress Indicator */}
          {filteredQuestions.length > 0 && (
            <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-xl ring-1 ring-blue-100/50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  Survey Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Your Role</h4>
                    <Badge variant="secondary">
                      {survey.stakeholders.find(s => s.id === stakeholder)?.name}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Questions</h4>
                    <Badge variant="secondary">
                      {Object.keys(responses).length} / {filteredQuestions.length} answered
                    </Badge>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <Settings className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Options</h4>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestart}
                        className="text-xs"
                      >
                        Restart Survey
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}