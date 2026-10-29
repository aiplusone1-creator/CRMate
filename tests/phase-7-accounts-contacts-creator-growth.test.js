/**
 * CRMate - Phase 7 Test Suite
 * Tests for:
 * 1. Database Schema & Migration for Creator Attribution (companies.created_by, contacts.created_by)
 * 2. Server-side Enforcement & Spoof Prevention on Mutations
 * 3. Fallback Mapping & Unverified Records Handling
 * 4. Periodic Sales Performance Scoping:
 *    - Scoping by effectiveSalesUserId for Sales Engineer vs Manager
 *    - New Accounts vs Expanded Accounts ("توسع حساب قائم")
 *    - User-isolated contacts inside company cards
 *    - Preserving shared visibility of team companies & contacts
 *    - Period date boundary enforcement
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

console.log('\n================================================================');
console.log(' CRMate - Phase 7 Accounts & Contacts Creator Growth Test Suite ');
console.log('================================================================\n');

// -------------------------------------------------------------
// [Group 1] Database Migration & Type Contracts
// -------------------------------------------------------------
console.log('[Group 1] Database Migration & Type Contracts');

runTest('Migration SQL exists and adds created_by column and index to contacts table', () => {
  const migPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261029_000002_contacts_creator_and_attribution.sql');
  assert(fs.existsSync(migPath), 'Migration SQL file must exist');
  const sql = fs.readFileSync(migPath, 'utf8');
  assert(sql.includes('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES profiles(id) ON DELETE SET NULL;'), 'Must add created_by column referencing profiles');
  assert(sql.includes('CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);'), 'Must create index on created_by');
});

runTest('Migration SQL contains verified evidence backfill for u4, u0, u2, u1 based on explicit ID lists', () => {
  const migPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261029_000002_contacts_creator_and_attribution.sql');
  const sql = fs.readFileSync(migPath, 'utf8');
  assert(sql.includes("'u4'") && sql.includes("'ct_u4_hl_001'"), 'Must attribute u4 contacts by verified ID list');
  assert(sql.includes("'u0'") && sql.includes("'ct_u0_l_001'"), 'Must attribute u0 contacts by verified ID list');
  assert(sql.includes("'u2'") && sql.includes("'ct_u2_hl_001'"), 'Must attribute u2 contacts by verified ID list');
  assert(sql.includes("'u1'") && sql.includes("'cnt_1'") && sql.includes("'cnt_150'"), 'Must attribute u1 contacts by verified ID list');
  assert(!/WHERE[^\n;]*owner_id/i.test(sql), 'Migration SQL must NEVER use owner_id in WHERE clauses for creator backfill');
});

runTest('Migration SQL safeguards unverified records as NULL and is idempotent without overwriting existing non-NULLs', () => {
  const migPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261029_000002_contacts_creator_and_attribution.sql');
  const sql = fs.readFileSync(migPath, 'utf8');
  // cnt_151 and ct_fahad_zahrani must NOT be in any engineer UPDATE statement
  assert(!/UPDATE contacts[^;]*'cnt_151'/s.test(sql), 'cnt_151 must not be in any UPDATE statement');
  assert(!/UPDATE contacts[^;]*'ct_fahad_zahrani'/s.test(sql), 'ct_fahad_zahrani must not be in any UPDATE statement');
  // Non-overwrite check: must strictly use (created_by IS NULL OR created_by = ...)
  assert(sql.includes("created_by IS NULL OR created_by = 'u4'"), 'Must strictly guard u4 from overwriting different non-null user');
  assert(sql.includes("created_by IS NULL OR created_by = 'u1'"), 'Must strictly guard u1 from overwriting different non-null user');
});

runTest('TypeScript Contact & Company interfaces declare created_by?: string', () => {
  const typeCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'types', 'crm.ts'), 'utf8');
  assert(/interface Contact\s*\{[^}]*created_by\?: string;/s.test(typeCode), 'Contact must have created_by');
  assert(/interface Company\s*\{[^}]*created_by\?: string;/s.test(typeCode), 'Company must have created_by');
});

// -------------------------------------------------------------
// [Group 2] Server-Side Enforcement & Spoof Prevention
// -------------------------------------------------------------
console.log('\n[Group 2] Server-Side Enforcement & Spoof Prevention');

runTest('Server mutation route stamps created_by from authenticated user on company create', () => {
  const mutateCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'crm', 'mutate', 'route.ts'), 'utf8');
  assert(mutateCode.includes("created_by: user.id"), 'Must enforce created_by: user.id on inserts');
  assert(mutateCode.includes("entity === 'companies'") && mutateCode.includes("action === 'insert'"), 'Must handle companies insert');
  assert(mutateCode.includes("created_by: _omitIncomingCb"), 'Must omit client incoming created_by to prevent spoofing');
});

runTest('Server mutation route strips created_by on update to prevent tampering', () => {
  const mutateCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'crm', 'mutate', 'route.ts'), 'utf8');
  assert(mutateCode.includes("created_by: _omitCb"), 'Must omit created_by from payload on updates to prevent tampering');
});

runTest('Server mutation route stamps created_by on contact create with schema fallback', () => {
  const mutateCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'crm', 'mutate', 'route.ts'), 'utf8');
  assert(mutateCode.includes("entity === 'contacts'") && mutateCode.includes("action === 'insert'"), 'Must handle contacts insert');
  assert(mutateCode.includes("created_by: user.id"), 'Must stamp contact creator as user.id');
  assert(mutateCode.includes("created_by: _omitIncomingCb"), 'Must omit client incoming created_by on contacts');
  assert(mutateCode.includes("'created_by' column"), 'Must have graceful fallback if column is not yet migrated in remote Supabase');
});

runTest('Client CRM context stamps created_by in addCompany and addContact', () => {
  const storeCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'store', 'crm-context.tsx'), 'utf8');
  assert(storeCode.includes("created_by: currentUser.id") && storeCode.includes("addCompany"), 'addCompany must stamp created_by');
  assert(storeCode.includes("created_by: currentUser.id") && storeCode.includes("addContact"), 'addContact must stamp created_by');
});

runTest('Excel importer stamps created_by for generated contacts', () => {
  const importerCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'excel', 'excel-importer.ts'), 'utf8');
  assert(importerCode.includes("created_by: targetUserId"), 'excel-importer must stamp created_by on generated contacts');
});

// -------------------------------------------------------------
// [Group 3] Scoped Accounts & Contacts Growth Logic
// -------------------------------------------------------------
console.log('\n[Group 3] Scoped Accounts & Contacts Growth Logic');

// Mock Data
const sampleCompanies = [
  { id: 'c1', name: 'Rawabi Holding', city: 'Khobar', created_by: 'u1', created_at: '2026-10-10T10:00:00Z' },
  { id: 'c2', name: 'Nesma Partners', city: 'Jeddah', created_by: 'u4', created_at: '2026-10-15T10:00:00Z' },
  { id: 'c3_old', name: 'Saudi Binladin', city: 'Mecca', created_by: 'u2', created_at: '2025-05-01T10:00:00Z' },
  { id: 'c_unverified', name: 'Legacy Synthetics', city: 'Riyadh', created_by: undefined, created_at: '2026-10-05T10:00:00Z' }
];

const sampleContacts = [
  // User u1 created for c1
  { id: 'cnt1', full_name: 'Ahmed Fawzy', company_id: 'c1', created_by: 'u1', created_at: '2026-10-10T11:00:00Z' },
  // User u4 created for c2
  { id: 'cnt2', full_name: 'Fahad Al-Ghamdi', company_id: 'c2', created_by: 'u4', created_at: '2026-10-15T12:00:00Z' },
  // User u1 adds a new contact to c3_old (an old company created by u2 in 2025!)
  { id: 'cnt3', full_name: 'Salem Al-Harbi', company_id: 'c3_old', created_by: 'u1', created_at: '2026-10-20T09:00:00Z' },
  // User u4 adds a contact to c3_old in the same period
  { id: 'cnt4', full_name: 'Tariq Noman', company_id: 'c3_old', created_by: 'u4', created_at: '2026-10-22T14:00:00Z' },
  // Outside October period
  { id: 'cnt_old', full_name: 'Old Contact', company_id: 'c1', created_by: 'u1', created_at: '2026-08-01T10:00:00Z' }
];

const periodStart = '2026-10-01';
const periodEnd = '2026-10-31';

function computeAccountsGrowth(userRole, currentUserId, selectedFilter, companies, contacts, pStart, pEnd) {
  const isManager = userRole === 'sales_manager' || userRole === 'admin' || userRole === 'viewer';
  const effectiveSalesUserId = !isManager ? currentUserId : (selectedFilter !== 'all' ? selectedFilter : null);

  const periodNewCompanies = (companies || []).filter(c => {
    const d = (c.created_at || '').split('T')[0];
    const inRange = d >= pStart && d <= pEnd;
    if (!inRange) return false;
    if (effectiveSalesUserId) return c.created_by === effectiveSalesUserId;
    return true;
  });

  const periodNewContacts = (contacts || []).filter(cnt => {
    const d = (cnt.created_at || '').split('T')[0];
    const inRange = d >= pStart && d <= pEnd;
    if (!inRange) return false;
    if (effectiveSalesUserId) return cnt.created_by === effectiveSalesUserId;
    return true;
  });

  const newCompSet = new Set(periodNewCompanies.map(c => c.id));
  const contactsByCompId = {};

  periodNewContacts.forEach(cnt => {
    const cId = cnt.company_id || 'unknown';
    if (!contactsByCompId[cId]) contactsByCompId[cId] = [];
    contactsByCompId[cId].push(cnt);
  });

  const relevantCompIds = new Set([
    ...periodNewCompanies.map(c => c.id),
    ...Object.keys(contactsByCompId).filter(id => id !== 'unknown')
  ]);

  const companiesWithNewContacts = Array.from(relevantCompIds).map(cId => {
    const comp = (companies || []).find(c => c.id === cId);
    const isNewCompany = newCompSet.has(cId);
    const cNewContacts = contactsByCompId[cId] || [];

    return {
      companyId: cId,
      companyName: comp ? comp.name : 'Unknown',
      city: comp ? comp.city : '-',
      isNewCompany,
      newContacts: cNewContacts.map(cnt => ({
        id: cnt.id,
        fullName: cnt.full_name
      }))
    };
  });

  return {
    periodNewCompanies,
    periodNewContacts,
    companiesWithNewContacts,
    newCompaniesCount: periodNewCompanies.length,
    newContactsCount: periodNewContacts.length,
    activeAccountsCount: companiesWithNewContacts.length
  };
}

runTest('Sales Engineer u1 sees only their created companies and contacts', () => {
  const result = computeAccountsGrowth('sales_engineer', 'u1', 'all', sampleCompanies, sampleContacts, periodStart, periodEnd);
  
  // u1 created c1 in October
  assert.strictEqual(result.newCompaniesCount, 1, 'u1 should only have 1 new company (c1)');
  assert.strictEqual(result.periodNewCompanies[0].id, 'c1');

  // u1 created cnt1 (for c1) and cnt3 (for c3_old) in October
  assert.strictEqual(result.newContactsCount, 2, 'u1 should have 2 new contacts (cnt1, cnt3)');
  const contactIds = result.periodNewContacts.map(c => c.id);
  assert(contactIds.includes('cnt1') && contactIds.includes('cnt3'));
  assert(!contactIds.includes('cnt2'), 'Must not include u4 contact cnt2');
  assert(!contactIds.includes('cnt_old'), 'Must not include out of period contact');
});

runTest('Existing company with new contact is marked isNewCompany: false ("توسع حساب قائم")', () => {
  const result = computeAccountsGrowth('sales_engineer', 'u1', 'all', sampleCompanies, sampleContacts, periodStart, periodEnd);
  
  const c3Card = result.companiesWithNewContacts.find(c => c.companyId === 'c3_old');
  assert(c3Card, 'c3_old must appear in accounts growth because u1 added a contact to it');
  assert.strictEqual(c3Card.isNewCompany, false, 'c3_old must have isNewCompany: false because it was not created by u1 in this period');
  
  // Inside c3_old card, ONLY u1 contact (cnt3) is shown, NOT u4 contact (cnt4)
  assert.strictEqual(c3Card.newContacts.length, 1, 'c3_old card must contain only 1 contact for u1');
  assert.strictEqual(c3Card.newContacts[0].id, 'cnt3', 'Must be cnt3 added by u1');
});

runTest('Adding a contact to an existing company does NOT increment newCompaniesCount', () => {
  const result = computeAccountsGrowth('sales_engineer', 'u1', 'all', sampleCompanies, sampleContacts, periodStart, periodEnd);
  // c1 is new (1), c3_old is expanded (0) -> total newCompaniesCount = 1
  assert.strictEqual(result.newCompaniesCount, 1, 'newCompaniesCount must strictly remain 1');
  assert.strictEqual(result.activeAccountsCount, 2, 'Total active accounts shown in cards is 2 (c1 new + c3_old expanded)');
});

runTest('Sales Engineer u4 sees only their own growth and their own contacts in c3_old', () => {
  const result = computeAccountsGrowth('sales_engineer', 'u4', 'all', sampleCompanies, sampleContacts, periodStart, periodEnd);
  assert.strictEqual(result.newCompaniesCount, 1, 'u4 created 1 new company (c2)');
  assert.strictEqual(result.newContactsCount, 2, 'u4 created 2 contacts (cnt2, cnt4)');

  const c3Card = result.companiesWithNewContacts.find(c => c.companyId === 'c3_old');
  assert(c3Card, 'c3_old must appear for u4');
  assert.strictEqual(c3Card.isNewCompany, false);
  assert.strictEqual(c3Card.newContacts.length, 1);
  assert.strictEqual(c3Card.newContacts[0].id, 'cnt4', 'u4 must only see cnt4, not cnt3');
});

runTest('Sales Manager selecting "all" sees all team growth aggregated', () => {
  const result = computeAccountsGrowth('sales_manager', 'mgr1', 'all', sampleCompanies, sampleContacts, periodStart, periodEnd);
  // c1 (u1) and c2 (u4) in October (c_unverified also matches if date matches and unassigned)
  assert(result.newCompaniesCount >= 2, 'Manager sees all team companies');
  assert.strictEqual(result.newContactsCount, 4, 'Manager sees cnt1, cnt2, cnt3, cnt4');

  const c3Card = result.companiesWithNewContacts.find(c => c.companyId === 'c3_old');
  assert.strictEqual(c3Card.newContacts.length, 2, 'Manager sees both cnt3 and cnt4 under c3_old');
});

runTest('Sales Manager filtering by specific engineer scopes strictly to that engineer', () => {
  const result = computeAccountsGrowth('sales_manager', 'mgr1', 'u4', sampleCompanies, sampleContacts, periodStart, periodEnd);
  assert.strictEqual(result.newCompaniesCount, 1, 'Scoped to u4 -> 1 new company (c2)');
  assert.strictEqual(result.newContactsCount, 2, 'Scoped to u4 -> 2 contacts (cnt2, cnt4)');
});

runTest('Unverified legacy records are NOT falsely attributed to u1 when u1 is filtered', () => {
  const result = computeAccountsGrowth('sales_engineer', 'u1', 'all', sampleCompanies, sampleContacts, periodStart, periodEnd);
  const unverifiedCard = result.companiesWithNewContacts.find(c => c.companyId === 'c_unverified');
  assert.strictEqual(unverifiedCard, undefined, 'c_unverified (created_by: undefined) must never be attributed to u1');
});

// -------------------------------------------------------------
// [Group 4] Web Reports & PDF Contract Alignment
// -------------------------------------------------------------
console.log('\n[Group 4] Web Reports & PDF Contract Alignment');

runTest('src/app/reports/page.tsx implements effectiveSalesUserId and scopeQuotations', () => {
  const pageCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'reports', 'page.tsx'), 'utf8');
  assert(pageCode.includes("const effectiveSalesUserId = useMemo"), 'Must define effectiveSalesUserId');
  assert(pageCode.includes("c.created_by === effectiveSalesUserId"), 'periodNewCompanies must check c.created_by === effectiveSalesUserId');
  assert(pageCode.includes("cnt.created_by === effectiveSalesUserId"), 'periodNewContacts must check cnt.created_by === effectiveSalesUserId');
  assert(pageCode.includes("scopeQuotations(quotations"), 'Must scope quotations properly');
});

runTest('ReportPdfModal renders newCompaniesCount, newContactsCount, and isNewCompany tag', () => {
  const pdfCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'reports', 'report-pdf-modal.tsx'), 'utf8');
  assert(pdfCode.includes("salesData.accountsGrowth.newCompaniesCount"), 'PDF must display newCompaniesCount');
  assert(pdfCode.includes("salesData.accountsGrowth.newContactsCount"), 'PDF must display newContactsCount');
  assert(pdfCode.includes("item.isNewCompany"), 'PDF must check item.isNewCompany for tag display');
  assert(pdfCode.includes("توسيع عميل حالي") || pdfCode.includes("Expanded Account"), 'PDF must display Expanded Account tag');
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n----------------------------------------------------------------');
console.log(`Phase 7 Tests Summary: ${passedTests} Passed, ${failedTests} Failed`);
console.log('----------------------------------------------------------------\n');

if (failedTests > 0) {
  process.exit(1);
}
