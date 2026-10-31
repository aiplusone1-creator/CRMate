'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  ExternalLink, 
  Edit, 
  Trash2, 
  X,
  Briefcase,
  Users,
  MessageCircle,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  Lock
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { COMPANY_TYPES, SAUDI_LOCATIONS } from '@/lib/constants';
import { Company, CompanyType } from '@/types/crm';
import { CompanyDetailModal } from '@/components/modals/company-detail-modal';
import { AddProjectModal } from '@/components/modals/add-project-modal';
import { AddContactModal } from '@/components/modals/add-contact-modal';
import { formatCurrencySAR, normalizePhoneNumber, formatTelUri } from '@/lib/utils';
import { formatCompactSAR } from '@/lib/logic/quotation-pricing';
import { useLanguage } from '@/lib/i18n/language-context';
import { canUserAccessProjectCockpit } from '@/lib/logic/scope';

export default function CompaniesPage() {
  const { companies, projects, contacts, addCompany, updateCompany, deleteCompany, currentRole, currentUser } = useCRM();
  const { t, isRTL } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchTerm, setSearchTermState] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('al_mespar_companies_search') || '';
    }
    return '';
  });
  const setSearchTerm = React.useCallback((term: string) => {
    setSearchTermState(term);
    try { sessionStorage.setItem('al_mespar_companies_search', term); } catch {}
  }, []);
  const deferredSearchTerm = React.useDeferredValue(searchTerm);

  const [selectedType, setSelectedTypeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('al_mespar_companies_type') || 'all';
    }
    return 'all';
  });
  const setSelectedType = React.useCallback((t: string) => {
    setSelectedTypeState(t);
    try { sessionStorage.setItem('al_mespar_companies_type', t); } catch {}
  }, []);

  const [selectedCity, setSelectedCityState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('al_mespar_companies_city') || 'all';
    }
    return 'all';
  });
  const setSelectedCity = React.useCallback((c: string) => {
    setSelectedCityState(c);
    try { sessionStorage.setItem('al_mespar_companies_city', c); } catch {}
  }, []);

  // Company Detail Cockpit Modal State
  const [selectedCompanyForDetail, setSelectedCompanyForDetail] = useState<Company | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState<'projects' | 'contacts' | 'activities' | 'overview'>('projects');

  // Direct open helper for company detail cockpit
  const openCompanyById = React.useCallback((targetId: string) => {
    const found = companies.find(c => c.id === targetId);
    if (found) {
      setSelectedCompanyForDetail(found);
      setDetailInitialTab('projects');
      setIsDetailModalOpen(true);
      setSearchTerm(found.name);
    }
  }, [companies]);

  // Auto-open company detail cockpit when navigated with ?id= or ?search=
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const targetId = searchParams.get('id');
      if (targetId) {
        openCompanyById(targetId);
        return;
      }
      const q = searchParams.get('search');
      if (q) setSearchTerm(q);
    }
  }, [openCompanyById]);

  // Listen to instantaneous custom open event from global search
  React.useEffect(() => {
    const handler = (e: any) => {
      const id = e?.detail?.id;
      if (id) {
        openCompanyById(id);
      }
    };
    window.addEventListener('crm:open-company', handler);
    return () => window.removeEventListener('crm:open-company', handler);
  }, [openCompanyById]);
  
  // Create / Edit Company Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Quick Action Modals (from inside detail modal)
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [addProjectCompanyId, setAddProjectCompanyId] = useState<string | null>(null);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [addContactCompanyId, setAddContactCompanyId] = useState<string | null>(null);

  // Form State for Company Add/Edit
  const [name, setName] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType>('contractor');
  const [city, setCity] = useState('Jeddah');
  const [phone, setPhone] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingCompany(null);
    setName('');
    setCompanyType('contractor');
    setCity('Jeddah');
    setPhone('');
    setGoogleMapsUrl('');
    setWebsite('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (comp: Company) => {
    setEditingCompany(comp);
    setName(comp.name);
    setCompanyType(comp.company_type);
    setCity(comp.city || 'Jeddah');
    setPhone(comp.phone || '');
    setGoogleMapsUrl(comp.google_maps_url || '');
    setWebsite(comp.website || '');
    setNotes(comp.notes || '');
    setIsModalOpen(true);
  };

  const openDetailCockpit = (comp: Company, tab: 'projects' | 'contacts' | 'activities' | 'overview' = 'projects') => {
    setSelectedCompanyForDetail(comp);
    setDetailInitialTab(tab);
    setIsDetailModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCompany) {
      await updateCompany(editingCompany.id, {
        name,
        normalized_name: name.trim().toLowerCase(),
        company_type: companyType,
        city,
        phone,
        google_maps_url: googleMapsUrl,
        website,
        notes,
      });
      // If currently opened in detail cockpit, refresh it
      if (selectedCompanyForDetail && selectedCompanyForDetail.id === editingCompany.id) {
        setSelectedCompanyForDetail({
          ...selectedCompanyForDetail,
          name,
          company_type: companyType,
          city,
          phone,
          google_maps_url: googleMapsUrl,
          website,
          notes,
        });
      }
    } else {
      await addCompany({
        name,
        normalized_name: name.trim().toLowerCase(),
        company_type: companyType,
        city,
        phone,
        google_maps_url: googleMapsUrl,
        website,
        notes,
      });
    }

    setIsModalOpen(false);
  };

  const isManagerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'sales_manager';

  const handleDelete = async (id: string, name: string) => {
    if (!isManagerOrAdmin) {
      alert(isRTL ? 'عفواً، لا يملك صلاحية حذف الشركات سوى مدير المبيعات والمسؤول (Admin).' : 'Unauthorized: Only Sales Managers and Admins can delete companies.');
      return;
    }
    if (confirm(`Are you sure you want to delete company "${name}"?`)) {
      if (selectedCompanyForDetail?.id === id) {
        setIsDetailModalOpen(false);
        setSelectedCompanyForDetail(null);
      }
      await deleteCompany(id);
    }
  };

  // Filter logic (Memoized with deferredSearchTerm for 0ms typing latency)
  const filteredCompanies = useMemo(() => {
    const q = deferredSearchTerm.trim().toLowerCase();
    return companies.filter(c => {
      const matchesSearch = !q ||
                            c.name.toLowerCase().includes(q) ||
                            (c.phone && c.phone.includes(q)) ||
                            (c.city && c.city.toLowerCase().includes(q));
      const matchesType = selectedType === 'all' || c.company_type === selectedType;
      const matchesCity = selectedCity === 'all' || c.city === selectedCity;
      return matchesSearch && matchesType && matchesCity;
    });
  }, [companies, deferredSearchTerm, selectedType, selectedCity]);

  // KPI Metrics
  const totalOrganizations = companies.length;
  const totalPipelineVal = projects.filter(p => p.company_id).reduce((sum, p) => sum + (p.estimated_value || 0), 0);
  const totalLinkedProjectsCount = projects.filter(p => p.company_id).length;
  const totalDecisionMakers = contacts.length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 crm-card p-3 sm:p-4 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] border border-[#8FC2F0]/30 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#292D32] dark:text-[#8FC2F0]" />
              <span>{isRTL ? 'دليل المنشآت المؤسسي' : 'Enterprise Directory'}</span>
            </span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[#292D32] dark:text-white tracking-tight">
            {t('companiesTitle')}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {t('companiesSubtitle')} ({companies.length} {isRTL ? 'شركة مسجلة' : 'organizations'})
          </p>
        </div>

        {currentRole !== 'viewer' && (
          <button
            onClick={openCreateModal}
            className="crm-pill-dark flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-2xs transition-all self-start sm:self-auto cursor-pointer group"
          >
            <Plus className="w-3.5 h-3.5 text-[#8FC2F0] group-hover:rotate-90 transition-transform" />
            <span>{t('addCompany')}</span>
          </button>
        )}
      </div>

      {/* 4 Luxury KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <div className="crm-card p-3 sm:p-3.5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span>{isRTL ? 'إجمالي المنشآت' : 'Total Companies'}</span>
            <div className="w-7 h-7 rounded-full bg-[#8FC2F0]/15 dark:bg-[#8FC2F0]/20 flex items-center justify-center text-[#292D32] dark:text-[#8FC2F0]">
              <Building2 className="w-3.5 h-3.5 text-[#292D32] dark:text-[#8FC2F0]" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#292D32] dark:text-white tracking-tight">
            {totalOrganizations}
          </div>
          <span className="text-[10px] font-bold text-slate-400 mt-1 block">
            {isRTL ? 'عملاء ومقاولون واستشاريون' : 'Contractors, Clients & Consultants'}
          </span>
        </div>

        <div className="crm-card p-3 sm:p-3.5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span>{isRTL ? 'قيمة خط الصفقات' : 'Pipeline Value'}</span>
            <div className="w-7 h-7 rounded-full bg-[#77CE69]/15 dark:bg-[#77CE69]/20 flex items-center justify-center text-[#77CE69]">
              <TrendingUp className="w-3.5 h-3.5 text-[#77CE69]" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#292D32] dark:text-white tracking-tight">
            {formatCurrencySAR(totalPipelineVal)}
          </div>
          <span className="text-[10px] font-bold text-[#77CE69] mt-1 block">
            {isRTL ? 'قيمة كافة الصفقات المرتبطة' : 'Total Associated Deals'}
          </span>
        </div>

        <div className="crm-card p-3 sm:p-3.5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span>{isRTL ? 'المشاريع المرتبطة' : 'Linked Projects'}</span>
            <div className="w-7 h-7 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#292D32] dark:text-white tracking-tight">
            {totalLinkedProjectsCount}
          </div>
          <span className="text-[10px] font-bold text-slate-400 mt-1 block">
            {isRTL ? 'فرص ومشاريع تحت المتابعة' : 'Active Projects in Motion'}
          </span>
        </div>

        <div className="crm-card p-3 sm:p-3.5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span>{isRTL ? 'صناع القرار' : 'Decision Makers'}</span>
            <div className="w-7 h-7 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#292D32] dark:text-white tracking-tight">
            {totalDecisionMakers}
          </div>
          <span className="text-[10px] font-bold text-slate-400 mt-1 block">
            {isRTL ? 'جهات اتصال ومسؤولو مشتريات' : 'Verified Decision Makers'}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="crm-card p-4 sm:p-5 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className={`w-4 h-4 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
          <input
            type="text"
            placeholder={isRTL ? "بحث في أسماء الشركات، المدن..." : "Search companies by name, city..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-[#292D32] dark:text-slate-100 font-semibold transition-all shadow-2xs`}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 dark:text-slate-200 font-bold shadow-2xs cursor-pointer"
          >
            <option value="all">{t('allTypes')}</option>
            {COMPANY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="px-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 dark:text-slate-200 font-bold shadow-2xs cursor-pointer"
          >
            <option value="all">{t('allCities')}</option>
            {SAUDI_LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Companies Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCompanies.length === 0 ? (
          <div className="col-span-full p-12 text-center glass-card rounded-3xl text-slate-400 font-bold">
            {isRTL ? 'لا توجد شركات مطابقة لمعايير البحث.' : 'No companies match the selected criteria.'}
          </div>
        ) : (
          filteredCompanies.map(c => {
            const linkedProjects = projects.filter(p => p.company_id === c.id || p.consultant_id === c.id);
            const linkedContacts = contacts.filter(cnt => cnt.company_id === c.id);
            const typeConfig = COMPANY_TYPES.find(t => t.value === c.company_type);

            const isSalesRep = currentUser?.role === 'sales_engineer';
            const accessibleProjects = isSalesRep 
              ? linkedProjects.filter(p => canUserAccessProjectCockpit(p, currentUser)) 
              : linkedProjects;
            const lockedProjectsCount = isSalesRep ? (linkedProjects.length - accessibleProjects.length) : 0;
            const totalValue = accessibleProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);

            // Primary Contact identification (Hot lead priority or first contact)
            const primaryContact = linkedContacts.find(cnt => cnt.is_hot_lead) || linkedContacts[0];
            const primaryCleanPhone = primaryContact ? normalizePhoneNumber(primaryContact.phone) : '';
            const primaryWaLink = primaryCleanPhone ? `https://wa.me/${primaryCleanPhone}` : null;

            const activeBidsCount = linkedProjects.filter(p => p.pipeline_stage !== 'won' && p.pipeline_stage !== 'lost').length;
            const tier = totalValue >= 10_000_000 ? 'A' : totalValue >= 2_000_000 ? 'B' : 'C';
            const tierConfig = {
              A: {
                label: isRTL ? 'فئة أ • كبار العملاء' : 'Tier A • Strategic',
                badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
                dotClass: 'bg-amber-500',
              },
              B: {
                label: isRTL ? 'فئة ب • رئيسي' : 'Tier B • Key Client',
                badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
                dotClass: 'bg-sky-500',
              },
              C: {
                label: isRTL ? 'فئة ج • اعتيادي' : 'Tier C • Standard',
                badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
                dotClass: 'bg-slate-400',
              },
            }[tier];

            return (
              <div 
                key={c.id} 
                onClick={() => openDetailCockpit(c, 'projects')}
                className="crm-card crm-card-interactive p-4 sm:p-5 flex flex-col justify-between cursor-pointer group relative"
              >
                <div>
                  {/* Top Bar: Company Name & Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-[#292D32] dark:text-white text-base leading-tight group-hover:text-[#8FC2F0] transition-colors flex items-center gap-1.5">
                        <span className="truncate">{c.name}</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#8FC2F0] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </h3>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {typeConfig?.label || c.company_type}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-black border ${tierConfig.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tierConfig.dotClass}`} />
                          <span>{tierConfig.label}</span>
                        </span>
                        {c.city && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-[#8FC2F0]" />
                            {c.city}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Edit & Delete (Isolated from card click) */}
                    {currentRole !== 'viewer' && (
                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(c)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title={isRTL ? "تعديل بيانات الشركة" : "Edit Company"}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {isManagerOrAdmin && (
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title={isRTL ? "حذف الشركة (خاص بالمدير والمسؤول)" : "Delete Company (Manager & Admin only)"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contractor Power Metrics Strip */}
                  <div className="mt-3 grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {isRTL ? 'عروض جارية' : 'Active Bids'}
                      </span>
                      <span className="text-xs font-black font-mono text-sky-600 dark:text-sky-400">
                        {activeBidsCount}
                      </span>
                    </div>
                    <div className="flex flex-col border-x border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {isRTL ? 'حجم الصفقات' : 'Pipeline'}
                      </span>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCompactSAR(totalValue)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {isRTL ? 'صناع القرار' : 'Contacts'}
                      </span>
                      <span className="text-xs font-black font-mono text-slate-700 dark:text-slate-200">
                        {linkedContacts.length}
                      </span>
                    </div>
                  </div>

                  {lockedProjectsCount > 0 && (
                    <div 
                      className="mt-2 flex items-center gap-1.5 text-[10.5px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-bold w-fit" 
                      title={isRTL ? 'توجد مشاريع أخرى لهذه الشركة مسندة لمهندسين آخرين بالفريق' : 'Other projects for this client assigned to team members'}
                    >
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>{isRTL ? `${lockedProjectsCount} مشاريع لفريق المبيعات` : `${lockedProjectsCount} team deals`}</span>
                    </div>
                  )}

                  {/* Notes / Details */}
                  {c.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 crm-card-soft p-2.5">
                      {c.notes}
                    </p>
                  )}

                  {/* Key Contact Section: Fixes the issue of phone numbers belonging to people, not the company */}
                  {primaryContact ? (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <UserCheck className="w-3.5 h-3.5 text-[#8FC2F0]" />
                          <span>{isRTL ? 'جهة الاتصال الرئيسية' : 'Primary Contact'}</span>
                        </span>
                        {linkedContacts.length > 1 && (
                          <button
                            onClick={() => openDetailCockpit(c, 'contacts')}
                            className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                          >
                            {isRTL ? `+${linkedContacts.length - 1} جهات اتصال إضافية` : `+${linkedContacts.length - 1} more contacts`}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between crm-card-soft p-3">
                        <div className={`min-w-0 ${isRTL ? 'pl-2' : 'pr-2'}`}>
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                            {primaryContact.full_name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {primaryContact.job_title || (isRTL ? 'مسؤول الاتصال' : 'Contact Person')}
                          </div>
                        </div>

                        {/* Direct 1-Click WhatsApp and Phone Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {primaryWaLink && (
                            <a
                              href={primaryWaLink}
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-xs"
                              title={`WhatsApp ${primaryContact.full_name}`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {primaryCleanPhone && (
                            <a
                              href={`tel:${formatTelUri(primaryContact.phone)}`}
                              className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-xs"
                              title={`Call ${primaryContact.full_name}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 italic">
                      {isRTL ? 'لم تتم إضافة جهات اتصال فردية بعد' : 'No individual contacts added yet'}
                    </div>
                  )}

                  {/* Google Maps site link if present */}
                  {c.google_maps_url && (
                    <div className="mt-2 text-xs" onClick={e => e.stopPropagation()}>
                      <a 
                        href={c.google_maps_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        <MapPin className="w-3 h-3 text-red-500" />
                        <span>{isRTL ? 'موقع خرائط جوجل' : 'Google Maps Location'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Footer Stats & Open Profile Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#292D32]/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailCockpit(c, 'projects');
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors font-semibold cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                      <span>{linkedProjects.length} {isRTL ? 'مشاريع' : 'Projects'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailCockpit(c, 'contacts');
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors font-semibold cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      <span>{linkedContacts.length} {isRTL ? 'جهات اتصال' : 'Contacts'}</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-blue-600 group-hover:underline font-bold flex items-center gap-0.5">
                    {isRTL ? 'عرض الملف ↗' : 'View Card ↗'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Company Detail Cockpit Modal */}
      <CompanyDetailModal
        company={selectedCompanyForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCompanyForDetail(null);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (url.searchParams.has('id')) {
              url.searchParams.delete('id');
              window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
            }
          }
        }}
        initialTab={detailInitialTab}
        onEditCompany={(comp) => {
          setIsDetailModalOpen(false);
          openEditModal(comp);
        }}
        onAddProject={(compId) => {
          setAddProjectCompanyId(compId);
          setIsAddProjectModalOpen(true);
        }}
        onAddContact={(compId) => {
          setAddContactCompanyId(compId);
          setIsAddContactModalOpen(true);
        }}
      />

      {/* Add Project Modal with Preselected Company */}
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        defaultCompanyId={addProjectCompanyId || undefined}
      />

      {/* Add Contact Modal with Preselected Company */}
      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        defaultCompanyId={addContactCompanyId || undefined}
      />

      {/* Create / Edit Company Modal */}
      {isModalOpen && mounted && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="glass-card bg-white/95 dark:bg-[#1C2130] rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-white/90 dark:border-[#8FC2F0]/10 overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100/80 dark:border-[#292D32]/60 flex items-center justify-between bg-white/80 dark:bg-[#232A38] shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shrink-0 shadow-2xs">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <div>
                  <h2 className="font-black text-[#292D32] dark:text-white text-base sm:text-lg font-urbanist">
                    {editingCompany ? (isRTL ? 'تعديل ملف المنشأة' : 'Edit Company Profile') : (isRTL ? 'تسجيل منشأة جديدة' : 'Create New Company')}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">{isRTL ? 'دليل الشركات والعملاء الموحد' : 'Unified Commercial Directory'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 sm:p-2 rounded-2xl text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#232A38] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5">{isRTL ? 'اسم الشركة *' : 'Company Name *'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Creet / Alsaad Contracting"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white font-medium transition-all shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5">{isRTL ? 'نوع النشاط' : 'Company Type'}</label>
                  <select
                    value={companyType}
                    onChange={e => setCompanyType(e.target.value as CompanyType)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-800 dark:text-white font-medium transition-all shadow-2xs"
                  >
                    {COMPANY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5">{isRTL ? 'المدينة / المنطقة' : 'City / Region'}</label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-800 dark:text-white font-medium transition-all shadow-2xs"
                  >
                    {SAUDI_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5">{isRTL ? 'الهاتف / خط المكتب' : 'Office / HQ Landline'}</label>
                  <input
                    type="text"
                    placeholder="012XXXXXXX (Optional)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white font-medium transition-all shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5">{isRTL ? 'الموقع الإلكتروني' : 'Website'}</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white font-medium transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5">{isRTL ? 'رابط خرائط جوجل' : 'Google Maps URL'}</label>
                <input
                  type="text"
                  placeholder="https://maps.app.goo.gl/..."
                  value={googleMapsUrl}
                  onChange={e => setGoogleMapsUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white font-medium transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5">{isRTL ? 'ملاحظات داخلية' : 'Internal Notes & Sister Entities'}</label>
                <textarea
                  rows={2}
                  placeholder={isRTL ? "مجال نشاط الشركة، تفضيلات المشتريات..." : "Company scope, major contracts, procurement preferences..."}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white font-medium transition-all shadow-2xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#292D32] hover:bg-[#1E2124] rounded-xl shadow-xs transition-colors"
                >
                  {editingCompany ? (isRTL ? 'حفظ التعديلات' : 'Save Changes') : (isRTL ? 'تسجيل المنشأة' : 'Create Company')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
