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
  Printer,
  XCircle,
  Archive,
  RotateCcw,
  FileCheck,
  Layers,
  Tag,
  Target,
  AlertTriangle,
  UserCheck,
  X
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { PIPELINE_STAGES, OPPORTUNITY_TYPES, canEditCommercialValue } from '@/lib/constants';
import { formatCurrencySAR, formatDateString, normalizePhoneNumber } from '@/lib/utils';
import { PipelineStage, Quotation, RFQPackage, SubmittalStatus } from '@/types/crm';
import { getStageAgingInfo } from '@/lib/logic/pipeline-analytics';
import { QuotationManager } from '@/components/quotations/quotation-manager';
import { AddQuotationModal } from '@/components/modals/add-quotation-modal';
import { EditProjectModal } from '@/components/modals/edit-project-modal';
import { WhatsAppComposerModal } from '@/components/modals/whatsapp-composer-modal';
import { QuotationPrintModal } from '@/components/modals/quotation-print-modal';
import { LostReasonModal } from '@/components/modals/lost-reason-modal';
import { WonCelebrationModal } from '@/components/modals/won-celebration-modal';
import { ArchiveProjectModal } from '@/components/modals/archive-project-modal';
import { POCollectionManager } from '@/components/projects/po-collection-manager';
import { canUserAccessProjectCockpit } from '@/lib/logic/scope';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { 
    currentUser,
    teamMembers,
    projects, 
    companies, 
    contacts, 
    activities, 
    quotations, 
    updateProject, 
    referProject,
    archiveProject,
    restoreProject,
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

  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isAddQuotationModalOpen, setIsAddQuotationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isWonCelebrationOpen, setIsWonCelebrationOpen] = useState(false);
  const [selectedQuotationForPrint, setSelectedQuotationForPrint] = useState<Quotation | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Referral states
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [selectedReferUser, setSelectedReferUser] = useState('');
  const [isSubmittingRefer, setIsSubmittingRefer] = useState(false);

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin';
  const isCurrentAssignee = project?.referred_to_id ? project.referred_to_id === currentUser.id : project?.owner_id === currentUser.id;
  const canRefer = isManager || isCurrentAssignee;
  const salesReps = teamMembers.filter(m => m.role === 'sales_engineer' || (m.role as string) === 'sales_rep');

  const handleConfirmRefer = async () => {
    if (!project || !selectedReferUser) return;
    setIsSubmittingRefer(true);
    try {
      await referProject(project.id, selectedReferUser);
      setIsReferModalOpen(false);
      setSelectedReferUser('');
      if (!isManager) {
        router.push('/projects');
      }
    } finally {
      setIsSubmittingRefer(false);
    }
  };

  const handleArchiveProject = async (reason: string) => {
    if (!project) return;
    await archiveProject(project.id, reason);
    router.push('/projects?tab=archive');
  };

  const handleRestoreProject = async () => {
    if (!project) return;
    setIsRestoring(true);
    await restoreProject(project.id);
    setIsRestoring(false);
  };

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

  const canAccess = canUserAccessProjectCockpit(project, currentUser);
  if (!canAccess) {
    const assignedRep = teamMembers.find(m => m.id === (project.referred_to_id || project.owner_id));
    const repName = assignedRep?.full_name || project.owner_name || (isRTL ? 'مهندس مبيعات آخر' : 'another sales engineer');
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 sm:p-12 text-center bg-white dark:bg-[#1E2124] rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-xl space-y-5 font-urbanist animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {isRTL ? 'وصول مقيد (Access Restricted)' : 'Access Restricted'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white pt-1">
            {isRTL ? 'لا تملك صلاحية فتح كارت هذا المشروع' : 'Project Detail Access Restricted'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
            {isRTL 
              ? `هذا المشروع (${project.name} - ${project.pr_number}) مسند حالياً إلى المهندس: ${repName}. صلاحية الدخول لكارت المشروع والتعديل عليه متاحة فقط للمسؤول عن المشروع أو عند قيام المسؤول بإحالته (Refer) إليك.`
              : `This project is currently assigned to ${repName}. You can only open project details and commercial data if the project is assigned or referred to you.`}
          </p>
        </div>

        <div className="pt-3 flex items-center justify-center gap-3">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] rounded-full text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            <span>{isRTL ? 'العودة لمسار المشاريع' : 'Back to Projects Pipeline'}</span>
          </Link>
        </div>
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

  // Pipeline Progression Steps (Exact 7 Stages)
  const progressionStages: PipelineStage[] = [
    'lead',
    'rfq_processing',
    'quotation_sent',
    'technical_submission',
    'negotiation',
    'won',
    'lost'
  ];

  const normalizedStage = project.pipeline_stage === 'pricing'
    ? 'rfq_processing'
    : project.pipeline_stage === 'technically_approved'
    ? 'negotiation'
    : project.pipeline_stage;

  const currentStageIndex = progressionStages.indexOf(normalizedStage);

  const quotationDaysElapsed = React.useMemo(() => {
    if (project.pipeline_stage !== 'quotation_sent') return 0;
    const refDate = project.stage_entered_at || project.last_activity_at || project.updated_at || project.created_at;
    if (!refDate) return 0;
    const diffMs = Date.now() - new Date(refDate).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }, [project.pipeline_stage, project.stage_entered_at, project.last_activity_at, project.updated_at, project.created_at]);

  const handleTogglePackage = async (pkg: RFQPackage) => {
    await updateProject(project.id, { rfq_packages: pkg });
  };

  const handleSetSubmittalStatus = async (status: SubmittalStatus) => {
    await updateProject(project.id, { submittal_status: status });
  };

  const discountDisplay = React.useMemo(() => {
    if (project.last_discount_pct !== undefined && project.last_discount_pct !== null && project.last_discount_pct > 0) {
      const amt = project.last_discount_amount || (project.estimated_value ? Math.round((project.last_discount_pct / 100) * project.estimated_value) : 0);
      return amt > 0 ? `${project.last_discount_pct}% (${formatCurrencySAR(amt)})` : `${project.last_discount_pct}%`;
    }
    return project.last_discount_amount ? formatCurrencySAR(project.last_discount_amount) : (isRTL ? 'لم يُحدد' : 'None');
  }, [project.last_discount_pct, project.last_discount_amount, project.estimated_value, isRTL]);

  const targetPriceDisplay = React.useMemo(() => {
    if (project.client_target_price) {
      return formatCurrencySAR(project.client_target_price);
    }
    return isRTL ? 'غير مسجل' : 'Not specified';
  }, [project.client_target_price, isRTL]);

  const pendingRequest = requests.find(r => r.project_id === project.id && r.status === 'pending');
  const aging = getStageAgingInfo(project);

  const handleStageChange = async (newStage: PipelineStage) => {
    if (newStage === 'lost') {
      setIsLostModalOpen(true);
      return;
    }
    setIsUpdatingStage(true);
    await updateProject(project.id, { pipeline_stage: newStage });
    setIsUpdatingStage(false);

    if (newStage === 'won') {
      setIsWonCelebrationOpen(true);
    }
  };

  const handleConfirmLost = async (reason: string) => {
    setIsUpdatingStage(true);
    await updateProject(project.id, { 
      pipeline_stage: 'lost', 
      lost_reason: reason 
    });
    setIsUpdatingStage(false);
    setIsLostModalOpen(false);
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

      {/* Deal Lost Alert Banner */}
      {project.pipeline_stage === 'lost' && (
        <div className="p-4 rounded-2xl border bg-rose-50 border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-lg shrink-0">
              <XCircle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <div className="text-sm font-black text-rose-950 flex items-center gap-2">
                <span>{isRTL ? 'صفقة خاسرة (Lost Deal)' : 'Deal Closed as Lost'}</span>
                <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                  {isRTL ? 'صفقة خاسرة' : 'LOST'}
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-1 font-medium leading-relaxed">
                <strong className="text-rose-950 font-bold">{isRTL ? 'سبب الخسارة الموثق: ' : 'Documented Loss Reason: '}</strong>
                <span>{project.lost_reason || (isRTL ? 'لم يتم تسجيل سبب محدد بعد.' : 'No reason recorded yet.')}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLostModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-rose-300 hover:bg-rose-100/60 text-rose-800 text-xs font-bold rounded-xl shadow-2xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isRTL ? 'تعديل سبب الخسارة' : 'Edit Loss Reason'}
          </button>
        </div>
      )}

      {/* Deal Archived Alert Banner */}
      {project.is_archived && (
        <div className="p-4 sm:p-5 rounded-2xl border bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs font-urbanist animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-lg shrink-0">
              <Archive className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <div className="text-sm font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                <span>{isRTL ? 'هذا المشروع في الأرشيف (Archived Project)' : 'This Project is Archived'}</span>
                <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                  {isRTL ? 'مؤرشف' : 'ARCHIVED'}
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1 font-medium leading-relaxed">
                <span>{isRTL ? 'تم نقله للأرشيف بواسطة: ' : 'Archived by: '}</span>
                <strong className="font-bold text-amber-950 dark:text-amber-100">{project.archived_by_name || 'أحد أعضاء الفريق'}</strong>
                {project.archived_at && (
                  <span> • {formatDateString(project.archived_at)}</span>
                )}
                {project.archive_reason && (
                  <span> • {isRTL ? 'السبب: ' : 'Reason: '} &quot;{project.archive_reason}&quot;</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleRestoreProject}
            disabled={isRestoring}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isRestoring ? (isRTL ? 'جاري الاستعادة...' : 'Restoring...') : (isRTL ? 'استعادة المشروع للمسار النشط' : 'Restore to Active Deals')}</span>
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

              {project.pipeline_stage !== 'won' && project.pipeline_stage !== 'lost' && (
                <span 
                  className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 font-urbanist ${aging.badgeClass}`}
                  title={isRTL ? `المشروع في هذه المرحلة منذ ${aging.daysInStage} يوماً (الحد المعياري للمرحلة: ${aging.slaDays} يوم)` : `Project in this stage for ${aging.daysInStage} days (Target SLA: ${aging.slaDays}d)`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isRTL ? aging.labelAr : aging.labelEn}</span>
                </span>
              )}

              <span suppressHydrationWarning className={`text-xs font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 shadow-2xs ${
                project.opportunity_type === 'in_hand'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  project.opportunity_type === 'in_hand' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'
                }`} />
                <span>
                  {project.opportunity_type === 'in_hand'
                    ? (isRTL ? 'In Hand (في اليد)' : 'In Hand')
                    : (isRTL ? 'Tender (مناقصة)' : 'Tender')}
                </span>
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
                <span className="font-semibold text-slate-700">{isRTL ? 'المالك:' : 'Owner:'}</span>
                <span>{project.owner_name || 'Eslam Mohandes'}</span>
              </span>
              {project.referred_to_name && (
                <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold">{isRTL ? 'محال إلى:' : 'Referred To:'}</span>
                  <span className="font-bold">{project.referred_to_name}</span>
                </span>
              )}
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
                {canRefer && (
                  <button
                    onClick={() => {
                      const otherRep = salesReps.find(r => r.id !== (project.referred_to_id || project.owner_id));
                      setSelectedReferUser(otherRep?.id || '');
                      setIsReferModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl border border-blue-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer"
                    title={isRTL ? "إحالة المشروع لمهندس آخر" : "Refer Project to another sales engineer"}
                  >
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>{isRTL ? 'إحالة المشروع (Refer)' : 'Refer Project'}</span>
                  </button>
                )}
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
                {project.is_archived ? (
                  <button
                    onClick={handleRestoreProject}
                    disabled={isRestoring}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    title={isRTL ? 'استعادة المشروع من الأرشيف' : 'Restore project from archive'}
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isRestoring ? (isRTL ? 'جاري الاستعادة...' : 'Restoring...') : (isRTL ? 'استعادة' : 'Restore')}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsArchiveModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800 shadow-2xs hover:border-rose-300 transition-all cursor-pointer"
                    title={isRTL ? 'مسح ونقل المشروع للأرشيف' : 'Delete / Move project to archive'}
                  >
                    <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>{isRTL ? 'مسح المشروع' : 'Delete'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Value Summary Box - Separating Estimated Value, Latest Quote & Won Value (Rule 2) */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-5 flex-wrap">
              {/* 1. Estimated Project Value */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-urbanist">
                    {isRTL ? 'القيمة التقديرية' : 'Estimated Value'}
                  </span>
                  {canEditCommercialValue(project.pipeline_stage) && currentRole !== 'viewer' && (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                      title="Edit Estimated Value"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div>
                  <span className="text-lg font-black text-slate-900 dark:text-white block font-urbanist">
                    {formatCurrencySAR(project.estimated_value)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 block font-urbanist">
                    {isRTL ? 'القيمة الابتدائية للمشروع' : 'Baseline Est. Value'}
                  </span>
                </div>
              </div>

              {/* 2. Latest Quotation Value (if quotation exists) */}
              {projectQuotations.length > 0 && (
                <div className="border-l border-slate-200 dark:border-slate-800 pl-5">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-[#8FC2F0] uppercase tracking-wider block font-urbanist">
                    {isRTL ? 'أحدث عرض سعر' : 'Latest Quotation'}
                  </span>
                  <div className="text-lg font-black text-blue-600 dark:text-[#8FC2F0] block font-urbanist">
                    {formatCurrencySAR(projectQuotations[0].amount)}
                  </div>
                  <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300 block font-urbanist">
                    Version V{projectQuotations[0].version} &bull; {projectQuotations[0].status}
                  </span>
                </div>
              )}

              {/* 3. Final Won Value (if stage is won) */}
              {project.pipeline_stage === 'won' && (
                <div className="border-l border-slate-200 dark:border-slate-800 pl-5">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block font-urbanist">
                    {isRTL ? 'قيمة الصفقة الرابحة' : 'Final Won Value'}
                  </span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 block font-urbanist">
                    {formatCurrencySAR(project.final_won_value || (projectQuotations.length > 0 ? projectQuotations[0].amount : project.estimated_value))}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 block">
                    {isRTL ? 'معتمدة وناجحة' : 'Awarded Commercial Deal'}
                  </span>
                </div>
              )}

              {/* 4. Weighted Value */}
              <div className="border-l border-slate-200 dark:border-slate-800 pl-5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-urbanist">
                  {isRTL ? 'القيمة المرجحة' : 'Weighted Value'}
                </span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 block font-urbanist">
                  {canEditCommercialValue(project.pipeline_stage) ? formatCurrencySAR(project.weighted_value) : 'SAR 0'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {project.probability}% {isRTL ? 'احتمالية' : 'Probability'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Visual Pipeline Progression Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isRTL ? 'مسار تقدم مراحل الصفقة' : 'Sales Pipeline Progression'}
            </div>
            {project.pipeline_stage !== 'won' && project.pipeline_stage !== 'lost' && (
              <div className={`px-3 py-1 rounded-full text-xs border flex items-center gap-1.5 font-urbanist ${aging.badgeClass}`}>
                <Clock className="w-3.5 h-3.5" />
                <span className="font-bold">
                  {isRTL 
                    ? `مستمر في مرحلة "${stageConfig?.labelAr || stageConfig?.label || project.pipeline_stage}" منذ ${aging.daysInStage} يوماً (الحد المعياري: ${aging.slaDays} يوم)` 
                    : `In "${stageConfig?.label || project.pipeline_stage}" stage for ${aging.daysInStage} days (Target SLA: ${aging.slaDays}d)`}
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
            {progressionStages.map((st, idx) => {
              const conf = PIPELINE_STAGES.find(s => s.value === st);
              const isPast = currentStageIndex >= idx;
              const isCurrent = normalizedStage === st;
              const isLostStage = st === 'lost';

              return (
                <button
                  key={st}
                  disabled={isUpdatingStage}
                  onClick={() => handleStageChange(st)}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                    isCurrent 
                      ? isLostStage
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-bold'
                        : 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold' 
                      : isLostStage
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:text-rose-800'
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

          {/* Active Stage Specific Panel */}
          {/* 1. RFQ Processing - Packages */}
          {(project.pipeline_stage === 'rfq_processing' || (project.pipeline_stage as string) === 'pricing') && (
            <div className="mt-4 p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-sky-900 dark:text-sky-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>{isRTL ? 'حزم وأنظمة التسعير المحالة للـ Pre-Sales:' : 'RFQ Pricing Packages (Pre-Sales):'}</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isRTL ? 'الأنظمة المطلوب تسعيرها لهذا المشروع:' : 'Select which system packages are currently being priced:'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { id: 'lc', label: '⚡ LC (تيارات خفيفة)' },
                  { id: 'bms', label: '🏢 BMS (إدارة مباني)' },
                  { id: 'both', label: '⚡🏢 LC + BMS (كلاهما)' },
                ].map(pkg => {
                  const isSelected = (project.rfq_packages || 'both') === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handleTogglePackage(pkg.id as RFQPackage)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-sky-400'
                      }`}
                    >
                      {pkg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Quotation Sent - Days Tracker & SLA Alerts */}
          {project.pipeline_stage === 'quotation_sent' && (
            <div className={`mt-4 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in ${
              quotationDaysElapsed >= 10
                ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                : quotationDaysElapsed >= 7
                ? 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800'
                : quotationDaysElapsed >= 3
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                : 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200/90 dark:border-blue-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                  quotationDaysElapsed >= 10
                    ? 'bg-rose-600 text-white animate-pulse'
                    : quotationDaysElapsed >= 7
                    ? 'bg-orange-500 text-white'
                    : quotationDaysElapsed >= 3
                    ? 'bg-amber-500 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                      {isRTL ? 'متابعة العرض التجاري (Quotation Sent Age):' : 'Quotation Follow-up Age:'}
                    </span>
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full font-mono text-white ${
                      quotationDaysElapsed >= 10 ? 'bg-rose-600' : quotationDaysElapsed >= 7 ? 'bg-orange-600' : quotationDaysElapsed >= 3 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}>
                      ⏱️ {quotationDaysElapsed} {isRTL ? (quotationDaysElapsed === 1 ? 'يوم مضى' : quotationDaysElapsed === 2 ? 'يومان' : 'أيام مضت') : (quotationDaysElapsed === 1 ? 'day ago' : 'days ago')}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                    {quotationDaysElapsed >= 10
                      ? (isRTL ? '🚨 تنبيه حرج (10+ أيام): تواصل عاجل مع المشتريات لحسم الترسية قبل فوات الفرصة!' : '🚨 Critical (10+ days): Contact client procurement immediately!')
                      : quotationDaysElapsed >= 7
                      ? (isRTL ? '⚡ تنبيه تحذيري (7 أيام): ينصح بجدولة اتصال فوري لمناقشة العرض وملاحظات العميل.' : '⚡ Warning (7 days): Call client to address commercial feedback.')
                      : quotationDaysElapsed >= 3
                      ? (isRTL ? '⚠️ تنبيه أولي (3 أيام): يرجى التأكد من استلام العميل للمواصفات والأسعار ومراجعتها.' : '⚠️ Alert (3 days): Verify customer quote receipt.')
                      : (isRTL ? 'العرض مرسل حديثاً - ضمن الفترة المخططة للمتابعة.' : 'Recently submitted quotation.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Technical Submittal - Approval Status */}
          {project.pipeline_stage === 'technical_submission' && (
            <div className="mt-4 p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-purple-900 dark:text-purple-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <FileCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>{isRTL ? 'حالة اعتماد العرض الفني (Submittal Status):' : 'Technical Submittal Approval Status:'}</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isRTL ? 'قم بتحديث حالة الاعتماد الصادرة من استشاري المشروع:' : 'Select approval status issued by project consultant:'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'under_approval', label: isRTL ? 'قيد الاعتماد' : 'Under Approval', color: 'bg-amber-500 text-white border-amber-600' },
                  { id: 'approved', label: isRTL ? 'معتمد (Approved)' : 'Approved', color: 'bg-emerald-600 text-white border-emerald-600' },
                  { id: 'approved_with_comments', label: isRTL ? 'معتمد بملاحظات' : 'Appr. w/ Comments', color: 'bg-blue-600 text-white border-blue-600' },
                  { id: 'rejected', label: isRTL ? 'مرفوض (Rejected)' : 'Rejected', color: 'bg-rose-600 text-white border-rose-600' },
                ].map(item => {
                  const isCurrentStatus = (project.submittal_status || 'under_approval') === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSetSubmittalStatus(item.id as SubmittalStatus)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isCurrentStatus
                          ? `${item.color} shadow-xs font-black ring-2 ring-purple-400/50 scale-[1.02]`
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-purple-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Negotiation - Technical Approved Guarantee + Target Price + Latest Discount */}
          {(project.pipeline_stage === 'negotiation' || (project.pipeline_stage as string) === 'technically_approved') && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 font-black text-xs px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isRTL ? 'معتمد فنياً (Technical Approved) ✅' : 'Technical Approved ✅'}</span>
                </span>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {isRTL ? 'المشروع في مرحلة التفاوض المالي النهائي' : 'Final Commercial Negotiation Stage'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-right">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {isRTL ? 'آخر خصم مرسل:' : 'Latest Discount:'}
                  </span>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
                    {discountDisplay}
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-right">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {isRTL ? 'السعر المستهدف للعميل:' : 'Client Target Price:'}
                  </span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 font-mono">
                    {targetPriceDisplay}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  {isRTL ? 'تعديل السعر والخصم' : 'Edit Target/Discount'}
                </button>
              </div>
            </div>
          )}
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Log Call</span>
              </button>
              <button
                onClick={() => openFastLog({ project, defaultGoal: 'Client office technical meeting' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-purple-600" />
                <span>Set Reminder</span>
              </button>
              {(project.pipeline_stage === 'won' || project.po_attachment_url || project.po_number) && (
                <button
                  onClick={() => {
                    const el = document.getElementById('po-collection-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl text-xs font-bold transition-all border border-emerald-300 dark:border-emerald-800 shadow-2xs cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isRTL ? 'أمر الشراء والتحصيل (PO)' : 'PO & Collection'}</span>
                </button>
              )}
              <button
                onClick={() => setIsAddQuotationModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5 text-amber-600" />
                <span>Upload Quotation</span>
              </button>
              <button
                onClick={() => openRequestModal(project)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                <span>Request Approval</span>
              </button>
              <button
                onClick={() => setIsLostModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
                title={isRTL ? "تسجيل كصفقة خاسرة وتوثيق السبب الإجباري" : "Mark as Lost and document mandatory reason"}
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{isRTL ? 'صفقة خاسرة' : 'Mark as Lost'}</span>
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

      {/* Dedicated Section: Purchase Order (PO) & Cash Collection (Won Stage) */}
      {(project.pipeline_stage === 'won' || project.po_attachment_url || project.po_number || project.collected_amount) && (
        <div id="po-collection-section">
          <POCollectionManager project={project} />
        </div>
      )}

      {/* Dedicated Section: Quotation Management & Price History (Section 8) */}
      <QuotationManager project={project} />

      {/* Grid: Reminders & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Reminders & Follow-up Items */}
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

      {/* Lost Reason Modal */}
      <LostReasonModal
        isOpen={isLostModalOpen}
        project={project}
        onClose={() => setIsLostModalOpen(false)}
        onConfirm={handleConfirmLost}
      />

      {/* Won Celebration Modal */}
      <WonCelebrationModal
        isOpen={isWonCelebrationOpen}
        project={project}
        onClose={() => setIsWonCelebrationOpen(false)}
      />

      {/* Archive / Delete Project Modal */}
      <ArchiveProjectModal
        isOpen={isArchiveModalOpen}
        project={project}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchiveProject}
      />

      {/* Refer Project Modal */}
      {isReferModalOpen && project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-card rounded-3xl max-w-md w-full shadow-2xl border border-white/90 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#1E2536] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {isRTL ? 'إحالة المشروع (Refer Project)' : 'Refer Project'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {project.pr_number} - {project.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReferModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
              <strong>{isRTL ? 'تنبيه مهم:' : 'Important Notice:'}</strong>{' '}
              {isRTL 
                ? 'مالك المشروع الأصلي (من أنشأ المشروع) سيبقى كما هو دون تغيير لحفظ حقه. سيتم تسجيل المهندس الجديد في خانة (محال إلى) وإرسال إشعار فوري للطرفين.' 
                : 'The original owner/creator of the project remains permanently unchanged. The new engineer will be recorded in "Referred To" and both reps will be notified.'}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? 'اختر مهندس المبيعات المحال إليه المشروع:' : 'Select Target Sales Engineer:'}
              </label>
              <select
                value={selectedReferUser}
                onChange={e => setSelectedReferUser(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white shadow-2xs"
              >
                <option value="">{isRTL ? '-- اختر مهندس المبيعات --' : '-- Select Sales Engineer --'}</option>
                {salesReps.map(rep => {
                  const isCurrent = rep.id === (project.referred_to_id || project.owner_id);
                  return (
                    <option key={rep.id} value={rep.id} disabled={isCurrent}>
                      {rep.full_name} {isCurrent ? (isRTL ? '(الحالي)' : '(Current)') : ''} {rep.territory ? `(${rep.territory})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsReferModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!selectedReferUser || isSubmittingRefer}
                onClick={handleConfirmRefer}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isSubmittingRefer ? (isRTL ? 'جاري الإحالة...' : 'Referring...') : (isRTL ? 'تأكيد الإحالة' : 'Confirm Referral')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
