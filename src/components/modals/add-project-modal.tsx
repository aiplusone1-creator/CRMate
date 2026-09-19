'use client';

import React, { useState } from 'react';
import { X, Building2, Plus, Sparkles, FolderKanban } from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { SAUDI_LOCATIONS, PIPELINE_STAGES, OPPORTUNITY_TYPES } from '@/lib/constants';
import { PipelineStage, OpportunityType, ProjectPriority } from '@/types/crm';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCompanyId?: string;
}

export function AddProjectModal({ isOpen, onClose, defaultCompanyId }: AddProjectModalProps) {
  const { companies, contacts, addProject } = useCRM();

  const [prNumber, setPrNumber] = useState('');
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState(defaultCompanyId || companies[0]?.id || '');

  React.useEffect(() => {
    if (defaultCompanyId) {
      setCompanyId(defaultCompanyId);
    } else if (companies[0]?.id && !companyId) {
      setCompanyId(companies[0]?.id);
    }
  }, [defaultCompanyId, companies, isOpen]);
  const [primaryContactId, setPrimaryContactId] = useState('');
  const [location, setLocation] = useState('Jeddah');
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('tender');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('lead');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [probability, setProbability] = useState('40');
  const [priority, setPriority] = useState<ProjectPriority>('high');
  const [nextAction, setNextAction] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prNumber.trim()) return;

    setIsSubmitting(true);
    const selectedCompany = companies.find(c => c.id === companyId);
    const selectedContact = contacts.find(c => c.id === primaryContactId);
    const val = parseFloat(estimatedValue) || 0;
    const prob = parseInt(probability, 10) || 40;

    await addProject({
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
      priority,
      estimated_value: val,
      probability: prob,
      owner_id: 'u1',
      owner_name: 'Eslam Mohandes',
      next_action: nextAction.trim() || undefined,
      next_follow_up_at: nextFollowUpDate || undefined,
      last_activity_at: new Date().toISOString().split('T')[0],
    });

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

            <div className="col-span-2">
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Project Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. King Salman Park District Cool Valves Package"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white font-medium shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Client / Company *</label>
              <select
                required
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
              >
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
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#292D32] hover:bg-[#1E2124] dark:bg-[#8FC2F0] dark:hover:bg-[#7ab2e3] text-white dark:text-[#141820] font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
