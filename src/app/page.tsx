'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { formatCurrencySAR, formatDateString, formatRelativeTime, cn } from '@/lib/utils';
import { PIPELINE_STAGES } from '@/lib/constants';
import { PipelineStage, OpportunityType } from '@/types/crm';
import { ExecutiveManagerCockpit } from '@/components/dashboard/executive-manager-cockpit';
import { scopeProjects, scopeActivities, scopeRequests } from '@/lib/logic/scope';

// Dashboard module definitions for customization
export type DashboardModuleId = 
  | 'team_performance'
  | 'kpis'
  | 'stage_chart'
  | 'type_donut'
  | 'locations'
  | 'attention_center'
  | 'mini_kanban'
  | 'recent_projects'
  | 'week_activities';

interface ModuleConfig {
  id: DashboardModuleId;
  labelEn: string;
  labelAr: string;
  description: string;
}

const ALL_MODULES: ModuleConfig[] = [
  { id: 'team_performance', labelEn: 'Executive Sales Team Cockpit', labelAr: 'لوحة أداء فريق المبيعات والمناديب', description: 'Leaderboard, sales rep quota attainment, in-hand & won values, and individual audit scope' },
  { id: 'kpis', labelEn: 'Key Performance Indicators', labelAr: 'مؤشرات الأداء الرئيسية', description: 'Top 6 cards: Active Deals, Pipeline Value, Quotations, Won Deals, Overdue, Leads' },
  { id: 'stage_chart', labelEn: 'Pipeline Value by Stage', labelAr: 'قيمة المشاريع حسب المرحلة', description: 'Interactive bar chart with hover tooltips and project breakdown' },
  { id: 'type_donut', labelEn: 'Projects by Opportunity Type', labelAr: 'المشاريع حسب نوع الفرصة', description: 'Interactive donut chart with sector distribution and hover values' },
  { id: 'locations', labelEn: 'Project Locations Distribution', labelAr: 'توزيع المشاريع جغرافياً', description: 'Breakdown of active opportunities across Western Region and KSA cities' },
  { id: 'attention_center', labelEn: 'Attention Center', labelAr: 'مركز التنبيهات العاجلة', description: 'Urgent overdue follow-ups, due today, stale deals, and high value risks' },
  { id: 'mini_kanban', labelEn: 'Project Pipeline Preview', labelAr: 'مسار المشاريع المصغر', description: 'Horizontal preview of stages with direct links to project cockpit' },
  { id: 'recent_projects', labelEn: 'Recent Projects Table', labelAr: 'أحدث المشاريع', description: 'Live projects sorted newest to oldest by last activity and updates' },
  { id: 'week_activities', labelEn: 'This Week\'s Activities', labelAr: 'أنشطة الأسبوع الجارية', description: 'Planned and completed client interactions with quick status' },
];

const DEFAULT_VISIBLE_MODULES: Record<DashboardModuleId, boolean> = {
  team_performance: true,
  kpis: true,
  stage_chart: true,
  type_donut: true,
  locations: true,
  attention_center: true,
  mini_kanban: true,
  recent_projects: true,
  week_activities: true,
};

const STORAGE_KEY = 'al_mespar_dashboard_visible_modules';

