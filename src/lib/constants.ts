// ==============================================================================
// Al Mespar Sales CRM - Master Constants & Dropdowns (Derived from Workbook & PRD)
// ==============================================================================

import { 
  CompanyType, 
  OpportunityType, 
  PipelineStage, 
  ActivityChannel, 
  VisitPurpose, 
  ActivityOutcome,
  ProjectPriority,
  RFQPackage,
  SubmittalStatus
} from '@/types/crm';

export const SAUDI_LOCATIONS: string[] = [
  'Jeddah',
  'Makkah',
  'Madinah',
  'Riyadh',
  'Khobar',
  'Dammam',
  'RedSea',
  'Neom',
  'Abha',
  'Jizan',
  'Najran',
  'Qassim',
  'Rabigh',
  'Yanbu',
  'Jubail',
  'Dhahran',
  'Arar',
  'Kharj',
  'Tabouk',
  'Tanajib',
  'Al Ahsa',
  'Ras Alkhair',
  'Alula',
  'Qatif',
  'Qiddiyah',
  'Al Khafji'
];

export const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: 'contractor', label: 'Main Contractor' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'mep_contractor', label: 'MEP Contractor' },
  { value: 'developer', label: 'Developer / Real Estate' },
  { value: 'client_owner', label: 'Client / Owner' },
  { value: 'supplier_vendor', label: 'Supplier / Vendor' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'hospital', label: 'Hospital / Healthcare' },
  { value: 'other', label: 'Other' },
];

export const OPPORTUNITY_TYPES: { value: OpportunityType; label: string }[] = [
  { value: 'in_hand', label: 'In Hand' },
  { value: 'tender', label: 'Tender' },
  { value: 'new_lead', label: 'New Lead' },
  { value: 'existing_account', label: 'Existing Account' },
  { value: 'upgrade_retrofit', label: 'Upgrade / Retrofit' },
  { value: 'hunting_potential', label: 'Hunting / Potential' },
];

