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
  MoreHorizontal,
  MessageSquare,
  Eye,
  X
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { PIPELINE_STAGES, OPPORTUNITY_TYPES, canEditCommercialValue } from '@/lib/constants';
import { formatCurrencySAR, formatDateString, normalizePhoneNumber, formatTelUri } from '@/lib/utils';
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
import { AssignConsultantModal } from '@/components/modals/assign-consultant-modal';
import { POCollectionManager } from '@/components/projects/po-collection-manager';
import { canUserAccessProjectCockpit } from '@/lib/logic/scope';
import { ProjectSystemsMultiSelect } from '@/components/projects/project-systems-select';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { 
    currentUser,
    teamMembers,
    projects, 
    teamProjects,
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
    openRequestDetail,
    shareProjectToChat
  } = useCRM();

  const projectId = params.id as string;
  const allProjects = React.useMemo(() => {
    return (teamProjects && teamProjects.length > 0) ? teamProjects : projects;
  }, [teamProjects, projects]);
  const project = allProjects.find(p => p.id === projectId);

  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isAddQuotationModalOpen, setIsAddQuotationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedContactForWhatsApp, setSelectedContactForWhatsApp] = useState<any | null>(null);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isWonCelebrationOpen, setIsWonCelebrationOpen] = useState(false);
  const [selectedQuotationForPrint, setSelectedQuotationForPrint] = useState<Quotation | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isAssignConsultantOpen, setIsAssignConsultantOpen] = useState(false);

  // Referral states
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [selectedReferUser, setSelectedReferUser] = useState('');
  const [isSubmittingRefer, setIsSubmittingRefer] = useState(false);

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin';
  const isCurrentAssignee = project?.referred_to_id ? project.referred_to_id === currentUser.id : project?.owner_id === currentUser.id;
  const isReadOnlyMember = !isManager && !isCurrentAssignee;
  const canEdit = !isReadOnlyMember;
  const canRefer = (isManager || isCurrentAssignee) && !isReadOnlyMember;
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

  const assignedContacts = React.useMemo(() => {
    const ids = project.contact_ids && project.contact_ids.length > 0
      ? project.contact_ids
      : (project.primary_contact_id ? [project.primary_contact_id] : []);
    
    if (ids.length > 0) {
      const matched = contacts.filter(c => ids.includes(c.id));
      if (matched.length > 0) return matched;
    }
    if (primaryContact) return [primaryContact];
    if (project.primary_contact_name) {
      return [{
        id: project.primary_contact_id || 'primary_c',
        full_name: project.primary_contact_name,
        phone: project.primary_contact_phone,
        job_title: 'Key Contact',
        is_hot_lead: false,
        created_at: ''
      }];
    }
    return [];
  }, [project.contact_ids, project.primary_contact_id, project.primary_contact_name, project.primary_contact_phone, primaryContact, contacts]);

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

  const effectiveSystems = React.useMemo(() => {
    if (!project) return [];
    if (project.systems && project.systems.length > 0) return project.systems;
    if (project.rfq_packages === 'lc') return ['Lighting Control'];
    if (project.rfq_packages === 'bms') return ['BMS / BAS'];
    if (project.rfq_packages === 'both') return ['BMS / BAS', 'Lighting Control'];
    return [];
  }, [project?.systems, project?.rfq_packages]);

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
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-sans">
      {/* Top Nav / Back Button */}
      <div className="flex items-center justify-between gap-4">
        <Link 
          href="/projects" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-[#8FC2F0] transition-colors"
        >
          <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          <span>{isRTL ? 'العودة لمسار المشاريع' : 'Back to Projects Pipeline'}</span>
        </Link>
      </div>

      {/* View-Only Member Notification Banner */}
      {isReadOnlyMember && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs font-urbanist animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-lg shrink-0">
              <Eye className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <div className="text-sm font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                <span>{isRTL ? 'صلاحية اطلاع فقط (View-Only Member)' : 'View-Only Project Member'}</span>
                <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                  {isRTL ? 'للاطلاع والمتابعة' : 'VIEW ONLY'}
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 font-medium leading-relaxed max-w-3xl">
                {isRTL
                  ? `أنت تشاهد هذا المشروع بصفتك عضواً مصرحاً له (Member) عبر الشات للاطلاع والاسترشاد فقط. لا تملك صلاحية التعديل أو إضافة عروض أسعار أو تغيير المراحل، حيث تقتصر الصلاحيات الكاملة على مسؤول المشروع (${project.owner_name || 'مسؤول المشروع'}) وإدارة المبيعات.`
                  : `You are viewing this project as an authorized team member for review and reference only. Editing, adding quotations, and changing stages are restricted to the assigned sales engineer (${project.owner_name || 'Project Owner'}) and management.`}
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold shrink-0 shadow-2xs">
            🔒 {isRTL ? 'وضع القراءة فقط' : 'Read-Only Mode'}
          </span>
        </div>
      )}

      {/* Pending Approval Banner */}
      {pendingRequest && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-2xs transition-all ${
          pendingRequest.urgency === 'urgent'
            ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
            : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
              pendingRequest.urgency === 'urgent' ? 'bg-rose-200 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200' : 'bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
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
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                Requested by <strong className="text-slate-800 dark:text-slate-200">{pendingRequest.requester_name || pendingRequest.requested_by}</strong>{pendingRequest.payload?.reason ? ` • Reason: "${pendingRequest.payload.reason}"` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => openRequestDetail(pendingRequest.id)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all whitespace-nowrap shrink-0 hover:border-slate-300 cursor-pointer"
          >
            Review Request Details &rarr;
          </button>
        </div>
      )}

      {/* Deal Lost Alert Banner */}
      {project.pipeline_stage === 'lost' && (
        <div className="p-4 rounded-2xl border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200 flex items-center justify-center font-bold text-lg shrink-0">
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <div className="text-sm font-black text-rose-950 dark:text-rose-200 flex items-center gap-2">
                <span>{isRTL ? 'صفقة خاسرة (Lost Deal)' : 'Deal Closed as Lost'}</span>
                <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                  {isRTL ? 'صفقة خاسرة' : 'LOST'}
                </span>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 font-medium leading-relaxed">
                <strong className="text-rose-950 dark:text-rose-100 font-bold">{isRTL ? 'سبب الخسارة الموثق: ' : 'Documented Loss Reason: '}</strong>
                <span>{project.lost_reason || (isRTL ? 'لم يتم تسجيل سبب محدد بعد.' : 'No reason recorded yet.')}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLostModalOpen(true)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 hover:bg-rose-100/60 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-xl shadow-2xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
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

      {/* Project Executive Header Card */}
      <div className="bg-white dark:bg-[#1E2536] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6 font-urbanist">
        {/* Top Row: Identity, Badges, Actions & Financial Snapshot */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
          {/* Left Column: Project Identity & Metadata */}
          <div className="space-y-3 min-w-0 flex-1">
            {/* Top Badges Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* PR Number */}
              <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-[#8FC2F0] rounded-lg border border-slate-200/90 dark:border-slate-700 shadow-2xs">
                {project.pr_number}
              </span>

              {/* In Hand / Tender Badge */}
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 shadow-2xs ${
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

              {/* In Hand Mandatory Closing Date Badge */}
              {project.opportunity_type === 'in_hand' && project.closing_date && (
                <span className="text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-400/80 bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>
                    {isRTL ? `تاريخ الإغلاق: ${formatDateString(project.closing_date)}` : `Closing: ${formatDateString(project.closing_date)}`}
                  </span>
                </span>
              )}

              {/* Stage Aging Timer */}
              {project.pipeline_stage !== 'won' && project.pipeline_stage !== 'lost' && (
                <span 
                  className={`text-xs font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 ${aging.badgeClass}`}
                  title={isRTL ? `المشروع في هذه المرحلة منذ ${aging.daysInStage} يوماً (الحد المعياري: ${aging.slaDays} يوم)` : `Project in this stage for ${aging.daysInStage} days (Target SLA: ${aging.slaDays}d)`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isRTL ? aging.labelAr : aging.labelEn}</span>
                </span>
              )}

              {/* Health Indicator */}
              {project.calculated_health === 'red' && (
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>{project.days_overdue ? `${project.days_overdue} ${isRTL ? 'يوم تأخير' : 'days late'}` : (isRTL ? 'يحتاج متابعة' : 'Needs Attention')}</span>
                </span>
              )}
            </div>

            {/* Project Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {project.name}
            </h1>

            {/* Project Metadata Tags */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap pt-0.5">
              <span className="text-blue-600 dark:text-[#8FC2F0] flex items-center gap-1.5 font-bold">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>{project.company_name}</span>
              </span>

              {/* Consultant Tag / Add Consultant Button */}
              {project.consultant_name ? (
                <button
                  type="button"
                  onClick={() => setIsAssignConsultantOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors cursor-pointer text-xs shadow-2xs"
                  title={isRTL ? 'تغيير استشاري المشروع' : 'Change Project Consultant'}
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{isRTL ? `الاستشاري: ${project.consultant_name}` : `Consultant: ${project.consultant_name}`}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAssignConsultantOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 font-bold transition-colors cursor-pointer text-xs shadow-2xs"
                  title={isRTL ? 'تعيين استشاري لهذا المشروع' : 'Add consultant for this project'}
                >
                  <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{isRTL ? 'إضافة استشاري للمشروع' : 'Add consultant for this project'}</span>
                </button>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{project.location}</span>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'المالك:' : 'Owner:'}</span>
                <span className="text-slate-800 dark:text-slate-200">{project.owner_name || 'Eslam Mohandes'}</span>
              </span>
              {project.referred_to_name && (
                <span className="flex items-center gap-1 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{isRTL ? 'محال إلى:' : 'Referred To:'} {project.referred_to_name}</span>
                </span>
              )}
              {project.created_at && (
                <span className="text-slate-400 text-[11px]">
                  {isRTL ? 'أضيف بتاريخ:' : 'Added:'} {formatDateString(project.created_at)}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Financial Cards & Primary Actions */}
          <div className="flex flex-col sm:flex-row xl:flex-col items-start xl:items-end justify-between gap-4 shrink-0">
            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {canEdit && currentRole !== 'viewer' && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#141820] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 text-xs font-bold rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
                  title="Edit Project Details"
                >
                  <Edit className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isRTL ? 'تعديل المشروع' : 'Edit Project'}</span>
                </button>
              )}

              {canEdit && currentRole !== 'viewer' && (
                <button
                  onClick={() => openReminder({
                    entity_type: 'project',
                    entity_id: project.id,
                    entity_name: project.name,
                    project_id: project.id,
                    project_name: project.name,
                  })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#141820] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-purple-600 text-xs font-bold rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
                  title="Set Reminder for this project"
                >
                  <Bell className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isRTL ? 'تذكير' : 'Reminder'}</span>
                </button>
              )}

              {/* Share Project Card to Chat */}
              <button
                onClick={() => shareProjectToChat({ projectId: project.id })}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold rounded-xl border border-sky-200 dark:border-sky-800 shadow-2xs transition-all cursor-pointer"
                title={isRTL ? 'مشاركة كارت المشروع في الشات الداخلي' : 'Share Project in Chat'}
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>{isRTL ? 'مشاركة بالشات' : 'Share to Chat'}</span>
              </button>

              {/* Apple HIG Overflow Menu for Secondary Actions */}
              {canEdit && currentRole !== 'viewer' && (
                <div className="relative">
                  <button
                    onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                    className="inline-flex items-center justify-center w-9 h-9 bg-white dark:bg-[#141820] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
                    title={isRTL ? 'المزيد من الإجراءات' : 'More Actions'}
                    aria-label="More Actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isActionsMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-20" 
                        onClick={() => setIsActionsMenuOpen(false)} 
                      />
                      <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-1.5 w-56 bg-white dark:bg-[#1c222e] rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-700/80 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100`}>
                        {canRefer && (
                          <button
                            onClick={() => {
                              setIsActionsMenuOpen(false);
                              const otherRep = salesReps.find(r => r.id !== (project.referred_to_id || project.owner_id));
                              setSelectedReferUser(otherRep?.id || '');
                              setIsReferModalOpen(true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-start cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4 text-blue-600" />
                            <span>{isRTL ? 'إحالة المشروع (Refer)' : 'Refer Project'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setIsActionsMenuOpen(false);
                            openRequestModal(project);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-start cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          <span>{isRTL ? 'طلب موافقة (خصم / عرض)' : 'Request Approval'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsActionsMenuOpen(false);
                            setIsAssignConsultantOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-start cursor-pointer"
                        >
                          <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span>{isRTL ? 'تعيين / تغيير استشاري المشروع' : 'Assign / Change Consultant'}</span>
                        </button>

                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                        {project.is_archived ? (
                          <button
                            onClick={() => {
                              setIsActionsMenuOpen(false);
                              handleRestoreProject();
                            }}
                            disabled={isRestoring}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors text-start cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-4 h-4 text-emerald-600" />
                            <span>{isRestoring ? (isRTL ? 'جاري الاستعادة...' : 'Restoring...') : (isRTL ? 'استعادة المشروع' : 'Restore Project')}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setIsActionsMenuOpen(false);
                              setIsArchiveModalOpen(true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-start cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                            <span>{isRTL ? 'نقل إلى الأرشيف (حذف)' : 'Move to Archive'}</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Financial Summary Card */}
            <div className="crm-card-soft p-3.5 sm:p-4 flex items-center gap-5 flex-wrap">
              {/* Estimated Value */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  {isRTL ? 'القيمة التقديرية' : 'Estimated Value'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {formatCurrencySAR(project.estimated_value)}
                  </span>
                  {canEdit && canEditCommercialValue(project.pipeline_stage) && currentRole !== 'viewer' && (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                      title="Edit Estimated Value"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Latest Quote if available */}
              {projectQuotations.length > 0 && (
                <div className="border-l border-slate-200/80 dark:border-slate-700/80 pl-4 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-[#8FC2F0] uppercase tracking-wider block">
                    {isRTL ? 'أحدث عرض سعر' : 'Latest Quotation'}
                  </span>
                  <div className="text-xl font-black text-blue-600 dark:text-[#8FC2F0] mt-0.5">
                    {formatCurrencySAR(projectQuotations[0].amount)}
                  </div>
                  <span className="text-[10px] font-bold text-blue-700/80 dark:text-blue-300/80 block">
                    V{projectQuotations[0].version} &bull; {projectQuotations[0].status}
                  </span>
                </div>
              )}

              {/* Won Value if won */}
              {project.pipeline_stage === 'won' && (
                <div className="border-l border-slate-200/80 dark:border-slate-700/80 pl-4 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    {isRTL ? 'قيمة الترسية' : 'Won Value'}
                  </span>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatCurrencySAR(project.final_won_value || (projectQuotations.length > 0 ? projectQuotations[0].amount : project.estimated_value))}
                  </div>
                </div>
              )}

              {/* Weighted Value */}
              <div className="border-l border-slate-200/80 dark:border-slate-700/80 pl-4 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  {isRTL ? 'القيمة المرجحة' : 'Weighted Value'}
                </span>
                <div className="text-base font-black text-slate-700 dark:text-slate-300 mt-0.5">
                  {canEditCommercialValue(project.pipeline_stage) ? formatCurrencySAR(project.weighted_value) : 'SAR 0'}
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {project.probability}% {isRTL ? 'احتمالية' : 'Probability'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Pipeline Progression & Sleek Permanent Scope Selector */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Top Bar above Stepper: Stage Title + Aging SLA + SLEEK PERMANENT PRICING PACKAGES */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {isRTL ? 'مسار تقدم مراحل الصفقة' : 'Sales Pipeline Progression'}
              </span>
              {project.pipeline_stage !== 'won' && project.pipeline_stage !== 'lost' && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${aging.badgeClass}`}>
                  <Clock className="w-3 h-3" />
                  <span>
                    {isRTL 
                      ? `${aging.daysInStage} يوماً في المرحلة (الحد المعياري: ${aging.slaDays} يوم)` 
                      : `${aging.daysInStage}d in stage (Target SLA: ${aging.slaDays}d)`}
                  </span>
                </span>
              )}
            </div>

            {/* PROJECT SYSTEMS MULTI-SELECT DROPDOWN */}
            {canEdit && currentRole !== 'viewer' && (
              <div className="flex items-center gap-2">
                <ProjectSystemsMultiSelect
                  selectedSystems={effectiveSystems}
                  onChange={async (newSystems) => {
                    await updateProject(project.id, { systems: newSystems });
                  }}
                  compact
                />
              </div>
            )}
          </div>

          {/* Project Systems Badges List */}
          {effectiveSystems.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>{isRTL ? 'أنظمة المشروع المعتمدة:' : 'Project Systems:'}</span>
              </span>
              {effectiveSystems.map(sys => (
                <span
                  key={sys}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800 text-xs font-bold font-urbanist shadow-2xs"
                >
                  <Check className="w-3 h-3 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
                  <span>{sys}</span>
                </span>
              ))}
            </div>
          )}

          {/* Stepper Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {progressionStages.map((st, idx) => {
              const conf = PIPELINE_STAGES.find(s => s.value === st);
              const isPast = currentStageIndex >= idx;
              const isCurrent = normalizedStage === st;
              const isLostStage = st === 'lost';

              return (
                <button
                  key={st}
                  disabled={isUpdatingStage || !canEdit}
                  onClick={() => canEdit && handleStageChange(st)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                    !canEdit ? 'cursor-default opacity-85' : 'cursor-pointer'
                  } ${
                    isCurrent 
                      ? isLostStage
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-black'
                        : 'bg-blue-600 text-white border-blue-600 shadow-xs font-black' 
                      : isLostStage
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900 hover:bg-rose-100'
                        : isPast
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200/80 dark:border-blue-800 hover:bg-blue-100'
                          : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700'
                  }`}
                >
                  <div className="truncate">{conf?.label || st}</div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Specific Panel (Except RFQ packages which is now permanently above) */}
          {/* Quotation Sent - Days Tracker & SLA Alerts */}
          {project.pipeline_stage === 'quotation_sent' && (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in ${
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

          {/* Technical Submittal - Approval Status */}
          {project.pipeline_stage === 'technical_submission' && (
            <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
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
                      disabled={!canEdit}
                      onClick={() => canEdit && handleSetSubmittalStatus(item.id as SubmittalStatus)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        !canEdit ? 'cursor-default opacity-85' : 'cursor-pointer'
                      } ${
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

          {/* Negotiation - Technical Approved Guarantee + Target Price + Latest Discount */}
          {(project.pipeline_stage === 'negotiation' || (project.pipeline_stage as string) === 'technically_approved') && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 font-black text-xs px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isRTL ? 'معتمد فنياً (Technical Approved) ✅' : 'Technical Approved ✅'}</span>
                </span>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {isRTL ? 'المشروع في مرحلة التفاوض المالي النهائي' : 'Final Commercial Negotiation Stage'}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
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

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    {isRTL ? 'تعديل السعر والخصم' : 'Edit Target/Discount'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Workflow Fast Actions Bar */}
        {canEdit && currentRole !== 'viewer' && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                {isRTL ? 'إجراءات سريعة للمشروع:' : 'Fast Actions:'}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => openFastLog({ project, defaultGoal: 'Phone follow-up call with contractor / client' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 hover:text-blue-700 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>{isRTL ? 'تسجيل مكالمة' : 'Log Call'}</span>
              </button>
              <button
                onClick={() => openFastLog({ project, defaultGoal: 'Client office technical meeting' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-200 hover:text-emerald-700 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isRTL ? 'تسجيل اجتماع' : 'Log Meeting'}</span>
              </button>
              <button
                onClick={() => setIsAddQuotationModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950 text-slate-700 dark:text-slate-200 hover:text-amber-800 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5 text-amber-600" />
                <span>{isRTL ? 'رفع وتحديث عرض سعر' : 'Upload Quotation'}</span>
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
              {project.pipeline_stage !== 'lost' && (
                <button
                  onClick={() => setIsLostModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-200 hover:text-rose-700 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
                  title={isRTL ? "تسجيل كصفقة خاسرة وتوثيق السبب الإجباري" : "Mark as Lost and document mandatory reason"}
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isRTL ? 'صفقة خاسرة' : 'Mark as Lost'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Next Action & Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-urbanist">
        {/* Section 1: Next Action (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E2536] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-[#8FC2F0]" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  {isRTL ? 'الإجراء التالي المطلوب' : 'Next Action Required'}
                </h2>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {isRTL ? 'يُحدّث آلياً من آخر تواصل' : 'Maintained automatically from latest interaction'}
              </span>
            </div>

            {project.next_action ? (
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {project.next_action}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    {isRTL ? 'تاريخ المتابعة المستهدف:' : 'Target Follow-up:'} {formatDateString(project.next_follow_up_at)}
                  </span>
                  {project.last_activity_at && (
                    <span className="text-slate-400 dark:text-slate-500">
                      {isRTL ? 'آخر نشاط مسجل:' : 'Last logged activity:'} {formatDateString(project.last_activity_at)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/50 text-xs font-semibold">
                {isRTL ? 'لم يتم تحديد إجراء تالٍ لهذا المشروع بعد. سجل نشاطاً لتحديد موعد المتابعة القادم!' : 'No next action has been set for this project yet. Please log an activity to establish follow-up!'}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-4">
            <span className="font-mono text-[11px]">ID: {project.id}</span>
            {canEdit && (
              <button
                onClick={() => openFastLog({ project })}
                className="font-bold text-blue-600 dark:text-[#8FC2F0] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>+ {isRTL ? 'تسجيل نشاط لهذا المشروع' : 'Log Activity for this Project'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 2: Key Contacts Card (Multiple Key Contacts with Apple HIG polish) */}
        <div className="bg-white dark:bg-[#1E2536] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600 dark:text-[#8FC2F0]" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  {isRTL ? 'المسؤولون المعنيون بالمشروع' : 'Key Project Contacts'}
                </h2>
              </div>
              <span className="text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 font-urbanist">
                {assignedContacts.length} {isRTL ? 'مسؤولين' : 'Contacts'}
              </span>
            </div>

            {assignedContacts.length > 0 ? (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {assignedContacts.map((cnt) => {
                  const isPrimary = cnt.id === (project.primary_contact_id || assignedContacts[0]?.id);
                  const cntCleanPhone = cnt.phone ? normalizePhoneNumber(cnt.phone) : null;
                  return (
                    <div 
                      key={cnt.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isPrimary
                          ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80 shadow-2xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isPrimary
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            {cnt.full_name?.charAt(0) || 'C'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              <span>{cnt.full_name}</span>
                              {isPrimary && (
                                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-300 dark:border-amber-700">
                                  ★ {isRTL ? 'الرئيسي' : 'Primary'}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {cnt.job_title || (isRTL ? 'صاحب القرار' : 'Key Contact')}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        {cnt.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">{cnt.phone}</span>
                          </div>
                        )}
                        {cnt.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <a href={`mailto:${cnt.email}`} className="hover:underline text-blue-600 dark:text-[#8FC2F0] text-[11px] truncate">
                              {cnt.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Instant Actions for this contact */}
                      <div className="flex items-center gap-2 pt-2.5 mt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        {cntCleanPhone && (
                          <a
                            href={`tel:${formatTelUri(cntCleanPhone)}`}
                            className="flex-1 py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                            title={`${isRTL ? 'اتصال بـ' : 'Call'} ${cnt.full_name}`}
                          >
                            <Phone className="w-3 h-3 text-blue-600 dark:text-[#8FC2F0]" />
                            <span>{isRTL ? 'اتصال' : 'Call'}</span>
                          </a>
                        )}
                        {cntCleanPhone && (
                          <button
                            onClick={() => {
                              setSelectedContactForWhatsApp(cnt);
                              setIsWhatsAppModalOpen(true);
                            }}
                            className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-2xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title={`${isRTL ? 'مراسلة واتساب لـ' : 'WhatsApp'} ${cnt.full_name}`}
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>{isRTL ? 'واتساب' : 'WhatsApp'}</span>
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => openFastLog({ project, contactId: cnt.id })}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
                            title={isRTL ? 'تسجيل نشاط مع هذا الشخص' : 'Log activity with this contact'}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center">
                {isRTL ? 'لا توجد جهات اتصال مرتبطة بهذا المشروع بعد.' : 'No key contacts linked to this project yet.'}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-right mt-4 flex items-center justify-between">
            {canEdit ? (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs text-blue-600 dark:text-[#8FC2F0] font-bold hover:underline cursor-pointer"
              >
                {isRTL ? '+ تعيين / تعديل جهات الاتصال' : '+ Assign / Edit Contacts'}
              </button>
            ) : <span />}
            <Link href="/contacts" className="text-xs text-slate-500 dark:text-slate-400 font-semibold hover:underline">
              {isRTL ? 'دليل جهات الاتصال ←' : 'All Contacts Directory →'}
            </Link>
          </div>
        </div>
      </div>

      {/* Dedicated Section: Purchase Order (PO) & Cash Collection (Won Stage) */}
      {(project.pipeline_stage === 'won' || project.po_attachment_url || project.po_number || project.collected_amount) && (
        <div id="po-collection-section">
          <POCollectionManager project={project} readOnly={isReadOnlyMember} />
        </div>
      )}

      {/* Dedicated Section: Quotation Management & Price History (Section 8) */}
      <QuotationManager project={project} readOnly={isReadOnlyMember} />

      {/* Grid: Reminders & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Reminders & Follow-up Items */}
          {/* Section: Reminders & Follow-up Items */}
          <div className="bg-white dark:bg-[#1E2536] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  {isRTL ? 'تذكيرات ومهام المشروع' : 'Project Reminders & Tasks'}
                </h2>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                  {projectReminders.length}
                </span>
              </div>
              {canEdit && currentRole !== 'viewer' && (
                <button
                  onClick={() => openReminder({
                    entity_type: 'project',
                    entity_id: project.id,
                    entity_name: project.name,
                    project_id: project.id,
                    project_name: project.name
                  })}
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ {isRTL ? 'إضافة تذكير' : 'Set Reminder'}</span>
                </button>
              )}
            </div>

            {projectReminders.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                <Bell className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                <p>{isRTL ? 'لا توجد مهام أو تذكيرات مجدولة لهذا المشروع.' : 'No action item reminders scheduled for this project.'}</p>
                {canEdit && currentRole !== 'viewer' && (
                  <button
                    onClick={() => openReminder({
                      entity_type: 'project',
                      entity_id: project.id,
                      entity_name: project.name,
                      project_id: project.id,
                      project_name: project.name
                    })}
                    className="mt-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isRTL ? 'جدولة أول تذكير للمشروع' : 'Schedule First Reminder'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectReminders.map(rem => (
                  <div
                    key={rem.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      rem.is_completed
                        ? 'bg-slate-50/80 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-white dark:bg-[#141820] border-slate-200/90 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-600 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        disabled={!canEdit}
                        onClick={() => canEdit && toggleReminderCompleted(rem.id)}
                        className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors ${
                          !canEdit ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          rem.is_completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-purple-500'
                        }`}
                        title={rem.is_completed ? 'Mark pending' : 'Mark completed'}
                      >
                        {rem.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div>
                        <div className={`text-xs font-bold ${rem.is_completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {rem.title}
                        </div>
                        {rem.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{rem.notes}</p>
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
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                        rem.urgency === 'urgent'
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : rem.urgency === 'high'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}>
                        {rem.urgency}
                      </span>

                      {canEdit && currentRole !== 'viewer' && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this reminder?')) {
                              deleteReminder(rem.id);
                            }
                          }}
                          className="text-slate-300 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-[#1E2536] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600 dark:text-[#8FC2F0]" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  {isRTL ? 'سجل أنشطة وتفاعلات المشروع' : 'Project Activity Timeline'}
                </h2>
              </div>
              {canEdit && currentRole !== 'viewer' && (
                <button 
                  onClick={() => openFastLog({ project })}
                  className="text-xs font-semibold text-blue-600 dark:text-[#8FC2F0] hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ {isRTL ? 'تسجيل نشاط' : 'Log Activity'}</span>
                </button>
              )}
            </div>

            {projectActivities.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                {isRTL ? 'لم يتم تسجيل أي أنشطة أو زيارات أو اتصالات لهذا المشروع بعد.' : 'No sales activities logged for this project yet.'}
              </div>
            ) : (
              <div className="space-y-4">
                {projectActivities.map(a => (
                  <div key={a.id} className="flex items-start gap-3 text-xs border-l-2 border-blue-500 pl-3 rtl:border-l-0 rtl:border-r-2 rtl:pl-0 rtl:pr-3">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white capitalize">{a.channel} &bull; {a.visit_purpose}</div>
                      {a.notes && <p className="text-slate-600 dark:text-slate-300 mt-0.5">{a.notes}</p>}
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">{formatDateString(a.activity_date)}</span>
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
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          setSelectedContactForWhatsApp(null);
        }}
        recipientPhone={selectedContactForWhatsApp?.phone ? normalizePhoneNumber(selectedContactForWhatsApp.phone) : (cleanPhone || '')}
        recipientName={selectedContactForWhatsApp?.full_name || primaryContact?.full_name || project.company_name || 'Client Representative'}
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

      {/* Assign Consultant Modal */}
      <AssignConsultantModal
        project={project}
        isOpen={isAssignConsultantOpen}
        onClose={() => setIsAssignConsultantOpen(false)}
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
