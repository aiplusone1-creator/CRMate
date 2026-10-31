-- ==============================================================================
-- Migration: 20261031_000004_project_consultants.sql
-- 
-- Description:
-- Adds consultant_id and consultant_name fields to the projects table, allowing
-- projects to be formally assigned to an engineering consultancy company.
-- ==============================================================================

-- 1. Add consultant_id column with foreign key to companies table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS consultant_id TEXT REFERENCES companies(id) ON DELETE SET NULL;

-- 2. Add consultant_name denormalized column for high-speed indexed pipeline lookups
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS consultant_name TEXT;

-- 3. Create index on consultant_id for fast company-to-projects reverse queries
CREATE INDEX IF NOT EXISTS idx_projects_consultant_id ON projects(consultant_id);
