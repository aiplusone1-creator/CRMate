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

interface EditActivityModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditActivityModal({ activity, isOpen, onClose }: EditActivityModalProps) {
  const { projects, companies, contacts, updateActivity } = useCRM();

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-150">
      <div className="glass-card rounded-3xl max-w-xl w-full max-h-[92vh] shadow-2xl border border-white/90 dark:border-[#8FC2F0]/20 flex flex-col overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100/80 dark:border-slate-800 flex items-center justify-between bg-white/40 dark:bg-[#232A38]/70 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shadow-2xs">
              <Edit className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-black text-[#292D32] dark:text-white text-lg font-urbanist">Edit Activity</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Update execution details, notes & next actions</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
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

          {/* Row 3: Project & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Project (Optional)</label>
              <select
                value={projectId}
                onChange={e => {
                  setProjectId(e.target.value);
                  const p = projects.find(proj => proj.id === e.target.value);
                  if (p?.company_id) setCompanyId(p.company_id);
                  if (p?.primary_contact_id) setContactId(p.primary_contact_id);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              >
                <option value="" className="dark:bg-[#141820] dark:text-white">-- General / No Project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="dark:bg-[#141820] dark:text-white">{p.pr_number} - {p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company / Account</label>
              <select
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              >
                <option value="" className="dark:bg-[#141820] dark:text-white">-- No Specific Company --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-[#141820] dark:text-white">{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact & Outcome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
              <select
                value={contactId}
                onChange={e => setContactId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#141820] text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
              >
                <option value="" className="dark:bg-[#141820] dark:text-white">-- Select Contact --</option>
                {contacts
                  .filter(cnt => !companyId || cnt.company_id === companyId)
                  .map(cnt => (
                    <option key={cnt.id} value={cnt.id} className="dark:bg-[#141820] dark:text-white">
                      {cnt.full_name} {cnt.job_title ? `(${cnt.job_title})` : ''}
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
