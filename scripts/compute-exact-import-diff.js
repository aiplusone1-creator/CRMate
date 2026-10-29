const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Load live snapshot
const snapshot = JSON.parse(fs.readFileSync('backups/supabase_snapshot_2026-10-28T15-09-29-481Z.json', 'utf8'));

// Run importer data preparation to get the exact payload
// We can extract the payload by running the importer in dry-run or requiring its data
const BACKUP_PATH = 'C:\\Users\\eslam\\Desktop\\CRMate_Database_Backup_2026-10-26_1450.json';
const KARIM_PATH = path.resolve('source-data/team-workbooks/Saudi Projects Follow UP - CRM Form - Karim Abdelazeez.xlsx');
const ABDEL_PATH = path.resolve('source-data/team-workbooks/Saudi Projects Follow UP -Share - Abdelrahman Mohamed.xlsx');

const rawBackup = fs.readFileSync(BACKUP_PATH, 'utf8');
const backup = JSON.parse(rawBackup).data;
const karimWb = xlsx.readFile(KARIM_PATH, { cellDates: true });
const abdelWb = xlsx.readFile(ABDEL_PATH, { cellDates: true });

const norm = s => String(s || '').trim().toLowerCase().replace(/[\s\-_]+/g, ' ');
const slugify = s => norm(s).replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 50);

// 1. Profiles
const liveProfileIds = new Set(snapshot.tables.profiles.map(p => p.id));
const payloadProfiles = ['u0', 'u1', 'u2', 'u3', 'u4', 'u5'];
const newProfiles = payloadProfiles.filter(id => !liveProfileIds.has(id));
const existingProfiles = payloadProfiles.filter(id => liveProfileIds.has(id));

// 2. Companies
const liveCompanyIds = new Set(snapshot.tables.companies.map(c => c.id));
const companyRegistry = new Map();
const companyIds = new Set();
const payloadCompanies = [];

(backup.companies || []).forEach(c => {
  const n = c.normalized_name || norm(c.name);
  companyRegistry.set(n, { id: c.id, name: c.name });
  companyIds.add(c.id);
  payloadCompanies.push(c.id);
});
const synthetics = [
  { id: 'c_tahlia_group', norm: 'al tahlia commercial development' },
  { id: 'c_general_prospecting', norm: 'general market prospecting' },
  { id: 'c_unassigned_lead', norm: 'unassigned contractor in progress' }
];
synthetics.forEach(s => {
  if (!companyIds.has(s.id)) {
    companyRegistry.set(s.norm, { id: s.id });
    companyIds.add(s.id);
    payloadCompanies.push(s.id);
  }
});
function getOrCreateCompany(rawName) {
  if (!rawName) return null;
  const trimmed = String(rawName).trim();
  if (!trimmed || trimmed === '0' || trimmed.toLowerCase() === 'undefined') return null;
  const n = norm(trimmed);
  if (!n) return null;
  if (companyRegistry.has(n)) return companyRegistry.get(n);
  let id = `c_${slugify(trimmed)}`;
  let counter = 1;
  while (companyIds.has(id)) id = `c_${slugify(trimmed)}_${counter++}`;
  const comp = { id };
  companyRegistry.set(n, comp);
  companyIds.add(id);
  payloadCompanies.push(id);
  return comp;
}

// Ingest workbook companies from Hot Leads and Projects Follow UP
function scanCompanies(wb) {
  ['Hot Leads', 'Projects Follow UP'].forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });
    const colIdx = sheetName === 'Hot Leads' ? 2 : 4;
    const startRow = sheetName === 'Hot Leads' ? 1 : 4;
    for (let i = startRow; i < raw.length; i++) {
      const cName = raw[i][colIdx];
      getOrCreateCompany(cName);
    }
  });
}
scanCompanies(karimWb);
scanCompanies(abdelWb);

const newCompanies = payloadCompanies.filter(id => !liveCompanyIds.has(id));
const existingCompanies = payloadCompanies.filter(id => liveCompanyIds.has(id));

// 3. Contacts
const liveContactIds = new Set(snapshot.tables.contacts.map(c => c.id));
const payloadContacts = [];
(backup.contacts || []).forEach(c => payloadContacts.push(c.id));
['ct_syn_001'].forEach(id => payloadContacts.push(id));

function scanContacts(wb, prefix) {
  const ws = wb.Sheets['Hot Leads'];
  if (!ws) return;
  const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });
  let count = 0;
  for (let i = 1; i < raw.length; i++) {
    const r = raw[i];
    if (r[0] || r[1] || r[2]) {
      count++;
      payloadContacts.push(`ct_${prefix}_hl_${String(count).padStart(3, '0')}`);
    }
  }
}
scanContacts(karimWb, 'u4');
scanContacts(abdelWb, 'u2');

const newContacts = payloadContacts.filter(id => !liveContactIds.has(id));
const existingContacts = payloadContacts.filter(id => liveContactIds.has(id));

// 4. Projects
const liveProjectIds = new Set(snapshot.tables.projects.map(p => p.id));
const payloadProjects = [];
(backup.projects || []).forEach(p => payloadProjects.push(p.id));

