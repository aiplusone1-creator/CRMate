'use client';

import React from 'react';
import { 
  Printer, 
  X, 
  Download, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';
import { Project, Quotation, Contact } from '@/types/crm';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';

export interface QuotationPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation;
  project: Project;
  contact?: Contact | null;
}

export function QuotationPrintModal({
  isOpen,
  onClose,
  quotation,
  project,
  contact
}: QuotationPrintModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const vatAmount = quotation.amount * 0.15;
  const grandTotal = quotation.amount + vatAmount;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-urbanist animate-in fade-in duration-150 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Container */}
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 print:border-0 print:shadow-none print:max-w-none print:w-full print:m-0 print:rounded-none">
        
        {/* Modal Controls Toolbar (Hidden on Print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8FC2F0]" />
            <span className="text-xs font-black tracking-wide">Official Commercial Quotation Sheet</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              {quotation.quotation_number}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8FC2F0] hover:bg-[#7ab1e0] text-slate-900 rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Document Paper */}
        <div className="p-8 sm:p-12 space-y-8 bg-white text-slate-900 font-sans print:p-6" id="printable-quotation">
          
          {/* Header & Company Brand */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div>
              <div className="text-xl font-black text-slate-900 uppercase tracking-tight">
                شركة المسفار للتجارة والمقاولات
              </div>
              <div className="text-xs font-bold text-slate-600 tracking-wider">
                AL-MESPAR TRADING &amp; CONTRACTING CO.
              </div>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                <p>Commercial Registration: 4030128892 | سجل تجاري</p>
                <p>Tax Registration No (VAT): 300458921400003 | الرقم الضريبي</p>
                <p>Jeddah &bull; Riyadh &bull; Al-Khobar &bull; Kingdom of Saudi Arabia</p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-mono font-black text-slate-900 mb-2">
                OFFICIAL QUOTATION
              </div>
              <div className="text-sm font-black text-slate-900 font-mono">
                {quotation.quotation_number}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Version: Rev {quotation.version - 1 >= 0 ? quotation.version - 1 : 0} (v{quotation.version})
              </div>
              <div className="text-[11px] text-slate-500">
                Date: {formatDateString(quotation.sent_date || new Date().toISOString())}
              </div>
              {quotation.valid_until && (
                <div className="text-[11px] text-slate-500">
                  Valid Until: {formatDateString(quotation.valid_until)}
                </div>
              )}
            </div>
          </div>

          {/* Client & Project Details Grid */}
          <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Customer / الجهة الطالبة:
              </span>
              <div className="font-bold text-slate-900 text-sm mt-1">{project.company_name || 'Client Representative'}</div>
              {contact && (
                <div className="text-slate-600 mt-1 space-y-0.5">
                  <p>Attn: <span className="font-bold text-slate-800">{contact.full_name}</span> ({contact.job_title || 'Engineer'})</p>
                  {contact.phone && <p>Phone: {contact.phone}</p>}
                  {contact.email && <p>Email: {contact.email}</p>}
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Project Reference / المشروع:
              </span>
              <div className="font-bold text-slate-900 text-sm mt-1">{project.name}</div>
              <div className="text-slate-600 mt-1 space-y-0.5">
                <p>Project Ref #: <span className="font-mono font-bold text-slate-800">{project.pr_number}</span></p>
                <p>Location: {project.location || 'Kingdom of Saudi Arabia'}</p>
                <p>Engineer: {project.owner_name || 'Al-Mespar Engineering Team'}</p>
              </div>
            </div>
          </div>

          {/* Scope & Item Table */}
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-wider text-slate-700">
              Commercial Proposal Scope &amp; Deliverables / جدول التوريد والأسعار
            </div>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-[11px] font-black text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Description / البيان الفني</th>
                  <th className="p-3">Brand / Specifications</th>
                  <th className="p-3 text-right">Amount (SAR) / القيمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-mono font-bold text-slate-500">01</td>
                  <td className="p-3 font-semibold text-slate-800">
                    <div>Supply and technical submittal package for {project.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {quotation.notes || 'Full supply and engineering compliance according to project specifications and BOQ requirements.'}
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">{quotation.vendor_brand || 'Standard Submittal'}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrencySAR(quotation.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & VAT Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal (Net) / المجموع الفرعي:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrencySAR(quotation.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>VAT 15% / ضريبة القيمة المضافة:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrencySAR(vatAmount)}</span>
              </div>
              <div className="pt-2 border-t-2 border-slate-900 flex items-center justify-between text-sm font-black text-slate-900">
                <span>Total Amount (SAR) / الإجمالي:</span>
                <span className="font-mono text-base text-blue-700">{formatCurrencySAR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Standard Terms & Conditions */}
          <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-500 space-y-1 leading-relaxed">
            <div className="font-bold text-slate-700 text-xs mb-1">الشروط والأحكام التجارية / Terms &amp; Conditions:</div>
            <p>&bull; الأسعار سارية لمدة 30 يوماً من تاريخ هذا العرض. / Prices are valid for 30 calendar days from issue date.</p>
            <p>&bull; الدفع: 50% دفعة مقدمة عند التعميد و 50% قبل التسليم، أو حسب شروط التسهيلات المعتمدة.</p>
            <p>&bull; مدة التوريد: تبدأ بعد اعتماد العينات الفنية واستلام الدفعة المقدمة.</p>
          </div>

          {/* Signatures & Corporate Stamp Block */}
          <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-200 text-xs">
            <div className="space-y-6">
              <span className="font-bold text-slate-700 block">اعتماد العميل / Client Acceptance &amp; Stamp:</span>
              <div className="h-16 border-b border-dashed border-slate-300"></div>
              <p className="text-[10px] text-slate-400">Signature &amp; Corporate Stamp</p>
            </div>

            <div className="space-y-6 text-right">
              <span className="font-bold text-slate-700 block">شركة المسفار للتجارة والمقاولات / Al-Mespar Co.</span>
              <div className="h-16 flex items-center justify-end">
                <div className="w-24 h-16 border-2 border-slate-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                  Corporate Seal
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Authorized Commercial Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
