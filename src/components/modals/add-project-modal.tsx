'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Factory, Plus, Sparkles, FolderKanban, Layers, FileCheck, ShieldCheck, Tag, Target, UserCheck, AlertCircle, Lock, User, Calendar, Check, Star, Users } from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { SAUDI_LOCATIONS, PIPELINE_STAGES, OPPORTUNITY_TYPES, PROJECT_INDUSTRIES } from '@/lib/constants';
import { PipelineStage, OpportunityType, ProjectPriority, RFQPackage, SubmittalStatus, Project, CompanyType, ProjectIndustry } from '@/types/crm';
import { useLanguage } from '@/lib/i18n/language-context';
import { ProjectSystemsMultiSelect } from '@/components/projects/project-systems-select';
import { cn, formatDateString } from '@/lib/utils';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCompanyId?: string;
}

export function AddProjectModal({ isOpen, onClose, defaultCompanyId }: AddProjectModalProps) {
  const { isRTL } = useLanguage();
  const { projects, companies, contacts, addProject, addCompany, addContact, currentUser, teamMembers, referProject } = useCRM();

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin';
  const salesReps = teamMembers.filter(m => m.role === 'sales_engineer' || (m.role as string) === 'sales_rep');

  const [prNumber, setPrNumber] = useState('');
  const [name, setName] = useState('');
  const [createdAtDate, setCreatedAtDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [companyId, setCompanyId] = useState(defaultCompanyId || companies[0]?.id || '');
  const [assignedUserId, setAssignedUserId] = useState<string>(currentUser.id);

  React.useEffect(() => {
    if (defaultCompanyId) {
      setCompanyId(defaultCompanyId);
    } else if (companies[0]?.id && !companyId) {
      setCompanyId(companies[0]?.id);
    }
  }, [defaultCompanyId, companies, isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      setAssignedUserId(currentUser.id);
      setShowSuggestions(false);
      setCreatedAtDate(new Date().toISOString().split('T')[0]);
      setClosingDate('');
      setClosingDateError('');
      setIndustry('');
      setIndustryError('');
    }
  }, [isOpen, currentUser.id]);

  const [primaryContactId, setPrimaryContactId] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [industry, setIndustry] = useState<ProjectIndustry | ''>('');
  const [industryError, setIndustryError] = useState('');
  const [location, setLocation] = useState('Jeddah');
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('tender');
  const [closingDate, setClosingDate] = useState('');
  const [closingDateError, setClosingDateError] = useState('');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('lead');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [probability, setProbability] = useState('40');
  const [priority, setPriority] = useState<ProjectPriority>('high');
  const [rfqPackages, setRfqPackages] = useState<RFQPackage>('both');
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [submittalStatus, setSubmittalStatus] = useState<SubmittalStatus>('under_approval');
  const [clientTargetPrice, setClientTargetPrice] = useState('');
  const [lastDiscountPct, setLastDiscountPct] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consultant State
  const [consultantId, setConsultantId] = useState('');
  const [isFastConsultantOpen, setIsFastConsultantOpen] = useState(false);
  const [fastConsultantName, setFastConsultantName] = useState('');
  const [fastConsultantCity, setFastConsultantCity] = useState('Jeddah');
  const [fastConsultantPhone, setFastConsultantPhone] = useState('');

  const consultantCompanies = useMemo(() => {
    return companies.filter(c => c.company_type === 'consultant');
  }, [companies]);

  const handleSaveFastConsultant = async () => {
    if (!fastConsultantName.trim()) return;
    const newComp = await addCompany({
      name: fastConsultantName.trim(),
      normalized_name: fastConsultantName.trim().toLowerCase(),
      company_type: 'consultant',
      city: fastConsultantCity,
      phone: fastConsultantPhone.trim() || undefined
    });
    setConsultantId(newComp.id);
    setIsFastConsultantOpen(false);
    setFastConsultantName('');
    setFastConsultantPhone('');
  };

  // Fast Add Company & Contact State
  const [isFastCompanyOpen, setIsFastCompanyOpen] = useState(false);
  const [fastCompanyName, setFastCompanyName] = useState('');
  const [fastCompanyType, setFastCompanyType] = useState<CompanyType>('contractor');
  const [fastCompanyCity, setFastCompanyCity] = useState('Jeddah');

  const [isFastContactOpen, setIsFastContactOpen] = useState(false);
  const [fastContactCompanyId, setFastContactCompanyId] = useState('');
  const [fastContactName, setFastContactName] = useState('');
  const [fastContactPhone, setFastContactPhone] = useState('');
  const [fastContactRole, setFastContactRole] = useState('');

  const toggleContactSelection = (cId: string) => {
    setSelectedContactIds(prev => {
      if (prev.includes(cId)) {
        const next = prev.filter(id => id !== cId);
        if (primaryContactId === cId) {
          setPrimaryContactId(next[0] || '');
        }
        return next;
      } else {
        const next = [...prev, cId];
        if (!primaryContactId) {
          setPrimaryContactId(cId);
        }
        return next;
      }
    });
  };

  const handleSaveFastCompany = async () => {
    if (!fastCompanyName.trim()) return;
    const newComp = await addCompany({
      name: fastCompanyName.trim(),
      normalized_name: fastCompanyName.trim().toLowerCase(),
      company_type: fastCompanyType,
      city: fastCompanyCity,
    });
    setCompanyId(newComp.id);
    setFastContactCompanyId(newComp.id);
    setIsFastCompanyOpen(false);
    setFastCompanyName('');
  };

  const handleSaveFastContact = async () => {
    if (!fastContactName.trim() || !fastContactPhone.trim()) return;
    const targetCompId = fastContactCompanyId || companyId;
    if (!targetCompId) {
      alert(isRTL ? 'الرجاء اختيار أو إضافة شركة أولاً لربط جهة الاتصال بها' : 'Please select or add a company first to link the contact');
      return;
    }
    const currentComp = companies.find(c => c.id === targetCompId);
    const newContact = await addContact({
      full_name: fastContactName.trim(),
      phone: fastContactPhone.trim(),
      job_title: fastContactRole.trim() || 'Contact',
      company_id: targetCompId,
      company_name: currentComp?.name || '',
      is_hot_lead: false,
    });
    setPrimaryContactId(newContact.id);
    setSelectedContactIds(prev => prev.includes(newContact.id) ? prev : [...prev, newContact.id]);
    setIsFastContactOpen(false);
    setFastContactName('');
    setFastContactPhone('');
    setFastContactRole('');
  };

  // Helper functions to retrieve assignee and company names
  const getAssigneeName = (p: { referred_to_name?: string; referred_to_id?: string; owner_name?: string; owner_id?: string }) => {
    if (p.referred_to_name) return p.referred_to_name;
    if (p.referred_to_id) {
      const member = teamMembers.find(m => m.id === p.referred_to_id);
      if (member) return member.full_name;
    }
    if (p.owner_name) return p.owner_name;
    if (p.owner_id) {
      const member = teamMembers.find(m => m.id === p.owner_id);
      if (member) return member.full_name;
    }
    return 'مهندس المبيعات';
  };

  const getProjectCompanyName = (p: { company_name?: string; company_id?: string }) => {
    if (p.company_name) return p.company_name;
    const c = companies.find(comp => comp.id === p.company_id);
    return c?.name || 'شركة غير محددة';
  };

  const trimmedName = name.trim().toLowerCase();

  // Autocomplete suggestions matching from the very first character typed
  const autocompleteMatches = useMemo(() => {
    if (!trimmedName) return [];
    return projects
      .filter(p => !p.is_archived && p.name.toLowerCase().includes(trimmedName))
      .slice(0, 5);
  }, [projects, trimmedName]);

  // Strict duplicate detection: same project name AND same company
  const exactDuplicateProject = useMemo(() => {
    if (!trimmedName || !companyId) return null;
    const selectedComp = companies.find(c => c.id === companyId);
    const selectedCompName = selectedComp?.name?.toLowerCase();

    return projects.find(p => {
      if (p.is_archived) return false;
      const matchName = p.name.trim().toLowerCase() === trimmedName;
      if (!matchName) return false;
      const matchCompId = p.company_id === companyId;
      const matchCompName = selectedCompName && p.company_name?.toLowerCase() === selectedCompName;
      return matchCompId || matchCompName;
    }) || null;
  }, [projects, trimmedName, companyId, companies]);

  // Tender scenario: same project name exists with different companies
  const tenderMatches = useMemo(() => {
    if (!trimmedName || exactDuplicateProject) return [];
    return projects.filter(p => !p.is_archived && p.name.trim().toLowerCase() === trimmedName);
  }, [projects, trimmedName, exactDuplicateProject]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || exactDuplicateProject) return;

    if (!industry) {
      setIndustryError(isRTL ? 'قطاع المشروع إلزامي، يرجى اختيار قطاع من القائمة' : 'Project Industry is mandatory. Please select an industry.');
      return;
    }

    if (opportunityType === 'in_hand' && !closingDate.trim()) {
      setClosingDateError(isRTL ? 'تاريخ الإغلاق المتوقع (Closing Date) إلزامي لكافة مشاريع In Hand' : 'Closing Date is mandatory for In Hand projects');
      return;
    }

    setIsSubmitting(true);
    const selectedCompany = companies.find(c => c.id === companyId);
    const effectivePrimaryId = primaryContactId || selectedContactIds[0];
    const selectedContact = contacts.find(c => c.id === effectivePrimaryId);
    const val = parseFloat(estimatedValue) || 0;
    const prob = parseInt(probability, 10) || 40;
    const discountVal = parseFloat(lastDiscountPct) || undefined;
    const discountAmt = (discountVal && val > 0) ? Math.round((discountVal / 100) * val) : undefined;

    const creatorId = currentUser.id || 'u1';
    const creatorName = currentUser.full_name || 'Eslam Mohandes';
    const assignedUser = teamMembers.find(m => m.id === assignedUserId);
    const isReferred = Boolean(assignedUserId && assignedUserId !== creatorId && assignedUser);

    const selectedDateTime = createdAtDate 
      ? new Date(createdAtDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString()
      : new Date().toISOString();

    const createdProject = await addProject({
      pr_number: 'AUTO',
      name: name.trim(),
      created_at: selectedDateTime,
      stage_entered_at: selectedDateTime,
      company_id: companyId,
      company_name: selectedCompany?.name,
      consultant_id: consultantId || undefined,
      consultant_name: companies.find(c => c.id === consultantId)?.name,
      primary_contact_id: effectivePrimaryId || undefined,
      primary_contact_name: selectedContact?.full_name,
      primary_contact_phone: selectedContact?.phone,
      contact_ids: selectedContactIds.length > 0 ? selectedContactIds : (effectivePrimaryId ? [effectivePrimaryId] : undefined),
      location,
      industry: industry as ProjectIndustry,
      opportunity_type: opportunityType,
      closing_date: closingDate.trim() || undefined,
      pipeline_stage: pipelineStage,
      systems: selectedSystems,
      rfq_packages: pipelineStage === 'rfq_processing' ? rfqPackages : undefined,
      submittal_status: pipelineStage === 'technical_submission' ? submittalStatus : undefined,
      client_target_price: clientTargetPrice ? parseFloat(clientTargetPrice) : undefined,
      last_discount_pct: discountVal,
      last_discount_amount: discountAmt,
      priority,
      estimated_value: val,
      probability: prob,
      // Crucial requirement: owner remains the original creator!
      owner_id: creatorId,
      owner_name: creatorName,
      referred_to_id: isReferred ? assignedUserId : undefined,
      referred_to_name: isReferred ? assignedUser?.full_name : undefined,
      referred_at: isReferred ? new Date().toISOString() : undefined,
      referred_by_id: isReferred ? creatorId : undefined,
      referred_by_name: isReferred ? creatorName : undefined,
      next_action: nextAction.trim() || undefined,
      next_follow_up_at: nextFollowUpDate || undefined,
      last_activity_at: new Date().toISOString().split('T')[0],
    });

    // If referred to a sales engineer, trigger referral logic and dual notifications
    if (isReferred && createdProject) {
      await referProject(createdProject.id, assignedUserId);
    }

    setIsSubmitting(false);
    onClose();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="glass-card rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-white/90 dark:border-[#8FC2F0]/20 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] backdrop-blur-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100/80 dark:border-slate-800 bg-white/40 dark:bg-[#232A38]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shadow-2xs">
              <FolderKanban className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="font-black text-[#292D32] dark:text-white text-base sm:text-lg font-urbanist leading-tight">
                {isRTL ? 'إضافة مشروع مبيعات جديد' : 'Create New Sales Project'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isRTL ? 'محفظة فرص مشاريع شركة المسبار' : 'Western Region Opportunity Portfolio'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5 flex items-center justify-between">
                <span>#PR Code</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  {isRTL ? 'توليد تلقائي' : 'Auto'}
                </span>
              </label>
              <div 
                title={isRTL ? 'يتم توليد رقم المشروع (#PR) تلقائياً وبشكل موحد عبر النظام لضمان تسلسل الأرقام ومنع التكرار' : 'Project Code (#PR) is automatically generated by the server to prevent duplicates'}
                className="w-full px-3.5 py-2.5 bg-slate-100/90 dark:bg-[#141820]/90 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between font-mono font-bold text-slate-500 dark:text-slate-400 shadow-2xs cursor-not-allowed select-none"
              >
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'توليد تلقائي موحد' : 'Auto Generated'}</span>
                </span>
                <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-[#8FC2F0]" />
                <span>{isRTL ? 'تاريخ المشروع *' : 'Project Date *'}</span>
              </label>
              <input
                type="date"
                required
                value={createdAtDate}
                onChange={e => setCreatedAtDate(e.target.value)}
                title={isRTL ? 'تاريخ إضافة أو استلام المشروع الفعلي (يمكنك اختيار تاريخ سابق)' : 'Actual project creation or receipt date (you can select a past date)'}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
              />
            </div>

            <div className="sm:col-span-2 relative">
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Project Name *</span>
                {autocompleteMatches.length > 0 && (
                  <span className="text-[10px] text-blue-600 dark:text-[#8FC2F0] font-medium">
                    {autocompleteMatches.length} مشاريع مشابهة مسجلة
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. King Salman Park District Cool Valves Package"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (name.trim().length > 0) setShowSuggestions(true);
                }}
                className={`w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border rounded-xl focus:outline-none focus:ring-2 text-slate-900 dark:text-white font-medium shadow-2xs ${
                  exactDuplicateProject
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-200/80 dark:border-slate-700 focus:ring-[#8FC2F0] focus:border-[#8FC2F0]'
                }`}
              />

              {/* Autocomplete Dropdown List */}
              {showSuggestions && autocompleteMatches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C2029] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold px-3">
                    <span>مشاريع مسجلة في الـ CRM مطابقة لاسم المشروع:</span>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {autocompleteMatches.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setName(p.name);
                          setShowSuggestions(false);
                        }}
                        className="p-2.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors space-y-1 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {p.name}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                            {p.pr_number}
                          </span>
                        </div>
                        {/* Red Line as requested: المشروع مسجل مسبقا مع شركة كذا مع المهندس كذا */}
                        <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>
                            المشروع مسجل مسبقاً مع شركة: <strong className="underline">{getProjectCompanyName(p)}</strong> | مع المهندس: <strong className="underline">{getAssigneeName(p)}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Manager: Assign Project Lead To Sales Rep */}
          {isManager && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-1.5">
              <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>تعيين المشروع إلى مهندس مبيعات (Assign Lead To):</span>
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400/90 font-medium">
                  المالك الأصلي: {currentUser.full_name}
                </span>
              </label>
              <select
                value={assignedUserId}
                onChange={e => setAssignedUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#141820] border border-amber-300/80 dark:border-amber-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-xs text-slate-900 dark:text-white shadow-2xs"
              >
                <option value={currentUser.id}>
                  {currentUser.full_name} ({currentUser.role === 'admin' ? 'المدير العام' : 'مدير المبيعات'})
                </option>
                {salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>
                    {rep.full_name} (مهندس مبيعات - {rep.territory || 'المنطقة الغربية'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-[#292D32] dark:text-slate-200">
                  {isRTL ? 'الشركة / العميل (Company) *' : 'Company / Account *'}
                </label>
                <button
                  type="button"
                  onClick={() => setIsFastCompanyOpen(!isFastCompanyOpen)}
                  className="text-xs font-bold text-blue-700 dark:text-[#8FC2F0] bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-[#8FC2F0]" />
                  <span>{isRTL ? '+ شركة جديدة (سريع)' : '+ Fast Add Company'}</span>
                </button>
              </div>
              <select
                required
                value={companyId}
                onChange={e => {
                  if (e.target.value === '__FAST_ADD_COMPANY__') {
                    setIsFastCompanyOpen(true);
                    return;
                  }
                  setCompanyId(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
              >
                <option value="" disabled className="dark:bg-[#141820] dark:text-white">
                  {isRTL ? '-- اختر الشركة / العميل --' : '-- Select Company / Account --'}
                </option>
                <option value="__FAST_ADD_COMPANY__" className="font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950">
                  {isRTL ? '⚡ + إضافة شركة جديدة سريعة...' : '⚡ + Fast Add New Company...'}
                </option>
                {companies.map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-[#141820] dark:text-white">{c.name}</option>
                ))}
              </select>

              {/* Fast Add Company Inline Form */}
              {isFastCompanyOpen && (
                <div className="p-3 mt-2 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2.5 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isRTL ? 'إضافة شركة جديدة سريعة (الحقول الإلزامية)' : 'Fast Add Company (Mandatory Fields Only)'}</span>
                    </span>
                    <button type="button" onClick={() => setIsFastCompanyOpen(false)} className="text-slate-400 hover:text-rose-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        {isRTL ? 'اسم الشركة *' : 'Company Name *'}
                      </label>
                      <input 
                        type="text" 
                        value={fastCompanyName} 
                        onChange={e => setFastCompanyName(e.target.value)}
                        placeholder={isRTL ? "مثال: شركة المسبار للمقاولات" : "e.g. Al-Mespar Contracting Co."}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          {isRTL ? 'نوع الشركة *' : 'Company Type *'}
                        </label>
                        <select
                          value={fastCompanyType}
                          onChange={e => setFastCompanyType(e.target.value as CompanyType)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white text-xs"
                        >
                          <option value="contractor">{isRTL ? 'مقاول رئيسي (Contractor)' : 'Main Contractor'}</option>
                          <option value="consultant">{isRTL ? 'استشاري (Consultant)' : 'Consultant'}</option>
                          <option value="client_owner">{isRTL ? 'مالك / عميل (Client Owner)' : 'Client / Owner'}</option>
                          <option value="mep_contractor">{isRTL ? 'مقاول كهروميكانيك (MEP)' : 'MEP Contractor'}</option>
                          <option value="developer">{isRTL ? 'مطور عقاري (Developer)' : 'Real Estate Developer'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          {isRTL ? 'المدينة *' : 'City *'}
                        </label>
                        <select
                          value={fastCompanyCity}
                          onChange={e => setFastCompanyCity(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white text-xs"
                        >
                          {SAUDI_LOCATIONS.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={!fastCompanyName.trim()}
                      onClick={handleSaveFastCompany}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isRTL ? 'حفظ واختيار الشركة' : 'Save & Select Company'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-[#292D32] dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isRTL ? 'جهات الاتصال بالمشروع (Key Contacts)' : 'Project Key Contacts'}</span>
                  {selectedContactIds.length > 0 && (
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      {selectedContactIds.length} {isRTL ? 'محدد' : 'selected'}
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setIsFastContactOpen(!isFastContactOpen)}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isRTL ? '+ جهة اتصال جديدة (سريع)' : '+ Fast Add Contact'}</span>
                </button>
              </div>

              {/* Multi-Contact Selection List with Apple HIG styling */}
              {(() => {
                const availableContacts = contacts.filter(c => !companyId || c.company_id === companyId);
                if (availableContacts.length === 0) {
                  return (
                    <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 text-center text-xs text-slate-500 dark:text-slate-400">
                      <span>{isRTL ? 'لا توجد جهات اتصال مسجلة لهذه الشركة بعد.' : 'No contacts registered for this company yet.'}</span>
                      <button
                        type="button"
                        onClick={() => setIsFastContactOpen(true)}
                        className="block mx-auto mt-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        {isRTL ? '+ اضغط هنا لإضافة جهة اتصال الآن' : '+ Add Contact Now'}
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-1.5">
                    <div className="max-h-36 overflow-y-auto p-2 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl space-y-1.5 shadow-2xs">
                      {availableContacts.map(c => {
                        const isSelected = selectedContactIds.includes(c.id);
                        const isPrimary = (primaryContactId || selectedContactIds[0]) === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleContactSelection(c.id)}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-2xs'
                                : 'bg-white/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {c.full_name?.charAt(0) || 'C'}
                              </div>
                              <div className="min-w-0 truncate">
                                <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                  {c.full_name}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                                  {c.job_title || (isRTL ? 'جهة اتصال' : 'Contact')} {c.phone ? `• ${c.phone}` : ''}
                                </div>
                              </div>
                            </div>

                            {/* Primary designation button if selected */}
                            {isSelected && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPrimaryContactId(c.id);
                                }}
                                title={isRTL ? 'تحديد كمسؤول اتصال رئيسي' : 'Set as primary contact'}
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-all ${
                                  isPrimary
                                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs'
                                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                }`}
                              >
                                <Star className={`w-3 h-3 ${isPrimary ? 'fill-amber-500 text-amber-500' : ''}`} />
                                <span>{isPrimary ? (isRTL ? 'الرئيسي' : 'Primary') : (isRTL ? 'تعيين رئيسي' : 'Make Primary')}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {selectedContactIds.length > 0 && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isRTL 
                          ? `💡 تم تحديد ${selectedContactIds.length} مسؤولين للمشروع. النجمة تميز مسؤول الاتصال الأساسي.` 
                          : `💡 ${selectedContactIds.length} key contacts assigned. Star marks the primary point of contact.`}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Fast Add Contact Inline Form */}
              {isFastContactOpen && (
                <div className="p-3 mt-2 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2.5 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isRTL ? 'إضافة جهة اتصال سريعة (الحقول الإلزامية)' : 'Fast Add Contact (Mandatory Fields Only)'}</span>
                    </span>
                    <button type="button" onClick={() => setIsFastContactOpen(false)} className="text-slate-400 hover:text-rose-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        {isRTL ? 'الشركة / الحساب التابع له *' : 'Assigned Company / Account *'}
                      </label>
                      <select
                        required
                        value={fastContactCompanyId || companyId}
                        onChange={e => {
                          setFastContactCompanyId(e.target.value);
                          if (!companyId) setCompanyId(e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white text-xs font-semibold"
                      >
                        <option value="" disabled>
                          {isRTL ? '-- اختر الشركة التابع لها --' : '-- Select Associated Company --'}
                        </option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        {isRTL ? 'اسم الشخص / المهندس *' : 'Contact Person / Engineer *'}
                      </label>
                      <input 
                        type="text" 
                        value={fastContactName} 
                        onChange={e => setFastContactName(e.target.value)}
                        placeholder={isRTL ? "مثال: م. أحمد فهد" : "e.g. Eng. Ahmed Fahad"}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          {isRTL ? 'رقم الجوال *' : 'Mobile / Phone *'}
                        </label>
                        <input 
                          type="tel"
                          inputMode="numeric"
                          value={fastContactPhone} 
                          onChange={e => {
                            // Convert Eastern Arabic-Indic numerals (٠-٩) to standard digits (0-9)
                            const converted = e.target.value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
                            // Strictly allow only digits and optional leading '+'
                            const numbersOnly = converted.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
                            setFastContactPhone(numbersOnly);
                          }}
                          onKeyDown={e => {
                            if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
                            if (e.ctrlKey || e.metaKey) return;
                            if (!/[\d+٠-٩]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          placeholder="9665XXXXXXXX"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          {isRTL ? 'المسمى الوظيفي' : 'Job Title / Role'}
                        </label>
                        <input 
                          type="text" 
                          value={fastContactRole} 
                          onChange={e => setFastContactRole(e.target.value)}
                          placeholder={isRTL ? "مدير المشتريات / مهندس موقع" : "Procurement Manager / Site Eng."}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={!fastContactName.trim() || !fastContactPhone.trim()}
                      onClick={handleSaveFastContact}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isRTL ? 'حفظ واختيار جهة الاتصال' : 'Save & Select Contact'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Consultant Assignment (Optional) */}
          <div className="p-3.5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{isRTL ? 'الاستشاري المشرف (Consultant) - اختياري' : 'Project Consultant (Optional)'}</span>
              </label>
              <button
                type="button"
                onClick={() => setIsFastConsultantOpen(!isFastConsultantOpen)}
                className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 hover:bg-purple-200/70 dark:bg-purple-900/40 dark:hover:bg-purple-800/40 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all border border-purple-300/80 dark:border-purple-700/80 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>{isRTL ? '+ استشاري جديد (سريع)' : '+ Fast Add Consultant'}</span>
              </button>
            </div>

            <select
              value={consultantId}
              onChange={e => {
                if (e.target.value === '__FAST_ADD_CONSULTANT__') {
                  setIsFastConsultantOpen(true);
                  return;
                }
                setConsultantId(e.target.value);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-[#141820] border border-purple-200 dark:border-purple-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-xs text-slate-900 dark:text-white shadow-2xs"
            >
              <option value="">{isRTL ? '-- بدون استشاري (أو اختر من الاستشاريين المسجلين) --' : '-- No Consultant (or Select Registered Consultant) --'}</option>
              <option value="__FAST_ADD_CONSULTANT__" className="font-extrabold text-purple-600 bg-purple-50 dark:bg-purple-950">
                {isRTL ? '⚡ + إضافة استشاري جديد سريع...' : '⚡ + Fast Add New Consultant...'}
              </option>
              {consultantCompanies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.city ? `(${c.city})` : ''}
                </option>
              ))}
            </select>

            {/* Fast Add Consultant Inline Form */}
            {isFastConsultantOpen && (
              <div className="p-3 rounded-xl bg-white dark:bg-[#1c222e] border border-purple-300 dark:border-purple-700 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
                  <span>{isRTL ? 'إضافة استشاري جديد سريع' : 'Fast Add New Consultant'}</span>
                  <button type="button" onClick={() => setIsFastConsultantOpen(false)} className="text-slate-400 hover:text-rose-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <input
                      type="text"
                      value={fastConsultantName}
                      onChange={e => setFastConsultantName(e.target.value)}
                      placeholder={isRTL ? 'اسم المكتب الاستشاري *' : 'Consultant Name *'}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <select
                      value={fastConsultantCity}
                      onChange={e => setFastConsultantCity(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white text-xs"
                    >
                      {SAUDI_LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={!fastConsultantName.trim()}
                    onClick={handleSaveFastConsultant}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isRTL ? 'حفظ واختيار الاستشاري' : 'Save & Select Consultant'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Strict Duplicate Warning Alert - Blocks Creation */}
          {exactDuplicateProject && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900/80 text-rose-900 dark:text-rose-200 flex items-start gap-3 animate-in shake duration-200 shadow-xs">
              <div className="w-7 h-7 rounded-xl bg-rose-200 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-300" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-black text-rose-950 dark:text-rose-100 text-sm">
                  تحذير: لا يمكن تكرار المشروع مع نفس الشركة!
                </div>
                <div className="leading-relaxed">
                  المشروع <strong className="underline">{exactDuplicateProject.name}</strong> مسجل بالفعل في الـ CRM مع شركة <strong className="underline">{getProjectCompanyName(exactDuplicateProject)}</strong> ومسند للمهندس <strong className="underline">{getAssigneeName(exactDuplicateProject)}</strong>.
                </div>
                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 pt-0.5">
                  ⛔ تم قفل زر الحفظ (Create Project) لمنع تسجيل صفقات مكررة. إذا كان المشروع مناقصة (Tender)، يرجى اختيار شركة المقاول المنافسة الأخرى.
                </div>
              </div>
            </div>
          )}

          {/* Tender Multi-Contractor Notice - Allowed & Informative */}
          {!exactDuplicateProject && tenderMatches.length > 0 && (
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 flex items-start gap-2.5 text-xs">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-extrabold text-sky-950 dark:text-sky-100">
                  إشعار مناقصة تنافسية (Tender Opportunity)
                </div>
                <div className="text-[11px] text-sky-800 dark:text-sky-300">
                  اسم المشروع متطابق مع منافسة مسجلة مسبقاً مع مقاول آخر ({tenderMatches.map(m => `${getProjectCompanyName(m)} / المهندس: ${getAssigneeName(m)}`).join(' ، ')}). نظراً لاختلاف الشركة المحددة، يُسمح بإنشاء العرض التنافسي الجديد بنجاح.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Factory className="w-3.5 h-3.5 text-blue-600 dark:text-[#8FC2F0]" />
                  <span>{isRTL ? 'قطاع المشروع (Project Industry) *' : 'Project Industry *'}</span>
                </span>
                <span className="text-[10px] text-rose-500 font-extrabold uppercase bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                  {isRTL ? 'إلزامي' : 'Mandatory'}
                </span>
              </label>
              <select
                required
                value={industry}
                onChange={e => {
                  setIndustry(e.target.value as ProjectIndustry);
                  if (industryError) setIndustryError('');
                }}
                className={cn(
                  "w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border rounded-xl focus:outline-none focus:ring-2 font-medium text-slate-900 dark:text-white shadow-2xs",
                  industryError 
                    ? "border-rose-500 focus:ring-rose-500 bg-rose-50/30 ring-2 ring-rose-500/20" 
                    : "border-slate-200/80 dark:border-slate-700 focus:ring-[#8FC2F0] focus:border-[#8FC2F0]"
                )}
              >
                <option value="" disabled className="dark:bg-[#141820] dark:text-white">
                  {isRTL ? '-- اختر قطاع المشروع (إلزامي) --' : '-- Select Project Industry * --'}
                </option>
                {PROJECT_INDUSTRIES.map(ind => (
                  <option key={ind.value} value={ind.value} className="dark:bg-[#141820] dark:text-white">
                    {ind.label}
                  </option>
                ))}
              </select>
              {industryError && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{industryError}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">{isRTL ? 'المدينة (Location)' : 'Location'}</label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
              >
                {SAUDI_LOCATIONS.map(loc => (
                  <option key={loc} value={loc} className="dark:bg-[#141820] dark:text-white">{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Opportunity Type</label>
              <select
                value={opportunityType}
                onChange={e => setOpportunityType(e.target.value as OpportunityType)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
              >
                {OPPORTUNITY_TYPES.map(t => (
                  <option key={t.value} value={t.value} className="dark:bg-[#141820] dark:text-white">{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Pipeline Stage</label>
              <select
                value={pipelineStage}
                onChange={e => setPipelineStage(e.target.value as PipelineStage)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
              >
                {PIPELINE_STAGES.map(s => (
                  <option key={s.value} value={s.value} className="dark:bg-[#141820] dark:text-white">{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mandatory Closing Date for In Hand Projects */}
          {opportunityType === 'in_hand' && (
            <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-transparent space-y-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isRTL ? 'تاريخ الإغلاق المتوقع (Closing Date) *' : 'Expected Closing Date *'}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                    {isRTL ? 'إلزامي لمشاريع In Hand' : 'Mandatory for In Hand'}
                  </span>
                </label>
                {closingDate && (
                  <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    {formatDateString(closingDate)}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={closingDate}
                  onChange={e => {
                    setClosingDate(e.target.value);
                    if (closingDateError) setClosingDateError('');
                  }}
                  className={cn(
                    "w-full px-3.5 py-2.5 bg-white dark:bg-[#141820] border rounded-xl font-medium text-slate-900 dark:text-white shadow-2xs focus:outline-none focus:ring-2 font-mono text-sm",
                    closingDateError 
                      ? "border-rose-500 focus:ring-rose-500 bg-rose-50/30 ring-2 ring-rose-500/20" 
                      : "border-emerald-300 dark:border-emerald-700 focus:ring-emerald-500 focus:border-emerald-500"
                  )}
                />
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 font-medium">
                {isRTL 
                  ? '💡 يحدد موعد الإغلاق المتوقع لتوقيع العقد أو الترسية النهائية لمشروع In Hand، وسيتم استخدامه في الفلترة والتقارير.' 
                  : '💡 Target contract signing or final award closing date for this In Hand opportunity.'}
              </p>
              {closingDateError && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{closingDateError}</span>
                </p>
              )}
            </div>
          )}

          {/* Project Systems Multi-Select Dropdown */}
          <div className="p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600 dark:text-[#8FC2F0]" />
                <span>{isRTL ? 'أنظمة المشروع (Systems Scope):' : 'Project Systems Scope:'}</span>
              </label>
              <span className="text-[10px] text-blue-600 dark:text-[#8FC2F0] font-bold">
                {selectedSystems.length} {isRTL ? 'أنظمة مختارة' : 'selected'}
              </span>
            </div>
            <ProjectSystemsMultiSelect
              selectedSystems={selectedSystems}
              onChange={setSelectedSystems}
              placeholder={isRTL ? 'اختر أنظمة المشروع من القائمة (21 نظام)...' : 'Select systems from dropdown (21 available)...'}
            />
          </div>

          {/* Technical Submittal: Approval Status */}
          {pipelineStage === 'technical_submission' && (
            <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/20 space-y-2 animate-in fade-in">
              <label className="text-[11px] font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Submittal Approval Status (حالة الاعتماد الفني):</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'under_approval', label: 'قيد الاعتماد', color: 'bg-amber-500 text-white border-amber-600' },
                  { id: 'approved', label: 'معتمد (Approved)', color: 'bg-emerald-600 text-white border-emerald-600' },
                  { id: 'approved_with_comments', label: 'معتمد بملاحظات', color: 'bg-blue-600 text-white border-blue-600' },
                  { id: 'rejected', label: 'مرفوض', color: 'bg-rose-600 text-white border-rose-600' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubmittalStatus(item.id as SubmittalStatus)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      submittalStatus === item.id
                        ? `${item.color} shadow-xs font-black`
                        : 'bg-white dark:bg-[#141820] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-purple-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Negotiation: Target Price & Discount % */}
          {(pipelineStage === 'negotiation' || (pipelineStage as string) === 'technically_approved') && (
            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Commercial Negotiation (التفاوض المالي)</span>
                </label>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  معتمد فنياً ✅
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Client Target Price (SAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 450000"
                    value={clientTargetPrice}
                    onChange={e => setClientTargetPrice(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold bg-white dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Offered (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 5"
                    value={lastDiscountPct}
                    onChange={e => setLastDiscountPct(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold bg-white dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Est. Value (SAR)</label>
              <input
                type="number"
                min="0"
                placeholder="500000"
                value={estimatedValue}
                onChange={e => setEstimatedValue(e.target.value)}
                className="w-full px-3.5 py-2.5 font-bold bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white shadow-2xs"
              />
            </div>

            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={e => setProbability(e.target.value)}
                className="w-full px-3.5 py-2.5 font-bold bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white shadow-2xs"
              />
            </div>

            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as ProjectPriority)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium capitalize text-slate-900 dark:text-white shadow-2xs"
              >
                <option value="urgent" className="dark:bg-[#141820] dark:text-white">Urgent</option>
                <option value="high" className="dark:bg-[#141820] dark:text-white">High</option>
                <option value="medium" className="dark:bg-[#141820] dark:text-white">Medium</option>
                <option value="low" className="dark:bg-[#141820] dark:text-white">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Next Action Commitment</label>
              <input
                type="text"
                placeholder="e.g. Schedule meeting with procurement head"
                value={nextAction}
                onChange={e => setNextAction(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white shadow-2xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Follow-up Target Date</label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={e => setNextFollowUpDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white shadow-2xs font-medium"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(exactDuplicateProject)}
              title={exactDuplicateProject ? 'تم قفل الزر لمنع تكرار المشروع مع نفس الشركة' : undefined}
              className={`px-5 py-2.5 font-bold rounded-xl shadow-xs transition-all text-xs flex items-center gap-1.5 ${
                exactDuplicateProject
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-[#292D32] hover:bg-[#1E2124] dark:bg-[#8FC2F0] dark:hover:bg-[#7ab2e3] text-white dark:text-[#141820] cursor-pointer'
              }`}
            >
              {exactDuplicateProject ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>تكرار غير مسموح</span>
                </>
              ) : isSubmitting ? (
                <span>Creating...</span>
              ) : (
                <span>Create Project</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
