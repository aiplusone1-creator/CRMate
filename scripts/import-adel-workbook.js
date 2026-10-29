/**
 * CRMate - Adel Nasr Workbook Importer to Supabase PostgreSQL
 * 
 * Target: Adel Nasr (u0)
 * Workbook: source-data/team-workbooks/Saudi Projects Follow UP - CRM Form - Adel Nasr.xlsx
 * 
 * Usage:
 *   node scripts/import-adel-workbook.js            (Dry-run by default)
 *   node scripts/import-adel-workbook.js --dry-run  (Explicit dry-run)
 *   node scripts/import-adel-workbook.js --live     (Live import to Supabase)
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// 1. Load .env.local
const envLocalPath = path.resolve('.env.local');
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
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

// Normalization utilities matching CRMate standards
function norm(s) {
  if (!s) return '';
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .replace(/\s+/g, ' ');
}

function slugify(s) {
  if (!s) return 'unnamed';
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'unnamed';
}

function normPhone(p) {
  if (!p) return null;
  const digits = String(p).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 9 && digits.startsWith('5')) return `966${digits}`;
  if (digits.length === 10 && digits.startsWith('05')) return `966${digits.slice(1)}`;
  if (digits.startsWith('966')) return digits;
  return digits;
}

function parseExcelDate(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  }
  return null;
}

function mapChannel(typeStr) {
  if (!typeStr) return 'office_work';
  const v = String(typeStr).toLowerCase();
  if (v.includes('call') || v.includes('phone') || v.includes('whatsapp') || v.includes('msg')) return 'call';
  if (v.includes('online')) return 'meeting_online';
  if (v.includes('f2f') || v.includes('meeting')) return 'meeting_f2f';
  if (v.includes('visit')) return 'visit';
  if (v.includes('hunting')) return 'hunting';
  if (v.includes('event')) return 'event';
  if (v.includes('email') || v.includes('mail')) return 'email';
  return 'office_work';
}

function mapVisitPurpose(visitStr) {
  const v = String(visitStr || '').trim().toLowerCase();
  if (v.includes('new lead')) return 'new_lead';
  if (v.includes('follow up') || v.includes('follow')) return 'follow_up';
  if (v.includes('cold call')) return 'cold_call';
  if (v.includes('consultant')) return 'consultant_visit';
  if (v.includes('visit') || v.includes('customer')) return 'customer_visit';
  if (v.includes('technical') || v.includes('clarification')) return 'technical_clarification';
  if (v.includes('quotation') || v.includes('delivery')) return 'quotation_delivery';
  return 'follow_up';
}

function mapOutcome(statusStr) {
  if (!statusStr) return null;
  const s = String(statusStr).toLowerCase();
  if (s.includes('won')) return 'won';
  if (s.includes('lost')) return 'lost';
  if (s.includes('hold')) return 'hold';
  if (s.includes('rfq')) return 'rfq_received';
  if (s.includes('send to client') || s.includes('quote')) return 'quotation_sent';
  if (s.includes('gather') || s.includes('info')) return 'connected';
  if (s.includes('meeting')) return 'meeting_booked';
  return null;
}

function mapPipelineStage(statusStr) {
  if (!statusStr) return 'lead';
  const s = String(statusStr).toLowerCase();
  if (s.includes('won') || s.includes('po') || s.includes('awarded')) return 'won';
  if (s.includes('lost') || s.includes('regret') || s.includes('cancelled')) return 'lost';
  if (s.includes('negotiat') || s.includes('target') || s.includes('discount')) return 'negotiation';
  if (s.includes('send to client') || s.includes('submitted') || s.includes('quote')) return 'submitted';
  if (s.includes('technical') || s.includes('submittal') || s.includes('compliance')) return 'technical_submission';
  if (s.includes('rfq') || s.includes('pricing') || s.includes('estimating')) return 'rfq_processing';
  if (s.includes('gather') || s.includes('qualif') || s.includes('info')) return 'qualification';
  return 'lead';
}

async function run() {
  const isLive = process.argv.includes('--live');
  const isDryRun = !isLive;

  console.log('========================================================================');
  console.log(`CRMate - Adel Nasr Workbook Importer [Mode: ${isDryRun ? 'DRY-RUN (Zero Remote Writes)' : 'LIVE (Supabase Upsert)'}]`);
  console.log('========================================================================');

  const wbPath = path.resolve('source-data/team-workbooks/Saudi Projects Follow UP - CRM Form - Adel Nasr.xlsx');
  if (!fs.existsSync(wbPath)) {
    console.error(`FATAL: Workbook not found at ${wbPath}`);
    process.exit(1);
  }
  console.log(`[✓] Workbook located: ${wbPath}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('FATAL: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    process.exit(1);
  }

  const sb = createClient(supabaseUrl, serviceKey);

  // 1. Verify Adel's existing profile in Supabase
  console.log('\n[1/6] Verifying Adel Nasr account in Supabase...');
  const { data: adelProfile, error: profErr } = await sb
    .from('profiles')
    .select('id, full_name, name_ar, email, role, auth_user_id')
    .eq('id', 'u0')
    .single();

  if (profErr || !adelProfile) {
    console.error('FATAL: Adel Nasr profile (u0) not found in Supabase:', profErr?.message);
    process.exit(1);
  }

  console.log(`  ✓ Found profile: ${adelProfile.id} | ${adelProfile.full_name} (${adelProfile.email})`);
  console.log(`  ✓ Linked Auth ID: ${adelProfile.auth_user_id || 'NONE'} (Will be strictly preserved)`);

  // 2. Fetch existing Supabase state
  console.log('\n[2/6] Querying existing remote tables for deduplication & PR sequencing...');
  
  // 2a. Fetch all projects to determine current global MAX PR and check collisions
  let from = 0;
  const pageSize = 1000;
  let existingProjects = [];
  while (true) {
    const { data: projs, error } = await sb
      .from('projects')
      .select('id, pr_number, name, owner_id, is_archived')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed to query projects: ${error.message}`);
    if (!projs || projs.length === 0) break;
    existingProjects = existingProjects.concat(projs);
    if (projs.length < pageSize) break;
    from += pageSize;
  }

  const existingProjectIds = new Set(existingProjects.map(p => p.id));
  const existingPrSet = new Set(existingProjects.map(p => p.pr_number).filter(Boolean));

  let maxPrNum = 0;
  existingProjects.forEach(p => {
    const m = (p.pr_number || '').match(/^PR(\d+)$/i);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num > maxPrNum) maxPrNum = num;
    }
  });

  console.log(`  ✓ Existing projects count: ${existingProjects.length}`);
  console.log(`  ✓ Highest PR number across entire CRM: PR${maxPrNum}`);

  // 2b. Fetch existing companies
  from = 0;
  let existingCompanies = [];
  while (true) {
    const { data: comps, error } = await sb
      .from('companies')
      .select('id, name, normalized_name, city, created_by')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed to query companies: ${error.message}`);
    if (!comps || comps.length === 0) break;
    existingCompanies = existingCompanies.concat(comps);
    if (comps.length < pageSize) break;
    from += pageSize;
  }
  const companyRegistry = new Map();
  const companyIds = new Set();
  existingCompanies.forEach(c => {
    companyRegistry.set(c.normalized_name, c);
    companyIds.add(c.id);
  });
  console.log(`  ✓ Existing companies count: ${existingCompanies.length}`);

  // 2c. Fetch existing contacts
  from = 0;
  let existingContacts = [];
  while (true) {
    const { data: cts, error } = await sb
      .from('contacts')
      .select('id, full_name, phone, normalized_phone, company_id, owner_id')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed to query contacts: ${error.message}`);
    if (!cts || cts.length === 0) break;
    existingContacts = existingContacts.concat(cts);
    if (cts.length < pageSize) break;
    from += pageSize;
  }
  const contactPhoneMap = new Map();
  const contactIds = new Set();
  existingContacts.forEach(ct => {
    contactIds.add(ct.id);
    if (ct.normalized_phone) contactPhoneMap.set(ct.normalized_phone, ct);
  });
  console.log(`  ✓ Existing contacts count: ${existingContacts.length}`);

  // 2d. Fetch existing activities and planned activities IDs
  const existingActivityIds = new Set();
  from = 0;
  while (true) {
    const { data: acts, error } = await sb.from('activities').select('id').range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed to query activities: ${error.message}`);
    if (!acts || acts.length === 0) break;
    acts.forEach(a => existingActivityIds.add(a.id));
    if (acts.length < pageSize) break;
    from += pageSize;
  }
  console.log(`  ✓ Existing activities count: ${existingActivityIds.size}`);

  const existingPlannedIds = new Set();
  from = 0;
  while (true) {
    const { data: plans, error } = await sb.from('planned_activities').select('id').range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed to query planned_activities: ${error.message}`);
    if (!plans || plans.length === 0) break;
    plans.forEach(p => existingPlannedIds.add(p.id));
    if (plans.length < pageSize) break;
    from += pageSize;
  }
  console.log(`  ✓ Existing planned activities count: ${existingPlannedIds.size}`);

  // 3. Parse Adel's Workbook
  console.log('\n[3/6] Reading and transforming Adel Nasr workbook...');
  const wb = xlsx.readFile(wbPath, { cellDates: true });

  // Manifest structures
  const manifest = {
    run_id: `adel_import_${Date.now()}`,
    timestamp: new Date().toISOString(),
    mode: isDryRun ? 'dry-run' : 'live',
    user: {
      id: adelProfile.id,
      name: adelProfile.full_name,
      email: adelProfile.email,
      auth_user_id: adelProfile.auth_user_id
    },
    tables: {
      companies: { inserted: [], matched: [], skipped: [] },
      contacts: { inserted: [], matched: [], skipped: [] },
      projects: { inserted: [], matched: [], skipped: [] },
      project_members: { inserted: [], matched: [], skipped: [] },
      activities: { inserted: [], matched: [], skipped: [] },
      planned_activities: { inserted: [], matched: [], skipped: [] },
    },
    pr_renumbering: []
  };

  const companiesToInsert = [];
  const contactsToInsert = [];
  const projectsToInsert = [];
  const projectMembersToInsert = [];
  const activitiesToInsert = [];
  const plannedToInsert = [];

  // Helper to get or create company
  function getOrCreateCompany(rawName, city) {
    if (!rawName) return null;
    const trimmed = String(rawName).trim();
    if (!trimmed || trimmed === '0' || trimmed.toLowerCase() === 'undefined') return null;
    const n = norm(trimmed);
    if (!n) return null;

    if (companyRegistry.has(n)) {
      const existing = companyRegistry.get(n);
      manifest.tables.companies.matched.push({
        rawName: trimmed,
        matchedId: existing.id,
        matchedName: existing.name
      });
      return existing;
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
      city: city || 'Riyadh',
      website: null,
      google_maps_url: null,
      phone: null,
      notes: `Imported from Adel Nasr workbook`,
      created_by: 'u0', // Exact ownership: Adel Nasr
      created_at: now,
      updated_at: now
    };

    companiesToInsert.push(newComp);
    companyIds.add(candidateId);
    companyRegistry.set(n, newComp);
    manifest.tables.companies.inserted.push(newComp.id);
    return newComp;
  }

  // 3a. Ingest Contacts from " Leads"
  console.log('  Parsing Contacts from " Leads" sheet...');
  const leadsSheetName = wb.SheetNames.find(s => s.trim().toLowerCase() === 'leads' || s.trim().toLowerCase() === 'hot leads');
  const contactLookup = new Map(); // norm(name) -> contact
  existingContacts.forEach(ct => {
    if (ct.owner_id === 'u0' && ct.full_name) {
      contactLookup.set(norm(ct.full_name), ct);
    }
  });
  let contactSeq = 0;

  if (leadsSheetName) {
    const lRows = xlsx.utils.sheet_to_json(wb.Sheets[leadsSheetName], { header: 1 });
    for (let i = 1; i < lRows.length; i++) {
      const r = lRows[i];
      if (!r) continue;
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

      if (!name && !companyName && !phone) continue;

      const comp = getOrCreateCompany(companyName, city);
      const nPhone = normPhone(phone);
      contactSeq++;
      const contactId = `ct_u0_l_${String(contactSeq).padStart(3, '0')}`;

      // Check if contact already exists by phone, name, or candidate ID
      let existing = null;
      if (nPhone && contactPhoneMap.has(nPhone)) {
        existing = contactPhoneMap.get(nPhone);
      } else if (name && contactLookup.has(norm(name))) {
        existing = contactLookup.get(norm(name));
      } else if (contactIds.has(contactId)) {
        existing = existingContacts.find(c => c.id === contactId);
      }

      if (existing) {
        if (name) contactLookup.set(norm(name), existing);
        if (nPhone) contactPhoneMap.set(nPhone, existing);
        manifest.tables.contacts.matched.push({
          rawName: name,
          phone: phone,
          matchedId: existing.id,
          matchedName: existing.full_name
        });
        continue;
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
        city: city || 'Riyadh',
        linkedin_url: null,
        is_hot_lead: true,
        notes: [notes, nextFollowNotes ? `Next: ${nextFollowNotes}` : null, mapsUrl ? `Map: ${mapsUrl}` : null]
          .filter(Boolean)
          .join(' | ') || null,
        owner_id: 'u0', // Adel Nasr
        project_ids: [],
        last_contacted_at: lastCall ? `${lastCall}T09:00:00Z` : null,
        next_follow_up_at: nextFollowDate ? `${nextFollowDate}T09:00:00Z` : null,
        created_at: now,
        updated_at: now
      };

      contactsToInsert.push(contactRecord);
      contactIds.add(contactId);
      if (nPhone) contactPhoneMap.set(nPhone, contactRecord);
      if (name) contactLookup.set(norm(name), contactRecord);
      manifest.tables.contacts.inserted.push(contactId);
    }
  }

  // 3b. Ingest Projects from "Projects Follow UP"
  console.log('  Parsing Projects from "Projects Follow UP" sheet...');
  const wsProjects = wb.Sheets['Projects Follow UP'];
  const pRows = xlsx.utils.sheet_to_json(wsProjects, { header: 1 });
  let nextPrCounter = maxPrNum;
  const projectLookup = new Map(); // norm(name) -> project

  for (let i = 4; i < pRows.length; i++) {
    const r = pRows[i];
    if (!r) continue;
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
    const actionDone = r[10] != null ? String(r[10]).trim() : '';
    const actionDate = parseExcelDate(r[11]);
    const followUpAction = r[12] != null ? String(r[12]).trim() : '';
    const followUpDate = parseExcelDate(r[13]);

    // Check if this is a populated row (ignore prefilled blank templates)
    const hasMeaningfulContent = opp || clientName || companyName || estVal > 0 || actionDone;
    if (!hasMeaningfulContent) continue;

    // Resolve project name (if Opportunity is empty, derive from company or client)
    const projectName = opp || (companyName ? `${companyName} Project` : `Project for ${clientName || 'Adel Nasr'}`);

    // Check if project already exists in Supabase
    const existingP = existingProjects.find(p => 
      p.id === 'p_pr1156' || 
      (p.owner_id === 'u0' && (p.name === projectName || norm(p.name) === norm(projectName)))
    );

    if (existingP) {
      manifest.tables.projects.matched.push({
        id: existingP.id,
        pr_number: existingP.pr_number,
        name: existingP.name
      });
      projectLookup.set(norm(projectName), existingP);
      if (companyName) projectLookup.set(norm(companyName), existingP);
      continue;
    }

    // Determine sequential PR number
    nextPrCounter++;
    const assignedPr = `PR${nextPrCounter}`;
    const projectId = `p_pr${nextPrCounter}`;

    manifest.pr_renumbering.push({
      original_pr: rawPr || 'NONE',
      assigned_pr: assignedPr,
      project_id: projectId,
      project_name: projectName,
      reason: rawPr ? `Renumbered from template PR (${rawPr}) to maintain continuous global sequential numbering after PR${maxPrNum}` : 'Assigned sequential PR to unnumbered project'
    });

    const comp = getOrCreateCompany(companyName, location || 'Riyadh');

    let contactId = null;
    if (clientName) {
      const ct = contactLookup.get(norm(clientName));
      if (ct) contactId = ct.id;
    }

    const now = new Date().toISOString();
    const projRecord = {
      id: projectId,
      pr_number: assignedPr,
      name: projectName,
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
      owner_id: 'u0', // Adel Nasr
      owner_name: 'Adel Nasr',
      next_action: followUpAction || actionDone || null,
      next_follow_up_at: followUpDate ? `${followUpDate}T09:00:00Z` : null,
      last_activity_at: actionDate ? `${actionDate}T09:00:00Z` : null,
      card_color: 'default',
      base_card_color: 'default',
      stage_entered_at: now,
      is_archived: false,
      internal_notes: rawPr ? `Source Workbook PR: ${rawPr}` : null,
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
    projectLookup.set(norm(projectName), projRecord);
    if (companyName) projectLookup.set(norm(companyName), projRecord);
    manifest.tables.projects.inserted.push(projectId);

    // Add project membership
    projectMembersToInsert.push({
      project_id: projectId,
      user_id: 'u0',
      role: 'sales_engineer',
      user_name: 'Adel Nasr',
      assigned_at: now
    });
    manifest.tables.project_members.inserted.push(`${projectId}::u0`);
  }

  // 3c. Ingest Activities from "Master Report"
  console.log('  Parsing Activities from "Master Report" sheet...');
  const wsMR = wb.Sheets['Master Report'];
  let actSeq = 0;
  if (wsMR) {
    const mrRows = xlsx.utils.sheet_to_json(wsMR, { header: 1 });
    for (let i = 1; i < mrRows.length; i++) {
      const r = mrRows[i];
      if (!r) continue;
      const d = parseExcelDate(r[0]);
      const opp = r[2] != null ? String(r[2]).trim() : '';
      const contact = r[3] != null ? String(r[3]).trim() : '';
      const period = r[4] != null ? String(r[4]).trim() : '';
      const type = r[5] != null ? String(r[5]).trim() : '';
      const visitType = r[6] != null ? String(r[6]).trim() : '';
      const stage = r[7] != null ? String(r[7]).trim() : '';
      const status = r[8] != null ? String(r[8]).trim() : '';
      const loc = r[9] != null ? String(r[9]).trim() : '';
      const action = r[10] != null ? String(r[10]).trim() : '';
      const followUpDate = parseExcelDate(r[11]);
      const followUpAction = r[12] != null ? String(r[12]).trim() : '';

      if (!opp && !contact && !action && !type && !visitType) continue;

      actSeq++;
      const actId = `act_u0_${String(actSeq).padStart(3, '0')}`;
      if (existingActivityIds.has(actId)) {
        manifest.tables.activities.matched.push({ id: actId });
        continue;
      }

      // Match project or company
      let matchedProj = null;
      if (opp) matchedProj = projectLookup.get(norm(opp));

      let matchedComp = null;
      if (opp && !matchedProj) {
        matchedComp = getOrCreateCompany(opp, loc || 'Riyadh');
      }

      let matchedContact = null;
      if (contact) {
        matchedContact = contactLookup.get(norm(contact));
      }

      activitiesToInsert.push({
        id: actId,
        project_id: matchedProj ? matchedProj.id : null,
        project_name: matchedProj ? matchedProj.name : (opp || null),
        company_id: matchedProj ? matchedProj.company_id : (matchedComp ? matchedComp.id : null),
        company_name: matchedProj ? matchedProj.company_name : (matchedComp ? matchedComp.name : null),
        contact_id: matchedContact ? matchedContact.id : null,
        contact_name: matchedContact ? matchedContact.full_name : (contact || null),
        user_id: 'u0', // Adel Nasr
        user_name: 'Adel Nasr',
        planned_activity_id: null,
        activity_date: d || new Date().toISOString().split('T')[0],
        activity_time: period || null,
        channel: mapChannel(type),
        visit_purpose: mapVisitPurpose(visitType),
        outcome: mapOutcome(status),
        notes: [status ? `Status: ${status}` : null, action].filter(Boolean).join(' | ') || null,
        location_name: loc || null,
        priority: 'medium',
        next_action: followUpAction || null,
        next_follow_up_at: followUpDate ? `${followUpDate}T09:00:00Z` : null,
        created_at: d ? `${d}T10:00:00Z` : new Date().toISOString()
      });
      manifest.tables.activities.inserted.push(actId);
    }
  }

  // 3d. Ingest Planned Activities from "Master Plan"
  console.log('  Parsing Planned Activities from "Master Plan" sheet...');
  const wsMP = wb.Sheets['Master Plan'];
  let planSeq = 0;
  if (wsMP) {
    const mpRows = xlsx.utils.sheet_to_json(wsMP, { header: 1 });
    for (let i = 1; i < mpRows.length; i++) {
      const r = mpRows[i];
      if (!r) continue;
      const d = parseExcelDate(r[0]);
      const opp = r[2] != null ? String(r[2]).trim() : '';
      const contact = r[3] != null ? String(r[3]).trim() : '';
      const period = r[4] != null ? String(r[4]).trim() : '';
      const type = r[5] != null ? String(r[5]).trim() : '';
      const visitType = r[6] != null ? String(r[6]).trim() : '';
      const loc = r[9] != null ? String(r[9]).trim() : '';
      const action = r[10] != null ? String(r[10]).trim() : '';

      if (!opp && !contact && !action && !type && !visitType) continue;

      planSeq++;
      const planId = `plan_u0_${String(planSeq).padStart(3, '0')}`;
      if (existingPlannedIds.has(planId)) {
        manifest.tables.planned_activities.matched.push({ id: planId });
        continue;
      }

      let matchedProj = null;
      if (opp) matchedProj = projectLookup.get(norm(opp));

      let matchedComp = null;
      if (opp && !matchedProj) {
        matchedComp = getOrCreateCompany(opp, loc || 'Riyadh');
      }

      let matchedContact = null;
      if (contact) {
        matchedContact = contactLookup.get(norm(contact));
      }

      plannedToInsert.push({
        id: planId,
        weekly_plan_id: 'plan_default',
        user_id: 'u0', // Adel Nasr
        user_name: 'Adel Nasr',
        project_id: matchedProj ? matchedProj.id : null,
        project_name: matchedProj ? matchedProj.name : (opp || null),
        company_id: matchedProj ? matchedProj.company_id : (matchedComp ? matchedComp.id : null),
        company_name: matchedProj ? matchedProj.company_name : (matchedComp ? matchedComp.name : null),
        contact_id: matchedContact ? matchedContact.id : null,
        contact_name: matchedContact ? matchedContact.full_name : (contact || null),
        location_name: loc || null,
        custom_target: null,
        scheduled_date: d || new Date().toISOString().split('T')[0],
        channel: mapChannel(type),
        visit_purpose: mapVisitPurpose(visitType),
        goal: action || 'Follow up with client',
        priority: 'medium',
        status: 'planned',
        is_auto_suggested: false,
        is_follow_up: false,
        created_at: d ? `${d}T09:00:00Z` : new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      manifest.tables.planned_activities.inserted.push(planId);
    }
  }

  // Summary counts
  console.log('\n[4/6] Transformation Summary:');
  console.log(`  - New Companies to insert: ${companiesToInsert.length} (Matched existing: ${manifest.tables.companies.matched.length})`);
  console.log(`  - New Contacts to insert:  ${contactsToInsert.length} (Matched existing: ${manifest.tables.contacts.matched.length})`);
  console.log(`  - Projects to insert:      ${projectsToInsert.length}`);
  console.log(`  - Project Members:         ${projectMembersToInsert.length}`);
  console.log(`  - Activities to insert:    ${activitiesToInsert.length}`);
  console.log(`  - Planned Activities:      ${plannedToInsert.length}`);
  console.log(`  - PR Renumbering count:    ${manifest.pr_renumbering.length}`);
  if (manifest.pr_renumbering.length > 0) {
    manifest.pr_renumbering.forEach(p => {
      console.log(`     * ${p.original_pr} -> ${p.assigned_pr}: "${p.project_name}" (ID: ${p.project_id})`);
    });
  }

  // 4. Save manifest locally
  const backupsDir = path.resolve('backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  const manifestFilename = `adel_import_manifest_${manifest.run_id}.json`;
  const manifestPath = path.join(backupsDir, manifestFilename);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\n[✓] Manifest generated at: ${manifestPath}`);

  // 5. If Dry-Run, exit safely with full report
  if (isDryRun) {
    console.log('\n========================================================================');
    console.log('DRY-RUN VALIDATION SUCCESSFUL: Zero remote database mutations performed.');
    console.log('To execute live import, run:');
    console.log('  node scripts/import-adel-workbook.js --live');
    console.log('========================================================================\n');
    return;
  }

  // 6. Live Import Execution (Staged in correct foreign key order)
  console.log('\n[5/6] EXECUTING LIVE SUPABASE UPSERT IN STAGED ORDER...');

  // Helper chunk upsert
  async function upsertBatch(table, items) {
    if (!items || items.length === 0) return;
    const chunkSize = 200;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const { error } = await sb.from(table).upsert(chunk, { onConflict: table === 'project_members' ? 'project_id,user_id' : 'id' });
      if (error) {
        throw new Error(`Failed to upsert into ${table} (chunk ${i / chunkSize + 1}): ${error.message}`);
      }
    }
  }

  // Step 1: Companies
  console.log(`  Writing ${companiesToInsert.length} companies to Supabase...`);
  await upsertBatch('companies', companiesToInsert);

  // Step 2: Contacts
  console.log(`  Writing ${contactsToInsert.length} contacts to Supabase...`);
  await upsertBatch('contacts', contactsToInsert);

  // Step 3: Projects
  console.log(`  Writing ${projectsToInsert.length} projects to Supabase...`);
  await upsertBatch('projects', projectsToInsert);

  // Step 4: Project Members
  console.log(`  Writing ${projectMembersToInsert.length} project members to Supabase...`);
  await upsertBatch('project_members', projectMembersToInsert);

  // Step 5: Activities
  console.log(`  Writing ${activitiesToInsert.length} activities to Supabase...`);
  await upsertBatch('activities', activitiesToInsert);

  // Step 6: Planned Activities
  console.log(`  Writing ${plannedToInsert.length} planned activities to Supabase...`);
  await upsertBatch('planned_activities', plannedToInsert);

  console.log('\n[6/6] LIVE IMPORT COMPLETED SUCCESSFULLY!');
  console.log('All Adel Nasr records have been durably stored in Supabase.');
  console.log(`Manifest: ${manifestPath}\n`);
}

run().catch(err => {
  console.error('\nFATAL IMPORT ERROR:', err);
  process.exit(1);
});
