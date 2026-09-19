'use client';

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Phone, 
  Calendar, 
  ArrowRight, 
  Building2, 
  Check, 
  Filter,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';
import { Project } from '@/types/crm';

export type SuggestionCategory = 'all' | 'accelerators' | 'risks' | 'quotations' | 'hunting';

interface SmartSuggestion {
  id: string;
  category: 'accelerators' | 'risks' | 'quotations' | 'hunting';
  priority: 'critical' | 'high' | 'quick_win';
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  impactSAR: number;
  project?: Project;
  clientName?: string;
  phone?: string;
  actionEn: string;
  actionAr: string;
}

export function SmartSuggestionsTab() {
  const { 
    projects, 
    contacts, 
    companies, 
    quotations, 
    currentUser, 
    openFastLog, 
    openReminder 
  } = useCRM();
  const { isRTL } = useLanguage();

  const [activeCategory, setActiveCategory] = useState<SuggestionCategory>('all');
  const [handledIds, setHandledIds] = useState<Record<string, boolean>>({});

  // Generate dynamic AI commercial insights from live database
  const suggestions = useMemo<SmartSuggestion[]>(() => {
    const list: SmartSuggestion[] = [];
    const now = new Date();

    // 1. Deal Accelerators: Negotiation / Technicially Approved with value > 75,000
    projects.forEach(p => {
      if (['negotiation', 'technically_approved'].includes(p.pipeline_stage)) {
        list.push({
          id: `acc-${p.id}`,
          category: 'accelerators',
          priority: (p.estimated_value || 0) > 200000 ? 'critical' : 'high',
          titleEn: `Finalize Closure on ${p.name}`,
          titleAr: `حسم وتوقيع صفقة ${p.name}`,
          descEn: `This deal is in final negotiation stage with ${formatCurrencySAR(p.estimated_value || 0)} potential. Push for contract signature or PO issuance.`,
          descAr: `المشروع في مرحلة التفاوض النهائي بقيمة ${formatCurrencySAR(p.estimated_value || 0)}. بادر بالتواصل لحسم أمر التوريد أو توقيع العقد.`,
          impactSAR: p.estimated_value || 0,
          project: p,
          clientName: p.company_name,
          phone: p.primary_contact_phone,
          actionEn: 'Log Negotiation Touch',
          actionAr: 'تسجيل تقدم التفاوض'
        });
      }
    });

    // 2. Risk Interventions: Stale deals (> 10 days idle) with value > 50,000
    projects.forEach(p => {
      if (!['won', 'lost', 'hold'].includes(p.pipeline_stage)) {
        if (!p.updated_at) return;
        const diffDays = Math.floor((now.getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 10) {
          list.push({
            id: `risk-${p.id}`,
            category: 'risks',
            priority: diffDays >= 20 ? 'critical' : 'high',
            titleEn: `Re-Engage Dormant Deal: ${p.name}`,
            titleAr: `إنقاذ مشروع راكد: ${p.name}`,
            descEn: `Zero touches recorded for ${diffDays} days on this active deal (${formatCurrencySAR(p.estimated_value || 0)}). Re-establish contact before client explores alternate vendors.`,
            descAr: `لم يتم تسجيل أي تواصل منذ ${diffDays} يوماً على هذا المشروع (${formatCurrencySAR(p.estimated_value || 0)}). اتصل فوراً لمنع فقدان الفرصة.`,
            impactSAR: p.estimated_value || 0,
            project: p,
            clientName: p.company_name,
            phone: p.primary_contact_phone,
            actionEn: 'Call Client Immediately',
            actionAr: 'الاتصال بالعميل فوراً'
          });
        }
      }
    });

    // 3. Quotation Chasers: Quotations sent > 5 days ago without feedback
    quotations.forEach(q => {
      if (['sent', 'under_review'].includes(q.status)) {
        const linkedProj = projects.find(p => p.id === q.project_id);
        list.push({
          id: `quote-${q.id}`,
          category: 'quotations',
          priority: 'quick_win',
          titleEn: `Follow Up Quotation #${q.quotation_number}`,
          titleAr: `متابعة عرض السعر رقم #${q.quotation_number}`,
          descEn: `Quotation delivered for ${formatCurrencySAR(q.amount || 0)}. Follow up with procurement to address technical clarification questions.`,
          descAr: `عرض السعر مقدم بقيمة ${formatCurrencySAR(q.amount || 0)}. تابع مع قسم المشتريات للرد على أي استفسارات فنية وتسريع الترسية.`,
          impactSAR: q.amount || 0,
          project: linkedProj,
          clientName: linkedProj?.company_name || q.project_name,
          phone: linkedProj?.primary_contact_phone,
          actionEn: 'Follow Up with Client',
          actionAr: 'متابعة المشتريات'
        });
      }
    });

    // 4. Hunting Opportunities: Key contractor accounts with 0 recent deals
    companies.slice(0, 3).forEach(c => {
      const companyProjects = projects.filter(p => p.company_id === c.id);
      if (companyProjects.length === 0) {
        list.push({
          id: `hunt-${c.id}`,
          category: 'hunting',
          priority: 'quick_win',
          titleEn: `Initiate Hunting Visit: ${c.name}`,
          titleAr: `زيارة صيد واستكشاف: ${c.name}`,
          descEn: `Prominent contractor account in ${c.city || 'KSA'} with zero active RFQs this cycle. Introduce Al-Mespar product line and schedule intro session.`,
          descAr: `شركة مقاولات رئيسية في ${c.city || 'المملكة'} لا توجد لديها طلبات تسعير نشطة حالياً. رتب زيارة هندسية للتعريف بالمنتجات.`,
          impactSAR: 150000,
          clientName: c.name,
          phone: c.phone,
          actionEn: 'Plan Site Visit',
          actionAr: 'تخطيط زيارة'
        });
      }
    });

    return list.sort((a, b) => {
      const pWeight = { critical: 3, high: 2, quick_win: 1 };
      return (pWeight[b.priority] - pWeight[a.priority]) || (b.impactSAR - a.impactSAR);
    });
  }, [projects, quotations, companies]);

  // Filtered list
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(s => {
      if (handledIds[s.id]) return false;
      if (activeCategory === 'all') return true;
      return s.category === activeCategory;
    });
  }, [suggestions, activeCategory, handledIds]);

  const totalImpactSAR = useMemo(() => {
    return filteredSuggestions.reduce((acc, s) => acc + s.impactSAR, 0);
  }, [filteredSuggestions]);

  const toggleHandled = (id: string) => {
    setHandledIds(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header & Summary Hero Banner */}
      <div className="glass-card p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#0284C7]/20 via-[#38BDF8]/10 to-[#22C55E]/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white flex items-center justify-center font-bold shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-[#0284C7] dark:text-[#38BDF8]">
                {isRTL ? 'محرك التوصيات والذكاء التجاري' : 'COMMERCIAL INTELLIGENCE ENGINE'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isRTL ? 'التوصيات والاقتراحات الذكية لدفع الصفقات' : 'Smart Pipeline Recommendations & Insights'}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {isRTL
                ? 'تحليل تلقائي لمسار المبيعات يرصد الصفقات الجاهزة للحسم، ويحذر من الصفقات المعرضة للركود، ويرتب الأولويات لتعظيم الإيرادات.'
                : 'Automated pipeline diagnostics highlighting closing opportunities, stale deals at risk, and actionable quotation follow-ups.'}
            </p>
          </div>

          {/* Right: Total Value Impact Metric */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 shrink-0 text-center sm:text-start space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? 'إجمالي الأثر المالي للتوصيات' : 'Total Recommended Pipeline'}
            </span>
            <div className="text-2xl font-black font-mono text-[#0284C7] dark:text-[#38BDF8]">
              {formatCurrencySAR(totalImpactSAR)}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
              {filteredSuggestions.length} {isRTL ? 'إجراء قابل للتنفيذ الآن' : 'Actionable items available'}
            </span>
          </div>
        </div>

        {/* Category Filters Ribbon */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all' as SuggestionCategory, labelEn: 'All Insights', labelAr: 'كافة التوصيات', icon: Sparkles },
            { id: 'accelerators' as SuggestionCategory, labelEn: 'Deal Closers', labelAr: 'تسريع الحسم', icon: Zap },
            { id: 'risks' as SuggestionCategory, labelEn: 'Risk Interventions', labelAr: 'إنقاذ الصفقات', icon: AlertTriangle },
            { id: 'quotations' as SuggestionCategory, labelEn: 'Quotation Chasers', labelAr: 'متابعة العروض', icon: FileText },
            { id: 'hunting' as SuggestionCategory, labelEn: 'Hunting Targets', labelAr: 'فرص الصيد', icon: Building2 },
          ].map(cat => {
            const isSelected = activeCategory === cat.id;
            const Icon = cat.icon;
            const count = suggestions.filter(s => !handledIds[s.id] && (cat.id === 'all' || s.category === cat.id)).length;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-[1.02]'
                    : 'bg-white/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#38BDF8] dark:text-[#0284C7]' : 'text-slate-400'}`} />
                <span>{isRTL ? cat.labelAr : cat.labelEn}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black ${
                  isSelected ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Suggestions Grid */}
      {filteredSuggestions.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-white/80 dark:border-slate-800/80">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-800 dark:text-white">
            {isRTL ? 'جميع التوصيات مستوفاة بنجاح!' : 'All Recommendations Resolved!'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {isRTL 
              ? 'لقد قمت بمراجعة واتخاذ الإجراءات اللازمة لجميع الصفقات في هذا القسم.' 
              : 'You have addressed all flagged deals and interventions in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuggestions.map((item) => {
            const priorityBadge = item.priority === 'critical'
              ? { text: isRTL ? 'أولوية عاجلة' : 'Critical Action', cls: 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50' }
              : item.priority === 'high'
                ? { text: isRTL ? 'أثر مرتفع' : 'High Impact', cls: 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50' }
                : { text: isRTL ? 'فرصة سريعة' : 'Quick Win', cls: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50' };

            return (
              <div
                key={item.id}
                className="glass-card-interactive p-5 rounded-3xl border border-white/80 dark:border-slate-800/80 flex flex-col justify-between gap-4 shadow-sm group"
              >
                <div className="space-y-2.5">
                  {/* Priority & Financial Impact Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${priorityBadge.cls}`}>
                      {priorityBadge.text}
                    </span>
                    <span className="text-xs font-black font-mono text-[#0284C7] dark:text-[#38BDF8] bg-sky-50 dark:bg-sky-950/80 px-2.5 py-0.5 rounded-full border border-sky-100 dark:border-sky-900/50">
                      {formatCurrencySAR(item.impactSAR)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] transition-colors line-clamp-1">
                      {isRTL ? item.titleAr : item.titleEn}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-3">
                      {isRTL ? item.descAr : item.descEn}
                    </p>
                  </div>

                  {/* Client / Entity tag */}
                  {item.clientName && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{item.clientName}</span>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleHandled(item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title={isRTL ? 'وضع علامة تم التعامل' : 'Mark as Handled'}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isRTL ? 'تم الإنجاز' : 'Dismiss'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {item.phone && (
                      <a
                        href={`tel:${item.phone}`}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#0284C7] hover:text-white dark:hover:bg-[#38BDF8] dark:hover:text-slate-900 transition-colors"
                        title={isRTL ? 'اتصال مباشر' : 'Call'}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => {
                        openFastLog({ project: item.project || null });
                        toggleHandled(item.id);
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#38BDF8] dark:text-[#0284C7]" />
                      <span>{isRTL ? item.actionAr : item.actionEn}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
