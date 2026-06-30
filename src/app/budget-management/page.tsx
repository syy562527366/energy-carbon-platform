'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// ===== Types =====
interface Summary {
  energyBudget: number;
  energyUsed: number;
  energyUsageRate: number;
  carbonBudget: number;
  carbonEmitted: number;
  carbonUsageRate: number;
  energyYearTarget: number;
  carbonYearTarget: number;
  energyChange: number;
  carbonChange: number;
  alertCount: number;
}

interface MonthlyItem {
  month: string;
  energyBudget: number;
  energyActual: number;
  carbonBudget: number;
  carbonActual: number;
}

interface Alert {
  id: number;
  type: string;
  title: string;
  description: string;
  time: string;
  status: string;
}

interface ForecastItem {
  month: string;
  energyForecast: number;
  energyBudget: number;
  carbonForecast: number;
  carbonBudget: number;
}

interface CategoryItem {
  name: string;
  budget: number;
  used: number;
  unit: string;
}

// ===== Alert Badge =====
function AlertBadge({ type }: { type: string }) {
  const icons: Record<string, string> = { danger: '🔴', warning: '🟡', info: '🔵', success: '🟢' };
  const labels: Record<string, string> = { danger: '严重', warning: '预警', info: '提示', success: '正常' };
  const colors: Record<string, string> = {
    danger: 'bg-red-50 text-red-600 border-red-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    info: 'bg-blue-50 text-blue-600 border-blue-200',
    success: 'bg-green-50 text-green-600 border-green-200',
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[type] || 'bg-slate-50 text-slate-500'}`}>{icons[type] || ''} {labels[type] || type}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    '未处理': 'bg-red-50 text-red-600 border-red-200',
    '处理中': 'bg-amber-50 text-amber-600 border-amber-200',
    '已处理': 'bg-green-50 text-green-600 border-green-200',
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[status] || 'bg-slate-50 text-slate-500'}`}>{status}</span>;
}

