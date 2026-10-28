'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Phone, 
  Users, 
  Building2, 
  Target, 
  MapPin, 
  Briefcase, 
  Plus,
  Send,
  Sparkles,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { 
  ACTIVITY_CHANNELS, 
  VISIT_PURPOSES, 
  ACTIVITY_OUTCOMES,
  QUICK_AREAS,
  TIME_SLOTS
} from '@/lib/constants';
import { 
  ActivityChannel, 
  VisitPurpose, 
  ActivityOutcome,
  ProjectPriority,
  Project
} from '@/types/crm';
import { useLanguage } from '@/lib/i18n/language-context';
import { cn } from '@/lib/utils';

export type ActivityTargetMode = 'existing_project' | 'custom_project' | 'area_hunting';

const OUTCOME_LABELS_AR: Record<string, string> = {
  connected: 'تم التواصل / قيد المتابعة',
  meeting_booked: 'تم حجز اجتماع',
  quotation_sent: 'تم إرسال عرض سعر',
  awaiting_feedback: 'في انتظار رد العميل',
  rfq_received: 'تم استلام طلب تسعير (RFQ)',
  requirement_received: 'تم استلام المواصفات',
  technical_feedback_needed: 'مطلوب مراجعة فنية',
  procurement_contact_needed: 'مطلوب التواصل مع المشتريات',
  follow_up_later: 'متابعة لاحقة',
  no_answer: 'لا يوجد رد',
  won: 'تمت الترسية (Won)',
  lost: 'خسارة الصفقة (Lost)',
  hold: 'معلّق مؤقتاً',
  new_project_identified: 'اكتشاف مشروع جديد',
  other: 'أخرى',
};

export interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  initialDate?: string;
  initialTime?: string;
  initialProject?: Project | null;
  initialContactId?: string;
  plannedActivityId?: string;
  defaultGoal?: string;
  defaultChannel?: ActivityChannel;
  defaultPurpose?: VisitPurpose;
  initialTargetMode?: ActivityTargetMode;
  initialCustomProjectName?: string;
  initialCompanyName?: string;
  initialLocationName?: string;
  initialGoogleMapsUrl?: string;
  initialPriority?: ProjectPriority;
}

