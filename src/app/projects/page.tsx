'use client';

import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Building2, 
  User, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Edit, 
  Trash2, 
  X,
  Calendar,
  Users,
  Users2,
  Kanban,
  Table as TableIcon,
  GripVertical,
  ArrowDown,
  Sparkles,
  Lock,
  Archive,
  RotateCcw,
  FileCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/store/crm-context';
import { 
  PIPELINE_STAGES, 
  OPPORTUNITY_TYPES, 
  PROJECT_PRIORITIES, 
  SAUDI_LOCATIONS,
  canEditCommercialValue
} from '@/lib/constants';
import { Project, OpportunityType, PipelineStage, ProjectPriority, CompanyType, Quotation } from '@/types/crm';
import { formatCurrencySAR, formatDateString, cn } from '@/lib/utils';
import { formatCompactSAR } from '@/lib/logic/quotation-pricing';
import { calculatePipelineForecast, getStageAgingInfo, STAGE_PROBABILITIES } from '@/lib/logic/pipeline-analytics';
import { ProjectCard } from '@/components/projects/project-card';
import { LostReasonModal } from '@/components/modals/lost-reason-modal';
import { WonCelebrationModal } from '@/components/modals/won-celebration-modal';
import { ArchiveProjectModal } from '@/components/modals/archive-project-modal';
import { AddProjectModal } from '@/components/modals/add-project-modal';
import { EditProjectModal } from '@/components/modals/edit-project-modal';
import { scopeProjects, canUserAccessProjectCockpit } from '@/lib/logic/scope';
import { useSalesScope } from '@/lib/hooks/useSalesScope';
import { useLanguage } from '@/lib/i18n/language-context';
import { ContextualHelp } from '@/components/guide/contextual-help';

interface MonthColumnDef {
  monthNum: string; // '01' to '12'
  monthIndex: number; // 0 to 11
  labelEn: string;
  labelAr: string;
  shortEn: string;
  shortAr: string;
  quarterId: 'Q1' | 'Q2' | 'Q3' | 'Q4';
}

interface QuarterDef {
  id: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  colorBorder: string;
  colorBg: string;
  colorBadge: string;
  months: MonthColumnDef[];
}

const CLOSING_QUARTERS: QuarterDef[] = [
  {
    id: 'Q1',
    titleEn: 'Q1 (Jan - Mar)',
    titleAr: 'Q1 (الربع الأول)',
    subtitleEn: 'January · February · March',
    subtitleAr: 'يناير · فبراير · مارس',
    colorBorder: 'border-blue-300 dark:border-blue-900/60',
    colorBg: 'bg-blue-50/25 dark:bg-blue-950/15',
    colorBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    months: [
      { monthNum: '01', monthIndex: 0, labelEn: 'January', labelAr: 'يناير', shortEn: 'Jan', shortAr: 'يناير', quarterId: 'Q1' },
      { monthNum: '02', monthIndex: 1, labelEn: 'February', labelAr: 'فبراير', shortEn: 'Feb', shortAr: 'فبراير', quarterId: 'Q1' },
      { monthNum: '03', monthIndex: 2, labelEn: 'March', labelAr: 'مارس', shortEn: 'Mar', shortAr: 'مارس', quarterId: 'Q1' },
    ]
  },
  {
    id: 'Q2',
    titleEn: 'Q2 (Apr - Jun)',
    titleAr: 'Q2 (الربع الثاني)',
    subtitleEn: 'April · May · June',
    subtitleAr: 'أبريل · مايو · يونيو',
    colorBorder: 'border-purple-300 dark:border-purple-900/60',
    colorBg: 'bg-purple-50/25 dark:bg-purple-950/15',
    colorBadge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    months: [
      { monthNum: '04', monthIndex: 3, labelEn: 'April', labelAr: 'أبريل', shortEn: 'Apr', shortAr: 'أبريل', quarterId: 'Q2' },
      { monthNum: '05', monthIndex: 4, labelEn: 'May', labelAr: 'مايو', shortEn: 'May', shortAr: 'مايو', quarterId: 'Q2' },
      { monthNum: '06', monthIndex: 5, labelEn: 'June', labelAr: 'يونيو', shortEn: 'Jun', shortAr: 'يونيو', quarterId: 'Q2' },
    ]
  },
  {
    id: 'Q3',
    titleEn: 'Q3 (Jul - Sep)',
    titleAr: 'Q3 (الربع الثالث)',
    subtitleEn: 'July · August · September',
    subtitleAr: 'يوليو · أغسطس · سبتمبر',
    colorBorder: 'border-amber-300 dark:border-amber-900/60',
    colorBg: 'bg-amber-50/25 dark:bg-amber-950/15',
    colorBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    months: [
      { monthNum: '07', monthIndex: 6, labelEn: 'July', labelAr: 'يوليو', shortEn: 'Jul', shortAr: 'يوليو', quarterId: 'Q3' },
      { monthNum: '08', monthIndex: 7, labelEn: 'August', labelAr: 'أغسطس', shortEn: 'Aug', shortAr: 'أغسطس', quarterId: 'Q3' },
      { monthNum: '09', monthIndex: 8, labelEn: 'September', labelAr: 'سبتمبر', shortEn: 'Sep', shortAr: 'سبتمبر', quarterId: 'Q3' },
    ]
  },
  {
    id: 'Q4',
    titleEn: 'Q4 (Oct - Dec)',
    titleAr: 'Q4 (الربع الرابع)',
    subtitleEn: 'October · November · December',
    subtitleAr: 'أكتوبر · نوفمبر · ديسمبر',
    colorBorder: 'border-emerald-300 dark:border-emerald-900/60',
    colorBg: 'bg-emerald-50/25 dark:bg-emerald-950/15',
    colorBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    months: [
      { monthNum: '10', monthIndex: 9, labelEn: 'October', labelAr: 'أكتوبر', shortEn: 'Oct', shortAr: 'أكتوبر', quarterId: 'Q4' },
      { monthNum: '11', monthIndex: 10, labelEn: 'November', labelAr: 'نوفمبر', shortEn: 'Nov', shortAr: 'نوفمبر', quarterId: 'Q4' },
      { monthNum: '12', monthIndex: 11, labelEn: 'December', labelAr: 'ديسمبر', shortEn: 'Dec', shortAr: 'ديسمبر', quarterId: 'Q4' },
    ]
  }
];

const ALL_MONTHS = CLOSING_QUARTERS.flatMap(q => q.months);

