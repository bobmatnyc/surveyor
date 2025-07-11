'use client';

import { QuestionOption } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Check, Plus, Minus, ChevronRight } from 'lucide-react';

interface MultipleChoiceProps {
  options: QuestionOption[];
  value: any;
  onChange: (value: any) => void;
  multiple: boolean;
  primaryColor: string;
}

// Enhanced animation variants for multiple choice options
const optionVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  hover: {
    scale: 1.02,
    y: -3,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  selected: {
    scale: 1.03,
    y: -4,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const checkboxVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
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

export function MultipleChoice({ options, value, onChange, multiple, primaryColor }: MultipleChoiceProps) {
  const [hoveredOption, setHoveredOption] = useState<string | number | null>(null);

  const handleSingleSelect = (selectedValue: any) => {
    onChange(selectedValue);
  };

  const handleMultipleSelect = (selectedValue: any) => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.includes(selectedValue)
      ? currentValues.filter(v => v !== selectedValue)
      : [...currentValues, selectedValue];
    onChange(newValues);
  };

  return (
    <fieldset className="space-y-5">
      <legend className="sr-only">
        {multiple ? 'Select multiple options' : 'Select one option'}
      </legend>
      
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="text-center mb-6"
      >
        <div className="text-sm font-medium text-gray-600 bg-gray-50 px-4 py-2 rounded-full inline-block">
          {multiple 
            ? 'Select all that apply' 
            : 'Choose one option'
          }
        </div>
      </motion.div>

      <AnimatePresence>
        {options.map((option, index) => {
          const isSelected = multiple 
            ? Array.isArray(value) && value.includes(option.value)
            : value === option.value;
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
                  ? multiple
                    ? 'border-green-500 from-green-50 via-emerald-50 to-green-50 shadow-xl ring-2 ring-green-200/50 shadow-green-200/20'
                    : 'border-blue-500 from-blue-50 via-indigo-50 to-blue-50 shadow-xl ring-2 ring-blue-200/50 shadow-blue-200/20'
                  : 'border-gray-200 from-white to-gray-50/30 hover:border-gray-400 hover:from-gray-50/50 hover:to-gray-100/30 hover:shadow-lg hover:shadow-gray-100/20'
              )}
              onClick={() => multiple ? handleMultipleSelect(option.value) : handleSingleSelect(option.value)}
              onMouseEnter={() => setHoveredOption(option.value)}
              onMouseLeave={() => setHoveredOption(null)}
              role={multiple ? 'checkbox' : 'radio'}
              tabIndex={0}
              aria-checked={isSelected}
              aria-describedby={option.description ? `option-${option.value}-desc` : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  multiple ? handleMultipleSelect(option.value) : handleSingleSelect(option.value);
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
                className={cn(
                  'absolute inset-0 rounded-2xl',
                  multiple
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                )}
              />
              
              {/* Selection Indicator */}
              <div className="flex items-center mr-6 z-10">
                {multiple ? (
                  <div className="relative">
                    <motion.div
                      className={cn(
                        'w-7 h-7 rounded-lg border-2 flex items-center justify-center relative',
                        'shadow-lg transition-all duration-200',
                        isSelected
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 shadow-green-300'
                          : 'bg-white border-gray-300 group-hover:border-green-400 group-hover:shadow-green-200'
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
                    </motion.div>
                    
                    {/* Pulse ring for multiple selection */}
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
                          className="absolute inset-0 rounded-lg bg-green-400"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
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
                    
                    {/* Pulse ring for single selection */}
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
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 z-10 min-w-0">
                <motion.div className={cn(
                  'text-lg font-semibold mb-3 transition-all duration-200 leading-relaxed',
                  isSelected 
                    ? multiple 
                      ? 'text-green-900' 
                      : 'text-blue-900'
                    : 'text-gray-900'
                )}>
                  {option.label}
                </motion.div>
                {option.description && (
                  <motion.p 
                    id={`option-${option.value}-desc`}
                    className={cn(
                      'text-sm leading-relaxed transition-all duration-200 mt-2',
                      isSelected 
                        ? multiple 
                          ? 'text-green-700' 
                          : 'text-blue-700'
                        : 'text-gray-600'
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
                  isSelected 
                    ? multiple ? 'bg-green-500' : 'bg-blue-500'
                    : 'bg-gray-400'
                )} />
                <ChevronRight className={cn(
                  'w-4 h-4',
                  isSelected 
                    ? multiple ? 'text-green-600' : 'text-blue-600'
                    : 'text-gray-500'
                )} />
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {/* Enhanced Selection Summary */}
      {multiple && Array.isArray(value) && value.length > 0 && (
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
                {value.length} {value.length === 1 ? 'option' : 'options'} selected
              </div>
              <div className="text-xs text-green-600 mt-1">
                {value.length > 1 ? 'Multiple selections recorded' : 'Selection recorded'}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </fieldset>
  );
}