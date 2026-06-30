'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// ===== Types =====
interface Period { id: string; label: string; }
interface BenchmarkTarget { id: number; name: string; category: string; unit: string; actual: number; limit: number; advanced: number; baseline: number; status: string; trend: string; }
interface HistoryItem { period: string; 达标数: number; 未达标数: number; 达标率: number; }
interface Summary { totalTargets: number; 达标数: number; 未达标数: number; 达标率: number; avgGap: number; trend: number; }

function StatusBadge({ status, type }: { status: string; type?: string }) {
  const colors: Record<string, string> = {
    '达标': 'bg-green-50 text-green-600 border-green-200',
    '未达标': 'bg-orange-50 text-orange-600 border-orange-200',
  };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colors[status] || 'bg-slate-50 text-slate-500'}`}>{status}</span>;
}

function GaugeBar({ actual, limit, baseline, advanced }: { actual: number; limit: number; baseline: number; advanced: number }) {
  const max = Math.max(actual, baseline) * 1.3;
  const pct = (v: number) => Math.min((v / max) * 100, 100);
  const isPass = actual <= limit;
  const actualColor = isPass ? '#22C55E' : '#F97316';
  return (
    <div className="relative w-full h-5 bg-slate-100 rounded-full overflow-hidden">
      {/* Baseline */}
      <div className="absolute top-0 left-0 h-full bg-slate-200" style={{ width: `${pct(baseline)}%`, borderRadius: '999px' }}></div>
      {/* Limit marker */}
      <div className="absolute top-0 h-full w-0.5 bg-amber-500 z-10" style={{ left: `${pct(limit)}%` }}></div>
      {/* Advanced marker */}
      <div className="absolute top-0 h-full w-0.5 bg-blue-500 z-10" style={{ left: `${pct(advanced)}%` }}></div>
      {/* Actual */}
      <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-500" style={{ width: `${pct(actual)}%`, background: actualColor, opacity: 0.7 }}></div>
    </div>
  );
}

export default function BenchmarkingPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [targets, setTargets] = useState<BenchmarkTarget[]>([]);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ period: '', category: '', status: '' });

  const fetchData = useCallback(async (f: typeof filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.period) params.set('period', f.period);
      if (f.category) params.set('category', f.category);
      if (f.status) params.set('status', f.status);
      const res = await fetch(`/api/benchmarking?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPeriods(data.periods);
        setTargets(data.targets);
        setHistoryData(data.historyData);
        setSummary(data.summary);
      }
    } catch (err) { console.error('Failed to fetch', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { document.title = '能碳管理平台 - F-04 能效对标'; fetchData(filters); }, [fetchData, filters]);

  const updateFilter = (key: keyof typeof filters, value: string) => setFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));
  const resetFilters = () => setFilters({ period: '', category: '', status: '' });
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const complianceChartData = {
    labels: historyData.map(h => h.period),
    datasets: [{
      label: '达标率 (%)',
      data: historyData.map(h => h.达标率),
      borderColor: '#22C55E',
      backgroundColor: (ctx: any) => {
        if (!ctx.chart?.ctx) return 'rgba(34,197,94,0.1)';
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, 'rgba(34,197,94,0.3)');
        gradient.addColorStop(1, 'rgba(34,197,94,0.02)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: '#22C55E',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      borderWidth: 3,
    }]
  };

  // Donut data for current period
  const currentHistory = historyData[historyData.length - 1] || { 达标数: 0, 未达标数: 0 };
  const donutData = {
    labels: ['达标', '未达标'],
    datasets: [{
      data: [currentHistory.达标数, currentHistory.未达标数],
      backgroundColor: ['#22C55E', '#F97316'],
      borderWidth: 0,
      hoverOffset: 4,
    }]
  };

  const categories = [...new Set(targets.map(t => t.category))];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[260px]">
        {/* ===== Top Bar ===== */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-orange-500 transition-colors">能碳管理平台</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer">王</div>
          </div>
        </header>

        {/* ===== Page Header ===== */}
        <div className="px-8 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">能效对标</h1>
              <p className="text-[13px] text-slate-500 mt-1">对主要产品、设备开展能效对标，与国家限额值、行业领先值/基准值/准入值对比</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              导出报告
            </button>
          </div>
        </div>

        {/* ===== Filter Bar ===== */}
        <div className="px-8 pb-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-[12px_16px]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">对标周期</span>
                <select value={filters.period} onChange={e => updateFilter('period', e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400">
                  <option value="">全部周期</option>
                  {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <select value={filters.category} onChange={e => updateFilter('category', e.target.value)}
                className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400">
                <option value="">全部类别</option>
                <option value="单位产品能耗">单位产品能耗</option>
                <option value="设备能效">设备能效</option>
                <option value="行业对标">行业对标</option>
              </select>
              <select value={filters.status} onChange={e => updateFilter('status', e.target.value)}
                className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400">
                <option value="">全部状态</option>
                <option value="达标">达标</option>
                <option value="未达标">未达标</option>
              </select>
              <button onClick={resetFilters} className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors">重置</button>
              {activeFilterCount > 0 && <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-1 rounded-md">{activeFilterCount} 个筛选</span>}
            </div>
          </div>
        </div>

        {/* ===== KPI Cards ===== */}
        <div className="px-8 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '对标项总数', value: summary?.totalTargets.toString() || '—', unit: '项', change: 0, changeLabel: '', color: 'blue' },
              { label: '达标项', value: summary?.达标数.toString() || '—', unit: '项', change: 0, changeLabel: '', color: 'green' },
              { label: '未达标项', value: summary?.未达标数.toString() || '—', unit: '项', change: 0, changeLabel: '', color: 'red' },
              { label: '综合达标率', value: summary?.达标率.toFixed(1) || '—', unit: '%', change: summary?.trend, changeLabel: '环比', color: 'purple' },
            ].map((card, i) => {
              const gradients = ['from-blue-400 to-blue-300', 'from-green-400 to-emerald-300', 'from-orange-400 to-amber-300', 'from-purple-400 to-violet-300'];
              const iconColors = ['bg-blue-50 text-blue-500', 'bg-green-50 text-green-500', 'bg-orange-50 text-orange-500', 'bg-purple-50 text-purple-500'];
              const icons = [
                <svg key="a" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>,
                <svg key="b" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
                <svg key="c" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
                <svg key="d" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
              ];
              return (
                <div key={i} className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradients[i]}`}></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">{card.label}</span>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[i]}`}>{icons[i]}</div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-[28px] font-bold tracking-tight leading-none ${i === 2 && summary && summary.未达标数 > 0 ? 'text-orange-500' : 'text-slate-800'}`}>{card.value}</span>
                    <span className="text-sm font-medium text-slate-400 ml-1">{card.unit}</span>
                  </div>
                  {card.change !== 0 && card.changeLabel && (
                    <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${(card.change ?? 0) >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {(card.change ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(card.change ?? 0).toFixed(1)}% {card.changeLabel}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Compliance Trend + Category Summary ===== */}
        <div className="px-8 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">达标率趋势</div>
                  <div className="text-xs text-slate-400 mt-0.5">月度综合达标率变化</div>
                </div>
              </div>
              <div className="h-[260px] chart-entrance">
                <Line data={complianceChartData} options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8, callbacks: { label: (ctx: any) => `达标率: ${ctx.parsed.y}%` } },
                  },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
                    y: { min: 0, max: 100, grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8', callback: (v: any) => `${v}%` } },
                  },
                }}/>
              </div>
            </div>

            {/* Category Summary */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">类别分布</div>
                  <div className="text-xs text-slate-400 mt-0.5">各对标类别统计</div>
                </div>
              </div>
              <div className="space-y-5 pt-2">
                {categories.map(cat => {
                  const items = targets.filter(t => t.category === cat);
                  const pass = items.filter(t => t.status === '达标').length;
                  const fail = items.filter(t => t.status === '未达标').length;
                  const rate = items.length > 0 ? Math.round((pass / items.length) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-600">{cat}</span>
                        <span className="text-xs text-slate-400">{pass}/{items.length} 达标 · {rate}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${rate}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Current Period Donut ===== */}
        <div className="px-8 pb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">当期达标分布</div>
                <div className="text-xs text-slate-400 mt-0.5">最新周期达标概况</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-10">
              <div className="w-[220px] h-[220px] chart-entrance">
                <Doughnut data={donutData} options={{
                  responsive: true, maintainAspectRatio: false, cutout: '58%',
                  plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed} 项` } },
                  },
                }}/>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-green-500"></span>
                  <div>
                    <div className="text-lg font-bold text-slate-800">{currentHistory.达标数}<span className="text-sm font-normal text-slate-400 ml-1">项</span></div>
                    <div className="text-xs text-slate-500">达标</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-orange-500"></span>
                  <div>
                    <div className="text-lg font-bold text-slate-800">{currentHistory.未达标数}<span className="text-sm font-normal text-slate-400 ml-1">项</span></div>
                    <div className="text-xs text-slate-500">未达标</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500 mb-0.5">综合达标率</div>
                  <div className="text-2xl font-bold text-green-600">{currentHistory.达标率}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Benchmarking Table ===== */}
        <div className="px-8 pb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">能效对标明细</h3>
                <div className="text-xs text-slate-400 mt-0.5">参照国家/行业标准进行对标分析</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left whitespace-nowrap">对标项</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left whitespace-nowrap">类别</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">实际值</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">限额值</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">基准值</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">领先值</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center whitespace-nowrap" style={{ minWidth: 180 }}>差距</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center whitespace-nowrap">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-400"><div className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>加载中...</div></td></tr>
                  ) : targets.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-400">暂无数据</td></tr>
                  ) : targets.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{t.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{t.category}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold">{t.actual} <span className="text-[11px] text-slate-400 font-normal">{t.unit}</span></td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-slate-500">{t.limit}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-slate-400">{t.baseline}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-slate-400">{t.advanced}</td>
                      <td className="px-4 py-3 text-sm" style={{ minWidth: 180 }}>
                        <GaugeBar actual={t.actual} limit={t.limit} baseline={t.baseline} advanced={t.advanced} />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 px-0.5">
                          <span>实际</span>
                          <span className="text-amber-500">限额</span>
                          <span className="text-blue-500">领先</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>共 {targets.length} 项对标指标</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
