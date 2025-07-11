'use client';

import { QuestionOption } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Check, ChevronRight } from 'lucide-react';

interface LikertScaleProps {
  options: QuestionOption[];
  value: any;
  onChange: (value: any) => void;
  primaryColor: string;
}

// Enhanced animation variants for SurveyJS-inspired effects
const optionVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  selected: {
    scale: 1.03,
    y: -3,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const selectionIndicatorVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export function LikertScale({ options, value, onChange, primaryColor }: LikertScaleProps) {
  const [hoveredOption, setHoveredOption] = useState<string | number | null>(null);

  return (
    <fieldset className="space-y-5">
      <legend className="sr-only">Select your response level</legend>
      
      {/* Enhanced Scale Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex justify-between items-center mb-6 px-2"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-sm" />
          <span>Strongly Disagree</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <div className="w-3 h-3 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full shadow-sm" />
          <span>Neutral</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-sm" />
          <span>Strongly Agree</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const isHovered = hoveredOption === option.value;
          
          return (
            <motion.div
              key={option.value}
              custom={index}
              initial="hidden"
              animate={isSelected ? "selected" : "visible"}
              variants={optionVariants}
              whileHover="hover"
              className={cn(
                'group relative flex items-center px-8 py-6 rounded-2xl border-2 cursor-pointer overflow-hidden',
                'bg-gradient-to-r transition-all duration-300 ease-out',
                isSelected
                  ? 'border-blue-500 from-blue-50 via-indigo-50 to-blue-50 shadow-xl ring-2 ring-blue-200/50 shadow-blue-200/20'
                  : 'border-gray-200 from-white to-gray-50/30 hover:border-blue-300 hover:from-blue-50/50 hover:to-indigo-50/30 hover:shadow-lg hover:shadow-blue-100/20'
              )}
              onClick={() => onChange(option.value)}
              onMouseEnter={() => setHoveredOption(option.value)}
              onMouseLeave={() => setHoveredOption(null)}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-describedby={option.description ? `option-${option.value}-desc` : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(option.value);
                }
              }}
            >
              {/* Animated Background Overlay */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: isSelected ? 0.1 : 0,
                  scale: isSelected ? 1.2 : 0.8
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl"
              />
              
              {/* Selection Indicator */}
              <div className="flex items-center mr-6 z-10">
                <motion.div
                  className={cn(
                    'w-7 h-7 rounded-full border-2 flex items-center justify-center relative',
                    'shadow-lg transition-all duration-200',
                    isSelected
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500 shadow-blue-300'
                      : 'bg-white border-gray-300 group-hover:border-blue-400 group-hover:shadow-blue-200'
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Pulse ring for selection */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        exit={{ scale: 1, opacity: 0 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeOut',
                        }}
                        className="absolute inset-0 rounded-full bg-blue-400"
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
              
              {/* Content */}
              <div className="flex-1 z-10 min-w-0">
                <div className="flex items-center gap-4 mb-3">
                  <motion.span
                    className={cn(
                      'text-lg font-bold px-4 py-2 rounded-full transition-all duration-200',
                      'shadow-sm border border-opacity-20',
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-300 border-blue-300'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:text-blue-700 border-gray-300'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {option.value}
                  </motion.span>
                  <motion.span
                    className={cn(
                      'text-lg font-semibold transition-all duration-200 leading-relaxed',
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    )}
                    layout
                  >
                    {option.label}
                  </motion.span>
                </div>
                {option.description && (
                  <motion.p
                    id={`option-${option.value}-desc`}
                    className={cn(
                      'text-sm leading-relaxed transition-all duration-200 mt-2',
                      isSelected ? 'text-blue-700' : 'text-gray-600'
                    )}
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {option.description}
                  </motion.p>
                )}
              </div>
              
              {/* Enhanced Visual Feedback */}
              <motion.div
                className="z-10 flex items-center gap-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ 
                  opacity: isSelected ? 1 : isHovered ? 0.7 : 0,
                  x: isSelected ? 0 : isHovered ? 0 : 10
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isSelected ? 'bg-blue-500' : 'bg-gray-400'
                )} />
                <ChevronRight className={cn(
                  'w-4 h-4',
                  isSelected ? 'text-blue-600' : 'text-gray-500'
                )} />
              </motion.div>
              
              {/* Sparkle Effect on Selection */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute top-2 right-2 z-10"
                  >
                    <motion.div
                      animate={{
                        rotate: 360,
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
                        scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                      }}
                      className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center"
                    >
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {/* Enhanced Selection Summary */}
      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-green-800">
                  Selected: {options.find(opt => opt.value === value)?.label}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Response recorded successfully
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Scale Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="mt-8 pt-6 border-t border-gray-200"
      >
        <div className="flex justify-center">
          <div className="text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
            Select the option that best matches your assessment
          </div>
        </div>
      </motion.div>
    </fieldset>
  );
}