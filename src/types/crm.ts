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

export type RFQPackage = 'lc' | 'bms' | 'both';

export type SubmittalStatus = 
  | 'approved'
  | 'approved_with_comments'
  | 'under_approval'
  | 'rejected';

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
  | 'submitted'
  | 'revised'
  | 'negotiation'
  | 'accepted'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled';

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
  final_won_value?: number;
  probability: number;
  weighted_value: number;
  expected_award_date?: string;
  owner_id?: string;
  owner_name?: string;
  // Referral & Assignment System (Owner remains creator; referred_to is current assignee)
  referred_to_id?: string;
  referred_to_name?: string;
  referred_at?: string;
  referred_by_id?: string;
  referred_by_name?: string;
  members?: ProjectMember[];
  next_action?: string;
  next_follow_up_at?: string;
  last_activity_at?: string;
  lost_reason?: string;
  hold_reason?: string;
  internal_notes?: string;
  card_color?: string;
  base_card_color?: string;
  calculated_health?: ProjectHealth;
  days_overdue?: number;
  stage_entered_at?: string;
  is_archived?: boolean;
  archived_at?: string;
  archived_by?: string;
  archived_by_name?: string;
  archive_reason?: string;
  // Purchase Order (PO) & Cash Collection (Won Stage)
  po_number?: string;
  po_date?: string;
  po_amount?: number;
  po_attachment_name?: string;
  po_attachment_url?: string;
  po_attachment_size?: number;
  po_uploaded_at?: string;
  po_uploaded_by?: string;
  po_notes?: string;
  collected_amount?: number;
  collected_percentage?: number;
  collection_status?: 'pending' | 'partially_collected' | 'fully_collected';
  collection_records?: CollectionRecord[];
  // Stage Specific Workflow Fields (RFQ Packages, Submittal Status, Negotiation Targets)
  rfq_packages?: RFQPackage;
  submittal_status?: SubmittalStatus;
  client_target_price?: number;
  last_discount_pct?: number;
  last_discount_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionRecord {
  id: string;
  amount: number;
  percentage?: number;
  payment_date: string;
  payment_method?: 'bank_transfer' | 'cheque' | 'cash' | 'letter_of_credit' | 'other';
  reference_number?: string;
  receipt_attachment_name?: string;
  receipt_attachment_url?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
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
  amount: number; // Backwards compatible alias for total_amount
  total_amount?: number;
  subtotal?: number;
  discount_amount?: number;
  discount_percentage?: number;
  tax_amount?: number;
  currency: string;
  vendor_brand?: string;
  status: QuotationStatus;
  sent_date?: string; // Backwards compatible alias for quotation_date
  quotation_date?: string;
  valid_until?: string;
  file_url?: string;
  file_name?: string;
  file_size?: string;
  notes?: string;
  customer_reference?: string;
  rfq_number?: string;
  revision_reason?: string;
  payment_terms?: string;
  delivery_terms?: string;
  warranty_terms?: string;
  technical_notes?: string;
  previous_version_id?: string;
  is_archived?: boolean;
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

export type NotificationCategory = 'approval' | 'reminder' | 'system';
export type NotificationReferenceType = 'request' | 'reminder' | 'project' | 'general';
export type NotificationType = 
  | 'request_created' 
  | 'request_approved' 
  | 'request_rejected' 
  | 'request_comment' 
  | 'reminder_due'
  | 'project_archived'
  | 'project_restored'
  | 'system_alert';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  category?: NotificationCategory;
  reference_type: NotificationReferenceType;
  reference_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  project_id?: string;
  project_name?: string;
}


