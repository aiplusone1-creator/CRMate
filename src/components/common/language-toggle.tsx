'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-white text-xs font-bold text-[#292D32] shadow-2xs transition-all hover:border-[#8FC2F0] cursor-pointer font-urbanist ${className}`}
      title={language === 'ar' ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
    >
      <Languages className="w-3.5 h-3.5 text-[#8FC2F0]" />
      <span>{language === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
}
