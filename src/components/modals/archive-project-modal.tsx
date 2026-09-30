'use client';

import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Trash2,
  X, 
  Check, 
  AlertTriangle,
  Building2,
  Bell
} from 'lucide-react';
import { Project } from '@/types/crm';
import { formatCurrencySAR } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/language-context';

interface ArchiveProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

export const COMMON_ARCHIVE_REASONS_AR = [
  'ألغى العميل المشروع / لم يعد العميل مهتماً',
  'تكرار للمشروع بالخطأ',
  'مشروع ملغي أو مؤجل لأجل غير مسمى',
  'بيانات تجريبية أو إدخال خاطئ',
  'أخرى (توضيح السبب بالتفصيل أدناه)'
];

export const COMMON_ARCHIVE_REASONS_EN = [
  'Client cancelled project / No longer interested',
  'Duplicate project entry created by mistake',
  'Project cancelled or indefinitely postponed',
  'Test / erroneous data entry',
  'Other (detailed reason specified below)'
];

export function ArchiveProjectModal({
  isOpen,
  project,
  onClose,
  onConfirm
}: ArchiveProjectModalProps) {
  const { isRTL } = useLanguage();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [detailedReason, setDetailedReason] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate('');
      setDetailedReason('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const quickReasons = isRTL ? COMMON_ARCHIVE_REASONS_AR : COMMON_ARCHIVE_REASONS_EN;

  const handleSelectTemplate = (template: string) => {
    setSelectedTemplate(template);
    if (!detailedReason.trim() || quickReasons.includes(detailedReason.trim())) {
      setDetailedReason(template);
    } else {
      setDetailedReason(`${template} - ${detailedReason.trim()}`);
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = detailedReason.trim() || selectedTemplate || (isRTL ? 'نقل للأرشيف بواسطة المستخدم' : 'Moved to archive by user');

    try {
      setIsSubmitting(true);
      await onConfirm(finalReason);
      onClose();
    } catch (err) {
      console.error('Failed to archive project', err);
      setError(isRTL ? 'حدث خطأ أثناء نقل المشروع للأرشيف' : 'Failed to archive project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-urbanist animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/60 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isRTL ? 'مسح ونقل المشروع للأرشيف' : 'Delete / Move Project to Archive'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {project.pr_number} • {project.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Audit & Notification Notice */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-start gap-3 text-xs">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
              <strong>{isRTL ? 'تنبيه نظام الصلاحيات:' : 'System Audit Notice:'}</strong>{' '}
              {isRTL 
                ? 'لن يتم حذف المشروع نهائياً بل سيُنقل إلى قسم "الأرشيف"، وسيتم إرسال إشعار فوري إلى (المدير والآدمن والمشاهد) بتوثيق عملية المسح.'
                : 'The project will not be permanently deleted. It will be moved to the "Archive" tab, and an instant alert notification will be sent to the Sales Manager, Admin, and Viewer.'}
            </div>
          </div>

          {/* Project Summary Card */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-urbanist">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold">{project.company_name || 'No company'}</span>
            </div>
            <div className="font-black text-slate-900 dark:text-white">
              {formatCurrencySAR(project.estimated_value)}
            </div>
          </div>

          {/* Quick Selection Reasons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {isRTL ? 'اختر سبب المسح / الأرشفة السريع:' : 'Select quick archive reason:'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickReasons.map((reason) => {
                const isSelected = selectedTemplate === reason;
                return (
                  <button
                    type="button"
                    key={reason}
                    onClick={() => handleSelectTemplate(reason)}
                    className={`text-xs px-3 py-1.5 rounded-xl border text-start transition-all cursor-pointer font-medium ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-500 shadow-2xs font-bold'
                        : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Reason Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isRTL ? 'تفاصيل إضافية عن سبب المسح (اختياري):' : 'Additional details / notes (optional):'}
            </label>
            <textarea
              rows={3}
              value={detailedReason}
              onChange={(e) => {
                setDetailedReason(e.target.value);
                if (error) setError('');
              }}
              placeholder={isRTL ? 'اكتب ملاحظات توضيحية لسبب مسح المشروع إن وجدت...' : 'Enter any notes explaining why this deal is being deleted/archived...'}
              className="w-full text-xs p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-slate-900 dark:text-white font-medium resize-none shadow-2xs"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-bold">{error}</p>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {isSubmitting 
                  ? (isRTL ? 'جاري النقل للأرشيف...' : 'Moving to Archive...')
                  : (isRTL ? 'تأكيد المسح والأرشفة' : 'Confirm Delete & Move to Archive')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
