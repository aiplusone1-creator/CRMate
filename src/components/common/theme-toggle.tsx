'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n/language-context';

interface ThemeToggleProps {
  className?: string;
  variant?: 'pill' | 'icon';
}

export function ThemeToggle({ className = '', variant = 'pill' }: ThemeToggleProps) {
  const { toggleTheme, isDark } = useTheme();
  const { isRTL } = useLanguage();

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative p-2 rounded-xl border transition-all duration-300 cursor-pointer ${
          isDark
            ? 'bg-[#22272E]/90 text-[#8FC2F0] border-[#8FC2F0]/20 hover:bg-[#292D32] hover:border-[#8FC2F0]/40 shadow-[0_0_10px_rgba(143,194,240,0.12)]'
            : 'bg-white/90 text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-[#292D32] shadow-2xs'
        } ${className}`}
        title={isDark
          ? (isRTL ? 'التبديل إلى الوضع النهاري' : 'Switch to Light Mode')
          : (isRTL ? 'التبديل إلى الوضع الليلي' : 'Switch to Dark Mode')}
        aria-label="Toggle theme"
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          {isDark ? (
            <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12" />
          )}
        </div>
      </button>
    );
  }

  // Pill variant
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer backdrop-blur-md select-none ${
        isDark
          ? 'bg-[#22272E]/90 text-slate-200 border-[#8FC2F0]/15 hover:border-[#8FC2F0]/30 shadow-[0_2px_10px_rgba(0,0,0,0.3)]'
          : 'bg-white/90 text-[#292D32] border-white/90 hover:border-slate-200 shadow-2xs'
      } ${className}`}
      title={isDark
        ? (isRTL ? 'التبديل إلى الوضع النهاري' : 'Switch to Light Mode')
        : (isRTL ? 'التبديل إلى الوضع الليلي' : 'Switch to Dark Mode')}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
        isDark ? 'bg-[#8FC2F0]/15 text-[#8FC2F0]' : 'bg-slate-100 text-slate-600'
      }`}>
        {isDark ? (
          <Sun className="w-3.5 h-3.5 animate-in spin-in-180 duration-300" />
        ) : (
          <Moon className="w-3.5 h-3.5 animate-in spin-in-180 duration-300" />
        )}
      </div>

      <span className="text-xs font-bold font-urbanist tracking-wide">
        {isDark ? (isRTL ? 'ليلي' : 'Dark') : (isRTL ? 'نهاري' : 'Light')}
      </span>
    </button>
  );
}
