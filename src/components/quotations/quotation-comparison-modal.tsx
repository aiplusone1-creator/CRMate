'use client';

import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  TrendingDown, 
  TrendingUp, 
  FileText, 
  Check, 
  Layers, 
  Calendar,
  Download
} from 'lucide-react';
import { Quotation } from '@/types/crm';
import { useLanguage } from '@/lib/i18n/language-context';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';
import { calculateDifference, formatCompactSAR } from '@/lib/logic/quotation-pricing';

interface QuotationComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotations: Quotation[];
  initialVersionAId?: string;
  initialVersionBId?: string;
}

export function QuotationComparisonModal({
  isOpen,
  onClose,
  quotations,
  initialVersionAId,
  initialVersionBId,
}: QuotationComparisonModalProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const sortedQuotes = [...quotations]
    .filter(q => !q.is_archived)
    .sort((a, b) => a.version - b.version);

  // Default: Compare V1 against latest version
  const defaultA = sortedQuotes.length > 0 ? sortedQuotes[0].id : '';
  const defaultB = sortedQuotes.length > 1 ? sortedQuotes[sortedQuotes.length - 1].id : defaultA;

  const [versionAId, setVersionAId] = useState<string>(initialVersionAId || defaultA);
  const [versionBId, setVersionBId] = useState<string>(initialVersionBId || defaultB);

  if (!isOpen || sortedQuotes.length < 2) return null;

  const quoteA = sortedQuotes.find(q => q.id === versionAId) || sortedQuotes[0];
  const quoteB = sortedQuotes.find(q => q.id === versionBId) || sortedQuotes[sortedQuotes.length - 1];

  const diff = calculateDifference(quoteB.amount, quoteA.amount);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1C2130] rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-600 flex items-center justify-center shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base font-urbanist">
                {isRTL ? 'مقارنة إصدارات عروض الأسعار' : 'Quotation Versions Comparison'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isRTL 
                  ? 'مقارنة الفروقات المالية والشروط التجارية بين إصدارين معتمدين' 
                  : 'Compare commercial values, discounts, and contractual terms side-by-side'}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Selectors Bar */}
        <div className="p-4 bg-slate-100/60 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Version A Selector */}
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {isRTL ? 'الإصدار الأول (الأساس)' : 'Base Version A'}
            </label>
            <select
              value={versionAId}
              onChange={(e) => setVersionAId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-xs shadow-2xs focus:ring-2 focus:ring-blue-500"
            >
              {sortedQuotes.map(q => (
                <option key={q.id} value={q.id}>
                  V{q.version} &bull; {formatCompactSAR(q.amount)} ({formatDateString(q.quotation_date || q.sent_date)})
                </option>
              ))}
            </select>
          </div>

          <div className="shrink-0 flex items-center gap-2 pt-3 sm:pt-0">
            <span className="text-xs font-black text-slate-400 uppercase px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              VS
            </span>
          </div>

          {/* Version B Selector */}
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {isRTL ? 'الإصدار المقابل (المعدل)' : 'Target Version B'}
            </label>
            <select
              value={versionBId}
              onChange={(e) => setVersionBId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-xs shadow-2xs focus:ring-2 focus:ring-blue-500"
            >
              {sortedQuotes.map(q => (
                <option key={q.id} value={q.id}>
                  V{q.version} &bull; {formatCompactSAR(q.amount)} ({formatDateString(q.quotation_date || q.sent_date)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delta Callout Banner */}
        <div className="p-4 bg-gradient-to-r from-blue-50/80 via-emerald-50/50 to-slate-50 dark:from-blue-950/30 dark:via-emerald-950/20 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
              diff.isReduction 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' 
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
            }`}>
              {diff.isReduction ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                {isRTL ? 'صافي الفارق المالي بين الإصدارين' : 'Net Commercial Difference (V A → V B)'}
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-urbanist flex items-center gap-2 mt-0.5">
                <span>{diff.formattedAmount}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  diff.isReduction 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                }`}>
                  {diff.formattedPercentage}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 font-medium">
            <span>{isRTL ? 'المدة بين الإصدارين:' : 'Timeline Step:'} </span>
            <strong className="text-slate-800 dark:text-slate-200">
              V{quoteA.version} ({formatDateString(quoteA.quotation_date || quoteA.sent_date)}) &rarr; V{quoteB.version} ({formatDateString(quoteB.quotation_date || quoteB.sent_date)})
            </strong>
          </div>
        </div>

        {/* Side-by-Side Comparison Table */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs font-urbanist">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-1/3">{isRTL ? 'البند / الشطر المقارن' : 'Metric / Term'}</th>
                  <th className="py-3 px-4 w-1/3 bg-blue-50/40 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 font-extrabold">
                    Version {quoteA.version} ({quoteA.quotation_number})
                  </th>
                  <th className="py-3 px-4 w-1/3 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-300 font-extrabold">
                    Version {quoteB.version} ({quoteB.quotation_number})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Total Price */}
                <tr className="bg-slate-50/30 dark:bg-slate-900/30 font-bold">
                  <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                    {isRTL ? 'إجمالي السعر النهائي (SAR)' : 'Total Commercial Amount'}
                  </td>
                  <td className="py-3.5 px-4 font-black text-base text-slate-900 dark:text-white">
                    {formatCurrencySAR(quoteA.amount)}
                  </td>
                  <td className="py-3.5 px-4 font-black text-base text-blue-600 dark:text-[#8FC2F0]">
                    {formatCurrencySAR(quoteB.amount)}
                  </td>
                </tr>

                {/* Subtotal */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isRTL ? 'المبلغ الأساسي (قبل الخصم)' : 'Subtotal (Before Discount)'}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrencySAR(quoteA.subtotal ?? quoteA.amount)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrencySAR(quoteB.subtotal ?? quoteB.amount)}
                  </td>
                </tr>

                {/* Discount */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isRTL ? 'الخصم التجاري' : 'Discount Applied'}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                    {quoteA.discount_amount ? `${formatCurrencySAR(quoteA.discount_amount)} (${quoteA.discount_percentage}%)` : '0.00 SAR (0%)'}
                  </td>
                  <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                    {quoteB.discount_amount ? `${formatCurrencySAR(quoteB.discount_amount)} (${quoteB.discount_percentage}%)` : '0.00 SAR (0%)'}
                  </td>
                </tr>

                {/* Status */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isRTL ? 'الحالة' : 'Quotation Status'}</td>
                  <td className="py-3 px-4">
                    <span className="font-extrabold uppercase text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {quoteA.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-extrabold uppercase text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                      {quoteB.status}
                    </span>
                  </td>
                </tr>

                {/* Revision Reason */}
                <tr className="bg-amber-50/20 dark:bg-amber-950/10">
                  <td className="py-3 px-4 text-amber-900 dark:text-amber-300 font-bold">{isRTL ? 'سبب التعديل' : 'Revision Reason'}</td>
                  <td className="py-3 px-4 text-slate-500 italic">
                    {quoteA.revision_reason || (isRTL ? 'الإصدار المبدئي' : 'Initial submission')}
                  </td>
                  <td className="py-3 px-4 font-semibold text-amber-950 dark:text-amber-100">
                    {quoteB.revision_reason || '—'}
                  </td>
                </tr>

                {/* Payment Terms */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isRTL ? 'شروط الدفع' : 'Payment Terms'}</td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{quoteA.payment_terms || '10% Advance, 90% against delivery'}</td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{quoteB.payment_terms || '10% Advance, 90% against delivery'}</td>
                </tr>

                {/* Delivery Terms */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isRTL ? 'شروط التوريد' : 'Delivery Terms'}</td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{quoteA.delivery_terms || '4-6 Weeks from PO'}</td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{quoteB.delivery_terms || '4-6 Weeks from PO'}</td>
                </tr>

                {/* Warranty */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isRTL ? 'فترة الضمان' : 'Warranty Terms'}</td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{quoteA.warranty_terms || '1 Year Standard'}</td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{quoteB.warranty_terms || '1 Year Standard'}</td>
                </tr>

                {/* Attachment */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isRTL ? 'الملف المرفق' : 'Attached Document'}</td>
                  <td className="py-3 px-4">
                    {quoteA.file_url ? (
                      <a href={quoteA.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        <span>{quoteA.file_name || 'Download V' + quoteA.version}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {quoteB.file_url ? (
                      <a href={quoteB.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        <span>{quoteB.file_name || 'Download V' + quoteB.version}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {isRTL ? 'يتم حفظ جميع التعديلات والإصدارات بشكل دائم دون تعديل النسخ القديمة.' : 'All revisions remain immutable and permanently preserved.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            {isRTL ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
