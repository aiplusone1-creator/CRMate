'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Building2, 
  Flame, 
  MessageCircle, 
  Edit, 
  Trash2, 
  X,
  Calendar,
  MapPin,
  Bell,
  Table as TableIcon,
  LayoutGrid,
  Briefcase,
  Check
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { SAUDI_LOCATIONS } from '@/lib/constants';
import { Contact } from '@/types/crm';
import { formatDateString, normalizePhoneNumber, formatDisplayPhone, formatTelUri } from '@/lib/utils';
import { WhatsAppComposerModal } from '@/components/modals/whatsapp-composer-modal';
import { useLanguage } from '@/lib/i18n/language-context';
export default function ContactsPage() {
  const { contacts, companies, projects, addContact, updateContact, deleteContact, currentRole, openFastLog, openReminder, currentUser } = useCRM();
  const { t, isRTL } = useLanguage();

  const [viewMode, setViewModeState] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('al_mespar_contacts_view_mode');
      if (saved === 'cards' || saved === 'table') return saved;
    }
    return 'table';
  });
  const setViewMode = React.useCallback((mode: 'cards' | 'table') => {
    setViewModeState(mode);
    try { sessionStorage.setItem('al_mespar_contacts_view_mode', mode); } catch {}
  }, []);

  const [searchTerm, setSearchTermState] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('al_mespar_contacts_search') || '';
    }
    return '';
  });
  const setSearchTerm = React.useCallback((term: string) => {
    setSearchTermState(term);
    try { sessionStorage.setItem('al_mespar_contacts_search', term); } catch {}
  }, []);
  const deferredSearchTerm = React.useDeferredValue(searchTerm);

  const [onlyHotLeads, setOnlyHotLeads] = useState(false);

  const [selectedCity, setSelectedCityState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('al_mespar_contacts_city') || 'all';
    }
    return 'all';
  });
  const setSelectedCity = React.useCallback((c: string) => {
    setSelectedCityState(c);
    try { sessionStorage.setItem('al_mespar_contacts_city', c); } catch {}
  }, []);
  const [selectedContactForWhatsApp, setSelectedContactForWhatsApp] = useState<Contact | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Helper to close modal and clean URL parameter
  const closeContactModal = React.useCallback(() => {
    setIsModalOpen(false);
    setEditingContact(null);
    setSelectedProjectIds([]);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('id')) {
        url.searchParams.delete('id');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    }
  }, []);

  // Open contact card modal by ID
  const openContactById = React.useCallback((targetId: string) => {
    const found = contacts.find(c => c.id === targetId);
    if (found) {
      setEditingContact(found);
      setFullName(found.full_name);
      setCompanyId(found.company_id || '');
      setJobTitle(found.job_title || '');
      setPhone(found.phone || '');
      setEmail(found.email || '');
      setCity(found.city || 'Jeddah');
      setIsHotLead(found.is_hot_lead);
      setNextFollowUpAt(found.next_follow_up_at ? found.next_follow_up_at.split('T')[0] : '');
      setNotes(found.notes || '');
      const contactProjIds = found.project_ids || projects.filter(p => (p.contact_ids || []).includes(found.id) || p.primary_contact_id === found.id).map(p => p.id);
      setSelectedProjectIds(contactProjIds);
      setIsModalOpen(true);
      setSearchTerm(found.full_name);
    }
  }, [contacts, projects]);

  // Auto-sync search term from global search navigation or direct ?id=
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const targetId = searchParams.get('id');
      if (targetId) {
        openContactById(targetId);
        return;
      }
      const q = searchParams.get('search');
      if (q) {
        setSearchTerm(decodeURIComponent(q));
        setIsModalOpen(false);
      }
    }
  }, [openContactById, setSearchTerm]);

  // Listen to instantaneous custom open/search event from global search
  React.useEffect(() => {
    const handler = (e: any) => {
      const id = e?.detail?.id;
      if (id) {
        openContactById(id);
      }
    };
    const searchHandler = (e: any) => {
      const s = e?.detail?.search;
      if (typeof s === 'string') {
        setSearchTerm(s);
        setIsModalOpen(false);
      }
    };
    window.addEventListener('crm:open-contact', handler);
    window.addEventListener('crm:search-contact', searchHandler);
    return () => {
      window.removeEventListener('crm:open-contact', handler);
      window.removeEventListener('crm:search-contact', searchHandler);
    };
  }, [openContactById, setSearchTerm]);

  // Form State
  const [fullName, setFullName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Jeddah');
  const [isHotLead, setIsHotLead] = useState(false);
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingContact(null);
    setFullName('');
    setCompanyId(companies[0]?.id || '');
    setSelectedProjectIds([]);
    setJobTitle('');
    setPhone('');
    setEmail('');
    setCity('Jeddah');
    setIsHotLead(false);
    setNextFollowUpAt('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (cnt: Contact) => {
    setEditingContact(cnt);
    setFullName(cnt.full_name);
    setCompanyId(cnt.company_id || '');
    const contactProjIds = cnt.project_ids || projects.filter(p => (p.contact_ids || []).includes(cnt.id) || p.primary_contact_id === cnt.id).map(p => p.id);
    setSelectedProjectIds(contactProjIds);
    setJobTitle(cnt.job_title || '');
    setPhone(cnt.phone || '');
    setEmail(cnt.email || '');
    setCity(cnt.city || 'Jeddah');
    setIsHotLead(cnt.is_hot_lead);
    setNextFollowUpAt(cnt.next_follow_up_at ? cnt.next_follow_up_at.split('T')[0] : '');
    setNotes(cnt.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const matchedComp = companies.find(c => c.id === companyId);
    const normalized = normalizePhoneNumber(phone);

    if (editingContact) {
      await updateContact(editingContact.id, {
        full_name: fullName,
        company_id: companyId || undefined,
        company_name: matchedComp?.name,
        job_title: jobTitle,
        phone,
        normalized_phone: normalized,
        email,
        city,
        is_hot_lead: isHotLead,
        next_follow_up_at: nextFollowUpAt || undefined,
        notes,
        project_ids: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
      });
    } else {
      await addContact({
        full_name: fullName,
        company_id: companyId || undefined,
        company_name: matchedComp?.name,
        job_title: jobTitle,
        phone,
        normalized_phone: normalized,
        email,
        city,
        is_hot_lead: isHotLead,
        next_follow_up_at: nextFollowUpAt || undefined,
        notes,
        project_ids: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
      });
    }

    closeContactModal();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete contact "${name}"?`)) {
      await deleteContact(id);
    }
  };

  // Filter logic (Memoized with deferredSearchTerm for 0ms typing latency)
  const filteredContacts = useMemo(() => {
    const q = deferredSearchTerm.trim().toLowerCase();
    return contacts.filter(cnt => {
      const matchesSearch = !q ||
                            cnt.full_name.toLowerCase().includes(q) ||
                            (cnt.job_title && cnt.job_title.toLowerCase().includes(q)) ||
                            (cnt.company_name && cnt.company_name.toLowerCase().includes(q)) ||
                            (cnt.phone && cnt.phone.includes(q)) ||
                            (cnt.email && cnt.email.toLowerCase().includes(q)) ||
                            (cnt.notes && cnt.notes.toLowerCase().includes(q));
      const matchesHot = !onlyHotLeads || cnt.is_hot_lead;
      const matchesCity = selectedCity === 'all' || cnt.city === selectedCity;
      return matchesSearch && matchesHot && matchesCity;
    });
  }, [contacts, deferredSearchTerm, onlyHotLeads, selectedCity]);

  // KPI Metrics
  const totalContactsCount = contacts.length;
  const hotLeadsCount = contacts.filter(c => c.is_hot_lead).length;
  const linkedOrgsCount = new Set(contacts.map(c => c.company_id).filter(Boolean)).size;
  const followUpScheduledCount = contacts.filter(c => c.next_follow_up_at).length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 crm-card p-3 sm:p-4 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{isRTL ? 'سجل العلاقات المؤسسية' : 'Executive Rolodex'}</span>
            </span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[#292D32] dark:text-white tracking-tight">
            {t('contactsTitle')}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {t('contactsSubtitle')} ({contacts.length} {isRTL ? 'جهة اتصال مسجلة' : 'total decision makers'})
          </p>
        </div>

        {currentRole !== 'viewer' && (
          <button
            onClick={openCreateModal}
            className="crm-pill-dark flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-2xs transition-all self-start sm:self-auto cursor-pointer group"
          >
            <Plus className="w-3.5 h-3.5 text-[#8FC2F0] group-hover:rotate-90 transition-transform" />
            <span>{t('addContact')}</span>
          </button>
        )}
      </div>

      {/* 4 Compact Apple-Style KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        <div className="crm-card p-2 sm:p-2.5 rounded-2xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>{isRTL ? 'إجمالي جهات الاتصال' : 'Total Contacts'}</span>
            <div className="w-6 h-6 rounded-full bg-[#8FC2F0]/15 dark:bg-[#8FC2F0]/20 flex items-center justify-center text-[#292D32] dark:text-[#8FC2F0]">
              <Users className="w-3 h-3 text-[#292D32] dark:text-[#8FC2F0]" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-[#292D32] dark:text-white tracking-tight">
            {totalContactsCount}
          </div>
          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5 block truncate">
            {isRTL ? 'صناع قرار ومسؤولو مشتريات' : 'Verified Decision Makers'}
          </span>
        </div>

        <div className="crm-card p-2 sm:p-2.5 rounded-2xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>{isRTL ? 'العملاء الساخنون' : 'Hot Leads'}</span>
            <div className="w-6 h-6 rounded-full bg-amber-500/15 dark:bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Flame className="w-3 h-3" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-tight">
            {hotLeadsCount}
          </div>
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5 block truncate">
            {isRTL ? 'أولوية متابعة وتواصل فورية' : 'High Purchase Intent'}
          </span>
        </div>

        <div className="crm-card p-2 sm:p-2.5 rounded-2xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>{isRTL ? 'المنشآت الممثلة' : 'Linked Companies'}</span>
            <div className="w-6 h-6 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building2 className="w-3 h-3" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-[#292D32] dark:text-white tracking-tight">
            {linkedOrgsCount}
          </div>
          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5 block truncate">
            {isRTL ? 'شركات ومؤسسات متعاملة' : 'Active Client Accounts'}
          </span>
        </div>

        <div className="crm-card p-2 sm:p-2.5 rounded-2xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>{isRTL ? 'متابعات مجدولة' : 'Follow-ups Set'}</span>
            <div className="w-6 h-6 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Bell className="w-3 h-3" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-[#292D32] dark:text-white tracking-tight">
            {followUpScheduledCount}
          </div>
          <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-400 mt-0.5 block truncate">
            {isRTL ? 'مواعيد وتذكيرات قادمة' : 'Scheduled Outreach'}
          </span>
        </div>
      </div>

      {/* Filter Bar with Hot Leads Toggle & View Switcher */}
      <div className="crm-card p-2 sm:p-2.5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-2 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className={`w-3.5 h-3.5 text-slate-400 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
          <input
            type="text"
            placeholder={isRTL ? "بحث في الأسماء، المسمى الوظيفي، الهاتف، البريد..." : "Search contacts by name, role, phone, email..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full ${isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-[#292D32] dark:text-slate-100 font-semibold transition-all shadow-2xs`}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* View Toggle */}
          <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3 h-3" />
              <span>{isRTL ? 'جدول' : 'Table'}</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>{isRTL ? 'كروت' : 'Cards'}</span>
            </button>
          </div>

          {/* Hot Leads Only Toggle Button */}
          <button
            onClick={() => setOnlyHotLeads(!onlyHotLeads)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              onlyHotLeads 
                ? 'bg-amber-500 text-white shadow-xs' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${onlyHotLeads ? 'fill-white' : 'text-amber-500'}`} />
            <span>{isRTL ? 'الساخنون فقط' : 'Hot Only'}</span>
            {onlyHotLeads && (
              <span className="bg-white/30 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold font-mono">
                {hotLeadsCount}
              </span>
            )}
          </button>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 dark:text-slate-200 font-bold shadow-2xs cursor-pointer"
          >
            <option value="all">{t('allCities')}</option>
            {SAUDI_LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW SWITCH: TABLE vs CARDS */}
      {viewMode === 'table' ? (
        <div className="crm-card rounded-xl overflow-hidden shadow-2xs border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">{isRTL ? 'جهة الاتصال' : 'Contact'}</th>
                  <th className="py-2.5 px-3">{isRTL ? 'المنشأة والمسمى' : 'Company & Role'}</th>
                  <th className="py-2.5 px-3">{isRTL ? 'المدينة' : 'City'}</th>
                  <th className="py-2.5 px-3">{isRTL ? 'الهاتف والتواصل السريع' : 'Phone & Outreach'}</th>
                  <th className="py-2.5 px-3">{isRTL ? 'تاريخ المتابعة' : 'Follow-up'}</th>
                  <th className="py-2.5 px-3 text-center">{isRTL ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-bold text-xs">
                      {isRTL ? 'لا توجد جهات اتصال مطابقة لمعايير البحث.' : 'No contacts match the filter criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map(cnt => {
                    const rawPhone = cnt.phone || '';
                    const cleanPhone = normalizePhoneNumber(rawPhone);
                    const displayPhone = formatDisplayPhone(rawPhone);
                    const linkedCompany = companies.find(c => c.id === cnt.company_id);
                    const contactProjects = projects.filter(p => 
                      !p.is_archived && (
                        (cnt.project_ids || []).includes(p.id) || 
                        (p.contact_ids || []).includes(cnt.id) || 
                        p.primary_contact_id === cnt.id
                      )
                    );

                    return (
                      <tr key={cnt.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center font-bold text-xs shrink-0">
                              {cnt.full_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-black text-[#292D32] dark:text-white truncate flex items-center gap-1.5">
                                <span>{cnt.full_name}</span>
                                {cnt.is_hot_lead && (
                                   <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 border border-amber-500/30">
                                    🔥 HOT
                                  </span>
                                )}
                              </div>
                              {cnt.email && (
                                <div className="text-[10px] text-slate-400 font-mono truncate">{cnt.email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-700 dark:text-slate-200 truncate">{cnt.company_name || linkedCompany?.name || '—'}</div>
                          <div className="text-[10.5px] text-sky-600 dark:text-[#8FC2F0] font-medium">{cnt.job_title || '—'}</div>
                          {contactProjects.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5 max-w-[280px]">
                              {contactProjects.map(p => (
                                <span 
                                  key={p.id}
                                  title={p.name}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 max-w-[200px]"
                                >
                                  <Briefcase className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                  <span className="truncate">{p.name}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{cnt.city || '—'}</span>
                        </td>
                        <td className="py-2 px-3">
                          {rawPhone ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{displayPhone}</span>
                              <a
                                href={`tel:${formatTelUri(rawPhone)}`}
                                className="p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-[#8FC2F0] transition-colors"
                                title={isRTL ? 'اتصال مباشر' : 'Call'}
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedContactForWhatsApp(cnt);
                                }}
                                className="p-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 transition-colors cursor-pointer"
                                title={isRTL ? 'مراسلة واتساب' : 'WhatsApp'}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {cnt.next_follow_up_at ? (
                            <span className="font-mono text-[10px] font-bold text-sky-700 dark:text-[#8FC2F0] bg-[#8FC2F0]/15 px-2 py-0.5 rounded-full border border-[#8FC2F0]/30 whitespace-nowrap">
                              {formatDateString(cnt.next_follow_up_at)}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(cnt)}
                              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#292D32] dark:hover:text-white transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {currentRole !== 'viewer' && (
                              <button
                                onClick={() => handleDelete(cnt.id, cnt.full_name)}
                                className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Contacts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredContacts.length === 0 ? (
            <div className="col-span-full p-8 text-center crm-card rounded-xl text-slate-400 font-bold text-xs">
              {isRTL ? 'لا توجد جهات اتصال مطابقة لمعايير البحث.' : 'No contacts match the filter criteria.'}
            </div>
          ) : (
          filteredContacts.map(cnt => {
            const rawPhone = cnt.phone || '';
            const cleanPhone = normalizePhoneNumber(rawPhone);
            const displayPhone = formatDisplayPhone(rawPhone);
            const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;
            const linkedCompany = companies.find(c => c.id === cnt.company_id);
            const contactProjects = projects.filter(p => 
              !p.is_archived && (
                (cnt.project_ids || []).includes(p.id) || 
                (p.contact_ids || []).includes(cnt.id) || 
                p.primary_contact_id === cnt.id
              )
            );
            const linkedProject = contactProjects[0] || projects.find(p => p.company_id === cnt.company_id);

            return (
              <div 
                key={cnt.id} 
                className="crm-card crm-card-interactive p-6 flex flex-col justify-between"
              >
                <div>
                  {/* 1. Full Name on Top & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-[#292D32] dark:text-white text-lg leading-tight tracking-tight">
                          {cnt.full_name}
                        </h3>
                        {cnt.is_hot_lead && (
                          <span 
                            title="Hot Lead - Priority follow-up required"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          >
                            <Flame className="w-3 h-3 fill-amber-500 text-amber-600" />
                            HOT LEAD
                          </span>
                        )}
                      </div>

                      {/* 2. Job Title */}
                      <div className="text-xs sm:text-sm font-bold text-sky-700 dark:text-[#8FC2F0] mt-1">
                        {cnt.job_title || 'Sales / Engineering Contact'}
                      </div>

                      {/* 3. Company Name */}
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cnt.company_name || linkedCompany?.name || 'Independent / General'}</span>
                      </div>

                      {/* 3.1 Assigned Projects (Names only) */}
                      {contactProjects.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-blue-500" />
                            <span>{isRTL ? 'المشاريع المسندة:' : 'Assigned Projects:'}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {contactProjects.map(p => (
                              <span 
                                key={p.id}
                                title={p.name}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50 max-w-full"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span className="truncate">{p.name}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Edit & Delete */}
                    {currentRole !== 'viewer' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEditModal(cnt)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Contact"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cnt.id, cnt.full_name)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 4. Notes / Context immediately under company name */}
                  {cnt.notes ? (
                    <div className="mt-3.5 crm-card-soft p-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {isRTL ? 'ملاحظات:' : 'Notes:'}
                      </span>
                      <p className="line-clamp-3 whitespace-pre-wrap">{cnt.notes}</p>
                    </div>
                  ) : null}

                  {/* Location & Follow Up Date */}
                  <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 flex-wrap">
                    {cnt.city && (
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#8FC2F0]" />
                        {cnt.city}
                      </span>
                    )}
                    {cnt.next_follow_up_at && (
                      <span className="flex items-center gap-1 font-bold text-sky-700 dark:text-[#8FC2F0] bg-[#8FC2F0]/15 px-3 py-0.5 rounded-full border border-[#8FC2F0]/30">
                        <Calendar className="w-3 h-3 text-[#8FC2F0]" />
                        {isRTL ? 'الاستحقاق:' : 'Due:'} {formatDateString(cnt.next_follow_up_at)}
                      </span>
                    )}
                  </div>

                  {/* 5. Phone Number Box directly above Call button */}
                  <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#8FC2F0]" />
                        {isRTL ? 'رقم الهاتف المباشر' : 'Direct Phone'}
                      </span>
                      {rawPhone && (
                        <span className="text-[10px] text-[#77CE69] font-bold bg-[#77CE69]/15 px-2 py-0.5 rounded-full border border-[#77CE69]/30">
                          {isRTL ? 'خط مباشر' : 'Direct Line'}
                        </span>
                      )}
                    </div>

                    {rawPhone ? (
                      <div className="flex items-center justify-between crm-card-soft p-3">
                        <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white tracking-wider select-all">
                          {displayPhone}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">{isRTL ? 'جوال سعودي' : 'Saudi Mobile'}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic crm-card-soft p-2.5">
                        {isRTL ? 'لا يوجد هاتف مسجل' : 'No phone recorded'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fast Action Buttons: Call with number & WhatsApp */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    {rawPhone ? (
                      <>
                        {/* Call Button */}
                        <a
                          href={`tel:${formatTelUri(rawPhone)}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-[#292D32] hover:bg-black dark:bg-[#8FC2F0] dark:text-[#292D32] text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-[0.98]"
                          title={`${isRTL ? 'اتصال بـ' : 'Call'} ${cnt.full_name} (${displayPhone})`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{isRTL ? 'اتصال' : 'Call'}</span>
                        </a>

                        {/* WhatsApp Button */}
                        {cleanPhone && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContactForWhatsApp(cnt);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-full shadow-xs transition-all shrink-0 active:scale-[0.98] cursor-pointer"
                            title={`${isRTL ? 'مراسلة واتساب لـ' : 'Compose WhatsApp message to'} ${cnt.full_name}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white" />
                            <span>{isRTL ? 'واتساب' : 'WhatsApp'}</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic py-1.5">{isRTL ? 'لا يوجد رقم مسجل' : 'No phone number recorded'}</span>
                    )}

                    {/* Email Link */}
                    {cnt.email && (
                      <a
                        href={`mailto:${cnt.email}`}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                        title={`Email ${cnt.email}`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Reminder Shortcut */}
                    <button
                      onClick={() => openReminder({
                        entity_type: 'contact',
                        entity_id: cnt.id,
                        entity_name: cnt.full_name,
                        contact_id: cnt.id,
                        contact_name: cnt.full_name,
                      })}
                      className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl transition-colors shrink-0"
                      title="Set Reminder for this contact"
                    >
                      <Bell className="w-4 h-4" />
                    </button>

                    {/* Fast Log Shortcut */}
                    <button
                      onClick={() => openFastLog({ contactId: cnt.id, project: linkedProject || null })}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
                      title="Log interaction with this contact"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999]">
          <div className="bg-white dark:bg-[#1C2130] rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-[#8FC2F0]/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#232A38] shrink-0">
              <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                {editingContact ? (isRTL ? 'تعديل جهة الاتصال' : 'Edit Contact') : (isRTL ? 'إضافة جهة اتصال جديدة' : 'Add New Contact')}
              </h2>
              <button 
                onClick={closeContactModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? 'الاسم الكامل *' : 'Full Name *'}</label>
                <input
                  type="text"
                  required
                  placeholder={isRTL ? 'مثال: ياسر باحسين' : 'e.g. Yasser Bahussin'}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? 'الشركة' : 'Company'}</label>
                  <select
                    value={companyId}
                    onChange={e => setCompanyId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  >
                    <option value="">{isRTL ? '-- جهة اتصال مستقلة --' : '-- Standalone Contact --'}</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? 'المسمى الوظيفي' : 'Job Title / Position'}</label>
                  <input
                    type="text"
                    placeholder={isRTL ? 'مثال: مدير المشتريات' : 'e.g. Procurement Manager'}
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <input
                    type="text"
                    placeholder="9665XXXXXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? 'المدينة' : 'City'}</label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  >
                    {SAUDI_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? 'تاريخ المتابعة القادمة' : 'Next Follow-up Date'}</label>
                  <input
                    type="date"
                    value={nextFollowUpAt}
                    onChange={e => setNextFollowUpAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hotLeadCheckbox"
                  checked={isHotLead}
                  onChange={e => setIsHotLead(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <label htmlFor="hotLeadCheckbox" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{isRTL ? 'تحديد كعميل محتمل ذو أولوية عالية (متابعة عاجلة)' : 'Mark as Hot Lead (Active Inquiry / Priority Follow-up)'}</span>
                </label>
              </div>

              {/* Assigned Projects Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-[#8FC2F0]" />
                    <span>{isRTL ? 'المشاريع المسندة (مشاريع المنشأة)' : 'Assigned Projects'}</span>
                  </span>
                  {selectedProjectIds.length > 0 && (
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-800 font-mono">
                      {selectedProjectIds.length} {isRTL ? 'مشاريع' : 'projects'}
                    </span>
                  )}
                </label>
                
                {(() => {
                  const relevantProjects = projects.filter(p => !p.is_archived && (!companyId || p.company_id === companyId));
                  if (relevantProjects.length === 0) {
                    return (
                      <div className="p-2.5 text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-center bg-slate-50/50 dark:bg-[#141820]/40">
                        {isRTL ? 'لا توجد مشاريع مسجلة لهذه المنشأة حالياً' : 'No projects recorded for this company'}
                      </div>
                    );
                  }

                  return (
                    <div className="max-h-32 overflow-y-auto p-1.5 bg-white dark:bg-[#141820] border border-slate-300 dark:border-slate-700 rounded-lg space-y-1 shadow-2xs">
                      {relevantProjects.map(p => {
                        const isSelected = selectedProjectIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedProjectIds(prev => 
                                prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                              );
                            }}
                            className={`flex items-center gap-2 p-1.5 rounded-md border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 font-bold text-blue-900 dark:text-blue-200 shadow-2xs'
                                : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                              isSelected 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 shrink-0">#{p.pr_number}</span>
                            <span className="truncate">{p.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? 'الملاحظات' : 'Notes'}</label>
                <textarea
                  rows={2}
                  placeholder={isRTL ? 'خلفية التعامل، التفضيلات، تفاصيل إضافية...' : 'Interaction background, preferences, project history...'}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeContactModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#232A38] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  {isRTL ? 'حفظ جهة الاتصال' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* WhatsApp B2B Quick Composer Modal */}
      {selectedContactForWhatsApp && (
        <WhatsAppComposerModal
          isOpen={!!selectedContactForWhatsApp}
          onClose={() => setSelectedContactForWhatsApp(null)}
          recipientPhone={selectedContactForWhatsApp.phone || ''}
          recipientName={selectedContactForWhatsApp.full_name}
          projectName={selectedContactForWhatsApp.company_name || 'Al-Mespar Projects'}
          engineerName={currentUser.full_name}
        />
      )}
    </div>
  );
}
