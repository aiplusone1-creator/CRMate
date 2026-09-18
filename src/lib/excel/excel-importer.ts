import * as XLSX from 'xlsx';
import { 
  Project, 
  Contact, 
  Company, 
  Activity, 
  PlannedActivity, 
  Quotation, 
  OpportunityType, 
  PipelineStage, 
  ProjectPriority, 
  ActivityChannel, 
  VisitPurpose,
  ProjectHealth
} from '@/types/crm';
import { computeProjectHealth } from '@/lib/utils';

export interface ParsedExcelResult {
  success: boolean;
  projects: Project[];
  companies: Company[];
  contacts: Contact[];
  activities: Activity[];
  plannedActivities: PlannedActivity[];
  quotations: Quotation[];
  summary: {
    fileName: string;
    sheetNames: string[];
    totalProjects: number;
    totalCompanies: number;
    totalContacts: number;
    totalHotLeads: number;
    totalActivities: number;
    totalPlannedActivities: number;
    totalQuotations: number;
    totalEstimatedValueSAR: number;
    totalWonValueSAR: number;
    warnings: string[];
  };
}

export interface ParseOptions {
  targetUserId: string;
  targetUserName: string;
  fileName?: string;
}

// -----------------------------------------------------------------------------
// Format Helpers
// -----------------------------------------------------------------------------

export function parseExcelDate(val: unknown): string | undefined {
  if (val === null || val === undefined || val === '') return undefined;

  // Handle Excel serial date numbers (e.g. 46126)
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return undefined;
    const utc_days = Math.floor(val - 25569);
    const date_info = new Date(utc_days * 86400 * 1000);
    if (!isNaN(date_info.getTime())) {
      return date_info.toISOString().split('T')[0];
    }
  }

  // Handle Strings
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '-' || trimmed === '--' || trimmed.toLowerCase() === 'na') {
      return undefined;
    }

    // Check if numeric string serial
    const num = Number(trimmed);
    if (!isNaN(num) && num > 30000 && num < 60000) {
      return parseExcelDate(num);
    }

    // Check DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
    const parts = trimmed.split(/[\/\-\.]/);
    if (parts.length === 3) {
      let y = parseInt(parts[2], 10);
      let m = parseInt(parts[1], 10);
      let d = parseInt(parts[0], 10);

      // In case format is YYYY-MM-DD
      if (parts[0].length === 4) {
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
      }

      if (y < 100) y += 2000;
      if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    // Try standard JS Date parsing as fallback
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
  }

  // Handle Date instance
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  return undefined;
}

export function cleanPhone(val: unknown): string | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  let str = String(val).trim();
  // Strip trailing .0 from number conversion
  if (str.endsWith('.0')) str = str.slice(0, -2);
  // Remove non-alphanumeric except + and -
  str = str.replace(/[^\d+]/g, '');
  if (!str || str === '0' || str === '00' || str === '--') return undefined;
  return str;
}

