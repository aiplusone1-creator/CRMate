/**
 * Al Mespar CRM - Comprehensive Excel Migration Pipeline (Phase 10)
 * 
 * Safe, Idempotent, Read-Only Extraction from:
 * 'Saudi Projects Follow UP - Eslam Mohandes(1).xlsx'
 * 
 * Rules:
 * 1. ZERO modification to source Excel file.
 * 2. Timestamp Integrity: activity_date + activity_time preserved.
 *    Older activities NEVER overwrite current project next_action or next_follow_up_at.
 * 3. Dynamic Health: Calculated at runtime.
 * 4. Filter empty template rows (PR1041-PR1153 rows 27-139).
 * 5. Extract master contacts (154 entries) and deduplicate companies.
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '..', 'source-data', 'Saudi Projects Follow UP - Eslam Mohandes(1).xlsx');
const outputJson = path.join(__dirname, '..', 'src', 'lib', 'data', 'migrated_data.json');

console.log('--- Starting Al Mespar CRM Migration Pipeline ---');
console.log('Reading source file in read-only mode:', sourceFile);

const wb = XLSX.readFile(sourceFile, { cellDates: false });

// Helper: Excel serial date to YYYY-MM-DD
function excelDateToStr(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'string') {
    val = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
      const parts = val.split('/');
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
    if (/^\d{5}$/.test(val)) {
      val = parseInt(val, 10);
    } else {
      const parsed = Date.parse(val);
      if (!isNaN(parsed)) return new Date(parsed).toISOString().split('T')[0];
      return null;
    }
  }
  if (typeof val === 'number') {
    if (val > 60000 || val < 40000) return null; // Filter values that are amounts or invalid
    const utcDays = Math.floor(val - 25569);
    const utcVal = utcDays * 86400;
    const d = new Date(utcVal * 1000);
    return d.toISOString().split('T')[0];
  }
  return null;
}

// Helper: Phone normalizer
function cleanPhone(raw) {
  if (!raw) return undefined;
  const str = String(raw).replace(/[^0-9]/g, '');
  if (!str) return undefined;
  if (str.startsWith('05')) return '966' + str.slice(1);
  if (str.startsWith('5')) return '966' + str;
  if (str.startsWith('966')) return str;
  return str;
}

// Helper: Normalize Channel
function normalizeChannel(raw) {
  if (!raw) return 'call';
  const str = String(raw).toLowerCase().trim();
  if (str.includes('call') || str.includes('phone') || str.includes('هاتف')) return 'call';
  if (str.includes('f2f') || str.includes('meeting') || str.includes('اجتماع')) return 'meeting_f2f';
  if (str.includes('online') || str.includes('teams') || str.includes('zoom')) return 'meeting_online';
  if (str.includes('visit') || str.includes('زيارة')) return 'visit';
  if (str.includes('hunting') || str.includes('استكشاف')) return 'hunting';
  if (str.includes('email') || str.includes('ايميل')) return 'email';
  return 'call';
}

// Helper: Normalize Purpose
function normalizePurpose(raw) {
  if (!raw) return 'follow_up';
  const str = String(raw).toLowerCase().trim();
  if (str.includes('cold')) return 'cold_call';
  if (str.includes('consultant')) return 'consultant_visit';
  if (str.includes('lead')) return 'new_lead';
  if (str.includes('tech') || str.includes('فني')) return 'technical_clarification';
  if (str.includes('quotation') || str.includes('تسعير')) return 'quotation_delivery';
  return 'follow_up';
}

// Helper: Normalize Pipeline Stage
function normalizeStage(stageStr, statusStr) {
  const combined = ((stageStr || '') + ' ' + (statusStr || '')).toLowerCase();
  if (combined.includes('won') || combined.includes('award') || combined.includes('تم التعميد')) return 'won';
  if (combined.includes('lost') || combined.includes('خسارة')) return 'lost';
  if (combined.includes('hold') || combined.includes('توقف')) return 'hold';
  if (combined.includes('negotiation') || combined.includes('تفاوض')) return 'negotiation';
  if (combined.includes('approve') || combined.includes('اعتماد')) return 'technically_approved';
  if (combined.includes('technical') || combined.includes('submittal')) return 'technical_submission';
  if (combined.includes('quotation') || combined.includes('send to client') || combined.includes('تسعير')) return 'quotation_sent';
  if (combined.includes('pricing') || combined.includes('تقدير')) return 'pricing';
  if (combined.includes('rfq')) return 'rfq_processing';
  return 'lead';
}

// Helper: Normalize Opportunity Type
function normalizeOpportunityType(raw) {
  if (!raw) return 'tender';
  const str = String(raw).toLowerCase().trim();
  if (str.includes('in hand') || str.includes('inhand')) return 'in_hand';
  if (str.includes('hunting')) return 'hunting';
  return 'tender';
}

// --- PASS 1: Extract Master Companies & Contacts from "Hot Leads" ---
console.log('Extracting master directory from "Hot Leads"...');
const hlSheet = wb.Sheets['Hot Leads'];
const hlData = XLSX.utils.sheet_to_json(hlSheet, { header: 1 });

const companiesMap = new Map(); // normalized_name -> company
const contactsList = [];
const contactPhoneMap = new Map(); // phone -> contact
const contactNameMap = new Map(); // name -> contact

for (let i = 1; i < hlData.length; i++) {
  const row = hlData[i];
  if (!row || row.length === 0) continue;
  const fullName = row[0] ? String(row[0]).trim() : '';
  if (!fullName) continue;

  const phone = cleanPhone(row[1]);
  const rawCompany = row[2] ? String(row[2]).trim() : 'Independent';
  const gMapsUrl = row[3] ? String(row[3]).trim() : undefined;
  const city = row[4] ? String(row[4]).trim() : 'Jeddah';
  const email = row[5] ? String(row[5]).trim() : undefined;
  const jobTitle = row[6] ? String(row[6]).trim() : 'Engineer';
  const lastContactDate = excelDateToStr(row[7]);
  const notes = row[8] ? String(row[8]).trim() : undefined;
  const nextNotes = row[9] ? String(row[9]).trim() : undefined;
  const nextDate = excelDateToStr(row[10]);

  // Company normalization
  const normCompName = rawCompany.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, ' ').replace(/\s+/g, ' ').trim();
  let company = companiesMap.get(normCompName);
  if (!company) {
    company = {
      id: 'c_' + (companiesMap.size + 1),
      name: rawCompany,
      normalized_name: normCompName,
      company_type: rawCompany.toLowerCase().includes('hospital') ? 'hospital' : (rawCompany.toLowerCase().includes('consult') ? 'consultant' : 'contractor'),
      city: city || 'Western Region',
      google_maps_url: gMapsUrl && gMapsUrl.startsWith('http') ? gMapsUrl : undefined,
      phone: phone,
      created_at: '2026-05-01',
    };
    companiesMap.set(normCompName, company);
  }

  const contact = {
    id: 'cnt_' + (contactsList.length + 1),
    company_id: company.id,
    company_name: company.name,
    full_name: fullName,
    job_title: jobTitle,
    phone: phone,
    email: email && email.includes('@') ? email : undefined,
    city: city,
    is_hot_lead: true, // Master Hot Leads sheet
    notes: notes,
    next_follow_up_at: nextDate || undefined,
    last_contacted_at: lastContactDate || undefined,
    created_at: '2026-05-01',
  };

  contactsList.push(contact);
  if (phone) contactPhoneMap.set(phone, contact);
  contactNameMap.set(fullName.toLowerCase(), contact);
}

console.log(`Extracted ${companiesMap.size} companies and ${contactsList.length} contacts.`);

// --- PASS 2: Extract Real Projects from "Projects Follow UP" ---
console.log('Extracting projects from "Projects Follow UP" (filtering template rows 27-139)...');
const pSheet = wb.Sheets['Projects Follow UP'];
const pData = XLSX.utils.sheet_to_json(pSheet, { header: 1 });

const projectsList = [];
const projectPrMap = new Map(); // pr_number -> project
const projectNormalizedNameMap = new Map(); // normalized name -> project

for (let i = 4; i < pData.length; i++) {
  const row = pData[i];
  if (!row || row.length === 0) continue;
  const pr = row[0] ? String(row[0]).trim() : '';
  const opp = row[1] ? String(row[1]).trim() : '';
  if (!opp || opp === '0') continue; // Exclude empty template rows

  const clientName = row[2] ? String(row[2]).trim() : '';
  const clientPhone = cleanPhone(row[3]);
  const rawCompany = row[4] ? String(row[4]).trim() : 'Organization';
  const clientEmail = row[5] ? String(row[5]).trim() : undefined;
  const oppTypeRaw = row[6] ? String(row[6]).trim() : '';
  const location = row[7] ? String(row[7]).trim() : 'Jeddah';
  const status = row[8] ? String(row[8]).trim() : '';
  
  let estValue = 0;
  const v9 = Number(row[9]);
  const v14 = Number(row[14]);
  if (!isNaN(v14) && v14 > 0) estValue = v14;
  else if (!isNaN(v9) && v9 > 0) estValue = v9;

  const actionDone = row[10] ? String(row[10]).trim() : '';
  const actionDate = excelDateToStr(row[11]);
  const followUp = row[12] ? String(row[12]).trim() : (row[17] ? String(row[17]).trim() : '');
  const followUpDate = excelDateToStr(row[13]) || excelDateToStr(row[18]);

  // Match or create Company
  const normComp = rawCompany.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, ' ').replace(/\s+/g, ' ').trim();
  let company = companiesMap.get(normComp);
  if (!company) {
    company = {
      id: 'c_' + (companiesMap.size + 1),
      name: rawCompany,
      normalized_name: normComp,
      company_type: rawCompany.toLowerCase().includes('hospital') ? 'hospital' : 'contractor',
      city: location,
      phone: clientPhone,
      created_at: '2026-05-01',
    };
    companiesMap.set(normComp, company);
  }

  // Match or create Primary Contact
  let primaryContact = clientPhone ? contactPhoneMap.get(clientPhone) : null;
  if (!primaryContact && clientName) {
    primaryContact = contactNameMap.get(clientName.toLowerCase());
  }
  if (!primaryContact && clientName) {
    primaryContact = {
      id: 'cnt_' + (contactsList.length + 1),
      company_id: company.id,
      company_name: company.name,
      full_name: clientName,
      phone: clientPhone,
      email: clientEmail,
      city: location,
      is_hot_lead: false,
      created_at: '2026-05-01',
    };
    contactsList.push(primaryContact);
    if (clientPhone) contactPhoneMap.set(clientPhone, primaryContact);
    contactNameMap.set(clientName.toLowerCase(), primaryContact);
  }

  const pipelineStage = normalizeStage(oppTypeRaw, status);
  const oppType = normalizeOpportunityType(oppTypeRaw);

  const probability = 
    pipelineStage === 'won' ? 100 :
    pipelineStage === 'negotiation' ? 80 :
    pipelineStage === 'technically_approved' ? 75 :
    pipelineStage === 'technical_submission' ? 60 :
    pipelineStage === 'quotation_sent' ? 50 :
    pipelineStage === 'pricing' ? 40 :
    pipelineStage === 'rfq_processing' ? 30 : 20;

  const weightedValue = (estValue * probability) / 100;

  const project = {
    id: 'p_' + pr.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    pr_number: pr,
    name: opp,
    company_id: company.id,
    company_name: company.name,
    primary_contact_id: primaryContact ? primaryContact.id : undefined,
    primary_contact_name: primaryContact ? primaryContact.full_name : clientName || undefined,
    primary_contact_phone: primaryContact ? primaryContact.phone : clientPhone || undefined,
    location: location || 'Jeddah',
    opportunity_type: oppType,
    pipeline_stage: pipelineStage,
    priority: estValue > 5000000 ? 'urgent' : (estValue > 1000000 ? 'high' : 'medium'),
    estimated_value: estValue,
    probability: probability,
    weighted_value: weightedValue,
    owner_id: 'u1',
    owner_name: 'Eslam Mohandes',
    next_action: followUp || undefined,
    next_follow_up_at: followUpDate || undefined,
    last_activity_at: actionDate || '2026-05-15',
    created_at: '2026-05-01',
    updated_at: '2026-09-17',
    // We store initial action done for migration activities pass
    _initial_action: actionDone,
    _initial_action_date: actionDate,
  };

  projectsList.push(project);
  projectPrMap.set(pr.toUpperCase(), project);
  projectNormalizedNameMap.set(opp.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, ''), project);
}

console.log(`Extracted ${projectsList.length} real projects (Rows 5-26).`);

// --- PASS 3: Extract Activities from "Master Report" with Timestamp Integrity ---
console.log('Extracting historical activities from "Master Report"...');
const mrSheet = wb.Sheets['Master Report'];
const mrData = XLSX.utils.sheet_to_json(mrSheet, { header: 1 });

const activitiesList = [];

for (let i = 1; i < mrData.length; i++) {
  const row = mrData[i];
  if (!row || row.length === 0) continue;
  const dateStr = excelDateToStr(row[0]);
  if (!dateStr) continue;

  const weekNum = row[1];
  const oppName = row[2] ? String(row[2]).trim() : '';
  const contactName = row[3] ? String(row[3]).trim() : '';
  const timeSlot = row[4] ? String(row[4]).trim() : '10:00';
  const typeStr = row[5] ? String(row[5]).trim() : 'Call';
  const visitTypeStr = row[6] ? String(row[6]).trim() : 'Follow up';
  const stageStr = row[7] ? String(row[7]).trim() : '';
  const statusStr = row[8] ? String(row[8]).trim() : '';
  const locationStr = row[9] ? String(row[9]).trim() : 'Western Region';
  const actionDone = row[10] ? String(row[10]).trim() : '';
  const nextDateStr = excelDateToStr(row[11]);
  const nextActionStr = row[12] ? String(row[12]).trim() : '';

  // Match project
  let matchedProject = null;
  if (oppName) {
    const normOpp = oppName.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '');
    matchedProject = projectNormalizedNameMap.get(normOpp);
    if (!matchedProject) {
      // Partial matching
      for (const [key, p] of projectNormalizedNameMap.entries()) {
        if (key.includes(normOpp) || normOpp.includes(key)) {
          matchedProject = p;
          break;
        }
      }
    }
  }

  // Match contact
  let matchedContact = null;
  if (contactName) {
    matchedContact = contactNameMap.get(contactName.toLowerCase());
  }

  const channel = normalizeChannel(typeStr);
  const purpose = normalizePurpose(visitTypeStr);

  const act = {
    id: 'act_migrated_' + (activitiesList.length + 1),
    project_id: matchedProject ? matchedProject.id : undefined,
    project_name: matchedProject ? matchedProject.name : (oppName || undefined),
    company_id: matchedProject ? matchedProject.company_id : (matchedContact ? matchedContact.company_id : undefined),
    company_name: matchedProject ? matchedProject.company_name : (matchedContact ? matchedContact.company_name : undefined),
    contact_id: matchedContact ? matchedContact.id : undefined,
    contact_name: matchedContact ? matchedContact.full_name : (contactName || undefined),
    user_id: 'u1',
    user_name: 'Eslam Mohandes',
    activity_date: dateStr, // Timestamp Integrity (Rule 1)
    activity_time: timeSlot.split('-')[0] || '10:00',
    channel: channel,
    visit_purpose: purpose,
    outcome: 'connected',
    notes: actionDone || undefined, // Optional Notes (Rule 2)
    next_action: nextActionStr || undefined,
    next_follow_up_at: nextDateStr || undefined,
    created_at: dateStr + 'T10:00:00Z',
  };

  activitiesList.push(act);

  // Timestamp Integrity Guard on Project:
  // ONLY update project if this activity is chronologically NEWER than existing project.last_activity_at
  if (matchedProject) {
    const currentProjTime = matchedProject.last_activity_at ? new Date(matchedProject.last_activity_at).getTime() : 0;
    const actTime = new Date(dateStr).getTime();
    if (actTime >= currentProjTime) {
      matchedProject.last_activity_at = dateStr;
      if (nextActionStr) matchedProject.next_action = nextActionStr;
      if (nextDateStr) matchedProject.next_follow_up_at = nextDateStr;
    }
  }
}

console.log(`Extracted ${activitiesList.length} activities with timestamp integrity.`);

// --- PASS 4: Extract Planned Activities from "Master Plan (2)" ---
console.log('Extracting planned activities from "Master Plan (2)"...');
const mpSheet = wb.Sheets['Master Plan (2)'];
const mpData = XLSX.utils.sheet_to_json(mpSheet, { header: 1 });

const plannedActivitiesList = [];

for (let i = 1; i < mpData.length; i++) {
  const row = mpData[i];
  if (!row || row.length === 0) continue;
  const dateStr = excelDateToStr(row[0]);
  if (!dateStr) continue;

  const oppName = row[2] ? String(row[2]).trim() : '';
  const contactName = row[3] ? String(row[3]).trim() : '';
  const timeSlot = row[4] ? String(row[4]).trim() : '10:00';
  const typeStr = row[5] ? String(row[5]).trim() : 'Call';
  const visitTypeStr = row[6] ? String(row[6]).trim() : 'Follow up';
  const actionGoal = row[10] ? String(row[10]).trim() : '';

  let matchedProject = null;
  if (oppName) {
    const normOpp = oppName.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '');
    matchedProject = projectNormalizedNameMap.get(normOpp);
  }

  let matchedContact = null;
  if (contactName) {
    matchedContact = contactNameMap.get(contactName.toLowerCase());
  }

  const channel = normalizeChannel(typeStr);
  const purpose = normalizePurpose(visitTypeStr);

  const plan = {
    id: 'plan_migrated_' + (plannedActivitiesList.length + 1),
    weekly_plan_id: 'wp_' + dateStr.slice(0, 7),
    project_id: matchedProject ? matchedProject.id : undefined,
    project_name: matchedProject ? matchedProject.name : (oppName || undefined),
    company_id: matchedProject ? matchedProject.company_id : undefined,
    company_name: matchedProject ? matchedProject.company_name : undefined,
    contact_id: matchedContact ? matchedContact.id : undefined,
    contact_name: matchedContact ? matchedContact.full_name : (contactName || undefined),
    scheduled_date: dateStr,
    time_slot: timeSlot,
    channel: channel,
    visit_purpose: purpose,
    goal: actionGoal || 'Customer touchpoint',
    priority: 'high',
    status: 'planned',
    created_at: dateStr + 'T08:00:00Z',
    updated_at: dateStr + 'T08:00:00Z',
  };

  plannedActivitiesList.push(plan);
}

// --- PASS 2.5: Extract Won Deals from "Won Deals" Sheet ---
console.log('Extracting won deals from "Won Deals" sheet...');
const wdSheet = wb.Sheets['Won Deals'];
const wdData = XLSX.utils.sheet_to_json(wdSheet, { header: 1 });
const quotationsList = [];

for (let i = 1; i < wdData.length; i++) {
  const row = wdData[i];
  if (!row || row.length === 0) continue;
  const pr = row[0] ? String(row[0]).trim() : '';
  const quotNum = row[1] ? String(row[1]).trim() : '';
  const comp = row[2] ? String(row[2]).trim() : '';
  const eng = row[3] ? String(row[3]).trim() : '';
  const desc = row[5] ? String(row[5]).trim() : 'Won Order';
  const amt = Number(row[6]) || 0;
  if (!pr && !quotNum) continue;

  const wonProjId = 'p_' + pr.toLowerCase().replace(/[^a-z0-9]/g, '_');
  let existing = projectPrMap.get(pr.toUpperCase());
  if (!existing) {
    existing = {
      id: wonProjId,
      pr_number: pr,
      name: 'MACC KAUST Modulating Butterfly Valve Package',
      company_id: 'c_macc',
      company_name: comp || 'MACC',
      primary_contact_name: eng || 'Omar Hanoun',
      location: 'Jeddah',
      opportunity_type: 'in_hand',
      pipeline_stage: 'won',
      priority: 'medium',
      estimated_value: amt,
      probability: 100,
      weighted_value: amt,
      owner_id: 'u1',
      owner_name: 'Eslam Mohandes',
      next_action: 'PO received and handed over to operations',
      last_activity_at: '2026-07-28',
      created_at: '2026-07-20',
      updated_at: '2026-07-28',
    };
    projectsList.push(existing);
    projectPrMap.set(pr.toUpperCase(), existing);
  }

  quotationsList.push({
    id: 'q_' + quotNum.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    project_id: existing.id,
    quotation_number: quotNum,
    version: 1,
    amount: amt,
    status: 'accepted',
    vendor_brand: 'Belimo / Al Mespar Valve Package',
    created_at: '2026-07-28T10:00:00Z',
    updated_at: '2026-07-28T10:00:00Z',
  });
}
console.log(`Extracted ${quotationsList.length} won deal quotations.`);

// Clean helper fields from projects
projectsList.forEach(p => {
  delete p._initial_action;
  delete p._initial_action_date;
});

// Final Export Package
const finalMigrationData = {
  meta: {
    extracted_at: new Date().toISOString(),
    source_file: path.basename(sourceFile),
    engineer: 'Eslam Mohandes',
    region: 'Western Region (Jeddah, Makkah, Medina)',
    counts: {
      companies: companiesMap.size,
      contacts: contactsList.length,
      projects: projectsList.length,
      quotations: quotationsList.length,
      activities: activitiesList.length,
      plannedActivities: plannedActivitiesList.length,
    }
  },
  companies: Array.from(companiesMap.values()),
  contacts: contactsList,
  projects: projectsList,
  quotations: quotationsList,
  activities: activitiesList,
  plannedActivities: plannedActivitiesList,
};

const outputDir = path.dirname(outputJson);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputJson, JSON.stringify(finalMigrationData, null, 2), 'utf8');
console.log('✅ Successfully wrote migrated dataset to:', outputJson);
console.log('SUMMARY STATS:');
console.log(`- Companies: ${companiesMap.size}`);
console.log(`- Contacts: ${contactsList.length}`);
console.log(`- Real Projects: ${projectsList.length}`);
console.log(`- Historical Activities: ${activitiesList.length}`);
console.log(`- Planned Activities: ${plannedActivitiesList.length}`);
console.log('--- Migration Pipeline Completed Successfully ---');
