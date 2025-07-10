'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SurveySchema } from '@/lib/types';
import { useSurveyStore } from '@/lib/store';
import { QuestionRenderer } from './question-renderer';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, User, Award, Sparkles, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SurveyQuestionsProps {
  survey: SurveySchema;
  organizationId: string;
  onComplete: () => void;
}

// Enhanced animation variants for question cards
const questionCardVariants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.95,
    rotateX: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -30,
    scale: 0.95,
    rotateX: -10,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const navigationVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

const infoCardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      delay: 0.2,
    },
  },
};

const domainBadgeVariants = {
  hidden: { opacity: 0, scale: 0.8, x: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      delay: 0.1,
    },
  },
};

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
      const response = await fetch(`/api/admin/surveys/${survey.id}/responses`, {
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
        <div className="max-w-2xl mx-auto">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              No questions available for your role and expertise. Please contact your administrator or try selecting different expertise areas.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Announcements for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isSubmitting && "Submitting survey response..."}
        {!isSubmitting && `Question ${currentQuestion + 1} of ${filteredQuestions.length}: ${currentQuestionData?.text || ''}`}
      </div>
      
      {/* Fixed Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-white/95 backdrop-blur-sm border-b border-blue-200/50 shadow-lg">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">{survey.name}</h1>
                <Badge variant="secondary" className="text-sm font-medium bg-blue-50 text-blue-700 border-blue-200">
                  Question {currentQuestion + 1} of {filteredQuestions.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-600">{progress}%</span>
                <div className="text-xs text-gray-500">Complete</div>
              </div>
            </div>
            
            <div className="relative">
              <Progress 
                value={progress} 
                className="h-2 bg-blue-100 border border-blue-200"
              />
              <div 
                className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-6">
          
          {/* Enhanced Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`question-${currentQuestion}`}
              variants={questionCardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mb-8"
            >
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl ring-1 ring-blue-100/50 hover:shadow-3xl transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-4 relative">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.3),transparent_50%)]" />
                  </div>
                  
                  <div className="relative z-10">
                    <motion.div 
                      className="flex items-center gap-3 mb-4"
                      variants={domainBadgeVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.div
                        className="w-6 h-6 rounded-full ring-2 ring-white shadow-lg"
                        style={{ 
                          backgroundColor: survey.domains.find(d => d.id === currentQuestionData.domain)?.color || '#6366f1' 
                        }}
                        whileHover={{ scale: 1.1 }}
                        animate={{ 
                          boxShadow: [
                            '0 0 0 0px rgba(59, 130, 246, 0.4)',
                            '0 0 0 10px rgba(59, 130, 246, 0)',
                          ]
                        }}
                        transition={{ 
                          boxShadow: {
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }
                        }}
                      />
                      <Badge 
                        variant="secondary" 
                        className="text-sm font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm"
                      >
                        {survey.domains.find(d => d.id === currentQuestionData.domain)?.name || 'General'}
                      </Badge>
                      <motion.div
                        className="ml-auto"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                      </motion.div>
                    </motion.div>
                    
                    <motion.div
                      variants={titleVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <CardTitle className="text-2xl font-bold text-gray-900 leading-tight mb-4">
                        {currentQuestionData.text}
                      </CardTitle>
                      {currentQuestionData.description && (
                        <>
                          <Separator className="my-4" />
                          <CardDescription className="text-gray-600 text-base leading-relaxed mt-4 mb-2">
                            {currentQuestionData.description}
                          </CardDescription>
                        </>
                      )}
                    </motion.div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-2 relative">
                  <motion.div 
                    className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-8 border border-blue-200/30 shadow-inner"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <QuestionRenderer
                      question={currentQuestionData}
                      survey={survey}
                    />
                  </motion.div>
                  
                  {currentQuestionData.required && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      <Alert className="mt-4 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">
                          This question is required
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Enhanced Navigation Card */}
          <motion.div
            variants={navigationVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-lg ring-1 ring-blue-100/50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      onClick={previousQuestion}
                      disabled={currentQuestion === 0}
                      className="min-w-[120px] h-12 bg-white/90 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 shadow-sm"
                      aria-label="Go to previous question"
                    >
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ x: 0 }}
                        whileHover={{ x: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Previous
                      </motion.div>
                    </Button>
                  </motion.div>

                  <motion.div 
                    className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm" 
                    role="status" 
                    aria-live="polite"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>Navigate with Previous and Next buttons</span>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed() || isSubmitting}
                      className="min-w-[120px] h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 relative overflow-hidden"
                      aria-label={isLastQuestion ? "Complete survey" : "Go to next question"}
                    >
                      {/* Button shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.5 }}
                      />
                      
                      <motion.div
                        className="flex items-center gap-2 relative z-10"
                        initial={{ x: 0 }}
                        whileHover={{ x: isLastQuestion ? 0 : 2 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isSubmitting ? (
                          <>
                            <motion.div
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            <span>Submitting...</span>
                          </>
                        ) : isLastQuestion ? (
                          <>
                            <CheckCircle className="h-4 w-4" aria-hidden="true" />
                            Complete
                          </>
                        ) : (
                          <>
                            Next
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </>
                        )}
                      </motion.div>
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Survey Info */}
          <motion.div
            variants={infoCardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-lg ring-1 ring-blue-100/50 overflow-hidden">
              <CardContent className="pt-6 relative">
                {/* Animated background elements */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-3xl" />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                  <motion.div 
                    className="flex flex-col items-center text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <motion.div 
                      className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-3 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <User className="w-6 h-6 text-blue-600" />
                    </motion.div>
                    <div className="font-semibold text-gray-900 text-sm mb-1">Your Role</div>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                      {survey.stakeholders.find(s => s.id === stakeholder)?.name}
                    </Badge>
                  </motion.div>
                  
                  <motion.div 
                    className="flex flex-col items-center text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <motion.div 
                      className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-3 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Award className="w-6 h-6 text-green-600" />
                    </motion.div>
                    <div className="font-semibold text-gray-900 text-sm mb-1">Expertise</div>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                      {expertise.length > 0 ? expertise.join(', ') : 'General'}
                    </Badge>
                  </motion.div>
                  
                  <motion.div 
                    className="flex flex-col items-center text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <motion.div 
                      className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-3 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </motion.div>
                    <div className="font-semibold text-gray-900 text-sm mb-1">Questions</div>
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                      {filteredQuestions.length} total
                    </Badge>
                  </motion.div>
                  
                  <motion.div 
                    className="flex flex-col items-center text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <motion.div 
                      className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center mb-3 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <motion.div 
                        className="w-6 h-6 bg-indigo-600 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </motion.div>
                    <div className="font-semibold text-gray-900 text-sm mb-1">Organization</div>
                    <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-800 border-indigo-200">
                      {organizationId}
                    </Badge>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}