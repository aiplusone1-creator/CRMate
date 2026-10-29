-- ==============================================================================
-- Migration: 20261029_000002_contacts_creator_and_attribution.sql
-- 
-- Phase 7: Authoritative Contact Creator Attribution (Strict ID-List Model)
-- 
-- Safety & Idempotency Guarantees:
-- 1. Strictly ID-based: Every record is identified by its primary key.
-- 2. Non-overwrite rule: Never overwrites an existing non-NULL created_by belonging
--    to a different user. Only updates rows where created_by IS NULL or already matches.
-- 3. Zero company mutations: All 287 companies in Supabase already possess verified
--    created_by values; the companies table is not modified.
-- 4. Unverified records naturally remain NULL: cnt_151 and ct_fahad_zahrani are
--    not included in any engineer's list, ensuring they remain NULL without risk.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PART 1: DDL - Add created_by Column & Index to Contacts
-- ------------------------------------------------------------------------------
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);

-- ------------------------------------------------------------------------------
-- PART 2: DML - Attribution Backfill (Guarded by created_by IS NULL OR = target)
-- ------------------------------------------------------------------------------

-- 2a. Karim Abdelazeez (u4) - Exactly 77 verified records
-- Source: "Saudi Projects Follow UP - CRM Form - Karim Abdelazeez.xlsx"
UPDATE contacts
SET created_by = 'u4'
WHERE id IN (
    'ct_u4_hl_001', 'ct_u4_hl_002', 'ct_u4_hl_003', 'ct_u4_hl_004', 'ct_u4_hl_005', 'ct_u4_hl_006',
    'ct_u4_hl_007', 'ct_u4_hl_008', 'ct_u4_hl_009', 'ct_u4_hl_010', 'ct_u4_hl_011', 'ct_u4_hl_012',
    'ct_u4_hl_013', 'ct_u4_hl_014', 'ct_u4_hl_015', 'ct_u4_hl_016', 'ct_u4_hl_017', 'ct_u4_hl_018',
    'ct_u4_hl_019', 'ct_u4_hl_020', 'ct_u4_hl_021', 'ct_u4_hl_022', 'ct_u4_hl_023', 'ct_u4_hl_024',
    'ct_u4_hl_025', 'ct_u4_hl_026', 'ct_u4_hl_027', 'ct_u4_hl_028', 'ct_u4_hl_029', 'ct_u4_hl_030',
    'ct_u4_hl_031', 'ct_u4_hl_032', 'ct_u4_hl_033', 'ct_u4_hl_034', 'ct_u4_hl_035', 'ct_u4_hl_036',
    'ct_u4_hl_037', 'ct_u4_hl_038', 'ct_u4_hl_039', 'ct_u4_hl_040', 'ct_u4_hl_041', 'ct_u4_hl_042',
    'ct_u4_hl_043', 'ct_u4_hl_044', 'ct_u4_hl_045', 'ct_u4_hl_046', 'ct_u4_hl_047', 'ct_u4_hl_048',
    'ct_u4_hl_049', 'ct_u4_hl_050', 'ct_u4_hl_051', 'ct_u4_hl_052', 'ct_u4_hl_053', 'ct_u4_hl_054',
    'ct_u4_hl_055', 'ct_u4_hl_056', 'ct_u4_hl_057', 'ct_u4_hl_058', 'ct_u4_hl_059', 'ct_u4_hl_060',
    'ct_u4_hl_061', 'ct_u4_hl_062', 'ct_u4_hl_063', 'ct_u4_hl_064', 'ct_u4_hl_065', 'ct_u4_hl_066',
    'ct_u4_hl_067', 'ct_u4_hl_068', 'ct_u4_hl_069', 'ct_u4_hl_070', 'ct_u4_hl_071', 'ct_u4_hl_072',
    'ct_u4_hl_073', 'ct_u4_hl_074', 'ct_u4_hl_075', 'ct_u4_hl_076', 'ct_u4_hl_077'
)
AND (created_by IS NULL OR created_by = 'u4');

