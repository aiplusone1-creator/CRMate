import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { authenticateRequest } from '@/lib/auth/server-token';

export async function GET(req: Request) {
  // Demo dataset loading is disabled in production environments
  if (process.env.NODE_ENV === 'production' && process.env.CRMATE_TEST_MODE !== 'true') {
    return NextResponse.json(
      { 
        error: 'Forbidden: Demo sample sheet loading is disabled in production environments', 
        code: 'FORBIDDEN' 
      },
      { status: 403 }
    );
  }

  // In non-production environments, require valid commercial role
  const auth = authenticateRequest(req, ['admin', 'sales_manager', 'sales_engineer']);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const filePath = path.join(process.cwd(), 'source-data', 'Saudi Projects Follow UP - Eslam Mohandes(1).xlsx');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Sample workbook file not found in source-data' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Saudi Projects Follow UP - Eslam Mohandes(1).xlsx"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error: any) {
    console.error('Error serving sample sheet:', error);
    return NextResponse.json({ error: 'Failed to read sample file' }, { status: 500 });
  }
}
