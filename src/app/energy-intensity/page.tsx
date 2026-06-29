'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

// ===== Types =====
interface EnergyItem {
  name: string;
  consumption: number;
  unit: string;
  factor: number;
  factorType: string;
  tce: number;
}

interface IntensityRecord {
  id: number;
  period: string;
  unit: string;
  unitLevel: string;
  product: string;
  output: number;
  outputUnit: string;
  outputValue: number;
  outputValueUnit: string;
  energyItems: EnergyItem[];
  totalTce: number;
  unitProductTce: number;
  unitOutputTce: number;
  status: string;
  statusType: string;
}

interface Period {
  id: string;
  label: string;
}

interface ConversionFactor {
  name: string;
  factor: number;
  unit: string;
  type: string;
}

interface Summary {
  totalPeriods: number;
  totalRecords: number;
  monthlyAvgTce: number;
  monthlyAvgProductTce: number;
  monthlyAvgOutputTce: number;
}

// ===== Reusable Components =====
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

function Trend({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="text-slate-400">—</span>;
  const isUp = value > 0;
  return (
    <span className={isUp ? 'trend-up' : 'trend-down'}>
      {isUp ? '↑' : '↓'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

export default function EnergyIntensityPage() {
  const [records, setRecords] = useState<IntensityRecord[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [conversionFactors, setConversionFactors] = useState<ConversionFactor[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    period: '',
    unit: '',
    status: '',
  });

  const fetchData = useCallback(async (f: typeof filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.period) params.set('period', f.period);
      if (f.unit) params.set('unit', f.unit);
      if (f.status) params.set('status', f.status);

      const res = await fetch(`/api/energy-intensity?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
        setPeriods(data.periods);
        setConversionFactors(data.conversionFactors);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { document.title = '能碳管理平台 - F-02 能源消费量和强度计算'; fetchData(filters); }, [fetchData, filters]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));
  };

  const resetFilters = () => {
    setFilters({ period: '', unit: '', status: '' });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  // compute stats from records
  const calcStats = () => {
    if (!records.length) return null;
    const totalTce = records.reduce((s, r) => s + r.totalTce, 0);
    const avgProductTce = records.reduce((s, r) => s + r.unitProductTce, 0) / records.length;
    const avgOutputTce = records.reduce((s, r) => s + r.unitOutputTce, 0) / records.length;
    return { totalTce, avgProductTce, avgOutputTce };
  };

  const stats = calcStats();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[260px]">
      {/* ===== Top Bar ===== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Link href="/" className="hover:text-orange-500 transition-colors">能碳管理平台</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer">王</div>
        </div>
      </header>

      {/* ===== Page Header ===== */}
      <div className="px-8 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">能源消费量和强度计算</h1>
            <p className="text-xs text-slate-500 mt-1">依据 GB/T 2589《综合能耗计算通则》，自动计算综合能耗、单位产品能耗、单位产值能耗</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            导出报告
          </button>
        </div>
      </div>

      {/* ===== Filter Bar ===== */}
      <div className="px-8 pb-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Period */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">核算周期</span>
              <select
                value={filters.period}
                onChange={e => updateFilter('period', e.target.value)}
                className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              >
                <option value="">全部周期</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

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
            </select>

            <button onClick={resetFilters} className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-100 border border-transparent transition-colors">
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
      <div className="px-8 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '综合能耗合计', value: stats ? stats.totalTce.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—', unit: 'tce', change: 3.1, changeLabel: '环比', color: 'blue' },
            { label: '平均单位产品能耗', value: stats ? stats.avgProductTce.toFixed(4) : '—', unit: 'tce/吨', change: -0.3, changeLabel: '环比', color: 'green' },
            { label: '平均单位产值能耗', value: stats ? stats.avgOutputTce.toFixed(4) : '—', unit: 'tce/万元', change: -1.2, changeLabel: '环比', color: 'orange' },
            { label: '核算记录数', value: records.length.toString(), unit: '条', change: 0, changeLabel: '', color: 'purple' },
          ].map((card, i) => {
            const gradients = ['from-blue-400 to-blue-300', 'from-green-400 to-emerald-300', 'from-orange-400 to-amber-300', 'from-purple-400 to-violet-300'];
            const iconColors = ['bg-blue-50 text-blue-500', 'bg-green-50 text-green-500', 'bg-orange-50 text-orange-500', 'bg-purple-50 text-purple-500'];
            const icons = [
              <svg key="a" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
              <svg key="b" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              <svg key="c" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
              <svg key="d" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/></svg>,
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
                {card.changeLabel && (
                  <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                    card.change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change)}% {card.changeLabel}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== Conversion Factors Reference ===== */}
      <div className="px-8 pb-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              折标系数参考（GB/T 2589）
            </div>
            <span className="text-[10px] text-slate-400">当量值</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sticky top-0 z-10 px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left">能源品种</th>
                  <th className="sticky top-0 z-10 px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right">折标系数</th>
                  <th className="sticky top-0 z-10 px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right">单位</th>
                  <th className="sticky top-0 z-10 px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left">类型</th>
                </tr>
              </thead>
              <tbody>
                {conversionFactors.map((cf, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-slate-700">{cf.name}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-mono text-slate-800">{cf.factor.toFixed(4)}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-mono text-slate-500">{cf.unit}</td>
                    <td className="px-4 py-2.5 text-sm"><span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{cf.type}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== Data Table ===== */}
      <div className="px-8 pb-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden table-card">
          {/* Table Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-semibold text-slate-800">核算明细表</h3>
              <div className="flex gap-4 mt-1 text-xs text-slate-400">
                <span>核算依据：GB/T 2589《综合能耗计算通则》</span>
                <span>折标方式：当量值</span>
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
                  filterOpen ? 'bg-orange-50 text-orange-600 border-orange-200' : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>
                筛选
              </button>
            </div>
          </div>

          {/* Table Filter Panel */}
          {filterOpen && (
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: '核算周期', options: periods.map(p => p.label).slice(0, 6), key: 'period' as const },
                  { label: '用能单元', options: ['企业级', '车间级', '产线级'], key: 'unit' as const },
                  { label: '状态', options: ['正常', '偏高'], key: 'status' as const },
                ].map(group => (
                  <div key={group.label}>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{group.label}</div>
                    <div className="flex flex-col gap-1.5">
                      {group.options.map(opt => {
                        const valForPeriod = periods.find(p => p.label === opt)?.id || opt.toLowerCase();
                        const val = group.key === 'period' ? valForPeriod : opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => {
                              const keyMap: Record<string, keyof typeof filters> = { '核算周期': 'period', '用能单元': 'unit', '状态': 'status' };
                              const fk = keyMap[group.label];
                              if (fk) setFilters(prev => ({ ...prev, [fk]: prev[fk] === val ? '' : val }));
                            }}
                            className={`text-xs px-2.5 py-1 rounded-md border transition-colors text-left ${
                              filters[group.key] === val ? 'bg-orange-50 text-orange-600 border-orange-200' : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
                <button onClick={() => { resetFilters(); setFilterOpen(false); }} className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">重置</button>
                <button onClick={() => setFilterOpen(false)} className="px-4 py-1.5 rounded-md text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors">确定</button>
              </div>
            </div>
          )}

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sticky top-0 z-10 w-8 px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center whitespace-nowrap"></th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left whitespace-nowrap">核算周期</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left whitespace-nowrap">用能单元</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left whitespace-nowrap">产品</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">产量</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">产值 (万元)</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">综合能耗 (tce)</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">单位产品能耗</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">单位产值能耗</th>
                  <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center whitespace-nowrap">状态</th>
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
                  <tr><td colSpan={10} className="text-center py-12 text-slate-400">暂无数据</td></tr>
                ) : (
                  records.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setExpandedRow(expandedRow === record.id ? null : record.id)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: expandedRow === record.id ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
                          >
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{periods.find(p => p.id === record.period)?.label || record.period}</td>
                      <td className="px-4 py-3 text-sm"><div>{record.unit}</div><div className="text-[11px] text-slate-400">{record.unitLevel}</div></td>
                      <td className="px-4 py-3 text-sm">{record.product}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{record.output.toLocaleString()} {record.outputUnit}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{record.outputValue.toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-slate-800">{record.totalTce.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{record.unitProductTce.toFixed(4)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{record.unitOutputTce.toFixed(4)}</td>
                      <td className="px-4 py-3 text-sm text-center"><StatusBadge status={record.status} type={record.statusType} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>共 {records.length} 条核算记录</span>
          </div>
        </div>
      </div>

      {/* ===== Expanded Detail Panel ===== */}
      {expandedRow !== null && (() => {
        const record = records.find(r => r.id === expandedRow);
        if (!record) return null;
        return (
          <div className="px-8 pb-8 -mt-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-sm font-semibold text-slate-700">能耗构成明细 — {periods.find(p => p.id === record.period)?.label || record.period}</span>
                <span className="text-xs text-slate-400 ml-auto">{record.unit} · {record.product}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                  <tr>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left">能源品种</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right">实物量</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right">折标系数</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left">系数类型</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right">折标煤 (tce)</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right">占比</th>
                  </tr>
                  </thead>
                  <tbody>
                    {record.energyItems.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-sm">{item.name}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm">{item.consumption.toLocaleString()} {item.unit}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm">{item.factor.toFixed(4)}</td>
                        <td className="px-4 py-2.5 text-sm"><span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{item.factorType}</span></td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold">{item.tce.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-500">
                          {((item.tce / record.totalTce) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/50 font-semibold">
                      <td className="px-4 py-2.5 text-sm text-slate-700">合计</td>
                      <td colSpan={3}></td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-800">{record.totalTce.toFixed(2)} tce</td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-500">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-slate-100 flex gap-8 text-xs text-slate-500">
                <span>单位产品能耗：<strong className="text-slate-700">{record.unitProductTce.toFixed(4)}</strong> tce/{record.outputUnit}</span>
                <span>单位产值能耗：<strong className="text-slate-700">{record.unitOutputTce.toFixed(4)}</strong> tce/万元</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  </div>
  );
}
