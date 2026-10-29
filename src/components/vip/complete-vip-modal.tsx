'use client';

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Phone, 
  MapPin, 
  Users2, 
  Video, 
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { VIPItem, ActivityChannel, ProjectPriority } from '@/types/crm';
import { useLanguage } from '@/lib/i18n/language-context';

interface CompleteVIPModalProps {
  isOpen: boolean;
  item: VIPItem | null;
  onClose: () => void;
  onComplete: (params: {
    vipId: string;
    channel: ActivityChannel;
    activityDate: string;
    activityTime?: string;
    completionNotes: string;
    nextAction?: string;
    nextFollowUpDate?: string;
    priority?: ProjectPriority;
  }) => Promise<void>;
}

export function CompleteVIPModal({
  isOpen,
  item,
  onClose,
  onComplete,
}: CompleteVIPModalProps) {
  const { isRTL } = useLanguage();

  const [channel, setChannel] = useState<ActivityChannel>('call');
  const [activityDate, setActivityDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [activityTime, setActivityTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>('');
  const [priority, setPriority] = useState<ProjectPriority>('high');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedNotes = completionNotes.trim();
    if (!trimmedNotes) {
      setErrorMessage(isRTL ? 'يرجى كتابة تفاصيل ما تم إنجازه (إلزامي)' : 'Completion details are required');
      return;
    }

    if (nextAction.trim() && !nextFollowUpDate) {
      setErrorMessage(isRTL ? 'يرجى تحديد تاريخ استحقاق للخطوة القادمة لجدولتها في خطة الأسبوع' : 'Please select a due date for the next step');
      return;
    }

    try {
      setIsSubmitting(true);
      await onComplete({
        vipId: item.id,
        channel,
        activityDate,
        activityTime,
        completionNotes: trimmedNotes,
        nextAction: nextAction.trim() || undefined,
        nextFollowUpDate: nextFollowUpDate || undefined,
        priority
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to complete VIP item:', err);
      setErrorMessage(err?.message || (isRTL ? 'حدث خطأ أثناء حفظ الإنجاز' : 'Failed to save completion'));
      setIsSubmitting(false);
    }
  };

  const channelOptions: { value: ActivityChannel; labelAr: string; labelEn: string; icon: any }[] = [
    { value: 'call', labelAr: 'اتصال هاتفي', labelEn: 'Phone Call', icon: Phone },
    { value: 'visit', labelAr: 'زيارة ميدانية', labelEn: 'Field Visit', icon: MapPin },
    { value: 'meeting_f2f', labelAr: 'اجتماع حضوري', labelEn: 'In-Person Meeting', icon: Users2 },
    { value: 'meeting_online', labelAr: 'اجتماع أونلاين', labelEn: 'Online Meeting', icon: Video },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-[#1A1F2B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isRTL ? 'تسجيل إنجاز مهمة VIP' : 'Complete VIP Action'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {item.category === 'revisit_project' 
                  ? (isRTL ? `معاودة مشروع: ${item.title}` : `Revisit Project: ${item.title}`)
                  : (isRTL ? `اتصال VIP: ${item.title}` : `VIP Call: ${item.title}`)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Context Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                {isRTL 
                  ? 'سيتم تسجيل هذا الإنجاز تلقائياً في سجل الأنشطة الرسمي دون أي تأثير على الـ Pipeline.'
                  : 'This completion will be automatically logged to Activities without modifying the Pipeline.'}
              </span>
            </div>
          </div>

          {/* 1. Activity Channel */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {isRTL ? 'نوع النشاط المنفذ *' : 'Activity Type *'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {channelOptions.map(opt => {
                const Icon = opt.icon;
                const isSelected = channel === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setChannel(opt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{isRTL ? opt.labelAr : opt.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? 'تاريخ التنفيذ *' : 'Activity Date *'}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={activityDate}
                  onChange={e => setActivityDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? 'توقيت التنفيذ' : 'Activity Time'}
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={activityTime}
                  onChange={e => setActivityTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* 3. Mandatory Completion Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isRTL ? 'ما الذي تم إنجازه بالضبط؟ (إلزامي) *' : 'Outcome & Detailed Notes (Mandatory) *'}
            </label>
            <textarea
              rows={3}
              value={completionNotes}
              onChange={e => setCompletionNotes(e.target.value)}
              placeholder={isRTL 
                ? 'اكتب نتائج المعاودة أو المكالمة، مع من تحدثت وما هي مخرجات هذا التواصل...'
                : 'Describe what happened during this call or visit, key insights, and outcomes...'}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 resize-none"
            />
          </div>

          {/* 4. Optional Next Step & Due Date */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isRTL ? 'الخطوة القادمة وخطة الأسبوع (اختياري)' : 'Next Step & Weekly Plan (Optional)'}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={nextAction}
                  onChange={e => setNextAction(e.target.value)}
                  placeholder={isRTL ? 'مثال: إرسال عرض فني، متابعة الأسعار، موعد زيارة استشاري...' : 'e.g. Send technical submittal, follow up quotation...'}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                />
              </div>

              {nextAction.trim() && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {isRTL ? 'تاريخ الجدولة في خطة الأسبوع *' : 'Scheduled Due Date *'}
                    </label>
                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={e => setNextFollowUpDate(e.target.value)}
                      required={Boolean(nextAction.trim())}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {isRTL ? 'أولوية المتابعة' : 'Priority'}
                    </label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value as ProjectPriority)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                    >
                      <option value="urgent">{isRTL ? 'عاجل (Urgent)' : 'Urgent'}</option>
                      <option value="high">{isRTL ? 'مهم (High)' : 'High'}</option>
                      <option value="medium">{isRTL ? 'متوسط (Medium)' : 'Medium'}</option>
                      <option value="low">{isRTL ? 'عادي (Low)' : 'Low'}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ وترحيل الإنجاز ✅' : 'Save & Log Activity')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
