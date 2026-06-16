import { NextRequest, NextResponse } from 'next/server';
import { generateCsvs } from '@/services/csvExport';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { leads } = await req.json();
    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'Invalid leads array' }, { status: 400 });
    }

    const outputDir = path.join(process.cwd(), 'public', 'exports');
    await generateCsvs(leads, outputDir);
    
    // Add timestamp to prevent caching issues if needed, but direct links work fine
    return NextResponse.json({
      companyCsvUrl: '/exports/company_intelligence.csv',
      contactsCsvUrl: '/exports/company_contacts.csv'
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
