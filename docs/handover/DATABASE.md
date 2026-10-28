# Database Architecture, Schema, and Security

This document outlines the complete database schema for **Al-Mespar CRM (CRMate)** derived directly from the SQL migrations located in `supabase/migrations/`.

---

## 1. Migration Files (Execution Order)

The migrations must be run sequentially against PostgreSQL / Supabase:

1. **`supabase/migrations/20260917_000001_initial_schema.sql`**
   - Enables `uuid-ossp` extension.
   - Creates ENUM types: `user_role_enum`, `company_type_enum`, `opportunity_type_enum`, `pipeline_stage_enum`, `priority_enum`, `project_member_role_enum`, `activity_channel_enum`, `visit_purpose_enum`, `activity_outcome_enum`, `planned_activity_status_enum`, `target_metric_enum`, `target_period_enum`, `quotation_status_enum`.
   - Creates all core tables: `profiles`, `companies`, `contacts`, `projects`, `project_members`, `project_contacts`, `weekly_plans`, `planned_activities`, `activities`, `quotations`, `sales_targets`, `project_stage_history`, `migration_batches`, `migration_staging_projects`.
   - Establishes activity timestamp triggers (`fn_on_activity_inserted_or_updated`) and stage auditing (`fn_track_project_stage_change`).
   - Defines dynamic view `v_projects_with_health`.
   - Enables and configures Row Level Security (RLS) policies.

2. **`supabase/migrations/20260920_000001_quotation_versioning.sql`**
   - Extends `quotation_status_enum` with values: `'submitted'`, `'negotiation'`, `'cancelled'`.
   - Adds commercial breakdown columns to `quotations`: `subtotal`, `discount_amount`, `discount_percentage`, `tax_amount`, `total_amount`, `quotation_date`, `file_name`, `file_size`, `customer_reference`, `rfq_number`, `revision_reason`, `payment_terms`, `delivery_terms`, `warranty_terms`, `technical_notes`, `previous_version_id`, `is_archived`.
   - Adds `final_won_value` column to `projects` to decouple estimated pipeline values from closed won contract amounts.
   - Creates indexes `idx_quotations_project_version` and `idx_quotations_is_archived`.
   - Creates database function `get_next_quotation_version(p_project_id, p_quotation_number)`.

---

## 2. Custom PostgreSQL Types (ENUMs)

- `user_role_enum`: `'admin'`, `'sales_manager'`, `'sales_engineer'`, `'estimator'`, `'viewer'`
- `company_type_enum`: `'contractor'`, `'consultant'`, `'developer'`, `'client_owner'`, `'mep_contractor'`, `'supplier_vendor'`, `'hotel'`, `'hospital'`, `'other'`
- `opportunity_type_enum`: `'new_lead'`, `'in_hand'`, `'tender'`, `'existing_account'`, `'upgrade_retrofit'`, `'hunting_potential'`
- `pipeline_stage_enum`: `'lead'`, `'qualification'`, `'rfq_processing'`, `'pricing'`, `'quotation_sent'`, `'technical_submission'`, `'technically_approved'`, `'negotiation'`, `'won'`, `'lost'`, `'hold'`
- `priority_enum`: `'low'`, `'medium'`, `'high'`, `'urgent'`
- `project_member_role_enum`: `'co_sales_engineer'`, `'lead_estimator'`, `'technical_support'`, `'executive_sponsor'`
- `activity_channel_enum`: `'call'`, `'meeting_f2f'`, `'meeting_online'`, `'visit'`, `'hunting'`, `'office_work'`, `'event'`, `'email'`
- `visit_purpose_enum`: `'new_lead'`, `'follow_up'`, `'cold_call'`, `'consultant_visit'`, `'customer_visit'`, `'technical_clarification'`, `'quotation_delivery'`
- `activity_outcome_enum`: `'connected'`, `'no_answer'`, `'meeting_booked'`, `'requirement_received'`, `'rfq_received'`, `'quotation_sent'`, `'awaiting_feedback'`, `'procurement_contact_needed'`, `'technical_feedback_needed'`, `'follow_up_later'`, `'lost'`, `'hold'`, `'won'`, `'new_project_identified'`, `'other'`
- `planned_activity_status_enum`: `'planned'`, `'completed'`, `'rescheduled'`, `'skipped'`, `'cancelled'`
- `target_metric_enum`: `'calls'`, `'f2f_meetings'`, `'hunting_visits'`, `'new_leads'`, `'new_projects'`, `'rfqs'`, `'quotations_sent'`, `'quotation_value'`, `'won_value'`
- `target_period_enum`: `'weekly'`, `'monthly'`, `'quarterly'`, `'yearly'`
- `quotation_status_enum`: `'draft'`, `'internal_review'`, `'under_review'`, `'sent'`, `'submitted'`, `'revised'`, `'negotiation'`, `'accepted'`, `'approved'`, `'rejected'`, `'expired'`, `'cancelled'`

