'use client';

import React, { useState, useMemo } from 'react';
import { X, Building2, Plus, Sparkles, FolderKanban, Layers, FileCheck, ShieldCheck, Tag, Target, UserCheck, AlertCircle, Lock } from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { SAUDI_LOCATIONS, PIPELINE_STAGES, OPPORTUNITY_TYPES } from '@/lib/constants';
import { PipelineStage, OpportunityType, ProjectPriority, RFQPackage, SubmittalStatus, Project } from '@/types/crm';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCompanyId?: string;
}

export function AddProjectModal({ isOpen, onClose, defaultCompanyId }: AddProjectModalProps) {
  const { projects, companies, contacts, addProject, currentUser, teamMembers, referProject } = useCRM();

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin';
  const salesReps = teamMembers.filter(m => m.role === 'sales_engineer' || (m.role as string) === 'sales_rep');

  const [prNumber, setPrNumber] = useState('');
  const [name, setName] = useState('');
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
    }
  }, [isOpen, currentUser.id]);

  const [primaryContactId, setPrimaryContactId] = useState('');
  const [location, setLocation] = useState('Jeddah');
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('tender');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('lead');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [probability, setProbability] = useState('40');
  const [priority, setPriority] = useState<ProjectPriority>('high');
  const [rfqPackages, setRfqPackages] = useState<RFQPackage>('both');
  const [submittalStatus, setSubmittalStatus] = useState<SubmittalStatus>('under_approval');
  const [clientTargetPrice, setClientTargetPrice] = useState('');
  const [lastDiscountPct, setLastDiscountPct] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prNumber.trim() || exactDuplicateProject) return;

    setIsSubmitting(true);
    const selectedCompany = companies.find(c => c.id === companyId);
    const selectedContact = contacts.find(c => c.id === primaryContactId);
    const val = parseFloat(estimatedValue) || 0;
    const prob = parseInt(probability, 10) || 40;
    const discountVal = parseFloat(lastDiscountPct) || undefined;
    const discountAmt = (discountVal && val > 0) ? Math.round((discountVal / 100) * val) : undefined;

    const creatorId = currentUser.id || 'u1';
    const creatorName = currentUser.full_name || 'Eslam Mohandes';
    const assignedUser = teamMembers.find(m => m.id === assignedUserId);
    const isReferred = Boolean(assignedUserId && assignedUserId !== creatorId && assignedUser);

    const createdProject = await addProject({
      pr_number: prNumber.trim().toUpperCase(),
      name: name.trim(),
      company_id: companyId,
      company_name: selectedCompany?.name,
      primary_contact_id: primaryContactId || undefined,
      primary_contact_name: selectedContact?.full_name,
      primary_contact_phone: selectedContact?.phone,
      location,
      opportunity_type: opportunityType,
      pipeline_stage: pipelineStage,
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="glass-card rounded-3xl max-w-2xl w-full shadow-2xl border border-white/90 dark:border-[#8FC2F0]/20 overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl animate-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-slate-100/80 dark:border-slate-800 bg-white/40 dark:bg-[#232A38]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shadow-2xs">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-[#292D32] dark:text-white text-lg font-urbanist leading-tight">Create New Sales Project</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Western Region Opportunity Portfolio</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">#PR Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. PR1045"
                value={prNumber}
                onChange={e => setPrNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 font-mono font-bold bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] uppercase text-slate-900 dark:text-white shadow-2xs"
              />
            </div>

            <div className="col-span-2 relative">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Client / Company *</label>
              <select
                required
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
              >
                <option value="" disabled className="dark:bg-[#141820] dark:text-white">-- Select Client / Company --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-[#141820] dark:text-white">{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Key Contact Person</label>
              <select
                value={primaryContactId}
                onChange={e => setPrimaryContactId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
              >
                <option value="" className="dark:bg-[#141820] dark:text-white">No Contact Selected</option>
                {contacts.filter(c => !companyId || c.company_id === companyId).map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-[#141820] dark:text-white">{c.full_name} ({c.job_title || 'Contact'})</option>
                ))}
              </select>
            </div>
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Location</label>
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

          {/* RFQ Processing: Packages Selection */}
          {(pipelineStage === 'rfq_processing' || (pipelineStage as string) === 'pricing') && (
            <div className="p-3 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/20 space-y-2 animate-in fade-in">
              <label className="text-[11px] font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                <span>Pre-Sales RFQ Packages (حزم وأنظمة التسعير):</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'lc', label: '⚡ LC (تيارات خفيفة)' },
                  { id: 'bms', label: '🏢 BMS (إدارة مباني)' },
                  { id: 'both', label: '⚡🏢 LC + BMS (كلاهما)' },
                ].map(pkg => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setRfqPackages(pkg.id as RFQPackage)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      rfqPackages === pkg.id
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white dark:bg-[#141820] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-sky-400'
                    }`}
                  >
                    {pkg.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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

          <div className="grid grid-cols-3 gap-3">
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

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Next Action Commitment</label>
              <input
                type="text"
                placeholder="e.g. Schedule meeting with procurement head"
                value={nextAction}
                onChange={e => setNextAction(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white shadow-2xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
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
}
