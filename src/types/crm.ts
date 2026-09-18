// ==============================================================================
// Al Mespar Sales CRM - Unified TypeScript Data Types (Phase 1)
// ==============================================================================

export type UserRole = 'admin' | 'sales_manager' | 'sales_engineer' | 'estimator' | 'viewer';

export type CompanyType = 
  | 'contractor'
  | 'consultant'
  | 'developer'
  | 'client_owner'
  | 'mep_contractor'
  | 'supplier_vendor'
  | 'hotel'
  | 'hospital'
  | 'other';

export type OpportunityType = 
  | 'new_lead'
  | 'in_hand'
  | 'tender'
  | 'existing_account'
  | 'upgrade_retrofit'
  | 'hunting_potential';

export type PipelineStage = 
  | 'lead'
  | 'qualification'
  | 'rfq_processing'
  | 'pricing'
  | 'quotation_sent'
  | 'technical_submission'
  | 'technically_approved'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'hold';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ProjectHealth = 'green' | 'yellow' | 'red' | 'neutral';

export type ActivityChannel = 
  | 'call'
  | 'meeting_f2f'
  | 'meeting_online'
  | 'visit'
  | 'hunting'
  | 'office_work'
  | 'event'
  | 'email';

export type VisitPurpose = 
  | 'new_lead'
  | 'follow_up'
  | 'cold_call'
  | 'consultant_visit'
  | 'customer_visit'
  | 'technical_clarification'
  | 'quotation_delivery';

export type ActivityOutcome = 
  | 'connected'
  | 'no_answer'
  | 'meeting_booked'
  | 'requirement_received'
  | 'rfq_received'
  | 'quotation_sent'
  | 'awaiting_feedback'
  | 'procurement_contact_needed'
  | 'technical_feedback_needed'
  | 'follow_up_later'
  | 'lost'
  | 'hold'
  | 'won'
  | 'new_project_identified'
  | 'other';

export type PlannedActivityStatus = 
  | 'planned'
  | 'completed'
  | 'rescheduled'
  | 'skipped'
  | 'cancelled';

export type QuotationStatus = 
  | 'draft'
  | 'internal_review'
  | 'under_review'
  | 'sent'
  | 'revised'
  | 'accepted'
  | 'approved'
  | 'rejected'
  | 'expired';

export type TargetMetric = 
  | 'calls'
  | 'f2f_meetings'
  | 'hunting_visits'
  | 'new_leads'
  | 'new_projects'
  | 'rfqs'
  | 'quotations_sent'
  | 'quotation_value'
  | 'won_value';

export type TargetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  avatar_initials?: string;
  territory?: string;
  title?: string;
  monthly_target_sar?: number;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  normalized_name: string;
  company_type: CompanyType;
  city?: string;
  website?: string;
  google_maps_url?: string;
  phone?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface Contact {
  id: string;
  company_id?: string;
  company_name?: string;
  full_name: string;
  job_title?: string;
  phone?: string;
  normalized_phone?: string;
  email?: string;
  city?: string;
  linkedin_url?: string;
  is_hot_lead: boolean;
  notes?: string;
  owner_id?: string;
  last_contacted_at?: string;
  next_follow_up_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: 'co_sales_engineer' | 'lead_estimator' | 'technical_support' | 'executive_sponsor';
  user_name?: string;
  assigned_at: string;
}

export interface Project {
  id: string;
  pr_number: string;
  name: string;
  company_id: string;
  company_name?: string;
  primary_contact_id?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  location: string;
  opportunity_type: OpportunityType;
  pipeline_stage: PipelineStage;
  priority: ProjectPriority;
  estimated_value: number;
  probability: number;
  weighted_value: number;
  expected_award_date?: string;
  owner_id?: string;
  owner_name?: string;
  members?: ProjectMember[];
  next_action?: string;
  next_follow_up_at?: string;
  last_activity_at?: string;
  lost_reason?: string;
  hold_reason?: string;
  internal_notes?: string;
  calculated_health?: ProjectHealth;
  days_overdue?: number;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  project_id?: string;
  project_name?: string;
  company_id?: string;
  company_name?: string;
  contact_id?: string;
  contact_name?: string;
  user_id: string;
  user_name?: string;
  planned_activity_id?: string;
  activity_date: string; // YYYY-MM-DD
  activity_time?: string; // HH:mm
  channel: ActivityChannel;
  visit_purpose: VisitPurpose;
  outcome?: ActivityOutcome;
  notes?: string; // Optional (Correction 2)
  location_name?: string;
  google_maps_url?: string;
  next_action?: string;
  next_follow_up_at?: string;
  created_at: string;
}