---

## 3. Table Definitions & Relationships

### 3.1 `profiles`
Stores user profile information linked directly to Supabase authentication.
- `id` (UUID, PK) -> References `auth.users(id) ON DELETE CASCADE`
- `email` (TEXT, UNIQUE, NOT NULL)
- `full_name` (TEXT, NOT NULL)
- `role` (`user_role_enum`, NOT NULL, DEFAULT `'sales_engineer'`)
- `phone` (TEXT, NULL)
- `avatar_url` (TEXT, NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

### 3.2 `companies`
Shared master directory of client accounts, contractors, consultants, and developers.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`)
- `name` (TEXT, NOT NULL)
- `normalized_name` (TEXT, NOT NULL) [Index: `idx_companies_normalized_name`]
- `company_type` (`company_type_enum`, NOT NULL, DEFAULT `'contractor'`)
- `city` (TEXT, NULL)
- `website` (TEXT, NULL)
- `google_maps_url` (TEXT, NULL)
- `phone` (TEXT, NULL)
- `notes` (TEXT, NULL)
- `created_by` (UUID, NULL) -> References `profiles(id) ON DELETE SET NULL`
- `migration_batch_id` (UUID, NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

### 3.3 `contacts`
Shared master contact registry.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`)
- `company_id` (UUID, NULL) -> References `companies(id) ON DELETE SET NULL` [Index: `idx_contacts_company_id`]
- `full_name` (TEXT, NOT NULL)
- `job_title` (TEXT, NULL)
- `phone` (TEXT, NULL)
- `normalized_phone` (TEXT, NULL) [Index: `idx_contacts_normalized_phone`]
- `email` (TEXT, NULL)
- `city` (TEXT, NULL)
- `linkedin_url` (TEXT, NULL)
- `is_hot_lead` (BOOLEAN, NOT NULL, DEFAULT `FALSE`)
- `notes` (TEXT, NULL)
- `owner_id` (UUID, NULL) -> References `profiles(id) ON DELETE SET NULL`
- `last_contacted_at` (TIMESTAMPTZ, NULL)
- `next_follow_up_at` (TIMESTAMPTZ, NULL)
- `migration_batch_id` (UUID, NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

### 3.4 `projects`
Central project opportunity and commercial pipeline table.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`)
- `pr_number` (TEXT, UNIQUE, NOT NULL)
- `name` (TEXT, NOT NULL)
- `company_id` (UUID, NOT NULL) -> References `companies(id) ON DELETE RESTRICT`
- `primary_contact_id` (UUID, NULL) -> References `contacts(id) ON DELETE SET NULL`
- `location` (TEXT, NOT NULL)
- `opportunity_type` (`opportunity_type_enum`, NOT NULL, DEFAULT `'in_hand'`)
- `pipeline_stage` (`pipeline_stage_enum`, NOT NULL, DEFAULT `'lead'`) [Index: `idx_projects_stage`]
- `priority` (`priority_enum`, NOT NULL, DEFAULT `'medium'`)
- `estimated_value` (NUMERIC(15, 2), NOT NULL, DEFAULT `0.00`)
- `probability` (INT, NOT NULL, DEFAULT `50`, CHECK `probability BETWEEN 0 AND 100`)
- `weighted_value` (NUMERIC(15, 2), GENERATED ALWAYS AS `(estimated_value * probability / 100.0) STORED`)
- `final_won_value` (NUMERIC(15, 2), NULL) *(Added in migration 20260920)*
- `expected_award_date` (DATE, NULL)
- `owner_id` (UUID, NULL) -> References `profiles(id) ON DELETE SET NULL` [Index: `idx_projects_owner`]
- `next_action` (TEXT, NULL)
- `next_follow_up_at` (TIMESTAMPTZ, NULL) [Index: `idx_projects_next_follow_up`]
- `last_activity_at` (TIMESTAMPTZ, NULL)
- `lost_reason` (TEXT, NULL)
- `hold_reason` (TEXT, NULL)
- `internal_notes` (TEXT, NULL)
- `migration_batch_id` (UUID, NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

### 3.5 `project_members`
Cross-functional collaboration assignments on projects.
- `project_id` (UUID, NOT NULL) -> References `projects(id) ON DELETE CASCADE`
- `user_id` (UUID, NOT NULL) -> References `profiles(id) ON DELETE CASCADE`
- `role` (`project_member_role_enum`, NOT NULL, DEFAULT `'co_sales_engineer'`)
- `assigned_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- Primary Key: `(project_id, user_id)`

### 3.6 `project_contacts`
Many-to-many relationship connecting multiple contacts to a project.
- `project_id` (UUID, NOT NULL) -> References `projects(id) ON DELETE CASCADE`
- `contact_id` (UUID, NOT NULL) -> References `contacts(id) ON DELETE CASCADE`
- `role_in_project` (TEXT, NULL)
- Primary Key: `(project_id, contact_id)`

### 3.7 `weekly_plans`
Weekly plan containers for sales engineers.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`)
- `user_id` (UUID, NOT NULL) -> References `profiles(id) ON DELETE CASCADE`
- `year` (INT, NOT NULL)
- `week_number` (INT, NOT NULL)
- `notes` (TEXT, NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- Unique constraint: `UNIQUE(user_id, year, week_number)`

### 3.8 `planned_activities`
Scheduled tasks and appointments within a weekly plan.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`)
- `weekly_plan_id` (UUID, NOT NULL) -> References `weekly_plans(id) ON DELETE CASCADE`
- `project_id` (UUID, NULL) -> References `projects(id) ON DELETE SET NULL`
- `company_id` (UUID, NULL) -> References `companies(id) ON DELETE SET NULL`
- `contact_id` (UUID, NULL) -> References `contacts(id) ON DELETE SET NULL`
- `scheduled_date` (DATE, NOT NULL)
- `time_slot` (TEXT, NULL)
- `channel` (`activity_channel_enum`, NOT NULL, DEFAULT `'call'`)
- `visit_purpose` (`visit_purpose_enum`, NULL, DEFAULT `'follow_up'`)
- `goal` (TEXT, NOT NULL)
- `priority` (`priority_enum`, NOT NULL, DEFAULT `'medium'`)
- `status` (`planned_activity_status_enum`, NOT NULL, DEFAULT `'planned'`)
- `completed_activity_id` (UUID, NULL) -> References `activities(id) ON DELETE SET NULL`
- `skip_reason` (TEXT, NULL)
- `rescheduled_to_date` (DATE, NULL)
- `migration_batch_id` (UUID, NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

### 3.9 `activities`
Actual executed sales interactions and meeting logs.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`)
- `project_id` (UUID, NULL) -> References `projects(id) ON DELETE SET NULL` [Index: `idx_activities_project`]
- `company_id` (UUID, NULL) -> References `companies(id) ON DELETE SET NULL`
- `contact_id` (UUID, NULL) -> References `contacts(id) ON DELETE SET NULL`
- `user_id` (UUID, NOT NULL) -> References `profiles(id) ON DELETE CASCADE`
- `planned_activity_id` (UUID, NULL) -> References `planned_activities(id) ON DELETE SET NULL`
- `activity_date` (DATE, NOT NULL, DEFAULT `CURRENT_DATE`)
- `activity_time` (TIME, NULL)
- `channel` (`activity_channel_enum`, NOT NULL, DEFAULT `'call'`)
- `visit_purpose` (`visit_purpose_enum`, NULL, DEFAULT `'follow_up'`)
- `outcome` (`activity_outcome_enum`, NULL)
- `notes` (TEXT, NULL)
- `next_action` (TEXT, NULL)
- `next_follow_up_at` (TIMESTAMPTZ, NULL)
- `migration_batch_id` (UUID, NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- Index: `idx_activities_user_date` on `(user_id, activity_date)`

### 3.10 `quotations`
Commercial quotations and version history.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`)
- `project_id` (UUID, NOT NULL) -> References `projects(id) ON DELETE CASCADE`
- `quotation_number` (TEXT, NOT NULL)
- `version` (INT, NOT NULL, DEFAULT `1`)
- `amount` (NUMERIC(15, 2), NOT NULL, DEFAULT `0.00`)
- `subtotal` (NUMERIC(15, 2), NULL) *(Added in migration 20260920)*
- `discount_amount` (NUMERIC(15, 2), DEFAULT `0.00`) *(Added in migration 20260920)*
- `discount_percentage` (NUMERIC(5, 2), DEFAULT `0.00`) *(Added in migration 20260920)*
- `tax_amount` (NUMERIC(15, 2), DEFAULT `0.00`) *(Added in migration 20260920)*
- `total_amount` (NUMERIC(15, 2), NULL) *(Added in migration 20260920)*
- `currency` (TEXT, NOT NULL, DEFAULT `'SAR'`)
- `vendor_brand` (TEXT, NULL)
- `status` (`quotation_status_enum`, NOT NULL, DEFAULT `'draft'`)
- `quotation_date` (DATE, DEFAULT `CURRENT_DATE`) *(Added in migration 20260920)*
- `sent_date` (DATE, NULL)
- `valid_until` (DATE, NULL)
- `file_url` (TEXT, NULL)
- `file_name` (TEXT, NULL) *(Added in migration 20260920)*
- `file_size` (TEXT, NULL) *(Added in migration 20260920)*
- `customer_reference` (TEXT, NULL) *(Added in migration 20260920)*
- `rfq_number` (TEXT, NULL) *(Added in migration 20260920)*
- `revision_reason` (TEXT, NULL) *(Added in migration 20260920)*
- `payment_terms` (TEXT, NULL) *(Added in migration 20260920)*
- `delivery_terms` (TEXT, NULL) *(Added in migration 20260920)*
- `warranty_terms` (TEXT, NULL) *(Added in migration 20260920)*
- `technical_notes` (TEXT, NULL) *(Added in migration 20260920)*
- `previous_version_id` (UUID, NULL) -> References `quotations(id) ON DELETE SET NULL` *(Added in migration 20260920)*
- `is_archived` (BOOLEAN, NOT NULL, DEFAULT `FALSE`) *(Added in migration 20260920)*
- `notes` (TEXT, NULL)
- `created_by` (UUID, NULL) -> References `profiles(id) ON DELETE SET NULL`
- `migration_batch_id` (UUID, NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- Unique constraint: `UNIQUE(project_id, quotation_number, version)`
- Indexes: `idx_quotations_project_version` on `(project_id, quotation_number, version DESC)`, `idx_quotations_is_archived` on `(is_archived)`

### 3.11 `sales_targets`
Target quotas configured per salesperson or kingdom-wide.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`)
- `user_id` (UUID, NULL) -> References `profiles(id) ON DELETE CASCADE` (NULL denotes Team/Regional target)
- `period_type` (`target_period_enum`, NOT NULL, DEFAULT `'monthly'`)
- `period_start` (DATE, NOT NULL)
- `period_end` (DATE, NOT NULL)
- `target_metric` (`target_metric_enum`, NOT NULL)
- `target_value` (NUMERIC(15, 2), NOT NULL, CHECK `target_value >= 0`)
- `created_by` (UUID, NULL) -> References `profiles(id) ON DELETE SET NULL`
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- Unique constraint: `UNIQUE(user_id, period_type, period_start, target_metric)`

### 3.12 `project_stage_history`
Audit log of stage transitions across all opportunities.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`)
- `project_id` (UUID, NOT NULL) -> References `projects(id) ON DELETE CASCADE`
- `old_stage` (`pipeline_stage_enum`, NULL)
- `new_stage` (`pipeline_stage_enum`, NOT NULL)
- `changed_by` (UUID, NULL) -> References `profiles(id) ON DELETE SET NULL`
- `changed_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

### 3.13 `migration_batches`
Tracks batches of imported spreadsheets.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`)
- `batch_name` (TEXT, NOT NULL)
- `file_name` (TEXT, NOT NULL)
- `file_hash` (TEXT, NOT NULL)
- `total_records` (INT, NOT NULL, DEFAULT `0`)
- `imported_records` (INT, NOT NULL, DEFAULT `0`)
- `skipped_records` (INT, NOT NULL, DEFAULT `0`)
- `status` (TEXT, NOT NULL, CHECK `status IN ('in_progress', 'completed', 'rolled_back', 'failed')`)
- `executed_by` (UUID, NULL) -> References `profiles(id) ON DELETE SET NULL`
- `started_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- `completed_at` (TIMESTAMPTZ, NULL)

### 3.14 `migration_staging_projects`
Staging table for reconciling and deduplicating legacy spreadsheet records before importing.
- `id` (UUID, PK, DEFAULT `uuid_generate_v4()`)
- `batch_id` (UUID, NOT NULL) -> References `migration_batches(id) ON DELETE CASCADE`
- `source_sheet` (TEXT, NOT NULL)
- `source_row` (INT, NOT NULL)
- `raw_opportunity_name` (TEXT, NOT NULL)
- `raw_contact_name` (TEXT, NULL)
- `raw_company_name` (TEXT, NULL)
- `matched_project_id` (UUID, NULL) -> References `projects(id) ON DELETE SET NULL`
- `matched_contact_id` (UUID, NULL) -> References `contacts(id) ON DELETE SET NULL`
- `confidence_score` (NUMERIC(5, 2), NOT NULL, DEFAULT `0.00`)
- `suggested_action` (TEXT, NOT NULL, CHECK `suggested_action IN ('exact_match', 'fuzzy_match', 'create_new', 'skip')`)
- `user_action` (TEXT, NULL, CHECK `user_action IN ('accept', 'create_new', 'skip')`)
- `reviewed_by` (UUID, NULL) -> References `profiles(id) ON DELETE SET NULL`
- `reviewed_at` (TIMESTAMPTZ, NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

---

## 4. Views

### `v_projects_with_health`
Dynamic calculation view that joins `projects`, `companies`, `contacts`, and `profiles`, computing real-time project health:
- Returns:
  - All columns from `projects`
  - `company_name`, `primary_contact_name`, `primary_contact_phone`, `owner_name`
  - `calculated_health`:
    - `'neutral'`: If project stage is `'won'`, `'lost'`, or `'hold'`
    - `'red'`: If `next_follow_up_at < CURRENT_DATE` (overdue), or `next_action` is empty, or `last_activity_at < NOW() - 14 days`
    - `'yellow'`: If `next_follow_up_at` is within 48 hours, or `last_activity_at < NOW() - 7 days`
    - `'green'`: Has upcoming follow-up date and recent activity
  - `days_overdue`: Days between current date and overdue follow-up date

---

## 5. Triggers and Database Functions

### 5.1 `fn_on_activity_inserted_or_updated()` / Trigger `trg_activity_inserted_or_updated`
- **Attached to**: `activities` (AFTER INSERT OR UPDATE FOR EACH ROW)
- **Logic**:
  1. Computes `v_activity_timestamp := (NEW.activity_date + COALESCE(NEW.activity_time, '12:00:00'::time))::timestamptz`.
  2. Updates `projects`:
     - Sets `last_activity_at = GREATEST(COALESCE(projects.last_activity_at, '-infinity'::timestamptz), v_activity_timestamp)`.
     - Preserves existing `next_action` and `next_follow_up_at` if the newly inserted activity is historical (i.e. older than existing activities). Only updates next actions if this activity is chronologically the latest.
  3. Updates `contacts`:
     - Sets `last_contacted_at = GREATEST(...)`.
     - Updates `next_follow_up_at` if activity is chronologically latest.

### 5.2 `fn_track_project_stage_change()` / Trigger `trg_project_stage_changed`
- **Attached to**: `projects` (AFTER UPDATE OF `pipeline_stage` FOR EACH ROW)
- **Logic**:
  - Compares `OLD.pipeline_stage` to `NEW.pipeline_stage`.
  - Automatically inserts an audit record into `project_stage_history` with `auth.uid()` and timestamp `NOW()`.

### 5.3 `get_next_quotation_version(p_project_id UUID, p_quotation_number TEXT)`
- **Returns**: `INT`
- **Security**: `SECURITY DEFINER`
- **Logic**:
  - Queries `SELECT COALESCE(MAX(version), 0) + 1 FROM quotations WHERE project_id = p_project_id AND quotation_number = p_quotation_number`.

---

## 6. Row Level Security (RLS) Policies

All core tables have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). The policies enforce:

| Table | Policy Name | Command | Who / Condition |
|---|---|---|---|
| `profiles` | `profiles_select` | `SELECT` | All authenticated users (`true`) |
| `profiles` | `profiles_update_own` | `UPDATE` | Own profile only (`auth.uid() = id`) |
| `companies` | `companies_select` | `SELECT` | All authenticated users (`true`) |
| `companies` | `companies_insert` | `INSERT` | Authenticated users (`auth.uid() IS NOT NULL`) |
| `companies` | `companies_update` | `UPDATE` | Authenticated users (`auth.uid() IS NOT NULL`) |
| `contacts` | `contacts_select` | `SELECT` | All authenticated users (`true`) |
| `contacts` | `contacts_insert` | `INSERT` | Authenticated users (`auth.uid() IS NOT NULL`) |
| `contacts` | `contacts_update` | `UPDATE` | Authenticated users (`auth.uid() IS NOT NULL`) |
| `projects` | `projects_select` | `SELECT` | All authenticated users (`true`) |
| `projects` | `projects_modify` | `ALL` | Admin or Sales Manager, OR project `owner_id = auth.uid()`, OR user is in `project_members` |
| `quotations` | `quotations_select` | `SELECT` | All authenticated users (`true`) |
| `quotations` | `quotations_modify` | `ALL` | Admin, Sales Manager, or Estimator, OR creator (`created_by = auth.uid()`), OR project owner |
| `activities` | `activities_select` | `SELECT` | All authenticated users (`true`) |
| `activities` | `activities_insert` | `INSERT` | Creator only (`auth.uid() = user_id`) |
| `activities` | `activities_modify` | `UPDATE` | Author (`auth.uid() = user_id`) OR Admin / Sales Manager |
| `sales_targets` | `sales_targets_select` | `SELECT` | All authenticated users (`true`) |
| `sales_targets` | `sales_targets_modify` | `ALL` | Admin or Sales Manager only |

---

## 7. Storage Buckets and Edge Functions

- **Storage Buckets**: **None**. No Supabase storage buckets are created or referenced in the migration SQL files or client code. Quotations reference documents via `file_url`, `file_name`, and `file_size` text fields.
- **Edge Functions**: **None**. No Supabase Edge Functions (`supabase/functions/`) exist in this repository. All business logic, Excel synchronization, and quotation calculations are handled within the Next.js application layer.
