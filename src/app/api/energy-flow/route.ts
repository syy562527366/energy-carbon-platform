import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '';

  const filePath = join(process.cwd(), 'data', 'energy-flow.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  let lossAnalysis = data.lossAnalysis;
  let topEnergyNodes = data.topEnergyNodes;

  // Filter by priority if needed
  const priority = searchParams.get('priority');
  if (priority) {
    lossAnalysis = lossAnalysis.filter((item: any) => item.priority === priority);
  }

  // Filter by stage
  const stage = searchParams.get('stage');
  if (stage) {
    lossAnalysis = lossAnalysis.filter((item: any) => item.stage === stage);
    topEnergyNodes = topEnergyNodes.filter((node: any) => node.type === stage);
  }

  return NextResponse.json({
    success: true,
    summary: data.summary,
    energyInputs: data.energyInputs,
    conversionStages: data.conversionStages,
    lossAnalysis,
    efficiencyTrend: data.efficiencyTrend,
    topEnergyNodes,
  });
}