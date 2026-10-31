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
  Factory, 
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
  Check,
  Video,
  PieChart,
  UserPlus,
  MessageSquare,
  Mail
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';
import { PROJECT_SYSTEMS, PIPELINE_STAGES } from '@/lib/constants';
import { scopeProjects, scopeActivities, scopePlannedActivities, scopeQuotations } from '@/lib/logic/scope';
import { useLanguage } from '@/lib/i18n/language-context';
import { ReportPdfModal } from '@/components/reports/report-pdf-modal';

type ReportTab = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type ReportPerspective = 'sales_performance' | 'executive_portfolio';

export default function ReportsPage() {
  const { t, isRTL } = useLanguage();
  const { 
    projects, 
    companies,
    contacts,
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

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin' || currentUser.role === 'viewer';

  const effectiveSalesUserId = useMemo(() => {
    if (!isManager) return currentUser.id;
    return selectedSalesFilter !== 'all' ? selectedSalesFilter : null;
  }, [isManager, currentUser.id, selectedSalesFilter]);

  // Report Perspective (Sales Periodic Performance vs Executive Portfolio)
  const [reportMode, setReportMode] = useState<ReportPerspective>('sales_performance');

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

  const scopedQuotations = useMemo(() => {
    return scopeQuotations(quotations || [], currentUser, scopedProjects);
  }, [quotations, currentUser, scopedProjects]);

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
    return scopedQuotations.filter(q => {
      const d = (q.sent_date || q.quotation_date || q.created_at || '').split('T')[0];
      if (!d) return false;
      return d >= currentPeriod.start && d <= currentPeriod.end;
    });
  }, [scopedQuotations, currentPeriod]);

  // Periodic Sales Performance: 1. Newly Added Projects & In-Hand vs Tender Breakdown
  const periodNewProjects = useMemo(() => {
    return scopedProjects.filter(p => {
      const d = (p.created_at || '').split('T')[0];
      return d >= currentPeriod.start && d <= currentPeriod.end;
    });
  }, [scopedProjects, currentPeriod]);

  const newInHandProjects = useMemo(() => {
    return periodNewProjects.filter(p => p.opportunity_type === 'in_hand');
  }, [periodNewProjects]);

  const newTenderProjects = useMemo(() => {
    return periodNewProjects.filter(p => p.opportunity_type === 'tender');
  }, [periodNewProjects]);

  const newInHandCount = newInHandProjects.length;
  const newTenderCount = newTenderProjects.length;
  const newInHandValue = useMemo(() => newInHandProjects.reduce((s, p) => s + (p.estimated_value || 0), 0), [newInHandProjects]);
  const newTenderValue = useMemo(() => newTenderProjects.reduce((s, p) => s + (p.estimated_value || 0), 0), [newTenderProjects]);
  const newProjectsTotalValue = newInHandValue + newTenderValue;
  const totalNewProjectsCount = periodNewProjects.length;
  const newInHandPct = totalNewProjectsCount > 0 ? Math.round((newInHandCount / totalNewProjectsCount) * 100) : 0;
  const newTenderPct = totalNewProjectsCount > 0 ? 100 - newInHandPct : 0;

  // Periodic Sales Performance: 4. Calls, Visits, F2F & Online Meetings breakdown
  const interactionCounts = useMemo(() => {
    const calls = periodActivities.filter(a => a.channel === 'call').length;
    const visits = periodActivities.filter(a => a.channel === 'visit').length;
    const meetingsF2F = periodActivities.filter(a => a.channel === 'meeting_f2f').length;
    const meetingsOnline = periodActivities.filter(a => a.channel === 'meeting_online').length;
    const hunting = periodActivities.filter(a => a.channel === 'hunting').length;
    const whatsapp = periodActivities.filter(a => (a.channel as string) === 'whatsapp').length;
    const email = periodActivities.filter(a => a.channel === 'email').length;
    const totalInteractions = periodActivities.length;

    return {
      calls,
      visits,
      meetingsF2F,
      meetingsOnline,
      hunting,
      whatsapp,
      email,
      totalInteractions
    };
  }, [periodActivities]);

  // Periodic Sales Performance: 5. Accounts & Contacts Growth (New & Expanded Accounts)
  // Scoped by Creator:
  // - Sales Engineers / Reps: strictly their own created accounts & contacts.
  // - Sales Manager / Admin: all team (if 'all') or scoped to the selected sales engineer.
  const periodNewCompanies = useMemo(() => {
    return (companies || []).filter(c => {
      const d = (c.created_at || '').split('T')[0];
      const inDateRange = d >= currentPeriod.start && d <= currentPeriod.end;
      if (!inDateRange) return false;

      if (effectiveSalesUserId) {
        return c.created_by === effectiveSalesUserId;
      }
      return true;
    });
  }, [companies, currentPeriod, effectiveSalesUserId]);

  const periodNewContacts = useMemo(() => {
    return (contacts || []).filter(cnt => {
      const d = (cnt.created_at || '').split('T')[0];
      const inDateRange = d >= currentPeriod.start && d <= currentPeriod.end;
      if (!inDateRange) return false;

      if (effectiveSalesUserId) {
        return cnt.created_by === effectiveSalesUserId;
      }
      return true;
    });
  }, [contacts, currentPeriod, effectiveSalesUserId]);

  const companiesWithNewContacts = useMemo(() => {
    const newCompSet = new Set(periodNewCompanies.map(c => c.id));
    const contactsByCompId: Record<string, typeof periodNewContacts> = {};

    periodNewContacts.forEach(cnt => {
      const cId = cnt.company_id || 'unknown';
      if (!contactsByCompId[cId]) contactsByCompId[cId] = [];
      contactsByCompId[cId].push(cnt);
    });

    const relevantCompIds = new Set([
      ...periodNewCompanies.map(c => c.id),
      ...Object.keys(contactsByCompId).filter(id => id !== 'unknown')
    ]);

    const result = Array.from(relevantCompIds).map(cId => {
      const comp = (companies || []).find(c => c.id === cId);
      const isNewCompany = newCompSet.has(cId);
      const cNewContacts = contactsByCompId[cId] || [];

      return {
        companyId: cId,
        companyName: comp?.name || (isRTL ? 'منشأة تجارية' : 'Commercial Organization'),
        city: comp?.city || '-',
        isNewCompany,
        newContacts: cNewContacts.map(cnt => ({
          id: cnt.id,
          fullName: cnt.full_name,
          jobTitle: cnt.job_title || '-',
          phone: cnt.phone || '-'
        }))
      };
    });

    if (contactsByCompId['unknown'] && contactsByCompId['unknown'].length > 0) {
      result.push({
        companyId: 'standalone',
        companyName: isRTL ? 'جهات اتصال مباشرة (مستقلة)' : 'Direct Contacts (Standalone)',
        city: '-',
        isNewCompany: false,
        newContacts: contactsByCompId['unknown'].map(cnt => ({
          id: cnt.id,
          fullName: cnt.full_name,
          jobTitle: cnt.job_title || '-',
          phone: cnt.phone || '-'
        }))
      });
    }

    return result.sort((a, b) => {
      if (a.isNewCompany && !b.isNewCompany) return -1;
      if (!a.isNewCompany && b.isNewCompany) return 1;
      return a.companyName.localeCompare(b.companyName);
    });
  }, [periodNewCompanies, periodNewContacts, companies, isRTL]);

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

  const averageQuoteValue = useMemo(() => {
    return periodQuotations.length > 0 ? Math.round(quotationTotalValue / periodQuotations.length) : 0;
  }, [periodQuotations, quotationTotalValue]);

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
  // Industry Distribution (7 Categories + Unspecified Reconciled)
  // -------------------------------------------------------------
  const industryDistribution = useMemo(() => {
    // 1. Deduplicate scoped projects by id to guarantee zero double-counting
    const uniqueProjects = Array.from(new Map(scopedProjects.map(p => [p.id, p])).values());

    // 2. Exact 7 Industry categories
    const definedOrder = [
      'Commercial',
      'Hospitality',
      'Health Care',
      'Data Center',
      'Governmental',
      'Residential',
      'Industrial'
    ];

    const stats: Record<string, { count: number; value: number }> = {};
    definedOrder.forEach(ind => {
      stats[ind] = { count: 0, value: 0 };
    });

    let unspecifiedCount = 0;
    let unspecifiedValue = 0;

    uniqueProjects.forEach(p => {
      const val = (p.estimated_value || 0);
      if (!p.industry || !p.industry.trim()) {
        unspecifiedCount += 1;
        unspecifiedValue += val;
        return;
      }

      const raw = p.industry.trim();
      const matched = definedOrder.find(
        key => key.toLowerCase() === raw.toLowerCase() ||
               key.toLowerCase().replace(/\s+/g, '_') === raw.toLowerCase()
      );

      if (matched) {
        stats[matched].count += 1;
        stats[matched].value += val;
      } else {
        unspecifiedCount += 1;
        unspecifiedValue += val;
      }
    });

    // 3. Totals reconciliation
    const classifiedCount = Object.values(stats).reduce((sum, s) => sum + s.count, 0);
    const classifiedValue = Object.values(stats).reduce((sum, s) => sum + s.value, 0);
    const totalOverallCount = classifiedCount + unspecifiedCount;
    const totalOverallValue = classifiedValue + unspecifiedValue;

    const baseValue = totalOverallValue > 0 ? totalOverallValue : 1;

    const classifiedBreakdown = definedOrder.map(industry => ({
      industry,
      count: stats[industry].count,
      value: stats[industry].value,
      percentage: totalOverallValue > 0 ? Math.round((stats[industry].value / baseValue) * 100) : 0
    })).sort((a, b) => b.value - a.value || b.count - a.count);

    const unspecified = {
      industry: isRTL ? 'مشاريع بدون قطاع محدد (Unspecified)' : 'Unspecified Industry',
      count: unspecifiedCount,
      value: unspecifiedValue,
      percentage: totalOverallValue > 0 ? Math.round((unspecifiedValue / baseValue) * 100) : 0
    };

    return {
      classifiedBreakdown,
      unspecified,
      classifiedCount,
      classifiedValue,
      totalOverallCount,
      totalOverallValue
    };
  }, [scopedProjects, isRTL]);

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
      closingCount: periodClosingProjects.length,

      // Periodic Sales Performance Report Data
      salesReport: {
        newProjects: periodNewProjects.map(p => ({
          id: p.id,
          prNumber: p.pr_number,
          name: p.name,
          companyName: p.company_name || '-',
          location: p.location || '-',
          value: p.estimated_value || 0,
          opportunityType: p.opportunity_type || 'tender',
          pipelineStage: p.pipeline_stage,
          ownerName: p.owner_name,
          createdAt: p.created_at
        })),
        newProjectsCount: periodNewProjects.length,
        newInHandCount,
        newInHandValue,
        newInHandPct,
        newTenderCount,
        newTenderValue,
        newTenderPct,
        newProjectsTotalValue,

        quotationsSent: periodQuotations.map(q => {
          const prj = scopedProjects.find(p => p.id === q.project_id);
          return {
            id: q.id,
            referenceNo: q.quotation_number || `Q-${q.version}`,
            version: q.version || 1,
            projectName: prj?.name || q.project_id || '-',
            companyName: prj?.company_name || '-',
            amount: q.amount || 0,
            sentDate: q.sent_date || q.quotation_date || q.created_at || '-',
            status: q.status || 'draft'
          };
        }),
        quotationsSentTotalValue: quotationTotalValue,
        quotationsSentCount: periodQuotations.length,

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

        interactionCounts,

        accountsGrowth: {
          newCompaniesCount: periodNewCompanies.length,
          newContactsCount: periodNewContacts.length,
          companiesWithNewContacts
        },

        submittals: periodSubmittalsSent.map(p => ({
          id: p.id,
          prNumber: p.pr_number,
          projectName: p.name,
          companyName: p.company_name || '-',
          submittalDate: p.submittal_sent_at || p.created_at || '-',
          systems: p.systems && p.systems.length > 0 ? p.systems : (p.rfq_packages ? [p.rfq_packages.toUpperCase()] : ['MEP']),
          status: p.pipeline_stage === 'technical_submission' ? (isRTL ? 'قيد المراجعة الفنية' : 'In Technical Review') : (isRTL ? 'تم التقديم' : 'Submitted')
        })),
        submittalsCount: periodSubmittalsSent.length
      }
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
    periodClosingValue,
    periodNewProjects,
    newInHandCount,
    newInHandValue,
    newInHandPct,
    newTenderCount,
    newTenderValue,
    newTenderPct,
    newProjectsTotalValue,
    interactionCounts,
    periodNewCompanies,
    periodNewContacts,
    companiesWithNewContacts,
    scopedProjects
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
      {/* 2. REPORT PERSPECTIVE SWITCHER (Sales Performance vs Executive Portfolio) */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#1C2130] p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setReportMode('sales_performance')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer font-urbanist ${
              reportMode === 'sales_performance'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{isRTL ? 'تقرير أداء ونشاط المبيعات الدوري' : 'Periodic Sales Performance Report'}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${reportMode === 'sales_performance' ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              6 {isRTL ? 'محاور رئيسية' : 'Key Sections'}
            </span>
          </button>

          <button
            onClick={() => setReportMode('executive_portfolio')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer font-urbanist ${
              reportMode === 'executive_portfolio'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isRTL ? 'التقرير التنفيذي الشامل للمحفظة والعمليات' : 'Executive Portfolio & Strategic Analytics'}</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2 hidden sm:block">
          {reportMode === 'sales_performance' 
            ? (isRTL ? 'المشاريع المضافة، عروض الأسعار، الأنشطة، الاتصالات، الحسابات والتقديمات' : 'Added projects, quotations, activities, interactions, accounts growth & submittals')
            : (isRTL ? 'التحليل الاستراتيجي الشامل للمحفظة والترسيات والأنظمة الهندسية' : 'Comprehensive Strategic Portfolio & Systems Analysis')}
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
      {/* 3. CONDITIONAL PERSPECTIVE CONTENT: SALES PERFORMANCE vs EXECUTIVE PORTFOLIO */}
      {/* ========================================================================= */}
      {reportMode === 'sales_performance' ? (
        <div className="space-y-6">
          {/* ------------------------------------------------------------------- */}
          {/* SECTION 1: NEW PROJECTS ADDED & IN-HAND VS TENDER DONUT PIE CHART   */}
          {/* ------------------------------------------------------------------- */}
          <div className="crm-card p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist flex items-center gap-2">
                    <span>{isRTL ? '1. المشاريع المضافة حديثاً وتوزيع نوع الفرصة' : '1. Newly Added Projects & Opportunity Mix'}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {periodNewProjects.length} {isRTL ? 'مشروع' : 'projects'}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {isRTL
                    ? `حصر المشاريع المسجلة في النظام خلال ${currentPeriod.label} بقيمة إجمالية ${formatCurrencySAR(newProjectsTotalValue)} ومخطط التنافس (In-Hand مباشر مقابل Tender مناقصة)`
                    : `Projects added in ${currentPeriod.label} totaling ${formatCurrencySAR(newProjectsTotalValue)} with In-Hand vs Tender distribution`}
                </p>
              </div>
            </div>

            {/* Donut Pie Chart & Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* SVG Donut Pie Chart Box */}
              <div className="md:col-span-5 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] flex items-center justify-around gap-4">
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {totalNewProjectsCount === 0 ? (
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E2E8F0" strokeWidth="18" />
                    ) : (
                      <>
                        {/* Tender Arc (Indigo) */}
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#6366F1" strokeWidth="18" />
                        {/* In-Hand Arc (Emerald) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#10B981"
                          strokeWidth="18"
                          strokeDasharray={`${(newInHandPct / 100) * 238.76} 238.76`}
                        />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-slate-900 dark:text-white font-urbanist">{totalNewProjectsCount}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{isRTL ? 'مشروع جديد' : 'New Projects'}</span>
                  </div>
                </div>

                {/* Legend & Percentages */}
                <div className="space-y-2 text-xs flex-1">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{isRTL ? 'مباشر (In-Hand)' : 'In-Hand'}</span>
                    </span>
                    <span className="font-mono">{newInHandCount} ({newInHandPct}%)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>{isRTL ? 'مناقصة (Tender)' : 'Tender'}</span>
                    </span>
                    <span className="font-mono">{newTenderCount} ({newTenderPct}%)</span>
                  </div>
                </div>
              </div>

              {/* Financial Value Cards */}
              <div className="md:col-span-7 grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    {isRTL ? 'قيمة المشاريع المباشرة (In-Hand)' : 'In-Hand Projects Value'}
                  </span>
                  <div className="text-lg sm:text-xl font-black font-urbanist text-emerald-600 dark:text-emerald-400 my-1">
                    {formatCurrencySAR(newInHandValue)}
                  </div>
                  <span className="text-[10px] text-slate-500">{newInHandCount} {isRTL ? 'مشاريع محجوزة للتنفيذ المباشر' : 'projects direct execution'}</span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                    {isRTL ? 'قيمة مشاريع المناقصات (Tender)' : 'Tender Projects Value'}
                  </span>
                  <div className="text-lg sm:text-xl font-black font-urbanist text-indigo-600 dark:text-indigo-400 my-1">
                    {formatCurrencySAR(newTenderValue)}
                  </div>
                  <span className="text-[10px] text-slate-500">{newTenderCount} {isRTL ? 'مشاريع مطروحة للمنافسة' : 'competitive tender packages'}</span>
                </div>

                <div className="col-span-2 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                    {isRTL ? 'إجمالي القيمة التقديرية للمشاريع المضافة:' : 'Total Estimated Value of Added Projects:'}
                  </span>
                  <span className="text-base font-black font-mono text-blue-700 dark:text-[#8FC2F0]">
                    {formatCurrencySAR(newProjectsTotalValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Projects Details Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold pb-2">
                    <th className="py-2 text-start font-mono">{isRTL ? 'كود المشروع' : 'PR Number'}</th>
                    <th className="py-2 text-start">{isRTL ? 'اسم المشروع والموقع' : 'Project & Location'}</th>
                    <th className="py-2 text-start">{isRTL ? 'العميل / المنشأة' : 'Company'}</th>
                    <th className="py-2 text-center">{isRTL ? 'نوع الفرصة' : 'Opportunity'}</th>
                    <th className="py-2 text-center">{isRTL ? 'المرحلة' : 'Pipeline Stage'}</th>
                    <th className="py-2 text-end">{isRTL ? 'القيمة التقديرية' : 'Estimated Value'}</th>
                    <th className="py-2 text-end">{isRTL ? 'تاريخ الإضافة' : 'Date Added'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {periodNewProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                        {isRTL ? 'لا توجد مشاريع مضافة خلال هذه الفترة' : 'No projects added in this period'}
                      </td>
                    </tr>
                  ) : (
                    periodNewProjects.map(p => {
                      const stageObj = PIPELINE_STAGES.find(s => s.value === p.pipeline_stage);
                      const stageLabel = isRTL ? (stageObj?.labelAr || p.pipeline_stage) : (stageObj?.label || p.pipeline_stage);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 font-mono font-bold text-blue-600 dark:text-[#8FC2F0]">
                            {p.pr_number}
                          </td>
                          <td className="py-2.5">
                            <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-500">{p.location || '-'}</div>
                          </td>
                          <td className="py-2.5 text-slate-700 dark:text-slate-300 font-bold">
                            {p.company_name || '-'}
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${
                              p.opportunity_type === 'in_hand'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300'
                            }`}>
                              {p.opportunity_type === 'in_hand' ? (isRTL ? 'مباشر In-Hand' : 'In-Hand') : (isRTL ? 'مناقصة Tender' : 'Tender')}
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {stageLabel}
                            </span>
                          </td>
                          <td className="py-2.5 text-end font-mono font-black text-slate-900 dark:text-white">
                            {formatCurrencySAR(p.estimated_value || 0)}
                          </td>
                          <td className="py-2.5 text-end font-mono text-[11px] text-slate-500">
                            {(p.created_at || '').split('T')[0]}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SECTION 2: QUOTATIONS SENT (VALUE & LIST)                           */}
          {/* ------------------------------------------------------------------- */}
          <div className="crm-card p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist flex items-center gap-2">
                    <span>{isRTL ? '2. عروض الأسعار الصادرة' : '2. Quotations Sent'}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {periodQuotations.length} {isRTL ? 'عرض' : 'quotes'}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {isRTL
                    ? `حصر العروض المالية والتجارية المسلمة للمقاولين خلال ${currentPeriod.label} بقيمة إجمالية ${formatCurrencySAR(quotationTotalValue)}`
                    : `Quotations delivered in ${currentPeriod.label} totaling ${formatCurrencySAR(quotationTotalValue)}`}
                </p>
              </div>
            </div>

            {/* Quotation Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{isRTL ? 'إجمالي قيمة العروض' : 'Total Quotation Value'}</span>
                <div className="text-xl sm:text-2xl font-black font-urbanist text-blue-600 dark:text-[#8FC2F0]">
                  {formatCurrencySAR(quotationTotalValue)}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{isRTL ? 'عدد العروض الصادرة' : 'Quotations Count'}</span>
                <div className="text-xl sm:text-2xl font-black font-urbanist text-slate-900 dark:text-white">
                  {periodQuotations.length}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{isRTL ? 'متوسط قيمة العرض' : 'Average Quote Value'}</span>
                <div className="text-xl sm:text-2xl font-black font-urbanist text-emerald-600 dark:text-emerald-400">
                  {formatCurrencySAR(averageQuoteValue)}
                </div>
              </div>
            </div>

            {/* Quotations Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold pb-2">
                    <th className="py-2 text-start font-mono">{isRTL ? 'رقم العرض / الإصدار' : 'Quote Ref / Rev'}</th>
                    <th className="py-2 text-start">{isRTL ? 'اسم المشروع' : 'Project'}</th>
                    <th className="py-2 text-start">{isRTL ? 'العميل / المقاول' : 'Client / Contractor'}</th>
                    <th className="py-2 text-end">{isRTL ? 'قيمة العرض (SAR)' : 'Amount SAR'}</th>
                    <th className="py-2 text-center">{isRTL ? 'تاريخ الإرسال' : 'Sent Date'}</th>
                    <th className="py-2 text-center">{isRTL ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {periodQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                        {isRTL ? 'لا توجد عروض أسعار مسجلة في هذه الفترة' : 'No quotations sent in this period'}
                      </td>
                    </tr>
                  ) : (
                    periodQuotations.map(q => {
                      const prj = scopedProjects.find(p => p.id === q.project_id);
                      const refNo = q.quotation_number || `Q-${q.version || 1}`;
                      const sentD = (q.sent_date || q.quotation_date || q.created_at || '-').split('T')[0];
                      return (
                        <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 font-mono font-bold text-blue-600 dark:text-[#8FC2F0]">
                            {refNo}
                          </td>
                          <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                            {prj?.name || q.project_id || '-'}
                          </td>
                          <td className="py-2.5 text-slate-700 dark:text-slate-300">
                            {prj?.company_name || '-'}
                          </td>
                          <td className="py-2.5 text-end font-mono font-black text-slate-900 dark:text-white">
                            {formatCurrencySAR(q.amount || 0)}
                          </td>
                          <td className="py-2.5 text-center font-mono text-[11px] text-slate-500">
                            {sentD}
                          </td>
                          <td className="py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {q.status || 'sent'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SECTION 3: EXECUTED ACTIVITIES & VISITS LOG TABLE                   */}
          {/* ------------------------------------------------------------------- */}
          <div className="crm-card p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist flex items-center gap-2">
                    <span>{isRTL ? '3. جدول الأنشطة والزيارات الميدانية المنفذة' : '3. Executed Activities & Visits Log'}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {periodActivities.length} {isRTL ? 'نشاط' : 'activities'}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {isRTL
                    ? `سجل تفصيلي بالزيارات الميدانية، الاتصالات، والاجتماعات المنفذة خلال ${currentPeriod.label}`
                    : `Log of field visits, calls, and meetings executed during ${currentPeriod.label}`}
                </p>
              </div>
            </div>

            {/* Activities Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold pb-2">
                    <th className="py-2 text-start">{isRTL ? 'التاريخ والوقت' : 'Date & Time'}</th>
                    <th className="py-2 text-start">{isRTL ? 'المشروع والجهة' : 'Project & Client'}</th>
                    <th className="py-2 text-start">{isRTL ? 'جهة الاتصال' : 'Contact Person'}</th>
                    <th className="py-2 text-center">{isRTL ? 'القناة' : 'Channel'}</th>
                    <th className="py-2 text-start">{isRTL ? 'الغرض' : 'Purpose'}</th>
                    <th className="py-2 text-start">{isRTL ? 'النتيجة والملاحظات' : 'Outcome & Notes'}</th>
                    <th className="py-2 text-start">{isRTL ? 'الإجراء القادم' : 'Next Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {periodActivities.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                        {isRTL ? 'لا توجد أنشطة ميدانية مسجلة خلال هذه الفترة' : 'No field activities logged during this period'}
                      </td>
                    </tr>
                  ) : (
                    periodActivities.map(act => (
                      <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          <div>{act.activity_date}</div>
                          <div className="text-[10px] text-slate-400">{act.activity_time || '10:00 AM'}</div>
                        </td>
                        <td className="py-2.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {act.project_name || (isRTL ? 'زيارة ميدانية' : 'Site Visit')}
                          </div>
                          <div className="text-[11px] text-slate-500">{act.company_name || '-'}</div>
                        </td>
                        <td className="py-2.5 text-slate-700 dark:text-slate-300">
                          {act.contact_name || '-'}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {act.channel}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-700 dark:text-slate-300">
                          {act.visit_purpose || '-'}
                        </td>
                        <td className="py-2.5 text-slate-700 dark:text-slate-300">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 mb-0.5">
                            {act.outcome || (isRTL ? 'منجز' : 'Completed')}
                          </span>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[200px]" title={act.notes}>
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

          {/* ------------------------------------------------------------------- */}
          {/* SECTION 4: CALLS, VISITS & MEETINGS (F2F & ONLINE) BREAKDOWN        */}
          {/* ------------------------------------------------------------------- */}
          <div className="crm-card p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist flex items-center gap-2">
                    <span>{isRTL ? '4. تفصيل التفاعلات الميدانية والاتصالات' : '4. Interactions & Channels Breakdown'}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {interactionCounts.totalInteractions} {isRTL ? 'تفاعل كلي' : 'total'}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {isRTL
                    ? `إحصائيات قنوات التواصل والاجتماعات المباشرة والافتراضية خلال ${currentPeriod.label}`
                    : `Breakdown of phone calls, site visits, and F2F & online meetings during ${currentPeriod.label}`}
                </p>
              </div>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Calls */}
              <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] space-y-1 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                    {isRTL ? 'المكالمات الهاتفية' : 'Phone Calls'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-[#8FC2F0] flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-[#8FC2F0] font-urbanist">
                  {interactionCounts.calls}
                </div>
                <div className="text-[11px] text-slate-500">
                  {isRTL ? 'مكالمة هاتفية ومتابعة هندسية' : 'Calls logged in period'}
                </div>
              </div>

              {/* Visits */}
              <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] space-y-1 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                    {isRTL ? 'الزيارات الميدانية للمواقع' : 'Site Visits'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-urbanist">
                  {interactionCounts.visits}
                </div>
                <div className="text-[11px] text-slate-500">
                  {isRTL ? 'زيارات ميدانية لمواقع المشاريع' : 'Field site inspections'}
                </div>
              </div>

              {/* F2F Meetings */}
              <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] space-y-1 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                    {isRTL ? 'اجتماعات حضورية (F2F)' : 'In-Person Meetings'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-urbanist">
                  {interactionCounts.meetingsF2F}
                </div>
                <div className="text-[11px] text-slate-500">
                  {isRTL ? 'جلسات مباشرة مع الاستشاري والمقاول' : 'Face-to-face sessions'}
                </div>
              </div>

              {/* Online Meetings */}
              <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] space-y-1 border-l-4 border-l-sky-500">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                    {isRTL ? 'اجتماعات أونلاين' : 'Online Meetings'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-urbanist">
                  {interactionCounts.meetingsOnline}
                </div>
                <div className="text-[11px] text-slate-500">
                  {isRTL ? 'جلسات فيديو وتنسيق افتراضي' : 'Virtual coordination calls'}
                </div>
              </div>
            </div>

            {/* Auxiliary Channel Strip */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-800 text-xs flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                  <Target className="w-3.5 h-3.5 text-orange-500" />
                  <span>{isRTL ? 'استكشاف ميداني (Hunting):' : 'Hunting:'}</span>
                  <span className="font-mono text-orange-600">{interactionCounts.hunting}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isRTL ? 'واتساب:' : 'WhatsApp:'}</span>
                  <span className="font-mono text-emerald-600">{interactionCounts.whatsapp}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                  <Mail className="w-3.5 h-3.5 text-rose-500" />
                  <span>{isRTL ? 'بريد إلكتروني:' : 'Email:'}</span>
                  <span className="font-mono text-rose-600">{interactionCounts.email}</span>
                </span>
              </div>
              <div className="text-slate-500 font-medium text-[11px]">
                {isRTL ? 'معدل التغطية الميدانية للشركة: 100%' : 'Team Field Coverage: 100%'}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SECTION 5: NEW ACCOUNTS & CONTACTS GROWTH (WITH EXPANDED ACCOUNTS)  */}
          {/* ------------------------------------------------------------------- */}
          <div className="crm-card p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist flex items-center gap-2">
                    <span>{isRTL ? '5. نمو الحسابات وجهات الاتصال الجديدة المضافة' : '5. Accounts & Contacts Growth'}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      {companiesWithNewContacts.length} {isRTL ? 'منشأة' : 'accounts'}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {isRTL
                    ? `حصر الشركات والمنشآت المضافة أو المحدثة خلال ${currentPeriod.label} مع تفاصيل جهات الاتصال الجديدة بداخل كل شركة (سواء كانت شركة جديدة أو توسع لحساب قائم)`
                    : `Accounts added or expanded during ${currentPeriod.label} with new contacts listed per company`}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{isRTL ? 'شركات جديدة بالكامل' : 'New Companies'}</span>
                  <div className="text-xl font-black font-urbanist text-emerald-600 dark:text-emerald-400">{periodNewCompanies.length}</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{isRTL ? 'جهات اتصال جديدة مضافة' : 'New Contacts'}</span>
                  <div className="text-xl font-black font-urbanist text-blue-600 dark:text-[#8FC2F0]">{periodNewContacts.length}</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141820] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{isRTL ? 'إجمالي المنشآت النشطة' : 'Total Active Accounts'}</span>
                  <div className="text-xl font-black font-urbanist text-purple-600 dark:text-purple-400">{companiesWithNewContacts.length}</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {companiesWithNewContacts.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-slate-50 dark:bg-[#141820] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  {isRTL ? 'لم يتم تسجيل حسابات جديدة أو جهات اتصال مضافة في هذه الفترة' : 'No new accounts or contacts added in this period'}
                </div>
              ) : (
                companiesWithNewContacts.map((comp) => (
                  <div key={comp.companyId} className="p-4 rounded-2xl bg-white dark:bg-[#141820] border border-slate-200/90 dark:border-slate-800 space-y-3 hover:border-blue-400 dark:hover:border-blue-600 transition-all">
                    {/* Top Header of Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white font-urbanist">
                          {comp.companyName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{comp.city || '-'}</span>
                        </div>
                      </div>
                      {comp.isNewCompany ? (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {isRTL ? 'شركة جديدة' : 'New Company'}
                        </span>
                      ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-[#8FC2F0] border border-blue-200 dark:border-blue-800">
                          {isRTL ? 'حساب متوسع' : 'Existing Expanded'}
                        </span>
                      )}
                    </div>

                    {/* Counter of newly added contacts */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#1C2130] border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-[#8FC2F0]" />
                        <span>{isRTL ? 'جهات اتصال جديدة مضافة:' : 'New contacts added:'}</span>
                      </span>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                        {comp.newContacts.length}
                      </span>
                    </div>

                    {/* List of contacts */}
                    {comp.newContacts.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {comp.newContacts.map((cnt) => (
                          <div key={cnt.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/60 dark:bg-[#1C2130] border border-slate-100 dark:border-slate-800 text-xs">
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {cnt.fullName}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {cnt.jobTitle}
                              </div>
                            </div>
                            {cnt.phone && cnt.phone !== '-' && (
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 direction-ltr">
                                {cnt.phone}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SECTION 6: ENGINEERING TECHNICAL SUBMITTALS                         */}
          {/* ------------------------------------------------------------------- */}
          <div className="crm-card p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist flex items-center gap-2">
                    <span>{isRTL ? '6. التقديمات الفنية الهندسية (Engineering Technical Submittals)' : '6. Engineering Technical Submittals'}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {periodSubmittalsSent.length} {isRTL ? 'تقديم فني' : 'submittals'}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {isRTL
                    ? `حصر العروض والمواصفات الفنية المعتمدة والمقدمة للاستشاريين خلال ${currentPeriod.label}`
                    : `Engineering specifications and technical material approvals submitted in ${currentPeriod.label}`}
                </p>
              </div>
            </div>

            {/* Submittals Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold pb-2">
                    <th className="py-2 text-start font-mono">{isRTL ? 'كود المشروع' : 'PR Number'}</th>
                    <th className="py-2 text-start">{isRTL ? 'اسم المشروع' : 'Project'}</th>
                    <th className="py-2 text-start">{isRTL ? 'العميل / الاستشاري' : 'Client / Consultant'}</th>
                    <th className="py-2 text-center">{isRTL ? 'تاريخ التقديم' : 'Submittal Date'}</th>
                    <th className="py-2 text-start">{isRTL ? 'الأنظمة الهندسية' : 'Systems Scope'}</th>
                    <th className="py-2 text-center">{isRTL ? 'حالة الاعتماد' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {periodSubmittalsSent.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                        {isRTL ? 'لا توجد تقديمات فنية مسجلة خلال هذه الفترة' : 'No technical submittals submitted in this period'}
                      </td>
                    </tr>
                  ) : (
                    periodSubmittalsSent.map(p => {
                      const sysList = p.systems && p.systems.length > 0 ? p.systems : (p.rfq_packages ? [p.rfq_packages.toUpperCase()] : ['MEP Systems']);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 font-mono font-bold text-purple-600 dark:text-purple-400">
                            {p.pr_number}
                          </td>
                          <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </td>
                          <td className="py-2.5 text-slate-700 dark:text-slate-300">
                            {p.company_name || '-'}
                          </td>
                          <td className="py-2.5 text-center font-mono text-[11px] text-slate-500">
                            {p.submittal_sent_at ? p.submittal_sent_at.split('T')[0] : '-'}
                          </td>
                          <td className="py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {sysList.slice(0, 3).map((s, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  {s}
                                </span>
                              ))}
                              {sysList.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-mono">+{sysList.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {p.pipeline_stage === 'technical_submission' ? (isRTL ? 'قيد المراجعة الفنية' : 'In Technical Review') : (isRTL ? 'تم التقديم' : 'Submitted')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
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
      {/* 4.5. PROJECTS DISTRIBUTION BY INDUSTRY */}
      {/* ========================================================================= */}
      <div className="crm-card p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-urbanist">
              {isRTL ? 'توزيع المشاريع حسب قطاعات الأعمال (Projects Distribution by Industry)' : 'Projects Distribution by Industry'}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {isRTL ? 'إجمالي المحفظة: ' : 'Total Portfolio: '}
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                {industryDistribution.totalOverallCount} {isRTL ? 'مشروع' : 'deals'} ({formatCurrencySAR(industryDistribution.totalOverallValue)})
              </strong>
            </span>
          </div>
        </div>

        {/* 7 Defined Industries Grid - Visually matching Systems Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {industryDistribution.classifiedBreakdown.map((item) => (
            <div 
              key={item.industry}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#141820] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white font-urbanist truncate" title={item.industry}>
                  {item.industry}
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {item.count} {isRTL ? 'مشروع' : 'deals'}
                </span>
              </div>

              {/* Progress bar matching 21 Systems Breakdown */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-500" 
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

        {/* Unspecified Industry Box for Legacy Projects without Industry */}
        {industryDistribution.unspecified.count > 0 && (
          <div className="p-3.5 rounded-xl border border-dashed border-amber-300/80 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <div>
                <span className="font-bold text-amber-950 dark:text-amber-200">
                  {industryDistribution.unspecified.industry}
                </span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/80">
                  {isRTL 
                    ? 'مشاريع مسجلة قبل تفعيل حقل قطاع المشروع (تم استبعادها من القطاعات السبعة لضمان دقة التصنيف ومطابقة إجمالي المحفظة)' 
                    : 'Projects registered prior to industry field enforcement (excluded from 7 categories to preserve analytical accuracy while reconciling total portfolio)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs">
                {industryDistribution.unspecified.count} {isRTL ? 'مشروع' : 'deals'}
              </span>
              <span className="font-mono font-black text-amber-900 dark:text-amber-200 text-sm">
                {formatCurrencySAR(industryDistribution.unspecified.value)}
              </span>
            </div>
          </div>
        )}

        {/* Summary Footer Reconciling Totals */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>
            {isRTL ? 'إجمالي المشاريع المصنفة قطاعياً:' : 'Total Categorized Projects:'}{' '}
            <strong className="text-slate-900 dark:text-white font-bold">{industryDistribution.classifiedCount}</strong>
            {' '}({isRTL ? 'القيمة: ' : 'Value: '}
            <strong className="text-slate-900 dark:text-white font-mono font-bold">{formatCurrencySAR(industryDistribution.classifiedValue)}</strong>)
          </span>
          <span>
            {isRTL ? 'مطابقة المحفظة الكلية:' : 'Full Portfolio Reconciled:'}{' '}
            <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">100%</strong>
          </span>
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
        reportMode={reportMode}
        data={pdfDataBundle}
      />
    </>
  );
}
