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
  Filter
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
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

  if (!isManager) {
    return null;
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Sales Engineers Leaderboard Table */}
      <div className="glass-card rounded-3xl border border-white/80 shadow-xs overflow-hidden">
        {/* Header with Scope Switcher */}
        <div className="p-5 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-[#292D32] font-urbanist">
                  Sales Team Leaderboard &amp; Quotas
                </h3>
                <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full font-urbanist">
                  DIRECTOR AUDIT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 font-cairo">
                متابعة أداء المناديب والمستهدفات الشهرية ونسب الإغلاق
              </p>
            </div>
          </div>

          {/* Scope Filter Quick Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-urbanist hidden md:inline mr-1">
              Scope:
            </span>
            <button
              onClick={() => setSelectedSalesFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-urbanist ${
                selectedSalesFilter === 'all'
                  ? 'bg-[#292D32] text-white shadow-2xs'
                  : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/80'
              }`}
            >
              All Team ({projects.length})
            </button>

            {teamMembers.filter(m => m.role === 'sales_engineer').map(rep => {
              const isSelected = selectedSalesFilter === rep.id;
              const repCount = projects.filter(p => p.owner_id === rep.id).length;
              return (
                <button
                  key={rep.id}
                  onClick={() => setSelectedSalesFilter(rep.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-urbanist ${
                    isSelected
                      ? 'bg-[#8FC2F0] text-[#292D32] shadow-2xs ring-1 ring-[#8FC2F0]'
                      : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/80'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded bg-[#292D32] text-white text-[8px] flex items-center justify-center font-bold">
                    {rep.avatar_initials}
                  </span>
                  <span>{rep.full_name}</span>
                  <span className="text-[10px] opacity-75">
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
              <tr className="bg-slate-50/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-urbanist border-b border-slate-100">
                <th className="py-3 px-4">Sales Engineer</th>
                <th className="py-3 px-4">Territory</th>
                <th className="py-3 px-4 text-center">Deals</th>
                <th className="py-3 px-4 text-right">In-Hand (SAR)</th>
                <th className="py-3 px-4 text-right">Quotations (SAR)</th>
                <th className="py-3 px-4 text-right">Won (SAR)</th>
                <th className="py-3 px-4 text-center">Win Rate</th>
                <th className="py-3 px-4">Monthly Target &amp; Quota</th>
                <th className="py-3 px-4 text-center">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {repStats.map((rep) => {
                const isCurrentFilter = selectedSalesFilter === rep.member.id;

                return (
                  <tr 
                    key={rep.member.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${isCurrentFilter ? 'bg-blue-50/40' : ''}`}
                  >
                    {/* Member Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#292D32] text-white flex items-center justify-center font-bold text-xs shadow-2xs font-urbanist">
                          {rep.member.avatar_initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#292D32] font-urbanist truncate">
                            {rep.member.full_name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {rep.member.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Territory */}
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-[#8FC2F0] shrink-0" />
                        <span className="truncate">{rep.member.territory?.split('(')[0] || 'Western Region'}</span>
                      </div>
                    </td>

                    {/* Deals Count */}
                    <td className="py-3 px-4 text-center font-bold text-[#292D32] font-mono">
                      {rep.totalProjectsCount}
                    </td>

                    {/* In-Hand Value */}
                    <td className="py-3 px-4 text-right font-bold text-[#292D32] font-mono">
                      {formatCurrencySAR(rep.inHandValue)}
                    </td>

                    {/* Quotations Value */}
                    <td className="py-3 px-4 text-right font-bold text-blue-700 font-mono">
                      {formatCurrencySAR(rep.quotationValue)}
                    </td>

                    {/* Won Value */}
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono">
                      {formatCurrencySAR(rep.wonValue)}
                    </td>

                    {/* Win Rate */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#292D32] font-bold text-[10px] font-mono">
                        {rep.winRate}%
                      </span>
                    </td>

                    {/* Quota Progress */}
                    <td className="py-3 px-4 min-w-[150px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-500 font-mono">{formatCurrencySAR(rep.targetSAR)}</span>
                          <span className="font-bold text-[#292D32]">{rep.quotaPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#8FC2F0] to-[#77CE69] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, rep.quotaPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedSalesFilter(isCurrentFilter ? 'all' : rep.member.id)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer font-urbanist ${
                          isCurrentFilter 
                            ? 'bg-[#292D32] text-white shadow-2xs' 
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isCurrentFilter ? 'Viewing Rep' : 'Audit'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Future Excel Upload Readiness Note */}
        <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-cairo text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#77CE69] shrink-0" />
            <span>
              كافة مشاريع وأنصبة المبيعات الحالية مسجلة باسم <strong>إسلام المهندس</strong>. عند رفع شيت أي مندوب جديد مستقبلاً سيتم ربطه تلقائياً دون تداخل.
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-urbanist hidden sm:inline">
            CRMate Multi-Rep Engine Active
          </span>
        </div>
      </div>
    </div>
  );
}
