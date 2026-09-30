'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  CalendarDays, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Users, 
  Video, 
  MapPin, 
  Target, 
  Briefcase, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  User, 
  Check, 
  AlertCircle, 
  Send,
  X,
  Flame,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  ArrowRightLeft,
  Navigation,
  GripVertical,
  ArrowDown
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { 
  formatCurrencySAR, 
  formatDateString, 
  normalizePhoneNumber,
  formatDisplayPhone,
  getSaturdayOfWeek,
  cn
} from '@/lib/utils';
import { SAUDI_LOCATIONS, ACTIVITY_CHANNELS, VISIT_PURPOSES } from '@/lib/constants';
import { Project, PlannedActivity, ActivityChannel, VisitPurpose, ProjectPriority } from '@/types/crm';
import { scopeProjects, scopePlannedActivities } from '@/lib/logic/scope';

interface DayConfig {
  name: string;
  short: string;
  arabic: string;
  dateStr: string; // YYYY-MM-DD
  dayNum: number;
}

type PlanTargetMode = 'existing_project' | 'custom_project' | 'area_hunting';

const QUICK_AREAS = [
  { en: 'Jeddah Industrial Area 2', ar: 'صناعية جدة الثانية' },
  { en: 'Yanbu Industrial City', ar: 'ينبع الصناعية' },
  { en: 'King Abdullah Economic City', ar: 'مدينة الملك عبدالله الاقتصادية' },
  { en: 'Makkah Expansion Area', ar: 'منطقة مكة والتوسعات' },
  { en: 'Madinah Road Consultants', ar: 'مكاتب الاستشاريين طريق المدينة' },
  { en: 'Al-Kharj Industrial Zone', ar: 'صناعية الخرج' },
  { en: 'Jeddah Seafront & Obhur', ar: 'أبحر والكورنيش الشمالي' }
];

const TIME_SLOTS = [
  '09:00 AM',
  '10:30 AM',
  '12:00 PM',
  '02:00 PM',
  '03:30 PM',
  '05:00 PM'
];

