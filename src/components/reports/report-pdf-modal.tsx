'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  X, 
  Settings2, 
  ArrowRight, 
  ArrowLeft, 
  Compass,
  Phone,
  MapPin,
  Users,
  Video,
  Building2,
  FileText,
  FileCheck,
  CheckCircle2,
  TrendingUp,
  Target,
  Briefcase,
  Calendar,
  Layers,
  Check,
  Award,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { CRMateHorizontalLogo } from '@/components/brand/crmate-logo';

export interface ReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  reportTitle: string;
  periodLabel: string;
  reportMode?: 'sales_performance' | 'executive_portfolio';
  data: {
    generatedBy: string;
    generatedAt: string;
    salesReport?: {
      newProjects: {
        id: string;
        prNumber: string;
        name: string;
        companyName: string;
        location: string;
        value: number;
        opportunityType: string;
        pipelineStage: string;
        ownerName?: string;
        createdAt?: string;
      }[];
      newProjectsCount: number;
      newInHandCount: number;
      newInHandValue: number;
      newInHandPct: number;
      newTenderCount: number;
      newTenderValue: number;
      newTenderPct: number;
      newProjectsTotalValue: number;
      quotationsSent: {
        id: string;
        referenceNo: string;
        version: number;
        projectName: string;
        companyName: string;
        amount: number;
        sentDate: string;
        status: string;
      }[];
      quotationsSentTotalValue: number;
      quotationsSentCount: number;
      activitiesList: {
        time: string;
        date: string;
        projectName: string;
        companyName: string;
        contactName?: string;
        channel: string;
        purpose: string;
        outcome?: string;
        notes?: string;
        nextAction?: string;
      }[];
      interactionCounts: {
        calls: number;
        visits: number;
        meetingsF2F: number;
        meetingsOnline: number;
        hunting: number;
        whatsapp: number;
        totalInteractions: number;
      };
      accountsGrowth: {
        newCompaniesCount: number;
        newContactsCount: number;
        companiesWithNewContacts: {
          companyId: string;
          companyName: string;
          city?: string;
          isNewCompany: boolean;
          newContacts: {
            id: string;
            fullName: string;
            jobTitle?: string;
            phone?: string;
          }[];
        }[];
      };
      submittals: {
        id: string;
        prNumber: string;
        projectName: string;
        companyName: string;
        submittalDate: string;
        systems: string[];
        status: string;
      }[];
      submittalsCount: number;
    };
    kpis: {
      totalWonValue: number;
      wonCount: number;
      totalQuotationValue: number;
      quotationCount: number;
      submittalsSentCount: number;
      inTechnicalCount: number;
      inNegotiationCount: number;
      tenderCount: number;
      tenderValue: number;
      inHandCount: number;
      inHandValue: number;
      activitiesCount: number;
      callsCount: number;
      visitsCount: number;
      meetingsCount: number;
      huntingCount: number;
      collectedAmount?: number;
      collectionRate?: number;
      targetAmount?: number;
      targetAchievementPct?: number;
    };
    systemsBreakdown: { system: string; count: number; value: number; percentage: number }[];
    repsScorecard?: {
      name: string;
      role: string;
      calls: number;
      visits: number;
      newProjects: number;
      quotes: number;
      wonValue: number;
    }[];
    activitiesList?: {
      time: string;
      date: string;
      projectName: string;
      companyName: string;
      contactName?: string;
      channel: string;
      purpose: string;
      outcome?: string;
      notes?: string;
      nextAction?: string;
    }[];
    topClients?: {
      companyName: string;
      projectsCount: number;
      wonValue: number;
      pipelineValue: number;
    }[];
    monthlyGrowth?: {
      month: string;
      wonValue: number;
      quotesValue: number;
      submittalsCount: number;
      activitiesCount: number;
    }[];
    closingProjects?: {
      id: string;
      prNumber: string;
      name: string;
      companyName: string;
      contactName?: string;
      opportunityType: string;
      pipelineStage: string;
      closingDate: string;
      rawClosingDate?: string;
      value: number;
      nextAction?: string;
      ownerName?: string;
    }[];
    closingTotalValue?: number;
    closingCount?: number;
  };
}

const ARABIC_MONTHS: Record<string, string> = {
  Jan: 'يناير',
  Feb: 'فبراير',
  Mar: 'مارس',
  Apr: 'أبريل',
  May: 'مايو',
  Jun: 'يونيو',
  Jul: 'يوليو',
  Aug: 'أغسطس',
  Sep: 'سبتمبر',
  Oct: 'أكتوبر',
  Nov: 'نوفمبر',
  Dec: 'ديسمبر',
};

