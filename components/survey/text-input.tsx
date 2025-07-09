'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { QuestionValidation } from '@/lib/types';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  validation?: QuestionValidation;
  primaryColor: string;
}

export function TextInput({ value, onChange, validation, primaryColor }: TextInputProps) {
  const isTextarea = validation?.maxLength && validation.maxLength > 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const commonProps = {
    value: value || '',
    onChange: handleChange,
    minLength: validation?.minLength,
    maxLength: validation?.maxLength,
    pattern: validation?.pattern,
    required: validation?.required,
    placeholder: 'Enter your response...',
  };

  return (
    <div className="space-y-2">
      {isTextarea ? (
        <Textarea
          {...commonProps}
          rows={4}
          className="resize-none"
        />
      ) : (
        <Input {...commonProps} />
      )}
      
      {validation?.maxLength && (
        <div className="text-sm text-gray-500 text-right">
          {value?.length || 0} / {validation.maxLength} characters
        </div>
      )}
      
      {validation?.minLength && (!value || value.length < validation.minLength) && (
        <div className="text-sm text-red-600">
          Minimum {validation.minLength} characters required
        </div>
      )}
    </div>
  );
}