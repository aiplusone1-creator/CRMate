'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  Check, 
  Building2
} from 'lucide-react';
import { Project } from '@/types/crm';
import { formatCurrencySAR } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/language-context';

interface LostReasonModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

export const COMMON_LOST_REASONS_AR = [
  'السعر أعلى من ميزانية العميل / عروض المنافسين',
  'المنافس قدم مواصفات بديلة مقبولة من الاستشاري',
  'إلغاء أو تجميد المشروع من جهة المالك',
  'تغيير المقاول الرئيسي / إعادة طرح المناقصة',
  'شروط الدفعات أو مدة التوريد غير متوافقة مع متطلبات المشروع',
  'علاقة مسبقة للمنافس أو اعتماد حصري للعلامة التجارية',
  'أسباب فنية أو خروج عن المواصفات المطلوبة',
  'أخرى (توضيح السبب بالتفصيل أدناه)'
];

export const COMMON_LOST_REASONS_EN = [
  'Price higher than client budget / competitor quotes',
  'Competitor offered acceptable alternative spec approved by consultant',
  'Project cancelled or frozen by client / owner',
  'Main contractor changed / retendered',
  'Payment terms or delivery schedule mismatch with project requirements',
  'Competitor prior relationship or exclusive spec preference',
  'Technical non-compliance with required tender specs',
  'Other (detailed reason specified below)'
];

export function LostReasonModal({
  isOpen,
  project,
  onClose,
  onConfirm
}: LostReasonModalProps) {
  const { isRTL } = useLanguage();
  const [selectedReasonTemplate, setSelectedReasonTemplate] = useState<string>('');
  const [detailedReason, setDetailedReason] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedReasonTemplate('');
      setDetailedReason(project?.lost_reason || '');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const quickReasons = isRTL ? COMMON_LOST_REASONS_AR : COMMON_LOST_REASONS_EN;

  const handleSelectTemplate = (template: string) => {
    setSelectedReasonTemplate(template);
    if (!detailedReason.trim() || quickReasons.includes(detailedReason.trim())) {
      setDetailedReason(template);
    } else {
      setDetailedReason(`${template} - ${detailedReason.trim()}`);
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = detailedReason.trim();

    if (!finalReason) {
      setError(
        isRTL 
          ? 'يجب إدخال سبب خسارة الصفقة (حقل إجباري).' 
          : 'Loss reason is mandatory. Please provide details.'
      );
      return;
    }

    if (finalReason.length < 5) {
      setError(
        isRTL 
          ? 'يرجى كتابة سبب واضح وكافٍ (5 أحرف على الأقل).' 
          : 'Please provide a clear reason (at least 5 characters).'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(finalReason);
      onClose();
    } catch (err) {
      console.error('Error recording loss reason:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200">
      <div className="glass-card bg-white/95 dark:bg-[#1C2130] rounded-3xl max-w-xl w-full shadow-2xl border border-rose-200/80 dark:border-rose-900/50 flex flex-col overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 duration-150 font-urbanist">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-rose-100 dark:border-rose-950/60 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-[#292D32] dark:text-white text-base sm:text-lg">
                {isRTL ? 'تسجيل سبب خسارة الصفقة / المشروع' : 'Record Deal Loss Reason'}
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {isRTL 
                  ? 'حقل إجباري مطلوب لتوثيق أسباب الخسارة وتحسين استراتيجية التسعير والمبيعات'
                  : 'Mandatory record for sales audit and competitive win/loss analysis'}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-2xl text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#232A38] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#232A38]/70 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px]">
                {project.pr_number}
              </span>
              <span className="font-extrabold text-[#292D32] dark:text-white truncate max-w-[200px] sm:max-w-xs">
                {project.name}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
              {project.company_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{project.company_name}</span>
                </span>
              )}
              <span className="font-black text-[#292D32] dark:text-white">
                {formatCurrencySAR(project.estimated_value || 0)}
              </span>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div>
            <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-2">
              {isRTL ? 'أسباب شائعة (اختر للتعبئة السريعة):' : 'Common Reasons (Quick Select):'}
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              {quickReasons.map((reason, index) => {
                const isSelected = selectedReasonTemplate === reason;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectTemplate(reason)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer border ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-[#232A38] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-300'
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Reason Mandatory Textarea */}
          <div>
            <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5 flex items-center justify-between">
              <span>{isRTL ? 'سبب الخسارة بالتفصيل *' : 'Detailed Loss Reason *'}</span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">
                {isRTL ? 'إجباري' : 'Mandatory'}
              </span>
            </label>
            <textarea
              rows={3}
              required
              value={detailedReason}
              onChange={(e) => {
                setDetailedReason(e.target.value);
                if (error) setError('');
              }}
              placeholder={
                isRTL 
                  ? 'يرجى كتابة سبب الخسارة بالتفصيل، اسم المنافس الفائز إن عُرف، أو فارق السعر وملاحظات الاجتماع...' 
                  : 'Specify why the project was lost, winning competitor brand if known, price difference, or client feedback...'
              }
              className={`w-full p-3 text-xs bg-white dark:bg-[#141820] border rounded-2xl focus:outline-none focus:ring-2 text-[#292D32] dark:text-white font-medium transition-all shadow-2xs ${
                error
                  ? 'border-rose-400 focus:ring-rose-400/20'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-rose-500/20 focus:border-rose-500'
              }`}
            />
            {error && (
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#232A38] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              {isRTL ? 'إلغاء التغيير' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? (isRTL ? 'جاري الحفظ...' : 'Saving...') 
                  : (isRTL ? 'تأكيد الخسارة وحفظ السبب' : 'Confirm Loss & Save')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
