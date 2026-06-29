'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

// ===== Types =====
interface EnergyRecord {
  id: number;
  time: string;
  unit: string;
  unitLevel: string;
  energyType: string;
  consumption: string;
  consumptionValue: number;
  coalEquivalent: number;
  cost: number;
  yoy: number;
  mom: number;
  source: string;
  status: string;
  statusType: string;
}

interface Summary {
  totalTce: number;
  totalCost: number;
  totalElectricity: number;
  totalGas: number;
  onlineMeters: number;
  completenessRate: number;
  abnormalPoints: number;
  dataDelay: number;
}

// ===== Filter Types =====
interface Filters {
  timeRange: string;
  energyType: string;
  unit: string;
  source: string;
  status: string;
}

// ===== Status Badge =====
function StatusBadge({ status, type }: { status: string; type: string }) {
  const colors: Record<string, string> = {
    normal: 'bg-green-50 text-green-600 border-green-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    critical: 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[type] || colors.normal}`}>
      <span className={`status-dot ${type}`}></span>
      {status}
    </span>
  );
}

// ===== Trend Indicator =====
function Trend({ value }: { value: number }) {
  const isUp = value > 0;
  const isDown = value < 0;
  return (
    <span className={isUp ? 'trend-up' : isDown ? 'trend-down' : 'text-slate-400'}>
      {isUp ? '↑' : isDown ? '↓' : '→'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export default function EnergyQueryPage() {
  const [records, setRecords] = useState<EnergyRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    timeRange: '',
    energyType: '',
    unit: '',
    source: '',
    status: '',
  });

  const [filterCounts, setFilterCounts] = useState<Record<string, number>>({});
  const [timelineView, setTimelineView] = useState<'day' | 'week' | 'month'>('day');

  // Chart data
  const trendChartData = {
    day: {
      labels: ['6/1', '6/3', '6/5', '6/7', '6/9', '6/11', '6/13', '6/15', '6/17', '6/19', '6/21', '6/23'],
      datasets: [
        { label: '煤炭 (t)', data: [82, 78, 85, 76, 80, 82, 74, 79, 83, 77, 86, 82], borderColor: '#64748B', backgroundColor: 'rgba(100,116,139,0.08)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
        { label: '电力/火电 (MWh)', data: [98, 112, 105, 120, 115, 108, 125, 118, 130, 122, 135, 128], borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
        { label: '天然气 (万m³)', data: [1.8, 1.9, 1.7, 2.0, 1.9, 1.8, 2.1, 1.9, 2.0, 1.8, 2.2, 2.0], borderColor: '#F97316', backgroundColor: 'rgba(249,115,22,0.08)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
      ]
    },
    week: {
      labels: ['第1周', '第2周', '第3周', '第4周'],
      datasets: [
        { label: '煤炭 (t)', data: [562, 548, 573, 555], borderColor: '#64748B', backgroundColor: 'rgba(100,116,139,0.08)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
        { label: '电力/火电 (MWh)', data: [758, 792, 815, 788], borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
        { label: '天然气 (万m³)', data: [12.6, 13.2, 12.8, 13.5], borderColor: '#F97316', backgroundColor: 'rgba(249,115,22,0.08)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
      ]
    },
    month: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      datasets: [
        { label: '煤炭 (t)', data: [2450, 2380, 2520, 2480, 2410, 2560], borderColor: '#64748B', backgroundColor: 'rgba(100,116,139,0.08)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
        { label: '电力/火电 (MWh)', data: [3450, 3520, 3680, 3550, 3720, 3810], borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
        { label: '天然气 (万m³)', data: [55, 54, 57, 56, 58, 59], borderColor: '#F97316', backgroundColor: 'rgba(249,115,22,0.08)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
      ]
    }
  };

  const structureChartData = {
    labels: ['电力', '天然气', '煤炭', '蒸汽', '柴油', '压缩空气'],
    datasets: [{
      data: [42, 22, 16, 10, 6, 4],
      backgroundColor: ['#3B82F6', '#F97316', '#1E293B', '#10B981', '#8B5CF6', '#94A3B8'],
      borderWidth: 0,
      hoverOffset: 4,
    }]
  };

  const fetchData = useCallback(async (f: Filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.timeRange) params.set('timeRange', f.timeRange);
      if (f.energyType) params.set('energyType', f.energyType);
      if (f.unit) params.set('unit', f.unit);
      if (f.source) params.set('source', f.source);
      if (f.status) params.set('status', f.status);

      const res = await fetch(`/api/energy?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = '能碳管理平台 - F-01 能耗查询';
    fetchData(filters);
  }, [fetchData, filters]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));
  };

  const resetFilters = () => {
    setFilters({ timeRange: '', energyType: '', unit: '', source: '', status: '' });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  // Compute filter counts from current (unfiltered) records
  useEffect(() => {
    if (!records.length) return;
    const counts: Record<string, number> = {};
    records.forEach(r => {
      counts[r.source] = (counts[r.source] || 0) + 1;
      counts[r.status] = (counts[r.status] || 0) + 1;
      counts[r.unitLevel] = (counts[r.unitLevel] || 0) + 1;
    });
    setFilterCounts(counts);
  }, [records]);

  // Stats cards data
  const statsCards = [
    { label: '总能源消费量（标准煤）', value: summary?.totalTce?.toLocaleString() || '—', unit: 'tce', change: 2.3, changeLabel: '环比上月', color: 'blue' },
    { label: '能源成本', value: summary ? (summary.totalCost / 10000).toFixed(0) : '—', unit: '万元', change: 1.8, changeLabel: '环比上月', color: 'orange' },
    { label: '单位产值能耗', value: '0.087', unit: 'tce/万元', change: -0.7, changeLabel: '环比上月', color: 'green' },
    { label: '综合电力消费', value: summary ? (summary.totalElectricity / 10000).toFixed(2) : '—', unit: '万MWh', change: -3.1, changeLabel: '同比去年', color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[260px] min-w-0">
      {/* ===== Top Bar ===== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Link href="/" className="hover:text-orange-500 transition-colors">能碳管理平台</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          </button>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer">王</div>
        </div>
      </header>

      {/* ===== Page Header ===== */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">能耗查询</h1>
            <p className="text-[13px] text-slate-500 mt-1">覆盖煤炭、焦炭、原油、天然气、电力（六类发电）、氢等 17 类能源品种</p>
            <p className="text-[13px] text-slate-400 mt-0.5">支持企业级→车间级→产线级→仪表级四级用能单元逐级下钻</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            导出报告
          </button>
        </div>
      </div>

      {/* ===== Filter Bar ===== */}
      <div className="px-6 pb-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-[12px_16px]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Time Range */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">时间范围</span>
              <select
                value={filters.timeRange || 'month'}
                onChange={e => updateFilter('timeRange', e.target.value)}
                className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              >
                <option value="today">今日</option>
                <option value="month">本月</option>
                <option value="quarter">本季度</option>
                <option value="year">本年</option>
              </select>
            </div>

            {/* Energy Type */}
            <select
              value={filters.energyType}
              onChange={e => updateFilter('energyType', e.target.value)}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            >
              <option value="">全部能源品种</option>
              <optgroup label="传统能源">
                <option value="煤炭">煤炭</option>
                <option value="焦炭">焦炭</option>
                <option value="原油">原油</option>
                <option value="汽油">汽油</option>
                <option value="煤油">煤油</option>
                <option value="柴油">柴油</option>
                <option value="燃料油">燃料油</option>
                <option value="天然气">天然气</option>
              </optgroup>
              <optgroup label="电力">
                <option value="火电">电力 / 火电</option>
                <option value="水电">电力 / 水电</option>
                <option value="核电">电力 / 核电</option>
                <option value="风电">电力 / 风电</option>
                <option value="光伏发电">电力 / 光伏发电</option>
                <option value="余热发电">电力 / 余热发电</option>
              </optgroup>
              <optgroup label="其他">
                <option value="压缩空气">压缩空气</option>
                <option value="甲醇">甲醇</option>
                <option value="乙醇">乙醇</option>
                <option value="氢">氢</option>
              </optgroup>
            </select>

            {/* Unit */}
            <select
              value={filters.unit}
              onChange={e => updateFilter('unit', e.target.value)}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            >
              <option value="">全部用能单元</option>
              <option value="企业级">企业级</option>
              <option value="车间级">车间级</option>
              <option value="产线级">产线级</option>
              <option value="仪表级">仪表级</option>
            </select>

            {/* Source */}
            <select
              value={filters.source}
              onChange={e => updateFilter('source', e.target.value)}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            >
              <option value="">全部数据来源</option>
              <option value="仪表直采">仪表直采</option>
              <option value="系统对接">系统对接</option>
              <option value="手工录入">手工录入</option>
            </select>

            {/* Status */}
            <select
              value={filters.status}
              onChange={e => updateFilter('status', e.target.value)}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            >
              <option value="">全部状态</option>
              <option value="正常">正常</option>
              <option value="偏高">偏高</option>
              <option value="异常">异常</option>
            </select>

            {/* Action buttons */}
            <button onClick={() => fetchData(filters)} className="px-4 py-1.5 rounded-md text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors border border-orange-500 shadow-sm">
              查询
            </button>
            <button onClick={resetFilters} className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors">
              重置
            </button>

            {activeFilterCount > 0 && (
              <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-1 rounded-md">
                {activeFilterCount} 个筛选
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== KPI Cards ===== */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, i) => {
            const icons = [
              <svg key="i1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
              <svg key="i2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>,
              <svg key="i3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              <svg key="i4" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
            ];
            const iconColors = ['bg-blue-50 text-blue-500', 'bg-orange-50 text-orange-500', 'bg-green-50 text-green-500', 'bg-purple-50 text-purple-500'];
            const gradients = ['from-blue-400 to-blue-300', 'from-orange-400 to-amber-300', 'from-green-400 to-emerald-300', 'from-purple-400 to-violet-300'];
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
                <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                  card.change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change)}% {card.changeLabel}
                </div>
                {i === 1 && (
                  <div className="text-[11px] text-slate-400 mt-1.5">电力 42% · 天然气 28% · 煤炭 18% · 其他 12%</div>
                )}
                {i === 2 && (
                  <div className="text-[11px] text-slate-400 mt-1.5">行业基准 0.102 · 领先值 0.068</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== Collection Status Bar ===== */}
      {summary && (
        <div className="px-6 pb-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 border-b border-slate-100 bg-slate-50/50">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              今日采集状态
            </div>
            <div className="flex items-center justify-around py-4 px-4">
              {[
                { value: summary.onlineMeters, label: '在线仪表', unit: '', icon: 'green', iconBg: 'bg-green-50 text-green-500' },
                { value: summary.completenessRate, label: '采集完整率', unit: '%', icon: 'blue', iconBg: 'bg-blue-50 text-blue-500', isFloat: true },
                { value: summary.abnormalPoints, label: '异常点位', unit: '', icon: 'red', iconBg: 'bg-red-50 text-red-500', warn: true },
                { value: summary.dataDelay, label: '数据延迟', unit: 'S', icon: 'amber', iconBg: 'bg-amber-50 text-amber-500' },
              ].map((item, i) => (
                <div key={i} className="text-center flex-1">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 ${item.iconBg}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {item.icon === 'green' && <><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/></>}
                      {item.icon === 'blue' && <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>}
                      {item.icon === 'red' && <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}
                      {item.icon === 'amber' && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
                    </svg>
                  </div>
                  <div className={`text-[28px] font-bold tracking-tight leading-none ${item.warn ? 'text-red-500' : 'text-slate-800'}`}>
                    {item.isFloat ? (item.value as number).toFixed(1) : item.value}
                    {item.unit && <span className="text-sm font-medium text-slate-400 ml-0.5">{item.unit}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{item.label}</div>
                </div>
              ))}
              {[1,2,3].map(i => <div key={i} className="w-px h-10 bg-slate-200"></div>)}
            </div>
          </div>
        </div>
      )}

      {/* ===== Charts Row ===== */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          {/* Trend Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">能耗趋势分析</div>
                <div className="text-xs text-slate-400 mt-0.5">分能源品种{timelineView === 'day' ? '日累计' : timelineView === 'week' ? '周累计' : '月累计'}消费量走势</div>
              </div>
              <div className="flex gap-1">
                {(['day', 'week', 'month'] as const).map(v => (
                  <button key={v}
                    onClick={() => setTimelineView(v)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      timelineView === v ? 'bg-orange-500 text-white' : 'text-slate-500 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {{ day: '日', week: '周', month: '月' }[v]}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[260px]">
              <Line
                data={trendChartData[timelineView]}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { intersect: false, mode: 'index' },
                  plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { size: 11 } } },
                    tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8 },
                  },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
                    y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
                  },
                }}
              />
            </div>
          </div>

          {/* Structure Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">能源结构</div>
                <div className="text-xs text-slate-400 mt-0.5">当月各品种消费占比</div>
              </div>
            </div>
            <div className="h-[340px] flex items-center justify-center">
              <div className="w-[320px] h-[300px]">
                <Doughnut
                  data={structureChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '55%',
                    plugins: {
                      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Data Table ===== */}
      <div className="px-6 pb-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden table-card">
          {/* Table Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-semibold text-slate-800">能耗明细表</h3>
              <div className="flex gap-4 mt-1 text-xs text-slate-500">
                {[
                  { label: '煤炭', value: '1,285 t', color: '#64748b' },
                  { label: '电力', value: '3,560 MWh', color: '#3b82f6' },
                  { label: '天然气', value: '58.2 万m³', color: '#f97316' },
                  { label: '压缩空气', value: '320 万m³', color: '#10b981' },
                  { label: '氢', value: '12.6 t', color: '#8b5cf6' },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm" style={{ background: item.color }}></span>
                    {item.label}：{item.value}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                导出
              </button>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  filterOpen || activeFilterCount > 0
                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                    : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>
                筛选
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold ml-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Table Filter Panel */}
          {filterOpen && (
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: '时间', options: ['2026-06-21', '2026-06-22', '2026-06-23'] },
                  { label: '用能单元', options: ['企业级', '车间级', '产线级', '仪表级'] },
                  { label: '能源品种', options: ['煤炭', '电力', '天然气', '压缩空气', '氢'] },
                  { label: '数据来源', options: ['仪表直采', '系统对接', '手工录入'] },
                  { label: '状态', options: ['正常', '偏高', '异常'] },
                ].map(group => (
                  <div key={group.label}>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{group.label}</div>
                    <div className="flex flex-col gap-1.5">
                      {group.options.map(opt => (
                        <button
                          key={opt}
                          onClick={() => {
                            const keyMap: Record<string, keyof Filters> = {
                              '时间': 'timeRange', '用能单元': 'unit', '能源品种': 'energyType', '数据来源': 'source', '状态': 'status'
                            };
                            const filterKey = keyMap[group.label];
                            // For time, energyType, unit, source, status - set the value
                            if (filterKey) {
                              setFilters(prev => ({
                                ...prev,
                                [filterKey]: prev[filterKey] === opt ? '' : opt
                              }));
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-md border transition-colors text-left ${
                            Object.values(filters).includes(opt)
                              ? 'bg-orange-50 text-orange-600 border-orange-200'
                              : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
                <button
                  onClick={() => { resetFilters(); setFilterOpen(false); }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-100 border border-transparent transition-colors"
                >
                  重置
                </button>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="px-4 py-1.5 rounded-md text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  确定
                </button>
              </div>
            </div>
          )}

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left">时间</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left">用能单元</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left">能源品种</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right">消耗量</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right">折标煤 (tce)</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right">费用 (万元)</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right">同比</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right">环比</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center">数据来源</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center">状态</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        加载中...
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-400">暂无数据</td>
                  </tr>
                ) : (
                  records.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-4 py-3 text-sm text-slate-600">{record.time}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>{record.unit}</div>
                        <div className="text-[11px] text-slate-400">{record.unitLevel}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{record.energyType}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{record.consumption}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{record.coalEquivalent.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{record.cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right"><Trend value={record.yoy} /></td>
                      <td className="px-4 py-3 text-sm text-right"><Trend value={record.mom} /></td>
                      <td className="px-4 py-3 text-sm text-center"><span className="source-tag">{record.source}</span></td>
                      <td className="px-4 py-3 text-sm text-center"><StatusBadge status={record.status} type={record.statusType} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>共 {records.length} 条记录</span>
            <div className="flex items-center gap-2">
              <span>每页</span>
              <select className="text-xs px-2 py-1 rounded border border-slate-200 bg-white text-slate-600">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
              <span>条</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
