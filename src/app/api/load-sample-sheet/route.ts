import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
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
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to read sample file' }, { status: 500 });
  }
}
