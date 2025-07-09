'use client';

import { Input } from '@/components/ui/input';
import { QuestionValidation } from '@/lib/types';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  validation?: QuestionValidation;
  primaryColor: string;
}

export function NumberInput({ value, onChange, validation, primaryColor }: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      onChange(numValue);
    } else if (e.target.value === '') {
      onChange(0);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        type="number"
        value={value || ''}
        onChange={handleChange}
        placeholder="Enter a number..."
        className="w-full"
      />
      
      {validation && (
        <div className="text-sm text-gray-500">
          {validation.minLength && validation.maxLength && (
            <p>Enter a number between {validation.minLength} and {validation.maxLength}</p>
          )}
          {validation.minLength && !validation.maxLength && (
            <p>Enter a number greater than or equal to {validation.minLength}</p>
          )}
          {!validation.minLength && validation.maxLength && (
            <p>Enter a number less than or equal to {validation.maxLength}</p>
          )}
        </div>
      )}
    </div>
  );
}