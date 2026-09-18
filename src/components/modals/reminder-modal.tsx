'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Briefcase, 
  User, 
  Sparkles,
  Flame
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { Reminder, ReminderUrgency } from '@/types/crm';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultValues?: Partial<Reminder>;
}

export function ReminderModal({ isOpen, onClose, defaultValues }: ReminderModalProps) {
  const { projects, contacts, addReminder } = useCRM();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('10:00');
  const [urgency, setUrgency] = useState<ReminderUrgency>('normal');
  const [projectId, setProjectId] = useState<string>('');
  const [contactId, setContactId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const nextHour = String((now.getHours() + 1) % 24).padStart(2, '0') + ':00';

      setTitle(defaultValues?.title || '');
      setNotes(defaultValues?.notes || '');
      setReminderDate(defaultValues?.reminder_date || today);
      setReminderTime(defaultValues?.reminder_time || nextHour);
      setUrgency(defaultValues?.urgency || 'normal');
      setProjectId(defaultValues?.project_id || (defaultValues?.entity_type === 'project' ? defaultValues?.entity_id : '') || '');
      setContactId(defaultValues?.contact_id || (defaultValues?.entity_type === 'contact' ? defaultValues?.entity_id : '') || '');
    }
  }, [isOpen, defaultValues]);

  if (!isOpen) return null;

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
    }
  };

  const handleSetQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setReminderDate(`${y}-${m}-${day}`);
  };

  const handleSetNextSaturday = () => {
    const d = new Date();
    const day = d.getDay(); // 6 is Saturday
    const daysUntilSaturday = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSaturday);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    setReminderDate(`${y}-${m}-${dayStr}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !reminderDate || !reminderTime) return;

    setIsSubmitting(true);
    try {
      const matchedProject = projects.find(p => p.id === projectId);
      const matchedContact = contacts.find(c => c.id === contactId);

      let entityType: Reminder['entity_type'] = defaultValues?.entity_type || 'general';
      let entityId = defaultValues?.entity_id;
      let entityName = defaultValues?.entity_name;

      if (projectId && !entityId) {
        entityType = 'project';
        entityId = projectId;
        entityName = matchedProject?.name;
      } else if (contactId && !entityId) {
        entityType = 'contact';
        entityId = contactId;
        entityName = matchedContact?.full_name;
      }

      await addReminder({
        title: title.trim(),
        notes: notes.trim(),
        reminder_date: reminderDate,
        reminder_time: reminderTime,
        urgency,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        project_id: projectId || undefined,
        project_name: matchedProject?.name || undefined,
        contact_id: contactId || undefined,
        contact_name: matchedContact?.full_name || undefined,
        activity_id: defaultValues?.activity_id || undefined,
      });

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-card bg-white/95 rounded-3xl max-w-lg w-full shadow-2xl border border-white/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] backdrop-blur-2xl">
        
        {/* CRMate Frosted Header */}
        <div className="px-6 py-5 bg-white/80 border-b border-slate-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] flex items-center justify-center shadow-2xs">
              <Bell className="w-5 h-5 text-[#292D32]" />
            </div>
            <div>
              <h3 className="font-black text-[#292D32] text-lg font-urbanist tracking-tight flex items-center gap-1.5">
                <span>Set Reminder &bull; إضافة تذكير</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Scheduled alert with notes, date, and specific time
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-[#292D32] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          
          {/* Notification Permission Banner if not enabled */}
          {notificationPermission !== 'granted' && (
            <div className="bg-[#8FC2F0]/15 border border-[#8FC2F0]/30 rounded-2xl p-3 flex items-center justify-between gap-2 text-[#292D32]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8FC2F0] shrink-0" />
                <span className="text-[11px] font-medium">
                  Enable desktop alerts so you don&apos;t miss this reminder:
                </span>
              </div>
              <button
                type="button"
                onClick={handleRequestNotification}
                className="px-3 py-1 bg-[#292D32] hover:bg-[#1E2124] text-white font-bold text-[11px] rounded-xl shrink-0 transition-colors shadow-2xs"
              >
                Enable
              </button>
            </div>
          )}

          {/* Linked Context Badge */}
          {(defaultValues?.entity_name || defaultValues?.project_name || defaultValues?.contact_name) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2 text-xs flex-wrap">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Linked to:</span>
              {defaultValues.project_name && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[11px] border border-blue-200">
                  <Briefcase className="w-3 h-3" />
                  <span>{defaultValues.project_name}</span>
                </span>
              )}
              {defaultValues.contact_name && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[11px] border border-emerald-200">
                  <User className="w-3 h-3" />
                  <span>{defaultValues.contact_name}</span>
                </span>
              )}
            </div>
          )}

          {/* Reminder Title */}
          <div>
            <label className="block font-bold text-[#292D32] mb-1.5 text-xs">
              Reminder Title / عنوان التذكير <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Call Eng. Tariq regarding valve approval"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 font-medium shadow-2xs text-xs"
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-[#292D32] flex items-center gap-1 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-[#8FC2F0]" />
                  <span>Date / التاريخ</span> <span className="text-rose-500">*</span>
                </label>
              </div>
              <input
                type="date"
                required
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 font-semibold shadow-2xs text-xs"
              />

              {/* Quick Date Chips */}
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={handleSetNextSaturday}
                  className="px-2.5 py-1 rounded-lg bg-[#8FC2F0]/20 hover:bg-[#8FC2F0]/30 text-[#292D32] text-[10px] font-bold transition-colors"
                >
                  Next Sat (السبت)
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-[#292D32] flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5 text-[#8FC2F0]" />
                  <span>Time / الساعة</span> <span className="text-rose-500">*</span>
                </label>
              </div>
              <input
                type="time"
                required
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 font-semibold font-mono shadow-2xs text-xs"
              />

              {/* Quick Time Chips */}
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {['09:00', '11:30', '14:00', '16:30'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setReminderTime(t)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                      reminderTime === t 
                        ? 'bg-[#292D32] text-white shadow-2xs' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Urgency Selector */}
          <div>
            <label className="block font-bold text-[#292D32] mb-1.5 text-xs">
              Priority & Urgency / الأهمية
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUrgency('normal')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  urgency === 'normal'
                    ? 'bg-[#292D32] text-white border-[#292D32] shadow-xs'
                    : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Normal (عادي)</span>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('high')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  urgency === 'high'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50/80 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>High (هام)</span>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('urgent')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  urgency === 'urgent'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50/80 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Urgent (عاجل)</span>
              </button>
            </div>
          </div>

          {/* Notes & Description (Wrap text) */}
          <div>
            <label className="block font-bold text-[#292D32] mb-1.5 text-xs">
              Detailed Notes / تفاصيل وملاحظات التذكير
            </label>
            <textarea
              rows={3}
              placeholder="Write the notes, action items, or context that you need to be reminded of..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 leading-relaxed break-words shadow-2xs text-xs font-medium"
            />
          </div>

          {/* Optional Project & Contact Links */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Link with CRM Records (Optional)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#292D32] mb-1.5 text-xs">Related Project</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-800 font-medium shadow-2xs text-xs"
                >
                  <option value="">-- No Project Selected --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.company_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#292D32] mb-1.5 text-xs">Related Contact</label>
                <select
                  value={contactId}
                  onChange={e => setContactId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/90 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-800 font-medium shadow-2xs text-xs"
                >
                  <option value="">-- No Contact Selected --</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.company_name || 'Client'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2.5 bg-[#292D32] hover:bg-[#1E2124] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Bell className="w-4 h-4 text-[#8FC2F0]" />
              <span>Save Reminder &bull; حفظ التذكير</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
