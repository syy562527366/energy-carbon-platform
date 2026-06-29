import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '';
  const category = searchParams.get('category') || '';
  const status = searchParams.get('status') || '';

  const filePath = join(process.cwd(), 'data', 'benchmarking.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  let targets = data.benchmarkTargets;
  if (category) targets = targets.filter((t: any) => t.category === category);
  if (status) targets = targets.filter((t: any) => t.status === status);

  let history = data.historyData;
  if (period) history = history.filter((h: any) => h.period === period);

  return NextResponse.json({
    success: true,
    periods: data.periods,
    targets,
    historyData: history,
    summary: data.summary,
  });
}
