import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  const filePath = join(process.cwd(), 'data', 'budget-management.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  let alerts = data.alerts;
  if (type) {
    alerts = alerts.filter((item: any) => item.type === type);
  }

  return NextResponse.json({
    success: true,
    summary: data.summary,
    monthlyExecution: data.monthlyExecution,
    alerts,
    forecast: data.forecast,
    categoryBreakdown: data.categoryBreakdown,
  });
}
