'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// ===== Types =====
interface Period { id: string; label: string; }
interface StructureData { labels: string[]; values: number[]; colors: string[]; }
interface CostItem { period: string; total: number; electricity: number; gas: number; coal: number; other: number; }
interface EfficiencyItem { unit: string; unitLevel: string; energyIntensity: number; industryAvg: number; industryAdv: number; trend: string; score: number; }
interface Recommendation { id: number; title: string; category: string; description: string; expectedSaving: string; expectedTce: number; investment: string; payback: string; status: string; priority: string; tags: string[]; }
interface Summary { totalEnergyCost: number; costTrend: number; avgEfficiency: number; efficiencyTrend: number; recommendationCount: number; totalSaving: number; totalTceSaving: number; }

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-50 text-green-600' : score >= 70 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{score}</span>;
}

export default function EnergyAnalysisPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [structureData, setStructureData] = useState<Record<string, StructureData>>({});
  const [costAnalysis, setCostAnalysis] = useState<CostItem[]>([]);
  const [efficiency, setEfficiency] = useState<EfficiencyItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [structureView, setStructureView] = useState<'enterprise' | 'workshop'>('enterprise');

  const [filters, setFilters] = useState({ period: '', unit: '' });

  const fetchData = useCallback(async (f: typeof filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.period) params.set('period', f.period);
      if (f.unit) params.set('unit', f.unit);
      const res = await fetch(`/api/energy-analysis?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPeriods(data.periods);
        setStructureData(data.structureData);
        setCostAnalysis(data.costAnalysis);
        setEfficiency(data.efficiencyAnalysis);
        setRecommendations(data.recommendations);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { document.title = '能碳管理平台 - F-03 能源消费分析与用能策略推荐'; fetchData(filters); }, [fetchData, filters]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));
  };
  const resetFilters = () => setFilters({ period: '', unit: '' });
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  // Chart data
  const currentStructure = structureData[structureView] || { labels: [], values: [], colors: [] };
  const structureChartData = {
    labels: currentStructure.labels,
    datasets: [{ data: currentStructure.values, backgroundColor: currentStructure.colors, borderWidth: 0, hoverOffset: 4 }]
  };

  const costChartData = {
    labels: costAnalysis.map(c => c.period),
    datasets: [
      { label: '电力', data: costAnalysis.map(c => c.electricity), backgroundColor: '#3B82F6', borderRadius: 2 },
      { label: '天然气', data: costAnalysis.map(c => c.gas), backgroundColor: '#F97316', borderRadius: 2 },
      { label: '煤炭', data: costAnalysis.map(c => c.coal), backgroundColor: '#64748B', borderRadius: 2 },
      { label: '其他', data: costAnalysis.map(c => c.other), backgroundColor: '#94A3B8', borderRadius: 2 },
    ]
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-red-50 text-red-600 border-red-200',
    medium: 'bg-amber-50 text-amber-600 border-amber-200',
    low: 'bg-blue-50 text-blue-600 border-blue-200',
  };
  const statusLabels: Record<string, string> = {
    recommended: '推荐',
    planned: '已规划',
    evaluating: '评估中',
  };

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
              <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">能源消费分析与用能策略推荐</h1>
              <p className="text-[13px] text-slate-500 mt-1">基于实测数据，对用能单元的能源结构、成本、效率进行分析并推荐优化策略</p>
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
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">分析周期</span>
                <select value={filters.period} onChange={e => updateFilter('period', e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400">
                  <option value="">全部周期</option>
                  {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <select value={filters.unit} onChange={e => updateFilter('unit', e.target.value)}
                className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400">
                <option value="">全部用能单元</option>
                <option value="企业级">企业级</option>
                <option value="车间级">车间级</option>
                <option value="产线级">产线级</option>
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
              { label: '能源成本合计', value: summary ? summary.totalEnergyCost.toFixed(1) : '—', unit: '万元', change: summary?.costTrend, changeLabel: '环比', color: 'blue' },
              { label: '平均用能效率', value: summary ? summary.avgEfficiency.toFixed(4) : '—', unit: 'tce/万元', change: summary?.efficiencyTrend, changeLabel: '环比', color: 'green' },
              { label: '策略建议数', value: summary?.recommendationCount.toString() || '—', unit: '条', change: 2, changeLabel: '新增本月', color: 'orange' },
              { label: '预计年节约', value: summary ? summary.totalSaving.toFixed(0) : '—', unit: '万元', change: 0, changeLabel: '', color: 'purple' },
            ].map((card, i) => {
              const gradients = ['from-blue-400 to-blue-300', 'from-green-400 to-emerald-300', 'from-orange-400 to-amber-300', 'from-purple-400 to-violet-300'];
              const iconColors = ['bg-blue-50 text-blue-500', 'bg-green-50 text-green-500', 'bg-orange-50 text-orange-500', 'bg-purple-50 text-purple-500'];
              const icons = [
                <svg key="a" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>,
                <svg key="b" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
                <svg key="c" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6"/><path d="M9 16h6"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
                <svg key="d" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/><path d="M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83m0-14.14-2.83 2.83m-8.48 8.48-2.83 2.83"/></svg>,
              ];
              return (
                <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradients[i]}`}></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">{card.label}</span>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[i]}`}>{icons[i]}</div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[28px] font-bold text-slate-800 tracking-tight leading-none">{card.value}</span>
                    <span className="text-sm font-medium text-slate-400 ml-1">{card.unit}</span>
                  </div>
                  {card.change !== 0 && card.changeLabel && (
                    <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${(card.change ?? 0) >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {(card.change ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(card.change ?? 0).toFixed(1)}% {card.changeLabel}
                    </div>
                  )}
                  {i === 1 && summary && (
                    <div className="text-[11px] text-slate-400 mt-1.5">行业基准 {summary.avgEfficiency.toFixed(3)}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Charts Row ===== */}
        <div className="px-8 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
            {/* Structure Chart */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">能源结构分析</div>
                  <div className="text-xs text-slate-400 mt-0.5">各品种消费占比</div>
                </div>
                <div className="flex gap-1">
                  {(['enterprise', 'workshop'] as const).map(v => (
                    <button key={v} onClick={() => setStructureView(v)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${structureView === v ? 'bg-orange-500 text-white' : 'text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                    >{{ enterprise: '企业级', workshop: '车间级' }[v]}</button>
                  ))}
                </div>
              </div>
              <div className="h-[280px] flex items-center justify-center chart-entrance">
                <div className="w-full h-[260px] px-2 chart-entrance">
                  <Bar data={{
                    labels: currentStructure.labels,
                    datasets: [{
                      data: currentStructure.values,
                      backgroundColor: currentStructure.colors,
                      borderRadius: 4,
                      borderSkipped: false,
                    }]
                  }} options={{
                    responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
                    plugins: {
                      legend: { display: false },
                      tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8, callbacks: { label: (ctx: any) => `${ctx.parsed.x}%` } },
                    },
                    scales: {
                      x: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8', callback: (v: any) => `${v}%` } },
                      y: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#64748B' } },
                    },
                  }}/>
                </div>
              </div>
            </div>

            {/* Cost Trend Chart */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">能源成本趋势</div>
                  <div className="text-xs text-slate-400 mt-0.5">分品种月度成本走势（万元）</div>
                </div>
              </div>
              <div className="h-[280px] chart-entrance">
                <Bar data={costChartData}                   options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
                      tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8, callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y} 万元` } },
                    },
                    scales: {
                      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
                      y: { stacked: true, grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8', callback: (v: any) => `${v}万` } },
                    },
                  }}/>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Efficiency Comparison ===== */}
        <div className="px-8 pb-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 border-b border-slate-100 bg-slate-50/50">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>
              用能效率对标分析
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left whitespace-nowrap">用能单元</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">单位产值能耗</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">行业平均值</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">行业领先值</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center whitespace-nowrap">趋势</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center whitespace-nowrap">评分</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400"><div className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>加载中...</div></td></tr>
                  ) : efficiency.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">暂无数据</td></tr>
                  ) : efficiency.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-4 py-3 text-sm"><div>{item.unit}</div><div className="text-[11px] text-slate-400">{item.unitLevel}</div></td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{item.energyIntensity.toFixed(3)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-slate-500">{item.industryAvg.toFixed(3)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-slate-400">{item.industryAdv.toFixed(3)}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        {item.trend === 'up' ? <span className="text-green-600">↑ 改善</span> : item.trend === 'down' ? <span className="text-red-600">↓ 恶化</span> : <span className="text-slate-400">→ 平稳</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-center"><ScoreBadge score={item.score} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===== Strategy Recommendations ===== */}
        <div className="px-8 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <h2 className="text-base font-semibold text-slate-800">用能策略推荐</h2>
            <span className="text-xs text-slate-400 ml-1">共 {recommendations.length} 条建议</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden cursor-pointer">
                <div className={`absolute top-0 left-0 right-0 h-[3px] ${r.priority === 'high' ? 'bg-gradient-to-r from-red-400 to-red-300' : r.priority === 'medium' ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-gradient-to-r from-blue-400 to-blue-300'}`}></div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityColors[r.priority]}`}>
                      {{ high: '高优先', medium: '中优先', low: '参考' }[r.priority]}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">{r.category}</span>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{statusLabels[r.status] || r.status}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1.5">{r.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{r.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>预计节约 <strong className="text-green-600">{r.expectedSaving}</strong></span>
                  <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>折标煤 <strong className="text-orange-600">{r.expectedTce} tce</strong></span>
                  <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>投资 <strong>{r.investment}</strong> · 回收期 <strong>{r.payback}</strong></span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {r.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-200">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
