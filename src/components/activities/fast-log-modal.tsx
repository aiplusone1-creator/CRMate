'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  Users, 
  Video, 
  MapPin, 
  Target, 
  Briefcase, 
  Calendar, 
  Mail, 
  Check, 
  Clock, 
  Send, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { 
  ACTIVITY_CHANNELS, 
  VISIT_PURPOSES, 
  ACTIVITY_OUTCOMES 
} from '@/lib/constants';
import { 
  Project, 
  ActivityChannel, 
  VisitPurpose, 
  ActivityOutcome 
} from '@/types/crm';
import { useLanguage } from '@/lib/i18n/language-context';

interface FastLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProject?: Project | null;
  initialContactId?: string;
  plannedActivityId?: string;
  defaultGoal?: string;
}

export function FastLogModal({
  isOpen,
  onClose,
  initialProject,
  initialContactId,
  plannedActivityId,
  defaultGoal
}: FastLogModalProps) {
  const { projects, contacts, companies, addActivity, completePlannedActivity, currentUser } = useCRM();
  const { t, isRTL } = useLanguage();

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [channel, setChannel] = useState<ActivityChannel>('call');
  const [purpose, setPurpose] = useState<VisitPurpose>('follow_up');
  const [outcome, setOutcome] = useState<ActivityOutcome>('connected');
  const [notes, setNotes] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');
  const [nextDate, setNextDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      if (initialProject) {
        setSelectedProjectId(initialProject.id);
        setSelectedContactId(initialContactId || initialProject.primary_contact_id || '');
      } else if (initialContactId) {
        // If opened with specific contact (e.g. from company modal or contact card)
        setSelectedContactId(initialContactId);
        const contactObj = contacts.find(c => c.id === initialContactId);
        const matchedProj = projects.find(p => p.company_id === contactObj?.company_id);
        setSelectedProjectId(matchedProj?.id || '');
      } else if (projects.length > 0) {
        setSelectedProjectId(projects[0].id);
        setSelectedContactId(projects[0].primary_contact_id || '');
      }
      setChannel('call');
      setPurpose('follow_up');
      setOutcome('connected');
      setNotes(defaultGoal ? `Goal: ${defaultGoal}` : '');
      setNextAction('');
      
      // Default next date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setNextDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [isOpen, initialProject, initialContactId, projects, contacts, defaultGoal]);

  if (!isOpen) return null;

  // Selected Project & Contact instances
  const currentProject = projects.find(p => p.id === selectedProjectId);
  const matchedContact = contacts.find(c => c.id === selectedContactId);
  const matchedCompany = companies.find(c => c.id === (currentProject?.company_id || matchedContact?.company_id));

  // Contacts to display in dropdown:
  // If a project is selected, show contacts belonging to project's company (or all if none).
  // Always include the currently selected contact so it is never missing from the dropdown.
  const projectContacts = contacts.filter(c => {
    if (c.id === selectedContactId) return true;
    if (currentProject?.company_id) return c.company_id === currentProject.company_id;
    return true;
  });

  // Quick Date Helpers
  const setQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setNextDate(d.toISOString().split('T')[0]);
  };

  const setNextSaturday = () => {
    const d = new Date();
    const day = d.getDay(); // 6 is Saturday
    const daysUntilSaturday = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSaturday);
    setNextDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsSubmitting(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toTimeString().slice(0, 5);

    const matchedContact = contacts.find(c => c.id === selectedContactId);

    const activityPayload = {
      project_id: selectedProjectId || undefined,
      project_name: currentProject?.name,
      company_id: currentProject?.company_id || matchedContact?.company_id || matchedCompany?.id,
      company_name: currentProject?.company_name || matchedContact?.company_name || matchedCompany?.name,
      contact_id: selectedContactId || undefined,
      contact_name: matchedContact?.full_name,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      activity_date: todayStr,
      activity_time: nowTimeStr,
      channel,
      visit_purpose: purpose,
      outcome,
      notes: notes.trim() || undefined, // Optional Notes (Correction 2)
      next_action: nextAction.trim() || undefined,
      next_follow_up_at: nextDate || undefined,
    };

    if (plannedActivityId) {
      await completePlannedActivity(plannedActivityId, activityPayload);
    } else {
      await addActivity(activityPayload);
    }

    setIsSubmitting(false);
    onClose();
  };

  // Keyboard shortcut: Ctrl+Enter to save immediately
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  const channelIcons: Record<ActivityChannel, React.ReactNode> = {
    call: <Phone className="w-4 h-4" />,
    meeting_f2f: <Users className="w-4 h-4" />,
    meeting_online: <Video className="w-4 h-4" />,
    visit: <MapPin className="w-4 h-4" />,
    hunting: <Target className="w-4 h-4" />,
    office_work: <Briefcase className="w-4 h-4" />,
    event: <Calendar className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
  };

  const quickActionPresets = [
    "Follow up on revised quotation",
    "Awaiting client technical feedback",
    "Prepare revised BOQ submission",
    "Schedule face-to-face meeting",
    "Obtain procurement engineer contact"
  ];

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      onKeyDown={handleKeyDown}
    >
      <div className="glass-card rounded-3xl max-w-xl w-full shadow-2xl border border-white/90 dark:border-[#8FC2F0]/20 overflow-hidden flex flex-col max-h-[95vh] backdrop-blur-2xl animate-in zoom-in-95 duration-150">
        
        {/* CRMate Frosted Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100/80 dark:border-slate-800 bg-white/40 dark:bg-[#232A38]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shadow-2xs">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-[#292D32] dark:text-white text-lg font-urbanist leading-tight">Log Sales Activity</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fast entry &bull; Target under 20 seconds</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          
          {/* 1. Project & Contact Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5">
                Project *
              </label>
              <select
                value={selectedProjectId}
                onChange={e => {
                  setSelectedProjectId(e.target.value);
                  const p = projects.find(proj => proj.id === e.target.value);
                  if (p?.primary_contact_id) setSelectedContactId(p.primary_contact_id);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] bg-white/90 dark:bg-[#141820] text-slate-900 dark:text-white shadow-2xs"
              >
                <option value="" className="dark:bg-[#141820] dark:text-white">-- General / Hunting (No Project) --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="dark:bg-[#141820] dark:text-white">
                    {p.pr_number} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5">
                Contact Person
              </label>
              <select
                value={selectedContactId}
                onChange={e => setSelectedContactId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] bg-white/90 dark:bg-[#141820] text-slate-900 dark:text-white shadow-2xs"
              >
                <option value="" className="dark:bg-[#141820] dark:text-white">-- No Contact / General --</option>
                {projectContacts.map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-[#141820] dark:text-white">
                    {c.full_name} ({c.job_title || 'Contact'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Interaction Channel (Large 1-click buttons) */}
          <div>
            <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-2">
              Channel
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ACTIVITY_CHANNELS.map(ch => {
                const isSelected = channel === ch.value;
                return (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => setChannel(ch.value)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border transition-all shadow-2xs cursor-pointer ${
                      isSelected 
                        ? 'bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] border-[#292D32] dark:border-[#8FC2F0] shadow-xs' 
                        : 'bg-white/80 dark:bg-[#141820] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {channelIcons[ch.value]}
                    <span className="truncate">{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Outcome Chips (Fast 1-click presets) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Outcome
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_OUTCOMES.slice(0, 10).map(out => {
                const isSelected = outcome === out.value;
                return (
                  <button
                    key={out.value}
                    type="button"
                    onClick={() => setOutcome(out.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] border-[#292D32] dark:border-[#8FC2F0] shadow-xs'
                        : 'bg-white/90 dark:bg-[#141820] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {out.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Notes (OPTIONAL - Arabic/English supported) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#292D32] dark:text-slate-200">
                Notes & Summary <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Arabic or English</span>
            </div>
            <textarea
              rows={2}
              placeholder="e.g. العميل أكد استلام التسعيرة وسيتم الرد يوم الأحد القادم..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white shadow-2xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* 5. Next Action with Presets */}
          <div>
            <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5">
              Next Action Required
            </label>
            <input
              type="text"
              placeholder="e.g. Follow up with procurement"
              value={nextAction}
              onChange={e => setNextAction(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {/* Action Presets */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {quickActionPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNextAction(preset)}
                  className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#232A38] hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-transparent dark:border-slate-700/60 cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Next Follow-up Date with Fast Presets */}
          <div>
            <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5">
              {isRTL ? 'تاريخ المتابعة القادمة' : 'Next Follow-up Date'}
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <button
                type="button"
                onClick={() => setQuickDate(1)}
                className="text-xs px-3 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-[#141820] hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 shadow-2xs cursor-pointer"
              >
                {isRTL ? 'غداً' : 'Tomorrow'}
              </button>
              <button
                type="button"
                onClick={setNextSaturday}
                className="text-xs px-3 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-[#141820] hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 shadow-2xs cursor-pointer"
              >
                {isRTL ? 'السبت القادم' : 'Next Saturday'}
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(3)}
                className="text-xs px-3 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-[#141820] hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 shadow-2xs cursor-pointer"
              >
                {isRTL ? 'بعد 3 أيام' : 'In 3 Days'}
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(7)}
                className="text-xs px-3 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-[#141820] hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 shadow-2xs cursor-pointer"
              >
                {isRTL ? 'الأسبوع القادم' : 'Next Week'}
              </button>
            </div>
            <input
              type="date"
              value={nextDate}
              onChange={e => setNextDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white shadow-2xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400 font-medium">
              Press <kbd className="font-mono bg-slate-100 dark:bg-[#232A38] px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">Ctrl+Enter</kbd> to save
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#232A38] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white dark:text-[#141820] bg-[#292D32] hover:bg-[#1E2124] dark:bg-[#8FC2F0] dark:hover:bg-[#7ab2e3] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#77CE69] dark:text-[#141820]" />
                <span>{isSubmitting ? 'Saving...' : 'Save Activity (15s)'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
