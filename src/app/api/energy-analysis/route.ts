import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '';
  const unit = searchParams.get('unit') || '';

  const filePath = join(process.cwd(), 'data', 'energy-analysis.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  // Filter records
  let costAnalysis = data.costAnalysis;
  let efficiencyAnalysis = data.efficiencyAnalysis;
  let recommendations = data.recommendations;

  if (period) {
    costAnalysis = costAnalysis.filter((r: any) => r.period === period);
  }
  if (unit) {
    efficiencyAnalysis = efficiencyAnalysis.filter((r: any) =>
      r.unitLevel === unit || r.unit.includes(unit)
    );
  }

  return NextResponse.json({
    success: true,
    periods: data.periods,
    structureData: data.structureData,
    costAnalysis,
    efficiencyAnalysis,
    recommendations,
    summary: data.summary,
  });
}
