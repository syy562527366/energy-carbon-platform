import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const filePath = join(process.cwd(), 'data', 'efficiency-optimization.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  let processOptimizations = data.processOptimizations;
  if (status) {
    processOptimizations = processOptimizations.filter((item: any) => item.status === status);
  }

  return NextResponse.json({
    success: true,
    summary: data.summary,
    balanceDimensions: data.balanceDimensions,
    processOptimizations,
    equipmentOptimizations: data.equipmentOptimizations,
    comparisonData: data.comparisonData,
    monthlySavings: data.monthlySavings,
  });
}