export function cleanNumber(val: unknown, defaultValue = 0): number {
  if (val === null || val === undefined || val === '') return defaultValue;
  if (typeof val === 'number') return isNaN(val) ? defaultValue : val;
  const str = String(val).replace(/[^\d.-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? defaultValue : num;
}

export function mapOpportunityType(val: unknown): OpportunityType {
  const str = String(val || '').toLowerCase().trim();
  if (str.includes('tender')) return 'tender';
  if (str.includes('hand') || str.includes('in hand') || str.includes('in-hand')) return 'in_hand';
  if (str.includes('lead')) return 'new_lead';
  if (str.includes('upgrade') || str.includes('retrofit')) return 'upgrade_retrofit';
  if (str.includes('account') || str.includes('existing')) return 'existing_account';
  if (str.includes('hunting')) return 'hunting_potential';
  return 'in_hand';
}

export function mapPipelineStage(val: unknown): PipelineStage {
  const str = String(val || '').toLowerCase().trim();
  if (str.includes('won') || str.includes('closed won')) return 'won';
  if (str.includes('lost')) return 'lost';
  if (str.includes('hold')) return 'hold';
  if (str.includes('negotiat')) return 'negotiation';
  if (str.includes('send to client') || str.includes('sent') || str.includes('quotation sent')) return 'quotation_sent';
  if (str.includes('approved') || str.includes('technically approved')) return 'technically_approved';
  if (str.includes('submission') || str.includes('technical submission')) return 'technical_submission';
  if (str.includes('pricing') || str.includes('boq')) return 'pricing';
  if (str.includes('rfq')) return 'rfq_processing';
  if (str.includes('qualif')) return 'qualification';
  if (str.includes('gather') || str.includes('lead') || str.includes('info')) return 'lead';
  return 'lead';
}

export function calculateProbability(stage: PipelineStage): number {
  switch (stage) {
    case 'won': return 100;
    case 'negotiation': return 85;
    case 'technically_approved': return 75;
    case 'technical_submission': return 60;
    case 'quotation_sent': return 50;
    case 'pricing': return 40;
    case 'rfq_processing': return 30;
    case 'qualification': return 25;
    case 'lead': return 20;
    case 'hold': return 10;
    case 'lost': return 0;
    default: return 20;
  }
}

export function mapActivityChannel(typeStr: unknown): ActivityChannel {
  const s = String(typeStr || '').toLowerCase().trim();
  if (s.includes('call') && !s.includes('cold')) return 'call';
  if (s.includes('online')) return 'meeting_online';
  if (s.includes('f2f') || s.includes('meeting')) return 'meeting_f2f';
  if (s.includes('hunt')) return 'hunting';
  if (s.includes('office') || s.includes('stuff')) return 'office_work';
  if (s.includes('event')) return 'event';
  if (s.includes('visit')) return 'visit';
  if (s.includes('email')) return 'email';
  return 'call';
}

export function mapVisitPurpose(purposeStr: unknown): VisitPurpose {
  const s = String(purposeStr || '').toLowerCase().trim();
  if (s.includes('cold')) return 'cold_call';
  if (s.includes('follow') || s.includes('update')) return 'follow_up';
  if (s.includes('new') || s.includes('lead')) return 'new_lead';
  if (s.includes('consultant')) return 'consultant_visit';
  if (s.includes('customer') || s.includes('client')) return 'customer_visit';
  if (s.includes('quote') || s.includes('quotation')) return 'quotation_delivery';
  if (s.includes('clarif') || s.includes('tech')) return 'technical_clarification';
  return 'follow_up';
}

// -----------------------------------------------------------------------------
// Sheet Identification and Row Finders
// -----------------------------------------------------------------------------

function findHeaderRow(rows: any[][], keywords: string[]): { headerRowIdx: number; headerMap: Record<string, number> } {
  let bestRowIdx = 0;
  let bestMatchCount = -1;
  let bestMap: Record<string, number> = {};

  for (let r = 0; r < Math.min(15, rows.length); r++) {
    const row = rows[r];
    if (!row || !Array.isArray(row)) continue;

    let matchedKeywords = 0;
    const map: Record<string, number> = {};

    row.forEach((cell, idx) => {
      if (cell !== null && cell !== undefined) {
        const str = String(cell).trim().toLowerCase();
        map[str] = idx;
        for (const kw of keywords) {
          if (str === kw.toLowerCase() || str.includes(kw.toLowerCase())) {
            matchedKeywords++;
            break;
          }
        }
      }
    });

    if (matchedKeywords > bestMatchCount) {
      bestMatchCount = matchedKeywords;
      bestRowIdx = r;
      bestMap = map;
    }
  }

  return { headerRowIdx: bestRowIdx, headerMap: bestMap };
}

function getCell(row: any[], headerMap: Record<string, number>, possibleNames: string[]): any {
  for (const name of possibleNames) {
    const key = name.toLowerCase();
    // Direct exact match
    if (headerMap[key] !== undefined) {
      return row[headerMap[key]];
    }
    // Partial inclusion
    for (const [hKey, idx] of Object.entries(headerMap)) {
      if (hKey.includes(key) || key.includes(hKey)) {
        return row[idx];
      }
    }
  }
  return undefined;
}

// -----------------------------------------------------------------------------
// Main Workbook Parser
// -----------------------------------------------------------------------------

export function parseExcelWorkbook(
  buffer: ArrayBuffer | Uint8Array, 
  options: ParseOptions
): ParsedExcelResult {
  const { targetUserId, targetUserName, fileName = 'Workbook.xlsx' } = options;
  const warnings: string[] = [];

  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetNames = wb.SheetNames;

  const projects: Project[] = [];
  const companiesMap = new Map<string, Company>();
  const contactsMap = new Map<string, Contact>();
  const activities: Activity[] = [];
  const plannedActivities: PlannedActivity[] = [];
  const quotations: Quotation[] = [];

  let totalEstimatedValueSAR = 0;
  let totalWonValueSAR = 0;

  // Helper to ensure company exists
  const getOrCreateCompany = (rawName: string, defaults?: Partial<Company>): Company => {
    const cleanName = rawName.trim();
    const norm = cleanName.toLowerCase();
    if (companiesMap.has(norm)) {
      const existing = companiesMap.get(norm)!;
      if (defaults?.google_maps_url && !existing.google_maps_url) {
        existing.google_maps_url = defaults.google_maps_url;
      }
      if (defaults?.city && !existing.city) {
        existing.city = defaults.city;
      }
      return existing;
    }

    const newCompany: Company = {
      id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      normalized_name: norm,
      company_type: 'contractor',
      city: defaults?.city || 'Jeddah',
      google_maps_url: defaults?.google_maps_url,
      phone: defaults?.phone,
      created_by: targetUserId,
      created_at: new Date().toISOString().split('T')[0]
    };
    companiesMap.set(norm, newCompany);
    return newCompany;
  };

  // Helper to ensure contact exists
  const getOrCreateContact = (
    fullName: string, 
    company?: Company, 
    defaults?: Partial<Contact>
  ): Contact => {
    const cleanName = fullName.trim();
    const phone = defaults?.phone ? cleanPhone(defaults.phone) : undefined;
    const norm = (cleanName + (phone || '')).toLowerCase();

    if (contactsMap.has(norm)) {
      const existing = contactsMap.get(norm)!;
      if (defaults?.is_hot_lead) existing.is_hot_lead = true;
      if (defaults?.email && !existing.email) existing.email = defaults.email;
      if (defaults?.job_title && !existing.job_title) existing.job_title = defaults.job_title;
      if (defaults?.notes && !existing.notes) existing.notes = defaults.notes;
      if (defaults?.next_follow_up_at && !existing.next_follow_up_at) {
        existing.next_follow_up_at = defaults.next_follow_up_at;
      }
      return existing;
    }

    const newContact: Contact = {
      id: `cont_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      company_id: company?.id,
      company_name: company?.name,
      full_name: cleanName,
      job_title: defaults?.job_title || 'Project Contact',
      phone: phone,
      email: defaults?.email,
      city: defaults?.city || company?.city,
      is_hot_lead: !!defaults?.is_hot_lead,
      notes: defaults?.notes,
      owner_id: targetUserId,
      last_contacted_at: defaults?.last_contacted_at,
      next_follow_up_at: defaults?.next_follow_up_at,
      created_at: new Date().toISOString().split('T')[0]
    };
    contactsMap.set(norm, newContact);
    return newContact;
  };

  // ---------------------------------------------------------------------------
  // 1. Process "Projects Follow UP" Sheet
  // ---------------------------------------------------------------------------
  const projectSheetName = sheetNames.find(n => 
    n.toLowerCase().includes('project') && n.toLowerCase().includes('follow')
  ) || sheetNames.find(n => n.toLowerCase().includes('project'));

  if (projectSheetName && wb.Sheets[projectSheetName]) {
    const ws = wb.Sheets[projectSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    const { headerRowIdx, headerMap } = findHeaderRow(rows, [
      'pr', 'opportunity', 'client', 'company', 'stage', 'status'
    ]);

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const rawPr = getCell(row, headerMap, ['#pr', 'pr', 'pr number', 'code']);
      const rawOpp = getCell(row, headerMap, ['opportunity', 'project name', 'project', 'title']);
      const rawClient = getCell(row, headerMap, ['client name', 'client', 'contact name', 'contact']);
      const rawPhone = getCell(row, headerMap, ['client phone number', 'phone number', 'phone', 'mobile']);
      const rawCompany = getCell(row, headerMap, ['company name', 'company', 'client company']);
      const rawEmail = getCell(row, headerMap, ['client email', 'email', 'e-mail']);
      const rawStage = getCell(row, headerMap, ['project stage', 'stage', 'type']);
      const rawLocation = getCell(row, headerMap, ['project location', 'location', 'city', 'area']);
      const rawStatus = getCell(row, headerMap, ['status', 'pipeline stage']);
      const rawValue = getCell(row, headerMap, ['est. value (sar)', 'est. value', 'value', 'amount']);
      const rawActionDone = getCell(row, headerMap, ['action done', 'action', 'last action']);
      const rawActionDate = getCell(row, headerMap, ['action date', 'last action date', 'date']);
      const rawFollowUp = getCell(row, headerMap, ['current follow up', 'follow up', 'next follow up']);
      const rawFollowUpDate = getCell(row, headerMap, ['current follow up date', 'follow up date', 'next follow up date']);

      // Require at least project name or PR number
      if (!rawOpp && !rawPr) continue;

      const prNumber = rawPr ? String(rawPr).trim() : `PR-${1000 + projects.length}`;
      const projectName = rawOpp ? String(rawOpp).trim() : `Project ${prNumber}`;

      // Skip summary / KPI rows that might be in the sheet
      if (
        prNumber.toLowerCase().startsWith('no.') || 
        prNumber.toLowerCase().startsWith('total') || 
        prNumber.toLowerCase().startsWith('quality') ||
        projectName.toLowerCase().startsWith('no.') ||
        projectName.toLowerCase().startsWith('total') ||
        projectName.toLowerCase().startsWith('quality')
      ) {
        continue;
      }
      const companyName = rawCompany ? String(rawCompany).trim() : 'Private Client / Individual';
      const clientName = rawClient ? String(rawClient).trim() : 'Project Representative';
      const clientPhone = cleanPhone(rawPhone);
      const clientEmail = (rawEmail && String(rawEmail).trim() !== '0' && String(rawEmail).trim() !== '--') 
        ? String(rawEmail).trim() 
        : undefined;

      const location = rawLocation ? String(rawLocation).trim() : 'Jeddah';
      const oppType = mapOpportunityType(rawStage);
      const stage = mapPipelineStage(rawStatus);
      const estValue = cleanNumber(rawValue);
      const probability = calculateProbability(stage);
      const weightedValue = Math.round(estValue * (probability / 100));

      const actionDone = rawActionDone ? String(rawActionDone).trim() : undefined;
      const actionDate = parseExcelDate(rawActionDate);
      const nextFollowUp = rawFollowUp ? String(rawFollowUp).trim() : undefined;
      const nextFollowUpDate = parseExcelDate(rawFollowUpDate);

      // Create or update company & contact
      const company = getOrCreateCompany(companyName, { city: location, phone: clientPhone });
      const contact = getOrCreateContact(clientName, company, {
        phone: clientPhone,
        email: clientEmail,
        city: location,
        last_contacted_at: actionDate,
        next_follow_up_at: nextFollowUpDate,
        notes: actionDone
      });

      const projectId = `proj_${prNumber.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const project: Project = {
        id: projectId,
        pr_number: prNumber,
        name: projectName,
        company_id: company.id,
        company_name: company.name,
        primary_contact_id: contact.id,
        primary_contact_name: contact.full_name,
        primary_contact_phone: contact.phone,
        location: location,
        opportunity_type: oppType,
        pipeline_stage: stage,
        priority: estValue > 1000000 || stage === 'negotiation' ? 'urgent' : estValue > 250000 ? 'high' : 'medium',
        estimated_value: estValue,
        probability: probability,
        weighted_value: weightedValue,
        owner_id: targetUserId,
        owner_name: targetUserName,
        next_action: nextFollowUp || actionDone,
        next_follow_up_at: nextFollowUpDate,
        last_activity_at: actionDate,
        internal_notes: actionDone ? `[Log]: ${actionDone}` : undefined,
        created_at: actionDate || new Date().toISOString().split('T')[0],
        updated_at: nextFollowUpDate || new Date().toISOString().split('T')[0]
      };

      const { health, daysOverdue } = computeProjectHealth(project);
      project.calculated_health = health;
      project.days_overdue = daysOverdue;

      projects.push(project);
      totalEstimatedValueSAR += estValue;

      // Also create an Activity log if Action Done exists
      if (actionDone && actionDate) {
        activities.push({
          id: `act_${projectId}_${Date.now()}_${activities.length}`,
          project_id: project.id,
          project_name: project.name,
          company_id: company.id,
          company_name: company.name,
          contact_id: contact.id,
          contact_name: contact.full_name,
          user_id: targetUserId,
          user_name: targetUserName,
          activity_date: actionDate,
          channel: 'call',
          visit_purpose: 'follow_up',
          notes: actionDone,
          next_action: nextFollowUp,
          next_follow_up_at: nextFollowUpDate,
          location_name: location,
          created_at: actionDate
        });
      }
    }
  } else {
    warnings.push('Projects Follow UP sheet was not found. Looked for sheets matching "Projects" or "Follow UP".');
  }

  // ---------------------------------------------------------------------------
  // 2. Process "Hot Leads" Sheet
  // ---------------------------------------------------------------------------
  const hotLeadsSheetName = sheetNames.find(n => 
    n.toLowerCase().includes('hot') || n.toLowerCase().includes('lead')
  );

  let totalHotLeadsCount = 0;
  if (hotLeadsSheetName && wb.Sheets[hotLeadsSheetName]) {
    const ws = wb.Sheets[hotLeadsSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    const { headerRowIdx, headerMap } = findHeaderRow(rows, [
      'name', 'phone', 'company', 'position', 'last call'
    ]);

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const rawName = getCell(row, headerMap, ['name', 'contact name', 'person']);
      if (!rawName) continue;

      const rawPhone = getCell(row, headerMap, ['phone', 'mobile', 'cell']);
      const rawCompany = getCell(row, headerMap, ['company', 'firm', 'organization']);
      const rawMapUrl = getCell(row, headerMap, ['google map location', 'maps', 'location url', 'map']);
      const rawCity = getCell(row, headerMap, ['company based on', 'city', 'location']);
      const rawEmail = getCell(row, headerMap, ['email', 'mail']);
      const rawPosition = getCell(row, headerMap, ['position', 'title', 'role']);
      const rawLastCall = getCell(row, headerMap, ['last call date', 'last call', 'last date']);
      const rawNotes = getCell(row, headerMap, ['notes', 'remarks', 'comment']);
      const rawNextNotes = getCell(row, headerMap, ['next follow up notes', 'next follow up', 'action required', 'current action required']);
      const rawNextDate = getCell(row, headerMap, ['next follow up date', 'current action date', 'next date']);

      const companyName = rawCompany ? String(rawCompany).trim() : 'General Market Lead';
      const city = rawCity ? String(rawCity).trim() : 'Jeddah';
      const mapUrl = rawMapUrl && String(rawMapUrl).startsWith('http') ? String(rawMapUrl).trim() : undefined;

      const company = getOrCreateCompany(companyName, {
        city: city,
        google_maps_url: mapUrl,
      });

      const lastCallDate = parseExcelDate(rawLastCall);
      const nextDate = parseExcelDate(rawNextDate);

      let combinedNotes = '';
      if (rawNotes && String(rawNotes).trim() !== 'Na') combinedNotes += String(rawNotes).trim();
      if (rawNextNotes && String(rawNextNotes).trim() !== 'Na' && String(rawNextNotes).trim() !== combinedNotes) {
        combinedNotes += (combinedNotes ? ' | Next Action: ' : '') + String(rawNextNotes).trim();
      }

      const emailVal = (rawEmail && String(rawEmail).trim() !== '--' && String(rawEmail).trim() !== '0')
        ? String(rawEmail).trim()
        : undefined;

      const contact = getOrCreateContact(String(rawName), company, {
        phone: cleanPhone(rawPhone),
        email: emailVal,
        job_title: rawPosition ? String(rawPosition).trim() : 'Procurement / Engineering',
        city: city,
        is_hot_lead: true,
        last_contacted_at: lastCallDate,
        next_follow_up_at: nextDate,
        notes: combinedNotes || undefined
      });

      totalHotLeadsCount++;

      // If last call date and notes exist, log as activity
      if (lastCallDate && combinedNotes) {
        activities.push({
          id: `act_hl_${Date.now()}_${activities.length}`,
          company_id: company.id,
          company_name: company.name,
          contact_id: contact.id,
          contact_name: contact.full_name,
          user_id: targetUserId,
          user_name: targetUserName,
          activity_date: lastCallDate,
          channel: 'call',
          visit_purpose: 'cold_call',
          notes: combinedNotes,
          next_action: rawNextNotes ? String(rawNextNotes).trim() : undefined,
          next_follow_up_at: nextDate,
          location_name: city,
          created_at: lastCallDate
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Process "Master Report" Sheet (Activities Log)
  // ---------------------------------------------------------------------------
  const reportSheetName = sheetNames.find(n => 
    n.toLowerCase().includes('master report') || n.toLowerCase() === 'report' || n.toLowerCase().includes('report')
  );

  if (reportSheetName && wb.Sheets[reportSheetName]) {
    const ws = wb.Sheets[reportSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    const { headerRowIdx, headerMap } = findHeaderRow(rows, [
      'date', 'opportunity', 'contact', 'type', 'action'
    ]);

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const rawDate = getCell(row, headerMap, ['date']);
      const rawOpp = getCell(row, headerMap, ['opportunity', 'project']);
      const rawContact = getCell(row, headerMap, ['contact', 'client']);
      const rawPeriod = getCell(row, headerMap, ['period', 'time']);
      const rawType = getCell(row, headerMap, ['type', 'channel']);
      const rawVisitType = getCell(row, headerMap, ['visit type', 'purpose']);
      const rawLocation = getCell(row, headerMap, ['project location', 'location', 'city']);
      const rawAction = getCell(row, headerMap, ['action', 'notes', 'summary']);
      const rawFollowDate = getCell(row, headerMap, ['follow up date', 'next date']);
      const rawFollowAction = getCell(row, headerMap, ['follow up action', 'next action']);

      const actDate = parseExcelDate(rawDate);
      if (!actDate && !rawOpp && !rawContact && !rawAction) continue;

      const channel = mapActivityChannel(rawType);
      const visitPurpose = mapVisitPurpose(rawVisitType);
      const followUpDate = parseExcelDate(rawFollowDate);

      // Find matched project if any
      const projectName = rawOpp ? String(rawOpp).trim() : undefined;
      const matchedProj = projectName 
        ? projects.find(p => p.name.toLowerCase() === projectName.toLowerCase())
        : undefined;

      const contactName = rawContact ? String(rawContact).trim() : undefined;
      const contactObj = contactName 
        ? getOrCreateContact(contactName, undefined, { city: rawLocation ? String(rawLocation).trim() : undefined })
        : undefined;

      activities.push({
        id: `act_rep_${r}_${Date.now()}`,
        project_id: matchedProj?.id,
        project_name: projectName || matchedProj?.name,
        company_id: matchedProj?.company_id,
        company_name: matchedProj?.company_name,
        contact_id: contactObj?.id || matchedProj?.primary_contact_id,
        contact_name: contactName || matchedProj?.primary_contact_name,
        user_id: targetUserId,
        user_name: targetUserName,
        activity_date: actDate || new Date().toISOString().split('T')[0],
        activity_time: rawPeriod ? String(rawPeriod).trim() : undefined,
        channel: channel,
        visit_purpose: visitPurpose,
        notes: rawAction ? String(rawAction).trim() : undefined,
        next_action: rawFollowAction ? String(rawFollowAction).trim() : undefined,
        next_follow_up_at: followUpDate,
        location_name: rawLocation ? String(rawLocation).trim() : 'Jeddah',
        created_at: actDate || new Date().toISOString().split('T')[0]
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Process "Master Plan (2)" Sheet (Planned Activities)
  // ---------------------------------------------------------------------------
  const planSheetName = sheetNames.find(n => 
    n.toLowerCase().includes('master plan') || n.toLowerCase().includes('plan')
  );

  if (planSheetName && wb.Sheets[planSheetName]) {
    const ws = wb.Sheets[planSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    const { headerRowIdx, headerMap } = findHeaderRow(rows, [
      'date', 'opportunity', 'contact', 'type', 'action'
    ]);

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const rawDate = getCell(row, headerMap, ['date']);
      const rawOpp = getCell(row, headerMap, ['opportunity', 'project']);
      const rawContact = getCell(row, headerMap, ['contact', 'client']);
      const rawPeriod = getCell(row, headerMap, ['period', 'time']);
      const rawType = getCell(row, headerMap, ['type', 'channel']);
      const rawVisitType = getCell(row, headerMap, ['visit type', 'purpose']);
      const rawAction = getCell(row, headerMap, ['action', 'goal']);
      const rawLocation = getCell(row, headerMap, ['project location', 'location']);

      const schedDate = parseExcelDate(rawDate);
      if (!schedDate && !rawOpp && !rawAction) continue;

      const channel = mapActivityChannel(rawType);
      const visitPurpose = mapVisitPurpose(rawVisitType);
      const projectName = rawOpp ? String(rawOpp).trim() : undefined;
      const matchedProj = projectName 
        ? projects.find(p => p.name.toLowerCase() === projectName.toLowerCase())
        : undefined;

      plannedActivities.push({
        id: `plan_${r}_${Date.now()}`,
        weekly_plan_id: `wp_${schedDate ? schedDate.slice(0, 7) : 'current'}`,
        user_id: targetUserId,
        user_name: targetUserName,
        project_id: matchedProj?.id,
        project_name: projectName || matchedProj?.name,
        company_id: matchedProj?.company_id,
        company_name: matchedProj?.company_name,
        contact_name: rawContact ? String(rawContact).trim() : undefined,
        location_name: rawLocation ? String(rawLocation).trim() : 'Jeddah',
        scheduled_date: schedDate || new Date().toISOString().split('T')[0],
        time_slot: rawPeriod ? String(rawPeriod).trim() : undefined,
        channel: channel,
        visit_purpose: visitPurpose,
        goal: rawAction ? String(rawAction).trim() : 'Weekly Planned Activity',
        priority: 'medium',
        status: 'completed',
        created_at: schedDate || new Date().toISOString().split('T')[0],
        updated_at: schedDate || new Date().toISOString().split('T')[0]
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Process "Won Deals" Sheet
  // ---------------------------------------------------------------------------
  const wonSheetName = sheetNames.find(n => 
    n.toLowerCase().includes('won') || n.toLowerCase().includes('deal')
  );

  if (wonSheetName && wb.Sheets[wonSheetName]) {
    const ws = wb.Sheets[wonSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    const { headerRowIdx, headerMap } = findHeaderRow(rows, [
      'pr', 'quotation', 'company', 'amount', 'engineer'
    ]);

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const rawPr = getCell(row, headerMap, ['pr', '#pr', 'code']);
      const rawQuoteNo = getCell(row, headerMap, ['quotation number', 'quotation', 'quote']);
      const rawCompany = getCell(row, headerMap, ['company']);
      const rawEngineer = getCell(row, headerMap, ['engineer', 'sales engineer']);
      const rawDate = getCell(row, headerMap, ['date']);
      const rawDesc = getCell(row, headerMap, ['descreption / project', 'description', 'project']);
      const rawAmount = getCell(row, headerMap, ['amount', 'value', 'price']);

      if (!rawPr && !rawQuoteNo && !rawAmount) continue;

      const amount = cleanNumber(rawAmount);
      const prStr = rawPr ? String(rawPr).trim() : '';
      const quoteNo = rawQuoteNo ? String(rawQuoteNo).trim() : `Q-${Date.now()}`;
      const sentDate = parseExcelDate(rawDate);

      // Match project by PR
      const matchedProj = prStr 
        ? projects.find(p => p.pr_number.toLowerCase().replace(/[^a-z0-9]/g, '') === prStr.toLowerCase().replace(/[^a-z0-9]/g, ''))
        : undefined;

      const company = rawCompany 
        ? getOrCreateCompany(String(rawCompany)) 
        : (matchedProj ? { id: matchedProj.company_id, name: matchedProj.company_name || 'MACC' } as Company : undefined);

      if (matchedProj) {
        matchedProj.pipeline_stage = 'won';
        matchedProj.probability = 100;
        matchedProj.weighted_value = amount || matchedProj.estimated_value;
        if (amount > 0) matchedProj.estimated_value = amount;
      }

      totalWonValueSAR += amount;

      quotations.push({
        id: `quote_${quoteNo.replace(/[^a-zA-Z0-9]/g, '_')}_${r}`,
        project_id: matchedProj ? matchedProj.id : `proj_won_${r}`,
        project_name: matchedProj ? matchedProj.name : (rawDesc ? String(rawDesc).trim().split('\n')[0] : 'Won Project'),
        quotation_number: quoteNo,
        version: 1,
        amount: amount,
        currency: 'SAR',
        status: 'accepted',
        sent_date: sentDate || new Date().toISOString().split('T')[0],
        notes: rawDesc ? String(rawDesc).trim() : undefined,
        created_by: targetUserId,
        created_at: sentDate || new Date().toISOString().split('T')[0],
        updated_at: sentDate || new Date().toISOString().split('T')[0]
      });
    }
  }

  const finalCompanies = Array.from(companiesMap.values());
  const finalContacts = Array.from(contactsMap.values());

  return {
    success: true,
    projects,
    companies: finalCompanies,
    contacts: finalContacts,
    activities,
    plannedActivities,
    quotations,
    summary: {
      fileName,
      sheetNames,
      totalProjects: projects.length,
      totalCompanies: finalCompanies.length,
      totalContacts: finalContacts.length,
      totalHotLeads: totalHotLeadsCount,
      totalActivities: activities.length,
      totalPlannedActivities: plannedActivities.length,
      totalQuotations: quotations.length,
      totalEstimatedValueSAR,
      totalWonValueSAR,
      warnings
    }
  };
}
