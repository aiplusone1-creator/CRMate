'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSalesScope } from '@/lib/hooks/useSalesScope';
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
  Lock,
  Plus,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  PieChart,
  Building2,
  Compass,
  Award,
  Disc,
  Flag
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { formatCurrencySAR, formatDateString, formatRelativeTime, cn } from '@/lib/utils';
import { PIPELINE_STAGES, PROJECT_CARD_COLORS } from '@/lib/constants';
import { PipelineStage, OpportunityType, Project } from '@/types/crm';
import { ExecutiveManagerCockpit } from '@/components/dashboard/executive-manager-cockpit';
import { SmartSuggestionsTab } from '@/components/dashboard/smart-suggestions-tab';
import { ModuleGuideDrawer } from '@/components/guide/module-guide-drawer';
import { scopeProjects, scopeActivities, scopeRequests, canUserAccessProjectCockpit } from '@/lib/logic/scope';
import { calculatePipelineForecast } from '@/lib/logic/pipeline-analytics';
import { formatCompactSAR } from '@/lib/logic/quotation-pricing';
import { useLanguage } from '@/lib/i18n/language-context';

// -------------------------------------------------------------
// MODULE CONFIGURATION FOR REORDER & CUSTOMIZATION
// -------------------------------------------------------------
export type DashboardModuleId = 
  | 'kpis'
  | 'needs_attention'
  | 'quick_actions'
  | 'my_week'
  | 'stage_chart'
  | 'opportunity_mix'
  | 'mini_kanban'
  | 'motivation';

export type ModuleGridSpan = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;

interface ModuleConfig {
  id: DashboardModuleId;
  labelEn: string;
  labelAr: string;
  defaultSpan: ModuleGridSpan;
}

const ALL_MODULES: ModuleConfig[] = [
  { id: 'kpis', labelEn: 'Top 6 KPI Cards', labelAr: 'مؤشرات الأداء الرئيسية الستة', defaultSpan: 12 },
  { id: 'needs_attention', labelEn: 'Needs Your Attention', labelAr: 'ما يحتاج اهتمامك', defaultSpan: 5 },
  { id: 'quick_actions', labelEn: 'Quick Actions', labelAr: 'إجراءات سريعة', defaultSpan: 4 },
  { id: 'my_week', labelEn: 'My Week Focus', labelAr: 'خطة أسبوعي', defaultSpan: 3 },
  { id: 'stage_chart', labelEn: 'Pipeline Value by Stage', labelAr: 'قيمة المسار حسب المرحلة', defaultSpan: 7 },
  { id: 'opportunity_mix', labelEn: 'Active Opportunity Mix', labelAr: 'مزيج الفرص النشطة', defaultSpan: 5 },
  { id: 'mini_kanban', labelEn: 'Project Pipeline Preview', labelAr: 'مسار المشاريع المصغر', defaultSpan: 9 },
  { id: 'motivation', labelEn: 'Sales Momentum Card', labelAr: 'بطاقة التحفيز وعزم المبيعات', defaultSpan: 3 },
];

const DEFAULT_MODULE_ORDER: DashboardModuleId[] = [
  'kpis',
  'needs_attention',
  'quick_actions',
  'my_week',
  'stage_chart',
  'opportunity_mix',
  'mini_kanban',
  'motivation',
];

const DEFAULT_VISIBLE_MODULES: Record<DashboardModuleId, boolean> = {
  kpis: true,
  needs_attention: true,
  quick_actions: true,
  my_week: true,
  stage_chart: true,
  opportunity_mix: true,
  mini_kanban: true,
  motivation: true,
};

const DEFAULT_MODULE_SIZES: Record<DashboardModuleId, ModuleGridSpan> = {
  kpis: 12,
  needs_attention: 5,
  quick_actions: 4,
  my_week: 3,
  stage_chart: 7,
  opportunity_mix: 5,
  mini_kanban: 9,
  motivation: 3,
};

const STORAGE_KEY = 'al_mespar_dashboard_visible_modules_v3';
const ORDER_STORAGE_KEY = 'al_mespar_dashboard_module_order_v3';

// -------------------------------------------------------------
// SVG DRAWING HELPERS (SPARKLINE & CIRCULAR QUOTA GAUGE)
// -------------------------------------------------------------
function Sparkline({ 
  data, 
  color, 
  height = 24 
}: { 
  data: number[]; 
  color: string; 
  height?: number;
}) {
  const points = useMemo(() => {
    if (!data || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 100;
    const padding = 2;
    
    const pts = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return [x, y] as [number, number];
    });

    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const cpx1 = x0 + (x1 - x0) / 2;
      const cpy1 = y0;
      const cpx2 = x0 + (x1 - x0) / 2;
      const cpy2 = y1;
      d += ` C ${cpx1},${cpy1} ${cpx2},${cpy2} ${x1},${y1}`;
    }
    return d;
  }, [data, height]);

  if (!points) return null;

  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full h-5 md:h-6 overflow-visible" preserveAspectRatio="none">
      <path 
        d={points} 
        fill="none" 
        stroke={color} 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

