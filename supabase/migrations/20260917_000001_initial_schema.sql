-- ==============================================================================
-- Al Mespar Sales CRM - Comprehensive Database Schema (Phase 1 Initial Migration)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS

-- User Roles (5 distinct roles)
CREATE TYPE user_role_enum AS ENUM (
  'admin',
  'sales_manager',
  'sales_engineer',
  'estimator',
  'viewer'
);

-- Company Types
CREATE TYPE company_type_enum AS ENUM (
  'contractor',
  'consultant',
  'developer',
  'client_owner',
  'mep_contractor',
  'supplier_vendor',
  'hotel',
  'hospital',
  'other'
);

-- Opportunity Classifications (Decoupled from stage)
CREATE TYPE opportunity_type_enum AS ENUM (
  'new_lead',
  'in_hand',
  'tender',
  'existing_account',
  'upgrade_retrofit',
  'hunting_potential'
);

-- Pipeline Stages
CREATE TYPE pipeline_stage_enum AS ENUM (
  'lead',
  'qualification',
  'rfq_processing',
  'pricing',
  'quotation_sent',
  'technical_submission',
  'technically_approved',
  'negotiation',
  'won',
  'lost',
  'hold'
);

-- Project Priority
CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');

-- Project Member Collaboration Roles
CREATE TYPE project_member_role_enum AS ENUM (
  'co_sales_engineer',
  'lead_estimator',
  'technical_support',
  'executive_sponsor'
);

-- Clean Activity Channel Hierarchy (Correction 3)
CREATE TYPE activity_channel_enum AS ENUM (
  'call',
  'meeting_f2f',
  'meeting_online',
  'visit',
  'hunting',
  'office_work',
  'event',
  'email'
);

-- Clean Activity Purpose / Visit Type (Correction 3)
CREATE TYPE visit_purpose_enum AS ENUM (
  'new_lead',
  'follow_up',
  'cold_call',
  'consultant_visit',
  'customer_visit',
  'technical_clarification',
  'quotation_delivery'
);

-- Standardized Activity Outcomes
CREATE TYPE activity_outcome_enum AS ENUM (
  'connected',
  'no_answer',
  'meeting_booked',
  'requirement_received',
  'rfq_received',
  'quotation_sent',
  'awaiting_feedback',
  'procurement_contact_needed',
  'technical_feedback_needed',
  'follow_up_later',
  'lost',
  'hold',
  'won',
  'new_project_identified',
  'other'
);

-- Planned Activity Execution State
CREATE TYPE planned_activity_status_enum AS ENUM (
  'planned',
  'completed',
  'rescheduled',
  'skipped',
  'cancelled'
);

-- Target Metrics (Correction 5)
CREATE TYPE target_metric_enum AS ENUM (
  'calls',
  'f2f_meetings',
  'hunting_visits',
  'new_leads',
  'new_projects',
  'rfqs',
  'quotations_sent',
  'quotation_value',
  'won_value'
);

-- Target Periods
CREATE TYPE target_period_enum AS ENUM (
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
);

-- Quotation Lifecycle
CREATE TYPE quotation_status_enum AS ENUM (
  'draft',
  'internal_review',
  'sent',
  'revised',
  'accepted',
  'rejected',
  'expired'
);

-- 2. TABLES

-- Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'sales_engineer',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Companies / Accounts (Shared Master Entity)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  company_type company_type_enum NOT NULL DEFAULT 'contractor',
  city TEXT,
  website TEXT,
  google_maps_url TEXT,
  phone TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  migration_batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_companies_normalized_name ON companies(normalized_name);

-- Contacts (Shared Master Entity)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  job_title TEXT,
  phone TEXT,
  normalized_phone TEXT,
  email TEXT,
  city TEXT,
  linkedin_url TEXT,
  is_hot_lead BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  migration_batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contacts_normalized_phone ON contacts(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);

-- Projects / Opportunities
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE RESTRICT,
  primary_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  location TEXT NOT NULL,
  opportunity_type opportunity_type_enum NOT NULL DEFAULT 'in_hand',
  pipeline_stage pipeline_stage_enum NOT NULL DEFAULT 'lead',
  priority priority_enum NOT NULL DEFAULT 'medium',
  estimated_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  probability INT NOT NULL DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  weighted_value NUMERIC(15, 2) GENERATED ALWAYS AS (estimated_value * probability / 100.0) STORED,
  expected_award_date DATE,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  next_action TEXT,
  next_follow_up_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  lost_reason TEXT,
  hold_reason TEXT,
  internal_notes TEXT,
  migration_batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_projects_next_follow_up ON projects(next_follow_up_at);

