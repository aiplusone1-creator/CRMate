'use client';

import React, { useState, useRef } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import { Project, QuotationStatus } from '@/types/crm';
import { useCRM } from '@/lib/store/crm-context';

interface AddQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  existingVersionsCount: number;
}

export function AddQuotationModal({ 
  isOpen, 
  onClose, 
  project, 
  existingVersionsCount 
}: AddQuotationModalProps) {
  const { addQuotation } = useCRM();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextVersion = existingVersionsCount + 1;
  const defaultQuoteNum = `QT-${project.pr_number}-V${String(nextVersion).padStart(2, '0')}`;

  const [quotationNumber, setQuotationNumber] = useState(defaultQuoteNum);
  const [version, setVersion] = useState<number>(nextVersion);
  const [amount, setAmount] = useState<number>(project.estimated_value || 100000);
  const [status, setStatus] = useState<QuotationStatus>('sent');
  const [vendorBrand, setVendorBrand] = useState('Al Mespar Valves & BMS Package');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  // File Upload State
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [attachedFileSize, setAttachedFileSize] = useState<string>('');
  const [attachedFileUrl, setAttachedFileUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Format file size
    const sizeInKb = file.size / 1024;
    const formattedSize = sizeInKb > 1024 
      ? `${(sizeInKb / 1024).toFixed(2)} MB` 
      : `${Math.round(sizeInKb)} KB`;

    setAttachedFileName(file.name);
    setAttachedFileSize(formattedSize);

    // Read as Data URL so it can be saved and downloaded anytime
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveFile = () => {
    setAttachedFileName('');
    setAttachedFileSize('');
    setAttachedFileUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotationNumber.trim()) {
      setErrorMsg('Please specify a quotation reference number.');
      return;
    }
    if (!amount || amount <= 0) {
      setErrorMsg('Please specify a valid quotation amount (SAR).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await addQuotation({
        project_id: project.id,
        project_name: project.name,
        quotation_number: quotationNumber.trim(),
        version: Number(version),
        amount: Number(amount),
        currency: 'SAR',
        vendor_brand: vendorBrand.trim() || undefined,
        status,
        sent_date: new Date().toISOString().split('T')[0],
        valid_until: validUntil || undefined,
        file_url: attachedFileUrl || undefined,
        file_name: attachedFileName || undefined,
        file_size: attachedFileSize || undefined,
        notes: notes.trim() || undefined,
        created_by: 'Eslam Mohandes',
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to record quotation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPdf = attachedFileName.toLowerCase().endsWith('.pdf');
  const isExcel = attachedFileName.toLowerCase().endsWith('.xlsx') || attachedFileName.toLowerCase().endsWith('.xls');

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="glass-card bg-white/95 rounded-3xl max-w-xl w-full shadow-2xl border border-white/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] backdrop-blur-2xl">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100/80 bg-white/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] flex items-center justify-center shadow-2xs">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-[#292D32] text-lg font-urbanist">Add Quotation &amp; Upload Document</h3>
              <p className="text-xs text-slate-500 font-medium">
                {project.pr_number} &bull; {project.name}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-[#292D32] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quotation Ref & Version */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Quotation Reference # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={quotationNumber}
                onChange={(e) => setQuotationNumber(e.target.value)}
                placeholder="e.g. QT-PR1002-01"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Version / Rev
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">v</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={version}
                  onChange={(e) => setVersion(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Amount & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Quotation Amount (SAR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="e.g. 150000"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">﷼</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Quotation Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuotationStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="sent">Sent to Client (مقدم للعميل)</option>
                <option value="under_review">Under Review / Evaluation (قيد المراجعة)</option>
                <option value="approved">Approved / PO Expected (معتمد)</option>
                <option value="revised">Revised / Superseded (معدل)</option>
                <option value="draft">Internal Draft (مسودة)</option>
                <option value="rejected">Rejected (مرفوض)</option>
              </select>
            </div>
          </div>

          {/* Brand / Scope & Validity Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                System / Vendor / Scope
              </label>
              <input
                type="text"
                value={vendorBrand}
                onChange={(e) => setVendorBrand(e.target.value)}
                placeholder="e.g. Valves, BMS, Modulating Control"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Validity (Valid Until)
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* ============================================================= */}
          {/* FILE UPLOAD DROPZONE */}
          {/* ============================================================= */}
          <div className="pt-2">
            <label className="block font-bold text-slate-800 text-xs mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span>Upload Quotation Document (PDF / Excel / Word / Images)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Direct file attachment</span>
            </label>

            {attachedFileName ? (
              /* Uploaded file preview card */
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    isPdf 
                      ? 'bg-rose-100 text-rose-700 border-rose-200' 
                      : isExcel 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                  }`}>
                    {isExcel ? <FileSpreadsheet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs truncate" title={attachedFileName}>
                      {attachedFileName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {attachedFileSize} &bull; Ready to save &amp; download anytime
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Drag & Drop zone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-5 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50/70 ring-4 ring-blue-100 scale-[1.01]' 
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.zip"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 shadow-2xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="font-bold text-slate-800 text-xs">
                  Drag &amp; drop quotation file here, or <span className="text-blue-600 underline">browse</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports PDF, Excel (.xlsx), Word (.docx), or scanned proposal images
                </p>
              </div>
            )}
          </div>

          {/* Notes / Remarks */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Scope Summary / Commercial Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Includes supply of modulating valves with 2-year warranty, payment terms 30 days..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#292D32] hover:bg-[#1E2124] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-[#77CE69]" />
              <span>{isSubmitting ? 'Attaching...' : 'Save & Attach Quotation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