export default function MyWeekPage() {
  const { 
    currentUser, 
    plannedActivities, 
    activities, 
    projects, 
    contacts, 
    openFastLog, 
    addPlannedActivity, 
    updatePlannedActivity,
    deletePlannedActivity,
    currentRole,
    salesTargets,
    selectedSalesFilter,
    setSelectedSalesFilter,
    teamMembers
  } = useCRM();
  const { t, isRTL, language } = useLanguage();

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin' || currentRole === 'sales_manager' || currentRole === 'admin';

  const scopedPlannedActivities = useMemo(() => {
    if (isManager) {
      if (selectedSalesFilter === 'all') return plannedActivities;
      return plannedActivities.filter(p => p.user_id === selectedSalesFilter);
    }
    return plannedActivities.filter(p => p.user_id === currentUser.id);
  }, [plannedActivities, isManager, selectedSalesFilter, currentUser.id]);

  const scopedProjects = useMemo(() => {
    if (isManager) {
      if (selectedSalesFilter === 'all') return projects;
      return projects.filter(p => p.owner_id === selectedSalesFilter);
    }
    return projects.filter(p => p.owner_id === currentUser.id);
  }, [projects, isManager, selectedSalesFilter, currentUser.id]);

  // Selected Week state (Sunday to Thursday)
  const [weekOffset, setWeekOffset] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDayForAdd, setSelectedDayForAdd] = useState<string>('2026-09-17');
  const [isPlanSubmitted, setIsPlanSubmitted] = useState(true);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for new planned item
  const [targetMode, setTargetMode] = useState<PlanTargetMode>('existing_project');
  const [newProjectId, setNewProjectId] = useState<string>(projects[0]?.id || '');
  const [customProjectName, setCustomProjectName] = useState<string>('');
  const [customCompanyName, setCustomCompanyName] = useState<string>('');
  const [locationAreaName, setLocationAreaName] = useState<string>('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('10:00 AM');
  const [newChannel, setNewChannel] = useState<ActivityChannel>('call');
  const [newPurpose, setNewPurpose] = useState<VisitPurpose>('follow_up');
  const [newGoal, setNewGoal] = useState<string>('');
  const [newPriority, setNewPriority] = useState<ProjectPriority>('high');

  // Drag & Drop State (Odoo style)
  const [draggedActivityId, setDraggedActivityId] = useState<string | null>(null);
  const [dragOverDayDate, setDragOverDayDate] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute 6 Saudi work days: Saturday through Thursday
  const workDays: DayConfig[] = useMemo(() => {
    // Computes Saturday of the current week (or offset week)
    const baseSaturday = getSaturdayOfWeek(new Date(), weekOffset);

    const dayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const dayShorts = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
    const dayArabics = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

    return dayNames.map((name, idx) => {
      const d = new Date(baseSaturday);
      d.setDate(baseSaturday.getDate() + idx);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return {
        name,
        short: dayShorts[idx],
        arabic: dayArabics[idx],
        dateStr: `${y}-${m}-${day}`,
        dayNum: d.getDate()
      };
    });
  }, [weekOffset]);

  // Suggested Activities Engine (PRD Section 5)
  const suggestedItems = useMemo(() => {
    const plannedProjectIds = new Set(scopedPlannedActivities.map(p => p.project_id).filter(Boolean));
    const today = new Date().toISOString().split('T')[0];

    return scopedProjects.filter(p => {
      if (p.pipeline_stage === 'won' || p.pipeline_stage === 'lost' || p.pipeline_stage === 'hold') return false;
      if (plannedProjectIds.has(p.id)) return false;
      return (p.next_follow_up_at && p.next_follow_up_at <= today) || p.calculated_health === 'red';
    }).slice(0, 3);
  }, [scopedProjects, scopedPlannedActivities]);

  // Channel UI helper
  const getChannelConfig = (ch: ActivityChannel) => {
    switch (ch) {
      case 'call': return { label: 'Call', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Phone className="w-3.5 h-3.5" /> };
      case 'meeting_f2f': return { label: 'F2F Meeting', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Users className="w-3.5 h-3.5" /> };
      case 'meeting_online': return { label: 'Online Meeting', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Video className="w-3.5 h-3.5" /> };
      case 'visit': return { label: 'Site Visit', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <MapPin className="w-3.5 h-3.5" /> };
      case 'hunting': return { label: 'Hunting', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Target className="w-3.5 h-3.5" /> };
      case 'office_work': return { label: 'Office Work', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Briefcase className="w-3.5 h-3.5" /> };
      default: return { label: ch, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Briefcase className="w-3.5 h-3.5" /> };
    }
  };

  const handleOpenAddModal = (dateStr: string) => {
    setSelectedDayForAdd(dateStr);
    setTargetMode('existing_project');
    setNewProjectId(scopedProjects[0]?.id || '');
    setCustomProjectName('');
    setCustomCompanyName('');
    setLocationAreaName('');
    setGoogleMapsUrl('');
    setNewGoal('');
    setIsAddModalOpen(true);
  };

  const handleSavePlannedActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;

    let projId: string | undefined = undefined;
    let projName: string | undefined = undefined;
    let compName: string | undefined = undefined;
    let locName: string | undefined = undefined;

    if (targetMode === 'existing_project') {
      const proj = scopedProjects.find(p => p.id === newProjectId);
      projId = proj?.id;
      projName = proj?.name || 'Assigned Project';
      compName = proj?.company_name || '';
      locName = locName || proj?.location;
    } else if (targetMode === 'custom_project') {
      projName = customProjectName.trim();
      compName = customCompanyName.trim() || 'Direct Account';
    } else {
      // Area / Hunting
      projName = locationAreaName.trim() || 'Regional Hunting Zone';
      compName = customCompanyName.trim() || 'Potential Accounts';
      locName = locationAreaName.trim() || 'Western Region';
    }

    await addPlannedActivity({
      weekly_plan_id: `wp_2026_w38`,
      project_id: projId,
      project_name: projName,
      company_name: compName,
      location_name: locName,
      google_maps_url: googleMapsUrl.trim() || undefined,
      custom_target: targetMode !== 'existing_project' ? projName : undefined,
      scheduled_date: selectedDayForAdd,
      time_slot: timeSlot,
      channel: newChannel,
      visit_purpose: newPurpose,
      goal: newGoal.trim(),
      priority: newPriority,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
    });

    setIsAddModalOpen(false);
  };

  const handleAcceptSuggestion = async (project: Project, targetDateStr: string) => {
    await addPlannedActivity({
      weekly_plan_id: 'wp_2026_w38',
      project_id: project.id,
      project_name: project.name,
      company_id: project.company_id,
      company_name: project.company_name,
      contact_id: project.primary_contact_id,
      contact_name: project.primary_contact_name,
      location_name: project.location,
      scheduled_date: targetDateStr,
      time_slot: '10:00 AM',
      channel: 'call',
      visit_purpose: 'follow_up',
      goal: project.next_action || `Follow up on ${project.pr_number}`,
      priority: 'urgent',
      is_auto_suggested: true,
      suggestion_reason: `Auto-suggested: ${project.calculated_health === 'red' ? 'Overdue follow-up' : 'High value'}`,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
    });
  };

  const handleMoveDay = async (activityId: string, newDateStr: string) => {
    const act = scopedPlannedActivities.find(a => a.id === activityId);
    if (!act || act.scheduled_date === newDateStr) return;

    const targetDayObj = workDays.find(d => d.dateStr === newDateStr);
    const dayLabel = targetDayObj ? `${targetDayObj.name} (${targetDayObj.short})` : newDateStr;

    await updatePlannedActivity(activityId, { scheduled_date: newDateStr });
    setToastMessage(`Activity rescheduled to ${dayLabel}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDelete = async (activityId: string) => {
    if (confirm('Are you sure you want to remove this scheduled plan item?')) {
      await deletePlannedActivity(activityId);
    }
  };

  // Week metrics
  const totalPlannedWeek = scopedPlannedActivities.length;
  const completedPlannedWeek = scopedPlannedActivities.filter(p => p.status === 'completed').length;
  const weeklyTarget = 20;
  const weekProgressPercent = Math.min(100, Math.round((completedPlannedWeek / weeklyTarget) * 100));

  const selectedExistingProject = scopedProjects.find(p => p.id === newProjectId);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-200 text-[#292D32] dark:text-white font-urbanist">
      
      {/* ========================================================================= */}
      {/* HEADER BAR: SAUDI WORKWEEK NAVIGATION & STATUS */}
      {/* ========================================================================= */}
      <div className="crm-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] border border-[#8FC2F0]/30 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{t('saudiWorkweek')}</span>
            </span>

            {isPlanSubmitted ? (
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#77CE69]/15 text-[#77CE69] border border-[#77CE69]/30 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{isRTL ? 'خطة مبيعات نشطة' : 'Active Sales Plan'}</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">
                {isRTL ? 'مسودة خطة' : 'Draft Plan'}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292D32] dark:text-white tracking-tight">
            {isRTL ? 'خطة الأسبوع الميدانية' : 'My Week Plan'} &bull; {workDays[0]?.short} {workDays[0]?.dayNum} &ndash; {workDays[workDays.length - 1]?.short} {workDays[workDays.length - 1]?.dayNum}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {isRTL 
              ? 'مخطط الأسبوع الميداني لـ 6 أيام (السبت - الخميس) بربط الخرائط والتسجيل المباشر وتحديد مستهدفات العملاء'
              : '6-day structured field planner (Saturday – Thursday) with Google Maps GPS routing, direct logging, and flexible client targets'}
          </p>
        </div>

        {/* Progress against 20 Touchpoints Target */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400">{isRTL ? 'سرعة الإنجاز' : 'Week Velocity'}</div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#292D32] dark:text-white">
              {completedPlannedWeek} <span className="text-sm text-slate-400 font-bold">/ {totalPlannedWeek} {isRTL ? 'مخطط' : 'Planned'}</span>
            </div>
            <div className="w-36 bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-1.5 overflow-hidden">
              <div 
                className="bg-[#8FC2F0] h-full rounded-full transition-all duration-500"
                style={{ width: `${weekProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Manager Rep Selector */}
          {isManager && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">{isRTL ? 'المندوب:' : 'Rep:'}</span>
              <select
                value={selectedSalesFilter}
                onChange={(e) => setSelectedSalesFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1 text-xs font-bold text-[#292D32] dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="all">{isRTL ? `كافة فريق المبيعات (${teamMembers.filter(m => m.role === 'sales_engineer').length})` : `All Sales Team (${teamMembers.filter(m => m.role === 'sales_engineer').length})`}</option>
                {teamMembers.filter(m => m.role === 'sales_engineer').map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-4">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
              title={isRTL ? 'الأسبوع السابق' : 'Previous Week'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isRTL ? 'الأسبوع الحالي' : 'Current Week'}
            </button>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
              title={isRTL ? 'الأسبوع القادم' : 'Next Week'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QUICK FILTER BAR */}
      {/* ========================================================================= */}
      <div className="crm-card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-urbanist">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'ابحث في الخطة بالمشروع، المنطقة، أو الهدف...' : 'Search plan by project, area, or goal...'}
              className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-full transition-all text-xs cursor-pointer",
                statusFilter === 'all' ? "bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {isRTL ? 'الكل' : 'All'} ({totalPlannedWeek})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={cn(
                "px-3.5 py-1.5 rounded-full transition-all text-xs cursor-pointer",
                statusFilter === 'pending' ? "bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {isRTL ? 'معلق' : 'Pending'} ({totalPlannedWeek - completedPlannedWeek})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={cn(
                "px-3.5 py-1.5 rounded-full transition-all text-xs cursor-pointer",
                statusFilter === 'completed' ? "bg-[#77CE69] text-white shadow-xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {isRTL ? 'مكتمل' : 'Completed'} ({completedPlannedWeek})
            </button>
          </div>
        </div>

        <button
          onClick={() => handleOpenAddModal(workDays[0].dateStr)}
          className="crm-pill-dark w-full sm:w-auto px-5 py-2.5 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4 text-[#8FC2F0]" />
          <span>{isRTL ? '+ نشاط بيعي جديد' : 'New Sales Activity'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* AI AUTO-SUGGESTION ENGINE (PRD Section 5) */}
      {/* ========================================================================= */}
      {suggestedItems.length > 0 && (
        <div className="crm-card p-6 sm:p-7 font-urbanist">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8FC2F0] animate-pulse" />
              <h3 className="text-xs font-extrabold text-[#292D32] dark:text-slate-100 uppercase tracking-wider">
                Automated Plan Suggestions &bull; Overdue or High Value At Risk
              </h3>
            </div>
            <span className="text-[11px] text-[#292D32] dark:text-[#8FC2F0] font-bold bg-[#8FC2F0]/20 px-3 py-1 rounded-full border border-[#8FC2F0]/30">
              PRD Smart Cadence Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {suggestedItems.map(p => (
              <div 
                key={p.id}
                className="crm-card-soft p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-urbanist text-slate-400 mb-1">
                    <span className="font-bold">{p.pr_number}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold font-sans">
                      {p.calculated_health === 'red' ? 'Needs Attention' : 'High Value'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{p.name}</h4>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{p.company_name}</div>
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1 font-urbanist">{formatCurrencySAR(p.estimated_value)}</div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1 text-[11px]">
                  <span className="text-slate-400 font-medium">Add to:</span>
                  <div className="flex items-center gap-1">
                    {workDays.slice(0, 3).map((d) => (
                      <button
                        key={d.dateStr}
                        onClick={() => handleAcceptSuggestion(p, d.dateStr)}
                        className="px-2.5 py-0.5 rounded-full bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] hover:bg-[#8FC2F0]/30 font-bold transition-colors text-[10px] cursor-pointer"
                        title={`Add to ${d.name}`}
                      >
                        {d.short}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5-DAY SAUDI WORKWEEK PLANNER GRID (Sun &ndash; Thu) & Odoo Drag & Drop */}
      {/* ========================================================================= */}
      <div className="space-y-2 font-urbanist">
        {/* Odoo Style Drag & Drop Helper Badge */}
        {currentRole !== 'viewer' && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <GripVertical className="w-3.5 h-3.5 text-[#8FC2F0]" />
              <span>{t('dragNotice')}</span>
            </span>
            {draggedActivityId && (
              <span className="text-[#292D32] dark:text-[#8FC2F0] font-black animate-pulse text-[11px] bg-[#8FC2F0]/20 px-3 py-1 rounded-full border border-[#8FC2F0]/30">
                Release card on any day to reschedule
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
          {workDays.map((day) => {
            const isToday = day.dateStr === new Date().toISOString().split('T')[0];
            const isColumnTargeted = dragOverDayDate === day.dateStr;
            
            let dayActivities = scopedPlannedActivities.filter(p => p.scheduled_date === day.dateStr);

            // Apply filters
            if (statusFilter === 'pending') {
              dayActivities = dayActivities.filter(p => p.status !== 'completed');
            } else if (statusFilter === 'completed') {
              dayActivities = dayActivities.filter(p => p.status === 'completed');
            }

            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              dayActivities = dayActivities.filter(p => 
                (p.project_name && p.project_name.toLowerCase().includes(q)) ||
                (p.company_name && p.company_name.toLowerCase().includes(q)) ||
                (p.goal && p.goal.toLowerCase().includes(q)) ||
                (p.location_name && p.location_name.toLowerCase().includes(q))
              );
            }

            return (
              <div 
                key={day.dateStr}
                onDragOver={(e) => {
                  if (currentRole === 'viewer') return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverDayDate !== day.dateStr) {
                    setDragOverDayDate(day.dateStr);
                  }
                }}
                onDragLeave={(e) => {
                  if (currentRole === 'viewer') return;
                  e.preventDefault();
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  if (dragOverDayDate === day.dateStr) {
                    setDragOverDayDate(null);
                  }
                }}
                onDrop={async (e) => {
                  if (currentRole === 'viewer') return;
                  e.preventDefault();
                  const actId = e.dataTransfer.getData('text/plain') || draggedActivityId;
                  if (actId) {
                    await handleMoveDay(actId, day.dateStr);
                  }
                  setDragOverDayDate(null);
                  setDraggedActivityId(null);
                }}
                className={`flex flex-col min-h-[500px] min-w-0 transition-all duration-150 ${
                  isColumnTargeted
                    ? 'border-2 border-dashed border-[#8FC2F0] bg-[#8FC2F0]/20 ring-4 ring-[#8FC2F0]/20 shadow-md scale-[1.01] rounded-[28px]'
                    : isToday 
                      ? 'crm-kanban-column ring-2 ring-[#8FC2F0]/60' 
                      : 'crm-kanban-column'
                }`}
              >
                {/* Day Column Header */}
                <div className={`p-4 border-b rounded-t-[28px] flex items-center justify-between font-urbanist ${
                  isToday ? 'bg-[#292D32] dark:bg-slate-800 text-white border-slate-700' : 'bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm tracking-tight">{day.name}</span>
                      <span className={`text-[10px] font-bold ${isToday ? 'text-slate-300' : 'text-slate-400'}`}>
                        ({day.arabic})
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-extrabold uppercase bg-[#8FC2F0] text-[#292D32] px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] font-semibold ${isToday ? 'text-slate-300' : 'text-slate-400'}`}>
                      {day.dayNum} September
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isToday ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs'
                    }`}>
                      {dayActivities.length}
                    </span>

                    {currentRole !== 'viewer' && (
                      <button
                        onClick={() => handleOpenAddModal(day.dateStr)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isToday ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                        title={`Add activity to ${day.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Day Tasks List */}
                <div className="p-3 flex-1 space-y-2.5 overflow-y-auto font-urbanist">
                  {/* Drop Target Indicator when dragging over this day */}
                  {isColumnTargeted && (
                    <div className="p-3 mb-2 rounded-2xl border-2 border-dashed border-[#8FC2F0] bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse shadow-xs shrink-0">
                      <ArrowDown className="w-4 h-4 text-[#8FC2F0] animate-bounce" />
                      <span>Drop here to move to {day.name}</span>
                    </div>
                  )}

                  {dayActivities.length === 0 ? (
                    <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-400 dark:text-slate-500 text-xs">
                      <span>No activities scheduled</span>
                      {currentRole !== 'viewer' && (
                        <button
                          onClick={() => handleOpenAddModal(day.dateStr)}
                          className="mt-2 text-[11px] font-bold text-[#292D32] dark:text-[#8FC2F0] hover:text-[#8FC2F0] hover:underline flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Plan Activity</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    dayActivities.map(item => {
                      const cfg = getChannelConfig(item.channel);
                      const isDone = item.status === 'completed';
                      const proj = projects.find(p => p.id === item.project_id);
                      const isBeingDragged = draggedActivityId === item.id;

                      return (
                        <div 
                          key={item.id}
                          draggable={currentRole !== 'viewer'}
                          onDragStart={(e) => {
                            if (currentRole === 'viewer') return;
                            e.dataTransfer.setData('text/plain', item.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedActivityId(item.id);
                          }}
                          onDragEnd={() => {
                            setDraggedActivityId(null);
                            setDragOverDayDate(null);
                          }}
                          className={`p-4 transition-all duration-200 flex flex-col justify-between group relative select-none font-urbanist ${
                            isBeingDragged
                              ? 'opacity-35 border-2 border-dashed border-[#8FC2F0] bg-[#8FC2F0]/20 shadow-none scale-[0.98] rounded-[24px]'
                              : isDone 
                                ? 'crm-kanban-card border-[#77CE69]/60 dark:border-[#77CE69]/40 bg-gradient-to-b from-white dark:from-[#1C2232] to-emerald-50/40 dark:to-emerald-950/20' 
                                : 'crm-kanban-card'
                          } ${currentRole !== 'viewer' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        >
                          <div>
                            {/* 1. TOP HEADER: Target Type Badge + Priority + Status/Delete */}
                            <div className="flex items-center justify-between gap-1.5 mb-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                {currentRole !== 'viewer' && (
                                  <div 
                                    className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-[#8FC2F0] transition-colors cursor-grab active:cursor-grabbing -ml-1 shrink-0" 
                                    title={t('dragNotice')}
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                )}

                                {item.project_id && proj ? (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    {proj.pr_number}
                                  </span>
                                ) : item.custom_target ? (
                                  <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    Custom Target
                                  </span>
                                ) : item.location_name ? (
                                  <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    Hunting Zone
                                  </span>
                                ) : null}

                                {item.priority === 'urgent' && !isDone && (
                                  <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <Flame className="w-2.5 h-2.5" />
                                    Urgent
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {isDone ? (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                    Done
                                  </span>
                                ) : null}

                                {currentRole !== 'viewer' && (
                                  <button
                                    draggable={false}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => handleDelete(item.id)}
                                    className="text-slate-300 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                    title="Remove from plan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* 2. PROJECT / TARGET NAME (BIG, PROMINENT & AT THE TOP) */}
                            <div className="mb-2">
                              {item.project_id && proj ? (
                                <Link 
                                  href={`/projects/${proj.id}`}
                                  draggable={false}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="block text-sm sm:text-base font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-[#8FC2F0] transition-colors tracking-tight leading-snug break-words"
                                >
                                  {item.project_name || proj.name}
                                </Link>
                              ) : (
                                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-snug break-words">
                                  {item.project_name || item.custom_target || item.location_name || 'Sales Objective'}
                                </h4>
                              )}

                              {item.company_name && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{item.company_name}</span>
                                </div>
                              )}
                            </div>

                            {/* 3. CHANNEL BADGE & TIME SLOT SUB-BAR */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 shadow-2xs ${cfg.color}`}>
                                {cfg.icon}
                                <span>{cfg.label}</span>
                              </span>
                              
                              {item.time_slot && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-300 font-semibold flex items-center gap-1 bg-slate-100/80 dark:bg-[#232A38] px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {item.time_slot}
                                </span>
                              )}
                            </div>

                            {/* 4. GOAL / ACTION DESCRIPTION (Clean crm-card-soft container) */}
                            <div className="crm-card-soft p-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed break-words">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                                Activity Goal:
                              </span>
                              {item.goal}
                            </div>

                            {/* 5. GOOGLE MAPS LOCATION BUTTON */}
                            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                              {item.google_maps_url ? (
                                <a
                                  href={item.google_maps_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  draggable={false}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition-all shadow-2xs group/map"
                                  title="Open GPS Location in Google Maps"
                                >
                                  <Navigation className="w-3 h-3 text-emerald-600 dark:text-emerald-400 group-hover/map:scale-110 transition-transform" />
                                  <span>Google Maps ↗</span>
                                </a>
                              ) : (item.location_name || item.project_name) ? (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location_name || item.project_name || '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  draggable={false}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 dark:bg-[#141820] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-[#8FC2F0] border border-slate-200 dark:border-slate-800 text-[10px] font-semibold transition-colors"
                                  title="Search Location on Google Maps"
                                >
                                  <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                  <span className="truncate max-w-[130px]">{item.location_name || item.project_name}</span>
                                  <ExternalLink className="w-2 h-2" />
                                </a>
                              ) : null}
                            </div>
                          </div>

                          {/* Action Footer */}
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            {/* Quick Day Rescheduler */}
                            <select
                              value={day.dateStr}
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                              onChange={(e) => handleMoveDay(item.id, e.target.value)}
                              className="text-[10px] text-slate-400 dark:text-slate-400 bg-transparent border-0 focus:outline-none hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-medium"
                              title="Reschedule to another day"
                            >
                              <option value={day.dateStr} className="dark:bg-[#1C2130] dark:text-slate-200">Move...</option>
                              {workDays.map(d => (
                                <option key={d.dateStr} value={d.dateStr} className="dark:bg-[#1C2130] dark:text-slate-200">
                                  &rarr; {d.short} ({d.dayNum} Sep)
                                </option>
                              ))}
                            </select>

                            {/* Log Activity Button */}
                            {currentRole !== 'viewer' && (
                              <button
                                draggable={false}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => openFastLog({
                                  project: proj || null,
                                  contactId: item.contact_id,
                                  plannedActivityId: item.id,
                                  defaultGoal: item.goal
                                })}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isDone 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                    : 'bg-[#8FC2F0]/20 dark:bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] hover:bg-[#8FC2F0] hover:text-[#292D32] border border-[#8FC2F0]/40 shadow-2xs font-urbanist'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>{isDone ? 'Logged' : 'Log Activity'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADVANCED "+ PLAN SALES ACTIVITY" MODAL (Supporting All 3 Modes + Maps) */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2130] rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-[#8FC2F0]/15 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#232A38] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Plan Sales Activity</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Scheduled touchpoint with client or regional hunting</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePlannedActivity} className="p-6 space-y-4 text-xs overflow-y-auto">
              
              {/* Day & Time Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Scheduled Day</label>
                  <select
                    value={selectedDayForAdd}
                    onChange={(e) => setSelectedDayForAdd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white"
                  >
                    {workDays.map(d => (
                      <option key={d.dateStr} value={d.dateStr} className="dark:bg-[#141820] dark:text-white">
                        {d.name} &bull; {d.dayNum} Sep
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Time</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white"
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot} className="dark:bg-[#141820] dark:text-white">{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Planning Mode Tabs (Existing Project vs Custom Deal vs Area/Hunting) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('targetActivityType')}
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-[#141820] rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setTargetMode('existing_project')}
                    className={cn(
                      "py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer",
                      targetMode === 'existing_project' 
                        ? "bg-white dark:bg-[#232A38] text-blue-600 dark:text-[#8FC2F0] shadow-2xs" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{t('existingProject')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('custom_project')}
                    className={cn(
                      "py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer",
                      targetMode === 'custom_project' 
                        ? "bg-white dark:bg-[#232A38] text-purple-600 dark:text-purple-300 shadow-2xs" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{t('newCustomDeal')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('area_hunting')}
                    className={cn(
                      "py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer",
                      targetMode === 'area_hunting' 
                        ? "bg-white dark:bg-[#232A38] text-amber-600 dark:text-amber-400 shadow-2xs" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>{t('areaHunting')}</span>
                  </button>
                </div>
              </div>

              {/* Conditional Inputs based on Target Mode */}
              {targetMode === 'existing_project' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'اختر المشروع المسجل' : 'Select Existing Project'}
                  </label>
                  <select
                    value={newProjectId}
                    onChange={(e) => {
                      setNewProjectId(e.target.value);
                      const p = projects.find(proj => proj.id === e.target.value);
                      if (p?.location) setLocationAreaName(p.location);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id} className="dark:bg-[#141820] dark:text-white">
                        {p.pr_number} &bull; {p.name} ({p.company_name} - {p.location})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetMode === 'custom_project' && (
                <div className="space-y-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40">
                  <div>
                    <label className="block font-bold text-purple-900 dark:text-purple-300 mb-1">
                      {t('projectNameLabel')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={customProjectName}
                      onChange={(e) => setCustomProjectName(e.target.value)}
                      placeholder={isRTL ? "مثال: برج أبحر السكني، توسعة جامعة الطائف" : "e.g. Obhur Residential Tower, Taif University Expansion"}
                      className="w-full px-3 py-2 bg-white dark:bg-[#141820] border border-purple-200 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold text-purple-900 dark:text-purple-100 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-purple-900 dark:text-purple-300 mb-1">
                        {isRTL ? 'العميل / المقاول' : 'Client / Contractor'}
                      </label>
                      <input
                        type="text"
                        value={customCompanyName}
                        onChange={(e) => setCustomCompanyName(e.target.value)}
                        placeholder={isRTL ? "مجموعة بن لادن، البواني" : "e.g. Binladin Group, Al Bawani"}
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#141820] border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-purple-900 dark:text-purple-100 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-purple-900 dark:text-purple-300 mb-1">
                        {isRTL ? 'المدينة / المنطقة' : 'City / Region'}
                      </label>
                      <input
                        type="text"
                        value={locationAreaName}
                        onChange={(e) => setLocationAreaName(e.target.value)}
                        placeholder={isRTL ? "جدة، مكة" : "e.g. Jeddah, Makkah"}
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#141820] border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-purple-900 dark:text-purple-100 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {targetMode === 'area_hunting' && (
                <div className="space-y-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
                  <div>
                    <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                      {t('targetAreaLabel')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={locationAreaName}
                      onChange={(e) => setLocationAreaName(e.target.value)}
                      placeholder={isRTL ? "مثال: صناعية جدة الثانية، طريق ميناء ينبع" : "e.g. Jeddah Industrial Area 2, Yanbu Port Road"}
                      className="w-full px-3 py-2 bg-white dark:bg-[#141820] border border-amber-200 dark:border-amber-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold text-amber-900 dark:text-amber-100 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Quick Western Region Presets */}
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block mb-1">
                      {isRTL ? 'مناطق سريعة بالغربية:' : 'Quick Western Region Zones:'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_AREAS.slice(0, 4).map(area => {
                        const areaLabel = isRTL ? area.ar : area.en;
                        return (
                          <button
                            key={area.en}
                            type="button"
                            onClick={() => setLocationAreaName(areaLabel)}
                            className="text-[9px] px-2 py-0.5 rounded bg-white dark:bg-[#1C2130] hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium transition-colors cursor-pointer"
                          >
                            {areaLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                      {isRTL ? 'القطاع أو نشاط المنشأة المستهدفة' : 'Target Sector / Organization Focus'}
                    </label>
                    <input
                      type="text"
                      value={customCompanyName}
                      onChange={(e) => setCustomCompanyName(e.target.value)}
                      placeholder={isRTL ? "مثال: مقاولو التكييف، مكاتب الاستشارات الهندسية" : "e.g. HVAC Contractors, Engineering Consultants"}
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#141820] border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-100 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* Google Maps Location Link Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('googleMapsLink')}</span>
                  </label>

                  {/* Search on Google Maps Helper */}
                  {(locationAreaName || customProjectName || selectedExistingProject) && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        targetMode === 'area_hunting' ? locationAreaName :
                        targetMode === 'custom_project' ? `${customProjectName} ${locationAreaName}` :
                        `${selectedExistingProject?.name} ${selectedExistingProject?.location || 'Jeddah'}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-blue-600 dark:text-[#8FC2F0] hover:underline flex items-center gap-0.5"
                    >
                      <span>Find on Google Maps ↗</span>
                    </a>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="url"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/... or paste location URL"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px] text-slate-800 dark:text-white placeholder:text-slate-400"
                  />
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Allows 1-click GPS navigation straight to the site from your mobile or laptop
                </p>
              </div>

              {/* Channel & Purpose */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sales Channel</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as ActivityChannel)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white"
                  >
                    {ACTIVITY_CHANNELS.map(ch => (
                      <option key={ch.value} value={ch.value} className="dark:bg-[#141820] dark:text-white">{ch.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Visit Purpose</label>
                  <select
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value as VisitPurpose)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white"
                  >
                    {VISIT_PURPOSES.map(vp => (
                      <option key={vp.value} value={vp.value} className="dark:bg-[#141820] dark:text-white">{vp.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Action & Goal */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Action &amp; Target Goal *</label>
                <input
                  type="text"
                  required
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="e.g. Conduct hunting visit, meet procurement manager, deliver submittal"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                <div className="flex items-center gap-2">
                  {(['urgent', 'high', 'medium', 'low'] as ProjectPriority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg border capitalize font-bold transition-all ${
                        newPriority === p 
                          ? 'bg-blue-600 dark:bg-[#8FC2F0] text-white dark:text-[#141820] border-blue-600 dark:border-[#8FC2F0] shadow-xs' 
                          : 'bg-slate-50 dark:bg-[#141820] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-[#8FC2F0] dark:hover:bg-[#7ab2e3] text-white dark:text-[#141820] font-bold shadow-md shadow-blue-500/20"
                >
                  Save to Week Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notification for drag and drop reschedule */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-xs text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
