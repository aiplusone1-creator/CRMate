import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { Project, Contact, Activity, Quotation } from '../../types/crm';

export function formatSaudiPhone(raw: unknown): string {
  if (raw === null || raw === undefined || raw === '' || raw === '0' || raw === 0 || raw === '--' || raw === 'na' || raw === 'undefined') {
    return '';
  }
  let str = String(raw).trim();
  if (str.endsWith('.0')) str = str.slice(0, -2);
  
  // Handle double concatenated numbers (like 966549733284966547160894)
  if (str.length >= 20 && str.startsWith('9665')) {
    const num1 = '+966 ' + str.slice(3, 5) + ' ' + str.slice(5, 8) + ' ' + str.slice(8, 12);
    const rest = str.slice(12);
    if (rest.startsWith('9665')) {
      const num2 = '+966 ' + rest.slice(3, 5) + ' ' + rest.slice(5, 8) + ' ' + rest.slice(8, 12);
      return `${num1} / ${num2}`;
    }
  }

  // Handle standard 12-digit international (9665xxxxxxxx)
  const digits = str.replace(/[^\d]/g, '');
  if (digits.startsWith('966') && digits.length === 12) {
    return `+966 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  if (digits.startsWith('05') && digits.length === 10) {
    return `+966 ${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.startsWith('5') && digits.length === 9) {
    return `+966 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  if (digits.length >= 8) {
    return `+${digits}`;
  }
  return str;
}

export function cleanEmail(raw: unknown): string {
  if (raw === null || raw === undefined || raw === '' || raw === '0' || raw === 0 || raw === '--' || raw === 'na' || raw === 'undefined') {
    return '';
  }
  const str = String(raw).trim();
  return str.includes('@') ? str : '';
}

export function dateToExcelSerial(dateVal: unknown): number | null {
  if (!dateVal) return null;
  if (typeof dateVal === 'number' && dateVal > 30000 && dateVal < 60000) return dateVal;
  const d = typeof dateVal === 'string' ? new Date(dateVal) : (dateVal instanceof Date ? dateVal : null);
  if (!d || isNaN(d.getTime())) return null;
  const utcDays = Math.floor(d.getTime() / 86400000) + 25569;
  return utcDays;
}

export function mapStageToStatus(stage?: string): string {
  switch (stage) {
    case 'lead': return 'Gather Info.';
    case 'rfq_processing': return 'RFQ Processing';
    case 'pricing': return 'Pricing';
    case 'quotation_sent': return 'Send to Client';
    case 'technical_submission': return 'Technical Submittal';
    case 'technically_approved': return 'Technically Approved';
    case 'negotiation': return 'Negotiation';
    case 'won': return 'Won';
    case 'lost': return 'Lost';
    case 'hold': return 'Hold';
    default: return 'Send to Client';
  }
}

// Known client contacts mapping for edge-case entries
const KNOWN_PROJECT_CONTACTS: Record<string, { name: string; phone: string; company: string; email?: string }> = {
  'PR1036': { name: 'Mohamed Bani', phone: '966531682971', company: 'Marriot' },
  'PR1038': { name: 'ممثل المالك / إدارة المشاريع', phone: '0125335515', company: 'شركة رؤى الحرم المكي' },
  'PR1041': { name: 'Mohamed Ahmed Youssef', phone: '966569806120', company: 'WATCOM - شركة الحزام' },
  'PR1042': { name: 'Youssef Ali', phone: '966501919364', company: 'Catrion' },
  'PR1044': { name: 'Mahmoud Saad', phone: '966531598424', company: 'Sama for Contracting' },
  'PR-60745': { name: 'Omar El Hanoun', phone: '966531895117', company: 'MACC', email: 'omer.elhanoun@macc-fm.com' },
  'PR1049': { name: 'Omar El Hanoun', phone: '966531895117', company: 'MACC', email: 'omer.elhanoun@macc-fm.com' }
};

interface ExportPayload {
  projects?: Project[];
  contacts?: Contact[];
  companies?: any[];
  activities?: Activity[];
  quotations?: Quotation[];
}

export function buildCompleteLiveExcelWorkbook(payload?: ExportPayload): Buffer {
  const sourcePath = path.join(process.cwd(), 'source-data', 'Saudi Projects Follow UP - Eslam Mohandes(1).xlsx');
  
  if (!fs.existsSync(sourcePath)) {
    throw new Error('Source template file not found on disk: ' + sourcePath);
  }

  // Read authentic workbook preserving styles, formulas, macros
  const fileBuf = fs.readFileSync(sourcePath);
  const wb = XLSX.read(fileBuf, { cellFormula: true, cellStyles: true, cellDates: true });

  // 1. Prepare CRM Database Reference
  let dbContacts: Contact[] = [];
  let dbProjects: Project[] = [];
  try {
    const migratedPath = path.join(process.cwd(), 'src', 'lib', 'data', 'migrated_data.json');
    if (fs.existsSync(migratedPath)) {
      const parsed = JSON.parse(fs.readFileSync(migratedPath, 'utf8'));
      dbContacts = parsed.contacts || [];
      dbProjects = parsed.projects || [];
    }
  } catch (e) {
    console.warn('Could not read migrated_data.json:', e);
  }

  const allContacts = [...(payload?.contacts || []), ...dbContacts];
  const allLiveProjects = [...(payload?.projects || []), ...dbProjects];

  // Contact lookup dictionaries
  const contactsByName = new Map<string, Contact>();
  const contactsById = new Map<string, Contact>();
  allContacts.forEach(c => {
    if (c.id) contactsById.set(c.id, c);
    if (c.full_name) contactsByName.set(c.full_name.trim().toLowerCase(), c);
  });

  // ---------------------------------------------------------------------------
  // 2. Rebuild "Projects Follow UP" Sheet
  // ---------------------------------------------------------------------------
  const pSheet = wb.Sheets['Projects Follow UP'];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(pSheet, { header: 1 });

  interface UnifiedProject {
    pr: string;
    name: string;
    client: string;
    phone: string;
    company: string;
    email: string;
    stage: string;
    location: string;
    status: string;
    value: number;
    action: string;
    actionDate: any;
    followUp: string;
    followUpDate: any;
    currentFollowUp: string;
    currentFollowUpDate: any;
  }

  const projectsMap = new Map<string, UnifiedProject>();

  const ingest = (item: {
    pr?: any;
    name?: any;
    client?: any;
    phone?: any;
    company?: any;
    email?: any;
    stage?: any;
    location?: any;
    status?: any;
    value?: any;
    action?: any;
    actionDate?: any;
    followUp?: any;
    followUpDate?: any;
    currentFollowUp?: any;
    currentFollowUpDate?: any;
  }) => {
    let pr = item.pr ? String(item.pr).trim() : '';
    const name = item.name ? String(item.name).trim() : '';
    if (!name || name === '0' || name === 'undefined' || name.startsWith('PR10') || name.toLowerCase().includes('playwright benchmark')) {
      return;
    }

    // Merge duplicate PR1049 and PR-60745
    if (name.toLowerCase().includes('macc kaust modulating')) {
      pr = 'PR-60745';
    }

    const key = pr ? pr.toUpperCase().replace(/[^A-Z0-9]/g, '') : name.toLowerCase();

    // Known contact fallback
    const known = KNOWN_PROJECT_CONTACTS[pr] || KNOWN_PROJECT_CONTACTS[key];
    let client = item.client || (known ? known.name : '');
    let phone = item.phone || (known ? known.phone : '');
    let company = item.company || (known ? known.company : '');
    let email = item.email || (known ? known.email : '');

    // Search contacts by name if phone missing
    if (!phone && client) {
      const match = contactsByName.get(client.toLowerCase());
      if (match) {
        if (match.phone) phone = match.phone;
        if (match.email && !email) email = match.email;
        if (match.company_name && (!company || company === 'Organization')) company = match.company_name;
      }
    }

    const cleanP = formatSaudiPhone(phone);
    const cleanE = cleanEmail(email);

    if (projectsMap.has(key)) {
      const existing = projectsMap.get(key)!;
      if (cleanP && !existing.phone) existing.phone = cleanP;
      if (cleanE && !existing.email) existing.email = cleanE;
      if (client && (!existing.client || existing.client === '-')) existing.client = client;
      if (company && (!existing.company || existing.company === 'Organization')) existing.company = company;
      if (item.value && Number(item.value) > existing.value) existing.value = Number(item.value);
      if (item.status && item.status !== 'Gather Info.') existing.status = item.status;
      if (item.action && !existing.action) existing.action = item.action;
      if (item.followUp && !existing.followUp) existing.followUp = item.followUp;
    } else {
      projectsMap.set(key, {
        pr,
        name,
        client: client || '',
        phone: cleanP,
        company: (company && company !== 'Organization') ? company : '',
        email: cleanE,
        stage: item.stage || 'In Hand',
        location: item.location || 'Jeddah',
        status: item.status || 'Send to Client',
        value: Number(item.value) || 0,
        action: item.action || '',
        actionDate: item.actionDate || '',
        followUp: item.followUp || '',
        followUpDate: item.followUpDate || '',
        currentFollowUp: item.currentFollowUp || item.followUp || '',
        currentFollowUpDate: item.currentFollowUpDate || item.followUpDate || ''
      });
    }
  };

  // 1. Ingest original file rows (Rows 4 to 139)
  for (let i = 4; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r) continue;
    ingest({
      pr: r[0],
      name: r[1],
      client: r[2],
      phone: r[3],
      company: r[4],
      email: r[5],
      stage: r[6],
      location: r[7],
      status: r[8],
      value: r[9],
      action: r[10],
      actionDate: r[11],
      followUp: r[12],
      followUpDate: r[13],
      currentFollowUp: r[17],
      currentFollowUpDate: r[18]
    });
  }

  // 2. Ingest live CRM projects
  allLiveProjects.forEach(p => {
    let contact: Contact | null = null;
    if (p.primary_contact_id) contact = contactsById.get(p.primary_contact_id) || null;
    if (!contact && p.primary_contact_name) contact = contactsByName.get(p.primary_contact_name.trim().toLowerCase()) || null;

    ingest({
      pr: p.pr_number,
      name: p.name,
      client: p.primary_contact_name || (contact ? contact.full_name : ''),
      phone: p.primary_contact_phone || (contact ? contact.phone : ''),
      company: p.company_name || (contact ? contact.company_name : ''),
      email: (p as any).client_email || (contact ? contact.email : ''),
      stage: p.opportunity_type === 'tender' ? 'Tender' : 'In Hand',
      location: p.location || 'Jeddah',
      status: mapStageToStatus(p.pipeline_stage),
      value: p.estimated_value || p.final_won_value || 0,
      action: p.internal_notes || '',
      actionDate: p.last_activity_at || '',
      followUp: p.next_action || '',
      followUpDate: p.next_follow_up_at || '',
      currentFollowUp: p.next_action || '',
      currentFollowUpDate: p.next_follow_up_at || ''
    });
  });

  // Clear all previous data cells below header (rows 4 to 200) to purge dummy zero rows completely
  for (let r = 4; r < 200; r++) {
    for (let c = 0; c < 20; c++) {
      delete pSheet[XLSX.utils.encode_cell({ r, c })];
    }
  }

  const setCell = (r: number, c: number, val: any, type: 's' | 'n' = 's') => {
    const ref = XLSX.utils.encode_cell({ r, c });
    if (val === null || val === undefined || val === '') return;
    if (type === 'n') {
      const num = Number(val) || 0;
      pSheet[ref] = { t: 'n', v: num, w: num.toLocaleString('en-US') };
    } else {
      const str = String(val);
      pSheet[ref] = { t: 's', v: str, w: str };
    }
  };

  let rowIdx = 4;
  let totalInHand = 0;
  let totalTender = 0;
  let totalAmount = 0;
  let wonCount = 0;
  let wonTotal = 0;
  const wonDealsList: Array<{ pr: string; name: string; company: string; client: string; amount: number; date: string }> = [];

  projectsMap.forEach(proj => {
    setCell(rowIdx, 0, proj.pr, 's');
    setCell(rowIdx, 1, proj.name, 's');
    setCell(rowIdx, 2, proj.client, 's');
    setCell(rowIdx, 3, proj.phone, 's'); // Explicit string type to avoid scientific notation
    setCell(rowIdx, 4, proj.company, 's');
    setCell(rowIdx, 5, proj.email, 's');
    setCell(rowIdx, 6, proj.stage, 's');
    setCell(rowIdx, 7, proj.location, 's');
    setCell(rowIdx, 8, proj.status, 's');
    setCell(rowIdx, 9, proj.value, 'n');
    setCell(rowIdx, 10, proj.action, 's');

    const aDate = dateToExcelSerial(proj.actionDate);
    if (aDate) setCell(rowIdx, 11, aDate, 'n');

    setCell(rowIdx, 12, proj.followUp, 's');

    const fDate = dateToExcelSerial(proj.followUpDate);
    if (fDate) setCell(rowIdx, 13, fDate, 'n');

    setCell(rowIdx, 14, proj.value, 'n');
    setCell(rowIdx, 17, proj.currentFollowUp, 's');

    const cfDate = dateToExcelSerial(proj.currentFollowUpDate);
    if (cfDate) setCell(rowIdx, 18, cfDate, 'n');

    // Stats calculation
    if (proj.stage.toLowerCase().includes('tender')) {
      totalTender++;
    } else {
      totalInHand++;
    }
    totalAmount += proj.value;

    if (proj.status.toLowerCase() === 'won' || proj.stage.toLowerCase() === 'won') {
      wonCount++;
      wonTotal += proj.value;
      wonDealsList.push({
        pr: proj.pr,
        name: proj.name,
        company: proj.company,
        client: proj.client,
        amount: proj.value,
        date: proj.actionDate || '2026-10-20'
      });
    }

    rowIdx++;
  });

  // Set clean tight range for Projects sheet
  pSheet['!ref'] = `A1:S${rowIdx}`;

  // Update top KPI numbers in Projects Follow UP (Row 0, 1)
  setCell(0, 4, totalInHand, 'n');
  setCell(0, 6, projectsMap.size, 'n');
  setCell(0, 10, totalAmount, 'n');
  setCell(1, 4, totalTender, 'n');

  // ---------------------------------------------------------------------------
  // 3. Update "Won Deals" Sheet
  // ---------------------------------------------------------------------------
  const wonSheet = wb.Sheets['Won Deals'];
  if (wonSheet) {
    for (let r = 1; r < 50; r++) {
      for (let c = 0; c < 10; c++) {
        delete wonSheet[XLSX.utils.encode_cell({ r, c })];
      }
    }

    const setWonCell = (r: number, c: number, val: any, type: 's' | 'n' = 's') => {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (val === null || val === undefined || val === '') return;
      if (type === 'n') {
        const num = Number(val) || 0;
        wonSheet[ref] = { t: 'n', v: num, w: num.toLocaleString('en-US') };
      } else {
        const str = String(val);
        wonSheet[ref] = { t: 's', v: str, w: str };
      }
    };

    let wRow = 1;
    wonDealsList.forEach(w => {
      setWonCell(wRow, 0, w.pr, 's');
      setWonCell(wRow, 1, `Q-2026-${w.pr.replace(/[^0-9]/g, '') || wRow}`, 's');
      setWonCell(wRow, 2, w.company, 's');
      setWonCell(wRow, 3, 'Eslam Mohandes', 's');
      setWonCell(wRow, 4, w.date, 's');
      setWonCell(wRow, 5, w.name, 's');
      setWonCell(wRow, 6, w.amount, 'n');
      wRow++;
    });

    wonSheet['!ref'] = `A1:G${wRow}`;
  }

  // ---------------------------------------------------------------------------
  // 4. Update "Hot Leads" Sheet
  // ---------------------------------------------------------------------------
  const hlSheet = wb.Sheets['Hot Leads'];
  if (hlSheet) {
    const hlRaw: any[][] = XLSX.utils.sheet_to_json(hlSheet, { header: 1 });
    for (let r = 1; r < hlRaw.length; r++) {
      const row = hlRaw[r];
      if (!row || !row[0]) continue;
      const refPhone = XLSX.utils.encode_cell({ r, c: 1 });
      const refEmail = XLSX.utils.encode_cell({ r, c: 5 });
      const currentPhone = row[1];
      if (currentPhone) {
        const cleanP = formatSaudiPhone(currentPhone);
        hlSheet[refPhone] = { t: 's', v: cleanP, w: cleanP };
      }
      const currentEmail = row[5];
      if (currentEmail === '0' || currentEmail === 0 || currentEmail === '--' || currentEmail === 'na') {
        delete hlSheet[refEmail];
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Update "Dashboard" Sheet
  // ---------------------------------------------------------------------------
  const dSheet = wb.Sheets['Dashboard'];
  if (dSheet) {
    dSheet['B10'] = { t: 'n', v: projectsMap.size, w: String(projectsMap.size) };
    dSheet['D10'] = { t: 'n', v: totalInHand, w: String(totalInHand) };
    dSheet['F10'] = { t: 'n', v: totalTender, w: String(totalTender) };
    dSheet['H10'] = { t: 'n', v: totalAmount, w: totalAmount.toLocaleString('en-US') };
    dSheet['D13'] = { t: 'n', v: wonCount, w: String(wonCount) };
    dSheet['D14'] = { t: 'n', v: wonTotal, w: wonTotal.toLocaleString('en-US') };
  }

  // ---------------------------------------------------------------------------
  // 6. Sanitize Hyperlinks
  // ---------------------------------------------------------------------------
  wb.SheetNames.forEach(sName => {
    const s = wb.Sheets[sName];
    if (!s) return;
    for (const [cellRef, cell] of Object.entries(s)) {
      if (cellRef.startsWith('!')) continue;
      if (cell && cell.l && cell.l.Target && (cell.l.Target.length > 250 || cell.l.Target.includes('Ã') || cell.l.Target.includes('%20%20%20%20-'))) {
        cell.l.Target = cell.l.Target.split('%20%20%20%20-')[0].split('?')[0].slice(0, 180);
      }
    }
  });

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', compression: true });
}
