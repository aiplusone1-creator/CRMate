'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  Building2, 
  Briefcase, 
  Users, 
  MapPin, 
  Phone, 
  ExternalLink, 
  MessageCircle, 
  Flame, 
  Plus, 
  Clock, 
  FileText, 
  Globe, 
  CheckCircle2, 
  TrendingUp, 
  Edit,
  Activity as ActivityIcon,
  Search
} from 'lucide-react';
import { Company } from '@/types/crm';
import { useCRM } from '@/lib/store/crm-context';
import { COMPANY_TYPES, PIPELINE_STAGES, PROJECT_PRIORITIES } from '@/lib/constants';
import { formatCurrencySAR, formatDateString, normalizePhoneNumber } from '@/lib/utils';

interface CompanyDetailModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onEditCompany?: (company: Company) => void;
  onAddProject?: (companyId: string) => void;
  onAddContact?: (companyId: string) => void;
  initialTab?: 'projects' | 'contacts' | 'activities' | 'overview';
}

export function CompanyDetailModal({
  company,
  isOpen,
  onClose,
  onEditCompany,
  onAddProject,
  onAddContact,
  initialTab = 'projects'
}: CompanyDetailModalProps) {
  const { projects, contacts, activities, openFastLog, currentRole } = useCRM();
  const [activeTab, setActiveTab] = useState<'projects' | 'contacts' | 'activities' | 'overview'>(initialTab);
  const [contactSearch, setContactSearch] = useState<string>('');

  // Sync tab if initialTab changes when opening
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
      setContactSearch('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen || !company) return null;

  // Filter linked data
  const linkedProjects = projects.filter(p => p.company_id === company.id);
  const linkedContacts = contacts.filter(cnt => cnt.company_id === company.id);
  
  // Filter contacts by contactSearch (supports full_name, job_title / position, phone, notes)
  const displayedContacts = linkedContacts.filter(cnt => {
    if (!contactSearch.trim()) return true;
    const term = contactSearch.toLowerCase();
    return cnt.full_name.toLowerCase().includes(term) ||
           (cnt.job_title && cnt.job_title.toLowerCase().includes(term)) ||
           (cnt.phone && cnt.phone.includes(term)) ||
           (cnt.email && cnt.email.toLowerCase().includes(term)) ||
           (cnt.notes && cnt.notes.toLowerCase().includes(term));
  });
  const linkedContactIds = new Set(linkedContacts.map(c => c.id));
  const linkedProjectIds = new Set(linkedProjects.map(p => p.id));
  const linkedActivities = activities.filter(
    a => a.company_id === company.id || 
         (a.contact_id && linkedContactIds.has(a.contact_id)) ||
         (a.project_id && linkedProjectIds.has(a.project_id))
  ).sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime());

  // Aggregate metrics
  const totalPipelineValue = linkedProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
  const wonProjects = linkedProjects.filter(p => p.pipeline_stage === 'won');
  const wonValue = wonProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
  const hotContactsCount = linkedContacts.filter(c => c.is_hot_lead).length;

  const typeConfig = COMPANY_TYPES.find(t => t.value === company.company_type);

  // Google Maps URL fallback
  const mapsUrl = company.google_maps_url || 
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${company.name} ${company.city || 'Jeddah'} Saudi Arabia`)}`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200">
      <div className="glass-card rounded-3xl max-w-4xl w-full max-h-[92vh] shadow-2xl border border-white/90 dark:border-[#8FC2F0]/20 flex flex-col overflow-hidden backdrop-blur-2xl">
        
        {/* CRMate Frosted Header */}
        <div className="px-6 py-5 bg-white/40 dark:bg-[#232A38]/70 backdrop-blur-md border-b border-slate-100/80 dark:border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="w-11 h-11 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shrink-0 shadow-2xs">
                  <Building2 className="w-6 h-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-[#292D32] dark:text-white tracking-tight font-urbanist">
                      {company.name}
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] border border-[#8FC2F0]/40">
                      {typeConfig?.label || company.company_type}
                    </span>
                    {company.city && (
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1 bg-slate-100 dark:bg-[#141820] px-2.5 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3 text-red-500" />
                        {company.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center gap-2 mt-3.5 text-xs flex-wrap">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#77CE69]/15 hover:bg-[#77CE69]/25 text-[#1b4d1b] dark:text-[#77CE69] border border-[#77CE69]/30 font-bold transition-all shadow-2xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#77CE69]" />
                  <span>Google Maps Location ↗</span>
                </a>

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-[#141820] hover:bg-slate-200/80 dark:hover:bg-slate-800 text-[#292D32] dark:text-white border border-slate-200/80 dark:border-slate-700 font-bold transition-all"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>Website ↗</span>
                  </a>
                )}

                {onEditCompany && currentRole !== 'viewer' && (
                  <button
                    onClick={() => onEditCompany(company)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-[#141820] hover:bg-slate-200/80 dark:hover:bg-slate-800 text-[#292D32] dark:text-white border border-slate-200/80 dark:border-slate-700 font-bold transition-all cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Company</span>
                  </button>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CRMate Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="glass-card rounded-2xl p-3 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-lg bg-[#8FC2F0]/20 flex items-center justify-center text-[#292D32] dark:text-[#8FC2F0]">
                  <Briefcase className="w-3 h-3" />
                </span>
                Active Projects
              </div>
              <div className="text-xl font-black text-[#292D32] dark:text-white mt-1 font-urbanist">
                {linkedProjects.length}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-lg bg-[#77CE69]/20 flex items-center justify-center text-[#1b4d1b] dark:text-[#77CE69]">
                  <TrendingUp className="w-3 h-3" />
                </span>
                Total Portfolio
              </div>
              <div className="text-xl font-black text-[#292D32] dark:text-white mt-1 font-urbanist">
                {formatCurrencySAR(totalPipelineValue)}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-lg bg-[#8FC2F0]/20 flex items-center justify-center text-[#292D32] dark:text-[#8FC2F0]">
                  <Users className="w-3 h-3" />
                </span>
                Key Contacts
              </div>
              <div className="text-xl font-black text-[#292D32] dark:text-white mt-1 flex items-center gap-1.5 font-urbanist">
                <span>{linkedContacts.length}</span>
                {hotContactsCount > 0 && (
                  <span className="text-xs text-amber-500 font-bold flex items-center gap-0.5">
                    ({hotContactsCount} 🔥)
                  </span>
                )}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-lg bg-[#77CE69]/20 flex items-center justify-center text-[#1b4d1b] dark:text-[#77CE69]">
                  <CheckCircle2 className="w-3 h-3" />
                </span>
                Won Value
              </div>
              <div className="text-xl font-black text-[#77CE69] mt-1 font-urbanist">
                {formatCurrencySAR(wonValue)}
              </div>
            </div>
          </div>
        </div>

        {/* CRMate Navigation Tabs */}
        <div className="px-6 py-2 bg-slate-100/70 dark:bg-[#141820]/70 border-b border-slate-200/70 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-[#292D32] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Projects ({linkedProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'contacts'
                ? 'bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-[#292D32] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts & People ({linkedContacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'activities'
                ? 'bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-[#292D32] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
            }`}
          >
            <ActivityIcon className="w-3.5 h-3.5" />
            <span>Interactions ({linkedActivities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-[#292D32] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Company Profile</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#EFF3F8]/30">
          
          {/* TAB 1: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-[#292D32] text-base flex items-center gap-2">
                  <span>Projects Linked with {company.name}</span>
                  <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    {linkedProjects.length}
                  </span>
                </h3>

                {onAddProject && currentRole !== 'viewer' && (
                  <button
                    onClick={() => onAddProject(company.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#292D32] hover:bg-[#1E2124] rounded-xl shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Project</span>
                  </button>
                )}
              </div>

              {linkedProjects.length === 0 ? (
                <div className="glass-card bg-white/80 p-10 rounded-2xl border border-white/90 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-[#292D32] text-base font-urbanist">No Projects Found</h4>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    There are no commercial projects currently linked with this account. You can create a new project and assign it to {company.name}.
                  </p>
                  {onAddProject && currentRole !== 'viewer' && (
                    <button
                      onClick={() => onAddProject(company.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#292D32] hover:bg-[#1E2124] rounded-xl transition-colors mt-2 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Project for {company.name}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {linkedProjects.map(proj => {
                    const stage = PIPELINE_STAGES.find(s => s.value === proj.pipeline_stage);
                    const priority = PROJECT_PRIORITIES.find(p => p.value === proj.priority);

                    return (
                      <div
                        key={proj.id}
                        className="glass-card bg-white/90 p-4 rounded-2xl border border-white/90 shadow-2xs hover:border-[#8FC2F0]/50 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Top row: PR Number & Stage */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200/70">
                              {proj.pr_number}
                            </span>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${stage?.badgeClass || 'bg-slate-100 text-slate-700'}`}>
                              {stage?.label || proj.pipeline_stage}
                            </span>
                          </div>

                          {/* Project Name (Clickable link to Cockpit) */}
                          <Link
                            href={`/projects/${proj.id}`}
                            className="font-black text-[#292D32] text-base hover:text-[#8FC2F0] transition-colors block line-clamp-2 mt-1 font-urbanist"
                          >
                            {proj.name}
                          </Link>

                          {/* Value and Priority */}
                          <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-100 text-xs flex-wrap">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Estimated Value</span>
                              <span className="font-black text-[#292D32] text-sm font-urbanist">
                                {formatCurrencySAR(proj.estimated_value)}
                              </span>
                            </div>

                            <div className="ml-auto text-right">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Priority</span>
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg ${priority?.badgeClass || 'bg-slate-100 text-slate-700'}`}>
                                {priority?.label || proj.priority}
                              </span>
                            </div>
                          </div>

                          {/* Location & Follow Up info */}
                          <div className="mt-2.5 text-xs text-slate-500 space-y-1">
                            {proj.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{proj.location}</span>
                              </div>
                            )}
                            {proj.next_action && (
                              <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 text-amber-900 text-[11px]">
                                <span className="font-bold">Next Action:</span> {proj.next_action}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom action */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {proj.expected_award_date ? `Award: ${formatDateString(proj.expected_award_date)}` : 'In Pipeline'}
                          </span>

                          <Link
                            href={`/projects/${proj.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#292D32] bg-[#8FC2F0]/20 hover:bg-[#8FC2F0]/35 transition-colors"
                          >
                            <span>Open Project Cockpit</span>
                            <ExternalLink className="w-3 h-3 text-[#292D32]" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONTACTS & TEAM (Direct WhatsApp & Call) */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-[#292D32] text-base flex items-center gap-2">
                    <span>Key Contacts & Stakeholders at {company.name}</span>
                    <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {linkedContacts.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click the WhatsApp button to chat instantly, or Call to dial directly.
                  </p>
                </div>

                {onAddContact && currentRole !== 'viewer' && (
                  <button
                    onClick={() => onAddContact(company.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#292D32] hover:bg-[#1E2124] rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Contact</span>
                  </button>
                )}
              </div>

              {/* Contacts Search Bar inside Company Cockpit */}
              {linkedContacts.length > 0 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search contacts by name, title / position, phone, or notes..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/90 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:bg-white text-slate-800 placeholder:text-slate-400 font-medium transition-all shadow-2xs"
                  />
                  {contactSearch && (
                    <button
                      onClick={() => setContactSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              {linkedContacts.length === 0 ? (
                <div className="glass-card bg-white/80 p-10 rounded-2xl border border-white/90 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-[#292D32] text-base font-urbanist">No Contacts Listed</h4>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    No individual contact persons have been registered for {company.name} yet.
                  </p>
                  {onAddContact && currentRole !== 'viewer' && (
                    <button
                      onClick={() => onAddContact(company.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#292D32] hover:bg-[#1E2124] rounded-xl transition-colors mt-2 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add First Contact</span>
                    </button>
                  )}
                </div>
              ) : displayedContacts.length === 0 ? (
                <div className="glass-card bg-white/80 p-8 rounded-2xl border border-white/90 text-center text-xs text-slate-500">
                  No contacts found matching &quot;{contactSearch}&quot;.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedContacts.map(cnt => {
                    const cleanPhone = normalizePhoneNumber(cnt.phone);
                    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

                    return (
                      <div
                        key={cnt.id}
                        className="glass-card bg-white/90 p-4 rounded-2xl border border-white/90 shadow-2xs hover:border-[#8FC2F0]/50 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Header: Name & Hot Lead */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-black text-[#292D32] text-base leading-snug font-urbanist">
                                  {cnt.full_name}
                                </h4>
                                {cnt.is_hot_lead && (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 border border-amber-500/30">
                                    <Flame className="w-3 h-3 fill-amber-500 text-amber-600" />
                                    HOT LEAD
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-[#8FC2F0] mt-0.5">
                                {cnt.job_title || 'Sales & Project Contact'}
                              </p>
                            </div>
                          </div>

                          {/* Phone & Info Details */}
                          <div className="mt-3.5 space-y-1.5 text-xs">
                            {cnt.phone ? (
                              <div className="flex items-center gap-2 text-slate-700 font-medium">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-mono text-xs">{cnt.phone}</span>
                              </div>
                            ) : (
                              <div className="text-slate-400 italic text-[11px]">No direct phone recorded</div>
                            )}

                            {cnt.email && (
                              <div className="flex items-center gap-2 text-slate-600 truncate">
                                <span className="text-slate-400 font-bold shrink-0">@</span>
                                <a href={`mailto:${cnt.email}`} className="text-[#292D32] hover:text-[#8FC2F0] underline truncate">
                                  {cnt.email}
                                </a>
                              </div>
                            )}

                            {cnt.notes && (
                              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 mt-2 text-xs text-slate-700">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                  Notes &amp; Activity Log:
                                </span>
                                <p className="text-[11px] leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto font-medium text-slate-800">
                                  {cnt.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons: 1-Click WhatsApp, Call & Fast Log */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                          {waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black text-white bg-[#77CE69] hover:bg-[#68bb5a] active:bg-[#5aa84d] shadow-xs transition-all"
                              title={`Chat with ${cnt.full_name} on WhatsApp`}
                            >
                              <MessageCircle className="w-4 h-4 fill-white" />
                              <span>WhatsApp</span>
                            </a>
                          ) : (
                            <button
                              disabled
                              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 cursor-not-allowed"
                            >
                              No WhatsApp
                            </button>
                          )}

                          {cleanPhone && (
                            <a
                              href={`tel:${cnt.phone}`}
                              className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold text-[#292D32] bg-slate-100 hover:bg-slate-200 transition-colors"
                              title={`Call ${cnt.full_name}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Call</span>
                            </a>
                          )}

                          <button
                            onClick={() => openFastLog({ 
                              contactId: cnt.id,
                              project: linkedProjects[0] || null
                            })}
                            className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold text-[#292D32] bg-slate-100 hover:bg-slate-200 transition-colors"
                            title="Log Activity with this contact"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Log</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVITIES HISTORY */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <h3 className="font-bold text-[#292D32] text-base flex items-center gap-2">
                <span>Recent Interactions with {company.name}</span>
                <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {linkedActivities.length}
                </span>
              </h3>

              {linkedActivities.length === 0 ? (
                <div className="glass-card bg-white/80 p-10 rounded-2xl border border-white/90 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-[#292D32] text-base font-urbanist">No Activities Recorded</h4>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    No calls, meetings, or site visits have been logged with this company yet.
                  </p>
                  <button
                    onClick={() => openFastLog({ project: linkedProjects[0] || null })}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#292D32] hover:bg-[#1E2124] rounded-xl transition-colors mt-2 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log First Interaction</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedActivities.map(act => (
                    <div
                      key={act.id}
                      className="glass-card bg-white/90 p-4 rounded-2xl border border-white/90 shadow-2xs flex items-start justify-between gap-4 hover:shadow-md transition-all"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#8FC2F0]/20 text-[#292D32] uppercase">
                            {act.channel}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                            {act.visit_purpose}
                          </span>
                          {act.outcome && (
                            <span className="text-xs font-bold text-[#1b4d1b] bg-[#77CE69]/20 px-2 py-0.5 rounded-lg">
                              {act.outcome}
                            </span>
                          )}
                        </div>

                        {act.notes && (
                          <p className="text-xs text-slate-700 mt-1 font-medium">
                            {act.notes}
                          </p>
                        )}

                        <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1">
                          {act.contact_name && (
                            <span>With: <strong className="text-slate-700">{act.contact_name}</strong></span>
                          )}
                          {act.project_name && (
                            <span>• Project: <strong className="text-slate-700">{act.project_name}</strong></span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-600 font-urbanist">
                          {formatDateString(act.activity_date)}
                        </span>
                        {act.activity_time && (
                          <div className="text-[10px] text-slate-400 font-medium font-urbanist">
                            {act.activity_time}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OVERVIEW & NOTES */}
          {activeTab === 'overview' && (
            <div className="glass-card bg-white/90 p-6 rounded-2xl border border-white/90 shadow-2xs space-y-5">
              <div>
                <h3 className="font-black text-[#292D32] text-base mb-3 font-urbanist">Organization Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 uppercase font-bold block text-[10px] tracking-wider">Company Name</span>
                    <span className="text-sm font-black text-[#292D32] mt-0.5 block font-urbanist">{company.name}</span>
                  </div>

                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 uppercase font-bold block text-[10px] tracking-wider">Industry Role</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">{typeConfig?.label || company.company_type}</span>
                  </div>

                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 uppercase font-bold block text-[10px] tracking-wider">Headquarters / City</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">{company.city || 'Western Region'}</span>
                  </div>

                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 uppercase font-bold block text-[10px] tracking-wider">Official Website</span>
                    {company.website ? (
                      <a href={company.website} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#292D32] hover:text-[#8FC2F0] underline mt-0.5 block">
                        {company.website}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic mt-0.5 block">Not specified</span>
                    )}
                  </div>
                </div>
              </div>

              {company.notes && (
                <div>
                  <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-1.5">Internal Notes & History</h4>
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {company.notes}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white/80 border-t border-slate-100/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            CRMate &bull; Western Region Partner Directory
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
