-- ==============================================================================
-- CRMate Migration: VIP Items Table & Row Level Security
-- Migration ID: 20261029_000003_vip_items.sql
-- Description: Creates persistent storage for the VIP module (Revisit Projects & VIP Calls).
-- Strictly isolated from the sales pipeline (no PR numbers, no pipeline stages).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.vip_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('revisit_project', 'vip_call')),
  title TEXT NOT NULL,
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name TEXT,
  contact_id TEXT REFERENCES public.contacts(id) ON DELETE SET NULL,
  contact_name TEXT,
  company_id TEXT REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name TEXT,
  phone TEXT,
  email TEXT,
  location_name TEXT,
  source_type TEXT CHECK (source_type IN ('pipeline_existing', 'street_spot', 'manager_instruction', 'external_lead')),
  source_note TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  completed_activity_id TEXT REFERENCES public.activities(id) ON DELETE SET NULL,
  completion_notes TEXT,
  created_by TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_vip_items_created_by ON public.vip_items(created_by);
CREATE INDEX IF NOT EXISTS idx_vip_items_status ON public.vip_items(status);
CREATE INDEX IF NOT EXISTS idx_vip_items_category ON public.vip_items(category);
CREATE INDEX IF NOT EXISTS idx_vip_items_project_id ON public.vip_items(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vip_items_contact_id ON public.vip_items(contact_id) WHERE contact_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.vip_items ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy:
-- Sales Engineers see their own VIP items.
-- Managers and Admins see all team VIP items.
DO $$ BEGIN
  DROP POLICY IF EXISTS "vip_items_select_policy" ON public.vip_items;
  CREATE POLICY "vip_items_select_policy" ON public.vip_items
    FOR SELECT
    USING (
      created_by = auth.uid()::text 
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = public.vip_items.created_by 
          AND public.profiles.auth_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.auth_user_id = auth.uid() 
          AND public.profiles.role IN ('admin', 'sales_manager', 'viewer', 'estimator')
      )
    );
END $$;

-- 2. INSERT Policy:
-- Authenticated users can insert VIP items attributed to themselves.
DO $$ BEGIN
  DROP POLICY IF EXISTS "vip_items_insert_policy" ON public.vip_items;
  CREATE POLICY "vip_items_insert_policy" ON public.vip_items
    FOR INSERT
    WITH CHECK (
      created_by = auth.uid()::text 
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = public.vip_items.created_by 
          AND public.profiles.auth_user_id = auth.uid()
      )
    );
END $$;

-- 3. UPDATE Policy:
-- Sales engineers can only update their own VIP items. Managers and Admins can update all.
DO $$ BEGIN
  DROP POLICY IF EXISTS "vip_items_update_policy" ON public.vip_items;
  CREATE POLICY "vip_items_update_policy" ON public.vip_items
    FOR UPDATE
    USING (
      created_by = auth.uid()::text 
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = public.vip_items.created_by 
          AND public.profiles.auth_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.auth_user_id = auth.uid() 
          AND public.profiles.role IN ('admin', 'sales_manager')
      )
    );
END $$;

-- 4. DELETE Policy:
-- Sales engineers can only delete their own VIP items. Managers and Admins can delete all.
DO $$ BEGIN
  DROP POLICY IF EXISTS "vip_items_delete_policy" ON public.vip_items;
  CREATE POLICY "vip_items_delete_policy" ON public.vip_items
    FOR DELETE
    USING (
      created_by = auth.uid()::text 
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = public.vip_items.created_by 
          AND public.profiles.auth_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.auth_user_id = auth.uid() 
          AND public.profiles.role IN ('admin', 'sales_manager')
      )
    );
END $$;