const CHANNEL_NAMES: Record<string, { ar: string; en: string }> = {
  call: { ar: 'اتصال هاتفي', en: 'Phone Call' },
  visit: { ar: 'زيارة موقع', en: 'Site Visit' },
  meeting_f2f: { ar: 'اجتماع حضوري', en: 'In-Person Meeting' },
  meeting_online: { ar: 'اجتماع أونلاين', en: 'Online Meeting' },
  hunting: { ar: 'استكشاف ميداني', en: 'Field Hunting' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
  email: { ar: 'بريد إلكتروني', en: 'Email' },
  office_work: { ar: 'عمل مكتبي', en: 'Office Work' },
  event: { ar: 'فعالية ومعرض', en: 'Event' },
};

export function ReportPdfModal({
  isOpen,
  onClose,
  reportType,
  reportTitle,
  periodLabel,
  reportMode = 'sales_performance',
  data
}: ReportPdfModalProps) {
  const { isRTL } = useLanguage();

  // Active Report Perspective
  const [activeReportMode, setActiveReportMode] = useState<'sales_performance' | 'executive_portfolio'>(reportMode);

  useEffect(() => {
    if (reportMode) {
      setActiveReportMode(reportMode);
    }
  }, [reportMode]);

  // Periodic Sales Performance Report Toggles (The 6 modular sections)
  const [includeNewProjects, setIncludeNewProjects] = useState(true);
  const [includeQuotationsSent, setIncludeQuotationsSent] = useState(true);
  const [includeActivitiesLog, setIncludeActivitiesLog] = useState(true);
  const [includeInteractionBreakdown, setIncludeInteractionBreakdown] = useState(true);
  const [includeAccountsAndContacts, setIncludeAccountsAndContacts] = useState(true);
  const [includeSubmittals, setIncludeSubmittals] = useState(true);

  // Executive Portfolio Report Section visibility toggles
  const [includeKpis, setIncludeKpis] = useState(true);
  const [includePipeline, setIncludePipeline] = useState(true);
  const [includeClosingProjects, setIncludeClosingProjects] = useState(true);
  const [includeSystems, setIncludeSystems] = useState(true);
  const [includeScorecard, setIncludeScorecard] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(true);
  const [includeTopClients, setIncludeTopClients] = useState(true);
  const [includeMonthlyGrowth, setIncludeMonthlyGrowth] = useState(true);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // Set default visible sections based on report type for Executive Portfolio
  useEffect(() => {
    if (reportType === 'daily') {
      setIncludeKpis(true);
      setIncludePipeline(true);
      setIncludeClosingProjects(true);
      setIncludeActivities(true);
      setIncludeSystems(false);
      setIncludeScorecard(false);
      setIncludeTopClients(false);
      setIncludeMonthlyGrowth(false);
    } else if (reportType === 'weekly') {
      setIncludeKpis(true);
      setIncludePipeline(true);
      setIncludeClosingProjects(true);
      setIncludeSystems(true);
      setIncludeScorecard(true);
      setIncludeActivities(true);
      setIncludeTopClients(false);
      setIncludeMonthlyGrowth(false);
    } else if (reportType === 'monthly') {
      setIncludeKpis(true);
      setIncludePipeline(true);
      setIncludeClosingProjects(true);
      setIncludeSystems(true);
      setIncludeScorecard(true);
      setIncludeTopClients(true);
      setIncludeActivities(false);
      setIncludeMonthlyGrowth(false);
    } else if (reportType === 'quarterly') {
      setIncludeKpis(true);
      setIncludePipeline(true);
      setIncludeClosingProjects(true);
      setIncludeSystems(true);
      setIncludeScorecard(true);
      setIncludeTopClients(true);
      setIncludeActivities(false);
      setIncludeMonthlyGrowth(false);
    } else if (reportType === 'yearly') {
      setIncludeKpis(true);
      setIncludePipeline(true);
      setIncludeClosingProjects(true);
      setIncludeSystems(true);
      setIncludeScorecard(true);
      setIncludeTopClients(true);
      setIncludeMonthlyGrowth(true);
      setIncludeActivities(false);
    }
  }, [reportType, isOpen]);

  // Clean, professional report title per period (Pure Arabic or Pure English)
  const reportHead = useMemo(() => {
    if (activeReportMode === 'sales_performance') {
      switch (reportType) {
        case 'daily':
          return isRTL ? 'تقرير أداء ونشاط المبيعات اليومي' : 'Daily Sales Activity & Performance Report';
        case 'weekly':
          return isRTL ? 'التقرير الأسبوعي لأداء المبيعات والنشاط الميداني' : 'Weekly Sales Activity & Performance Report';
        case 'monthly':
          return isRTL ? 'التقرير الشهري لأداء المبيعات والصفقات' : 'Monthly Sales Activity & Performance Report';
        case 'quarterly':
          return isRTL ? 'التقرير الربع سنوي لأداء المبيعات والنمو' : 'Quarterly Sales Activity & Performance Report';
        case 'yearly':
          return isRTL ? 'التقرير السنوي الشامل لأداء المبيعات' : 'Annual Sales Activity & Performance Report';
      }
    }
    switch (reportType) {
      case 'daily':
        return isRTL ? 'تقرير العمليات والمحفظة اليومي' : 'Daily Operations & Field Activity Report';
      case 'weekly':
        return isRTL ? 'التقرير الأسبوعي للأداء ومسار الصفقات' : 'Weekly Sales & Pipeline Performance Report';
      case 'monthly':
        return isRTL ? 'التقرير الشهري الشامل للأداء والمبيعات' : 'Monthly Commercial Performance Report';
      case 'quarterly':
        return isRTL ? 'التقرير الفصلي للربع السنوي ومسار الصفقات' : 'Quarterly Strategic Business Review';
      case 'yearly':
        return isRTL ? 'التقرير السنوي الشامل للأداء والإنجازات' : 'Annual Commercial Governance Report';
    }
  }, [activeReportMode, reportType, isRTL]);

  // Clean, beautiful date without timestamps or reversed AM/PM
  const formattedToday = useMemo(() => {
    const d = new Date();
    try {
      return d.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return d.toISOString().split('T')[0];
    }
  }, [isRTL]);

  // Pure language currency formatter
  const formatMoney = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return isRTL ? '0 ر.س' : 'SAR 0';
    }
    let numStr = '';
    if (amount >= 1_000_000) {
      numStr = `${(amount / 1_000_000).toFixed(2)}${isRTL ? ' مليون' : 'M'}`;
    } else if (amount >= 1_000) {
      numStr = `${(amount / 1_000).toFixed(1)}${isRTL ? ' ألف' : 'K'}`;
    } else {
      numStr = amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return isRTL ? `${numStr} ر.س` : `SAR ${numStr}`;
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const salesData = data.salesReport;

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#EEF2F6] dark:bg-[#0B0F17] flex flex-col overflow-y-auto print:static print:block print:overflow-visible print:bg-white print:p-0 print:m-0 print:w-full print:min-h-0 print:h-auto"
      dir={isRTL ? "rtl" : "ltr"}
      id="crmate-pdf-modal-root"
    >
      
      {/* ========================================================================= */}
      {/* 1. FLOATING CONTROL BAR (Strictly Hidden in Print)                         */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#151A24]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4 print:hidden shadow-xs shrink-0">
        
        {/* Left / Back Button & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isRTL ? 'العودة للتقارير' : 'Back to Reports'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800 rtl:border-r rtl:pr-2 ltr:border-l ltr:pl-2 ltr:border-r-0">
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              {reportHead}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-[#8FC2F0] font-bold">
              {periodLabel}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {isRTL ? 'A4 عمودي • جاهز للطباعة' : 'A4 Portrait • Print-Ready'}
            </span>
          </div>
        </div>

        {/* Center / Report Perspective Toggle */}
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-[#1E2536] p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveReportMode('sales_performance')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeReportMode === 'sales_performance'
                ? 'bg-blue-600 text-white shadow-2xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isRTL ? 'أداء المبيعات الدوري' : 'Sales Performance'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveReportMode('executive_portfolio')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeReportMode === 'executive_portfolio'
                ? 'bg-blue-600 text-white shadow-2xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isRTL ? 'المحفظة التنفيذي' : 'Executive Portfolio'}</span>
          </button>
        </div>

        {/* Right / Actions */}
        <div className="flex items-center gap-2.5">
          {/* Customize Sections Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2536] hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 cursor-pointer shadow-2xs"
            >
              <Settings2 className="w-3.5 h-3.5 text-blue-600 dark:text-[#8FC2F0]" />
              <span>{isRTL ? 'تخصيص الأقسام' : 'Customize Sections'}</span>
            </button>

            {isCustomizeOpen && (
              <div 
                className={`absolute top-full mt-2 w-80 bg-white dark:bg-[#181E2C] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-xs text-slate-800 dark:text-slate-200 space-y-2.5 ${
                  isRTL ? 'left-0' : 'right-0'
                } animate-in fade-in zoom-in-95 duration-100`}
              >
                {activeReportMode === 'sales_performance' ? (
                  <>
                    <div className="font-bold text-[11px] text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>{isRTL ? 'تخصيص بنود التقرير (1 إلى 6):' : 'Customize Report Sections (1-6):'}</span>
                      <button onClick={() => setIsCustomizeOpen(false)} className="text-slate-400 hover:text-slate-700 p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] px-1 text-slate-500">
                      <button
                        type="button"
                        onClick={() => {
                          setIncludeNewProjects(true);
                          setIncludeQuotationsSent(true);
                          setIncludeActivitiesLog(true);
                          setIncludeInteractionBreakdown(true);
                          setIncludeAccountsAndContacts(true);
                          setIncludeSubmittals(true);
                        }}
                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        {isRTL ? 'تحديد كافة البنود' : 'Select All'}
                      </button>
                      <span>&bull;</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIncludeNewProjects(false);
                          setIncludeQuotationsSent(false);
                          setIncludeActivitiesLog(false);
                          setIncludeInteractionBreakdown(false);
                          setIncludeAccountsAndContacts(false);
                          setIncludeSubmittals(false);
                        }}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        {isRTL ? 'إلغاء التحديد' : 'Deselect All'}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1.5 rounded-lg">
                        <input type="checkbox" checked={includeNewProjects} onChange={e => setIncludeNewProjects(e.target.checked)} className="rounded accent-blue-600" />
                        <span className="font-semibold text-xs">{isRTL ? '1. المشاريع المضافة ومخطط (In-Hand / Tender)' : '1. Added Projects & Pie Chart'}</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1.5 rounded-lg">
                        <input type="checkbox" checked={includeQuotationsSent} onChange={e => setIncludeQuotationsSent(e.target.checked)} className="rounded accent-blue-600" />
                        <span className="font-semibold text-xs">{isRTL ? '2. قيمة وإحصائيات عروض الأسعار المرسلة' : '2. Quotations Sent Value & List'}</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1.5 rounded-lg">
                        <input type="checkbox" checked={includeActivitiesLog} onChange={e => setIncludeActivitiesLog(e.target.checked)} className="rounded accent-blue-600" />
                        <span className="font-semibold text-xs">{isRTL ? '3. جدول الأنشطة والزيارات المنفذة' : '3. Activities & Visits Log Table'}</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1.5 rounded-lg">
                        <input type="checkbox" checked={includeInteractionBreakdown} onChange={e => setIncludeInteractionBreakdown(e.target.checked)} className="rounded accent-blue-600" />
                        <span className="font-semibold text-xs">{isRTL ? '4. اتصالات، زيارات، اجتماعات (F2F / Online)' : '4. Calls, Visits, F2F & Online Meetings'}</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1.5 rounded-lg">
                        <input type="checkbox" checked={includeAccountsAndContacts} onChange={e => setIncludeAccountsAndContacts(e.target.checked)} className="rounded accent-blue-600" />
                        <span className="font-semibold text-xs">{isRTL ? '5. نمو الشركات وجهات الاتصال الجديدة المضافة' : '5. New Accounts & Contacts Growth'}</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1.5 rounded-lg">
                        <input type="checkbox" checked={includeSubmittals} onChange={e => setIncludeSubmittals(e.target.checked)} className="rounded accent-blue-600" />
                        <span className="font-semibold text-xs">{isRTL ? '6. التقديمات الفنية الهندسية (Submittals)' : '6. Engineering Technical Submittals'}</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-[11px] text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>{isRTL ? 'الأقسام المضمنة في التقرير:' : 'Included Sections in Report:'}</span>
                      <button onClick={() => setIsCustomizeOpen(false)} className="text-slate-400 hover:text-slate-700 p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-lg">
                      <input type="checkbox" checked={includeKpis} onChange={e => setIncludeKpis(e.target.checked)} className="rounded accent-blue-600" />
                      <span className="font-semibold">{isRTL ? 'المؤشرات الرئيسية والأداء المالي' : 'Key Performance Indicators (KPIs)'}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-lg">
                      <input type="checkbox" checked={includePipeline} onChange={e => setIncludePipeline(e.target.checked)} className="rounded accent-blue-600" />
                      <span className="font-semibold">{isRTL ? 'مسار الصفقات وتوزيع نوع الفرص' : 'Pipeline Stages & Opportunity Types'}</span>
                    </label>

                    {data.closingProjects && (
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-lg">
                        <input type="checkbox" checked={includeClosingProjects} onChange={e => setIncludeClosingProjects(e.target.checked)} className="rounded accent-emerald-600" />
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300">{isRTL ? 'المشاريع المتوقع إغلاقها وحسمها' : 'Scheduled Project Closings'}</span>
                      </label>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-lg">
                      <input type="checkbox" checked={includeSystems} onChange={e => setIncludeSystems(e.target.checked)} className="rounded accent-blue-600" />
                      <span className="font-semibold">{isRTL ? 'توزيع الأنظمة الهندسية الـ 21' : 'The 21 Systems Scope Breakdown'}</span>
                    </label>

                    {data.repsScorecard && (
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-lg">
                        <input type="checkbox" checked={includeScorecard} onChange={e => setIncludeScorecard(e.target.checked)} className="rounded accent-blue-600" />
                        <span className="font-semibold">{isRTL ? 'بطاقة أداء مهندسي المبيعات' : 'Sales Engineering Team Scorecard'}</span>
                      </label>
                    )}

                    {data.topClients && (
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-lg">
                        <input type="checkbox" checked={includeTopClients} onChange={e => setIncludeTopClients(e.target.checked)} className="rounded accent-blue-600" />
                        <span className="font-semibold">{isRTL ? 'كبار العملاء وشركات المقاولات' : 'Top Clients & General Contractors'}</span>
                      </label>
                    )}

                    {data.monthlyGrowth && (
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-lg">
                        <input type="checkbox" checked={includeMonthlyGrowth} onChange={e => setIncludeMonthlyGrowth(e.target.checked)} className="rounded accent-blue-600" />
                        <span className="font-semibold">{isRTL ? 'مسار النمو السنوي شهراً بشهر' : 'Month-over-Month Growth Progression'}</span>
                      </label>
                    )}

                    {data.activitiesList && (
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-lg">
                        <input type="checkbox" checked={includeActivities} onChange={e => setIncludeActivities(e.target.checked)} className="rounded accent-blue-600" />
                        <span className="font-semibold">{isRTL ? 'سجل الزيارات والأنشطة الميدانية' : 'Site Visits & Field Activities Log'}</span>
                      </label>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs hover:shadow transition-all cursor-pointer font-urbanist"
          >
            <Printer className="w-4 h-4 stroke-[2.2]" />
            <span>{isRTL ? 'طباعة / حفظ كـ PDF' : 'Print / Save as PDF'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. THE DEDICATED A4 DOCUMENT ENGINE                                       */}
      {/* ========================================================================= */}
      <main className="w-full py-6 px-3 sm:px-6 flex-1 flex justify-center print:block print:!p-0 print:!pr-0 print:!pl-0 print:!m-0 print:w-full print:overflow-visible">
        
        <article 
          className="w-full max-w-[210mm] bg-white text-slate-900 shadow-xl border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-4 print:shadow-none print:border-0 print:!p-0 print:!m-0 print:!mx-auto print:w-full print:max-w-none print:rounded-none font-sans mx-auto"
          id="printable-official-report"
        >
          
          {/* ======================================================================= */}
          {/* PRISTINE MINIMALIST CORPORATE HEADER                                    */}
          {/* ======================================================================= */}
          <div className="pb-3 border-b border-slate-200 report-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              
              {/* Logo + Company Identity */}
              <div className="flex items-center gap-3">
                <CRMateHorizontalLogo symbolSize={30} showSubtitle={false} theme="light" />
                <div className="border-r border-slate-300 pr-3 rtl:border-r rtl:pr-3 ltr:border-l ltr:pl-3 ltr:border-r-0">
                  <div className="text-sm font-extrabold text-slate-900">
                    {isRTL ? 'شركة المسبار العالمي للمقاولات والتوريدات الهندسية' : 'Al-Mespar Global Contracting & Supplies Co.'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {isRTL ? 'أنظمة التيار الخفيف والمقاولات الكهروميكانيكية والتحكم الذكي' : 'Low Current Systems, MEP Contracting & Smart Automation'}
                  </div>
                </div>
              </div>

              {/* Title & Date Box */}
              <div className={`text-start sm:text-end ${isRTL ? 'sm:text-left' : 'sm:text-right'}`}>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {reportHead}
                </h1>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600 flex-wrap">
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {isRTL ? `الفترة: ${periodLabel}` : `Period: ${periodLabel}`}
                  </span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-slate-500 font-medium font-mono">
                    {isRTL ? `التاريخ: ${formattedToday}` : `Date: ${formattedToday}`}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ======================================================================= */}
          {/* PERSPECTIVE A: SALES PERIODIC PERFORMANCE REPORT (1 to 6)               */}
          {/* ======================================================================= */}
          {activeReportMode === 'sales_performance' ? (
            <>
              {/* ------------------------------------------------------------------- */}
              {/* SECTION 1: NEW PROJECTS ADDED + IN-HAND VS TENDER PIE CHART         */}
              {/* ------------------------------------------------------------------- */}
              {includeNewProjects && salesData && (
                <section className="space-y-2 report-block">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>{isRTL ? '1. المشاريع المضافة حديثاً ومخطط التنافس (In-Hand vs Tender)' : '1. Added Projects & Opportunity Mix (In-Hand vs Tender)'}</span>
                    </h2>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      {salesData.newProjectsCount} {isRTL ? 'مشروع مضاف' : 'projects added'}
                    </span>
                  </div>

                  {/* Donut Chart & Ratio Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 report-card">
                    {/* SVG Pie Chart Box (5 cols) */}
                    <div className="sm:col-span-5 p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-around gap-3">
                      <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {salesData.newProjectsCount === 0 ? (
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E2E8F0" strokeWidth="18" />
                          ) : (
                            <>
                              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#6366F1" strokeWidth="18" />
                              <circle
                                cx="50"
                                cy="50"
                                r="38"
                                fill="transparent"
                                stroke="#10B981"
                                strokeWidth="18"
                                strokeDasharray={`${(salesData.newInHandPct / 100) * 238.76} 238.76`}
                              />
                            </>
                          )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-base font-black text-slate-900 font-urbanist">{salesData.newProjectsCount}</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">{isRTL ? 'مشروع' : 'Projects'}</span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="space-y-1.5 text-[10px] flex-1">
                        <div className="flex items-center justify-between p-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>In-Hand</span>
                          </span>
                          <span>{salesData.newInHandCount} ({salesData.newInHandPct}%)</span>
                        </div>
                        <div className="flex items-center justify-between p-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                            <span>Tender</span>
                          </span>
                          <span>{salesData.newTenderCount} ({salesData.newTenderPct}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Numerical Values (7 cols) */}
                    <div className="sm:col-span-7 grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-500">{isRTL ? 'إجمالي قيمة المشاريع المضافة' : 'Added Projects Total Value'}</span>
                        <div className="text-sm font-black text-slate-900 font-mono mt-1">
                          {formatMoney(salesData.newProjectsTotalValue)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-500">{isRTL ? 'قيمة مشاريع In-Hand' : 'In-Hand Value'}</span>
                        <div className="text-sm font-black text-emerald-700 font-mono mt-1">
                          {formatMoney(salesData.newInHandValue)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-500">{isRTL ? 'قيمة مشاريع المناقصات (Tender)' : 'Tender Value'}</span>
                        <div className="text-sm font-black text-indigo-700 font-mono mt-1">
                          {formatMoney(salesData.newTenderValue)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-500">{isRTL ? 'معدل الجاهزية والفرص' : 'Opportunity Balance'}</span>
                        <div className="text-xs font-bold text-slate-700 mt-1">
                          {salesData.newInHandCount > 0 ? (isRTL ? `${salesData.newInHandCount} فرص مؤكدة في اليد` : `${salesData.newInHandCount} Direct In-Hand`) : (isRTL ? 'مناقصات تنافسية' : 'Competitive Tenders')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table of new projects */}
                  {salesData.newProjects.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 report-card">
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="py-1.5 px-2 text-start w-16">#PR</th>
                            <th className="py-1.5 px-2 text-start">{isRTL ? 'اسم المشروع' : 'Project Name'}</th>
                            <th className="py-1.5 px-2 text-start">{isRTL ? 'العميل / المقاول' : 'Client / Contractor'}</th>
                            <th className="py-1.5 px-2 text-start w-20">{isRTL ? 'الموقع' : 'Location'}</th>
                            <th className="py-1.5 px-2 text-start w-16">{isRTL ? 'النوع' : 'Type'}</th>
                            <th className="py-1.5 px-2 text-end w-24">{isRTL ? 'القيمة (ر.س)' : 'Value (SAR)'}</th>
                            <th className="py-1.5 px-2 text-start w-20">{isRTL ? 'المرحلة' : 'Stage'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {salesData.newProjects.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/60">
                              <td className="py-1.5 px-2 font-mono font-bold text-blue-700">{p.prNumber}</td>
                              <td className="py-1.5 px-2 font-bold text-slate-900">{p.name}</td>
                              <td className="py-1.5 px-2 text-slate-600">{p.companyName}</td>
                              <td className="py-1.5 px-2 text-slate-500">{p.location}</td>
                              <td className="py-1.5 px-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  p.opportunityType === 'in_hand'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                }`}>
                                  {p.opportunityType === 'in_hand' ? 'In Hand' : 'Tender'}
                                </span>
                              </td>
                              <td className="py-1.5 px-2 text-end font-mono font-bold text-slate-900">{formatMoney(p.value)}</td>
                              <td className="py-1.5 px-2 text-slate-600 text-[9px]">{p.pipelineStage}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      {isRTL ? 'لا توجد مشاريع مضافة خلال هذه الفترة المحددة.' : 'No new projects added during this selected period.'}
                    </div>
                  )}
                </section>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* SECTION 2: QUOTATIONS SENT IN PERIOD                                */}
              {/* ------------------------------------------------------------------- */}
              {includeQuotationsSent && salesData && (
                <section className="space-y-2 report-block">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>{isRTL ? '2. عروض الأسعار المرسلة (Quotations Sent Pipeline)' : '2. Quotations Sent & Commercial Pipeline'}</span>
                    </h2>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      {salesData.quotationsSentCount} {isRTL ? 'عرض سعر رسمي' : 'quotes delivered'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 report-card">
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                      <span className="text-[10px] font-bold text-slate-500 block">{isRTL ? 'إجمالي قيمة عروض الأسعار الصادرة' : 'Total Quotations Sent Value'}</span>
                      <div className="text-base font-black text-blue-700 font-mono mt-0.5">
                        {formatMoney(salesData.quotationsSentTotalValue)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                      <span className="text-[10px] font-bold text-slate-500 block">{isRTL ? 'عدد عروض الأسعار الصادرة' : 'Quotations Sent Count'}</span>
                      <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                        {salesData.quotationsSentCount}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-slate-500 block">{isRTL ? 'متوسط قيمة العرض' : 'Average Quote Value'}</span>
                      <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                        {formatMoney(salesData.quotationsSentCount > 0 ? salesData.quotationsSentTotalValue / salesData.quotationsSentCount : 0)}
                      </div>
                    </div>
                  </div>

                  {salesData.quotationsSent.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 report-card">
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="py-1.5 px-2 text-start w-24">{isRTL ? 'رقم العرض' : 'Quote Ref'}</th>
                            <th className="py-1.5 px-2 text-start">{isRTL ? 'المشروع' : 'Project'}</th>
                            <th className="py-1.5 px-2 text-start">{isRTL ? 'العميل' : 'Client'}</th>
                            <th className="py-1.5 px-2 text-end w-28">{isRTL ? 'المبلغ (ر.س)' : 'Amount (SAR)'}</th>
                            <th className="py-1.5 px-2 text-start w-24">{isRTL ? 'تاريخ الإرسال' : 'Sent Date'}</th>
                            <th className="py-1.5 px-2 text-start w-20">{isRTL ? 'الحالة' : 'Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {salesData.quotationsSent.map(q => (
                            <tr key={q.id} className="hover:bg-slate-50/60">
                              <td className="py-1.5 px-2 font-mono font-bold text-blue-700">{q.referenceNo} (V{q.version})</td>
                              <td className="py-1.5 px-2 font-bold text-slate-900">{q.projectName}</td>
                              <td className="py-1.5 px-2 text-slate-600">{q.companyName}</td>
                              <td className="py-1.5 px-2 text-end font-mono font-bold text-slate-900">{formatMoney(q.amount)}</td>
                              <td className="py-1.5 px-2 text-slate-500 font-mono">{q.sentDate}</td>
                              <td className="py-1.5 px-2">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {q.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      {isRTL ? 'لا توجد عروض أسعار مرسلة خلال هذه الفترة.' : 'No quotations sent during this period.'}
                    </div>
                  )}
                </section>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* SECTION 3: ACTIVITIES LOG TABLE                                     */}
              {/* ------------------------------------------------------------------- */}
              {includeActivitiesLog && salesData && (
                <section className="space-y-2 report-block">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>{isRTL ? '3. جدول الأنشطة والزيارات الميدانية المنفذة' : '3. Completed Field Activities & Engagements Log'}</span>
                    </h2>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      {salesData.activitiesList.length} {isRTL ? 'نشاط مسجل' : 'activities logged'}
                    </span>
                  </div>

                  {salesData.activitiesList.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 report-card">
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="py-1.5 px-2 text-start w-20">{isRTL ? 'التاريخ والوقت' : 'Date / Time'}</th>
                            <th className="py-1.5 px-2 text-start">{isRTL ? 'المشروع / الموقع' : 'Project / Location'}</th>
                            <th className="py-1.5 px-2 text-start">{isRTL ? 'الجهة والمخاطب' : 'Company & Contact'}</th>
                            <th className="py-1.5 px-2 text-start w-28">{isRTL ? 'القناة والغرض' : 'Channel & Purpose'}</th>
                            <th className="py-1.5 px-2 text-start">{isRTL ? 'النتيجة والملاحظات' : 'Outcome & Notes'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {salesData.activitiesList.map((act, idx) => {
                            const channelInfo = CHANNEL_NAMES[act.channel];
                            const channelLabel = channelInfo ? (isRTL ? channelInfo.ar : channelInfo.en) : act.channel;
                            return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="py-1.5 px-2 font-mono text-[9px] text-slate-600 align-top">
                                  <div className="font-bold">{act.date}</div>
                                  <div className="text-slate-400">{act.time}</div>
                                </td>
                                <td className="py-1.5 px-2 align-top">
                                  <div className="font-bold text-slate-900 break-words">{act.projectName}</div>
                                </td>
                                <td className="py-1.5 px-2 align-top">
                                  <div className="font-bold text-slate-800 break-words">{act.companyName}</div>
                                  {act.contactName && <div className="text-[9px] text-slate-500 break-words">({act.contactName})</div>}
                                </td>
                                <td className="py-1.5 px-2 align-top">
                                  <div className="font-bold text-slate-700 break-words">{channelLabel}</div>
                                  <div className="text-[9px] text-slate-500 break-words">{act.purpose}</div>
                                </td>
                                <td className="py-1.5 px-2 text-slate-700 align-top">
                                  <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-0.5">
                                    {act.outcome || (isRTL ? 'منفذ' : 'Completed')}
                                  </span>
                                  <div className="text-[9px] text-slate-600 break-words leading-relaxed">{act.notes || '-'}</div>
                                  {act.nextAction && (
                                    <div className="text-[9px] text-blue-700 font-semibold mt-0.5 break-words">
                                      {isRTL ? `المتابعة: ${act.nextAction}` : `Follow-up: ${act.nextAction}`}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      {isRTL ? 'لا توجد أنشطة مسجلة خلال هذه الفترة.' : 'No activities logged during this period.'}
                    </div>
                  )}
                </section>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* SECTION 4: CALLS, VISITS, F2F & ONLINE MEETINGS BREAKDOWN          */}
              {/* ------------------------------------------------------------------- */}
              {includeInteractionBreakdown && salesData && (
                <section className="space-y-2 report-block">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      <span>{isRTL ? '4. إحصائيات التواصل والتفاعل الميداني' : '4. Client Interactions & Field Engagement'}</span>
                    </h2>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      {salesData.interactionCounts.totalInteractions} {isRTL ? 'تفاعل ومتابعة' : 'total interactions'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 report-card">
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                      <Phone className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-base font-black text-slate-900 font-mono">{salesData.interactionCounts.calls}</div>
                      <div className="text-[10px] font-bold text-slate-500">{isRTL ? 'اتصالات هاتفية' : 'Phone Calls'}</div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                      <MapPin className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <div className="text-base font-black text-slate-900 font-mono">{salesData.interactionCounts.visits}</div>
                      <div className="text-[10px] font-bold text-slate-500">{isRTL ? 'زيارات موقع ميدانية' : 'Site Visits'}</div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                      <Users className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                      <div className="text-base font-black text-slate-900 font-mono">{salesData.interactionCounts.meetingsF2F}</div>
                      <div className="text-[10px] font-bold text-slate-500">{isRTL ? 'اجتماعات حضورية' : 'F2F Meetings'}</div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                      <Video className="w-4 h-4 text-cyan-600 mx-auto mb-1" />
                      <div className="text-base font-black text-slate-900 font-mono">{salesData.interactionCounts.meetingsOnline}</div>
                      <div className="text-[10px] font-bold text-slate-500">{isRTL ? 'اجتماعات أونلاين' : 'Online Meetings'}</div>
                    </div>
                  </div>
                </section>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* SECTION 5: NEW ACCOUNTS & CONTACTS GROWTH                          */}
              {/* ------------------------------------------------------------------- */}
              {includeAccountsAndContacts && salesData && (
                <section className="space-y-2 report-block">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      <span>{isRTL ? '5. نمو المنشآت وجهات الاتصال وصناع القرار' : '5. New Accounts & Stakeholders Growth'}</span>
                    </h2>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      {salesData.accountsGrowth.newCompaniesCount} {isRTL ? 'منشأة' : 'orgs'} &bull; {salesData.accountsGrowth.newContactsCount} {isRTL ? 'جهة اتصال' : 'contacts'}
                    </span>
                  </div>

                  {salesData.accountsGrowth.companiesWithNewContacts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 report-card">
                      {salesData.accountsGrowth.companiesWithNewContacts.map((item) => (
                        <div key={item.companyId} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">{item.companyName}</span>
                              {item.city && item.city !== '-' && <span className="text-[10px] text-slate-400">({item.city})</span>}
                            </div>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border shrink-0 ${
                              item.isNewCompany 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}>
                              {item.isNewCompany 
                                ? (isRTL ? 'منشأة جديدة' : 'New Account') 
                                : (isRTL ? 'توسيع عميل حالي' : 'Expanded Account')}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-600 pt-1 border-t border-slate-200/80">
                            <span className="font-bold text-slate-500 block mb-0.5">
                              {isRTL ? `جهات الاتصال المضافة (${item.newContacts.length}):` : `Added Contacts (${item.newContacts.length}):`}
                            </span>
                            <div className="space-y-0.5">
                              {item.newContacts.map(cnt => (
                                <div key={cnt.id} className="flex items-center justify-between bg-white px-2 py-0.5 rounded text-[10px] border border-slate-100">
                                  <span className="font-bold text-slate-800">{cnt.fullName}</span>
                                  <span className="text-slate-500">{cnt.jobTitle !== '-' ? cnt.jobTitle : ''}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      {isRTL ? 'لم يتم تسجيل منشآت أو جهات اتصال جديدة خلال هذه الفترة.' : 'No new accounts or contacts added during this period.'}
                    </div>
                  )}
                </section>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* SECTION 6: TECHNICAL SUBMITTALS                                     */}
              {/* ------------------------------------------------------------------- */}
              {includeSubmittals && salesData && (
                <section className="space-y-2 report-block">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-600" />
                      <span>{isRTL ? '6. التقديمات الفنية الهندسية (Engineering Submittals)' : '6. Engineering & Technical Submittals'}</span>
                    </h2>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      {salesData.submittalsCount} {isRTL ? 'تقديم فني' : 'submittals'}
                    </span>
                  </div>

                  {salesData.submittals.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 report-card">
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="py-1.5 px-2 text-start w-20">#PR</th>
                            <th className="py-1.5 px-2 text-start">{isRTL ? 'المشروع' : 'Project'}</th>
                            <th className="py-1.5 px-2 text-start">{isRTL ? 'العميل / الاستشاري' : 'Client / Consultant'}</th>
                            <th className="py-1.5 px-2 text-start w-28">{isRTL ? 'الأنظمة' : 'Systems'}</th>
                            <th className="py-1.5 px-2 text-start w-24">{isRTL ? 'تاريخ التقديم' : 'Submittal Date'}</th>
                            <th className="py-1.5 px-2 text-start w-24">{isRTL ? 'الحالة الفنية' : 'Technical Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {salesData.submittals.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/60">
                              <td className="py-1.5 px-2 font-mono font-bold text-blue-700">{s.prNumber}</td>
                              <td className="py-1.5 px-2 font-bold text-slate-900">{s.projectName}</td>
                              <td className="py-1.5 px-2 text-slate-600">{s.companyName}</td>
                              <td className="py-1.5 px-2 text-slate-500">{s.systems.join(', ')}</td>
                              <td className="py-1.5 px-2 text-slate-500 font-mono">{s.submittalDate}</td>
                              <td className="py-1.5 px-2">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      {isRTL ? 'لا توجد تقديمات فنية مسجلة خلال هذه الفترة.' : 'No technical submittals recorded during this period.'}
                    </div>
                  )}
                </section>
              )}

              {/* Zero Section Notice for Sales Report */}
              {!includeNewProjects && !includeQuotationsSent && !includeActivitiesLog && !includeInteractionBreakdown && !includeAccountsAndContacts && !includeSubmittals && (
                <div className="py-10 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl report-card">
                  <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-700">
                    {isRTL ? 'تم إلغاء تحديد كافة بنود تقرير المبيعات' : 'All sales report sections are currently excluded'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isRTL ? 'يرجى فتح قائمة "تخصيص الأقسام" في الأعلى لتحديد البنود المراد طباعتها في هذا التقرير.' : 'Please open the "Customize Sections" menu in the top bar to enable the items you want to print.'}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* ======================================================================= */
            /* PERSPECTIVE B: EXECUTIVE PORTFOLIO & CONTRACTING OVERVIEW               */
            /* ======================================================================= */
            <>
              {/* SECTION 1: KEY PERFORMANCE INDICATORS */}
              {includeKpis && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>{isRTL ? 'ملخص المؤشرات التشغيلية والمالية' : 'Key Performance Indicators Summary'}</span>
                    </h2>
                    <span className="text-[10px] text-slate-500 font-medium font-mono">
                      {isRTL ? 'العملة: ريال سعودي (ر.س)' : 'Currency: Saudi Riyal (SAR)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 report-card">
                    {/* Won */}
                    <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60">
                      <span className="text-[10px] font-bold text-slate-500 block">
                        {isRTL ? 'الترسيات المحققة' : 'Closed Won Revenue'}
                      </span>
                      <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                        {formatMoney(data.kpis.totalWonValue)}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-800 block mt-0.5">
                        {isRTL ? `${data.kpis.wonCount} مشاريع محسومة` : `${data.kpis.wonCount} Won Projects`}
                      </span>
                    </div>

                    {/* Quotations */}
                    <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60">
                      <span className="text-[10px] font-bold text-slate-500 block">
                        {isRTL ? 'عروض الأسعار الصادرة' : 'Quotations Delivered'}
                      </span>
                      <div className="text-lg font-black text-blue-700 font-mono mt-0.5">
                        {formatMoney(data.kpis.totalQuotationValue)}
                      </div>
                      <span className="text-[10px] font-semibold text-blue-800 block mt-0.5">
                        {isRTL ? `${data.kpis.quotationCount} عرض سعر رسمي` : `${data.kpis.quotationCount} Quotes`}
                      </span>
                    </div>

                    {/* Submittals */}
                    <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60">
                      <span className="text-[10px] font-bold text-slate-500 block">
                        {isRTL ? 'التقديمات الفنية' : 'Submittals Sent'}
                      </span>
                      <div className="text-lg font-black text-indigo-700 font-mono mt-0.5">
                        {data.kpis.submittalsSentCount}
                      </div>
                      <span className="text-[10px] font-semibold text-indigo-800 block mt-0.5">
                        {isRTL ? 'تقديمات فنية معتمدة' : 'Official Submittals'}
                      </span>
                    </div>

                    {/* Field Activities */}
                    <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60">
                      <span className="text-[10px] font-bold text-slate-500 block">
                        {isRTL ? 'الأنشطة الميدانية' : 'Field Activities'}
                      </span>
                      <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                        {data.kpis.activitiesCount}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 block mt-0.5">
                        {isRTL ? `${data.kpis.visitsCount} زيارة &bull; ${data.kpis.callsCount} اتصال` : `${data.kpis.visitsCount} Visits &bull; ${data.kpis.callsCount} Calls`}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION 2: OPPORTUNITY BREAKDOWN */}
              {includePipeline && (
                <section className="space-y-1.5 report-block">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>{isRTL ? 'مسار الصفقات وتوزيع نوع الفرص' : 'Pipeline Velocity & Deal Mix'}</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 report-card">
                    <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 block">In-Hand Projects (في اليد)</span>
                        <div className="text-base font-black text-emerald-900 font-mono mt-0.5">
                          {formatMoney(data.kpis.inHandValue)}
                        </div>
                      </div>
                      <span className="text-xs font-black px-2 py-1 rounded-md bg-emerald-100 text-emerald-800">
                        {data.kpis.inHandCount}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-800 block">Tender Bids (مناقصات)</span>
                        <div className="text-base font-black text-indigo-900 font-mono mt-0.5">
                          {formatMoney(data.kpis.tenderValue)}
                        </div>
                      </div>
                      <span className="text-xs font-black px-2 py-1 rounded-md bg-indigo-100 text-indigo-800">
                        {data.kpis.tenderCount}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION 3: CLOSING PROJECTS */}
              {includeClosingProjects && data.closingProjects && data.closingProjects.length > 0 && (
                <section className="space-y-1.5 report-block">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>{isRTL ? 'المشاريع المتوقع حسمها وإغلاقها' : 'Projects Scheduled for Closing'}</span>
                    </h2>
                    <span className="text-[10px] font-bold text-emerald-700 font-mono">
                      {formatMoney(data.closingTotalValue)} ({data.closingCount})
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 report-card">
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="py-1.5 px-2 text-start w-16">#PR</th>
                          <th className="py-1.5 px-2 text-start">{isRTL ? 'المشروع' : 'Project'}</th>
                          <th className="py-1.5 px-2 text-start">{isRTL ? 'العميل' : 'Client'}</th>
                          <th className="py-1.5 px-2 text-start w-24">{isRTL ? 'تاريخ الحسم' : 'Close Date'}</th>
                          <th className="py-1.5 px-2 text-end w-24">{isRTL ? 'القيمة' : 'Value'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.closingProjects.slice(0, 8).map(p => (
                          <tr key={p.id}>
                            <td className="py-1.5 px-2 font-mono font-bold text-blue-700">{p.prNumber}</td>
                            <td className="py-1.5 px-2 font-bold text-slate-900">{p.name}</td>
                            <td className="py-1.5 px-2 text-slate-600">{p.companyName}</td>
                            <td className="py-1.5 px-2 text-slate-500 font-mono">{p.closingDate}</td>
                            <td className="py-1.5 px-2 text-end font-mono font-bold text-slate-900">{formatMoney(p.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Zero Section Notice for Executive Report */}
              {!includeKpis && !includePipeline && !includeSystems && !includeScorecard && !includeTopClients && !includeMonthlyGrowth && !includeActivities && (
                <div className="py-10 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl report-card">
                  <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-700">
                    {isRTL ? 'تم إلغاء تحديد كافة الأقسام' : 'All optional sections are currently excluded'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isRTL ? 'يرجى فتح قائمة "تخصيص الأقسام" في الأعلى لتحديد الأقسام المراد إظهارها في هذا التقرير.' : 'Please open the "Customize Sections" menu in the top bar to enable the sections you want to print.'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ======================================================================= */}
          {/* SIGN-OFF & FOOTER NOTE (Tightly grouped to prevent orphan page spill)   */}
          {/* ======================================================================= */}
          <div className="pt-3 border-t border-slate-200 space-y-2 report-card">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50/50">
                <span className="text-[9px] font-bold text-slate-500 block mb-3">
                  {isRTL ? 'إعداد مهندس المبيعات' : 'Prepared by (Sales Engineer)'}
                </span>
                <div className="text-xs font-bold text-slate-900">{data.generatedBy}</div>
              </div>
              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50/50">
                <span className="text-[9px] font-bold text-slate-500 block mb-3">
                  {isRTL ? 'مراجعة مدير المبيعات' : 'Reviewed by (Sales Manager)'}
                </span>
                <div className="text-xs font-bold text-slate-900">{isRTL ? 'م. إسلام مهندس' : 'Eng. Eslam Mohandes'}</div>
              </div>
              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50/50">
                <span className="text-[9px] font-bold text-slate-500 block mb-3">
                  {isRTL ? 'اعتماد المدير العام' : 'Approved by (General Manager)'}
                </span>
                <div className="text-xs font-bold text-slate-900">{isRTL ? 'الإدارة التنفيذية' : 'Executive Management'}</div>
              </div>
              <div className="p-2 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50/30">
                <span className="text-[9px] font-bold text-slate-500">
                  {isRTL ? 'ختم الشركة الرسمي' : 'Official Company Seal'}
                </span>
              </div>
            </div>

            <div className="text-[9px] text-slate-400 flex items-center justify-between font-mono pt-1">
              <span>
                {isRTL ? 'منصة CRMate لإدارة المبيعات الهندسية • شركة المسبار العالمي للمقاولات والتوريدات الهندسية' : 'CRMate™ Intelligent Sales CRM • Al-Mespar Global Contracting & Supplies Co.'}
              </span>
              <span>
                {periodLabel} &bull; {formattedToday}
              </span>
            </div>
          </div>

        </article>
      </main>

    </div>
  );
}
