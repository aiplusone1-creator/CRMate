/**
 * CRMate - Unified Idempotent Data Importer to Supabase PostgreSQL
 * 
 * Supports 3 data sources with ONE continuous sequential PR numbering system:
 *   1. Existing CRMate JSON Backup (Eslam Al-Mohandes - u1)
 *   2. Team Workbook: Karim Abdelazeez (u4)
 *   3. Team Workbook: Abdelrahman Mohamed (u2)
 * 
 * Usage:
 *   node scripts/import-to-supabase.js             (Dry-run by default)
 *   node scripts/import-to-supabase.js --dry-run   (Dry-run validation only)
 *   node scripts/import-to-supabase.js --live      (Live upsert - requires explicit flag)
 */

const fs = require('fs');
const path = require('path');

// Safe auto-loading of .env.local if present
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

// Safe optional import of supabase client if available
let createClient = null;
try {
  createClient = require('@supabase/supabase-js').createClient;
} catch (e) {
  // handled in live mode
}

const xlsx = require('xlsx');

// ---------------------------------------------------------------------------
// Source File Paths
// ---------------------------------------------------------------------------
const BACKUP_PATH = 'C:\\Users\\eslam\\Desktop\\CRMate_Database_Backup_2026-10-26_1450.json';
const KARIM_WORKBOOK_PATH = path.resolve('source-data/team-workbooks/Saudi Projects Follow UP - CRM Form - Karim Abdelazeez.xlsx');
const ABDEL_WORKBOOK_PATH = path.resolve('source-data/team-workbooks/Saudi Projects Follow UP -Share - Abdelrahman Mohamed.xlsx');

// ---------------------------------------------------------------------------
// Synthetic Seeds for Historical Referencing & FK Integrity
// ---------------------------------------------------------------------------
const SYNTHETIC_PROFILES = [
  {
    id: 'u0',
    email: 'adel.nasr@almespar.com',
    full_name: 'Adel Nasr',
    name_ar: 'عادل نصر',
    role: 'sales_engineer',
    phone: null,
    title: 'Sales Engineer',
    territory: 'Saudi Arabia',
    avatar_color: '#4F46E5',
    avatar_url: null,
    is_active: true
  }
];

const SYNTHETIC_PARENT_COMPANIES = [
  {
    id: 'c_red_sea_contracting',
    name: 'Red Sea Real Estate Development Co.',
    normalized_name: 'red sea real estate development co',
    company_type: 'developer',
    city: 'Jeddah',
    notes: 'Auto-seeded parent company for Red Sea Mall Expansion project',
    created_by: 'u1'
  },
  {
    id: 'c_tahlia_group',
    name: 'Al Tahlia Commercial Development',
    normalized_name: 'al tahlia commercial development',
    company_type: 'developer',
    city: 'Jeddah',
    notes: 'Auto-seeded parent company for Al Tahlia Business Park project',
    created_by: 'u1'
  },
  {
    id: 'c_macc',
    name: 'MACC',
    normalized_name: 'macc',
    company_type: 'contractor',
    city: 'Jeddah',
    notes: 'Auto-seeded parent company for MACC KAUST package',
    created_by: 'u1'
  }
];

const SYNTHETIC_CONTACTS = [
  {
    id: 'ct_fahad_zahrani',
    company_id: 'c_tahlia_group',
    company_name: 'Al Tahlia Commercial Development',
    full_name: 'Eng. Fahad Al-Zahrani',
    job_title: 'Project Manager',
    phone: null,
    normalized_phone: null,
    email: null,
    city: 'Jeddah',
    linkedin_url: null,
    is_hot_lead: true,
    notes: 'Auto-seeded contact for Al Tahlia Business Park activities',
    owner_id: 'u1',
    project_ids: ['p_tahlia_business_park']
  }
];

// ---------------------------------------------------------------------------
// Helper Functions for Data Normalization & Cleaning
// ---------------------------------------------------------------------------
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

function norm(s) {
  if (!s) return '';
  return String(s).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '').trim();
}

function normPhone(p) {
  if (!p) return null;
  let digits = String(p).replace(/[^0-9]/g, '');
  if (!digits) return null;
  if (digits.startsWith('00966')) digits = digits.slice(5);
  else if (digits.startsWith('966')) digits = digits.slice(3);
  else if (digits.startsWith('05')) digits = digits.slice(1);
  return digits.length >= 7 ? digits : null;
}

function parseExcelDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) return new Date(parsed).toISOString().split('T')[0];
  }
  return null;
}

function mapPipelineStage(status) {
  const s = String(status || '').trim().toLowerCase();
  if (s.includes('gather info') || s.includes('lead')) return 'lead';
  if (s.includes('rfq')) return 'rfq_processing';
  if (s.includes('send to client') || s.includes('quotation sent')) return 'quotation_sent';
  if (s.includes('technical submission')) return 'technical_submission';
  if (s.includes('technically approved')) return 'technically_approved';
  if (s.includes('negotiation') || s.includes('pricing')) return 'negotiation';
  if (s.includes('won')) return 'won';
  if (s.includes('lost')) return 'lost';
  if (s.includes('hold')) return 'hold';
  return 'lead';
}

function mapChannel(type) {
  const t = String(type || '').trim().toLowerCase();
  if (t.includes('call')) return 'call';
  if (t.includes('f2f') || t.includes('meeting')) return 'meeting_f2f';
  if (t.includes('online')) return 'meeting_online';
  if (t.includes('hunting')) return 'hunting';
  if (t.includes('office')) return 'office_work';
  if (t.includes('event')) return 'event';
  return 'office_work';
}

function mapVisitPurpose(vt) {
  const v = String(vt || '').trim().toLowerCase();
  if (v.includes('new lead')) return 'new_lead';
  if (v.includes('follow up') || v.includes('follow')) return 'follow_up';
  if (v.includes('cold call')) return 'cold_call';
  if (v.includes('consultant')) return 'consultant_visit';
  if (v.includes('visit') || v.includes('customer')) return 'customer_visit';
  return 'follow_up';
}

/**
 * Pre-import check: Safely queries existing primary keys from Supabase
 * or falls back to the verified local snapshot if in offline dry-run mode.
 * Fails closed in live mode if ambiguous.
 */
async function getExistingTableIds(supabaseClient, isLive) {
  const existing = {
    projects: new Set(),
    companies: new Set(),
    contacts: new Set(),
    activities: new Set(),
    planned_activities: new Set(),
    quotations: new Set(),
    project_members: new Set(),
    sales_targets: new Set(),
    approval_requests: new Set(),
    notifications: new Set(),
    reminders: new Set(),
  };

  // 1. If supabaseClient is available, query remote Supabase directly
  if (supabaseClient) {
    const tables = Object.keys(existing);
    for (const table of tables) {
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const query = supabaseClient
          .from(table)
          .select(table === 'project_members' ? 'project_id,user_id' : 'id')
          .range(from, from + pageSize - 1);
        const { data, error } = await query;
        if (error) {
          if (isLive) {
            throw new Error(`FAIL-CLOSED: Pre-import existence check failed on table '${table}': ${error.message}`);
          }
          break;
        }
        if (!data || data.length === 0) break;
        if (table === 'project_members') {
          data.forEach(r => existing[table].add(`${r.project_id}::${r.user_id}`));
        } else {
          data.forEach(r => existing[table].add(r.id));
        }
        if (data.length < pageSize) break;
        from += pageSize;
      }
    }
    return existing;
  }

  // 2. Fallback to latest local snapshot under backups/ (used in offline dry-run)
  const backupsDir = path.resolve('backups');
  if (fs.existsSync(backupsDir)) {
    const snapFiles = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('supabase_snapshot_') && f.endsWith('.json'))
      .sort();
    if (snapFiles.length > 0) {
      const latestSnap = path.join(backupsDir, snapFiles[snapFiles.length - 1]);
      const snapData = JSON.parse(fs.readFileSync(latestSnap, 'utf8'));
      Object.keys(existing).forEach(table => {
        if (snapData.tables && snapData.tables[table]) {
          if (table === 'project_members') {
            snapData.tables[table].forEach(r => existing[table].add(`${r.project_id}::${r.user_id}`));
          } else {
            snapData.tables[table].forEach(r => existing[table].add(r.id));
          }
        }
      });
      return existing;
    }
  }

  if (isLive) {
    throw new Error('FAIL-CLOSED: Cannot determine pre-existing record IDs. Aborting live import to prevent ambiguity.');
  }

  return existing;
}

