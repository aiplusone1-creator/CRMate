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
  ProjectPriority
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
  color: string; 
  badgeClass: string;
}[] = [
  { value: 'lead', label: 'Lead', color: '#94a3b8', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'qualification', label: 'Qualification', color: '#64748b', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' },
  { value: 'rfq_processing', label: 'RFQ Processing', color: '#0284c7', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'pricing', label: 'Pricing', color: '#0d9488', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'quotation_sent', label: 'Quotation Sent', color: '#2563eb', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'technical_submission', label: 'Technical Submission', color: '#7c3aed', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'technically_approved', label: 'Technically Approved', color: '#9333ea', badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  { value: 'negotiation', label: 'Negotiation', color: '#d97706', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'won', label: 'Won', color: '#16a34a', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'lost', label: 'Lost', color: '#dc2626', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'hold', label: 'Hold', color: '#6b7280', badgeClass: 'bg-gray-100 text-gray-700 border-gray-200' },
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
  { value: 'low', label: 'Low', badgeClass: 'bg-slate-100 text-slate-700' },
  { value: 'medium', label: 'Medium', badgeClass: 'bg-blue-50 text-blue-700' },
  { value: 'high', label: 'High', badgeClass: 'bg-amber-50 text-amber-700' },
  { value: 'urgent', label: 'Urgent', badgeClass: 'bg-rose-50 text-rose-700 font-semibold' },
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
