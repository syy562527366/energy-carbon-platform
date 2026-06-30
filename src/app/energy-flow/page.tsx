'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import * as echarts from 'echarts';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// ===== Types =====
interface Summary {
  totalInput: number;
  totalInputUnit: string;
  conversionEfficiency: number;
  transmissionLossRate: number;
  endUseRate: number;
  totalLoss: number;
  topLossLink: string;
  topLossRate: number;
  inputTrend: number;
  efficiencyTrend: number;
}

interface EnergyInput {
  name: string;
  value: number;
  unit: string;
  ratio: number;
  color: string;
}

interface LossItem {
  id: number;
  link: string;
  stage: string;
  loss: number;
  lossRate: number;
  suggestion: string;
  priority: string;
}

interface EfficiencyTrendItem {
  month: string;
  conversionEff: number;
  transmissionEff: number;
  endUseEff: number;
  overallEff: number;
}

interface TopEnergyNode {
  name: string;
  type: string;
  consumption: number;
  ratio: number;
  efficiency: number;
  status: string;
}

// ===== ECharts Sankey Diagram Component =====
function SankeyDiagram({
  inputData,
  stageDetails,
}: {
  inputData: EnergyInput[];
  stageDetails: { stage: string; total: number; detail: { source: string; value: number }[] }[];
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Loss between stages
  const stageLosses = [
    { loss: 1560, rate: 12.4, label: '转换损耗' },
    { loss: 572, rate: 5.2, label: '输送损耗' },
    { loss: 1853, rate: 17.7, label: '终端损耗' },
  ];

  // Get stage totals from stageDetails
  const stages = (stageDetails || []).filter(s => s.detail && s.detail.length > 0);
  const inputTotal = inputData.reduce((s, i) => s + i.value, 0);

  useEffect(() => {
    if (!chartRef.current) return;

    // Dispose previous instance
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    // Build nodes
    const stageNodes = stages.map(s => ({ name: s.stage }));
    const lossNodes = stageLosses.map(l => ({ name: l.label }));
    const nodes = [...stageNodes, ...lossNodes];

    // Build links: stage → next stage, stage → loss
    const links: { source: string; target: string; value: number }[] = [];

    stages.forEach((stage, i) => {
      if (i < stages.length - 1) {
        // Flow to next stage
        links.push({ source: stage.stage, target: stages[i + 1].stage, value: stages[i + 1].total });
        // Flow to loss node
        links.push({ source: stage.stage, target: stageLosses[i].label, value: stageLosses[i].loss });
      }
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b', fontSize: 12 },
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const nodeName = params.data.name;
            const total = inputTotal;
            // Find corresponding stage total
            const stage = stages.find(s => s.stage === nodeName);
            const loss = stageLosses.find(l => l.label === nodeName);
            const val = stage?.total || loss?.loss || 0;
            const pct = ((val / total) * 100).toFixed(1);
            return `<strong>${nodeName}</strong><br/>能量值: ${val.toLocaleString()} tce<br/>占比: ${pct}%`;
          } else {
            return `<strong>${params.data.source} → ${params.data.target}</strong><br/>流量: ${params.data.value.toLocaleString()} tce`;
          }
        },
      },
      series: [
        {
          type: 'sankey',
          data: nodes,
          links: links,
          emphasis: { focus: 'adjacency' },
          nodeAlign: 'justify',
          nodeWidth: 24,
          nodeGap: 14,
          layoutIterations: 32,
          lineStyle: {
            color: 'source',
            curveness: 0.5,
            opacity: 0.3,
          },
          label: {
            color: '#475569',
            fontSize: 12,
            fontWeight: 600,
          },
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 1,
          },
          levels: [
            // 输入端
            {
              depth: 0,
              itemStyle: { color: '#64748B' },
              lineStyle: { color: '#64748B', opacity: 0.3 },
            },
            // Loss nodes start after stage nodes
          ],
        },
      ],
    };

    chart.setOption(option);

    // Handle resize
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartInstance.current = null;
    };
  }, [inputData, stageDetails]);

  return <div ref={chartRef} className="w-full h-full" />;
}

