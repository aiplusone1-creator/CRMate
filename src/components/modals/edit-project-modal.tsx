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
  Target,
  Users,
  Check,
  Star,
  Plus
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
import { formatCurrencySAR, formatDateString, cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/language-context';
import { ProjectSystemsMultiSelect } from '@/components/projects/project-systems-select';

interface EditProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedProject: Partial<Project>) => void;
}

export function EditProjectModal({ project, isOpen, onClose, onSaved }: EditProjectModalProps) {
  const { isRTL } = useLanguage();
  const { companies, contacts, quotations, updateProject, addCompany } = useCRM();

  const [createdAtDate, setCreatedAtDate] = useState('');
  const [prNumber, setPrNumber] = useState('');
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [primaryContactId, setPrimaryContactId] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [location, setLocation] = useState('Jeddah');
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('tender');
  const [closingDate, setClosingDate] = useState('');
  const [closingDateError, setClosingDateError] = useState('');
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
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [submittalStatus, setSubmittalStatus] = useState<SubmittalStatus>('under_approval');
  const [clientTargetPrice, setClientTargetPrice] = useState<number | ''>('');
  const [lastDiscountPct, setLastDiscountPct] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consultant state
  const [consultantId, setConsultantId] = useState('');
  const [isFastConsultantOpen, setIsFastConsultantOpen] = useState(false);
  const [fastConsultantName, setFastConsultantName] = useState('');
  const [fastConsultantCity, setFastConsultantCity] = useState('Jeddah');
  const [fastConsultantPhone, setFastConsultantPhone] = useState('');

  const consultantCompanies = React.useMemo(() => {
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

  // Initialize fields when project changes
  useEffect(() => {
    if (project && isOpen) {
      setCreatedAtDate(project.created_at ? project.created_at.split('T')[0] : '');
      setPrNumber(project.pr_number || '');
      setName(project.name || '');
      setCompanyId(project.company_id || '');
      setConsultantId(project.consultant_id || '');
      const initContactIds = project.contact_ids && project.contact_ids.length > 0 
        ? project.contact_ids 
        : (project.primary_contact_id ? [project.primary_contact_id] : []);
      setSelectedContactIds(initContactIds);
      setPrimaryContactId(project.primary_contact_id || initContactIds[0] || '');
      setLocation(project.location || 'Jeddah');
      setOpportunityType(project.opportunity_type || 'tender');
      setClosingDate(project.closing_date || project.expected_award_date || '');
      setClosingDateError('');
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
      const initSystems = project.systems && project.systems.length > 0 
        ? project.systems 
        : (project.rfq_packages === 'lc' ? ['Lighting Control'] : project.rfq_packages === 'bms' ? ['BMS / BAS'] : project.rfq_packages === 'both' ? ['BMS / BAS', 'Lighting Control'] : []);
      setSelectedSystems(initSystems);
      setSubmittalStatus(project.submittal_status || 'under_approval');
      setClientTargetPrice(project.client_target_price !== undefined ? project.client_target_price : '');
      setLastDiscountPct(project.last_discount_pct !== undefined ? project.last_discount_pct : '');
    }
  }, [project, isOpen]);

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

  if (!isOpen || !project) return null;

  const isValueEditable = canEditCommercialValue(pipelineStage);

  // Filter linked quotations for this project to offer 1-click sync
  const projectQuotations = quotations.filter(q => q.project_id === project.id);
  const latestQuotation = projectQuotations.length > 0 
    ? [...projectQuotations].sort((a, b) => b.version - a.version)[0] 
    : null;

  const handleCompanyChange = (newCompId: string) => {
    setCompanyId(newCompId);
    const matchingContacts = contacts.filter(c => c.company_id === newCompId);
    if (matchingContacts.length > 0) {
      setSelectedContactIds([matchingContacts[0].id]);
      setPrimaryContactId(matchingContacts[0].id);
    } else {
      setSelectedContactIds([]);
      setPrimaryContactId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prNumber.trim()) return;

    if (pipelineStage === 'lost' && (!lostReason || !lostReason.trim())) {
      setLostReasonError('سبب الخسارة إجباري عند نقل المشروع لمرحلة صفقة خاسرة (Lost)');
      return;
    }

    if (opportunityType === 'in_hand' && !closingDate.trim()) {
      setClosingDateError(isRTL ? 'تاريخ الإغلاق المتوقع (Closing Date) إلزامي لكافة مشاريع In Hand' : 'Closing Date is mandatory for In Hand projects');
      return;
    }

    setIsSubmitting(true);
    const matchedComp = companies.find(c => c.id === companyId);
    const effectivePrimaryId = primaryContactId || selectedContactIds[0];
    const matchedContact = contacts.find(c => c.id === effectivePrimaryId);

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

    const selectedDateTime = createdAtDate 
      ? new Date(createdAtDate + 'T' + (project.created_at?.split('T')[1] || '12:00:00Z')).toISOString()
      : project.created_at;

    const updates: Partial<Project> = {
      name: name.trim(),
      created_at: selectedDateTime,
      company_id: companyId,
      company_name: matchedComp?.name,
      consultant_id: consultantId || undefined,
      consultant_name: companies.find(c => c.id === consultantId)?.name,
      primary_contact_id: effectivePrimaryId || undefined,
      primary_contact_name: matchedContact?.full_name,
      primary_contact_phone: matchedContact?.phone,
      contact_ids: selectedContactIds,
      location,
      opportunity_type: opportunityType,
      closing_date: closingDate.trim() || undefined,
      pipeline_stage: pipelineStage,
      systems: selectedSystems,
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 z-50 animate-in fade-in duration-150">
      <div className="glass-card rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between bg-white/80 dark:bg-[#141820]/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shadow-2xs">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <div>
              <h2 className="font-black text-[#292D32] dark:text-white text-base sm:text-lg font-urbanist">Edit Project Details</h2>
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
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-4 flex-1">
          
          {/* Row 1: Project Date, PR Number & Project Name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Project Date *</span>
              </label>
              <input
                type="date"
                required
                value={createdAtDate}
                onChange={e => setCreatedAtDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Project Code / #PR</span>
                <span className="text-[10px] text-slate-400 font-normal">Locked</span>
              </label>
              <div 
                title="Project PR numbers are immutable once created"
                className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-100 dark:bg-slate-800/60 border border-slate-300/80 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 flex items-center justify-between cursor-not-allowed select-none"
              >
                <span>{project?.pr_number || prNumber}</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-[#8FC2F0]" />
                  <span>Key Contacts (المسؤولون المعنيون)</span>
                  {selectedContactIds.length > 0 && (
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-800">
                      {selectedContactIds.length}
                    </span>
                  )}
                </label>
              </div>

              {(() => {
                const availableContacts = contacts.filter(cnt => !companyId || cnt.company_id === companyId);
                if (availableContacts.length === 0) {
                  return (
                    <div className="p-3 text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-center bg-slate-50/50 dark:bg-[#141820]/40">
                      No contacts registered for this company yet.
                    </div>
                  );
                }

                return (
                  <div className="space-y-1.5">
                    <div className="max-h-36 overflow-y-auto p-2 bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg space-y-1.5 shadow-2xs">
                      {availableContacts.map(cnt => {
                        const isSelected = selectedContactIds.includes(cnt.id);
                        const isPrimary = (primaryContactId || selectedContactIds[0]) === cnt.id;
                        return (
                          <div
                            key={cnt.id}
                            onClick={() => toggleContactSelection(cnt.id)}
                            className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-2xs'
                                : 'bg-white/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                                {cnt.full_name?.charAt(0) || 'C'}
                              </div>
                              <div className="min-w-0 truncate">
                                <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                  {cnt.full_name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {cnt.job_title || 'Contact'} {cnt.phone ? `• ${cnt.phone}` : ''}
                                </div>
                              </div>
                            </div>

                            {isSelected && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPrimaryContactId(cnt.id);
                                }}
                                title="Set as primary contact"
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-all ${
                                  isPrimary
                                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs'
                                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                }`}
                              >
                                <Star className={`w-3 h-3 ${isPrimary ? 'fill-amber-500 text-amber-500' : ''}`} />
                                <span>{isPrimary ? 'Primary' : 'Make Primary'}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
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
                    "w-full px-3 py-2 text-sm bg-white dark:bg-[#141820] border rounded-lg font-medium text-slate-800 dark:text-white shadow-2xs focus:outline-none focus:ring-2 font-mono",
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

            {/* Project Systems Multi-Select Dropdown */}
            <div className="p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-[#8FC2F0] shrink-0" />
                  <span>أنظمة المشروع (Systems Scope):</span>
                </label>
                <span className="text-[10px] text-blue-600 dark:text-[#8FC2F0] font-bold">
                  {selectedSystems.length} أنظمة محددة
                </span>
              </div>
              <ProjectSystemsMultiSelect
                selectedSystems={selectedSystems}
                onChange={setSelectedSystems}
                placeholder="اختر أنظمة المشروع من القائمة (21 نظام)..."
              />
            </div>

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
                      <div className={`text-[10px] mt-0.5 truncate ${submittalStatus === item.id ? 'opacity-90 font-semibold' : 'text-slate-400'}`}>
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
