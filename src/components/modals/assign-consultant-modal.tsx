'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, 
  X, 
  Check, 
  Search, 
  Plus, 
  UserCheck, 
  Trash2, 
  MapPin, 
  Phone, 
  AlertCircle,
  Briefcase,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Project, Company } from '@/types/crm';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { SAUDI_LOCATIONS } from '@/lib/constants';

interface AssignConsultantModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (consultantId: string | null, consultantName: string | null) => void;
}

export function AssignConsultantModal({
  project,
  isOpen,
  onClose,
  onSuccess
}: AssignConsultantModalProps) {
  const { companies, addCompany, updateProject } = useCRM();
  const { isRTL } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // Selection & Search State
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fast Add Consultant State
  const [isFastAddOpen, setIsFastAddOpen] = useState(false);
  const [fastName, setFastName] = useState('');
  const [fastCity, setFastCity] = useState('Riyadh');
  const [fastPhone, setFastPhone] = useState('');
  const [fastNotes, setFastNotes] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state when project changes or modal opens
  useEffect(() => {
    if (isOpen && project) {
      setSelectedConsultantId(project.consultant_id || '');
      setSearchTerm('');
      setErrorMessage(null);
      setIsFastAddOpen(false);
      setFastName('');
      setFastCity(project.location || 'Riyadh');
      setFastPhone('');
      setFastNotes('');
    }
  }, [isOpen, project]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter ONLY consultant companies
  const consultantCompanies = useMemo(() => {
    return companies.filter(c => c.company_type === 'consultant');
  }, [companies]);

  // Filtered by search term
  const filteredConsultants = useMemo(() => {
    if (!searchTerm.trim()) return consultantCompanies;
    const term = searchTerm.toLowerCase();
    return consultantCompanies.filter(c => 
      c.name.toLowerCase().includes(term) ||
      (c.city && c.city.toLowerCase().includes(term))
    );
  }, [consultantCompanies, searchTerm]);

  if (!isOpen || !project || !mounted) return null;

  // Handle assigning an existing consultant
  const handleAssignExisting = async () => {
    if (!project) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const selectedComp = consultantCompanies.find(c => c.id === selectedConsultantId);
      const newConsultantId = selectedComp ? selectedComp.id : null;
      const newConsultantName = selectedComp ? selectedComp.name : null;

      await updateProject(project.id, {
        consultant_id: newConsultantId || undefined,
        consultant_name: newConsultantName || undefined
      });

      if (onSuccess) {
        onSuccess(newConsultantId, newConsultantName);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || (isRTL ? 'فشل تعيين الاستشاري للمشروع' : 'Failed to assign consultant'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle removing the assigned consultant
  const handleRemoveConsultant = async () => {
    if (!project) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await updateProject(project.id, {
        consultant_id: undefined,
        consultant_name: undefined
      });

      if (onSuccess) {
        onSuccess(null, null);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || (isRTL ? 'فشل إزالة الاستشاري' : 'Failed to remove consultant'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Fast Add Consultant & Assign
  const handleFastAddAndAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastName.trim() || !project) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create company strictly as consultant
      const newComp = await addCompany({
        name: fastName.trim(),
        normalized_name: fastName.trim().toLowerCase(),
        company_type: 'consultant',
        city: fastCity,
        phone: fastPhone.trim() || undefined,
        notes: fastNotes.trim() || undefined
      });

      // 2. Assign to this project immediately
      await updateProject(project.id, {
        consultant_id: newComp.id,
        consultant_name: newComp.name
      });

      if (onSuccess) {
        onSuccess(newComp.id, newComp.name);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || (isRTL ? 'فشل إضافة وتعيين الاستشاري' : 'Failed to create and assign consultant'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] ${isRTL ? 'font-cairo' : 'font-urbanist'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isRTL ? 'تعيين استشاري للمشروع' : 'Assign Project Consultant'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                <span className="font-bold text-blue-600 dark:text-blue-400">{project.pr_number}</span>
                <span>•</span>
                <span className="truncate max-w-[220px] font-sans font-medium text-slate-700 dark:text-slate-300">{project.name}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Consultant Status */}
          {project.consultant_name && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                    {isRTL ? 'الاستشاري المعين حالياً للمشروع:' : 'Currently Assigned Consultant:'}
                  </span>
                  <span className="text-xs font-black text-emerald-950 dark:text-emerald-100">
                    {project.consultant_name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveConsultant}
                disabled={isSubmitting}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-950/50 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title={isRTL ? 'إزالة الاستشاري من هذا المشروع' : 'Remove consultant from this project'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRTL ? 'إزالة' : 'Remove'}</span>
              </button>
            </div>
          )}

          {/* Existing Consultant Selection Form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{isRTL ? 'اختر من الشركات الاستشارية المسجلة لدينا:' : 'Select from Registered Consultant Companies:'}</span>
              </label>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                ({consultantCompanies.length} {isRTL ? 'استشاري' : 'consultants'})
              </span>
            </div>

            {/* Search Input for Consultants */}
            {consultantCompanies.length > 5 && (
              <div className="relative">
                <Search className={`w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={isRTL ? 'بحث في أسماء المكاتب الاستشارية...' : 'Search consultant names...'}
                  className={`w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>
            )}

            {/* Consultant Selection List / Dropdown */}
            {consultantCompanies.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1 bg-slate-50/50 dark:bg-slate-800/30">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {isRTL ? 'لا توجد شركات استشارية مسجلة حالياً في النظام' : 'No consultant companies registered in CRM yet'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isRTL ? 'استخدم زر الإضافة السريعة بالأسفل لإضافة مكتب استشاري وتعيينه فوراً' : 'Use the Fast Add button below to create and assign one instantly'}
                </p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/30">
                {filteredConsultants.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    {isRTL ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching consultants found'}
                  </div>
                ) : (
                  filteredConsultants.map(c => {
                    const isSelected = selectedConsultantId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedConsultantId(c.id)}
                        className={`w-full text-start p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs font-bold'
                            : 'hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                          <span className="truncate">{c.name}</span>
                          {c.city && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 font-medium ${
                              isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {c.city}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Save Existing Button */}
            {consultantCompanies.length > 0 && (
              <button
                type="button"
                onClick={handleAssignExisting}
                disabled={!selectedConsultantId || isSubmitting || selectedConsultantId === project.consultant_id}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isRTL ? 'تأكيد تعيين الاستشاري للمشروع' : 'Confirm Consultant Assignment'}</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              {isRTL ? 'أو' : 'OR'}
            </span>
          </div>

          {/* Fast Add Consultant Section */}
          <div className="rounded-2xl border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsFastAddOpen(!isFastAddOpen)}
              className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{isRTL ? 'إضافة استشاري جديد سريعاً (Fast Add Consultant)' : 'Fast Add New Consultant'}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFastAddOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFastAddOpen && (
              <form onSubmit={handleFastAddAndAssign} className="p-4 pt-1 space-y-3 border-t border-blue-100 dark:border-blue-900/40 animate-in fade-in duration-150">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isRTL ? 'اسم المكتب / الشركة الاستشارية *' : 'Consultant Office / Company Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fastName}
                    onChange={e => setFastName(e.target.value)}
                    placeholder={isRTL ? 'مثال: دار الهندسة، خطيب وعلمي، زهير فايز...' : 'e.g. Dar Al-Handasah, Khatib & Alami...'}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {isRTL ? 'المدينة' : 'City'}
                    </label>
                    <select
                      value={fastCity}
                      onChange={e => setFastCity(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-2.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      {SAUDI_LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {isRTL ? 'رقم الهاتف / الجوال' : 'Phone / Mobile'}
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={fastPhone}
                      onChange={e => setFastPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                      placeholder="9665xxxxxxxx"
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isRTL ? 'ملاحظات إضافية (اختياري)' : 'Notes (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={fastNotes}
                    onChange={e => setFastNotes(e.target.value)}
                    placeholder={isRTL ? 'المهندس المسؤول، البريد الإلكتروني أو التخصص...' : 'Lead consultant engineer, email, or discipline...'}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 px-3 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!fastName.trim() || isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'حفظ الاستشاري وتعيينه للمشروع فوراً' : 'Save & Assign Consultant Instantly'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isRTL ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
