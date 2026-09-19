'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  Briefcase, 
  Building2, 
  User, 
  ArrowRight, 
  MapPin, 
  Phone,
  CornerDownLeft
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { formatCurrencySAR } from '@/lib/utils';
import { PIPELINE_STAGES, COMPANY_TYPES } from '@/lib/constants';
import { useLanguage } from '@/lib/i18n/language-context';

export function GlobalSearch() {
  const router = useRouter();
  const { projects, companies, contacts } = useCRM();
  const { language, isRTL } = useLanguage();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcuts: '/' or Ctrl+K / Cmd+K to instantly focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputActive = 
        target instanceof HTMLInputElement || 
        target instanceof HTMLTextAreaElement || 
        target instanceof HTMLSelectElement || 
        target?.isContentEditable;

      // Press '/' to jump to search (when not already typing in an input)
      if (e.key === '/' && !isInputActive && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
        return;
      }

      // Also support Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
        return;
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Results
  const trimmedQuery = query.trim().toLowerCase();

  const matchingProjects = useMemo(() => {
    if (!trimmedQuery) return [];
    return projects.filter(p => 
      p.name.toLowerCase().includes(trimmedQuery) ||
      p.pr_number.toLowerCase().includes(trimmedQuery) ||
      (p.company_name && p.company_name.toLowerCase().includes(trimmedQuery)) ||
      p.location.toLowerCase().includes(trimmedQuery) ||
      (p.internal_notes && p.internal_notes.toLowerCase().includes(trimmedQuery)) ||
      (p.next_action && p.next_action.toLowerCase().includes(trimmedQuery))
    ).slice(0, 5);
  }, [projects, trimmedQuery]);

  const matchingCompanies = useMemo(() => {
    if (!trimmedQuery) return [];
    return companies.filter(c => 
      c.name.toLowerCase().includes(trimmedQuery) ||
      (c.city && c.city.toLowerCase().includes(trimmedQuery)) ||
      (c.company_type && c.company_type.toLowerCase().includes(trimmedQuery))
    ).slice(0, 4);
  }, [companies, trimmedQuery]);

  const matchingContacts = useMemo(() => {
    if (!trimmedQuery) return [];
    return contacts.filter(c => 
      c.full_name.toLowerCase().includes(trimmedQuery) ||
      (c.job_title && c.job_title.toLowerCase().includes(trimmedQuery)) ||
      (c.company_name && c.company_name.toLowerCase().includes(trimmedQuery)) ||
      (c.phone && c.phone.toLowerCase().includes(trimmedQuery)) ||
      (c.email && c.email.toLowerCase().includes(trimmedQuery))
    ).slice(0, 4);
  }, [contacts, trimmedQuery]);

  // Combine results into a flat list for keyboard navigation
  const flatResults = useMemo(() => {
    const items: Array<{ type: 'project' | 'company' | 'contact'; id: string; url: string }> = [];
    matchingProjects.forEach(p => items.push({ type: 'project', id: p.id, url: `/projects/${p.id}` }));
    matchingCompanies.forEach(c => items.push({ type: 'company', id: c.id, url: `/companies?id=${c.id}` }));
    matchingContacts.forEach(c => items.push({ type: 'contact', id: c.id, url: `/contacts?id=${c.id}` }));
    return items;
  }, [matchingProjects, matchingCompanies, matchingContacts]);

  const totalResultsCount = matchingProjects.length + matchingCompanies.length + matchingContacts.length;

  const handleSelectResult = (url: string, type?: 'project' | 'company' | 'contact', id?: string) => {
    setIsOpen(false);
    setQuery('');
    if (type === 'company' && id && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crm:open-company', { detail: { id } }));
    } else if (type === 'contact' && id && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crm:open-contact', { detail: { id } }));
    }
    router.push(url);
  };

  // Keyboard navigation through search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
        const item = flatResults[selectedIndex];
        handleSelectResult(item.url, item.type, item.id);
      } else if (flatResults.length > 0) {
        const item = flatResults[0];
        handleSelectResult(item.url, item.type, item.id);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-48 sm:w-64 md:w-72 lg:w-80">
      {/* Search Input Bar */}
      <div className="relative flex items-center group">
        <Search className={`w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-[#292D32] dark:group-focus-within:text-[#8FC2F0] absolute ${isRTL ? 'right-3.5' : 'left-3.5'} pointer-events-none transition-colors`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isRTL ? 'بحث في المشاريع، الشركات، العملاء...' : 'Search #PR, projects, clients, contacts...'}
          className={`w-full ${isRTL ? 'pr-10 pl-16 text-right' : 'pl-10 pr-16 text-left'} py-2 text-xs bg-white/70 dark:bg-[#141820]/75 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]/40 focus:border-[#8FC2F0] focus:bg-white dark:focus:bg-[#141820] text-[#292D32] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium transition-all shadow-2xs font-urbanist`}
        />

        {/* Action inside input: Clear button or shortcut badge */}
        <div className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} flex items-center gap-1`}>
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd 
              onClick={() => { inputRef.current?.focus(); setIsOpen(true); }}
              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-md shadow-2xs font-mono cursor-pointer hover:border-[#8FC2F0] hover:text-[#8FC2F0] transition-colors"
              title={isRTL ? "اضغط / للبحث المباشر" : "Press / to search"}
            >
              <span>/</span>
            </kbd>
          )}
        </div>
      </div>

      {/* Floating Results Popover */}
      {isOpen && trimmedQuery.length > 0 && (
        <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} mt-2 w-full sm:w-[440px] md:w-[480px] bg-white/95 dark:bg-[#1C2130]/95 backdrop-blur-2xl border border-white/80 dark:border-[#8FC2F0]/15 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}>
          {/* Header Summary */}
          <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-[#232A38]/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-urbanist">
              {isRTL ? (
                <>تم العثور على {totalResultsCount} نتيجة لـ &ldquo;<span className="text-[#292D32] dark:text-white font-bold">{query}</span>&rdquo;</>
              ) : (
                <>{totalResultsCount} results found for &ldquo;<span className="text-[#292D32] dark:text-white font-bold">{query}</span>&rdquo;</>
              )}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
              {isRTL ? 'استخدم الأسهم للتنقل' : 'Use ↓ ↑ to navigate'}
            </span>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
            {totalResultsCount === 0 ? (
              <div className="py-8 px-4 text-center">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-white font-urbanist">
                  {isRTL ? 'لا توجد نتائج مطابقة' : 'No matching results found'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                  {isRTL
                    ? 'جرب البحث برقم المشروع مثل (PR1045)، اسم الشركة، أو اسم الشخص.'
                    : 'Try searching by PR number (e.g. PR1045), company name, or contact person.'}
                </p>
              </div>
            ) : (
              <>
                {/* 1. Projects Section */}
                {matchingProjects.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-urbanist">
                      <Briefcase className="w-3 h-3 text-[#8FC2F0]" />
                      <span>{isRTL ? 'المشاريع والفرص' : 'Projects & Deals'} ({matchingProjects.length})</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {matchingProjects.map((p) => {
                        const stageInfo = PIPELINE_STAGES.find(s => s.value === p.pipeline_stage);
                        const isSelected = flatResults.findIndex(r => r.type === 'project' && r.id === p.id) === selectedIndex;

                        return (
                          <button
                            key={p.id}
                            onClick={() => handleSelectResult(`/projects/${p.id}`, 'project', p.id)}
                            className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                              isSelected 
                                ? 'bg-blue-50/80 dark:bg-[#8FC2F0]/15 border border-blue-200 dark:border-[#8FC2F0]/30' 
                                : 'hover:bg-slate-50 dark:hover:bg-[#232A38]/60 border border-transparent'
                            }`}
                          >
                            <div className={`min-w-0 flex-1 ${isRTL ? 'pl-3' : 'pr-3'}`}>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] font-mono">
                                  {p.pr_number}
                                </span>
                                <span className="text-xs font-bold text-[#292D32] dark:text-white truncate font-urbanist group-hover:text-blue-600 dark:group-hover:text-[#8FC2F0] transition-colors">
                                  {p.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                <span className="truncate">{p.company_name || (isRTL ? 'عميل' : 'Client')}</span>
                                <span className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {p.location}
                                </span>
                              </div>
                            </div>
                            <div className={`${isRTL ? 'text-left' : 'text-right'} shrink-0`}>
                              <div className="text-xs font-bold text-[#292D32] dark:text-white font-mono">
                                {formatCurrencySAR(p.estimated_value)}
                              </div>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#232A38] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                                {isRTL ? (stageInfo?.labelAr || stageInfo?.label) : (stageInfo?.label || p.pipeline_stage)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Companies Section */}
                {matchingCompanies.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-urbanist">
                      <Building2 className="w-3 h-3 text-[#77CE69]" />
                      <span>{isRTL ? 'الشركات والعملاء' : 'Companies & Clients'} ({matchingCompanies.length})</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {matchingCompanies.map((c) => {
                        const isSelected = flatResults.findIndex(r => r.type === 'company' && r.id === c.id) === selectedIndex;
                        const typeInfo = COMPANY_TYPES.find(t => t.value === c.company_type);

                        return (
                          <button
                            key={c.id}
                            onClick={() => handleSelectResult(`/companies?id=${c.id}`, 'company', c.id)}
                            className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                              isSelected 
                                ? 'bg-green-50/80 dark:bg-[#77CE69]/15 border border-green-200 dark:border-[#77CE69]/30' 
                                : 'hover:bg-slate-50 dark:hover:bg-[#232A38]/60 border border-transparent'
                            }`}
                          >
                            <div className={`min-w-0 flex-1 ${isRTL ? 'pl-3' : 'pr-3'}`}>
                              <div className="text-xs font-bold text-[#292D32] dark:text-white truncate font-urbanist group-hover:text-emerald-600 dark:group-hover:text-[#77CE69]">
                                {c.name}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                <span>{typeInfo?.label || c.company_type}</span>
                                {c.city && <span>&bull; {c.city}</span>}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-[#77CE69] flex items-center gap-1">
                              {isRTL ? 'عرض الكارت' : 'View Card'} <ArrowRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Contacts Section */}
                {matchingContacts.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-urbanist">
                      <User className="w-3 h-3 text-purple-400" />
                      <span>{isRTL ? 'جهات الاتصال وصناع القرار' : 'Key Contacts & Decision Makers'} ({matchingContacts.length})</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {matchingContacts.map((ct) => {
                        const isSelected = flatResults.findIndex(r => r.type === 'contact' && r.id === ct.id) === selectedIndex;
                        return (
                          <button
                            key={ct.id}
                            onClick={() => handleSelectResult(`/contacts?id=${ct.id}`, 'contact', ct.id)}
                            className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                              isSelected 
                                ? 'bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40' 
                                : 'hover:bg-slate-50 dark:hover:bg-[#232A38]/60 border border-transparent'
                            }`}
                          >
                            <div className={`min-w-0 flex-1 ${isRTL ? 'pl-3' : 'pr-3'}`}>
                              <div className="text-xs font-bold text-[#292D32] dark:text-white truncate font-urbanist">
                                {ct.full_name}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {ct.job_title ? `${ct.job_title} &bull; ` : ''}{ct.company_name || (isRTL ? 'جهة اتصال' : 'Contact')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {ct.phone && (
                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  {ct.phone}
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 flex items-center gap-0.5">
                                <ArrowRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer quick action */}
          {totalResultsCount > 0 && (
            <div className="px-4 py-2 bg-slate-50/90 dark:bg-[#232A38]/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400">
              <span>{isRTL ? 'اضغط Enter للعرض المباشر' : 'Press Enter to view selection'}</span>
              <CornerDownLeft className="w-3 h-3 text-slate-400 dark:text-slate-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
