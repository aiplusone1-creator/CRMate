'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { 
  X, 
  Search, 
  HelpCircle, 
  Compass, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink,
  Kanban,
  LayoutDashboard,
  Calendar,
  Clock,
  Activity as ActivityIcon,
  Building2,
  BarChart3,
  FileText,
  Briefcase,
  ChevronDown,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Target,
  Users
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { useCRM } from '@/lib/store/crm-context';
import { 
  getModuleGuideByPath, 
  MODULE_GUIDES_AR, 
  MODULE_GUIDES_EN, 
  ModuleGuideContent 
} from '@/lib/i18n/module-guides';

export interface ModuleGuideDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultModuleId?: string;
}

const ALL_MODULES = [
  { id: 'dashboard', labelAr: 'لوحة المؤشرات', labelEn: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', labelAr: 'المشاريع والصفقات', labelEn: 'Projects Pipeline', icon: Kanban },
  { id: 'project_detail', labelAr: 'قمرة المشروع والتسعير', labelEn: 'Project Cockpit & Quotes', icon: Briefcase },
  { id: 'my_week', labelAr: 'خطة أسبوعي', labelEn: 'My Week', icon: Calendar },
  { id: 'my_day', labelAr: 'مهام يومي', labelEn: 'My Day', icon: Clock },
  { id: 'activities', labelAr: 'سجل الأنشطة', labelEn: 'Activities Log', icon: ActivityIcon },
  { id: 'companies_contacts', labelAr: 'الشركات والعملاء', labelEn: 'Companies & Contacts', icon: Building2 },
  { id: 'reports', labelAr: 'التقارير والتحليلات', labelEn: 'Reports & Analytics', icon: BarChart3 },
];

export function ModuleGuideDrawer({
  isOpen: propIsOpen,
  onClose: propOnClose,
  defaultModuleId
}: ModuleGuideDrawerProps) {
  const pathname = usePathname();
  const { language, isRTL, t } = useLanguage();
  const { isGuideOpen: contextIsOpen, closeGuide: contextCloseGuide, activeGuideModuleId } = useCRM();

  const isOpen = propIsOpen !== undefined ? propIsOpen : contextIsOpen;
  const onClose = propOnClose || contextCloseGuide;

  const [selectedModuleId, setSelectedModuleId] = useState<string>('dashboard');
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'workflow' | 'faqs'>('features');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false);

  // Sync active module based on current pathname or activeGuideModuleId
  useEffect(() => {
    if (defaultModuleId) {
      setSelectedModuleId(defaultModuleId);
    } else if (activeGuideModuleId) {
      setSelectedModuleId(activeGuideModuleId);
    } else {
      const guide = getModuleGuideByPath(pathname, language);
      if (guide && guide.id) {
        setSelectedModuleId(guide.id);
      }
    }
  }, [pathname, activeGuideModuleId, defaultModuleId, language, isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Get content for selected module
  const guideDict = language === 'ar' ? MODULE_GUIDES_AR : MODULE_GUIDES_EN;
  const currentGuide: ModuleGuideContent = guideDict[selectedModuleId] || guideDict['dashboard'];

  // Filter features/faqs if search query is entered
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return currentGuide.keySections;
    const q = searchQuery.toLowerCase();
    return currentGuide.keySections.filter(s => 
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.tip && s.tip.toLowerCase().includes(q))
    );
  }, [currentGuide, searchQuery]);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return currentGuide.faqs;
    const q = searchQuery.toLowerCase();
    return currentGuide.faqs.filter(f => 
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q)
    );
  }, [currentGuide, searchQuery]);

  if (!isOpen) return null;

  const currentModuleMeta = ALL_MODULES.find(m => m.id === selectedModuleId) || ALL_MODULES[0];
  const CurrentIcon = currentModuleMeta.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-urbanist animate-in fade-in duration-200">
      {/* Frosted Glass Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={`fixed inset-y-0 ${isRTL ? 'left-0' : 'right-0'} max-w-full flex`}>
        <div className={`w-screen max-w-xl sm:max-w-2xl bg-white dark:bg-[#181D23] shadow-2xl border-${isRTL ? 'r' : 'l'} border-slate-200 dark:border-[#8FC2F0]/15 flex flex-col transform transition-transform duration-300 ease-out`}>
          
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200/90 dark:border-[#8FC2F0]/12 bg-slate-50/80 dark:bg-[#1E2328]/90">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Glowing (i) Badge */}
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8FC2F0] to-[#77CE69] text-[#1E2328] flex items-center justify-center font-mono font-black italic text-lg shadow-[0_0_20px_rgba(143,194,240,0.4)] shrink-0">
                  i
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#8FC2F0] px-2 py-0.5 rounded-full bg-[#8FC2F0]/15 border border-[#8FC2F0]/25">
                      {currentGuide.badge || (isRTL ? 'شركة المسبار العالمي للمقاولات' : 'Al-Mespar Global Contracting')}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate mt-0.5">
                    {currentGuide.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label={t('closeGuide')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Module Switcher Dropdown & Search */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              {/* Module Dropdown */}
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setIsModuleSelectorOpen(!isModuleSelectorOpen)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-[#22272E] border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-[#8FC2F0] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CurrentIcon className="w-4 h-4 text-[#8FC2F0] shrink-0" />
                    <span className="text-slate-400 dark:text-slate-500 font-normal">
                      {t('switchModule')}:
                    </span>
                    <span className="truncate">
                      {isRTL ? currentModuleMeta.labelAr : currentModuleMeta.labelEn}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isModuleSelectorOpen ? 'rotate-180' : ''}`} />
                </button>

                {isModuleSelectorOpen && (
                  <div className="absolute top-full mt-1.5 inset-x-0 bg-white dark:bg-[#1E2328] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('allModules')}
                    </div>
                    {ALL_MODULES.map(m => {
                      const Icon = m.icon;
                      const isSelected = m.id === selectedModuleId;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedModuleId(m.id);
                            setIsModuleSelectorOpen(false);
                            setSearchQuery('');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] font-black'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-[#8FC2F0]' : 'text-slate-400'}`} />
                            <span className="truncate">{isRTL ? m.labelAr : m.labelEn}</span>
                          </div>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#8FC2F0]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Instant Search Bar */}
              <div className="relative flex-1">
                <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchGuide')}
                  className={`w-full py-2 bg-white dark:bg-[#22272E] border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#8FC2F0] shadow-2xs ${
                    isRTL ? 'pr-8 pl-8' : 'pl-8 pr-8'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-2.5' : 'right-2.5'} text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 4 Interactive Navigation Tabs */}
            <div className="mt-4 flex gap-1 bg-slate-200/70 dark:bg-slate-800/70 p-1 rounded-xl overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('features')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'features'
                    ? 'bg-white dark:bg-[#292D32] text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('guideKeyFeatures')}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                  {currentGuide.keySections.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-[#292D32] text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('guideOverview')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('workflow')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'workflow'
                    ? 'bg-white dark:bg-[#292D32] text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('guideDailyWorkflow')}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                  {currentGuide.dailyWorkflow.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('faqs')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'faqs'
                    ? 'bg-white dark:bg-[#292D32] text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                <span>{t('guideFAQs')}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                  {currentGuide.faqs.length}
                </span>
              </button>
            </div>
          </div>

          {/* Drawer Body Scroll Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* TAB 1: Key Features & Buttons Breakdown */}
            {activeTab === 'features' && (
              <div className="space-y-3.5">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isRTL 
                    ? `شرح تفصيلي لكافة أزرار وبطاقات ومؤشرات هذا الموديول (${filteredSections.length} ميزة مشروحة):` 
                    : `In-depth breakdown of every card, button, and metric in this module (${filteredSections.length} documented):`}
                </div>

                {filteredSections.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {isRTL ? 'لم يتم العثور على ميزات مطابقة للبحث' : 'No features match your search'}
                    </p>
                  </div>
                ) : (
                  filteredSections.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className="p-4 rounded-2xl bg-white dark:bg-[#1E2328] border border-slate-200 dark:border-slate-800 hover:border-[#8FC2F0]/40 transition-all shadow-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#8FC2F0]/15 text-[#8FC2F0] flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                        {item.description}
                      </p>

                      {item.tip && (
                        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/05 to-transparent dark:from-amber-400/10 dark:via-amber-400/05 dark:to-transparent border border-amber-500/25 flex items-start gap-2.5">
                          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="text-[11px] leading-snug text-amber-900 dark:text-amber-200">
                            <span className="font-black block mb-0.5">
                              {isRTL ? '💡 نصيحة مهندس المبيعات في المسبار:' : '💡 Sales Engineer Pro Tip:'}
                            </span>
                            <span>{item.tip}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: Overview & Purpose */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Executive Summary Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-transparent dark:from-[#1E2328] dark:to-[#22272E] border border-blue-200/70 dark:border-[#8FC2F0]/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-700 dark:text-[#8FC2F0]">
                    <Target className="w-4 h-4" />
                    <span>{isRTL ? 'الهدف التشغيلي للموديول' : 'Module Business Objective'}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                    {currentGuide.summary}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {currentGuide.purpose}
                  </p>
                </div>

                {/* Target Roles Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1E2328] border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Users className="w-4 h-4 text-[#8FC2F0]" />
                    <span>{isRTL ? 'الفئات والصلاحيات المعنية' : 'Target Roles & Permissions'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentGuide.targetRoles.map((role, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{role}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Al-Mespar Regional Culture Note */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E2328]/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isRTL ? 'معايير الجودة في شركة المسبار العالمي للمقاولات:' : 'Al-Mespar Global Contracting Standard:'}
                  </span>
                  {isRTL 
                    ? 'يعتمد نجاح الصفقات في مشاريع التكييف والمقاولات على التحديث الفوري للبيانات بعد كل زيارة أو اتصال، ومراجعة تواريخ الاستحقاق باستمرار لضمان تقديم عروض الأسعار والتسعير في الوقت المحدد.'
                    : 'Commercial deal velocity relies on prompt post-visit logging and proactive milestone tracking to submit technical submittals and commercial quotes on schedule.'}
                </div>
              </div>
            )}

            {/* TAB 3: Daily New Hire Workflow */}
            {activeTab === 'workflow' && (
              <div className="space-y-3.5">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isRTL 
                    ? 'خطوات العمل اليومية الموصى بها لأي موظف جديد في المسبار:' 
                    : 'Recommended daily operating procedure for new team members at Al-Mespar:'}
                </div>

                <div className="space-y-3">
                  {currentGuide.dailyWorkflow.map((step) => (
                    <div 
                      key={step.stepNumber}
                      className="p-4 rounded-2xl bg-white dark:bg-[#1E2328] border border-slate-200 dark:border-slate-800 flex items-start gap-3.5 shadow-2xs hover:border-[#8FC2F0]/40 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                        {step.stepNumber}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          {step.title}
                        </h4>
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                          {step.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: FAQs & Best Practices */}
            {activeTab === 'faqs' && (
              <div className="space-y-3.5">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isRTL 
                    ? 'أهم الأسئلة الشائعة التي تواجه مهندسي المبيعات الجدد:' 
                    : 'Frequently asked questions and best practices:'}
                </div>

                {filteredFaqs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {isRTL ? 'لم يتم العثور على نتائج' : 'No matching questions found'}
                    </p>
                  </div>
                ) : (
                  filteredFaqs.map((faq, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-2xl bg-white dark:bg-[#1E2328] border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <HelpCircle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                        <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                          {faq.question}
                        </h4>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal ps-6">
                        {faq.answer}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200/90 dark:border-[#8FC2F0]/12 bg-slate-50/80 dark:bg-[#1E2328]/90 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[11px] truncate">
                {isRTL ? 'شركة المسبار العالمي للمقاولات' : 'Al-Mespar Global Contracting'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#292D32] dark:bg-white text-white dark:text-[#292D32] rounded-xl font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              {t('closeGuide')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
