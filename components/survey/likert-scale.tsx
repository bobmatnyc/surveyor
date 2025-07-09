'use client';

import { QuestionOption } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LikertScaleProps {
  options: QuestionOption[];
  value: any;
  onChange: (value: any) => void;
  primaryColor: string;
}

export function LikertScale({ options, value, onChange, primaryColor }: LikertScaleProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <div
          key={option.value}
          className={cn(
            'flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all hover:bg-gray-50',
            value === option.value
              ? 'border-blue-500 bg-blue-50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300'
          )}
          onClick={() => onChange(option.value)}
        >
          <div className="flex items-center">
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
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-700">{option.value}</span>
              <span className="text-gray-900">{option.label}</span>
            </div>
            {option.description && (
              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}