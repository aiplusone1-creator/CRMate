'use client';

import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Briefcase, 
  Phone, 
  Building2, 
  MapPin, 
  Mail, 
  AlertCircle,
  Search,
  ExternalLink,
  Crown,
  Sparkles
} from 'lucide-react';
import { VIPCategory, VIPPriority, VIPStatus, VIPSourceType, Project, Contact, Company } from '@/types/crm';
import { useLanguage } from '@/lib/i18n/language-context';

interface AddVIPModalProps {
  isOpen: boolean;
  defaultCategory: VIPCategory;
  projects: Project[];
  contacts: Contact[];
  companies: Company[];
  onClose: () => void;
  onAdd: (item: {
    category: VIPCategory;
    title: string;
    project_id?: string;
    project_name?: string;
    contact_id?: string;
    contact_name?: string;
    company_id?: string;
    company_name?: string;
    phone?: string;
    email?: string;
    location_name?: string;
    source_type?: VIPSourceType;
    source_note?: string;
    priority: VIPPriority;
    status: VIPStatus;
    notes?: string;
  }) => Promise<void>;
}

export function AddVIPModal({
  isOpen,
  defaultCategory,
  projects,
  contacts,
  companies,
  onClose,
  onAdd,
}: AddVIPModalProps) {
  const { isRTL } = useLanguage();

  const [category, setCategory] = useState<VIPCategory>(defaultCategory);
  const [sourceMode, setSourceMode] = useState<'existing' | 'standalone'>('existing');

  // Form fields
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [sourceNote, setSourceNote] = useState<string>('');
  const [priority, setPriority] = useState<VIPPriority>('high');
  const [status, setStatus] = useState<VIPStatus>('pending');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search in selectors
  const [projectSearch, setProjectSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');

  if (!isOpen) return null;

  const filteredProjects = projects.filter(p => 
    !projectSearch || 
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
    p.pr_number?.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.location?.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const filteredContacts = contacts.filter(c => 
    !contactSearch || 
    c.full_name.toLowerCase().includes(contactSearch.toLowerCase()) || 
    c.company_name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.phone?.includes(contactSearch)
  );

  const handleProjectSelect = (proj: Project) => {
    setSelectedProjectId(proj.id);
    setTitle(proj.name);
    setCompanyName(proj.company_name || '');
    setLocationName(proj.location || '');
  };

  const handleContactSelect = (cnt: Contact) => {
    setSelectedContactId(cnt.id);
    setTitle(cnt.full_name);
    setCompanyName(cnt.company_name || '');
    setPhone(cnt.phone || '');
    setEmail(cnt.email || '');
    setLocationName(cnt.city || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalTitle = title.trim();
    if (!finalTitle) {
      setErrorMessage(isRTL ? 'يرجى إدخال اسم المشروع أو اسم جهة الاتصال' : 'Title is required');
      return;
    }

    try {
      setIsSubmitting(true);

      const sourceType: VIPSourceType = 
        sourceMode === 'existing' 
          ? 'pipeline_existing' 
          : (sourceNote.includes('إدارة') || sourceNote.includes('مدير') ? 'manager_instruction' : 'street_spot');

      let projName = undefined;
      let cntName = undefined;

      if (category === 'revisit_project') {
        projName = finalTitle;
      } else {
        cntName = finalTitle;
      }

      await onAdd({
        category,
        title: finalTitle,
        project_id: sourceMode === 'existing' && category === 'revisit_project' ? selectedProjectId : undefined,
        project_name: projName,
        contact_id: sourceMode === 'existing' && category === 'vip_call' ? selectedContactId : undefined,
        contact_name: cntName,
        company_name: companyName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        location_name: locationName.trim() || undefined,
        source_type: sourceType,
        source_note: sourceNote.trim() || (sourceMode === 'existing' ? 'Pipeline CRM' : undefined),
        priority,
        status,
        notes: notes.trim() || undefined,
      });

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to add VIP item:', err);
      setErrorMessage(err?.message || (isRTL ? 'حدث خطأ أثناء إضافة العنصر' : 'Failed to add item'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-[#1A1F2B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {category === 'revisit_project' 
                  ? (isRTL ? 'إضافة مشروع للمعاودة والاستكشاف' : 'Add Project for Revisit')
                  : (isRTL ? 'إضافة اتصال VIP عاجل' : 'Add Urgent VIP Call')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRTL ? 'تخصيص للمتابعة السريعة دون المساس بأرقام الـ Pipeline' : 'Quick focus list isolated from pipeline numbering'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Category Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <button
              type="button"
              onClick={() => { setCategory('revisit_project'); setTitle(''); }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                category === 'revisit_project'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{isRTL ? 'معاودة مشروع' : 'Revisit Project'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setCategory('vip_call'); setTitle(''); }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                category === 'vip_call'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{isRTL ? 'اتصال VIP' : 'VIP Call'}</span>
            </button>
          </div>

          {/* Mode Selector: Existing vs Standalone */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sourceMode"
                checked={sourceMode === 'existing'}
                onChange={() => { setSourceMode('existing'); setTitle(''); }}
                className="text-amber-500 focus:ring-amber-400"
              />
              <span>
                {category === 'revisit_project' 
                  ? (isRTL ? 'مشروع مسجل في الـ Pipeline' : 'Existing Pipeline Project')
                  : (isRTL ? 'شخص مسجل في الـ Contacts' : 'Existing Contact')}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sourceMode"
                checked={sourceMode === 'standalone'}
                onChange={() => { setSourceMode('standalone'); setSelectedProjectId(''); setSelectedContactId(''); setTitle(''); }}
                className="text-amber-500 focus:ring-amber-400"
              />
              <span>
                {category === 'revisit_project'
                  ? (isRTL ? 'مشروع خارجي / رصد ميداني / توصية إدارة' : 'External / Street Spot / Manager Note')
                  : (isRTL ? 'شخص جديد غير مسجل' : 'Unregistered VIP Person')}
              </span>
            </label>
          </div>

          {/* 1. Selector for Existing Project / Contact */}
          {sourceMode === 'existing' && category === 'revisit_project' && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRTL ? 'اختر المشروع من القائمة *' : 'Select Project *'}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute top-2.5 right-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={isRTL ? 'بحث بالاسم أو رقم PR...' : 'Search by name or PR...'}
                  value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {filteredProjects.slice(0, 15).map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => handleProjectSelect(p)}
                    className={`w-full text-right p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      selectedProjectId === p.id 
                        ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-400 text-amber-900 dark:text-amber-200 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">{p.pr_number}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sourceMode === 'existing' && category === 'vip_call' && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRTL ? 'اختر جهة الاتصال *' : 'Select Contact *'}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute top-2.5 right-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={isRTL ? 'بحث بالاسم أو الشركة...' : 'Search contact...'}
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {filteredContacts.slice(0, 15).map(c => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => handleContactSelect(c)}
                    className={`w-full text-right p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      selectedContactId === c.id 
                        ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-400 text-amber-900 dark:text-amber-200 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{c.full_name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{c.company_name || c.phone}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Direct Inputs (Standalone or Editable) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {category === 'revisit_project' ? (isRTL ? 'اسم المشروع *' : 'Project Name *') : (isRTL ? 'اسم الشخص أو الصفة *' : 'Person Name or Title *')}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={category === 'revisit_project' 
                ? (isRTL ? 'مثال: برج الكورنيش الفندقي، مجمع مستودعات جنوب جدة...' : 'e.g. Corniche Hotel Tower')
                : (isRTL ? 'مثال: م. فهد الزهراني - مدير مشتريات شركة...' : 'e.g. Eng. Fahad - Procurement Director')}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'اسم الشركة أو المطور' : 'Company / Developer'}
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder={isRTL ? 'الشركة المسؤولة إن وجدت' : 'Company name if known'}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'الموقع أو المدينة أو الشارع' : 'Location / City / Street'}
              </label>
              <input
                type="text"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder={isRTL ? 'مثال: جدة - طريق الملك، الرياض...' : 'e.g. Jeddah, King Road...'}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Contact Details (Phone & Email) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'رقم الهاتف / الجوال' : 'Phone Number'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'درجة الأهمية والاستعجال' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as VIPPriority)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="urgent">{isRTL ? '🔴 عاجل جداً (Urgent)' : 'Urgent'}</option>
                <option value="high">{isRTL ? '🟠 مهم (High)' : 'High'}</option>
                <option value="normal">{isRTL ? '🔵 عادي (Normal)' : 'Normal'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'مصدر الفكرة أو التوصية' : 'Source or Referral'}
              </label>
              <input
                type="text"
                value={sourceNote}
                onChange={e => setSourceNote(e.target.value)}
                placeholder={isRTL ? 'مثال: توصية من المدير، شوهد في الطريق...' : 'e.g. Manager note, street spot...'}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'ملاحظات وتفاصيل إضافية' : 'Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isRTL ? 'اكتب ما تود تذكره دائماً بخصوص هذا العنصر...' : 'Any details to keep in mind...'}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? (isRTL ? 'جاري الإضافة...' : 'Adding...') : (isRTL ? 'إضافة إلى قائمة VIP' : 'Add to VIP List')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
