'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

export function LanguageToggle({ 
  className = '',
  compactOnMobile = true 
}: { 
  className?: string;
  compactOnMobile?: boolean;
}) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-[#8FC2F0]/20 bg-white/90 dark:bg-[#22272E]/90 hover:bg-white dark:hover:bg-[#292D32] text-xs font-bold text-[#292D32] dark:text-slate-100 shadow-2xs transition-all hover:border-[#8FC2F0] cursor-pointer font-urbanist shrink-0 ${className}`}
      title={language === 'ar' ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
      aria-label="Toggle language"
    >
      <Languages className="w-3.5 h-3.5 text-[#8FC2F0] shrink-0" />
      <span className={compactOnMobile ? "hidden sm:inline" : ""}>
        {language === 'ar' ? 'English' : 'العربية'}
      </span>
      <span className={compactOnMobile ? "sm:hidden font-mono text-[11px] font-black text-[#8FC2F0]" : "hidden"}>
        {language === 'ar' ? 'EN' : 'عربي'}
      </span>
    </button>
  );
}
