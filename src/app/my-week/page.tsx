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
  Pencil,
  ExternalLink,
  Search,
  Filter,
  ArrowRightLeft,
  Navigation,
  GripVertical,
  ArrowDown,
  MessageSquare
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { useSalesScope } from '@/lib/hooks/useSalesScope';
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
  monthName: string;
  monthNameAr: string;
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
    completePlannedActivity,
    completeAllPastPlannedActivities,
    currentRole,
    salesTargets,
    selectedSalesFilter,
    setSelectedSalesFilter,
    teamMembers,
    sharePlanTaskToChat,
    openChat
  } = useCRM();
  const { t, isRTL, language } = useLanguage();

  const { 
    isManager, 
    scopedProjects, 
    scopedPlannedActivities 
  } = useSalesScope();

  // Selected Week state (Sunday to Thursday)
  const [weekOffset, setWeekOffset] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [isOverdueNoticesModalOpen, setIsOverdueNoticesModalOpen] = useState(false);
  const [suggestionsSearch, setSuggestionsSearch] = useState('');
  const [overdueSearch, setOverdueSearch] = useState('');
  const [selectedDayForAdd, setSelectedDayForAdd] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [editingActivity, setEditingActivity] = useState<PlannedActivity | null>(null);
  const [isPlanSubmitted, setIsPlanSubmitted] = useState(true);

  // Filters state (with deferred search values for 0ms typing responsiveness)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'follow_ups' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const deferredSuggestionsSearch = React.useDeferredValue(suggestionsSearch);
  const deferredOverdueSearch = React.useDeferredValue(overdueSearch);

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

  // Chat collaboration state (Manager/Peer reviewing plan cards)
  const [selectedTaskForChat, setSelectedTaskForChat] = useState<PlannedActivity | null>(null);
  const [chatComment, setChatComment] = useState('');
  const [isChatNoteModalOpen, setIsChatNoteModalOpen] = useState(false);

  // Compute 6 Saudi work days: Saturday through Thursday
  const workDays: DayConfig[] = useMemo(() => {
    // Computes Saturday of the current week (or offset week)
    const baseSaturday = getSaturdayOfWeek(new Date(), weekOffset);

    const dayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const dayShorts = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
    const dayArabics = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

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
        dayNum: d.getDate(),
        monthName: monthNamesEn[d.getMonth()],
        monthNameAr: monthNamesAr[d.getMonth()]
      };
    });
  }, [weekOffset]);

  // Suggested Activities Engine (PRD Section 5) - Full list of overdue or high value at risk
  const allSuggestedItems = useMemo(() => {
    const plannedProjectIds = new Set(scopedPlannedActivities.map(p => p.project_id).filter(Boolean));
    const today = new Date().toISOString().split('T')[0];

    return scopedProjects.filter(p => {
      if (p.pipeline_stage === 'won' || p.pipeline_stage === 'lost' || p.pipeline_stage === 'hold') return false;
      if (plannedProjectIds.has(p.id)) return false;
      return (p.next_follow_up_at && p.next_follow_up_at <= today) || p.calculated_health === 'red';
    }).sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0));
  }, [scopedProjects, scopedPlannedActivities]);

  const filteredSuggestedItems = useMemo(() => {
    if (!deferredSuggestionsSearch.trim()) return allSuggestedItems;
    const q = deferredSuggestionsSearch.toLowerCase();
    return allSuggestedItems.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.pr_number.toLowerCase().includes(q) ||
      (p.company_name && p.company_name.toLowerCase().includes(q))
    );
  }, [allSuggestedItems, deferredSuggestionsSearch]);

  const suggestedItems = filteredSuggestedItems;

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
    setEditingActivity(null);
    setSelectedDayForAdd(dateStr);
    setTargetMode('existing_project');
    setNewProjectId(scopedProjects[0]?.id || '');
    setCustomProjectName('');
    setCustomCompanyName('');
    setLocationAreaName('');
    setGoogleMapsUrl('');
    setTimeSlot('10:00 AM');
    setNewChannel('call');
    setNewPurpose('follow_up');
    setNewGoal('');
    setNewPriority('high');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: PlannedActivity) => {
    setEditingActivity(item);
    setSelectedDayForAdd(item.scheduled_date || workDays[0]?.dateStr || '');
    setTimeSlot(item.time_slot || '10:00 AM');
    setNewChannel(item.channel || 'call');
    setNewPurpose(item.visit_purpose || 'follow_up');
    setNewGoal(item.goal || '');
    setNewPriority(item.priority || 'high');
    setLocationAreaName(item.location_name || '');
    setGoogleMapsUrl(item.google_maps_url || '');

    if (item.project_id) {
      setTargetMode('existing_project');
      setNewProjectId(item.project_id);
      setCustomProjectName('');
      setCustomCompanyName('');
    } else if (item.custom_target) {
      setTargetMode('custom_project');
      setCustomProjectName(item.project_name || item.custom_target || '');
      setCustomCompanyName(item.company_name || '');
    } else {
      setTargetMode('area_hunting');
      setCustomCompanyName(item.company_name || '');
      setLocationAreaName(item.location_name || item.project_name || '');
    }

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
      locName = locationAreaName.trim();
    } else {
      // Area / Hunting
      projName = locationAreaName.trim() || 'Regional Hunting Zone';
      compName = customCompanyName.trim() || 'Potential Accounts';
      locName = locationAreaName.trim() || 'Western Region';
    }

    if (editingActivity) {
      await updatePlannedActivity(editingActivity.id, {
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
      });
      setToastMessage(isRTL ? 'تم تحديث النشاط المخطط بنجاح' : 'Planned activity updated successfully');
      setTimeout(() => setToastMessage(null), 3000);
      setEditingActivity(null);
    } else {
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
    }

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

  const currentWeekDates = useMemo(() => new Set(workDays.map(d => d.dateStr)), [workDays]);

  // Current week specific activities & metrics
  const thisWeekActivities = useMemo(() => {
    return scopedPlannedActivities.filter(p => currentWeekDates.has(p.scheduled_date));
  }, [scopedPlannedActivities, currentWeekDates]);

  const thisWeekPlannedCount = thisWeekActivities.length;
  const thisWeekCompletedCount = thisWeekActivities.filter(p => p.status === 'completed').length;
  const thisWeekFollowUpsCount = thisWeekActivities.filter(p => p.is_follow_up).length;
  const weeklyTarget = 20;
  const weekProgressPercent = Math.min(100, Math.round((thisWeekCompletedCount / weeklyTarget) * 100));

  // Pending tasks from earlier / other weeks
  const pendingOtherWeeksActivities = useMemo(() => {
    return scopedPlannedActivities.filter(p => p.status === 'planned' && !currentWeekDates.has(p.scheduled_date))
      .sort((a, b) => new Date(b.scheduled_date || 0).getTime() - new Date(a.scheduled_date || 0).getTime());
  }, [scopedPlannedActivities, currentWeekDates]);

  const pendingOtherWeeksCount = pendingOtherWeeksActivities.length;

  const filteredOverdueActivities = useMemo(() => {
    if (!deferredOverdueSearch.trim()) return pendingOtherWeeksActivities;
    const q = deferredOverdueSearch.toLowerCase();
    return pendingOtherWeeksActivities.filter(p => 
      (p.project_name && p.project_name.toLowerCase().includes(q)) ||
      (p.company_name && p.company_name.toLowerCase().includes(q)) ||
      (p.goal && p.goal.toLowerCase().includes(q)) ||
      (p.location_name && p.location_name.toLowerCase().includes(q)) ||
      (p.scheduled_date && p.scheduled_date.includes(q))
    );
  }, [pendingOtherWeeksActivities, deferredOverdueSearch]);

  const jumpToActivityWeek = (scheduledDate: string) => {
    try {
      const actDate = new Date(scheduledDate + 'T00:00:00');
      const todaySat = getSaturdayOfWeek(new Date(), 0);
      const actSat = getSaturdayOfWeek(actDate, 0);
      const diffTime = actSat.getTime() - todaySat.getTime();
      const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
      setWeekOffset(diffWeeks);
      setIsOverdueNoticesModalOpen(false);
      setToastMessage(isRTL ? `تم الانتقال لأسبوع النشاط (${scheduledDate})` : `Navigated to activity week (${scheduledDate})`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setWeekOffset(prev => prev - 1);
      setIsOverdueNoticesModalOpen(false);
    }
  };

  const handleReschedulePending = async (activityId: string, targetDateStr: string) => {
    await updatePlannedActivity(activityId, { scheduled_date: targetDateStr });
    const targetDayObj = workDays.find(d => d.dateStr === targetDateStr);
    const dayLabel = targetDayObj ? `${targetDayObj.name} (${targetDayObj.arabic})` : targetDateStr;
    setToastMessage(isRTL ? `تم ترحيل النشاط إلى ${dayLabel} بنجاح` : `Rescheduled activity to ${dayLabel}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMarkPendingCompleted = async (activityId: string) => {
    const act = scopedPlannedActivities.find(a => a.id === activityId);
    if (act) {
      const proj = scopedProjects.find(p => p.id === act.project_id);
      await completePlannedActivity(activityId, {
        project_id: act.project_id,
        project_name: act.project_name || proj?.name,
        company_id: act.company_id || proj?.company_id,
        company_name: act.company_name || proj?.company_name,
        contact_id: act.contact_id,
        contact_name: act.contact_name,
        user_id: act.user_id || currentUser.id,
        user_name: act.user_name || currentUser.full_name,
        activity_date: act.scheduled_date || new Date().toISOString().split('T')[0],
        activity_time: act.time_slot || '10:00 AM',
        channel: act.channel || 'call',
        visit_purpose: act.visit_purpose || 'follow_up',
        outcome: 'connected',
        notes: act.goal || (isRTL ? 'تم إنجاز النشاط من الخطة الأسبوعية' : 'Completed from weekly plan'),
        location_name: act.location_name,
        google_maps_url: act.google_maps_url,
        priority: act.priority,
      });
    } else {
      await updatePlannedActivity(activityId, { status: 'completed' });
    }
    setToastMessage(isRTL ? 'تم تسجيل إنجاز النشاط ونقله لسجل الأنشطة بنجاح' : 'Activity marked as completed and logged to Activities');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRolloverTopBatch = async (count: number = 10) => {
    const toRollover = pendingOtherWeeksActivities.slice(0, count);
    if (toRollover.length === 0) return;
    
    for (let i = 0; i < toRollover.length; i++) {
      const targetDay = workDays[i % workDays.length].dateStr;
      await updatePlannedActivity(toRollover[i].id, { scheduled_date: targetDay });
    }
    setToastMessage(isRTL ? `تم ترحيل ${toRollover.length} نشاط بنجاح إلى هذا الأسبوع` : `Rolled over ${toRollover.length} activities to this week`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedExistingProject = scopedProjects.find(p => p.id === newProjectId);

  return (
    <div className="space-y-2.5 sm:space-y-3 max-w-[1600px] mx-auto animate-in fade-in duration-200 text-[#292D32] dark:text-white">
      
      {/* ========================================================================= */}
      {/* HEADER BAR: SAUDI WORKWEEK NAVIGATION & STATUS */}
      {/* ========================================================================= */}
      <div className="crm-card p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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

            {weekOffset === 0 ? (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                {isRTL ? '● الأسبوع الحالي' : '● Current Week'}
              </span>
            ) : weekOffset < 0 ? (
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
                {isRTL ? `◀ الأسبوع الماضي (${Math.abs(weekOffset)})` : `◀ Past Week (${Math.abs(weekOffset)})`}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
                {isRTL ? `الأسبوع القادم (+${weekOffset}) ▶` : `Future Week (+${weekOffset}) ▶`}
              </span>
            )}

            {/* Smart Plan Suggestions Button */}
            <button
              type="button"
              onClick={() => setIsSuggestionsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40 border border-blue-200 dark:border-blue-800 hover:border-blue-400 text-xs font-bold text-[#292D32] dark:text-[#8FC2F0] transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
              title={isRTL ? 'عرض مقترحات المشاريع التي تتطلب متابعة أو ذات قيمة كبرى' : 'View automated plan suggestions'}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse group-hover:rotate-12 transition-transform" />
              <span>{isRTL ? '✨ الاقتراحات الذكية للخطة' : '✨ Smart Suggestions'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-purple-600 dark:bg-purple-500 text-white text-[10px] font-mono font-bold">
                {allSuggestedItems.length}
              </span>
            </button>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#292D32] dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
            <span>{isRTL ? 'خطة الأسبوع الميدانية' : 'My Week Plan'}</span>
            <span className="text-slate-400 font-normal">&bull;</span>
            <span className="text-blue-600 dark:text-[#8FC2F0]">
              {workDays[0]?.short} {workDays[0]?.dayNum} &ndash; {workDays[workDays.length - 1]?.short} {workDays[workDays.length - 1]?.dayNum}
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL 
              ? 'مخطط الأسبوع الميداني لـ 6 أيام (السبت - الخميس) بربط الخرائط والتسجيل المباشر وتحديد مستهدفات العملاء'
              : '6-day structured field planner (Saturday – Thursday) with Google Maps GPS routing, direct logging, and flexible client targets'}
          </p>
        </div>

        {/* Progress against 20 Touchpoints Target */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400">{isRTL ? 'سرعة إنجاز الأسبوع' : 'Week Velocity'}</div>
            <div className="text-lg sm:text-xl font-extrabold text-[#292D32] dark:text-white font-mono">
              {thisWeekCompletedCount} <span className="text-xs text-slate-400 font-bold font-sans">/ {thisWeekPlannedCount} {isRTL ? 'مخطط' : 'Planned'}</span>
            </div>
            <div className="w-32 sm:w-36 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 sm:h-2 mt-1 overflow-hidden">
              <div 
                className="bg-[#8FC2F0] h-full rounded-full transition-[width] duration-300 ease-out"
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

          <div className="flex items-center gap-1 ltr:border-l rtl:border-r border-slate-200 dark:border-slate-800 ltr:pl-3 rtl:pr-3">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              title={isRTL ? 'الأسبوع السابق' : 'Previous Week'}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className={cn(
                "px-3 py-1.5 rounded-full border text-xs font-bold transition-colors cursor-pointer shadow-2xs",
                weekOffset === 0 
                  ? "bg-blue-600 dark:bg-[#8FC2F0] text-white dark:text-[#141820] border-transparent" 
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {isRTL ? 'الأسبوع الحالي' : 'Current Week'}
            </button>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              title={isRTL ? 'الأسبوع القادم' : 'Next Week'}
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Pending Activities from Other Weeks Alert Banner - Single Slim & Professional */}
      {pendingOtherWeeksCount > 0 && (
        <div className="crm-card px-3.5 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 flex items-center justify-between flex-wrap gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-medium">
              {isRTL 
                ? `تنبيه: لديك ${pendingOtherWeeksCount} نشاط مخطط معلق من أسابيع سابقة لم تكتمل بعد.`
                : `Notice: You have ${pendingOtherWeeksCount} pending planned activities from previous/other weeks.`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await completeAllPastPlannedActivities();
                setToastMessage(isRTL ? '✓ تم تعليم كافة المتابعات والمهام السابقة كمكتملة بنجاح!' : '✓ All past pending tasks marked as completed!');
                setTimeout(() => setToastMessage(null), 3500);
              }}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title={isRTL ? 'إذا كنت قد قمت بمتابعة هذه الأنشطة مسبقاً (مكالمات/واتساب)، اضغط هنا لإنهائها دفعة واحدة' : 'Mark all past pending tasks as completed'}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isRTL ? '✓ تم إنجازها جميعاً' : '✓ Mark All Done'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOverdueNoticesModalOpen(true)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{isRTL ? 'عرض وإدارة' : 'Review & Manage'}</span>
            </button>
          </div>
        </div>
      )}

      {/* QUICK FILTER BAR */}
      <div className="crm-card p-2.5 sm:p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'ابحث في الخطة بالمشروع، المنطقة، أو الهدف...' : 'Search plan by project, area, or goal...'}
              className="w-full ltr:pl-8.5 rtl:pr-8.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#8FC2F0] text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 font-bold text-xs flex-wrap gap-0.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all text-xs cursor-pointer",
                statusFilter === 'all' ? "bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-2xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {isRTL ? 'الكل' : 'All'} ({thisWeekPlannedCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all text-xs cursor-pointer",
                statusFilter === 'pending' ? "bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-2xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {isRTL ? 'معلق' : 'Pending'} ({thisWeekPlannedCount - thisWeekCompletedCount})
            </button>
            <button
              onClick={() => setStatusFilter('follow_ups')}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all text-xs cursor-pointer flex items-center gap-1",
                statusFilter === 'follow_ups' 
                  ? "bg-amber-500 text-white shadow-2xs" 
                  : "text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/30"
              )}
              title={isRTL ? 'عرض مهام المتابعة فقط' : 'Show follow-up tasks only'}
            >
              <Clock className="w-3 h-3" />
              <span>{isRTL ? 'متابعات' : 'Follow-ups'} ({thisWeekFollowUpsCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all text-xs cursor-pointer",
                statusFilter === 'completed' ? "bg-[#77CE69] text-white shadow-2xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {isRTL ? 'مكتمل' : 'Completed'} ({thisWeekCompletedCount})
            </button>
          </div>
        </div>

        <button
          onClick={() => handleOpenAddModal(workDays[0].dateStr)}
          className="crm-pill-dark w-full sm:w-auto px-4 py-2 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer text-xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#8FC2F0]" />
          <span>{isRTL ? '+ نشاط بيعي جديد' : 'New Sales Activity'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 5-DAY SAUDI WORKWEEK PLANNER GRID (Sun &ndash; Thu) & Odoo Drag & Drop */}
      {/* ========================================================================= */}
      <div className="space-y-2">
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
            } else if (statusFilter === 'follow_ups') {
              dayActivities = dayActivities.filter(p => p.is_follow_up);
            }

            if (deferredSearchQuery.trim()) {
              const q = deferredSearchQuery.toLowerCase();
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
                <div className={`p-4 border-b rounded-t-[28px] flex items-center justify-between ${
                  isToday ? 'bg-[#292D32] dark:bg-slate-800 text-white border-slate-700' : 'bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm tracking-tight">{isRTL ? day.arabic : day.name}</span>
                      <span className={`text-[10px] font-bold ${isToday ? 'text-slate-300' : 'text-slate-400'}`}>
                        ({isRTL ? day.short : day.arabic})
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-extrabold uppercase bg-[#8FC2F0] text-[#292D32] px-2 py-0.5 rounded-full">
                          {isRTL ? 'اليوم' : 'Today'}
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] font-semibold ${isToday ? 'text-slate-300' : 'text-slate-400'}`}>
                      {day.dayNum} {isRTL ? day.monthNameAr : day.monthName}
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
                                : item.is_follow_up
                                  ? 'crm-kanban-card border-amber-300 dark:border-amber-500/80 bg-gradient-to-b from-amber-50/85 via-amber-50/30 to-white dark:from-amber-950/40 dark:via-[#1C2232] dark:to-[#1C2232] shadow-[0_4px_16px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/40 dark:ring-amber-500/30'
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

                                {item.is_follow_up && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 flex items-center gap-1 shadow-2xs shrink-0">
                                    <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                    <span>{isRTL ? 'متابعة مطلوبة' : 'Follow-up Task'}</span>
                                  </span>
                                )}

                                {item.project_id && proj ? (
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    {proj.pr_number}
                                  </span>
                                ) : item.custom_target ? (
                                  <span className="text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    Custom Target
                                  </span>
                                ) : item.location_name ? (
                                  <span className="text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    Hunting Zone
                                  </span>
                                ) : null}

                                {item.priority === 'urgent' && !isDone && (
                                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
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
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      draggable={false}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={() => handleOpenEditModal(item)}
                                      className="text-slate-300 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                      title={isRTL ? "تعديل النشاط" : "Edit planned activity"}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      draggable={false}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={() => handleDelete(item.id)}
                                      className="text-slate-300 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                      title={isRTL ? "حذف من الخطة" : "Remove from plan"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
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

                              <div className="flex flex-col gap-0.5 mt-1">
                                {item.company_name && (
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate flex items-center gap-1">
                                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{item.company_name}</span>
                                  </div>
                                )}

                                {item.contact_name && (
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{item.contact_name}</span>
                                  </div>
                                )}
                              </div>
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

                            {/* 4. GOAL / ACTION DESCRIPTION (Enhanced for Follow-up) */}
                            <div className={cn(
                              "p-2.5 text-xs font-medium leading-relaxed break-words rounded-xl transition-colors",
                              item.is_follow_up
                                ? "bg-amber-100/70 dark:bg-amber-950/50 border border-amber-300/80 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 shadow-2xs"
                                : "crm-card-soft text-slate-700 dark:text-slate-300"
                            )}>
                              <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider block",
                                  item.is_follow_up ? "text-amber-700 dark:text-amber-400 font-extrabold flex items-center gap-1" : "text-slate-400 dark:text-slate-500"
                                )}>
                                  {item.is_follow_up ? (
                                    <>
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                                      <span>{isRTL ? 'إجراء المتابعة المطلوب (Next Action):' : 'Next Action / Follow-up:'}</span>
                                    </>
                                  ) : (
                                    isRTL ? 'هدف النشاط:' : 'Activity Goal:'
                                  )}
                                </span>
                              </div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{item.goal}</p>
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
                                  &rarr; {isRTL ? d.arabic : d.short} ({d.dayNum} {isRTL ? d.monthNameAr : d.monthName})
                                </option>
                              ))}
                            </select>

                            {/* Manager Review Action: Send directive/comment to employee who owns this plan card */}
                            {isManager && item.user_id !== currentUser.id && (
                              <button
                                type="button"
                                data-testid="task-chat-btn"
                                draggable={false}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => {
                                  setSelectedTaskForChat(item);
                                  setChatComment('');
                                  setIsChatNoteModalOpen(true);
                                }}
                                className="p-1.5 rounded-full text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                                title={isRTL ? `إرسال توجيه للمهندس ${item.user_name || ''} عبر المحادثة الخاصة` : `Send directive to ${item.user_name || 'Sales Rep'} in private chat`}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Log Activity Button */}
                            {currentRole !== 'viewer' && (
                              <button
                                draggable={false}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => {
                                  const isArea = !item.project_id && !!(item.location_name || item.custom_target);
                                  const isCustom = !item.project_id && !!item.project_name && !item.location_name;
                                  const mode = isArea ? 'area_hunting' : isCustom ? 'custom_project' : 'existing_project';

                                  openFastLog({
                                    project: proj || null,
                                    contactId: item.contact_id,
                                    plannedActivityId: item.id,
                                    defaultGoal: item.goal,
                                    initialDate: item.scheduled_date || day.dateStr,
                                    initialTime: item.time_slot || '10:00 AM',
                                    defaultChannel: item.channel,
                                    defaultPurpose: item.visit_purpose,
                                    initialTargetMode: mode,
                                    initialCustomProjectName: item.project_name,
                                    initialCompanyName: item.company_name,
                                    initialLocationName: item.location_name,
                                    initialGoogleMapsUrl: item.google_maps_url,
                                    initialPriority: item.priority,
                                  });
                                }}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isDone 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                    : 'bg-[#8FC2F0]/20 dark:bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] hover:bg-[#8FC2F0] hover:text-[#292D32] border border-[#8FC2F0]/40 shadow-2xs font-urbanist'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>{isDone ? (isRTL ? 'تم التسجيل ✓' : 'Logged ✓') : (isRTL ? 'تسجيل النشاط' : 'Log Activity')}</span>
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
                  {editingActivity ? <Pencil className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editingActivity 
                      ? (isRTL ? 'تعديل النشاط المخطط' : 'Edit Planned Activity')
                      : (isRTL ? 'تخطيط نشاط مبيعات' : 'Plan Sales Activity')}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {editingActivity 
                      ? (isRTL ? 'تعديل موعد أو تفاصيل أو هدف الزيارة' : 'Update date, time, target, or goal')
                      : (isRTL ? 'موعد مجدول مع عميل أو نشاط ميداني' : 'Scheduled touchpoint with client or regional hunting')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setIsAddModalOpen(false); setEditingActivity(null); }}
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
                            className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-[#1C2130] hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium transition-colors cursor-pointer"
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
                  onClick={() => { setIsAddModalOpen(false); setEditingActivity(null); }}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-[#8FC2F0] dark:hover:bg-[#7ab2e3] text-white dark:text-[#141820] font-bold shadow-md shadow-blue-500/20"
                >
                  {editingActivity 
                    ? (isRTL ? 'حفظ التعديلات' : 'Save Changes')
                    : (isRTL ? 'إضافة إلى خطة الأسبوع' : 'Save to Week Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SMART PLAN SUGGESTIONS MODAL (All overdue or high-value projects) */}
      {/* ========================================================================= */}
      {isSuggestionsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="crm-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141820] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-50/50 via-purple-50/40 to-slate-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#292D32] dark:text-white flex items-center gap-2">
                    <span>{isRTL ? 'اقتراحات الخطة الذكية للمشاريع' : 'Automated Smart Plan Suggestions'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-mono font-bold">
                      {allSuggestedItems.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {isRTL 
                      ? 'مشاريع متأخرة المتابعة أو ذات قيمة تعاقدية عالية؛ يمكنك جدولتها مباشرة في اليوم المطلوب لهذا الأسبوع'
                      : 'Projects overdue for follow-up or high-value at risk; click any day to schedule immediately.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSuggestionsModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 sm:px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={suggestionsSearch}
                  onChange={(e) => setSuggestionsSearch(e.target.value)}
                  placeholder={isRTL ? 'بحث في المقترحات برقم PR، اسم المشروع، المقاول...' : 'Search suggestions by PR, name, company...'}
                  className="w-full ltr:pl-8.5 rtl:pr-8.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-1.5 focus:ring-[#8FC2F0]"
                />
              </div>
              <span className="text-[11px] text-slate-400 font-mono font-medium shrink-0">
                {filteredSuggestedItems.length} {isRTL ? 'مقترح متطابق' : 'matches'}
              </span>
            </div>

            {/* Suggestions Cards List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {filteredSuggestedItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
                  <p className="font-bold">{isRTL ? 'لا توجد مشاريع بحاجة لاقتراحات إضافية حالياً' : 'No suggestions found'}</p>
                  <p className="text-[11px] mt-1 text-slate-400">{isRTL ? 'كافة المشاريع المؤهلة مجدولة أو تمت متابعتها' : 'All eligible projects are scheduled or up-to-date.'}</p>
                </div>
              ) : (
                filteredSuggestedItems.map((p) => (
                  <div
                    key={p.id}
                    className="crm-card-soft p-3.5 sm:p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#8FC2F0]/60 transition-all border border-slate-200/80 dark:border-slate-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {p.pr_number}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.calculated_health === 'red'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}>
                          {p.calculated_health === 'red' ? (isRTL ? '⚠️ متأخر عن المتابعة' : 'Needs Attention') : (isRTL ? '💎 صفقة كبرى' : 'High Value')}
                        </span>
                        <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCurrencySAR(p.estimated_value)}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{p.company_name}</span>
                        {p.location && (
                          <>
                            <span className="opacity-40">•</span>
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{p.location}</span>
                          </>
                        )}
                      </p>
                      {p.next_action && (
                        <p className="text-[10.5px] text-blue-600 dark:text-blue-400 mt-1 truncate">
                          ↳ {isRTL ? 'الإجراء التالي:' : 'Next Action:'} {p.next_action}
                        </p>
                      )}
                    </div>

                    {/* Schedule Into Day Action */}
                    <div className="shrink-0 flex flex-col md:items-end gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isRTL ? 'جدولة النشاط في يوم:' : 'Add to Day:'}
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {workDays.map((d) => (
                          <button
                            key={d.dateStr}
                            type="button"
                            onClick={() => handleAcceptSuggestion(p, d.dateStr)}
                            className="px-2.5 py-1 rounded-lg bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] hover:bg-[#8FC2F0]/35 font-bold transition-all text-[11px] cursor-pointer shadow-2xs"
                            title={`${isRTL ? 'إضافة إلى' : 'Add to'} ${d.arabic || d.name} (${d.dayNum} ${isRTL ? d.monthNameAr : d.monthName})`}
                          >
                            <span>{isRTL ? d.arabic : d.short}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/40">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isRTL ? 'يتم حفظ أي نشاط تتم جدولته فورياً في خطة الأسبوع والإكسيل' : 'Scheduled activities are instantly synced to your week & Excel.'}
              </span>
              <button
                type="button"
                onClick={() => setIsSuggestionsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OVERDUE / PENDING ACTIVITIES MODAL (Manage 506 backlogged activities) */}
      {/* ========================================================================= */}
      {isOverdueNoticesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="crm-card w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141820] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-slate-50/50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#292D32] dark:text-white flex items-center gap-2">
                    <span>{isRTL ? 'إدارة الأنشطة المعلقة من الأسابيع السابقة' : 'Pending Activities from Previous Weeks'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-mono font-bold">
                      {pendingOtherWeeksCount}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {isRTL 
                      ? 'يمكنك ترحيل أي نشاط مباشرة إلى أيام هذا الأسبوع، أو تعليمه كمكتمل، أو الانتقال لأسبوع النشاط في التقويم'
                      : 'Review backlogged tasks; rollover to this week with 1 click, mark completed, or jump to its week.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOverdueNoticesModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search & Bulk Bar */}
            <div className="p-3 sm:px-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={overdueSearch}
                  onChange={(e) => setOverdueSearch(e.target.value)}
                  placeholder={isRTL ? 'بحث بالاسم، التاريخ، المقاول، الهدف...' : 'Search by name, date, company, goal...'}
                  className="w-full ltr:pl-8.5 rtl:pr-8.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-1.5 focus:ring-[#8FC2F0]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await completeAllPastPlannedActivities();
                    setIsOverdueNoticesModalOpen(false);
                    setToastMessage(isRTL ? '✓ تم تعليم كافة المتابعات والمهام السابقة كمكتملة بنجاح!' : '✓ All past pending tasks marked as completed!');
                    setTimeout(() => setToastMessage(null), 3500);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  title={isRTL ? 'تعليم كافة المتابعات السابقة كمكتملة دفعة واحدة' : 'Mark all past pending tasks as completed'}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isRTL ? '✓ إنجاز الكل كمكتمل' : '✓ Mark All Completed'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRolloverTopBatch(10)}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  title={isRTL ? 'ترحيل أول 10 مهام معلقة وتوزيعها تلقائياً على أيام هذا الأسبوع' : 'Rollover first 10 pending tasks into this week'}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{isRTL ? '⚡ ترحيل أول 10' : '⚡ Rollover Top 10'}</span>
                </button>
                <span className="text-[11px] text-slate-400 font-mono font-medium shrink-0">
                  {filteredOverdueActivities.length} {isRTL ? 'نشاط' : 'tasks'}
                </span>
              </div>
            </div>

            {/* Activities List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
              {filteredOverdueActivities.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
                  <p className="font-bold">{isRTL ? 'لا توجد مهام معلقة تطابق البحث' : 'No pending tasks found'}</p>
                </div>
              ) : (
                filteredOverdueActivities.slice(0, 100).map((act) => {
                  const channelCfg = getChannelConfig(act.channel);
                  return (
                    <div
                      key={act.id}
                      className="crm-card-soft p-3 sm:p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{act.scheduled_date || 'Previous Week'}</span>
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${channelCfg.color}`}>
                            {channelCfg.icon}
                            <span>{channelCfg.label}</span>
                          </span>

                          {act.priority && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              act.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                              act.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {act.priority}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {act.project_name || act.custom_target || 'Target Account'}
                        </h4>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-2 flex-wrap">
                          {act.company_name && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{act.company_name}</span>
                            </span>
                          )}
                          {act.goal && (
                            <span className="text-slate-700 dark:text-slate-300 italic">
                              &ldquo;{act.goal}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Direct Actions: Reschedule to This Week, Complete, Jump to Week */}
                      <div className="shrink-0 flex items-center gap-1.5 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                        {/* Reschedule Dropdown / Quick Buttons */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">
                            {isRTL ? 'ترحيل:' : 'Move:'}
                          </span>
                          {workDays.slice(0, 3).map((d) => (
                            <button
                              key={d.dateStr}
                              type="button"
                              onClick={() => handleReschedulePending(act.id, d.dateStr)}
                              className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold transition-all text-[10px] cursor-pointer border border-blue-200 dark:border-blue-800"
                              title={`${isRTL ? 'ترحيل إلى' : 'Reschedule to'} ${d.arabic} (${d.dayNum} ${isRTL ? d.monthNameAr : d.monthName})`}
                            >
                              {isRTL ? d.arabic : d.short}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleMarkPendingCompleted(act.id)}
                          className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-[10.5px] transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                          title={isRTL ? 'تسجيل النشاط كمكتمل' : 'Mark activity completed'}
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{isRTL ? 'تم الإنجاز' : 'Done'}</span>
                        </button>

                        {act.scheduled_date && (
                          <button
                            type="button"
                            onClick={() => jumpToActivityWeek(act.scheduled_date)}
                            className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-[10.5px] font-medium transition-all cursor-pointer"
                            title={isRTL ? 'عرض لوحة هذا الأسبوع في التقويم' : 'Jump to this activity week on calendar'}
                          >
                            <span>{isRTL ? 'عرض الأسبوع ↗' : 'Week ↗'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(act.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title={isRTL ? 'حذف من الخطة' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/40">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isRTL ? `المجموع المعلق: ${pendingOtherWeeksCount} نشاط | يتم تحديث الخطة فورياً بمجرد الترحيل أو الإنجاز` : `Total pending: ${pendingOtherWeeksCount} tasks.`}
              </span>
              <button
                type="button"
                onClick={() => setIsOverdueNoticesModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Collaboration Modal (Send Plan Card to Chat with Manager/Colleague Note) */}
      {isChatNoteModalOpen && selectedTaskForChat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2130] rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {isRTL ? 'إرسال المهمة للمحادثة مع تعليق' : 'Share Task Card to Chat'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedTaskForChat.user_name ? `${isRTL ? 'المهندس:' : 'Engineer:'} ${selectedTaskForChat.user_name}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatNoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-white/5 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">{selectedTaskForChat.goal}</p>
              <div className="flex items-center gap-2 text-slate-500 mt-1 text-[11px]">
                <span>📅 {selectedTaskForChat.scheduled_date}</span>
                {selectedTaskForChat.company_name && <span>🏢 {selectedTaskForChat.company_name}</span>}
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'ملاحظة أو توجيهات الشات (مثل: طلب التأجيل أو تعليمات جديدة):' : 'Chat Comment / Directive (e.g. reschedule request):'}
              </label>
              <textarea
                rows={3}
                placeholder={isRTL ? 'مثال: يرجى تأجيل هذه الزيارة للأسبوع القادم لحين استلام تقرير الاعتماد...' : 'e.g. Please postpone this visit to next week until the report is ready...'}
                value={chatComment}
                onChange={e => setChatComment(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#141820] border border-slate-200 dark:border-white/10 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsChatNoteModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-medium"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetEmployeeId = selectedTaskForChat.user_id 
                    || teamMembers.find(t => t.full_name === selectedTaskForChat.user_name)?.id 
                    || 'u1';

                  await sharePlanTaskToChat({
                    taskId: selectedTaskForChat.id,
                    targetUserId: targetEmployeeId,
                    comment: chatComment.trim()
                  });
                  setIsChatNoteModalOpen(false);
                }}
                className="px-4 py-1.5 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isRTL ? 'إرسال وفتح المحادثة' : 'Send & Open Chat'}</span>
              </button>
            </div>
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
