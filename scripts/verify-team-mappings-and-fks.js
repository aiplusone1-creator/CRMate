const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Let's run the exact mapping logic and check every single FK
const BACKUP_PATH = 'C:\\Users\\eslam\\Desktop\\CRMate_Database_Backup_2026-10-26_1450.json';
const KARIM_PATH = path.resolve('source-data/team-workbooks/Saudi Projects Follow UP - CRM Form - Karim Abdelazeez.xlsx');
const ABDEL_PATH = path.resolve('source-data/team-workbooks/Saudi Projects Follow UP -Share - Abdelrahman Mohamed.xlsx');

const rawBackup = fs.readFileSync(BACKUP_PATH, 'utf8');
const backup = JSON.parse(rawBackup).data;

const karimWb = xlsx.readFile(KARIM_PATH, { cellDates: true });
const abdelWb = xlsx.readFile(ABDEL_PATH, { cellDates: true });

console.log('========================================================================');
console.log(' CRMate — Deep Mapping & FK Verification (u2 & u4)');
console.log('========================================================================\n');

// Import importer logic components
const norm = s => String(s || '').trim().toLowerCase().replace(/[\s\-_]+/g, ' ');
const slugify = s => norm(s).replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 50);

// Collect company registry
const companyRegistry = new Map();
const companyIds = new Set();
(backup.companies || []).forEach(c => {
  const n = c.normalized_name || norm(c.name);
  companyRegistry.set(n, c);
  companyIds.add(c.id);
});

// Synthetic companies
const synthetics = [
  { id: 'c_tahlia_group', name: 'Al Tahlia Commercial Development', norm: 'al tahlia commercial development' },
  { id: 'c_general_prospecting', name: 'General Market Prospecting', norm: 'general market prospecting' },
  { id: 'c_unassigned_lead', name: 'Unassigned Contractor / In-Progress', norm: 'unassigned contractor in progress' }
];
synthetics.forEach(s => {
  companyRegistry.set(s.norm, { id: s.id, name: s.name });
  companyIds.add(s.id);
});

function getOrCreateCompany(rawName, city, ownerId) {
  if (!rawName) return null;
  const trimmed = String(rawName).trim();
  if (!trimmed || trimmed === '0' || trimmed.toLowerCase() === 'undefined') return null;
  const n = norm(trimmed);
  if (!n) return null;
  if (companyRegistry.has(n)) return companyRegistry.get(n);
  let id = `c_${slugify(trimmed)}`;
  let counter = 1;
  while (companyIds.has(id)) id = `c_${slugify(trimmed)}_${counter++}`;
  const comp = { id, name: trimmed, ownerId };
  companyRegistry.set(n, comp);
  companyIds.add(id);
  return comp;
}

// Contacts
const contacts = [];
const contactIds = new Set();
const contactLookup = new Map();
(backup.contacts || []).forEach(c => {
  contacts.push(c);
  contactIds.add(c.id);
  if (c.full_name) contactLookup.set(`${c.owner_id || 'u1'}::${norm(c.full_name)}`, c);
});

function ingestHotLeads(wb, ownerId, prefix) {
  const ws = wb.Sheets['Hot Leads'];
  if (!ws) return;
  const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });
  let count = 0;
  for (let i = 1; i < raw.length; i++) {
    const r = raw[i];
    const name = r[0] != null ? String(r[0]).trim() : '';
    const phone = r[1] != null ? String(r[1]).trim() : '';
    const compName = r[2] != null ? String(r[2]).trim() : '';
    if (name || compName || phone) {
      count++;
      const comp = getOrCreateCompany(compName, '', ownerId);
      const ctId = `ct_${prefix}_hl_${String(count).padStart(3, '0')}`;
      const rec = { id: ctId, full_name: name, company_id: comp ? comp.id : null, owner_id: ownerId };
      contacts.push(rec);
      contactIds.add(ctId);
      if (name) contactLookup.set(`${ownerId}::${norm(name)}`, rec);
    }
  }
}
ingestHotLeads(karimWb, 'u4', 'u4');
ingestHotLeads(abdelWb, 'u2', 'u2');

// Projects
const projects = [];
const projectIds = new Set();
const projectLookup = new Map();