export default function BudgetManagementPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthlyExecution, setMonthlyExecution] = useState<MonthlyItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAlertType, setActiveAlertType] = useState('');

  const fetchData = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const params = type ? `?type=${type}` : '';
      const res = await fetch(`/api/budget-management${params}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setMonthlyExecution(data.monthlyExecution);
        setAlerts(data.alerts);
        setForecast(data.forecast);
        setCategoryBreakdown(data.categoryBreakdown);
      }
    } catch (err) {
      console.error('Failed to fetch', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = '能碳管理平台 - F-07 用能与碳排放预算管理';
    fetchData(activeAlertType);
  }, [fetchData, activeAlertType]);

  // ===== Energy Budget Doughnut =====
  const energyDonutData = {
    labels: ['已用能量', '剩余预算'],
    datasets: [{
      data: [summary?.energyUsed || 0, (summary?.energyBudget || 0) - (summary?.energyUsed || 0)],
      backgroundColor: ['#F97316', '#E2E8F0'],
      borderWidth: 0,
      hoverOffset: 4,
    }]
  };

  // ===== Carbon Budget Doughnut =====
  const carbonDonutData = {
    labels: ['已排放碳', '剩余预算'],
    datasets: [{
      data: [summary?.carbonEmitted || 0, (summary?.carbonBudget || 0) - (summary?.carbonEmitted || 0)],
      backgroundColor: ['#3B82F6', '#E2E8F0'],
      borderWidth: 0,
      hoverOffset: 4,
    }]
  };

  // ===== Monthly Execution Line =====
  const energyLineLabels = monthlyExecution.filter(m => m.energyActual > 0).map(m => m.month);
  const energyLineData = {
    labels: energyLineLabels,
    datasets: [
      {
        label: '用能预算(tce)',
        data: monthlyExecution.filter(m => m.energyActual > 0).map(m => m.energyBudget),
        borderColor: '#94A3B8',
        backgroundColor: 'rgba(148,163,184,0.05)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#94A3B8',
        borderWidth: 2,
        borderDash: [5, 3],
      },
      {
        label: '实际用量(tce)',
        data: monthlyExecution.filter(m => m.energyActual > 0).map(m => m.energyActual),
        borderColor: '#F97316',
        backgroundColor: 'rgba(249,115,22,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#F97316',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
    ]
  };

  // ===== Carbon Monthly Line =====
  const carbonLineLabels = monthlyExecution.filter(m => m.carbonActual > 0).map(m => m.month);
  const carbonLineData = {
    labels: carbonLineLabels,
    datasets: [
      {
        label: '碳预算(tCO₂)',
        data: monthlyExecution.filter(m => m.carbonActual > 0).map(m => m.carbonBudget),
        borderColor: '#94A3B8',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#94A3B8',
        borderWidth: 2,
        borderDash: [5, 3],
      },
      {
        label: '实际排放(tCO₂)',
        data: monthlyExecution.filter(m => m.carbonActual > 0).map(m => m.carbonActual),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
    ]
  };

  // ===== Forecast Line =====
  const forecastLabels = forecast.map(f => f.month);
  const forecastData = {
    labels: forecastLabels,
    datasets: [
      {
        label: '预测用量(tce)',
        data: forecast.map(f => f.energyForecast),
        borderColor: '#F97316',
        backgroundColor: 'rgba(249,115,22,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#F97316',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
      {
        label: '预算上限(tce)',
        data: forecast.map(f => f.energyBudget),
        borderColor: '#EF4444',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#EF4444',
        borderWidth: 2,
        borderDash: [6, 3],
      },
    ]
  };

  // ===== Category Breakdown Bar =====
  const categoryBarData = {
    labels: categoryBreakdown.map(c => c.name),
    datasets: [
      {
        label: '预算(tce)',
        data: categoryBreakdown.map(c => c.budget),
        backgroundColor: 'rgba(148,163,184,0.4)',
        borderRadius: 4,
        barThickness: 22,
      },
      {
        label: '已用(tce)',
        data: categoryBreakdown.map(c => c.used),
        backgroundColor: 'rgba(249,115,22,0.7)',
        borderRadius: 4,
        barThickness: 22,
      },
    ]
  };

  // Chart options
  const donutOptions = { responsive: true, maintainAspectRatio: false, cutout: '65%' as const, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0F172A' as const, padding: 10, cornerRadius: 8 } } };

  const energyLineOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
      tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8, callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} tce` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
      y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8', callback: (v: any) => `${v} tce` } },
    },
  };

  const carbonLineOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
      tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8, callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} tCO₂` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
      y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8', callback: (v: any) => `${v} tCO₂` } },
    },
  };

  const forecastChartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
      tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8, callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} tce` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
      y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8', callback: (v: any) => `${v} tce` } },
    },
  };

  const categoryBarOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
      tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8, callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} tce` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#334155' } },
      y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8', callback: (v: any) => `${v} tce` } },
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
              <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">用能与碳排放预算管理</h1>
              <p className="text-[13px] text-slate-500 mt-1">用能和碳排放预算编制、执行跟踪、分级预警和趋势预测分析</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              导出报告
            </button>
          </div>
        </div>

        {/* ===== KPI Cards ===== */}
        <div className="px-8 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '用能预算执行率', value: `${summary?.energyUsageRate.toFixed(1) || '—'}%`, unit: '', change: summary?.energyChange || 0, changeLabel: '超进度', color: 'orange' as const },
              { label: '碳排放预算执行率', value: `${summary?.carbonUsageRate.toFixed(1) || '—'}%`, unit: '', change: summary?.carbonChange || 0, changeLabel: 'vs预算', color: 'blue' as const },
              { label: '累计用能量', value: (summary?.energyUsed.toLocaleString() || '—'), unit: 'tce', change: 2.8, changeLabel: '同比', color: 'green' as const },
              { label: '累计碳排放量', value: (summary?.carbonEmitted.toLocaleString() || '—'), unit: 'tCO₂', change: -1.2, changeLabel: '同比', color: 'purple' as const },
            ].map((card, i) => {
              const iconColors = ['bg-orange-50 text-orange-500', 'bg-blue-50 text-blue-500', 'bg-green-50 text-green-500', 'bg-purple-50 text-purple-500'];
              const gradients = ['from-orange-400 to-amber-300', 'from-blue-400 to-blue-300', 'from-green-400 to-emerald-300', 'from-purple-400 to-violet-300'];
              return (
                <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradients[i]}`}></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">{card.label}</span>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[i]}`}>
                      {i === 0 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
                      {i === 1 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>}
                      {i === 2 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                      {i === 3 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[28px] font-bold text-slate-800 tracking-tight leading-none">{card.value}</span>
                    {card.unit && <span className="text-sm font-medium text-slate-400 ml-1">{card.unit}</span>}
                  </div>
                  <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                    (card.change >= 0 && card.color !== 'orange') || (card.color === 'orange' && card.change <= 0) ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {(card.change >= 0 ? '↑' : '↓')} {Math.abs(card.change).toFixed(1)}% {card.changeLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Budget Overview (Donuts) ===== */}
        <div className="px-8 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Energy Budget */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">用能预算执行总览</div>
                  <div className="text-xs text-slate-400 mt-0.5">年度预算 {summary?.energyBudget.toLocaleString()} tce</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className={`w-[140px] h-[140px] flex-shrink-0 ${summary ? 'chart-entrance' : ''}`}>
                  {summary ? <Doughnut data={energyDonutData} options={donutOptions} /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">...</div>}
                </div>
                <div className="flex-1">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>已用能量</span>
                        <span className="font-semibold text-orange-500">{summary?.energyUsed.toLocaleString()} tce</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${Math.min(summary?.energyUsageRate || 0, 100)}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>剩余预算</span>
                        <span className="font-semibold text-slate-700">{((summary?.energyBudget || 0) - (summary?.energyUsed || 0)).toLocaleString()} tce</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-slate-300" style={{ width: `${Math.min(100 - (summary?.energyUsageRate || 0), 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center gap-2 text-xs">
                      <span className="text-slate-400">年度目标</span>
                      <span className="font-semibold text-slate-700">{summary?.energyYearTarget.toLocaleString()} tce</span>
                      <span className={`ml-auto font-medium ${(summary?.energyUsageRate || 0) > 50 ? 'text-red-500' : 'text-green-500'}`}>
                        {(summary?.energyUsageRate || 0) > 50 ? '⚠ 超进度' : '✓ 正常'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carbon Budget */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">碳排放预算执行总览</div>
                  <div className="text-xs text-slate-400 mt-0.5">年度预算 {summary?.carbonBudget.toLocaleString()} tCO₂</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className={`w-[140px] h-[140px] flex-shrink-0 ${summary ? 'chart-entrance' : ''}`}>
                  {summary ? <Doughnut data={carbonDonutData} options={donutOptions} /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">...</div>}
                </div>
                <div className="flex-1">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>已排放</span>
                        <span className="font-semibold text-blue-500">{summary?.carbonEmitted.toLocaleString()} tCO₂</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(summary?.carbonUsageRate || 0, 100)}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>剩余预算</span>
                        <span className="font-semibold text-slate-700">{((summary?.carbonBudget || 0) - (summary?.carbonEmitted || 0)).toLocaleString()} tCO₂</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-slate-300" style={{ width: `${Math.min(100 - (summary?.carbonUsageRate || 0), 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center gap-2 text-xs">
                      <span className="text-slate-400">年度目标</span>
                      <span className="font-semibold text-slate-700">{summary?.carbonYearTarget.toLocaleString()} tCO₂</span>
                      <span className={`ml-auto font-medium ${(summary?.carbonUsageRate || 0) > 50 ? 'text-red-500' : 'text-green-500'}`}>
                        {(summary?.carbonUsageRate || 0) > 50 ? '⚠ 超进度' : '✓ 正常'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Monthly Trend + Category ===== */}
        <div className="px-8 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
            {/* Monthly Energy Trend */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">月度用能预算执行趋势</div>
                  <div className="text-xs text-slate-400 mt-0.5">月度预算与实际用量对比</div>
                </div>
              </div>
              <div className={`h-[260px] ${monthlyExecution.filter(m => m.energyActual > 0).length > 0 ? 'chart-entrance' : ''}`}>
                {monthlyExecution.filter(m => m.energyActual > 0).length > 0 ? (
                  <Line data={energyLineData} options={energyLineOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">加载中...</div>
                )}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">用能品种预算执行</div>
                  <div className="text-xs text-slate-400 mt-0.5">各能源品种预算 vs 已用量</div>
                </div>
              </div>
              <div className={`h-[260px] ${categoryBreakdown.length > 0 ? 'chart-entrance' : ''}`}>
                {categoryBreakdown.length > 0 ? (
                  <Bar data={categoryBarData} options={categoryBarOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">加载中...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Alerts ===== */}
        <div className="px-8 pb-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800">预算预警通知</div>
                  <div className="text-xs text-slate-400 mt-0.5">共 {alerts.length} 条预警，{alerts.filter(a => a.status === '未处理').length} 条待处理</div>
                </div>
                <div className="flex items-center gap-1.5 ml-4">
                  {['', 'danger', 'warning', 'info', 'success'].map(t => (
                    <button key={t} onClick={() => setActiveAlertType(activeAlertType === t ? '' : t)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                        activeAlertType === t ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}>
                      {t === '' ? '全部' : t === 'danger' ? '严重' : t === 'warning' ? '预警' : t === 'info' ? '提示' : '正常'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8 text-slate-400 text-sm">加载中...</div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">暂无预警</div>
              ) : alerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {alert.type === 'danger' && <span className="text-lg">🔴</span>}
                    {alert.type === 'warning' && <span className="text-lg">🟡</span>}
                    {alert.type === 'info' && <span className="text-lg">🔵</span>}
                    {alert.type === 'success' && <span className="text-lg">🟢</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-800">{alert.title}</span>
                      <AlertBadge type={alert.type} />
                      <StatusBadge status={alert.status} />
                    </div>
                    <p className="text-xs text-slate-500">{alert.description}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Forecast ===== */}
        <div className="px-8 pb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">趋势预测与情景分析</div>
                <div className="text-xs text-slate-400 mt-0.5">下半年用能趋势预测与预算上限对比</div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-md font-medium">预测值</span>
                <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md font-medium">预算上限</span>
              </div>
            </div>
            <div className={`h-[260px] ${forecast.length > 0 ? 'chart-entrance' : ''}`}>
              {forecast.length > 0 ? (
                <Line data={forecastData} options={forecastChartOptions} />
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
