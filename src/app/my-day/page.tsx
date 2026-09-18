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

export default function MyDayPage() {
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
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  }, []);

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
            <span>Daily Execution Dashboard &bull; {todayDisplay}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Good day, {currentUser.full_name.split(' ')[0]}
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Here is your sales action queue for today. Complete scheduled client commitments, resolve overdue pipeline blockers, and log actions in under 20 seconds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Manager Rep Selector */}
          {isManager && (
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-xs backdrop-blur-md">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Rep:</span>
              <select
                value={selectedSalesFilter}
                onChange={(e) => setSelectedSalesFilter(e.target.value)}
                className="bg-slate-900/80 border border-white/20 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none"
              >
                <option value="all">All Sales Team ({teamMembers.length})</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {currentRole !== 'viewer' && (
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Day Task</span>
            </button>
          )}

          <button
            onClick={() => openFastLog()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Fast Log (&lt; 20s)</span>
          </button>
        </div>
      </div>

      {/* Daily KPI Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Due Today</span>
            <span className="text-xl font-black text-slate-900">{todayTasks.length} tasks</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Overdue Attention</span>
            <span className="text-xl font-black text-rose-600">{overdueProjects.length} projects</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Completed Today</span>
            <span className="text-xl font-black text-slate-900">{activitiesLoggedToday.length} logged</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Hot Leads</span>
            <span className="text-xl font-black text-slate-900">{hotLeads.length} active</span>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-md animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Schedule Impromptu Task for Today</span>
            </h3>
            <button 
              onClick={() => setIsQuickAddOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateQuickTask} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Action / Goal</label>
              <input
                type="text"
                required
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="e.g. Call procurement manager for revision update"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Project</label>
              <select
                value={newProjectId}
                onChange={(e) => setNewProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Channel</label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value as ActivityChannel)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="call">Call</option>
                  <option value="meeting_f2f">F2F Meeting</option>
                  <option value="visit">Site Visit</option>
                  <option value="hunting">Hunting</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'schedule'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>Today&apos;s Schedule ({todayTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'overdue'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Overdue Follow-ups ({overdueProjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hotleads')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'hotleads'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Hot Leads Directory ({hotLeads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isManager ? `Pending Approvals (${pendingApprovals.length})` : `My Requests (${myRequests.length})`}</span>
          {activeRequestsCount > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {activeRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Today's Schedule */}
      {activeTab === 'schedule' && (
        <div className="space-y-3">
          {todayTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">All Scheduled Tasks Clear!</h3>
              <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
                You have completed all planned tasks for today. You can check the overdue queue or schedule new sales touchpoints.
              </p>
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Schedule New Action</span>
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
                    isDone ? 'opacity-60 bg-emerald-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${ch.color}`}>
                      {ch.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.project_id && project ? (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {project.pr_number}
                          </span>
                        ) : task.custom_target ? (
                          <span className="text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            Custom Target
                          </span>
                        ) : null}

                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${ch.color}`}>
                          {ch.label}
                        </span>
                        {task.priority === 'urgent' && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" />
                            Urgent
                          </span>
                        )}
                        {task.is_auto_suggested && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                            Suggested &bull; {task.suggestion_reason}
                          </span>
                        )}
                      </div>

                      {/* Prominent Project / Target Headline */}
                      <div className="mt-1">
                        {task.project_id && project ? (
                          <Link 
                            href={`/projects/${project.id}`}
                            className="text-base font-black text-slate-900 hover:text-blue-600 transition-colors inline-block"
                          >
                            {task.project_name || project.name}
                          </Link>
                        ) : (task.project_name || task.custom_target) ? (
                          <h4 className="text-base font-black text-slate-900">
                            {task.project_name || task.custom_target}
                          </h4>
                        ) : null}
                      </div>

                      <p className="text-sm font-semibold text-slate-700 mt-0.5 leading-snug">
                        {task.goal}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1 flex-wrap">
                        {task.company_name && (
                          <span className="text-slate-600 font-medium flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {task.company_name}
                          </span>
                        )}
                        {(task.contact_name || contact?.full_name) && (
                          <span className="text-slate-600 font-medium">
                            Contact: {task.contact_name || contact?.full_name}
                          </span>
                        )}
                        {task.google_maps_url && (
                          <a
                            href={task.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1 hover:bg-emerald-100 text-[11px]"
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
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
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
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Zero Overdue Follow-ups!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                  className="bg-white rounded-xl border border-rose-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        {diffDays} days overdue
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {proj.pr_number}
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        {formatCurrencySAR(proj.estimated_value)}
                      </span>
                    </div>

                    <Link 
                      href={`/projects/${proj.id}`}
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                    >
                      {proj.name}
                    </Link>

                    <div className="text-xs text-slate-600 mt-1 bg-rose-50/50 p-2 rounded-lg border border-rose-100/60 font-medium">
                      <span className="font-bold text-rose-800 uppercase text-[10px] block">Pending Commitment:</span>
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
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
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
                className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-amber-400 transition-all flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                      Hot Lead
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{contact.city || 'Western Region'}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-1">{contact.full_name}</h4>
                  <div className="text-xs text-slate-500 font-medium">{contact.job_title} &bull; {contact.company_name}</div>

                  {contact.phone && (
                    <div className="text-xs font-mono text-slate-600 mt-2">
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
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Call Contact"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {currentRole !== 'viewer' && (
                    <button
                      onClick={() => openFastLog({ project: project || null, contactId: contact.id })}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
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
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">
                {isManager ? 'No Pending Approvals' : 'No Open Requests'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                  className={`bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    req.status === 'pending'
                      ? isUrgent
                        ? 'border-rose-300 bg-rose-50/20'
                        : isHigh
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-slate-200 hover:border-indigo-300'
                      : 'border-slate-200 opacity-80'
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
                            className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:underline border border-blue-200"
                          >
                            {project.pr_number}
                          </Link>
                        )}
                        <span className="text-sm font-extrabold text-slate-900">
                          {project?.name || req.project_id}
                        </span>

                        {/* Badges */}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isUrgent ? 'bg-rose-100 text-rose-800' : isHigh ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {req.urgency}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Request details summary */}
                      <div className="text-xs text-slate-600 font-medium mt-1.5 flex items-center gap-2 flex-wrap">
                        <span>
                          Type: <strong className="text-slate-800">{req.type === 'discount' && req.payload.discount_pct ? `Discount ${req.payload.discount_pct}%` : req.type.replace('_', ' ')}</strong>
                        </span>
                        {req.quotation_amount && (
                          <span>
                            &bull; Value: <strong className="text-slate-800">{formatCurrencySAR(req.quotation_amount)}</strong>
                          </span>
                        )}
                        <span>
                          &bull; Requested by <strong className="text-slate-800">{req.requester_name || req.requested_by}</strong>
                        </span>
                        <span>
                          &bull; {formatDateString(req.created_at)}
                        </span>
                      </div>

                      {/* Reason snippet */}
                      {(req.payload.reason || req.payload.notes) && (
                        <p className="text-xs text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
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