-- 2b. Adel Nasr (u0) - Exactly 69 verified records
-- Source: "Saudi Projects Follow UP - CRM Form - Adel Nasr.xlsx"
UPDATE contacts
SET created_by = 'u0'
WHERE id IN (
    'ct_u0_l_001', 'ct_u0_l_002', 'ct_u0_l_003', 'ct_u0_l_004', 'ct_u0_l_005', 'ct_u0_l_006',
    'ct_u0_l_007', 'ct_u0_l_008', 'ct_u0_l_009', 'ct_u0_l_010', 'ct_u0_l_011', 'ct_u0_l_012',
    'ct_u0_l_013', 'ct_u0_l_014', 'ct_u0_l_015', 'ct_u0_l_016', 'ct_u0_l_017', 'ct_u0_l_018',
    'ct_u0_l_019', 'ct_u0_l_020', 'ct_u0_l_021', 'ct_u0_l_022', 'ct_u0_l_023', 'ct_u0_l_024',
    'ct_u0_l_025', 'ct_u0_l_026', 'ct_u0_l_027', 'ct_u0_l_028', 'ct_u0_l_029', 'ct_u0_l_030',
    'ct_u0_l_031', 'ct_u0_l_032', 'ct_u0_l_033', 'ct_u0_l_034', 'ct_u0_l_035', 'ct_u0_l_036',
    'ct_u0_l_037', 'ct_u0_l_038', 'ct_u0_l_039', 'ct_u0_l_040', 'ct_u0_l_041', 'ct_u0_l_042',
    'ct_u0_l_043', 'ct_u0_l_044', 'ct_u0_l_045', 'ct_u0_l_046', 'ct_u0_l_047', 'ct_u0_l_048',
    'ct_u0_l_049', 'ct_u0_l_050', 'ct_u0_l_051', 'ct_u0_l_052', 'ct_u0_l_053', 'ct_u0_l_054',
    'ct_u0_l_055', 'ct_u0_l_056', 'ct_u0_l_057', 'ct_u0_l_058', 'ct_u0_l_059', 'ct_u0_l_060',
    'ct_u0_l_061', 'ct_u0_l_062', 'ct_u0_l_063', 'ct_u0_l_064', 'ct_u0_l_065', 'ct_u0_l_066',
    'ct_u0_l_067', 'ct_u0_l_068', 'ct_u0_l_069'
)
AND (created_by IS NULL OR created_by = 'u0');

-- 2c. Abdelrahman Mohamed (u2) - Exactly 81 verified records
-- Source: "Saudi Projects Follow UP -Share - Abdelrahman Mohamed.xlsx"
UPDATE contacts
SET created_by = 'u2'
WHERE id IN (
    'ct_u2_hl_001', 'ct_u2_hl_002', 'ct_u2_hl_003', 'ct_u2_hl_004', 'ct_u2_hl_005', 'ct_u2_hl_006',
    'ct_u2_hl_007', 'ct_u2_hl_008', 'ct_u2_hl_009', 'ct_u2_hl_010', 'ct_u2_hl_011', 'ct_u2_hl_012',
    'ct_u2_hl_013', 'ct_u2_hl_014', 'ct_u2_hl_015', 'ct_u2_hl_016', 'ct_u2_hl_017', 'ct_u2_hl_018',
    'ct_u2_hl_019', 'ct_u2_hl_020', 'ct_u2_hl_021', 'ct_u2_hl_022', 'ct_u2_hl_023', 'ct_u2_hl_024',
    'ct_u2_hl_025', 'ct_u2_hl_026', 'ct_u2_hl_027', 'ct_u2_hl_028', 'ct_u2_hl_029', 'ct_u2_hl_030',
    'ct_u2_hl_031', 'ct_u2_hl_032', 'ct_u2_hl_033', 'ct_u2_hl_034', 'ct_u2_hl_035', 'ct_u2_hl_036',
    'ct_u2_hl_037', 'ct_u2_hl_038', 'ct_u2_hl_039', 'ct_u2_hl_040', 'ct_u2_hl_041', 'ct_u2_hl_042',
    'ct_u2_hl_043', 'ct_u2_hl_044', 'ct_u2_hl_045', 'ct_u2_hl_046', 'ct_u2_hl_047', 'ct_u2_hl_048',
    'ct_u2_hl_049', 'ct_u2_hl_050', 'ct_u2_hl_051', 'ct_u2_hl_052', 'ct_u2_hl_053', 'ct_u2_hl_054',
    'ct_u2_hl_055', 'ct_u2_hl_056', 'ct_u2_hl_057', 'ct_u2_hl_058', 'ct_u2_hl_059', 'ct_u2_hl_060',
    'ct_u2_hl_061', 'ct_u2_hl_062', 'ct_u2_hl_063', 'ct_u2_hl_064', 'ct_u2_hl_065', 'ct_u2_hl_066',
    'ct_u2_hl_067', 'ct_u2_hl_068', 'ct_u2_hl_069', 'ct_u2_hl_070', 'ct_u2_hl_071', 'ct_u2_hl_072',
    'ct_u2_hl_073', 'ct_u2_hl_074', 'ct_u2_hl_075', 'ct_u2_hl_076', 'ct_u2_hl_077', 'ct_u2_hl_078',
    'ct_u2_hl_079', 'ct_u2_hl_080', 'ct_u2_hl_081'
)
AND (created_by IS NULL OR created_by = 'u2');

