'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Phone, 
  Users, 
  Video, 
  MapPin, 
  Target, 
  Briefcase, 
  Calendar, 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Building2, 
  User, 
  MessageCircle, 
  ExternalLink,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  GripVertical,
  Kanban,
  Table as TableIcon,
  Sparkles,
  Check,
  Send,
  ArrowRight,
  FileText,
  Bell
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { 
  ACTIVITY_CHANNELS, 
  ACTIVITY_OUTCOMES, 
  VISIT_PURPOSES 
} from '@/lib/constants';
import { 
  ActivityChannel, 
  ActivityOutcome, 
  Activity,
  VisitPurpose 
} from '@/types/crm';
import { formatDateString, normalizePhoneNumber } from '@/lib/utils';
import { AddActivityModal } from '@/components/modals/add-activity-modal';
import { EditActivityModal } from '@/components/modals/edit-activity-modal';

interface DayConfig {
  name: string;
  short: string;
  arabic: string;
  dateStr: string; // YYYY-MM-DD
  dayNum: number;
  isToday: boolean;
}

export default function ActivitiesPage() {
  const { 
    activities, 
    projects, 
    contacts, 
    updateActivity, 
    deleteActivity, 
    openFastLog, 
    openReminder,
    currentRole,
    currentUser,
    teamMembers,
    selectedSalesFilter,
    setSelectedSalesFilter
  } = useCRM();

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin' || currentRole === 'sales_manager' || currentRole === 'admin';

  // View Mode: 'board' (Weekly Columns matching My Week) or 'list' (Audit Table)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Week offset (reference Sunday: Sep 13, 2026)
  const [weekOffset, setWeekOffset] = useState(0);
  const [showWeekend, setShowWeekend] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');

  // Drag and Drop state
  const [draggedActivityId, setDraggedActivityId] = useState<string | null>(null);
  const [dragOverDayDate, setDragOverDayDate] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState<string>('2026-09-17');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Saudi Workdays (Sat-Thu 6 days, or full 7 days)
  const workDays: DayConfig[] = useMemo(() => {
    // Reference Saturday: Sep 12, 2026
    const baseSaturday = new Date(2026, 8, 12);
    baseSaturday.setDate(baseSaturday.getDate() + (weekOffset * 7));

    const dayNames = showWeekend
      ? ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      : ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const dayShorts = showWeekend
      ? ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
    const dayArabic = showWeekend
      ? ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
      : ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

    const todayStr = '2026-09-17';

    return dayNames.map((name, idx) => {
      const d = new Date(baseSaturday);
      d.setDate(baseSaturday.getDate() + idx);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      return {
        name,
        short: dayShorts[idx],
        arabic: dayArabic[idx],
        dateStr,
        dayNum: d.getDate(),
        isToday: dateStr === todayStr
      };
    });
  }, [weekOffset, showWeekend]);

  // Current week display string
  const currentWeekLabel = useMemo(() => {
    if (workDays.length === 0) return '';
    const start = workDays[0];
    const end = workDays[workDays.length - 1];
    return `${start.short}, ${start.dateStr.slice(5)} – ${end.short}, ${end.dateStr.slice(5)}, 2026`;
  }, [workDays]);

  // Channel UI helper
  const getChannelConfig = (ch: ActivityChannel) => {
    switch (ch) {
      case 'call': return { label: 'Call', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Phone className="w-3.5 h-3.5" /> };
      case 'meeting_f2f': return { label: 'F2F Meeting', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Users className="w-3.5 h-3.5" /> };
      case 'meeting_online': return { label: 'Online Meeting', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Video className="w-3.5 h-3.5" /> };
      case 'visit': return { label: 'Site Visit', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <MapPin className="w-3.5 h-3.5" /> };
      case 'hunting': return { label: 'Hunting', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Target className="w-3.5 h-3.5" /> };
      case 'office_work': return { label: 'Office Work', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Briefcase className="w-3.5 h-3.5" /> };
      case 'email': return { label: 'Email', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: <Send className="w-3.5 h-3.5" /> };
      default: return { label: ch, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Briefcase className="w-3.5 h-3.5" /> };
    }
  };

  // Outcome label & styling helper
  const getOutcomeBadge = (outcome?: ActivityOutcome) => {
    if (!outcome) return null;
    const found = ACTIVITY_OUTCOMES.find(o => o.value === outcome);
    const label = found ? found.label : outcome;

    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    if (outcome === 'connected') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (outcome === 'quotation_sent') colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    if (outcome === 'rfq_received') colorClass = 'bg-teal-50 text-teal-700 border-teal-200';
    if (outcome === 'meeting_booked') colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
    if (outcome === 'technical_feedback_needed') colorClass = 'bg-amber-50 text-amber-700 border-amber-200';

    return (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${colorClass}`}>
        {label}
      </span>
    );
  };

  // Drag & Drop Handler (Move activity to target day)
  const handleMoveDay = async (actId: string, newDateStr: string) => {
    const act = activities.find(a => a.id === actId);
    if (!act || act.activity_date === newDateStr) return;

    const targetDay = workDays.find(d => d.dateStr === newDateStr);
    const dayLabel = targetDay ? `${targetDay.name} (${targetDay.arabic})` : newDateStr;

    await updateActivity(actId, { activity_date: newDateStr });
    setToastMessage(`Activity moved to ${dayLabel}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteActivity = async (id: string) => {
    if (confirm('Are you sure you want to delete this sales activity?')) {
      await deleteActivity(id);
    }
  };

  const handleOpenAddForDay = (dateStr: string) => {
    setSelectedDateForAdd(dateStr);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (act: Activity) => {
    setEditingActivity(act);
    setIsEditModalOpen(true);
  };

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      // Rep Scoping
      const matchesOwner = isManager
        ? (selectedSalesFilter === 'all' || act.user_id === selectedSalesFilter)
        : (act.user_id === currentUser.id);
      if (!matchesOwner) return false;

      if (selectedChannel !== 'all' && act.channel !== selectedChannel) return false;
      if (selectedOutcome !== 'all' && act.outcome !== selectedOutcome) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchProject = act.project_name?.toLowerCase().includes(q);
        const matchCompany = act.company_name?.toLowerCase().includes(q);
        const matchContact = act.contact_name?.toLowerCase().includes(q);
        const matchNotes = act.notes?.toLowerCase().includes(q);
        const matchPurpose = act.visit_purpose?.toLowerCase().includes(q);
        const matchNextAction = act.next_action?.toLowerCase().includes(q);
        return matchProject || matchCompany || matchContact || matchNotes || matchPurpose || matchNextAction;
      }
      return true;
    });
  }, [activities, isManager, selectedSalesFilter, currentUser.id, selectedChannel, selectedOutcome, searchQuery]);

  // Activities this week
  const weekDateSet = useMemo(() => new Set(workDays.map(d => d.dateStr)), [workDays]);
  const thisWeekActivities = useMemo(() => {
    return filteredActivities.filter(a => weekDateSet.has(a.activity_date));
  }, [filteredActivities, weekDateSet]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HEADER: WEEK NAVIGATION & VIEW SWITCHER */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              <span>Weekly Activities Board &bull; جدول الأنشطة الأسبوعي</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {thisWeekActivities.length} Activities This Week
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sales Activities & Execution Log
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Daily logs of client calls, consultant meetings, field hunting, and next action commitments.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Week Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                weekOffset === 0 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Manager Rep Selector */}
          {isManager && (
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">Rep:</span>
              <select
                value={selectedSalesFilter}
                onChange={(e) => setSelectedSalesFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-[#292D32] focus:outline-none"
              >
                <option value="all">All Sales Team ({teamMembers.length})</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* View Switcher (Weekly Board vs Table) */}
          <div className="glass-card p-1 rounded-2xl border border-white/80 shadow-2xs flex items-center font-urbanist">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'board'
                  ? 'bg-[#292D32] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Weekly Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Weekly Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-[#292D32] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Timeline List View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Audit List</span>
            </button>
          </div>

          {/* Log Activity Button */}
          {currentRole !== 'viewer' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#292D32] hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-xs transition-all font-urbanist"
            >
              <Plus className="w-4 h-4 text-[#8FC2F0]" />
              <span>Log Activity</span>
            </button>
          )}
        </div>
      </div>

      {/* Week Date Banner & Workdays Toggle */}
      <div className="glass-card p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-urbanist">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] flex items-center justify-center font-black text-sm">
            W{38 + weekOffset}
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-[#292D32] flex items-center gap-2">
              <span>{currentWeekLabel}</span>
              {weekOffset === 0 && (
                <span className="text-[10px] bg-[#77CE69]/20 text-[#292D32] border border-[#77CE69]/30 px-2.5 py-0.5 rounded-full font-black">
                  Current Week
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Drag and drop any activity card between day columns to reschedule its execution date.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeekend(!showWeekend)}
            className={`text-xs px-3.5 py-2 rounded-2xl border font-bold transition-all font-urbanist ${
              showWeekend
                ? 'bg-[#292D32] text-white border-[#292D32]'
                : 'bg-white/70 text-slate-700 border-slate-200/80 hover:bg-white'
            }`}
          >
            {showWeekend ? 'Showing 7 Days (Inc. Friday)' : '6 Workdays (Sat–Thu) • من السبت للخميس'}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-3xl flex flex-col md:flex-row items-center gap-3 font-urbanist">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activities by action, project name, company, contact or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white/70 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:bg-white text-slate-900 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Channel Filter */}
          <select
            value={selectedChannel}
            onChange={e => setSelectedChannel(e.target.value)}
            className="px-3.5 py-2 text-xs bg-white/70 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 font-bold cursor-pointer"
          >
            <option value="all">All Channels</option>
            {ACTIVITY_CHANNELS.map(ch => (
              <option key={ch.value} value={ch.value}>{ch.label}</option>
            ))}
          </select>

          {/* Outcome Filter */}
          <select
            value={selectedOutcome}
            onChange={e => setSelectedOutcome(e.target.value)}
            className="px-3.5 py-2 text-xs bg-white/70 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 font-bold cursor-pointer"
          >
            <option value="all">All Outcomes</option>
            {ACTIVITY_OUTCOMES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: HORIZONTAL WEEKLY BOARD (6 COLUMNS: SAT - THU) */}
      {/* ========================================================================= */}
      {viewMode === 'board' && (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${showWeekend ? 'xl:grid-cols-7' : 'xl:grid-cols-6'} gap-3.5 items-start`}>
          {workDays.map(day => {
            const dayActivities = filteredActivities.filter(a => a.activity_date === day.dateStr);
            const isDragTarget = dragOverDayDate === day.dateStr;

            return (
              <div
                key={day.dateStr}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverDayDate(day.dateStr);
                }}
                onDragLeave={() => {
                  if (dragOverDayDate === day.dateStr) setDragOverDayDate(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverDayDate(null);
                  const actId = e.dataTransfer.getData('text/plain') || draggedActivityId;
                  if (actId) handleMoveDay(actId, day.dateStr);
                }}
                className={`rounded-3xl border transition-all flex flex-col min-h-[480px] min-w-0 ${
                  isDragTarget 
                    ? 'border-2 border-dashed border-[#8FC2F0] bg-[#8FC2F0]/20 ring-4 ring-[#8FC2F0]/20 scale-[1.01]' 
                    : day.isToday
                      ? 'border-[#8FC2F0] ring-2 ring-[#8FC2F0]/20 shadow-xs bg-white/80'
                      : 'glass-card'
                }`}
              >
                {/* Column Header */}
                <div className={`p-4 rounded-t-3xl border-b transition-colors flex items-center justify-between font-urbanist ${
                  day.isToday
                    ? 'bg-[#292D32] text-white border-[#292D32]'
                    : 'bg-white/60 text-slate-800 border-slate-200/60'
                }`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm tracking-tight">{day.name}</span>
                      <span className={`text-[10px] font-bold ${day.isToday ? 'text-slate-300' : 'text-slate-400'}`}>
                        ({day.arabic})
                      </span>
                    </div>
                    <div className={`text-xs font-semibold ${day.isToday ? 'text-slate-300' : 'text-slate-500'}`}>
                      {day.dateStr}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                      day.isToday 
                        ? 'bg-white/20 text-white' 
                        : 'bg-white text-slate-700 border border-slate-200/60 shadow-2xs'
                    }`}>
                      {dayActivities.length}
                    </span>

                    {currentRole !== 'viewer' && (
                      <button
                        onClick={() => handleOpenAddForDay(day.dateStr)}
                        className={`p-1.5 rounded-xl transition-colors ${
                          day.isToday 
                            ? 'hover:bg-white/20 text-white' 
                            : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                        }`}
                        title={`Log Activity on ${day.name}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Drop Indicator */}
                {isDragTarget && (
                  <div className="mx-3 mt-3 p-3 rounded-2xl border-2 border-dashed border-[#8FC2F0] bg-[#8FC2F0]/20 text-[#292D32] text-xs font-bold text-center animate-pulse">
                    Drop here to move activity to {day.name}
                  </div>
                )}

                {/* Cards Container */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto font-urbanist">
                  {dayActivities.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200/80 rounded-2xl my-4 text-slate-400 space-y-2">
                      <Clock className="w-5 h-5 mx-auto text-slate-300" />
                      <p className="text-xs font-medium">No activity logged</p>
                      {currentRole !== 'viewer' && (
                        <button
                          onClick={() => handleOpenAddForDay(day.dateStr)}
                          className="text-[11px] text-[#292D32] hover:text-[#8FC2F0] hover:underline font-bold transition-colors"
                        >
                          + Log for {day.short}
                        </button>
                      )}
                    </div>
                  ) : (
                    dayActivities.map(act => {
                      const chConfig = getChannelConfig(act.channel);
                      const rawPhone = act.contact_name 
                        ? contacts.find(c => c.full_name === act.contact_name)?.phone 
                        : '';
                      const cleanPhone = normalizePhoneNumber(rawPhone);
                      const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

                      // Purpose or headline: What was done!
                      const purposeLabel = act.visit_purpose 
                        ? (VISIT_PURPOSES.find(p => p.value === act.visit_purpose)?.label || act.visit_purpose) 
                        : null;

                      const headline = purposeLabel 
                        ? purposeLabel 
                        : (act.notes && act.notes.length <= 60 && !act.notes.includes('\n') 
                            ? act.notes 
                            : `${chConfig.label} Log`);

                      const showDedicatedNotes = act.notes && (act.notes.trim() !== headline.trim());

                      return (
                        <div
                          key={act.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', act.id);
                            setDraggedActivityId(act.id);
                          }}
                          onDragEnd={() => setDraggedActivityId(null)}
                          className={`glass-card-interactive p-4 rounded-2xl transition-all duration-200 cursor-grab active:cursor-grabbing group relative flex flex-col gap-2.5 font-urbanist ${
                            draggedActivityId === act.id ? 'opacity-40 scale-95 border-dashed border-[#8FC2F0]' : ''
                          }`}
                        >
                          {/* 1. TOP HEADLINE: WHAT WAS DONE (Full Wrap Text) */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-slate-900 text-xs sm:text-sm leading-snug break-words whitespace-normal">
                                {headline}
                              </h4>
                            </div>

                            {/* Edit & Delete Quick Icons */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={() => handleOpenEdit(act)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit Activity"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(act.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Delete Activity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 2. Channel & Time Slot & Outcome */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${chConfig.color} shrink-0`}>
                              {chConfig.icon}
                              <span>{chConfig.label}</span>
                            </span>

                            {act.activity_time && (
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span>{act.activity_time}</span>
                              </span>
                            )}

                            {getOutcomeBadge(act.outcome)}
                          </div>

                          {/* 3. Context layer: Project & Company & Contact & Location (Wrap Text) */}
                          {(act.project_name || act.company_name || act.contact_name || act.location_name) && (
                            <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/70 space-y-1.5 text-xs">
                              {act.project_name && (
                                <div className="flex items-start gap-1.5 font-black text-blue-700 break-words whitespace-normal leading-snug">
                                  <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                  <span className="break-words">{act.project_name}</span>
                                </div>
                              )}

                              {act.company_name && (
                                <div className="flex items-start gap-1.5 font-bold text-slate-800 break-words whitespace-normal leading-snug">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  <span className="break-words">{act.company_name}</span>
                                </div>
                              )}

                              {act.contact_name && (
                                <div className="flex items-start gap-1.5 text-slate-700 font-medium break-words whitespace-normal leading-snug">
                                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  <span className="break-words">{act.contact_name}</span>
                                </div>
                              )}

                              {act.location_name && (
                                <div className="flex items-start gap-1.5 text-slate-500 text-[11px] font-medium break-words whitespace-normal leading-snug">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span className="break-words">{act.location_name}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 4. Complete Execution Notes with FULL WRAP TEXT (No line-clamp) */}
                          {showDedicatedNotes && (
                            <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 text-xs text-slate-800 leading-relaxed break-words whitespace-pre-wrap shadow-2xs">
                              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>Execution Notes &bull; بيان ما تم إنجازه</span>
                              </div>
                              <div className="text-slate-700 font-medium break-words whitespace-pre-wrap leading-relaxed">
                                {act.notes}
                              </div>
                            </div>
                          )}

                          {/* 5. Next Action Commitment with FULL WRAP TEXT */}
                          {act.next_action && (
                            <div className="bg-amber-50/90 border border-amber-200/90 p-2.5 rounded-xl text-xs text-amber-950 break-words whitespace-pre-wrap">
                              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1.5">
                                <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Next Step Commitment &bull; الإجراء القادم</span>
                              </div>
                              <div className="font-bold break-words whitespace-pre-wrap leading-relaxed text-amber-950">
                                {act.next_action}
                              </div>
                              {act.next_follow_up_at && (
                                <div className="text-[10px] font-extrabold text-amber-800 mt-1.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 shrink-0" />
                                  <span>Due Date: {formatDateString(act.next_follow_up_at)}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 6. Quick Action Shortcuts */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold text-[10px] transition-colors"
                                  title="WhatsApp Contact"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                              {cleanPhone && (
                                <a
                                  href={`tel:${cleanPhone}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-[10px] transition-colors"
                                  title="Call Contact"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>Call</span>
                                </a>
                              )}
                              {act.google_maps_url && (
                                <a
                                  href={act.google_maps_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[10px] transition-colors"
                                  title="View Location on Google Maps"
                                >
                                  <MapPin className="w-3 h-3 text-rose-500" />
                                  <span>Map</span>
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                              <button
                                onClick={() => openReminder({
                                  entity_type: 'activity',
                                  entity_id: act.id,
                                  entity_name: act.notes?.substring(0, 40) || act.channel + ' - ' + act.visit_purpose,
                                  project_id: act.project_id || undefined,
                                  project_name: act.project_name || undefined,
                                  contact_id: act.contact_id || undefined,
                                  contact_name: act.contact_name || undefined,
                                  activity_id: act.id,
                                })}
                                className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white font-bold text-[10px] transition-colors"
                                title="Set Reminder"
                              >
                                <Bell className="w-3 h-3" />
                                <span>Remind</span>
                              </button>
                              <button
                                onClick={() => handleOpenEdit(act)}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            </div>
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
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: AUDIT LIST / TABLE */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">
              All Filtered Activities ({filteredActivities.length})
            </span>
            <span className="text-xs text-slate-500">
              Chronological Audit Trail
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">What Was Done / Notes</th>
                  <th className="py-3 px-4">Project / Client</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Next Action</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      No activities match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map(act => {
                    const chConfig = getChannelConfig(act.channel);
                    return (
                      <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          <div>{formatDateString(act.activity_date)}</div>
                          {act.activity_time && (
                            <span className="text-[10px] text-slate-400 font-normal">{act.activity_time}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${chConfig.color}`}>
                            {chConfig.icon}
                            <span>{chConfig.label}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          {act.visit_purpose && (
                            <div className="font-bold text-slate-900 break-words whitespace-normal">{act.visit_purpose}</div>
                          )}
                          <p className="text-slate-600 break-words whitespace-pre-wrap leading-relaxed mt-0.5">{act.notes || '-'}</p>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-blue-700 break-words whitespace-normal">{act.project_name || '-'}</div>
                          <div className="text-slate-500 text-[11px] break-words whitespace-normal">{act.company_name || '-'}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 break-words whitespace-normal">
                          {act.contact_name || '-'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getOutcomeBadge(act.outcome)}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          {act.next_action ? (
                            <div className="text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-[11px] break-words whitespace-pre-wrap leading-relaxed">
                              {act.next_action}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(act)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(act.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultDate={selectedDateForAdd}
      />

      {/* Edit Activity Modal */}
      <EditActivityModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        activity={editingActivity}
      />

    </div>
  );
}
