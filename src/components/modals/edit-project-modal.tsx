'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Briefcase, 
  Lock, 
  Unlock, 
  DollarSign, 
  Building2, 
  User, 
  MapPin, 
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  FileCheck,
  Layers,
  Clock,
  ShieldCheck,
  Tag,
  Target
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { 
  SAUDI_LOCATIONS, 
  PIPELINE_STAGES, 
  OPPORTUNITY_TYPES, 
  PROJECT_PRIORITIES,
  canEditCommercialValue,
  RFQ_PACKAGES,
  SUBMITTAL_STATUSES
} from '@/lib/constants';
import { Project, PipelineStage, OpportunityType, ProjectPriority, RFQPackage, SubmittalStatus } from '@/types/crm';
import { formatCurrencySAR } from '@/lib/utils';

interface EditProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedProject: Partial<Project>) => void;
}

export function EditProjectModal({ project, isOpen, onClose, onSaved }: EditProjectModalProps) {
  const { companies, contacts, quotations, updateProject } = useCRM();

  const [prNumber, setPrNumber] = useState('');
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [primaryContactId, setPrimaryContactId] = useState('');
  const [location, setLocation] = useState('Jeddah');
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('tender');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('lead');
  const [priority, setPriority] = useState<ProjectPriority>('high');
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [probability, setProbability] = useState<number>(40);
  const [nextAction, setNextAction] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [coEngineer, setCoEngineer] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [lostReasonError, setLostReasonError] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState('');
  const [collectedPercentage, setCollectedPercentage] = useState<number>(0);
  const [rfqPackages, setRfqPackages] = useState<RFQPackage>('both');
  const [submittalStatus, setSubmittalStatus] = useState<SubmittalStatus>('under_approval');
  const [clientTargetPrice, setClientTargetPrice] = useState<number | ''>('');
  const [lastDiscountPct, setLastDiscountPct] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize fields when project changes
  useEffect(() => {
    if (project && isOpen) {
      setPrNumber(project.pr_number || '');
      setName(project.name || '');
      setCompanyId(project.company_id || '');
      setPrimaryContactId(project.primary_contact_id || '');
      setLocation(project.location || 'Jeddah');
      setOpportunityType(project.opportunity_type || 'tender');
      setPipelineStage(project.pipeline_stage || 'lead');
      setPriority(project.priority || 'high');
      setEstimatedValue(project.estimated_value || 0);
      setProbability(project.probability ?? 40);
      setNextAction(project.next_action || '');
      setNextFollowUpAt(project.next_follow_up_at ? project.next_follow_up_at.split('T')[0] : '');
      setCoEngineer(project.members?.[0]?.user_name || '');
      setInternalNotes(project.internal_notes || '');
      setLostReason(project.lost_reason || '');
      setLostReasonError('');
      setPoNumber(project.po_number || '');
      setPoDate(project.po_date || '');
      setCollectedPercentage(project.collected_percentage || 0);
      setRfqPackages(project.rfq_packages || 'both');
      setSubmittalStatus(project.submittal_status || 'under_approval');
      setClientTargetPrice(project.client_target_price !== undefined ? project.client_target_price : '');
      setLastDiscountPct(project.last_discount_pct !== undefined ? project.last_discount_pct : '');
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const isValueEditable = canEditCommercialValue(pipelineStage);

  // Filter linked quotations for this project to offer 1-click sync
  const projectQuotations = quotations.filter(q => q.project_id === project.id);
  const latestQuotation = projectQuotations.length > 0 
    ? [...projectQuotations].sort((a, b) => b.version - a.version)[0] 
    : null;

  const handleCompanyChange = (newCompId: string) => {
    setCompanyId(newCompId);
    const matchingContact = contacts.find(c => c.company_id === newCompId);
    setPrimaryContactId(matchingContact?.id || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prNumber.trim()) return;

    if (pipelineStage === 'lost' && (!lostReason || !lostReason.trim())) {
      setLostReasonError('سبب الخسارة إجباري عند نقل المشروع لمرحلة صفقة خاسرة (Lost)');
      return;
    }

    setIsSubmitting(true);
    const matchedComp = companies.find(c => c.id === companyId);
    const matchedContact = contacts.find(c => c.id === primaryContactId);

    const members = coEngineer.trim() ? [
      {
        project_id: project.id,
        user_id: 'u2',
        user_name: coEngineer.trim(),
        role: 'co_sales_engineer' as const,
        assigned_at: new Date().toISOString()
      }
    ] : [];

    // Final value logic: if not in quotation stages, value stays 0 or unchanged if previously 0
    const finalValue = isValueEditable ? Number(estimatedValue) : (canEditCommercialValue(project.pipeline_stage) ? project.estimated_value : 0);
    const finalProbability = Number(probability) || 0;
    const finalWeightedValue = (finalValue * finalProbability) / 100;

    const calculatedDiscountAmount = (lastDiscountPct !== '' && finalValue > 0)
      ? Math.round((Number(lastDiscountPct) / 100) * finalValue)
      : (project.last_discount_amount || undefined);

    const updates: Partial<Project> = {
      pr_number: prNumber.trim().toUpperCase(),
      name: name.trim(),
      company_id: companyId,
      company_name: matchedComp?.name,
      primary_contact_id: primaryContactId || undefined,
      primary_contact_name: matchedContact?.full_name,
      primary_contact_phone: matchedContact?.phone,
      location,
      opportunity_type: opportunityType,
      pipeline_stage: pipelineStage,
      rfq_packages: pipelineStage === 'rfq_processing' ? rfqPackages : (project.rfq_packages || rfqPackages),
      submittal_status: pipelineStage === 'technical_submission' ? submittalStatus : (project.submittal_status || submittalStatus),
      client_target_price: clientTargetPrice !== '' ? Number(clientTargetPrice) : undefined,
      last_discount_pct: lastDiscountPct !== '' ? Number(lastDiscountPct) : undefined,
      last_discount_amount: calculatedDiscountAmount,
      lost_reason: pipelineStage === 'lost' ? lostReason.trim() : (pipelineStage === project.pipeline_stage ? project.lost_reason : undefined),
      priority,
      estimated_value: finalValue,
      probability: finalProbability,
      weighted_value: finalWeightedValue,
      next_action: nextAction.trim() || undefined,
      next_follow_up_at: nextFollowUpAt || undefined,
      internal_notes: internalNotes.trim() || undefined,
      members,
      ...(pipelineStage === 'won' ? {
        po_number: poNumber.trim() || undefined,
        po_date: poDate || undefined,
        collected_percentage: Number(collectedPercentage) || 0,
        collected_amount: Math.round(((Number(collectedPercentage) || 0) / 100) * finalValue),
        collection_status: (Number(collectedPercentage) || 0) >= 100 ? 'fully_collected' : (Number(collectedPercentage) || 0) > 0 ? 'partially_collected' : 'pending',
      } : {})
    };

    await updateProject(project.id, updates);
    if (onSaved) onSaved(updates);

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-150">
      <div className="glass-card rounded-3xl max-w-2xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between bg-white/80 dark:bg-[#141820]/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shadow-2xs">
              <Briefcase className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-black text-[#292D32] dark:text-white text-lg font-urbanist">Edit Project Details</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ref: {project.pr_number} &bull; {project.name}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Row 1: PR Number & Project Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Project Code / #PR *
              </label>
              <input
                type="text"
                required
                value={prNumber}
                onChange={e => setPrNumber(e.target.value)}
                placeholder="e.g. PR1004"
                className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Project Title & Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rosemond Hotel MEP Package"
                className="w-full px-3 py-2 text-sm font-semibold bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Row 2: Company & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Company / Contractor / Client *
              </label>
              <select
                required
                value={companyId}
                onChange={e => handleCompanyChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Contact Person
              </label>
              <select
                value={primaryContactId}
                onChange={e => setPrimaryContactId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Contact --</option>
                {contacts
                  .filter(cnt => !companyId || cnt.company_id === companyId)
                  .map(cnt => (
                    <option key={cnt.id} value={cnt.id}>
                      {cnt.full_name} {cnt.job_title ? `(${cnt.job_title})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Row 3: Location, Opportunity Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Location (City)</label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SAUDI_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Opportunity Type</label>
              <select
                value={opportunityType}
                onChange={e => setOpportunityType(e.target.value as OpportunityType)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {OPPORTUNITY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Project Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as ProjectPriority)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {PROJECT_PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Pipeline Stage & Commercial Value Rule */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#141820]/60 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                Pipeline Stage (المرحلة البيعية)
              </label>

              {isValueEditable ? (
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                  <Unlock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Quotation Sent Stage &bull; Value Unlocked</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Pre-Quotation &bull; Value Locked</span>
                </span>
              )}
            </div>

            <select
              value={pipelineStage}
              onChange={e => setPipelineStage(e.target.value as PipelineStage)}
              className="w-full px-3 py-2 text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-800 dark:text-white"
            >
              {PIPELINE_STAGES.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label} {s.value === 'quotation_sent' ? '★ (Quotation Sent)' : ''}
                </option>
              ))}
            </select>

            {/* RFQ Processing Stage Fields: Packages (LC, BMS, Both) */}
            {(pipelineStage === 'rfq_processing' || (pipelineStage as string) === 'pricing') && (
              <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/20 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>حزم وأنظمة التسعير المطلوبة من الـ Pre-Sales:</span>
                  </label>
                  <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold">RFQ Packages</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'lc', label: '⚡ LC', sub: 'تيارات خفيفة (Light Current)' },
                    { id: 'bms', label: '🏢 BMS', sub: 'تحكم مباني (Automation)' },
                    { id: 'both', label: '⚡🏢 LC + BMS', sub: 'كلا النظامين معاً (Both)' },
                  ].map(pkg => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setRfqPackages(pkg.id as RFQPackage)}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        rfqPackages === pkg.id
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs scale-[1.02]'
                          : 'bg-white dark:bg-[#141820] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-sky-400'
                      }`}
                    >
                      <div className="font-extrabold">{pkg.label}</div>
                      <div className={`text-[10px] mt-0.5 truncate ${rfqPackages === pkg.id ? 'text-sky-100 font-semibold' : 'text-slate-400'}`}>
                        {pkg.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quotation Sent Stage Notice & Tracking */}
            {pipelineStage === 'quotation_sent' && (
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/20 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>مرحلة إرسال عرض السعر للعميل (Quotation Sent)</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                    تتبع تلقائي للمدد
                  </span>
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                  يتم احتساب عدد الأيام المنقضية من لحظة نقل المشروع إلى هذه المرحلة مع إرسال تنبيهات تلقائية بعد <strong>3 أيام</strong> و <strong>7 أيام</strong> و <strong>10 أيام</strong> للتذكير بمتابعة المشتريات وإغلاق العرض.
                </p>
              </div>
            )}

            {/* Technical Submittal Stage Fields: Submittal Approval Status */}
            {pipelineStage === 'technical_submission' && (
              <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/20 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>حالة الاعتماد الفني للمواصفات (Technical Submittal):</span>
                  </label>
                  <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold">Approval Status</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'under_approval', label: 'قيد الاعتماد', sub: 'Under Approval', color: 'bg-amber-500 text-white border-amber-600' },
                    { id: 'approved', label: 'معتمد', sub: 'Approved', color: 'bg-emerald-600 text-white border-emerald-600' },
                    { id: 'approved_with_comments', label: 'معتمد بملاحظات', sub: 'Appr. w/ Comments', color: 'bg-blue-600 text-white border-blue-600' },
                    { id: 'rejected', label: 'مرفوض', sub: 'Rejected', color: 'bg-rose-600 text-white border-rose-600' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSubmittalStatus(item.id as SubmittalStatus)}
                      className={`p-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        submittalStatus === item.id
                          ? `${item.color} shadow-xs font-black ring-2 ring-purple-400/40 scale-[1.02]`
                          : 'bg-white dark:bg-[#141820] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-purple-400'
                      }`}
                    >
                      <div className="truncate">{item.label}</div>
                      <div className={`text-[9px] mt-0.5 truncate ${submittalStatus === item.id ? 'opacity-90 font-semibold' : 'text-slate-400'}`}>
                        {item.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Negotiation Stage Fields: Technical Approved Guarantee + Target Price + Latest Discount */}
            {(pipelineStage === 'negotiation' || (pipelineStage as string) === 'technically_approved') && (
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 space-y-3 animate-in fade-in duration-150 font-urbanist">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>مرحلة التفاوض المالي النهائي (Negotiation)</span>
                  </label>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    معتمد فنياً ✅
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Client Target Price (السعر المستهدف للعميل - ر.س)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={clientTargetPrice}
                      onChange={e => setClientTargetPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 1840000"
                      className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-rose-600" />
                      <span>Latest Discount Sent (آخر نسبة خصم مرسلة %)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={lastDiscountPct}
                        onChange={e => setLastDiscountPct(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 8"
                        className="w-24 px-3 py-2 text-xs font-bold bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                      <div className="flex-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {lastDiscountPct !== '' && estimatedValue > 0 ? (
                          <span>قيمة الخصم: <strong className="text-rose-600 dark:text-rose-400 font-mono">{formatCurrencySAR(Math.round((Number(lastDiscountPct) / 100) * Number(estimatedValue)))}</strong></span>
                        ) : (
                          <span>ستظهر بوضوح على كارت المشروع</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {pipelineStage === 'lost' && (
              <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>سبب خسارة المشروع (إجباري) *</span>
                  </label>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
                    Mandatory
                  </span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={lostReason}
                  onChange={e => {
                    setLostReason(e.target.value);
                    if (lostReasonError) setLostReasonError('');
                  }}
                  placeholder="حدد سبب خسارة الصفقة بالتفصيل، اسم المنافس، فارق السعر، أو أسباب الاستشاري..."
                  className={`w-full px-3 py-2 text-xs bg-white dark:bg-[#141820] border rounded-lg focus:outline-none focus:ring-2 text-slate-900 dark:text-white font-medium ${
                    lostReasonError
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-rose-300 dark:border-rose-800 focus:ring-rose-500/20 focus:border-rose-500'
                  }`}
                />
                {lostReasonError && (
                  <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    {lostReasonError}
                  </p>
                )}
              </div>
            )}

            {/* Won Stage Fields: PO & Collection Ratio */}
            {pipelineStage === 'won' && (
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-3 font-urbanist">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                    Purchase Order (PO) &amp; Collection (مرحلة الفوز بالتعميد)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PO Number (رقم أمر الشراء)
                    </label>
                    <input
                      type="text"
                      value={poNumber}
                      onChange={e => setPoNumber(e.target.value)}
                      placeholder="PO-2026-..."
                      className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PO Date (تاريخ التعميد)
                    </label>
                    <input
                      type="date"
                      value={poDate}
                      onChange={e => setPoDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Collected Ratio (نسبة التحصيل %)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={collectedPercentage}
                      onChange={e => setCollectedPercentage(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Estimated Value Box with Conditional Unlocking */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-[#8FC2F0]" />
                      <span>Estimated Value (SAR)</span>
                    </label>
                    {isValueEditable && latestQuotation && (
                      <button
                        type="button"
                        onClick={() => setEstimatedValue(latestQuotation.amount)}
                        className="text-[10px] font-bold text-blue-600 dark:text-[#8FC2F0] hover:underline"
                        title="Fill with latest quote"
                      >
                        Sync Quote ({formatCurrencySAR(latestQuotation.amount)})
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      disabled={!isValueEditable}
                      value={isValueEditable ? estimatedValue : 0}
                      onChange={e => setEstimatedValue(Number(e.target.value))}
                      className={`w-full px-3 py-2 text-sm font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isValueEditable
                          ? 'bg-white dark:bg-[#141820] border-blue-300 dark:border-blue-700 text-slate-900 dark:text-white'
                          : 'bg-slate-100 dark:bg-[#10141a] border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      }`}
                      placeholder={isValueEditable ? "e.g. 250000" : "Unlocked in Quotation Sent stage"}
                    />
                    {!isValueEditable && (
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {/* Value Rule Explanation */}
                  {!isValueEditable ? (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1.5 flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        قبل مرحلة <strong>Quotation Sent</strong> لا يوجد عرض سعر رسمي معتمد، لذا يتم تفعيل خانة السعر بمجرد وصول المشروع لمرحلة <strong>Quotation Sent</strong> وما بعدها.
                      </span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>تم تفعيل خانة السعر (المشروع في مرحلة تقديم العرض التجاري وما بعدها).</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Win Probability (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={probability}
                      onChange={e => setProbability(Number(e.target.value))}
                      className="w-24 px-3 py-2 text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white bg-white dark:bg-[#141820]"
                    />
                    <div className="flex-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Weighted: <strong className="text-blue-600 dark:text-[#8FC2F0]">{formatCurrencySAR((Number(estimatedValue) * Number(probability)) / 100)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Next Action & Follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Next Strategic Action (الإجراء القادم)
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={e => setNextAction(e.target.value)}
                placeholder="e.g. Follow up with Procurement on commercial revision"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Next Follow-Up Date (تاريخ المتابعة)
              </label>
              <input
                type="date"
                value={nextFollowUpAt}
                onChange={e => setNextFollowUpAt(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 6: Co-Sales Engineer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Co-Sales Engineer (مهندس المبيعات المساعد)
            </label>
            <input
              type="text"
              value={coEngineer}
              onChange={e => setCoEngineer(e.target.value)}
              placeholder="e.g. Ahmed Mahmoud"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Row 7: Internal Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Internal Notes & Specifications (ملاحظات ومواصفات المشروع)
            </label>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={e => setInternalNotes(e.target.value)}
              placeholder="Specifications, client requirements, vendor brands involved..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1C2130] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white dark:text-[#141820] bg-[#292D32] hover:bg-[#1E2124] dark:bg-[#8FC2F0] dark:hover:bg-[#7ab2e3] rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Project Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
