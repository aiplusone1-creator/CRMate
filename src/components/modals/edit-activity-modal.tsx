'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Phone, 
  Users, 
  Building2, 
  Target, 
  MapPin, 
  MessageCircle, 
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Edit
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { 
  ACTIVITY_CHANNELS, 
  VISIT_PURPOSES, 
  ACTIVITY_OUTCOMES 
} from '@/lib/constants';
import { 
  Activity, 
  ActivityChannel, 
  VisitPurpose, 
  ActivityOutcome 
} from '@/types/crm';
import { useLanguage } from '@/lib/i18n/language-context';

interface EditActivityModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditActivityModal({ activity, isOpen, onClose }: EditActivityModalProps) {
  const { projects, companies, contacts, updateActivity } = useCRM();
  const { t, isRTL } = useLanguage();

  const [channel, setChannel] = useState<ActivityChannel>('call');
  const [purpose, setPurpose] = useState<VisitPurpose>('follow_up');
  const [activityDate, setActivityDate] = useState('');
  const [activityTime, setActivityTime] = useState('');
  const [outcome, setOutcome] = useState<ActivityOutcome | ''>('connected');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [projectId, setProjectId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [locationName, setLocationName] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cascading Filter: Filter projects by company if selected
  const filteredProjects = React.useMemo(() => {
    if (!companyId) return projects;
    return projects.filter(p => p.company_id === companyId);
  }, [projects, companyId]);

  const handleCompanyChange = (newCompId: string) => {
    setCompanyId(newCompId);
    if (projectId) {
      const p = projects.find(proj => proj.id === projectId);
      if (p && p.company_id && p.company_id !== newCompId) {
        setProjectId('');
      }
    }
    if (contactId) {
      const c = contacts.find(cnt => cnt.id === contactId);
      if (c && c.company_id && c.company_id !== newCompId) {
        setContactId('');
      }
    }
  };

  const handleContactChange = (newContactId: string) => {
    setContactId(newContactId);
    if (!newContactId) return;
    const c = contacts.find(cnt => cnt.id === newContactId);
    if (c?.company_id) {
      setCompanyId(c.company_id);
      if (projectId) {
        const p = projects.find(proj => proj.id === projectId);
        if (p && p.company_id && p.company_id !== c.company_id) {
          setProjectId('');
        }
      }
    }
  };

  const handleProjectChange = (newProjectId: string) => {
    setProjectId(newProjectId);
    if (!newProjectId) return;
    const p = projects.find(proj => proj.id === newProjectId);
    if (p?.company_id) setCompanyId(p.company_id);
    if (p?.primary_contact_id) setContactId(p.primary_contact_id);
  };

  useEffect(() => {
    if (activity && isOpen) {
      setChannel(activity.channel || 'call');
      setPurpose(activity.visit_purpose || 'follow_up');
      setActivityDate(activity.activity_date || new Date().toISOString().split('T')[0]);
      setActivityTime(activity.activity_time || '10:00');
      setOutcome(activity.outcome || 'connected');
      setNotes(activity.notes || '');
      setNextAction(activity.next_action || '');
      setNextFollowUpAt(activity.next_follow_up_at ? activity.next_follow_up_at.split('T')[0] : '');
      setProjectId(activity.project_id || '');
      setCompanyId(activity.company_id || '');
      setContactId(activity.contact_id || '');
      setLocationName(activity.location_name || '');
      setGoogleMapsUrl(activity.google_maps_url || '');
    }
  }, [activity, isOpen]);

  if (!isOpen || !activity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const matchedProject = projects.find(p => p.id === projectId);
    const matchedCompany = companies.find(c => c.id === companyId);
    const matchedContact = contacts.find(c => c.id === contactId);

    await updateActivity(activity.id, {
      channel,
      visit_purpose: purpose,
      activity_date: activityDate,
      activity_time: activityTime || undefined,
      outcome: (outcome as ActivityOutcome) || undefined,
      notes: notes.trim() || undefined,
      next_action: nextAction.trim() || undefined,
      next_follow_up_at: nextFollowUpAt || undefined,
      project_id: projectId || undefined,
      project_name: matchedProject?.name || activity.project_name,
      company_id: companyId || matchedProject?.company_id || undefined,
      company_name: matchedCompany?.name || matchedProject?.company_name || activity.company_name,
      contact_id: contactId || undefined,
      contact_name: matchedContact?.full_name || activity.contact_name,
      location_name: locationName.trim() || undefined,
      google_maps_url: googleMapsUrl.trim() || undefined,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 z-50 animate-in fade-in duration-150">
      <div className="glass-card rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] sm:max-h-[90vh] shadow-2xl border border-white/90 dark:border-[#8FC2F0]/20 flex flex-col overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100/80 dark:border-slate-800 flex items-center justify-between bg-white/40 dark:bg-[#232A38]/70 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shadow-2xs shrink-0">
              <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <div>
              <h2 className="font-black text-[#292D32] dark:text-white text-base sm:text-lg font-urbanist">{isRTL ? 'تعديل نشاط المبيعات' : 'Edit Activity'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isRTL ? 'تحديث بيانات التنفيذ والملاحظات والخطوات التالية' : 'Update execution details, notes & next actions'}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-2xl text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-4 flex-1">
          {/* Row 1: Channel & Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Interaction Channel *</label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value as ActivityChannel)}
                className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              >
                {ACTIVITY_CHANNELS.map(ch => (
                  <option key={ch.value} value={ch.value} className="dark:bg-[#141820] dark:text-white">{ch.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Visit Purpose / Action *</label>
              <select
                value={purpose}
                onChange={e => setPurpose(e.target.value as VisitPurpose)}
                className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              >
                {VISIT_PURPOSES.map(p => (
                  <option key={p.value} value={p.value} className="dark:bg-[#141820] dark:text-white">{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={activityDate}
                onChange={e => setActivityDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Time (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 10:30 AM"
                value={activityTime}
                onChange={e => setActivityTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              />
            </div>
          </div>

          {/* Row 3: Associated Project & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>{isRTL ? 'المشروع (Project)' : 'Project (Optional)'}</span>
                {companyId && (
                  <span className="text-[10px] text-blue-600 dark:text-[#8FC2F0] font-normal">
                    {isRTL ? `(${filteredProjects.length} مشروع لهذه الشركة)` : `(${filteredProjects.length} for this company)`}
                  </span>
                )}
              </label>
              <select
                value={projectId}
                onChange={e => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              >
                <option value="" className="dark:bg-[#141820] dark:text-white">
                  {companyId ? (isRTL ? '-- اختر مشروع لهذه الشركة --' : '-- Select Project for this Company --') : (isRTL ? '-- عام / بدون مشروع --' : '-- General / No Project --')}
                </option>
                {filteredProjects.map(p => (
                  <option key={p.id} value={p.id} className="dark:bg-[#141820] dark:text-white">{p.pr_number} - {p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>{isRTL ? 'الشركة / الحساب (Company)' : 'Company / Account'}</span>
                {companyId && (
                  <button
                    type="button"
                    onClick={() => handleCompanyChange('')}
                    className="text-[10px] text-slate-400 hover:text-rose-500 underline"
                  >
                    {isRTL ? 'إلغاء التحديد' : 'Clear'}
                  </button>
                )}
              </label>
              <select
                value={companyId}
                onChange={e => handleCompanyChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              >
                <option value="" className="dark:bg-[#141820] dark:text-white">
                  {isRTL ? '-- بدون شركة محددة (عرض كل المشاريع) --' : '-- No Specific Company (All Projects) --'}
                </option>
                {companies.map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-[#141820] dark:text-white">{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact & Outcome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>{isRTL ? 'جهة الاتصال (Contact Person)' : 'Contact Person'}</span>
                {contactId && (
                  <button
                    type="button"
                    onClick={() => handleContactChange('')}
                    className="text-[10px] text-slate-400 hover:text-rose-500 underline"
                  >
                    {isRTL ? 'إلغاء التحديد' : 'Clear'}
                  </button>
                )}
              </label>
              <select
                value={contactId}
                onChange={e => handleContactChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              >
                <option value="" className="dark:bg-[#141820] dark:text-white">{isRTL ? '-- اختر جهة الاتصال --' : '-- Select Contact --'}</option>
                {contacts
                  .filter(cnt => !companyId || cnt.company_id === companyId)
                  .map(cnt => (
                    <option key={cnt.id} value={cnt.id} className="dark:bg-[#141820] dark:text-white">
                      {cnt.full_name} {cnt.job_title ? `(${cnt.job_title})` : ''} {!companyId && cnt.company_name ? `• ${cnt.company_name}` : ''}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Activity Outcome *</label>
              <select
                value={outcome}
                onChange={e => setOutcome(e.target.value as ActivityOutcome)}
                className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-emerald-700 dark:text-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              >
                {ACTIVITY_OUTCOMES.map(o => (
                  <option key={o.value} value={o.value} className="dark:bg-[#141820] dark:text-white">{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Activity Notes & Summary (ما تم إنجازه بالتفصيل) *
            </label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Visited procurement engineer to discuss modulating valves schedule..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
            />
          </div>

          {/* Next Action & Follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Next Action (الإجراء القادم)</label>
              <input
                type="text"
                value={nextAction}
                onChange={e => setNextAction(e.target.value)}
                placeholder="e.g. Send revised quotation by Tuesday"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Next Follow-up Date</label>
              <input
                type="date"
                value={nextFollowUpAt}
                onChange={e => setNextFollowUpAt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              />
            </div>

            {nextAction.trim() && nextFollowUpAt && (
              <div className="col-span-1 sm:col-span-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center gap-2 text-amber-800 dark:text-amber-200 text-xs font-semibold animate-in fade-in duration-150">
                <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {isRTL 
                    ? `📅 سيتم تحديث هذا الإجراء تلقائياً في الخطة الأسبوعية بتاريخ ${nextFollowUpAt} كنشاط متابعة باللون الأصفر`
                    : `📅 This action will be automatically synced in your Weekly Plan on ${nextFollowUpAt} as a yellow follow-up`}
                </span>
              </div>
            )}
          </div>

          {/* Location & Google Maps URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Location Name / Area</label>
              <input
                type="text"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder="e.g. Obhur, Jeddah Industrial 2"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 dark:text-slate-300">Google Maps Link</label>
              <input
                type="text"
                value={googleMapsUrl}
                onChange={e => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#292D32] dark:bg-[#8FC2F0] dark:text-[#141820] hover:bg-[#1E2124] dark:hover:bg-[#7eb5e6] rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Activity Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
