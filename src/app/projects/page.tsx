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
  FileCheck
} from 'lucide-react';
import Link from 'next/link';
import { useCRM } from '@/lib/store/crm-context';
import { 
  PIPELINE_STAGES, 
  OPPORTUNITY_TYPES, 
  PROJECT_PRIORITIES, 
  SAUDI_LOCATIONS,
  canEditCommercialValue
} from '@/lib/constants';
import { Project, OpportunityType, PipelineStage, ProjectPriority } from '@/types/crm';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';
import { formatCompactSAR } from '@/lib/logic/quotation-pricing';
import { calculatePipelineForecast, getStageAgingInfo, STAGE_PROBABILITIES } from '@/lib/logic/pipeline-analytics';
import { ProjectCard } from '@/components/projects/project-card';
import { LostReasonModal } from '@/components/modals/lost-reason-modal';
import { WonCelebrationModal } from '@/components/modals/won-celebration-modal';
import { ArchiveProjectModal } from '@/components/modals/archive-project-modal';
import { scopeProjects, canUserAccessProjectCockpit } from '@/lib/logic/scope';
import { useLanguage } from '@/lib/i18n/language-context';
import { ContextualHelp } from '@/components/guide/contextual-help';

export default function ProjectsPage() {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  const { 
    projects, 
    companies, 
    contacts, 
    quotations,
    addProject, 
    updateProject, 
    deleteProject, 
    archiveProject,
    restoreProject,
    currentRole,
    currentUser,
    teamMembers,
    selectedSalesFilter,
    setSelectedSalesFilter
  } = useCRM();

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin' || currentRole === 'sales_manager' || currentRole === 'admin';
  const isSalesRep = currentUser.role === 'sales_engineer' || (currentUser.role as string) === 'sales_rep';

  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'archive'>('kanban');
  const [projectToArchive, setProjectToArchive] = useState<Project | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveSearchTerm, setArchiveSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedHealth, setSelectedHealth] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  const [activeDrilldownLabel, setActiveDrilldownLabel] = useState<string | null>(null);
  const [activeFilterScope, setActiveFilterScope] = useState<'all' | 'active' | 'critical_aging'>('all');

  // Auto-sync search term, filters, or redirect to specific project cockpit if ?id= is passed
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('id');
      if (targetId) {
        window.location.href = `/projects/${targetId}`;
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

      const v = params.get('view') || params.get('tab');
      if (v === 'table' || v === 'kanban' || v === 'archive') setViewMode(v);

      const f = params.get('filter');
      if (f === 'active') {
        setActiveFilterScope('active');
        setActiveDrilldownLabel(isRTL ? 'كافة الصفقات النشطة في المسار' : 'All Active Pipeline Deals');
      } else if (f === 'aging' || f === 'critical') {
        setActiveFilterScope('critical_aging');
        setActiveDrilldownLabel(isRTL ? 'الصفقات المتعثرة في مرحلتها الحالية (Stage SLA Alert)' : 'Critical Stage Aging Deals');
      }
    }
  }, [isRTL]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForLostModal, setProjectForLostModal] = useState<Project | null>(null);
  const [projectForWonCelebration, setProjectForWonCelebration] = useState<Project | null>(null);

  // Drag & Drop State (Odoo style)
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Form State
  const [prNumber, setPrNumber] = useState('');
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [primaryContactId, setPrimaryContactId] = useState('');
  const [location, setLocation] = useState('Jeddah');
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('in_hand');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('quotation_sent');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [estimatedValue, setEstimatedValue] = useState<number>(100000);
  const [probability, setProbability] = useState<number>(60);
  const [nextAction, setNextAction] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [coEngineer, setCoEngineer] = useState('');

  const openCreateModal = () => {
    setEditingProject(null);
    const nextPr = `PR${1045 + projects.length}`;
    setPrNumber(nextPr);
    setName('');
    const firstComp = companies[0]?.id || '';
    setCompanyId(firstComp);
    const firstContact = contacts.find(c => c.company_id === firstComp)?.id || '';
    setPrimaryContactId(firstContact);
    setLocation('Jeddah');
    setOpportunityType('in_hand');
    setPipelineStage('quotation_sent');
    setPriority('medium');
    setEstimatedValue(150000);
    setProbability(60);
    setNextAction('');
    setNextFollowUpAt('');
    setCoEngineer('');
    setIsModalOpen(true);
  };

  const openEditModal = (proj: Project) => {
    if (!canUserAccessProjectCockpit(proj, currentUser)) return;
    setEditingProject(proj);
    setPrNumber(proj.pr_number);
    setName(proj.name);
    setCompanyId(proj.company_id);
    setPrimaryContactId(proj.primary_contact_id || '');
    setLocation(proj.location);
    setOpportunityType(proj.opportunity_type);
    setPipelineStage(proj.pipeline_stage);
    setPriority(proj.priority);
    setEstimatedValue(proj.estimated_value);
    setProbability(proj.probability);
    setNextAction(proj.next_action || '');
    setNextFollowUpAt(proj.next_follow_up_at ? proj.next_follow_up_at.split('T')[0] : '');
    setCoEngineer(proj.members?.[0]?.user_name || '');
    setIsModalOpen(true);
  };

  const handleCompanyChange = (newCompId: string) => {
    setCompanyId(newCompId);
    const matchingContact = contacts.find(c => c.company_id === newCompId);
    setPrimaryContactId(matchingContact?.id || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prNumber.trim()) return;

    const matchedComp = companies.find(c => c.id === companyId);
    const matchedContact = contacts.find(c => c.id === primaryContactId);

    const members = coEngineer.trim() ? [
      {
        project_id: editingProject?.id || '',
        user_id: 'u2',
        user_name: coEngineer.trim(),
        role: 'co_sales_engineer' as const,
        assigned_at: new Date().toISOString()
      }
    ] : [];

    if (editingProject) {
      await updateProject(editingProject.id, {
        pr_number: prNumber,
        name,
        company_id: companyId,
        company_name: matchedComp?.name,
        primary_contact_id: primaryContactId || undefined,
        primary_contact_name: matchedContact?.full_name,
        primary_contact_phone: matchedContact?.phone,
        location,
        opportunity_type: opportunityType,
        pipeline_stage: pipelineStage,
        priority,
        estimated_value: Number(estimatedValue),
        probability: Number(probability),
        weighted_value: (Number(estimatedValue) * Number(probability)) / 100,
        next_action: nextAction || undefined,
        next_follow_up_at: nextFollowUpAt || undefined,
        members,
      });
    } else {
      await addProject({
        pr_number: prNumber,
        name,
        company_id: companyId,
        company_name: matchedComp?.name,
        primary_contact_id: primaryContactId || undefined,
        primary_contact_name: matchedContact?.full_name,
        primary_contact_phone: matchedContact?.phone,
        location,
        opportunity_type: opportunityType,
        pipeline_stage: pipelineStage,
        priority,
        estimated_value: Number(estimatedValue),
        probability: Number(probability),
        next_action: nextAction || undefined,
        next_follow_up_at: nextFollowUpAt || undefined,
        owner_id: currentUser.id || 'u1',
        owner_name: currentUser.full_name || 'Eslam Mohandes',
        members,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    const proj = projects.find(p => p.id === id);
    if (proj && canUserAccessProjectCockpit(proj, currentUser)) {
      setProjectToArchive(proj);
      setIsArchiveModalOpen(true);
    }
  };

  const handleConfirmArchive = async (reason: string) => {
    if (projectToArchive) {
      await archiveProject(projectToArchive.id, reason);
      setProjectToArchive(null);
      setIsArchiveModalOpen(false);
    }
  };

  // Centralized Scoped Base Projects (Active only)
  const scopedBaseProjects = useMemo(() => {
    return scopeProjects(projects, currentUser, selectedSalesFilter);
  }, [projects, currentUser, selectedSalesFilter]);

  // Centralized Scoped Archived Projects
  const scopedArchivedProjects = useMemo(() => {
    return scopeProjects(projects, currentUser, selectedSalesFilter, true).filter(p => p.is_archived);
  }, [projects, currentUser, selectedSalesFilter]);

  const filteredArchivedProjects = useMemo(() => {
    if (!archiveSearchTerm.trim()) return scopedArchivedProjects;
    const term = archiveSearchTerm.toLowerCase();
    return scopedArchivedProjects.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.pr_number.toLowerCase().includes(term) ||
      (p.company_name && p.company_name.toLowerCase().includes(term)) ||
      (p.archived_by_name && p.archived_by_name.toLowerCase().includes(term)) ||
      (p.archive_reason && p.archive_reason.toLowerCase().includes(term))
    );
  }, [scopedArchivedProjects, archiveSearchTerm]);

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

  // Filter logic - Ordered from most recently entered this stage to oldest
  const filteredProjects = scopedBaseProjects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.pr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.company_name && p.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.primary_contact_name && p.primary_contact_name.toLowerCase().includes(searchTerm.toLowerCase()));
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

  return (
    <div className="space-y-6 w-full mx-auto">
      {/* Header with View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292D32] dark:text-white tracking-tight flex items-center gap-3 font-urbanist">
            <div className="w-11 h-11 rounded-full bg-[#8FC2F0]/15 dark:bg-[#8FC2F0]/25 flex items-center justify-center text-[#292D32] dark:text-[#8FC2F0]">
              <Briefcase className="w-6 h-6 text-[#292D32] dark:text-[#8FC2F0]" />
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
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium font-urbanist">
            {isRTL 
              ? `مسار المبيعات التفاعلي لمنطقة الغربية (${filteredProjects.length} مشروع مشمول في النطاق)` 
              : `Visual sales pipeline for Al Mespar Western Region (${filteredProjects.length} projects in scope)`}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* View Toggle */}
          <div className="rounded-full bg-white/90 dark:bg-slate-800/90 p-1.5 flex items-center border border-slate-200/60 dark:border-slate-700/60 shadow-xs font-urbanist">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
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
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  viewMode === 'archive'
                    ? 'bg-white text-rose-600'
                    : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                }`}>
                  {scopedArchivedProjects.length}
                </span>
              )}
            </button>
          </div>

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
        <div className="crm-card p-3.5 bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 flex items-center justify-between flex-wrap gap-2 text-xs font-urbanist animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span className="font-bold text-blue-950 dark:text-blue-200">
              {isRTL ? 'تصفية نشطة من لوحة التحكم:' : 'Active Dashboard Drilldown:'}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/70 text-blue-900 dark:text-blue-200 font-extrabold text-xs shadow-2xs">
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
            className="px-3 py-1.5 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-700 font-bold transition-all text-xs cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>{isRTL ? 'إلغاء التصفية وعرض الكل' : 'Clear Filter & Show All'}</span>
          </button>
        </div>
      )}

      {/* Executive Commercial Pipeline & Weighted Forecast KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-urbanist">
        {/* Gross Pipeline */}
        <div 
          onClick={() => {
            setActiveFilterScope('active');
            setActiveDrilldownLabel(isRTL ? 'كافة الصفقات النشطة' : 'All Active Deals');
          }}
          className="crm-card p-4 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer shadow-xs group"
          title={isRTL ? "اضغط لعرض كافة الصفقات النشطة" : "Click to view active pipeline"}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isRTL ? 'إجمالي قيمة الصفقات (Gross)' : 'Gross Pipeline Value'}
              </span>
              <ContextualHelp
                title={isRTL ? 'إجمالي قيمة الصفقات (Gross)' : 'Gross Pipeline Value'}
                description={isRTL ? 'المجموع الكلي لقيم جميع الصفقات النشطة في خط المبيعات دون أي ترجيح لاحتماليات الفوز.' : 'Unweighted gross total sum of all active opportunities currently in the sales pipeline.'}
                tip={isRTL ? 'يساعدك على قياس حجم الفرص المطروحة الإجمالي في السوق المستهدف.' : 'Measures the total top-of-funnel market opportunity.'}
                moduleId="projects"
                size="xs"
              />
            </div>
            <span className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCompactSAR(pipelineForecast.totalGrossPipeline)}
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-0.5">
              {pipelineForecast.activeDealsCount} {isRTL ? 'صفقة جارية في المسار' : 'active deals in pipeline'}
            </div>
          </div>
        </div>

        {/* Weighted Forecast */}
        <div 
          className="crm-card p-4 flex flex-col justify-between border-purple-200/80 dark:border-purple-800/60 bg-gradient-to-br from-purple-50/40 to-transparent dark:from-purple-950/20 shadow-xs"
          title={isRTL ? "القيمة المتوقعة مرجحة بنسب احتمالية كل مرحلة" : "Weighted expected revenue by stage probabilities"}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{isRTL ? 'التوقع المالي الموزون' : 'Weighted Forecast'}</span>
              </span>
              <ContextualHelp
                title={isRTL ? 'التوقع المالي الموزون' : 'Weighted Pipeline Forecast'}
                description={isRTL ? 'القيمة المتوقعة بعد ضرب قيمة كل صفقة في نسبة احتمالية مرحلتها (مثال: تقديم العرض 60%، التفاوض 80%).' : 'Calculated by multiplying each deal value by its stage probability (e.g., Quote Sent 60%, Negotiation 80%).'}
                tip={isRTL ? 'المؤشر الأصدق للتوقع المالي والتدفق النقدي المتوقع إغلاقه خلال الشهر.' : 'The most reliable indicator for realistic cashflow and monthly closing.'}
                moduleId="projects"
                size="xs"
              />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-[10px] font-black">
              ~{pipelineForecast.weightedProbabilityAvg}%
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-purple-900 dark:text-purple-100 tracking-tight">
              {formatCompactSAR(pipelineForecast.totalWeightedPipeline)}
            </div>
            <div className="text-[11px] font-semibold text-purple-600/80 dark:text-purple-300/80 mt-0.5">
              {isRTL ? 'المبيعات المتوقعة الفعالة' : 'Realistic expected sales cashflow'}
            </div>
          </div>
        </div>

        {/* Closed Won */}
        <div 
          onClick={() => {
            setSelectedStage('won');
            setActiveDrilldownLabel(isRTL ? 'الصفقات الرابحة (Won)' : 'Won Deals');
          }}
          className="crm-card p-4 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer shadow-xs group"
          title={isRTL ? "اضغط لعرض الصفقات الرابحة" : "Click to view won deals"}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {isRTL ? 'الصفقات الرابحة المعتمدة' : 'Closed Won Revenue'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-300 tracking-tight">
              {formatCompactSAR(pipelineForecast.wonTotalValue)}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {isRTL ? 'عقود مغلقة بنجاح' : 'Closed signed agreements'}
            </div>
          </div>
        </div>

        {/* Stage Aging Health */}
        <div 
          onClick={() => {
            setActiveFilterScope('critical_aging');
            setActiveDrilldownLabel(isRTL ? 'تنبيهات عمر المراحل المتأخرة' : 'Stage Aging Alerts');
          }}
          className={`crm-card p-4 flex flex-col justify-between transition-all cursor-pointer shadow-xs group ${
            pipelineForecast.criticalAgingCount > 0 
              ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20' 
              : 'border-slate-200 dark:border-slate-800'
          }`}
          title={isRTL ? "اضغط لعرض الصفقات التي تجاوزت الحد الزمني للمرحلة" : "Click to filter stale & overdue stage aging deals"}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${pipelineForecast.criticalAgingCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500'}`}>
                {isRTL ? 'عمر المراحل والركود' : 'Stage Aging Health'}
              </span>
              <ContextualHelp
                title={isRTL ? 'مؤشر ركود وعمر الصفقات (Stage Aging SLA)' : 'Stage Aging SLA Alerts'}
                description={isRTL ? 'ينبهك عندما يبقى المشروع في مرحلة واحدة أكثر من الحد الأقصى المسموح به (مثلاً التسعير أكثر من 7 أيام أو إرسال العرض أكثر من 14 يوماً).' : 'Flags projects that remain in a single stage longer than acceptable company SLA benchmarks.'}
                tip={isRTL ? 'الصفقات الراكدة أكثر عرضة للخسارة؛ قم بجدولة اتصال فوري أو زيارة متابعة لإعادة تحريكها.' : 'Stale deals carry high risk of loss; schedule immediate follow-up to revive velocity.'}
                moduleId="projects"
                size="xs"
              />
            </div>
            <Clock className={`w-3.5 h-3.5 ${pipelineForecast.criticalAgingCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {pipelineForecast.criticalAgingCount > 0 ? (
                <span className="text-rose-600 dark:text-rose-400 font-black">
                  {pipelineForecast.criticalAgingCount} {isRTL ? 'حرجة' : 'Critical'}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 text-base font-bold">
                  {isRTL ? 'كافة المراحل منتظمة' : 'All stages within SLA'}
                </span>
              )}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {pipelineForecast.staleAgingCount} {isRTL ? 'صفقة تقترب من حد المرحلة' : 'stale approaching limit'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="crm-card p-5 sm:p-6 space-y-3 font-urbanist">
        {/* Manager Scope Pill Bar */}
        {isManager && (
          <div className="flex items-center justify-between p-3.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/40 rounded-2xl flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-purple-900 dark:text-purple-200 font-urbanist flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                {t('salesRepScope')}:
              </span>
              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                {selectedSalesFilter === 'all' 
                  ? (isRTL ? `عرض كافة المشاريع (${projects.length} مشروع)` : `Viewing all projects (${projects.length} deals)`)
                  : (isRTL ? `تصفية للمهندس: ${teamMembers.find(m => m.id === selectedSalesFilter)?.full_name || ''}` : `Filtered to: ${teamMembers.find(m => m.id === selectedSalesFilter)?.full_name || 'Selected Rep'}`)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedSalesFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedSalesFilter === 'all'
                    ? 'bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-xs'
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
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedSalesFilter === rep.id
                        ? 'bg-[#8FC2F0] text-[#292D32] shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{rep.full_name}</span>
                    <span className="text-[10px] opacity-75">
                      ({repCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sales Rep Scope Pill Bar */}
        {isSalesRep && (
          <div className="flex items-center justify-between p-3.5 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/40 rounded-2xl flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sky-900 dark:text-sky-200 font-urbanist flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                {isRTL ? 'نطاق عرض المشاريع:' : 'Project View Scope:'}
              </span>
              <span className="text-[11px] text-sky-700 dark:text-sky-300 font-medium">
                {selectedSalesFilter === 'all'
                  ? (isRTL ? '🌐 كافة مشاريع الفريق (للاطلاع على الأسماء والشركات - الكروت مغلقة)' : '🌐 All Team Projects (Names & Companies preview only - Cards locked)')
                  : (isRTL ? `👤 مشاريعي الخاصة فقط (${scopedBaseProjects.length} مشروع مسند إليك)` : `👤 My Assigned Projects Only (${scopedBaseProjects.length} deals)`)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedSalesFilter(currentUser.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSalesFilter !== 'all'
                    ? 'bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>👤 {isRTL ? 'مشاريعي فقط (المثبت الافتراضي)' : 'My Projects Only'}</span>
                <span className="text-[10px] opacity-75">
                  ({projects.filter(p => !p.is_archived && ((p.referred_to_id || p.owner_id) === currentUser.id)).length})
                </span>
              </button>

              <button
                onClick={() => setSelectedSalesFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSalesFilter === 'all'
                    ? 'bg-[#8FC2F0] text-[#292D32] shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>🌐 {isRTL ? 'كافة مشاريع الفريق (إلغاء الفلتر للاطلاع)' : 'All Team Projects (Unfiltered)'}</span>
                <span className="text-[10px] opacity-75">
                  ({projects.filter(p => !p.is_archived).length})
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isRTL ? 'البحث برقم PR، اسم المشروع، المقاول، جهة الاتصال...' : 'Search by #PR, project name, contractor, contact...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-slate-100 font-medium shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Health Filter */}
            <select
              value={selectedHealth}
              onChange={e => setSelectedHealth(e.target.value)}
              className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
            >
              <option value="all">{isRTL ? 'الحالة: الكل' : 'Health: All'}</option>
              <option value="red">{isRTL ? '🔴 أحمر (يحتاج متابعة)' : '🔴 Red (Attention)'}</option>
              <option value="yellow">{isRTL ? '🟡 أصفر (يقترب من الموعد)' : '🟡 Yellow (Approaching)'}</option>
              <option value="green">{isRTL ? '🟢 أخضر (منتظم)' : '🟢 Green (Healthy)'}</option>
            </select>

            {/* Stage Filter */}
            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
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
              className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
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
              className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
            >
              <option value="all">{isRTL ? 'كافة المدن' : 'All Cities'}</option>
              {SAUDI_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: KANBAN PIPELINE BOARD (Matching reference image & Odoo drag & drop) */}
      {viewMode === 'kanban' && (
        <div className="space-y-2">
          {/* Odoo Style Drag & Drop Helper Badge */}
          {currentRole !== 'viewer' && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-urbanist">
              <span className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <GripVertical className="w-3.5 h-3.5 text-[#8FC2F0]" />
                <span>{isRTL ? 'اسحب وأفلت أي صفقة لتحديث مرحلتها فورياً' : 'Drag & drop any deal card to instantly update its pipeline stage'}</span>
              </span>
              {draggedProjectId && (
                <span className="text-[#292D32] dark:text-[#8FC2F0] font-black animate-pulse text-[11px] bg-[#8FC2F0]/20 px-3 py-1 rounded-full border border-[#8FC2F0]/30">
                  {isRTL ? 'حرر البطاقة فوق أي مرحلة لنقلها' : 'Release card on any column to move'}
                </span>
              )}
            </div>
          )}

          <div className="overflow-x-auto pb-6">
            <div className="flex gap-5 min-w-[1700px]">
              {kanbanStages.map(col => {
                const stageProjects = filteredProjects.filter(p => {
                  if (col.stage === 'rfq_processing') return p.pipeline_stage === 'rfq_processing' || (p.pipeline_stage as string) === 'pricing';
                  if (col.stage === 'negotiation') return p.pipeline_stage === 'negotiation' || (p.pipeline_stage as string) === 'technically_approved';
                  return p.pipeline_stage === col.stage;
                }).sort((a, b) => {
                  const timeA = new Date(a.stage_entered_at || a.updated_at || a.created_at).getTime();
                  const timeB = new Date(b.stage_entered_at || b.updated_at || b.created_at).getTime();
                  return timeB - timeA; // Descending: Most recently moved first
                });
                const stageValue = stageProjects.reduce((sum, p) => sum + p.estimated_value, 0);
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
                    className={`flex-1 min-w-[360px] p-4 flex flex-col max-h-[84vh] transition-all duration-150 ${
                      isColumnTargeted
                        ? 'bg-[#8FC2F0]/20 border-[#8FC2F0] border-2 border-dashed ring-4 ring-[#8FC2F0]/20 shadow-md scale-[1.01] rounded-[28px]'
                        : 'crm-kanban-column'
                    }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-3 px-1 font-urbanist">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#292D32] dark:text-white text-sm">
                          {isRTL ? col.labelAr : col.label}
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                          {stageProjects.length}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[#292D32] dark:text-[#8FC2F0]">
                        {formatCurrencySAR(stageValue)}
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
                  <th className="py-3.5 px-4">Project &amp; Organization</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Pipeline Stage</th>
                  <th className="py-3.5 px-4">Health</th>
                  <th className="py-3.5 px-4 text-right">
                    <div>{isRTL ? 'القيمة التقديرية' : 'Est. Value'}</div>
                    <div className="text-[9px] text-blue-500 lowercase font-normal">{isRTL ? 'أحدث عرض سعر' : 'latest quotation'}</div>
                  </th>
                  <th className="py-3.5 px-4">Next Action</th>
                  <th className="py-3.5 px-4">Owner / Members</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No projects found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map(p => {
                    const isAccessible = canUserAccessProjectCockpit(p, currentUser);
                    const stageConfig = PIPELINE_STAGES.find(s => s.value === p.pipeline_stage);
                    const typeConfig = OPPORTUNITY_TYPES.find(t => t.value === p.opportunity_type);
                    const latestQuote = quotations
                      ?.filter(q => q.project_id === p.id && !q.is_archived)
                      ?.sort((a, b) => b.version - a.version)[0];

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-[#232A38] text-slate-800 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                            {p.pr_number}
                          </span>
                        </td>
                        <td className="py-4 px-4 min-w-[220px]">
                          {canUserAccessProjectCockpit(p, currentUser) ? (
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
                          <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 shadow-2xs ${
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
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isAccessible ? (
                            <div className="space-y-1">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border inline-block ${stageConfig?.badgeClass || 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'}`}>
                                {isRTL ? (kanbanStages.find(ks => ks.stage === p.pipeline_stage)?.labelAr || stageConfig?.labelAr || p.pipeline_stage) : (stageConfig?.label || p.pipeline_stage)}
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
                              {p.pipeline_stage !== 'won' && p.pipeline_stage !== 'lost' && (() => {
                                const aging = getStageAgingInfo(p);
                                return (
                                  <div className="flex items-center gap-1">
                                    <span 
                                      className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 font-urbanist ${aging.badgeClass}`}
                                      title={isRTL ? `المشروع في هذه المرحلة منذ ${aging.daysInStage} يوماً (الحد المعياري: ${aging.slaDays} يوم)` : `Project in stage for ${aging.daysInStage} days (Target SLA: ${aging.slaDays}d)`}
                                    >
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>{isRTL ? aging.labelAr : aging.labelEn}</span>
                                    </span>
                                  </div>
                                );
                              })()}
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
                                <span className="text-[9px] opacity-75">({Math.round((STAGE_PROBABILITIES[p.pipeline_stage] ?? 0.1) * 100)}%)</span>
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
                            canUserAccessProjectCockpit(p, currentUser) ? (
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
                  })
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

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1C2130] rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-[#8FC2F0]/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#232A38] shrink-0">
              <h2 className="font-bold text-slate-900 dark:text-white text-lg">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">#PR Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="PR10XX"
                    value={prNumber}
                    onChange={e => setPrNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IMC Obhur Hospital"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Account *</label>
                  <select
                    required
                    value={companyId}
                    onChange={e => handleCompanyChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Contact</label>
                  <select
                    value={primaryContactId}
                    onChange={e => setPrimaryContactId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Contact --</option>
                    {contacts.filter(cnt => !companyId || cnt.company_id === companyId).map(cnt => (
                      <option key={cnt.id} value={cnt.id}>{cnt.full_name} ({cnt.job_title || 'Contact'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Location (City)</label>
                  <select
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  >
                    {SAUDI_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Opportunity Type</label>
                  <select
                    value={opportunityType}
                    onChange={e => setOpportunityType(e.target.value as OpportunityType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  >
                    {OPPORTUNITY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Pipeline Stage</label>
                  <select
                    value={pipelineStage}
                    onChange={e => setPipelineStage(e.target.value as PipelineStage)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  >
                    {PIPELINE_STAGES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Estimated Value (SAR)</label>
                    {!canEditCommercialValue(pipelineStage) && (
                      <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      disabled={!canEditCommercialValue(pipelineStage)}
                      value={canEditCommercialValue(pipelineStage) ? estimatedValue : 0}
                      onChange={e => setEstimatedValue(Number(e.target.value))}
                      className={`w-full px-3 py-2 text-sm font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        canEditCommercialValue(pipelineStage)
                          ? 'bg-white dark:bg-[#141820] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                          : 'bg-slate-100 dark:bg-[#232A38] border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                      placeholder={canEditCommercialValue(pipelineStage) ? "SAR Amount" : "Unlocked at Quotation"}
                    />
                    {!canEditCommercialValue(pipelineStage) && (
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {!canEditCommercialValue(pipelineStage) && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      ينشط السعر بمجرد وصول المشروع لمرحلة Quotation Sent
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={probability}
                    onChange={e => setProbability(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as ProjectPriority)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  >
                    {PROJECT_PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Co-Sales Engineer / Project Member */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Co-Sales Engineer / Project Member (Optional Collaboration)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Abdelrahman Al-Shibi"
                  value={coEngineer}
                  onChange={e => setCoEngineer(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                />
              </div>

              {/* Next Action & Date */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Next Action</label>
                  <input
                    type="text"
                    placeholder="e.g. Follow up on procurement revised BOQ"
                    value={nextAction}
                    onChange={e => setNextAction(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={nextFollowUpAt}
                    onChange={e => setNextFollowUpAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#232A38] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
