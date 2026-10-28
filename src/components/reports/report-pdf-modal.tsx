'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  X, 
  Settings2, 
  ArrowRight, 
  ArrowLeft,
  Compass
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { CRMateHorizontalLogo } from '@/components/brand/crmate-logo';

export interface ReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  reportTitle: string;
  periodLabel: string;
  data: {
    generatedBy: string;
    generatedAt: string;
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
  hunting: { ar: 'استكشاف ميداني', en: 'Field Hunting' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
  email: { ar: 'بريد إلكتروني', en: 'Email' },
};

export function ReportPdfModal({
  isOpen,
  onClose,
  reportType,
  reportTitle,
  periodLabel,
  data
}: ReportPdfModalProps) {
  const { isRTL } = useLanguage();

  // Section visibility toggles
  const [includeKpis, setIncludeKpis] = useState(true);
  const [includePipeline, setIncludePipeline] = useState(true);
  const [includeClosingProjects, setIncludeClosingProjects] = useState(true);
  const [includeSystems, setIncludeSystems] = useState(true);
  const [includeScorecard, setIncludeScorecard] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(true);
  const [includeTopClients, setIncludeTopClients] = useState(true);
  const [includeMonthlyGrowth, setIncludeMonthlyGrowth] = useState(true);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // Set default visible sections based on report type
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
    switch (reportType) {
      case 'daily':
        return isRTL ? 'تقرير المبيعات والأنشطة الميدانية اليومي' : 'Daily Sales & Field Activity Report';
      case 'weekly':
        return isRTL ? 'التقرير الأسبوعي للأداء ومسار الصفقات' : 'Weekly Sales & Pipeline Performance Report';
      case 'monthly':
        return isRTL ? 'التقرير الشهري الشامل للأداء والمبيعات' : 'Monthly Commercial Performance Report';
      case 'quarterly':
        return isRTL ? 'التقرير الفصلي للربع السنوي ومسار الصفقات' : 'Quarterly Strategic Business Review';
      case 'yearly':
        return isRTL ? 'التقرير السنوي الشامل للأداء والإنجازات' : 'Annual Commercial Governance Report';
    }
  }, [reportType, isRTL]);

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

  const tenderTotal = (data.kpis.tenderCount + data.kpis.inHandCount) || 1;
  const tenderPct = Math.round((data.kpis.tenderCount / tenderTotal) * 100);
  const inHandPct = 100 - tenderPct;

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
        
        {/* Left / Back Button */}
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
                className={`absolute top-full mt-2 w-72 bg-white dark:bg-[#181E2C] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-xs text-slate-800 dark:text-slate-200 space-y-2 ${
                  isRTL ? 'left-0' : 'right-0'
                } animate-in fade-in zoom-in-95 duration-100`}
              >
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
          className="w-full max-w-[210mm] bg-white text-slate-900 shadow-xl border border-slate-200/80 rounded-2xl p-8 sm:p-10 space-y-4 print:shadow-none print:border-0 print:!p-0 print:!m-0 print:!mx-auto print:w-full print:max-w-none print:rounded-none font-sans mx-auto"
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
          {/* SECTION 1: KEY PERFORMANCE INDICATORS                                   */}
          {/* ======================================================================= */}
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
                    {isRTL ? 'عروض الأسعار الصادرة' : 'Quotations Issued'}
                  </span>
                  <div className="text-lg font-black text-blue-700 font-mono mt-0.5">
                    {formatMoney(data.kpis.totalQuotationValue)}
                  </div>
                  <span className="text-[10px] font-semibold text-blue-800 block mt-0.5">
                    {isRTL ? `${data.kpis.quotationCount} عرض رسمي` : `${data.kpis.quotationCount} Official Quotes`}
                  </span>
                </div>

                {/* Submittals */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60">
                  <span className="text-[10px] font-bold text-slate-500 block">
                    {isRTL ? 'العروض الفنية والاعتمادات' : 'Technical Submittals'}
                  </span>
                  <div className="text-lg font-black text-purple-700 font-mono mt-0.5">
                    {data.kpis.submittalsSentCount}
                  </div>
                  <span className="text-[10px] font-semibold text-purple-800 block mt-0.5">
                    {isRTL ? 'عروض معتمدة أو قيد الاعتماد' : 'Approved or Under Review'}
                  </span>
                </div>

                {/* Field Activities */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60">
                  <span className="text-[10px] font-bold text-slate-500 block">
                    {isRTL ? 'الأنشطة الميدانية المنفذة' : 'Field Activities Executed'}
                  </span>
                  <div className="text-lg font-black text-amber-700 font-mono mt-0.5">
                    {data.kpis.activitiesCount}
                  </div>
                  <span className="text-[10px] text-slate-600 font-semibold block mt-0.5">
                    {isRTL ? `${data.kpis.visitsCount} زيارة موقع • ${data.kpis.callsCount} اتصال` : `${data.kpis.visitsCount} Site Visits • ${data.kpis.callsCount} Calls`}
                  </span>
                </div>
              </div>

              {/* Target Progress Bar (If target amount is specified) */}
              {data.kpis.targetAmount && data.kpis.targetAmount > 0 && (
                <div className="p-2 rounded-xl border border-blue-200/80 bg-blue-50/40 flex items-center justify-between gap-3 text-xs report-card">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-900">
                      {isRTL ? 'نسبة تحقيق المستهدف البيعي:' : 'Target Achievement Rate:'}
                    </span>
                    <span className="font-mono font-black text-blue-700">
                      {data.kpis.targetAchievementPct || 0}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 sm:w-48 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full" 
                        style={{ width: `${Math.min(100, data.kpis.targetAchievementPct || 0)}%` }} 
                      />
                    </div>
                    <span className="text-[11px] font-mono text-slate-600">
                      {isRTL ? `المحقق: ${formatMoney(data.kpis.totalWonValue)} / المستهدف: ${formatMoney(data.kpis.targetAmount)}` : `Actual: ${formatMoney(data.kpis.totalWonValue)} / Target: ${formatMoney(data.kpis.targetAmount)}`}
                    </span>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ======================================================================= */}
          {/* SECTION 2: PIPELINE & TENDER VS IN-HAND                                 */}
          {/* ======================================================================= */}
          {includePipeline && (
            <section className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <span>{isRTL ? 'مسار الصفقات وتوزيع نوع الفرص' : 'Pipeline Velocity & Opportunity Distribution'}</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isRTL ? 'مراحل الصفقات' : 'Stage Overview'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 report-card">
                {/* In Technical Submittal */}
                <div className="p-2.5 rounded-xl border border-purple-200/90 bg-purple-50/30">
                  <span className="text-[10px] font-bold text-purple-900 block">
                    {isRTL ? 'مشاريع في مرحلة الاعتماد الفني' : 'Technical Submittal Stage'}
                  </span>
                  <div className="text-xl font-black text-purple-800 font-mono mt-0.5">
                    {data.kpis.inTechnicalCount} <span className="text-xs font-bold font-sans text-purple-600">{isRTL ? 'مشروع' : 'Projects'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    {isRTL ? 'عروض فنية معتمدة من الاستشاري بانتظار الموافقة النهائية.' : 'Technical specifications awaiting final consultant approval.'}
                  </p>
                </div>

                {/* In Negotiations */}
                <div className="p-2.5 rounded-xl border border-indigo-200/90 bg-indigo-50/30">
                  <span className="text-[10px] font-bold text-indigo-900 block">
                    {isRTL ? 'مشاريع في مرحلة المفاوضات' : 'Commercial Negotiation Stage'}
                  </span>
                  <div className="text-xl font-black text-indigo-800 font-mono mt-0.5">
                    {data.kpis.inNegotiationCount} <span className="text-xs font-bold font-sans text-indigo-600">{isRTL ? 'مشروع' : 'Projects'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    {isRTL ? 'مفاوضات تجارية نهائية لحسم أوامر الشراء وإغلاق الترسية.' : 'Final commercial negotiations to close purchase orders.'}
                  </p>
                </div>

                {/* Tender vs In-Hand Ratio */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-800 block">
                      {isRTL ? 'توزيع نوع الفرص' : 'Opportunity Type Breakdown'}
                    </span>
                    <div className="h-4 w-full rounded-md overflow-hidden flex border border-slate-300 text-[9px] font-black text-white mt-1.5">
                      <div 
                        className="bg-sky-600 flex items-center justify-center font-mono" 
                        style={{ width: `${tenderPct}%` }}
                      >
                        {tenderPct > 15 ? (isRTL ? `مناقصة ${tenderPct}%` : `Tender ${tenderPct}%`) : ''}
                      </div>
                      <div 
                        className="bg-emerald-600 flex items-center justify-center font-mono" 
                        style={{ width: `${inHandPct}%` }}
                      >
                        {inHandPct > 15 ? (isRTL ? `مباشر ${inHandPct}%` : `Direct ${inHandPct}%`) : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold pt-1.5 border-t border-slate-200/80 mt-1.5">
                    <span className="text-sky-800">
                      {isRTL ? 'مناقصة: ' : 'Tender: '}
                      <strong className="font-mono">{data.kpis.tenderCount}</strong> ({formatMoney(data.kpis.tenderValue)})
                    </span>
                    <span className="text-emerald-800">
                      {isRTL ? 'مباشر: ' : 'Direct: '}
                      <strong className="font-mono">{data.kpis.inHandCount}</strong> ({formatMoney(data.kpis.inHandValue)})
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================================= */}
          {/* SECTION: SCHEDULED PROJECT CLOSINGS IN THIS PERIOD                      */}
          {/* ======================================================================= */}
          {includeClosingProjects && (
            <section className="space-y-1.5 report-card">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>{isRTL ? 'المشاريع المتوقع إغلاقها وحسمها في هذه الفترة' : 'Projects Scheduled for Closing in This Period'}</span>
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-slate-500 font-bold">
                    {data.closingCount || 0} {isRTL ? 'مشاريع مجدولة' : 'deals'}
                  </span>
                  {data.closingTotalValue ? (
                    <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {isRTL ? 'إجمالي الصفقات: ' : 'Total: '}{formatMoney(data.closingTotalValue)}
                    </span>
                  ) : null}
                </div>
              </div>

              {(!data.closingProjects || data.closingProjects.length === 0) ? (
                <div className="py-3 px-4 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-lg border border-slate-200">
                  {isRTL ? 'لا توجد مشاريع محدد لها موعد إغلاق ضمن هذه الفترة' : 'No projects scheduled for closing in this period'}
                </div>
              ) : (
                <div className="w-full overflow-hidden border border-slate-200 rounded-lg">
                  <table className="w-full text-xs table-fixed border-collapse">
                    <colgroup>
                      <col className="w-[12%]" />
                      <col className="w-[34%]" />
                      <col className="w-[13%]" />
                      <col className="w-[13%]" />
                      <col className="w-[14%]" />
                      <col className="w-[14%]" />
                    </colgroup>
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px]">
                        <th className="py-1.5 px-2 text-start">{isRTL ? 'الرقم' : '#PR'}</th>
                        <th className="py-1.5 px-2 text-start">{isRTL ? 'اسم المشروع والمقاول' : 'Project & Client'}</th>
                        <th className="py-1.5 px-2 text-center">{isRTL ? 'النوع' : 'Type'}</th>
                        <th className="py-1.5 px-2 text-center">{isRTL ? 'المرحلة' : 'Stage'}</th>
                        <th className="py-1.5 px-2 text-center">{isRTL ? 'موعد الإغلاق' : 'Closing Date'}</th>
                        <th className="py-1.5 px-2 text-end">{isRTL ? 'القيمة التقديرية' : 'Estimated Value'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10.5px]">
                      {data.closingProjects.map((p, idx) => (
                        <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-1.5 px-2 font-mono font-bold text-slate-700">{p.prNumber}</td>
                          <td className="py-1.5 px-2">
                            <div className="font-bold text-slate-900 break-words leading-tight">{p.name}</div>
                            <div className="text-[10px] text-slate-500 break-words">{p.companyName}</div>
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              p.opportunityType === 'in_hand'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            }`}>
                              {p.opportunityType === 'in_hand' ? (isRTL ? 'In Hand' : 'In Hand') : (isRTL ? 'مناقصة' : 'Tender')}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold text-slate-700 text-[10px]">
                            {p.pipelineStage}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-emerald-700 text-[10px]">
                            {p.closingDate}
                          </td>
                          <td className="py-1.5 px-2 text-end font-mono font-black text-emerald-800">
                            {formatMoney(p.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50/70 font-bold border-t-2 border-emerald-300 text-slate-900">
                        <td colSpan={5} className="py-1.5 px-2 text-start font-black text-xs text-emerald-950">
                          {isRTL ? 'إجمالي محفظة المشاريع المتوقع إغلاقها في هذه الفترة:' : 'Total Forecast Pipeline Scheduled for Closing:'}
                        </td>
                        <td className="py-1.5 px-2 text-end font-mono font-black text-emerald-900 text-xs">
                          {formatMoney(data.closingTotalValue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ======================================================================= */}
          {/* SECTION 3: THE 21 SYSTEMS BREAKDOWN                                     */}
          {/* ======================================================================= */}
          {includeSystems && data.systemsBreakdown && data.systemsBreakdown.length > 0 && (
            <section className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>{isRTL ? 'توزيع الصفقات حسب الأنظمة الهندسية الـ 21' : 'Deal Distribution by the 21 Engineering Systems'}</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isRTL ? 'الحجم والقيمة' : 'Scope & Value'}
                </span>
              </div>

              <div className="w-full overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-xs table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[6%]" />
                    <col className="w-[38%]" />
                    <col className="w-[16%]" />
                    <col className="w-[22%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-1.5 px-2 text-start">#</th>
                      <th className="py-1.5 px-2 text-start">{isRTL ? 'النظام الهندسي' : 'Engineering System'}</th>
                      <th className="py-1.5 px-2 text-center">{isRTL ? 'عدد المشاريع' : 'Project Count'}</th>
                      <th className="py-1.5 px-2 text-end">{isRTL ? 'القيمة التقديرية' : 'Estimated Value'}</th>
                      <th className="py-1.5 px-2 text-center">{isRTL ? 'النسبة المئوية' : 'Share (%)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.systemsBreakdown.map((s, idx) => (
                      <tr key={s.system} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-1.5 px-2 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-bold text-slate-800 break-words">{s.system}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-700 font-mono">{s.count}</td>
                        <td className="py-1.5 px-2 text-end font-mono font-bold text-blue-700">{formatMoney(s.value)}</td>
                        <td className="py-1.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, s.percentage)}%` }} />
                            </div>
                            <span className="font-mono text-[10px] font-bold text-slate-600 w-7 text-end">{s.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ======================================================================= */}
          {/* SECTION 4: SALES TEAM SCORECARD                                         */}
          {/* ======================================================================= */}
          {includeScorecard && data.repsScorecard && data.repsScorecard.length > 0 && (
            <section className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <span>{isRTL ? 'بطاقة أداء مهندسي المبيعات' : 'Sales Engineering Team Scorecard'}</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isRTL ? `${data.repsScorecard.length} مهندسين` : `${data.repsScorecard.length} Engineers`}
                </span>
              </div>

              <div className="w-full overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-xs table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[28%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-1.5 px-2 text-start">{isRTL ? 'مهندس المبيعات' : 'Sales Engineer'}</th>
                      <th className="py-1.5 px-2 text-center">{isRTL ? 'المكالمات' : 'Calls'}</th>
                      <th className="py-1.5 px-2 text-center">{isRTL ? 'الزيارات الميدانية' : 'Site Visits'}</th>
                      <th className="py-1.5 px-2 text-center">{isRTL ? 'مشاريع جديدة' : 'New Projects'}</th>
                      <th className="py-1.5 px-2 text-center">{isRTL ? 'عروض الأسعار' : 'Quotations'}</th>
                      <th className="py-1.5 px-2 text-end">{isRTL ? 'إجمالي الترسيات' : 'Won Value'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.repsScorecard.map((rep, idx) => (
                      <tr key={rep.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-1.5 px-2 font-bold text-slate-900 break-words">{rep.name}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-700 font-mono">{rep.calls}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-blue-700 font-mono">{rep.visits}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-purple-700 font-mono">{rep.newProjects}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-700 font-mono">{rep.quotes}</td>
                        <td className="py-1.5 px-2 text-end font-mono font-black text-emerald-700">{formatMoney(rep.wonValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ======================================================================= */}
          {/* SECTION 5: TOP CLIENTS & ACCOUNTS                                       */}
          {/* ======================================================================= */}
          {includeTopClients && data.topClients && data.topClients.length > 0 && (
            <section className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>{isRTL ? 'كبار العملاء وشركات المقاولات' : 'Key Clients & General Contractors'}</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isRTL ? 'مرتبة حسب حجم الترسيات' : 'Ranked by Won Revenue'}
                </span>
              </div>

              <div className="w-full overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-xs table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[6%]" />
                    <col className="w-[42%]" />
                    <col className="w-[14%]" />
                    <col className="w-[19%]" />
                    <col className="w-[19%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-1.5 px-2 text-start">#</th>
                      <th className="py-1.5 px-2 text-start">{isRTL ? 'شركة المقاولات / العميل' : 'Contractor / Client Name'}</th>
                      <th className="py-1.5 px-2 text-center">{isRTL ? 'عدد المشاريع' : 'Projects'}</th>
                      <th className="py-1.5 px-2 text-end">{isRTL ? 'حجم الترسيات' : 'Won Value'}</th>
                      <th className="py-1.5 px-2 text-end">{isRTL ? 'فرص قيد التفاوض' : 'In Negotiation'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.topClients.map((c, idx) => (
                      <tr key={c.companyName} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-1.5 px-2 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-bold text-slate-900 break-words">{c.companyName}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-700 font-mono">{c.projectsCount}</td>
                        <td className="py-1.5 px-2 text-end font-mono font-black text-emerald-700">{formatMoney(c.wonValue)}</td>
                        <td className="py-1.5 px-2 text-end font-mono font-bold text-slate-600">{formatMoney(c.pipelineValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ======================================================================= */}
          {/* SECTION 6: MONTH-OVER-MONTH GROWTH (For Yearly)                         */}
          {/* ======================================================================= */}
          {includeMonthlyGrowth && data.monthlyGrowth && data.monthlyGrowth.length > 0 && (
            <section className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>{isRTL ? 'مسار النمو السنوي شهراً بشهر' : '12-Month Progression & Growth'}</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isRTL ? 'أداء الـ 12 شهراً' : '12-Month Performance'}
                </span>
              </div>

              <div className="w-full overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-xs table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[20%]" />
                    <col className="w-[22%]" />
                    <col className="w-[22%]" />
                    <col className="w-[18%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-1.5 px-2 text-start">{isRTL ? 'الشهر' : 'Month'}</th>
                      <th className="py-1.5 px-2 text-end">{isRTL ? 'الترسيات' : 'Won Value'}</th>
                      <th className="py-1.5 px-2 text-end">{isRTL ? 'عروض الأسعار' : 'Quotations'}</th>
                      <th className="py-1.5 px-2 text-center">{isRTL ? 'العروض الفنية' : 'Submittals'}</th>
                      <th className="py-1.5 px-2 text-center">{isRTL ? 'الأنشطة المنفذة' : 'Activities'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.monthlyGrowth.map((m, idx) => (
                      <tr key={m.month} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-1.5 px-2 font-bold text-slate-900">{isRTL ? (ARABIC_MONTHS[m.month] || m.month) : m.month}</td>
                        <td className="py-1.5 px-2 text-end font-mono font-black text-emerald-700">{formatMoney(m.wonValue)}</td>
                        <td className="py-1.5 px-2 text-end font-mono font-bold text-blue-700">{formatMoney(m.quotesValue)}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-purple-700 font-mono">{m.submittalsCount}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-700 font-mono">{m.activitiesCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ======================================================================= */}
          {/* SECTION 7: FIELD ACTIVITIES LOG (For Daily / Weekly)                    */}
          {/* ======================================================================= */}
          {includeActivities && data.activitiesList && data.activitiesList.length > 0 && (
            <section className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 report-section-header">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <span>{isRTL ? 'سجل الزيارات والأنشطة الميدانية' : 'Site Visits & Field Activities Log'}</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isRTL ? `${data.activitiesList.length} نشاط مسجل` : `${data.activitiesList.length} Recorded Activities`}
                </span>
              </div>

              <div className="w-full overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-[11px] table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[16%]" />
                    <col className="w-[30%]" />
                    <col className="w-[20%]" />
                    <col className="w-[34%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-1.5 px-2 text-start">{isRTL ? 'التاريخ والوقت' : 'Date & Time'}</th>
                      <th className="py-1.5 px-2 text-start">{isRTL ? 'المشروع / العميل' : 'Project / Client'}</th>
                      <th className="py-1.5 px-2 text-start">{isRTL ? 'القناة والغرض' : 'Channel & Purpose'}</th>
                      <th className="py-1.5 px-2 text-start">{isRTL ? 'النتيجة والملاحظات' : 'Outcome & Notes'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.activitiesList.map((act, idx) => {
                      const channelInfo = CHANNEL_NAMES[act.channel];
                      const channelLabel = channelInfo ? (isRTL ? channelInfo.ar : channelInfo.en) : act.channel;
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-1.5 px-2 font-mono text-[10px] text-slate-600 align-top">
                            <div className="font-bold">{act.date}</div>
                            <div className="text-slate-400">{act.time}</div>
                          </td>
                          <td className="py-1.5 px-2 align-top">
                            <div className="font-bold text-slate-900 break-words">{act.projectName}</div>
                            <div className="text-[10px] text-slate-500 break-words">{act.companyName} {act.contactName ? `(${act.contactName})` : ''}</div>
                          </td>
                          <td className="py-1.5 px-2 align-top">
                            <div className="font-bold text-slate-700 break-words">{channelLabel}</div>
                            <div className="text-[10px] text-slate-500 break-words">{act.purpose}</div>
                          </td>
                          <td className="py-1.5 px-2 text-slate-700 align-top">
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-0.5">
                              {act.outcome || (isRTL ? 'منفذ' : 'Completed')}
                            </span>
                            <div className="text-[10px] text-slate-600 break-words whitespace-normal leading-relaxed">{act.notes || '-'}</div>
                            {act.nextAction && (
                              <div className="text-[9px] text-blue-700 font-semibold mt-0.5 break-words">
                                {isRTL ? `متابعة: ${act.nextAction}` : `Follow-up: ${act.nextAction}`}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ======================================================================= */}
          {/* ZERO SECTION NOTICE IF EVERYTHING IS EXCLUDED                           */}
          {/* ======================================================================= */}
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
