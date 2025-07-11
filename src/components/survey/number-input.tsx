'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuestionValidation } from '@/lib/types';
import { Minus, Plus, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  validation?: QuestionValidation;
  primaryColor: string;
  questionId?: string;
  questionText?: string;
}

export function NumberInput({ value, onChange, validation, primaryColor, questionId, questionText }: NumberInputProps) {
  const numValue = value || 0;
  const minValue = validation?.minLength || 0;
  const maxValue = validation?.maxLength || 100;
  const isValid = numValue >= minValue && numValue <= maxValue;
  const isNearMax = maxValue && numValue >= maxValue * 0.8;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onChange(0);
      return;
    }
    
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  const handleIncrement = () => {
    const newValue = numValue + 1;
    if (!maxValue || newValue <= maxValue) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = numValue - 1;
    if (newValue >= minValue) {
      onChange(newValue);
    }
  };

  const inputId = questionId ? `number-input-${questionId}` : undefined;
  const labelId = questionId ? `label-${questionId}` : undefined;
  const descriptionId = questionId ? `description-${questionId}` : undefined;

  return (
    <div className="space-y-4">
      {/* Screen reader label */}
      {questionText && (
        <label htmlFor={inputId} id={labelId} className="sr-only">
          {questionText}
        </label>
      )}
      
      <div className="relative">
        <div className="flex items-center">
          {/* Decrement button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={numValue <= minValue}
            className="w-12 h-14 rounded-l-xl rounded-r-none border-r-0"
            aria-label="Decrease number"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          {/* Number input */}
          <Input
            id={inputId}
            type="number"
            value={numValue}
            onChange={handleChange}
            placeholder="Enter a number..."
            className="h-14 border-2 border-l-0 border-r-0 border-gray-200 rounded-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900 text-lg text-center font-semibold"
            min={minValue}
            max={maxValue}
            aria-labelledby={labelId}
            aria-describedby={descriptionId}
          />
          
          {/* Increment button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            disabled={maxValue ? numValue >= maxValue : false}
            className="w-12 h-14 rounded-r-xl rounded-l-none border-l-0"
            aria-label="Increase number"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Focus indicator */}
        <div className="absolute inset-0 rounded-xl pointer-events-none transition-all duration-200 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 focus-within:opacity-100" />
      </div>
      
      {/* Description for screen readers */}
      <div id={descriptionId} className="sr-only">
        Number input. Range: {minValue} to {maxValue}. Use arrow keys or plus/minus buttons to adjust.
      </div>
      
      {/* Value indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 w-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${
            isValid ? 'text-green-600' : 'text-red-600'
          }`}>
            {isValid ? 'Valid range' : 'Out of range'}
          </span>
        </div>
        
        <Badge variant="outline" className="text-sm">
          Current: {numValue}
        </Badge>
      </div>
      
      {/* Range indicator */}
      {validation && (maxValue || minValue) && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Min: {minValue}</span>
            <span>Max: {maxValue}</span>
          </div>
          <Progress 
            value={Math.min(Math.max(((numValue - minValue) / (maxValue - minValue)) * 100, 0), 100)}
            className="w-full h-2"
          />
        </div>
      )}
      
      {/* Validation messages */}
      {validation && (
        <div className="space-y-2">
          {validation.minLength && validation.maxLength && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Enter a number between {validation.minLength} and {validation.maxLength}
              </AlertDescription>
            </Alert>
          )}
          {validation.minLength && !validation.maxLength && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Enter a number greater than or equal to {validation.minLength}
              </AlertDescription>
            </Alert>
          )}
          {!validation.minLength && validation.maxLength && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Enter a number less than or equal to {validation.maxLength}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      {/* Error message */}
      {!isValid && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Please enter a number within the valid range
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}