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
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { 
  SAUDI_LOCATIONS, 
  PIPELINE_STAGES, 
  OPPORTUNITY_TYPES, 
  PROJECT_PRIORITIES,
  canEditCommercialValue
} from '@/lib/constants';
import { Project, PipelineStage, OpportunityType, ProjectPriority } from '@/types/crm';
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
      priority,
      estimated_value: finalValue,
      probability: finalProbability,
      weighted_value: finalWeightedValue,
      next_action: nextAction.trim() || undefined,
      next_follow_up_at: nextFollowUpAt || undefined,
      internal_notes: internalNotes.trim() || undefined,
      members,
    };

    await updateProject(project.id, updates);
    if (onSaved) onSaved(updates);

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-150">
      <div className="glass-card bg-white/95 rounded-3xl max-w-2xl w-full max-h-[92vh] shadow-2xl border border-white/90 flex flex-col overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100/80 flex items-center justify-between bg-white/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] flex items-center justify-center shadow-2xs">
              <Briefcase className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-black text-[#292D32] text-lg font-urbanist">Edit Project Details</h2>
              <p className="text-xs text-slate-500 font-medium">Ref: {project.pr_number} &bull; {project.name}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-[#292D32] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Row 1: PR Number & Project Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Code / #PR *
              </label>
              <input
                type="text"
                required
                value={prNumber}
                onChange={e => setPrNumber(e.target.value)}
                placeholder="e.g. PR1004"
                className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Title & Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rosemond Hotel MEP Package"
                className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Company & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company / Contractor / Client *
              </label>
              <select
                required
                value={companyId}
                onChange={e => handleCompanyChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Contact Person
              </label>
              <select
                value={primaryContactId}
                onChange={e => setPrimaryContactId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Location (City)</label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SAUDI_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Opportunity Type</label>
              <select
                value={opportunityType}
                onChange={e => setOpportunityType(e.target.value as OpportunityType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {OPPORTUNITY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as ProjectPriority)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {PROJECT_PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Pipeline Stage & Commercial Value Rule */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-900">
                Pipeline Stage (المرحلة البيعية)
              </label>

              {isValueEditable ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                  <Unlock className="w-3 h-3 text-emerald-600" />
                  <span>Quotation Sent Stage &bull; Value Unlocked</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Pre-Quotation &bull; Value Locked</span>
                </span>
              )}
            </div>

            <select
              value={pipelineStage}
              onChange={e => setPipelineStage(e.target.value as PipelineStage)}
              className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {PIPELINE_STAGES.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label} {s.value === 'quotation_sent' ? '★ (Quotation Sent)' : ''}
                </option>
              ))}
            </select>

            {/* Estimated Value Box with Conditional Unlocking */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                      <span>Estimated Value (SAR)</span>
                    </label>
                    {isValueEditable && latestQuotation && (
                      <button
                        type="button"
                        onClick={() => setEstimatedValue(latestQuotation.amount)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
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
                          ? 'bg-white border-blue-300 text-slate-900'
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      placeholder={isValueEditable ? "e.g. 250000" : "Unlocked in Quotation Sent stage"}
                    />
                    {!isValueEditable && (
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {/* Value Rule Explanation */}
                  {!isValueEditable ? (
                    <p className="text-[11px] text-amber-700 mt-1.5 flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        قبل مرحلة <strong>Quotation Sent</strong> لا يوجد عرض سعر رسمي معتمد، لذا يتم تفعيل خانة السعر بمجرد وصول المشروع لمرحلة <strong>Quotation Sent</strong> وما بعدها.
                      </span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-700 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>تم تفعيل خانة السعر (المشروع في مرحلة تقديم العرض التجاري وما بعدها).</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Win Probability (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={probability}
                      onChange={e => setProbability(Number(e.target.value))}
                      className="w-24 px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                    />
                    <div className="flex-1 text-xs text-slate-500 font-medium">
                      Weighted: <strong className="text-blue-600">{formatCurrencySAR((Number(estimatedValue) * Number(probability)) / 100)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Next Action & Follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Next Strategic Action (الإجراء القادم)
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={e => setNextAction(e.target.value)}
                placeholder="e.g. Follow up with Procurement on commercial revision"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Next Follow-Up Date (تاريخ المتابعة)
              </label>
              <input
                type="date"
                value={nextFollowUpAt}
                onChange={e => setNextFollowUpAt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 6: Co-Sales Engineer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Co-Sales Engineer (مهندس المبيعات المساعد)
            </label>
            <input
              type="text"
              value={coEngineer}
              onChange={e => setCoEngineer(e.target.value)}
              placeholder="e.g. Ahmed Mahmoud"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Row 7: Internal Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Internal Notes & Specifications (ملاحظات ومواصفات المشروع)
            </label>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={e => setInternalNotes(e.target.value)}
              placeholder="Specifications, client requirements, vendor brands involved..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#292D32] hover:bg-[#1E2124] rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Project Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
