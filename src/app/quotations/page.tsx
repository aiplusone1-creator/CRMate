'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Briefcase, 
  Tag, 
  Calendar, 
  TrendingDown, 
  TrendingUp, 
  ShieldCheck, 
  Printer, 
  Eye, 
  Layers, 
  Clock, 
  ChevronRight, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowUpDown, 
  Download, 
  X,
  User,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { useSalesScope } from '@/lib/hooks/useSalesScope';
import { useLanguage } from '@/lib/i18n/language-context';
import { Project, Quotation, QuotationStatus, Company, Contact, OpportunityType } from '@/types/crm';
import { formatCurrencySAR, formatDateString, cn } from '@/lib/utils';
import { 
  formatCompactSAR, 
  calculateDifference, 
  calculateReductionSummary 
} from '@/lib/logic/quotation-pricing';
import { QuotationDetailModal } from '@/components/quotations/quotation-detail-modal';
import { QuotationComparisonModal } from '@/components/quotations/quotation-comparison-modal';
import { AddQuotationModal } from '@/components/modals/add-quotation-modal';
import { QuotationPrintModal } from '@/components/modals/quotation-print-modal';

function QuotationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    quotations, 
    projects, 
    companies, 
    contacts, 
    teamMembers, 
    currentUser, 
    currentRole,
    deleteQuotation 
  } = useCRM();
  const { scopedProjects, isViewer } = useSalesScope();
  const canEdit = !isViewer;
  const { language, isRTL } = useLanguage();

  // Active view tab: 'official' (explicit quotation documents) vs 'pipeline' (projects in quotation stages)
  const [activeTab, setActiveTabState] = useState<'official' | 'pipeline'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('al_mespar_quotations_tab');
      if (saved === 'official' || saved === 'pipeline') return saved;
    }
    return 'official';
  });
  const setActiveTab = React.useCallback((tab: 'official' | 'pipeline') => {
    setActiveTabState(tab);
    try { sessionStorage.setItem('al_mespar_quotations_tab', tab); } catch {}
  }, []);

  // Search & Filter state
  const [searchTerm, setSearchTermState] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('al_mespar_quotations_search') || '';
    }
    return '';
  });
  const setSearchTerm = React.useCallback((term: string) => {
    setSearchTermState(term);
    try { sessionStorage.setItem('al_mespar_quotations_search', term); } catch {}
  }, []);

  const [selectedStatus, setSelectedStatusState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('al_mespar_quotations_status') || 'all';
    }
    return 'all';
  });
  const setSelectedStatus = React.useCallback((s: string) => {
    setSelectedStatusState(s);
    try { sessionStorage.setItem('al_mespar_quotations_status', s); } catch {}
  }, []);

  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'value_desc' | 'value_asc'>('date_desc');

  // Modal states
  const [selectedQuoteForDetail, setSelectedQuoteForDetail] = useState<Quotation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedQuoteForPrint, setSelectedQuoteForPrint] = useState<Quotation | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [selectedProjectForComparison, setSelectedProjectForComparison] = useState<string | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // Add / Edit / Revision Quotation Modal State
  const [isAddQuoteModalOpen, setIsAddQuoteModalOpen] = useState(false);
  const [targetProjectForQuote, setTargetProjectForQuote] = useState<Project | null>(null);
  const [quoteModalMode, setQuoteModalMode] = useState<'new' | 'revision' | 'edit'>('new');
  const [parentQuoteForRevision, setParentQuoteForRevision] = useState<Quotation | null>(null);
  const [quoteToEdit, setQuoteToEdit] = useState<Quotation | null>(null);

  // Project selector modal when clicking "+ Add Quotation" from global page
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');

  // Map of project IDs to projects for quick lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach(p => map.set(p.id, p));
    return map;
  }, [projects]);

  // Map of company IDs to companies
  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    companies.forEach(c => map.set(c.id, c));
    return map;
  }, [companies]);

  // Set of scoped project IDs
  const scopedProjectIds = useMemo(() => {
    return new Set(scopedProjects.map(p => p.id));
  }, [scopedProjects]);

  // Filter scoped quotations (exclude archived)
  const scopedQuotations = useMemo(() => {
    return quotations.filter(q => {
      if (q.is_archived) return false;
      // Allow if project is in scoped projects, or if user is owner/creator
      if (scopedProjectIds.has(q.project_id)) return true;
      if (currentUser && q.created_by === currentUser.id) return true;
      // Admin/manager can see all
      if (currentRole === 'admin' || currentRole === 'sales_manager') return true;
      return false;
    });
  }, [quotations, scopedProjectIds, currentUser, currentRole]);

  // Quotation stage projects (matching Dashboard KPI criteria)
  const quotationPipelineProjects = useMemo(() => {
    return scopedProjects.filter(p => 
      ['quotation_sent', 'technical_submission', 'technically_approved', 'negotiation'].includes(p.pipeline_stage)
    );
  }, [scopedProjects]);

  // KPI Calculations (100% matched with Dashboard KPI 3 logic)
  const kpiMetrics = useMemo(() => {
    let totalQuotationValue = 0;
    let activeQuotesCount = 0;
    let wonQuotesValue = 0;
    let wonQuotesCount = 0;

    scopedProjects.forEach(p => {
      if (p.pipeline_stage === 'lost') return;

      const pQuotes = quotations
        .filter(q => q.project_id === p.id && !q.is_archived)
        .sort((a, b) => b.version - a.version);

      if (p.pipeline_stage === 'won') {
        const wonVal = p.final_won_value || (pQuotes.length > 0 && pQuotes[0].amount > 0 ? pQuotes[0].amount : (p.estimated_value || 0));
        wonQuotesValue += wonVal;
        wonQuotesCount += 1;
        return;
      }

      if (pQuotes.length > 0 && pQuotes[0].amount > 0) {
        totalQuotationValue += pQuotes[0].amount;
        activeQuotesCount += 1;
      } else if (['quotation_sent', 'technical_submission', 'technically_approved', 'negotiation'].includes(p.pipeline_stage)) {
        totalQuotationValue += (p.estimated_value || 0);
        activeQuotesCount += 1;
      }
    });

    const avgQuoteValue = activeQuotesCount > 0 ? Math.round(totalQuotationValue / activeQuotesCount) : 0;

    return {
      totalQuotationValue,
      activeQuotesCount,
      wonQuotesValue,
      wonQuotesCount,
      avgQuoteValue,
      officialDocumentsCount: scopedQuotations.length
    };
  }, [scopedProjects, quotations, scopedQuotations]);

  // Available brands for filtering
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    scopedQuotations.forEach(q => {
      if (q.vendor_brand?.trim()) {
        brands.add(q.vendor_brand.trim());
      }
    });
    return Array.from(brands);
  }, [scopedQuotations]);

  // Filtered & Sorted Quotations
  const filteredQuotations = useMemo(() => {
    return scopedQuotations.filter(q => {
      const proj = projectMap.get(q.project_id);
      const comp = proj?.company_id ? companyMap.get(proj.company_id) : null;

      // Status filter
      if (selectedStatus !== 'all' && q.status !== selectedStatus) {
        return false;
      }

      // Brand filter
      if (selectedBrand !== 'all' && q.vendor_brand !== selectedBrand) {
        return false;
      }

      // Owner filter
      if (selectedOwner !== 'all') {
        if (proj?.owner_id !== selectedOwner && proj?.owner_name !== selectedOwner && q.created_by !== selectedOwner) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesNum = q.quotation_number.toLowerCase().includes(query);
        const matchesProj = (q.project_name || proj?.name || '').toLowerCase().includes(query);
        const matchesComp = (comp?.name || proj?.company_name || '').toLowerCase().includes(query);
        const matchesBrand = (q.vendor_brand || '').toLowerCase().includes(query);
        const matchesNotes = (q.notes || '').toLowerCase().includes(query);
        const matchesRef = (q.customer_reference || q.rfq_number || '').toLowerCase().includes(query);

        if (!matchesNum && !matchesProj && !matchesComp && !matchesBrand && !matchesNotes && !matchesRef) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        const dateA = a.quotation_date || a.sent_date || a.created_at;
        const dateB = b.quotation_date || b.sent_date || b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
      if (sortBy === 'date_asc') {
        const dateA = a.quotation_date || a.sent_date || a.created_at;
        const dateB = b.quotation_date || b.sent_date || b.created_at;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      }
      if (sortBy === 'value_desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'value_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [scopedQuotations, selectedStatus, selectedBrand, selectedOwner, searchTerm, sortBy, projectMap, companyMap]);

  // Deep linking and query parameters handling
  useEffect(() => {
    if (!searchParams) return;

    const action = searchParams.get('action');
    const projectId = searchParams.get('project_id');
    const quoteId = searchParams.get('quote_id');
    const search = searchParams.get('search');

    if (search) {
      setSearchTerm(search);
    }

    if (projectId) {
      const foundProject = projects.find(p => p.id === projectId);
      if (foundProject) {
        setTargetProjectForQuote(foundProject);
        setQuoteModalMode('new');
        setParentQuoteForRevision(null);
        setQuoteToEdit(null);
        setIsAddQuoteModalOpen(true);
      }
    } else if (action === 'new') {
      setIsProjectSelectorOpen(true);
    }

    if (quoteId) {
      const foundQuote = quotations.find(q => q.id === quoteId);
      if (foundQuote) {
        setSelectedQuoteForDetail(foundQuote);
        setIsDetailModalOpen(true);
      }
    }
  }, [searchParams, projects, quotations]);

  // Helper to open project selector modal
  const handleOpenAddQuotation = () => {
    setIsProjectSelectorOpen(true);
  };

  // Helper when a project is chosen from selector
  const handleSelectProjectForNewQuote = (proj: Project) => {
    setIsProjectSelectorOpen(false);
    setTargetProjectForQuote(proj);
    setQuoteModalMode('new');
    setParentQuoteForRevision(null);
    setQuoteToEdit(null);
    setIsAddQuoteModalOpen(true);
  };

  // Open Revision modal for a quotation
  const handleOpenRevision = (parentQuote: Quotation) => {
    const proj = projectMap.get(parentQuote.project_id) || ({
      id: parentQuote.project_id,
      pr_number: 'PR-AUTO',
      name: parentQuote.project_name || 'Al-Mespar Project',
      company_id: '',
      location: 'Jeddah',
      opportunity_type: 'in_hand' as OpportunityType,
      pipeline_stage: 'quotation_sent',
      priority: 'medium',
      estimated_value: parentQuote.amount,
      probability: 70,
      weighted_value: parentQuote.amount * 0.7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as unknown as Project);

    setTargetProjectForQuote(proj);
    setQuoteModalMode('revision');
    setParentQuoteForRevision(parentQuote);
    setQuoteToEdit(null);
    setIsDetailModalOpen(false);
    setIsAddQuoteModalOpen(true);
  };

  // Open Edit modal for a quotation
  const handleOpenEdit = (quote: Quotation) => {
    const proj = projectMap.get(quote.project_id) || ({
      id: quote.project_id,
      pr_number: 'PR-AUTO',
      name: quote.project_name || 'Al-Mespar Project',
      company_id: '',
      location: 'Jeddah',
      opportunity_type: 'in_hand' as OpportunityType,
      pipeline_stage: 'quotation_sent',
      priority: 'medium',
      estimated_value: quote.amount,
      probability: 70,
      weighted_value: quote.amount * 0.7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as unknown as Project);

    setTargetProjectForQuote(proj);
    setQuoteModalMode('edit');
    setParentQuoteForRevision(null);
    setQuoteToEdit(quote);
    setIsDetailModalOpen(false);
    setIsAddQuoteModalOpen(true);
  };

  // Open Comparison Modal
  const handleOpenComparison = (projectId: string) => {
    setSelectedProjectForComparison(projectId);
    setIsComparisonModalOpen(true);
  };

  // Open Print Modal
  const handleOpenPrint = (quote: Quotation) => {
    setSelectedQuoteForPrint(quote);
    setIsPrintModalOpen(true);
  };

  // Export Quotations to CSV / Excel
  const handleExportCSV = () => {
    const headers = [
      'Quotation Number',
      'Version',
      'Project Name',
      'Client / Company',
      'Vendor / Brand',
      'Amount (SAR)',
      'Status',
      'Quotation Date',
      'Valid Until',
      'Sales Rep'
    ];

    const rows = filteredQuotations.map(q => {
      const proj = projectMap.get(q.project_id);
      const comp = proj?.company_id ? companyMap.get(proj.company_id) : null;
      return [
        `"${q.quotation_number || ''}"`,
        `"V${q.version}"`,
        `"${(q.project_name || proj?.name || '').replace(/"/g, '""')}"`,
        `"${(comp?.name || proj?.company_name || '').replace(/"/g, '""')}"`,
        `"${(q.vendor_brand || '').replace(/"/g, '""')}"`,
        q.amount,
        `"${q.status}"`,
        `"${q.quotation_date || q.sent_date || ''}"`,
        `"${q.valid_until || ''}"`,
        `"${(proj?.owner_name || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Al-Mespar-Quotations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: QuotationStatus) => {
    const config: Record<QuotationStatus, { bg: string; text: string; border: string; labelEn: string; labelAr: string }> = {
      draft: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700', labelEn: 'Draft', labelAr: 'مسودة' },
      internal_review: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-800', labelEn: 'Internal Review', labelAr: 'مراجعة داخلية' },
      under_review: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-800', labelEn: 'Under Review', labelAr: 'قيد المراجعة' },
      sent: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-800', labelEn: 'Sent', labelAr: 'مرسل' },
      submitted: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-800', labelEn: 'Submitted', labelAr: 'مرسل للعميل' },
      revised: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-800', labelEn: 'Revised', labelAr: 'معدل / نسخة جديدة' },
      negotiation: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-300 dark:border-indigo-800', labelEn: 'Negotiation', labelAr: 'قيد التفاوض' },
      accepted: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-800', labelEn: 'Accepted', labelAr: 'مقبول' },
      approved: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-800', labelEn: 'Approved', labelAr: 'معتمد' },
      rejected: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-300 dark:border-rose-800', labelEn: 'Rejected', labelAr: 'مرفوض' },
      expired: { bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-700', labelEn: 'Expired', labelAr: 'منتهي الصلاحية' },
      cancelled: { bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-700', labelEn: 'Cancelled', labelAr: 'ملغي' }
    };

    const s = config[status] || config.draft;
    return (
      <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 shrink-0', s.bg, s.text, s.border)}>
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
        <span>{isRTL ? s.labelAr : s.labelEn}</span>
      </span>
    );
  };

  // Helper for project lookup for comparison modal
  const comparisonQuotations = useMemo(() => {
    if (!selectedProjectForComparison) return [];
    return quotations
      .filter(q => q.project_id === selectedProjectForComparison && !q.is_archived)
      .sort((a, b) => a.version - b.version);
  }, [quotations, selectedProjectForComparison]);

  const comparisonProject = useMemo(() => {
    if (!selectedProjectForComparison) return null;
    return projectMap.get(selectedProjectForComparison) || null;
  }, [selectedProjectForComparison, projectMap]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
      {/* ========================================================= */}
      {/* 1. PAGE HEADER */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 crm-card p-3 sm:p-4 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] border border-[#8FC2F0]/30 flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#292D32] dark:text-[#8FC2F0]" />
              <span>{isRTL ? 'إدارة العروض التجارية' : 'Commercial Proposals Hub'}</span>
            </span>
            <span className="text-[10.5px] text-slate-400 font-bold">
              {isRTL ? 'المملكة العربية السعودية • الأسعار بالريال السعودي' : 'Saudi Arabia • Currency in SAR'}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[#292D32] dark:text-white tracking-tight">
            {isRTL ? 'عروض الأسعار والمقترحات الفنية' : 'Commercial Quotations & Bids'}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {isRTL 
              ? `إدارة شاملة لجميع العروض التجارية، مقارنة الإصدارات، وتتبع القرارات ومذكرات الخصم (${kpiMetrics.activeQuotesCount} عروض نشطة)`
              : `Comprehensive control of quotation versions, price negotiations, margin approvals, and printing (${kpiMetrics.activeQuotesCount} active proposals)`}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C2130] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title={isRTL ? 'تصدير إكسيل' : 'Export Excel / CSV'}
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isRTL ? 'تصدير كشف العروض' : 'Export Sheet'}</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenAddQuotation}
              className="crm-pill-dark flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-2xs transition-all cursor-pointer group"
            >
              <Plus className="w-3.5 h-3.5 text-[#8FC2F0] group-hover:rotate-90 transition-transform" />
              <span>{isRTL ? '+ عرض سعر جديد' : '+ New Quotation'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TOP KPI CARDS (Matching Dashboard KPI 3 Seamlessly) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* KPI 1: Total Quotations Value */}
        <div className="crm-card p-3 sm:p-3.5 rounded-xl flex flex-col justify-between shadow-2xs border-blue-500/20">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span>{isRTL ? 'قيمة العروض النشطة' : 'Active Quotation Value'}</span>
            <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-[#0088FF]">
              <FileText className="w-3.5 h-3.5 text-[#0088FF]" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#292D32] dark:text-white tracking-tight">
            {formatCompactSAR(kpiMetrics.totalQuotationValue)}
          </div>
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-bold">{isRTL ? 'إجمالي المقترحات المتداولة' : 'In negotiation/submission'}</span>
            <span className="font-bold text-blue-600 font-mono">{kpiMetrics.activeQuotesCount} {isRTL ? 'مشروع' : 'deals'}</span>
          </div>
        </div>

        {/* KPI 2: Active Quotes Count */}
        <div className="crm-card p-3 sm:p-3.5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span>{isRTL ? 'العروض النشطة والمستندات' : 'Active Quotes & Docs'}</span>
            <div className="w-7 h-7 rounded-full bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600">
              <Layers className="w-3.5 h-3.5 text-cyan-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#292D32] dark:text-white tracking-tight">
            {kpiMetrics.activeQuotesCount}
          </div>
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-bold">{isRTL ? 'المستندات الرسمية المسجلة' : 'Registered Revisions'}</span>
            <span className="font-bold text-cyan-600 font-mono">{kpiMetrics.officialDocumentsCount} {isRTL ? 'إصدار' : 'versions'}</span>
          </div>
        </div>

        {/* KPI 3: Won Deals Value */}
        <div className="crm-card p-3 sm:p-3.5 rounded-xl flex flex-col justify-between shadow-2xs border-emerald-500/20">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span>{isRTL ? 'العروض الفائزة المعتمدة' : 'Won Quotations Value'}</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#292D32] dark:text-white tracking-tight">
            {formatCompactSAR(kpiMetrics.wonQuotesValue)}
          </div>
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-bold">{isRTL ? 'عقود تم توقيعها بنجاح' : 'Closed & Awarded'}</span>
            <span className="font-bold text-emerald-600 font-mono">{kpiMetrics.wonQuotesCount} {isRTL ? 'صفقة' : 'deals'}</span>
          </div>
        </div>

        {/* KPI 4: Average Deal Size */}
        <div className="crm-card p-3 sm:p-3.5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span>{isRTL ? 'متوسط قيمة العرض' : 'Average Deal Size'}</span>
            <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#292D32] dark:text-white tracking-tight">
            {formatCompactSAR(kpiMetrics.avgQuoteValue)}
          </div>
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-bold">{isRTL ? 'لكل مشروع متداول' : 'Per active negotiation'}</span>
            <span className="font-bold text-amber-600 font-mono">SAR</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. TABS SELECTOR & FILTERS */}
      {/* ========================================================= */}
      <div className="crm-card p-3 rounded-xl shadow-2xs space-y-3">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('official')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer',
                activeTab === 'official'
                  ? 'bg-white dark:bg-[#1C2130] text-[#0088FF] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isRTL ? 'سجل عروض الأسعار الرسمية' : 'Official Quotation Documents'}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-[10px] font-mono font-bold">
                {scopedQuotations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pipeline')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer',
                activeTab === 'pipeline'
                  ? 'bg-white dark:bg-[#1C2130] text-[#0088FF] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{isRTL ? 'مشاريع قيد التسعير والمتابعة' : 'Pipeline Projects in Quotation'}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold">
                {quotationPipelineProjects.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-bold hidden md:block">
            {activeTab === 'official' 
              ? (isRTL ? `عرض ${filteredQuotations.length} من إجمالي ${scopedQuotations.length} عرض سعر مسجل` : `Showing ${filteredQuotations.length} of ${scopedQuotations.length} quotations`)
              : (isRTL ? `عرض ${quotationPipelineProjects.length} مشروع في مرحلة تقديم العروض` : `Showing ${quotationPipelineProjects.length} projects in quotation stages`)}
          </div>
        </div>

        {/* Filters Bar (When in Official Tab) */}
        {activeTab === 'official' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-1">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className={cn("w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2", isRTL ? "right-3" : "left-3")} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isRTL ? "بحث برقم العرض، المشروع، العميل، الماركة..." : "Search quotation #, project, client, brand..."}
                className={cn(
                  "w-full text-xs bg-slate-50 dark:bg-[#141820]/60 border border-slate-200 dark:border-slate-800 rounded-lg py-2 focus:outline-none focus:ring-1 focus:ring-blue-500",
                  isRTL ? "pr-9 pl-8" : "pl-9 pr-8"
                )}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600", isRTL ? "left-2.5" : "right-2.5")}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-[#141820]/60 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
              >
                <option value="all">{isRTL ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="draft">{isRTL ? 'مسودة (Draft)' : 'Draft'}</option>
                <option value="internal_review">{isRTL ? 'مراجعة داخلية' : 'Internal Review'}</option>
                <option value="under_review">{isRTL ? 'قيد المراجعة' : 'Under Review'}</option>
                <option value="submitted">{isRTL ? 'مرسل للعميل' : 'Submitted'}</option>
                <option value="revised">{isRTL ? 'معدل (Revised)' : 'Revised'}</option>
                <option value="approved">{isRTL ? 'معتمد (Approved)' : 'Approved'}</option>
                <option value="won">{isRTL ? 'صفقة رابحة (Won)' : 'Won'}</option>
                <option value="rejected">{isRTL ? 'مرفوض (Rejected)' : 'Rejected'}</option>
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-[#141820]/60 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
              >
                <option value="all">{isRTL ? 'جميع الماركات / الموردين' : 'All Brands / Vendors'}</option>
                {availableBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full text-xs bg-slate-50 dark:bg-[#141820]/60 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
              >
                <option value="date_desc">{isRTL ? 'الأحدث تاريخاً' : 'Latest Date'}</option>
                <option value="date_asc">{isRTL ? 'الأقدم تاريخاً' : 'Oldest Date'}</option>
                <option value="value_desc">{isRTL ? 'الأعلى قيمة مالية' : 'Highest Value'}</option>
                <option value="value_asc">{isRTL ? 'الأقل قيمة مالية' : 'Lowest Value'}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. TAB 1: OFFICIAL QUOTATIONS TABLE */}
      {/* ========================================================= */}
      {activeTab === 'official' && (
        <div className="crm-card rounded-xl shadow-2xs overflow-hidden">
          {filteredQuotations.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0088FF] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-black text-sm text-[#292D32] dark:text-white">
                {isRTL ? 'لم يتم العثور على أي عروض أسعار تطابق البحث' : 'No quotations found matching criteria'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {isRTL 
                  ? 'يمكنك تغيير فلاتر البحث أو إنشاء عرض سعر رسمي جديد لأحد المشاريع النشطة'
                  : 'Try clearing your filters or create a new quotation for one of your active projects.'}
              </p>
              {canEdit && (
                <button
                  onClick={handleOpenAddQuotation}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#0088FF] hover:bg-[#0077E6] text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'إنشاء أول عرض سعر' : 'Create First Quotation'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-[#141820]/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className={cn("py-3 px-3.5", isRTL ? "text-right" : "text-left")}>{isRTL ? 'رقم العرض / الإصدار' : 'Quotation # / Rev'}</th>
                    <th className={cn("py-3 px-3", isRTL ? "text-right" : "text-left")}>{isRTL ? 'المشروع والعميل' : 'Project & Client'}</th>
                    <th className={cn("py-3 px-3", isRTL ? "text-right" : "text-left")}>{isRTL ? 'الماركة والمعدات' : 'Brand / Package'}</th>
                    <th className={cn("py-3 px-3", isRTL ? "text-right" : "text-left")}>{isRTL ? 'القيمة التجارية (ر.س)' : 'Amount (SAR)'}</th>
                    <th className={cn("py-3 px-3", isRTL ? "text-right" : "text-left")}>{isRTL ? 'الحالة' : 'Status'}</th>
                    <th className={cn("py-3 px-3", isRTL ? "text-right" : "text-left")}>{isRTL ? 'التاريخ والصلاحية' : 'Date / Expiry'}</th>
                    <th className="py-3 px-3.5 text-center">{isRTL ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-sans">
                  {filteredQuotations.map((quote) => {
                    const project = projectMap.get(quote.project_id);
                    const company = project?.company_id ? companyMap.get(project.company_id) : null;
                    const dateDisplay = quote.quotation_date || quote.sent_date || quote.created_at;

                    // Check if multiple versions exist for this project to show comparison button
                    const projectQuotesCount = quotations.filter(q => q.project_id === quote.project_id && !q.is_archived).length;

                    return (
                      <tr 
                        key={quote.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Quotation Number & Version Badge */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#292D32] dark:text-white">
                              {quote.quotation_number}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded font-mono font-black text-[10px] shrink-0 border",
                              quote.version > 1 
                                ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" 
                                : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                            )}>
                              V{quote.version}
                            </span>
                          </div>
                          {quote.revision_reason && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5" title={quote.revision_reason}>
                              {quote.revision_reason}
                            </div>
                          )}
                        </td>

                        {/* Project & Client */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#292D32] dark:text-white hover:text-blue-600 transition-colors">
                            {project ? (
                              <Link href={`/projects/${project.id}`} className="hover:underline flex items-center gap-1">
                                <span className="truncate max-w-[220px]">{project.name}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500 shrink-0" />
                              </Link>
                            ) : (
                              <span className="truncate max-w-[220px]">{quote.project_name || 'Project'}</span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{company?.name || project?.company_name || isRTL ? 'العميل غير محدد' : 'Client unassigned'}</span>
                          </div>
                        </td>

                        {/* Brand / Vendor */}
                        <td className="py-3 px-3">
                          {quote.vendor_brand ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10.5px] font-bold border border-slate-200 dark:border-slate-700 truncate inline-block max-w-[160px]">
                              {quote.vendor_brand}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3">
                          <div className="font-mono font-black text-xs sm:text-sm text-[#292D32] dark:text-white">
                            {formatCurrencySAR(quote.amount)}
                          </div>
                          {quote.discount_amount && quote.discount_amount > 0 ? (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
                              <TrendingDown className="w-3 h-3" />
                              <span>{isRTL ? 'خصم:' : 'Discount:'} {formatCurrencySAR(quote.discount_amount)}</span>
                            </div>
                          ) : null}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {renderStatusBadge(quote.status)}
                        </td>

                        {/* Date & Validity */}
                        <td className="py-3 px-3">
                          <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            {dateDisplay ? formatDateString(dateDisplay) : '-'}
                          </div>
                          {quote.valid_until && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {isRTL ? 'صالح حتى:' : 'Valid:'} {quote.valid_until}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* View Details */}
                            <button
                              onClick={() => {
                                setSelectedQuoteForDetail(quote);
                                setIsDetailModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                              title={isRTL ? 'عرض تفاصيل العرض' : 'View Details'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Compare Versions if project has multiple quotes */}
                            {projectQuotesCount > 1 && (
                              <button
                                onClick={() => handleOpenComparison(quote.project_id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                                title={isRTL ? 'مقارنة إصدارات العرض' : 'Compare Revisions'}
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Print / Export */}
                            <button
                              onClick={() => handleOpenPrint(quote)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                              title={isRTL ? 'طباعة العرض الرسمي' : 'Print Official Sheet'}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Create Revision (if authorized) */}
                            {canEdit && (
                              <button
                                onClick={() => handleOpenRevision(quote)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                                title={isRTL ? 'إصدار مراجعة جديدة' : 'Create New Revision'}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Project Cockpit Link */}
                            {project && (
                              <Link
                                href={`/projects/${project.id}`}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#0088FF] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title={isRTL ? 'فتح كابينة المشروع' : 'Open Project Cockpit'}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TAB 2: PIPELINE PROJECTS IN QUOTATION STAGE */}
      {/* ========================================================= */}
      {activeTab === 'pipeline' && (
        <div className="crm-card rounded-xl shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                  {isRTL ? 'المشاريع الجارية في مراحل عروض الأسعار والتفاوض' : 'Active Deals in Quotation Pipeline'}
                </span>
                <span className="text-[10.5px] text-slate-500 block">
                  {isRTL 
                    ? 'هذه المشاريع تحتسب قيمتها التقديرية في كارت Quotation Value بالداشبورد ويمكن إصدار عروض رسمية لها فوراً'
                    : 'These projects contribute to the Dashboard Quotation Value KPI and can have formal quotation documents generated immediately.'}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white dark:bg-[#1C2130] font-mono text-xs font-black text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
              {quotationPipelineProjects.length} {isRTL ? 'مشروع' : 'projects'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#141820]/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className={cn("py-3 px-3.5", isRTL ? "text-right" : "text-left")}>{isRTL ? 'رقم PR / اسم المشروع' : 'PR# / Project Name'}</th>
                  <th className={cn("py-3 px-3", isRTL ? "text-right" : "text-left")}>{isRTL ? 'العميل والمدينة' : 'Client & City'}</th>
                  <th className={cn("py-3 px-3", isRTL ? "text-right" : "text-left")}>{isRTL ? 'المرحلة الحالية' : 'Pipeline Stage'}</th>
                  <th className={cn("py-3 px-3", isRTL ? "text-right" : "text-left")}>{isRTL ? 'القيمة التقديرية (ر.س)' : 'Est. Value (SAR)'}</th>
                  <th className={cn("py-3 px-3", isRTL ? "text-right" : "text-left")}>{isRTL ? 'حالة مستند العرض' : 'Quotation Document'}</th>
                  <th className={cn("py-3 px-3", isRTL ? "text-right" : "text-left")}>{isRTL ? 'المسؤول' : 'Owner'}</th>
                  <th className="py-3 px-3.5 text-center">{isRTL ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-sans">
                {quotationPipelineProjects.map((project) => {
                  const company = project.company_id ? companyMap.get(project.company_id) : null;
                  const projectQuotes = quotations
                    .filter(q => q.project_id === project.id && !q.is_archived)
                    .sort((a, b) => b.version - a.version);
                  const hasOfficialQuote = projectQuotes.length > 0;
                  const latestQuote = hasOfficialQuote ? projectQuotes[0] : null;

                  return (
                    <tr 
                      key={project.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Project PR & Name */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {project.pr_number || 'PR-N/A'}
                          </span>
                          <Link 
                            href={`/projects/${project.id}`} 
                            className="font-bold text-[#292D32] dark:text-white hover:text-blue-600 transition-colors truncate max-w-[220px]"
                          >
                            {project.name}
                          </Link>
                        </div>
                      </td>

                      {/* Client & City */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                          {company?.name || project.company_name || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {project.location || 'Saudi Arabia'}
                        </div>
                      </td>

                      {/* Pipeline Stage */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          {project.pipeline_stage === 'quotation_sent' && (isRTL ? 'عرض سعر مرسل' : 'Quotation Sent')}
                          {project.pipeline_stage === 'technical_submission' && (isRTL ? 'تقديم فني' : 'Technical Submission')}
                          {project.pipeline_stage === 'technically_approved' && (isRTL ? 'معتمد فنياً' : 'Technically Approved')}
                          {project.pipeline_stage === 'negotiation' && (isRTL ? 'تفاوض نهائي' : 'Negotiation')}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="py-3 px-3 font-mono font-black text-xs text-[#292D32] dark:text-white">
                        {latestQuote ? formatCurrencySAR(latestQuote.amount) : formatCurrencySAR(project.estimated_value || 0)}
                      </td>

                      {/* Quotation Document Status */}
                      <td className="py-3 px-3">
                        {hasOfficialQuote && latestQuote ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              <span>{latestQuote.quotation_number} (V{latestQuote.version})</span>
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            {isRTL ? 'يحتاج إصدار مستند' : 'No document created'}
                          </span>
                        )}
                      </td>

                      {/* Owner */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px] font-bold">
                        {project.owner_name || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => {
                                setTargetProjectForQuote(project);
                                setQuoteModalMode(hasOfficialQuote ? 'revision' : 'new');
                                setParentQuoteForRevision(latestQuote);
                                setQuoteToEdit(null);
                                setIsAddQuoteModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200/80 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{hasOfficialQuote ? (isRTL ? 'مراجعة جديدة' : 'New Rev') : (isRTL ? 'إصدار عرض' : 'Create Quote')}</span>
                            </button>
                          )}

                          <Link
                            href={`/projects/${project.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={isRTL ? 'فتح كابينة المشروع' : 'Open Cockpit'}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODALS */}
      {/* ========================================================= */}

      {/* Project Selector Modal when "+ Add Quotation" is clicked */}
      {isProjectSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-[#1C2130] rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#292D32] dark:text-white">
                    {isRTL ? 'اختر المشروع لإنشاء عرض السعر' : 'Select Project for Quotation'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isRTL ? 'حدد المشروع الذي ترغب في ربط عرض السعر التجاري به' : 'Select an active project to associate with this commercial quotation.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsProjectSelectorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector Search */}
            <div className="relative">
              <Search className={cn("w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2", isRTL ? "right-3" : "left-3")} />
              <input
                type="text"
                value={selectorSearch}
                onChange={e => setSelectorSearch(e.target.value)}
                placeholder={isRTL ? "ابحث باسم المشروع أو العميل أو رقم PR..." : "Search project, client, or PR number..."}
                className={cn(
                  "w-full text-xs bg-slate-50 dark:bg-[#141820]/60 border border-slate-200 dark:border-slate-800 rounded-lg py-2 focus:outline-none focus:ring-1 focus:ring-blue-500",
                  isRTL ? "pr-9 pl-3" : "pl-9 pr-3"
                )}
                autoFocus
              />
            </div>

            {/* Project List */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {scopedProjects
                .filter(p => {
                  if (!selectorSearch.trim()) return true;
                  const q = selectorSearch.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(q) ||
                    (p.pr_number || '').toLowerCase().includes(q) ||
                    (p.company_name || '').toLowerCase().includes(q)
                  );
                })
                .map(p => {
                  const comp = p.company_id ? companyMap.get(p.company_id) : null;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProjectForNewQuote(p)}
                      className="w-full text-start p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {p.pr_number || 'PR'}
                          </span>
                          <span className="font-bold text-xs text-[#292D32] dark:text-white truncate group-hover:text-blue-600 transition-colors">
                            {p.name}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 mt-0.5 truncate">
                          {comp?.name || p.company_name || 'Client'} • {formatCurrencySAR(p.estimated_value || 0)}
                        </div>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-transform shrink-0", isRTL && "rotate-180")} />
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit / Revision Quotation Modal */}
      {isAddQuoteModalOpen && targetProjectForQuote && (
        <AddQuotationModal
          isOpen={isAddQuoteModalOpen}
          onClose={() => {
            setIsAddQuoteModalOpen(false);
            setTargetProjectForQuote(null);
            setQuoteToEdit(null);
            setParentQuoteForRevision(null);
          }}
          project={targetProjectForQuote}
          existingVersionsCount={quotations.filter(q => q.project_id === targetProjectForQuote.id).length}
          mode={quoteModalMode}
          parentQuotation={parentQuoteForRevision}
          quotationToEdit={quoteToEdit}
        />
      )}

      {/* Quotation Detail Modal */}
      {isDetailModalOpen && selectedQuoteForDetail && (
        <QuotationDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedQuoteForDetail(null);
          }}
          quotation={selectedQuoteForDetail}
          project={projectMap.get(selectedQuoteForDetail.project_id) || ({
            id: selectedQuoteForDetail.project_id,
            pr_number: 'PR-AUTO',
            name: selectedQuoteForDetail.project_name || 'Al-Mespar Project',
            company_id: '',
            location: 'Jeddah',
            opportunity_type: 'in_hand' as OpportunityType,
            pipeline_stage: 'quotation_sent',
            priority: 'medium',
            estimated_value: selectedQuoteForDetail.amount,
            probability: 70,
            weighted_value: selectedQuoteForDetail.amount * 0.7,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as unknown as Project)}
          allProjectQuotations={quotations.filter(q => q.project_id === selectedQuoteForDetail.project_id)}
          onOpenRevisionModal={(parent) => handleOpenRevision(parent)}
          onOpenPrintModal={(q) => handleOpenPrint(q)}
          onOpenEditModal={(q) => handleOpenEdit(q)}
          onDeleteQuotation={async (q) => {
            if (confirm(isRTL ? 'هل أنت متأكد من رغبتك في حذف هذا العرض؟' : 'Are you sure you want to delete this quotation?')) {
              await deleteQuotation(q.id);
              setIsDetailModalOpen(false);
              setSelectedQuoteForDetail(null);
            }
          }}
        />
      )}

      {/* Quotation Comparison Modal */}
      {isComparisonModalOpen && comparisonProject && comparisonQuotations.length > 1 && (
        <QuotationComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => {
            setIsComparisonModalOpen(false);
            setSelectedProjectForComparison(null);
          }}
          quotations={comparisonQuotations}
        />
      )}

      {/* Quotation Print Modal */}
      {isPrintModalOpen && selectedQuoteForPrint && (
        <QuotationPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setSelectedQuoteForPrint(null);
          }}
          quotation={selectedQuoteForPrint}
          project={projectMap.get(selectedQuoteForPrint.project_id) || ({
            id: selectedQuoteForPrint.project_id,
            pr_number: 'PR-AUTO',
            name: selectedQuoteForPrint.project_name || 'Al-Mespar Project',
            company_id: '',
            location: 'Jeddah',
            opportunity_type: 'in_hand' as OpportunityType,
            pipeline_stage: 'quotation_sent',
            priority: 'medium',
            estimated_value: selectedQuoteForPrint.amount,
            probability: 70,
            weighted_value: selectedQuoteForPrint.amount * 0.7,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as unknown as Project)}
          contact={null}
        />
      )}
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-slate-400 font-bold text-sm">
        Loading Commercial Quotations...
      </div>
    }>
      <QuotationsContent />
    </Suspense>
  );
}
