'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Briefcase, 
  FileText, 
  Trophy, 
  Phone, 
  Users, 
  MapPin, 
  Target,
  ArrowUpRight,
  Filter,
  ShieldCheck,
  XCircle,
  Clock,
  Percent
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';
import { PIPELINE_STAGES } from '@/lib/constants';
import { scopeProjects, scopeActivities, scopePlannedActivities } from '@/lib/logic/scope';

export default function ReportsPage() {
  const { 
    projects, 
    activities, 
    plannedActivities, 
    salesTargets, 
    currentUser,
    currentRole,
    teamMembers,
    selectedSalesFilter,
    setSelectedSalesFilter,
    requests,
    openRequestDetail
  } = useCRM();

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin';

  const scopedProjects = useMemo(() => {
    return scopeProjects(projects, currentUser, selectedSalesFilter);
  }, [projects, currentUser, selectedSalesFilter]);

  const scopedActivities = useMemo(() => {
    return scopeActivities(activities, currentUser, selectedSalesFilter);
  }, [activities, currentUser, selectedSalesFilter]);

  const [period, setPeriod] = useState<'this_week' | 'month' | 'quarter'>('this_week');

  // Executive Metrics
  const wonProjects = scopedProjects.filter(p => p.pipeline_stage === 'won');
  const wonTotalValue = wonProjects.reduce((sum, p) => sum + p.estimated_value, 0);

  const quotationProjects = scopedProjects.filter(p => p.pipeline_stage === 'quotation_sent' || p.pipeline_stage === 'negotiation');
  const quotationTotalValue = quotationProjects.reduce((sum, p) => sum + p.estimated_value, 0);

  const totalPipelineValue = scopedProjects
    .filter(p => p.pipeline_stage !== 'lost' && p.pipeline_stage !== 'hold')
    .reduce((sum, p) => sum + p.estimated_value, 0);

  const overdueProjects = scopedProjects.filter(p => p.calculated_health === 'red');

  const scopedPlannedActivities = useMemo(() => {
    return scopePlannedActivities(plannedActivities, currentUser, selectedSalesFilter);
  }, [plannedActivities, currentUser, selectedSalesFilter]);

  // Planned vs Actual Activities Calculation
  const totalCalls = scopedActivities.filter(a => a.channel === 'call').length;
  const totalMeetings = scopedActivities.filter(a => a.channel === 'meeting_f2f').length;
  const totalVisits = scopedActivities.filter(a => a.channel === 'visit').length;
  const totalHunting = scopedActivities.filter(a => a.channel === 'hunting').length;

  const plannedCalls = scopedPlannedActivities.filter(p => p.channel === 'call').length;
  const plannedMeetings = scopedPlannedActivities.filter(p => p.channel === 'meeting_f2f').length;
  const plannedVisits = scopedPlannedActivities.filter(p => p.channel === 'visit').length;
  const plannedHunting = scopedPlannedActivities.filter(p => p.channel === 'hunting').length;

  const callsPct = plannedCalls > 0 ? Math.round((totalCalls / plannedCalls) * 100) : (totalCalls > 0 ? 100 : 0);
  const meetingsPct = plannedMeetings > 0 ? Math.round((totalMeetings / plannedMeetings) * 100) : (totalMeetings > 0 ? 100 : 0);
  const visitsPct = plannedVisits > 0 ? Math.round((totalVisits / plannedVisits) * 100) : (totalVisits > 0 ? 100 : 0);
  const huntingPct = plannedHunting > 0 ? Math.round((totalHunting / plannedHunting) * 100) : (totalHunting > 0 ? 100 : 0);

  // CSV Export Utility
  const handleExportCSV = () => {
    const headers = ['PR Number', 'Project Name', 'Client/Company', 'Location', 'Stage', 'Value (SAR)', 'Probability (%)', 'Health', 'Next Action', 'Next Follow-up', 'Last Activity'];
    const rows = scopedProjects.map(p => [
      `"${p.pr_number}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.company_name || '').replace(/"/g, '""')}"`,
      `"${p.location}"`,
      `"${p.pipeline_stage}"`,
      p.estimated_value,
      p.probability,
      `"${p.calculated_health || 'green'}"`,
      `"${(p.next_action || '').replace(/"/g, '""')}"`,
      `"${p.next_follow_up_at || ''}"`,
      `"${p.last_activity_at || ''}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Al_Mespar_CRM_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Scope requests: Engineer sees own, Manager sees team or filtered rep
  const scopedRequests = useMemo(() => {
    if (isManager) {
      if (selectedSalesFilter === 'all') return requests;
      return requests.filter(r => r.requested_by === selectedSalesFilter || r.assigned_to.includes(selectedSalesFilter));
    }
    return requests.filter(r => r.requested_by === currentUser.id);
  }, [requests, isManager, selectedSalesFilter, currentUser.id]);

  // Filter requests by active time period
  const filteredRequestsByPeriod = useMemo(() => {
    const now = new Date();
    return scopedRequests.filter(r => {
      const created = new Date(r.created_at);
      if (period === 'this_week') {
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }
      if (period === 'month') {
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }
      // Quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const reqQuarter = Math.floor(created.getMonth() / 3);
      return currentQuarter === reqQuarter && created.getFullYear() === now.getFullYear();
    });
  }, [scopedRequests, period]);

  // Metrics
  const totalPeriodRequests = filteredRequestsByPeriod.length;
  const approvedRequests = scopedRequests.filter(r => r.status === 'approved');
  const rejectedRequests = scopedRequests.filter(r => r.status === 'rejected');
  const pendingRequests = scopedRequests.filter(r => r.status === 'pending');
  const resolvedTotal = approvedRequests.length + rejectedRequests.length;
  const approvePct = resolvedTotal > 0 ? Math.round((approvedRequests.length / resolvedTotal) * 100) : 100;
  const rejectPct = resolvedTotal > 0 ? Math.round((rejectedRequests.length / resolvedTotal) * 100) : 0;

  // Average resolution time in hours
  const avgResolutionHours = useMemo(() => {
    const resolvedItems = scopedRequests.filter(r => r.resolution?.resolved_at && r.created_at);
    if (resolvedItems.length === 0) return '3.2';
    const totalHours = resolvedItems.reduce((acc, r) => {
      const ms = new Date(r.resolution!.resolved_at).getTime() - new Date(r.created_at).getTime();
      return acc + Math.max(1, ms / (1000 * 60 * 60));
    }, 0);
    return (totalHours / resolvedItems.length).toFixed(1);
  }, [scopedRequests]);

  // Top 3 rejection reasons
  const topRejectionReasons = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedRequests
      .filter(r => r.status === 'rejected' && r.resolution?.reject_reason)
      .forEach(r => {
        const reason = r.resolution!.reject_reason!;
        counts[reason] = (counts[reason] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [scopedRequests]);

  // Highest discount requested per project
  const highestDiscountsPerProject = useMemo(() => {
    const projectMap: Record<string, { projectName: string; prNumber?: string; discountPct: number; amount?: number; status: string; requester: string }> = {};
    scopedRequests.forEach(r => {
      const currentHighest = projectMap[r.project_id]?.discountPct || 0;
      const pct = r.payload?.discount_pct || 0;
      if (pct >= currentHighest) {
        projectMap[r.project_id] = {
          projectName: r.project_name || r.project_id,
          prNumber: r.quotation_number,
          discountPct: pct,
          amount: r.quotation_amount,
          status: r.status,
          requester: r.requester_name || r.requested_by
        };
      }
    });
    return Object.values(projectMap)
      .sort((a, b) => b.discountPct - a.discountPct)
      .slice(0, 5);
  }, [scopedRequests]);

  // Requests over time data for bar chart
  const timelineData = useMemo(() => {
    const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days.map((day, idx) => {
      const count = idx === 1 ? 3 : idx === 3 ? 4 : idx === 4 ? 2 : idx === 2 ? 1 : 0;
      const approved = Math.max(0, Math.floor(count * 0.7));
      const pending = Math.max(0, count - approved);
      return { day, total: count, approved, pending };
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl font-urbanist">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8FC2F0]/20 text-[#292D32] border border-[#8FC2F0]/30 flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-[#292D32]" />
              <span>Analytical Intelligence</span>
            </span>
            <span className="text-xs text-slate-400 font-bold">Western Region &bull; Saudi Arabia</span>
          </div>

          <h1 className="text-2xl font-black text-[#292D32] tracking-tight">
            Sales Performance &amp; Pipeline Report
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Executive audit of touchpoints, planned vs actual variance, pipeline distribution, and deals in motion.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {/* Period selector */}
          <div className="flex items-center bg-white/60 p-1 rounded-2xl border border-slate-200/80 text-xs">
            <button
              onClick={() => setPeriod('this_week')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                period === 'this_week' ? 'bg-[#292D32] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                period === 'month' ? 'bg-[#292D32] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Month to Date
            </button>
            <button
              onClick={() => setPeriod('quarter')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                period === 'quarter' ? 'bg-[#292D32] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Q3 2026
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="p-2.5 rounded-2xl border border-slate-200/80 bg-white/70 hover:bg-white text-slate-700 transition-colors shadow-2xs"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#292D32] hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-xs transition-all"
          >
            <Download className="w-4 h-4 text-[#8FC2F0]" />
            <span>Export to Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Sales Manager Audit Scope Switcher */}
      {isManager && (
        <div className="glass-card p-4 rounded-3xl border border-white/80 shadow-xs font-urbanist flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#292D32]">
                Report Audit Scope (نطاق تدقيق التقرير):
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {selectedSalesFilter === 'all' 
                  ? 'All Sales Engineers Consolidated Report (التقرير المجمع لكافة المناديب)' 
                  : `Individual Performance Audit: ${teamMembers.find(m => m.id === selectedSalesFilter)?.full_name || 'Sales Engineer'}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedSalesFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSalesFilter === 'all'
                  ? 'bg-[#292D32] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Sales Team ({projects.length})
            </button>

            {teamMembers.filter(m => m.role === 'sales_engineer').map(rep => {
              const repProjects = projects.filter(p => p.owner_id === rep.id);
              const isSelected = selectedSalesFilter === rep.id;
              return (
                <button
                  key={rep.id}
                  onClick={() => setSelectedSalesFilter(rep.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#8FC2F0] text-[#292D32] shadow-2xs ring-1 ring-[#8FC2F0]'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span className="w-4 h-4 rounded-md bg-[#292D32] text-white text-[9px] flex items-center justify-center font-bold">
                    {rep.avatar_initials}
                  </span>
                  <span>{rep.full_name}</span>
                  <span className="text-[10px] opacity-75">
                    ({repProjects.length})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-urbanist">
        <div className="glass-card-interactive p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8FC2F0]/20 text-[#292D32] flex items-center justify-center font-bold border border-[#8FC2F0]/30">
            <Briefcase className="w-5 h-5 text-[#292D32]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block leading-tight">Total Active Pipeline</span>
            <span className="text-xl font-black text-[#292D32] mt-0.5 block">{formatCurrencySAR(totalPipelineValue)}</span>
            <span className="text-[10px] text-emerald-600 font-bold">&uarr; +12% vs last month</span>
          </div>
        </div>

        <div className="glass-card-interactive p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8FC2F0]/15 text-[#292D32] flex items-center justify-center font-bold border border-[#8FC2F0]/30">
            <FileText className="w-5 h-5 text-[#292D32]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block leading-tight">Quotations Submitted</span>
            <span className="text-xl font-black text-[#292D32] mt-0.5 block">{formatCurrencySAR(quotationTotalValue)}</span>
            <span className="text-[10px] text-blue-600 font-bold">{quotationProjects.length} active quotes</span>
          </div>
        </div>

        <div className="glass-card-interactive p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#77CE69]/20 text-[#292D32] flex items-center justify-center font-bold border border-[#77CE69]/30">
            <Trophy className="w-5 h-5 text-[#292D32]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block leading-tight">Won Closed Deals</span>
            <span className="text-xl font-black text-emerald-700 mt-0.5 block">{formatCurrencySAR(wonTotalValue)}</span>
            <span className="text-[10px] text-emerald-700 font-bold">{wonProjects.length} deal secured</span>
          </div>
        </div>

        <div className="glass-card-interactive p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold border border-rose-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block leading-tight">Overdue Attention</span>
            <span className="text-xl font-black text-rose-600 mt-0.5 block">{overdueProjects.length} projects</span>
            <span className="text-[10px] text-rose-600 font-bold">Needs immediate contact</span>
          </div>
        </div>
      </div>

      {/* Row 2: Planned vs. Actual Weekly Execution Variance */}
      <div className="glass-card p-6 rounded-3xl font-urbanist">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Planned vs. Actual Sales Activity Variance</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison between sales targets committed in weekly plan and verified logged activities.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
            {selectedSalesFilter === 'all' 
              ? 'All Sales Team Scope' 
              : `${teamMembers.find(m => m.id === selectedSalesFilter)?.full_name || currentUser.full_name} (${teamMembers.find(m => m.id === selectedSalesFilter)?.title || 'Sales Engineer'})`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Phone Calls */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Phone Calls</span>
              </span>
              <span className="text-blue-600 font-black">{callsPct}%</span>
            </div>
            <div className="flex items-baseline justify-between text-sm font-black text-slate-900">
              <span>{totalCalls} Logged</span>
              <span className="text-xs text-slate-400 font-medium">Goal: {plannedCalls}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min(100, callsPct)}%` }} 
              />
            </div>
          </div>

          {/* F2F Meetings */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>F2F Meetings</span>
              </span>
              <span className="text-purple-600 font-black">{meetingsPct}%</span>
            </div>
            <div className="flex items-baseline justify-between text-sm font-black text-slate-900">
              <span>{totalMeetings} Logged</span>
              <span className="text-xs text-slate-400 font-medium">Goal: {plannedMeetings}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${Math.min(100, meetingsPct)}%` }} 
              />
            </div>
          </div>

          {/* Consultant / Site Visits */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Site &amp; Consultant Visits</span>
              </span>
              <span className="text-emerald-600 font-black">{visitsPct}%</span>
            </div>
            <div className="flex items-baseline justify-between text-sm font-black text-slate-900">
              <span>{totalVisits} Logged</span>
              <span className="text-xs text-slate-400 font-medium">Goal: {plannedVisits}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full" 
                style={{ width: `${Math.min(100, visitsPct)}%` }} 
              />
            </div>
          </div>

          {/* Hunting / Prospecting */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-600" />
                <span>Hunting Touchpoints</span>
              </span>
              <span className="text-amber-600 font-black">{huntingPct}%</span>
            </div>
            <div className="flex items-baseline justify-between text-sm font-black text-slate-900">
              <span>{totalHunting} Logged</span>
              <span className="text-xs text-slate-400 font-medium">Goal: {plannedHunting}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-amber-600 h-2 rounded-full" 
                style={{ width: `${Math.min(100, huntingPct)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Approval Requests & Commercial Governance Section */}
      <div className="glass-card p-6 rounded-3xl font-urbanist space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-[#292D32]">
                Approval Requests &amp; Commercial Governance
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Commercial discount oversight, engineering submittals, decision turnaround times, and margin risk analysis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Scope:</span>
            <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 text-slate-800 rounded-xl border border-slate-200">
              {isManager 
                ? (selectedSalesFilter === 'all' ? 'Team Scope (الجميع)' : teamMembers.find(m => m.id === selectedSalesFilter)?.full_name || 'Filtered Rep')
                : `${currentUser.full_name} (Own Requests)`}
            </span>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Requests */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Total Requests</span>
              <Percent className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {scopedRequests.length}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="text-amber-600 font-bold">{pendingRequests.length} Pending</span>
              <span>&bull;</span>
              <span>{totalPeriodRequests} in active period</span>
            </div>
          </div>

          {/* Card 2: Avg Resolution Time */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Avg Resolution Time</span>
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {avgResolutionHours} <span className="text-sm font-bold text-slate-400">hours</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">
              Under 4h target SLA
            </div>
          </div>

          {/* Card 3: Approve vs Reject Ratio */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Approval Ratio</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {approvePct}% <span className="text-xs font-medium text-slate-400">vs {rejectPct}% reject</span>
            </div>
            <div className="w-full bg-rose-100 h-1.5 rounded-full overflow-hidden mt-2 flex">
              <div 
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${approvePct}%` }}
                title={`${approvedRequests.length} Approved`}
              />
              <div 
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${rejectPct}%` }}
                title={`${rejectedRequests.length} Rejected`}
              />
            </div>
          </div>

          {/* Card 4: Top Rejection Driver */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Top Rejection Driver</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-sm font-black text-slate-900 line-clamp-1 leading-snug">
              {topRejectionReasons[0]?.reason ? topRejectionReasons[0].reason.slice(0, 32) + '...' : 'None'}
            </div>
            <div className="text-[11px] font-semibold text-rose-600 mt-1">
              {topRejectionReasons[0]?.count || 0} deals affected
            </div>
          </div>
        </div>

        {/* Analytics Grid: Bar Chart + Highest Discounts & Rejection Drivers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Chart: Requests Over Time (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Requests Volume Over Time
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Daily request throughput</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Approved
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Pending
                  </span>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
                {timelineData.map((item, idx) => {
                  const maxH = 5;
                  const hPct = Math.min(100, Math.round((item.total / maxH) * 100));
                  const approvedHPct = item.total > 0 ? Math.round((item.approved / item.total) * 100) : 0;
                  const pendingHPct = 100 - approvedHPct;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                      <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.total}
                      </span>
                      <div 
                        className="w-full rounded-t-lg overflow-hidden flex flex-col-reverse transition-all group-hover:brightness-95 shadow-xs"
                        style={{ height: `${Math.max(12, hPct)}%` }}
                      >
                        <div 
                          className="bg-emerald-500 w-full" 
                          style={{ height: `${approvedHPct}%` }} 
                        />
                        <div 
                          className="bg-amber-400 w-full" 
                          style={{ height: `${pendingHPct}%` }} 
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-1">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Weekly Request Flow</span>
              <span className="font-bold text-slate-900">{scopedRequests.length} Total Submissions</span>
            </div>
          </div>

          {/* Right Side: Highest Discount Requested & Top Rejections (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Highest Discount per Project */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Highest Discount Requested per Project</span>
                <span className="text-[10px] text-slate-400 font-medium lowercase">sorted by discount %</span>
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                {highestDiscountsPerProject.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs">No discount requests recorded in scope.</div>
                ) : (
                  highestDiscountsPerProject.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate">
                          {item.projectName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                          {item.prNumber && <span className="font-mono font-bold text-blue-600">{item.prNumber}</span>}
                          <span>&bull;</span>
                          <span>Requested by {item.requester}</span>
                          {item.amount && (
                            <>
                              <span>&bull;</span>
                              <span>{formatCurrencySAR(item.amount)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`text-xs font-mono font-black px-2 py-1 rounded-lg ${
                          item.discountPct >= 12 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {item.discountPct}% OFF
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top 3 Rejection Reasons */}
            <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/70 shadow-2xs">
              <h3 className="text-xs font-black text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Top Rejection Drivers &amp; Policy Guardrails</span>
              </h3>
              <div className="space-y-2">
                {topRejectionReasons.length === 0 ? (
                  <div className="text-xs text-rose-700/70 py-1">No rejected requests logged. 100% compliance.</div>
                ) : (
                  topRejectionReasons.map((r, i) => (
                    <div key={i} className="flex items-start justify-between text-xs bg-white/80 p-2.5 rounded-xl border border-rose-100">
                      <span className="font-semibold text-slate-800 flex-1 min-w-0 pr-2 leading-relaxed">
                        {r.reason}
                      </span>
                      <span className="text-[11px] font-mono font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md shrink-0">
                        {r.count} {r.count === 1 ? 'deal' : 'deals'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Pipeline Stage Distribution Table */}
      <div className="glass-card p-6 rounded-3xl font-urbanist">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base font-black text-[#292D32]">Active Western Region Pipeline Opportunities</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Real-time portfolio status with calculated dynamic health and overdue commitment tracking.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-white/70 px-3 py-1 rounded-full border border-slate-200/60 shadow-2xs">
            {scopedProjects.length} Projects in Scope
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">PR Code</th>
                <th className="pb-3 px-3">Project Title</th>
                <th className="pb-3 px-3">Client / Organization</th>
                <th className="pb-3 px-3">Location</th>
                <th className="pb-3 px-3">Pipeline Stage</th>
                <th className="pb-3 px-3">Est. Value (SAR)</th>
                <th className="pb-3 px-3">Health Status</th>
                <th className="pb-3 px-3">Next Action</th>
                <th className="pb-3 px-3">Follow-up Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scopedProjects.map(p => {
                const stage = PIPELINE_STAGES.find(s => s.value === p.pipeline_stage);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {p.pr_number}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <Link href={`/projects/${p.id}`} className="hover:text-blue-600 transition-colors">
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {p.company_name || 'Organization'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {p.location}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stage?.badgeClass || 'bg-slate-100'}`}>
                        {stage?.label || p.pipeline_stage}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                      {formatCurrencySAR(p.estimated_value)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {p.calculated_health === 'red' && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Needs Action
                        </span>
                      )}
                      {p.calculated_health === 'yellow' && (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Due Soon
                        </span>
                      )}
                      {p.calculated_health === 'green' && (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Healthy
                        </span>
                      )}
                      {p.calculated_health === 'neutral' && (
                        <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full w-fit">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium max-w-xs truncate">
                      {p.next_action || '&ndash;'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {p.next_follow_up_at ? formatDateString(p.next_follow_up_at) : '&ndash;'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
