import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { Project } from '@/types/crm';
import { authenticateRequest } from '@/lib/auth/server-token';

const EXCEL_FILE_NAME = 'Saudi Projects Follow UP - Eslam Mohandes(1).xlsx';
const BACKUP_FILE_NAME = 'Saudi Projects Follow UP - Eslam Mohandes(1).backup.xlsx';

function normalizePr(pr?: string | null): string {
  if (!pr) return '';
  return String(pr).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function dateToExcelSerial(dateVal?: string | Date | null): number | null {
  if (!dateVal) return null;
  const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return null;
  const utcDays = Math.floor(d.getTime() / 86400000) + 25569;
  return utcDays;
}

function mapStageToStatus(stage?: string): string {
  switch (stage) {
    case 'lead': return 'Gather Info.';
    case 'rfq_processing': return 'RFQ Processing';
    case 'quotation_sent': return 'Send to Client';
    case 'technical_submission': return 'Technical Submittal';
    case 'negotiation': return 'Negotiation';
    case 'won': return 'Won';
    case 'lost': return 'Lost';
    default: return 'Send to Client';
  }
}

export async function GET(req: Request) {
  const auth = authenticateRequest(req, ['admin', 'sales_manager', 'sales_engineer']);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const filePath = path.join(process.cwd(), 'source-data', EXCEL_FILE_NAME);
    const backupPath = path.join(process.cwd(), 'source-data', BACKUP_FILE_NAME);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ 
        exists: false, 
        message: 'Source Excel file not found' 
      }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const hasBackup = fs.existsSync(backupPath);
    const backupStat = hasBackup ? fs.statSync(backupPath) : null;

    // Read buffer safely
    const fileBuf = fs.readFileSync(filePath);
    const wb = XLSX.read(fileBuf, { type: 'buffer' });
    const pSheet = wb.Sheets['Projects Follow UP'];
    let namedCount = 0;
    if (pSheet) {
      const pData: any[][] = XLSX.utils.sheet_to_json(pSheet, { header: 1 });
      for (let i = 4; i < pData.length; i++) {
        const r = pData[i];
        if (r && r[1] && String(r[1]).trim() !== '' && String(r[1]).trim() !== '0') {
          namedCount++;
        }
      }
    }

    return NextResponse.json({
      exists: true,
      fileName: EXCEL_FILE_NAME,
      lastModified: stat.mtime.toISOString(),
      size: stat.size,
      hasBackup,
      backupLastModified: backupStat ? backupStat.mtime.toISOString() : null,
      projectsCountInExcel: namedCount
    });
  } catch (error: any) {
    console.error('Error inspecting Excel file:', error);
    return NextResponse.json({ 
      error: 'Failed to inspect Excel file' 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = authenticateRequest(req, ['admin', 'sales_manager', 'sales_engineer']);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const projects: Project[] = body.projects;

    if (!Array.isArray(projects)) {
      return NextResponse.json({ error: 'Invalid payload: projects must be an array' }, { status: 400 });
    }

    const sourceDir = path.join(process.cwd(), 'source-data');
    const filePath = path.join(sourceDir, EXCEL_FILE_NAME);
    const backupPath = path.join(sourceDir, BACKUP_FILE_NAME);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Source Excel file not found on disk' }, { status: 404 });
    }

    // 1. Create safety backup if not already present
    if (!fs.existsSync(backupPath) || body.forceBackup) {
      fs.copyFileSync(filePath, backupPath);
    }

    // 2. Read workbook from buffer with full fidelity (formulas, styles, dates)
    const fileBuffer = fs.readFileSync(filePath);
    const wb = XLSX.read(fileBuffer, { 
      type: 'buffer',
      cellFormula: true, 
      cellStyles: true, 
      cellDates: true 
    });

    const pSheet = wb.Sheets['Projects Follow UP'];
    if (!pSheet) {
      return NextResponse.json({ error: 'Sheet "Projects Follow UP" not found in workbook' }, { status: 500 });
    }

    const pData: any[][] = XLSX.utils.sheet_to_json(pSheet, { header: 1 });

    // Track matching rows in Excel (index 4 is row 5)
    let updatedCount = 0;
    const handledProjectIds = new Set<string>();

    // Helper to safely set cell value while keeping existing style/formula if needed
    const updateCell = (rIdx: number, cIdx: number, value: any, type: 's' | 'n') => {
      const cellRef = XLSX.utils.encode_cell({ r: rIdx, c: cIdx });
      const existing = pSheet[cellRef];

      // If existing cell has formula and is not an input cell, preserve formula
      if (existing && existing.f && (cIdx === 14 || cIdx === 17 || cIdx === 18)) {
        return;
      }

      if (type === 'n') {
        const numVal = Number(value) || 0;
        pSheet[cellRef] = {
          ...(existing || {}),
          t: 'n',
          v: numVal,
          w: numVal.toLocaleString('en-US')
        };
      } else {
        const strVal = value !== null && value !== undefined ? String(value) : '';
        pSheet[cellRef] = {
          ...(existing || {}),
          t: 's',
          v: strVal,
          w: strVal
        };
      }
    };

    // First pass: match projects to existing populated rows (rows 5 to 139)
    for (let i = 4; i < pData.length; i++) {
      const row = pData[i];
      if (!row) continue;

      const excelPr = normalizePr(row[0]);
      const excelName = row[1] ? String(row[1]).trim().toLowerCase() : '';

      // Find matching CRM project
      const match = projects.find(p => {
        if (handledProjectIds.has(p.id)) return false;
        const crmPr = normalizePr(p.pr_number);
        const crmIdPr = p.id.startsWith('p_pr') ? normalizePr(p.id.replace('p_pr', 'PR')) : '';
        
        // Exact PR match
        if (crmPr && excelPr && (crmPr === excelPr || crmPr.endsWith(excelPr) || excelPr.endsWith(crmPr))) {
          return true;
        }
        if (crmIdPr && excelPr && crmIdPr === excelPr) {
          return true;
        }

        // Exact or strong name match
        const crmName = (p.name || '').trim().toLowerCase();
        if (crmName && excelName && (crmName === excelName || crmName.includes(excelName) || excelName.includes(crmName))) {
          return true;
        }

        return false;
      });

      if (match) {
        handledProjectIds.add(match.id);
        
        // Col 1 (B): Opportunity Name
        updateCell(i, 1, match.name, 's');
        
        // Col 2 (C): Client Name
        if (match.primary_contact_name) {
          updateCell(i, 2, match.primary_contact_name, 's');
        }

        // Col 3 (D): Client Phone
        if (match.primary_contact_phone) {
          updateCell(i, 3, match.primary_contact_phone, 's');
        }

        // Col 4 (E): Company Name
        if (match.company_name) {
          updateCell(i, 4, match.company_name, 's');
        }

        // Col 5 (F): Client Email (if present in custom/extended project properties)
        const customEmail = (match as any).client_email || (match as any).email;
        if (customEmail) {
          updateCell(i, 5, customEmail, 's');
        }

        // Col 6 (G): Project Stage (Tender vs In Hand)
        const isTender = match.opportunity_type === 'tender' || 
                         match.pipeline_stage === 'quotation_sent' || 
                         match.pipeline_stage === 'technical_submission';
        updateCell(i, 6, isTender ? 'Tender' : 'In Hand', 's');

        // Col 7 (H): Location
        if (match.location) {
          updateCell(i, 7, match.location, 's');
        }

        // Col 8 (I): Status
        updateCell(i, 8, mapStageToStatus(match.pipeline_stage), 's');

        // Col 9 (J): Estimated Value
        const val = match.estimated_value || match.final_won_value || 0;
        updateCell(i, 9, val, 'n');

        // Col 10 (K): Action Done / Notes
        const actionNotes = match.internal_notes || (match as any).last_activity_notes || (match as any).notes || '';
        if (actionNotes) {
          updateCell(i, 10, actionNotes, 's');
        }

        // Col 11 (L): Action Date
        if (match.last_activity_at) {
          const serial = dateToExcelSerial(match.last_activity_at);
          if (serial) {
            updateCell(i, 11, serial, 'n');
          }
        }

        // Col 12 (M): Follow Up / Next Action
        if (match.next_action) {
          updateCell(i, 12, match.next_action, 's');
        }

        // Col 13 (N): Follow Up Date
        if (match.next_follow_up_at) {
          const serial = dateToExcelSerial(match.next_follow_up_at);
          if (serial) {
            updateCell(i, 13, serial, 'n');
          }
        }

        // Col 15 (P): Referral
        if (match.referred_to_id || (match as any).is_referred) {
          updateCell(i, 15, 'Yes', 's');
        }

        updatedCount++;
      }
    }

    // Second pass: unhandled projects (new projects added via CRM)
    // Place them into empty template rows (where row[1] is empty or 0)
    const remainingProjects = projects.filter(p => !handledProjectIds.has(p.id) && !p.is_archived);
    if (remainingProjects.length > 0) {
      let remIdx = 0;
      for (let i = 4; i < pData.length && remIdx < remainingProjects.length; i++) {
        const row = pData[i];
        const isTemplateRow = !row || !row[1] || String(row[1]).trim() === '' || String(row[1]).trim() === '0';
        if (isTemplateRow) {
          const newProj = remainingProjects[remIdx];
          remIdx++;
          handledProjectIds.add(newProj.id);

          // Col 1 (B): Opportunity Name
          updateCell(i, 1, newProj.name, 's');
          // Col 2 (C): Client Name
          updateCell(i, 2, newProj.primary_contact_name || '', 's');
          // Col 3 (D): Client Phone
          updateCell(i, 3, newProj.primary_contact_phone || '', 's');
          // Col 4 (E): Company Name
          updateCell(i, 4, newProj.company_name || '', 's');
          // Col 5 (F): Email
          const customEmail = (newProj as any).client_email || (newProj as any).email;
          if (customEmail) updateCell(i, 5, customEmail, 's');
          // Col 6 (G): Stage
          const isTender = newProj.opportunity_type === 'tender' || 
                           newProj.pipeline_stage === 'quotation_sent' || 
                           newProj.pipeline_stage === 'technical_submission';
          updateCell(i, 6, isTender ? 'Tender' : 'In Hand', 's');
          // Col 7 (H): Location
          updateCell(i, 7, newProj.location || 'Western Region', 's');
          // Col 8 (I): Status
          updateCell(i, 8, mapStageToStatus(newProj.pipeline_stage), 's');
          // Col 9 (J): Value
          updateCell(i, 9, newProj.estimated_value || 0, 'n');
          // Col 10 (K): Action Done
          const actionNotes = newProj.internal_notes || (newProj as any).last_activity_notes || '';
          if (actionNotes) updateCell(i, 10, actionNotes, 's');
          // Col 12 (M): Follow Up
          updateCell(i, 12, newProj.next_action || '', 's');

          if (newProj.next_follow_up_at) {
            const serial = dateToExcelSerial(newProj.next_follow_up_at);
            if (serial) updateCell(i, 13, serial, 'n');
          }

          updatedCount++;
        }
      }
    }

    // Sanitize any corrupt or runaway hyperlinks across all sheets before serialization
    wb.SheetNames.forEach(sName => {
      const s = wb.Sheets[sName];
      if (!s) return;
      for (const [cellRef, cell] of Object.entries(s)) {
        if (cellRef.startsWith('!')) continue;
        if (cell && cell.l && cell.l.Target && (cell.l.Target.length > 300 || cell.l.Target.includes('Ã') || cell.l.Target.includes('%20%20%20%20-'))) {
          cell.l.Target = cell.l.Target.split('%20%20%20%20-')[0].split('?')[0].slice(0, 200);
        }
      }
    });

    // 3. Write back to file atomically using compressed buffer
    const outBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', compression: true });
    fs.writeFileSync(filePath, outBuffer);

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    return NextResponse.json({
      success: true,
      message: `تم تحديث ملف الإكسيل بنجاح (${updatedCount} مشروع)`,
      updatedCount,
      totalProjectsInCRM: projects.length,
      timestamp: now.toISOString(),
      displayTime: timeFormatted
    });
  } catch (error: any) {
    console.error('Error syncing Excel file:', error);
    return NextResponse.json({ 
      error: 'Failed to update Excel file' 
    }, { status: 500 });
  }
}
