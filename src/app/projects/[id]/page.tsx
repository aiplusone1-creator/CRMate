'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Briefcase, 
  ArrowLeft, 
  Building2, 
  User, 
  Phone, 
  MessageCircle, 
  Mail, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Plus, 
  FileText, 
  History, 
  DollarSign, 
  Shield, 
  Check, 
  AlertCircle,
  Download,
  FileSpreadsheet,
  ExternalLink,
  Trash2,
  FileUp,
  Edit,
  Lock,
  Unlock,
  Bell,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { PIPELINE_STAGES, OPPORTUNITY_TYPES, canEditCommercialValue } from '@/lib/constants';
import { formatCurrencySAR, formatDateString, normalizePhoneNumber } from '@/lib/utils';
import { PipelineStage, Quotation } from '@/types/crm';
import { AddQuotationModal } from '@/components/modals/add-quotation-modal';
import { EditProjectModal } from '@/components/modals/edit-project-modal';
import { WhatsAppComposerModal } from '@/components/modals/whatsapp-composer-modal';
import { QuotationPrintModal } from '@/components/modals/quotation-print-modal';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { 
    currentUser,
    projects, 
    companies, 
    contacts, 
    activities, 
    quotations, 
    updateProject, 
    deleteQuotation,
    currentRole, 
    openFastLog,
    openReminder,
    reminders,
    toggleReminderCompleted,
    deleteReminder,
    requests,
    openRequestModal,
    openRequestDetail
  } = useCRM();

  const projectId = params.id as string;
  const project = projects.find(p => p.id === projectId);

  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isAddQuotationModalOpen, setIsAddQuotationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedQuotationForPrint, setSelectedQuotationForPrint] = useState<Quotation | null>(null);

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">The requested project reference could not be located.</p>
        <Link 
          href="/projects" 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const stageConfig = PIPELINE_STAGES.find(s => s.value === project.pipeline_stage);
  const typeConfig = OPPORTUNITY_TYPES.find(t => t.value === project.opportunity_type);

  // Filter linked activities, quotations & reminders
  const projectActivities = activities.filter(a => a.project_id === project.id);
  const projectQuotations = quotations.filter(q => q.project_id === project.id);
  const projectReminders = reminders.filter(r => r.project_id === project.id || r.entity_id === project.id);
  const primaryContact = contacts.find(c => c.id === project.primary_contact_id);

  const cleanPhone = normalizePhoneNumber(primaryContact?.phone || project.primary_contact_phone);
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

  // Pipeline Progression Steps
  const progressionStages: PipelineStage[] = [
    'lead',
    'rfq_processing',
    'pricing',
    'quotation_sent',
    'technical_submission',
    'technically_approved',
    'negotiation',
    'won'
  ];

  const currentStageIndex = progressionStages.indexOf(project.pipeline_stage);

  const pendingRequest = requests.find(r => r.project_id === project.id && r.status === 'pending');

  const handleStageChange = async (newStage: PipelineStage) => {
    setIsUpdatingStage(true);
    await updateProject(project.id, { pipeline_stage: newStage });
    setIsUpdatingStage(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <div>
        <Link 
          href="/projects" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects Pipeline</span>
        </Link>
      </div>

      {/* Pending Approval Banner */}
      {pendingRequest && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-2xs transition-all ${
          pendingRequest.urgency === 'urgent'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
              pendingRequest.urgency === 'urgent' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
            }`}>
              ⏳
            </div>
            <div>
              <div className="text-sm font-black flex items-center gap-2">
                <span>Pending Approval Request: {pendingRequest.type === 'discount' && pendingRequest.payload?.discount_pct ? `Discount ${pendingRequest.payload.discount_pct}%` : pendingRequest.type.replace('_', ' ')}</span>
                {pendingRequest.urgency === 'urgent' && (
                  <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide animate-pulse">Urgent</span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Requested by <strong className="text-slate-800">{pendingRequest.requester_name || pendingRequest.requested_by}</strong>{pendingRequest.payload?.reason ? ` • Reason: "${pendingRequest.payload.reason}"` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => openRequestDetail(pendingRequest.id)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl shadow-2xs transition-all whitespace-nowrap shrink-0 hover:border-slate-300 cursor-pointer"
          >
            Review Request Details &rarr;
          </button>
        </div>
      )}

      {/* Project Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg border border-slate-200">
                {project.pr_number}
              </span>
              <span suppressHydrationWarning className={`text-xs font-bold px-3 py-1 rounded-full border ${stageConfig?.badgeClass || 'bg-slate-100'}`}>
                {stageConfig?.label || project.pipeline_stage}
              </span>
              <span suppressHydrationWarning className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {typeConfig?.label || project.opportunity_type}
              </span>

              {project.calculated_health === 'red' && (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {project.days_overdue ? `${project.days_overdue} days overdue` : 'Needs Attention'}
                </span>
              )}
              {project.calculated_health === 'green' && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Healthy
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {project.name}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
              <span className="text-blue-600 flex items-center gap-1 font-semibold">
                <Building2 className="w-3.5 h-3.5" />
                {project.company_name}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {project.location}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Owner: {project.owner_name || 'Eslam Mohandes'}
              </span>
              {project.members && project.members.length > 0 && (
                <span className="text-indigo-600 font-medium">
                  Co-Engineer: {project.members[0].user_name}
                </span>
              )}
            </div>
          </div>

          {/* Action & Value Box */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-start lg:self-auto">
            {currentRole !== 'viewer' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openRequestModal(project)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 shadow-2xs hover:border-amber-300 transition-all"
                  title="Request Approval for Discount / Quotation Change"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Request Approval</span>
                </button>
                <button
                  onClick={() => openReminder({
                    entity_type: 'project',
                    entity_id: project.id,
                    entity_name: project.name,
                    project_id: project.id,
                    project_name: project.name,
                  })}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 shadow-2xs hover:border-purple-300 transition-all"
                  title="Set Reminder for this project"
                >
                  <Bell className="w-4 h-4 text-purple-600" />
                  <span>Reminder</span>
                </button>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all"
                  title="Edit Project Details"
                >
                  <Edit className="w-4 h-4 text-blue-600" />
                  <span>Edit Project</span>
                </button>
              </div>
            )}

            {/* Value Summary Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Commercial Value
                  </span>
                  {canEditCommercialValue(project.pipeline_stage) && currentRole !== 'viewer' && (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                      title="Edit Value"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {canEditCommercialValue(project.pipeline_stage) ? (
                  <div>
                    <span className="text-xl font-extrabold text-slate-900 block">
                      {formatCurrencySAR(project.estimated_value)}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <Unlock className="w-2.5 h-2.5" />
                      <span>Quotation Stage &bull; Unlocked</span>
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-0.5">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>Pending Quotation Sent</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Unlocks at Quotation Sent stage
                    </span>
                  </div>
                )}
              </div>

              <div className="border-l border-slate-200 pl-6">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Weighted Value
                </span>
                <span className="text-xl font-extrabold text-blue-600 block">
                  {canEditCommercialValue(project.pipeline_stage) ? formatCurrencySAR(project.weighted_value) : 'SAR 0'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {project.probability}% Probability
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Visual Pipeline Progression Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Sales Pipeline Progression
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
            {progressionStages.map((st, idx) => {
              const conf = PIPELINE_STAGES.find(s => s.value === st);
              const isPast = currentStageIndex >= idx;
              const isCurrent = project.pipeline_stage === st;

              return (
                <button
                  key={st}
                  disabled={isUpdatingStage}
                  onClick={() => handleStageChange(st)}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold text-center border transition-all ${
                    isCurrent 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                      : isPast
                        ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <div className="truncate">{conf?.label || st}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Action Toolbar */}
        {currentRole !== 'viewer' && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fast Actions:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => openFastLog({ project, defaultGoal: 'Phone follow-up call with contractor / client' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Log Call</span>
              </button>
              <button
                onClick={() => openFastLog({ project, defaultGoal: 'Client office technical meeting' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Log Meeting</span>
              </button>
              <button
                onClick={() => openReminder({
                  entity_type: 'project',
                  entity_id: project.id,
                  entity_name: project.name,
                  project_id: project.id,
                  project_name: project.name
                })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs"
              >
                <Bell className="w-3.5 h-3.5 text-purple-600" />
                <span>Set Reminder</span>
              </button>
              <button
                onClick={() => setIsAddQuotationModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs"
              >
                <FileUp className="w-3.5 h-3.5 text-amber-600" />
                <span>Upload Quotation</span>
              </button>
              <button
                onClick={() => openRequestModal(project)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                <span>Request Approval</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Next Action & Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Next Action (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-base">Next Action Required</h2>
              </div>
              <span className="text-xs text-slate-400">Maintained automatically from latest interaction</span>
            </div>

            {project.next_action ? (
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-2">
                <div className="text-sm font-semibold text-slate-900">
                  {project.next_action}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1 font-semibold text-blue-700">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Target Follow-up: {formatDateString(project.next_follow_up_at)}
                  </span>
                  {project.last_activity_at && (
                    <span className="text-slate-400">
                      Last logged activity: {formatDateString(project.last_activity_at)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-100 text-xs font-semibold">
                No next action has been set for this project yet. Please log an activity to establish follow-up!
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Project ID: {project.id}</span>
            <Link
              href="/activities"
              className="font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>+ Log Activity for this Project</span>
            </Link>
          </div>
        </div>

        {/* Section 3: Primary Contact Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-base">Key Contact</h2>
              </div>
            </div>

            {primaryContact ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">{primaryContact.full_name}</div>
                  <div className="text-xs text-slate-500">{primaryContact.job_title || 'Decision Maker'}</div>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  {primaryContact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{primaryContact.phone}</span>
                    </div>
                  )}
                  {primaryContact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${primaryContact.email}`} className="hover:underline text-blue-600">
                        {primaryContact.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Instant Actions */}
                <div className="flex items-center gap-2 pt-2">
                  {cleanPhone && (
                    <a
                      href={`tel:${cleanPhone}`}
                      className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  )}
                  {cleanPhone && (
                    <button
                      onClick={() => setIsWhatsAppModalOpen(true)}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                      title="Compose Professional WhatsApp Message"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">
                No primary contact linked to this project.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-right">
            <Link href="/contacts" className="text-xs text-blue-600 font-semibold hover:underline">
              View All Contacts &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Quotations & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 5: Quotations Module */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-base">Quotations &amp; Pricing Versions</h2>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {projectQuotations.length}
              </span>
            </div>
            {currentRole !== 'viewer' && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openRequestModal(project)}
                  className="text-xs font-bold text-amber-800 hover:text-white bg-amber-50 hover:bg-amber-600 border border-amber-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                  title="Request Approval on Quotation / Discount"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Request Approval</span>
                </button>
                <button 
                  onClick={() => setIsAddQuotationModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Quotation</span>
                </button>
              </div>
            )}
          </div>

          {projectQuotations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 flex flex-col items-center justify-center">
              <FileUp className="w-8 h-8 text-slate-400 mb-2" />
              <span className="font-semibold text-slate-700">No formal quotations attached yet</span>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Upload and attach your commercial price offers, submittals, or revised version packages here.
              </p>
              {currentRole !== 'viewer' && (
                <button
                  onClick={() => setIsAddQuotationModalOpen(true)}
                  className="mt-3 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload First Quotation</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {projectQuotations.map(q => {
                return (
                  <div 
                    key={q.id} 
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-2.5"
                  >
                    {/* Top Row: Ref, Version, Status & Amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {q.quotation_number}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Rev {q.version - 1 >= 0 ? q.version - 1 : q.version} (v{q.version})
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            q.status === 'approved' || q.status === 'accepted'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : q.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : q.status === 'under_review' || q.status === 'internal_review'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {q.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          {q.vendor_brand || 'Standard Quotation Package'}
                          {q.sent_date && ` • Sent: ${formatDateString(q.sent_date)}`}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-sm text-slate-900">
                          {formatCurrencySAR(q.amount)}
                        </div>
                        {q.valid_until && (
                          <div className="text-[10px] text-slate-400">
                            Valid: {formatDateString(q.valid_until)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes if present */}
                    {q.notes && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-normal leading-relaxed">
                        {q.notes}
                      </p>
                    )}

                    {/* Document Attachment & Actions Row */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      {q.file_url ? (
                        <a
                          href={q.file_url}
                          download={q.file_name || `Quotation_${q.quotation_number}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors group/att"
                          title="Download attached quotation document"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600 group-hover/att:translate-y-0.5 transition-transform" />
                          <span className="truncate max-w-[220px]">{q.file_name || 'Download Attachment'}</span>
                          {q.file_size && (
                            <span className="text-[10px] text-emerald-600 font-normal">({q.file_size})</span>
                          )}
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          No document attached
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedQuotationForPrint(q)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors"
                          title="Preview Official Quotation Sheet & Print PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" />
                          <span>Official Sheet</span>
                        </button>

                        {currentRole !== 'viewer' && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove quotation version "${q.quotation_number}"?`)) {
                                deleteQuotation(q.id);
                              }
                            }}
                            className="text-slate-300 hover:text-rose-600 p-1 transition-colors rounded hover:bg-rose-50"
                            title="Delete quotation version"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Reminders & Action Items + Activity History */}
        <div className="space-y-6">
          {/* Section: Reminders & Follow-up Items */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600" />
                <h2 className="font-bold text-slate-900 text-base">Project Reminders &amp; Tasks</h2>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {projectReminders.length}
                </span>
              </div>
              {currentRole !== 'viewer' && (
                <button
                  onClick={() => openReminder({
                    entity_type: 'project',
                    entity_id: project.id,
                    entity_name: project.name,
                    project_id: project.id,
                    project_name: project.name
                  })}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Set Reminder</span>
                </button>
              )}
            </div>

            {projectReminders.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                <Bell className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p>No action item reminders scheduled for this project.</p>
                {currentRole !== 'viewer' && (
                  <button
                    onClick={() => openReminder({
                      entity_type: 'project',
                      entity_id: project.id,
                      entity_name: project.name,
                      project_id: project.id,
                      project_name: project.name
                    })}
                    className="mt-2 text-xs font-bold text-purple-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Schedule First Reminder</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectReminders.map(rem => (
                  <div
                    key={rem.id}
                    className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      rem.is_completed
                        ? 'bg-slate-50/80 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => toggleReminderCompleted(rem.id)}
                        className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors ${
                          rem.is_completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 bg-white hover:border-purple-500'
                        }`}
                        title={rem.is_completed ? 'Mark pending' : 'Mark completed'}
                      >
                        {rem.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div>
                        <div className={`text-xs font-bold ${rem.is_completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {rem.title}
                        </div>
                        {rem.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{rem.notes}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDateString(rem.reminder_date)} {rem.reminder_time && `@ ${rem.reminder_time}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                        rem.urgency === 'urgent'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : rem.urgency === 'high'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {rem.urgency}
                      </span>

                      {currentRole !== 'viewer' && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this reminder?')) {
                              deleteReminder(rem.id);
                            }
                          }}
                          className="text-slate-300 hover:text-rose-600 p-0.5 transition-colors"
                          title="Delete reminder"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Activity History Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-base">Project Activity Timeline</h2>
              </div>
              {currentRole !== 'viewer' && (
                <button 
                  onClick={() => openFastLog({ project })}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Log Activity</span>
                </button>
              )}
            </div>

            {projectActivities.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                No sales activities logged for this project yet.
              </div>
            ) : (
              <div className="space-y-4">
                {projectActivities.map(a => (
                  <div key={a.id} className="flex items-start gap-3 text-xs border-l-2 border-blue-500 pl-3">
                    <div>
                      <div className="font-bold text-slate-900 capitalize">{a.channel} &bull; {a.visit_purpose}</div>
                      {a.notes && <p className="text-slate-600 mt-0.5">{a.notes}</p>}
                      <span className="text-[10px] text-slate-400 mt-1 block">{formatDateString(a.activity_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Quotation & Document Upload Modal */}
      <AddQuotationModal
        isOpen={isAddQuotationModalOpen}
        onClose={() => setIsAddQuotationModalOpen(false)}
        project={project}
        existingVersionsCount={projectQuotations.length}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
      />

      {/* WhatsApp B2B Quick Composer Modal */}
      <WhatsAppComposerModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        recipientPhone={cleanPhone || ''}
        recipientName={primaryContact?.full_name || project.company_name || 'Client Representative'}
        projectName={project.name}
        quotationNumber={projectQuotations[0]?.quotation_number || ''}
        engineerName={currentUser.full_name}
      />

      {/* Quotation Printable Official Sheet Modal */}
      {selectedQuotationForPrint && (
        <QuotationPrintModal
          isOpen={!!selectedQuotationForPrint}
          onClose={() => setSelectedQuotationForPrint(null)}
          quotation={selectedQuotationForPrint}
          project={project}
          contact={primaryContact}
        />
      )}
    </div>
  );
}
