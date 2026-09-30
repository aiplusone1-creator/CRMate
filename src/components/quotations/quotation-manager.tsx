'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Layers, 
  History, 
  Download, 
  Printer, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Tag, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  FileUp,
  Trash2,
  ExternalLink,
  ChevronRight,
  Pencil,
  AlertTriangle
} from 'lucide-react';
import { Project, Quotation, QuotationStatus } from '@/types/crm';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';
import { 
  calculateDifference, 
  calculateReductionSummary, 
  formatCompactSAR 
} from '@/lib/logic/quotation-pricing';
import { PriceHistoryChart } from './price-history-chart';
import { QuotationDetailModal } from './quotation-detail-modal';
import { QuotationComparisonModal } from './quotation-comparison-modal';
import { AddQuotationModal } from '@/components/modals/add-quotation-modal';
import { QuotationPrintModal } from '@/components/modals/quotation-print-modal';

interface QuotationManagerProps {
  project: Project;
}

export function QuotationManager({ project }: QuotationManagerProps) {
  const { quotations, currentRole, deleteQuotation, archiveQuotation, openRequestModal } = useCRM();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  // Filter project's quotations
  const projectQuotations = quotations
    .filter(q => q.project_id === project.id && !q.is_archived)
    .sort((a, b) => b.version - a.version); // latest first

  // Latest / Current Quotation
  const latestQuotation = projectQuotations.length > 0 ? projectQuotations[0] : null;

  // Previous quotation in the same series as the latest
  const previousQuotation = (latestQuotation && latestQuotation.version > 1)
    ? projectQuotations.find(q => q.quotation_number === latestQuotation.quotation_number && q.version === latestQuotation.version - 1)
    : null;

  const latestDiff = (latestQuotation && previousQuotation)
    ? calculateDifference(latestQuotation.amount, previousQuotation.amount)
    : null;

  // Cumulative Reduction Summary from V1
  const sortedAscending = [...projectQuotations].sort((a, b) => a.version - b.version);
  const reductionSummary = calculateReductionSummary(sortedAscending);

  // Modal States
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [selectedParentQuoteForRevision, setSelectedParentQuoteForRevision] = useState<Quotation | null>(null);
  const [selectedQuoteForDetail, setSelectedQuoteForDetail] = useState<Quotation | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [selectedQuoteForPrint, setSelectedQuoteForPrint] = useState<Quotation | null>(null);
  const [selectedQuoteForEdit, setSelectedQuoteForEdit] = useState<Quotation | null>(null);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!quotationToDelete) return;
    try {
      setIsDeleting(true);
      await deleteQuotation(quotationToDelete.id);
      setQuotationToDelete(null);
    } catch (err) {
      console.error('Failed to delete quotation:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const statusColorMap: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    internal_review: 'bg-amber-50 text-amber-700 border-amber-200',
    under_review: 'bg-amber-50 text-amber-700 border-amber-200',
    sent: 'bg-blue-50 text-blue-700 border-blue-200',
    submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    revised: 'bg-purple-50 text-purple-700 border-purple-200',
    negotiation: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    expired: 'bg-slate-100 text-slate-500 border-slate-200',
    cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
  };

  const handleOpenRevision = (q: Quotation) => {
    setSelectedParentQuoteForRevision(q);
    setIsRevisionModalOpen(true);
  };

  return (
    <div className="bg-white dark:bg-[#1C2130] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
      
      {/* 1. Header Bar: Title + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 flex items-center justify-center shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 dark:text-white font-urbanist">
                {isRTL ? 'إدارة عروض الأسعار وسجل التعديلات' : 'Quotation Management & Price History'}
              </h2>
              <span className="text-xs font-black text-blue-600 dark:text-[#8FC2F0] bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                {projectQuotations.length} {isRTL ? 'إصدارات' : 'Versions'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isRTL 
                ? 'تتبع الإصدارات السعرية غير المتلفة، وسجل الخصومات، والمسار التاريخي للمفاوضات.' 
                : 'Immutable quotation versioning, commercial submittals, and price reduction tracking.'}
            </p>
          </div>
        </div>

        {/* Global Quotation Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {projectQuotations.length >= 2 && (
            <button
              onClick={() => setIsComparisonModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              title={isRTL ? 'مقارنة الفروقات بين أي إصدارين' : 'Compare two quotation versions side-by-side'}
            >
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>{isRTL ? 'مقارنة الإصدارات' : 'Compare Versions'}</span>
            </button>
          )}

          {currentRole !== 'viewer' && (
            <button
              onClick={() => setIsNewQuoteModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isRTL ? 'عرض سعر جديد (+)' : '+ New Quotation'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Empty State if no quotations */}
      {projectQuotations.length === 0 ? (
        <div className="p-10 text-center bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-500 flex items-center justify-center mb-3">
            <FileUp className="w-6 h-6" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {isRTL ? 'لا توجد عروض أسعار مسجلة لهذا المشروع بعد' : 'No quotations yet'}
          </span>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
            {isRTL 
              ? 'ابدأ بتسجيل عروض أسعارك الرسمية ومرفقات الـ PDF لتتبع إصدارات وتخفيضات الأسعار تلقائياً.'
              : 'Start tracking your commercial submissions and revisions for this project.'}
          </p>
          {currentRole !== 'viewer' && (
            <button
              onClick={() => setIsNewQuoteModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isRTL ? 'إنشاء أول عرض سعر' : '+ Create Quotation'}</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 3. Section 9: CURRENT QUOTATION HERO CARD */}
          {latestQuotation && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-slate-50 dark:from-blue-950/30 dark:via-[#1C2130] dark:to-slate-900 border-2 border-blue-200 dark:border-blue-900/60 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-urbanist">
                      {isRTL ? 'عرض السعر الحالي' : 'CURRENT QUOTATION'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                      {latestQuotation.quotation_number}
                    </span>
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-urbanist">
                      V{latestQuotation.version}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${statusColorMap[latestQuotation.status] || 'bg-slate-100'}`}>
                      {latestQuotation.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-3xl font-black text-slate-900 dark:text-white font-urbanist tracking-tight">
                    {formatCurrencySAR(latestQuotation.amount)}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {isRTL ? 'تاريخ العرض:' : 'Date:'} {formatDateString(latestQuotation.quotation_date || latestQuotation.sent_date)}
                    </span>
                    {latestQuotation.valid_until && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {isRTL ? 'صالح حتى:' : 'Valid Until:'} {formatDateString(latestQuotation.valid_until)}
                      </span>
                    )}
                    {latestQuotation.vendor_brand && (
                      <span className="text-slate-400">&bull; {latestQuotation.vendor_brand}</span>
                    )}
                  </div>
                </div>

                {/* Hero Quick Actions */}
                <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
                  <button
                    onClick={() => setSelectedQuoteForDetail(latestQuotation)}
                    className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isRTL ? 'عرض التفاصيل' : 'View Details'}</span>
                  </button>

                  {currentRole !== 'viewer' && (
                    <>
                      <button
                        onClick={() => setSelectedQuoteForEdit(latestQuotation)}
                        className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800/80 shadow-2xs transition-all flex items-center gap-1.5"
                        title={isRTL ? 'تعديل هذا العرض' : 'Edit quotation details'}
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>{isRTL ? 'تعديل' : 'Edit'}</span>
                      </button>

                      <button
                        onClick={() => setQuotationToDelete(latestQuotation)}
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800/80 shadow-2xs transition-all flex items-center justify-center"
                        title={isRTL ? 'حذف هذا العرض' : 'Delete quotation'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenRevision(latestQuotation)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isRTL ? 'إصدار معدل (+)' : '+ New Revision'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Step Comparison vs Previous Version (Section 9 Requirement) */}
              {previousQuotation && latestDiff && (
                <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {isRTL ? 'مقارنة بالإصدار السابق:' : 'Previous Version:'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      V{previousQuotation.version} &bull; {formatCurrencySAR(previousQuotation.amount)}
                    </span>
                    {latestQuotation.revision_reason && (
                      <span className="text-slate-400 text-[11px] italic">
                        (&ldquo;{latestQuotation.revision_reason}&rdquo;)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-urbanist">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        {isRTL ? 'الفارق' : 'Difference'}
                      </span>
                      <span className="font-black text-xs text-slate-800 dark:text-slate-200">
                        {latestDiff.formattedAmount}
                      </span>
                    </div>

                    <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        {isRTL ? 'نسبة الخصم' : 'Discount from Prev'}
                      </span>
                      <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 justify-end">
                        <TrendingDown className="w-3 h-3" />
                        <span>{latestDiff.formattedPercentage}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Section 16: DISCOUNT ANALYSIS & REVISIONS STATS KPI BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-urbanist">
            {/* Original Baseline V1 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {isRTL ? 'عرض السعر المبدئي (V1)' : 'Original Quotation (V1)'}
              </span>
              <span className="text-base font-extrabold text-slate-800 dark:text-slate-200 block">
                {formatCurrencySAR(reductionSummary.originalAmount)}
              </span>
              <span className="text-[10px] text-slate-400">
                {formatDateString(reductionSummary.initialDate)}
              </span>
            </div>

            {/* Total Reduction from V1 */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                {isRTL ? 'إجمالي الخصم من V1' : 'Total Reduction from V1'}
              </span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300 block">
                {reductionSummary.formattedReduction}
              </span>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                {reductionSummary.formattedPercentage} {isRTL ? 'تخفيض تراكمي' : 'Cumulative discount'}
              </span>
            </div>

            {/* Revisions Count */}
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block mb-1">
                {isRTL ? 'عدد التعديلات والإصدارات' : 'Number of Revisions'}
              </span>
              <span className="text-base font-black text-purple-800 dark:text-purple-300 block">
                {reductionSummary.revisionsCount} {isRTL ? 'إصدارات' : 'Revisions'}
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400">
                {isRTL ? 'حفظ دائم لكل إصدار' : '100% Immutable history'}
              </span>
            </div>

            {/* Days Active */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">
                {isRTL ? 'أيام التفاوض التجاري' : 'Days Since Initial Quote'}
              </span>
              <span className="text-base font-black text-blue-800 dark:text-blue-300 block">
                {reductionSummary.daysActive} {isRTL ? 'يوم' : 'Days'}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">
                {formatDateString(reductionSummary.latestDate)}
              </span>
            </div>
          </div>

          {/* 5. Section 13 & 14: VISUAL PRICE HISTORY & TRAJECTORY SVG CHART */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider font-urbanist flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600" />
              <span>{isRTL ? 'مسار الأسعار والتخفيضات (Price History)' : 'Price History & Reduction Trajectory'}</span>
            </h3>

            <PriceHistoryChart 
              quotations={projectQuotations} 
              onSelectQuotation={(q) => setSelectedQuoteForDetail(q)} 
            />
          </div>

          {/* 6. Section 8: QUOTATION HISTORY TABLE */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider font-urbanist flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{isRTL ? 'سجل إصدارات عروض الأسعار' : 'Quotation Versions History'}</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {isRTL ? 'مرتبة من الأحدث إلى الأقدم' : 'Sorted Latest &rarr; Earliest'}
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs font-urbanist">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-black">
                    <tr>
                      <th className="py-3 px-4">{isRTL ? 'الإصدار' : 'Version'}</th>
                      <th className="py-3 px-4">{isRTL ? 'رقم المرجع' : 'Quotation #'}</th>
                      <th className="py-3 px-4">{isRTL ? 'التاريخ' : 'Date'}</th>
                      <th className="py-3 px-4">{isRTL ? 'الحالة' : 'Status'}</th>
                      <th className="py-3 px-4">{isRTL ? 'سبب التعديل' : 'Revision Reason'}</th>
                      <th className="py-3 px-4 text-right">{isRTL ? 'القيمة (SAR)' : 'Value (SAR)'}</th>
                      <th className="py-3 px-4">{isRTL ? 'المرفق' : 'Attachment'}</th>
                      <th className="py-3 px-4 text-right">{isRTL ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {projectQuotations.map((q, idx) => {
                      const isLatest = idx === 0;

                      return (
                        <tr 
                          key={q.id}
                          onClick={() => setSelectedQuoteForDetail(q)}
                          className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          {/* Version */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`font-black uppercase text-[11px] px-2 py-0.5 rounded-md ${
                              isLatest 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}>
                              V{q.version}
                            </span>
                          </td>

                          {/* Quotation Number */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {q.quotation_number}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {formatDateString(q.quotation_date || q.sent_date || q.created_at)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${statusColorMap[q.status] || 'bg-slate-100'}`}>
                              {q.status.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Revision Reason */}
                          <td className="py-3 px-4 max-w-[220px]">
                            {q.revision_reason ? (
                              <span className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1" title={q.revision_reason}>
                                {q.revision_reason}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">
                                {isLatest && q.version === 1 ? (isRTL ? 'الإصدار المبدئي' : 'Initial submission') : '—'}
                              </span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white whitespace-nowrap text-sm">
                            {formatCurrencySAR(q.amount)}
                          </td>

                          {/* Attachment */}
                          <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {q.file_url ? (
                              <a
                                href={q.file_url}
                                download={q.file_name || `Quotation_${q.quotation_number}_V${q.version}.pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                                title="Download attached PDF"
                              >
                                <Download className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{q.file_name || 'PDF'}</span>
                              </a>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedQuoteForDetail(q)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                                title={isRTL ? 'عرض التفاصيل' : 'View quotation details'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setSelectedQuoteForPrint(q)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                                title={isRTL ? 'طباعة المستند الرسمي' : 'Print official quotation sheet'}
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {currentRole !== 'viewer' && (
                                <>
                                  <button
                                    onClick={() => setSelectedQuoteForEdit(q)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                                    title={isRTL ? 'تعديل عرض السعر' : 'Edit quotation'}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleOpenRevision(q)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
                                    title={isRTL ? 'إنشاء إصدار معدل من هذا العرض' : 'Create revision based on this version'}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setQuotationToDelete(q)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                                    title={isRTL ? 'حذف عرض السعر' : 'Delete quotation'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- MODALS --- */}

      {/* 1. Add New Quotation Modal (Mode: new) */}
      <AddQuotationModal
        isOpen={isNewQuoteModalOpen}
        onClose={() => setIsNewQuoteModalOpen(false)}
        project={project}
        existingVersionsCount={projectQuotations.length}
        mode="new"
      />

      {/* 2. Create Revision Modal (Mode: revision) */}
      <AddQuotationModal
        isOpen={isRevisionModalOpen}
        onClose={() => {
          setIsRevisionModalOpen(false);
          setSelectedParentQuoteForRevision(null);
        }}
        project={project}
        existingVersionsCount={projectQuotations.length}
        mode="revision"
        parentQuotation={selectedParentQuoteForRevision || latestQuotation}
      />

      {/* 2.5 Edit Quotation Modal (Mode: edit) */}
      {selectedQuoteForEdit && (
        <AddQuotationModal
          isOpen={Boolean(selectedQuoteForEdit)}
          onClose={() => setSelectedQuoteForEdit(null)}
          project={project}
          existingVersionsCount={projectQuotations.length}
          mode="edit"
          quotationToEdit={selectedQuoteForEdit}
        />
      )}

      {/* 3. Quotation Detail Modal */}
      <QuotationDetailModal
        isOpen={Boolean(selectedQuoteForDetail)}
        onClose={() => setSelectedQuoteForDetail(null)}
        quotation={selectedQuoteForDetail}
        project={project}
        allProjectQuotations={projectQuotations}
        onOpenRevisionModal={(q) => handleOpenRevision(q)}
        onOpenPrintModal={(q) => setSelectedQuoteForPrint(q)}
        onOpenEditModal={(q) => setSelectedQuoteForEdit(q)}
        onDeleteQuotation={(q) => setQuotationToDelete(q)}
      />

      {/* 4. Quotation Comparison Modal */}
      <QuotationComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        quotations={projectQuotations}
      />

      {/* 5. Print Sheet Modal */}
      {selectedQuoteForPrint && (
        <QuotationPrintModal
          isOpen={Boolean(selectedQuoteForPrint)}
          onClose={() => setSelectedQuoteForPrint(null)}
          project={project}
          quotation={selectedQuoteForPrint}
        />
      )}

      {/* 6. Delete Confirmation Modal */}
      {quotationToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2130] rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-urbanist">
                  {isRTL ? 'تأكيد حذف عرض السعر' : 'Confirm Quotation Deletion'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isRTL ? 'هذا الإجراء سيقوم بحذف عرض السعر نهائياً' : 'This action will permanently delete this quotation'}
                </p>
              </div>
            </div>

            {/* Quotation Details Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isRTL ? 'رقم العرض:' : 'Quotation #:'}</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {quotationToDelete.quotation_number}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isRTL ? 'الإصدار:' : 'Version:'}</span>
                <span className="font-black font-urbanist px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-md">
                  V{quotationToDelete.version}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isRTL ? 'القيمة:' : 'Amount:'}</span>
                <span className="font-black text-slate-900 dark:text-white font-urbanist text-sm">
                  {formatCurrencySAR(quotationToDelete.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isRTL ? 'التاريخ:' : 'Date:'}</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {formatDateString(quotationToDelete.quotation_date || quotationToDelete.created_at)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {isRTL 
                  ? 'سيتم مسح هذا السجل وتحديث مسار الأسعار والرسوم البيانية وتخفيضات المشروع تلقائياً.' 
                  : 'This record will be deleted and the project price history trajectory and discounts will update accordingly.'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setQuotationToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <span>{isRTL ? 'جاري الحذف...' : 'Deleting...'}</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{isRTL ? 'تأكيد الحذف' : 'Delete Quotation'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
