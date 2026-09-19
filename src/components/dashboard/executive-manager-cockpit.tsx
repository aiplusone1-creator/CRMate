'use client';

import React, { useMemo } from 'react';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Target, 
  FileSpreadsheet, 
  CheckCircle2, 
  ArrowUpRight, 
  Briefcase, 
  FileText, 
  MapPin, 
  Award,
  Filter,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { formatCurrencySAR } from '@/lib/utils';

export function ExecutiveManagerCockpit() {
  const { 
    projects, 
    teamMembers, 
    currentUser, 
    currentRole, 
    selectedSalesFilter, 
    setSelectedSalesFilter 
  } = useCRM();
  const { language, t, isRTL } = useLanguage();

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin' || currentRole === 'sales_manager' || currentRole === 'admin';

  // Calculate detailed performance breakdown per sales engineer
  const repStats = useMemo(() => {
    const salesEngineers = teamMembers.filter(m => m.role === 'sales_engineer');

    return salesEngineers.map((member, index) => {
      const memberProjects = projects.filter(p => p.owner_id === member.id);
      
      const inHandProjects = memberProjects.filter(p => p.opportunity_type === 'in_hand' && !['won', 'lost', 'hold'].includes(p.pipeline_stage));
      const inHandValue = inHandProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);

      const quotationProjects = memberProjects.filter(p => p.pipeline_stage === 'quotation_sent');
      const quotationValue = quotationProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);

      const wonProjects = memberProjects.filter(p => p.pipeline_stage === 'won');
      const wonValue = wonProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);

      const lostProjects = memberProjects.filter(p => p.pipeline_stage === 'lost');
      const lostValue = lostProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);

      const activeProjects = memberProjects.filter(p => !['won', 'lost', 'hold'].includes(p.pipeline_stage));
      const activePipelineValue = activeProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);

      const targetSAR = member.monthly_target_sar || 500000;
      const closedDeals = wonProjects.length + lostProjects.length;
      const winRate = closedDeals > 0 ? Math.round((wonProjects.length / closedDeals) * 100) : 0;
      
      // Quota attainment based on won revenue towards monthly target
      const quotaPct = targetSAR > 0 ? Math.min(100, Math.round((wonValue / targetSAR) * 100)) : 0;

      return {
        member,
        rank: index + 1,
        totalProjectsCount: memberProjects.length,
        activeCount: activeProjects.length,
        activePipelineValue,
        inHandCount: inHandProjects.length,
        inHandValue,
        quotationCount: quotationProjects.length,
        quotationValue,
        wonCount: wonProjects.length,
        wonValue,
        lostCount: lostProjects.length,
        lostValue,
        targetSAR,
        winRate,
        quotaPct,
      };
    }).sort((a, b) => b.wonValue - a.wonValue || b.activePipelineValue - a.activePipelineValue);
  }, [teamMembers, projects]);

  // Aggregate Team Pulse Metrics
  const teamAggregate = useMemo(() => {
    const totalWon = repStats.reduce((acc, r) => acc + r.wonValue, 0);
    const totalTarget = repStats.reduce((acc, r) => acc + r.targetSAR, 0);
    const totalActivePipeline = repStats.reduce((acc, r) => acc + r.activePipelineValue, 0);
    const totalWonDeals = repStats.reduce((acc, r) => acc + r.wonCount, 0);
    const totalLostDeals = repStats.reduce((acc, r) => acc + r.lostCount, 0);
    const overallWinRate = (totalWonDeals + totalLostDeals) > 0
      ? Math.round((totalWonDeals / (totalWonDeals + totalLostDeals)) * 100)
      : 0;
    const overallQuotaPct = totalTarget > 0 ? Math.min(100, Math.round((totalWon / totalTarget) * 100)) : 0;

    // Stalled Deals: Projects stuck in pricing, rfq_processing or technical_submission for > 21 days
    const now = new Date();
    const stalledDeals = projects.filter(p => {
      if (!['pricing', 'rfq_processing', 'technical_submission'].includes(p.pipeline_stage)) return false;
      if (!p.updated_at) return true;
      const days = Math.floor((now.getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return days >= 21;
    });
    const stalledValueSAR = stalledDeals.reduce((sum, p) => sum + (p.estimated_value || 0), 0);

    return {
      totalWon,
      totalTarget,
      totalActivePipeline,
      overallWinRate,
      overallQuotaPct,
      stalledDealsCount: stalledDeals.length,
      stalledValueSAR
    };
  }, [repStats, projects]);

  if (!isManager) {
    return null;
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Executive Commercial Pulse Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Team Quota Velocity */}
        <div className="crm-card p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 font-urbanist">
              {isRTL ? 'إنجاز التارجت المجمع' : 'Team Quota Attainment'}
            </span>
            <div className="w-10 h-10 rounded-full bg-[#8FC2F0]/15 dark:bg-[#8FC2F0]/20 flex items-center justify-center text-[#292D32] dark:text-[#8FC2F0]">
              <Target className="w-5 h-5 text-[#292D32] dark:text-[#8FC2F0]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#292D32] dark:text-white font-urbanist tracking-tight">
              {formatCurrencySAR(teamAggregate.totalWon)}
            </span>
            <span className="text-xs font-bold font-urbanist px-2.5 py-1 rounded-full bg-[#8FC2F0]/20 text-[#292D32] dark:text-white border border-[#8FC2F0]/30">
              {teamAggregate.overallQuotaPct}%
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {isRTL ? `من إجمالي هدف الفريق ${formatCurrencySAR(teamAggregate.totalTarget)}` : `of ${formatCurrencySAR(teamAggregate.totalTarget)} target`}
          </div>
        </div>

        {/* Metric 2: Win Rate Efficiency */}
        <div className="crm-card p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 font-urbanist">
              {isRTL ? 'معدل حسم الصفقات' : 'Commercial Win Rate'}
            </span>
            <div className="w-10 h-10 rounded-full bg-[#77CE69]/15 dark:bg-[#77CE69]/20 flex items-center justify-center text-[#77CE69]">
              <Percent className="w-5 h-5 text-[#77CE69]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#292D32] dark:text-white font-urbanist tracking-tight">
              {teamAggregate.overallWinRate}%
            </span>
            <span className="text-xs font-bold text-[#77CE69] flex items-center gap-1 font-urbanist">
              <TrendingUp className="w-3.5 h-3.5" />
              {isRTL ? 'معدل صحي' : 'Healthy'}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {isRTL ? 'نسبة الصفقات الرابحة مقارنة بالخاسرة' : 'Won deals ratio over closed total'}
          </div>
        </div>

        {/* Metric 3: Active Team Pipeline */}
        <div className="crm-card p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 font-urbanist">
              {isRTL ? 'إجمالي البايبلاين النشط' : 'Active Team Pipeline'}
            </span>
            <div className="w-10 h-10 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#292D32] dark:text-white font-urbanist tracking-tight">
              {formatCurrencySAR(teamAggregate.totalActivePipeline)}
            </span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-urbanist px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/50 dark:border-purple-800/50">
              {projects.filter(p => !['won', 'lost', 'hold'].includes(p.pipeline_stage)).length} {isRTL ? 'مشروع' : 'Deals'}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {isRTL ? 'قيد المتابعة والتسعير والتفاوض' : 'Under active estimation & negotiation'}
          </div>
        </div>

        {/* Metric 4: Leakage & Risk Radar */}
        <div className="crm-card p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 font-urbanist">
              {isRTL ? 'رادار المخاطر والركود' : 'Deal Risk & Stagnation'}
            </span>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-urbanist tracking-tight">
              {formatCurrencySAR(teamAggregate.stalledValueSAR)}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 font-urbanist">
              {teamAggregate.stalledDealsCount} {isRTL ? 'معلقة' : 'Stalled'}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {isRTL ? 'مشاريع راكدة في التسعير > 21 يوماً' : 'Stalled in pricing/submittal > 21d'}
          </div>
        </div>
      </div>

      {/* 2. Sales Engineers Leaderboard Table */}
      <div className="crm-card overflow-hidden">
        {/* Header with Scope Switcher */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Award className="w-5 h-5 text-purple-700 dark:text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#292D32] dark:text-white font-urbanist">
                  {t('leaderboardTitle')}
                </h3>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-urbanist">
                  {isRTL ? 'تدقيق مباشر' : 'AUDIT ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {t('leaderboardSubtitle')}
              </p>
            </div>
          </div>

          {/* Scope Filter Quick Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-urbanist hidden md:inline mr-1">
              {t('viewingScope')}:
            </span>
            <button
              onClick={() => setSelectedSalesFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer font-urbanist ${
                selectedSalesFilter === 'all'
                  ? 'bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-sm'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              {t('allTeam')} ({projects.length})
            </button>

            {teamMembers.filter(m => m.role === 'sales_engineer').map(rep => {
              const isSelected = selectedSalesFilter === rep.id;
              const repCount = projects.filter(p => p.owner_id === rep.id).length;
              return (
                <button
                  key={rep.id}
                  onClick={() => setSelectedSalesFilter(rep.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-urbanist ${
                    isSelected
                      ? 'bg-[#8FC2F0] text-[#292D32] shadow-sm'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-[#292D32] dark:bg-slate-100 text-white dark:text-[#292D32] text-[8px] flex items-center justify-center font-bold">
                    {rep.avatar_initials}
                  </span>
                  <span>{rep.full_name}</span>
                  <span className="text-[10px] opacity-75 font-urbanist">
                    ({repCount})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reps Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-wider font-urbanist border-b border-slate-100 dark:border-slate-800">
                <th className="py-3.5 px-5">{isRTL ? 'مهندس المبيعات' : 'Sales Engineer'}</th>
                <th className="py-3.5 px-4">{isRTL ? 'المنطقة' : 'Territory'}</th>
                <th className="py-3.5 px-4 text-center">{t('dealsCount')}</th>
                <th className="py-3.5 px-4 text-right">{isRTL ? 'مشاريع قيد المتابعة' : 'In-Hand (SAR)'}</th>
                <th className="py-3.5 px-4 text-right">{t('quotationValue')}</th>
                <th className="py-3.5 px-4 text-right">{t('wonValue')}</th>
                <th className="py-3.5 px-4 text-center">{t('winRate')}</th>
                <th className="py-3.5 px-4">{t('monthlyTarget')}</th>
                <th className="py-3.5 px-4 text-center">{t('audit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {repStats.map((rep) => {
                const isCurrentFilter = selectedSalesFilter === rep.member.id;

                return (
                  <tr 
                    key={rep.member.id} 
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                      isCurrentFilter ? 'bg-sky-50/50 dark:bg-sky-950/30' : ''
                    }`}
                  >
                    {/* Rep Name & Avatar */}
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#292D32] dark:bg-slate-700 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs font-urbanist">
                          {rep.member.avatar_initials}
                        </div>
                        <div>
                          <div className="font-extrabold flex items-center gap-1.5 text-sm text-[#292D32] dark:text-white font-urbanist">
                            <span>{rep.member.full_name}</span>
                            {rep.rank === 1 && (
                              <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {rep.member.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Territory */}
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-[#8FC2F0] shrink-0" />
                        <span className="truncate max-w-[140px]">{rep.member.territory || 'KSA Territory'}</span>
                      </div>
                    </td>

                    {/* Deals Count */}
                    <td className="py-4 px-4 text-center font-urbanist font-bold text-slate-700 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-xs">
                        {rep.totalProjectsCount}
                      </span>
                    </td>

                    {/* In-Hand Pipeline Value */}
                    <td className="py-4 px-4 text-right font-urbanist font-bold text-slate-800 dark:text-slate-200">
                      <div>{formatCurrencySAR(rep.inHandValue)}</div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {rep.inHandCount} {isRTL ? 'فرص' : 'deals'}
                      </span>
                    </td>

                    {/* Quotations Delivered */}
                    <td className="py-4 px-4 text-right font-urbanist font-bold text-sky-700 dark:text-sky-400">
                      <div>{formatCurrencySAR(rep.quotationValue)}</div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {rep.quotationCount} {isRTL ? 'عروض' : 'quotes'}
                      </span>
                    </td>

                    {/* Won Deals Value */}
                    <td className="py-4 px-4 text-right font-urbanist font-extrabold text-emerald-600 dark:text-emerald-400">
                      <div>{formatCurrencySAR(rep.wonValue)}</div>
                      <span className="text-[10px] text-emerald-500 font-normal">
                        {rep.wonCount} {isRTL ? 'صفقات رابحة' : 'won'}
                      </span>
                    </td>

                    {/* Win Rate */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 font-urbanist font-bold text-xs px-2.5 py-0.5 rounded-full ${
                        rep.winRate >= 50 
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {rep.winRate}%
                      </span>
                    </td>

                    {/* Monthly Target & Progress Bar */}
                    <td className="py-4 px-4 min-w-[140px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-urbanist">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{rep.quotaPct}%</span>
                          <span className="text-slate-400 text-[11px]">{formatCurrencySAR(rep.targetSAR)}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-2 rounded-full bg-[#8FC2F0] transition-all duration-500"
                            style={{ width: `${Math.min(100, rep.quotaPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Audit Scope Action */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setSelectedSalesFilter(rep.member.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer mx-auto ${
                          isCurrentFilter
                            ? 'bg-[#292D32] text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={isRTL ? `حصر العرض لبيانات ${rep.member.full_name}` : `Audit ${rep.member.full_name}`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
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
