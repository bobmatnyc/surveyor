'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuestionValidation } from '@/lib/types';
import { CheckCircle, AlertCircle, Type, FileText, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  validation?: QuestionValidation;
  primaryColor: string;
  questionId?: string;
  questionText?: string;
}

export function TextInput({ value, onChange, validation, primaryColor, questionId, questionText }: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const isTextarea = validation?.maxLength && validation.maxLength > 100;
  const currentLength = value?.length || 0;
  const isValid = !validation?.minLength || currentLength >= validation.minLength;
  const isNearLimit = validation?.maxLength && currentLength >= validation.maxLength * 0.8;
  const showValidation = hasInteracted && validation?.minLength;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
    if (!hasInteracted) setHasInteracted(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setHasInteracted(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const inputId = questionId ? `text-input-${questionId}` : undefined;
  const labelId = questionId ? `label-${questionId}` : undefined;
  const descriptionId = questionId ? `description-${questionId}` : undefined;
  
  const commonProps = {
    id: inputId,
    value: value || '',
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    minLength: validation?.minLength,
    maxLength: validation?.maxLength,
    pattern: validation?.pattern,
    required: validation?.required,
    placeholder: 'Enter your response...',
    'aria-labelledby': labelId,
    'aria-describedby': descriptionId,
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Screen reader label */}
      {questionText && (
        <label htmlFor={inputId} id={labelId} className="sr-only">
          {questionText}
        </label>
      )}
      
      {/* Enhanced Input Header */}
      <motion.div
        className="flex items-center gap-2 mb-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {isTextarea ? (
          <FileText className="w-5 h-5 text-blue-600" />
        ) : (
          <Type className="w-5 h-5 text-blue-600" />
        )}
        <span className="text-sm font-medium text-gray-700">
          {isTextarea ? 'Detailed Response' : 'Your Response'}
        </span>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </motion.div>
        )}
      </motion.div>
      
      <motion.div 
        className="relative"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        {isTextarea ? (
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Textarea
              {...commonProps}
              rows={5}
              className={cn(
                'resize-none w-full p-4 border-2 rounded-xl transition-all duration-200 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500',
                isFocused 
                  ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg shadow-blue-100/50' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              )}
            />
            
            {/* Enhanced Focus Indicator */}
            <motion.div 
              className="absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-r from-blue-500/10 to-indigo-500/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: isFocused ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        ) : (
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Input 
              {...commonProps} 
              className={cn(
                'w-full h-14 px-4 border-2 rounded-xl transition-all duration-200 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500 text-lg',
                isFocused 
                  ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg shadow-blue-100/50' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              )}
            />
            
            {/* Enhanced Focus Indicator */}
            <motion.div 
              className="absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-r from-blue-500/10 to-indigo-500/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: isFocused ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
            
            {/* Typing indicator */}
            <AnimatePresence>
              {isFocused && currentLength > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0, x: 20 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Zap className="w-4 h-4 text-blue-500" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
      
      {/* Validation and input description */}
      <div id={descriptionId} className="sr-only">
        {validation?.required && 'This field is required. '}
        {validation?.minLength && `Minimum ${validation.minLength} characters required. `}
        {validation?.maxLength && `Maximum ${validation.maxLength} characters allowed.`}
      </div>
      
      {/* Enhanced Character count and validation */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          {/* Validation status */}
          <AnimatePresence>
            {showValidation && (
              <motion.div 
                className={cn(
                  'flex items-center gap-2 text-sm px-3 py-1 rounded-full',
                  isValid 
                    ? 'text-green-700 bg-green-50 border border-green-200' 
                    : 'text-red-700 bg-red-50 border border-red-200'
                )}
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </motion.div>
                <span>
                  {isValid ? 'Minimum length met' : `${validation.minLength! - currentLength} more characters needed`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Character count */}
        <AnimatePresence>
          {validation?.maxLength && currentLength > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <Badge 
                variant={currentLength >= validation.maxLength ? 'destructive' : isNearLimit ? 'secondary' : 'outline'}
                className="text-sm"
              >
                {currentLength} / {validation.maxLength}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Enhanced Progress bar for character count */}
      <AnimatePresence>
        {validation?.maxLength && currentLength > 0 && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            transition={{ duration: 0.3 }}
            className="origin-left"
          >
            <div className="relative">
              <Progress 
                value={Math.min((currentLength / validation.maxLength) * 100, 100)}
                className="w-full h-2"
              />
              <motion.div
                className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                style={{ width: `${Math.min((currentLength / validation.maxLength) * 100, 100)}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((currentLength / validation.maxLength) * 100, 100)}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced Validation messages */}
      <AnimatePresence>
        {showValidation && !isValid && currentLength > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Minimum {validation.minLength} characters required
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {validation?.pattern && value && !new RegExp(validation.pattern).test(value) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Please enter a valid format
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}