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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Yes Button */}
        <div
          className={cn(
            'relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg',
            value === true
              ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg ring-2 ring-green-200/50 transform scale-[1.02]'
              : 'border-gray-200 hover:border-green-300 hover:bg-green-50/30 hover:shadow-md'
          )}
          onClick={() => onChange(true)}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200',
              value === true
                ? 'bg-green-500 shadow-lg'
                : 'bg-gray-100 group-hover:bg-green-100'
            )}>
              <Check className={cn(
                'h-8 w-8 transition-all duration-200',
                value === true ? 'text-white' : 'text-gray-400'
              )} />
            </div>
            <div className="space-y-1">
              <h3 className={cn(
                'text-xl font-semibold transition-all duration-200',
                value === true ? 'text-green-900' : 'text-gray-900'
              )}>
                Yes
              </h3>
              <p className={cn(
                'text-sm transition-all duration-200',
                value === true ? 'text-green-700' : 'text-gray-600'
              )}>
                I agree or confirm
              </p>
            </div>
          </div>
          
          {/* Selection indicator */}
          {value === true && (
            <div className="absolute top-3 right-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* No Button */}
        <div
          className={cn(
            'relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg',
            value === false
              ? 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg ring-2 ring-red-200/50 transform scale-[1.02]'
              : 'border-gray-200 hover:border-red-300 hover:bg-red-50/30 hover:shadow-md'
          )}
          onClick={() => onChange(false)}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200',
              value === false
                ? 'bg-red-500 shadow-lg'
                : 'bg-gray-100 group-hover:bg-red-100'
            )}>
              <X className={cn(
                'h-8 w-8 transition-all duration-200',
                value === false ? 'text-white' : 'text-gray-400'
              )} />
            </div>
            <div className="space-y-1">
              <h3 className={cn(
                'text-xl font-semibold transition-all duration-200',
                value === false ? 'text-red-900' : 'text-gray-900'
              )}>
                No
              </h3>
              <p className={cn(
                'text-sm transition-all duration-200',
                value === false ? 'text-red-700' : 'text-gray-600'
              )}>
                I disagree or deny
              </p>
            </div>
          </div>
          
          {/* Selection indicator */}
          {value === false && (
            <div className="absolute top-3 right-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </div>
      
      {/* Selection feedback */}
      {value !== undefined && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className={cn(
            'flex items-center gap-2 text-sm px-4 py-2 rounded-lg',
            value === true
              ? 'text-green-700 bg-green-50'
              : 'text-red-700 bg-red-50'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              value === true ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span>
              You selected: <strong>{value === true ? 'Yes' : 'No'}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}