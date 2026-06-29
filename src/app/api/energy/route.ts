import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'energy-consumption.json');

export async function GET(request: NextRequest) {
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(raw);

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '';
    const energyType = searchParams.get('energyType') || '';
    const unit = searchParams.get('unit') || '';
    const source = searchParams.get('source') || '';
    const status = searchParams.get('status') || '';

    let records = [...data.records];

    if (timeRange) {
      const now = new Date();
      records = records.filter((r: any) => {
        const d = new Date(r.time);
        switch (timeRange) {
          case 'today': return d.toDateString() === now.toDateString();
          case 'month': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          case 'quarter': {
            const q = Math.floor(now.getMonth() / 3);
            return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
          }
          case 'year': return d.getFullYear() === now.getFullYear();
          default: return true;
        }
      });
    }

    if (energyType) {
      records = records.filter((r: any) => r.energyType.includes(energyType));
    }

    if (unit) {
      records = records.filter((r: any) => r.unitLevel === unit || r.unit.includes(unit));
    }

    if (source) {
      records = records.filter((r: any) => r.source === source);
    }

    if (status) {
      records = records.filter((r: any) => r.status === status);
    }

    return NextResponse.json({ success: true, records, summary: data.summary });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load data' }, { status: 500 });
  }
}
