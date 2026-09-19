import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ElementType;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon: Icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {Icon && (
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-2xl text-xs font-semibold font-urbanist transition-all',
            'bg-white dark:bg-[#141820]',
            'border border-slate-200/90 dark:border-slate-800',
            'text-slate-900 dark:text-white',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-transparent',
            Icon ? 'pl-10' : 'pl-4',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
