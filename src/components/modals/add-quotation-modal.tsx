'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Check, 
  Calendar, 
  DollarSign, 
  Tag, 
  Trash2, 
  FileUp, 
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  History,
  ShieldCheck,
  TrendingDown,
  Pencil
} from 'lucide-react';
import { Project, Quotation, QuotationStatus } from '@/types/crm';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { 
  REVISION_REASONS, 
  PAYMENT_TERMS_PRESETS, 
  DELIVERY_TERMS_PRESETS, 
  WARRANTY_PRESETS,
  calculateQuotationTotals,
  calculateDifference
} from '@/lib/logic/quotation-pricing';
import { formatCurrencySAR } from '@/lib/utils';

export interface AddQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  existingVersionsCount?: number;
  mode?: 'new' | 'revision' | 'edit';
  parentQuotation?: Quotation | null;
  quotationToEdit?: Quotation | null;
}

export function AddQuotationModal({ 
  isOpen, 
  onClose, 
  project, 
  existingVersionsCount = 0,
  mode = 'new',
  parentQuotation = null,
  quotationToEdit = null
}: AddQuotationModalProps) {
  const { addQuotation, createQuotationRevision, updateQuotation, currentUser } = useCRM();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = mode === 'edit' && Boolean(quotationToEdit);
  const isRevision = mode === 'revision' && Boolean(parentQuotation);
  const nextVersion = isEdit
    ? quotationToEdit!.version
    : isRevision 
      ? (parentQuotation!.version + 1) 
      : (existingVersionsCount + 1);

  // Auto-generate professional base number (e.g. Q-2026-0018)
  const currentYear = new Date().getFullYear();
  const cleanPrNum = project.pr_number.replace(/\D/g, '').padStart(4, '0') || '0001';
  const defaultQuoteNum = isEdit
    ? quotationToEdit!.quotation_number
    : isRevision 
      ? parentQuotation!.quotation_number 
      : `Q-${currentYear}-${cleanPrNum}`;

  // Form States
  const [quotationNumber, setQuotationNumber] = useState(defaultQuoteNum);
  const [version, setVersion] = useState<number>(nextVersion);
  const [quotationDate, setQuotationDate] = useState(() => {
    if (isEdit && quotationToEdit) return quotationToEdit.quotation_date || quotationToEdit.sent_date || new Date().toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  });
  const [validUntil, setValidUntil] = useState(() => {
    if (isEdit && quotationToEdit?.valid_until) return quotationToEdit.valid_until;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Pricing breakdown states
  const initialSubtotal = isEdit
    ? (quotationToEdit!.subtotal || quotationToEdit!.amount)
    : isRevision 
      ? (parentQuotation!.subtotal || parentQuotation!.amount) 
      : (project.estimated_value || 100000);
  const [subtotal, setSubtotal] = useState<number>(initialSubtotal);
  const [discountAmount, setDiscountAmount] = useState<number>(
    isEdit ? (quotationToEdit!.discount_amount || 0) : isRevision ? (parentQuotation!.discount_amount || 0) : 0
  );
  const [discountPercentage, setDiscountPercentage] = useState<number>(
    isEdit ? (quotationToEdit!.discount_percentage || 0) : isRevision ? (parentQuotation!.discount_percentage || 0) : 0
  );
  const [discountMode, setDiscountMode] = useState<'fixed' | 'percentage'>(
    (isEdit && quotationToEdit?.discount_percentage && quotationToEdit.discount_percentage > 0) ? 'percentage' : 'percentage'
  );
  const [applyTax, setApplyTax] = useState<boolean>(
    isEdit ? Boolean(quotationToEdit!.tax_amount && quotationToEdit!.tax_amount > 0) : isRevision ? Boolean(parentQuotation!.tax_amount && parentQuotation!.tax_amount > 0) : false
  );

  // Commercial terms
  const [vendorBrand, setVendorBrand] = useState(
    isEdit ? (quotationToEdit!.vendor_brand || '') : isRevision ? (parentQuotation!.vendor_brand || '') : 'Belimo Valves & Actuators Package'
  );
  const [paymentTerms, setPaymentTerms] = useState(
    isEdit ? (quotationToEdit!.payment_terms || '') : isRevision ? (parentQuotation!.payment_terms || '') : '10% Advance, 90% against delivery'
  );
  const [deliveryTerms, setDeliveryTerms] = useState(
    isEdit ? (quotationToEdit!.delivery_terms || '') : isRevision ? (parentQuotation!.delivery_terms || '') : '4-6 Weeks from Official Purchase Order'
  );
  const [warrantyTerms, setWarrantyTerms] = useState(
    isEdit ? (quotationToEdit!.warranty_terms || '') : isRevision ? (parentQuotation!.warranty_terms || '') : '2 Years Comprehensive Manufacturer Warranty'
  );
  const [customerReference, setCustomerReference] = useState(
    isEdit ? (quotationToEdit!.customer_reference || '') : isRevision ? (parentQuotation!.customer_reference || '') : ''
  );
  const [rfqNumber, setRfqNumber] = useState(
    isEdit ? (quotationToEdit!.rfq_number || '') : isRevision ? (parentQuotation!.rfq_number || '') : ''
  );
  const [notes, setNotes] = useState(
    isEdit ? (quotationToEdit!.notes || '') : isRevision ? (parentQuotation!.notes || '') : ''
  );
  const [technicalNotes, setTechnicalNotes] = useState(
    isEdit ? (quotationToEdit!.technical_notes || '') : isRevision ? (parentQuotation!.technical_notes || '') : ''
  );

  // Revision Reason (Crucial for Section 12)
  const [selectedReasonChip, setSelectedReasonChip] = useState<string>(
    isRevision ? 'customer_discount' : ''
  );
  const [customRevisionReason, setCustomRevisionReason] = useState<string>('');

  // File Upload State
  const [attachedFileName, setAttachedFileName] = useState<string>(
    isEdit ? (quotationToEdit!.file_name || '') : isRevision ? (parentQuotation!.file_name || '') : ''
  );
  const [attachedFileSize, setAttachedFileSize] = useState<string>(
    isEdit ? (quotationToEdit!.file_size || '') : isRevision ? (parentQuotation!.file_size || '') : ''
  );
  const [attachedFileUrl, setAttachedFileUrl] = useState<string>(
    isEdit ? (quotationToEdit!.file_url || '') : isRevision ? (parentQuotation!.file_url || '') : ''
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize fields whenever parentQuotation, quotationToEdit or mode changes
  useEffect(() => {
    if (isEdit && quotationToEdit) {
      setQuotationNumber(quotationToEdit.quotation_number);
      setVersion(quotationToEdit.version);
      setQuotationDate(quotationToEdit.quotation_date || quotationToEdit.sent_date || new Date().toISOString().split('T')[0]);
      setValidUntil(quotationToEdit.valid_until || '');
      const sub = quotationToEdit.subtotal || quotationToEdit.amount;
      setSubtotal(sub);
      setDiscountAmount(quotationToEdit.discount_amount || 0);
      setDiscountPercentage(quotationToEdit.discount_percentage || 0);
      setDiscountMode((quotationToEdit.discount_percentage && quotationToEdit.discount_percentage > 0) ? 'percentage' : 'fixed');
      setApplyTax(Boolean(quotationToEdit.tax_amount && quotationToEdit.tax_amount > 0));
      setVendorBrand(quotationToEdit.vendor_brand || 'Belimo Valves & Actuators Package');
      setPaymentTerms(quotationToEdit.payment_terms || '10% Advance, 90% against delivery');
      setDeliveryTerms(quotationToEdit.delivery_terms || '4-6 Weeks from Official Purchase Order');
      setWarrantyTerms(quotationToEdit.warranty_terms || '2 Years Comprehensive Manufacturer Warranty');
      setCustomerReference(quotationToEdit.customer_reference || '');
      setRfqNumber(quotationToEdit.rfq_number || '');
      setNotes(quotationToEdit.notes || '');
      setTechnicalNotes(quotationToEdit.technical_notes || '');
      setAttachedFileName(quotationToEdit.file_name || '');
      setAttachedFileSize(quotationToEdit.file_size || '');
      setAttachedFileUrl(quotationToEdit.file_url || '');
    } else if (isRevision && parentQuotation) {
      setQuotationNumber(parentQuotation.quotation_number);
      setVersion(parentQuotation.version + 1);
      const sub = parentQuotation.subtotal || parentQuotation.amount;
      setSubtotal(sub);
      setDiscountAmount(parentQuotation.discount_amount || 0);
      setDiscountPercentage(parentQuotation.discount_percentage || 0);
      setVendorBrand(parentQuotation.vendor_brand || 'Belimo Valves & Actuators Package');
      setPaymentTerms(parentQuotation.payment_terms || '10% Advance, 90% against delivery');
      setDeliveryTerms(parentQuotation.delivery_terms || '4-6 Weeks from Official Purchase Order');
      setWarrantyTerms(parentQuotation.warranty_terms || '2 Years Comprehensive Manufacturer Warranty');
      setNotes(parentQuotation.notes || '');
      setSelectedReasonChip('customer_discount');
      setCustomRevisionReason('');
    } else {
      setQuotationNumber(defaultQuoteNum);
      setVersion(existingVersionsCount + 1);
      setSubtotal(project.estimated_value || 100000);
      setDiscountAmount(0);
      setDiscountPercentage(0);
    }
  }, [isEdit, quotationToEdit, isRevision, parentQuotation, existingVersionsCount, defaultQuoteNum, project.estimated_value]);

  // Real-time calculation of totals
  const totals = calculateQuotationTotals({
    subtotal,
    discountType: discountMode,
    discountAmount,
    discountPercentage,
    applyTax,
    taxRate: 0.15,
  });

  // Calculate difference if revising
  const revisionDiff = isRevision && parentQuotation
    ? calculateDifference(totals.totalAmount, parentQuotation.amount)
    : null;

  // Keyboard Shortcuts: Ctrl+Enter to save, Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitWithStatus('submitted');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, subtotal, discountAmount, discountPercentage, quotationNumber, customRevisionReason, selectedReasonChip]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file) return;

    const sizeInKb = file.size / 1024;
    const formattedSize = sizeInKb > 1024 
      ? `${(sizeInKb / 1024).toFixed(2)} MB` 
      : `${Math.round(sizeInKb)} KB`;

    setAttachedFileName(file.name);
    setAttachedFileSize(formattedSize);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAttachedFileUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDiscountPercentageChange = (pct: number) => {
    setDiscountMode('percentage');
    setDiscountPercentage(pct);
    const amt = Math.round((subtotal * (pct / 100)) * 100) / 100;
    setDiscountAmount(amt);
  };

  const handleDiscountAmountChange = (amt: number) => {
    setDiscountMode('fixed');
    setDiscountAmount(amt);
    const pct = subtotal > 0 ? Math.round((amt / subtotal) * 10000) / 100 : 0;
    setDiscountPercentage(pct);
  };

  const handleSubmitWithStatus = async (statusToSave: QuotationStatus) => {
    if (!quotationNumber.trim()) {
      setErrorMsg(isRTL ? 'يرجى إدخال رقم مرجع عرض السعر.' : 'Please specify a quotation reference number.');
      return;
    }
    if (subtotal <= 0) {
      setErrorMsg(isRTL ? 'يرجى إدخال مبلغ صحيح لعرض السعر.' : 'Please enter a valid commercial amount.');
      return;
    }

    // Determine final revision reason
    let resolvedReason = customRevisionReason.trim();
    if (!resolvedReason && selectedReasonChip) {
      const found = REVISION_REASONS.find(r => r.id === selectedReasonChip);
      resolvedReason = found ? (isRTL ? found.labelAr : found.labelEn) : selectedReasonChip;
    }

    if (isRevision && !resolvedReason) {
      setErrorMsg(isRTL ? 'يرجى توثيق سبب التعديل للإصدار الجديد.' : 'Please provide a revision reason for this new version.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      if (isEdit && quotationToEdit) {
        // Direct Edit of Existing Quotation (in place)
        await updateQuotation(quotationToEdit.id, {
          quotation_number: quotationNumber.trim(),
          amount: totals.totalAmount,
          total_amount: totals.totalAmount,
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          discount_percentage: totals.discountPercentage,
          tax_amount: totals.taxAmount,
          currency: 'SAR',
          vendor_brand: vendorBrand.trim() || undefined,
          status: statusToSave === 'draft' ? 'draft' : quotationToEdit.status,
          quotation_date: quotationDate,
          sent_date: quotationDate,
          valid_until: validUntil || undefined,
          payment_terms: paymentTerms || undefined,
          delivery_terms: deliveryTerms || undefined,
          warranty_terms: warrantyTerms || undefined,
          customer_reference: customerReference.trim() || undefined,
          rfq_number: rfqNumber.trim() || undefined,
          file_url: attachedFileUrl || undefined,
          file_name: attachedFileName || undefined,
          file_size: attachedFileSize || undefined,
          notes: notes.trim() || undefined,
          technical_notes: technicalNotes.trim() || undefined,
        });
      } else if (isRevision && parentQuotation) {
        // Create immutable V(n+1)
        await createQuotationRevision(parentQuotation.id, {
          quotation_number: quotationNumber.trim(),
          amount: totals.totalAmount,
          total_amount: totals.totalAmount,
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          discount_percentage: totals.discountPercentage,
          tax_amount: totals.taxAmount,
          currency: 'SAR',
          vendor_brand: vendorBrand.trim() || undefined,
          status: statusToSave,
          quotation_date: quotationDate,
          sent_date: quotationDate,
          valid_until: validUntil || undefined,
          revision_reason: resolvedReason,
          payment_terms: paymentTerms || undefined,
          delivery_terms: deliveryTerms || undefined,
          warranty_terms: warrantyTerms || undefined,
          customer_reference: customerReference.trim() || undefined,
          rfq_number: rfqNumber.trim() || undefined,
          file_url: attachedFileUrl || undefined,
          file_name: attachedFileName || undefined,
          file_size: attachedFileSize || undefined,
          notes: notes.trim() || undefined,
          technical_notes: technicalNotes.trim() || undefined,
        });
      } else {
        // Create new quotation series V1
        await addQuotation({
          project_id: project.id,
          project_name: project.name,
          quotation_number: quotationNumber.trim(),
          version: Number(version),
          amount: totals.totalAmount,
          total_amount: totals.totalAmount,
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          discount_percentage: totals.discountPercentage,
          tax_amount: totals.taxAmount,
          currency: 'SAR',
          vendor_brand: vendorBrand.trim() || undefined,
          status: statusToSave,
          quotation_date: quotationDate,
          sent_date: quotationDate,
          valid_until: validUntil || undefined,
          customer_reference: customerReference.trim() || undefined,
          rfq_number: rfqNumber.trim() || undefined,
          payment_terms: paymentTerms || undefined,
          delivery_terms: deliveryTerms || undefined,
          warranty_terms: warrantyTerms || undefined,
          file_url: attachedFileUrl || undefined,
          file_name: attachedFileName || undefined,
          file_size: attachedFileSize || undefined,
          notes: notes.trim() || undefined,
          technical_notes: technicalNotes.trim() || undefined,
          created_by: currentUser.full_name || 'Eslam Mohandes',
        });
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || (isRTL ? 'تعذر حفظ عرض السعر. يرجى المحاولة ثانية.' : 'Failed to save quotation. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1C2130] rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xs font-bold text-sm ${
              isEdit
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                : isRevision 
                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200' 
                  : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200'
            }`}>
              {isEdit ? <Pencil className="w-5 h-5" /> : isRevision ? <History className="w-5 h-5" /> : <FileUp className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-base font-urbanist">
                  {isEdit
                    ? (isRTL ? `تعديل عرض السعر (${quotationToEdit?.quotation_number} / V${quotationToEdit?.version})` : `Edit Quotation (${quotationToEdit?.quotation_number} / V${quotationToEdit?.version})`)
                    : isRevision 
                      ? (isRTL ? `إنشاء إصدار معدل جديد (V${nextVersion})` : `Create Revision (V${nextVersion})`)
                      : (isRTL ? 'إضافة عرض سعر جديد' : 'New Commercial Quotation')}
                </h3>
                {isRevision && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200">
                    Parent: V{parentQuotation!.version}
                  </span>
                )}
                {isEdit && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                    {isRTL ? 'تعديل مباشر' : 'Direct Edit'}
                  </span>
                )}
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

        {/* Form Body */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitWithStatus('submitted');
          }}
          className="p-6 space-y-4 text-xs overflow-y-auto flex-1 font-sans"
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Revision Banner if Revising */}
          {isRevision && parentQuotation && (
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-300 block mb-0.5">
                  {isRTL ? 'تعديل آمن وغير متلف' : 'Non-Destructive Revision'}
                </span>
                <p className="text-xs text-purple-950 dark:text-purple-100 font-medium">
                  {isRTL 
                    ? `سيتم حفظ الإصدار السابق V${parentQuotation.version} بقيمته ${formatCurrencySAR(parentQuotation.amount)} دون أي تعديل، وإنشاء الإصدار V${nextVersion} بشكل مستقل.`
                    : `Previous version V${parentQuotation.version} (${formatCurrencySAR(parentQuotation.amount)}) will remain 100% immutable and intact.`}
                </p>
              </div>
              {revisionDiff && (
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-purple-600 block uppercase font-bold">Delta</span>
                  <span className="font-black text-sm text-emerald-700 dark:text-emerald-400 font-urbanist">
                    {revisionDiff.formattedPercentage}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quotation Ref & Version & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'رقم مرجع العرض' : 'Quotation Reference #'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={quotationNumber}
                onChange={(e) => setQuotationNumber(e.target.value)}
                readOnly={isRevision}
                placeholder="e.g. Q-2026-0018"
                className={`w-full px-3 py-2 border rounded-xl text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  isRevision 
                    ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 cursor-not-allowed text-slate-500' 
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'رقم الإصدار' : 'Version'}
              </label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black font-urbanist">
                <span className="text-blue-600 font-bold">V</span>
                <span>{version}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'تاريخ العرض' : 'Quotation Date'}
              </label>
              <input
                type="date"
                required
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing Breakdown Section (Section 10 & 15) */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 font-urbanist">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>{isRTL ? 'تفاصيل التسعير والخصم التجاري' : 'Pricing & Commercial Calculation'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Currency: SAR</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Subtotal */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'المبلغ الأساسي (قبل الخصم)' : 'Subtotal Amount (SAR)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={subtotal}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSubtotal(val);
                    if (discountPercentage > 0) {
                      setDiscountAmount(Math.round((val * (discountPercentage / 100)) * 100) / 100);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-extrabold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Discount % */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'نسبة الخصم (%)' : 'Discount Percentage (%)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discountPercentage || ''}
                    onChange={(e) => handleDiscountPercentageChange(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-emerald-600 dark:text-emerald-400 font-extrabold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Discount Amount */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'قيمة الخصم (SAR)' : 'Discount Amount (SAR)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountAmount || ''}
                  onChange={(e) => handleDiscountAmountChange(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-emerald-600 dark:text-emerald-400 font-extrabold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* VAT Checkbox & Final Total Card */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {isRTL ? 'تطبيق ضريبة القيمة المضافة 15% (VAT)' : 'Apply 15% Standard VAT'}
                </span>
              </label>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isRTL ? 'الإجمالي النهائي للعرض' : 'Calculated Total Quotation'}
                </span>
                <span className="text-xl font-black text-blue-600 dark:text-[#8FC2F0]">
                  {formatCurrencySAR(totals.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Revision Reason Selection (Crucial for Section 12) */}
          {isRevision && (
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[11px] font-urbanist">
                  {isRTL ? 'سبب التعديل التجاري / الفني' : 'Revision Reason (Required)'} <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-amber-700 dark:text-amber-300">
                  {isRTL ? 'اختر سبباً أو اكتب تفاصيلك' : 'Select quick chip or write custom'}
                </span>
              </div>

              {/* Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {REVISION_REASONS.map(r => {
                  const isSelected = selectedReasonChip === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedReasonChip(r.id);
                        setCustomRevisionReason(isRTL ? r.labelAr : r.labelEn);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      {isRTL ? r.labelAr : r.labelEn}
                    </button>
                  );
                })}
              </div>

              {/* Custom Input */}
              <input
                type="text"
                required={isRevision}
                value={customRevisionReason}
                onChange={(e) => {
                  setCustomRevisionReason(e.target.value);
                  setSelectedReasonChip('');
                }}
                placeholder={isRTL ? "اكتب تفاصيل سبب التعديل..." : "e.g. Customer requested commercial reduction of 5.97%"}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          )}

          {/* Commercial Terms & Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'شروط الدفع' : 'Payment Terms'}
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none mb-1.5"
              >
                {PAYMENT_TERMS_PRESETS.map(p => (
                  <option key={p.id} value={p.label}>{p.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Or custom payment terms..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-[11px]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'شروط التوريد' : 'Delivery Terms'}
              </label>
              <select
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none mb-1.5"
              >
                {DELIVERY_TERMS_PRESETS.map(d => (
                  <option key={d.id} value={d.label}>{d.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                placeholder="Or custom delivery terms..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-[11px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'شروط الضمان' : 'Warranty Terms'}
              </label>
              <select
                value={warrantyTerms}
                onChange={(e) => setWarrantyTerms(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {WARRANTY_PRESETS.map(w => (
                  <option key={w.id} value={w.label}>{w.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'صالح حتى' : 'Valid Until (Validity)'}
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* System Brand & References */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'الماركة / نطاق التوريد' : 'Brand / Scope Package'}
              </label>
              <input
                type="text"
                value={vendorBrand}
                onChange={(e) => setVendorBrand(e.target.value)}
                placeholder="e.g. Belimo / Al Mespar Package"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'رقم طلب العميل (RFQ)' : 'Customer RFQ #'}
              </label>
              <input
                type="text"
                value={rfqNumber}
                onChange={(e) => setRfqNumber(e.target.value)}
                placeholder="e.g. RFQ-2026-99"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'مرجع العميل' : 'Customer Reference'}
              </label>
              <input
                type="text"
                value={customerReference}
                onChange={(e) => setCustomerReference(e.target.value)}
                placeholder="e.g. Tender Ref 104"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'ملاحظات تجارية وتفاصيل العرض' : 'Commercial Notes & Remarks'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Commercial payment conditions, site delivery details..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* File Upload Dropzone (Section 22 & 23) */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span>{isRTL ? 'إرفاق ملف عرض السعر (PDF)' : 'Attach Quotation Document (PDF)'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {isRTL ? 'لكل إصدار ملفه الخاص المستقل' : 'Each version preserves its own file'}
              </span>
            </label>

            {attachedFileName ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {attachedFileName}
                    </div>
                    {attachedFileSize && (
                      <span className="text-[10px] text-slate-500 font-medium">{attachedFileSize}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAttachedFileName('');
                    setAttachedFileSize('');
                    setAttachedFileUrl('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-5 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/40 hover:border-blue-400'
                }`}
              >
                <UploadCloud className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                <span className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                  {isRTL ? 'اسحب ملف العرض هنا، أو انقر للتصفح' : 'Drag & drop quotation PDF here, or browse files'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Supports official PDF quotations, Excel submittals, or spec sheets
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer: Save Draft & Save & Submit */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded font-mono text-[10px]">Ctrl+Enter</kbd> to submit</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitWithStatus('draft')}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              {isRTL ? 'حفظ كمسودة' : 'Save Draft'}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitWithStatus('submitted')}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {isEdit 
                      ? (isRTL ? 'حفظ التعديلات' : 'Save Changes')
                      : isRevision 
                        ? (isRTL ? 'إصدار العرض المعدل' : 'Publish Revision')
                        : (isRTL ? 'حفظ وتقديم للعميل' : 'Save & Submit')}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