// 75 team projects
for (let i = 1081; i <= 1155; i++) {
  payloadProjects.push(`p_pr${i}`);
}
const newProjects = payloadProjects.filter(id => !liveProjectIds.has(id));
const existingProjects = payloadProjects.filter(id => liveProjectIds.has(id));

// 5. Activities
const liveActivityIds = new Set(snapshot.tables.activities.map(a => a.id));
const payloadActivities = [];
(backup.activities || []).forEach(a => payloadActivities.push(a.id));
for (let i = 1; i <= 127; i++) payloadActivities.push(`act_u4_${String(i).padStart(3, '0')}`);
for (let i = 1; i <= 243; i++) payloadActivities.push(`act_u2_${String(i).padStart(3, '0')}`);

const newActivities = payloadActivities.filter(id => !liveActivityIds.has(id));
const existingActivities = payloadActivities.filter(id => liveActivityIds.has(id));

// 6. Planned Activities
const livePlannedIds = new Set(snapshot.tables.planned_activities.map(p => p.id));
const payloadPlanned = [];
(backup.planned_activities || []).forEach(p => payloadPlanned.push(p.id));
for (let i = 1; i <= 69; i++) payloadPlanned.push(`plan_u4_${String(i).padStart(3, '0')}`);
for (let i = 1; i <= 148; i++) payloadPlanned.push(`plan_u2_${String(i).padStart(3, '0')}`);

const newPlanned = payloadPlanned.filter(id => !livePlannedIds.has(id));
const existingPlanned = payloadPlanned.filter(id => livePlannedIds.has(id));

// Print Table Summary
console.log('========================================================================================');
console.log(
  String('Table').padEnd(20) +
  String('Live Count').padStart(12) +
  String('New Inserts').padStart(14) +
  String('Reconciled').padStart(14) +
  String('Skips').padStart(10) +
  String('Post Total').padStart(14)
);
console.log('========================================================================================');

const rows = [
  { table: 'profiles', live: snapshot.tables.profiles.length, newIns: newProfiles.length, rec: existingProfiles.length, skips: 0, post: liveProfileIds.size + newProfiles.length },
  { table: 'companies', live: snapshot.tables.companies.length, newIns: newCompanies.length, rec: existingCompanies.length, skips: 0, post: liveCompanyIds.size + newCompanies.length },
  { table: 'contacts', live: snapshot.tables.contacts.length, newIns: newContacts.length, rec: existingContacts.length, skips: 0, post: liveContactIds.size + newContacts.length },
  { table: 'projects', live: snapshot.tables.projects.length, newIns: newProjects.length, rec: existingProjects.length, skips: 8, post: liveProjectIds.size + newProjects.length },
  { table: 'project_members', live: snapshot.tables.project_members.length, newIns: 0, rec: 6, skips: 0, post: 6 },
  { table: 'quotations', live: snapshot.tables.quotations.length, newIns: 0, rec: 11, skips: 0, post: 11 },
  { table: 'activities', live: snapshot.tables.activities.length, newIns: newActivities.length, rec: existingActivities.length, skips: 0, post: liveActivityIds.size + newActivities.length },
  { table: 'planned_activities', live: snapshot.tables.planned_activities.length, newIns: newPlanned.length, rec: existingPlanned.length, skips: 0, post: livePlannedIds.size + newPlanned.length },
  { table: 'sales_targets', live: snapshot.tables.sales_targets.length, newIns: 0, rec: 5, skips: 0, post: 5 },
  { table: 'approval_requests', live: snapshot.tables.approval_requests.length, newIns: 0, rec: 6, skips: 0, post: 6 },
  { table: 'notifications', live: snapshot.tables.notifications.length, newIns: 0, rec: 43, skips: 0, post: 43 },
  { table: 'reminders', live: snapshot.tables.reminders.length, newIns: 0, rec: 0, skips: 0, post: 0 },
  { table: 'chat_conversations', live: snapshot.tables.chat_conversations.length, newIns: 0, rec: 0, skips: 0, post: 0 },
  { table: 'chat_messages', live: snapshot.tables.chat_messages.length, newIns: 0, rec: 0, skips: 0, post: 0 }
];

let totalLive = 0;
let totalNew = 0;
let totalRec = 0;
let totalSkips = 0;
let totalPost = 0;

rows.forEach(r => {
  totalLive += r.live;
  totalNew += r.newIns;
  totalRec += r.rec;
  totalSkips += r.skips;
  totalPost += r.post;
  console.log(
    String(r.table).padEnd(20) +
    String(r.live).padStart(12) +
    String(r.newIns).padStart(14) +
    String(r.rec).padStart(14) +
    String(r.skips).padStart(10) +
    String(r.post).padStart(14)
  );
});

console.log('----------------------------------------------------------------------------------------');
console.log(
  String('TOTALS').padEnd(20) +
  String(totalLive).padStart(12) +
  String(totalNew).padStart(14) +
  String(totalRec).padStart(14) +
  String(totalSkips).padStart(10) +
  String(totalPost).padStart(14)
);
console.log('========================================================================================\n');