function CircularQuotaGauge({ 
  percentage, 
  size = 46, 
  strokeWidth = 4.5 
}: { 
  percentage: number; 
  size?: number; 
  strokeWidth?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0088FF"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black font-urbanist text-[#292D32] dark:text-white">
        {clamped}%
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MINI KANBAN CARD
// -------------------------------------------------------------
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

  const effectiveColorId = useMemo(() => {
    if (project.pipeline_stage === 'won') return 'emerald';
    if (project.pipeline_stage === 'lost') return 'rose';
    return project.card_color || project.base_card_color || 'default';
  }, [project.pipeline_stage, project.card_color, project.base_card_color]);

  const colorConfig = PROJECT_CARD_COLORS.find(c => c.id === effectiveColorId) || PROJECT_CARD_COLORS[0];

  const healthColor = 
    project.calculated_health === 'red' ? 'bg-rose-500' :
    project.calculated_health === 'yellow' ? 'bg-amber-500' :
    project.calculated_health === 'green' ? 'bg-[#77CE69]' : 'bg-slate-400';

  const healthReasonText = useMemo(() => {
    if (project.pipeline_stage === 'won' || project.pipeline_stage === 'lost' || project.pipeline_stage === 'hold') {
      return isRTL ? 'مغلق' : 'Closed';
    }
    if (project.calculated_health === 'red') {
      if (project.days_overdue && project.days_overdue > 0) {
        return isRTL ? `متأخر ${project.days_overdue} يوم` : `${project.days_overdue}d late`;
      }
      if (!project.next_action) {
        return isRTL ? 'بدون إجراء' : 'No action';
      }
      return isRTL ? 'تجاوز المهلة' : 'SLA breach';
    }
    if (project.calculated_health === 'yellow') {
      return isRTL ? 'متابعة قريبة' : 'Due soon';
    }
    return isRTL ? 'منتظم' : 'Healthy';
  }, [project.pipeline_stage, project.calculated_health, project.days_overdue, project.next_action, isRTL]);

  const cardClasses = colorConfig.cardClass
    ? `${colorConfig.cardClass} shadow-2xs`
    : 'bg-white dark:bg-[#1C2130] border border-slate-200/80 dark:border-white/10 hover:border-[#8FC2F0]/50 shadow-2xs';

  return (
    <div className={`p-2 rounded-xl group transition-all duration-150 relative text-[11px] ${cardClasses}`}>
      {/* Top Bar: PR Number & Health Badge */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] font-bold text-[#292D32] dark:text-[#8FC2F0] bg-[#8FC2F0]/20 dark:bg-[#8FC2F0]/10 px-1.5 py-0.5 rounded-full border border-[#8FC2F0]/30 font-urbanist">
          {project.pr_number}
        </span>
        
        <div className="flex items-center gap-1">
          <span 
            className={cn(
              "inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[10px] font-bold border transition-colors",
              project.calculated_health === 'red' 
                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/50" 
                : project.calculated_health === 'yellow'
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/50"
                : project.calculated_health === 'green'
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50"
                : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
            )}
            title={`Health: ${project.calculated_health} (${healthReasonText})`}
          >
            <span className={`w-1 h-1 rounded-full ${healthColor}`} />
            <span className="font-sans leading-none">{healthReasonText}</span>
          </span>
          
          {canAccess && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsColorPickerOpen(!isColorPickerOpen);
                }}
                className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all opacity-60 group-hover:opacity-100 cursor-pointer"
                title={isRTL ? "تغيير لون كارت المشروع" : "Change card color"}
              >
                <Palette className="w-2.5 h-2.5 text-slate-500 hover:text-[#8FC2F0]" />
              </button>

              {isColorPickerOpen && (
                <div 
                  ref={colorPickerRef}
                  className={`absolute z-50 top-5 ${isRTL ? 'left-0' : 'right-0'} bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-1 flex items-center gap-1 backdrop-blur-md`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {PROJECT_CARD_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsColorPickerOpen(false);
                        await onUpdateColor(project.id, c.id);
                      }}
                      className={`w-3.5 h-3.5 rounded-full border ${c.dotClass} hover:scale-125 transition-transform`}
                      title={c.name}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Project Name */}
      {canAccess ? (
        <Link 
          href={`/projects/${project.id}`}
          className="block font-bold text-[#292D32] dark:text-slate-100 text-[11px] truncate hover:text-[#0088FF] transition-colors font-sans"
          title={project.name}
        >
          {project.name}
        </Link>
      ) : (
        <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 text-[11px] truncate font-sans">
          <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
          <span className="truncate">{project.name}</span>
        </div>
      )}

      {/* Company Name */}
      <div className="text-[10px] text-slate-400 truncate mt-0.5 font-sans">
        {project.company_name || (isRTL ? 'عميل' : 'Client')}
      </div>

      {/* Owner */}
      <div className="text-[10px] text-slate-400 truncate mt-0.5 font-sans">
        <span>{isRTL ? 'المالك:' : 'Owner:'} </span>
        <span className="font-medium text-slate-600 dark:text-slate-300">{project.owner_name || 'Eslam Mohandes'}</span>
      </div>

      {/* Estimated Value */}
      <div className="font-black text-[#292D32] dark:text-white text-[11px] mt-1 font-urbanist">
        {canAccess ? (
          formatCurrencySAR(project.estimated_value)
        ) : (
          <span className="text-amber-500 text-[10px]">Locked</span>
        )}
      </div>

      {/* Location & Open Link */}
      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5 font-sans">
        <span className="truncate max-w-[80px] flex items-center gap-0.5">
          <MapPin className="w-2 h-2 text-[#0088FF] shrink-0" />
          <span className="truncate">{project.location}</span>
        </span>
        {canAccess && (
          <Link 
            href={`/projects/${project.id}`}
            className="text-[#0088FF] font-bold hover:underline flex items-center gap-0.5 shrink-0"
          >
            {isRTL ? 'فتح' : 'Open'} <ExternalLink className="w-2 h-2" />
          </Link>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MAIN DASHBOARD PAGE
// -------------------------------------------------------------
export default function DashboardPage() {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  const { 
    projects, 
    contacts, 
    companies,
    activities,
    plannedActivities,
    quotations,
    salesTargets,
    currentUser,
    currentRole,
    teamMembers,
    selectedSalesFilter,
    setSelectedSalesFilter,
    requests,
    openRequestDetail,
    updateProject,
    openFastLog,
    openNewProjectModal,
    openNewContactModal,
  } = useCRM();

  const router = useRouter();
  const { isManager, scopedProjects, scopedActivities } = useSalesScope();

  // Tab & Customization State
  const [dashboardTab, setDashboardTabState] = useState<'overview' | 'suggestions' | 'team'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('al_mespar_dashboard_tab');
      if (saved === 'overview' || saved === 'suggestions' || saved === 'team') return saved;
    }
    return 'overview';
  });
  const setDashboardTab = React.useCallback((tab: 'overview' | 'suggestions' | 'team') => {
    setDashboardTabState(tab);
    try { sessionStorage.setItem('al_mespar_dashboard_tab', tab); } catch {}
  }, []);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [moduleOrder, setModuleOrder] = useState<DashboardModuleId[]>(DEFAULT_MODULE_ORDER);
  const [visibleModules, setVisibleModules] = useState<Record<DashboardModuleId, boolean>>(DEFAULT_VISIBLE_MODULES);
  const [draggedModuleId, setDraggedModuleId] = useState<DashboardModuleId | null>(null);
  const [dragOverModuleId, setDragOverModuleId] = useState<DashboardModuleId | null>(null);

  // Load saved preferences
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem(ORDER_STORAGE_KEY);
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(id => DEFAULT_MODULE_ORDER.includes(id));
          const missing = DEFAULT_MODULE_ORDER.filter(id => !valid.includes(id));
          setModuleOrder([...valid, ...missing]);
        }
      }
      const savedVis = localStorage.getItem(STORAGE_KEY);
      if (savedVis) {
        setVisibleModules(prev => ({ ...prev, ...JSON.parse(savedVis) }));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveOrder = (newOrder: DashboardModuleId[]) => {
    setModuleOrder(newOrder);
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(newOrder));
    } catch {
      // ignore
    }
  };

  const toggleModuleVisible = (id: DashboardModuleId) => {
    setVisibleModules(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const moveModule = (id: DashboardModuleId, dir: 'up' | 'down') => {
    const idx = moduleOrder.indexOf(id);
    if (idx === -1) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= moduleOrder.length) return;
    const next = [...moduleOrder];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    saveOrder(next);
  };

  const resetToDefaultLayout = () => {
    setModuleOrder(DEFAULT_MODULE_ORDER);
    setVisibleModules(DEFAULT_VISIBLE_MODULES);
    try {
      localStorage.removeItem(ORDER_STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Interactive Chart Tooltips & Slices State
  const [hoveredStageIndex, setHoveredStageIndex] = useState<number | null>(null);
  const [hoveredMixType, setHoveredMixType] = useState<string | null>(null);
  const [hoveredRfqType, setHoveredRfqType] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayFormattedHeader = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [isRTL]);

  // -------------------------------------------------------------
  // DYNAMIC CALCULATIONS (100% Real CRM Data)
  // -------------------------------------------------------------
  const activeProjects = useMemo(() => {
    return scopedProjects.filter(p => !['won', 'lost', 'hold'].includes(p.pipeline_stage));
  }, [scopedProjects]);
  const activeProjectsCount = activeProjects.length;

  const totalPipelineValue = useMemo(() => {
    return activeProjects.reduce((acc, p) => acc + (p.estimated_value || 0), 0);
  }, [activeProjects]);

  const quotationProjects = useMemo(() => {
    return scopedProjects.filter(p => p.pipeline_stage === 'quotation_sent');
  }, [scopedProjects]);

  const latestQuotationValue = useMemo(() => {
    let sum = 0;
    scopedProjects.forEach(p => {
      if (['won', 'lost'].includes(p.pipeline_stage)) return;
      const pQuotes = quotations
        .filter(q => q.project_id === p.id && !q.is_archived)
        .sort((a, b) => b.version - a.version);
      if (pQuotes.length > 0 && pQuotes[0].amount > 0) {
        sum += pQuotes[0].amount;
      } else if (['quotation_sent', 'technical_submission', 'technically_approved', 'negotiation'].includes(p.pipeline_stage)) {
        sum += (p.estimated_value || 0);
      }
    });
    return sum;
  }, [scopedProjects, quotations]);

  const wonProjects = useMemo(() => {
    return scopedProjects.filter(p => p.pipeline_stage === 'won');
  }, [scopedProjects]);
  const wonValue = useMemo(() => {
    return wonProjects.reduce((acc, p) => acc + (p.estimated_value || 0), 0);
  }, [wonProjects]);

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

  const staleProjects = useMemo(() => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const limitStr = fourteenDaysAgo.toISOString().split('T')[0];
    return activeProjects.filter(p => {
      if (!p.last_activity_at) return true;
      return p.last_activity_at.split('T')[0] < limitStr;
    });
  }, [activeProjects]);

  // Monthly Quota
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const monthlyTarget = useMemo(() => {
    if (currentUser?.monthly_target_sar && currentUser.monthly_target_sar > 0) {
      return currentUser.monthly_target_sar;
    }
    const userTarget = salesTargets?.find(t => t.user_id === currentUser.id && t.target_metric === 'won_value');
    if (userTarget && userTarget.target_value > 0) return userTarget.target_value;
    return 500000; // SAR 500.0K
  }, [salesTargets, currentUser]);

  const monthlyWonValue = useMemo(() => {
    const thisMonthWon = wonProjects.filter(p => {
      const d = p.updated_at || p.created_at;
      return d && d.startsWith(currentMonthStr);
    }).reduce((sum, p) => sum + (p.estimated_value || 0), 0);
    return thisMonthWon > 0 ? thisMonthWon : wonValue;
  }, [wonProjects, currentMonthStr, wonValue]);

  const quotaPercentage = useMemo(() => {
    if (!monthlyTarget || monthlyTarget <= 0) return 0;
    return Math.min(100, Math.round((monthlyWonValue / monthlyTarget) * 100));
  }, [monthlyWonValue, monthlyTarget]);

  // Real Distribution & Contextual Metrics for Top 6 KPI Cards
  const kpiMetrics = useMemo(() => {
    const tendersCount = activeProjects.filter(p => p.opportunity_type === 'tender').length;
    const inHandCount = Math.max(0, activeProjectsCount - tendersCount);
    const tenderPct = activeProjectsCount > 0 ? Math.round((tendersCount / activeProjectsCount) * 100) : 0;

    const earlyStageVal = activeProjects
      .filter(p => ['lead', 'qualification', 'rfq_processing', 'pricing'].includes(p.pipeline_stage))
      .reduce((sum, p) => sum + (p.estimated_value || 0), 0);
    const advancedStageVal = Math.max(0, totalPipelineValue - earlyStageVal);
    const advancedPct = totalPipelineValue > 0 ? Math.round((advancedStageVal / totalPipelineValue) * 100) : 0;
    const avgDealSize = activeProjectsCount > 0 ? Math.round(totalPipelineValue / activeProjectsCount) : 0;

    const activeQuotesCount = quotationProjects.length;
    const quotationSharePct = totalPipelineValue > 0 ? Math.min(100, Math.round((latestQuotationValue / totalPipelineValue) * 100)) : 0;

    const wonCount = wonProjects.length;
    const totalClosed = scopedProjects.filter(p => ['won', 'lost'].includes(p.pipeline_stage)).length;
    const winRate = totalClosed > 0 
      ? Math.round((wonCount / totalClosed) * 100) 
      : (scopedProjects.length > 0 ? Math.round((wonCount / scopedProjects.length) * 100) : 0);

    const criticalOverdueCount = overdueProjects.filter(p => (p.days_overdue && p.days_overdue > 7) || p.calculated_health === 'red').length;
    const moderateOverdueCount = Math.max(0, overdueCount - criticalOverdueCount);
    const criticalPct = overdueCount > 0 ? Math.round((criticalOverdueCount / overdueCount) * 100) : 0;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeftInMonth = Math.max(0, daysInMonth - now.getDate());

    return {
      tendersCount,
      inHandCount,
      tenderPct,
      inHandPct: 100 - tenderPct,
      advancedPct,
      earlyPct: 100 - advancedPct,
      avgDealSize,
      activeQuotesCount,
      quotationSharePct,
      wonCount,
      winRate,
      criticalOverdueCount,
      moderateOverdueCount,
      criticalPct,
      daysLeftInMonth,
    };
  }, [activeProjects, activeProjectsCount, totalPipelineValue, quotationProjects, latestQuotationValue, wonProjects, scopedProjects, overdueProjects, overdueCount]);

  // Activity counts (100% Real Scoped Data)
  const todayActivitiesCount = useMemo(() => {
    return scopedActivities.filter(a => a.activity_date && a.activity_date.split('T')[0] === todayStr).length;
  }, [scopedActivities, todayStr]);

  const thisWeekActivitiesCount = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const mStr = monday.toISOString().split('T')[0];
    const sStr = sunday.toISOString().split('T')[0];
    return scopedActivities.filter(a => {
      if (!a.activity_date) return false;
      const d = a.activity_date.split('T')[0];
      return d >= mStr && d <= sStr;
    }).length;
  }, [scopedActivities]);

  const upcomingActivitiesCount = useMemo(() => {
    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate() + 7);
    const limitStr = inSevenDays.toISOString().split('T')[0];
    return scopedActivities.filter(a => {
      if (!a.activity_date) return false;
      const d = a.activity_date.split('T')[0];
      return d >= todayStr && d <= limitStr;
    }).length;
  }, [scopedActivities, todayStr]);

  // -------------------------------------------------------------
  // MY WEEK DAYS (Mon to Sun) - Real Activities
  // -------------------------------------------------------------
  const currentWeekDays = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const isToday = (weekOffset === 0 && d.getDay() === 4) || dateStr === todayStr;
      const realCount = scopedActivities.filter(a => a.activity_date && a.activity_date.split('T')[0] === dateStr).length;

      days.push({
        date: dateStr,
        dayName,
        dayNum,
        isToday,
        activitiesCount: realCount,
      });
    }
    return days;
  }, [weekOffset, todayStr, scopedActivities]);

  const weekRangeLabel = useMemo(() => {
    if (currentWeekDays.length < 7) return '';
    const first = new Date(currentWeekDays[0].date);
    const last = new Date(currentWeekDays[6].date);
    const m1 = first.toLocaleDateString('en-US', { month: 'short' });
    const d1 = first.getDate();
    const m2 = last.toLocaleDateString('en-US', { month: 'short' });
    const d2 = last.getDate();
    const y = last.getFullYear();
    return `${m1} ${d1} - ${m2} ${d2}, ${y}`;
  }, [currentWeekDays]);

  // -------------------------------------------------------------
  // STAGE BAR CHART DATA (Official 7 Contracting Stages - PIPELINE_STAGES)
  // -------------------------------------------------------------
  const stageBarData = useMemo(() => {
    const relevantStages: { 
      stage: PipelineStage; 
      shortLabel: string; 
      shortLabelAr: string; 
      fullName: string; 
      fullNameAr: string; 
      color: string;
      matchFn: (st: PipelineStage) => boolean;
    }[] = [
      { 
        stage: 'lead', 
        shortLabel: 'Lead', 
        shortLabelAr: 'عميل محتمل', 
        fullName: 'Lead Discovery', 
        fullNameAr: 'عميل محتمل (Lead)', 
        color: '#94a3b8',
        matchFn: (st) => st === 'lead' || st === 'qualification'
      },
      { 
        stage: 'rfq_processing', 
        shortLabel: 'RFQ', 
        shortLabelAr: 'طلب تسعير', 
        fullName: 'RFQ Processing', 
        fullNameAr: 'طلب تسعير (RFQ Processing)', 
        color: '#0284c7',
        matchFn: (st) => st === 'rfq_processing' || st === 'pricing'
      },
      { 
        stage: 'quotation_sent', 
        shortLabel: 'Quotation', 
        shortLabelAr: 'عرض سعر', 
        fullName: 'Quotation Sent', 
        fullNameAr: 'عرض سعر مرسل (Quotation Sent)', 
        color: '#2563eb',
        matchFn: (st) => st === 'quotation_sent'
      },
      { 
        stage: 'technical_submission', 
        shortLabel: 'Submittal', 
        shortLabelAr: 'اعتماد فني', 
        fullName: 'Technical Submittal', 
        fullNameAr: 'الاعتماد الفني (Technical Submittal)', 
        color: '#7c3aed',
        matchFn: (st) => st === 'technical_submission'
      },
      { 
        stage: 'negotiation', 
        shortLabel: 'Negotiation', 
        shortLabelAr: 'تفاوض نهائي', 
        fullName: 'Negotiation', 
        fullNameAr: 'التفاوض النهائي (Negotiation)', 
        color: '#d97706',
        matchFn: (st) => st === 'negotiation' || st === 'technically_approved'
      },
      { 
        stage: 'won', 
        shortLabel: 'Won', 
        shortLabelAr: 'صفقة رابحة', 
        fullName: 'Won Deals', 
        fullNameAr: 'صفقة رابحة (Won)', 
        color: '#16a34a',
        matchFn: (st) => st === 'won'
      },
      { 
        stage: 'lost', 
        shortLabel: 'Lost', 
        shortLabelAr: 'صفقة خاسرة', 
        fullName: 'Lost Deals', 
        fullNameAr: 'صفقة خاسرة (Lost)', 
        color: '#dc2626',
        matchFn: (st) => st === 'lost'
      },
    ];

    const stageTotals = relevantStages.map(s => {
      const stageProjects = scopedProjects.filter(p => s.matchFn(p.pipeline_stage));
      const calcVal = stageProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
      return {
        stage: s.stage,
        shortLabel: isRTL ? s.shortLabelAr : s.shortLabel,
        fullName: isRTL ? s.fullNameAr : s.fullName,
        color: s.color,
        count: stageProjects.length,
        totalValue: calcVal,
        projects: stageProjects,
      };
    });

    const maxVal = Math.max(...stageTotals.map(s => s.totalValue), 1);
    const sumAllValues = stageTotals.reduce((sum, s) => sum + s.totalValue, 0) || 1;

    return stageTotals.map(s => {
      const pctOfMax = (s.totalValue / maxVal) * 100;
      const heightPercent = s.totalValue === 0 ? 8 : Math.max(16, Math.round(pctOfMax));
      const shareOfTotal = ((s.totalValue / sumAllValues) * 100).toFixed(1);

      return {
        ...s,
        heightPercent: `${heightPercent}%`,
        shareOfTotal,
        displayValue: formatCompactSAR(s.totalValue),
      };
    });
  }, [scopedProjects, isRTL]);

  // -------------------------------------------------------------
  // ACTIVE OPPORTUNITY MIX DATA (100% Matches activeProjects: Tenders, In-Hand, Retrofit, Leads)
  // -------------------------------------------------------------
  const opportunityMixData = useMemo(() => {
    // Strictly tracks active, in-flight deals (excluding won, lost, hold)
    const total = activeProjects.length;
    const tenders = activeProjects.filter(p => p.opportunity_type === 'tender').length;
    const inHand = activeProjects.filter(p => p.opportunity_type === 'in_hand' || (!p.opportunity_type && p.pipeline_stage !== 'lead')).length;
    const upgrade = activeProjects.filter(p => p.opportunity_type === 'upgrade_retrofit').length;
    const leads = activeProjects.filter(p => p.pipeline_stage === 'lead' && p.opportunity_type !== 'tender' && p.opportunity_type !== 'in_hand').length;

    const items = [
      { type: 'tender', label: isRTL ? 'مناقصات' : 'Tenders', count: tenders, color: '#3b82f6', pct: total > 0 ? Math.round((tenders / total) * 100) : 0 },
      { type: 'in_hand', label: isRTL ? 'مشاريع جارية' : 'In-Hand', count: inHand, color: '#10b981', pct: total > 0 ? Math.round((inHand / total) * 100) : 0 },
      { type: 'upgrade_retrofit', label: isRTL ? 'تطوير / ترقية' : 'Upgrade/Retrofit', count: upgrade, color: '#f59e0b', pct: total > 0 ? Math.round((upgrade / total) * 100) : 0 },
      { type: 'new_lead', label: isRTL ? 'فرص جديدة' : 'New Leads', count: leads, color: '#8b5cf6', pct: total > 0 ? Math.round((leads / total) * 100) : 0 },
    ];

    return {
      total,
      items,
    };
  }, [activeProjects, isRTL]);

  // -------------------------------------------------------------
  // RFQ PROCESSING MIX DATA (Donut Chart 2: RFQ Processing Focus Only)
  // -------------------------------------------------------------
  const rfqMixData = useMemo(() => {
    const rfqProjects = activeProjects.filter(p => p.pipeline_stage === 'rfq_processing' || p.pipeline_stage === 'pricing');
    const total = rfqProjects.length;
    const tenders = rfqProjects.filter(p => p.opportunity_type === 'tender').length;
    const inHand = rfqProjects.filter(p => p.opportunity_type === 'in_hand' || (!p.opportunity_type && p.pipeline_stage !== 'lead')).length;
    const other = Math.max(0, total - (tenders + inHand));

    const items = [
      { 
        type: 'tender', 
        label: isRTL ? 'مناقصات' : 'Tenders', 
        count: tenders, 
        color: '#3b82f6', 
        pct: total > 0 ? Math.round((tenders / total) * 100) : 0 
      },
      { 
        type: 'in_hand', 
        label: isRTL ? 'مشاريع جارية' : 'In-Hand', 
        count: inHand, 
        color: '#10b981', 
        pct: total > 0 ? Math.round((inHand / total) * 100) : 0 
      },
    ];

    if (other > 0) {
      items.push({
        type: 'upgrade_retrofit',
        label: isRTL ? 'أخرى' : 'Other',
        count: other,
        color: '#f59e0b',
        pct: total > 0 ? Math.round((other / total) * 100) : 0
      });
    }

    return {
      total,
      items,
    };
  }, [activeProjects, isRTL]);

  // -------------------------------------------------------------
  // 7 KANBAN STAGES FOR PREVIEW ROW (100% Real Scoped Data)
  // -------------------------------------------------------------
  const SEVEN_STAGES: { stage: PipelineStage; label: string }[] = [
    { stage: 'lead', label: 'Lead' },
    { stage: 'rfq_processing', label: 'RFQ' },
    { stage: 'quotation_sent', label: 'Quotation' },
    { stage: 'technical_submission', label: 'Technical Submittal' },
    { stage: 'negotiation', label: 'Negotiation' },
    { stage: 'won', label: 'Won' },
    { stage: 'lost', label: 'Lost' },
  ];

  const miniKanbanStages = useMemo(() => {
    return SEVEN_STAGES.map(s => {
      const stageConfig = PIPELINE_STAGES.find(sc => sc.value === s.stage);
      const stageProjects = scopedProjects
        .filter(p => {
          if (s.stage === 'rfq_processing') return p.pipeline_stage === 'rfq_processing' || (p.pipeline_stage as string) === 'pricing';
          if (s.stage === 'negotiation') return p.pipeline_stage === 'negotiation' || (p.pipeline_stage as string) === 'technically_approved';
          if (s.stage === 'lead') return p.pipeline_stage === 'lead' || (p.pipeline_stage as string) === 'qualification';
          return p.pipeline_stage === s.stage;
        })
        .sort((a, b) => {
          const timeA = new Date(a.stage_entered_at || a.updated_at || a.created_at).getTime();
          const timeB = new Date(b.stage_entered_at || b.updated_at || b.created_at).getTime();
          return timeB - timeA;
        });

      const calcVal = stageProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
      const totalValueFormatted = formatCompactSAR(calcVal);
      const count = stageProjects.length;

      return {
        stage: s.stage,
        label: isRTL ? (stageConfig?.labelAr || s.label) : s.label,
        color: stageConfig?.color || '#0088FF',
        badgeClass: stageConfig?.badgeClass || 'bg-blue-50 text-blue-700',
        count,
        totalValueFormatted,
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

  // Helper function to return col-span class
  const getColSpanClass = (span: ModuleGridSpan) => {
    switch (span) {
      case 3: return 'col-span-12 md:col-span-6 lg:col-span-3';
      case 4: return 'col-span-12 md:col-span-6 lg:col-span-4';
      case 5: return 'col-span-12 md:col-span-12 lg:col-span-5';
      case 6: return 'col-span-12 md:col-span-6 lg:col-span-6';
      case 7: return 'col-span-12 md:col-span-12 lg:col-span-7';
      case 8: return 'col-span-12 md:col-span-12 lg:col-span-8';
      case 9: return 'col-span-12 md:col-span-12 lg:col-span-9';
      case 12: default: return 'col-span-12';
    }
  };

  return (
    <div className="space-y-2.5 md:space-y-3 max-w-[1700px] mx-auto text-slate-800 dark:text-slate-100 animate-in fade-in duration-150 font-urbanist select-none">
      
      {/* ========================================================================= */}
      {/* ROW 0: COMPACT HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-0.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#292D32] dark:text-white tracking-tight leading-tight">
            {isRTL ? 'لوحة المؤشرات' : 'Dashboard'}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium font-sans">
            {isRTL 
              ? 'أداء المبيعات، ومسار الصفقات، وتركيزك اليومي' 
              : 'Sales performance, pipeline and your daily focus'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Live Reorder Mode Toggle Button */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-2xs",
              isEditMode 
                ? "bg-[#0088FF] text-white border-[#0088FF] shadow-sm"
                : "bg-white dark:bg-[#1C2130] text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-800 hover:bg-slate-50"
            )}
            title={isRTL ? 'إعادة ترتيب الكروت بالسحب والإفلات' : 'Drag & Drop Widgets Reorder'}
          >
            <Move className="w-3.5 h-3.5" />
            <span>{isRTL ? (isEditMode ? 'إنهاء الترتيب' : 'ترتيب الكروت') : (isEditMode ? 'Done Reorder' : 'Reorder')}</span>
          </button>

          {/* Customize Visible Modules Modal Button */}
          <button
            type="button"
            onClick={() => setIsCustomizeModalOpen(true)}
            className="flex items-center gap-1.5 bg-white dark:bg-[#1C2130] px-3 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-800 shadow-2xs text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
            title="Customize Visible Dashboard Widgets"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>{isRTL ? 'تخصيص' : 'Customize'}</span>
          </button>

          {/* Date Capsule */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#1C2130] px-3 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-800 shadow-2xs text-xs font-semibold text-slate-700 dark:text-slate-300 font-sans">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{todayFormattedHeader}</span>
          </div>

          {/* Module Guide Button */}
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 bg-white dark:bg-[#1C2130] px-3 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-800 shadow-2xs text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>{isRTL ? 'دليل النظام' : 'Module Guide'}</span>
          </button>

          {/* Log Activity Dark Button */}
          <button
            type="button"
            onClick={() => openFastLog()}
            className="flex items-center gap-1.5 bg-[#1E2536] dark:bg-[#0088FF] hover:bg-slate-900 text-white dark:text-[#141820] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isRTL ? '+ تسجيل نشاط' : '+ Log Activity'}</span>
          </button>
        </div>
      </div>

      {/* Live Reorder Banner when in Edit Mode */}
      {isEditMode && (
        <div className="bg-[#1E2536] text-white p-3 rounded-xl border border-white/10 shadow-md flex items-center justify-between gap-3 animate-in fade-in duration-100 text-xs">
          <div className="flex items-center gap-2.5">
            <Move className="w-4 h-4 text-[#0088FF]" />
            <div>
              <span className="font-extrabold">{isRTL ? 'وضع تخصيص وترتيب كروت اللوحة نشط' : 'Live Widget Reorder Mode Active'}</span>
              <span className="text-slate-300 ml-2 font-sans">{isRTL ? 'اسحب أي كارت أو استخدم الأسهم لتغيير موقعه، ويتم الحفظ تلقائياً' : 'Drag any card or use arrows to change position. Changes save automatically.'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={resetToDefaultLayout}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isRTL ? 'الافتراضي' : 'Reset'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className="px-3 py-1 rounded-lg bg-[#0088FF] text-white font-bold transition-colors cursor-pointer"
            >
              {isRTL ? 'تم' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12-COLUMN DYNAMIC MODULAR GRID (PERFECTLY BALANCED FOR ZERO SCROLL) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-12 gap-2.5 md:gap-3">
        {moduleOrder.map((modId, index) => {
          if (!visibleModules[modId] && !isEditMode) return null;

          const modConfig = ALL_MODULES.find(m => m.id === modId);
          const colSpan = DEFAULT_MODULE_SIZES[modId] || 12;
          const colSpanClass = getColSpanClass(colSpan);
          const isVisible = visibleModules[modId];
          const isBeingDragged = isEditMode && draggedModuleId === modId;
          const isDropTarget = isEditMode && dragOverModuleId === modId && draggedModuleId !== modId;

          return (
            <div
              key={modId}
              draggable={isEditMode}
              onDragStart={(e) => {
                if (!isEditMode) return;
                e.dataTransfer.setData('text/plain', modId);
                setDraggedModuleId(modId);
              }}
              onDragEnd={() => {
                setDraggedModuleId(null);
                setDragOverModuleId(null);
              }}
              onDragOver={(e) => {
                if (!isEditMode || !draggedModuleId || draggedModuleId === modId) return;
                e.preventDefault();
                setDragOverModuleId(modId);
              }}
              onDrop={(e) => {
                if (!isEditMode) return;
                e.preventDefault();
                const sourceId = (e.dataTransfer.getData('text/plain') || draggedModuleId) as DashboardModuleId;
                if (sourceId && sourceId !== modId) {
                  const fromIdx = moduleOrder.indexOf(sourceId);
                  const toIdx = moduleOrder.indexOf(modId);
                  if (fromIdx !== -1 && toIdx !== -1) {
                    const next = [...moduleOrder];
                    const [moved] = next.splice(fromIdx, 1);
                    next.splice(toIdx, 0, moved);
                    saveOrder(next);
                  }
                }
                setDraggedModuleId(null);
                setDragOverModuleId(null);
              }}
              className={cn(
                colSpanClass,
                "transition-all duration-150 relative",
                isEditMode && "p-1 rounded-xl border border-dashed border-[#0088FF]/50 bg-[#0088FF]/02 cursor-grab",
                isBeingDragged && "opacity-30",
                isDropTarget && "ring-2 ring-[#0088FF] bg-[#0088FF]/10"
              )}
            >
              {/* Floating Edit Controls Bar */}
              {isEditMode && (
                <div className="flex items-center justify-between px-2 py-1 bg-[#1E2536] text-white rounded-lg mb-1.5 text-[11px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="w-3.5 h-3.5 text-[#0088FF]" />
                    <span className="truncate">{isRTL ? modConfig?.labelAr : modConfig?.labelEn}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveModule(modId, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-white/10 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveModule(modId, 'down')}
                      disabled={index === moduleOrder.length - 1}
                      className="p-1 hover:bg-white/10 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleModuleVisible(modId)}
                      className="p-1 hover:bg-white/10 rounded cursor-pointer"
                      title={isVisible ? 'Hide' : 'Show'}
                    >
                      {isVisible ? <EyeOff className="w-3.5 h-3.5 text-rose-300" /> : <Eye className="w-3.5 h-3.5 text-emerald-300" />}
                    </button>
                  </div>
                </div>
              )}

              {/* MODULE CONTENT */}
              {isVisible && (
                <>
                  {/* ========================================================= */}
                  {/* 1. TOP 6 PURE MINIMALIST COMPACT KPI CARDS */}
                  {/* ========================================================= */}
                  {modId === 'kpis' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-2.5">
                      {/* KPI 1: Active Opportunities (Hero Focus Anchor) */}
                      <Link 
                        href="/projects?filter=active"
                        className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-b from-sky-50/60 to-white dark:from-[#1B2536] dark:to-[#1C2130] border border-sky-200/90 dark:border-sky-800/60 shadow-xs hover:shadow-card hover:border-[#0088FF] transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-sky-900 dark:text-sky-300 uppercase tracking-tight">
                            {isRTL ? 'الفرص النشطة' : 'Active Opportunities'}
                          </span>
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#0088FF] flex items-center justify-center shrink-0">
                            <Folder className="w-3 h-3 text-[#0088FF]" />
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-[#292D32] dark:text-white leading-none my-1 font-mono">
                          {activeProjectsCount}
                        </div>
                        <div className="pt-1.5 border-t border-sky-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-sans">
                          <span className="text-slate-500 dark:text-slate-400 truncate">
                            {kpiMetrics.tendersCount} {isRTL ? 'مناقصات' : 'Tenders'} &bull; {kpiMetrics.inHandCount} {isRTL ? 'جاري' : 'In-Hand'}
                          </span>
                          <span className="font-bold text-[#0088FF] font-mono shrink-0">
                            {scopedProjects.length > 0 ? (isRTL ? `من ${scopedProjects.length}` : `of ${scopedProjects.length}`) : `${kpiMetrics.tenderPct}%`}
                          </span>
                        </div>
                      </Link>

                      {/* KPI 2: Pipeline Value (Hero Focus Anchor) */}
                      <Link 
                        href="/projects"
                        className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-b from-blue-50/60 to-white dark:from-[#182338] dark:to-[#1C2130] border border-blue-200/90 dark:border-blue-800/60 shadow-xs hover:shadow-card hover:border-[#0088FF] transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-blue-900 dark:text-blue-300 uppercase tracking-tight">
                            {isRTL ? 'قيمة المسار' : 'Pipeline Value'}
                          </span>
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#0088FF] flex items-center justify-center shrink-0">
                            <Briefcase className="w-3 h-3 text-[#0088FF]" />
                          </div>
                        </div>
                        <div className="text-lg sm:text-xl font-black text-[#292D32] dark:text-white leading-none my-1 truncate font-mono">
                          {formatCompactSAR(totalPipelineValue)}
                        </div>
                        <div className="pt-1.5 border-t border-blue-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-sans">
                          <span className="text-slate-500 dark:text-slate-400 truncate">
                            {isRTL ? 'متوسط' : 'Avg'} {formatCompactSAR(kpiMetrics.avgDealSize)} / {isRTL ? 'صفقة' : 'deal'}
                          </span>
                          <span className="font-bold text-emerald-600 font-mono shrink-0">
                            {kpiMetrics.advancedPct}% {isRTL ? 'متقدم' : 'Adv'}
                          </span>
                        </div>
                      </Link>

                      {/* KPI 3: Latest Quotation Value */}
                      <Link 
                        href="/quotations"
                        className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#1C2130] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-card hover:border-[#0088FF]/50 transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            {isRTL ? 'قيمة العروض' : 'Quotation Value'}
                          </span>
                          <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0088FF] flex items-center justify-center shrink-0">
                            <FileText className="w-3 h-3 text-[#0088FF]" />
                          </div>
                        </div>
                        <div className="text-lg sm:text-xl font-black text-[#292D32] dark:text-white leading-none my-1 truncate font-mono">
                          {formatCompactSAR(latestQuotationValue)}
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-sans">
                          <span className="text-slate-500 dark:text-slate-400 truncate">
                            {kpiMetrics.activeQuotesCount} {isRTL ? 'عروض معتمدة' : 'Active quotes'}
                          </span>
                          <span className="font-bold text-cyan-600 font-mono shrink-0">
                            {kpiMetrics.quotationSharePct}% {isRTL ? 'تغطية' : 'pipe'}
                          </span>
                        </div>
                      </Link>

                      {/* KPI 4: Won Deals Value */}
                      <Link 
                        href="/projects?stage=won"
                        className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#1C2130] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-card hover:border-[#10b981]/50 transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            {isRTL ? 'الصفقات الرابحة' : 'Won Deals Value'}
                          </span>
                          <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#10b981] flex items-center justify-center shrink-0">
                            <Trophy className="w-3 h-3 text-[#10b981]" />
                          </div>
                        </div>
                        <div className="text-lg sm:text-xl font-black text-[#292D32] dark:text-white leading-none my-1 truncate font-mono">
                          {formatCompactSAR(wonValue)}
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-sans">
                          <span className="text-slate-500 dark:text-slate-400 truncate">
                            {kpiMetrics.wonCount} {isRTL ? 'صفقات رابحة' : 'Won Deals'}
                          </span>
                          <span className="font-bold text-emerald-600 font-mono shrink-0">
                            {kpiMetrics.winRate}% {isRTL ? 'إغلاق' : 'Win'}
                          </span>
                        </div>
                      </Link>

                      {/* KPI 5: Overdue Follow-ups */}
                      <Link 
                        href="/projects?health=red"
                        className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#1C2130] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-card hover:border-rose-400 transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            {isRTL ? 'متابعات متأخرة' : 'Overdue Follow-ups'}
                          </span>
                          <div className="w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 leading-none my-1 font-mono">
                          {overdueCount}
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-sans">
                          <span className="text-rose-600 font-bold truncate">
                            {kpiMetrics.criticalOverdueCount} {isRTL ? 'حرجة (> أسبوع)' : 'Critical (>7d)'}
                          </span>
                          <span className="font-bold text-amber-600 font-mono shrink-0">
                            {kpiMetrics.moderateOverdueCount} {isRTL ? 'قريبة' : 'Due'}
                          </span>
                        </div>
                      </Link>

                      {/* KPI 6: Monthly Quota */}
                      <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#1C2130] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            {isRTL ? 'الهدف الشهري' : 'Monthly Quota'}
                          </span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[#0088FF] font-mono">
                            {quotaPercentage}%
                          </span>
                        </div>
                        <div className="text-[11px] sm:text-xs font-black text-[#292D32] dark:text-white leading-none my-1 truncate font-mono">
                          {formatCompactSAR(monthlyWonValue)} / {formatCompactSAR(monthlyTarget)}
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-sans text-slate-500 dark:text-slate-400">
                          <span className="truncate">
                            {isRTL ? 'المحقق' : 'Achieved'} {quotaPercentage}%
                          </span>
                          <span className="font-bold text-slate-600 dark:text-slate-300 font-mono shrink-0">
                            {isRTL ? `متبقي ${kpiMetrics.daysLeftInMonth} يوم` : `${kpiMetrics.daysLeftInMonth}d left`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* 2. NEEDS YOUR ATTENTION */}
                  {/* ========================================================= */}
                  {modId === 'needs_attention' && (
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#1C2130] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h2 className="font-extrabold text-[#292D32] dark:text-white text-xs sm:text-sm tracking-tight leading-none">
                              {isRTL ? 'ما يحتاج اهتمامك' : 'Needs Your Attention'}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-sans mt-0.5">Focus on these items to keep your pipeline healthy</p>
                          </div>
                        </div>
                        <Link href="/projects?health=red" className="text-[11px] font-bold text-[#0088FF] hover:underline flex items-center gap-0.5">
                          <span>View All</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="space-y-1.5 flex-1 flex flex-col justify-between text-xs">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#141820]/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-black text-[11px] flex items-center justify-center font-mono shrink-0">
                              {overdueCount}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-xs truncate">{isRTL ? 'متابعات متأخرة' : 'Overdue follow-ups'}</div>
                              <div className="text-[10px] text-slate-400 truncate">المشاريع التي فات موعد متابعتها</div>
                            </div>
                          </div>
                          <Link href="/projects?health=red" className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#232A38] hover:bg-slate-100 border border-slate-200 shrink-0">
                            View &gt;
                          </Link>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#141820]/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-black text-[11px] flex items-center justify-center font-mono shrink-0">
                              {staleProjects.length}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-xs truncate">{isRTL ? 'فرص راكدة' : 'Stale opportunities'}</div>
                              <div className="text-[10px] text-slate-400 truncate">مشاريع بدون تحديث حديث</div>
                            </div>
                          </div>
                          <Link href="/projects?filter=stale" className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#232A38] hover:bg-slate-100 border border-slate-200 shrink-0">
                            View &gt;
                          </Link>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#141820]/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-black text-[11px] flex items-center justify-center font-mono shrink-0">
                              {quotationProjects.length}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-xs truncate">{isRTL ? 'عروض أسعار' : 'Quotation follow-ups'}</div>
                              <div className="text-[10px] text-slate-400 truncate">عروض أسعار تحتاج متابعة</div>
                            </div>
                          </div>
                          <Link href="/quotations" className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#232A38] hover:bg-slate-100 border border-slate-200 shrink-0">
                            View &gt;
                          </Link>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#141820]/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-black text-[11px] flex items-center justify-center font-mono shrink-0">
                              {upcomingActivitiesCount}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-xs truncate">{isRTL ? 'أنشطة قادمة' : 'Upcoming activities'}</div>
                              <div className="text-[10px] text-slate-400 truncate">الأنشطة القادمة خلال 7 أيام</div>
                            </div>
                          </div>
                          <Link href="/activities" className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#232A38] hover:bg-slate-100 border border-slate-200 shrink-0">
                            View &gt;
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* 3. QUICK ACTIONS */}
                  {/* ========================================================= */}
                  {modId === 'quick_actions' && (
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#1C2130] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between h-full">
                      <div className="pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                        <h2 className="font-extrabold text-[#292D32] dark:text-white text-xs sm:text-sm tracking-tight leading-none">
                          {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
                        </h2>
                        <p className="text-[10px] text-slate-400 font-sans mt-0.5">Common sales operations</p>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <button
                          type="button"
                          onClick={() => openNewProjectModal()}
                          className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 hover:bg-blue-100 border border-blue-200/60 font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>+ Add Project</span>
                        </button>

                        <Link
                          href="/companies"
                          className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/60 font-black text-xs flex items-center justify-center gap-1 transition-all text-center"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>+ Add Company</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => openNewContactModal()}
                          className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 hover:bg-purple-100 border border-purple-200/60 font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>+ Add Contact</span>
                        </button>

                        <Link
                          href="/quotations?action=new"
                          className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 hover:bg-amber-100 border border-amber-200/60 font-black text-xs flex items-center justify-center gap-1 transition-all text-center"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>+ Add Quotation</span>
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Link href="/activities" className="p-2 rounded-lg bg-slate-50 dark:bg-[#141820]/60 border border-slate-200/60 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-bold text-slate-500">Today&apos;s Tasks</div>
                            <div className="text-lg font-black text-[#292D32] dark:text-white">{todayActivitiesCount}</div>
                          </div>
                          <Clock className="w-4 h-4 text-slate-400" />
                        </Link>

                        <Link href="/my-week" className="p-2 rounded-lg bg-slate-50 dark:bg-[#141820]/60 border border-slate-200/60 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-bold text-slate-500">This week</div>
                            <div className="text-lg font-black text-[#292D32] dark:text-white">{thisWeekActivitiesCount}</div>
                          </div>
                          <Calendar className="w-4 h-4 text-slate-400" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* 4. MY WEEK */}
                  {/* ========================================================= */}
                  {modId === 'my_week' && (
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#1C2130] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <div>
                            <h2 className="font-extrabold text-[#292D32] dark:text-white text-xs sm:text-sm tracking-tight leading-none">
                              {isRTL ? 'أسبوعي' : 'My Week'}
                            </h2>
                            <span className="text-[10px] text-slate-400 font-medium">{weekRangeLabel}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setWeekOffset(prev => prev - 1)}
                            className="w-5 h-5 rounded bg-slate-100 dark:bg-[#232A38] flex items-center justify-center text-slate-600 cursor-pointer"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setWeekOffset(prev => prev + 1)}
                            className="w-5 h-5 rounded bg-slate-100 dark:bg-[#232A38] flex items-center justify-center text-slate-600 cursor-pointer"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 flex-1 flex flex-col justify-between text-[11px]">
                        {currentWeekDays.map((day) => (
                          <div 
                            key={day.date}
                            className={cn(
                              "flex items-center justify-between px-2 py-0.5 rounded-lg transition-all",
                              day.isToday 
                                ? "bg-[#0088FF] text-white font-black shadow-2xs" 
                                : "hover:bg-slate-50 dark:hover:bg-[#141820]/60 text-slate-600 dark:text-slate-300"
                            )}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className={cn("w-1.5 h-1.5 rounded-full", day.isToday ? "bg-white" : "bg-slate-300 dark:bg-slate-600")} />
                              <span>{day.dayName} {day.dayNum}</span>
                            </span>
                            <span className={cn(
                              "text-[10px] font-mono",
                              day.isToday ? "text-white font-bold" : "text-slate-400"
                            )}>
                              {day.activitiesCount} activities
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* 5. PIPELINE VALUE BY STAGE */}
                  {/* ========================================================= */}
                  {modId === 'stage_chart' && (
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#1C2130] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-3.5 h-3.5 text-[#0088FF]" />
                          <div>
                            <h2 className="font-extrabold text-[#292D32] dark:text-white text-xs sm:text-sm tracking-tight leading-none">
                              {isRTL ? 'قيمة المسار حسب المرحلة' : 'Pipeline Value by Stage'}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                              {isRTL ? 'مرر الفأرة على الأعمدة لعرض التفاصيل' : 'Hover over bars to see details'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-black text-[#292D32] dark:text-white font-mono">
                          {isRTL ? 'المسار النشط: ' : 'Active: '}
                          <span className="text-[#0088FF]">{formatCompactSAR(totalPipelineValue)}</span>
                        </span>
                      </div>

                      {/* 7 Official Contracting Stage Bars */}
                      <div className="relative h-32 flex items-end justify-between gap-1.5 pt-4 pb-1 px-1.5 bg-slate-50 dark:bg-[#141820]/40 rounded-xl border border-slate-100 dark:border-slate-800">
                        {stageBarData.map((bar, i) => {
                          const isHovered = hoveredStageIndex === i;
                          return (
                            <Link 
                              key={bar.stage} 
                              href={`/projects?stage=${bar.stage}`}
                              className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end group cursor-pointer relative"
                              onMouseEnter={() => setHoveredStageIndex(i)}
                              onMouseLeave={() => setHoveredStageIndex(null)}
                            >
                              <span className={cn(
                                "text-[10px] font-bold whitespace-nowrap font-mono",
                                isHovered ? "font-black scale-105" : "text-slate-400"
                              )} style={{ color: isHovered ? bar.color : undefined }}>
                                {bar.displayValue.replace('SAR ', '')}
                              </span>

                              <div 
                                className={cn(
                                  "w-full rounded-t-md transition-all duration-200",
                                  isHovered ? "shadow-md brightness-110" : ""
                                )}
                                style={{ 
                                  height: bar.heightPercent,
                                  backgroundColor: bar.totalValue > 0 ? bar.color : undefined,
                                }}
                              />

                              <div className="text-center w-full">
                                <span className={cn(
                                  "block text-[10px] font-bold truncate transition-colors",
                                  isHovered ? "text-[#0088FF] dark:text-white" : "text-slate-600 dark:text-slate-300"
                                )}>
                                  {bar.shortLabel}
                                </span>
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  ({bar.count})
                                </span>
                              </div>

                              {isHovered && (
                                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-30 w-48 p-2.5 bg-[#1E2536] text-white rounded-xl shadow-xl text-xs pointer-events-none">
                                  <div className="font-bold border-b border-white/10 pb-1 mb-1 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bar.color }} />
                                    <span>{bar.fullName}</span>
                                  </div>
                                  <div className="text-[10px] flex justify-between text-slate-300">
                                    <span>{isRTL ? 'القيمة:' : 'Total:'}</span>
                                    <span className="font-bold text-emerald-400 font-mono">SAR {bar.totalValue.toLocaleString()}</span>
                                  </div>
                                  <div className="text-[10px] flex justify-between text-slate-300">
                                    <span>{isRTL ? 'عدد الصفقات:' : 'Deals:'}</span>
                                    <span className="font-bold font-mono">{bar.count} {isRTL ? 'صفقة' : 'deals'}</span>
                                  </div>
                                  <div className="text-[10px] flex justify-between text-slate-400 mt-0.5 pt-0.5 border-t border-white/5">
                                    <span>{isRTL ? 'الحصة من الإجمالي:' : 'Share:'}</span>
                                    <span className="font-mono text-cyan-300">{bar.shareOfTotal}%</span>
                                  </div>
                                </div>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* 6. OPPORTUNITY MIX (Active Pipeline & RFQ Processing Dual Charts) */}
                  {/* ========================================================= */}
                  {modId === 'opportunity_mix' && (
                    <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#1C2130] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between h-full">
                      <div className="pb-1 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <PieChart className="w-3.5 h-3.5 text-[#0088FF]" />
                            <h2 className="font-extrabold text-[#292D32] dark:text-white text-xs sm:text-sm tracking-tight leading-none">
                              {isRTL ? 'مزيج الفرص النشطة' : 'Active Opportunity Mix'}
                            </h2>
                          </div>
                          <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                            {isRTL ? 'توزيع الصفقات النشطة والطلبات قيد التسعير' : 'Active Pipeline & RFQ Processing'}
                          </p>
                        </div>
                        <Link 
                          href="/projects?stage=rfq_processing"
                          className="text-[10px] font-semibold text-[#0088FF] hover:underline flex items-center gap-0.5"
                        >
                          <span>{isRTL ? 'عرض الـ RFQ' : 'View RFQ'}</span>
                          <ArrowRight className="w-2.5 h-2.5 rtl:rotate-180" />
                        </Link>
                      </div>

                      {/* Dual Donut Charts Container */}
                      <div className="grid grid-cols-2 gap-2 my-auto divide-x divide-slate-100 dark:divide-slate-800/80 rtl:divide-x-reverse items-center">
                        {/* Chart 1: Active Pipeline Mix (Matches activeProjectsCount) */}
                        <div className="flex flex-col items-center px-0.5">
                          <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0088FF]" />
                            <span className="truncate">{isRTL ? 'الفرص النشطة' : 'Active Pipeline'}</span>
                          </div>

                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center my-0.5">
                            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                              <circle
                                cx="50"
                                cy="50"
                                r="39"
                                fill="none"
                                stroke="currentColor"
                                className="text-slate-100 dark:text-[#232A38]"
                                strokeWidth="10"
                              />
                              {(() => {
                                const circumference = 2 * Math.PI * 39;
                                let accumOffset = 0;
                                const baseTotal = opportunityMixData.total > 0 ? opportunityMixData.total : 1;
                                const validItems = opportunityMixData.items.filter(it => it.count > 0);
                                return validItems.map((it) => {
                                  const length = (it.count / baseTotal) * circumference;
                                  const dashArray = `${length} ${circumference - length}`;
                                  const dashOffset = -accumOffset;
                                  accumOffset += length;
                                  const isHov = hoveredMixType === it.type;

                                  return (
                                    <circle
                                      key={it.type}
                                      cx="50"
                                      cy="50"
                                      r="39"
                                      fill="none"
                                      stroke={it.color}
                                      strokeWidth={isHov ? 14 : 10}
                                      strokeDasharray={dashArray}
                                      strokeDashoffset={dashOffset}
                                      className="transition-all duration-200 cursor-pointer"
                                      style={{
                                        filter: isHov ? `drop-shadow(0 0 6px ${it.color}) brightness(1.15)` : 'none',
                                        opacity: hoveredMixType ? (isHov ? 1 : 0.4) : 1,
                                      }}
                                      onMouseEnter={() => setHoveredMixType(it.type)}
                                      onMouseLeave={() => setHoveredMixType(null)}
                                      onClick={() => router.push(`/projects?type=${it.type}`)}
                                    />
                                  );
                                });
                              })()}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
                              {(() => {
                                const activeItem = opportunityMixData.items.find(it => it.type === hoveredMixType);
                                return (
                                  <>
                                    <span className="text-base sm:text-lg font-black text-[#292D32] dark:text-white leading-none font-mono">
                                      {activeItem ? activeItem.count : opportunityMixData.total}
                                    </span>
                                    <span className="text-[10px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 max-w-[55px] truncate">
                                      {activeItem ? activeItem.label : (isRTL ? 'فرصة نشطة' : 'Active Deals')}
                                    </span>
                                    {activeItem && (
                                      <span className="text-[10px] font-mono font-bold text-[#0088FF] leading-none mt-0.5">
                                        {activeItem.pct}%
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Legend 1 */}
                          <div className="w-full mt-1.5 space-y-0.5 text-[10px]">
                            {opportunityMixData.items.slice(0, 2).map((item) => {
                              const isHov = hoveredMixType === item.type;
                              return (
                                <Link 
                                  key={item.type} 
                                  href={`/projects?type=${item.type}`}
                                  className={cn(
                                    "flex items-center justify-between py-0.5 px-1 rounded transition-all duration-150 cursor-pointer",
                                    isHov 
                                      ? "bg-slate-100 dark:bg-slate-800/90 font-bold" 
                                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                  )}
                                  onMouseEnter={() => setHoveredMixType(item.type)}
                                  onMouseLeave={() => setHoveredMixType(null)}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span 
                                      className={cn("w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-150", isHov && "scale-125")} 
                                      style={{ backgroundColor: item.color }} 
                                    />
                                    <span className={cn("truncate transition-colors", isHov ? "text-[#0088FF] dark:text-[#8FC2F0]" : "text-slate-600 dark:text-slate-300")}>
                                      {item.label}
                                    </span>
                                  </div>
                                  <span className="font-bold text-[#292D32] dark:text-white shrink-0 font-mono text-[10px]">
                                    {item.count} <span className="text-slate-400 font-normal">({item.pct}%)</span>
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>

                        {/* Chart 2: RFQ Processing Focus (Tender vs In-Hand) */}
                        <div className="flex flex-col items-center px-0.5">
                          <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            <span className="truncate">{isRTL ? 'طلبات التسعير (RFQ)' : 'RFQ Processing'}</span>
                          </div>

                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center my-0.5">
                            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                              <circle
                                cx="50"
                                cy="50"
                                r="39"
                                fill="none"
                                stroke="currentColor"
                                className="text-slate-100 dark:text-[#232A38]"
                                strokeWidth="10"
                              />
                              {(() => {
                                const circumference = 2 * Math.PI * 39;
                                let accumOffset = 0;
                                const baseTotal = rfqMixData.total > 0 ? rfqMixData.total : 1;
                                const validItems = rfqMixData.items.filter(it => it.count > 0);
                                return validItems.map((it) => {
                                  const length = (it.count / baseTotal) * circumference;
                                  const dashArray = `${length} ${circumference - length}`;
                                  const dashOffset = -accumOffset;
                                  accumOffset += length;
                                  const isHov = hoveredRfqType === it.type;

                                  return (
                                    <circle
                                      key={it.type}
                                      cx="50"
                                      cy="50"
                                      r="39"
                                      fill="none"
                                      stroke={it.color}
                                      strokeWidth={isHov ? 14 : 10}
                                      strokeDasharray={dashArray}
                                      strokeDashoffset={dashOffset}
                                      className="transition-all duration-200 cursor-pointer"
                                      style={{
                                        filter: isHov ? `drop-shadow(0 0 6px ${it.color}) brightness(1.15)` : 'none',
                                        opacity: hoveredRfqType ? (isHov ? 1 : 0.4) : 1,
                                      }}
                                      onMouseEnter={() => setHoveredRfqType(it.type)}
                                      onMouseLeave={() => setHoveredRfqType(null)}
                                      onClick={() => router.push(`/projects?stage=rfq_processing&type=${it.type}`)}
                                    />
                                  );
                                });
                              })()}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
                              {(() => {
                                const activeItem = rfqMixData.items.find(it => it.type === hoveredRfqType);
                                return (
                                  <>
                                    <span className="text-base sm:text-lg font-black text-[#292D32] dark:text-white leading-none font-mono">
                                      {activeItem ? activeItem.count : rfqMixData.total}
                                    </span>
                                    <span className="text-[10px] sm:text-[10px] font-bold text-sky-600 dark:text-sky-400 mt-0.5 max-w-[55px] truncate">
                                      {activeItem ? activeItem.label : (isRTL ? 'طلب تسعير' : 'In RFQ')}
                                    </span>
                                    {activeItem && (
                                      <span className="text-[10px] font-mono font-bold text-sky-600 mt-0.2">
                                        {activeItem.pct}%
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Legend 2 */}
                          <div className="w-full mt-1.5 space-y-0.5 text-[10px]">
                            {rfqMixData.items.map((item) => {
                              const isHov = hoveredRfqType === item.type;
                              return (
                                <Link 
                                  key={item.type} 
                                  href={`/projects?stage=rfq_processing&type=${item.type}`}
                                  className={cn(
                                    "flex items-center justify-between py-0.5 px-1 rounded transition-all duration-150 cursor-pointer",
                                    isHov 
                                      ? "bg-slate-100 dark:bg-slate-800/90 font-bold" 
                                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                  )}
                                  onMouseEnter={() => setHoveredRfqType(item.type)}
                                  onMouseLeave={() => setHoveredRfqType(null)}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span 
                                      className={cn("w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-150", isHov && "scale-125")} 
                                      style={{ backgroundColor: item.color }} 
                                    />
                                    <span className={cn("truncate transition-colors", isHov ? "text-sky-600 dark:text-sky-400" : "text-slate-600 dark:text-slate-300")}>
                                      {item.label}
                                    </span>
                                  </div>
                                  <span className="font-bold text-[#292D32] dark:text-white shrink-0 font-mono text-[10px]">
                                    {item.count} <span className="text-slate-400 font-normal">({item.pct}%)</span>
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* 8. PROJECT PIPELINE PREVIEW */}
                  {/* ========================================================= */}
                  {modId === 'mini_kanban' && (
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#1C2130] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2.5">
                        <div>
                          <h2 className="font-extrabold text-[#292D32] dark:text-white text-xs sm:text-sm tracking-tight leading-none">
                            {isRTL ? 'مسار المشاريع المصغر' : 'Project Pipeline Preview'}
                          </h2>
                          <p className="text-[10px] text-slate-400 font-sans mt-0.5">Click on any project card to open its detail</p>
                        </div>
                        <Link 
                          href="/projects" 
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-700 dark:text-[#8FC2F0] bg-slate-100 dark:bg-[#232A38] hover:bg-slate-200 flex items-center gap-1 transition-all"
                        >
                          <span>View Full Pipeline Kanban</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="overflow-x-auto pb-1">
                        <div className="flex gap-2 min-w-[1150px]">
                          {miniKanbanStages.map((col) => (
                            <div 
                              key={col.stage} 
                              className="flex-1 min-w-[155px] bg-slate-50 dark:bg-[#141820]/60 rounded-xl p-2 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-start"
                            >
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-800 mb-1.5 text-[10px] font-bold shrink-0">
                                <div className="flex items-center gap-1 truncate">
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                                  <span className="truncate">{col.label}</span>
                                  <span className="text-[10px] text-slate-400">({col.count})</span>
                                </div>
                                <span className="font-mono text-[10px] shrink-0 text-[#292D32] dark:text-white">{col.totalValueFormatted}</span>
                              </div>

                              <div className="space-y-1.5 flex-1 flex flex-col justify-start">
                                {col.projects.slice(0, 2).map((project) => (
                                  <MiniKanbanCard
                                    key={project.id}
                                    project={project}
                                    isRTL={isRTL}
                                    onUpdateColor={handleUpdateProjectColor}
                                  />
                                ))}

                                {col.projects.length === 0 && (
                                  <div className="py-4 text-center text-slate-400 text-[10px] italic font-sans my-auto">
                                    No deals
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* 9. MOTIVATIONAL CARD */}
                  {/* ========================================================= */}
                  {modId === 'motivation' && (
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1E2536] via-[#1A202E] to-[#121620] text-white p-3.5 sm:p-4 border border-slate-700/60 shadow-md flex flex-col justify-between h-full">
                      {/* Background Mountain SVG */}
                      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="none">
                          <path d="M 0,200 L 70,110 L 120,150 L 200,50 L 250,100 L 300,30 L 300,200 Z" fill="currentColor" className="text-[#0088FF]" />
                          <line x1="200" y1="50" x2="200" y2="35" stroke="#10b981" strokeWidth="2" />
                          <polygon points="200,35 214,40 200,45" fill="#10b981" />
                        </svg>
                      </div>

                      <div className="relative z-10">
                        <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 mb-2 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                          Big deals take consistency, not luck.
                        </h3>

                        <p className="text-[10px] text-slate-300 mt-1 font-medium">
                          Keep going, you&apos;re closer than you think.
                        </p>
                      </div>

                      <div className="relative z-10 pt-2 mt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-sans">
                        <span>Daily Momentum</span>
                        <span className="font-bold text-[#0088FF]">CRMate Focus</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* CUSTOMIZE VISIBLE MODULES MODAL */}
      {/* ========================================================================= */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2130] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#292D32] dark:text-white">
                  {isRTL ? 'تخصيص كروت لوحة المؤشرات' : 'Customize Dashboard Widgets'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isRTL ? 'إظهار أو إخفاء أي كارت وإعادة ترتيب مواضعها' : 'Show, hide, and reorder dashboard widgets'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {moduleOrder.map((modId, idx) => {
                const mod = ALL_MODULES.find(m => m.id === modId);
                const isVis = visibleModules[modId];

                return (
                  <div key={modId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#141820] border border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleModuleVisible(modId)}
                        className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center border cursor-pointer",
                          isVis ? "bg-[#0088FF] text-white border-[#0088FF]" : "bg-white border-slate-300"
                        )}
                      >
                        {isVis && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isRTL ? mod?.labelAr : mod?.labelEn}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveModule(modId, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveModule(modId, 'down')}
                        disabled={idx === moduleOrder.length - 1}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#141820] flex items-center justify-between">
              <button
                type="button"
                onClick={resetToDefaultLayout}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isRTL ? 'الترتيب الافتراضي' : 'Reset to Default'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="px-4 py-1.5 bg-[#0088FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {isRTL ? 'حفظ وإغلاق' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Guide Drawer */}
      <ModuleGuideDrawer 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
        defaultModuleId="dashboard" 
      />

    </div>
  );
}
