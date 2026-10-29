const fs = require('fs');
const path = require('path');
const assert = require('assert');

const snapshotPath = path.resolve('backups/supabase_snapshot_2026-10-28T15-09-29-481Z.json');
const raw = fs.readFileSync(snapshotPath, 'utf8');
const data = JSON.parse(raw);

const expectedTables = [
  'profiles',
  'companies',
  'contacts',
  'projects',
  'project_members',
  'quotations',
  'activities',
  'planned_activities',
  'sales_targets',
  'approval_requests',
  'notifications',
  'reminders',
  'chat_conversations',
  'chat_messages'
];

console.log('--- 1. EXPECTED TABLES & ROW COUNTS ---');
let totalRows = 0;
for (const table of expectedTables) {
  assert.ok(table in data.tables, `Table ${table} missing from data.tables`);
  assert.ok(table in data.metadata.tables, `Table ${table} missing from metadata`);
  const rows = data.tables[table];
  const metaCount = data.metadata.tables[table];
  assert.strictEqual(rows.length, metaCount, `Mismatch in table ${table}: rows=${rows.length}, meta=${metaCount}`);
  totalRows += rows.length;
  console.log(`  ✓ Table '${table}': ${rows.length} rows (meta: ${metaCount})`);
}
console.log(`Total Rows in Snapshot: ${totalRows}`);

console.log('\n--- 2. RELATIONSHIP RECONSTRUCTION CHECK ---');
// Check projects -> companies
const companyIds = new Set(data.tables.companies.map(c => c.id));
const orphanProjectCompanies = data.tables.projects.filter(p => p.company_id && !companyIds.has(p.company_id));
console.log(`  Projects with valid company_id: ${data.tables.projects.length - orphanProjectCompanies.length}/${data.tables.projects.length}`);
assert.strictEqual(orphanProjectCompanies.length, 0, 'Found orphan projects referencing non-existent companies');

// Check contacts -> companies
const orphanContactCompanies = data.tables.contacts.filter(c => c.company_id && !companyIds.has(c.company_id));
console.log(`  Contacts with valid company_id: ${data.tables.contacts.length - orphanContactCompanies.length}/${data.tables.contacts.length}`);
assert.strictEqual(orphanContactCompanies.length, 0, 'Found orphan contacts referencing non-existent companies');

// Check quotations -> projects
const projectIds = new Set(data.tables.projects.map(p => p.id));
const orphanQuotations = data.tables.quotations.filter(q => q.project_id && !projectIds.has(q.project_id));
console.log(`  Quotations with valid project_id: ${data.tables.quotations.length - orphanQuotations.length}/${data.tables.quotations.length}`);
assert.strictEqual(orphanQuotations.length, 0, 'Found orphan quotations referencing non-existent projects');

// Check activities -> projects (when project_id is present)
const orphanActivities = data.tables.activities.filter(a => a.project_id && !projectIds.has(a.project_id));
console.log(`  Activities with valid project_id (when non-null): ${data.tables.activities.filter(a => a.project_id).length - orphanActivities.length}/${data.tables.activities.filter(a => a.project_id).length}`);
assert.strictEqual(orphanActivities.length, 0, 'Found orphan activities referencing non-existent projects');

// Check planned_activities -> projects (when project_id is present)
const orphanPlanned = data.tables.planned_activities.filter(a => a.project_id && !projectIds.has(a.project_id));
console.log(`  Planned activities with valid project_id (when non-null): ${data.tables.planned_activities.filter(a => a.project_id).length - orphanPlanned.length}/${data.tables.planned_activities.filter(a => a.project_id).length}`);
assert.strictEqual(orphanPlanned.length, 0, 'Found orphan planned activities referencing non-existent projects');

// Check project_members -> projects & profiles
const profileIds = new Set(data.tables.profiles.map(p => p.id));
const orphanMembers = data.tables.project_members.filter(m => !projectIds.has(m.project_id) || !profileIds.has(m.user_id));
console.log(`  Project members with valid FKs: ${data.tables.project_members.length - orphanMembers.length}/${data.tables.project_members.length}`);
assert.strictEqual(orphanMembers.length, 0, 'Found orphan project members');

console.log('\n[SUCCESS] Snapshot structure and relationship reconstruction verified 100%!');
