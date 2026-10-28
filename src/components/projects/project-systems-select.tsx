'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Search, X, Layers, Sparkles } from 'lucide-react';
import { PROJECT_SYSTEMS } from '@/lib/constants';
import { useLanguage } from '@/lib/i18n/language-context';

export interface ProjectSystemsMultiSelectProps {
  selectedSystems: string[];
  onChange: (systems: string[]) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function ProjectSystemsMultiSelect({
  selectedSystems = [],
  onChange,
  placeholder,
  className = '',
  compact = false
}: ProjectSystemsMultiSelectProps) {
  const { isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredSystems = useMemo(() => {
    if (!searchQuery.trim()) return PROJECT_SYSTEMS;
    const q = searchQuery.toLowerCase().trim();
    return PROJECT_SYSTEMS.filter(sys => sys.toLowerCase().includes(q));
  }, [searchQuery]);

  const toggleSystem = (sys: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedSystems.includes(sys)) {
      onChange(selectedSystems.filter(s => s !== sys));
    } else {
      onChange([...selectedSystems, sys]);
    }
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([...PROJECT_SYSTEMS]);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const defaultPlaceholder = isRTL 
    ? 'اختر أنظمة المشروع (21 نظام متاح)...' 
    : 'Select Project Systems (21 systems available)...';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      {compact ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C2130] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-[#8FC2F0]" />
          <span>
            {selectedSystems.length > 0 
              ? (isRTL ? `تعديل الأنظمة (${selectedSystems.length})` : `Edit Systems (${selectedSystems.length})`)
              : (isRTL ? '+ تحديد أنظمة المشروع' : '+ Select Systems')}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`min-h-[42px] w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 ${
            isOpen 
              ? 'border-blue-500 ring-2 ring-blue-500/20' 
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {selectedSystems.length === 0 ? (
              <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                {placeholder || defaultPlaceholder}
              </span>
            ) : (
              selectedSystems.map(sys => (
                <span
                  key={sys}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{sys}</span>
                  <button
                    type="button"
                    onClick={(e) => toggleSystem(sys, e)}
                    className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-900 rounded text-blue-600 dark:text-blue-400 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      )}

      {/* Multi-Select Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute z-50 mt-1.5 w-full min-w-[280px] sm:min-w-[340px] max-w-[420px] bg-white dark:bg-[#1C2130] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/80 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150 ${
            isRTL ? 'right-0' : 'left-0'
          }`}
        >
          {/* Search Input */}
          <div className="relative">
            <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-2.5' : 'left-2.5'}`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'بحث في الأنظمة الـ 21...' : 'Filter 21 systems...'}
              className={`w-full py-1.5 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'
              }`}
            />
          </div>

          {/* Quick Select & Counter Header */}
          <div className="px-1 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
            <span className="flex items-center gap-1">
              <span>{isRTL ? 'تم اختيار:' : 'Selected:'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold font-mono text-[10px]">
                {selectedSystems.length} / {PROJECT_SYSTEMS.length}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {isRTL ? 'تحديد الكل' : 'Select All'}
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                {isRTL ? 'إلغاء الكل' : 'Clear'}
              </button>
            </div>
          </div>

          {/* Scrollable Systems List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-thin">
            {filteredSystems.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {isRTL ? 'لا توجد أنظمة مطابقة للبحث' : 'No matching systems'}
              </div>
            ) : (
              filteredSystems.map(sys => {
                const isSelected = selectedSystems.includes(sys);
                return (
                  <div
                    key={sys}
                    onClick={(e) => toggleSystem(sys, e)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div 
                      className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-2xs' 
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#141820]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="flex-1 font-urbanist">{sys}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Done Button */}
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isRTL ? 'تم' : 'Done'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
