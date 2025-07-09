'use client';

import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BooleanInputProps {
  value: boolean;
  onChange: (value: boolean) => void;
  primaryColor: string;
}

export function BooleanInput({ value, onChange, primaryColor }: BooleanInputProps) {
  return (
    <div className="flex gap-4">
      <Button
        type="button"
        variant={value === true ? 'default' : 'outline'}
        size="lg"
        onClick={() => onChange(true)}
        className={cn(
          'flex-1 justify-center gap-2',
          value === true && 'bg-green-600 hover:bg-green-700'
        )}
      >
        <Check className="h-4 w-4" />
        Yes
      </Button>
      
      <Button
        type="button"
        variant={value === false ? 'default' : 'outline'}
        size="lg"
        onClick={() => onChange(false)}
        className={cn(
          'flex-1 justify-center gap-2',
          value === false && 'bg-red-600 hover:bg-red-700'
        )}
      >
        <X className="h-4 w-4" />
        No
      </Button>
    </div>
  );
}