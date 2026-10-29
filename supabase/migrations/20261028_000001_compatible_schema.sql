-- ==============================================================================
-- CRMate - Comprehensive Database Schema (TEXT-Key & ID-Preserving Migration)
-- Compatible with existing prefixed text IDs: p_pr*, c_*, cnt_*, u*, q_*, act_*, etc.
-- ==============================================================================

-- 1. ENUMS (Create safely if not already existing)
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('admin', 'sales_manager', 'sales_engineer', 'estimator', 'viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE company_type_enum AS ENUM (
    'contractor', 'consultant', 'developer', 'client_owner', 'mep_contractor',
    'supplier_vendor', 'hotel', 'hospital', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE opportunity_type_enum AS ENUM (
    'new_lead', 'in_hand', 'tender', 'existing_account', 'upgrade_retrofit', 'hunting_potential'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE pipeline_stage_enum AS ENUM (
    'lead', 'qualification', 'rfq_processing', 'pricing', 'quotation_sent',
    'technical_submission', 'technically_approved', 'negotiation', 'won', 'lost', 'hold'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE activity_channel_enum AS ENUM (
    'call', 'meeting_f2f', 'meeting_online', 'visit', 'hunting', 'office_work', 'event', 'email'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE visit_purpose_enum AS ENUM (
    'new_lead', 'follow_up', 'cold_call', 'consultant_visit', 'customer_visit',
    'technical_clarification', 'quotation_delivery'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE activity_outcome_enum AS ENUM (
    'connected', 'no_answer', 'meeting_booked', 'requirement_received', 'rfq_received',
    'quotation_sent', 'awaiting_feedback', 'procurement_contact_needed', 'technical_feedback_needed',
    'follow_up_later', 'lost', 'hold', 'won', 'new_project_identified', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE planned_activity_status_enum AS ENUM (
    'planned', 'completed', 'rescheduled', 'skipped', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE quotation_status_enum AS ENUM (
    'draft', 'internal_review', 'under_review', 'sent', 'submitted',
    'revised', 'negotiation', 'accepted', 'approved', 'rejected', 'expired', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE target_metric_enum AS ENUM (
    'calls', 'f2f_meetings', 'hunting_visits', 'new_leads', 'new_projects',
    'rfqs', 'quotations_sent', 'quotation_value', 'won_value'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE target_period_enum AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE request_type_enum AS ENUM ('discount', 'technical_review', 'quotation_change', 'custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE request_urgency_enum AS ENUM ('normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE request_status_enum AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notification_category_enum AS ENUM ('approval', 'reminder', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notification_reference_type_enum AS ENUM ('request', 'reminder', 'project', 'general');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type_enum AS ENUM (
    'request_created', 'request_approved', 'request_rejected', 'request_comment',
    'reminder_due', 'project_archived', 'project_restored', 'system_alert'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABLES WITH TEXT PRIMARY KEYS & SEAMLESS RELATIONSHIPS

-- Comprehensive Safety Incompatibility Guard:
-- If an existing incompatible schema (e.g., legacy UUID primary or foreign keys) is detected
-- across ANY CRMate entity, HALT execution immediately with a descriptive exception detailing
-- the exact conflicting tables and columns.
-- Do NOT drop, replace, or alter any existing table or data.
DO $$
DECLARE
  v_conflicts TEXT;
BEGIN
  SELECT string_agg(table_name || '.' || column_name || ' (' || data_type || ')', ', ')
  INTO v_conflicts
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN (
      'profiles', 'companies', 'contacts', 'projects', 'project_members',
      'quotations', 'activities', 'planned_activities', 'sales_targets',
      'approval_requests', 'notifications', 'reminders', 'chat_conversations', 'chat_messages'
    )
    AND (
      (column_name = 'id' AND data_type = 'uuid') OR
      (table_name = 'project_members' AND column_name IN ('project_id', 'user_id') AND data_type = 'uuid')
    );

  IF v_conflicts IS NOT NULL THEN
    RAISE EXCEPTION 'CRMate Migration Aborted: Incompatible legacy UUID columns detected in public schema: [%]. CRMate requires TEXT PRIMARY KEY schema to preserve string IDs (e.g., p_pr1004, u1). Please inspect your database manually before proceeding.', v_conflicts;
  END IF;
END $$;

-- Profiles (Linked optionally to Supabase auth.users via auth_user_id)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- 'u1', 'u2', 'u3', 'u4', 'u5'
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  name_ar TEXT,
  role user_role_enum NOT NULL DEFAULT 'sales_engineer',
  phone TEXT,
  title TEXT,
  territory TEXT,
  avatar_color TEXT DEFAULT '#8FC2F0',
  avatar_url TEXT,
  monthly_target_sar NUMERIC(15, 2) DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Companies / Accounts Master Entity
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY, -- 'c_1', 'c_7', 'c_tahlia_group', etc.
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  company_type company_type_enum NOT NULL DEFAULT 'contractor',
  city TEXT,
  website TEXT,
  google_maps_url TEXT,
  phone TEXT,
  notes TEXT,
  created_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_companies_normalized_name ON companies(normalized_name);
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city);

-- Contacts Master Entity
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY, -- 'cnt_1', 'cnt_15', etc.
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT,
  full_name TEXT NOT NULL,
  job_title TEXT,
  phone TEXT,
  normalized_phone TEXT,
  email TEXT,
  city TEXT,
  linkedin_url TEXT,
  is_hot_lead BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  project_ids JSONB DEFAULT '[]'::JSONB,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_normalized_phone ON contacts(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id);

-- Projects / Opportunities Master Entity
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, -- 'p_pr1004', 'p_1792229463631', 'p_tahlia_business_park', etc.
  pr_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE RESTRICT,
  company_name TEXT,
  primary_contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  primary_contact_name TEXT,
  primary_contact_phone TEXT,
  contact_ids JSONB DEFAULT '[]'::JSONB,
  location TEXT NOT NULL,
  opportunity_type opportunity_type_enum NOT NULL DEFAULT 'in_hand',
  pipeline_stage pipeline_stage_enum NOT NULL DEFAULT 'lead',
  priority priority_enum NOT NULL DEFAULT 'medium',
  estimated_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  final_won_value NUMERIC(15, 2),
  probability INT NOT NULL DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  weighted_value NUMERIC(15, 2) GENERATED ALWAYS AS (estimated_value * probability / 100.0) STORED,
  expected_award_date DATE,
  closing_date DATE,
  owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  owner_name TEXT,
  referred_to_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  referred_to_name TEXT,
  referred_at TIMESTAMPTZ,
  referred_by_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  referred_by_name TEXT,
  next_action TEXT,
  next_follow_up_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  lost_reason TEXT,
  hold_reason TEXT,
  internal_notes TEXT,
  card_color TEXT DEFAULT 'default',
  base_card_color TEXT DEFAULT 'default',
  stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  archived_by_name TEXT,
  archive_reason TEXT,
  -- Purchase Order (PO) & Milestone Collections
  po_number TEXT,
  po_date DATE,
  po_amount NUMERIC(15, 2),
  po_attachment_name TEXT,
  po_attachment_url TEXT,
  po_attachment_size INT,
  po_uploaded_at TIMESTAMPTZ,
  po_uploaded_by TEXT,
  po_notes TEXT,
  collected_amount NUMERIC(15, 2) DEFAULT 0.00,
  collected_percentage NUMERIC(5, 2) DEFAULT 0.00,
  collection_status TEXT DEFAULT 'pending',
  collection_records JSONB DEFAULT '[]'::JSONB,
  -- Commercial Submittals & RFQ Packages
  rfq_packages TEXT,
  systems JSONB DEFAULT '[]'::JSONB,
  submittal_status TEXT,
  submittal_sent_at TIMESTAMPTZ,
  client_target_price NUMERIC(15, 2),
  last_discount_pct NUMERIC(5, 2),
  last_discount_amount NUMERIC(15, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_pr_number ON projects(pr_number);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_pipeline_stage ON projects(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON projects(is_archived);

-- Project Members (Collaborative Multi-User Territory Support)
CREATE TABLE IF NOT EXISTS project_members (
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  user_name TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Quotations & Commercial Versioning
CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY, -- 'q_tahlia_v1', etc.
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  project_name TEXT,
  quotation_number TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  amount NUMERIC(15, 2) NOT NULL,
  total_amount NUMERIC(15, 2),
  subtotal NUMERIC(15, 2),
  discount_amount NUMERIC(15, 2) DEFAULT 0.00,
  discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'SAR',
  vendor_brand TEXT,
  status quotation_status_enum NOT NULL DEFAULT 'submitted',
  quotation_date DATE DEFAULT CURRENT_DATE,
  sent_date DATE,
  valid_until DATE,
  file_url TEXT,
  file_name TEXT,
  file_size TEXT,
  customer_reference TEXT,
  rfq_number TEXT,
  revision_reason TEXT,
  notes TEXT,
  payment_terms TEXT,
  delivery_terms TEXT,
  warranty_terms TEXT,
  technical_notes TEXT,
  previous_version_id TEXT REFERENCES quotations(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quotations_project_version ON quotations(project_id, quotation_number, version DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_is_archived ON quotations(is_archived);

-- Logged Activities (Historical timeline)
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY, -- 'act_1792...'
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  project_name TEXT,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name TEXT,
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  planned_activity_id TEXT,
  activity_date DATE NOT NULL,
  activity_time TEXT,
  channel activity_channel_enum NOT NULL,
  visit_purpose visit_purpose_enum NOT NULL,
  outcome activity_outcome_enum,
  notes TEXT,
  location_name TEXT,
  google_maps_url TEXT,
  priority priority_enum,
  next_action TEXT,
  next_follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_activity_date ON activities(activity_date DESC);

-- Planned Activities (Weekly Plan & Execution)
CREATE TABLE IF NOT EXISTS planned_activities (
  id TEXT PRIMARY KEY, -- 'plan_fu_act_...'
  weekly_plan_id TEXT NOT NULL,
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  project_name TEXT,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name TEXT,
  location_name TEXT,
  google_maps_url TEXT,
  custom_target TEXT,
  scheduled_date DATE NOT NULL,
  day_of_week INT,
  time_slot TEXT,
  channel activity_channel_enum NOT NULL,
  visit_purpose visit_purpose_enum NOT NULL,
  goal TEXT NOT NULL,
  priority priority_enum NOT NULL DEFAULT 'medium',
  status planned_activity_status_enum NOT NULL DEFAULT 'planned',
  is_auto_suggested BOOLEAN DEFAULT FALSE,
  suggestion_reason TEXT,
  completed_activity_id TEXT,
  skip_reason TEXT,
  rescheduled_to_date DATE,
  is_follow_up BOOLEAN DEFAULT FALSE,
  follow_up_from_activity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_planned_activities_project_id ON planned_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_planned_activities_user_id ON planned_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_activities_date ON planned_activities(scheduled_date);

-- Sales Targets
CREATE TABLE IF NOT EXISTS sales_targets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  period_type target_period_enum NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_metric target_metric_enum NOT NULL,
  target_value NUMERIC(15, 2) NOT NULL,
  current_actual NUMERIC(15, 2) DEFAULT 0.00,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Approval Requests System
CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  project_name TEXT,
  company_name TEXT,
  quotation_id TEXT REFERENCES quotations(id) ON DELETE SET NULL,
  quotation_number TEXT,
  quotation_amount NUMERIC(15, 2),
  type request_type_enum NOT NULL,
  requested_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  requester_name TEXT,
  assigned_to JSONB DEFAULT '[]'::JSONB,
  payload JSONB DEFAULT '{}'::JSONB,
  urgency request_urgency_enum NOT NULL DEFAULT 'normal',
  status request_status_enum NOT NULL DEFAULT 'pending',
  resolution JSONB,
  comments JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- In-App Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type_enum NOT NULL,
  category notification_category_enum,
  reference_type notification_reference_type_enum NOT NULL,
  reference_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  project_id TEXT,
  project_name TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  reminder_date DATE NOT NULL,
  reminder_time TEXT,
  urgency TEXT DEFAULT 'normal',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notified BOOLEAN DEFAULT FALSE,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  project_id TEXT,
  project_name TEXT,
  contact_id TEXT,
  contact_name TEXT,
  activity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Internal Team Chat & Collaboration
CREATE TABLE IF NOT EXISTS chat_conversations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT,
  name_ar TEXT,
  description TEXT,
  participant_ids JSONB DEFAULT '[]'::JSONB,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  last_sender_name TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  sender_role TEXT NOT NULL,
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '[]'::JSONB,
  project_card JSONB,
  plan_task_card JSONB,
  attachments JSONB DEFAULT '[]'::JSONB,
  read_by JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id, created_at);

-- 3. ROW LEVEL SECURITY (RLS) & GRANULAR ROLE-BASED ACCESS

-- Enable RLS across all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to resolve the current authenticated profile
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS TEXT AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_profile_role()
RETURNS user_role_enum AS $$
  SELECT role FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Identity Linkage Trigger: When a user registers or is invited via Supabase Auth (GoTrue),
-- automatically associate their auth_user_id with the corresponding CRM profile by email.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET auth_user_id = NEW.id,
      updated_at = NOW()
  WHERE email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- RLS POLICIES (Granular Role-Based Access Control)
-- ==============================================================================

-- 1. PROJECTS POLICIES
-- SELECT: All authenticated team members can view projects (support estimators, viewers, sales transparency)
DROP POLICY IF EXISTS "Projects View Policy" ON projects;
DROP POLICY IF EXISTS "Admin & Manager Full Access: projects" ON projects;
CREATE POLICY "Projects View Policy" ON projects
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Admins, Managers, and Sales Engineers can create new projects
DROP POLICY IF EXISTS "Projects Insert Policy" ON projects;
CREATE POLICY "Projects Insert Policy" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (
    get_current_profile_role() IN ('admin', 'sales_manager', 'sales_engineer')
  );

-- UPDATE: Admins & Managers can update any project. Sales Engineers can only update owned/assigned/member projects.
-- Viewers & Estimators CANNOT update projects.
DROP POLICY IF EXISTS "Projects Update Policy" ON projects;
CREATE POLICY "Projects Update Policy" ON projects
  FOR UPDATE TO authenticated
  USING (
    get_current_profile_role() IN ('admin', 'sales_manager') OR
    owner_id = get_current_profile_id() OR
    referred_to_id = get_current_profile_id() OR
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = projects.id AND pm.user_id = get_current_profile_id())
  )
  WITH CHECK (
    get_current_profile_role() IN ('admin', 'sales_manager') OR
    owner_id = get_current_profile_id() OR
    referred_to_id = get_current_profile_id() OR
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = projects.id AND pm.user_id = get_current_profile_id())
  );

-- DELETE: Strictly restricted to Admin and Sales Manager
DROP POLICY IF EXISTS "Projects Delete Policy" ON projects;
CREATE POLICY "Projects Delete Policy" ON projects
  FOR DELETE TO authenticated
  USING (get_current_profile_role() IN ('admin', 'sales_manager'));

-- 2. PROJECT MEMBERS POLICIES
DROP POLICY IF EXISTS "Authenticated View Project Members" ON project_members;
CREATE POLICY "Authenticated View Project Members" ON project_members
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Manage Project Members" ON project_members;
CREATE POLICY "Manage Project Members" ON project_members
  FOR ALL TO authenticated
  USING (get_current_profile_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_current_profile_role() IN ('admin', 'sales_manager'));

-- 3. COMPANIES POLICIES
DROP POLICY IF EXISTS "Authenticated View Companies" ON companies;
CREATE POLICY "Authenticated View Companies" ON companies
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Manage Companies" ON companies;
DROP POLICY IF EXISTS "Companies Insert Update Policy" ON companies;
CREATE POLICY "Companies Insert Update Policy" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (get_current_profile_role() IN ('admin', 'sales_manager', 'sales_engineer'));

CREATE POLICY "Companies Update Policy" ON companies
  FOR UPDATE TO authenticated
  USING (get_current_profile_role() IN ('admin', 'sales_manager', 'sales_engineer'))
  WITH CHECK (get_current_profile_role() IN ('admin', 'sales_manager', 'sales_engineer'));

DROP POLICY IF EXISTS "Companies Delete Policy" ON companies;
CREATE POLICY "Companies Delete Policy" ON companies
  FOR DELETE TO authenticated
  USING (get_current_profile_role() IN ('admin', 'sales_manager'));

-- 4. CONTACTS POLICIES
DROP POLICY IF EXISTS "Authenticated View Contacts" ON contacts;
CREATE POLICY "Authenticated View Contacts" ON contacts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Manage Contacts" ON contacts;
DROP POLICY IF EXISTS "Contacts Insert Policy" ON contacts;
CREATE POLICY "Contacts Insert Policy" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (get_current_profile_role() IN ('admin', 'sales_manager', 'sales_engineer'));

DROP POLICY IF EXISTS "Contacts Update Policy" ON contacts;
CREATE POLICY "Contacts Update Policy" ON contacts
  FOR UPDATE TO authenticated
  USING (get_current_profile_role() IN ('admin', 'sales_manager', 'sales_engineer'))
  WITH CHECK (get_current_profile_role() IN ('admin', 'sales_manager', 'sales_engineer'));

DROP POLICY IF EXISTS "Contacts Delete Policy" ON contacts;
CREATE POLICY "Contacts Delete Policy" ON contacts
  FOR DELETE TO authenticated
  USING (get_current_profile_role() IN ('admin', 'sales_manager'));

-- 5. ACTIVITIES POLICIES
DROP POLICY IF EXISTS "Activities Access Policy" ON activities;
DROP POLICY IF EXISTS "Activities View Policy" ON activities;
CREATE POLICY "Activities View Policy" ON activities
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Activities Insert Policy" ON activities;
CREATE POLICY "Activities Insert Policy" ON activities
  FOR INSERT TO authenticated
  WITH CHECK (get_current_profile_role() IN ('admin', 'sales_manager', 'sales_engineer'));

DROP POLICY IF EXISTS "Activities Update Policy" ON activities;
CREATE POLICY "Activities Update Policy" ON activities
  FOR UPDATE TO authenticated
  USING (
    get_current_profile_role() IN ('admin', 'sales_manager') OR
    user_id = get_current_profile_id()
  )
  WITH CHECK (
    get_current_profile_role() IN ('admin', 'sales_manager') OR
    user_id = get_current_profile_id()
  );

DROP POLICY IF EXISTS "Activities Delete Policy" ON activities;
CREATE POLICY "Activities Delete Policy" ON activities
  FOR DELETE TO authenticated
  USING (
    get_current_profile_role() IN ('admin', 'sales_manager') OR
    user_id = get_current_profile_id()
  );

-- 6. PLANNED ACTIVITIES POLICIES
DROP POLICY IF EXISTS "Planned Activities Access Policy" ON planned_activities;
DROP POLICY IF EXISTS "Planned Activities View Policy" ON planned_activities;
CREATE POLICY "Planned Activities View Policy" ON planned_activities
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Planned Activities Manage Policy" ON planned_activities;
CREATE POLICY "Planned Activities Manage Policy" ON planned_activities
  FOR ALL TO authenticated
  USING (
    get_current_profile_role() IN ('admin', 'sales_manager') OR
    user_id = get_current_profile_id()
  )
  WITH CHECK (
    get_current_profile_role() IN ('admin', 'sales_manager', 'sales_engineer')
  );

-- 7. QUOTATIONS POLICIES
DROP POLICY IF EXISTS "Quotations Access Policy" ON quotations;
DROP POLICY IF EXISTS "Quotations View Policy" ON quotations;
CREATE POLICY "Quotations View Policy" ON quotations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Quotations Manage Policy" ON quotations;
CREATE POLICY "Quotations Manage Policy" ON quotations
  FOR INSERT TO authenticated
  WITH CHECK (
    get_current_profile_role() IN ('admin', 'sales_manager', 'sales_engineer', 'estimator')
  );

DROP POLICY IF EXISTS "Quotations Update Policy" ON quotations;
CREATE POLICY "Quotations Update Policy" ON quotations
  FOR UPDATE TO authenticated
  USING (
    get_current_profile_role() IN ('admin', 'sales_manager', 'sales_engineer', 'estimator')
  )
  WITH CHECK (
    get_current_profile_role() IN ('admin', 'sales_manager', 'sales_engineer', 'estimator')
  );

DROP POLICY IF EXISTS "Quotations Delete Policy" ON quotations;
CREATE POLICY "Quotations Delete Policy" ON quotations
  FOR DELETE TO authenticated
  USING (get_current_profile_role() IN ('admin', 'sales_manager'));

-- 8. PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles Public Read For Team" ON profiles;
CREATE POLICY "Profiles Public Read For Team" ON profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Profiles Self Update" ON profiles;
CREATE POLICY "Profiles Self Update" ON profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid() OR get_current_profile_role() = 'admin')
  WITH CHECK (auth_user_id = auth.uid() OR get_current_profile_role() = 'admin');

-- 9. SALES TARGETS POLICIES
DROP POLICY IF EXISTS "Sales Targets View Policy" ON sales_targets;
CREATE POLICY "Sales Targets View Policy" ON sales_targets
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Sales Targets Manage Policy" ON sales_targets;
CREATE POLICY "Sales Targets Manage Policy" ON sales_targets
  FOR ALL TO authenticated
  USING (get_current_profile_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_current_profile_role() IN ('admin', 'sales_manager'));

-- 10. APPROVAL REQUESTS POLICIES
DROP POLICY IF EXISTS "Approval Requests View Policy" ON approval_requests;
CREATE POLICY "Approval Requests View Policy" ON approval_requests
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Approval Requests Insert Policy" ON approval_requests;
CREATE POLICY "Approval Requests Insert Policy" ON approval_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Approval Requests Update Policy" ON approval_requests;
CREATE POLICY "Approval Requests Update Policy" ON approval_requests
  FOR UPDATE TO authenticated
  USING (
    get_current_profile_role() IN ('admin', 'sales_manager') OR
    requested_by = get_current_profile_id()
  )
  WITH CHECK (
    get_current_profile_role() IN ('admin', 'sales_manager') OR
    requested_by = get_current_profile_id()
  );

-- 11. NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Notifications Self Policy" ON notifications;
CREATE POLICY "Notifications Self Policy" ON notifications
  FOR ALL TO authenticated
  USING (user_id = get_current_profile_id())
  WITH CHECK (user_id = get_current_profile_id());

-- 12. REMINDERS POLICIES
DROP POLICY IF EXISTS "Reminders Self Policy" ON reminders;
CREATE POLICY "Reminders Self Policy" ON reminders
  FOR ALL TO authenticated
  USING (user_id = get_current_profile_id() OR get_current_profile_role() IN ('admin', 'sales_manager'))
  WITH CHECK (user_id = get_current_profile_id() OR get_current_profile_role() IN ('admin', 'sales_manager'));

-- 13. CHAT CONVERSATIONS & MESSAGES POLICIES
DROP POLICY IF EXISTS "Chat Conversations View Policy" ON chat_conversations;
CREATE POLICY "Chat Conversations View Policy" ON chat_conversations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Chat Conversations Manage Policy" ON chat_conversations;
CREATE POLICY "Chat Conversations Manage Policy" ON chat_conversations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Chat Messages Participant Policy" ON chat_messages;
CREATE POLICY "Chat Messages Participant Policy" ON chat_messages
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (sender_id = get_current_profile_id() OR get_current_profile_role() = 'admin');

-- 4. SCHEMA GRANTS & PERMISSIONS (Ensuring seamless operation for authenticated & service_role)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