export default function DashboardPage() {
  const { 
    projects, 
    contacts, 
    activities,
    currentUser,
    currentRole,
    teamMembers,
    selectedSalesFilter,
    setSelectedSalesFilter,
    requests,
    openRequestDetail
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
  
  // Customizer state with local storage persistence
  const [visibleModules, setVisibleModules] = useState<Record<DashboardModuleId, boolean>>(DEFAULT_VISIBLE_MODULES);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  // Interactive Chart Tooltips State
  const [hoveredStageIndex, setHoveredStageIndex] = useState<number | null>(null);
  const [hoveredTypeIndex, setHoveredTypeIndex] = useState<number | null>(null);

  // Load saved module preferences on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setVisibleModules(prev => ({ ...prev, ...parsed }));
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

  const setAllModules = (visible: boolean) => {
    const updated: Record<DashboardModuleId, boolean> = {
      team_performance: visible,
      kpis: visible,
      stage_chart: visible,
      type_donut: visible,
      locations: visible,
      attention_center: visible,
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
  // MINI KANBAN STAGES (Active real projects)
  // -------------------------------------------------------------
  const miniKanbanStages = useMemo(() => {
    return [
      { stage: 'lead' as PipelineStage, label: 'Lead' },
      { stage: 'rfq_processing' as PipelineStage, label: 'RFQ' },
      { stage: 'pricing' as PipelineStage, label: 'Pricing' },
      { stage: 'quotation_sent' as PipelineStage, label: 'Quotation' },
      { stage: 'technical_submission' as PipelineStage, label: 'Technical' },
      { stage: 'negotiation' as PipelineStage, label: 'Negotiation' },
      { stage: 'won' as PipelineStage, label: 'Won' },
      { stage: 'lost' as PipelineStage, label: 'Lost' },
    ].map(col => {
      const stageProjects = scopedProjects.filter(p => p.pipeline_stage === col.stage);
      const stageVal = stageProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
      return {
        ...col,
        count: stageProjects.length,
        totalValueFormatted: formatCurrencySAR(stageVal),
        projects: stageProjects,
      };
    });
  }, [scopedProjects]);

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

  const activeModulesCount = Object.values(visibleModules).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-slate-800 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* HEADER BAR: TITLE, DATE RANGE, AND CUSTOMIZE VIEW BUTTON */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-[#292D32] tracking-tight font-urbanist">
              Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#8FC2F0]/20 text-[#292D32] border border-[#8FC2F0]/30 text-xs font-bold font-urbanist">
              CRMate Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time sales velocity, pipeline intelligence, and revenue forecasting
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Module Customizer Button */}
          <button
            onClick={() => setIsCustomizeModalOpen(true)}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-bold text-[#292D32] hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer font-urbanist"
            title="Customize Visible Dashboard Modules"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#292D32]" />
            <span>Customize</span>
            <span className="bg-[#8FC2F0]/20 text-[#292D32] px-2 py-0.5 rounded-full font-black text-[10px]">
              {activeModulesCount}/9
            </span>
          </button>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-semibold text-[#292D32] font-urbanist">
            <Calendar className="w-3.5 h-3.5 text-[#8FC2F0]" />
            <span>Saudi Workweek &bull; Active</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODULE 1: TOP 6 DYNAMIC KPI CARDS */}
      {/* ========================================================================= */}
      {visibleModules.kpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-in fade-in duration-150">
          
          {/* 1. Active Projects */}
          <div className="glass-card-interactive p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#77CE69]/15 text-[#292D32] flex items-center justify-center shrink-0 border border-[#77CE69]/30">
                <Folder className="w-4 h-4 text-[#292D32]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-urbanist truncate">Active Deals</div>
                <div className="text-2xl font-black text-[#292D32] leading-tight mt-0.5 font-urbanist">
                  {activeProjectsCount}
                </div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-[#292D32] mt-3 pt-2.5 border-t border-slate-100/60 flex items-center gap-1 font-urbanist">
              <span className="text-[#292D32]">{scopedProjects.length} Total Projects</span>
              <span className="text-slate-400 font-medium truncate">• 3 hold/lost</span>
            </div>
          </div>

          {/* 2. Total Pipeline Value */}
          <div className="glass-card-interactive p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 text-[#292D32] flex items-center justify-center shrink-0 border border-[#8FC2F0]/40">
                <Briefcase className="w-4 h-4 text-[#292D32]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-urbanist truncate">Pipeline Value</div>
                <div className="text-2xl font-black text-[#292D32] leading-tight mt-0.5 truncate font-urbanist" title={`SAR ${totalPipelineValue.toLocaleString()}`}>
                  {formatCurrencySAR(totalPipelineValue)}
                </div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-[#292D32] mt-3 pt-2.5 border-t border-slate-100/60 flex items-center gap-1 font-urbanist">
              <TrendingUp className="w-3.5 h-3.5 text-[#8FC2F0]" />
              <span className="text-slate-600">Active Pipeline</span>
            </div>
          </div>

          {/* 3. Quotation Value */}
          <div className="glass-card-interactive p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/15 text-[#292D32] flex items-center justify-center shrink-0 border border-[#8FC2F0]/30">
                <FileText className="w-4 h-4 text-[#292D32]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-urbanist truncate">Quotation Value</div>
                <div className="text-2xl font-black text-[#292D32] leading-tight mt-0.5 truncate font-urbanist" title={`SAR ${quotationValue.toLocaleString()}`}>
                  {formatCurrencySAR(quotationValue)}
                </div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-[#292D32] mt-3 pt-2.5 border-t border-slate-100/60 flex items-center gap-1 font-urbanist">
              <span className="text-slate-600">{quotationProjects.length} Sent Quotations</span>
            </div>
          </div>

          {/* 4. Won Deals Value */}
          <div className="glass-card-interactive p-5 rounded-3xl flex flex-col justify-between bg-gradient-to-b from-white/90 to-[#77CE69]/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#77CE69] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider font-urbanist truncate">Won Value</div>
                <div className="text-2xl font-black text-[#292D32] leading-tight mt-0.5 font-urbanist" title={`SAR ${wonValue.toLocaleString()}`}>
                  SAR {wonValue.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-3 pt-2.5 border-t border-slate-100/60 flex items-center gap-1 font-urbanist">
              <span>{wonProjects.length} Won Deal</span>
              <span className="text-slate-400 font-medium">(MACC KAUST)</span>
            </div>
          </div>

          {/* 5. Overdue Follow-ups */}
          <div className="glass-card-interactive p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-urbanist truncate">Overdue Deals</div>
                <div className="text-2xl font-black text-rose-600 leading-tight mt-0.5 font-urbanist">
                  {overdueCount}
                </div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-rose-600 mt-3 pt-2.5 border-t border-slate-100/60 flex items-center gap-1 font-urbanist">
              <span>Urgent action required</span>
            </div>
          </div>

          {/* 6. Active Leads & Contacts */}
          <div className="glass-card-interactive p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 text-[#292D32] flex items-center justify-center shrink-0 border border-[#8FC2F0]/30">
                <UserPlus className="w-4 h-4 text-[#292D32]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-urbanist truncate">Prospects & Leads</div>
                <div className="text-2xl font-black text-[#292D32] leading-tight mt-0.5 font-urbanist">
                  {totalNewLeadsCount}
                </div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-[#292D32] mt-3 pt-2.5 border-t border-slate-100/60 flex items-center gap-1 font-urbanist">
              <span className="text-slate-600">{leadStageProjects.length} Leads • {hotContacts.length} Contacts</span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* EXECUTIVE SALES TEAM LEADERBOARD & QUOTAS (Visible for Managers) */}
      {/* ========================================================================= */}
      {visibleModules.team_performance && <ExecutiveManagerCockpit />}

      {/* ========================================================================= */}
      {/* ROW 2: INTERACTIVE CHARTS & ATTENTION CENTER */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* MODULE 2: PIPELINE VALUE BY STAGE INTERACTIVE BAR CHART (4 Cols) */}
        {visibleModules.stage_chart && (
          <div className={cn(
            "glass-card p-6 rounded-3xl flex flex-col justify-between relative",
            visibleModules.type_donut && visibleModules.locations && visibleModules.attention_center ? "lg:col-span-4" : "lg:col-span-6"
          )}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-black text-[#292D32] text-sm font-urbanist">Pipeline Value by Stage</h2>
                <p className="text-[11px] text-slate-400 font-urbanist">Hover over bars to inspect deal details</p>
              </div>
              <span className="text-xs font-black text-[#292D32] font-urbanist">
                Total: <strong className="text-[#292D32] font-black">{formatCurrencySAR(totalPipelineValue)}</strong>
              </span>
            </div>

            {/* Interactive Bar Chart Container */}
            <div className="relative h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-1">
              {stageBarData.map((bar, i) => {
                const isHovered = hoveredStageIndex === i;
                return (
                  <div 
                    key={bar.stage} 
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer relative"
                    onMouseEnter={() => setHoveredStageIndex(i)}
                    onMouseLeave={() => setHoveredStageIndex(null)}
                  >
                    {/* Top Value Label */}
                    <span className={cn(
                      "text-[9px] font-bold transition-all whitespace-nowrap font-urbanist",
                      isHovered ? "text-[#292D32] scale-110 font-black" : "text-slate-500"
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
                            : "bg-slate-200/70 hover:bg-slate-300"
                      )}
                      style={{ height: bar.heightPercent }}
                    />

                    {/* Bottom Stage Label */}
                    <div className="text-center mt-1 w-full">
                      <span className={cn(
                        "block text-[10px] truncate transition-colors font-urbanist",
                        isHovered ? "font-black text-[#292D32]" : "font-bold text-slate-600"
                      )}>
                        {bar.shortLabel}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-bold font-urbanist">
                        {bar.count}
                      </span>
                    </div>

                    {/* Rich Interactive Floating Hover Tooltip Card */}
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
                              {bar.projects.slice(0, 3).map(p => (
                                <div key={p.id} className="truncate text-slate-200">
                                  • {p.name} <span className="text-slate-400">({formatCurrencySAR(p.estimated_value)})</span>
                                </div>
                              ))}
                              {bar.projects.length > 3 && (
                                <div className="text-[#8FC2F0] font-semibold italic">
                                  +{bar.projects.length - 3} more deals
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODULE 3: PROJECTS BY TYPE INTERACTIVE DONUT CHART (3 Cols) */}
        {visibleModules.type_donut && (
          <div className={cn(
            "glass-card p-6 rounded-3xl flex flex-col justify-between relative",
            visibleModules.stage_chart && visibleModules.locations && visibleModules.attention_center ? "lg:col-span-3" : "lg:col-span-6"
          )}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-black text-[#292D32] text-sm font-urbanist">Projects by Type</h2>
              <span className="text-[11px] text-slate-400 font-urbanist">Hover slice</span>
            </div>

            <div className="flex items-center gap-4 my-auto relative">
              {/* SVG Donut */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 36 36">
                  {/* Background Track Circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="4"
                  />
                  {/* Category Slices */}
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

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  {hoveredTypeIndex !== null && donutTypeData[hoveredTypeIndex] && scopedProjects.length > 0 ? (
                    <>
                      <span className="text-base font-black text-slate-900 leading-none">
                        {donutTypeData[hoveredTypeIndex].percentage}
                      </span>
                      <span className="text-[9px] text-slate-600 font-bold truncate max-w-[65px] mt-0.5">
                        {donutTypeData[hoveredTypeIndex].label}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-base font-black text-slate-900 leading-none">{scopedProjects.length}</span>
                      <span className="text-[9px] text-slate-400 font-medium">Projects</span>
                    </>
                  )}
                </div>
              </div>

              {/* Interactive Legend with Tooltip Trigger */}
              <div className="space-y-1.5 flex-1 min-w-0 text-[11px]">
                {scopedProjects.length === 0 ? (
                  <div className="text-xs text-slate-400 font-medium italic my-auto py-3 text-center">
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
                          isHovered ? "bg-slate-100 font-bold shadow-2xs" : "hover:bg-slate-50"
                        )}
                        onMouseEnter={() => setHoveredTypeIndex(i)}
                        onMouseLeave={() => setHoveredTypeIndex(null)}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: item.color }} 
                          />
                          <span className="text-slate-700 truncate">{item.label}</span>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0 ml-1">
                          {item.count} <span className="text-slate-400 font-normal">({item.percentage})</span>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Rich Floating Tooltip on Hover */}
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
                        {donutTypeData[hoveredTypeIndex].projects.slice(0, 2).map(p => (
                          <div key={p.id} className="truncate text-slate-200">
                            • {p.name} <span className="text-slate-400">({formatCurrencySAR(p.estimated_value)})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stable Bottom Summary with Zero Layout Shift */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] flex items-center justify-between h-8 shrink-0">
              {hoveredTypeIndex !== null && donutTypeData[hoveredTypeIndex] ? (
                <>
                  <span className="text-slate-700 truncate">
                    <strong className="text-slate-900">{donutTypeData[hoveredTypeIndex].label}:</strong>{' '}
                    {formatCurrencySAR(donutTypeData[hoveredTypeIndex].totalValue)}
                  </span>
                  <span className="text-blue-600 font-extrabold shrink-0 ml-1">
                    {donutTypeData[hoveredTypeIndex].count} Deals ({donutTypeData[hoveredTypeIndex].percentage})
                  </span>
                </>
              ) : (
                <>
                  <span className="text-slate-400">Total Portfolio Value</span>
                  <span className="font-bold text-slate-800">{formatCurrencySAR(totalPipelineValue)}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* MODULE 4: PROJECT LOCATIONS CARD (2.5 Cols) */}
        {visibleModules.locations && (
          <div className={cn(
            "glass-card p-6 rounded-3xl flex flex-col justify-between",
            visibleModules.stage_chart && visibleModules.type_donut && visibleModules.attention_center ? "lg:col-span-2" : "lg:col-span-4"
          )}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-black text-[#292D32] text-sm font-urbanist">Project Locations</h2>
              <MapPin className="w-3.5 h-3.5 text-[#8FC2F0]" />
            </div>

            <div className="relative my-auto bg-white/60 p-3.5 rounded-2xl border border-white/80 shadow-2xs flex flex-col justify-between h-44">
              {locationStats.topLocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center my-auto text-center text-xs text-slate-400">
                  <span>No project locations recorded</span>
                </div>
              ) : (
                <div className="space-y-2 text-xs font-urbanist">
                  {locationStats.topLocations.map((loc, idx) => {
                    const colors = ['bg-[#8FC2F0]', 'bg-[#77CE69]', 'bg-[#292D32]', 'bg-amber-500'];
                    return (
                      <div key={loc.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-slate-700">
                          <span className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`} /> 
                          {loc.name}
                        </span>
                        <span className="font-black text-[#292D32] bg-white px-2 py-0.5 rounded-full border border-slate-200/70 shadow-2xs">
                          {loc.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100 font-bold font-urbanist">
                {locationStats.otherCount > 0 ? `+${locationStats.otherCount} across other KSA cities` : `${locationStats.totalLocations} Active Cities`}
              </div>
            </div>
          </div>
        )}

        {/* MODULE 5: ATTENTION CENTER (3.5 Cols) */}
        {visibleModules.attention_center && (
          <div className={cn(
            "glass-card p-6 rounded-3xl flex flex-col justify-between border-rose-200/50",
            visibleModules.stage_chart && visibleModules.type_donut && visibleModules.locations ? "lg:col-span-3" : "lg:col-span-6"
          )}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h2 className="font-black text-[#292D32] text-sm font-urbanist">Attention Center</h2>
              </div>

              <div className="space-y-2 text-xs font-urbanist">
                {/* Pending Approvals */}
                {pendingApprovals.length > 0 && (
                  <button 
                    onClick={() => openRequestDetail(pendingApprovals[0].id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 transition-all border border-amber-400/40 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                      <span className="font-bold text-amber-950">Pending Approvals</span>
                    </div>
                    <span className="font-black text-xs text-amber-800 bg-white px-2.5 py-0.5 rounded-full border border-amber-300">
                      {pendingApprovals.length} new
                    </span>
                  </button>
                )}

                {/* Overdue Follow-ups */}
                <Link 
                  href="/projects" 
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 transition-all border border-rose-100/60"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span className="font-bold text-slate-800">Overdue Deals</span>
                  </div>
                  <span className="font-black text-xs text-rose-600 bg-white px-2.5 py-0.5 rounded-full border border-rose-200">
                    {overdueProjects.length}
                  </span>
                </Link>

                {/* Due Today */}
                <Link 
                  href="/my-day" 
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 transition-all border border-amber-100/60"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-bold text-slate-800">Due Today</span>
                  </div>
                  <span className="font-black text-xs text-amber-600 bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
                    {dueTodayProjects.length}
                  </span>
                </Link>

                {/* No Next Action */}
                <Link 
                  href="/projects" 
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/70 hover:bg-slate-100/70 transition-all border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold text-slate-700">No Next Action</span>
                  </div>
                  <span className="font-black text-xs text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                    {noNextActionProjects.length}
                  </span>
                </Link>

                {/* Stale Projects (> 30 days) */}
                <Link 
                  href="/projects" 
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-[#8FC2F0]/10 hover:bg-[#8FC2F0]/20 transition-all border border-[#8FC2F0]/20"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#292D32]" />
                    <span className="font-bold text-[#292D32]">Stale Deals (&gt; 30d)</span>
                  </div>
                  <span className="font-black text-xs text-[#292D32] bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                    {staleProjects.length}
                  </span>
                </Link>

                {/* High Value At Risk */}
                <Link 
                  href="/projects" 
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 transition-all border border-rose-100/60"
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span className="font-bold text-slate-800">High Value At Risk (&ge;1M)</span>
                  </div>
                  <span className="font-black text-xs text-rose-600 bg-white px-2.5 py-0.5 rounded-full border border-rose-200">
                    {highValueAtRiskProjects.length}
                  </span>
                </Link>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right mt-3 font-urbanist">
              <Link href="/projects" className="text-xs font-bold text-[#292D32] hover:text-[#8FC2F0] inline-flex items-center gap-1 transition-colors">
                <span>View All Projects</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* APPROVER DASHBOARD: PENDING APPROVALS CARD */}
      {/* ========================================================================= */}
      {pendingApprovals.length > 0 && (
        <div className="glass-card p-6 rounded-3xl border-amber-300/70 bg-gradient-to-br from-amber-50/40 via-white/90 to-white font-urbanist shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center border border-amber-300 shadow-2xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span>Pending Approvals &bull; اعتمادات معلقة</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    {pendingApprovals.length} Action Required
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">Review and authorize commercial discounts or quotation changes</p>
              </div>
            </div>
            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
              Fast Decision Flow
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingApprovals.map(req => {
              return (
                <button
                  key={req.id}
                  onClick={() => openRequestDetail(req.id)}
                  className="text-left p-3.5 rounded-2xl bg-white hover:bg-amber-50/40 border border-slate-200/80 hover:border-amber-300 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {req.id}
                      </span>
                      {req.urgency === 'urgent' ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1 animate-pulse">
                          <Flame className="w-2.5 h-2.5 text-rose-500" />
                          Urgent
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {req.urgency}
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {req.project_name}
                    </h4>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {req.company_name}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {req.type === 'discount' ? `${req.payload.discount_pct}% Discount` : req.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        {formatCurrencySAR(req.payload.requested_value || req.quotation_amount || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>By: <strong className="text-slate-700">{req.requester_name}</strong></span>
                    <span className="text-blue-600 font-bold group-hover:underline">Review &rarr;</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 6: PROJECT PIPELINE MINI-KANBAN (Direct Clickable Navigation) */}
      {/* ========================================================================= */}
      {visibleModules.mini_kanban && (
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-[#292D32] text-base font-urbanist">Project Pipeline Preview</h2>
              <p className="text-xs text-slate-400 font-urbanist">Click on any project card to open its detail cockpit</p>
            </div>
            <Link href="/projects" className="text-xs font-bold text-[#292D32] hover:text-[#8FC2F0] flex items-center gap-1 font-urbanist transition-colors">
              <span>View Full Pipeline Kanban</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Horizontal Mini-Kanban with Real Clickable Projects */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3.5 min-w-[1300px]">
              {miniKanbanStages.map((col) => (
                <div 
                  key={col.stage} 
                  className="flex-1 min-w-[210px] bg-white/40 backdrop-blur-md rounded-2xl p-3.5 border border-white/80 shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2.5 font-urbanist">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-[#292D32]">{col.label}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.2 rounded-full border border-slate-200/60">
                        {col.count}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-[#292D32]">{col.totalValueFormatted}</span>
                  </div>

                  {/* Real Clickable Project Cards */}
                  <div className="space-y-2.5">
                    {col.projects.slice(0, 3).map((project) => {
                      const healthColor = 
                        project.calculated_health === 'red' ? 'bg-rose-500' :
                        project.calculated_health === 'yellow' ? 'bg-amber-500' :
                        project.calculated_health === 'green' ? 'bg-[#77CE69]' : 'bg-slate-400';

                      return (
                        <Link 
                          key={project.id}
                          href={`/projects/${project.id}`}
                          className="block glass-card-interactive p-3.5 rounded-2xl group cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-[10px] font-bold text-[#292D32] bg-[#8FC2F0]/20 px-2 py-0.5 rounded-full border border-[#8FC2F0]/30 font-urbanist">
                              {project.pr_number}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${healthColor}`} title={`Health: ${project.calculated_health}`} />
                          </div>
                          
                          <div className="font-bold text-[#292D32] text-xs truncate group-hover:text-[#8FC2F0] transition-colors font-urbanist">
                            {project.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5 font-urbanist">
                            {project.company_name || 'Client'}
                          </div>
                          <div className="font-black text-[#292D32] text-xs mt-1.5 font-urbanist">
                            {formatCurrencySAR(project.estimated_value)}
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 pt-1.5 border-t border-slate-100 font-urbanist">
                            <span className="text-slate-500 font-medium flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 text-[#8FC2F0]" />
                              {project.location}
                            </span>
                            <span className="text-[#292D32] font-bold group-hover:underline flex items-center gap-0.5">
                              Open <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}

                    {col.projects.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-[11px] italic font-urbanist">
                        No projects in this stage
                      </div>
                    )}

                    {col.projects.length > 3 && (
                      <Link 
                        href="/projects" 
                        className="block text-center py-1.5 text-[10px] font-bold text-[#292D32] hover:underline bg-white/70 rounded-xl border border-slate-200/60 font-urbanist"
                      >
                        +{col.projects.length - 3} more in {col.label}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROW 4: RECENT PROJECTS TABLE (NEWEST FIRST) & THIS WEEK'S ACTIVITIES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* MODULE 7: RECENT PROJECTS TABLE (Sorted Newest to Oldest) */}
        {visibleModules.recent_projects && (
          <div className={cn(
            "glass-card p-6 rounded-3xl flex flex-col justify-between",
            visibleModules.week_activities ? "lg:col-span-8" : "lg:col-span-12"
          )}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-black text-[#292D32] text-base font-urbanist">Recent Projects</h2>
                  <p className="text-xs text-slate-400 font-urbanist">Sorted newest to oldest by last activity and updates</p>
                </div>
                <Link href="/projects" className="text-xs font-bold text-[#292D32] hover:text-[#8FC2F0] font-urbanist transition-colors">
                  View All Projects &rarr;
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-urbanist">
                  <thead className="text-slate-400 font-bold border-b border-slate-100">
                    <tr>
                      <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">Project</th>
                      <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">Client / Contractor</th>
                      <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">Value</th>
                      <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">Stage</th>
                      <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">Next Action</th>
                      <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">Next Follow-up</th>
                      <th className="pb-3 px-2 uppercase text-[10px] tracking-wider">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60">
                    {sortedRecentProjects.map((p) => {
                      const stageConfig = PIPELINE_STAGES.find(s => s.value === p.pipeline_stage);
                      const healthDotColor = 
                        p.calculated_health === 'red' ? 'bg-rose-500' :
                        p.calculated_health === 'yellow' ? 'bg-amber-500' :
                        p.calculated_health === 'green' ? 'bg-[#77CE69]' : 'bg-slate-400';

                      return (
                        <tr key={p.id} className="hover:bg-[#8FC2F0]/10 transition-colors group">
                          <td className="py-3 px-2">
                            <Link href={`/projects/${p.id}`} className="block">
                              <div className="font-bold text-[#292D32] group-hover:text-[#8FC2F0] transition-colors flex items-center gap-1.5 font-urbanist">
                                <span className={`w-2 h-2 rounded-full ${healthDotColor}`} />
                                {p.name}
                              </div>
                              <span className="font-mono text-[10px] text-slate-400">{p.pr_number}</span>
                            </Link>
                          </td>
                          <td className="py-3 px-2 text-slate-600 font-medium">{p.company_name || 'Al Mespar Account'}</td>
                          <td className="py-3 px-2 font-black text-[#292D32]">{formatCurrencySAR(p.estimated_value)}</td>
                          <td className="py-3 px-2">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full font-bold text-[10px] border",
                              stageConfig?.badgeClass || 'bg-slate-100 text-slate-700'
                            )}>
                              {stageConfig?.label || p.pipeline_stage}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-700 font-medium max-w-[200px] truncate">
                            {p.next_action || <span className="text-slate-300 italic">None</span>}
                          </td>
                          <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                            {formatDateString(p.next_follow_up_at)}
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            <span className="flex items-center gap-1 text-slate-500 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#8FC2F0]" />
                              {formatRelativeTime(p.last_activity_at)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-3 font-urbanist">
              <span>Showing {sortedRecentProjects.length} of {scopedProjects.length} authentic projects</span>
              <Link href="/projects" className="font-bold text-[#292D32] hover:text-[#8FC2F0] transition-colors">
                View All Projects &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* MODULE 8: THIS WEEK'S ACTIVITIES (Real Activity List) */}
        {visibleModules.week_activities && (
          <div className={cn(
            "glass-card p-6 rounded-3xl flex flex-col justify-between",
            visibleModules.recent_projects ? "lg:col-span-4" : "lg:col-span-12"
          )}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-black text-[#292D32] text-base font-urbanist">This Week&apos;s Activities</h2>
                  <p className="text-xs text-slate-400 font-urbanist">Live feed of rep client interactions</p>
                </div>
                <Link href="/activities" className="text-xs font-bold text-[#292D32] hover:text-[#8FC2F0] font-urbanist transition-colors">
                  View All &rarr;
                </Link>
              </div>

              {recentActivitiesList.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center my-auto">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-xs font-bold text-slate-600">No activities recorded this week</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Use Fast Log to record calls, visits &amp; meetings</div>
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
                      <div key={act.id} className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-2xl hover:bg-white/80 transition-colors border border-transparent hover:border-white/80 hover:shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#8FC2F0]/20 text-[#292D32] flex items-center justify-center shrink-0 border border-[#8FC2F0]/30 font-urbanist">
                            <Icon className="w-4 h-4 text-[#292D32]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#292D32] truncate font-urbanist">{act.title}</span>
                              {/* Prominent Sales Rep Pill Badge */}
                              <span 
                                className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0 font-urbanist shadow-2xs"
                                title={`Logged by ${act.userName}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span>{act.userName}</span>
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate font-urbanist">{act.subtext} • {act.date}</div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          <span className="bg-white text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200/60 shadow-2xs font-urbanist">
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

            <div className="pt-4 border-t border-slate-100 mt-4 text-center font-urbanist">
              <Link 
                href="/activities" 
                className="text-xs font-bold text-[#292D32] hover:text-[#8FC2F0] transition-colors block"
              >
                Go to Fast Activity Tracker &rarr;
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* CUSTOMIZE DASHBOARD MODAL */}
      {/* ========================================================================= */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Customize Dashboard Modules</h3>
                  <p className="text-xs text-slate-500">Choose which sections appear on your sales overview</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCustomizeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Module Toggles */}
            <div className="p-6 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dashboard Sections ({activeModulesCount} of {ALL_MODULES.length} Active)</span>
                <div className="flex items-center gap-2 text-xs">
                  <button 
                    onClick={() => setAllModules(true)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button 
                    onClick={() => setAllModules(false)}
                    className="text-slate-500 font-medium hover:underline"
                  >
                    Hide All
                  </button>
                </div>
              </div>

              {ALL_MODULES.map((mod) => {
                const isChecked = visibleModules[mod.id];
                return (
                  <label 
                    key={mod.id}
                    className={cn(
                      "flex items-start justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                      isChecked 
                        ? "bg-blue-50/50 border-blue-200 shadow-2xs" 
                        : "bg-slate-50/60 border-slate-200 text-slate-400 opacity-75 hover:opacity-100"
                    )}
                  >
                    <div className="pr-4">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-bold text-xs", isChecked ? "text-slate-900" : "text-slate-500")}>
                          {mod.labelEn}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">({mod.labelAr})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {mod.description}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleModule(mod.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setVisibleModules(DEFAULT_VISIBLE_MODULES);
                  localStorage.removeItem(STORAGE_KEY);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>

              <button
                onClick={() => setIsCustomizeModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
