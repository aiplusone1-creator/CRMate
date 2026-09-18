'use client';

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Flame, 
  AlertCircle, 
  Clock, 
  Percent, 
  FileText, 
  ShieldCheck, 
  User, 
  Building2, 
  MessageSquare, 
  Send,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingDown,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';
import { ApprovalRequest } from '@/types/crm';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string | null;
}

export function RequestDetailModal({
  isOpen,
  onClose,
  requestId
}: RequestDetailModalProps) {
  const { 
    requests, 
    currentUser, 
    currentRole, 
    resolveRequest, 
    addRequestComment 
  } = useCRM();

  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Approve / Reject Form States
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [approvedValue, setApprovedValue] = useState<number>(0);
  const [rejectReason, setRejectReason] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  if (!isOpen || !requestId) return null;

  const request = requests.find(r => r.id === requestId);
  if (!request) return null;

  const isManagerOrAdmin = 
    currentUser.role === 'sales_manager' || 
    currentUser.role === 'admin' || 
    currentRole === 'sales_manager' || 
    currentRole === 'admin';

  const isPending = request.status === 'pending';
  const defaultFinalValue = request.payload.requested_value || 
    (request.quotation_amount && request.payload.discount_pct 
      ? Math.round(request.quotation_amount * (1 - request.payload.discount_pct / 100))
      : request.quotation_amount || 0);

  const handleOpenApprove = () => {
    setApprovedValue(defaultFinalValue);
    setIsApproveOpen(true);
    setIsRejectOpen(false);
  };

  const handleOpenReject = () => {
    setRejectReason('');
    setIsRejectOpen(true);
    setIsApproveOpen(false);
  };

  const handleApproveConfirm = async () => {
    setIsResolving(true);
    try {
      await resolveRequest(request.id, {
        resolved_by: currentUser.id,
        resolver_name: currentUser.full_name,
        status: 'approved',
        final_value: approvedValue
      });
      setIsApproveOpen(false);
    } catch (e) {
      console.error('Approve failed', e);
    } finally {
      setIsResolving(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return;
    setIsResolving(true);
    try {
      await resolveRequest(request.id, {
        resolved_by: currentUser.id,
        resolver_name: currentUser.full_name,
        status: 'rejected',
        reject_reason: rejectReason.trim()
      });
      setIsRejectOpen(false);
    } catch (e) {
      console.error('Reject failed', e);
    } finally {
      setIsResolving(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addRequestComment(request.id, commentText);
      setCommentText('');
    } catch (e) {
      console.error('Add comment failed', e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-urbanist">
      <div className="glass-card bg-white/95 rounded-3xl max-w-2xl w-full shadow-2xl border border-white/90 overflow-hidden flex flex-col max-h-[94vh] backdrop-blur-2xl animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 bg-white/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xs ${
              request.status === 'approved' 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                : request.status === 'rejected'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              {request.status === 'approved' && <CheckCircle2 className="w-5 h-5" />}
              {request.status === 'rejected' && <XCircle className="w-5 h-5" />}
              {request.status === 'pending' && <Clock className="w-5 h-5 animate-spin-slow" />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                  {request.id}
                </span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  request.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : request.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {request.status.toUpperCase()}
                </span>
                {request.urgency === 'urgent' && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1 animate-pulse">
                    <Flame className="w-3 h-3 text-rose-500" />
                    <span>Urgent</span>
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-base text-[#292D32] mt-0.5">
                {request.type === 'discount' 
                  ? `Discount Request (${request.payload.discount_pct}%)` 
                  : `Approval: ${request.type.replace('_', ' ').toUpperCase()}`}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Project & Commercial Summary Card */}
          <div className="glass-card p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Project</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">{request.project_name || 'Project'}</div>
                <div className="text-xs text-slate-500 font-medium">{request.company_name || 'Organization'}</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requester</div>
                <div className="text-xs font-black text-slate-800 mt-0.5">{request.requester_name || 'Sales Rep'}</div>
                <div className="text-[10px] text-slate-400">{formatDateString(request.created_at)}</div>
              </div>
            </div>

            {/* Quotation & Numbers Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Original Package</span>
                <span className="text-xs font-black text-slate-900 block mt-0.5">
                  {request.quotation_amount ? formatCurrencySAR(request.quotation_amount) : 'N/A'}
                </span>
                {request.quotation_number && (
                  <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
                    {request.quotation_number}
                  </span>
                )}
              </div>

              {request.payload.discount_pct !== undefined && (
                <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-500 block uppercase">Requested Discount</span>
                  <span className="text-sm font-black text-rose-600 block mt-0.5">
                    {request.payload.discount_pct}%
                  </span>
                  <span className="text-[10px] text-rose-600 font-medium block mt-0.5">
                    -{formatCurrencySAR((request.quotation_amount || 0) * (request.payload.discount_pct / 100))}
                  </span>
                </div>
              )}

              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 sm:col-span-1 col-span-2">
                <span className="text-[10px] font-bold text-emerald-600 block uppercase">Proposed Deal Value</span>
                <span className="text-sm font-black text-emerald-700 block mt-0.5">
                  {formatCurrencySAR(request.payload.requested_value || defaultFinalValue)}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Commercial Target</span>
              </div>
            </div>
          </div>

          {/* Justification Box */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Business Justification / Reason &bull; مبررات الطلب:</span>
            </span>
            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              &ldquo;{request.payload.reason}&rdquo;
            </p>
            {request.payload.notes && (
              <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60 font-normal">
                Notes: {request.payload.notes}
              </p>
            )}
          </div>

          {/* Resolution Card (if already approved/rejected) */}
          {request.resolution && (
            <div className={`p-4 rounded-2xl border ${
              request.status === 'approved' 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-black/5 mb-2 font-bold">
                <span className="flex items-center gap-1.5 text-xs">
                  {request.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                  <span>Resolution Audit: {request.status.toUpperCase()}</span>
                </span>
                <span className="text-[11px] opacity-75">{formatDateString(request.resolution.resolved_at)}</span>
              </div>
              <div className="text-xs space-y-1 font-medium">
                <div>Resolved by: <strong>{request.resolution.resolver_name || 'Management'}</strong></div>
                {request.resolution.final_value && (
                  <div>Final Approved Value: <strong className="text-emerald-700">{formatCurrencySAR(request.resolution.final_value)}</strong></div>
                )}
                {request.resolution.reject_reason && (
                  <div>Reason for rejection: <em>{request.resolution.reject_reason}</em></div>
                )}
              </div>
            </div>
          )}

          {/* Approver Action Panel (Visible for Managers/Admins on Pending Requests) */}
          {isPending && isManagerOrAdmin && (
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Management Decision Panel (إجراء الاعتماد)</span>
                </span>
                <span className="text-[10px] text-purple-600 font-bold bg-white px-2 py-0.5 rounded-full border border-purple-200">
                  Manager Authority
                </span>
              </div>

              {/* Action Buttons */}
              {!isApproveOpen && !isRejectOpen && (
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenApprove}
                    className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Request</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenReject}
                    className="flex-1 py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Request</span>
                  </button>
                </div>
              )}

              {/* Approve Confirmation Form */}
              {isApproveOpen && (
                <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2.5 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span>Confirm Final Approved Value (SAR)</span>
                    <button 
                      type="button" 
                      onClick={() => setIsApproveOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={approvedValue}
                      onChange={e => setApprovedValue(Number(e.target.value))}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      disabled={isResolving || approvedValue <= 0}
                      onClick={handleApproveConfirm}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {isResolving ? 'Approving...' : 'Confirm Approval'}
                    </button>
                  </div>
                </div>
              )}

              {/* Reject Confirmation Form */}
              {isRejectOpen && (
                <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-2.5 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                    <span>Rejection Reason (مطلوب) *</span>
                    <button 
                      type="button" 
                      onClick={() => setIsRejectOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Margin below company threshold. Max discount allowable is 6%."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isResolving || !rejectReason.trim()}
                      onClick={handleRejectConfirm}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {isResolving ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit Thread & Comments */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Discussion &amp; Audit Trail ({request.comments.length})</span>
              </span>
            </div>

            {/* Comments List */}
            {request.comments.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-[11px] bg-slate-50 rounded-xl">
                No discussion comments logged yet. Use the reply box below to ask questions or give context.
              </div>
            ) : (
              <div className="space-y-2.5">
                {request.comments.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <strong className="text-slate-800">{c.user_name}</strong>
                      <span className="text-slate-400 text-[10px]">{formatDateString(c.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {c.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input Box */}
            <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment or question inside this request thread..."
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="px-4 py-2 bg-[#292D32] hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-[#8FC2F0]" />
                <span>Reply</span>
              </button>
            </form>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-400 text-[11px]">
            Approval Engine &bull; CRMate Phase A
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}