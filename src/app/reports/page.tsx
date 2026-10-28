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
  Percent,
  Award,
  ArrowRight,
  Flame,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileCheck,
  Sparkles,
  ExternalLink,
  Search,
  Check
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';
import { PROJECT_SYSTEMS, PIPELINE_STAGES } from '@/lib/constants';
import { scopeProjects, scopeActivities, scopePlannedActivities } from '@/lib/logic/scope';
import { useLanguage } from '@/lib/i18n/language-context';
import { ReportPdfModal } from '@/components/reports/report-pdf-modal';

type ReportTab = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export default function ReportsPage() {
  const { t, isRTL } = useLanguage();
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
    quotations
  } = useCRM();

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin';

  // 1. Scoped Data
  const scopedProjects = useMemo(() => {
    return scopeProjects(projects, currentUser, selectedSalesFilter);
  }, [projects, currentUser, selectedSalesFilter]);

  const scopedActivities = useMemo(() => {
    return scopeActivities(activities, currentUser, selectedSalesFilter);
  }, [activities, currentUser, selectedSalesFilter]);

  const scopedPlannedActivities = useMemo(() => {
    return scopePlannedActivities(plannedActivities, currentUser, selectedSalesFilter);
  }, [plannedActivities, currentUser, selectedSalesFilter]);

  // Active Report Tab
  const [activeTab, setActiveTab] = useState<ReportTab>('weekly');

  // PDF Export Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // 2. Period Navigation States
  // Daily Date State
  const [dailyDate, setDailyDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Weekly Date Anchor State (any date within desired week)
  const [weeklyAnchorDate, setWeeklyAnchorDate] = useState(() => {
    return new Date();
  });

  // Monthly State
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  // Quarterly State
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(() => {
    const m = new Date().getMonth();
    return m < 3 ? 1 : m < 6 ? 2 : m < 9 ? 3 : 4;
  });

  // Yearly State
  const [yearlyYear, setYearlyYear] = useState(() => new Date().getFullYear());

  // -------------------------------------------------------------
  // Compute Week Range (Saturday to Thursday work days)
  // -------------------------------------------------------------
  const weekRange = useMemo(() => {
    const anchor = new Date(weeklyAnchorDate);
    const day = anchor.getDay(); // 0 is Sun, 6 is Sat
    // In Saudi work week, Saturday is day 0 of work week
    // diff from Saturday:
    const diffToSat = (day + 1) % 7; 
    const sat = new Date(anchor);
    sat.setDate(anchor.getDate() - diffToSat);
    sat.setHours(0, 0, 0, 0);

    const thu = new Date(sat);
    thu.setDate(sat.getDate() + 5); // Thu is 5 days after Sat
    thu.setHours(23, 59, 59, 999);

    const satStr = `${sat.getFullYear()}-${String(sat.getMonth() + 1).padStart(2, '0')}-${String(sat.getDate()).padStart(2, '0')}`;
    const thuStr = `${thu.getFullYear()}-${String(thu.getMonth() + 1).padStart(2, '0')}-${String(thu.getDate()).padStart(2, '0')}`;

    return {
      start: satStr,
      end: thuStr,
      startDate: sat,
      endDate: thu,
      label: `${sat.getDate()} ${sat.toLocaleString('en-US', { month: 'short' })} – ${thu.getDate()} ${thu.toLocaleString('en-US', { month: 'short' })} ${thu.getFullYear()}`
    };
  }, [weeklyAnchorDate]);

  // -------------------------------------------------------------
  // Compute Current Active Period Start/End & Label
  // -------------------------------------------------------------
  const currentPeriod = useMemo(() => {
    if (activeTab === 'daily') {
      return {
        start: dailyDate,
        end: dailyDate,
        label: dailyDate,
        title: isRTL ? 'التقرير اليومي للمبيعات' : 'Daily Sales Execution Report'
      };
    }
    if (activeTab === 'weekly') {
      return {
        start: weekRange.start,
        end: weekRange.end,
        label: weekRange.label,
        title: isRTL ? 'التقرير الأسبوعي للأداء والصفقات' : 'Weekly Operations & Pipeline Report'
      };
    }
    if (activeTab === 'monthly') {
      const start = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const end = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleString('default', { month: 'long' });
      return {
        start,
        end,
        label: `${monthName} ${selectedYear}`,
        title: isRTL ? `التقرير الشهري - ${monthName} ${selectedYear}` : `Monthly Performance Report - ${monthName} ${selectedYear}`
      };
    }
    if (activeTab === 'quarterly') {
      const qStartMonth = (selectedQuarter - 1) * 3;
      const qEndMonth = qStartMonth + 2;
      const start = `${selectedYear}-${String(qStartMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, qEndMonth + 1, 0).getDate();
      const end = `${selectedYear}-${String(qEndMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return {
        start,
        end,
        label: `Q${selectedQuarter} ${selectedYear}`,
        title: isRTL ? `التقرير الربع سنوي - Q${selectedQuarter} ${selectedYear}` : `Quarterly Strategic Report - Q${selectedQuarter} ${selectedYear}`
      };
    }
    // Yearly
    const start = `${yearlyYear}-01-01`;
    const end = `${yearlyYear}-12-31`;
    return {
      start,
      end,
      label: `${yearlyYear}`,
      title: isRTL ? `التقرير السنوي الشامل - ${yearlyYear}` : `Annual Executive Report - ${yearlyYear}`
    };
  }, [activeTab, dailyDate, weekRange, selectedMonth, selectedYear, selectedQuarter, yearlyYear, isRTL]);

  // -------------------------------------------------------------
  // Filter Data by Current Active Period
  // -------------------------------------------------------------
  const periodActivities = useMemo(() => {
    return scopedActivities.filter(a => {
      if (!a.activity_date) return false;
      return a.activity_date >= currentPeriod.start && a.activity_date <= currentPeriod.end;
    });
  }, [scopedActivities, currentPeriod]);

  const periodQuotations = useMemo(() => {
    return (quotations || []).filter(q => {
      const d = (q.sent_date || q.quotation_date || q.created_at || '').split('T')[0];
      if (!d) return false;
      return d >= currentPeriod.start && d <= currentPeriod.end;
    });
  }, [quotations, currentPeriod]);

  // Projects Won in this period
  const periodWonProjects = useMemo(() => {
    return scopedProjects.filter(p => {
      if (p.pipeline_stage !== 'won') return false;
      const d = (p.stage_entered_at || p.updated_at || p.created_at || '').split('T')[0];
      return d >= currentPeriod.start && d <= currentPeriod.end;
    });
  }, [scopedProjects, currentPeriod]);

  // REQUIRED BY USER: Submittals sent in this period
  const periodSubmittalsSent = useMemo(() => {
    return scopedProjects.filter(p => {
      if (!p.submittal_sent_at) return false;
      const d = p.submittal_sent_at.split('T')[0];
      return d >= currentPeriod.start && d <= currentPeriod.end;
    });
  }, [scopedProjects, currentPeriod]);

  // REQUIRED BY USER: Current projects in Technical Submittal
  const currentInTechnical = useMemo(() => {
    return scopedProjects.filter(p => p.pipeline_stage === 'technical_submission');
  }, [scopedProjects]);

  // REQUIRED BY USER: Current projects in Negotiation
  const currentInNegotiation = useMemo(() => {
    return scopedProjects.filter(p => p.pipeline_stage === 'negotiation');
  }, [scopedProjects]);

  // REQUIRED BY USER: Tender vs In-Hand Breakdown
  const opportunityBreakdown = useMemo(() => {
    const tenderProjects = scopedProjects.filter(p => p.opportunity_type === 'tender');
    const inHandProjects = scopedProjects.filter(p => p.opportunity_type === 'in_hand');

    const tenderValue = tenderProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
    const inHandValue = inHandProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
    const totalProjects = scopedProjects.length || 1;

    const tenderPct = Math.round((tenderProjects.length / totalProjects) * 100);
    const inHandPct = 100 - tenderPct;

    return {
      tenderCount: tenderProjects.length,
      tenderValue,
      tenderPct,
      inHandCount: inHandProjects.length,
      inHandValue,
      inHandPct,
      totalCount: scopedProjects.length,
      totalValue: tenderValue + inHandValue
    };
  }, [scopedProjects]);

  // -------------------------------------------------------------
  // REQUIRED BY USER: Projects Scheduled for Closing in this Period
  // -------------------------------------------------------------
  const [closingSearchTerm, setClosingSearchTerm] = useState('');
  const [closingSelectedMonth, setClosingSelectedMonth] = useState<string>('all');

  const periodClosingProjects = useMemo(() => {
    return scopedProjects.filter(p => {
      if (!p.closing_date) return false;
      return p.closing_date >= currentPeriod.start && p.closing_date <= currentPeriod.end;
    }).sort((a, b) => {
      return (a.closing_date || '').localeCompare(b.closing_date || '');
    });
  }, [scopedProjects, currentPeriod]);

  const periodClosingValue = useMemo(() => {
    return periodClosingProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
  }, [periodClosingProjects]);

  // List of distinct months that have closing projects in this period
  const closingMonthsList = useMemo(() => {
    const monthsMap: Record<string, { key: string; labelEn: string; labelAr: string; count: number; totalValue: number }> = {};
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    periodClosingProjects.forEach(p => {
      if (!p.closing_date) return;
      const key = p.closing_date.substring(0, 7); // e.g. "2026-11"
      const [y, m] = key.split('-');
      const mIdx = parseInt(m, 10) - 1;
      if (!monthsMap[key]) {
        monthsMap[key] = {
          key,
          labelEn: `${monthNamesEn[mIdx]} ${y}`,
          labelAr: `${monthNamesAr[mIdx]} ${y}`,
          count: 0,
          totalValue: 0
        };
      }
      monthsMap[key].count += 1;
      monthsMap[key].totalValue += (p.estimated_value || 0);
    });

    return Object.values(monthsMap).sort((a, b) => a.key.localeCompare(b.key));
  }, [periodClosingProjects]);

  const filteredClosingProjects = useMemo(() => {
    let projs = periodClosingProjects;
    if (closingSelectedMonth !== 'all') {
      projs = projs.filter(p => p.closing_date && p.closing_date.startsWith(closingSelectedMonth));
    }
    if (closingSearchTerm.trim()) {
      const q = closingSearchTerm.toLowerCase().trim();
      projs = projs.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.pr_number.toLowerCase().includes(q) ||
        (p.company_name && p.company_name.toLowerCase().includes(q))
      );
    }
    return projs;
  }, [periodClosingProjects, closingSelectedMonth, closingSearchTerm]);

  // Financial KPIs
  const wonTotalValue = useMemo(() => {
    return periodWonProjects.reduce((sum, p) => sum + (p.final_won_value || p.estimated_value || 0), 0);
  }, [periodWonProjects]);

  const quotationTotalValue = useMemo(() => {
    return periodQuotations.reduce((sum, q) => sum + (q.amount || 0), 0);
  }, [periodQuotations]);

  // Cash Collection for Won Deals
  const cashCollection = useMemo(() => {
    let collected = 0;
    let totalPo = 0;
    periodWonProjects.forEach(p => {
      collected += (p.collected_amount || 0);
      totalPo += (p.po_amount || p.final_won_value || p.estimated_value || 0);
    });
    const rate = totalPo > 0 ? Math.round((collected / totalPo) * 100) : 0;
    return { collected, totalPo, rate };
  }, [periodWonProjects]);

  // -------------------------------------------------------------
  // Systems Distribution (The 21 Systems Breakdown)
  // -------------------------------------------------------------
  const systemsBreakdown = useMemo(() => {
    const stats: Record<string, { count: number; value: number }> = {};
    PROJECT_SYSTEMS.forEach(sys => {
      stats[sys] = { count: 0, value: 0 };
    });

    scopedProjects.forEach(p => {
      const sysList = p.systems && p.systems.length > 0
        ? p.systems
        : p.rfq_packages === 'lc' ? ['Lighting Control']
        : p.rfq_packages === 'bms' ? ['BMS / BAS']
        : p.rfq_packages === 'both' ? ['BMS / BAS', 'Lighting Control']
        : [];

      sysList.forEach(sys => {
        if (!stats[sys]) stats[sys] = { count: 0, value: 0 };
        stats[sys].count += 1;
        stats[sys].value += (p.estimated_value || 0);
      });
    });

    const totalAssigned = Object.values(stats).reduce((sum, s) => sum + s.count, 0) || 1;

    return Object.entries(stats)
      .map(([system, data]) => ({
        system,
        count: data.count,
        value: data.value,
        percentage: Math.round((data.count / totalAssigned) * 100)
      }))
      .sort((a, b) => b.count - a.count || b.value - a.value);
  }, [scopedProjects]);

  // -------------------------------------------------------------
  // Sales Reps Scorecard (Team Performance)
  // -------------------------------------------------------------
  const repsScorecard = useMemo(() => {
    const reps = teamMembers.filter(m => m.role === 'sales_engineer' || (m.role as string) === 'sales_rep');
    return reps.map(rep => {
      const repActs = periodActivities.filter(a => a.user_id === rep.id);
      const repProjects = scopedProjects.filter(p => (p.owner_id === rep.id || p.referred_to_id === rep.id));
      const newProjs = repProjects.filter(p => {
        const d = (p.created_at || '').split('T')[0];
        return d >= currentPeriod.start && d <= currentPeriod.end;
      });
      const repQuotes = periodQuotations.filter(q => q.created_by === rep.id || repProjects.some(p => p.id === q.project_id));
      const repWon = periodWonProjects.filter(p => p.owner_id === rep.id || p.referred_to_id === rep.id);
      const repWonVal = repWon.reduce((sum, p) => sum + (p.final_won_value || p.estimated_value || 0), 0);

      return {
        id: rep.id,
        name: rep.full_name,
        role: isRTL ? 'مهندس مبيعات' : 'Sales Engineer',
        calls: repActs.filter(a => a.channel === 'call').length,
        visits: repActs.filter(a => a.channel === 'visit').length,
        meetings: repActs.filter(a => a.channel === 'meeting_f2f').length,
        hunting: repActs.filter(a => a.channel === 'hunting').length,
        totalActs: repActs.length,
        newProjects: newProjs.length,
        quotes: repQuotes.length,
        wonValue: repWonVal,
        wonCount: repWon.length
      };
    }).sort((a, b) => b.wonValue - a.wonValue || b.totalActs - a.totalActs);
  }, [teamMembers, periodActivities, scopedProjects, currentPeriod, periodQuotations, periodWonProjects, isRTL]);

  // -------------------------------------------------------------
  // Top Contractors & Clients
  // -------------------------------------------------------------
  const topClients = useMemo(() => {
    const map: Record<string, { count: number; wonVal: number; pipeVal: number }> = {};
    scopedProjects.forEach(p => {
      const compName = p.company_name || 'Direct Client';
      if (!map[compName]) map[compName] = { count: 0, wonVal: 0, pipeVal: 0 };
      map[compName].count += 1;
      if (p.pipeline_stage === 'won') {
        map[compName].wonVal += (p.final_won_value || p.estimated_value || 0);
      } else if (p.pipeline_stage !== 'lost') {
        map[compName].pipeVal += (p.estimated_value || 0);
      }
    });

    return Object.entries(map)
      .map(([companyName, d]) => ({
        companyName,
        projectsCount: d.count,
        wonValue: d.wonVal,
        pipelineValue: d.pipeVal
      }))
      .sort((a, b) => b.wonValue - a.wonValue || b.projectsCount - a.projectsCount)
      .slice(0, 8);
  }, [scopedProjects]);

  // -------------------------------------------------------------
  // Month-over-Month 12-Month Progression
  // -------------------------------------------------------------
  const monthlyGrowth = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((mName, idx) => {
      const mStr = String(idx + 1).padStart(2, '0');
      const prefix = `${selectedYear}-${mStr}`;

      const mWon = scopedProjects
        .filter(p => p.pipeline_stage === 'won' && (p.stage_entered_at || p.updated_at || p.created_at || '').startsWith(prefix))
        .reduce((sum, p) => sum + (p.final_won_value || p.estimated_value || 0), 0);

      const mQuotes = (quotations || [])
        .filter(q => (q.sent_date || q.quotation_date || q.created_at || '').startsWith(prefix))
        .reduce((sum, q) => sum + (q.amount || 0), 0);

      const mSubmittals = scopedProjects.filter(p => (p.submittal_sent_at || '').startsWith(prefix)).length;
      const mActs = scopedActivities.filter(a => (a.activity_date || '').startsWith(prefix)).length;

      return {
        month: mName,
        wonValue: mWon,
        quotesValue: mQuotes,
        submittalsCount: mSubmittals,
        activitiesCount: mActs
      };
    });
  }, [scopedProjects, quotations, scopedActivities, selectedYear]);

  // -------------------------------------------------------------
  // PDF Data Bundle
  // -------------------------------------------------------------
  const pdfDataBundle = useMemo(() => {
    return {
      generatedBy: currentUser.full_name || 'Eslam Mohandes',
      generatedAt: new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      kpis: {
        totalWonValue: wonTotalValue,
        wonCount: periodWonProjects.length,
        totalQuotationValue: quotationTotalValue,
        quotationCount: periodQuotations.length,
        submittalsSentCount: periodSubmittalsSent.length,
        inTechnicalCount: currentInTechnical.length,
        inNegotiationCount: currentInNegotiation.length,
        tenderCount: opportunityBreakdown.tenderCount,
        tenderValue: opportunityBreakdown.tenderValue,
        inHandCount: opportunityBreakdown.inHandCount,
        inHandValue: opportunityBreakdown.inHandValue,
        activitiesCount: periodActivities.length,
        callsCount: periodActivities.filter(a => a.channel === 'call').length,
        visitsCount: periodActivities.filter(a => a.channel === 'visit').length,
        meetingsCount: periodActivities.filter(a => a.channel === 'meeting_f2f').length,
        huntingCount: periodActivities.filter(a => a.channel === 'hunting').length,
        collectedAmount: cashCollection.collected,
        collectionRate: cashCollection.rate,
        targetAmount: 3500000,
        targetAchievementPct: Math.round((wonTotalValue / 3500000) * 100)
      },
      systemsBreakdown: systemsBreakdown.slice(0, 10),
      repsScorecard: repsScorecard.map(r => ({
        name: r.name,
        role: r.role,
        calls: r.calls,
        visits: r.visits,
        newProjects: r.newProjects,
        quotes: r.quotes,
        wonValue: r.wonValue
      })),
      activitiesList: periodActivities.map(a => ({
        time: a.activity_time || '10:00 AM',
        date: a.activity_date,
        projectName: a.project_name || (isRTL ? 'زيارة موقع' : 'Site Visit'),
        companyName: a.company_name || '-',
        contactName: a.contact_name,
        channel: a.channel,
        purpose: a.visit_purpose,
        outcome: a.outcome,
        notes: a.notes,
        nextAction: a.next_action
      })),
      topClients,
      monthlyGrowth,
      closingProjects: periodClosingProjects.map(p => {
        const stageObj = PIPELINE_STAGES.find(s => s.value === p.pipeline_stage);
        const stageLabel = isRTL ? (stageObj?.labelAr || p.pipeline_stage) : (stageObj?.label || p.pipeline_stage);
        let closingFormatted = p.closing_date || '';
        if (p.closing_date) {
          const [y, m, d] = p.closing_date.split('-');
          const monthNamesAr = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
          const monthNamesEn = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const mIdx = parseInt(m, 10);
          const dNum = parseInt(d, 10);
          closingFormatted = isRTL ? `${dNum} ${monthNamesAr[mIdx] || m} ${y}` : `${dNum} ${monthNamesEn[mIdx] || m} ${y}`;
        }
        return {
          id: p.id,
          prNumber: p.pr_number,
          name: p.name,
          companyName: p.company_name || '-',
          contactName: p.primary_contact_name,
          opportunityType: p.opportunity_type,
          pipelineStage: stageLabel,
          closingDate: closingFormatted,
          rawClosingDate: p.closing_date,
          value: p.estimated_value || 0,
          nextAction: p.next_action,
          ownerName: p.owner_name || 'Eslam M.'
        };
      }),
      closingTotalValue: periodClosingValue,
      closingCount: periodClosingProjects.length
    };
  }, [
    currentUser,
    isRTL,
    wonTotalValue,
    periodWonProjects,
    quotationTotalValue,
    periodQuotations,
    periodSubmittalsSent,
    currentInTechnical,
    currentInNegotiation,
    opportunityBreakdown,
    periodActivities,
    cashCollection,
    systemsBreakdown,
    repsScorecard,
    topClients,
    monthlyGrowth,
    periodClosingProjects,
    periodClosingValue
  ]);

  // Quick Day Navigators
  const handlePrevDay = () => {
    const d = new Date(dailyDate);
    d.setDate(d.getDate() - 1);
    setDailyDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(dailyDate);
    d.setDate(d.getDate() + 1);
    setDailyDate(d.toISOString().split('T')[0]);
  };

  // Quick Week Navigators
  const handlePrevWeek = () => {
    const d = new Date(weeklyAnchorDate);
    d.setDate(d.getDate() - 7);
    setWeeklyAnchorDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(weeklyAnchorDate);
    d.setDate(d.getDate() + 7);
    setWeeklyAnchorDate(d);
  };

  return (
    <>
      <div className={`w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-sans ${isPdfModalOpen ? "print:hidden" : ""}`}>
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & REPORT CONTROLS (Apple Clean Minimalist Bar) */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-urbanist tracking-tight">
                {isRTL ? 'تقارير المبيعات الهندسية والمشاريع' : 'Sales Engineering & Contracting Reports'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isRTL ? 'المتابعة التنفيذية والمالية لمحفظة مشاريع شركة المسبار' : 'Executive Operations, Pipeline Velocity & Commercial Analytics'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar: Rep Filter + Export PDF Action */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          {/* Sales Rep Filter (For Sales Managers / Admin) */}
          {isManager && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#141820] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-[#8FC2F0]" />
              <select
                value={selectedSalesFilter}
                onChange={(e) => setSelectedSalesFilter(e.target.value)}
                className="bg-transparent border-0 font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="dark:bg-[#141820]">{isRTL ? 'كافة مهندسي المبيعات (الشركة)' : 'All Sales Engineers'}</option>
                {teamMembers
                  .filter(m => m.role === 'sales_engineer' || (m.role as string) === 'sales_rep')
                  .map(m => (
                    <option key={m.id} value={m.id} className="dark:bg-[#141820]">
                      {m.full_name} ({m.territory || 'Jeddah'})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* MAIN EXPORT AS PDF BUTTON (User's Top Priority) */}
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer font-urbanist"
          >
            <Printer className="w-4 h-4 stroke-[2.2]" />
            <span>{isRTL ? 'تصدير التقرير كـ PDF' : 'Export as PDF'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 5 REPORT TABS (Segmented Apple Controls) */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#1C2130] p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-5 gap-1 w-full sm:w-auto text-xs font-bold font-urbanist">
          {[
            { id: 'daily', label: isRTL ? 'التقرير اليومي' : 'Daily' },
            { id: 'weekly', label: isRTL ? 'الأسبوعي' : 'Weekly' },
            { id: 'monthly', label: isRTL ? 'الشهري' : 'Monthly' },
            { id: 'quarterly', label: isRTL ? 'الربع سنوي' : 'Quarterly' },
            { id: 'yearly', label: isRTL ? 'السنوي' : 'Yearly' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer text-center ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Period Navigator Controls based on active tab */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
          {activeTab === 'daily' && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#141820] px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button onClick={handlePrevDay} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors" title="Previous Day">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="date"
                value={dailyDate}
                onChange={e => setDailyDate(e.target.value)}
                className="bg-transparent font-mono font-bold text-slate-800 dark:text-white text-xs focus:outline-none cursor-pointer"
              />
              <button onClick={handleNextDay} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors" title="Next Day">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDailyDate(new Date().toISOString().split('T')[0])}
                className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]"
              >
                {isRTL ? 'اليوم' : 'Today'}
              </button>
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#141820] px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button onClick={handlePrevWeek} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors" title="Previous Week">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 font-urbanist font-bold text-slate-800 dark:text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{weekRange.label}</span>
              </div>
              <button onClick={handleNextWeek} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors" title="Next Week">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setWeeklyAnchorDate(new Date())}
                className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]"
              >
                {isRTL ? 'هذا الأسبوع' : 'This Week'}
              </button>
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-50 dark:bg-[#141820] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 dark:bg-[#141820] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {[2026, 2025, 2024].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'quarterly' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141820] p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {([1, 2, 3, 4] as const).map(q => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuarter(q)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                      selectedQuarter === q 
                        ? 'bg-blue-600 text-white shadow-2xs font-black' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Q{q}
                  </button>
                ))}
              </div>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 dark:bg-[#141820] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {[2026, 2025, 2024].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'yearly' && (
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#141820] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={yearlyYear}
                onChange={e => setYearlyYear(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-urbanist"
              >
                {[2026, 2025, 2024].map(y => (
                  <option key={y} value={y}>{isRTL ? `السنة المالية ${y}` : `Fiscal Year ${y}`}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. HERO EXECUTIVE KPIS (Cards Grid) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Won Revenue */}
        <div className="crm-card p-4 rounded-2xl space-y-1 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
              {isRTL ? 'إجمالي الترسيات المحققة' : 'Won Revenue'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-urbanist tracking-tight">
            {formatCurrencySAR(wonTotalValue)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{periodWonProjects.length}</span>
            <span>{isRTL ? 'مشاريع محسومة' : 'projects closed'}</span>
          </div>
        </div>

        {/* Quotations Sent */}
        <div className="crm-card p-4 rounded-2xl space-y-1 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
              {isRTL ? 'عروض الأسعار الصادرة' : 'Quotations Pipeline'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-[#8FC2F0] font-urbanist tracking-tight">
            {formatCurrencySAR(quotationTotalValue)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{periodQuotations.length}</span>
            <span>{isRTL ? 'عرض سعر رسمي' : 'quotes delivered'}</span>
          </div>
        </div>

        {/* USER REQUIREMENT: Submittals Sent Count */}
        <div className="crm-card p-4 rounded-2xl space-y-1 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
              {isRTL ? 'العروض الفنية المرسلة' : 'Submittals Sent'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-urbanist tracking-tight">
            {periodSubmittalsSent.length}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {isRTL ? 'عروض فنية أرسلت للاستشاري في هذه الفترة' : 'submittals submitted this period'}
          </div>
        </div>

        {/* Executed Activities */}
        <div className="crm-card p-4 rounded-2xl space-y-1 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
              {isRTL ? 'الأنشطة الميدانية المنفذة' : 'Executed Activities'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-urbanist tracking-tight">
            {periodActivities.length}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>{periodActivities.filter(a => a.channel === 'visit').length} {isRTL ? 'زيارة' : 'visits'}</span>
            <span>&bull;</span>
            <span>{periodActivities.filter(a => a.channel === 'call').length} {isRTL ? 'مكالمة' : 'calls'}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. USER REQUIREMENTS BANNER: Current Technical, Negotiation & Tender vs In-Hand */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* Metric 1: Current In Technical Submittal */}
        <div className="crm-card p-4 rounded-2xl border-l-4 border-l-purple-500 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
              {isRTL ? 'مشاريع حالية في الاعتماد الفني' : 'Current in Technical Submittal'}
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-urbanist">
              {currentInTechnical.length} <span className="text-xs font-semibold text-slate-500 font-sans">{isRTL ? 'مشروع' : 'projects'}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isRTL ? 'عروض مواصفات بانتظار موافقة الاستشاري' : 'Under Consultant & MEP Review'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center font-black">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Current In Negotiation */}
        <div className="crm-card p-4 rounded-2xl border-l-4 border-l-indigo-500 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
              {isRTL ? 'مشاريع حالية في مرحلة المفاوضات' : 'Current in Negotiation'}
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-urbanist">
              {currentInNegotiation.length} <span className="text-xs font-semibold text-slate-500 font-sans">{isRTL ? 'مشروع' : 'projects'}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isRTL ? 'مفاوضات نهائية تمهيداً لإصدار أمر الشراء' : 'Final Commercial Discount & Award Talks'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Tender vs In-Hand Ratio */}
        <div className="crm-card p-4 rounded-2xl border-l-4 border-l-sky-500 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
              {isRTL ? 'توزيع المناقصة مقابل المباشر' : 'Tender vs. In-Hand Ratio'}
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              {opportunityBreakdown.totalCount} {isRTL ? 'مشروع كلي' : 'Total'}
            </span>
          </div>

          {/* Visual Percentage Bar */}
          <div className="h-4 w-full rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700 font-urbanist text-[9px] font-black text-white shadow-2xs">
            <div 
              className="bg-sky-600 flex items-center justify-center transition-all duration-500"
              style={{ width: `${opportunityBreakdown.tenderPct}%` }}
              title={`Tender: ${opportunityBreakdown.tenderPct}%`}
            >
              {opportunityBreakdown.tenderPct > 15 ? `${opportunityBreakdown.tenderPct}%` : ''}
            </div>
            <div 
              className="bg-emerald-600 flex items-center justify-center transition-all duration-500"
              style={{ width: `${opportunityBreakdown.inHandPct}%` }}
              title={`In-Hand: ${opportunityBreakdown.inHandPct}%`}
            >
              {opportunityBreakdown.inHandPct > 15 ? `${opportunityBreakdown.inHandPct}%` : ''}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold pt-0.5">
            <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-600" />
              <span>{isRTL ? 'مناقصة' : 'Tender'}: {opportunityBreakdown.tenderCount} ({opportunityBreakdown.tenderPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>{isRTL ? 'مباشر' : 'In-Hand'}: {opportunityBreakdown.inHandCount} ({opportunityBreakdown.inHandPct}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4.5. SCHEDULED DEALS & CLOSING FORECAST (User Top Requirement) */}
      {/* ========================================================================= */}
      <div className="crm-card p-5 rounded-2xl space-y-4 border-2 border-emerald-500/20 bg-gradient-to-b from-emerald-50/20 via-white to-transparent dark:from-emerald-950/10 dark:via-[#1C2130] dark:to-[#1C2130]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist flex items-center gap-2">
                <span>{isRTL ? 'المشاريع المتوقع إغلاقها وحسمها في هذه الفترة' : 'Scheduled Deals & Pipeline Closings'}</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {periodClosingProjects.length} {isRTL ? 'مشروع' : 'deals'}
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {isRTL 
                ? `حصر شامل للمشاريع التي حُدد موعد إغلاقها المتوقع خلال ${currentPeriod.label} بقيمة إجمالية ${formatCurrencySAR(periodClosingValue)}` 
                : `Comprehensive forecast of projects targeted for closing in ${currentPeriod.label} totaling ${formatCurrencySAR(periodClosingValue)}`}
            </p>
          </div>

          {/* Quick KPI badge */}
          <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0 self-start sm:self-auto">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{isRTL ? 'إجمالي المحفظة المتوقعة:' : 'Forecast Total:'}</span>
            <span className="text-sm font-black font-mono text-emerald-900 dark:text-emerald-200">{formatCurrencySAR(periodClosingValue)}</span>
          </div>
        </div>

        {/* Filter Toolbar: Month tabs (for Quarter/Year) + Search Input */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
          {/* Month sub-filter tabs if more than 1 month present */}
          {closingMonthsList.length > 1 ? (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141820] p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex-wrap w-full md:w-auto">
              <button
                type="button"
                onClick={() => setClosingSelectedMonth('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  closingSelectedMonth === 'all'
                    ? 'bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{isRTL ? 'كافة الشهور' : 'All Months'}</span>
                <span className="text-[10px] font-mono opacity-80 ltr:ml-1 rtl:mr-1">({periodClosingProjects.length})</span>
              </button>

              {closingMonthsList.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setClosingSelectedMonth(m.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    closingSelectedMonth === m.key
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  <span>{isRTL ? m.labelAr : m.labelEn}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    closingSelectedMonth === m.key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {m.count}
                  </span>
                </button>
              ))}
            </div>
          ) : <div />}

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={isRTL ? 'بحث برقم PR أو المشروع...' : 'Search deals...'}
              value={closingSearchTerm}
              onChange={e => setClosingSearchTerm(e.target.value)}
              className="w-full ltr:pl-8.5 rtl:pr-8.5 px-3 py-1 text-xs bg-white dark:bg-[#141820] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-emerald-500 font-medium text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Closing Deals Table */}
        <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800 rounded-xl">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#141820] border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider font-urbanist text-[10px]">
                <th className="py-2.5 px-3 text-start">#PR</th>
                <th className="py-2.5 px-3 text-start">{isRTL ? 'اسم المشروع والمقاول' : 'Project & Client'}</th>
                <th className="py-2.5 px-3 text-center">{isRTL ? 'النوع' : 'Type'}</th>
                <th className="py-2.5 px-3 text-center">{isRTL ? 'المرحلة' : 'Stage'}</th>
                <th className="py-2.5 px-3 text-center">{isRTL ? 'موعد الإغلاق' : 'Closing Date'}</th>
                <th className="py-2.5 px-3 text-end">{isRTL ? 'القيمة التقديرية' : 'Estimated Value'}</th>
                <th className="py-2.5 px-3 text-start">{isRTL ? 'الإجراء التالي' : 'Next Action'}</th>
                <th className="py-2.5 px-3 text-start">{isRTL ? 'المسؤول' : 'Owner'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredClosingProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                    {isRTL ? 'لا توجد مشاريع محدد لها موعد إغلاق يطابق البحث والفترة المحددة' : 'No projects scheduled for closing match the selected criteria'}
                  </td>
                </tr>
              ) : (
                filteredClosingProjects.map(proj => {
                  const stageObj = PIPELINE_STAGES.find(s => s.value === proj.pipeline_stage);
                  const stageLabel = isRTL ? (stageObj?.labelAr || proj.pipeline_stage) : (stageObj?.label || proj.pipeline_stage);
                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {proj.pr_number}
                        </span>
                      </td>
                      <td className="py-3 px-3 min-w-[200px]">
                        <Link 
                          href={`/projects/${proj.id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-[#8FC2F0] hover:underline transition-colors block leading-snug"
                        >
                          {proj.name}
                        </Link>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-blue-600 dark:text-[#8FC2F0] shrink-0" />
                          <span>{proj.company_name || '-'}</span>
                          {proj.location && (
                            <>
                              <span>&bull;</span>
                              <span>{proj.location}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                          proj.opportunity_type === 'in_hand'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${proj.opportunity_type === 'in_hand' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
                          <span>{proj.opportunity_type === 'in_hand' ? (isRTL ? 'In Hand' : 'In Hand') : (isRTL ? 'مناقصة' : 'Tender')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border inline-block ${stageObj?.badgeClass || 'bg-slate-100 text-slate-800'}`}>
                          {stageLabel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                          <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{formatDateString(proj.closing_date)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-end whitespace-nowrap font-urbanist">
                        <div className="font-mono font-black text-slate-900 dark:text-white text-sm">
                          {formatCurrencySAR(proj.estimated_value)}
                        </div>
                      </td>
                      <td className="py-3 px-3 min-w-[160px]">
                        {proj.next_action ? (
                          <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium line-clamp-1" title={proj.next_action}>
                            {proj.next_action}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 text-xs">
                        {proj.owner_name || 'Eslam M.'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredClosingProjects.length > 0 && (
              <tfoot>
                <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 font-bold border-t-2 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white">
                  <td colSpan={5} className="py-2 px-3 text-start font-black text-xs text-emerald-950 dark:text-emerald-200">
                    {isRTL ? `إجمالي المشاريع المعروضة (${filteredClosingProjects.length} مشروع):` : `Total Displayed Deals (${filteredClosingProjects.length}):`}
                  </td>
                  <td className="py-2 px-3 text-end font-mono font-black text-emerald-900 dark:text-emerald-200 text-sm">
                    {formatCurrencySAR(filteredClosingProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0))}
                  </td>
                  <td colSpan={2} className="py-2 px-3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SYSTEMS DISTRIBUTION (The 21 Systems Breakdown) */}
      {/* ========================================================================= */}
      <div className="crm-card p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-[#8FC2F0]" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist">
              {isRTL ? 'توزيع الصفقات حسب أنظمة المسبار الـ 21 (Systems Breakdown)' : 'Projects Distribution by 21 Engineering Systems'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isRTL ? 'حجم ومبالغ الصفقات المسجلة تحت كل نظام' : 'Ranked by active projects and commercial volume'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {systemsBreakdown.slice(0, 9).map((item) => (
            <div 
              key={item.system}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#141820] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white font-urbanist truncate max-w-[170px]" title={item.system}>
                  {item.system}
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-[#8FC2F0]">
                  {item.count} {isRTL ? 'مشروع' : 'deals'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 dark:bg-[#8FC2F0] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, item.percentage)}%` }} 
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrencySAR(item.value)}
                </span>
                <span>{item.percentage}% {isRTL ? 'من الإجمالي' : 'share'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. TEAM SCORECARD & TOP CLIENTS SPLIT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Sales Reps Scorecard */}
        <div className="crm-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist">
                {isRTL ? 'بطاقة أداء مهندسي المبيعات' : 'Sales Engineering Team Scorecard'}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono font-bold">
              {repsScorecard.length} {isRTL ? 'مهندسين' : 'engineers'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold pb-2">
                  <th className="py-2 text-start">{isRTL ? 'المهندس' : 'Engineer'}</th>
                  <th className="py-2 text-center">{isRTL ? 'الزيارات' : 'Visits'}</th>
                  <th className="py-2 text-center">{isRTL ? 'جديد' : 'New'}</th>
                  <th className="py-2 text-center">{isRTL ? 'العروض' : 'Quotes'}</th>
                  <th className="py-2 text-end">{isRTL ? 'الترسيات (Won)' : 'Won SAR'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {repsScorecard.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                      {rep.name}
                    </td>
                    <td className="py-2.5 text-center font-bold text-blue-600 dark:text-[#8FC2F0]">
                      {rep.visits}
                    </td>
                    <td className="py-2.5 text-center font-bold text-purple-600 dark:text-purple-400">
                      {rep.newProjects}
                    </td>
                    <td className="py-2.5 text-center font-bold text-slate-600 dark:text-slate-300">
                      {rep.quotes}
                    </td>
                    <td className="py-2.5 text-end font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrencySAR(rep.wonValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Contractors & Clients */}
        <div className="crm-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist">
                {isRTL ? 'أكبر شركات المقاولات والعملاء' : 'Top Contractors & Key Accounts'}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono font-bold">
              {topClients.length} {isRTL ? 'شركات' : 'accounts'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold pb-2">
                  <th className="py-2 text-start">{isRTL ? 'الشركة / المقاول' : 'Company'}</th>
                  <th className="py-2 text-center">{isRTL ? 'المشاريع' : 'Projects'}</th>
                  <th className="py-2 text-end">{isRTL ? 'الترسيات المحققة' : 'Won SAR'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {topClients.map((client) => (
                  <tr key={client.companyName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white truncate max-w-[200px]" title={client.companyName}>
                      {client.companyName}
                    </td>
                    <td className="py-2.5 text-center font-bold text-slate-600 dark:text-slate-300">
                      {client.projectsCount}
                    </td>
                    <td className="py-2.5 text-end font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrencySAR(client.wonValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 7. DETAILED EXECUTION LOG (For Daily & Weekly) / GROWTH (For Yearly) */}
      {/* ========================================================================= */}
      {activeTab === 'yearly' || activeTab === 'quarterly' ? (
        <div className="crm-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-[#8FC2F0]" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist">
                {isRTL ? 'مسار الأداء وتطور المبيعات شهراً بشهر' : 'Month-over-Month 12-Month Performance Growth'}
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              {isRTL ? 'تطور الترسيات وعروض الأسعار والأنشطة' : 'Tracking quotes, submittals, and won revenue'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold pb-2">
                  <th className="py-2 text-start">{isRTL ? 'الشهر' : 'Month'}</th>
                  <th className="py-2 text-end">{isRTL ? 'الترسيات (Won SAR)' : 'Won SAR'}</th>
                  <th className="py-2 text-end">{isRTL ? 'عروض الأسعار' : 'Quotes Value'}</th>
                  <th className="py-2 text-center">{isRTL ? 'العروض الفنية (Submittals)' : 'Submittals'}</th>
                  <th className="py-2 text-center">{isRTL ? 'الأنشطة الميدانية' : 'Activities'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium font-urbanist">
                {monthlyGrowth.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white font-sans">{m.month}</td>
                    <td className="py-2.5 text-end font-mono font-black text-emerald-600 dark:text-emerald-400">{formatCurrencySAR(m.wonValue)}</td>
                    <td className="py-2.5 text-end font-mono font-bold text-blue-600 dark:text-[#8FC2F0]">{formatCurrencySAR(m.quotesValue)}</td>
                    <td className="py-2.5 text-center font-bold text-purple-600 dark:text-purple-400">{m.submittalsCount}</td>
                    <td className="py-2.5 text-center font-bold text-slate-700 dark:text-slate-300">{m.activitiesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="crm-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-[#8FC2F0]" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist">
                {isRTL ? 'سجل الأنشطة والزيارات الميدانية في هذه الفترة' : 'Field Visits & Executed Activities Log'}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono font-bold">
              {periodActivities.length} {isRTL ? 'نشاط مسجل' : 'activities'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold pb-2">
                  <th className="py-2 text-start w-28">{isRTL ? 'التاريخ / الوقت' : 'Date & Time'}</th>
                  <th className="py-2 text-start">{isRTL ? 'المشروع / المقاول' : 'Project / Client'}</th>
                  <th className="py-2 text-start">{isRTL ? 'القناة والغرض' : 'Channel & Purpose'}</th>
                  <th className="py-2 text-start">{isRTL ? 'النتيجة والملاحظات' : 'Outcome & Notes'}</th>
                  <th className="py-2 text-start">{isRTL ? 'الخطوة القادمة' : 'Next Step'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {periodActivities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                      {isRTL ? 'لا توجد أنشطة مسجلة في هذه الفترة' : 'No activities logged in this period'}
                    </td>
                  </tr>
                ) : (
                  periodActivities.slice(0, 20).map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                        <div>{act.activity_date}</div>
                        <div className="text-slate-400">{act.activity_time || '10:00 AM'}</div>
                      </td>
                      <td className="py-2.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {act.project_name || (isRTL ? 'زيارة موقع' : 'Site Visit')}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span>{act.company_name || '-'}</span>
                          {act.contact_name && (
                            <>
                              <span>&bull;</span>
                              <span>{act.contact_name}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {act.channel}
                        </div>
                        <div className="text-[11px] text-slate-500">{act.visit_purpose}</div>
                      </td>
                      <td className="py-2.5 text-slate-700 dark:text-slate-300">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 mb-0.5">
                          {act.outcome || 'منجز'}
                        </span>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[220px]" title={act.notes}>
                          {act.notes || '-'}
                        </div>
                      </td>
                      <td className="py-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        {act.next_action || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* ========================================================================= */}
      {/* 8. REPORT EXPORT / PRINT STUDIO */}
      {/* ========================================================================= */}
      <ReportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        reportType={activeTab}
        reportTitle={currentPeriod.title}
        periodLabel={currentPeriod.label}
        data={pdfDataBundle}
      />
    </>
  );
}
