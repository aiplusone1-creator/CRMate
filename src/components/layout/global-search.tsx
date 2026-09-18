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

export function GlobalSearch() {
  const router = useRouter();
  const { projects, companies, contacts } = useCRM();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut (Ctrl+K or Cmd+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
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
    matchingProjects.forEach(p => items.push({ type: 'project', id: p.id, url: `/projects?search=${encodeURIComponent(p.pr_number)}` }));
    matchingCompanies.forEach(c => items.push({ type: 'company', id: c.id, url: `/companies?search=${encodeURIComponent(c.name)}` }));
    matchingContacts.forEach(c => items.push({ type: 'contact', id: c.id, url: `/contacts?search=${encodeURIComponent(c.full_name)}` }));
    return items;
  }, [matchingProjects, matchingCompanies, matchingContacts]);

  const totalResultsCount = matchingProjects.length + matchingCompanies.length + matchingContacts.length;

  const handleSelectResult = (url: string) => {
    setIsOpen(false);
    setQuery('');
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
        handleSelectResult(flatResults[selectedIndex].url);
      } else if (flatResults.length > 0) {
        handleSelectResult(flatResults[0].url);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-48 sm:w-64 md:w-72 lg:w-80">
      {/* Search Input Bar */}
      <div className="relative flex items-center group">
        <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#292D32] absolute left-3.5 pointer-events-none transition-colors" />
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
          placeholder="Search #PR, projects, clients, contacts... (بحث)"
          className="w-full pl-10 pr-16 py-2 text-xs bg-white/70 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]/40 focus:border-[#8FC2F0] focus:bg-white text-[#292D32] placeholder:text-slate-400 font-medium transition-all shadow-2xs font-urbanist"
        />

        {/* Right action inside input: Clear button or shortcut badge */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold text-slate-400 bg-slate-100/90 border border-slate-200/80 rounded-md shadow-2xs font-mono">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Floating Results Popover */}
      {isOpen && trimmedQuery.length > 0 && (
        <div className="absolute left-0 mt-2 w-full sm:w-[440px] md:w-[480px] bg-white/95 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header Summary */}
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 font-urbanist">
              {totalResultsCount} results found for &ldquo;<span className="text-[#292D32]">{query}</span>&rdquo;
            </span>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              Use <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded text-[9px]">↓</kbd> <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded text-[9px]">↑</kbd> to navigate
            </span>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
            {totalResultsCount === 0 ? (
              <div className="py-8 px-4 text-center">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 font-urbanist">لا توجد نتائج مطابقة</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  جرب البحث برقم المشروع مثل (PR1045)، اسم الشركة، أو اسم الشخص.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Projects Section */}
                {matchingProjects.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-urbanist">
                      <Briefcase className="w-3 h-3 text-[#8FC2F0]" />
                      Projects &amp; Deals ({matchingProjects.length})
                    </div>
                    <div className="space-y-1 mt-1">
                      {matchingProjects.map((p) => {
                        const stageInfo = PIPELINE_STAGES.find(s => s.value === p.pipeline_stage);
                        const isSelected = flatResults.findIndex(r => r.type === 'project' && r.id === p.id) === selectedIndex;

                        return (
                          <button
                            key={p.id}
                            onClick={() => handleSelectResult(`/projects?search=${encodeURIComponent(p.pr_number)}`)}
                            className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                              isSelected ? 'bg-blue-50/80 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#292D32] text-white font-mono">
                                  {p.pr_number}
                                </span>
                                <span className="text-xs font-bold text-[#292D32] truncate font-urbanist group-hover:text-blue-600 transition-colors">
                                  {p.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-medium">
                                <span className="truncate">{p.company_name || 'Client'}</span>
                                <span className="flex items-center gap-0.5 text-slate-400">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {p.location}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-bold text-[#292D32] font-mono">
                                {formatCurrencySAR(p.estimated_value)}
                              </div>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {stageInfo?.label || p.pipeline_stage}
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
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-urbanist">
                      <Building2 className="w-3 h-3 text-[#77CE69]" />
                      Companies &amp; Clients ({matchingCompanies.length})
                    </div>
                    <div className="space-y-1 mt-1">
                      {matchingCompanies.map((c) => {
                        const isSelected = flatResults.findIndex(r => r.type === 'company' && r.id === c.id) === selectedIndex;
                        const typeInfo = COMPANY_TYPES.find(t => t.value === c.company_type);

                        return (
                          <button
                            key={c.id}
                            onClick={() => handleSelectResult(`/companies?search=${encodeURIComponent(c.name)}`)}
                            className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                              isSelected ? 'bg-green-50/80 border border-green-200' : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <div className="text-xs font-bold text-[#292D32] truncate font-urbanist group-hover:text-[#292D32]">
                                {c.name}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                                <span>{typeInfo?.label || c.company_type}</span>
                                {c.city && <span>&bull; {c.city}</span>}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700 flex items-center gap-1">
                              عرض <ArrowRight className="w-3 h-3" />
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
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-urbanist">
                      <User className="w-3 h-3 text-purple-400" />
                      Key Contacts &amp; Decision Makers ({matchingContacts.length})
                    </div>
                    <div className="space-y-1 mt-1">
                      {matchingContacts.map((ct) => {
                        const isSelected = flatResults.findIndex(r => r.type === 'contact' && r.id === ct.id) === selectedIndex;
                        return (
                          <button
                            key={ct.id}
                            onClick={() => handleSelectResult(`/contacts?search=${encodeURIComponent(ct.full_name)}`)}
                            className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                              isSelected ? 'bg-purple-50/80 border border-purple-200' : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <div className="text-xs font-bold text-[#292D32] truncate font-urbanist">
                                {ct.full_name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                {ct.job_title ? `${ct.job_title} &bull; ` : ''}{ct.company_name || 'Contact'}
                              </div>
                            </div>
                            {ct.phone && (
                              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                                <Phone className="w-2.5 h-2.5" />
                                {ct.phone}
                              </div>
                            )}
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
            <div className="px-4 py-2 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-600">Enter</kbd> to view selection</span>
              <CornerDownLeft className="w-3 h-3 text-slate-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
