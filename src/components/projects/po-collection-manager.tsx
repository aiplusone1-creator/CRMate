'use client';

import React, { useState, useRef, useId } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Sparkles, 
  FileCheck, 
  ExternalLink,
  Plus,
  Calendar,
  Building2,
  Percent,
  TrendingUp,
  Receipt,
  Eye,
  RefreshCw,
  Edit,
  Save,
  X
} from 'lucide-react';
import { Project, CollectionRecord } from '@/types/crm';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';
import { formatCompactSAR } from '@/lib/logic/quotation-pricing';

interface POCollectionManagerProps {
  project: Project;
  onUpdate?: () => void;
}

export function POCollectionManager({ project, onUpdate }: POCollectionManagerProps) {
  const { updateProject, currentUser, addActivity } = useCRM();
  const { language, isRTL, t } = useLanguage();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalProjectValue = project.po_amount || project.final_won_value || project.estimated_value || 0;
  const currentCollectedAmount = project.collected_amount || 0;
  const currentPercentage = totalProjectValue > 0 
    ? Math.min(100, Math.round((currentCollectedAmount / totalProjectValue) * 100))
    : (project.collected_percentage || 0);

  const remainingBalance = Math.max(0, totalProjectValue - currentCollectedAmount);

  // Edit PO Details state
  const [isEditingPO, setIsEditingPO] = useState(false);
  const [poNumber, setPoNumber] = useState(project.po_number || '');
  const [poDate, setPoDate] = useState(project.po_date || new Date().toISOString().split('T')[0]);
  const [poAmount, setPoAmount] = useState<number>(project.po_amount || totalProjectValue);
  const [poNotes, setPoNotes] = useState(project.po_notes || '');

  // Add / Update Collection state
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [newPaymentPercentage, setNewPaymentPercentage] = useState<number>(0);
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPaymentMethod, setNewPaymentMethod] = useState<'bank_transfer' | 'cheque' | 'cash' | 'letter_of_credit' | 'other'>('bank_transfer');
  const [newPaymentRef, setNewPaymentRef] = useState('');
  const [newPaymentNotes, setNewPaymentNotes] = useState('');

  // Quick Direct Percentage Adjuster
  const [isQuickPercentOpen, setIsQuickPercentOpen] = useState(false);
  const [targetPercentage, setTargetPercentage] = useState<number>(currentPercentage);

  // Status message
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handle PO File Upload (Client-side base64 / data-url storage)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) { // 15MB limit
      showFeedback(isRTL ? 'حجم الملف كبير جداً، الحد الأقصى 15 ميجابايت' : 'File too large, 15MB maximum', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const updates: Partial<Project> = {
        po_attachment_name: file.name,
        po_attachment_url: dataUrl,
        po_attachment_size: file.size,
        po_uploaded_at: new Date().toISOString(),
        po_uploaded_by: currentUser.full_name,
        po_number: poNumber || project.po_number || `PO-${project.pr_number.replace('PR-', '')}`,
        po_date: poDate || project.po_date || new Date().toISOString().split('T')[0],
        po_amount: poAmount || totalProjectValue,
      };

      await updateProject(project.id, updates);

      // Log activity
      await addActivity({
        project_id: project.id,
        project_name: project.name,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        activity_date: new Date().toISOString().split('T')[0],
        activity_time: new Date().toTimeString().slice(0, 5),
        channel: 'office_work',
        visit_purpose: 'technical_clarification',
        outcome: 'won',
        notes: `تم رفع وتوثيق أمر الشراء (PO) للمشروع: ${file.name} (${Math.round(file.size / 1024)} KB) - رقم التعميد: ${updates.po_number}`,
      }).catch(console.warn);

      showFeedback(isRTL ? 'تم رفع وحفظ أمر الشراء بنجاح!' : 'PO document successfully uploaded!');
      if (onUpdate) onUpdate();
    };

    reader.readAsDataURL(file);
  };

  // Handle Save PO Information
  const handleSavePODetails = async () => {
    const updates: Partial<Project> = {
      po_number: poNumber.trim(),
      po_date: poDate,
      po_amount: Number(poAmount) || totalProjectValue,
      po_notes: poNotes.trim(),
    };

    await updateProject(project.id, updates);
    setIsEditingPO(false);
    showFeedback(isRTL ? 'تم تحديث بيانات أمر الشراء بنجاح!' : 'Purchase Order details updated!');
    if (onUpdate) onUpdate();
  };

  // Handle Remove PO Attachment
  const handleRemovePOAttachment = async () => {
    if (!confirm(isRTL ? 'هل أنت متأكد من رغبتك في حذف ملف أمر الشراء المرفوع؟' : 'Are you sure you want to remove the uploaded PO file?')) {
      return;
    }

    const updates: Partial<Project> = {
      po_attachment_name: undefined,
      po_attachment_url: undefined,
      po_attachment_size: undefined,
      po_uploaded_at: undefined,
      po_uploaded_by: undefined,
    };

    await updateProject(project.id, updates);
    showFeedback(isRTL ? 'تم حذف مرفق أمر الشراء' : 'PO attachment removed');
    if (onUpdate) onUpdate();
  };

  // Handle Direct Percentage Adjustment
  const handleApplyQuickPercentage = async (pct: number) => {
    const clampedPct = Math.max(0, Math.min(100, pct));
    const calculatedAmount = Math.round((clampedPct / 100) * totalProjectValue);

    const updates: Partial<Project> = {
      collected_percentage: clampedPct,
      collected_amount: calculatedAmount,
      collection_status: clampedPct === 100 ? 'fully_collected' : clampedPct > 0 ? 'partially_collected' : 'pending',
    };

    await updateProject(project.id, updates);

    // Log Activity
    await addActivity({
      project_id: project.id,
      project_name: project.name,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      activity_date: new Date().toISOString().split('T')[0],
      activity_time: new Date().toTimeString().slice(0, 5),
      channel: 'office_work',
      visit_purpose: 'follow_up',
      outcome: clampedPct === 100 ? 'won' : 'connected',
      notes: `تحديث نسبة التحصيل المالي للمشروع إلى ${clampedPct}% (المبلغ المحصل: SAR ${calculatedAmount.toLocaleString()} من إجمالي SAR ${totalProjectValue.toLocaleString()})`,
    }).catch(console.warn);

    setIsQuickPercentOpen(false);
    showFeedback(isRTL ? `تم تحديث نسبة التحصيل إلى ${clampedPct}% بنجاح!` : `Collection ratio updated to ${clampedPct}%!`);
    if (onUpdate) onUpdate();
  };

  // Handle Add Individual Payment Record
  const handleAddPaymentRecord = async () => {
    if (newPaymentAmount <= 0) {
      showFeedback(isRTL ? 'يرجى إدخال مبلغ صحيح للدفعة' : 'Please enter a valid payment amount', 'error');
      return;
    }

    const nextCollectedAmount = currentCollectedAmount + newPaymentAmount;
    const nextPercentage = totalProjectValue > 0 
      ? Math.min(100, Math.round((nextCollectedAmount / totalProjectValue) * 100))
      : 100;

    const newRecord: CollectionRecord = {
      id: 'pay_' + Date.now(),
      amount: newPaymentAmount,
      percentage: totalProjectValue > 0 ? Math.round((newPaymentAmount / totalProjectValue) * 100) : 0,
      payment_date: newPaymentDate,
      payment_method: newPaymentMethod,
      reference_number: newPaymentRef.trim() || undefined,
      notes: newPaymentNotes.trim() || undefined,
      recorded_by: currentUser.full_name,
      created_at: new Date().toISOString(),
    };

    const existingRecords = project.collection_records || [];
    const updatedRecords = [newRecord, ...existingRecords];

    const updates: Partial<Project> = {
      collected_amount: nextCollectedAmount,
      collected_percentage: nextPercentage,
      collection_status: nextPercentage >= 100 ? 'fully_collected' : 'partially_collected',
      collection_records: updatedRecords,
    };

    await updateProject(project.id, updates);

    // Log Activity
    await addActivity({
      project_id: project.id,
      project_name: project.name,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      activity_date: newPaymentDate,
      activity_time: new Date().toTimeString().slice(0, 5),
      channel: 'office_work',
      visit_purpose: 'follow_up',
      outcome: nextPercentage >= 100 ? 'won' : 'connected',
      notes: `تسجيل دفعة تحصيل جديدة بقيمة SAR ${newPaymentAmount.toLocaleString()} (${newPaymentMethod}) - المرجع: ${newPaymentRef || 'بدون'} - نسبة التحصيل الإجمالية الآن: ${nextPercentage}%`,
    }).catch(console.warn);

    // Reset Form
    setNewPaymentAmount(0);
    setNewPaymentPercentage(0);
    setNewPaymentRef('');
    setNewPaymentNotes('');
    setIsAddingPayment(false);

    showFeedback(isRTL ? 'تم تسجيل دفعة التحصيل وتحديث المؤشرات بنجاح!' : 'Payment logged and collection updated!');
    if (onUpdate) onUpdate();
  };

  return (
    <div className="bg-white dark:bg-[#1C2130] rounded-3xl border border-slate-200 dark:border-emerald-500/20 p-6 sm:p-7 shadow-xs space-y-7 font-urbanist relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-[#8FC2F0]/05 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isRTL ? 'إدارة أمر الشراء (PO) ونسب التحصيل المالي' : 'Purchase Order (PO) & Cash Collection'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
              {isRTL ? 'المشروع معتمد (Won)' : 'Closed Won'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isRTL 
              ? 'توثيق مستند التعميد الرسمي من العميل، ومتابعة جدول دفعات التحصيل والتدفق النقدي للمشروع.'
              : 'Official purchase order document custody, milestone billing, and collected revenue tracking.'}
          </p>
        </div>

        {/* Quick Percentage Trigger Button */}
        <button
          type="button"
          onClick={() => setIsQuickPercentOpen(!isQuickPercentOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-emerald-600/25 cursor-pointer self-start sm:self-auto"
        >
          <Percent className="w-3.5 h-3.5" />
          <span>{isRTL ? 'تعديل نسبة التحصيل' : 'Adjust Collection %'}</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* QUICK PERCENTAGE ADJUSTER ACCORDION */}
      {isQuickPercentOpen && (
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#232A38] border border-emerald-200/80 dark:border-emerald-500/30 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isRTL ? 'تحديد نسبة التحصيل المباشرة:' : 'Direct Collection Ratio Preset:'}</span>
            </span>
            <button 
              type="button" 
              onClick={() => setIsQuickPercentOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { pct: 0, labelAr: '0% (لم يبدأ)', labelEn: '0% (None)' },
              { pct: 10, labelAr: '10% (دفعة مقدمة)', labelEn: '10% (Advance)' },
              { pct: 25, labelAr: '25% (أمر المواد)', labelEn: '25% (Materials)' },
              { pct: 50, labelAr: '50% (توريد الموقع)', labelEn: '50% (Delivery)' },
              { pct: 75, labelAr: '75% (التركيب والاختبار)', labelEn: '75% (Installation)' },
              { pct: 90, labelAr: '90% (استلام ابتدائي)', labelEn: '90% (Testing)' },
              { pct: 100, labelAr: '100% (تحصيل كامل ومخالصة)', labelEn: '100% (Fully Closed)' },
            ].map(item => (
              <button
                key={item.pct}
                type="button"
                onClick={() => handleApplyQuickPercentage(item.pct)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  currentPercentage === item.pct
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-[#1C2130] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                }`}
              >
                {isRTL ? item.labelAr : item.labelEn}
              </button>
            ))}
          </div>

          {/* Custom Slider / Number Input */}
          <div className="flex items-center gap-4 pt-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={targetPercentage}
              onChange={(e) => setTargetPercentage(Number(e.target.value))}
              className="flex-1 accent-emerald-600 cursor-pointer"
            />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono w-12 text-center">
                {targetPercentage}%
              </span>
              <button
                type="button"
                onClick={() => handleApplyQuickPercentage(targetPercentage)}
                className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                {isRTL ? 'تطبيق النسبة' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* METRICS SUMMARY CARDS & PROGRESS BAR */}
      <div className="space-y-3">
        {/* Progress Bar Header */}
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>{isRTL ? 'إنجاز التحصيل الفعلي للمشروع:' : 'Project Collection Milestone:'}</span>
          </span>
          <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">
            {currentPercentage}% {isRTL ? 'محصل' : 'Collected'}
          </span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              currentPercentage >= 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : currentPercentage >= 50
                  ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                  : currentPercentage > 0
                    ? 'bg-gradient-to-r from-amber-500 to-blue-500'
                    : 'bg-slate-300 dark:bg-slate-700'
            }`}
            style={{ width: `${Math.max(3, currentPercentage)}%` }}
          />
        </div>

        {/* 3 Key Financial Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* 1. Total PO / Project Value */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#232A38]/70 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              {isRTL ? 'قيمة أمر الشراء / المشروع' : 'Total Contract Value'}
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {formatCurrencySAR(totalProjectValue)}
            </div>
            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
              {project.po_number ? `PO: ${project.po_number}` : (isRTL ? 'القيمة التعاقدية الكاملة' : 'Contracted Base')}
            </span>
          </div>

          {/* 2. Collected Amount */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
              {isRTL ? 'المبلغ المحصل الفعلي' : 'Total Cash Collected'}
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300">
              {formatCurrencySAR(currentCollectedAmount)}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
              {currentPercentage}% {isRTL ? 'من إجمالي العقد' : 'of contract value'}
            </span>
          </div>

          {/* 3. Remaining Balance */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
              {isRTL ? 'المتبقي للتحصيل' : 'Outstanding Balance'}
            </span>
            <div className="text-lg sm:text-xl font-black text-amber-800 dark:text-amber-300">
              {formatCurrencySAR(remainingBalance)}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
              {100 - currentPercentage}% {isRTL ? 'بانتظار الاستحقاق' : 'pending collection'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: PURCHASE ORDER (PO) ATTACHMENT & DATA */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-[#8FC2F0]" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isRTL ? 'مستند وبيانات أمر الشراء (PO Attachment & Details)' : 'Purchase Order Document & Metadata'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingPO(!isEditingPO)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Edit className="w-3 h-3" />
              <span>{isEditingPO ? (isRTL ? 'إلغاء التعديل' : 'Cancel') : (isRTL ? 'تعديل بيانات الـ PO' : 'Edit PO Details')}</span>
            </button>
          </div>
        </div>

        {/* PO Details Editor (When Open) */}
        {isEditingPO && (
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-[#232A38] border border-blue-200 dark:border-blue-900/60 space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  {isRTL ? 'رقم أمر الشراء / التعميد (PO #)' : 'PO Reference Number'}
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="PO-2026-..."
                  className="w-full px-3 py-2 bg-white dark:bg-[#1C2130] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  {isRTL ? 'تاريخ أمر الشراء' : 'PO Issuance Date'}
                </label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1C2130] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  {isRTL ? 'قيمة التعميد (SAR)' : 'PO Amount (SAR)'}
                </label>
                <input
                  type="number"
                  value={poAmount}
                  onChange={(e) => setPoAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1C2130] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {isRTL ? 'ملاحظات أمر الشراء والشروط الملحقة' : 'PO Terms & Commercial Notes'}
              </label>
              <textarea
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                rows={2}
                placeholder={isRTL ? 'مثال: 10% دفعة مقدمة، 90% ضد التوريد بموجب الفاتورة الرسمية...' : 'e.g., 10% advance against delivery, 90% upon technical submittal acceptance...'}
                className="w-full px-3 py-2 bg-white dark:bg-[#1C2130] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingPO(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSavePODetails}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isRTL ? 'حفظ البيانات' : 'Save Details'}</span>
              </button>
            </div>
          </div>
        )}

        {/* PO File Attachment Display or Dropzone */}
        {project.po_attachment_url ? (
          /* Attached File Card */
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {project.po_attachment_name || 'Purchase_Order.pdf'}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold">
                    {project.po_attachment_size ? `${Math.round(project.po_attachment_size / 1024)} KB` : 'Verified'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                  {project.po_number && (
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {isRTL ? 'رقم التعميد:' : 'Ref:'} {project.po_number}
                    </span>
                  )}
                  {project.po_uploaded_by && (
                    <span>
                      {isRTL ? 'تم الرفع بواسطة:' : 'Uploaded by:'} {project.po_uploaded_by}
                    </span>
                  )}
                  {project.po_uploaded_at && (
                    <span>{formatDateString(project.po_uploaded_at)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons for Attached PO */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <a
                href={project.po_attachment_url}
                download={project.po_attachment_name || 'Purchase_Order.pdf'}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-white dark:bg-[#232A38] hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>{isRTL ? 'تحميل المستند' : 'Download'}</span>
              </a>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-white dark:bg-[#232A38] hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                <span>{isRTL ? 'استبدال' : 'Replace'}</span>
              </button>

              <button
                type="button"
                onClick={handleRemovePOAttachment}
                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                title={isRTL ? 'حذف المرفق' : 'Remove Attachment'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Dropzone / Upload Trigger */
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500/80 bg-slate-50/60 dark:bg-[#232A38]/40 hover:bg-emerald-50/20 transition-all text-center cursor-pointer group space-y-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-800 dark:text-white">
                {isRTL ? 'اضغط هنا لرفع ملف أمر الشراء (PO) أو اسحب وأفلت الملف' : 'Click to Upload Purchase Order (PO) or Drag & Drop'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRTL 
                  ? 'يدعم ملفات PDF، الصور (PNG, JPG)، مستندات Word بحد أقصى 15 ميجابايت' 
                  : 'Supports PDF, Images (PNG, JPG), Word Docs up to 15MB'}
              </p>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* SECTION 2: INDIVIDUAL PAYMENT MILESTONES / HISTORY */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isRTL ? 'سجل دفعات التحصيل المالي (Payment Installments)' : 'Collection Payment Records'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              {(project.collection_records || []).length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingPayment(!isAddingPayment)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingPayment ? (isRTL ? 'إلغاء' : 'Cancel') : (isRTL ? 'تسجيل دفعة محصلة' : 'Record Payment')}</span>
          </button>
        </div>

        {/* Add Payment Form */}
        {isAddingPayment && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/40 dark:bg-[#232A38] border border-emerald-200 dark:border-emerald-800/80 space-y-4 animate-in fade-in">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {isRTL ? 'بيانات الدفعة المستلمة:' : 'Received Payment Details:'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  {isRTL ? 'مبلغ الدفعة (SAR) *' : 'Payment Amount (SAR) *'}
                </label>
                <input
                  type="number"
                  value={newPaymentAmount || ''}
                  onChange={(e) => setNewPaymentAmount(Number(e.target.value))}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 bg-white dark:bg-[#1C2130] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  {isRTL ? 'تاريخ الاستلام *' : 'Payment Date *'}
                </label>
                <input
                  type="date"
                  value={newPaymentDate}
                  onChange={(e) => setNewPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1C2130] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  {isRTL ? 'طريقة الدفع' : 'Payment Channel'}
                </label>
                <select
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1C2130] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="bank_transfer">{isRTL ? 'حوالة بنكية سريعة (Bank Transfer)' : 'Bank Transfer'}</option>
                  <option value="cheque">{isRTL ? 'شيك بنكي (Cheque)' : 'Cheque'}</option>
                  <option value="cash">{isRTL ? 'نقدي (Cash)' : 'Cash'}</option>
                  <option value="letter_of_credit">{isRTL ? 'اعتماد مستندي (LC)' : 'Letter of Credit'}</option>
                  <option value="other">{isRTL ? 'أخرى' : 'Other'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  {isRTL ? 'رقم الشيك أو الحوالة المرجعي' : 'Cheque / Transfer Reference #'}
                </label>
                <input
                  type="text"
                  value={newPaymentRef}
                  onChange={(e) => setNewPaymentRef(e.target.value)}
                  placeholder="e.g. TR-998823 / CHQ-1002"
                  className="w-full px-3 py-2 bg-white dark:bg-[#1C2130] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  {isRTL ? 'ملاحظات الدفعة (مثال: دفعة 10% مقدمة)' : 'Notes (e.g., 10% Advance)'}
                </label>
                <input
                  type="text"
                  value={newPaymentNotes}
                  onChange={(e) => setNewPaymentNotes(e.target.value)}
                  placeholder={isRTL ? 'ملاحظات الدفعة المستلمة...' : 'Payment notes...'}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1C2130] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingPayment(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAddPaymentRecord}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isRTL ? 'تأكيد وحفظ الدفعة' : 'Confirm & Save Payment'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Payment History List */}
        {(!project.collection_records || project.collection_records.length === 0) ? (
          <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <DollarSign className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {isRTL ? 'لم يتم تسجيل دفعات تحصيل مفصلة بعد' : 'No individual payment installments logged yet'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isRTL 
                ? 'يمكنك تسجيل كل دفعة محصلة من المقاول أو تعديل النسبة الإجمالية مباشرة.' 
                : 'Log each payment milestone as received from contractor or adjust percentage directly.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#1E2328]">
            {project.collection_records.map((rec) => (
              <div 
                key={rec.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#232A38]/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrencySAR(rec.amount)}
                      </span>
                      {rec.percentage ? (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                          ~{rec.percentage}%
                        </span>
                      ) : null}
                      <span className="text-xs font-medium text-slate-400">
                        • {formatDateString(rec.payment_date)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                        {rec.payment_method?.replace('_', ' ')}
                      </span>
                      {rec.reference_number && (
                        <span>• Ref: {rec.reference_number}</span>
                      )}
                      {rec.recorded_by && (
                        <span>• By: {rec.recorded_by}</span>
                      )}
                      {rec.notes && (
                        <span className="text-slate-600 dark:text-slate-300 italic font-normal">
                          &quot;{rec.notes}&quot;
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
