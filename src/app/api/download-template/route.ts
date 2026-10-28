import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { generateIdealTemplateWorkbook } from '@/lib/excel/template-generator';
import { authenticateRequest } from '@/lib/auth/server-token';

export async function GET(req: Request) {
  // Requires any authenticated CRM user role
  const auth = authenticateRequest(req, ['admin', 'sales_manager', 'sales_engineer', 'estimator', 'viewer']);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const wb = generateIdealTemplateWorkbook();
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Al-Mespar-CRM-Standard-Template.xlsx"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error: any) {
    console.error('Failed to generate template workbook:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
