import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-xs',
  }[size];

  const variantClasses = {
    default:
      'bg-[#292D32] text-white dark:bg-[#8FC2F0] dark:text-[#141820]',
    primary:
      'bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] border border-[#8FC2F0]/40 dark:border-[#8FC2F0]/25',
    success:
      'bg-[#77CE69]/15 text-[#216817] dark:text-[#77CE69] border border-[#77CE69]/30 dark:border-[#77CE69]/20',
    warning:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60',
    danger:
      'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60',
    neutral:
      'bg-slate-100 dark:bg-[#232A38] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700',
    outline:
      'bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
  }[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-bold font-urbanist tracking-tight whitespace-nowrap transition-colors',
        sizeClasses,
        variantClasses,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
