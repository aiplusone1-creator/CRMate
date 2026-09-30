'use client';

import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  DollarSign, 
  Download, 
  FileUp, 
  History, 
  TrendingDown, 
  Tag, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Bell, 
  Plus, 
  Building2, 
  ShieldCheck, 
  Trash2,
  ExternalLink,
  Pencil
} from 'lucide-react';
import { Project, Quotation, QuotationStatus } from '@/types/crm';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';
import { calculateDifference, formatCompactSAR } from '@/lib/logic/quotation-pricing';

interface QuotationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  project: Project;
  allProjectQuotations: Quotation[];
  onOpenRevisionModal: (parentQuote: Quotation) => void;
  onOpenPrintModal: (q: Quotation) => void;
  onOpenEditModal?: (q: Quotation) => void;
  onDeleteQuotation?: (q: Quotation) => void;
}

export function QuotationDetailModal({
  isOpen,
  onClose,
  quotation,
  project,
  allProjectQuotations,
  onOpenRevisionModal,
  onOpenPrintModal,
  onOpenEditModal,
  onDeleteQuotation,
}: QuotationDetailModalProps) {
  const { updateQuotationStatus, archiveQuotation, openFastLog, openReminder, currentRole, openRequestModal } = useCRM();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !quotation) return null;

  // Locate previous version in series if available
  const previousVersion = allProjectQuotations.find(
    q => q.project_id === quotation.project_id && 
         q.quotation_number === quotation.quotation_number && 
         q.version === quotation.version - 1
  );

  const priceDiff = previousVersion 
    ? calculateDifference(quotation.amount, previousVersion.amount)
    : null;

  const handleStatusChange = async (newStatus: QuotationStatus) => {
    try {
      setIsUpdatingStatus(true);
      await updateQuotationStatus(quotation.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleLogActivity = () => {
    onClose();
    openFastLog({
      project,
      defaultGoal: `Follow up on Quotation ${quotation.quotation_number} / V${quotation.version} with client`,
    });
  };

  const handleSetReminder = () => {
    onClose();
    openReminder({
      entity_type: 'project',
      entity_id: project.id,
      entity_name: project.name,
      project_id: project.id,
      project_name: project.name,
      title: `Follow up: Quote ${quotation.quotation_number} / V${quotation.version}`,
      notes: `Commercial quote of ${formatCurrencySAR(quotation.amount)} valid until ${formatDateString(quotation.valid_until)}.`,
    });
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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1C2130] rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 flex items-center justify-center shadow-2xs font-bold text-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded border border-slate-200 dark:border-slate-700">
                  {quotation.quotation_number}
                </span>
                <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white font-urbanist">
                  V{quotation.version}
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${statusColorMap[quotation.status] || 'bg-slate-100'}`}>
                  {quotation.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {project.pr_number} &bull; {project.name}
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Main Price & Status Summary Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900/60 border border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5 font-urbanist">
                {isRTL ? 'إجمالي قيمة عرض السعر (SAR)' : 'Total Quotation Commercial Value'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-urbanist">
                {formatCurrencySAR(quotation.amount)}
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  {isRTL ? 'تاريخ التقديم:' : 'Date:'} {formatDateString(quotation.quotation_date || quotation.sent_date || quotation.created_at)}
                </span>
                {quotation.valid_until && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {isRTL ? 'صالح حتى:' : 'Valid Until:'} {formatDateString(quotation.valid_until)}
                  </span>
                )}
              </div>
            </div>

            {/* Change Status Dropdown */}
            {currentRole !== 'viewer' && (
              <div className="shrink-0">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {isRTL ? 'تحديث حالة العرض' : 'Quotation Status'}
                </label>
                <select
                  disabled={isUpdatingStatus}
                  value={quotation.status}
                  onChange={(e) => handleStatusChange(e.target.value as QuotationStatus)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs cursor-pointer"
                >
                  <option value="draft">Draft (مسودة)</option>
                  <option value="internal_review">Internal Review (مراجعة داخلية)</option>
                  <option value="submitted">Submitted / Sent (مقدم للعميل)</option>
                  <option value="revised">Revised / Superseded (معدل ببديل)</option>
                  <option value="negotiation">Negotiation (مفاوضات)</option>
                  <option value="accepted">Accepted / Approved (معتمد)</option>
                  <option value="rejected">Rejected (مرفوض)</option>
                  <option value="expired">Expired (منتهي الصلاحية)</option>
                  <option value="cancelled">Cancelled (ملغي)</option>
                </select>
              </div>
            )}
          </div>

          {/* Pricing Breakdown Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 font-urbanist">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                {isRTL ? 'المبلغ الأساسي' : 'Subtotal'}
              </span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {formatCurrencySAR(quotation.subtotal ?? quotation.amount)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                {isRTL ? 'الخصم التجاري' : 'Discount'}
              </span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {quotation.discount_amount && quotation.discount_amount > 0
                  ? `-${formatCurrencySAR(quotation.discount_amount)} (${quotation.discount_percentage || 0}%)`
                  : '0.00 SAR (0%)'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                {isRTL ? 'ضريبة القيمة المضافة (VAT)' : 'Tax (VAT)'}
              </span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {formatCurrencySAR(quotation.tax_amount || 0)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-0.5">
                {isRTL ? 'الإجمالي النهائي' : 'Final Total'}
              </span>
              <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                {formatCurrencySAR(quotation.amount)}
              </span>
            </div>
          </div>

          {/* Revision Metadata Callout (if revision > 1) */}
          {previousVersion && priceDiff && (
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-xs font-urbanist">
                  <History className="w-4 h-4 text-amber-600" />
                  <span>{isRTL ? 'مقارنة بالإصدار السابق' : 'Revision from Previous Version'}: V{previousVersion.version}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 font-urbanist">
                  <span>{priceDiff.formattedAmount}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-[10px]">
                    {priceDiff.formattedPercentage}
                  </span>
                </div>
              </div>

              {quotation.revision_reason && (
                <div className="pt-1.5 border-t border-amber-200/60 dark:border-amber-900/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-0.5 font-urbanist">
                    {isRTL ? 'سبب التعديل المعتمد:' : 'Documented Revision Reason:'}
                  </span>
                  <p className="text-xs text-amber-950 dark:text-amber-100 font-medium leading-relaxed">
                    &ldquo;{quotation.revision_reason}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Commercial & Contractual Terms */}
          <div className="space-y-2">
            <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider font-urbanist">
              {isRTL ? 'الشروط والضوابط التجارية' : 'Commercial Terms & Scope'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">
                  {isRTL ? 'شروط الدفع' : 'Payment Terms'}
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {quotation.payment_terms || (isRTL ? '10% دفعة مقدمة، 90% مقابل التوريد' : '10% Advance, 90% against delivery')}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">
                  {isRTL ? 'مدة وشروط التوريد' : 'Delivery Terms'}
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {quotation.delivery_terms || (isRTL ? '4-6 أسابيع من أمر الشراء الرسمي' : '4-6 Weeks from Official Purchase Order')}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">
                  {isRTL ? 'الضمان المعتمد' : 'Warranty Terms'}
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {quotation.warranty_terms || (isRTL ? 'سنة واحدة شاملة ضمان المصنع' : '1 Year Standard Manufacturer Warranty')}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">
                  {isRTL ? 'النطاق / الماركة' : 'Brand & Scope'}
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {quotation.vendor_brand || 'Belimo / Al Mespar Valve Package'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes & Technical Remarks */}
          {(quotation.notes || quotation.technical_notes) && (
            <div className="space-y-2">
              <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider font-urbanist">
                {isRTL ? 'ملاحظات العرض والمواصفات الفنية' : 'Notes & Technical Remarks'}
              </h4>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                {quotation.notes && <p className="mb-1">{quotation.notes}</p>}
                {quotation.technical_notes && <p className="text-slate-500">{quotation.technical_notes}</p>}
              </div>
            </div>
          )}

          {/* Attached Document Section */}
          <div className="space-y-2">
            <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider font-urbanist">
              {isRTL ? 'مستند عرض السعر المرفق' : 'Attached Quotation Document'}
            </h4>
            {quotation.file_url ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {quotation.file_name || `Quotation_${quotation.quotation_number}_V${quotation.version}.pdf`}
                    </div>
                    {quotation.file_size && (
                      <span className="text-[10px] text-slate-500 font-medium">{quotation.file_size}</span>
                    )}
                  </div>
                </div>

                <a
                  href={quotation.file_url}
                  download={quotation.file_name || `Quotation_${quotation.quotation_number}_V${quotation.version}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-300 dark:border-emerald-700 shadow-2xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'تنزيل الملف' : 'Download PDF'}</span>
                </a>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 italic text-center">
                {isRTL ? 'لا يوجد ملف مستند مرفق لهذا الإصدار.' : 'No file document attached to this version.'}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: Fast Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleLogActivity}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{isRTL ? 'تسجيل نشاط' : 'Log Activity'}</span>
            </button>

            <button
              type="button"
              onClick={handleSetReminder}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Bell className="w-3.5 h-3.5 text-purple-600" />
              <span>{isRTL ? 'تذكير متابعة' : 'Set Reminder'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPrintModal(quotation);
              }}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>{isRTL ? 'المستند الرسمي' : 'Official Sheet'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentRole !== 'viewer' && (
              <>
                {onOpenEditModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenEditModal(quotation);
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800/80 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'تعديل السعر' : 'Edit Quote'}</span>
                  </button>
                )}

                {onDeleteQuotation && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onDeleteQuotation(quotation);
                    }}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800/80 transition-all flex items-center justify-center shadow-2xs"
                    title={isRTL ? 'حذف هذا العرض' : 'Delete quotation'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRevisionModal(quotation);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'إصدار معدل' : 'Create Revision'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
