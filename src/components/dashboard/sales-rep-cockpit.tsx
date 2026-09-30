'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { 
  Target, 
  Flame, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  Calendar, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  TrendingUp, 
  Zap, 
  Plus,
  Briefcase,
  Building2,
  User,
  FileSpreadsheet
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';
import { Project } from '@/types/crm';
import { PriorityActionsWidget } from './priority-actions-widget';

interface SalesRepCockpitProps {
  showPriorityActions?: boolean;
}

export function SalesRepCockpit({ showPriorityActions = false }: SalesRepCockpitProps) {
  const { 
    currentUser, 
    projects, 
    contacts, 
    activities, 
    salesTargets,
    openFastLog,
    openReminder
  } = useCRM();
  const { language, t, isRTL } = useLanguage();

  // Scoped to current user
  const myProjects = useMemo(() => {
    return projects.filter(p => p.owner_id === currentUser.id);
  }, [projects, currentUser.id]);

  const myActivities = useMemo(() => {
    return activities.filter(a => a.user_id === currentUser.id);
  }, [activities, currentUser.id]);

  // Calculations for Personal Quota Pace
  const wonProjects = useMemo(() => {
    return myProjects.filter(p => p.pipeline_stage === 'won');
  }, [myProjects]);

  const wonTotalSAR = useMemo(() => {
    return wonProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
  }, [wonProjects]);

  const myTargetSAR = useMemo(() => {
    const repTarget = salesTargets.find(t => t.target_metric === 'won_value');
    return repTarget ? repTarget.target_value : (currentUser.monthly_target_sar || 350000);
  }, [salesTargets, currentUser.monthly_target_sar]);

  const quotaPercent = myTargetSAR > 0 ? Math.min(100, Math.round((wonTotalSAR / myTargetSAR) * 100)) : 0;
  const remainingGapSAR = Math.max(0, myTargetSAR - wonTotalSAR);

  // Calculate days remaining in current month
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysLeftInMonth = Math.max(1, endOfMonth.getDate() - today.getDate());
  const requiredDailyVelocitySAR = Math.round(remainingGapSAR / daysLeftInMonth);

  // Today's logged activities
  const todayStr = today.toISOString().split('T')[0];
  const todayActivities = useMemo(() => {
    return myActivities.filter(a => a.activity_date === todayStr);
  }, [myActivities, todayStr]);

  // Stale deals (active but no touch in > 14 days)
  const staleDeals = useMemo(() => {
    return myProjects.filter(p => {
      if (['won', 'lost', 'hold'].includes(p.pipeline_stage)) return false;
      if (!p.updated_at) return true;
      const diffDays = Math.floor((today.getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 14;
    });
  }, [myProjects, today]);

  // High-Priority Next Actions ("ما يجب فعله اليوم")
  const actionableToday = useMemo(() => {
    const list: {
      type: 'overdue_action' | 'closing_soon' | 'stale_deal' | 'hot_lead';
      title: string;
      project?: Project;
      contactName?: string;
      phone?: string;
      badgeText: string;
      badgeColor: string;
      dueText: string;
      actionType: 'call' | 'visit' | 'log';
    }[] = [];

    // 1. Projects with next_follow_up_at due or overdue
    myProjects.forEach(p => {
      if (['won', 'lost', 'hold'].includes(p.pipeline_stage)) return false;
      if (p.next_follow_up_at && p.next_follow_up_at <= todayStr) {
        list.push({
          type: 'overdue_action',
          title: p.next_action || (isRTL ? 'متابعة استحقاق المشروع' : 'Project Follow-up Due'),
          project: p,
          contactName: p.primary_contact_name,
          phone: p.primary_contact_phone,
          badgeText: isRTL ? 'إجراء مستحق' : 'Due Action',
          badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200',
          dueText: p.next_follow_up_at === todayStr 
            ? (isRTL ? 'اليوم' : 'Today') 
            : (isRTL ? 'متأخر' : 'Overdue'),
          actionType: 'call'
        });
      }
    });

    // 2. High probability deals in final stages
    myProjects.forEach(p => {
      if (['negotiation', 'technically_approved'].includes(p.pipeline_stage) && (p.estimated_value || 0) > 100000) {
        if (!list.some(item => item.project?.id === p.id)) {
          list.push({
            type: 'closing_soon',
            title: isRTL ? `إغلاق صفقة ${p.name}` : `Push to Close: ${p.name}`,
            project: p,
            contactName: p.primary_contact_name,
            phone: p.primary_contact_phone,
            badgeText: isRTL ? 'صفقة قابلة للحسم' : 'Ready to Close',
            badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200',
            dueText: formatCurrencySAR(p.estimated_value || 0),
            actionType: 'log'
          });
        }
      }
    });

    // 3. Stale high-value deals
    staleDeals.slice(0, 2).forEach(p => {
      if (!list.some(item => item.project?.id === p.id)) {
        list.push({
          type: 'stale_deal',
          title: isRTL ? `إنعاش التواصل لمشروع ${p.name}` : `Re-engage Dormant Project: ${p.name}`,
          project: p,
          contactName: p.primary_contact_name,
          phone: p.primary_contact_phone,
          badgeText: isRTL ? 'تواصل راكد' : 'Stale Touch',
          badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200',
          dueText: isRTL ? 'لم يُحدث منذ أسبوعين' : '14+ days idle',
          actionType: 'call'
        });
      }
    });

    return list.slice(0, 4);
  }, [myProjects, todayStr, staleDeals, isRTL]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-urbanist">
      
      {/* 1. Tactical Command Hero Banner */}
      <div className="crm-card p-6 sm:p-8 relative overflow-hidden">
        {/* Glow ambient background accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#8FC2F0]/20 to-[#77CE69]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Rep Identity & Quota Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#77CE69] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#292D32] dark:text-[#8FC2F0]">
                {isRTL ? 'مركز العمليات اليومية لمندوب المبيعات' : 'SALES REP TACTICAL COCKPIT'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292D32] dark:text-white tracking-tight">
              {isRTL ? `مرحباً، يا ${currentUser.full_name.split(' ')[0]}` : `Welcome back, ${currentUser.full_name.split(' ')[0]}`}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-medium">
              {isRTL 
                ? `لديك اليوم ${actionableToday.length} مهام ذات أولوية تجارية قصوى، ويتبقى ${daysLeftInMonth} يوماً على نهاية الشهر لتحقيق مستهدفك.`
                : `You have ${actionableToday.length} high-priority commercial actions today with ${daysLeftInMonth} days left in the month.`}
            </p>
          </div>

          {/* Right: Personal Quota Attainment Ring & Metrics */}
          <div className="flex items-center gap-4 bg-slate-50/90 dark:bg-[#141820]/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shrink-0">
            {/* Circular Progress Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-700"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#8FC2F0] dark:text-[#8FC2F0] transition-all duration-1000 ease-out"
                  strokeDasharray={`${quotaPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xs font-black font-urbanist text-[#292D32] dark:text-white">
                  {quotaPercent}%
                </span>
              </div>
            </div>

            {/* Quota details */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isRTL ? 'إنجاز التارجت الشهري' : 'Monthly Quota'}
              </div>
              <div className="text-sm font-black text-[#292D32] dark:text-white tracking-tight">
                {formatCurrencySAR(wonTotalSAR)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                <span>{isRTL ? 'المستهدف:' : 'Goal:'}</span>
                <span className="font-bold text-[#292D32] dark:text-slate-300">{formatCurrencySAR(myTargetSAR)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical 4 Micro-Kpis Ribbon */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Required Daily Velocity */}
          <div className="p-3.5 rounded-2xl bg-[#8FC2F0]/10 border border-[#8FC2F0]/25">
            <div className="flex items-center justify-between text-[#292D32] dark:text-[#8FC2F0] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">{isRTL ? 'الركض اليومي المطلوب' : 'Daily Run-Rate Needed'}</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#8FC2F0]" />
            </div>
            <div className="text-sm font-black text-[#292D32] dark:text-white">
              {formatCurrencySAR(requiredDailyVelocitySAR)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {isRTL ? `للإغلاق خلال ${daysLeftInMonth} يوماً` : `to reach target in ${daysLeftInMonth}d`}
            </div>
          </div>

          {/* 2. Today's Logged Touches */}
          <div className="p-3.5 rounded-2xl bg-[#77CE69]/10 border border-[#77CE69]/25">
            <div className="flex items-center justify-between text-[#216817] dark:text-[#77CE69] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">{isRTL ? 'إنجازك اليوم' : 'Logged Today'}</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-sm font-black text-[#292D32] dark:text-white">
              {todayActivities.length} {isRTL ? 'أنشطة' : 'Touches'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {isRTL ? 'مكالمات وزيارات مسجلة' : 'Calls & visits logged today'}
            </div>
          </div>

          {/* 3. Active Opportunities Count */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141820]/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">{isRTL ? 'مشاريعك النشطة' : 'Active Pipeline'}</span>
              <Briefcase className="w-3.5 h-3.5 text-[#8FC2F0]" />
            </div>
            <div className="text-sm font-black text-[#292D32] dark:text-white">
              {myProjects.filter(p => !['won', 'lost', 'hold'].includes(p.pipeline_stage)).length} {isRTL ? 'مشروع' : 'Deals'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {isRTL ? 'قيد المتابعة والتسعير' : 'In progress & pricing'}
            </div>
          </div>

          {/* 4. Stale Deals Alert */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">{isRTL ? 'مشاريع راكدة' : 'Stale Warning'}</span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="text-sm font-black text-amber-700 dark:text-amber-400">
              {staleDeals.length} {isRTL ? 'مشروع بحاجة لتواصل' : 'Dormant Deals'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {isRTL ? 'لم يتم التواصل منذ أسبوعين' : 'No contact in 14+ days'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Priority Actions Widget (Rendered here only if showPriorityActions is requested) */}
      {showPriorityActions && (
        <PriorityActionsWidget />
      )}
    </div>
  );
}
