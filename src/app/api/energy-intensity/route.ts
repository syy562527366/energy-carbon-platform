import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'energy-intensity.json');

export async function GET(request: NextRequest) {
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(raw);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '';
    const unit = searchParams.get('unit') || '';
    const status = searchParams.get('status') || '';

    let records = [...data.records];

    if (period) {
      records = records.filter((r: any) => r.period === period);
    }

    if (unit) {
      records = records.filter((r: any) => r.unitLevel === unit || r.unit.includes(unit));
    }

    if (status) {
      records = records.filter((r: any) => r.status === status);
    }

    return NextResponse.json({
      success: true,
      records,
      periods: data.periods,
      conversionFactors: data.conversionFactors,
      summary: data.summary,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load data' }, { status: 500 });
  }
}
