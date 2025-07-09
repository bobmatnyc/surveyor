'use client';

import { QuestionOption } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface MultipleChoiceProps {
  options: QuestionOption[];
  value: any;
  onChange: (value: any) => void;
  multiple: boolean;
  primaryColor: string;
}

export function MultipleChoice({ options, value, onChange, multiple, primaryColor }: MultipleChoiceProps) {
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
    <div className="space-y-3">
      {options.map((option) => (
        <div
          key={option.value}
          className={cn(
            'flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all hover:bg-gray-50',
            multiple
              ? (Array.isArray(value) && value.includes(option.value))
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
              : value === option.value
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
          )}
          onClick={() => multiple ? handleMultipleSelect(option.value) : handleSingleSelect(option.value)}
        >
          <div className="flex items-center">
            {multiple ? (
              <Checkbox
                checked={Array.isArray(value) && value.includes(option.value)}
                onChange={() => handleMultipleSelect(option.value)}
              />
            ) : (
              <div
                className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                  value === option.value
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300'
                )}
              >
                {value === option.value && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="text-gray-900">{option.label}</div>
            {option.description && (
              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}