-- ==============================================================================
-- Migration: 20261029_000001_strict_sales_rep_rls.sql
-- Enforces strict Row Level Security (RLS) on projects, activities,
-- planned_activities, quotations, and sales_targets.
--
-- Security Mandate:
-- Sales Engineers can NEVER view projects or confidential pipeline data
-- belonging to other sales engineers. Team-wide visibility is strictly reserved
-- for leadership roles (Admin, Sales Manager, Estimator, Viewer).
-- ==============================================================================

-- 1. STRICT PROJECTS VIEW POLICY
-- Eliminates broad USING (true) policy. Restricts SELECT on projects to:
-- - Managers, Admins, Estimators, Viewers (Executive & Pricing oversight)
-- - Project Owner (owner_id = current profile)
-- - Assigned/Referred Engineer (referred_to_id = current profile)
-- - Explicit Team Member (project_members.user_id = current profile)
DROP POLICY IF EXISTS "Projects View Policy" ON projects;
DROP POLICY IF EXISTS "projects_select" ON projects;

CREATE POLICY "Projects View Policy" ON projects
  FOR SELECT TO authenticated
  USING (
    get_current_profile_role() IN ('admin', 'sales_manager', 'viewer', 'estimator') OR
    owner_id = get_current_profile_id() OR
    referred_to_id = get_current_profile_id() OR
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = projects.id 
        AND pm.user_id = get_current_profile_id()
    )
  );

-- 2. STRICT ACTIVITIES VIEW POLICY
DROP POLICY IF EXISTS "Activities View Policy" ON activities;
DROP POLICY IF EXISTS "activities_select" ON activities;

CREATE POLICY "Activities View Policy" ON activities
  FOR SELECT TO authenticated
  USING (
    get_current_profile_role() IN ('admin', 'sales_manager', 'viewer', 'estimator') OR
    user_id = get_current_profile_id() OR
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = activities.project_id 
        AND (p.owner_id = get_current_profile_id() OR p.referred_to_id = get_current_profile_id())
    )
  );

-- 3. STRICT PLANNED ACTIVITIES VIEW POLICY
DROP POLICY IF EXISTS "Planned Activities View Policy" ON planned_activities;

CREATE POLICY "Planned Activities View Policy" ON planned_activities
  FOR SELECT TO authenticated
  USING (
    get_current_profile_role() IN ('admin', 'sales_manager', 'viewer', 'estimator') OR
    user_id = get_current_profile_id()
  );

-- 4. STRICT QUOTATIONS VIEW POLICY
DROP POLICY IF EXISTS "Quotations View Policy" ON quotations;
DROP POLICY IF EXISTS "quotations_select" ON quotations;

CREATE POLICY "Quotations View Policy" ON quotations
  FOR SELECT TO authenticated
  USING (
    get_current_profile_role() IN ('admin', 'sales_manager', 'viewer', 'estimator') OR
    created_by = get_current_profile_id() OR
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = quotations.project_id 
        AND (p.owner_id = get_current_profile_id() OR p.referred_to_id = get_current_profile_id())
    )
  );

-- 5. STRICT SALES TARGETS VIEW POLICY
DROP POLICY IF EXISTS "Sales Targets View Policy" ON sales_targets;
DROP POLICY IF EXISTS "sales_targets_select" ON sales_targets;

CREATE POLICY "Sales Targets View Policy" ON sales_targets
  FOR SELECT TO authenticated
  USING (
    get_current_profile_role() IN ('admin', 'sales_manager') OR
    user_id = get_current_profile_id()
  );