export default function ProjectsPage() {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  const { 
    projects, 
    companies, 
    contacts, 
    quotations,
    addProject, 
    addCompany,
    addContact, 
    updateProject, 
    deleteProject, 
    archiveProject,
    restoreProject,
    currentRole,
    currentUser,
    teamMembers,
    selectedSalesFilter,
    setSelectedSalesFilter,
    isSyncingExcel,
    lastExcelSyncTime,
    syncExcelNow
  } = useCRM();

  const { 
    isManager, 
    isSalesRep, 
    scopedProjects: scopedBaseProjects, 
    scopedArchivedProjects 
  } = useSalesScope();

  const router = useRouter();

  const [viewMode, setViewModeState] = useState<'kanban' | 'table' | 'archive'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('al_mespar_projects_view_mode');
      if (saved === 'table' || saved === 'kanban' || saved === 'archive') return saved;
    }
    return 'kanban';
  });

  const setViewMode = React.useCallback((mode: 'kanban' | 'table' | 'archive') => {
    setViewModeState(mode);
    try {
      sessionStorage.setItem('al_mespar_projects_view_mode', mode);
    } catch {}
  }, []);

  const [projectToArchive, setProjectToArchive] = useState<Project | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveSearchTerm, setArchiveSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedHealth, setSelectedHealth] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Deferred search values for responsive, non-blocking UI
  const deferredSearchTerm = React.useDeferredValue(searchTerm);
  const deferredArchiveSearchTerm = React.useDeferredValue(archiveSearchTerm);

  const [activeDrilldownLabel, setActiveDrilldownLabel] = useState<string | null>(null);
  const [activeFilterScope, setActiveFilterScope] = useState<'all' | 'active' | 'critical_aging'>('all');

  // Ensure sales reps are strictly scoped to their own account and cannot be set to 'all'
  React.useEffect(() => {
    if (isSalesRep && selectedSalesFilter !== currentUser.id) {
      setSelectedSalesFilter(currentUser.id);
    }
  }, [isSalesRep, currentUser.id, selectedSalesFilter, setSelectedSalesFilter]);

  // Auto-sync search term, filters, or redirect to specific project cockpit if ?id= is passed
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('id');
      if (targetId) {
        router.push(`/projects/${targetId}`);
        return;
      }
      const q = params.get('search');
      if (q) setSearchTerm(q);

      const h = params.get('health');
      if (h) {
        setSelectedHealth(h);
        setActiveDrilldownLabel(h === 'red' ? (isRTL ? 'الصفقات التي تحتاج متابعة عاجلة (Health: Red)' : 'Deals Needing Immediate Attention') : `Health: ${h}`);
      }

      const s = params.get('stage');
      if (s) {
        setSelectedStage(s);
        const stageObj = kanbanStages.find(ks => ks.stage === s);
        setActiveDrilldownLabel(isRTL ? `مرحلة: ${stageObj?.labelAr || s}` : `Stage: ${stageObj?.label || s}`);
      }

      const t = params.get('type');
      if (t) {
        setSelectedType(t);
        const typeObj = OPPORTUNITY_TYPES.find(ot => ot.value === t);
        const typeLabelAr = t === 'tender' ? 'مناقصة' : t === 'in_hand' ? 'مشروع جاري' : t === 'upgrade_retrofit' ? 'تطوير / ترقية' : (typeObj?.label || t);
        setActiveDrilldownLabel(isRTL ? `نوع الفرصة: ${typeLabelAr}` : `Opportunity Type: ${typeObj?.label || t}`);
      }

      const v = params.get('view') || params.get('tab');
      if (v === 'table' || v === 'kanban' || v === 'archive') setViewMode(v);

      const f = params.get('filter');
      if (f === 'active') {
        setActiveFilterScope('active');
        setActiveDrilldownLabel(isRTL ? 'كافة الصفقات النشطة في المسار' : 'All Active Pipeline Deals');
      } else if (f === 'aging' || f === 'critical' || f === 'stale') {
        setActiveFilterScope('critical_aging');
        setActiveDrilldownLabel(isRTL ? 'الصفقات المتعثرة في مرحلتها الحالية (Stage SLA Alert)' : 'Critical Stage Aging Deals');
      }
    }
  }, [isRTL]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForLostModal, setProjectForLostModal] = useState<Project | null>(null);
  const [projectForWonCelebration, setProjectForWonCelebration] = useState<Project | null>(null);

  // Drag & Drop State (Odoo style)
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Grouping Mode: 'stage' (by Pipeline Stage) or 'closing_date' (by 4 Quarters & 12 Months)
  const [groupByMode, setGroupByMode] = useState<'stage' | 'closing_date'>('stage');
  const [selectedClosingYear, setSelectedClosingYear] = useState<number>(2026);
  const [selectedQuarterFilter, setSelectedQuarterFilter] = useState<'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('all');
  const [showUnassignedClosing, setShowUnassignedClosing] = useState<boolean>(true);
  const [dragOverClosingKey, setDragOverClosingKey] = useState<string | null>(null);

  // Kanban Stage Columns (Exact 7-Stage Contracting Lifecycle)
  const kanbanStages: { stage: PipelineStage; label: string; labelAr: string; headerColor: string }[] = [
    { stage: 'lead', label: 'Lead', labelAr: 'عميل محتمل (Lead)', headerColor: 'border-slate-400 text-slate-700 bg-slate-100' },
    { stage: 'rfq_processing', label: 'RFQ Processing', labelAr: 'طلب تسعير (RFQ)', headerColor: 'border-sky-500 text-sky-700 bg-sky-50' },
    { stage: 'quotation_sent', label: 'Quotation Sent', labelAr: 'عرض سعر مرسل (Quotation)', headerColor: 'border-indigo-500 text-indigo-700 bg-indigo-50' },
    { stage: 'technical_submission', label: 'Technical Submittal', labelAr: 'اعتماد فني (Submittal)', headerColor: 'border-purple-500 text-purple-700 bg-purple-50' },
    { stage: 'negotiation', label: 'Negotiation', labelAr: 'تفاوض نهائي (Negotiation)', headerColor: 'border-amber-500 text-amber-700 bg-amber-50' },
    { stage: 'won', label: 'Won', labelAr: 'صفقة رابحة (Won)', headerColor: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
    { stage: 'lost', label: 'Lost', labelAr: 'صفقة خاسرة (Lost)', headerColor: 'border-rose-500 text-rose-700 bg-rose-50' },
  ];

  const handleStageDrop = async (projectId: string, targetStage: PipelineStage) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj || proj.pipeline_stage === targetStage) return;
    if (!canUserAccessProjectCockpit(proj, currentUser)) return;

    if (targetStage === 'lost') {
      setProjectForLostModal(proj);
      return;
    }

    const stageObj = kanbanStages.find(s => s.stage === targetStage);
    const targetLabel = isRTL ? (stageObj?.labelAr || targetStage) : (stageObj?.label || targetStage);
    await updateProject(projectId, { 
      pipeline_stage: targetStage,
      stage_entered_at: new Date().toISOString()
    });
    
    if (targetStage === 'won') {
      setProjectForWonCelebration({ ...proj, pipeline_stage: 'won', stage_entered_at: new Date().toISOString() });
    }

    setToastMessage(isRTL ? `تم نقل المشروع ${proj.pr_number} إلى مرحلة: ${targetLabel}` : `Project ${proj.pr_number} moved to ${targetLabel}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmLost = async (reason: string) => {
    if (!projectForLostModal) return;
    await updateProject(projectForLostModal.id, { 
      pipeline_stage: 'lost', 
      lost_reason: reason,
      stage_entered_at: new Date().toISOString()
    });
    const stageObj = kanbanStages.find(s => s.stage === 'lost');
    const targetLabel = isRTL ? (stageObj?.labelAr || 'صفقة خاسرة') : (stageObj?.label || 'Lost');
    setToastMessage(
      isRTL 
        ? `تم تحويل المشروع ${projectForLostModal.pr_number} إلى مرحلة "${targetLabel}" وتوثيق سبب الخسارة بنجاح`
        : `Project ${projectForLostModal.pr_number} moved to ${targetLabel} and loss reason recorded`
    );
    setTimeout(() => setToastMessage(null), 3500);
    setProjectForLostModal(null);
  };

  const handleClosingDateDrop = async (projectId: string, targetYearMonth: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    if (!canUserAccessProjectCockpit(proj, currentUser)) return;

    const [yearStr, monthStr] = targetYearMonth.split('-');
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);

    let day = 15;
    if (proj.closing_date) {
      const parts = proj.closing_date.split('-');
      if (parts.length >= 3) {
        const parsedDay = parseInt(parts[2], 10);
        if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
          day = parsedDay;
        }
      }
    }

    const maxDays = new Date(y, m, 0).getDate();
    if (day > maxDays) day = maxDays;

    const dayStr = String(day).padStart(2, '0');
    const newClosingDate = `${yearStr}-${monthStr}-${dayStr}`;

    if (proj.closing_date === newClosingDate) return;

    await updateProject(projectId, { closing_date: newClosingDate });

    const monthObj = ALL_MONTHS.find(mon => mon.monthNum === monthStr);
    const monthName = isRTL ? monthObj?.labelAr : monthObj?.labelEn;
    setToastMessage(
      isRTL 
        ? `تم ترحيل موعد إغلاق مشروع "${proj.name}" إلى ${monthName} ${yearStr} (${newClosingDate})`
        : `Rescheduled "${proj.name}" closing date to ${monthName} ${yearStr} (${newClosingDate})`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUnassignedDrop = async (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    if (!canUserAccessProjectCockpit(proj, currentUser)) return;

    if (proj.opportunity_type === 'in_hand') {
      setToastMessage(isRTL ? 'تنبيه: مشاريع In Hand تتطلب تاريخ إغلاق إلزامي ولا يمكن إزالته' : 'Notice: In Hand projects require a mandatory Closing Date');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    await updateProject(projectId, { closing_date: undefined });
    setToastMessage(isRTL ? `تمت إزالة تاريخ الإغلاق للمشروع "${proj.name}"` : `Cleared closing date for "${proj.name}"`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openCreateModal = () => {
    setIsAddModalOpen(true);
  };

  const openEditModal = React.useCallback((proj: Project) => {
    if (!canUserAccessProjectCockpit(proj, currentUser)) return;
    setEditingProject(proj);
    setIsEditModalOpen(true);
  }, [currentUser]);

  const handleDelete = React.useCallback((id: string, name: string) => {
    const proj = projects.find(p => p.id === id);
    if (proj && canUserAccessProjectCockpit(proj, currentUser)) {
      setProjectToArchive(proj);
      setIsArchiveModalOpen(true);
    }
  }, [projects, currentUser]);

  const handleConfirmArchive = async (reason: string) => {
    if (projectToArchive) {
      await archiveProject(projectToArchive.id, reason);
      setProjectToArchive(null);
      setIsArchiveModalOpen(false);
    }
  };

  const filteredArchivedProjects = useMemo(() => {
    if (!deferredArchiveSearchTerm.trim()) return scopedArchivedProjects;
    const term = deferredArchiveSearchTerm.toLowerCase();
    return scopedArchivedProjects.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.pr_number.toLowerCase().includes(term) ||
      (p.company_name && p.company_name.toLowerCase().includes(term)) ||
      (p.archived_by_name && p.archived_by_name.toLowerCase().includes(term)) ||
      (p.archive_reason && p.archive_reason.toLowerCase().includes(term))
    );
  }, [scopedArchivedProjects, deferredArchiveSearchTerm]);

  const archivedMetrics = useMemo(() => {
    const totalVal = scopedArchivedProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
    return {
      count: scopedArchivedProjects.length,
      totalValue: totalVal
    };
  }, [scopedArchivedProjects]);

  const pipelineForecast = useMemo(() => {
    return calculatePipelineForecast(scopedBaseProjects, quotations);
  }, [scopedBaseProjects, quotations]);

  // Pre-calculate latest active quotation per project in a single O(N) pass for O(1) instant lookup
  const latestQuoteMap = useMemo(() => {
    const map = new Map<string, Quotation>();
    if (!quotations) return map;
    for (const q of quotations) {
      if (q.is_archived) continue;
      const existing = map.get(q.project_id);
      if (!existing || q.version > existing.version) {
        map.set(q.project_id, q);
      }
    }
    return map;
  }, [quotations]);

  // Filter logic - Ordered from most recently entered this stage to oldest (Debounced deferred search)
  const filteredProjects = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase().trim();
    return scopedBaseProjects.filter(p => {
      const matchesSearch = !term ||
                            p.name.toLowerCase().includes(term) ||
                            p.pr_number.toLowerCase().includes(term) ||
                            (p.company_name && p.company_name.toLowerCase().includes(term)) ||
                            (p.primary_contact_name && p.primary_contact_name.toLowerCase().includes(term));
      const matchesStage = selectedStage === 'all' || p.pipeline_stage === selectedStage;
      const matchesType = selectedType === 'all' || p.opportunity_type === selectedType;
      const matchesHealth = selectedHealth === 'all' || p.calculated_health === selectedHealth;
      const matchesCity = selectedCity === 'all' || p.location === selectedCity;

      let matchesScope = true;
      if (activeFilterScope === 'active') {
        matchesScope = p.pipeline_stage !== 'won' && p.pipeline_stage !== 'lost';
      } else if (activeFilterScope === 'critical_aging') {
        const aging = getStageAgingInfo(p);
        matchesScope = aging.isCritical || aging.isStale;
      }

      return matchesSearch && matchesStage && matchesType && matchesHealth && matchesCity && matchesScope;
    }).sort((a, b) => {
      const timeA = new Date(a.stage_entered_at || a.updated_at || a.created_at).getTime();
      const timeB = new Date(b.stage_entered_at || b.updated_at || b.created_at).getTime();
      return timeB - timeA; // Descending: Most recently entered stage first
    });
  }, [scopedBaseProjects, deferredSearchTerm, selectedStage, selectedType, selectedHealth, selectedCity, activeFilterScope]);

  // Group Kanban projects and totals by stage in a single O(N) pass to prevent heavy loops in JSX
  const { stageProjectsMap, stageValuesMap } = useMemo(() => {
    const pMap: Record<string, Project[]> = {};
    const vMap: Record<string, number> = {};

    for (const col of kanbanStages) {
      pMap[col.stage] = [];
      vMap[col.stage] = 0;
    }

    for (const p of filteredProjects) {
      let targetStage = p.pipeline_stage;
      if (targetStage === 'pricing') targetStage = 'rfq_processing';
      if (targetStage === 'technically_approved') targetStage = 'negotiation';

      if (pMap[targetStage]) {
        pMap[targetStage].push(p);
        vMap[targetStage] += p.estimated_value || 0;
      }
    }

    // Sort each stage: most recently entered first
    for (const stageKey of Object.keys(pMap)) {
      pMap[stageKey].sort((a, b) => {
        const timeA = new Date(a.stage_entered_at || a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.stage_entered_at || b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      });
    }

    return { stageProjectsMap: pMap, stageValuesMap: vMap };
  }, [filteredProjects, kanbanStages]);

  // Pre-calculate aging and cockpit access maps for instant O(1) table row rendering
  const stageAgingMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getStageAgingInfo>>();
    for (const p of filteredProjects) {
      map.set(p.id, getStageAgingInfo(p));
    }
    return map;
  }, [filteredProjects]);

  const accessMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const p of filteredProjects) {
      map.set(p.id, canUserAccessProjectCockpit(p, currentUser));
    }
    return map;
  }, [filteredProjects, currentUser]);

  // Current calendar month string (e.g. "2026-10" or "2026-11")
  const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Closing Date metrics & grouping
  const closingDateStats = useMemo(() => {
    const yStr = String(selectedClosingYear);
    const unassigned: Project[] = [];
    const byMonth: Record<string, Project[]> = {};
    ALL_MONTHS.forEach(m => {
      byMonth[`${yStr}-${m.monthNum}`] = [];
    });

    filteredProjects.forEach(p => {
      if (p.closing_date && p.closing_date.startsWith(`${yStr}-`)) {
        const monthKey = p.closing_date.substring(0, 7); // e.g. "2026-11"
        if (byMonth[monthKey]) {
          byMonth[monthKey].push(p);
          return;
        }
      }
      unassigned.push(p);
    });

    // Calculate quarterly totals
    const quarterTotals: Record<string, { count: number; totalValue: number }> = {};
    CLOSING_QUARTERS.forEach(q => {
      let qCount = 0;
      let qVal = 0;
      q.months.forEach(m => {
        const mKey = `${yStr}-${m.monthNum}`;
        const projs = byMonth[mKey] || [];
        qCount += projs.length;
        qVal += projs.reduce((sum, item) => sum + (item.estimated_value || 0), 0);
      });
      quarterTotals[q.id] = { count: qCount, totalValue: qVal };
    });

    const totalAssignedValue = Object.values(quarterTotals).reduce((sum, q) => sum + q.totalValue, 0);
    const totalAssignedCount = Object.values(quarterTotals).reduce((sum, q) => sum + q.count, 0);

    return {
      byMonth,
      unassigned,
      quarterTotals,
      totalAssignedValue,
      totalAssignedCount
    };
  }, [filteredProjects, selectedClosingYear]);

  const displayedQuarters = useMemo(() => {
    if (selectedQuarterFilter === 'all') return CLOSING_QUARTERS;
    return CLOSING_QUARTERS.filter(q => q.id === selectedQuarterFilter);
  }, [selectedQuarterFilter]);

interface ProjectTableRowProps {
  project: Project;
  isAccessible: boolean;
  stageConfig?: (typeof PIPELINE_STAGES)[0];
  stageLabel: string;
  latestQuote?: Quotation;
  aging: ReturnType<typeof getStageAgingInfo>;
  isRTL: boolean;
  currentRole: string;
  openEditModal: (p: Project) => void;
  handleDelete: (id: string, name: string) => void;
}

const ProjectTableRow = React.memo(function ProjectTableRow({
  project: p,
  isAccessible,
  stageConfig,
  stageLabel,
  latestQuote,
  aging,
  isRTL,
  currentRole,
  openEditModal,
  handleDelete
}: ProjectTableRowProps) {
  return (
    <tr 
      key={p.id} 
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 68px' }}
      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
    >
      <td className="py-4 px-4 whitespace-nowrap">
        <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-[#232A38] text-slate-800 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
          {p.pr_number}
        </span>
      </td>
      <td className="py-4 px-4 min-w-[220px]">
        {isAccessible ? (
          <Link 
            href={`/projects/${p.id}`}
            className="font-semibold text-slate-900 dark:text-white leading-tight hover:text-[#8FC2F0] hover:underline transition-colors block"
          >
            {p.name}
          </Link>
        ) : (
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 leading-tight">
            <span>{p.name}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>{isRTL ? 'للاطلاع فقط' : 'View only'}</span>
            </span>
          </div>
        )}
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
          <span className="text-blue-600 dark:text-[#8FC2F0] font-medium flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {p.company_name}
          </span>
          {p.primary_contact_name && (
            <span className="text-slate-400 dark:text-slate-500">&bull; {p.primary_contact_name}</span>
          )}
          <span className="text-slate-400 dark:text-slate-500">&bull; {p.location}</span>
        </div>
      </td>
      <td className="py-4 px-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 shadow-2xs w-fit ${
            p.opportunity_type === 'in_hand'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              p.opportunity_type === 'in_hand' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'
            }`} />
            <span>
              {p.opportunity_type === 'in_hand'
                ? (isRTL ? 'In Hand (في اليد)' : 'In Hand')
                : (isRTL ? 'Tender (مناقصة)' : 'Tender')}
            </span>
          </span>
          {p.opportunity_type === 'in_hand' && p.closing_date && (
            <span 
              className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono font-bold flex items-center gap-1"
              title={isRTL ? `تاريخ الإغلاق المتوقع: ${formatDateString(p.closing_date)}` : `Expected Closing Date: ${formatDateString(p.closing_date)}`}
            >
              <Calendar className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isRTL ? 'إغلاق:' : 'Close:'} {formatDateString(p.closing_date)}</span>
            </span>
          )}
        </div>
      </td>
      <td className="py-4 px-4 whitespace-nowrap">
        {isAccessible ? (
          <div className="space-y-1">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border inline-block ${stageConfig?.badgeClass || 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'}`}>
              {stageLabel}
            </span>
            {p.pipeline_stage === 'won' && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {p.po_attachment_url || p.po_number ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1">
                    <FileCheck className="w-2.5 h-2.5" />
                    <span>{p.po_number || 'PO'}</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-bold">
                    {isRTL ? 'بلا PO' : 'No PO'}
                  </span>
                )}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black">
                  {p.collected_percentage || 0}% {isRTL ? 'محصل' : 'Coll.'}
                </span>
              </div>
            )}
            {p.pipeline_stage !== 'won' && p.pipeline_stage !== 'lost' && (
              <div className="flex items-center gap-1">
                <span 
                  className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 font-urbanist ${aging.badgeClass}`}
                  title={isRTL ? `المشروع في هذه المرحلة منذ ${aging.daysInStage} يوماً (الحد المعياري: ${aging.slaDays} يوم)` : `Project in stage for ${aging.daysInStage} days (Target SLA: ${aging.slaDays}d)`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span>{isRTL ? aging.labelAr : aging.labelEn}</span>
                </span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-500" />
            <span>{isRTL ? 'المرحلة محجوبة للمالك' : 'Stage locked'}</span>
          </span>
        )}
      </td>
      <td className="py-4 px-4 whitespace-nowrap">
        {isAccessible ? (
          <>
            {p.calculated_health === 'red' && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                  {p.days_overdue ? `${p.days_overdue}d late` : 'Needs Action'}
                </span>
              </div>
            )}
            {p.calculated_health === 'yellow' && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Approaching</span>
              </div>
            )}
            {p.calculated_health === 'green' && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Healthy</span>
              </div>
            )}
            {p.calculated_health === 'neutral' && (
              <span className="text-xs text-slate-400">Closed</span>
            )}
          </>
        ) : (
          <span className="text-xs text-slate-400 italic">—</span>
        )}
      </td>
      <td className="py-4 px-4 text-right whitespace-nowrap font-urbanist">
        {isAccessible ? (
          <>
            <div className="font-extrabold text-slate-900 dark:text-white">
              {formatCurrencySAR(p.estimated_value)}
            </div>
            {latestQuote && (
              <div className="text-[11px] font-bold text-blue-600 dark:text-[#8FC2F0] mt-0.5">
                {isRTL ? 'عرض:' : 'Quote:'} {formatCompactSAR(latestQuote.amount)} (V{latestQuote.version})
              </div>
            )}
            <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-0.5 flex items-center justify-end gap-1">
              <span>{isRTL ? 'الموزون:' : 'Weighted:'}</span>
              <span>{formatCompactSAR((latestQuote?.amount || p.estimated_value) * (STAGE_PROBABILITIES[p.pipeline_stage] ?? 0.1))}</span>
              <span className="text-[10px] opacity-75">({Math.round((STAGE_PROBABILITIES[p.pipeline_stage] ?? 0.1) * 100)}%)</span>
            </div>
          </>
        ) : (
          <div className="font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1">
            <Lock className="w-3 h-3 text-amber-500" />
            <span>{isRTL ? 'القيمة محجوبة للمالك' : 'Value locked'}</span>
          </div>
        )}
      </td>
      <td className="py-4 px-4 min-w-[200px]">
        {isAccessible ? (
          p.next_action ? (
            <div>
              <div className="text-xs text-slate-800 dark:text-slate-200 font-medium line-clamp-1">
                {p.next_action}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Due: {formatDateString(p.next_follow_up_at)}</span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium italic">
              No next action set!
            </span>
          )
        ) : (
          <span className="text-xs text-slate-400 italic">—</span>
        )}
      </td>
      <td className="py-4 px-4 whitespace-nowrap">
        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
          {p.owner_name || 'Eslam M.'}
        </div>
        {p.members && p.members.length > 0 && (
          <div className="text-[11px] text-blue-600 dark:text-[#8FC2F0] flex items-center gap-1 mt-0.5">
            <Users2 className="w-3 h-3" />
            <span>+ {p.members[0].user_name}</span>
          </div>
        )}
      </td>
      <td className="py-4 px-4 text-right whitespace-nowrap">
        {currentRole !== 'viewer' && (
          isAccessible ? (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => openEditModal(p)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit Project"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              {currentRole !== 'estimator' && (
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Delete Project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>{isRTL ? `مسند إلى: ${p.referred_to_name || p.owner_name || 'سيلز آخر'}` : 'Locked'}</span>
            </div>
          )
        )}
      </td>
    </tr>
  );
});

  const renderProjectTableRow = (p: Project) => {
    const isAccessible = accessMap.get(p.id) ?? false;
    const stageConfig = PIPELINE_STAGES.find(s => s.value === p.pipeline_stage);
    const stageObj = kanbanStages.find(ks => ks.stage === p.pipeline_stage);
    const stageLabel = isRTL ? (stageObj?.labelAr || stageConfig?.labelAr || p.pipeline_stage) : (stageConfig?.label || p.pipeline_stage);
    const latestQuote = latestQuoteMap.get(p.id);
    const aging = stageAgingMap.get(p.id) || getStageAgingInfo(p);

    return (
      <ProjectTableRow
        key={p.id}
        project={p}
        isAccessible={isAccessible}
        stageConfig={stageConfig}
        stageLabel={stageLabel}
        latestQuote={latestQuote}
        aging={aging}
        isRTL={isRTL}
        currentRole={currentRole}
        openEditModal={openEditModal}
        handleDelete={handleDelete}
      />
    );
  };

  return (
    <div className="space-y-2.5 sm:space-y-3 w-full mx-auto">
      {/* Header with View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[#292D32] dark:text-white tracking-tight flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#8FC2F0]/15 dark:bg-[#8FC2F0]/25 flex items-center justify-center text-[#292D32] dark:text-[#8FC2F0] shrink-0">
              <Briefcase className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#292D32] dark:text-[#8FC2F0]" />
            </div>
            <span>{isRTL ? 'مسار المشاريع والصفقات' : 'Project Pipeline & Deals'}</span>
            <ContextualHelp 
              title={isRTL ? 'دليل مسار المشاريع والصفقات' : 'Projects Pipeline Guide'} 
              description={isRTL ? 'الشاشة الرئيسية لإدارة دورة حياة مشاريع المقاولات في المنطقة الغربية من مرحلة الفرصة (Lead) حتى الفوز بالتعميد (Won).' : 'Main cockpit for managing commercial HVAC & contracting project lifecycles from Lead through Won.'}
              tip={isRTL ? 'يمكنك سحب وإفلات أي مشروع لتحديث مرحلته، أو الضغط عليه لفتح قمرة المشروع وعروض الأسعار.' : 'Drag-and-drop cards to advance pipeline stages, or click any project to access its commercial cockpit.'}
              moduleId="projects"
              size="sm"
            />
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {isRTL 
              ? `مسار المبيعات التفاعلي لشركة المسبار (${filteredProjects.length} مشروع مشمول في النطاق)` 
              : `Visual sales pipeline for Al Mespar (${filteredProjects.length} projects in scope)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start sm:self-auto">
          {/* View Toggle */}
          <div className="rounded-full bg-white/90 dark:bg-slate-800/90 p-1 flex items-center border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban' 
                  ? 'bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#292D32] dark:hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>{isRTL ? 'كانبان' : 'Kanban'}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#292D32] dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{isRTL ? 'جدول' : 'Table'}</span>
            </button>
            <button
              onClick={() => setViewMode('archive')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'archive' 
                  ? 'bg-rose-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#292D32] dark:hover:text-white'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{isRTL ? 'الأرشيف' : 'Archive'}</span>
              {scopedArchivedProjects.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  viewMode === 'archive'
                    ? 'bg-white text-rose-600'
                    : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                }`}>
                  {scopedArchivedProjects.length}
                </span>
              )}
            </button>
          </div>

          {/* Group By Switcher: Pipeline Stages vs Closing Date (Quarters) */}
          {viewMode !== 'archive' && (
            <div className="rounded-full bg-slate-100/90 dark:bg-slate-800/90 p-1 flex items-center border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <button
                type="button"
                onClick={() => setGroupByMode('stage')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  groupByMode === 'stage' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                title={isRTL ? 'تجميع حسب مراحل خطة الصفقات (Stage Pipeline)' : 'Group by pipeline stages'}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isRTL ? 'المراحل' : 'Stage'}</span>
              </button>
              <button
                type="button"
                onClick={() => setGroupByMode('closing_date')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  groupByMode === 'closing_date' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
                title={isRTL ? 'تجميع حسب موعد الإغلاق (4 أرباع و 12 شهراً)' : 'Group by Closing Date (Quarters & Months)'}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isRTL ? 'موعد الإغلاق (Quarters)' : 'Closing Date'}</span>
              </button>
            </div>
          )}

          {/* Real-time Excel Autosave / Sync Indicator */}
          <button
            onClick={async () => {
              const res = await syncExcelNow();
              setToastMessage(res.message);
              setTimeout(() => setToastMessage(null), 3500);
            }}
            disabled={isSyncingExcel}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              isSyncingExcel
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 animate-pulse'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-xs'
            }`}
            title={isRTL ? 'حفظ تلقائي لكافة التعديلات في ملف الإكسيل مباشرة (يمكنك أيضاً الضغط للمزامنة الفورية)' : 'Excel autosave active. Click to trigger instant sync.'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingExcel ? 'animate-spin text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`} />
            <span className="hidden sm:inline">
              {isSyncingExcel
                ? (isRTL ? 'جاري الحفظ التلقائي للإكسيل...' : 'Autosaving to Excel...')
                : (isRTL ? '✓ محفوظ تلقائياً للإكسيل' : '✓ Excel Autosaved')}
            </span>
            {lastExcelSyncTime && !isSyncingExcel && (
              <span className="text-[10px] opacity-80 hidden md:inline ltr:ml-1 rtl:mr-1">
                ({lastExcelSyncTime})
              </span>
            )}
          </button>

          {currentRole !== 'viewer' && currentRole !== 'estimator' && (
            <button
              onClick={openCreateModal}
              className="crm-pill-dark flex items-center gap-2 px-5 py-2 text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#8FC2F0]" />
              <span>{isRTL ? '+ إضافة مشروع' : 'Add Project'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Drilldown Banner */}
      {activeDrilldownLabel && (
        <div className="crm-card px-3 py-1.5 bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 flex items-center justify-between flex-wrap gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span className="font-bold text-blue-950 dark:text-blue-200 text-xs">
              {isRTL ? 'تصفية نشطة من لوحة التحكم:' : 'Active Dashboard Drilldown:'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/70 text-blue-900 dark:text-blue-200 font-extrabold text-[11px] shadow-2xs">
              {activeDrilldownLabel}
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedHealth('all');
              setSelectedStage('all');
              setSelectedType('all');
              setSelectedCity('all');
              setSearchTerm('');
              setActiveFilterScope('all');
              setActiveDrilldownLabel(null);
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', '/projects');
              }
            }}
            className="px-2.5 py-1 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-700 font-bold transition-all text-xs cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>{isRTL ? 'إلغاء التصفية وعرض الكل' : 'Clear Filter & Show All'}</span>
          </button>
        </div>
      )}

      {/* Executive Commercial Pipeline & Weighted Forecast KPI Strip */}
      <div className="crm-card px-2.5 py-1.5 rounded-xl shadow-2xs grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800 rtl:divide-x-reverse items-center">
        {/* Gross Pipeline */}
        <div 
          onClick={() => {
            setActiveFilterScope('active');
            setActiveDrilldownLabel(isRTL ? 'كافة الصفقات النشطة' : 'All Active Deals');
          }}
          className="px-2.5 py-1 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer group"
          title={isRTL ? "اضغط لعرض كافة الصفقات النشطة" : "Click to view active pipeline"}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
              {isRTL ? 'إجمالي الصفقات:' : 'Gross:'}
            </span>
            <span className="text-xs sm:text-sm font-black font-mono text-[#292D32] dark:text-white">
              {formatCompactSAR(pipelineForecast.totalGrossPipeline)}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0 ltr:ml-1 rtl:mr-1">
            {pipelineForecast.activeDealsCount} {isRTL ? 'صفقة' : 'deals'}
          </span>
        </div>

        {/* Weighted Forecast */}
        <div 
          className="px-2.5 py-1 flex items-center justify-between hover:bg-purple-50/50 dark:hover:bg-purple-950/20 rounded-lg transition-colors"
          title={isRTL ? "القيمة المتوقعة مرجحة بنسب احتمالية كل مرحلة" : "Weighted expected revenue"}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-2.5 h-2.5 text-purple-600 shrink-0" />
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 truncate">
              {isRTL ? 'الموزون:' : 'Weighted:'}
            </span>
            <span className="text-xs sm:text-sm font-black font-mono text-purple-900 dark:text-purple-100">
              {formatCompactSAR(pipelineForecast.totalWeightedPipeline)}
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-[10px] font-black font-mono shrink-0 ltr:ml-1 rtl:mr-1">
            ~{pipelineForecast.weightedProbabilityAvg}%
          </span>
        </div>

        {/* Closed Won */}
        <div 
          onClick={() => {
            setSelectedStage('won');
            setActiveDrilldownLabel(isRTL ? 'الصفقات الرابحة (Won)' : 'Won Deals');
          }}
          className="px-2.5 py-1 flex items-center justify-between hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors cursor-pointer group"
          title={isRTL ? "اضغط لعرض الصفقات الرابحة" : "Click to view won deals"}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 truncate">
              {isRTL ? 'الرابحة:' : 'Won:'}
            </span>
            <span className="text-xs sm:text-sm font-black font-mono text-emerald-900 dark:text-emerald-300">
              {formatCompactSAR(pipelineForecast.wonTotalValue)}
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono shrink-0 ltr:ml-1 rtl:mr-1">
            ✓ {isRTL ? 'معتمد' : 'Signed'}
          </span>
        </div>

        {/* Stage Aging Health */}
        <div 
          onClick={() => {
            setActiveFilterScope('critical_aging');
            setActiveDrilldownLabel(isRTL ? 'تنبيهات عمر المراحل المتأخرة' : 'Stage Aging Alerts');
          }}
          className={`px-2.5 py-1 flex items-center justify-between rounded-lg transition-colors cursor-pointer ${
            pipelineForecast.criticalAgingCount > 0 
              ? 'bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400' 
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
          title={isRTL ? "اضغط لعرض الصفقات التي تجاوزت الحد الزمني للمرحلة" : "Click to filter stale & overdue stage aging deals"}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className={`w-2.5 h-2.5 ${pipelineForecast.criticalAgingCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'} shrink-0`} />
            <span className={`text-[11px] font-bold truncate ${pipelineForecast.criticalAgingCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500'}`}>
              {isRTL ? 'سلامة المراحل:' : 'Stage Aging:'}
            </span>
            <span className="text-xs sm:text-sm font-black font-mono">
              {pipelineForecast.criticalAgingCount > 0 ? (
                <span className="text-rose-600 dark:text-rose-400">
                  {pipelineForecast.criticalAgingCount} {isRTL ? 'حرجة' : 'Critical'}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {isRTL ? 'منتظمة' : 'Healthy'}
                </span>
              )}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0 ltr:ml-1 rtl:mr-1">
            {pipelineForecast.staleAgingCount} {isRTL ? 'تنبيه' : 'stale'}
          </span>
        </div>
      </div>

      {/* Compact Apple-style Filter Toolbar */}
      <div className="crm-card p-1.5 sm:p-2 rounded-2xl shadow-2xs space-y-1.5">
        {/* Manager Scope Pill Bar */}
        {isManager && (
          <div className="flex items-center justify-between px-2.5 py-1 bg-purple-50/60 dark:bg-purple-950/25 border border-purple-100 dark:border-purple-900/30 rounded-xl flex-wrap gap-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200">
                {t('salesRepScope')}:
              </span>
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium hidden sm:inline">
                {selectedSalesFilter === 'all' 
                  ? (isRTL ? `كافة المشاريع (${projects.length})` : `All (${projects.length})`)
                  : (teamMembers.find(m => m.id === selectedSalesFilter)?.full_name || '')}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setSelectedSalesFilter('all')}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedSalesFilter === 'all'
                    ? 'bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {t('allTeam')} ({projects.length})
              </button>

              {teamMembers.filter(m => m.role === 'sales_engineer').map(rep => {
                const repCount = projects.filter(p => p.owner_id === rep.id).length;
                return (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedSalesFilter(rep.id)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedSalesFilter === rep.id
                        ? 'bg-[#8FC2F0] text-[#292D32] shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{rep.full_name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({repCount})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sales Rep Private Scope Indicator (Non-managers are strictly limited to their own projects) */}
        {isSalesRep && (
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 rounded-xl flex-wrap gap-1.5 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="text-[11px] font-bold text-sky-900 dark:text-sky-200">
                {isRTL ? 'نطاق المشاريع:' : 'Scope:'}
              </span>
              <span className="text-[11px] font-bold text-[#292D32] dark:text-sky-300 flex items-center gap-1.5 bg-white dark:bg-slate-900/80 px-2.5 py-0.5 rounded-lg border border-sky-200/60 dark:border-sky-800/60 shadow-2xs">
                <span>👤 {isRTL ? 'مشاريعي المخصصة' : 'My Assigned Projects'}</span>
                <span className="text-[10px] font-mono text-sky-700 dark:text-sky-300 font-black">({scopedBaseProjects.length})</span>
              </span>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>{isRTL ? 'بيانات خاصة ومحمية بالصلاحيات' : 'Private & Protected Scope'}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-1.5">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={isRTL ? 'البحث برقم PR، اسم المشروع، المقاول، جهة الاتصال...' : 'Search by #PR, project name, contractor, contact...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full ltr:pl-8.5 rtl:pr-8.5 px-3 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-[#8FC2F0] text-slate-900 dark:text-slate-100 font-medium shadow-2xs placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            {/* Health Filter */}
            <select
              value={selectedHealth}
              onChange={e => setSelectedHealth(e.target.value)}
              className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-[#8FC2F0] text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
            >
              <option value="all">{isRTL ? 'الحالة: الكل' : 'Health: All'}</option>
              <option value="red">{isRTL ? '🔴 يحتاج متابعة' : '🔴 Attention'}</option>
              <option value="yellow">{isRTL ? '🟡 يقترب' : '🟡 Warning'}</option>
              <option value="green">{isRTL ? '🟢 منتظم' : '🟢 Healthy'}</option>
            </select>

            {/* Stage Filter */}
            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-[#8FC2F0] text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
            >
              <option value="all">{isRTL ? 'كافة المراحل' : 'All Stages'}</option>
              {PIPELINE_STAGES.map(s => (
                <option key={s.value} value={s.value}>
                  {isRTL ? (kanbanStages.find(ks => ks.stage === s.value)?.labelAr || s.label) : s.label}
                </option>
              ))}
            </select>

            {/* Opportunity Type */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-[#8FC2F0] text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
            >
              <option value="all">{isRTL ? 'كافة الأنواع' : 'All Types'}</option>
              {OPPORTUNITY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {/* City */}
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-[#8FC2F0] text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
            >
              <option value="all">{isRTL ? 'كافة المدن' : 'All Cities'}</option>
              {SAUDI_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Closing Date Navigation Toolbar (Shown when Group By Closing Date is selected) */}
      {viewMode !== 'archive' && groupByMode === 'closing_date' && (
        <div className="crm-card p-3 rounded-2xl shadow-xs space-y-3 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 dark:from-slate-900/60 dark:via-slate-800/40 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800 animate-in fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Year Selector + Quarter Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Year Switcher */}
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full px-2 py-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedClosingYear(prev => prev - 1)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title={isRTL ? 'السنة السابقة' : 'Previous Year'}
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
                <div className="px-2.5 font-mono font-black text-xs sm:text-sm text-[#292D32] dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{selectedClosingYear}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClosingYear(prev => prev + 1)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title={isRTL ? 'السنة التالية' : 'Next Year'}
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

              {/* Quarter Filter Tabs */}
              <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-2xs flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedQuarterFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedQuarterFilter === 'all'
                      ? 'bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#292D32] dark:hover:text-white'
                  }`}
                >
                  <span>{isRTL ? 'كافة الأرباع (12 شهراً)' : 'All Quarters (12 Months)'}</span>
                </button>

                {CLOSING_QUARTERS.map(q => {
                  const qStat = closingDateStats.quarterTotals[q.id] || { count: 0, totalValue: 0 };
                  const isSelected = selectedQuarterFilter === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setSelectedQuarterFilter(q.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                      }`}
                    >
                      <span>{q.id}</span>
                      <span className="hidden sm:inline text-[11px] opacity-80">
                        ({isRTL ? q.subtitleAr : q.subtitleEn})
                      </span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {qStat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unassigned Toggle + Summary KPI */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Unassigned Column Toggle Button */}
              <button
                type="button"
                onClick={() => setShowUnassignedClosing(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  showUnassignedClosing
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
                title={isRTL ? 'إظهار أو إخفاء عمود المشاريع التي لم يُحدد لها موعد إغلاق بعد' : 'Toggle column for projects without closing date'}
              >
                {showUnassignedClosing ? <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                <span>
                  {showUnassignedClosing 
                    ? (isRTL ? 'إخفاء غير المجدول' : 'Hide Unassigned') 
                    : (isRTL ? 'عرض غير المجدول' : 'Show Unassigned')}
                </span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  showUnassignedClosing
                    ? 'bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {closingDateStats.unassigned.length}
                </span>
              </button>

              {/* Total Assigned Projects & Value in Selected Year */}
              <div className="flex items-center gap-2 bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{isRTL ? 'مجدول لسنة' : 'Scheduled'} {selectedClosingYear}:</span>
                <span className="font-mono font-black text-emerald-950 dark:text-white">{formatCompactSAR(closingDateStats.totalAssignedValue)}</span>
                <span className="text-[10px] opacity-75 font-mono font-bold">({closingDateStats.totalAssignedCount} {isRTL ? 'مشروع' : 'projects'})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="space-y-2">
          {/* Odoo Style Drag & Drop Helper Badge - Floating only when dragging */}
          {currentRole !== 'viewer' && draggedProjectId && (
            <div className="flex items-center justify-end text-xs text-slate-500 dark:text-slate-400 px-1">
              <span className="text-[#292D32] dark:text-[#8FC2F0] font-black animate-pulse text-[11px] bg-[#8FC2F0]/20 px-3 py-1 rounded-full border border-[#8FC2F0]/30 shadow-2xs">
                {groupByMode === 'stage'
                  ? (isRTL ? 'حرر البطاقة فوق أي مرحلة لنقلها' : 'Release card on any column to move')
                  : (isRTL ? 'اسحب المشروع وأفلته في أي شهر لتحديث موعد الإغلاق فوراً' : 'Drag project and drop into any month to reschedule closing date')}
              </span>
            </div>
          )}

          {/* Sub-View A: Group by Pipeline Stages */}
          {groupByMode === 'stage' && (
            <div className="overflow-x-auto pb-6">
              <div className="flex gap-5 min-w-[1700px]">
                {kanbanStages.map(col => {
                  const stageProjects = stageProjectsMap[col.stage] || [];
                  const stageValue = stageValuesMap[col.stage] || 0;
                  const isColumnTargeted = dragOverStage === col.stage;

                  return (
                    <div 
                      key={col.stage}
                      onDragOver={(e) => {
                        if (currentRole === 'viewer') return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverStage !== col.stage) {
                          setDragOverStage(col.stage);
                        }
                      }}
                      onDragLeave={(e) => {
                        if (currentRole === 'viewer') return;
                        e.preventDefault();
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        if (dragOverStage === col.stage) {
                          setDragOverStage(null);
                        }
                      }}
                      onDrop={async (e) => {
                        if (currentRole === 'viewer') return;
                        e.preventDefault();
                        const projId = e.dataTransfer.getData('text/plain') || draggedProjectId;
                        if (projId) {
                          await handleStageDrop(projId, col.stage);
                        }
                        setDragOverStage(null);
                        setDraggedProjectId(null);
                      }}
                      className={`flex-1 min-w-[280px] sm:min-w-[320px] md:min-w-[360px] max-w-[360px] p-3 sm:p-4 flex flex-col max-h-[84vh] transition-all duration-150 ${
                        isColumnTargeted
                          ? 'bg-[#8FC2F0]/20 border-[#8FC2F0] border-2 border-dashed ring-4 ring-[#8FC2F0]/20 shadow-md scale-[1.01] rounded-[28px]'
                          : 'crm-kanban-column'
                      }`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800 mb-2 px-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-black text-[#292D32] dark:text-white text-xs sm:text-sm truncate">
                            {isRTL ? col.labelAr : col.label}
                          </span>
                          <span className="text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                            {stageProjects.length}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[10.5px] font-black font-mono text-[#0088FF] dark:text-[#8FC2F0] shrink-0 bg-blue-50/80 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                          {formatCompactSAR(stageValue)}
                        </span>
                      </div>

                      {/* Drop Target Indicator when dragging over this column */}
                      {isColumnTargeted && (
                        <div className="p-3 mb-2 rounded-2xl border-2 border-dashed border-[#8FC2F0] bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse shadow-xs shrink-0">
                          <ArrowDown className="w-4 h-4 text-[#8FC2F0] animate-bounce" />
                          <span>Drop here to move to {col.label}</span>
                        </div>
                      )}

                      {/* Cards List */}
                      <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                        {stageProjects.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            {col.stage === 'lost' ? 'No lost projects yet. Great job! 🥳' : 'No projects in this stage'}
                          </div>
                        ) : (
                          stageProjects.map(proj => {
                            const isAccessible = canUserAccessProjectCockpit(proj, currentUser);
                            return (
                              <ProjectCard 
                                key={proj.id} 
                                project={proj}
                                latestQuote={latestQuoteMap.get(proj.id)}
                                isReadOnlyForSalesRep={!isAccessible}
                                isDraggable={currentRole !== 'viewer' && isAccessible}
                                isDragging={draggedProjectId === proj.id}
                                onDragStart={(e) => {
                                  if (currentRole === 'viewer' || !isAccessible) return;
                                  e.dataTransfer.setData('text/plain', proj.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                  setDraggedProjectId(proj.id);
                                }}
                                onDragEnd={() => {
                                  setDraggedProjectId(null);
                                  setDragOverStage(null);
                                }}
                              />
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-View B: Group by Closing Date (4 Quarters, 12 Months + Unassigned) */}
          {groupByMode === 'closing_date' && (
            <div className="overflow-x-auto pb-6">
              <div className="flex gap-6 items-start">
                {displayedQuarters.map(quarter => {
                  const qStat = closingDateStats.quarterTotals[quarter.id] || { count: 0, totalValue: 0 };

                  return (
                    <div 
                      key={quarter.id}
                      className="flex flex-col gap-2.5 bg-slate-100/60 dark:bg-slate-900/40 p-3 sm:p-3.5 rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-2xs shrink-0"
                    >
                      {/* Quarter Header Banner */}
                      <div className="flex items-center justify-between px-3.5 py-2 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                          <span className="font-black text-sm text-[#292D32] dark:text-white">
                            {quarter.id} {selectedClosingYear} — {isRTL ? quarter.titleAr : quarter.titleEn}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                            ({isRTL ? quarter.subtitleAr : quarter.subtitleEn})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full shadow-2xs">
                            {qStat.count} {isRTL ? 'مشروع' : 'deals'}
                          </span>
                          <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            {formatCompactSAR(qStat.totalValue)}
                          </span>
                        </div>
                      </div>

                      {/* 3 Months Columns in this Quarter */}
                      <div className="flex gap-4">
                        {quarter.months.map(mon => {
                          const monthKey = `${selectedClosingYear}-${mon.monthNum}`;
                          const monthProjs = closingDateStats.byMonth[monthKey] || [];
                          const monthVal = monthProjs.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
                          const isCurrent = currentYearMonth === monthKey;
                          const isTargeted = dragOverClosingKey === monthKey;

                          return (
                            <div
                              key={monthKey}
                              onDragOver={(e) => {
                                if (currentRole === 'viewer') return;
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                if (dragOverClosingKey !== monthKey) {
                                  setDragOverClosingKey(monthKey);
                                }
                              }}
                              onDragLeave={(e) => {
                                if (currentRole === 'viewer') return;
                                e.preventDefault();
                                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                                if (dragOverClosingKey === monthKey) {
                                  setDragOverClosingKey(null);
                                }
                              }}
                              onDrop={async (e) => {
                                if (currentRole === 'viewer') return;
                                e.preventDefault();
                                const projId = e.dataTransfer.getData('text/plain') || draggedProjectId;
                                if (projId) {
                                  await handleClosingDateDrop(projId, monthKey);
                                }
                                setDragOverClosingKey(null);
                                setDraggedProjectId(null);
                              }}
                              className={`w-[300px] sm:w-[320px] md:w-[340px] p-3 flex flex-col max-h-[82vh] transition-all duration-150 ${
                                isTargeted
                                  ? 'bg-emerald-500/20 border-emerald-500 border-2 border-dashed ring-4 ring-emerald-500/20 shadow-md scale-[1.01] rounded-[26px]'
                                  : isCurrent
                                    ? 'crm-kanban-column border-blue-400/70 dark:border-blue-600/60 ring-2 ring-blue-400/20 shadow-xs'
                                    : 'crm-kanban-column'
                              }`}
                            >
                              {/* Month Header */}
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800 mb-2 px-0.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Calendar className={`w-3.5 h-3.5 ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} shrink-0`} />
                                  <span className="font-black text-[#292D32] dark:text-white text-xs sm:text-sm truncate">
                                    {isRTL ? mon.labelAr : mon.labelEn}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 shrink-0">
                                      {isRTL ? 'الحالي' : 'Now'}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded-full shadow-2xs shrink-0">
                                    {monthProjs.length}
                                  </span>
                                </div>
                                <span className="text-[10px] sm:text-[10.5px] font-black font-mono text-emerald-700 dark:text-emerald-400 shrink-0 bg-emerald-50/80 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/40">
                                  {formatCompactSAR(monthVal)}
                                </span>
                              </div>

                              {/* Drop Target Indicator */}
                              {isTargeted && (
                                <div className="p-2.5 mb-2 rounded-2xl border-2 border-dashed border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse shadow-xs shrink-0">
                                  <ArrowDown className="w-4 h-4 text-emerald-600 animate-bounce" />
                                  <span>{isRTL ? `إفلات لنقل تاريخ الإغلاق إلى ${mon.labelAr}` : `Drop to set closing to ${mon.labelEn}`}</span>
                                </div>
                              )}

                              {/* Cards List */}
                              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                                {monthProjs.length === 0 ? (
                                  <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic bg-white/40 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                    {isRTL ? `لا توجد مشاريع مجدولة لشهر ${mon.labelAr}` : `No projects scheduled for ${mon.labelEn}`}
                                  </div>
                                ) : (
                                  monthProjs.map(proj => {
                                    const isAccessible = canUserAccessProjectCockpit(proj, currentUser);
                                    return (
                                      <ProjectCard 
                                        key={proj.id} 
                                        project={proj}
                                        isReadOnlyForSalesRep={!isAccessible}
                                        isDraggable={currentRole !== 'viewer' && isAccessible}
                                        isDragging={draggedProjectId === proj.id}
                                        onDragStart={(e) => {
                                          if (currentRole === 'viewer' || !isAccessible) return;
                                          e.dataTransfer.setData('text/plain', proj.id);
                                          e.dataTransfer.effectAllowed = 'move';
                                          setDraggedProjectId(proj.id);
                                        }}
                                        onDragEnd={() => {
                                          setDraggedProjectId(null);
                                          setDragOverClosingKey(null);
                                        }}
                                      />
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Optional Unassigned Column */}
                {showUnassignedClosing && (
                  <div className="flex flex-col gap-2.5 bg-amber-50/50 dark:bg-amber-950/20 p-3 sm:p-3.5 rounded-[32px] border border-amber-200/80 dark:border-amber-900/50 shadow-2xs shrink-0">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3.5 py-2 bg-white dark:bg-slate-800/90 rounded-2xl border border-amber-200 dark:border-amber-800/70 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="font-black text-sm text-amber-900 dark:text-amber-200">
                          {isRTL ? 'بدون تاريخ إغلاق' : 'Unassigned Closing'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full shadow-2xs">
                        {closingDateStats.unassigned.length}
                      </span>
                    </div>

                    {/* Column */}
                    <div
                      onDragOver={(e) => {
                        if (currentRole === 'viewer') return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverClosingKey !== 'unassigned') {
                          setDragOverClosingKey('unassigned');
                        }
                      }}
                      onDragLeave={(e) => {
                        if (currentRole === 'viewer') return;
                        e.preventDefault();
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        if (dragOverClosingKey === 'unassigned') {
                          setDragOverClosingKey(null);
                        }
                      }}
                      onDrop={async (e) => {
                        if (currentRole === 'viewer') return;
                        e.preventDefault();
                        const projId = e.dataTransfer.getData('text/plain') || draggedProjectId;
                        if (projId) {
                          await handleUnassignedDrop(projId);
                        }
                        setDragOverClosingKey(null);
                        setDraggedProjectId(null);
                      }}
                      className={`w-[300px] sm:w-[320px] max-w-[340px] p-3 flex flex-col max-h-[82vh] transition-all duration-150 ${
                        dragOverClosingKey === 'unassigned'
                          ? 'bg-amber-500/20 border-amber-500 border-2 border-dashed ring-4 ring-amber-500/20 shadow-md scale-[1.01] rounded-[26px]'
                          : 'crm-kanban-column border-amber-200/60 dark:border-amber-900/30'
                      }`}
                    >
                      {dragOverClosingKey === 'unassigned' && (
                        <div className="p-2.5 mb-2 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse shadow-xs shrink-0">
                          <ArrowDown className="w-4 h-4 text-amber-600 animate-bounce" />
                          <span>{isRTL ? 'إفلات لإزالة موعد الإغلاق' : 'Drop to clear closing date'}</span>
                        </div>
                      )}

                      <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                        {closingDateStats.unassigned.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic bg-white/40 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            {isRTL ? 'جميع المشاريع مجدولة بتواريخ إغلاق! 👍' : 'All projects have scheduled closing dates!'}
                          </div>
                        ) : (
                          closingDateStats.unassigned.map(proj => {
                            const isAccessible = canUserAccessProjectCockpit(proj, currentUser);
                            return (
                              <ProjectCard 
                                key={proj.id} 
                                project={proj}
                                latestQuote={latestQuoteMap.get(proj.id)}
                                isReadOnlyForSalesRep={!isAccessible}
                                isDraggable={currentRole !== 'viewer' && isAccessible}
                                isDragging={draggedProjectId === proj.id}
                                onDragStart={(e) => {
                                  if (currentRole === 'viewer' || !isAccessible) return;
                                  e.dataTransfer.setData('text/plain', proj.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                  setDraggedProjectId(proj.id);
                                }}
                                onDragEnd={() => {
                                  setDraggedProjectId(null);
                                  setDragOverClosingKey(null);
                                }}
                              />
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: COMPACT TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="crm-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-urbanist font-black text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">#PR</th>
                  <th className="py-3.5 px-4">{isRTL ? 'المشروع والجهة' : 'Project & Organization'}</th>
                  <th className="py-3.5 px-4">{isRTL ? 'النوع' : 'Type'}</th>
                  <th className="py-3.5 px-4">{isRTL ? 'المرحلة' : 'Pipeline Stage'}</th>
                  <th className="py-3.5 px-4">{isRTL ? 'الحالة' : 'Health'}</th>
                  <th className="py-3.5 px-4 text-right">
                    <div>{isRTL ? 'القيمة التقديرية' : 'Est. Value'}</div>
                    <div className="text-[10px] text-blue-500 lowercase font-normal">{isRTL ? 'أحدث عرض سعر' : 'latest quotation'}</div>
                  </th>
                  <th className="py-3.5 px-4">{isRTL ? 'الإجراء التالي' : 'Next Action'}</th>
                  <th className="py-3.5 px-4">{isRTL ? 'المسؤول' : 'Owner / Members'}</th>
                  <th className="py-3.5 px-4 text-right">{isRTL ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {groupByMode === 'stage' ? (
                  /* Standard flat table */
                  filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                        {isRTL ? 'لم يتم العثور على مشاريع تطابق الفلاتر المحددة.' : 'No projects found matching the selected filters.'}
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map(p => renderProjectTableRow(p))
                  )
                ) : (
                  /* Grouped table by Quarters & Months */
                  <>
                    {displayedQuarters.map(quarter => {
                      const qStat = closingDateStats.quarterTotals[quarter.id] || { count: 0, totalValue: 0 };
                      return (
                        <React.Fragment key={quarter.id}>
                          {/* Quarter Header Row */}
                          <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-y-2 border-slate-300 dark:border-slate-700">
                            <td colSpan={9} className="py-2.5 px-4">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                  <span className="font-black text-sm text-[#292D32] dark:text-white">
                                    {quarter.id} {selectedClosingYear} — {isRTL ? quarter.titleAr : quarter.titleEn}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    ({isRTL ? quarter.subtitleAr : quarter.subtitleEn})
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 font-mono text-xs">
                                  <span className="text-slate-600 dark:text-slate-300 font-bold">
                                    {qStat.count} {isRTL ? 'مشروع' : 'deals'}
                                  </span>
                                  <span className="text-emerald-700 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    {formatCompactSAR(qStat.totalValue)}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {quarter.months.map(mon => {
                            const monthKey = `${selectedClosingYear}-${mon.monthNum}`;
                            const monthProjs = closingDateStats.byMonth[monthKey] || [];
                            const monthVal = monthProjs.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
                            const isCurrent = currentYearMonth === monthKey;

                            return (
                              <React.Fragment key={monthKey}>
                                {/* Month Subheader Row */}
                                <tr className={`border-b ${isCurrent ? 'bg-blue-50/60 dark:bg-blue-950/30' : 'bg-slate-50/70 dark:bg-slate-900/40'}`}>
                                  <td colSpan={9} className="py-2 px-6">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Calendar className={`w-3.5 h-3.5 ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                                        <span className={`text-xs font-bold ${isCurrent ? 'text-blue-900 dark:text-blue-200' : 'text-slate-700 dark:text-slate-300'}`}>
                                          {isRTL ? mon.labelAr : mon.labelEn} {selectedClosingYear}
                                        </span>
                                        {isCurrent && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                                            {isRTL ? 'الشهر الحالي' : 'Current Month'}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] font-mono">
                                        <span className="text-slate-500 font-medium">({monthProjs.length} {isRTL ? 'مشروع' : 'deals'})</span>
                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCompactSAR(monthVal)}</span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>

                                {monthProjs.length === 0 ? (
                                  <tr>
                                    <td colSpan={9} className="py-2.5 px-8 text-xs text-slate-400 dark:text-slate-500 italic">
                                      {isRTL ? `لا توجد مشاريع مجدولة لشهر ${mon.labelAr}` : `No projects scheduled for ${mon.labelEn}`}
                                    </td>
                                  </tr>
                                ) : (
                                  monthProjs.map(p => renderProjectTableRow(p))
                                )}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}

                    {/* Unassigned Projects Section */}
                    {showUnassignedClosing && closingDateStats.unassigned.length > 0 && (
                      <React.Fragment>
                        <tr className="bg-amber-50/80 dark:bg-amber-950/40 border-y-2 border-amber-300 dark:border-amber-800">
                          <td colSpan={9} className="py-2.5 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <span className="font-black text-sm text-amber-900 dark:text-amber-200">
                                  {isRTL ? 'مشاريع بدون موعد إغلاق محدد' : 'Projects Without Scheduled Closing Date'}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                                {closingDateStats.unassigned.length} {isRTL ? 'مشروع' : 'deals'}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {closingDateStats.unassigned.map(p => renderProjectTableRow(p))}
                      </React.Fragment>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: ARCHIVE TAB */}
      {viewMode === 'archive' && (
        <div className="space-y-4 font-urbanist animate-in fade-in duration-150">
          {/* Archive KPI Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="crm-card p-4 flex flex-col justify-between border-rose-200/80 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/50 to-transparent dark:from-rose-950/20 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Archive className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>{isRTL ? 'إجمالي المشاريع في الأرشيف' : 'Total Archived Projects'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-[10px] font-black">
                  {archivedMetrics.count}
                </span>
              </div>
              <div className="text-2xl font-black text-rose-900 dark:text-rose-100 tracking-tight">
                {archivedMetrics.count} {isRTL ? 'مشروع مؤرشف' : 'Archived Deals'}
              </div>
              <div className="text-[11px] font-semibold text-rose-600/80 dark:text-rose-300/80 mt-1">
                {isRTL ? 'مشاريع محذوفة / منقولة للأرشيف مع إشعار الإدارة' : 'Deleted/archived with logged reasons'}
              </div>
            </div>

            <div className="crm-card p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  {isRTL ? 'إجمالي القيمة التقديرية للأرشيف' : 'Total Value in Archive'}
                </span>
                <span className="w-2 h-2 rounded-full bg-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCompactSAR(archivedMetrics.totalValue)}
              </div>
              <div className="text-[11px] font-semibold text-slate-400 mt-1">
                {formatCurrencySAR(archivedMetrics.totalValue)}
              </div>
            </div>

            <div className="crm-card p-4 flex flex-col justify-between bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isRTL ? 'إمكانية الاستعادة' : 'Restore Capabilities'}</span>
                </span>
              </div>
              <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                {isRTL ? 'استعادة فورية للمسار النشط' : '1-Click Instant Restore'}
              </div>
              <div className="text-[11px] text-emerald-700/90 dark:text-emerald-300/80 mt-1 font-medium">
                {isRTL ? 'يمكنك استعادة أي مشروع وإعادته لمرحلته السابقة في كانبان' : 'Returns deal to its original stage and metrics'}
              </div>
            </div>
          </div>

          {/* Search Bar for Archive */}
          <div className="crm-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isRTL ? 'البحث في الأرشيف برقم PR، اسم المشروع، المقاول، المهندس المؤرشف، أو السبب...' : 'Search archive by PR#, project name, contractor, user, or reason...'}
                value={archiveSearchTerm}
                onChange={e => setArchiveSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-slate-900 dark:text-slate-100 font-medium shadow-2xs"
              />
              {archiveSearchTerm && (
                <button
                  onClick={() => setArchiveSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">
              {isRTL ? `المعروض: ${filteredArchivedProjects.length} من أصل ${scopedArchivedProjects.length}` : `Showing ${filteredArchivedProjects.length} of ${scopedArchivedProjects.length}`}
            </div>
          </div>

          {/* Archive Table / List */}
          {filteredArchivedProjects.length === 0 ? (
            <div className="crm-card p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                <Archive className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
                {archiveSearchTerm 
                  ? (isRTL ? 'لا توجد نتائج مطابقة لبحثك في الأرشيف' : 'No matching archived projects found')
                  : (isRTL ? 'الأرشيف فارغ حالياً' : 'Archive is Empty')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {archiveSearchTerm
                  ? (isRTL ? 'جرب البحث بكلمات أخرى أو امسح شريط البحث لعرض كل الأرشيف.' : 'Try different keywords or clear the search input.')
                  : (isRTL ? 'كافة المشاريع في وضعها النشط. عند قيام أي مهندس بمسح أي مشروع سيُنقل إلى هنا تلقائياً مع توثيق السبب وإشعار الإدارة.' : 'All projects are currently active. When any user deletes a deal, it will be moved here with reasons and manager notifications.')}
              </p>
            </div>
          ) : (
            <div className="crm-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-urbanist font-black text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">{isRTL ? 'المشروع والجهة' : 'Project & Client'}</th>
                      <th className="py-3.5 px-4">{isRTL ? 'المرحلة السابقة' : 'Previous Stage'}</th>
                      <th className="py-3.5 px-4 text-right">{isRTL ? 'القيمة التقديرية' : 'Estimated Value'}</th>
                      <th className="py-3.5 px-4">{isRTL ? 'المؤرشف بواسطة' : 'Archived By'}</th>
                      <th className="py-3.5 px-4">{isRTL ? 'تاريخ الحذف' : 'Archived At'}</th>
                      <th className="py-3.5 px-4">{isRTL ? 'سبب المسح / الأرشفة' : 'Archive Reason'}</th>
                      <th className="py-3.5 px-4 text-right">{isRTL ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-urbanist">
                    {filteredArchivedProjects.map(p => {
                      const stageConfig = PIPELINE_STAGES.find(s => s.value === p.pipeline_stage);
                      return (
                        <tr 
                          key={p.id}
                          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 68px' }}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                                {p.pr_number}
                              </span>
                              <Link 
                                href={`/projects/${p.id}`}
                                className="font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-[#8FC2F0] text-xs transition-colors"
                              >
                                {p.name}
                              </Link>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{p.company_name || 'No Client'}</span>
                              <span className="text-slate-400">&bull; {p.location}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-block ${stageConfig?.badgeClass || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                              {stageConfig?.label || p.pipeline_stage}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap font-black text-slate-900 dark:text-white text-xs text-right">
                            {formatCurrencySAR(p.estimated_value)}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{p.archived_by_name || 'Team Member'}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {p.archived_at ? formatDateString(p.archived_at) : '-'}
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200/70 dark:border-rose-900/50 inline-block font-medium truncate max-w-[280px]" title={p.archive_reason}>
                              {p.archive_reason || (isRTL ? 'لم يتم تسجيل سبب' : 'No reason recorded')}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/projects/${p.id}`}
                                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                              >
                                {isRTL ? 'عرض' : 'View'}
                              </Link>

                              <button
                                onClick={async () => {
                                  await restoreProject(p.id);
                                }}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                title={isRTL ? 'استعادة المشروع للمسار النشط' : 'Restore project to active pipeline'}
                              >
                                <RotateCcw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>{isRTL ? 'استعادة' : 'Restore'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modular Add & Edit Project Modals */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditProjectModal
        project={editingProject}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProject(null);
        }}
      />

      {/* Lost Reason Modal for Kanban Drag-Drop */}
      <LostReasonModal
        isOpen={!!projectForLostModal}
        project={projectForLostModal}
        onClose={() => setProjectForLostModal(null)}
        onConfirm={handleConfirmLost}
      />

      {/* Won Celebration Fireworks / Fanfare Modal */}
      <WonCelebrationModal
        isOpen={!!projectForWonCelebration}
        project={projectForWonCelebration}
        onClose={() => setProjectForWonCelebration(null)}
      />

      {/* Archive / Delete Project Confirmation Modal */}
      <ArchiveProjectModal
        isOpen={isArchiveModalOpen}
        project={projectToArchive}
        onClose={() => {
          setIsArchiveModalOpen(false);
          setProjectToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
      />

      {/* Toast notification for drag and drop move */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-xs text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
