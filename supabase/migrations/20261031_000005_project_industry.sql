-- Migration: Add Project Industry to projects table
-- Description: Adds mandatory Project Industry classification to projects
-- Compatible with PostgreSQL / Supabase, safe non-destructive addition.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS industry TEXT;
CREATE INDEX IF NOT EXISTS idx_projects_industry ON projects(industry);
