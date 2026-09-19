'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sun, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Phone, 
  Users, 
  Video, 
  MapPin, 
  Target, 
  Briefcase, 
  Calendar, 
  Mail, 
  Plus, 
  ArrowRight, 
  MessageCircle, 
  Sparkles, 
  Flame, 
  Building2, 
  Check, 
  ChevronRight,
  RotateCcw,
  CalendarCheck2,
  Navigation,
  ShieldCheck
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { 
  formatCurrencySAR, 
  formatDateString, 
  normalizePhoneNumber 
} from '@/lib/utils';
import { 
  PlannedActivity, 
  Project, 
  Contact, 
  ActivityChannel 
} from '@/types/crm';
import { 
  scopeProjects, 
  scopeActivities, 
  scopePlannedActivities, 
  scopeRequests 
} from '@/lib/logic/scope';
import { useLanguage } from '@/lib/i18n/language-context';

export default function MyDayPage() {
  const { isRTL, t } = useLanguage();
  const { 
    currentUser, 
    plannedActivities, 
    activities, 
    projects, 
    contacts, 
    openFastLog, 
    currentRole,
    addPlannedActivity,
    selectedSalesFilter,
    setSelectedSalesFilter,
    teamMembers,
    requests,
    openRequestDetail,
    openRequestModal
  } = useCRM();

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin';

  const scopedPlannedActivities = useMemo(() => {
    return scopePlannedActivities(plannedActivities, currentUser, selectedSalesFilter);
  }, [plannedActivities, currentUser, selectedSalesFilter]);

  const scopedProjects = useMemo(() => {
    return scopeProjects(projects, currentUser, selectedSalesFilter);
  }, [projects, currentUser, selectedSalesFilter]);

  const scopedActivities = useMemo(() => {
    return scopeActivities(activities, currentUser, selectedSalesFilter);
  }, [activities, currentUser, selectedSalesFilter]);

  const [activeTab, setActiveTab] = useState<'schedule' | 'overdue' | 'hotleads' | 'approvals'>('schedule');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || '');
  const [newChannel, setNewChannel] = useState<ActivityChannel>('call');

  // Approval requests memo
  const pendingApprovals = useMemo(() => {
    return requests.filter(r => r.status === 'pending');
  }, [requests]);

  const myRequests = useMemo(() => {
    return requests.filter(r => r.requested_by === currentUser.id);
  }, [requests, currentUser.id]);

  const displayRequests = useMemo(() => {
    return isManager ? pendingApprovals : myRequests;
  }, [isManager, pendingApprovals, myRequests]);

  const activeRequestsCount = isManager 
    ? pendingApprovals.length 
    : myRequests.filter(r => r.status === 'pending').length;

  // Today's date reference
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayDisplay = useMemo(() => {
    const d = new Date();
    if (isRTL) {
      return d.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  }, [isRTL]);

  // Today's planned tasks
  const todayTasks = useMemo(() => {
    return scopedPlannedActivities.filter(p => p.scheduled_date === todayStr || p.scheduled_date <= todayStr && p.status === 'planned');
  }, [scopedPlannedActivities, todayStr]);

  const completedTodayTasks = useMemo(() => {
    return scopedPlannedActivities.filter(p => p.status === 'completed' && p.updated_at.startsWith(todayStr));
  }, [scopedPlannedActivities, todayStr]);

  // Overdue follow-up projects
  const overdueProjects = useMemo(() => {
    return scopedProjects.filter(p => {
      if (p.pipeline_stage === 'won' || p.pipeline_stage === 'lost' || p.pipeline_stage === 'hold') return false;
      if (!p.next_follow_up_at) return true;
      return p.next_follow_up_at < todayStr;
    });
  }, [scopedProjects, todayStr]);

  // Hot leads check-in list
  const hotLeads = useMemo(() => {
    if (isManager) {
      if (selectedSalesFilter === 'all') return contacts.filter(c => c.is_hot_lead);
      return contacts.filter(c => c.is_hot_lead && c.owner_id === selectedSalesFilter);
    }
    return contacts.filter(c => c.is_hot_lead && c.owner_id === currentUser.id);
  }, [contacts, isManager, selectedSalesFilter, currentUser.id]);

  // Activities logged today
  const activitiesLoggedToday = useMemo(() => {
    return scopedActivities.filter(a => a.activity_date === todayStr);
  }, [scopedActivities, todayStr]);

  // Completion calculation
  const totalDueToday = todayTasks.length;
  const completedCount = todayTasks.filter(t => t.status === 'completed').length + activitiesLoggedToday.length;
  const completionPercent = totalDueToday > 0 ? Math.min(100, Math.round((completedCount / (totalDueToday + activitiesLoggedToday.length || 1)) * 100)) : 100;

  // Channel UI helper
  const getChannelBadge = (channel: ActivityChannel) => {
    switch(channel) {
      case 'call': return { label: 'Call', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Phone className="w-3.5 h-3.5" /> };
      case 'meeting_f2f': return { label: 'F2F Meeting', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Users className="w-3.5 h-3.5" /> };
      case 'meeting_online': return { label: 'Online Meeting', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Video className="w-3.5 h-3.5" /> };
      case 'visit': return { label: 'Site Visit', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <MapPin className="w-3.5 h-3.5" /> };
      case 'hunting': return { label: 'Hunting', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Target className="w-3.5 h-3.5" /> };
      default: return { label: channel, color: 'bg-slate-50 text-slate-700 border-slate-200', icon: <Briefcase className="w-3.5 h-3.5" /> };
    }
  };

  const handleCreateQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;

    const proj = scopedProjects.find(p => p.id === newProjectId);
    await addPlannedActivity({
      weekly_plan_id: 'wp_current',
      project_id: proj?.id,
      project_name: proj?.name,
      company_id: proj?.company_id,
      company_name: proj?.company_name,
      contact_id: proj?.primary_contact_id,
      contact_name: proj?.primary_contact_name,
      scheduled_date: todayStr,
      channel: newChannel,
      visit_purpose: 'follow_up',
      goal: newGoal.trim(),
      priority: 'high',
      user_id: (isManager && selectedSalesFilter !== 'all') ? selectedSalesFilter : currentUser.id,
      user_name: (isManager && selectedSalesFilter !== 'all') ? teamMembers.find(m => m.id === selectedSalesFilter)?.full_name || currentUser.full_name : currentUser.full_name,
    });

    setNewGoal('');
    setIsQuickAddOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Morning Header Banner */}
      <div className="bg-gradient-to-r from-[#0B132B] to-[#1C2541] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wide uppercase">
            <Sun className="w-4 h-4 animate-spin-slow" />
            <span>{isRTL ? `لوحة المهام اليومية والمتابعات • ${todayDisplay}` : `Daily Execution Dashboard • ${todayDisplay}`}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isRTL ? `يومك سعيد، ${currentUser.full_name.split(' ')[0]}` : `Good day, ${currentUser.full_name.split(' ')[0]}`}
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            {isRTL 
              ? 'إليك قائمة الإجراءات والمهام المجدولة لليوم. تابع التزامات العملاء، وتجاوز العقبات المتأخرة، وسجل تفاعلاتك البيعية بسرعة.' 
              : 'Here is your sales action queue for today. Complete scheduled client commitments, resolve overdue pipeline blockers, and log actions in under 20 seconds.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Manager Rep Selector */}
          {isManager && (
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-xs backdrop-blur-md">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{isRTL ? 'المندوب:' : 'Rep:'}</span>
              <select
                value={selectedSalesFilter}
                onChange={(e) => setSelectedSalesFilter(e.target.value)}
                className="bg-slate-900/80 border border-white/20 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="all">{isRTL ? `كافة فريق المبيعات (${teamMembers.filter(m => m.role === 'sales_engineer').length})` : `All Sales Team (${teamMembers.filter(m => m.role === 'sales_engineer').length})`}</option>
                {teamMembers.filter(m => m.role === 'sales_engineer').map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {currentRole !== 'viewer' && (
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRTL ? '+ إضافة مهمة يومية' : '+ Add Day Task'}</span>
            </button>
          )}

          <button
            onClick={() => openFastLog()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRTL ? 'تسجيل سريع (< 20ث)' : 'Fast Log (< 20s)'}</span>
          </button>
        </div>
      </div>

      {/* Daily KPI Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-[#8FC2F0] flex items-center justify-center font-bold text-sm">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
              {isRTL ? 'تستحق اليوم' : 'Due Today'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {todayTasks.length} {isRTL ? 'مهمة' : 'tasks'}
            </span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
              {isRTL ? 'مشاريع متأخرة' : 'Overdue Attention'}
            </span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400">
              {overdueProjects.length} {isRTL ? 'مشروع' : 'projects'}
            </span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
              {isRTL ? 'أُنجزت اليوم' : 'Completed Today'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {activitiesLoggedToday.length} {isRTL ? 'نشاط مسجل' : 'logged'}
            </span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
              {isRTL ? 'فرص مشتعلة' : 'Hot Leads'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {hotLeads.length} {isRTL ? 'نشطة' : 'active'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <div className="glass-card p-5 rounded-2xl border border-blue-200 dark:border-[#8FC2F0]/25 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600 dark:text-[#8FC2F0]" />
              <span>{isRTL ? 'جدولة مهمة سريعة لليوم' : 'Schedule Impromptu Task for Today'}</span>
            </h3>
            <button 
              onClick={() => setIsQuickAddOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold cursor-pointer"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
          </div>

          <form onSubmit={handleCreateQuickTask} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                {isRTL ? 'الهدف / الإجراء المستهدف' : 'Target Action / Goal'}
              </label>
              <input
                type="text"
                required
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder={isRTL ? 'مثال: الاتصال بمدير المشتريات لمتابعة اعتماد العرض' : 'e.g. Call procurement manager for revision update'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                {isRTL ? 'المشروع' : 'Project'}
              </label>
              <select
                value={newProjectId}
                onChange={(e) => setNewProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isRTL ? 'القناة' : 'Channel'}
                </label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value as ActivityChannel)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="call">{isRTL ? 'اتصال هاتفي' : 'Call'}</option>
                  <option value="meeting_f2f">{isRTL ? 'اجتماع حضوري' : 'F2F Meeting'}</option>
                  <option value="visit">{isRTL ? 'زيارة ميدانية' : 'Site Visit'}</option>
                  <option value="hunting">{isRTL ? 'استكشاف ميداني' : 'Hunting'}</option>
                  <option value="email">{isRTL ? 'بريد إلكتروني' : 'Email'}</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer"
              >
                {isRTL ? 'إضافة' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'schedule'
              ? 'border-blue-600 dark:border-[#8FC2F0] text-blue-600 dark:text-[#8FC2F0]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>{isRTL ? `جدول اليوم (${todayTasks.length})` : `Today's Schedule (${todayTasks.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'overdue'
              ? 'border-rose-600 dark:border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{isRTL ? `متابعات متأخرة (${overdueProjects.length})` : `Overdue Follow-ups (${overdueProjects.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('hotleads')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'hotleads'
              ? 'border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>{isRTL ? `دليل الفرص النشطة (${hotLeads.length})` : `Hot Leads Directory (${hotLeads.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'approvals'
              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>
            {isManager 
              ? (isRTL ? `طلبات الاعتماد (${pendingApprovals.length})` : `Pending Approvals (${pendingApprovals.length})`)
              : (isRTL ? `طلباتي (${myRequests.length})` : `My Requests (${myRequests.length})`)}
          </span>
          {activeRequestsCount > 0 && (
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {activeRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Today's Schedule */}
      {activeTab === 'schedule' && (
        <div className="space-y-3">
          {todayTasks.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isRTL ? 'تم إنجاز كافة المهام المجدولة لليوم!' : 'All Scheduled Tasks Clear!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-sm mx-auto">
                {isRTL 
                  ? 'لقد أنهيت جميع التزاماتك اليومية. يمكنك مراجعة الصفقات المتأخرة أو جدولة زيارات واتصالات جديدة.'
                  : 'You have completed all planned tasks for today. You can check the overdue queue or schedule new sales touchpoints.'}
              </p>
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRTL ? '+ جدولة إجراء جديد' : '+ Schedule New Action'}</span>
              </button>
            </div>
          ) : (
            todayTasks.map(task => {
              const ch = getChannelBadge(task.channel);
              const project = projects.find(p => p.id === task.project_id);
              const contact = contacts.find(c => c.id === task.contact_id || c.company_id === task.company_id);
              const cleanPhone = normalizePhoneNumber(contact?.phone || project?.primary_contact_phone);
              const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;
              const isDone = task.status === 'completed';

              return (
                <div 
                  key={task.id}
                  className={`glass-card-interactive rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDone ? 'opacity-60 bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${ch.color}`}>
                      {ch.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.project_id && project ? (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-[#8FC2F0] border border-blue-200 dark:border-blue-800">
                            {project.pr_number}
                          </span>
                        ) : task.custom_target ? (
                          <span className="text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Custom Target
                          </span>
                        ) : null}

                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${ch.color}`}>
                          {ch.label}
                        </span>
                        {task.priority === 'urgent' && (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" />
                            Urgent
                          </span>
                        )}
                        {task.is_auto_suggested && (
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded">
                            Suggested &bull; {task.suggestion_reason}
                          </span>
                        )}
                      </div>

                      {/* Prominent Project / Target Headline */}
                      <div className="mt-1">
                        {task.project_id && project ? (
                          <Link 
                            href={`/projects/${project.id}`}
                            className="text-base font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-[#8FC2F0] transition-colors inline-block"
                          >
                            {task.project_name || project.name}
                          </Link>
                        ) : (task.project_name || task.custom_target) ? (
                          <h4 className="text-base font-black text-slate-900 dark:text-white">
                            {task.project_name || task.custom_target}
                          </h4>
                        ) : null}
                      </div>

                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5 leading-snug">
                        {task.goal}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex-wrap">
                        {task.company_name && (
                          <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {task.company_name}
                          </span>
                        )}
                        {(task.contact_name || contact?.full_name) && (
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            Contact: {task.contact_name || contact?.full_name}
                          </span>
                        )}
                        {task.google_maps_url && (
                          <a
                            href={task.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1 hover:bg-emerald-100 text-[11px]"
                          >
                            <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Maps ↗</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-[#232A38] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Call Contact"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}

                    {currentRole !== 'viewer' && (
                      <button
                        onClick={() => openFastLog({
                          project: project || null,
                          contactId: task.contact_id,
                          plannedActivityId: task.id,
                          defaultGoal: task.goal
                        })}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                          isDone 
                            ? 'bg-emerald-600 text-white cursor-default' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>{isDone ? 'Completed' : 'Complete & Log'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Overdue Follow-ups */}
      {activeTab === 'overdue' && (
        <div className="space-y-3">
          {overdueProjects.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero Overdue Follow-ups!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Outstanding! All projects have up-to-date touchpoints and healthy follow-up timelines.
              </p>
            </div>
          ) : (
            overdueProjects.map(proj => {
              const diffDays = proj.days_overdue || 1;
              const contact = contacts.find(c => c.id === proj.primary_contact_id);
              const cleanPhone = normalizePhoneNumber(contact?.phone || proj.primary_contact_phone);
              const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

              return (
                <div 
                  key={proj.id} 
                  className="glass-card-interactive rounded-2xl border border-rose-200/80 dark:border-rose-900/40 p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        {diffDays} days overdue
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-[#232A38] px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                        {proj.pr_number}
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {formatCurrencySAR(proj.estimated_value)}
                      </span>
                    </div>

                    <Link 
                      href={`/projects/${proj.id}`}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-[#8FC2F0] transition-colors line-clamp-1"
                    >
                      {proj.name}
                    </Link>

                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 bg-rose-50/50 dark:bg-rose-950/20 p-2 rounded-xl border border-rose-100/60 dark:border-rose-900/40 font-medium">
                      <span className="font-bold text-rose-800 dark:text-rose-400 uppercase text-[10px] block">Pending Commitment:</span>
                      {proj.next_action || 'Follow-up date expired without recorded next action.'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-[#232A38] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Call Contact"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}

                    {currentRole !== 'viewer' && (
                      <button
                        onClick={() => openFastLog({ project: proj, contactId: proj.primary_contact_id })}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Log Follow-up</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: Hot Leads Directory */}
      {activeTab === 'hotleads' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotLeads.map(contact => {
            const cleanPhone = normalizePhoneNumber(contact.phone);
            const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;
            const project = projects.find(p => p.company_id === contact.company_id);

            return (
              <div 
                key={contact.id}
                className="glass-card-interactive rounded-2xl p-4 transition-all flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                      Hot Lead
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{contact.city || 'Western Region'}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{contact.full_name}</h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{contact.job_title} &bull; {contact.company_name}</div>

                  {contact.phone && (
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-2">
                      {contact.phone}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-[#232A38] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Call Contact"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {currentRole !== 'viewer' && (
                    <button
                      onClick={() => openFastLog({ project: project || null, contactId: contact.id })}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-600 dark:text-[#8FC2F0] bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Log Call</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: Approvals & Requests */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {displayRequests.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isManager ? 'No Pending Approvals' : 'No Open Requests'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {isManager
                  ? 'All quotation discount and technical approval requests have been resolved. You are completely caught up!'
                  : 'You do not have any open approval requests at this moment. You can submit requests directly from any project card.'}
              </p>
            </div>
          ) : (
            displayRequests.map(req => {
              const project = projects.find(p => p.id === req.project_id);
              const isUrgent = req.urgency === 'urgent';
              const isHigh = req.urgency === 'high';

              return (
                <div 
                  key={req.id}
                  className={`glass-card-interactive rounded-2xl p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    req.status === 'pending'
                      ? isUrgent
                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/25'
                        : isHigh
                          ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/25'
                          : 'border-slate-200 dark:border-[#8FC2F0]/20 hover:border-indigo-300 dark:hover:border-indigo-500'
                      : 'border-slate-200/80 dark:border-[#8FC2F0]/15 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-2xs ${
                      req.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : isUrgent
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-amber-100 text-amber-900'
                    }`}>
                      {req.status === 'approved' ? '✓' : req.status === 'rejected' ? '✕' : '%'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {project && (
                          <Link 
                            href={`/projects/${project.id}`}
                            className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-[#8FC2F0] hover:underline border border-blue-200 dark:border-blue-800"
                          >
                            {project.pr_number}
                          </Link>
                        )}
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {project?.name || req.project_id}
                        </span>

                        {/* Badges */}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isUrgent ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300' : isHigh ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-slate-100 dark:bg-[#232A38] text-slate-700 dark:text-slate-300'
                        }`}>
                          {req.urgency}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' :
                          req.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300' :
                          'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Request details summary */}
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1.5 flex items-center gap-2 flex-wrap">
                        <span>
                          Type: <strong className="text-slate-800 dark:text-slate-200">{req.type === 'discount' && req.payload.discount_pct ? `Discount ${req.payload.discount_pct}%` : req.type.replace('_', ' ')}</strong>
                        </span>
                        {req.quotation_amount && (
                          <span>
                            &bull; Value: <strong className="text-slate-800 dark:text-slate-200">{formatCurrencySAR(req.quotation_amount)}</strong>
                          </span>
                        )}
                        <span>
                          &bull; Requested by <strong className="text-slate-800 dark:text-slate-200">{req.requester_name || req.requested_by}</strong>
                        </span>
                        <span>
                          &bull; {formatDateString(req.created_at)}
                        </span>
                      </div>

                      {/* Reason snippet */}
                      {(req.payload.reason || req.payload.notes) && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-[#141820] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                          &ldquo;{req.payload.reason || req.payload.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => openRequestDetail(req.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isManager && req.status === 'pending' ? 'Review & Decide' : 'View Details'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
