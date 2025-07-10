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
  onComplete, 
  onBack,
  useSurveyJS = true
}: EnhancedSurveyQuestionsProps) {
  const {
    stakeholder,
    expertise,
    responses,
    filteredQuestions,
    respondentId,
    startTime,
    reset
  } = useSurveyStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentMode, setCurrentMode] = useState<'original' | 'surveyjs'>('surveyjs');

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

  if (!stakeholder) {
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
      {/* Enhanced Header */}
      <motion.div 
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-blue-200/50 shadow-lg"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </motion.div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{survey.name}</h1>
                <p className="text-sm text-gray-600">{survey.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {currentMode === 'surveyjs' ? 'Enhanced View' : 'Classic View'}
              </Badge>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Settings className="h-4 w-4" />
                  Options
                </Button>
              </motion.div>
            </div>
          </div>
          
          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Survey Mode</h3>
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant={currentMode === 'original' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentMode('original')}
                        className="w-full justify-start"
                      >
                        Classic Interface
                      </Button>
                      <Button
                        variant={currentMode === 'surveyjs' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentMode('surveyjs')}
                        className="w-full justify-start"
                      >
                        Enhanced SurveyJS
                      </Button>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Current Role</h3>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        {survey.stakeholders.find(s => s.id === stakeholder)?.name}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {expertise.length > 0 ? `Expertise: ${expertise.join(', ')}` : 'General expertise'}
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">Progress</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        {filteredQuestions.length} questions for your role
                      </div>
                      <div className="text-xs text-gray-500">
                        {Object.keys(responses).length} answered
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestart}
                        className="w-full text-xs"
                      >
                        Restart Survey
                      </Button>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="pt-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto px-6 py-8"
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
                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl ring-1 ring-blue-100/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      Enhanced Survey Experience
                    </CardTitle>
                    <CardDescription>
                      Professional survey interface with improved Likert scales and conditional logic.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                <SurveyQuestions
                  survey={survey}
                  organizationId={organizationId}
                  onComplete={onComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}