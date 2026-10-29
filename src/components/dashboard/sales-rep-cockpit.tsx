'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { 
  Target, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { formatCurrencySAR } from '@/lib/utils';
import { formatCompactSAR } from '@/lib/logic/quotation-pricing';
import { Project } from '@/types/crm';
import { PriorityActionsWidget } from './priority-actions-widget';

interface SalesRepCockpitProps {
  showPriorityActions?: boolean;
}

export function SalesRepCockpit({ showPriorityActions = false }: SalesRepCockpitProps) {
  const { 
    currentUser, 
    projects, 
    activities, 
    salesTargets,
    openFastLog,
    selectedSalesFilter
  } = useCRM();
  const { isRTL } = useLanguage();

  const isEngineer = currentUser.role === 'sales_engineer';

  // Scoped to target rep or all (Engineers are strictly locked to their own records)
  const targetProjects = useMemo(() => {
    if (isEngineer) {
      return projects.filter(p => p.owner_id === currentUser.id || p.referred_to_id === currentUser.id);
    }
    if (selectedSalesFilter && selectedSalesFilter !== 'all') {
      return projects.filter(p => p.owner_id === selectedSalesFilter || p.referred_to_id === selectedSalesFilter);
    }
    return projects;
  }, [projects, currentUser.id, selectedSalesFilter, isEngineer]);

  const targetActivities = useMemo(() => {
    if (isEngineer) {
      return activities.filter(a => a.user_id === currentUser.id);
    }
    if (selectedSalesFilter && selectedSalesFilter !== 'all') {
      return activities.filter(a => a.user_id === selectedSalesFilter);
    }
    return activities;
  }, [activities, currentUser.id, selectedSalesFilter, isEngineer]);

  // Won totals
  const wonProjects = useMemo(() => {
    return targetProjects.filter(p => p.pipeline_stage === 'won');
  }, [targetProjects]);

  const wonTotalSAR = useMemo(() => {
    return wonProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
  }, [wonProjects]);

  // Target SAR calculation
  const myTargetSAR = useMemo(() => {
    if (selectedSalesFilter && selectedSalesFilter !== 'all') {
      const repTarget = salesTargets.find(t => t.user_id === selectedSalesFilter && t.target_metric === 'won_value');
      return repTarget?.target_value || 350000;
    }
    if (isEngineer) {
      const repTarget = salesTargets.find(t => t.target_metric === 'won_value');
      return repTarget ? repTarget.target_value : (currentUser.monthly_target_sar || 350000);
    }
    // Sales manager overview
    const sumTargets = salesTargets.filter(t => t.target_metric === 'won_value').reduce((sum, t) => sum + t.target_value, 0);
    return sumTargets > 0 ? sumTargets : 1500000;
  }, [salesTargets, currentUser.monthly_target_sar, isEngineer, selectedSalesFilter]);

  const quotaPercent = myTargetSAR > 0 ? Math.min(100, Math.round((wonTotalSAR / myTargetSAR) * 100)) : 0;

  // Days left in current month
  const today = useMemo(() => new Date(), []);
  const endOfMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 0), [today]);
  const daysLeftInMonth = Math.max(1, endOfMonth.getDate() - today.getDate());

  // Dynamic formatted date string (e.g. "Thu, Oct 16, 2026")
  const dateFormatted = useMemo(() => {
    return today.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [today, isRTL]);

  // Adaptive Quarterly Quota Target
  const currentQuarter = Math.floor(today.getMonth() / 3) + 1; // Q1..Q4
  const quartersRemaining = Math.max(1, 5 - currentQuarter);
  const currentYear = today.getFullYear();
  const annualTargetSAR = myTargetSAR * 12;

  const yearWonProjects = useMemo(() => {
    return wonProjects.filter(p => {
      const d = p.updated_at ? new Date(p.updated_at) : (p.created_at ? new Date(p.created_at) : today);
      return d.getFullYear() === currentYear;
    });
  }, [wonProjects, currentYear, today]);

  const yearWonTotalSAR = useMemo(() => {
    return yearWonProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
  }, [yearWonProjects]);

  const remainingAnnualGapSAR = Math.max(0, annualTargetSAR - yearWonTotalSAR);
  const requiredQuarterlyTargetSAR = Math.round(remainingAnnualGapSAR / quartersRemaining);

  // Today's actions & tasks count
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  const actionableToday = useMemo(() => {
    const list: Project[] = [];
    targetProjects.forEach(p => {
      if (['won', 'lost', 'hold'].includes(p.pipeline_stage)) return;
      if (p.next_follow_up_at && p.next_follow_up_at.split('T')[0] <= todayStr) {
        list.push(p);
      }
    });
    return list;
  }, [targetProjects, todayStr]);

  const weekActivitiesCount = useMemo(() => {
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
    return targetActivities.filter(a => a.activity_date >= oneWeekAgoStr).length;
  }, [targetActivities, today]);

  return (
    <div className="crm-card p-5 sm:p-6 relative overflow-hidden font-urbanist bg-white/90 dark:bg-[#1C2130]/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs animate-in fade-in duration-300">
      {/* Ambient gradient accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#8FC2F0]/15 to-[#77CE69]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Rep Identity & Adaptive Target */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#77CE69] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-[#8FC2F0]">
              {isRTL ? 'مركز العمليات الميدانية للمبيعات' : 'SALES REP TACTICAL COCKPIT'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#292D32] dark:text-white tracking-tight">
            {isRTL 
              ? `مرحباً بك، يا ${currentUser.full_name.split(' ')[0]} 👋` 
              : `Welcome back, ${currentUser.full_name.split(' ')[0]} 👋`}
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isRTL 
              ? `لديك اليوم ${actionableToday.length} مهام ذات أولوية تجارية قصوى، ويتبقى ${daysLeftInMonth} يوماً على نهاية الشهر.`
              : `You have ${actionableToday.length} high-priority commercial actions today with ${daysLeftInMonth} days left in the month.`}
          </p>

          {/* Dynamic Adaptive Quarterly Target Pill */}
          <div className="pt-1.5 flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8FC2F0]/15 dark:bg-[#8FC2F0]/10 border border-[#8FC2F0]/30 dark:border-[#8FC2F0]/20 text-[11px] font-bold text-[#292D32] dark:text-[#8FC2F0]">
              <Target className="w-3.5 h-3.5 text-[#8FC2F0]" />
              <span>
                {isRTL 
                  ? `المستهدف الفصلي (Q${currentQuarter}): ${formatCompactSAR(requiredQuarterlyTargetSAR)} ريال (موزع ديناميكياً)`
                  : `Q${currentQuarter} Target Needed: ${formatCompactSAR(requiredQuarterlyTargetSAR)} (dynamically adjusted)`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Date, Quota Progress Gauge, Fast Actions */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
          {/* Date pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-[#141820]/70 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-[#8FC2F0]" />
            <span>{dateFormatted}</span>
          </div>

          {/* Monthly Quota Ring */}
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-[#141820]/70 border border-slate-200/80 dark:border-slate-800">
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-700"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#77CE69] transition-all duration-1000 ease-out"
                  strokeDasharray={`${quotaPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-black text-[#292D32] dark:text-white">
                {quotaPercent}%
              </span>
            </div>
            <div className="text-[11px] leading-tight">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isRTL ? 'إنجاز التارجت الشهري' : 'Monthly Quota'}
              </div>
              <div className="font-extrabold text-[#292D32] dark:text-white">
                {formatCompactSAR(wonTotalSAR)} / {formatCompactSAR(myTargetSAR)}
              </div>
            </div>
          </div>

          {/* Task Pills */}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-[#141820]/70 border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span className="text-[#8FC2F0] font-black">{actionableToday.length}</span> {isRTL ? 'مهام اليوم' : "Today's Tasks"}
            </div>
            <div className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-[#141820]/70 border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span className="text-[#77CE69] font-black">{weekActivitiesCount}</span> {isRTL ? 'هذا الأسبوع' : 'This Week'}
            </div>
          </div>

          {/* Log Activity Button */}
          <button
            type="button"
            onClick={() => openFastLog()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#8FC2F0] hover:bg-[#7AB5E8] text-[#141820] text-xs font-black transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRTL ? 'تسجيل نشاط +' : '+ Log Activity'}</span>
          </button>
        </div>
      </div>

      {showPriorityActions && (
        <div className="mt-6">
          <PriorityActionsWidget />
        </div>
      )}
    </div>
  );
}
