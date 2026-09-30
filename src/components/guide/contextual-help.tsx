'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info, Sparkles, ExternalLink, X, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { useCRM } from '@/lib/store/crm-context';

export interface ContextualHelpProps {
  title?: string;
  description: string;
  tip?: string;
  moduleId?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'icon' | 'badge' | 'button';
  label?: string;
  placement?: 'top' | 'bottom' | 'auto';
  className?: string;
}

export function ContextualHelp({
  title,
  description,
  tip,
  moduleId,
  size = 'sm',
  variant = 'icon',
  label,
  placement = 'auto',
  className = '',
}: ContextualHelpProps) {
  const { language, isRTL, t } = useLanguage();
  const { openGuide } = useCRM();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const handleOpenFullGuide = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    openGuide(moduleId);
  };

  const sizeClasses = {
    xs: 'w-4 h-4 text-[10px]',
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
  }[size];

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-flex items-center align-middle font-urbanist ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Trigger element based on variant */}
      {variant === 'icon' && (
        <button
          type="button"
          onClick={toggleOpen}
          aria-label={title || (isRTL ? 'معلومات توضيحية' : 'Information')}
          aria-expanded={isOpen}
          className={`${sizeClasses} rounded-full flex items-center justify-center font-bold font-mono transition-all duration-200 cursor-pointer shadow-2xs select-none ${
            isOpen
              ? 'bg-[#8FC2F0] text-[#1E2328] scale-110 shadow-[0_0_12px_rgba(143,194,240,0.5)]'
              : 'bg-[#8FC2F0]/15 dark:bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] hover:bg-[#8FC2F0] hover:text-[#1E2328] hover:scale-105'
          }`}
          title={title || (isRTL ? 'اضغط للشرح' : 'Click for details')}
        >
          <span className="font-black italic">i</span>
        </button>
      )}

      {variant === 'badge' && (
        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={isOpen}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs ${
            isOpen
              ? 'bg-[#8FC2F0] text-[#1E2328]'
              : 'bg-[#8FC2F0]/15 dark:bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] hover:bg-[#8FC2F0]/25'
          }`}
        >
          <span className="w-3.5 h-3.5 rounded-full bg-[#8FC2F0]/30 flex items-center justify-center text-[10px] font-mono font-black italic">
            i
          </span>
          {label && <span>{label}</span>}
        </button>
      )}

      {variant === 'button' && (
        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={isOpen}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border ${
            isOpen
              ? 'bg-[#8FC2F0] text-[#1E2328] border-[#8FC2F0]'
              : 'bg-white dark:bg-[#292D32]/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#8FC2F0]'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-[#8FC2F0]/25 flex items-center justify-center text-[10px] font-mono font-black italic text-[#8FC2F0]">
            i
          </span>
          <span>{label || (isRTL ? 'شرح الميزة' : 'Feature Info')}</span>
        </button>
      )}

      {/* Popover Bubble */}
      {isOpen && (
        <div
          role="tooltip"
          className={`absolute z-50 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#1E2328] border border-slate-200 dark:border-[#8FC2F0]/20 shadow-2xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.65)] p-4 text-start animate-in fade-in zoom-in-95 duration-150 font-urbanist ${
            placement === 'top'
              ? 'bottom-full mb-2'
              : 'top-full mt-2'
          } ${
            isRTL ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          }`}
        >
          {/* Popover Header */}
          <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-md bg-[#8FC2F0]/20 text-[#8FC2F0] flex items-center justify-center text-xs font-mono font-black italic shrink-0">
                i
              </div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                {title || (isRTL ? 'معلومات توضيحية' : 'Feature Explanation')}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t('closeGuide')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Popover Body Description */}
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
            {description}
          </p>

          {/* Pro Tip Box if available */}
          {tip && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/25 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-snug text-amber-900 dark:text-amber-200">
                <span className="font-extrabold block mb-0.5">
                  {t('guideProTip')}:
                </span>
                <span className="font-medium">{tip}</span>
              </div>
            </div>
          )}

          {/* Footer Action to open full drawer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
              {isRTL ? 'المسبار العالمي للمقاولات' : 'Al-Mespar Global Contracting'}
            </span>
            <button
              type="button"
              onClick={handleOpenFullGuide}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8FC2F0] hover:underline cursor-pointer"
            >
              <span>{t('exploreFullGuide')}</span>
              <ExternalLink className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