-- Project Members (Collaborative / Shared Projects)
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role project_member_role_enum NOT NULL DEFAULT 'co_sales_engineer',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Project Contacts (Many-to-Many junction)
CREATE TABLE IF NOT EXISTS project_contacts (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  role_in_project TEXT,
  PRIMARY KEY (project_id, contact_id)
);

-- Weekly Plans
CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INT NOT NULL,
  week_number INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, year, week_number)
);

-- Planned Activities
CREATE TABLE IF NOT EXISTS planned_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_plan_id UUID NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  time_slot TEXT,
  channel activity_channel_enum NOT NULL DEFAULT 'call',
  visit_purpose visit_purpose_enum DEFAULT 'follow_up',
  goal TEXT NOT NULL,
  priority priority_enum NOT NULL DEFAULT 'medium',
  status planned_activity_status_enum NOT NULL DEFAULT 'planned',
  completed_activity_id UUID,
  skip_reason TEXT,
  rescheduled_to_date DATE,
  migration_batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Actual Activities (Correction 2: notes is optional TEXT NULL)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  planned_activity_id UUID REFERENCES planned_activities(id) ON DELETE SET NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_time TIME,
  channel activity_channel_enum NOT NULL DEFAULT 'call',
  visit_purpose visit_purpose_enum DEFAULT 'follow_up',
  outcome activity_outcome_enum,
  notes TEXT, -- Optional (Correction 2)
  next_action TEXT,
  next_follow_up_at TIMESTAMPTZ,
  migration_batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, activity_date);

-- Link planned_activities to activities
ALTER TABLE planned_activities 
DROP CONSTRAINT IF EXISTS fk_planned_completed,
ADD CONSTRAINT fk_planned_completed 
FOREIGN KEY (completed_activity_id) REFERENCES activities(id) ON DELETE SET NULL;

-- Quotations (Correction 4: Estimator full CRUD, attachments)
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  quotation_number TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'SAR',
  vendor_brand TEXT,
  status quotation_status_enum NOT NULL DEFAULT 'draft',
  sent_date DATE,
  valid_until DATE,
  file_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  migration_batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, quotation_number, version)
);

-- Sales Targets Entity (Correction 5: No hardcoded targets, user/period configurable)
CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL = Team/Regional Target
  period_type target_period_enum NOT NULL DEFAULT 'monthly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_metric target_metric_enum NOT NULL,
  target_value NUMERIC(15, 2) NOT NULL CHECK (target_value >= 0),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start, target_metric)
);

-- Project Stage History
CREATE TABLE IF NOT EXISTS project_stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  old_stage pipeline_stage_enum,
  new_stage pipeline_stage_enum NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration Batches
CREATE TABLE IF NOT EXISTS migration_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  total_records INT NOT NULL DEFAULT 0,
  imported_records INT NOT NULL DEFAULT 0,
  skipped_records INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'rolled_back', 'failed')),
  executed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Migration Staging / Review Queue