export const PIPELINE_STAGES: { 
  value: PipelineStage; 
  label: string; 
  labelAr: string; 
  color: string; 
  badgeClass: string;
}[] = [
  { value: 'lead', label: 'Lead', labelAr: 'عميل محتمل (Lead)', color: '#94a3b8', badgeClass: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  { value: 'rfq_processing', label: 'RFQ Processing', labelAr: 'طلب تسعير (RFQ Processing)', color: '#0284c7', badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50' },
  { value: 'quotation_sent', label: 'Quotation Sent', labelAr: 'عرض سعر مرسل (Quotation Sent)', color: '#2563eb', badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50' },
  { value: 'technical_submission', label: 'Technical Submittal', labelAr: 'الاعتماد الفني (Technical Submittal)', color: '#7c3aed', badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50' },
  { value: 'negotiation', label: 'Negotiation', labelAr: 'التفاوض النهائي (Negotiation)', color: '#d97706', badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50' },
  { value: 'won', label: 'Won', labelAr: 'صفقة رابحة (Won)', color: '#16a34a', badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50' },
  { value: 'lost', label: 'Lost', labelAr: 'صفقة خاسرة (Lost)', color: '#dc2626', badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50' },
  { value: 'pricing', label: 'Pricing', labelAr: 'تسعير', color: '#0d9488', badgeClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/50' },
  { value: 'technically_approved', label: 'Technically Approved', labelAr: 'معتمد فنياً', color: '#9333ea', badgeClass: 'bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800/50' },
  { value: 'qualification', label: 'Qualification', labelAr: 'تأهيل المشروع', color: '#64748b', badgeClass: 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700' },
  { value: 'hold', label: 'Hold', labelAr: 'معلق', color: '#6b7280', badgeClass: 'bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' },
];

export const RFQ_PACKAGES: { 
  value: RFQPackage; 
  label: string; 
  labelAr: string; 
  badgeClass: string; 
  icon: string;
}[] = [
  { value: 'lc', label: 'Light Current (LC)', labelAr: 'تيارات خفيفة (LC)', badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300 dark:border-sky-800', icon: '⚡' },
  { value: 'bms', label: 'BMS Automation', labelAr: 'إدارة مباني (BMS)', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800', icon: '🏢' },
  { value: 'both', label: 'LC + BMS (Combined)', labelAr: 'تيارات خفيفة وإدارة مباني (LC + BMS)', badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800', icon: '⚡🏢' },
];

export const SUBMITTAL_STATUSES: { 
  value: SubmittalStatus; 
  label: string; 
  labelAr: string; 
  badgeClass: string;
}[] = [
  { value: 'under_approval', label: 'Under Approval', labelAr: 'قيد الاعتماد', badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700' },
  { value: 'approved', label: 'Approved', labelAr: 'معتمد', badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700' },
  { value: 'approved_with_comments', label: 'Approved with Comments', labelAr: 'معتمد بملاحظات', badgeClass: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700' },
  { value: 'rejected', label: 'Rejected', labelAr: 'مرفوض', badgeClass: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700' },
];

export const COMMERCIAL_VALUE_STAGES: PipelineStage[] = [
  'quotation_sent',
  'technical_submission',
  'technically_approved',
  'negotiation',
  'won',
  'lost',
  'hold'
];

export function canEditCommercialValue(stage: PipelineStage | string | undefined): boolean {
  if (!stage) return false;
  return COMMERCIAL_VALUE_STAGES.includes(stage as PipelineStage);
}

export const PROJECT_PRIORITIES: { value: ProjectPriority; label: string; badgeClass: string }[] = [
  { value: 'low', label: 'Low', badgeClass: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300' },
  { value: 'medium', label: 'Medium', badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' },
  { value: 'high', label: 'High', badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' },
  { value: 'urgent', label: 'Urgent', badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold' },
];

export const ACTIVITY_CHANNELS: { value: ActivityChannel; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'meeting_f2f', label: 'F2F Meeting' },
  { value: 'meeting_online', label: 'Online Meeting' },
  { value: 'visit', label: 'Visit' },
  { value: 'hunting', label: 'Hunting' },
  { value: 'office_work', label: 'Office Work' },
  { value: 'event', label: 'Event' },
  { value: 'email', label: 'Email' },
];

export const VISIT_PURPOSES: { value: VisitPurpose; label: string }[] = [
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'new_lead', label: 'New Lead' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'consultant_visit', label: 'Consultant Visit' },
  { value: 'customer_visit', label: 'Customer Visit' },
  { value: 'technical_clarification', label: 'Technical Clarification' },
  { value: 'quotation_delivery', label: 'Quotation Delivery' },
];

export const ACTIVITY_OUTCOMES: { value: ActivityOutcome; label: string }[] = [
  { value: 'connected', label: 'Connected' },
  { value: 'meeting_booked', label: 'Meeting Booked' },
  { value: 'quotation_sent', label: 'Quotation Sent' },
  { value: 'awaiting_feedback', label: 'Awaiting Feedback' },
  { value: 'rfq_received', label: 'RFQ Received' },
  { value: 'requirement_received', label: 'Requirement Received' },
  { value: 'technical_feedback_needed', label: 'Technical Feedback Needed' },
  { value: 'procurement_contact_needed', label: 'Procurement Contact Needed' },
  { value: 'follow_up_later', label: 'Follow Up Later' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'hold', label: 'Hold' },
  { value: 'new_project_identified', label: 'New Project Identified' },
  { value: 'other', label: 'Other' },
];

export interface ProjectCardColorOption {
  id: string;
  name: string;
  nameAr: string;
  dotColor: string;
  dotClass: string;
  cardClass: string;
  borderHover: string;
}

export const PROJECT_CARD_COLORS: ProjectCardColorOption[] = [
  {
    id: 'default',
    name: 'Default White',
    nameAr: 'الافتراضي (أبيض)',
    dotColor: '#94a3b8',
    dotClass: 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600',
    cardClass: '',
    borderHover: 'hover:border-slate-300 dark:hover:border-slate-700'
  },
  {
    id: 'blue',
    name: 'Sky Blue',
    nameAr: 'أزرق سماوي',
    dotColor: '#3b82f6',
    dotClass: 'bg-blue-500 border-blue-400',
    cardClass: 'crm-card-blue',
    borderHover: 'hover:border-blue-400 dark:hover:border-blue-700'
  },
  {
    id: 'emerald',
    name: 'Emerald Mint',
    nameAr: 'أخضر زمردي',
    dotColor: '#10b981',
    dotClass: 'bg-emerald-500 border-emerald-400',
    cardClass: 'crm-card-emerald',
    borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-700'
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    nameAr: 'بنفسجي ملكي',
    dotColor: '#a855f7',
    dotClass: 'bg-purple-500 border-purple-400',
    cardClass: 'crm-card-purple',
    borderHover: 'hover:border-purple-400 dark:hover:border-purple-700'
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    nameAr: 'عسلي دافئ',
    dotColor: '#f59e0b',
    dotClass: 'bg-amber-500 border-amber-400',
    cardClass: 'crm-card-amber',
    borderHover: 'hover:border-amber-400 dark:hover:border-amber-700'
  },
  {
    id: 'rose',
    name: 'Coral Rose',
    nameAr: 'وردي مرجاني',
    dotColor: '#f43f5e',
    dotClass: 'bg-rose-500 border-rose-400',
    cardClass: 'crm-card-rose',
    borderHover: 'hover:border-rose-400 dark:hover:border-rose-700'
  }
];

