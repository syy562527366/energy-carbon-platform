'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler);

// ===== Types =====
interface Summary {
  overallEfficiency: number;
  optimizationPotential: number;
  expectedSavings: number;
  implementationProgress: number;
  optimizedCount: number;
  totalMeasures: number;
  efficiencyChange: number;
  savingsChange: number;
}

interface BalanceDimension {
  name: string;
  current: number;
  target: number;
  benchmark: number;
}

interface ProcessOptimization {
  id: number;
  process: string;
  parameter: string;
  current: string;
  optimized: string;
  savings: number;
  savingsUnit: string;
  status: string;
  description: string;
  implementDate: string;
}

interface EquipmentOptimization {
  id: number;
  equipment: string;
  parameter: string;
  current: string;
  recommended: string;
  savings: number;
  status: string;
}

interface ComparisonItem {
  name: string;
  before: number;
  after: number;
  unit: string;
  improvement: number;
}

interface ComparisonData {
  optimizedItems: ComparisonItem[];
  totalSavings: number;
}

interface MonthlySaving {
  month: string;
  actual: number;
  planned: number;
}

// ===== Status Badge =====
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    '已实施': 'bg-green-50 text-green-600 border-green-200',
    '已优化': 'bg-green-50 text-green-600 border-green-200',
    '优化中': 'bg-blue-50 text-blue-600 border-blue-200',
    '待验证': 'bg-amber-50 text-amber-600 border-amber-200',
    '待优化': 'bg-slate-50 text-slate-500 border-slate-200',
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[status] || 'bg-slate-50 text-slate-500'}`}>{status}</span>;
}

export default function EfficiencyOptimizationPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [balanceDimensions, setBalanceDimensions] = useState<BalanceDimension[]>([]);
  const [processOptimizations, setProcessOptimizations] = useState<ProcessOptimization[]>([]);
  const [equipmentOptimizations, setEquipmentOptimizations] = useState<EquipmentOptimization[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [monthlySavings, setMonthlySavings] = useState<MonthlySaving[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/efficiency-optimization');
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setBalanceDimensions(data.balanceDimensions);
        setProcessOptimizations(data.processOptimizations);
        setEquipmentOptimizations(data.equipmentOptimizations);
        setComparisonData(data.comparisonData);
        setMonthlySavings(data.monthlySavings);
      }
    } catch (err) {
      console.error('Failed to fetch', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = '能碳管理平台 - F-06 能效平衡与优化';
    fetchData();
  }, [fetchData]);

  // ===== Radar Chart for Balance Dimensions =====
  const radarData = {
    labels: balanceDimensions.map(d => d.name),
    datasets: [
      {
        label: '当前值',
        data: balanceDimensions.map(d => d.current),
        borderColor: '#F97316',
        backgroundColor: 'rgba(249,115,22,0.15)',
        pointBackgroundColor: '#F97316',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        borderWidth: 2.5,
      },
      {
        label: '目标值',
        data: balanceDimensions.map(d => d.target),
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34,197,94,0.1)',
        pointBackgroundColor: '#22C55E',
        pointBorderColor: '#fff',
        borderWidth: 2,
        borderDash: [4, 3],
      },
      {
        label: '基准值',
        data: balanceDimensions.map(d => d.benchmark),
        borderColor: '#94A3B8',
        backgroundColor: 'rgba(148,163,184,0.05)',
        pointBackgroundColor: '#94A3B8',
        pointBorderColor: '#fff',
        borderWidth: 1.5,
        borderDash: [2, 4],
      },
    ]
  };

  // ===== Bar Chart for Before/After Comparison =====
  const compareLabels = comparisonData?.optimizedItems.map(i => i.name) || [];
  const compareData = {
    labels: compareLabels,
    datasets: [
      {
        label: '优化前',
        data: comparisonData?.optimizedItems.map(i => i.before) || [],
        backgroundColor: 'rgba(148,163,184,0.6)',
        borderRadius: 4,
        barThickness: 20,
      },
      {
        label: '优化后',
        data: comparisonData?.optimizedItems.map(i => i.after) || [],
        backgroundColor: 'rgba(34,197,94,0.7)',
        borderRadius: 4,
        barThickness: 20,
      },
    ]
  };

  // ===== Bar Chart for Monthly Savings =====
  const savingsData = {
    labels: monthlySavings.map(m => m.month),
    datasets: [
      {
        label: '实际节能量',
        data: monthlySavings.map(m => m.actual),
        backgroundColor: 'rgba(59,130,246,0.7)',
        borderRadius: 3,
        barThickness: 20,
      },
      {
        label: '计划节能量',
        data: monthlySavings.map(m => m.planned),
        backgroundColor: 'rgba(148,163,184,0.3)',
        borderRadius: 3,
        barThickness: 20,
      },
    ]
  };

  // Radar chart options
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 14, font: { size: 11 } } },
      tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8, callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.r}%` } },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false, stepSize: 20 },
        grid: { color: '#F1F5F9' },
        angleLines: { color: '#E2E8F0' },
        pointLabels: { font: { size: 11 }, color: '#475569' },
      },
    },
  };

  // Monthly savings bar options
  const savingsBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 10, font: { size: 10 } } },
      tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8, callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y} tce` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
      y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8', callback: (v: any) => `${v} tce` } },
    },
  };

  // Comparison bar options
  const compareBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 14, font: { size: 11 } } },
      tooltip: {
        backgroundColor: '#0F172A',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const item = comparisonData?.optimizedItems[ctx.dataIndex];
            const val = ctx.parsed.y;
            return `${ctx.dataset.label}: ${val}${item?.unit || ''}`;
          },
          afterLabel: (ctx: any) => {
            const item = comparisonData?.optimizedItems[ctx.dataIndex];
            if (!item || ctx.dataset.label !== '优化后') return '';
            const arrow = item.before < item.after ? '↑' : '↓';
            return `变化: ${arrow} ${Math.abs(item.improvement).toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#334155' } },
      y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
    },
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
              <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">能效平衡与优化</h1>
              <p className="text-[13px] text-slate-500 mt-1">利用大数据和AI技术，优化工艺和设备运行参数，实现能源综合平衡与优化调度</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              导出报告
            </button>
          </div>
        </div>

        {/* ===== KPI Cards ===== */}
        <div className="px-8 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '综合能效', value: summary?.overallEfficiency.toFixed(1) || '—', unit: '%', change: summary?.efficiencyChange || 0, changeLabel: '较上期', color: 'blue', icon: 'activity' },
              { label: '优化潜力', value: summary?.optimizationPotential.toFixed(1) || '—', unit: '%', change: -0.8, changeLabel: '较上期', color: 'orange', icon: 'trend' },
              { label: '预期节能量', value: summary?.expectedSavings.toLocaleString() || '—', unit: 'tce', change: summary?.savingsChange || 0, changeLabel: '较上期', color: 'green', icon: 'savings' },
              { label: '实施进度', value: summary?.implementationProgress || '—', unit: '%', change: summary?.optimizedCount || 0, changeLabel: `/${summary?.totalMeasures || 0}项完成`, color: 'purple', icon: 'progress' },
            ].map((card, i) => {
              const iconColors = ['bg-blue-50 text-blue-500', 'bg-orange-50 text-orange-500', 'bg-green-50 text-green-500', 'bg-purple-50 text-purple-500'];
              const gradients = ['from-blue-400 to-blue-300', 'from-orange-400 to-amber-300', 'from-green-400 to-emerald-300', 'from-purple-400 to-violet-300'];
              return (
                <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradients[i]}`}></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">{card.label}</span>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[i]}`}>
                      {i === 0 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                      {i === 1 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>}
                      {i === 2 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>}
                      {i === 3 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[28px] font-bold text-slate-800 tracking-tight leading-none">{card.value}</span>
                    <span className="text-sm font-medium text-slate-400 ml-1">{card.unit}</span>
                  </div>
                  <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                    (card.change >= 0 && card.color !== 'orange') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change)}{card.changeLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Balance Radar + Monthly Savings ===== */}
        <div className="px-8 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
            {/* Balance Radar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">能效综合平衡模型</div>
                  <div className="text-xs text-slate-400 mt-0.5">6大核心维度的当前值、目标值与行业基准对比</div>
                </div>
              </div>
              <div className="h-[280px]">
                {balanceDimensions.length > 0 ? (
                  <Radar data={radarData} options={radarOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">加载中...</div>
                )}
              </div>
            </div>

            {/* Monthly Savings */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">月度节能量追踪</div>
                  <div className="text-xs text-slate-400 mt-0.5">实际节能量与计划对比</div>
                </div>
              </div>
              <div className="h-[280px]">
                {monthlySavings.length > 0 ? (
                  <Bar data={savingsData} options={savingsBarOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">加载中...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Process Optimization Suggestions ===== */}
        <div className="px-8 pb-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">工艺参数优化建议</div>
                <div className="text-xs text-slate-400 mt-0.5">基于能效分析生成的工艺参数优化方案</div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {loading ? (
                <div className="col-span-2 text-center py-12 text-slate-400">加载中...</div>
              ) : processOptimizations.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400">暂无优化建议</div>
              ) : processOptimizations.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-800">{item.process}</h4>
                      <StatusBadge status={item.status} />
                    </div>
                    <span className="text-xs font-bold text-green-600 whitespace-nowrap">+{item.savings} {item.savingsUnit}/年</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{item.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                    <span>参数：<strong className="text-slate-700">{item.parameter}</strong></span>
                    <span className="text-slate-300">|</span>
                    <span>当前：<strong className="text-red-500">{item.current}</strong></span>
                    <span className="text-slate-300">→</span>
                    <span>优化：<strong className="text-green-600">{item.optimized}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Equipment Parameter Optimization Table ===== */}
        <div className="px-8 pb-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">设备运行参数优化</h3>
                <div className="text-xs text-slate-400 mt-0.5">主要用能设备运行参数优化建议</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left">设备名称</th>
                    <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left">优化参数</th>
                    <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center">当前值</th>
                    <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center">建议值</th>
                    <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right">预计节约</th>
                    <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">加载中...</td></tr>
                  ) : equipmentOptimizations.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">暂无数据</td></tr>
                  ) : equipmentOptimizations.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.equipment}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.parameter}</td>
                      <td className="px-4 py-3 text-sm text-center font-mono text-red-500 font-semibold">{item.current}</td>
                      <td className="px-4 py-3 text-sm text-center font-mono text-green-600 font-semibold">{item.recommended}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-green-600">{item.savings} tce</td>
                      <td className="px-4 py-3 text-sm text-center"><StatusBadge status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===== Before/After Comparison ===== */}
        <div className="px-8 pb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">优化前后效果对比</div>
                <div className="text-xs text-slate-400 mt-0.5">各项能效指标优化前后的变化</div>
              </div>
              {comparisonData && (
                <div className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg">
                  累计节能量：{comparisonData.totalSavings.toLocaleString()} tce
                </div>
              )}
            </div>
            <div className="h-[280px]">
              {comparisonData && comparisonData.optimizedItems.length > 0 ? (
                <Bar data={compareData} options={compareBarOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">加载中...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
