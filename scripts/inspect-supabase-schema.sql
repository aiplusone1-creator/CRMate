-- ==============================================================================
-- CRMate — Non-Destructive Preflight Inspection Query for Supabase SQL Editor
-- (100% READ-ONLY: Contains ZERO DDL, ZERO INSERT, ZERO UPDATE, ZERO DELETE)
-- ==============================================================================

-- 1. Check all existing public tables, their primary keys, ID types, and row estimates
SELECT 
  t.table_name,
  COALESCE(c.column_name, 'NO PRIMARY KEY') AS primary_key_column,
  COALESCE(c.data_type, 'N/A') AS pk_data_type,
  COALESCE(s.n_live_tup, 0) AS estimated_row_count,
  CASE 
    WHEN c.data_type = 'uuid' THEN '⚠️ INCOMPATIBLE (Legacy UUID PK detected)'
    WHEN c.data_type = 'text' THEN '✅ COMPATIBLE (Text PK)'
    WHEN c.data_type IS NULL THEN 'ℹ️ TABLE HAS NO PK'
    ELSE '⚠️ UNKNOWN PK TYPE: ' || c.data_type
  END AS compatibility_status
FROM information_schema.tables t
LEFT JOIN (
  SELECT 
    kcu.table_name, 
    kcu.column_name, 
    cols.data_type
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.columns cols 
    ON kcu.table_name = cols.table_name 
    AND kcu.column_name = cols.column_name 
    AND kcu.table_schema = cols.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY' 
    AND tc.table_schema = 'public'
) c ON t.table_name = c.table_name
LEFT JOIN pg_stat_user_tables s 
  ON s.schemaname = 'public' 
  AND s.relname = t.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- 2. Check all user-defined enum types in public schema
SELECT 
  t.typname AS enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;