CREATE TABLE IF NOT EXISTS migration_staging_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES migration_batches(id) ON DELETE CASCADE,
  source_sheet TEXT NOT NULL,
  source_row INT NOT NULL,
  raw_opportunity_name TEXT NOT NULL,
  raw_contact_name TEXT,
  raw_company_name TEXT,
  matched_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  matched_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  suggested_action TEXT NOT NULL CHECK (suggested_action IN ('exact_match', 'fuzzy_match', 'create_new', 'skip')),
  user_action TEXT CHECK (user_action IN ('accept', 'create_new', 'skip')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TRIGGERS (Correction 1: Timestamp integrity & non-overwriting follow-up data)

CREATE OR REPLACE FUNCTION fn_on_activity_inserted_or_updated()
RETURNS TRIGGER AS $$
DECLARE
  v_activity_timestamp TIMESTAMPTZ;
  v_is_chronologically_latest BOOLEAN;
BEGIN
  -- Extract true chronological timestamp
  v_activity_timestamp := (NEW.activity_date + COALESCE(NEW.activity_time, '12:00:00'::time))::timestamptz;

  -- 1. Update Project
  IF NEW.project_id IS NOT NULL THEN
    -- Check if this activity is the latest known activity for the project
    SELECT (projects.last_activity_at IS NULL OR v_activity_timestamp >= projects.last_activity_at)
    INTO v_is_chronologically_latest
    FROM projects
    WHERE id = NEW.project_id;

    UPDATE projects
    SET 
      -- Advance last_activity_at only to the latest chronological timestamp
      last_activity_at = GREATEST(COALESCE(projects.last_activity_at, '-infinity'::timestamptz), v_activity_timestamp),
      -- CRUCIAL (Correction 1): Do NOT overwrite current next_action / follow-up if this is an older migrated activity!
      next_action = CASE 
        WHEN v_is_chronologically_latest AND NEW.next_action IS NOT NULL AND TRIM(NEW.next_action) <> '' THEN NEW.next_action
        ELSE projects.next_action
      END,
      next_follow_up_at = CASE 
        WHEN v_is_chronologically_latest AND NEW.next_follow_up_at IS NOT NULL THEN NEW.next_follow_up_at
        ELSE projects.next_follow_up_at
      END,
      updated_at = NOW()
    WHERE id = NEW.project_id;
  END IF;

  -- 2. Update Contact
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE contacts
    SET 
      last_contacted_at = GREATEST(COALESCE(contacts.last_contacted_at, '-infinity'::timestamptz), v_activity_timestamp),
      next_follow_up_at = CASE 
        WHEN (contacts.last_contacted_at IS NULL OR v_activity_timestamp >= contacts.last_contacted_at) AND NEW.next_follow_up_at IS NOT NULL THEN NEW.next_follow_up_at
        ELSE contacts.next_follow_up_at
      END,
      updated_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_activity_inserted_or_updated ON activities;
CREATE TRIGGER trg_activity_inserted_or_updated
AFTER INSERT OR UPDATE ON activities
FOR EACH ROW EXECUTE FUNCTION fn_on_activity_inserted_or_updated();

-- Track Project Stage Changes
CREATE OR REPLACE FUNCTION fn_track_project_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    INSERT INTO project_stage_history (project_id, old_stage, new_stage, changed_by, changed_at)
    VALUES (NEW.id, OLD.pipeline_stage, NEW.pipeline_stage, auth.uid(), NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_project_stage_changed ON projects;
CREATE TRIGGER trg_project_stage_changed
AFTER UPDATE OF pipeline_stage ON projects
FOR EACH ROW EXECUTE FUNCTION fn_track_project_stage_change();

-- 4. DYNAMIC VIEWS (Correction 2: Calculated non-stale health)

CREATE OR REPLACE VIEW v_projects_with_health AS
SELECT 
  p.*,
  c.name AS company_name,
  cnt.full_name AS primary_contact_name,
  cnt.phone AS primary_contact_phone,
  prof.full_name AS owner_name,
  CASE
    -- Closed/Terminal
    WHEN p.pipeline_stage IN ('won', 'lost', 'hold') THEN 'neutral'::text
    
    -- RED: Overdue follow-up, missing next action, or inactive > 14 days
    WHEN p.next_follow_up_at IS NOT NULL AND p.next_follow_up_at < CURRENT_DATE THEN 'red'::text
    WHEN p.next_action IS NULL OR TRIM(p.next_action) = '' THEN 'red'::text
    WHEN p.last_activity_at IS NULL OR p.last_activity_at < (NOW() - INTERVAL '14 days') THEN 'red'::text

    -- YELLOW: Due within 48 hours or inactive between 7 and 14 days
    WHEN p.next_follow_up_at BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '2 days') THEN 'yellow'::text
    WHEN p.last_activity_at < (NOW() - INTERVAL '7 days') THEN 'yellow'::text

    -- GREEN: Has active follow-up, future date, recent activity
    ELSE 'green'::text
  END AS calculated_health,
  CASE
    WHEN p.next_follow_up_at IS NOT NULL AND p.next_follow_up_at < CURRENT_DATE THEN 
      DATE_PART('day', CURRENT_DATE - p.next_follow_up_at::date)::int
    ELSE 0
  END AS days_overdue
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN contacts cnt ON p.primary_contact_id = cnt.id
LEFT JOIN profiles prof ON p.owner_id = prof.id;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES (Correction 4 & 6)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users can view; Users can update own profile
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Companies & Contacts: Shared directory across team
CREATE POLICY "companies_select" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "companies_insert" ON companies FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "companies_update" ON companies FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "contacts_select" ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contacts_insert" ON contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "contacts_update" ON contacts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- Projects: All viewable; Modifiable by Admin, Manager, Owner, or Project Member
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_modify" ON projects FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'sales_manager')
  )
  OR owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = projects.id 
      AND project_members.user_id = auth.uid()
  )
);

-- Quotations: Viewable by team; Modifiable by Admin, Manager, Estimator, or Project Owner
CREATE POLICY "quotations_select" ON quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "quotations_modify" ON quotations FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'sales_manager', 'estimator')
  )
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = quotations.project_id 
      AND projects.owner_id = auth.uid()
  )
);

-- Activities: All viewable by team; Created/modified by author or Admin/Manager
CREATE POLICY "activities_select" ON activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "activities_insert" ON activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_modify" ON activities FOR UPDATE TO authenticated USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'sales_manager')
  )
);

-- Sales Targets: Viewable by team; Admin & Manager configure
CREATE POLICY "sales_targets_select" ON sales_targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales_targets_modify" ON sales_targets FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'sales_manager')
  )
);
