-- ==============================================================================
-- CRMate Migration: Quotation Management & Price History (Phase 11)
-- ==============================================================================

-- 1. Safely extend quotation_status_enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_status_enum') THEN
    CREATE TYPE quotation_status_enum AS ENUM (
      'draft',
      'internal_review',
      'under_review',
      'sent',
      'submitted',
      'revised',
      'negotiation',
      'accepted',
      'approved',
      'rejected',
      'expired',
      'cancelled'
    );
  ELSE
    ALTER TYPE quotation_status_enum ADD VALUE IF NOT EXISTS 'submitted';
    ALTER TYPE quotation_status_enum ADD VALUE IF NOT EXISTS 'negotiation';
    ALTER TYPE quotation_status_enum ADD VALUE IF NOT EXISTS 'cancelled';
  END IF;
END $$;

-- 2. Extend quotations table with commercial fields, versioning, and attachments
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS quotation_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size TEXT,
  ADD COLUMN IF NOT EXISTS customer_reference TEXT,
  ADD COLUMN IF NOT EXISTS rfq_number TEXT,
  ADD COLUMN IF NOT EXISTS revision_reason TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS delivery_terms TEXT,
  ADD COLUMN IF NOT EXISTS warranty_terms TEXT,
  ADD COLUMN IF NOT EXISTS technical_notes TEXT,
  ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Backfill total_amount and subtotal from amount for existing records
UPDATE quotations 
SET 
  total_amount = COALESCE(total_amount, amount),
  subtotal = COALESCE(subtotal, amount),
  quotation_date = COALESCE(quotation_date, sent_date, created_at::DATE);

-- 4. Extend projects table with final_won_value to keep Estimated Value, Quotation Value, and Final Won Value strictly separated
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS final_won_value NUMERIC(15, 2);

-- 5. Indexes for fast retrieval and version ordering
CREATE INDEX IF NOT EXISTS idx_quotations_project_version ON quotations(project_id, quotation_number, version DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_is_archived ON quotations(is_archived);

-- 6. Helper function to generate next safe version number
CREATE OR REPLACE FUNCTION get_next_quotation_version(p_project_id UUID, p_quotation_number TEXT)
RETURNS INT AS $$
DECLARE
  v_next_version INT;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1
  INTO v_next_version
  FROM quotations
  WHERE project_id = p_project_id AND quotation_number = p_quotation_number;
  
  RETURN v_next_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
