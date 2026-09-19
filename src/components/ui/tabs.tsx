import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ElementType;
  badge?: React.ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs<T extends string>({
  items,
  activeTab,
  onChange,
  className,
  size = 'md',
}: TabsProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 p-1.5 rounded-full bg-slate-100/90 dark:bg-[#1C2130]/90 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md overflow-x-auto select-none',
        className
      )}
    >
      {items.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              'flex items-center gap-2 rounded-full font-bold transition-all duration-200 cursor-pointer font-urbanist whitespace-nowrap',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs',
              isActive
                ? 'bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] shadow-sm scale-[1.01]'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#232A38]'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{item.label}</span>
            {item.badge && <span className="ml-1 shrink-0">{item.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