export interface PlannedActivity {
  id: string;
  weekly_plan_id: string;
  user_id?: string;
  user_name?: string;
  project_id?: string;
  project_name?: string;
  company_id?: string;
  company_name?: string;
  contact_id?: string;
  contact_name?: string;
  location_name?: string;
  google_maps_url?: string;
  custom_target?: string;
  scheduled_date: string; // YYYY-MM-DD
  day_of_week?: number;
  time_slot?: string;
  channel: ActivityChannel;
  visit_purpose: VisitPurpose;
  goal: string;
  priority: ProjectPriority;
  status: PlannedActivityStatus;
  is_auto_suggested?: boolean;
  suggestion_reason?: string;
  completed_activity_id?: string;
  skip_reason?: string;
  rescheduled_to_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  year: number;
  week_number: number;
  notes?: string;
  activities?: PlannedActivity[];
  created_at: string;
}

export interface Quotation {
  id: string;
  project_id: string;
  project_name?: string;
  quotation_number: string;
  version: number;
  amount: number;
  currency: string;
  vendor_brand?: string;
  status: QuotationStatus;
  sent_date?: string;
  valid_until?: string;
  file_url?: string;
  file_name?: string;
  file_size?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesTarget {
  id: string;
  user_id?: string; // null for regional/team target
  user_name?: string;
  period_type: TargetPeriod;
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
  target_metric: TargetMetric;
  target_value: number;
  current_actual?: number;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export type ReminderUrgency = 'normal' | 'high' | 'urgent';

export interface Reminder {
  id: string;
  user_id?: string;
  title: string;
  notes: string;
  reminder_date: string; // YYYY-MM-DD
  reminder_time: string; // HH:MM
  urgency: ReminderUrgency;
  is_completed: boolean;
  completed_at?: string;
  notified?: boolean;
  created_at: string;
  entity_type?: 'project' | 'contact' | 'activity' | 'general';
  entity_id?: string;
  entity_name?: string;
  project_id?: string;
  project_name?: string;
  contact_id?: string;
  contact_name?: string;
  activity_id?: string;
}

// =========================================================================
// APPROVAL REQUESTS SYSTEM (PHASE A)
// =========================================================================

export type RequestType = 'discount' | 'technical_review' | 'quotation_change' | 'custom';
export type RequestUrgency = 'normal' | 'high' | 'urgent';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface RequestComment {
  id: string;
  user_id: string;
  user_name: string;
  body: string;
  created_at: string;
}

export interface RequestPayload {
  discount_pct?: number;
  notes?: string;
  reason?: string;
  requested_value?: number;
}

export interface RequestResolution {
  resolved_by: string;
  resolver_name?: string;
  resolved_at: string;
  final_value?: number;
  reject_reason?: string;
}

export interface ApprovalRequest {
  id: string;
  project_id: string;
  project_name?: string;
  company_name?: string;
  quotation_id?: string;
  quotation_number?: string;
  quotation_amount?: number;
  type: RequestType;
  requested_by: string; // user_id
  requester_name?: string;
  assigned_to: string[]; // user_id[] (e.g. manager, tech manager)
  payload: RequestPayload;
  urgency: RequestUrgency;
  status: RequestStatus;
  resolution?: RequestResolution;
  created_at: string;
  updated_at: string;
  comments: RequestComment[];
}

export type Request = ApprovalRequest;

export type NotificationReferenceType = 'request' | 'reminder';
export type NotificationType = 
  | 'request_created' 
  | 'request_approved' 
  | 'request_rejected' 
  | 'request_comment' 
  | 'reminder_due';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  reference_type: NotificationReferenceType;
  reference_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  project_id?: string;
  project_name?: string;
}


