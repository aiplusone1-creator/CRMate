import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'success' | 'secondary' | 'outline' | 'ghost' | 'circle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  pill?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', pill = false, children, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none font-urbanist';

    const sizeClasses = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-xs px-4 py-2.5 gap-2',
      lg: 'text-sm px-5 py-3 gap-2.5',
      icon: 'w-9 h-9 p-0 shrink-0',
    }[size];

    const variantClasses = {
      primary:
        'bg-[#292D32] hover:bg-[#1A1E24] text-white shadow-xs dark:bg-[#8FC2F0] dark:text-[#141820] dark:hover:bg-[#7ab2e3]',
      accent:
        'bg-[#8FC2F0] hover:bg-[#7ab2e3] text-[#141820] shadow-xs',
      success:
        'bg-[#77CE69] hover:bg-[#68b85b] text-white shadow-xs',
      secondary:
        'bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-[#232A38] dark:hover:bg-[#2c3547] dark:text-slate-200',
      outline:
        'bg-white dark:bg-[#1C2130] border border-slate-200/90 dark:border-[#8FC2F0]/15 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#232A38]',
      ghost:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
      circle:
        'crm-circle-btn',
    }[variant];

    const roundedClass = variant === 'circle' ? 'rounded-full' : pill ? 'rounded-full' : 'rounded-2xl';

    return (
      <button
        ref={ref}
        className={cn(baseClasses, roundedClass, variantClasses, variant !== 'circle' && sizeClasses, className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
