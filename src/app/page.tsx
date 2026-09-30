'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  Folder, 
  Briefcase, 
  FileText, 
  Trophy, 
  AlertTriangle, 
  AlertCircle,
  UserPlus, 
  Calendar, 
  ArrowRight, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Video, 
  Send, 
  Flame, 
  SlidersHorizontal,
  X,
  RotateCcw,
  ExternalLink,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  GripVertical,
  Eye,
  EyeOff,
  LayoutGrid,
  Move,
  Check,
  Maximize2,
  Minimize2,
  Zap,
  Palette,
  Lock
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { formatCurrencySAR, formatDateString, formatRelativeTime, cn } from '@/lib/utils';
import { PIPELINE_STAGES, PROJECT_CARD_COLORS } from '@/lib/constants';
import { PipelineStage, OpportunityType, Project } from '@/types/crm';
import { ExecutiveManagerCockpit } from '@/components/dashboard/executive-manager-cockpit';
import { SalesRepCockpit } from '@/components/dashboard/sales-rep-cockpit';
import { SmartSuggestionsTab } from '@/components/dashboard/smart-suggestions-tab';
import { PriorityActionsWidget } from '@/components/dashboard/priority-actions-widget';
import { scopeProjects, scopeActivities, scopeRequests, canUserAccessProjectCockpit } from '@/lib/logic/scope';
import { calculatePipelineForecast } from '@/lib/logic/pipeline-analytics';
import { formatCompactSAR } from '@/lib/logic/quotation-pricing';
import { useLanguage } from '@/lib/i18n/language-context';

// Dashboard module definitions for customization
export type DashboardModuleId = 
  | 'team_performance'
  | 'priority_actions'
  | 'kpis'
  | 'stage_chart'
  | 'type_donut'
  | 'locations'
  | 'attention_center'
  | 'mini_kanban'
  | 'recent_projects'
  | 'week_activities';

export type ModuleGridSpan = 4 | 6 | 8 | 12;

interface ModuleConfig {
  id: DashboardModuleId;
  labelEn: string;
  labelAr: string;
  description: string;
}

const ALL_MODULES: ModuleConfig[] = [
  { id: 'priority_actions', labelEn: 'What To Do Today (Priority Actions)', labelAr: 'ما يجب فعله اليوم (المهام ذات الأولوية)', description: 'High-impact next best actions, overdue follow-ups, and key closing steps auto-ranked for conversion' },
  { id: 'kpis', labelEn: 'Key Performance Indicators', labelAr: 'مؤشرات الأداء الرئيسية', description: 'Top 6 cards: Active Deals, Pipeline Value, Quotations, Won Deals, Overdue, Leads' },
  { id: 'team_performance', labelEn: 'Executive Sales Team Cockpit', labelAr: 'لوحة أداء فريق المبيعات والمناديب', description: 'Leaderboard, sales rep quota attainment, in-hand & won values, and individual audit scope' },
  { id: 'attention_center', labelEn: 'Attention Center', labelAr: 'مركز التنبيهات العاجلة', description: 'Urgent overdue follow-ups, due today, stale deals, and high value risks' },
  { id: 'stage_chart', labelEn: 'Pipeline Value by Stage', labelAr: 'قيمة المشاريع حسب المرحلة', description: 'Interactive bar chart with hover tooltips and project breakdown' },
  { id: 'type_donut', labelEn: 'Projects by Opportunity Type', labelAr: 'المشاريع حسب نوع الفرصة', description: 'Interactive donut chart with sector distribution and hover values' },
  { id: 'locations', labelEn: 'Project Locations Distribution', labelAr: 'توزيع المشاريع جغرافياً', description: 'Breakdown of active opportunities across Western Region and KSA cities' },
  { id: 'mini_kanban', labelEn: 'Project Pipeline Preview', labelAr: 'مسار المشاريع المصغر', description: 'Horizontal preview of stages with direct links to project cockpit' },
  { id: 'recent_projects', labelEn: 'Recent Projects Table', labelAr: 'أحدث المشاريع', description: 'Live projects sorted newest to oldest by last activity and updates' },
  { id: 'week_activities', labelEn: 'This Week\'s Activities', labelAr: 'أنشطة الأسبوع الجارية', description: 'Planned and completed client interactions with quick status' },
];

const DEFAULT_VISIBLE_MODULES: Record<DashboardModuleId, boolean> = {
  priority_actions: true,
  kpis: true,
  attention_center: true,
  team_performance: true,
  stage_chart: true,
  type_donut: true,
  locations: true,
  mini_kanban: true,
  recent_projects: true,
  week_activities: true,
};

const DEFAULT_MODULE_ORDER: DashboardModuleId[] = [
  'priority_actions',
  'kpis',
  'attention_center',
  'team_performance',
  'stage_chart',
  'type_donut',
  'locations',
  'mini_kanban',
  'recent_projects',
  'week_activities',
];

const DEFAULT_MODULE_SIZES: Record<DashboardModuleId, ModuleGridSpan> = {
  priority_actions: 12,
  kpis: 12,
  attention_center: 6,
  team_performance: 12,
  stage_chart: 6,
  type_donut: 6,
  locations: 6,
  mini_kanban: 12,
  recent_projects: 12,
  week_activities: 6,
};

const STORAGE_KEY = 'al_mespar_dashboard_visible_modules';
const ORDER_STORAGE_KEY = 'al_mespar_dashboard_module_order';
const SIZE_STORAGE_KEY = 'al_mespar_dashboard_module_sizes';

interface MiniKanbanCardProps {
  project: Project;
  isRTL: boolean;
  onUpdateColor: (projectId: string, colorId: string) => Promise<void>;
}

