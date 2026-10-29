import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { buildCompleteLiveExcelWorkbook } from '@/lib/excel/excel-export-engine';
import { authenticateRequest } from '@/lib/auth/server-token';

export async function GET(req: Request) {
  const auth = authenticateRequest(req, ['admin', 'sales_manager']);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const buffer = buildCompleteLiveExcelWorkbook();
    const dateStr = new Date().toISOString().split('T')[0];

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Saudi_Projects_Follow_UP_Live_${dateStr}.xlsx"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (err: any) {
    console.error('Error serving Excel backup:', err);
    return NextResponse.json({ error: 'Failed to export Excel file' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = authenticateRequest(req, ['admin', 'sales_manager']);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const buffer = buildCompleteLiveExcelWorkbook(body);

    // Save back to disk to keep live file in sync (when local filesystem is writable)
    try {
      const filePath = path.join(process.cwd(), 'source-data', 'Saudi Projects Follow UP - Eslam Mohandes(1).xlsx');
      if (fs.existsSync(path.dirname(filePath))) {
        fs.writeFileSync(filePath, buffer);
      }
    } catch (fsErr: any) {
      // In serverless / Vercel environments, disk writes fail (EROFS). Gracefully proceed.
      console.warn('Serverless environment: disk sync skipped:', fsErr?.message);
    }

    const dateStr = new Date().toISOString().split('T')[0];

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Saudi_Projects_Follow_UP_Live_Updated_${dateStr}.xlsx"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error: any) {
    console.error('Error generating Excel backup:', error);
    return NextResponse.json({ error: 'Failed to generate Excel backup' }, { status: 500 });
  }
}