// ===== Priority Badge =====
function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    '高': 'bg-red-50 text-red-600 border-red-200',
    '中': 'bg-amber-50 text-amber-600 border-amber-200',
    '低': 'bg-blue-50 text-blue-600 border-blue-200',
  };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colors[priority] || 'bg-slate-50 text-slate-500'}`}>{priority}</span>;
}

// ===== Status Badge =====
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    '正常': 'bg-green-50 text-green-600 border-green-200',
    '关注': 'bg-amber-50 text-amber-600 border-amber-200',
    '预警': 'bg-red-50 text-red-600 border-red-200',
  };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colors[status] || 'bg-slate-50 text-slate-500'}`}>{status}</span>;
}

export default function EnergyFlowPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [energyInputs, setEnergyInputs] = useState<EnergyInput[]>([]);
  const [lossAnalysis, setLossAnalysis] = useState<LossItem[]>([]);
  const [efficiencyTrend, setEfficiencyTrend] = useState<EfficiencyTrendItem[]>([]);
  const [topEnergyNodes, setTopEnergyNodes] = useState<TopEnergyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStage, setFilterStage] = useState('');

  // Sankey needs stage details from conversionStages – we derive from the API data
  const [conversionStages, setConversionStages] = useState<any[]>([]);

  const fetchData = useCallback(async (priority: string, stage: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (priority) params.set('priority', priority);
      if (stage) params.set('stage', stage);
      const res = await fetch(`/api/energy-flow?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setEnergyInputs(data.energyInputs);
        setLossAnalysis(data.lossAnalysis);
        setEfficiencyTrend(data.efficiencyTrend);
        setTopEnergyNodes(data.topEnergyNodes);
        setConversionStages(data.conversionStages || []);
      }
    } catch (err) {
      console.error('Failed to fetch', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = '能碳管理平台 - F-05 能流分析';
    fetchData(filterPriority, filterStage);
  }, [fetchData, filterPriority, filterStage]);

  const updateFilter = (type: 'priority' | 'stage', value: string) => {
    if (type === 'priority') setFilterPriority(prev => prev === value ? '' : value);
    else setFilterStage(prev => prev === value ? '' : value);
  };

  const resetFilters = () => { setFilterPriority(''); setFilterStage(''); };
  const activeFilterCount = [filterPriority, filterStage].filter(v => v !== '').length;

  // Doughnut data for energy structure
  const structureDonutData = {
    labels: energyInputs.map(e => e.name),
    datasets: [{
      data: energyInputs.map(e => e.value),
      backgroundColor: energyInputs.map(e => e.color),
      borderWidth: 0,
      hoverOffset: 4,
    }]
  };

  // Line chart for efficiency trend
  const efficiencyChartData = {
    labels: efficiencyTrend.map(e => e.month),
    datasets: [
      {
        label: '综合效率',
        data: efficiencyTrend.map(e => e.overallEff),
        borderColor: '#F97316',
        backgroundColor: 'rgba(249,115,22,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#F97316',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
      {
        label: '转换效率',
        data: efficiencyTrend.map(e => e.conversionEff),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59,130,246,0.05)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
        borderDash: [5, 3],
      },
      {
        label: '输送效率',
        data: efficiencyTrend.map(e => e.transmissionEff),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,0.05)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
        borderDash: [5, 3],
      },
      {
        label: '终端利用效率',
        data: efficiencyTrend.map(e => e.endUseEff),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139,92,246,0.05)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
        borderDash: [5, 3],
      },
    ]
  };

  // Bar chart for top energy nodes
  const nodeBarData = {
    labels: topEnergyNodes.map(n => n.name),
    datasets: [
      {
        label: '能耗占比 (%)',
        data: topEnergyNodes.map(n => n.ratio),
        backgroundColor: topEnergyNodes.map(n =>
          n.status === '预警' ? 'rgba(239,68,68,0.7)' :
          n.status === '关注' ? 'rgba(245,158,11,0.7)' :
          'rgba(59,130,246,0.7)'
        ),
        borderRadius: 4,
        barThickness: 28,
      }
    ]
  };

  const stageOptions = ['转换', '输送', '终端'];

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
              <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">能流分析</h1>
              <p className="text-[13px] text-slate-500 mt-1">通过能源介质和能源平衡图，分析能源输入→转换→输送→终端利用全过程效率与损耗</p>
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
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">优先级</span>
                <select value={filterPriority} onChange={e => updateFilter('priority', e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400">
                  <option value="">全部优先级</option>
                  <option value="高">高</option>
                  <option value="中">中</option>
                  <option value="低">低</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">环节</span>
                <select value={filterStage} onChange={e => updateFilter('stage', e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400">
                  <option value="">全部环节</option>
                  {stageOptions.map(s => <option key={s} value={s}>{s}环节</option>)}
                </select>
              </div>
              <button onClick={resetFilters} className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors">重置</button>
              {activeFilterCount > 0 && <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-1 rounded-md">{activeFilterCount} 个筛选</span>}
            </div>
          </div>
        </div>

        {/* ===== KPI Cards ===== */}
        <div className="px-8 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: '总输入能源',
                value: summary?.totalInput.toLocaleString() || '—',
                unit: 'tce',
                change: summary?.inputTrend || 0,
                changeLabel: '环比',
                color: 'blue',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              },
              {
                label: '转换效率',
                value: summary?.conversionEfficiency.toFixed(1) || '—',
                unit: '%',
                change: summary?.efficiencyTrend || 0,
                changeLabel: '环比',
                color: 'green',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              },
              {
                label: '输送损耗率',
                value: summary?.transmissionLossRate.toFixed(1) || '—',
                unit: '%',
                change: -(summary?.transmissionLossRate || 0),
                changeLabel: '损耗',
                color: 'orange',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
              },
              {
                label: '终端利用率',
                value: summary?.endUseRate.toFixed(1) || '—',
                unit: '%',
                change: 1.2,
                changeLabel: '环比',
                color: 'purple',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              },
            ].map((card, i) => {
              const gradients = ['from-blue-400 to-blue-300', 'from-green-400 to-emerald-300', 'from-orange-400 to-amber-300', 'from-purple-400 to-violet-300'];
              const iconColors = ['bg-blue-50 text-blue-500', 'bg-green-50 text-green-500', 'bg-orange-50 text-orange-500', 'bg-purple-50 text-purple-500'];
              return (
                <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradients[i]}`}></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">{card.label}</span>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[i]}`}>{card.icon}</div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[28px] font-bold text-slate-800 tracking-tight leading-none">{card.value}</span>
                    <span className="text-sm font-medium text-slate-400 ml-1">{card.unit}</span>
                  </div>
                  {card.change !== 0 && card.changeLabel && (
                    <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                      (card.change >= 0 && card.color !== 'orange') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change).toFixed(1)}% {card.changeLabel}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Sankey / Energy Flow Diagram ===== */}
        <div className="px-8 pb-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-hidden h-[280px] flex flex-col">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <div>
                <div className="text-sm font-semibold text-slate-800">能源平衡图（能流图）</div>
                <div className="text-xs text-slate-400 mt-0.5">展示能源输入→转换→输送→终端利用全链路流向与损耗</div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {energyInputs.slice(0, 6).map((e, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: e.color }}></span>
                    {e.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <SankeyDiagram inputData={energyInputs} stageDetails={conversionStages} />
            </div>
          </div>
        </div>

        {/* ===== Efficiency Trend + Energy Structure ===== */}
        <div className="px-8 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            {/* Efficiency Trend */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">各环节效率趋势</div>
                  <div className="text-xs text-slate-400 mt-0.5">月度转换/输送/终端利用效率变化</div>
                </div>
              </div>
              <div className="h-[260px] chart-entrance">
                <Line data={efficiencyChartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { intersect: false, mode: 'index' },
                  plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 14, font: { size: 11 } } },
                    tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8, callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%` } },
                  },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
                    y: { min: 0, max: 100, grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8', callback: (v: any) => `${v}%` } },
                  },
                }}/>
              </div>
            </div>

            {/* Energy Structure Donut */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">能源输入结构</div>
                  <div className="text-xs text-slate-400 mt-0.5">各品种占比</div>
                </div>
              </div>
              <div className="h-[260px] flex items-center justify-center chart-entrance">
                <Doughnut data={structureDonutData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '55%',
                  plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 10, font: { size: 10 } } },
                    tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 8, callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed} tce (${((ctx.parsed / (summary?.totalInput || 1)) * 100).toFixed(1)}%)` } },
                  },
                }}/>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Top Energy Nodes ===== */}
        <div className="px-8 pb-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-800">重点用能环节识别</div>
                <div className="text-xs text-slate-400 mt-0.5">按能耗占比排列，标注效率与预警状态</div>
              </div>
            </div>
            <div className="h-[220px] chart-entrance">
              <Bar data={nodeBarData} options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#0F172A',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                      afterLabel: (ctx: any) => {
                        const node = topEnergyNodes[ctx.dataIndex];
                        return node ? `效率: ${node.efficiency}% | 状态: ${node.status}` : '';
                      }
                    },
                  },
                },
                scales: {
                  x: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8', callback: (v: any) => `${v}%` }, max: 50 },
                  y: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#334155' } },
                },
              }}/>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400"></span> 预警</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> 关注</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400"></span> 正常</span>
            </div>
          </div>
        </div>

        {/* ===== Loss Analysis Table ===== */}
        <div className="px-8 pb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">损耗定位清单</h3>
                <div className="text-xs text-slate-400 mt-0.5">按损耗量排列，标注优先级与改善建议</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">总损耗</span>
                <span className="text-sm font-bold text-red-500">{summary?.totalLoss.toLocaleString() || '—'} tce</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left whitespace-nowrap">损耗环节</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center whitespace-nowrap">所属阶段</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">损耗量 (tce)</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-right whitespace-nowrap">损耗率 (%)</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center whitespace-nowrap" style={{ minWidth: 180 }}>占比可视化</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-center whitespace-nowrap">优先级</th>
                    <th className="sticky top-0 z-10 px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 text-left whitespace-nowrap">改善建议</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400"><div className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>加载中...</div></td></tr>
                  ) : lossAnalysis.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400">暂无数据</td></tr>
                  ) : lossAnalysis.map(item => {
                    const maxLoss = Math.max(...lossAnalysis.map(l => l.loss));
                    const barWidth = maxLoss > 0 ? (item.loss / maxLoss) * 100 : 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.link}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            item.stage === '转换环节' ? 'bg-blue-50 text-blue-600' :
                            item.stage === '输送环节' ? 'bg-green-50 text-green-600' :
                            'bg-purple-50 text-purple-600'
                          }`}>{item.stage}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-slate-700">{item.loss.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-orange-500 font-semibold">{item.lossRate}%</td>
                        <td className="px-4 py-3 text-sm" style={{ minWidth: 180 }}>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, background: item.priority === '高' ? '#EF4444' : item.priority === '中' ? '#F59E0B' : '#3B82F6' }}></div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center"><PriorityBadge priority={item.priority} /></td>
                        <td className="px-4 py-3 text-sm text-slate-500 max-w-[240px]">{item.suggestion}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>共 {lossAnalysis.length} 项损耗环节</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}