function MiniKanbanCard({ project, isRTL, onUpdateColor }: MiniKanbanCardProps) {
  const { currentUser } = useCRM();
  const canAccess = canUserAccessProjectCockpit(project, currentUser);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isColorPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isColorPickerOpen]);

  // Dynamic card colors:
  // - Won stage -> always emerald (Green)
  // - Lost stage -> always rose (Red)
  // - Previous / other stages -> custom color or default
  const effectiveColorId = useMemo(() => {
    if (project.pipeline_stage === 'won') return 'emerald';
    if (project.pipeline_stage === 'lost') return 'rose';
    if (project.card_color === 'emerald' || project.card_color === 'rose') {
      return project.base_card_color || 'default';
    }
    return project.card_color || project.base_card_color || 'default';
  }, [project.pipeline_stage, project.card_color, project.base_card_color]);

  const colorConfig = PROJECT_CARD_COLORS.find(c => c.id === effectiveColorId) || PROJECT_CARD_COLORS[0];

  const healthColor = 
    project.calculated_health === 'red' ? 'bg-rose-500' :
    project.calculated_health === 'yellow' ? 'bg-amber-500' :
    project.calculated_health === 'green' ? 'bg-[#77CE69]' : 'bg-slate-400';

  const cardClasses = colorConfig.cardClass
    ? `${colorConfig.cardClass} shadow-sm`
    : 'bg-white/80 dark:bg-[#1E2536]/85 border border-slate-200/80 dark:border-white/10 hover:border-[#8FC2F0]/50 shadow-2xs';

  return (
    <div 
      className={`p-3.5 rounded-2xl group transition-all duration-200 relative ${cardClasses}`}
    >
      {/* Top Bar: PR Number, Health Indicator, Palette Button */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] font-bold text-[#292D32] dark:text-[#8FC2F0] bg-[#8FC2F0]/20 dark:bg-[#8FC2F0]/10 px-2 py-0.5 rounded-full border border-[#8FC2F0]/30 dark:border-[#8FC2F0]/20 font-urbanist">
          {project.pr_number}
        </span>
        
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${healthColor}`} title={`Health: ${project.calculated_health}`} />
          
          {/* Color Palette Button (Only for authorized users) */}
          {canAccess && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsColorPickerOpen(!isColorPickerOpen);
                }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all opacity-70 group-hover:opacity-100 cursor-pointer"
                title={isRTL ? "تغيير لون كارت المشروع" : "Change card color"}
              >
                <Palette className="w-3 h-3 text-slate-500 hover:text-[#8FC2F0] dark:text-slate-400 transition-colors" />
              </button>

              {/* Floating Color Palette */}
              {isColorPickerOpen && (
                <div 
                  ref={colorPickerRef}
                  className={`absolute z-50 top-6 ${isRTL ? 'left-0' : 'right-0'} bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl p-1.5 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md`}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {PROJECT_CARD_COLORS.map(c => {
                    const isSelected = effectiveColorId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsColorPickerOpen(false);
                          await onUpdateColor(project.id, c.id);
                        }}
                        className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer relative border ${c.dotClass} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900 scale-110' : 'hover:opacity-90'}`}
                        title={isRTL ? c.nameAr : c.name}
                      >
                        {isSelected && (
                          <Check className="w-2.5 h-2.5 text-white drop-shadow-xs stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Project Name (Clickable link to Cockpit only if authorized) */}
      {canAccess ? (
        <Link 
          href={`/projects/${project.id}`}
          className="block font-bold text-[#292D32] dark:text-slate-100 text-xs truncate hover:text-[#8FC2F0] transition-colors font-sans"
          title={project.name}
        >
          {project.name}
        </Link>
      ) : (
        <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 text-xs truncate font-sans" title={project.name}>
          <Lock className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate">{project.name}</span>
        </div>
      )}

      {/* Company / Client Name */}
      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 font-sans">
        {project.company_name || (isRTL ? 'عميل' : 'Client')}
      </div>

      {/* Owner & Referred To */}
      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 font-sans space-y-0.5">
        <div className="truncate">
          <span className="font-semibold text-slate-600 dark:text-slate-300">{isRTL ? 'المالك:' : 'Owner:'} </span>
          <span>{project.owner_name || 'Eslam Mohandes'}</span>
        </div>
        {project.referred_to_name && (
          <div className="truncate text-blue-600 dark:text-[#8FC2F0] font-semibold">
            <span>{isRTL ? 'محال إلى:' : 'Referred to:'} </span>
            <span>{project.referred_to_name}</span>
          </div>
        )}
      </div>

      {/* Estimated Value (Masked if not authorized) */}
      <div className="font-black text-[#292D32] dark:text-white text-xs mt-1.5 font-urbanist">
        {canAccess ? (
          formatCurrencySAR(project.estimated_value)
        ) : (
          <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            <span>{isRTL ? 'القيمة محجوبة' : 'Value locked'}</span>
          </span>
        )}
      </div>

      {/* Location & Open Link */}
      <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/50 dark:border-white/10 font-sans">
        <span className="font-medium flex items-center gap-0.5 truncate max-w-[110px]">
          <MapPin className="w-2.5 h-2.5 text-[#8FC2F0] shrink-0" />
          <span className="truncate">{project.location}</span>
        </span>
        {canAccess ? (
          <Link 
            href={`/projects/${project.id}`}
            className="text-[#292D32] dark:text-[#8FC2F0] font-bold hover:underline flex items-center gap-0.5 shrink-0"
          >
            {isRTL ? 'فتح' : 'Open'} <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-0.5 shrink-0 cursor-not-allowed">
            <Lock className="w-2.5 h-2.5 text-amber-500" /> {isRTL ? 'للاطلاع فقط' : 'View only'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  const { 
    projects, 
    contacts, 
    activities,
    quotations,
    currentUser,
    currentRole,
    teamMembers,
    selectedSalesFilter,
    setSelectedSalesFilter,
    requests,
    openRequestDetail,
    updateProject
  } = useCRM();

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin';

  const pendingApprovals = useMemo(() => {
    const userRequests = scopeRequests(requests, currentUser);
    return userRequests.filter(r => r.status === 'pending');
  }, [requests, currentUser]);

  // Scoped Projects based on centralized scoping rules
  const scopedProjects = useMemo(() => {
    return scopeProjects(projects, currentUser, selectedSalesFilter);
  }, [projects, currentUser, selectedSalesFilter]);
  
  // Customizer & Widget Order & Sizes state with local storage persistence
  const [visibleModules, setVisibleModules] = useState<Record<DashboardModuleId, boolean>>(DEFAULT_VISIBLE_MODULES);
  const [moduleOrder, setModuleOrder] = useState<DashboardModuleId[]>(DEFAULT_MODULE_ORDER);
  const [moduleSizes, setModuleSizes] = useState<Record<DashboardModuleId, ModuleGridSpan>>(DEFAULT_MODULE_SIZES);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedModuleId, setDraggedModuleId] = useState<DashboardModuleId | null>(null);
  const [dragOverModuleId, setDragOverModuleId] = useState<DashboardModuleId | null>(null);

  // Smart Grid Auto-Fill: Eliminates empty voids by pairing modules and expanding orphans
  const computedSpans = useMemo(() => {
    const result: Record<DashboardModuleId, ModuleGridSpan> = { ...moduleSizes };
    
    // Process active visible modules in order
    const active = moduleOrder.filter(id => visibleModules[id] || isEditMode);
    
    // Find modules that don't take the full 12 columns
    const nonFullCards = active.filter(id => (result[id] || DEFAULT_MODULE_SIZES[id] || 12) < 12);
    
    // Calculate total columns taken by non-full cards
    const totalNonFullCols = nonFullCards.reduce((sum, id) => {
      return sum + (result[id] || DEFAULT_MODULE_SIZES[id] || 12);
    }, 0);

    const remainder = totalNonFullCols % 12;
    if (remainder !== 0) {
      // There is an empty space of (12 - remainder) columns in the grid.
      // Automatically expand the last non-full card to fill the row gap seamlessly.
      const lastNonFullId = nonFullCards[nonFullCards.length - 1];
      if (lastNonFullId) {
        const current = result[lastNonFullId] || DEFAULT_MODULE_SIZES[lastNonFullId] || 6;
        const needed = 12 - remainder;
        const candidate = current + needed;
        if (candidate === 8) {
          result[lastNonFullId] = 8;
        } else {
          result[lastNonFullId] = 12;
        }
      }
    }
    
    return result;
  }, [moduleOrder, visibleModules, moduleSizes, isEditMode]);

  // Active Main Dashboard View Tab: 'overview' | 'suggestions' | 'team'
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'suggestions' | 'team'>('overview');

  // Interactive Chart Tooltips State
  const [hoveredStageIndex, setHoveredStageIndex] = useState<number | null>(null);
  const [hoveredTypeIndex, setHoveredTypeIndex] = useState<number | null>(null);

  // Load saved module preferences, order & sizes on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setVisibleModules(prev => ({ ...prev, ...parsed }));
      }
      const savedOrder = localStorage.getItem(ORDER_STORAGE_KEY);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        if (Array.isArray(parsedOrder)) {
          const validOrder = parsedOrder.filter((id): id is DashboardModuleId => 
            DEFAULT_MODULE_ORDER.includes(id)
          );
          const missing = DEFAULT_MODULE_ORDER.filter(id => !validOrder.includes(id));
          setModuleOrder([...validOrder, ...missing]);
        }
      }
      const savedSizes = localStorage.getItem(SIZE_STORAGE_KEY);
      if (savedSizes) {
        const parsedSizes = JSON.parse(savedSizes);
        setModuleSizes(prev => ({ ...prev, ...parsedSizes }));
      }
    } catch (e) {
      console.warn('Could not read dashboard preferences', e);
    }
  }, []);

  const toggleModule = (id: DashboardModuleId) => {
    setVisibleModules(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Could not save dashboard preferences', e);
      }
      return next;
    });
  };

  const updateModuleSize = (id: DashboardModuleId, span: ModuleGridSpan) => {
    setModuleSizes(prev => {
      const next = { ...prev, [id]: span };
      try {
        localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Could not save module sizes', e);
      }
      return next;
    });
  };

  const cycleModuleSize = (id: DashboardModuleId) => {
    const current = moduleSizes[id] || DEFAULT_MODULE_SIZES[id] || 12;
    const next: ModuleGridSpan = current === 4 ? 6 : current === 6 ? 8 : current === 8 ? 12 : 4;
    updateModuleSize(id, next);
  };

  const getColSpanClass = (span: ModuleGridSpan) => {
    switch (span) {
      case 4: return 'col-span-12 lg:col-span-4';
      case 6: return 'col-span-12 lg:col-span-6';
      case 8: return 'col-span-12 lg:col-span-8';
      case 12: default: return 'col-span-12';
    }
  };

  const saveModuleOrder = (newOrder: DashboardModuleId[]) => {
    setModuleOrder(newOrder);
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(newOrder));
    } catch (e) {
      console.warn('Could not save dashboard order preferences', e);
    }
  };

  const moveModuleUp = (id: DashboardModuleId) => {
    const index = moduleOrder.indexOf(id);
    if (index <= 0) return;
    const nextOrder = [...moduleOrder];
    const temp = nextOrder[index - 1];
    nextOrder[index - 1] = nextOrder[index];
    nextOrder[index] = temp;
    saveModuleOrder(nextOrder);
  };

  const moveModuleDown = (id: DashboardModuleId) => {
    const index = moduleOrder.indexOf(id);
    if (index < 0 || index >= moduleOrder.length - 1) return;
    const nextOrder = [...moduleOrder];
    const temp = nextOrder[index + 1];
    nextOrder[index + 1] = nextOrder[index];
    nextOrder[index] = temp;
    saveModuleOrder(nextOrder);
  };

  const moveModuleToTop = (id: DashboardModuleId) => {
    const index = moduleOrder.indexOf(id);
    if (index <= 0) return;
    const nextOrder = [id, ...moduleOrder.filter(item => item !== id)];
    saveModuleOrder(nextOrder);
  };

  const resetToDefaultLayout = () => {
    setVisibleModules(DEFAULT_VISIBLE_MODULES);
    setModuleOrder(DEFAULT_MODULE_ORDER);
    setModuleSizes(DEFAULT_MODULE_SIZES);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ORDER_STORAGE_KEY);
      localStorage.removeItem(SIZE_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not reset dashboard layout', e);
    }
  };

  const setAllModules = (visible: boolean) => {
    const updated: Record<DashboardModuleId, boolean> = {
      priority_actions: visible,
      kpis: visible,
      attention_center: visible,
      team_performance: visible,
      stage_chart: visible,
      type_donut: visible,
      locations: visible,
      mini_kanban: visible,
      recent_projects: visible,
      week_activities: visible,
    };
    setVisibleModules(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save dashboard preferences', e);
    }
  };

  // -------------------------------------------------------------
  // REAL DYNAMIC KPI CALCULATIONS (100% Data-driven from Context)
  // -------------------------------------------------------------
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. Active Projects: non-terminal stages
  const activeProjects = useMemo(() => {
    return scopedProjects.filter(p => !['won', 'lost', 'hold'].includes(p.pipeline_stage));
  }, [scopedProjects]);
  const activeProjectsCount = activeProjects.length;

  // 2. Total Pipeline Value: active projects
  const totalPipelineValue = useMemo(() => {
    return activeProjects.reduce((acc, p) => acc + (p.estimated_value || 0), 0);
  }, [activeProjects]);

  // 3. Quotation Value: projects in quotation_sent stage
  const quotationProjects = useMemo(() => {
    return scopedProjects.filter(p => p.pipeline_stage === 'quotation_sent');
  }, [scopedProjects]);
  const quotationValue = useMemo(() => {
    return quotationProjects.reduce((acc, p) => acc + (p.estimated_value || 0), 0);
  }, [quotationProjects]);

  // 4. Won Projects & Authentic Value (SAR 15,962 from MACC KAUST deal)
  const wonProjects = useMemo(() => {
    return scopedProjects.filter(p => p.pipeline_stage === 'won');
  }, [scopedProjects]);
  const wonValue = useMemo(() => {
    return wonProjects.reduce((acc, p) => acc + (p.estimated_value || 0), 0);
  }, [wonProjects]);

  // 5. Overdue Follow-ups (Computed dynamically from project health and follow-up dates)
  const overdueProjects = useMemo(() => {
    return scopedProjects.filter(p => {
      if (['won', 'lost', 'hold'].includes(p.pipeline_stage)) return false;
      if (p.calculated_health === 'red') return true;
      if (p.days_overdue && p.days_overdue > 0) return true;
      if (p.next_follow_up_at) {
        return p.next_follow_up_at.split('T')[0] < todayStr;
      }
      return false;
    });
  }, [scopedProjects, todayStr]);
  const overdueCount = overdueProjects.length;

  // 6. New Leads count (lead stage projects + hot lead contacts)
  const leadStageProjects = useMemo(() => {
    return scopedProjects.filter(p => p.pipeline_stage === 'lead');
  }, [scopedProjects]);
  const hotContacts = useMemo(() => {
    if (isManager) {
      if (selectedSalesFilter === 'all') return contacts.filter(c => c.is_hot_lead);
      return contacts.filter(c => c.is_hot_lead && c.owner_id === selectedSalesFilter);
    }
    return contacts.filter(c => c.is_hot_lead && c.owner_id === currentUser.id);
  }, [contacts, isManager, selectedSalesFilter, currentUser.id]);
  const totalNewLeadsCount = leadStageProjects.length + hotContacts.length;

  // -------------------------------------------------------------
  // ATTENTION CENTER DYNAMIC METRICS
  // -------------------------------------------------------------
  const dueTodayProjects = useMemo(() => {
    return activeProjects.filter(p => p.next_follow_up_at && p.next_follow_up_at.split('T')[0] === todayStr);
  }, [activeProjects, todayStr]);

  const noNextActionProjects = useMemo(() => {
    return activeProjects.filter(p => !p.next_action || p.next_action.trim() === '');
  }, [activeProjects]);

  const staleProjects = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const limitStr = thirtyDaysAgo.toISOString().split('T')[0];
    return activeProjects.filter(p => {
      if (!p.last_activity_at) return true;
      return p.last_activity_at.split('T')[0] < limitStr;
    });
  }, [activeProjects]);

  const highValueAtRiskProjects = useMemo(() => {
    return activeProjects.filter(p => (p.estimated_value || 0) >= 1000000 && p.calculated_health === 'red');
  }, [activeProjects]);

  // -------------------------------------------------------------
  // DYNAMIC STAGE BAR CHART DATA WITH REAL ESTIMATED VALUES
  // -------------------------------------------------------------
  const stageBarData = useMemo(() => {
    const relevantStages: { stage: PipelineStage; shortLabel: string; fullName: string }[] = [
      { stage: 'lead', shortLabel: 'Lead', fullName: 'Lead Discovery' },
      { stage: 'rfq_processing', shortLabel: 'RFQ', fullName: 'RFQ Processing' },
      { stage: 'pricing', shortLabel: 'Pricing', fullName: 'Costing & Pricing' },
      { stage: 'quotation_sent', shortLabel: 'Quotation', fullName: 'Quotation Sent' },
      { stage: 'technical_submission', shortLabel: 'Technical', fullName: 'Technical Submission' },
      { stage: 'negotiation', shortLabel: 'Negotiation', fullName: 'Commercial Negotiation' },
      { stage: 'won', shortLabel: 'Won', fullName: 'Won Deals' },
      { stage: 'lost', shortLabel: 'Lost', fullName: 'Lost / Closed' },
    ];

    const stageTotals = relevantStages.map(s => {
      const stageProjects = scopedProjects.filter(p => p.pipeline_stage === s.stage);
      const totalVal = stageProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
      return {
        ...s,
        count: stageProjects.length,
        totalValue: totalVal,
        projects: stageProjects,
      };
    });

    const maxVal = Math.max(...stageTotals.map(s => s.totalValue), 1);
    const sumAllValues = stageTotals.reduce((sum, s) => sum + s.totalValue, 0) || 1;

    return stageTotals.map(s => {
      const pctOfMax = (s.totalValue / maxVal) * 100;
      const heightPercent = s.totalValue === 0 && s.count === 0 ? 8 : Math.max(16, Math.round(pctOfMax));
      const shareOfTotal = ((s.totalValue / sumAllValues) * 100).toFixed(1);

      return {
        ...s,
        heightPercent: `${heightPercent}%`,
        shareOfTotal,
        displayValue: formatCurrencySAR(s.totalValue),
      };
    });
  }, [scopedProjects]);

  // -------------------------------------------------------------
  // DYNAMIC DONUT CHART: PROJECTS BY OPPORTUNITY TYPE
  // -------------------------------------------------------------
  const donutTypeData = useMemo(() => {
    const typeConfigs: { type: OpportunityType; label: string; color: string }[] = [
      { type: 'tender', label: 'Tender', color: '#2563eb' },
      { type: 'in_hand', label: 'In Hand', color: '#10b981' },
      { type: 'new_lead', label: 'New Lead', color: '#f59e0b' },
      { type: 'existing_account', label: 'Existing Account', color: '#8b5cf6' },
      { type: 'upgrade_retrofit', label: 'Upgrade / Retrofit', color: '#06b6d4' },
      { type: 'hunting_potential', label: 'Hunting / Potential', color: '#ec4899' },
    ];

    if (scopedProjects.length === 0) {
      return typeConfigs.map(cfg => ({
        ...cfg,
        count: 0,
        totalValue: 0,
        percentage: '0%',
        dashArray: '0 100',
        dashOffset: 0,
        projects: [],
      }));
    }

    const totalProjectsCount = scopedProjects.length;
    let accumulatedOffset = 0;

    return typeConfigs.map(cfg => {
      const matchingProjects = scopedProjects.filter(p => p.opportunity_type === cfg.type);
      const count = matchingProjects.length;
      const totalValue = matchingProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
      const pctNumber = (count / totalProjectsCount) * 100;
      const pctFormatted = pctNumber.toFixed(0) + '%';

      // Keep a clean 0.8% gap between slices so adjacent strokes do not overlap or jitter
      const gap = count > 0 && matchingProjects.length < scopedProjects.length ? 0.8 : 0;
      const visibleLength = count === 0 ? 0 : Math.max(0.5, pctNumber - gap);
      const dashArray = `${visibleLength.toFixed(2)} ${(100 - visibleLength).toFixed(2)}`;
      const dashOffset = -accumulatedOffset;
      accumulatedOffset += pctNumber;

      return {
        ...cfg,
        count,
        totalValue,
        percentage: pctFormatted,
        dashArray,
        dashOffset,
        projects: matchingProjects,
      };
    });
  }, [scopedProjects]);

  // -------------------------------------------------------------
  // DYNAMIC GEOGRAPHIC DISTRIBUTION
  // -------------------------------------------------------------
  const locationStats = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedProjects.forEach(p => {
      const loc = p.location || 'Jeddah';
      counts[loc] = (counts[loc] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const topLocations = sorted.slice(0, 4);
    const otherCount = sorted.slice(4).reduce((sum, item) => sum + item.count, 0);

    return { topLocations, otherCount, totalLocations: sorted.length };
  }, [scopedProjects]);

  // -------------------------------------------------------------
  // RECENT PROJECTS TABLE: STRICTLY NEWEST TO OLDEST
  // -------------------------------------------------------------
  const sortedRecentProjects = useMemo(() => {
    return [...scopedProjects]
      .sort((a, b) => {
        const timeA = new Date(a.updated_at || a.last_activity_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.last_activity_at || b.created_at).getTime();
        return timeB - timeA; // Newest first
      })
      .slice(0, 7);
  }, [scopedProjects]);

  // -------------------------------------------------------------
  // MINI KANBAN STAGES (The 7 Exact Pipeline Stages)
  // -------------------------------------------------------------
  const SEVEN_STAGES: PipelineStage[] = [
    'lead',
    'rfq_processing',
    'quotation_sent',
    'technical_submission',
    'negotiation',
    'won',
    'lost',
  ];

  const miniKanbanStages = useMemo(() => {
    return SEVEN_STAGES.map(stageKey => {
      const stageConfig = PIPELINE_STAGES.find(s => s.value === stageKey) || {
        value: stageKey,
        label: stageKey,
        labelAr: stageKey,
        color: '#94a3b8',
        badgeClass: 'bg-slate-100 text-slate-700'
      };

      const stageProjects = scopedProjects
        .filter(p => p.pipeline_stage === stageKey)
        .sort((a, b) => {
          const timeA = new Date(a.stage_entered_at || a.updated_at || a.created_at).getTime();
          const timeB = new Date(b.stage_entered_at || b.updated_at || b.created_at).getTime();
          return timeB - timeA; // Most recently moved to this stage first
        });

      const stageVal = stageProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);

      return {
        stage: stageKey,
        label: isRTL ? stageConfig.labelAr : stageConfig.label,
        color: stageConfig.color,
        badgeClass: stageConfig.badgeClass,
        count: stageProjects.length,
        totalValueFormatted: formatCurrencySAR(stageVal),
        projects: stageProjects,
      };
    });
  }, [scopedProjects, isRTL]);

  const handleUpdateProjectColor = async (projectId: string, colorId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    if (proj.pipeline_stage !== 'won' && proj.pipeline_stage !== 'lost') {
      await updateProject(projectId, { card_color: colorId, base_card_color: colorId });
    } else {
      await updateProject(projectId, { base_card_color: colorId });
    }
  };

  // -------------------------------------------------------------
  // THIS WEEK'S ACTIVITIES (From Real Database / Migrated Data)
  // -------------------------------------------------------------
  const scopedActivities = useMemo(() => {
    return scopeActivities(activities, currentUser, selectedSalesFilter);
  }, [activities, currentUser, selectedSalesFilter]);

  const recentActivitiesList = useMemo(() => {
    return scopedActivities.slice(0, 6).map(act => {
      const project = scopedProjects.find(p => p.id === act.project_id);
      const member = teamMembers.find(m => m.id === act.user_id);
      const repName = act.user_name || member?.full_name || (act.user_id === 'u1' ? 'Eslam Mohandes' : act.user_id === 'u2' ? 'Ahmed Mansour' : 'Sales Rep');
      const repInitials = member?.avatar_initials || repName.split(' ').map(n => n[0]).join('').slice(0, 2) || 'SR';

      return {
        id: act.id,
        channel: act.channel,
        title: `${act.channel.toUpperCase()} - ${act.company_name || project?.company_name || 'Client'}`,
        subtext: project?.name ? project.name : (act.visit_purpose ? act.visit_purpose.replace('_', ' ') : 'Client interaction'),
        date: formatDateString(act.activity_date),
        outcome: act.outcome || 'Connected',
        hasNotes: !!act.notes,
        userId: act.user_id,
        userName: repName,
        userInitials: repInitials,
      };
    });
  }, [scopedActivities, scopedProjects, teamMembers]);

  const pipelineForecast = useMemo(() => {
    return calculatePipelineForecast(scopedProjects, quotations);
  }, [scopedProjects, quotations]);

  const activeModulesCount = Object.values(visibleModules).filter(Boolean).length;

  return (
    <div className="space-y-7 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100 animate-in fade-in duration-200 font-urbanist">
      
      {/* ========================================================================= */}
      {/* HEADER BAR: CONFIDENT EDITORIAL TITLE, DATE RANGE, AND CUSTOMIZE VIEW */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292D32] dark:text-white tracking-tight">
              {isRTL ? 'لوحة المؤشرات' : 'Dashboard'}
            </h1>
            <span className="px-3 py-1 rounded-full bg-[#8FC2F0]/20 dark:bg-[#8FC2F0]/15 text-[#292D32] dark:text-[#8FC2F0] border border-[#8FC2F0]/30 dark:border-[#8FC2F0]/20 text-xs font-bold font-urbanist">
              {isRTL ? 'ذكاء CRMate التجاري' : 'CRMate Intelligence'}
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-1">
            {isRTL 
              ? 'السرعة اللحظية للمبيعات، ذكاء مسار الصفقات، والتنبؤ بالإيرادات' 
              : 'Real-time sales velocity, pipeline intelligence, and revenue forecasting'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live Reorder Widgets Mode Button */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer ${
              isEditMode 
                ? 'bg-[#292D32] text-white border-[#292D32] dark:bg-[#8FC2F0] dark:text-[#141820] dark:border-[#8FC2F0] shadow-sm'
                : 'bg-white dark:bg-[#1C2130] text-[#292D32] dark:text-slate-200 border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#232A38]'
            }`}
            title={isRTL ? 'تبديل وضع ترتيب الودجات المباشر' : 'Toggle Live Widget Reorder Mode'}
          >
            <Move className="w-3.5 h-3.5 text-[#8FC2F0] dark:text-[#141820]" />
            <span>{isRTL ? (isEditMode ? 'إنهاء الترتيب' : 'ترتيب الكروت') : (isEditMode ? 'Done Reordering' : 'Reorder Widgets')}</span>
          </button>

          {/* Module Customizer Button */}
          <button
            onClick={() => setIsCustomizeModalOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-[#1C2130] px-4 py-2 rounded-full border border-slate-200/90 dark:border-slate-800 shadow-xs text-xs font-bold text-[#292D32] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#232A38] hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
            title="Customize Visible Dashboard Modules"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#8FC2F0]" />
            <span>{isRTL ? 'تخصيص' : 'Customize'}</span>
            <span className="bg-[#8FC2F0]/20 dark:bg-[#8FC2F0]/15 text-[#292D32] dark:text-[#8FC2F0] px-2 py-0.5 rounded-full font-black text-[10px]">
              {activeModulesCount}/9
            </span>
          </button>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#1C2130] px-4 py-2 rounded-full border border-slate-200/90 dark:border-slate-800 shadow-xs text-xs font-semibold text-[#292D32] dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-[#8FC2F0]" />
            <span>{isRTL ? 'أسبوع العمل السعودي • نشط' : 'Saudi Workweek • Active'}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3-TAB DASHBOARD SWITCHER (REFERENCE PILL SEGMENTED CONTROL) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 dark:bg-[#1C2130]/90 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md overflow-x-auto w-fit">
        <button
          type="button"
          onClick={() => setDashboardTab('overview')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            dashboardTab === 'overview'
              ? 'bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] shadow-sm scale-[1.01]'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#232A38]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isRTL ? 'نظرة عامة ومؤشرات الأداء' : 'Overview & Cockpit'}</span>
        </button>

        <button
          type="button"
          onClick={() => setDashboardTab('suggestions')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer relative ${
            dashboardTab === 'suggestions'
              ? 'bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] shadow-sm scale-[1.01]'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#232A38]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#8FC2F0]" />
          <span>{isRTL ? 'توصيات واقتراحات الذكاء التجاري' : 'Smart AI Suggestions'}</span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-black bg-[#77CE69] text-white">
            NEW
          </span>
        </button>

        <button
          type="button"
          onClick={() => setDashboardTab('team')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            dashboardTab === 'team'
              ? 'bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] shadow-sm scale-[1.01]'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#232A38]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>{isRTL ? 'لوحة الشرف وأداء الفريق' : 'Executive Team Leaderboard'}</span>
        </button>
      </div>

      {dashboardTab === 'suggestions' && (
        <SmartSuggestionsTab />
      )}

      {dashboardTab === 'team' && (
        <div className="space-y-6">
          <ExecutiveManagerCockpit />
        </div>
      )}

      {dashboardTab === 'overview' && (
        <div className="space-y-7">
          {/* Tactical Rep Cockpit (Visible if sales engineer or specific rep filtered) */}
          {(currentUser.role === 'sales_engineer' || selectedSalesFilter !== 'all') && (
            <SalesRepCockpit />
          )}

          {/* Live Reorder Mode Banner */}
          {isEditMode && (
            <div className="bg-[#292D32] dark:bg-[#1C2130] text-white p-4 sm:p-5 rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#8FC2F0] text-[#141820] flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Move className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                    <span>{isRTL ? 'وضع تخصيص وترتيب كروت اللوحة' : 'Live Dashboard Widget Reorder Mode'}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#8FC2F0]/20 text-[#8FC2F0] border border-[#8FC2F0]/30">
                      {isRTL ? 'تعديل نشط' : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 dark:text-slate-400 mt-0.5">
                    {isRTL 
                      ? 'اضغط مطولاً واسحب أي كارت (Hold & Drag) لإفلاته في المكان المطلوب، أو استخدم الأسهم، ويتم حفظ الترتيب تلقائياً' 
                      : 'Hold and drag any card to drop it in your desired position, or use the arrows. Changes save automatically.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetToDefaultLayout}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'الترتيب الافتراضي' : 'Reset'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomizeModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'إدارة القائمة' : 'List Manager'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8FC2F0] hover:bg-[#7AB5E8] text-[#141820] text-xs font-black transition-colors shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isRTL ? 'حفظ وإنهاء' : 'Done'}</span>
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC MODULES GRID (DENSE PACKING + AUTOFILL ELIMINATES EMPTY VOIDS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:grid-flow-row-dense [grid-auto-flow:row_dense]">
            {moduleOrder.map((modId, index) => {
              const isVisible = visibleModules[modId];
              if (!isVisible && !isEditMode) return null;

              const modInfo = ALL_MODULES.find(m => m.id === modId);
              const isFirst = index === 0;
              const isLast = index === moduleOrder.length - 1;
              const isBeingDragged = isEditMode && draggedModuleId === modId;
              const isDropTarget = isEditMode && dragOverModuleId === modId && draggedModuleId !== modId;

              // Determine responsive grid col-span with smart auto-fill
              const currentSpan = computedSpans[modId] || moduleSizes[modId] || DEFAULT_MODULE_SIZES[modId] || 12;
              const colSpanClass = getColSpanClass(currentSpan);

              return (
                <div 
                  key={modId} 
                  draggable={isEditMode}
                  onDragStart={(e) => {
                    if (!isEditMode) return;
                    e.dataTransfer.setData('text/plain', modId);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedModuleId(modId);
                  }}
                  onDragEnd={() => {
                    setDraggedModuleId(null);
                    setDragOverModuleId(null);
                  }}
                  onDragOver={(e) => {
                    if (!isEditMode || !draggedModuleId || draggedModuleId === modId) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverModuleId !== modId) {
                      setDragOverModuleId(modId);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverModuleId === modId) {
                      setDragOverModuleId(null);
                    }
                  }}
                  onDrop={(e) => {
                    if (!isEditMode) return;
                    e.preventDefault();
                    const sourceId = (e.dataTransfer.getData('text/plain') || draggedModuleId) as DashboardModuleId;
                    if (sourceId && sourceId !== modId) {
                      const fromIndex = moduleOrder.indexOf(sourceId);
                      const toIndex = moduleOrder.indexOf(modId);
                      if (fromIndex !== -1 && toIndex !== -1) {
                        const nextOrder = [...moduleOrder];
                        const [moved] = nextOrder.splice(fromIndex, 1);
                        nextOrder.splice(toIndex, 0, moved);
                        saveModuleOrder(nextOrder);
                      }
                    }
                    setDraggedModuleId(null);
                    setDragOverModuleId(null);
                  }}
                  className={cn(
                    colSpanClass,
                    "transition-all duration-200 relative group/widget",
                    isEditMode && "p-2.5 rounded-2xl border-2 border-dashed border-[#8FC2F0]/40 bg-[#8FC2F0]/03 cursor-grab active:cursor-grabbing",
                    isBeingDragged && "opacity-35 scale-[0.98] border-dashed border-[#8FC2F0] shadow-none",
                    isDropTarget && "ring-4 ring-[#8FC2F0]/50 border-2 border-[#8FC2F0] scale-[1.01] bg-[#8FC2F0]/10 shadow-2xl"
                  )}
                >
                  {/* Drop Target Indicator Overlay */}
                  {isDropTarget && (
                    <div className="absolute inset-0 z-40 bg-[#8FC2F0]/20 dark:bg-[#8FC2F0]/25 rounded-2xl border-2 border-dashed border-[#8FC2F0] flex items-center justify-center backdrop-blur-2xs pointer-events-none animate-in fade-in duration-100">
                      <div className="bg-[#292D32] dark:bg-[#141820] text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-xl flex items-center gap-2 border border-[#8FC2F0]/50">
                        <Move className="w-4 h-4 text-[#8FC2F0] animate-bounce" />
                        <span>{isRTL ? `إفلات لنقل الكارت إلى هنا (مكان #${index + 1})` : `Drop widget here (position #${index + 1})`}</span>
                      </div>
                    </div>
                  )}

                  {/* Floating Edit Mode Controls */}
                  {isEditMode && (
                    <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 dark:bg-[#141820] text-white rounded-xl mb-3 border border-white/10 shadow-sm backdrop-blur-xs select-none flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        {/* Drag Handle Grip Pill */}
                        <div 
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#8FC2F0]/20 dark:bg-[#8FC2F0]/15 text-[#8FC2F0] hover:bg-[#8FC2F0]/30 transition-colors cursor-grab active:cursor-grabbing border border-[#8FC2F0]/30 select-none shadow-2xs"
                          title={isRTL ? "اضغط واسحب الكارت إلى المكان المطلوب" : "Hold and drag widget to reorder"}
                        >
                          <GripVertical className="w-4 h-4 text-[#8FC2F0]" />
                          <span className="text-[11px] font-black text-white hidden sm:inline">
                            {isRTL ? "اسحب للترتيب" : "Drag to move"}
                          </span>
                        </div>

                        <span className="w-6 h-6 rounded-lg bg-[#8FC2F0] text-[#141820] font-black text-xs flex items-center justify-center font-mono shadow-xs">
                          #{index + 1}
                        </span>
                        <span className="font-extrabold text-xs tracking-tight">
                          {isRTL ? modInfo?.labelAr : modInfo?.labelEn}
                        </span>
                        {!isVisible && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {isRTL ? 'مخفي' : 'Hidden'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Size Switcher */}
                        <div className="flex items-center bg-white/10 dark:bg-black/40 rounded-lg p-0.5 border border-white/10">
                          <span className="text-[10px] font-bold text-slate-300 px-1.5 hidden sm:inline">
                            {isRTL ? 'العرض:' : 'Width:'}
                          </span>
                          {([4, 6, 8, 12] as ModuleGridSpan[]).map((span) => {
                            const isCurrent = currentSpan === span;
                            const label = span === 4 ? '1/3' : span === 6 ? '1/2' : span === 8 ? '2/3' : (isRTL ? 'كامل' : 'Full');
                            return (
                              <button
                                key={span}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); updateModuleSize(modId, span); }}
                                className={cn(
                                  "px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer",
                                  isCurrent 
                                    ? "bg-[#8FC2F0] text-[#141820] shadow-xs" 
                                    : "text-slate-300 hover:text-white hover:bg-white/10"
                                )}
                                title={isRTL ? `تحديد العرض: ${label}` : `Set width: ${label}`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveModuleToTop(modId); }}
                          disabled={isFirst}
                          title={isRTL ? 'نقل للأعلى تماماً' : 'Move to Top'}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors cursor-pointer",
                            isFirst ? "text-slate-600 cursor-not-allowed" : "text-slate-300 hover:text-white hover:bg-white/10"
                          )}
                        >
                          <ArrowUpToLine className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveModuleUp(modId); }}
                          disabled={isFirst}
                          title={isRTL ? 'تحريك لأعلى' : 'Move Up'}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors cursor-pointer",
                            isFirst ? "text-slate-600 cursor-not-allowed" : "text-slate-300 hover:text-white hover:bg-white/10"
                          )}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveModuleDown(modId); }}
                          disabled={isLast}
                          title={isRTL ? 'تحريك لأسفل' : 'Move Down'}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors cursor-pointer",
                            isLast ? "text-slate-600 cursor-not-allowed" : "text-slate-300 hover:text-white hover:bg-white/10"
                          )}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleModule(modId); }}
                          title={isVisible ? (isRTL ? 'إخفاء الودجت' : 'Hide Widget') : (isRTL ? 'إظهار الودجت' : 'Show Widget')}
                          className={cn(
                            "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer",
                            isVisible 
                              ? "text-slate-300 hover:text-rose-300 hover:bg-rose-500/20" 
                              : "text-[#8FC2F0] hover:bg-[#8FC2F0]/20"
                          )}
                        >
                          {isVisible ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>{isRTL ? 'إخفاء' : 'Hide'}</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isRTL ? 'إظهار' : 'Show'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}


                  {/* Widget Body */}
                  {isVisible ? (
                    <>
                      {/* 0. PRIORITY ACTIONS (WHAT TO DO TODAY) */}
                      {modId === 'priority_actions' && (
                        <PriorityActionsWidget cardSpan={currentSpan} />
                      )}

                      {/* 1. KPIS */}
                      {modId === 'kpis' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-in fade-in duration-200">
                          {/* Active Projects */}
                          <Link 
                            href="/projects?filter=active"
                            className="crm-card p-5 flex flex-col justify-between group hover:translate-y-[-2px] hover:shadow-card hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer"
                            title={isRTL ? "اضغط لعرض كافة الصفقات النشطة" : "Click to view active deals"}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#77CE69]/15 text-[#216817] dark:text-[#77CE69] flex items-center justify-center shrink-0 border border-[#77CE69]/30 transition-transform group-hover:scale-105">
                                <Folder className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                                  {t('activeDeals')}
                                </div>
                                <div className="text-2xl font-black text-[#292D32] dark:text-white leading-tight mt-0.5 tracking-tight">
                                  {activeProjectsCount}
                                </div>
                              </div>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-slate-700 dark:text-slate-300 font-bold">{scopedProjects.length} {isRTL ? 'مشروع' : 'Projects'}</span>
                              <span className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                                {isRTL ? 'نشط' : 'Active'}
                              </span>
                            </div>
                          </Link>

                          {/* Total Pipeline Value */}
                          <Link 
                            href="/projects?view=table"
                            className="crm-card p-5 flex flex-col justify-between group hover:translate-y-[-2px] hover:shadow-card hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                            title={isRTL ? "اضغط لفتح جدول المشاريع والتفاصيل" : "Click to view full projects pipeline table"}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shrink-0 border border-[#8FC2F0]/40 transition-transform group-hover:scale-105">
                                <Briefcase className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                                  {t('pipelineValue')}
                                </div>
                                <div className="text-2xl font-black text-[#292D32] dark:text-white leading-tight mt-0.5 truncate tracking-tight" title={`SAR ${totalPipelineValue.toLocaleString()}`}>
                                  {formatCurrencySAR(totalPipelineValue)}
                                </div>
                              </div>
                            </div>
                            <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="flex items-center gap-1 font-bold">
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                <span>{isRTL ? 'الموزون:' : 'Weighted:'} {formatCompactSAR(pipelineForecast.totalWeightedPipeline)}</span>
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200">
                                ~{pipelineForecast.weightedProbabilityAvg}%
                              </span>
                            </div>
                          </Link>

                          {/* Quotation Value */}
                          <Link 
                            href="/projects?stage=quotation_sent"
                            className="crm-card p-5 flex flex-col justify-between group hover:translate-y-[-2px] hover:shadow-card hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                            title={isRTL ? "اضغط لعرض مشاريع مرحلة عروض الأسعار" : "Click to view quotation stage projects"}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#8FC2F0]/15 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shrink-0 border border-[#8FC2F0]/30 transition-transform group-hover:scale-105">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                                  {t('quotationValue')}
                                </div>
                                <div className="text-2xl font-black text-[#292D32] dark:text-white leading-tight mt-0.5 truncate tracking-tight" title={`SAR ${quotationValue.toLocaleString()}`}>
                                  {formatCurrencySAR(quotationValue)}
                                </div>
                              </div>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-slate-600 dark:text-slate-300 font-medium">{quotationProjects.length} {isRTL ? 'عرض صادر' : 'Sent'}</span>
                              <span className="text-blue-700 dark:text-[#8FC2F0] text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/60 font-mono">
                                {formatCurrencySAR(quotationValue)}
                              </span>
                            </div>
                          </Link>

                          {/* Won Deals Value */}
                          <Link 
                            href="/projects?stage=won"
                            className="crm-card p-5 flex flex-col justify-between group hover:translate-y-[-2px] hover:shadow-card hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer bg-gradient-to-b from-white via-white to-[#77CE69]/5 dark:from-[#1C2130] dark:to-[#1C2130]"
                            title={isRTL ? "اضغط لعرض الصفقات الرابحة" : "Click to view won deals"}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#77CE69] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#77CE69]/30 transition-transform group-hover:scale-105">
                                <Trophy className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider truncate">
                                  {t('wonValue')}
                                </div>
                                <div className="text-2xl font-black text-[#292D32] dark:text-white leading-tight mt-0.5 tracking-tight" title={`SAR ${wonValue.toLocaleString()}`}>
                                  SAR {wonValue.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span>{wonProjects.length} {isRTL ? 'صفقة مغلقة' : 'Won Deal'}</span>
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full font-bold">100%</span>
                            </div>
                          </Link>

                          {/* Overdue Follow-ups */}
                          <Link 
                            href="/projects?health=red"
                            className="crm-card p-5 flex flex-col justify-between group hover:translate-y-[-2px] hover:shadow-card hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer"
                            title={isRTL ? "اضغط لعرض الصفقات المتأخرة التي تحتاج متابعة عاجلة" : "Click to view overdue deals needing attention"}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/50 transition-transform group-hover:scale-105">
                                <AlertTriangle className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                                  {t('overdueDeals')}
                                </div>
                                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 leading-tight mt-0.5 tracking-tight">
                                  {overdueCount}
                                </div>
                              </div>
                            </div>
                            <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span>{t('urgentActionRequired')}</span>
                              {overdueCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                            </div>
                          </Link>

                          {/* Active Leads & Contacts */}
                          <Link 
                            href="/projects?stage=lead"
                            className="crm-card p-5 flex flex-col justify-between group hover:translate-y-[-2px] hover:shadow-card hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                            title={isRTL ? "اضغط لعرض صفقات مرحلة العملاء المحتملين" : "Click to view lead stage projects"}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shrink-0 border border-[#8FC2F0]/40 transition-transform group-hover:scale-105">
                                <UserPlus className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                                  {t('prospectsAndLeads')}
                                </div>
                                <div className="text-2xl font-black text-[#292D32] dark:text-white leading-tight mt-0.5 tracking-tight">
                                  {totalNewLeadsCount}
                                </div>
                              </div>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-slate-600 dark:text-slate-300">{leadStageProjects.length} {isRTL ? 'فرص' : 'Leads'}</span>
                              <span className="text-slate-500 dark:text-slate-400 font-mono">{hotContacts.length} {isRTL ? 'جهات' : 'Contacts'}</span>
                            </div>
                          </Link>
                        </div>
                      )}

                      {/* 2. TEAM PERFORMANCE */}
                      {modId === 'team_performance' && (
                        <ExecutiveManagerCockpit />
                      )}

                      {/* 3. STAGE CHART */}
                      {modId === 'stage_chart' && (
                        <div className="crm-card p-6 sm:p-7 flex flex-col justify-between relative h-full">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h2 className="font-black text-[#292D32] dark:text-white text-sm font-urbanist">
                                {isRTL ? 'قيمة المشاريع حسب المرحلة' : 'Pipeline Value by Stage'}
                              </h2>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
                                {isRTL ? 'مرر الفأرة فوق الأعمدة لعرض الصفقات' : 'Hover over bars to inspect deal details'}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-[#292D32] dark:text-slate-300 font-sans">
                              {isRTL ? 'الإجمالي: ' : 'Total: '}<strong className="text-[#292D32] dark:text-white font-black">{formatCurrencySAR(totalPipelineValue)}</strong>
                            </span>
                          </div>

                          {/* Interactive Bar Chart Container */}
                          <div className="relative h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-1">
                            {stageBarData.map((bar, i) => {
                              const isHovered = hoveredStageIndex === i;
                              return (
                                <Link 
                                  key={bar.stage} 
                                  href={`/projects?stage=${bar.stage}`}
                                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer relative"
                                  onMouseEnter={() => setHoveredStageIndex(i)}
                                  onMouseLeave={() => setHoveredStageIndex(null)}
                                >
                                  {/* Top Value Label */}
                                  <span className={cn(
                                    "text-[9px] font-bold transition-all whitespace-nowrap font-urbanist",
                                    isHovered ? "text-[#292D32] dark:text-white scale-110 font-black" : "text-slate-500 dark:text-slate-400"
                                  )}>
                                    {bar.displayValue.replace('SAR ', '')}
                                  </span>

                                  {/* Bar Pillar */}
                                  <div 
                                    className={cn(
                                      "w-full rounded-t-lg transition-all duration-300 relative",
                                      isHovered 
                                        ? "bg-[#8FC2F0] shadow-md ring-2 ring-[#8FC2F0]/40" 
                                        : bar.totalValue > 0 
                                          ? "bg-[#8FC2F0]/80 hover:bg-[#8FC2F0]" 
                                          : "bg-slate-200/70 dark:bg-slate-700/60 hover:bg-slate-300 dark:hover:bg-slate-600"
                                    )}
                                    style={{ height: bar.heightPercent }}
                                  />

                                  {/* Bottom Stage Label */}
                                  <div className="text-center mt-1 w-full">
                                    <span className={cn(
                                      "block text-[10px] truncate transition-colors font-urbanist",
                                      isHovered ? "font-black text-[#292D32] dark:text-white" : "font-bold text-slate-600 dark:text-slate-300"
                                    )}>
                                      {bar.shortLabel}
                                    </span>
                                    <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-bold font-urbanist">
                                      {bar.count}
                                    </span>
                                  </div>

                                  {/* Floating Hover Tooltip Card */}
                                  {isHovered && (
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30 w-56 p-3.5 bg-[#292D32] text-white rounded-2xl shadow-2xl border border-white/10 pointer-events-none text-xs animate-in zoom-in-95 duration-150 backdrop-blur-md">
                                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5 font-urbanist">
                                        <span className="font-bold text-white truncate">{bar.fullName}</span>
                                        <span className="text-[10px] font-mono text-[#8FC2F0]">{bar.shareOfTotal}% share</span>
                                      </div>
                                      <div className="text-[11px] space-y-1 font-urbanist">
                                        <div className="flex justify-between">
                                          <span className="text-slate-300">Total Value:</span>
                                          <span className="font-bold text-[#77CE69]">SAR {bar.totalValue.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-300">Project Count:</span>
                                          <span className="font-bold text-slate-100">{bar.count} deals</span>
                                        </div>
                                      </div>

                                      {bar.projects.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-white/10 text-[10px] font-urbanist">
                                          <div className="text-slate-400 font-medium mb-1">Key Deals:</div>
                                          <div className="space-y-1 max-h-24 overflow-hidden">
                                            {bar.projects.slice(0, 3).map(p => {
                                              const canAcc = canUserAccessProjectCockpit(p, currentUser);
                                              return (
                                                <div key={p.id} className="truncate text-slate-200">
                                                  • {p.name} <span className="text-slate-400">({canAcc ? formatCurrencySAR(p.estimated_value) : (isRTL ? 'محجوبة' : 'locked')})</span>
                                                </div>
                                              );
                                            })}
                                            {bar.projects.length > 3 && (
                                              <div className="text-[#8FC2F0] font-semibold italic">
                                                +{bar.projects.length - 3} more deals
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      <div className="mt-2 pt-1.5 border-t border-white/10 text-center text-[#8FC2F0] font-bold text-[10px]">
                                        {isRTL ? 'اضغط لعرض مشاريع المرحلة ←' : 'Click to view deals in stage →'}
                                      </div>
                                    </div>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 4. TYPE DONUT */}
                      {modId === 'type_donut' && (
                        <div className="crm-card p-6 sm:p-7 flex flex-col justify-between relative h-full">
                          <div className="flex items-center justify-between mb-2">
                            <h2 className="font-black text-[#292D32] dark:text-white text-sm font-urbanist">
                              {isRTL ? 'المشاريع حسب نوع الفرصة' : 'Projects by Type'}
                            </h2>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
                              {isRTL ? 'مرر للتفاصيل' : 'Hover slice'}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 my-auto relative">
                            {/* SVG Donut */}
                            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 36 36">
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="15.9155"
                                  fill="none"
                                  stroke="currentColor"
                                  className="text-slate-100 dark:text-[#232A38]"
                                  strokeWidth="4"
                                />
                                {scopedProjects.length > 0 && donutTypeData.filter(slice => slice.count > 0).map((slice, i) => {
                                  const isHovered = hoveredTypeIndex === i;
                                  return (
                                    <circle
                                      key={slice.type}
                                      cx="18"
                                      cy="18"
                                      r="15.9155"
                                      fill="none"
                                      stroke={slice.color}
                                      strokeWidth={isHovered ? "5.4" : "4"}
                                      strokeDasharray={slice.dashArray}
                                      strokeDashoffset={slice.dashOffset}
                                      strokeLinecap="butt"
                                      className="transition-all duration-200 cursor-pointer"
                                      style={{
                                        transformOrigin: '18px 18px',
                                        filter: isHovered ? `drop-shadow(0 0 4px ${slice.color})` : 'none',
                                      }}
                                      onMouseEnter={() => setHoveredTypeIndex(i)}
                                      onMouseLeave={() => setHoveredTypeIndex(null)}
                                    />
                                  );
                                })}
                              </svg>

                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                {hoveredTypeIndex !== null && donutTypeData[hoveredTypeIndex] && scopedProjects.length > 0 ? (
                                  <>
                                    <span className="text-base font-black text-slate-900 dark:text-white leading-none">
                                      {donutTypeData[hoveredTypeIndex].percentage}
                                    </span>
                                    <span className="text-[9px] text-slate-600 dark:text-slate-300 font-bold truncate max-w-[65px] mt-0.5">
                                      {donutTypeData[hoveredTypeIndex].label}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-base font-black text-slate-900 dark:text-white leading-none">{scopedProjects.length}</span>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Projects</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Interactive Legend */}
                            <div className="space-y-1.5 flex-1 min-w-0 text-[11px]">
                              {scopedProjects.length === 0 ? (
                                <div className="text-xs text-slate-400 dark:text-slate-500 font-medium italic my-auto py-3 text-center">
                                  No active projects registered for this representative
                                </div>
                              ) : (
                                donutTypeData.map((item, i) => {
                                  const isHovered = hoveredTypeIndex === i;
                                  return (
                                    <div 
                                      key={item.type} 
                                      className={cn(
                                        "flex items-center justify-between p-1 rounded-md cursor-pointer transition-colors",
                                        isHovered ? "bg-slate-100 dark:bg-[#232A38] font-bold shadow-2xs" : "hover:bg-slate-50 dark:hover:bg-[#232A38]/50"
                                      )}
                                      onMouseEnter={() => setHoveredTypeIndex(i)}
                                      onMouseLeave={() => setHoveredTypeIndex(null)}
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span 
                                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                                          style={{ backgroundColor: item.color }} 
                                        />
                                        <span className="text-slate-700 dark:text-slate-200 truncate">{item.label}</span>
                                      </div>
                                      <span className="font-bold text-slate-900 dark:text-white shrink-0 ml-1">
                                        {item.count} <span className="text-slate-400 dark:text-slate-500 font-normal">({item.percentage})</span>
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Floating Tooltip */}
                            {hoveredTypeIndex !== null && donutTypeData[hoveredTypeIndex] && (
                              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-30 w-56 p-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 pointer-events-none text-xs animate-in zoom-in-95 duration-150">
                                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: donutTypeData[hoveredTypeIndex].color }} />
                                    <span className="font-bold text-white truncate">{donutTypeData[hoveredTypeIndex].label}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-blue-400">{donutTypeData[hoveredTypeIndex].percentage}</span>
                                </div>
                                <div className="text-[11px] space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Total Value:</span>
                                    <span className="font-bold text-emerald-400">{formatCurrencySAR(donutTypeData[hoveredTypeIndex].totalValue)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Deals Count:</span>
                                    <span className="font-bold text-slate-200">{donutTypeData[hoveredTypeIndex].count} projects</span>
                                  </div>
                                </div>

                                {donutTypeData[hoveredTypeIndex].projects.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-slate-800 text-[10px]">
                                    <div className="text-slate-400 font-medium mb-1">Key Projects:</div>
                                    <div className="space-y-1 max-h-20 overflow-hidden">
                                      {donutTypeData[hoveredTypeIndex].projects.slice(0, 2).map(p => {
                                        const canAcc = canUserAccessProjectCockpit(p, currentUser);
                                        return (
                                          <div key={p.id} className="truncate text-slate-200">
                                            • {p.name} <span className="text-slate-400">({canAcc ? formatCurrencySAR(p.estimated_value) : (isRTL ? 'محجوبة' : 'locked')})</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Bottom Summary */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between h-8 shrink-0">
                            {hoveredTypeIndex !== null && donutTypeData[hoveredTypeIndex] ? (
                              <>
                                <span className="text-slate-700 dark:text-slate-300 truncate">
                                  <strong className="text-slate-900 dark:text-white">{donutTypeData[hoveredTypeIndex].label}:</strong>{' '}
                                  {formatCurrencySAR(donutTypeData[hoveredTypeIndex].totalValue)}
                                </span>
                                <span className="text-blue-600 dark:text-[#8FC2F0] font-extrabold shrink-0 ml-1">
                                  {donutTypeData[hoveredTypeIndex].count} Deals ({donutTypeData[hoveredTypeIndex].percentage})
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-slate-400 dark:text-slate-500">Total Portfolio Value</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrencySAR(totalPipelineValue)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 5. LOCATIONS */}
                      {modId === 'locations' && (
                        <div className="crm-card p-6 sm:p-7 flex flex-col justify-between h-full">
                          <div className="flex items-center justify-between mb-2">
                            <h2 className="font-black text-[#292D32] dark:text-white text-sm font-urbanist">
                              {isRTL ? 'توزيع المشاريع جغرافياً' : 'Project Locations'}
                            </h2>
                            <MapPin className="w-3.5 h-3.5 text-[#8FC2F0]" />
                          </div>

                          <div className="relative my-auto bg-slate-50/80 dark:bg-[#141820]/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between h-44">
                            {locationStats.topLocations.length === 0 ? (
                              <div className="flex flex-col items-center justify-center my-auto text-center text-xs text-slate-400 dark:text-slate-500">
                                <MapPin className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
                                <span>No location data</span>
                              </div>
                            ) : (
                              <div className="space-y-1.5 overflow-y-auto pr-1">
                                {locationStats.topLocations.map((loc, idx) => {
                                  const colors = ['bg-[#8FC2F0]', 'bg-[#77CE69]', 'bg-amber-400', 'bg-purple-400', 'bg-rose-400'];
                                  return (
                                    <div key={loc.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-100/80 dark:border-[#292D32]/40 last:border-0 font-urbanist">
                                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate">
                                        <span className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`} /> 
                                        {loc.name}
                                      </span>
                                      <span className="font-black text-[#292D32] dark:text-white bg-white dark:bg-[#232A38] px-2 py-0.5 rounded-full border border-slate-200/70 dark:border-[#8FC2F0]/15 shadow-2xs">
                                        {loc.count}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right pt-2 border-t border-slate-100 dark:border-[#292D32]/60 font-bold font-sans">
                              {locationStats.otherCount > 0 ? (isRTL ? `+${locationStats.otherCount} في مدن أخرى بالمملكة` : `+${locationStats.otherCount} across other KSA cities`) : (isRTL ? `${locationStats.totalLocations} مدن نشطة` : `${locationStats.totalLocations} Active Cities`)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 6. ATTENTION CENTER */}
                      {modId === 'attention_center' && (
                        <div className="crm-card p-6 sm:p-7 flex flex-col justify-between border-rose-200/60 dark:border-rose-900/30 h-full">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="w-4 h-4 text-rose-500" />
                              <h2 className="font-black text-[#292D32] dark:text-white text-sm font-urbanist">
                                {isRTL ? 'مركز التنبيهات العاجلة' : 'Attention Center'}
                              </h2>
                            </div>

                            <div className="space-y-2 text-xs font-sans">
                              {/* Pending Approvals */}
                              {pendingApprovals.length > 0 && (
                                <button 
                                  onClick={() => openRequestDetail(pendingApprovals[0].id)}
                                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-all border border-amber-400/40 dark:border-amber-500/25 text-left cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                    <span className="font-bold text-amber-950 dark:text-amber-300">
                                      {isRTL ? 'طلبات بانتظار الاعتماد' : 'Pending Approvals'}
                                    </span>
                                  </div>
                                  <span className="font-black text-xs text-amber-800 dark:text-amber-300 bg-white dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30">
                                    {pendingApprovals.length} {isRTL ? 'جديد' : 'new'}
                                  </span>
                                </button>
                              )}

                              {/* Overdue Follow-ups */}
                              <Link 
                                href="/projects" 
                                className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-900/10 dark:hover:bg-rose-900/20 transition-all border border-rose-100/60 dark:border-rose-500/20"
                              >
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {isRTL ? 'مشاريع متأخرة' : 'Overdue Deals'}
                                  </span>
                                </div>
                                <span className="font-black text-xs text-rose-600 dark:text-rose-400 bg-white dark:bg-rose-900/30 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/30 font-mono">
                                  {overdueProjects.length}
                                </span>
                              </Link>

                              {/* Due Today */}
                              <Link 
                                href="/my-day" 
                                className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 transition-all border border-amber-100/60 dark:border-amber-500/20"
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {isRTL ? 'يستحق اليوم' : 'Due Today'}
                                  </span>
                                </div>
                                <span className="font-black text-xs text-amber-600 dark:text-amber-400 bg-white dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30 font-mono">
                                  {dueTodayProjects.length}
                                </span>
                              </Link>

                              {/* No Next Action */}
                              <Link 
                                href="/projects" 
                                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/70 hover:bg-slate-100/70 dark:bg-[#232A38]/60 dark:hover:bg-[#232A38] transition-all border border-slate-100 dark:border-[#292D32]/60"
                              >
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {isRTL ? 'بدون إجراء قادم' : 'No Next Action'}
                                  </span>
                                </div>
                                <span className="font-black text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1C2130] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-[#8FC2F0]/12 font-mono">
                                  {noNextActionProjects.length}
                                </span>
                              </Link>

                              {/* Stale Projects (> 30 days) */}
                              <Link 
                                href="/projects" 
                                className="flex items-center justify-between p-2.5 rounded-2xl bg-[#8FC2F0]/10 hover:bg-[#8FC2F0]/20 dark:bg-[#8FC2F0]/08 dark:hover:bg-[#8FC2F0]/15 transition-all border border-[#8FC2F0]/20 dark:border-[#8FC2F0]/15"
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-[#8FC2F0]" />
                                  <span className="font-bold text-[#292D32] dark:text-[#8FC2F0]">
                                    {isRTL ? 'صفقات راكدة (> 30 يوم)' : 'Stale Deals (>30d)'}
                                  </span>
                                </div>
                                <span className="font-black text-xs text-[#292D32] dark:text-white bg-white dark:bg-[#1C2130] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-[#8FC2F0]/15 font-mono">
                                  {staleProjects.length}
                                </span>
                              </Link>

                              {/* High Value At Risk */}
                              <Link 
                                href="/projects" 
                                className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-900/10 dark:hover:bg-rose-900/20 transition-all border border-rose-100/60 dark:border-rose-500/20"
                              >
                                <div className="flex items-center gap-2">
                                  <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {isRTL ? 'صفقات كبرى معرضة للخطر (≥1M)' : 'High Value At Risk (≥1M)'}
                                  </span>
                                </div>
                                <span className="font-black text-xs text-rose-600 dark:text-rose-400 bg-white dark:bg-rose-900/30 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/30 font-mono">
                                  {highValueAtRiskProjects.length}
                                </span>
                              </Link>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-[#292D32]/60 text-right mt-3 font-sans">
                            <Link href="/projects" className="text-xs font-bold text-[#292D32] dark:text-[#8FC2F0] hover:text-[#8FC2F0] dark:hover:text-white inline-flex items-center gap-1 transition-colors">
                              <span>{isRTL ? 'عرض كافة المشاريع' : 'View All Projects'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* 7. MINI KANBAN */}
                      {modId === 'mini_kanban' && (
                        <div className="crm-card p-6 sm:p-7">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h2 className="font-extrabold text-[#292D32] dark:text-white text-base font-urbanist tracking-tight">
                                {isRTL ? 'مسار المشاريع المصغر' : 'Project Pipeline Preview'}
                              </h2>
                              <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">
                                {isRTL ? 'اضغط على أي مشروع لفتح لوحة تفاصيله' : 'Click on any project card to open its detail cockpit'}
                              </p>
                            </div>
                            <Link href="/projects" className="px-4 py-1.5 rounded-full text-xs font-bold text-[#292D32] dark:text-[#8FC2F0] bg-slate-100 dark:bg-[#1C2130] hover:bg-slate-200 dark:hover:bg-[#232A38] border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 transition-all">
                              <span>{isRTL ? 'عرض لوحة كانبان الكاملة' : 'View Full Pipeline Kanban'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>

                          {/* Horizontal Mini-Kanban: 7 Pipeline Stages */}
                          <div className="overflow-x-auto pb-2">
                            <div className="flex gap-3.5 min-w-[1400px]">
                              {miniKanbanStages.map((col) => (
                                <div 
                                  key={col.stage} 
                                  className="flex-1 min-w-[200px] bg-white/40 dark:bg-[#1C2130]/60 backdrop-blur-md rounded-2xl p-3.5 border border-white/80 dark:border-[#8FC2F0]/08 shadow-2xs flex flex-col justify-start"
                                >
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-[#292D32]/60 mb-2.5 font-urbanist shrink-0">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span 
                                        className="w-2 h-2 rounded-full shrink-0" 
                                        style={{ backgroundColor: col.color }} 
                                        title={col.label} 
                                      />
                                      <span className="font-black text-xs text-[#292D32] dark:text-white truncate" title={col.label}>
                                        {col.label}
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#232A38] px-1.5 py-0.2 rounded-full border border-slate-200/60 dark:border-[#292D32]/60 shrink-0">
                                        {col.count}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-black text-[#292D32] dark:text-white shrink-0 font-urbanist">
                                      {col.totalValueFormatted}
                                    </span>
                                  </div>

                                  <div className="space-y-2.5 flex-1 flex flex-col justify-start">
                                    {col.projects.slice(0, 3).map((project) => (
                                      <MiniKanbanCard
                                        key={project.id}
                                        project={project}
                                        isRTL={isRTL}
                                        onUpdateColor={handleUpdateProjectColor}
                                      />
                                    ))}

                                    {col.projects.length === 0 && (
                                      <div className="py-8 text-center text-slate-400 text-[11px] italic font-sans my-auto">
                                        {isRTL ? 'لا توجد مشاريع في هذه المرحلة' : 'No projects in this stage'}
                                      </div>
                                    )}

                                    {col.projects.length > 3 && (
                                      <Link 
                                        href="/projects" 
                                        className="block text-center py-1.5 text-[10px] font-bold text-[#292D32] dark:text-[#8FC2F0] hover:underline bg-white/70 dark:bg-[#232A38]/70 rounded-xl border border-slate-200/60 dark:border-[#292D32]/60 font-sans mt-1"
                                      >
                                        +{col.projects.length - 3} {isRTL ? 'مشاريع إضافية' : 'more in this stage'}
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 8. RECENT PROJECTS */}
                      {modId === 'recent_projects' && (
                        <div className="crm-card p-6 sm:p-7 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h2 className="font-extrabold text-[#292D32] dark:text-white text-base font-urbanist tracking-tight">
                                  {isRTL ? 'أحدث المشاريع' : 'Recent Projects'}
                                </h2>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">
                                  {isRTL ? 'مرتبة من الأحدث إلى الأقدم حسب آخر نشاط وتحديث' : 'Sorted newest to oldest by last activity and updates'}
                                </p>
                              </div>
                              <Link href="/projects" className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#292D32] dark:text-[#8FC2F0] bg-slate-100 dark:bg-[#1C2130] hover:bg-slate-200 dark:hover:bg-[#232A38] border border-slate-200/80 dark:border-slate-800 font-sans transition-all">
                                {isRTL ? 'عرض كافة المشاريع ←' : 'View All Projects →'}
                              </Link>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs font-sans">
                                <thead className="text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-[#292D32]/60">
                                  <tr>
                                    <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">{isRTL ? 'المشروع' : 'Project'}</th>
                                    <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">{isRTL ? 'العميل / المقاول' : 'Client / Contractor'}</th>
                                    <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">{isRTL ? 'القيمة' : 'Value'}</th>
                                    <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">{isRTL ? 'المرحلة' : 'Stage'}</th>
                                    <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">{t('nextAction')}</th>
                                    <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">{isRTL ? 'المتابعة القادمة' : 'Next Follow-up'}</th>
                                    <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">{isRTL ? 'آخر نشاط' : 'Last Activity'}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/60 dark:divide-[#292D32]/50">
                                  {sortedRecentProjects.map((p) => {
                                    const stageConfig = PIPELINE_STAGES.find(s => s.value === p.pipeline_stage);
                                    const canAcc = canUserAccessProjectCockpit(p, currentUser);

                                    return (
                                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-[#232A38]/50 transition-colors group">
                                        <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-200">
                                          {canAcc ? (
                                            <Link href={`/projects/${p.id}`} className="hover:text-[#8FC2F0] transition-colors flex items-center gap-1.5 font-urbanist">
                                              <span className="truncate max-w-[170px]">{p.name}</span>
                                              <span className="text-[10px] font-mono text-slate-400 font-bold">({p.pr_number})</span>
                                            </Link>
                                          ) : (
                                            <div className="flex items-center gap-1.5 font-urbanist text-slate-700 dark:text-slate-300">
                                              <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                                              <span className="truncate max-w-[170px]">{p.name}</span>
                                              <span className="text-[10px] font-mono text-slate-400 font-bold">({p.pr_number})</span>
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-3 px-2 text-slate-600 dark:text-slate-400 truncate max-w-[130px] font-urbanist">{p.company_name}</td>
                                        <td className="py-3 px-2 font-black text-[#292D32] dark:text-white font-urbanist">
                                          {canAcc ? (
                                            formatCurrencySAR(p.estimated_value)
                                          ) : (
                                            <span className="font-bold text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1">
                                              <Lock className="w-2.5 h-2.5" />
                                              <span>{isRTL ? 'محجوبة' : 'Locked'}</span>
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-3 px-2">
                                          {canAcc ? (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageConfig?.badgeClass || 'bg-slate-100 dark:bg-[#232A38] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                                              {isRTL ? stageConfig?.labelAr || stageConfig?.label : stageConfig?.label || p.pipeline_stage}
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#232A38] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                                              <Lock className="w-2.5 h-2.5 text-amber-500" />
                                              <span>{isRTL ? 'محجوبة' : 'Locked'}</span>
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-3 px-2 text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{canAcc ? (p.next_action || '-') : '-'}</td>
                                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{canAcc ? formatDateString(p.next_follow_up_at) : '-'}</td>
                                        <td className="py-3 px-2 text-slate-400 font-mono text-[11px]">{formatRelativeTime(p.updated_at)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-[#292D32]/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mt-3 font-sans">
                            <span>{isRTL ? `عرض ${sortedRecentProjects.length} من أصل ${scopedProjects.length} مشروع نشط` : `Showing ${sortedRecentProjects.length} of ${scopedProjects.length} authentic projects`}</span>
                            <Link href="/projects" className="font-bold text-[#292D32] dark:text-[#8FC2F0] hover:text-[#8FC2F0] dark:hover:text-white transition-colors">
                              {isRTL ? 'عرض كافة المشاريع ←' : 'View All Projects →'}
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* 9. WEEK ACTIVITIES */}
                      {modId === 'week_activities' && (
                        <div className="crm-card p-6 sm:p-7 flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h2 className="font-extrabold text-[#292D32] dark:text-white text-base font-urbanist tracking-tight">
                                  {isRTL ? 'أنشطة الأسبوع الجارية' : "This Week's Activities"}
                                </h2>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">
                                  {isRTL ? 'سجل تفاعلات المناديب والزيارات والاتصالات المباشرة' : 'Live feed of rep client interactions'}
                                </p>
                              </div>
                              <Link href="/activities" className="text-xs font-bold text-[#292D32] dark:text-[#8FC2F0] hover:text-[#8FC2F0] dark:hover:text-white font-sans transition-colors">
                                {isRTL ? 'عرض الكل ←' : 'View All →'}
                              </Link>
                            </div>

                            {recentActivitiesList.length === 0 ? (
                              <div className="p-8 text-center flex flex-col items-center justify-center my-auto">
                                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-[#232A38] flex items-center justify-center text-slate-400 mb-2">
                                  <CheckCircle2 className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                </div>
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">No activities recorded this week</div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Use Fast Log to record calls, visits &amp; meetings</div>
                              </div>
                            ) : (
                              <div className="space-y-3.5">
                                {recentActivitiesList.map((act) => {
                                  const channelIcon = 
                                    act.channel === 'call' ? Phone :
                                    act.channel === 'meeting_f2f' || act.channel === 'meeting_online' ? Video :
                                    act.channel === 'visit' || act.channel === 'hunting' ? MapPin : Send;

                                  const Icon = channelIcon;

                                  return (
                                    <div key={act.id} className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-2xl hover:bg-white/80 dark:hover:bg-[#232A38]/80 transition-colors border border-transparent hover:border-white/80 dark:hover:border-[#8FC2F0]/08 hover:shadow-2xs">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-[#8FC2F0]/20 dark:bg-[#8FC2F0]/10 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shrink-0 border border-[#8FC2F0]/30 dark:border-[#8FC2F0]/20 font-urbanist">
                                          <Icon className="w-4 h-4 text-[#8FC2F0]" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-bold text-[#292D32] dark:text-slate-100 truncate font-urbanist">{act.title}</span>
                                            <span 
                                              className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#8FC2F0]/15 dark:bg-[#8FC2F0]/10 text-[#292D32] dark:text-[#8FC2F0] border border-[#8FC2F0]/30 dark:border-[#8FC2F0]/20 shrink-0 font-urbanist shadow-2xs"
                                              title={`Logged by ${act.userName}`}
                                            >
                                              <span className="w-1.5 h-1.5 rounded-full bg-[#8FC2F0]" />
                                              <span>{act.userName}</span>
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate font-urbanist">{act.subtext} • {act.date}</div>
                                        </div>
                                      </div>

                                      <div className="shrink-0 flex items-center gap-1.5">
                                        <span className="bg-white dark:bg-[#1C2130] text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-[#8FC2F0]/12 shadow-2xs font-urbanist">
                                          {act.outcome}
                                        </span>
                                        <CheckCircle2 className="w-4 h-4 text-[#77CE69]" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-slate-100 dark:border-[#292D32]/60 mt-4 text-center font-urbanist">
                            <Link 
                              href="/activities" 
                              className="text-xs font-bold text-[#292D32] dark:text-[#8FC2F0] hover:text-[#8FC2F0] dark:hover:text-white transition-colors block"
                            >
                              Go to Fast Activity Tracker &rarr;
                            </Link>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Hidden Widget Placeholder when in Edit Mode */
                    <div className="crm-card p-5 flex items-center justify-between border-dashed border-2 border-slate-300 dark:border-[#292D32] opacity-75">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#232A38] flex items-center justify-center text-slate-400">
                          <EyeOff className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {isRTL ? modInfo?.labelAr : modInfo?.labelEn}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {isRTL ? 'هذا الكارت مخفي حالياً من شاشة المؤشرات' : 'This widget is currently hidden from dashboard view'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleModule(modId)}
                        className="px-3 py-1.5 rounded-xl bg-[#8FC2F0]/20 hover:bg-[#8FC2F0]/30 text-[#292D32] dark:text-[#8FC2F0] text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isRTL ? 'إظهار الكارت' : 'Unhide'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
    </div>
  )}

      {/* ========================================================================= */}
      {/* CUSTOMIZE DASHBOARD MODAL */}
      {/* ========================================================================= */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2130] rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-[#8FC2F0]/12 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#292D32]/60 bg-slate-50 dark:bg-[#141820] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] flex items-center justify-center shadow-xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {isRTL ? 'تخصيص أقسام لوحة المؤشرات' : 'Customize Dashboard Modules'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isRTL ? 'اختر الأقسام التي تود ظهورها في واجهة المبيعات' : 'Choose which sections appear on your sales overview'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCustomizeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-[#232A38] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Ordered Module Customizer */}
            <div className="p-6 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {isRTL ? `ترتيب الأقسام (${activeModulesCount} من ${ALL_MODULES.length} مفعل)` : `Dashboard Layout (${activeModulesCount} of ${ALL_MODULES.length} Active)`}
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button 
                    onClick={() => setAllModules(true)}
                    className="text-[#8FC2F0] font-bold hover:underline"
                  >
                    {isRTL ? 'تحديد الكل' : 'Select All'}
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <button 
                    onClick={() => setAllModules(false)}
                    className="text-slate-500 dark:text-slate-400 font-medium hover:underline"
                  >
                    {isRTL ? 'إخفاء الكل' : 'Hide All'}
                  </button>
                </div>
              </div>

              {moduleOrder.map((modId, index) => {
                const mod = ALL_MODULES.find(m => m.id === modId);
                if (!mod) return null;
                const isChecked = visibleModules[modId];
                const isFirst = index === 0;
                const isLast = index === moduleOrder.length - 1;

                return (
                  <div 
                    key={modId}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-xl border transition-all select-none group",
                      isChecked 
                        ? "bg-white dark:bg-[#1C2130] border-slate-200 dark:border-[#8FC2F0]/20 shadow-2xs" 
                        : "bg-slate-50/70 dark:bg-[#232A38]/40 border-slate-200/60 dark:border-[#292D32]/40 opacity-70"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-[#232A38] text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center font-mono shrink-0 border border-slate-200/80 dark:border-white/10">
                        #{index + 1}
                      </span>
                      
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleModule(modId)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-[#292D32] text-[#8FC2F0] focus:ring-[#8FC2F0] cursor-pointer shrink-0"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-bold text-xs truncate", isChecked ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500")}>
                            {isRTL ? mod.labelAr : mod.labelEn}
                          </span>
                          {!isChecked && (
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-[#232A38] px-1.5 py-0.2 rounded-full">
                              {isRTL ? 'مخفي' : 'Hidden'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-xs sm:max-w-sm">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Module Size Selector */}
                      <div className="hidden sm:flex items-center bg-slate-100 dark:bg-[#141820] rounded-lg p-0.5 border border-slate-200/80 dark:border-slate-800 mx-1">
                        {([4, 6, 8, 12] as ModuleGridSpan[]).map((span) => {
                          const currentSpan = moduleSizes[modId] || DEFAULT_MODULE_SIZES[modId] || 12;
                          const isCurrent = currentSpan === span;
                          const label = span === 4 ? '1/3' : span === 6 ? '1/2' : span === 8 ? '2/3' : (isRTL ? 'كامل' : 'Full');
                          return (
                            <button
                              key={span}
                              type="button"
                              onClick={() => updateModuleSize(modId, span)}
                              className={cn(
                                "px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer",
                                isCurrent 
                                  ? "bg-[#8FC2F0] text-[#141820] font-black shadow-2xs" 
                                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                              )}
                              title={isRTL ? `عرض الكارت: ${label}` : `Card width: ${label}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => moveModuleToTop(modId)}
                        disabled={isFirst}
                        title={isRTL ? 'نقل للأعلى تماماً' : 'Move to Top'}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          isFirst ? "text-slate-300 dark:text-slate-600 cursor-not-allowed" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#232A38]"
                        )}
                      >
                        <ArrowUpToLine className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveModuleUp(modId)}
                        disabled={isFirst}
                        title={isRTL ? 'تحريك لأعلى' : 'Move Up'}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          isFirst ? "text-slate-300 dark:text-slate-600 cursor-not-allowed" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#232A38]"
                        )}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveModuleDown(modId)}
                        disabled={isLast}
                        title={isRTL ? 'تحريك لأسفل' : 'Move Down'}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          isLast ? "text-slate-300 dark:text-slate-600 cursor-not-allowed" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#232A38]"
                        )}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-[#292D32]/60 bg-slate-50 dark:bg-[#141820] flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={resetToDefaultLayout}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isRTL ? 'استعادة الترتيب الافتراضي' : 'Reset to Default'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomizeModalOpen(false);
                    setIsEditMode(true);
                  }}
                  className="flex items-center gap-1 px-3.5 py-2 bg-slate-100 dark:bg-[#232A38] hover:bg-slate-200 dark:hover:bg-[#2c3547] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'تعديل مباشر على الشاشة' : 'Live Reorder'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCustomizeModalOpen(false)}
                  className="px-5 py-2 bg-[#292D32] dark:bg-[#8FC2F0] hover:bg-slate-800 dark:hover:bg-[#7AB5E8] text-white dark:text-[#141820] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isRTL ? 'تم' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