export function AddActivityModal({ 
  isOpen, 
  onClose, 
  defaultDate,
  initialDate,
  initialTime,
  initialProject,
  initialContactId,
  plannedActivityId,
  defaultGoal,
  defaultChannel,
  defaultPurpose,
  initialTargetMode,
  initialCustomProjectName,
  initialCompanyName,
  initialLocationName,
  initialGoogleMapsUrl,
  initialPriority
}: AddActivityModalProps) {
  const { 
    projects, 
    companies, 
    contacts, 
    addActivity, 
    completePlannedActivity,
    currentUser, 
    teamMembers 
  } = useCRM();
  const { t, isRTL } = useLanguage();

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin';
  const salesReps = teamMembers.filter(m => m.role === 'sales_engineer' || (m.role as string) === 'sales_rep');
  const [assignedUserId, setAssignedUserId] = useState<string>(currentUser.id);

  // 1. Day & Time
  const [activityDate, setActivityDate] = useState('');
  const [activityTime, setActivityTime] = useState('10:00 AM');

  // 2. Target Mode & Inputs
  const [targetMode, setTargetMode] = useState<ActivityTargetMode>('existing_project');
  const [projectId, setProjectId] = useState('');
  const [contactId, setContactId] = useState('');
  const [customProjectName, setCustomProjectName] = useState('');
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [locationAreaName, setLocationAreaName] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // 3. Channel & Purpose
  const [channel, setChannel] = useState<ActivityChannel>('call');
  const [purpose, setPurpose] = useState<VisitPurpose>('follow_up');

  // 4. Action / Goal Notes & Outcome
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState<ActivityOutcome>('connected');
  const [priority, setPriority] = useState<ProjectPriority>('high');

  // 5. Next Steps
  const [nextAction, setNextAction] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected project object
  const selectedExistingProject = useMemo(() => {
    return projects.find(p => p.id === projectId);
  }, [projects, projectId]);

  // Project contacts list
  const projectContacts = useMemo(() => {
    if (!selectedExistingProject) return [];
    const compId = selectedExistingProject.company_id;
    return contacts.filter(c => {
      if (selectedExistingProject.contact_ids?.includes(c.id)) return true;
      if (c.id === selectedExistingProject.primary_contact_id) return true;
      if (compId && c.company_id === compId) return true;
      return false;
    });
  }, [contacts, selectedExistingProject]);

  useEffect(() => {
    if (isOpen) {
      setAssignedUserId(currentUser.id);

      // Format today local date: YYYY-MM-DD
      const localToday = new Date();
      const localTodayStr = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;
      setActivityDate(initialDate || defaultDate || localTodayStr);
      setActivityTime(initialTime || '10:00 AM');

      // Determine Target Mode
      if (initialTargetMode) {
        setTargetMode(initialTargetMode);
      } else if (initialProject) {
        setTargetMode('existing_project');
      } else if (initialLocationName && !initialCustomProjectName) {
        setTargetMode('area_hunting');
      } else if (initialCustomProjectName) {
        setTargetMode('custom_project');
      } else {
        setTargetMode('existing_project');
      }

      // Existing Project
      if (initialProject) {
        setProjectId(initialProject.id);
        setContactId(initialContactId || initialProject.primary_contact_id || '');
        if (initialProject.location) setLocationAreaName(initialProject.location);
      } else if (projects.length > 0) {
        setProjectId(projects[0].id);
        setContactId(initialContactId || projects[0].primary_contact_id || '');
        if (projects[0].location) setLocationAreaName(projects[0].location);
      } else {
        setProjectId('');
        setContactId(initialContactId || '');
      }

      // Custom fields
      setCustomProjectName(initialCustomProjectName || '');
      setCustomCompanyName(initialCompanyName || '');
      setLocationAreaName(initialLocationName || '');
      setGoogleMapsUrl(initialGoogleMapsUrl || '');

      // Channel & Purpose
      setChannel(defaultChannel || 'call');
      setPurpose(defaultPurpose || 'follow_up');

      // Notes & Outcome
      setNotes(defaultGoal || '');
      setOutcome('connected');
      setPriority(initialPriority || 'high');

      setNextAction('');
      setNextFollowUpAt('');
    }
  }, [
    isOpen, 
    defaultDate, 
    initialDate, 
    initialTime, 
    initialProject, 
    initialContactId, 
    defaultGoal, 
    defaultChannel, 
    defaultPurpose, 
    initialTargetMode,
    initialCustomProjectName,
    initialCompanyName,
    initialLocationName,
    initialGoogleMapsUrl,
    initialPriority,
    projects, 
    currentUser.id
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setIsSubmitting(true);
    const assignedUser = teamMembers.find(m => m.id === assignedUserId) || currentUser;
    const matchedContact = contacts.find(c => c.id === contactId);

    // Build unified activity payload
    let finalProjectName: string | undefined;
    let finalProjectId: string | undefined;
    let finalCompanyName: string | undefined;
    let finalCompanyId: string | undefined;
    let finalLocation = locationAreaName.trim();

    if (targetMode === 'existing_project') {
      finalProjectId = projectId || undefined;
      finalProjectName = selectedExistingProject?.name;
      finalCompanyId = selectedExistingProject?.company_id;
      finalCompanyName = selectedExistingProject?.company_name;
      if (!finalLocation && selectedExistingProject?.location) {
        finalLocation = selectedExistingProject.location;
      }
    } else if (targetMode === 'custom_project') {
      finalProjectName = customProjectName.trim();
      finalCompanyName = customCompanyName.trim() || undefined;
    } else if (targetMode === 'area_hunting') {
      finalProjectName = isRTL ? `زيارة استكشافية: ${locationAreaName.trim()}` : `Field Hunting: ${locationAreaName.trim()}`;
      finalCompanyName = customCompanyName.trim() || undefined; // target sector
    }

    const activityPayload = {
      user_id: isManager && assignedUserId ? assignedUserId : currentUser.id,
      user_name: isManager && assignedUser ? assignedUser.full_name : currentUser.full_name,
      channel,
      visit_purpose: purpose,
      activity_date: activityDate,
      activity_time: activityTime || undefined,
      outcome,
      notes: notes.trim(),
      next_action: nextAction.trim() || undefined,
      next_follow_up_at: nextFollowUpAt || undefined,
      project_id: finalProjectId,
      project_name: finalProjectName,
      company_id: finalCompanyId,
      company_name: finalCompanyName,
      contact_id: contactId || undefined,
      contact_name: matchedContact?.full_name || undefined,
      location_name: finalLocation || undefined,
      google_maps_url: googleMapsUrl.trim() || undefined,
      priority,
    };

    if (plannedActivityId) {
      await completePlannedActivity(plannedActivityId, activityPayload);
    } else {
      await addActivity(activityPayload);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1C2130] rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-[#8FC2F0]/15 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#232A38] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isRTL ? 'تسجيل نشاط مبيعات' : 'Log Sales Activity'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {plannedActivityId 
                  ? (isRTL ? 'توثيق إنجاز النشاط ونقله لسجل الأنشطة في نفس اليوم' : 'Document executed plan & log to Activities on the same day')
                  : (isRTL ? 'توثيق زيارة، مكالمة، أو اجتماع مقاولين' : 'Record executed visit, call, or client meeting')}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          
          {/* Manager / Admin: Assign Activity To */}
          {isManager && (
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-1">
              <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{isRTL ? 'تسجيل النشاط باسم مهندس المبيعات:' : 'Assign Activity To:'}</span>
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  {currentUser.role === 'admin' ? (isRTL ? 'مدير عام' : 'Admin') : (isRTL ? 'مدير مبيعات' : 'Sales Manager')}
                </span>
              </label>
              <select
                value={assignedUserId}
                onChange={e => setAssignedUserId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold border border-amber-300/80 dark:border-amber-700/80 rounded-lg bg-white dark:bg-[#141820] text-slate-900 dark:text-white"
              >
                <option value={currentUser.id}>
                  {currentUser.full_name} ({currentUser.role === 'admin' ? (isRTL ? 'المدير العام' : 'Admin') : (isRTL ? 'مدير المبيعات' : 'Sales Manager')})
                </option>
                {salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>
                    {rep.full_name} ({isRTL ? 'مهندس مبيعات' : 'Sales Engineer'}{rep.territory ? ` - ${rep.territory}` : ''})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1. Day & Time Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>{isRTL ? 'تاريخ التنفيذ *' : 'Execution Day *'}</span>
              </label>
              <input
                type="date"
                required
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>{isRTL ? 'وقت التنفيذ' : 'Target Time'}</span>
              </label>
              <select
                value={activityTime}
                onChange={(e) => setActivityTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white"
              >
                {TIME_SLOTS.map(slot => (
                  <option key={slot} value={slot} className="dark:bg-[#141820] dark:text-white">{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Target Planning Mode Tabs (Existing Project vs Custom Deal vs Area/Hunting) */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('targetActivityType') || (isRTL ? 'نوع النشاط المستهدف' : 'Target Activity Type')}
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-[#141820] rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTargetMode('existing_project')}
                className={cn(
                  "py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer",
                  targetMode === 'existing_project' 
                    ? "bg-white dark:bg-[#232A38] text-blue-600 dark:text-[#8FC2F0] shadow-2xs" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{t('existingProject') || (isRTL ? 'مشروع مسجل' : 'Existing Project')}</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('custom_project')}
                className={cn(
                  "py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer",
                  targetMode === 'custom_project' 
                    ? "bg-white dark:bg-[#232A38] text-purple-600 dark:text-purple-300 shadow-2xs" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{t('newCustomDeal') || (isRTL ? 'صفقة جديدة' : 'New / Custom Deal')}</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('area_hunting')}
                className={cn(
                  "py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer",
                  targetMode === 'area_hunting' 
                    ? "bg-white dark:bg-[#232A38] text-amber-600 dark:text-amber-400 shadow-2xs" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Target className="w-3.5 h-3.5" />
                <span>{t('areaHunting') || (isRTL ? 'منطقة استكشاف' : 'Area / Field Hunting')}</span>
              </button>
            </div>
          </div>

          {/* 3. Conditional Inputs based on Target Mode */}
          {targetMode === 'existing_project' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'اختر المشروع المسجل' : 'Select Existing Project'} *
                </label>
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    const p = projects.find(proj => proj.id === e.target.value);
                    if (p?.location) setLocationAreaName(p.location);
                    if (p?.primary_contact_id) setContactId(p.primary_contact_id);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white"
                >
                  <option value="" className="dark:bg-[#141820] dark:text-white">-- {isRTL ? 'اختر المشروع' : 'Select Project'} --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="dark:bg-[#141820] dark:text-white">
                      {p.pr_number} &bull; {p.name} ({p.company_name} - {p.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Contact Person for this project */}
              {projectContacts.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'مسؤول الاتصال المعني' : 'Contact Person'}
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white"
                  >
                    <option value="" className="dark:bg-[#141820] dark:text-white">-- {isRTL ? 'بدون جهة اتصال محددة' : 'General / No Specific Contact'} --</option>
                    {projectContacts.map(c => (
                      <option key={c.id} value={c.id} className="dark:bg-[#141820] dark:text-white">
                        {c.full_name} ({c.job_title || 'Contact'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {targetMode === 'custom_project' && (
            <div className="space-y-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40">
              <div>
                <label className="block font-bold text-purple-900 dark:text-purple-300 mb-1">
                  {t('projectNameLabel') || (isRTL ? 'اسم المشروع / الصفقة' : 'Project / Deal Name')} *
                </label>
                <input
                  type="text"
                  required
                  value={customProjectName}
                  onChange={(e) => setCustomProjectName(e.target.value)}
                  placeholder={isRTL ? "مثال: برج أبحر السكني، توسعة جامعة الطائف" : "e.g. Obhur Residential Tower, Taif University Expansion"}
                  className="w-full px-3 py-2 bg-white dark:bg-[#141820] border border-purple-200 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold text-purple-900 dark:text-purple-100 placeholder:text-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-purple-900 dark:text-purple-300 mb-1">
                    {isRTL ? 'العميل / المقاول' : 'Client / Contractor'}
                  </label>
                  <input
                    type="text"
                    value={customCompanyName}
                    onChange={(e) => setCustomCompanyName(e.target.value)}
                    placeholder={isRTL ? "مجموعة بن لادن، البواني" : "e.g. Binladin Group, Al Bawani"}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#141820] border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-purple-900 dark:text-purple-100 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-purple-900 dark:text-purple-300 mb-1">
                    {isRTL ? 'المدينة / المنطقة' : 'City / Region'}
                  </label>
                  <input
                    type="text"
                    value={locationAreaName}
                    onChange={(e) => setLocationAreaName(e.target.value)}
                    placeholder={isRTL ? "جدة، مكة، ينبع" : "e.g. Jeddah, Makkah, Yanbu"}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#141820] border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-purple-900 dark:text-purple-100 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {targetMode === 'area_hunting' && (
            <div className="space-y-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
              <div>
                <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                  {t('targetAreaLabel') || (isRTL ? 'المنطقة أو المخطط المستهدف' : 'Target Area / Location')} *
                </label>
                <input
                  type="text"
                  required
                  value={locationAreaName}
                  onChange={(e) => setLocationAreaName(e.target.value)}
                  placeholder={isRTL ? "مثال: صناعية جدة الثانية، طريق ميناء ينبع" : "e.g. Jeddah Industrial Area 2, Yanbu Port Road"}
                  className="w-full px-3 py-2 bg-white dark:bg-[#141820] border border-amber-200 dark:border-amber-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold text-amber-900 dark:text-amber-100 placeholder:text-slate-400"
                />
              </div>

              {/* Quick Western Region Presets */}
              <div>
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block mb-1">
                  {isRTL ? 'مناطق سريعة بالغربية:' : 'Quick Western Region Zones:'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {QUICK_AREAS.slice(0, 4).map(area => {
                    const areaLabel = isRTL ? area.ar : area.en;
                    return (
                      <button
                        key={area.en}
                        type="button"
                        onClick={() => setLocationAreaName(areaLabel)}
                        className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-[#1C2130] hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium transition-colors cursor-pointer"
                      >
                        {areaLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                  {isRTL ? 'القطاع أو نشاط المنشأة المستهدفة' : 'Target Sector / Organization Focus'}
                </label>
                <input
                  type="text"
                  value={customCompanyName}
                  onChange={(e) => setCustomCompanyName(e.target.value)}
                  placeholder={isRTL ? "مثال: مقاولو التكييف، مكاتب الاستشارات الهندسية" : "e.g. HVAC Contractors, Engineering Consultants"}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#141820] border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-100 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* 4. Google Maps Location Link Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('googleMapsLink') || (isRTL ? 'رابط الموقع على خرائط جوجل' : 'Google Maps Location Link')}</span>
              </label>

              {/* Search on Google Maps Helper */}
              {(locationAreaName || customProjectName || selectedExistingProject) && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    targetMode === 'area_hunting' ? locationAreaName :
                    targetMode === 'custom_project' ? `${customProjectName} ${locationAreaName}` :
                    `${selectedExistingProject?.name} ${selectedExistingProject?.location || 'Jeddah'}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-blue-600 dark:text-[#8FC2F0] hover:underline flex items-center gap-0.5"
                >
                  <span>Find on Google Maps ↗</span>
                </a>
              )}
            </div>

            <div className="relative">
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/... or paste location URL"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px] text-slate-800 dark:text-white placeholder:text-slate-400"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Allows 1-click GPS navigation straight to the site from your mobile or laptop
            </p>
          </div>

          {/* 5. Sales Channel & Visit Purpose */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'قناة التواصل' : 'Sales Channel'}
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ActivityChannel)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white"
              >
                {ACTIVITY_CHANNELS.map(ch => (
                  <option key={ch.value} value={ch.value} className="dark:bg-[#141820] dark:text-white">{ch.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'الغرض من الزيارة / الإجراء' : 'Visit Purpose'}
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as VisitPurpose)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white"
              >
                {VISIT_PURPOSES.map(vp => (
                  <option key={vp.value} value={vp.value} className="dark:bg-[#141820] dark:text-white">{vp.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 6. Action Details / Goal & Outcome */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'بيان ما تم إنجازه / ملخص النشاط *' : 'Action & Target Goal *'}
              </label>
              <textarea
                required
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isRTL ? "مثال: تم لقاء مدير المشتريات م. خالد ومناقشة تفاصيل عرض السعر ومطابقة المواصفات الفنية..." : "e.g. Met with procurement manager, reviewed submittals, addressed technical questions"}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white placeholder:text-slate-400 text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'نتيجة النشاط (Outcome) *' : 'Activity Outcome *'}
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as ActivityOutcome)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-white"
                >
                  {ACTIVITY_OUTCOMES.map(out => (
                    <option key={out.value} value={out.value} className="dark:bg-[#141820] dark:text-white">
                      {isRTL ? (OUTCOME_LABELS_AR[out.value] || out.label) : out.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'الأولوية' : 'Priority'}
                </label>
                <div className="flex items-center gap-1">
                  {(['urgent', 'high', 'medium', 'low'] as ProjectPriority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg border capitalize font-bold text-[10px] transition-all cursor-pointer ${
                        priority === p 
                          ? 'bg-blue-600 dark:bg-[#8FC2F0] text-white dark:text-[#141820] border-blue-600 dark:border-[#8FC2F0] shadow-xs' 
                          : 'bg-slate-50 dark:bg-[#141820] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 7. Next Steps (Optional) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'الإجراء القادم (اختياري)' : 'Next Action (Optional)'}
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder={isRTL ? "مثال: إرسال عرض سعر محدث" : "e.g. Send revised quotation"}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'موعد المتابعة القادمة' : 'Next Follow-up Date'}
              </label>
              <input
                type="date"
                value={nextFollowUpAt}
                onChange={(e) => setNextFollowUpAt(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white font-mono"
              />
            </div>

            {nextAction.trim() && nextFollowUpAt && (
              <div className="col-span-1 sm:col-span-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center gap-2 text-amber-800 dark:text-amber-200 text-[11px] font-semibold animate-in fade-in duration-150">
                <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {isRTL 
                    ? `📅 سيتم إدراج هذا الإجراء تلقائياً في الخطة الأسبوعية بتاريخ ${nextFollowUpAt} كنشاط متابعة باللون الأصفر`
                    : `📅 This action will be automatically scheduled in your Weekly Plan on ${nextFollowUpAt} as a yellow follow-up`}
                </span>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !notes.trim()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-[#8FC2F0] dark:hover:bg-[#7ab2e3] text-white dark:text-[#141820] font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? (isRTL ? 'جاري الحفظ...' : 'Saving...') 
                  : (isRTL ? 'حفظ وتسجيل النشاط' : 'Save Activity')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
