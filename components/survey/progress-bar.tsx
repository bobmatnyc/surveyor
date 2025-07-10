'use client';

import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, ArrowRight, Target, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  progress: number;
  className?: string;
  domains?: Array<{
    id: string;
    name: string;
    color: string;
    questionsCompleted: number;
    totalQuestions: number;
  }>;
  currentDomain?: string;
}

// Animation variants for progress elements
const progressVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const fillVariants = {
  hidden: { width: 0 },
  visible: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export function ProgressBar({ 
  current, 
  total, 
  progress, 
  className = "", 
  domains = [], 
  currentDomain 
}: ProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 300);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <motion.div 
      className={`w-full bg-white/95 backdrop-blur-sm border-b border-blue-200/50 shadow-lg ${className}`} 
      role="region" 
      aria-label="Survey Progress"
      initial="hidden"
      animate="visible"
      variants={progressVariants}
    >
      <div className="max-w-4xl mx-auto px-6 py-5">
        {/* Live region for progress updates */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          Progress: {progress}% complete. Question {current} of {total}.
        </div>
        
        {/* Enhanced Progress Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className="flex items-center gap-2 text-sm font-semibold text-gray-700"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ rotate: progress === 100 ? 360 : 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                {progress === 100 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-600" aria-hidden="true" />
                )}
              </motion.div>
              <span>Question {current} of {total}</span>
            </motion.div>
            
            {/* Current Domain Indicator */}
            {currentDomain && domains.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200"
              >
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ 
                    backgroundColor: domains.find(d => d.id === currentDomain)?.color || '#6366f1'
                  }}
                />
                <span className="text-xs font-medium text-blue-700">
                  {domains.find(d => d.id === currentDomain)?.name || 'Current Domain'}
                </span>
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <motion.span 
              className="text-lg font-bold text-blue-600"
              key={progress}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {progress}%
            </motion.span>
            <div className="text-xs text-gray-500 font-medium">Complete</div>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="relative mb-4">
          <div className="h-4 bg-gray-200/80 rounded-full border border-gray-300/50 shadow-inner overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full relative overflow-hidden"
              custom={animatedProgress}
              variants={fillVariants}
              initial="hidden"
              animate="visible"
              style={{
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
              }}
            >
              {/* Animated shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              
              {/* Progress sparkles */}
              <AnimatePresence>
                {progress > 0 && (
                  <motion.div
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      <Star className="w-3 h-3 text-yellow-300" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          
          {/* Enhanced Progress Indicator */}
          <motion.div 
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
            style={{ left: `${Math.max(animatedProgress - 2, 0)}%` }}
            aria-hidden="true"
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <motion.div 
              className="w-5 h-5 bg-white border-3 border-blue-600 rounded-full shadow-lg flex items-center justify-center"
              variants={pulseVariants}
              animate={progress === 100 ? 'pulse' : 'pulse'}
              whileHover={{ scale: 1.2 }}
            >
              {progress === 100 ? (
                <CheckCircle className="h-3 w-3 text-green-600" aria-label="Survey complete" />
              ) : (
                <motion.div 
                  className="w-2 h-2 bg-blue-600 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Domain Progress Indicators */}
        {domains.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mb-4"
          >
            <div className="flex flex-wrap gap-2 justify-center">
              {domains.map((domain, index) => {
                const domainProgress = (domain.questionsCompleted / domain.totalQuestions) * 100;
                const isActive = domain.id === currentDomain;
                
                return (
                  <motion.div
                    key={domain.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-100 border-blue-300 shadow-md' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: domain.color }}
                    />
                    <span className={`text-xs font-medium ${
                      isActive ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {domain.name}
                    </span>
                    <span className={`text-xs ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {domain.questionsCompleted}/{domain.totalQuestions}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Enhanced Steps Indicator */}
        <div className="flex justify-between mt-4" role="list" aria-label="Survey step indicators">
          {Array.from({ length: Math.min(total, 12) }, (_, i) => {
            const stepNumber = i + 1;
            const isCompleted = stepNumber < current;
            const isCurrent = stepNumber === current;
            
            return (
              <motion.div
                key={stepNumber}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 shadow-sm'
                    : isCurrent
                    ? 'bg-blue-600 shadow-lg'
                    : 'bg-gray-300'
                }`}
                role="listitem"
                aria-label={`Step ${stepNumber}: ${isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Not started'}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: isCurrent ? 1.4 : 1,
                  opacity: 1 
                }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.5 }}
              />
            );
          })}
        </div>
        
        {/* Progress Status */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mt-4 text-center"
        >
          <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-full inline-block">
            {progress === 100 ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                Survey Complete!
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3 text-blue-600" />
                {100 - progress}% remaining
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}