-- 2d. Eslam Al-Mohandes (u1) - Exactly 158 verified records
-- Source 1: "Saudi Projects Follow UP - Eslam Mohandes(1).xlsx" (Hot Leads rows 1-150: 150 records)
-- Source 2: In-app session audit logs with matching activity records (8 records)
UPDATE contacts
SET created_by = 'u1'
WHERE id IN (
    'cnt_1', 'cnt_2', 'cnt_3', 'cnt_4', 'cnt_5', 'cnt_6',
    'cnt_7', 'cnt_8', 'cnt_9', 'cnt_10', 'cnt_11', 'cnt_12',
    'cnt_13', 'cnt_14', 'cnt_15', 'cnt_16', 'cnt_17', 'cnt_18',
    'cnt_19', 'cnt_20', 'cnt_21', 'cnt_22', 'cnt_23', 'cnt_24',
    'cnt_25', 'cnt_26', 'cnt_27', 'cnt_28', 'cnt_29', 'cnt_30',
    'cnt_31', 'cnt_32', 'cnt_33', 'cnt_34', 'cnt_35', 'cnt_36',
    'cnt_37', 'cnt_38', 'cnt_39', 'cnt_40', 'cnt_41', 'cnt_42',
    'cnt_43', 'cnt_44', 'cnt_45', 'cnt_46', 'cnt_47', 'cnt_48',
    'cnt_49', 'cnt_50', 'cnt_51', 'cnt_52', 'cnt_53', 'cnt_54',
    'cnt_55', 'cnt_56', 'cnt_57', 'cnt_58', 'cnt_59', 'cnt_60',
    'cnt_61', 'cnt_62', 'cnt_63', 'cnt_64', 'cnt_65', 'cnt_66',
    'cnt_67', 'cnt_68', 'cnt_69', 'cnt_70', 'cnt_71', 'cnt_72',
    'cnt_73', 'cnt_74', 'cnt_75', 'cnt_76', 'cnt_77', 'cnt_78',
    'cnt_79', 'cnt_80', 'cnt_81', 'cnt_82', 'cnt_83', 'cnt_84',
    'cnt_85', 'cnt_86', 'cnt_87', 'cnt_88', 'cnt_89', 'cnt_90',
    'cnt_91', 'cnt_92', 'cnt_93', 'cnt_94', 'cnt_95', 'cnt_96',
    'cnt_97', 'cnt_98', 'cnt_99', 'cnt_100', 'cnt_101', 'cnt_102',
    'cnt_103', 'cnt_104', 'cnt_105', 'cnt_106', 'cnt_107', 'cnt_108',
    'cnt_109', 'cnt_110', 'cnt_111', 'cnt_112', 'cnt_113', 'cnt_114',
    'cnt_115', 'cnt_116', 'cnt_117', 'cnt_118', 'cnt_119', 'cnt_120',
    'cnt_121', 'cnt_122', 'cnt_123', 'cnt_124', 'cnt_125', 'cnt_126',
    'cnt_127', 'cnt_128', 'cnt_129', 'cnt_130', 'cnt_131', 'cnt_132',
    'cnt_133', 'cnt_134', 'cnt_135', 'cnt_136', 'cnt_137', 'cnt_138',
    'cnt_139', 'cnt_140', 'cnt_141', 'cnt_142', 'cnt_143', 'cnt_144',
    'cnt_145', 'cnt_146', 'cnt_147', 'cnt_148', 'cnt_149', 'cnt_150',
    'cnt_1790761657263', 'cnt_1790761732883', 'cnt_1790762140890', 'cnt_1791973982837', 'cnt_1791975659219', 'cnt_1792583260575',
    'cnt_1792583522493', 'cnt_1792583546177'
)
AND (created_by IS NULL OR created_by = 'u1');

-- ------------------------------------------------------------------------------
-- PART 3: Post-Migration Verification Queries
-- (Run these SELECT statements to verify the results immediately after execution)
-- ------------------------------------------------------------------------------
-- Query A: Verify distribution of contacts created_by (Expected: u1=158, u2=81, u4=77, u0=69, NULL=2)
-- SELECT COALESCE(created_by, 'UNKNOWN_NULL') AS creator, COUNT(*) AS count
-- FROM contacts
-- GROUP BY creator
-- ORDER BY count DESC;

-- Query B: Verify that unverified legacy records remain NULL
-- SELECT id, full_name, company_name, created_by 
-- FROM contacts 
-- WHERE id IN ('cnt_151', 'ct_fahad_zahrani');

-- Query C: Verify that companies created_by distribution remains intact
-- SELECT COALESCE(created_by, 'UNKNOWN_NULL') AS creator, COUNT(*) AS count
-- FROM companies
-- GROUP BY creator
-- ORDER BY count DESC;