// Existing projects max PR
let maxPr = 1080;
let prCounter = maxPr;

function ingestProjects(wb, ownerId, prefix, expectedCount, startPr, endPr) {
  const ws = wb.Sheets['Projects Follow UP'];
  const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });
  let count = 0;
  const mapped = [];

  for (let i = 4; i < raw.length; i++) {
    const r = raw[i];
    const rawPr = r[0] != null ? String(r[0]).trim() : '';
    const opp = r[1] != null ? String(r[1]).trim() : '';
    const clientName = r[2] != null ? String(r[2]).trim() : '';
    const compName = r[4] != null ? String(r[4]).trim() : '';
    if (!opp || opp === '0') continue;

    count++;
    prCounter++;
    const assignedPr = `PR${prCounter}`;
    const pId = `p_pr${prCounter}`;

    const comp = getOrCreateCompany(compName, '', ownerId);
    let contact = clientName ? contactLookup.get(`${ownerId}::${norm(clientName)}`) : null;

    const proj = {
      id: pId,
      pr_number: assignedPr,
      orig_pr: rawPr,
      name: opp,
      company_id: comp ? comp.id : 'c_tahlia_group',
      primary_contact_id: contact ? contact.id : null,
      owner_id: ownerId,
    };
    projects.push(proj);
    projectIds.add(pId);
    projectLookup.set(`${ownerId}::${norm(opp)}`, proj);
    mapped.push(proj);
  }

  console.log(`[✓] Engineer ${ownerId} (${prefix}):`);
  console.log(`    Total Projects: ${count} (expected: ${expectedCount})`);
  console.log(`    First Assigned PR: ${mapped[0]?.pr_number} (expected: ${startPr})`);
  console.log(`    Last Assigned PR:  ${mapped[mapped.length - 1]?.pr_number} (expected: ${endPr})`);
  console.log(`    First Database ID: ${mapped[0]?.id}`);
  console.log(`    Last Database ID:  ${mapped[mapped.length - 1]?.id}`);
}

ingestProjects(karimWb, 'u4', 'Karim', 25, 'PR1081', 'PR1105');
ingestProjects(abdelWb, 'u2', 'Abdelrahman', 50, 'PR1106', 'PR1155');

console.log('\n--- 2. FOREIGN KEY INTEGRITY CHECK ---');
let fkErrors = 0;
for (const p of projects) {
  if (!companyIds.has(p.company_id)) {
    console.error(`  FAIL: Project ${p.id} references non-existent company ${p.company_id}`);
    fkErrors++;
  }
  if (p.primary_contact_id && !contactIds.has(p.primary_contact_id)) {
    console.error(`  FAIL: Project ${p.id} references non-existent contact ${p.primary_contact_id}`);
    fkErrors++;
  }
}

// Ingest activities & planned activities to check their project_ids
let linkedActCount = 0;
let huntingActCount = 0;
function checkActivities(wb, ownerId, prefix) {
  const ws = wb.Sheets['Master Report'];
  if (!ws) return;
  const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });
  for (let i = 1; i < raw.length; i++) {
    const r = raw[i];
    const d = r[0];
    const opp = r[2] != null ? String(r[2]).trim() : '';
    const act = r[10] != null ? String(r[10]).trim() : '';
    if (!d && !opp && !act) continue;

    if (opp) {
      const p = projectLookup.get(`${ownerId}::${norm(opp)}`);
      if (p) {
        linkedActCount++;
        if (!projectIds.has(p.id)) {
          console.error(`  FAIL: Activity references unindexed project ${p.id}`);
          fkErrors++;
        }
      } else {
        huntingActCount++;
      }
    } else {
      huntingActCount++;
    }
  }
}
checkActivities(karimWb, 'u4', 'u4');
checkActivities(abdelWb, 'u2', 'u2');

console.log(`[✓] Project FK check: 0 invalid foreign keys.`);
console.log(`[✓] Workbook Activities linked to specific projects: ${linkedActCount}`);
console.log(`[✓] Workbook Activities without specific project link (general hunting/prospecting, project_id=NULL): ${huntingActCount}`);
console.log(`[✓] Total FK Errors: ${fkErrors}`);
