'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Flame, 
  AlertCircle, 
  Clock, 
  Percent, 
  FileText, 
  ShieldCheck, 
  Briefcase,
  Sparkles,
  Check
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { Project, RequestType, RequestUrgency } from '@/types/crm';
import { formatCurrencySAR } from '@/lib/utils';

interface RequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  initialQuotationId?: string;
}

export function RequestApprovalModal({
  isOpen,
  onClose,
  project,
  initialQuotationId
}: RequestApprovalModalProps) {
  const { quotations, teamMembers, currentUser, createRequest } = useCRM();

  const [requestType, setRequestType] = useState<RequestType>('discount');
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [discountPct, setDiscountPct] = useState<number>(10);
  const [urgency, setUrgency] = useState<RequestUrgency>('high');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available quotations for this project
  const projectQuotations = project ? quotations.filter(q => q.project_id === project.id) : [];

  useEffect(() => {
    if (isOpen && project) {
      setRequestType('discount');
      setDiscountPct(10);
      setUrgency('high');
      setReason('');
      setNotes('');
      if (initialQuotationId) {
        setSelectedQuotationId(initialQuotationId);
      } else if (projectQuotations.length > 0) {
        setSelectedQuotationId(projectQuotations[0].id);
      } else {
        setSelectedQuotationId('');
      }
    }
  }, [isOpen, project, initialQuotationId]);

  if (!isOpen || !project) return null;

  const currentQuotation = projectQuotations.find(q => q.id === selectedQuotationId);
  const baseAmount = currentQuotation ? currentQuotation.amount : project.estimated_value;
  const requestedValue = requestType === 'discount' 
    ? Math.round(baseAmount * (1 - discountPct / 100))
    : baseAmount;
  const savings = baseAmount - requestedValue;

  // Managers to assign
  const managers = teamMembers.filter(m => m.role === 'sales_manager' || m.role === 'admin');
  const assignedManagerIds = managers.map(m => m.id);
  if (assignedManagerIds.length === 0) assignedManagerIds.push('u0'); // Fallback to Khaled

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await createRequest({
        project_id: project.id,
        project_name: project.name,
        company_name: project.company_name,
        quotation_id: currentQuotation?.id,
        quotation_number: currentQuotation?.quotation_number,
        quotation_amount: baseAmount,
        type: requestType,
        requested_by: currentUser.id,
        requester_name: currentUser.full_name,
        assigned_to: assignedManagerIds,
        payload: {
          discount_pct: requestType === 'discount' ? discountPct : undefined,
          requested_value: requestedValue,
          reason: reason.trim(),
          notes: notes.trim() || undefined
        },
        urgency
      });
      onClose();
    } catch (err) {
      console.error('Failed to create approval request', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickDiscountPills = [5, 8, 10, 12, 15, 20];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="glass-card bg-white/95 rounded-3xl max-w-xl w-full shadow-2xl border border-white/90 overflow-hidden flex flex-col max-h-[92vh] backdrop-blur-2xl animate-in zoom-in-95 duration-150 font-urbanist">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100/80 bg-white/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#292D32] leading-tight">Request Approval</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Fast Flow &bull; فوري
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Submit discount or review request directly to regional sales management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Target Project Overview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{project.pr_number}</span>
                <span>&bull;</span>
                <span className="truncate">{project.company_name || 'Client'}</span>
              </div>
              <div className="text-sm font-black text-slate-900 truncate mt-0.5">
                {project.name}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Value</div>
              <div className="text-sm font-black text-[#292D32]">{formatCurrencySAR(baseAmount)}</div>
            </div>
          </div>

          {/* Request Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Request Type &bull; نوع الطلب
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'discount' as RequestType, label: 'Discount', icon: Percent },
                { type: 'technical_review' as RequestType, label: 'Tech Review', icon: ShieldCheck },
                { type: 'quotation_change' as RequestType, label: 'Quote Change', icon: FileText },
                { type: 'custom' as RequestType, label: 'Special / Other', icon: Sparkles },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = requestType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setRequestType(item.type)}
                    className={`p-2.5 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#292D32] text-white border-[#292D32] shadow-xs' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Associated Quotation Selector (If any exists) */}
          {projectQuotations.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Linked Quotation Package &bull; عرض السعر المرتبط
              </label>
              <select
                value={selectedQuotationId}
                onChange={e => setSelectedQuotationId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projectQuotations.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.quotation_number} &bull; v{q.version} &bull; {formatCurrencySAR(q.amount)} ({q.vendor_brand || 'Standard'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Discount Percentage Calculator (if type is discount) */}
          {requestType === 'discount' && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 text-xs">Requested Discount Rate</span>
                <span className="text-base font-black text-blue-700 bg-white px-3 py-0.5 rounded-xl border border-blue-200 shadow-2xs">
                  {discountPct}%
                </span>
              </div>

              {/* Quick Percentage Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {quickDiscountPills.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDiscountPct(p)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      discountPct === p 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-[11px] text-slate-500 font-bold">Custom:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={discountPct}
                    onChange={e => setDiscountPct(Number(e.target.value))}
                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                  />
                  <span className="font-bold">%</span>
                </div>
              </div>

              {/* Live Commercial Impact Calculator */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-100/80 text-center">
                <div className="bg-white/80 p-2 rounded-xl border border-blue-100">
                  <div className="text-[10px] font-bold text-slate-400">Original</div>
                  <div className="text-xs font-black text-slate-700">{formatCurrencySAR(baseAmount)}</div>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-blue-100">
                  <div className="text-[10px] font-bold text-rose-500">Discount ({discountPct}%)</div>
                  <div className="text-xs font-black text-rose-600">-{formatCurrencySAR(savings)}</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-blue-200 shadow-2xs">
                  <div className="text-[10px] font-bold text-emerald-600">Target Deal Value</div>
                  <div className="text-xs font-black text-emerald-700">{formatCurrencySAR(requestedValue)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Urgency Level */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Urgency Level &bull; درجة الأهمية
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { level: 'normal' as RequestUrgency, label: 'Normal (48h)', color: 'border-slate-200 text-slate-600', icon: Clock },
                { level: 'high' as RequestUrgency, label: 'High (24h)', color: 'border-amber-300 text-amber-700 bg-amber-50/50', icon: AlertCircle },
                { level: 'urgent' as RequestUrgency, label: 'Urgent (Immediate)', color: 'border-rose-300 text-rose-700 bg-rose-50/70', icon: Flame },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = urgency === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setUrgency(item.level)}
                    className={`p-2.5 rounded-2xl border text-center font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected 
                        ? item.level === 'urgent'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : item.level === 'high'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-[#292D32] text-white border-[#292D32] shadow-xs'
                        : `${item.color} bg-white hover:bg-slate-50`
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason / Justification (Mandatory) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Business Justification / Client Feedback (سبب الطلب) *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Client agreed to sign contractor submittal immediately if 12% discount is matched against competitor offer..."
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Additional Notes (Optional) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Additional Notes / Direct Manager Context (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any payment terms, delivery conditions, or extra detail"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Assigned Approver Info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Routed to: <strong className="text-slate-700">{managers[0]?.full_name || 'Khaled Al-Otaibi'} (Sales Director)</strong></span>
            <span>Requester: <strong className="text-slate-700">{currentUser.full_name}</strong></span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-[#292D32] hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#8FC2F0]" />
              <span>{isSubmitting ? 'Sending Request...' : 'Send Approval Request'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}