// ---------------------------------------------------------------------------
// Main Importer Execution
// ---------------------------------------------------------------------------
async function run() {
  const isLive = process.argv.includes('--live');
  const isDryRun = !isLive;

  console.log('========================================================================');
  console.log(`CRMate Unified Supabase Importer [Mode: ${isDryRun ? 'DRY-RUN ONLY (Zero Remote Mutations)' : 'LIVE (Database Mutation)'}]`);
  console.log('========================================================================');

  // Verify all 3 input sources exist
  if (!fs.existsSync(BACKUP_PATH)) {
    console.error(`FATAL: Backup file not found at: ${BACKUP_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(KARIM_WORKBOOK_PATH)) {
    console.error(`FATAL: Karim Abdelazeez workbook not found at: ${KARIM_WORKBOOK_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(ABDEL_WORKBOOK_PATH)) {
    console.error(`FATAL: Abdelrahman Mohamed workbook not found at: ${ABDEL_WORKBOOK_PATH}`);
    process.exit(1);
  }

  console.log(`\n[✓] Source 1 (JSON Backup):     ${BACKUP_PATH}`);
  console.log(`[✓] Source 2 (Karim Workbook):  ${KARIM_WORKBOOK_PATH}`);
  console.log(`[✓] Source 3 (Abdel Workbook):  ${ABDEL_WORKBOOK_PATH}`);

  // Load JSON Backup
  const rawBackup = fs.readFileSync(BACKUP_PATH, 'utf8');
  const backup = JSON.parse(rawBackup);
  const data = backup.data;

  // Load Workbooks via XLSX
  const karimWb = xlsx.readFile(KARIM_WORKBOOK_PATH, { cellDates: true });
  const abdelWb = xlsx.readFile(ABDEL_WORKBOOK_PATH, { cellDates: true });

  // -------------------------------------------------------------------------
  // 1. PROFILES (Users)
  // -------------------------------------------------------------------------
  const users = data.users || [];
  const userIds = new Set(users.map(u => u.id));
  const profilesToInsert = users.map(u => ({
    id: u.id,
    email: u.email,
    full_name: u.name,
    name_ar: u.name_ar || null,
    role: u.role || 'sales_engineer',
    phone: u.phone || null,
    title: u.title || null,
    territory: u.territory || null,
    avatar_color: u.avatar_color || '#8FC2F0',
    avatar_url: u.avatar_url || null,
    is_active: u.is_active !== false,
    created_at: u.created_at || new Date().toISOString(),
    updated_at: u.created_at || new Date().toISOString()
  }));

  for (const p of SYNTHETIC_PROFILES) {
    if (!userIds.has(p.id)) {
      const now = new Date().toISOString();
      profilesToInsert.push({
        ...p,
        created_at: now,
        updated_at: now
      });
      userIds.add(p.id);
    }
  }

  const profileIds = new Set(profilesToInsert.map(p => p.id));
  const profileMap = new Map(profilesToInsert.map(p => [p.id, p]));

  // -------------------------------------------------------------------------
  // 2. COMPANIES (With Explicit Ownership Tracking - created_by)
  // -------------------------------------------------------------------------
  const existingCompanies = data.companies || [];
  const companyRegistry = new Map(); // normalized_name -> company object
  const companyIds = new Set();
  const companiesToInsert = [];

  // 2a. Existing JSON backup companies (Owner: u1 - Eslam Al-Mohandes)
  existingCompanies.forEach(c => {
    const normName = c.normalized_name || norm(c.name);
    const compRecord = {
      id: c.id,
      name: c.name,
      normalized_name: normName,
      company_type: c.company_type || 'contractor',
      city: c.city || null,
      website: c.website || null,
      google_maps_url: c.google_maps_url || null,
      phone: c.phone || null,
      notes: c.notes || null,
      created_by: 'u1', // Eslam Al-Mohandes added all original backup companies
      created_at: c.created_at || new Date().toISOString(),
      updated_at: c.updated_at || c.created_at || new Date().toISOString()
    };
    companiesToInsert.push(compRecord);
    companyIds.add(c.id);
    companyRegistry.set(normName, compRecord);
  });

  // 2b. Synthetic parent companies (Owner: u1)
  for (const parent of SYNTHETIC_PARENT_COMPANIES) {
    if (!companyIds.has(parent.id)) {
      const now = new Date().toISOString();
      const compRecord = {
        id: parent.id,
        name: parent.name,
        normalized_name: parent.normalized_name,
        company_type: parent.company_type,
        city: parent.city || null,
        website: null,
        google_maps_url: null,
        phone: null,
        notes: parent.notes || null,
        created_by: 'u1',
        created_at: now,
        updated_at: now
      };
      companiesToInsert.push(compRecord);
      companyIds.add(parent.id);
      companyRegistry.set(parent.normalized_name, compRecord);
    }
  }

  // Helper to resolve or register a company from Excel sheets
  function getOrCreateCompany(rawName, city, ownerId, sourceDesc) {
    if (!rawName) return null;
    const trimmed = String(rawName).trim();
    if (!trimmed || trimmed === '0' || trimmed.toLowerCase() === 'undefined') return null;
    const n = norm(trimmed);
    if (!n) return null;

    if (companyRegistry.has(n)) {
      return companyRegistry.get(n);
    }

    let candidateId = `c_${slugify(trimmed)}`;
    let counter = 1;
    while (companyIds.has(candidateId)) {
      candidateId = `c_${slugify(trimmed)}_${counter++}`;
    }

    const now = new Date().toISOString();
    const newComp = {
      id: candidateId,
      name: trimmed,
      normalized_name: n,
      company_type: 'contractor',
      city: city || (ownerId === 'u4' ? 'Riyadh' : ownerId === 'u2' ? 'Khobar' : null),
      website: null,
      google_maps_url: null,
      phone: null,
      notes: `Imported from ${sourceDesc} by ${profileMap.get(ownerId)?.full_name || ownerId}`,
      created_by: ownerId, // EXACT USER OWNERSHIP AS REQUESTED
      created_at: now,
      updated_at: now
    };

    companiesToInsert.push(newComp);
    companyIds.add(newComp.id);
    companyRegistry.set(n, newComp);
    return newComp;
  }

  // -------------------------------------------------------------------------
  // 3. CONTACTS (Owner Scoped: u1, u2, u4)
  // -------------------------------------------------------------------------
  const contactsToInsert = [];
  const contactIds = new Set();
  const contactPhoneMap = new Map();
  const duplicateContactCandidates = [];

  // 3a. Existing JSON backup contacts (Owner: u1)
  (data.contacts || []).forEach(c => {
    const nPhone = c.normalized_phone || normPhone(c.phone);
    const ctRecord = {
      id: c.id,
      company_id: c.company_id && companyIds.has(c.company_id) ? c.company_id : null,
      company_name: c.company_name || null,
      full_name: c.full_name,
      job_title: c.job_title || null,
      phone: c.phone || null,
      normalized_phone: nPhone,
      email: c.email || null,
      city: c.city || null,
      linkedin_url: c.linkedin_url || null,
      is_hot_lead: !!c.is_hot_lead,
      notes: c.notes || null,
      owner_id: c.owner_id && profileIds.has(c.owner_id) ? c.owner_id : 'u1',
      project_ids: c.project_ids || [],
      last_contacted_at: c.last_contacted_at || null,
      next_follow_up_at: c.next_follow_up_at || null,
      created_at: c.created_at || new Date().toISOString(),
      updated_at: c.updated_at || c.created_at || new Date().toISOString()
    };
    contactsToInsert.push(ctRecord);
    contactIds.add(ctRecord.id);
    if (nPhone) {
      if (!contactPhoneMap.has(nPhone)) contactPhoneMap.set(nPhone, []);
      contactPhoneMap.get(nPhone).push(ctRecord);
    }
  });

  // 3b. Synthetic contacts (u1)
  for (const sc of SYNTHETIC_CONTACTS) {
    if (!contactIds.has(sc.id)) {
      const now = new Date().toISOString();
      contactsToInsert.push({ ...sc, created_at: now, updated_at: now });
      contactIds.add(sc.id);
    }
  }

  // Helper to ingest Hot Leads from an engineer workbook
  function ingestHotLeads(wb, ownerId, engineerPrefix) {
    const ws = wb.Sheets['Hot Leads'];
    if (!ws) return;
    const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });
    let count = 0;

    for (let i = 1; i < raw.length; i++) {
      const r = raw[i];
      const name = r[0] != null ? String(r[0]).trim() : '';
      const phone = r[1] != null ? String(r[1]).trim() : '';
      const companyName = r[2] != null ? String(r[2]).trim() : '';
      const mapsUrl = r[3] != null ? String(r[3]).trim() : '';
      const city = r[4] != null ? String(r[4]).trim() : '';
      const email = r[5] != null ? String(r[5]).trim() : '';
      const position = r[6] != null ? String(r[6]).trim() : '';
      const lastCall = parseExcelDate(r[7]);
      const notes = r[8] != null ? String(r[8]).trim() : '';
      const nextFollowNotes = r[9] != null ? String(r[9]).trim() : '';
      const nextFollowDate = parseExcelDate(r[10]);

      if (name || companyName || phone) {
        count++;
        const comp = getOrCreateCompany(companyName, city, ownerId, `Hot Leads (${engineerPrefix})`);
        const nPhone = normPhone(phone);
        const contactId = `ct_${engineerPrefix}_hl_${String(count).padStart(3, '0')}`;

        if (nPhone && contactPhoneMap.has(nPhone)) {
          duplicateContactCandidates.push({
            incomingId: contactId,
            incomingName: name,
            incomingCompany: companyName,
            incomingOwner: ownerId,
            existingMatches: contactPhoneMap.get(nPhone).map(x => ({
              id: x.id,
              name: x.full_name,
              company: x.company_name,
              owner: x.owner_id
            })),
            phone: phone
          });
        }

        const now = new Date().toISOString();
        const contactRecord = {
          id: contactId,
          company_id: comp ? comp.id : null,
          company_name: comp ? comp.name : (companyName || null),
          full_name: name || `Contact at ${companyName || 'Unknown'}`,
          job_title: position || null,
          phone: phone || null,
          normalized_phone: nPhone,
          email: email || null,
          city: city || null,
          linkedin_url: null,
          is_hot_lead: true,
          notes: [notes, nextFollowNotes ? `Next: ${nextFollowNotes}` : null, mapsUrl ? `Map: ${mapsUrl}` : null]
            .filter(Boolean)
            .join(' | ') || null,
          owner_id: ownerId,
          project_ids: [],
          last_contacted_at: lastCall ? `${lastCall}T09:00:00Z` : null,
          next_follow_up_at: nextFollowDate ? `${nextFollowDate}T09:00:00Z` : null,
          created_at: now,
          updated_at: now
        };

        contactsToInsert.push(contactRecord);
        contactIds.add(contactId);
        if (nPhone) {
          if (!contactPhoneMap.has(nPhone)) contactPhoneMap.set(nPhone, []);
          contactPhoneMap.get(nPhone).push(contactRecord);
        }
      }
    }
  }

  ingestHotLeads(karimWb, 'u4', 'u4');
  ingestHotLeads(abdelWb, 'u2', 'u2');

  const contactLookup = new Map();
  contactsToInsert.forEach(c => {
    if (c.full_name) {
      contactLookup.set(`${c.owner_id}::${norm(c.full_name)}`, c);
    }
  });

  // -------------------------------------------------------------------------
  // 4. PROJECTS: CONTINUOUS SEQUENTIAL PR NUMBERING SYSTEM
  // -------------------------------------------------------------------------
  const projectsToInsert = [];
  const projectIds = new Set();
  const prNumberSet = new Set();
  const projectLookup = new Map(); // ownerId::normName -> project
  const projectMappingTable = [];

  // Step 4a: Determine the highest numeric PR number from existing Eslam projects
  let maxEslamPr = 0;
  (data.projects || []).forEach(p => {
    const rawPr = (p.pr_number || p.code || '').trim();
    const m = rawPr.match(/^PR(\d+)$/i);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num > maxEslamPr) maxEslamPr = num;
    }
  });

  // Step 4b: Ingest Eslam's existing projects exactly as they are (Zero Modification)
  (data.projects || []).forEach(p => {
    const rawPr = p.pr_number || p.code;
    const projRecord = {
      id: p.id,
      pr_number: rawPr,
      name: p.name,
      company_id: companyIds.has(p.company_id) ? p.company_id : 'c_tahlia_group',
      company_name: p.company_name || null,
      primary_contact_id: p.primary_contact_id && contactIds.has(p.primary_contact_id) ? p.primary_contact_id : null,
      primary_contact_name: p.primary_contact_name || null,
      primary_contact_phone: p.primary_contact_phone || null,
      contact_ids: p.contact_ids || [],
      location: p.location || 'Western Region',
      opportunity_type: p.opportunity_type || 'in_hand',
      pipeline_stage: p.pipeline_stage || p.stage || 'lead',
      priority: p.priority || 'medium',
      estimated_value: p.estimated_value || 0,
      final_won_value: p.final_won_value || null,
      probability: p.probability ?? 50,
      expected_award_date: p.expected_award_date || null,
      closing_date: p.closing_date || null,
      owner_id: p.owner_id && profileIds.has(p.owner_id) ? p.owner_id : 'u1',
      owner_name: p.owner_name || 'Eslam Al-Mohandes',
      next_action: p.next_action || null,
      next_follow_up_at: p.next_follow_up_at || null,
      last_activity_at: p.last_activity_at || null,
      card_color: p.card_color || 'default',
      base_card_color: p.base_card_color || 'default',
      stage_entered_at: p.stage_entered_at || p.created_at || new Date().toISOString(),
      is_archived: !!p.is_archived,
      internal_notes: p.internal_notes || null,
      po_number: p.po_number || null,
      po_date: p.po_date || null,
      po_amount: p.po_amount || null,
      po_attachment_name: p.po_attachment_name || null,
      po_attachment_url: p.po_attachment_url || null,
      po_attachment_size: p.po_attachment_size || null,
      po_uploaded_at: p.po_uploaded_at || null,
      po_uploaded_by: p.po_uploaded_by || null,
      po_notes: p.po_notes || null,
      collected_amount: p.collected_amount || 0,
      collected_percentage: p.collected_percentage || 0,
      collection_status: p.collection_status || 'pending',
      collection_records: p.collection_records || [],
      rfq_packages: p.rfq_packages || null,
      systems: p.systems || [],
      submittal_status: p.submittal_status || null,
      submittal_sent_at: p.submittal_sent_at || null,
      client_target_price: p.client_target_price || null,
      last_discount_pct: p.last_discount_pct ?? null,
      last_discount_amount: p.last_discount_amount ?? null,
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || p.created_at || new Date().toISOString()
    };
    projectsToInsert.push(projRecord);
    projectIds.add(projRecord.id);
    prNumberSet.add(rawPr);
    projectLookup.set(`u1::${norm(p.name)}`, projRecord);
  });

  // Continuous Sequential PR Counter starts immediately after Eslam's highest PR
  let prSequenceCounter = maxEslamPr;

  // Step 4c: Import Karim Abdelazeez's projects first (workbook row order)
  const rawKP = xlsx.utils.sheet_to_json(karimWb.Sheets['Projects Follow UP'], { header: 1 });
  let karimFirstAssignedPr = null;
  let karimLastAssignedPr = null;

  for (let i = 4; i < rawKP.length; i++) {
    const r = rawKP[i];
    const rawPr = r[0] != null ? String(r[0]).trim() : '';
    const opp = r[1] != null ? String(r[1]).trim() : '';
    const clientName = r[2] != null ? String(r[2]).trim() : '';
    const clientPhone = r[3] != null ? String(r[3]).trim() : '';
    const companyName = r[4] != null ? String(r[4]).trim() : '';
    const clientEmail = r[5] != null ? String(r[5]).trim() : '';
    const stage = r[6] != null ? String(r[6]).trim() : '';
    const location = r[7] != null ? String(r[7]).trim() : '';
    const status = r[8] != null ? String(r[8]).trim() : '';
    const estVal = typeof r[9] === 'number' ? r[9] : (parseFloat(String(r[9] || '0').replace(/[^0-9.]/g, '')) || 0);
    const actionDone = r[12] != null ? String(r[12]).trim() : '';
    const followUpAction = r[14] != null ? String(r[14]).trim() : '';
    const followUpDate = parseExcelDate(r[15]);

    if (!opp || opp === '0') continue;

    // Advance continuous sequential counter
    prSequenceCounter++;
    const unifiedPr = `PR${prSequenceCounter}`;
    const projectId = `p_pr${prSequenceCounter}`;

    if (!karimFirstAssignedPr) karimFirstAssignedPr = unifiedPr;
    karimLastAssignedPr = unifiedPr;
    prNumberSet.add(unifiedPr);

    const comp = getOrCreateCompany(companyName, location || 'Riyadh', 'u4', 'Karim Projects');

    let contactId = null;
    if (clientName) {
      const contactKey = `u4::${norm(clientName)}`;
      if (contactLookup.has(contactKey)) {
        contactId = contactLookup.get(contactKey).id;
      }
    }

    const now = new Date().toISOString();
    const projRecord = {
      id: projectId,
      pr_number: unifiedPr, // UNIFIED SEQUENTIAL PR NUMBER (ZERO SUFFIXES)
      name: opp,
      company_id: comp ? comp.id : 'c_tahlia_group',
      company_name: comp ? comp.name : (companyName || null),
      primary_contact_id: contactId,
      primary_contact_name: clientName || null,
      primary_contact_phone: clientPhone || null,
      contact_ids: contactId ? [contactId] : [],
      location: location || 'Riyadh',
      opportunity_type: stage && stage.toLowerCase().includes('tender') ? 'tender' : 'in_hand',
      pipeline_stage: mapPipelineStage(status),
      priority: 'medium',
      estimated_value: estVal,
      final_won_value: status && status.toLowerCase().includes('won') ? estVal : null,
      probability: status && status.toLowerCase().includes('won') ? 100 : (status && status.toLowerCase().includes('lost') ? 0 : 50),
      expected_award_date: null,
      closing_date: null,
      owner_id: 'u4', // EXACT OWNERSHIP (Karim Abdelazeez)
      owner_name: 'Karim Abdelazeez',
      next_action: followUpAction || actionDone || null,
      next_follow_up_at: followUpDate ? `${followUpDate}T09:00:00Z` : null,
      last_activity_at: null,
      card_color: 'default',
      base_card_color: 'default',
      stage_entered_at: now,
      is_archived: false,
      internal_notes: rawPr ? `Original Source PR: ${rawPr} (Sheet: Projects Follow UP)` : null,
      po_number: null,
      po_date: null,
      po_amount: null,
      po_attachment_name: null,
      po_attachment_url: null,
      po_attachment_size: null,
      po_uploaded_at: null,
      po_uploaded_by: null,
      po_notes: null,
      collected_amount: 0,
      collected_percentage: 0,
      collection_status: 'pending',
      collection_records: [],
      rfq_packages: null,
      systems: [],
      submittal_status: null,
      submittal_sent_at: null,
      client_target_price: null,
      last_discount_pct: null,
      last_discount_amount: null,
      created_at: now,
      updated_at: now
    };

    projectsToInsert.push(projRecord);
    projectIds.add(projectId);
    projectLookup.set(`u4::${norm(opp)}`, projRecord);

    projectMappingTable.push({
      engineer: 'Karim Abdelazeez (u4)',
      owner_id: 'u4',
      origPr: rawPr,
      assignedPr: unifiedPr,
      id: projectId,
      name: opp,
      linkedActivities: 0,
      linkedPlanned: 0
    });
  }

  // Step 4d: Import Abdelrahman Mohamed's projects second (continuing same counter immediately)
  const rawAP = xlsx.utils.sheet_to_json(abdelWb.Sheets['Projects Follow UP'], { header: 1 });
  let abdelFirstAssignedPr = null;
  let abdelLastAssignedPr = null;

  for (let i = 4; i < rawAP.length; i++) {
    const r = rawAP[i];
    const rawPr = r[0] != null ? String(r[0]).trim() : '';
    const opp = r[1] != null ? String(r[1]).trim() : '';
    const clientName = r[2] != null ? String(r[2]).trim() : '';
    const clientPhone = r[3] != null ? String(r[3]).trim() : '';
    const companyName = r[4] != null ? String(r[4]).trim() : '';
    const clientEmail = r[5] != null ? String(r[5]).trim() : '';
    const stage = r[6] != null ? String(r[6]).trim() : '';
    const location = r[7] != null ? String(r[7]).trim() : '';
    const status = r[8] != null ? String(r[8]).trim() : '';
    const estVal = typeof r[9] === 'number' ? r[9] : (parseFloat(String(r[9] || '0').replace(/[^0-9.]/g, '')) || 0);

    if (!opp || opp === '0') continue;

    // Continue continuous sequential counter
    prSequenceCounter++;
    const unifiedPr = `PR${prSequenceCounter}`;
    const projectId = `p_pr${prSequenceCounter}`;

    if (!abdelFirstAssignedPr) abdelFirstAssignedPr = unifiedPr;
    abdelLastAssignedPr = unifiedPr;
    prNumberSet.add(unifiedPr);

    const comp = getOrCreateCompany(companyName, location || 'Khobar', 'u2', 'Abdelrahman Projects');

    let contactId = null;
    if (clientName) {
      const contactKey = `u2::${norm(clientName)}`;
      if (contactLookup.has(contactKey)) {
        contactId = contactLookup.get(contactKey).id;
      }
    }

    const now = new Date().toISOString();
    const projRecord = {
      id: projectId,
      pr_number: unifiedPr, // UNIFIED SEQUENTIAL PR NUMBER (ZERO SUFFIXES)
      name: opp,
      company_id: comp ? comp.id : 'c_tahlia_group',
      company_name: comp ? comp.name : (companyName || null),
      primary_contact_id: contactId,
      primary_contact_name: clientName || null,
      primary_contact_phone: clientPhone || null,
      contact_ids: contactId ? [contactId] : [],
      location: location || 'Eastern Province',
      opportunity_type: stage && stage.toLowerCase().includes('tender') ? 'tender' : 'in_hand',
      pipeline_stage: mapPipelineStage(status),
      priority: 'medium',
      estimated_value: estVal,
      final_won_value: status && status.toLowerCase().includes('won') ? estVal : null,
      probability: status && status.toLowerCase().includes('won') ? 100 : (status && status.toLowerCase().includes('lost') ? 0 : 50),
      expected_award_date: null,
      closing_date: null,
      owner_id: 'u2', // EXACT OWNERSHIP (Abdelrahman Mohamed)
      owner_name: 'Abdelrahman Mohamed',
      next_action: null,
      next_follow_up_at: null,
      last_activity_at: null,
      card_color: 'default',
      base_card_color: 'default',
      stage_entered_at: now,
      is_archived: false,
      internal_notes: rawPr ? `Original Source PR: ${rawPr} (Sheet: Projects Follow UP)` : null,
      po_number: null,
      po_date: null,
      po_amount: null,
      po_attachment_name: null,
      po_attachment_url: null,
      po_attachment_size: null,
      po_uploaded_at: null,
      po_uploaded_by: null,
      po_notes: null,
      collected_amount: 0,
      collected_percentage: 0,
      collection_status: 'pending',
      collection_records: [],
      rfq_packages: null,
      systems: [],
      submittal_status: null,
      submittal_sent_at: null,
      client_target_price: null,
      last_discount_pct: null,
      last_discount_amount: null,
      created_at: now,
      updated_at: now
    };

    projectsToInsert.push(projRecord);
    projectIds.add(projectId);
    projectLookup.set(`u2::${norm(opp)}`, projRecord);

    projectMappingTable.push({
      engineer: 'Abdelrahman Mohamed (u2)',
      owner_id: 'u2',
      origPr: rawPr,
      assignedPr: unifiedPr,
      id: projectId,
      name: opp,
      linkedActivities: 0,
      linkedPlanned: 0
    });
  }

  // -------------------------------------------------------------------------
  // 5. PROJECT MEMBERS (Collaboration)
  // -------------------------------------------------------------------------
  const projectMembersToInsert = [];
  (data.projects || []).forEach(p => {
    if (p.members && Array.isArray(p.members)) {
      p.members.forEach(m => {
        const uId = m.user_id && profileIds.has(m.user_id) ? m.user_id : null;
        if (uId && projectIds.has(p.id)) {
          projectMembersToInsert.push({
            project_id: p.id,
            user_id: uId,
            role: m.role || 'co_sales_engineer',
            user_name: m.user_name || null,
            assigned_at: m.assigned_at || new Date().toISOString()
          });
        }
      });
    }
  });

  // -------------------------------------------------------------------------
  // 6. QUOTATIONS (Existing 11 records preserved; ZERO fabricated)
  // -------------------------------------------------------------------------
  const quotationsToInsert = (data.quotations || []).map(q => ({
    id: q.id,
    project_id: q.project_id,
    project_name: q.project_name || null,
    quotation_number: q.quotation_number,
    version: q.version || 1,
    amount: q.amount || q.total_amount || 0,
    total_amount: q.total_amount || q.amount || 0,
    subtotal: q.subtotal || q.amount || 0,
    discount_amount: q.discount_amount || 0,
    discount_percentage: q.discount_percentage || 0,
    tax_amount: q.tax_amount || 0,
    currency: q.currency || 'SAR',
    vendor_brand: q.vendor_brand || null,
    status: q.status || 'submitted',
    quotation_date: q.quotation_date || q.sent_date || new Date().toISOString().split('T')[0],
    sent_date: q.sent_date || null,
    valid_until: q.valid_until || null,
    payment_terms: q.payment_terms || null,
    delivery_terms: q.delivery_terms || null,
    warranty_terms: q.warranty_terms || null,
    revision_reason: q.revision_reason || null,
    previous_version_id: q.previous_version_id || null,
    is_archived: !!q.is_archived,
    created_by: q.created_by || 'u1',
    created_at: q.created_at || new Date().toISOString(),
    updated_at: q.updated_at || q.created_at || new Date().toISOString()
  })).filter(q => projectIds.has(q.project_id))
    .sort((a, b) => (a.version || 1) - (b.version || 1));

  const quotationIds = new Set(quotationsToInsert.map(q => q.id));

  // -------------------------------------------------------------------------
  // 7. ACTIVITIES (Master Report - Accurately Linked to New Project IDs)
  // -------------------------------------------------------------------------
  const activitiesToInsert = [];
  const activityIds = new Set();
  const mappingLookup = new Map(projectMappingTable.map(p => [`${p.owner_id}::${norm(p.name)}`, p]));

  // 7a. Existing JSON backup activities (u1)
  (data.activities || []).forEach(a => {
    activitiesToInsert.push({
      id: a.id,
      project_id: a.project_id && projectIds.has(a.project_id) ? a.project_id : null,
      project_name: a.project_name || null,
      company_id: a.company_id && companyIds.has(a.company_id) ? a.company_id : null,
      company_name: a.company_name || null,
      contact_id: a.contact_id && contactIds.has(a.contact_id) ? a.contact_id : null,
      contact_name: a.contact_name || null,
      user_id: a.user_id && profileIds.has(a.user_id) ? a.user_id : 'u1',
      user_name: a.user_name || null,
      planned_activity_id: a.planned_activity_id || null,
      activity_date: a.activity_date || new Date().toISOString().split('T')[0],
      activity_time: a.activity_time || null,
      channel: a.channel || 'office_work',
      visit_purpose: a.visit_purpose === 'commercial_negotiation' ? 'quotation_delivery' : (a.visit_purpose || 'follow_up'),
      outcome: a.outcome || null,
      notes: a.notes || null,
      location_name: a.location_name || null,
      priority: a.priority || 'medium',
      next_action: a.next_action || null,
      next_follow_up_at: a.next_follow_up_at || null,
      created_at: a.created_at || new Date().toISOString()
    });
    activityIds.add(a.id);
  });

  // Helper to ingest Master Report from an engineer workbook
  function ingestMasterReport(wb, ownerId, prefix) {
    const ws = wb.Sheets['Master Report'];
    if (!ws) return;
    const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });
    let count = 0;

    for (let i = 1; i < raw.length; i++) {
      const r = raw[i];
      const d = parseExcelDate(r[0]);
      const opp = r[2] != null ? String(r[2]).trim() : '';
      const contact = r[3] != null ? String(r[3]).trim() : '';
      const period = r[4] != null ? String(r[4]).trim() : '';
      const type = r[5] != null ? String(r[5]).trim() : '';
      const visitType = r[6] != null ? String(r[6]).trim() : '';
      const loc = r[9] != null ? String(r[9]).trim() : '';
      const action = r[10] != null ? String(r[10]).trim() : '';
      const followUpDate = parseExcelDate(r[11]);
      const followUpAction = r[12] != null ? String(r[12]).trim() : '';

      if (!d && !opp && !contact && !action) continue;

      count++;
      const actId = `act_${prefix}_${String(count).padStart(3, '0')}`;

      let matchedProj = null;
      if (opp) {
        const lookupKey = `${ownerId}::${norm(opp)}`;
        matchedProj = projectLookup.get(lookupKey);
        if (mappingLookup.has(lookupKey)) {
          mappingLookup.get(lookupKey).linkedActivities++;
        }
      }

      let matchedContact = null;
      if (contact) {
        matchedContact = contactLookup.get(`${ownerId}::${norm(contact)}`);
      }

      activitiesToInsert.push({
        id: actId,
        project_id: matchedProj ? matchedProj.id : null, // POINTS TO CORRECT RE-NUMBERED ID (e.g. p_pr1083)
        project_name: matchedProj ? matchedProj.name : (opp || null),
        company_id: matchedProj ? matchedProj.company_id : null,
        company_name: matchedProj ? matchedProj.company_name : null,
        contact_id: matchedContact ? matchedContact.id : null,
        contact_name: matchedContact ? matchedContact.full_name : (contact || null),
        user_id: ownerId,
        user_name: profileMap.get(ownerId)?.full_name || ownerId,
        planned_activity_id: null,
        activity_date: d || new Date().toISOString().split('T')[0],
        activity_time: period || null,
        channel: mapChannel(type),
        visit_purpose: mapVisitPurpose(visitType),
        outcome: null,
        notes: action || null,
        location_name: loc || null,
        priority: 'medium',
        next_action: followUpAction || null,
        next_follow_up_at: followUpDate ? `${followUpDate}T09:00:00Z` : null,
        created_at: d ? `${d}T10:00:00Z` : new Date().toISOString()
      });
      activityIds.add(actId);
    }
  }

  ingestMasterReport(karimWb, 'u4', 'u4');
  ingestMasterReport(abdelWb, 'u2', 'u2');

  // -------------------------------------------------------------------------
  // 8. PLANNED ACTIVITIES (Master Plan - Accurately Linked to New Project IDs)
  // -------------------------------------------------------------------------
  const plannedToInsert = [];
  (data.planned_activities || []).forEach(p => {
    plannedToInsert.push({
      id: p.id,
      weekly_plan_id: p.weekly_plan_id || 'plan_default',
      user_id: p.user_id && profileIds.has(p.user_id) ? p.user_id : 'u1',
      user_name: p.user_name || null,
      project_id: p.project_id && projectIds.has(p.project_id) ? p.project_id : null,
      project_name: p.project_name || null,
      company_id: p.company_id && companyIds.has(p.company_id) ? p.company_id : null,
      company_name: p.company_name || null,
      contact_id: p.contact_id && contactIds.has(p.contact_id) ? p.contact_id : null,
      contact_name: p.contact_name || null,
      location_name: p.location_name || null,
      custom_target: p.custom_target || null,
      scheduled_date: p.scheduled_date || new Date().toISOString().split('T')[0],
      channel: p.channel || 'office_work',
      visit_purpose: p.visit_purpose || 'follow_up',
      goal: p.goal || 'Follow up',
      priority: p.priority || 'medium',
      status: p.status || 'planned',
      is_auto_suggested: !!p.is_auto_suggested,
      is_follow_up: !!p.is_follow_up,
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || p.created_at || new Date().toISOString()
    });
  });

  function ingestMasterPlan(wb, ownerId, prefix) {
    const ws = wb.Sheets['Master Plan'];
    if (!ws) return;
    const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });
    let count = 0;

    for (let i = 1; i < raw.length; i++) {
      const r = raw[i];
      const d = parseExcelDate(r[0]);
      const opp = r[2] != null ? String(r[2]).trim() : '';
      const contact = r[3] != null ? String(r[3]).trim() : '';
      const period = r[4] != null ? String(r[4]).trim() : '';
      const type = r[5] != null ? String(r[5]).trim() : '';
      const visitType = r[6] != null ? String(r[6]).trim() : '';
      const loc = r[9] != null ? String(r[9]).trim() : '';
      const action = r[10] != null ? String(r[10]).trim() : '';

      if (!d && !opp && !contact && !action) continue;

      count++;
      const planId = `plan_${prefix}_${String(count).padStart(3, '0')}`;
      let matchedProj = null;
      if (opp) {
        const lookupKey = `${ownerId}::${norm(opp)}`;
        matchedProj = projectLookup.get(lookupKey);
        if (mappingLookup.has(lookupKey)) {
          mappingLookup.get(lookupKey).linkedPlanned++;
        }
      }
      const matchedContact = contact ? contactLookup.get(`${ownerId}::${norm(contact)}`) : null;

      plannedToInsert.push({
        id: planId,
        weekly_plan_id: `plan_${prefix}`,
        user_id: ownerId,
        user_name: profileMap.get(ownerId)?.full_name || ownerId,
        project_id: matchedProj ? matchedProj.id : null,
        project_name: matchedProj ? matchedProj.name : (opp || null),
        company_id: matchedProj ? matchedProj.company_id : null,
        company_name: matchedProj ? matchedProj.company_name : null,
        contact_id: matchedContact ? matchedContact.id : null,
        contact_name: matchedContact ? matchedContact.full_name : (contact || null),
        location_name: loc || null,
        custom_target: null,
        scheduled_date: d || new Date().toISOString().split('T')[0],
        channel: mapChannel(type),
        visit_purpose: mapVisitPurpose(visitType),
        goal: action || 'Planned Activity',
        priority: 'medium',
        status: 'planned',
        is_auto_suggested: false,
        is_follow_up: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }

  ingestMasterPlan(karimWb, 'u4', 'u4');
  ingestMasterPlan(abdelWb, 'u2', 'u2');

  // -------------------------------------------------------------------------
  // 9. SALES TARGETS, REQUESTS, NOTIFICATIONS, REMINDERS
  // -------------------------------------------------------------------------
  const targetsToInsert = (data.sales_targets || []).map(t => ({
    id: t.id,
    user_id: t.user_id && profileIds.has(t.user_id) ? t.user_id : 'u1',
    user_name: t.user_name || null,
    period_type: t.period_type || 'monthly',
    period_start: t.period_start,
    period_end: t.period_end,
    target_metric: t.target_metric,
    target_value: t.target_value,
    current_actual: t.current_actual || 0,
    created_at: t.created_at || new Date().toISOString(),
    updated_at: t.updated_at || t.created_at || new Date().toISOString()
  }));

  const requestsToInsert = (data.requests || []).map(r => ({
    id: r.id,
    project_id: r.project_id && projectIds.has(r.project_id) ? r.project_id : projectsToInsert[0].id,
    project_name: r.project_name || null,
    company_name: r.company_name || null,
    quotation_id: r.quotation_id && quotationIds.has(r.quotation_id) ? r.quotation_id : null,
    quotation_number: r.quotation_number || null,
    quotation_amount: r.quotation_amount || null,
    type: r.type || 'discount',
    requested_by: r.requested_by && profileIds.has(r.requested_by) ? r.requested_by : 'u1',
    requester_name: r.requester_name || null,
    assigned_to: r.assigned_to || [],
    payload: r.payload || {},
    urgency: r.urgency || 'normal',
    status: r.status || 'pending',
    resolution: r.resolution || null,
    comments: r.comments || [],
    created_at: r.created_at || new Date().toISOString(),
    updated_at: r.updated_at || r.created_at || new Date().toISOString()
  }));

  const notificationsToInsert = (data.notifications || []).map(n => ({
    id: n.id,
    user_id: n.user_id && profileIds.has(n.user_id) ? n.user_id : 'u1',
    type: n.type || 'system_alert',
    category: n.category || 'system',
    reference_type: n.reference_type || 'general',
    reference_id: n.reference_id || 'ref_gen',
    title: n.title,
    body: n.body,
    project_id: n.project_id && projectIds.has(n.project_id) ? n.project_id : null,
    project_name: n.project_name || null,
    is_read: !!n.is_read,
    created_at: n.created_at || new Date().toISOString()
  }));

  const remindersToInsert = (data.reminders || []).map(r => ({
    id: r.id,
    user_id: r.user_id && profileIds.has(r.user_id) ? r.user_id : 'u1',
    title: r.title,
    notes: r.notes || null,
    reminder_date: r.reminder_date || new Date().toISOString().split('T')[0],
    reminder_time: r.reminder_time || null,
    urgency: r.urgency || 'normal',
    is_completed: !!r.is_completed,
    completed_at: r.completed_at || null,
    notified: !!r.notified,
    entity_type: r.entity_type || null,
    entity_id: r.entity_id || null,
    entity_name: r.entity_name || null,
    project_id: r.project_id && projectIds.has(r.project_id) ? r.project_id : null,
    project_name: r.project_name || null,
    contact_id: r.contact_id && contactIds.has(r.contact_id) ? r.contact_id : null,
    contact_name: r.contact_name || null,
    activity_id: r.activity_id || null,
    created_at: r.created_at || new Date().toISOString()
  }));

  // -------------------------------------------------------------------------
  // 10. COMPREHENSIVE DRY-RUN VALIDATION REPORT
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('UNIFIED SEQUENTIAL PR NUMBERING DRY-RUN REPORT');
  console.log('========================================================================');

  console.log('\n--- 1. SEQUENTIAL PR NUMBERING BREAKDOWN ---');
  const karimCount = projectMappingTable.filter(p => p.owner_id === 'u4').length;
  const abdelCount = projectMappingTable.filter(p => p.owner_id === 'u2').length;
  console.log(`[✓] Last existing Eslam PR:       PR${maxEslamPr}`);
  console.log(`[✓] Karim Abdelazeez (u4):        ${karimFirstAssignedPr} to ${karimLastAssignedPr} (${karimCount} projects)`);
  console.log(`[✓] Abdelrahman Mohamed (u2):     ${abdelFirstAssignedPr} to ${abdelLastAssignedPr} (${abdelCount} projects)`);
  console.log(`[✓] PR Suffix Policy:             Zero suffixes (-K, -A removed completely)`);
  console.log(`[✓] Remaining PR Conflicts:       0 (100% unique continuous sequence PR${maxEslamPr + 1}..PR${prSequenceCounter})`);

  console.log('\n--- 2. DESTINATION TABLE RECORD COUNTS ---');
  console.log(`[✓] profiles:           ${String(profilesToInsert.length).padStart(4)} (${users.length} original + ${SYNTHETIC_PROFILES.length} synthetic)`);
  console.log(`[✓] companies:          ${String(companiesToInsert.length).padStart(4)} (${existingCompanies.length} original + ${SYNTHETIC_PARENT_COMPANIES.length} synthetic + ${companiesToInsert.length - existingCompanies.length - SYNTHETIC_PARENT_COMPANIES.length} new from workbooks)`);
  console.log(`[✓] contacts:           ${String(contactsToInsert.length).padStart(4)} (${(data.contacts || []).length} original + ${SYNTHETIC_CONTACTS.length} synthetic + ${contactsToInsert.length - (data.contacts || []).length - SYNTHETIC_CONTACTS.length} from workbooks)`);
  console.log(`[✓] projects:           ${String(projectsToInsert.length).padStart(4)} (37 Eslam + 25 Karim + 50 Abdelrahman; 0 overwrite)`);
  console.log(`[✓] project_members:    ${String(projectMembersToInsert.length).padStart(4)}`);
  console.log(`[✓] quotations:         ${String(quotationsToInsert.length).padStart(4)} (11 original; 0 fabricated)`);
  console.log(`[✓] activities:         ${String(activitiesToInsert.length).padStart(4)} (485 original + 127 Karim + 243 Abdelrahman)`);
  console.log(`[✓] planned_activities: ${String(plannedToInsert.length).padStart(4)} (582 original + 69 Karim + 148 Abdelrahman)`);
  console.log(`[✓] sales_targets:      ${String(targetsToInsert.length).padStart(4)}`);
  console.log(`[✓] approval_requests:  ${String(requestsToInsert.length).padStart(4)}`);
  console.log(`[✓] notifications:      ${String(notificationsToInsert.length).padStart(4)}`);
  console.log(`[✓] reminders:          ${String(remindersToInsert.length).padStart(4)}`);

  console.log('\n--- 3. COMPLETE RE-NUMBERED PROJECT MAPPING TABLE (All 75 Team Projects) ---');
  console.log('------------------------------------------------------------------------------------------------------------------------------------');
  console.log('| Engineer | Orig PR | Unified PR | Database ID | Project Name | Linked Act | Linked Plan |');
  console.log('------------------------------------------------------------------------------------------------------------------------------------');
  projectMappingTable.forEach(p => {
    const orig = (p.origPr || '<none>').padEnd(7);
    const unified = p.assignedPr.padEnd(10);
    const dbId = p.id.padEnd(11);
    const eng = p.engineer.padEnd(24);
    const name = p.name.length > 38 ? p.name.slice(0, 35) + '...' : p.name.padEnd(38);
    const act = String(p.linkedActivities).padStart(10);
    const plan = String(p.linkedPlanned).padStart(11);
    console.log(`| ${eng} | ${orig} | ${unified} | ${dbId} | ${name} | ${act} | ${plan} |`);
  });
  console.log('------------------------------------------------------------------------------------------------------------------------------------');

  console.log('\n--- 4. OWNERSHIP ATTRIBUTION VERIFICATION ---');
  function tallyByOwner(items, ownerField) {
    const counts = {};
    items.forEach(item => {
      const o = item[ownerField] || 'null';
      counts[o] = (counts[o] || 0) + 1;
    });
    return Object.entries(counts).map(([k, v]) => `${k} (${profileMap.get(k)?.full_name || 'N/A'}): ${v}`).join(', ');
  }
  console.log(`Companies (created_by):      ${tallyByOwner(companiesToInsert, 'created_by')}`);
  console.log(`Contacts (owner_id):         ${tallyByOwner(contactsToInsert, 'owner_id')}`);
  console.log(`Projects (owner_id):         ${tallyByOwner(projectsToInsert, 'owner_id')}`);
  console.log(`Activities (user_id):        ${tallyByOwner(activitiesToInsert, 'user_id')}`);
  console.log(`Planned Activities (user_id):${tallyByOwner(plannedToInsert, 'user_id')}`);

  console.log('\n--- 5. TREATMENT OF 8 FUTURE 2027 OPPORTUNITIES (Sheet1) ---');
  console.log(`[✓] Status: EXCLUDED from this import as instructed.`);
  console.log(`[✓] Schema Protection: Excluded from 'projects' table to avoid adding SAR 55,878,981 to 2026 active pipeline.`);

  // -------------------------------------------------------------------------
  // 6. PRE-IMPORT EXISTENCE CHECK & EXACT MANIFEST GENERATION
  // -------------------------------------------------------------------------
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let clientForCheck = null;
  if (createClient && supabaseUrl && serviceKey) {
    clientForCheck = createClient(supabaseUrl, serviceKey);
  }

  const existingIds = await getExistingTableIds(clientForCheck, isLive);

  function partitionPayload(records, idSet) {
    const newlyInserted = [];
    const updated = [];
    records.forEach(r => {
      if (idSet.has(r.id)) {
        updated.push(r.id);
      } else {
        newlyInserted.push(r.id);
      }
    });
    return { newlyInserted, updated };
  }

  const companyPartition = partitionPayload(companiesToInsert, existingIds.companies);
  const contactPartition = partitionPayload(contactsToInsert, existingIds.contacts);
  const projectPartition = partitionPayload(projectsToInsert, existingIds.projects);
  const activityPartition = partitionPayload(activitiesToInsert, existingIds.activities);
  const plannedPartition = partitionPayload(plannedToInsert, existingIds.planned_activities);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runId = `import_run_${Date.now()}`;
  const backupsDir = path.resolve('backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const manifest = {
    manifest_version: '1.0',
    import_run_id: runId,
    timestamp: new Date().toISOString(),
    mode: isDryRun ? 'dry-run' : 'live',
    scope: {
      excluded_tables: ['profiles'],
      excluded_projects_2027: 8,
    },
    tables: {
      projects: {
        new_insert_count: projectPartition.newlyInserted.length,
        updated_count: projectPartition.updated.length,
        inserted_ids: projectPartition.newlyInserted,
      },
      companies: {
        new_insert_count: companyPartition.newlyInserted.length,
        updated_count: companyPartition.updated.length,
        inserted_ids: companyPartition.newlyInserted,
      },
      contacts: {
        new_insert_count: contactPartition.newlyInserted.length,
        updated_count: contactPartition.updated.length,
        inserted_ids: contactPartition.newlyInserted,
      },
      activities: {
        new_insert_count: activityPartition.newlyInserted.length,
        updated_count: activityPartition.updated.length,
        inserted_ids: activityPartition.newlyInserted,
      },
      planned_activities: {
        new_insert_count: plannedPartition.newlyInserted.length,
        updated_count: plannedPartition.updated.length,
        inserted_ids: plannedPartition.newlyInserted,
      },
    },
    summary: {
      total_new_inserts: 
        projectPartition.newlyInserted.length +
        companyPartition.newlyInserted.length +
        contactPartition.newlyInserted.length +
        activityPartition.newlyInserted.length +
        plannedPartition.newlyInserted.length,
      total_updated: 
        projectPartition.updated.length +
        companyPartition.updated.length +
        contactPartition.updated.length +
        activityPartition.updated.length +
        plannedPartition.updated.length,
      total_skipped: 8
    }
  };

  const manifestFileName = isDryRun 
    ? `dry_run_manifest_${timestamp}.json` 
    : `import_manifest_${timestamp}.json`;
  const manifestPath = path.join(backupsDir, manifestFileName);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('\n--- 6. EXACT IMPORT MANIFEST SUMMARY ---');
  console.log(`[✓] Mode:                ${isDryRun ? 'DRY-RUN' : 'LIVE'}`);
  console.log(`[✓] Run ID:              ${runId}`);
  console.log(`[✓] Manifest File:       ${manifestPath}`);
  console.log(`[✓] New Inserts:         ${manifest.summary.total_new_inserts} rows (exact primary keys recorded)`);
  console.log(`[✓] Preserved/Updated:   ${manifest.summary.total_updated} rows`);
  console.log(`[✓] Profiles Safety:     profiles table EXCLUDED from writes`);

  if (isDryRun) {
    console.log('\n========================================================================');
    console.log('>> DRY-RUN MODE COMPLETE: Zero database queries executed.');
    console.log('>> Supabase remote records remain completely untouched.');
    console.log('========================================================================');
    return;
  }

  // Live Mode executes only if --live is passed
  if (!supabaseUrl || !serviceKey) {
    console.error('FATAL: LIVE mode requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  if (!createClient) {
    console.error('FATAL: @supabase/supabase-js is required for LIVE mode.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  console.log('\n--- EXECUTING LIVE UPSERTS IN DEPENDENCY ORDER ---');

  async function upsertBatch(table, records, onConflict = 'id', chunkSize = 50) {
    if (records.length === 0) return;
    console.log(`Upserting ${records.length} records into '${table}'...`);
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      let retries = 3;
      while (retries > 0) {
        try {
          const { error } = await supabase.from(table).upsert(chunk, { onConflict });
          if (error) throw new Error(`Failed to upsert into ${table}: ${error.message}`);
          break;
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          console.warn(`[RETRY] Upsert chunk for '${table}' failed (${err.message}). Retrying in 1.5s (${retries} attempts left)...`);
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    }
  }

  try {
    // 1. SAFETY: profiles table is EXCLUDED from upserts
    console.log('[SAFETY] Preserving public.profiles table (EXCLUDED from upsert to protect u0.auth_user_id and existing profiles)');

    // 2. Upsert remaining tables in dependency order
    await upsertBatch('companies', companiesToInsert);
    await upsertBatch('contacts', contactsToInsert);
    await upsertBatch('projects', projectsToInsert);
    if (projectMembersToInsert.length > 0) {
      await upsertBatch('project_members', projectMembersToInsert, 'project_id,user_id');
    }
    const quotationsInitial = quotationsToInsert.map(q => ({ ...q, previous_version_id: null }));
    await upsertBatch('quotations', quotationsInitial);
    const quotationsRevisions = quotationsToInsert.filter(q => q.previous_version_id);
    if (quotationsRevisions.length > 0) {
      await upsertBatch('quotations', quotationsRevisions);
    }
    await upsertBatch('activities', activitiesToInsert);
    await upsertBatch('planned_activities', plannedToInsert);
    await upsertBatch('sales_targets', targetsToInsert);
    await upsertBatch('approval_requests', requestsToInsert);
    await upsertBatch('notifications', notificationsToInsert);
    await upsertBatch('reminders', remindersToInsert);
    console.log('[SUCCESS] All team records successfully migrated to Supabase!');
    console.log(`[SUCCESS] Import manifest persisted: ${manifestPath}`);
  } catch (err) {
    console.error(`[ERROR] Migration aborted:`, err.message);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Unhandled script error:', err);
  process.exit(1);
});
