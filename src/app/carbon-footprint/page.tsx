'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function CarbonFootprintPage() {
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true);
  const fetchData = useCallback(async () => { try { const r=await fetch('/api/carbon-footprint');const d=await r.json();if(d.success)setData(d); }catch(e){console.error(e)}finally{setLoading(false)} },[]);
  useEffect(()=>{document.title='能碳管理平台 - F-10 产品碳足迹核算';fetchData()},[fetchData]);
  const s = data?.summary;

  // Footprint breakdown doughnut
  const fd = { labels:data?.footprintBreakdown?.map((i:any)=>i.stage)||[], datasets:[{data:data?.footprintBreakdown?.map((i:any)=>i.ratio)||[], backgroundColor:data?.footprintBreakdown?.map((i:any)=>i.color)||[], borderWidth:0}]};
  // Monthly footprint line
  const products = ['热轧卷板','冷轧卷板','镀锌板','建筑钢材'];
  const colors = ['#F97316','#3B82F6','#10B981','#8B5CF6'];
  const ml = { labels:data?.monthlyFootprint?.map((m:any)=>m.month)||[], datasets:products.map((p,i)=>({label:p, data:data?.monthlyFootprint?.map((m:any)=>m[p])||[], borderColor:colors[i], backgroundColor:colors[i]+'15', fill:false, tension:0.3, pointRadius:4, borderWidth:2}))};

  const donutOpts = { responsive:true, maintainAspectRatio:false, cutout:'55%' as const, plugins:{legend:{position:'bottom' as const,labels:{usePointStyle:true,padding:12,font:{size:10}}}}};
  const lineOpts = { responsive:true, maintainAspectRatio:false, interaction:{intersect:false,mode:'index' as const}, plugins:{legend:{position:'bottom' as const,labels:{usePointStyle:true,padding:12,font:{size:11}}}}, scales:{x:{grid:{display:false},ticks:{font:{size:11},color:'#94A3B8'}},y:{grid:{color:'#F1F5F9'},ticks:{font:{size:11},color:'#94A3B8',callback:(v:any)=>`${v} kgCO₂e`}}}};

  return (<div className="min-h-screen bg-slate-50"><Sidebar /><div className="ml-[260px]">
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/" className="hover:text-orange-500 transition-colors">能碳管理平台</Link></div>
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer">王</div>
    </header>
    <div className="px-8 pt-6 pb-4">
      <div><h1 className="text-[22px] font-bold text-slate-800 tracking-tight">产品碳足迹核算</h1><p className="text-[13px] text-slate-500 mt-1">按照LCA方法量化产品全生命周期碳排放</p></div>
    </div>

    {/* KPI */}
    <div className="px-8 pb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{lb:'核算产品数',val:s?.activeProducts||'—',un:'个'},{lb:'平均碳足迹',val:s?.avgCarbonFootprint||'—',un:s?.avgUnit||'kgCO₂e/kg'},{lb:'最高产品',val:s?.highestValue?.toFixed(2)||'—',un:'kgCO₂e/kg',sub:s?.highestProduct},{lb:'累计减排',val:s?.totalReduction||'—',un:'%'}].map((c,i)=>{
          const g=['from-blue-400 to-blue-300','from-green-400 to-emerald-300','from-orange-400 to-amber-300','from-purple-400 to-violet-300'];
          return (<div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${g[i]}`}></div>
            <div className="text-xs font-medium text-slate-500 mb-3">{c.lb}</div>
            <div className="flex items-baseline gap-1"><span className="text-[28px] font-bold text-slate-800 tracking-tight">{c.val}</span><span className="text-sm text-slate-400">{c.un}</span></div>
            {c.sub && <div className="text-[11px] text-slate-500 mt-1">({c.sub})</div>}
          </div>);
        })}
      </div>
    </div>

    {/* Product Table */}
    <div className="px-8 pb-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200"><h3 className="text-sm font-semibold text-slate-800">产品碳足迹清单</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-left">产品名称</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-left">规格</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-right">碳足迹</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-center">核算边界</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-center">状态</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-center">变化趋势</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-right">更新日期</th>
            </tr></thead>
            <tbody>{loading ? <tr><td colSpan={7} className="text-center py-12 text-slate-400">加载中...</td></tr> : data?.products?.map((p:any)=>(
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{p.name}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{p.spec}</td>
                <td className="px-4 py-3 text-sm text-right font-mono font-semibold">{p.footprint} <span className="text-xs text-slate-400">{p.unit}</span></td>
                <td className="px-4 py-3 text-sm text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">{p.boundary}</span></td>
                <td className="px-4 py-3 text-sm text-center"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  p.status==='已核算'?'bg-green-50 text-green-600':p.status==='核算中'?'bg-amber-50 text-amber-600':'bg-slate-50 text-slate-500'
                }`}>{p.status}</span></td>
                <td className="px-4 py-3 text-sm text-center"><span className={`text-xs font-medium ${(p.trend||0)<0?'text-green-500':'text-slate-400'}`}>{p.trend?`${p.trend>0?'↑':'↓'} ${Math.abs(p.trend)}%`:'—'}</span></td>
                <td className="px-4 py-3 text-sm text-right text-slate-500">{p.lastUpdated}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Footprint Breakdown + Monthly Trend */}
    <div className="px-8 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-sm font-semibold text-slate-800 mb-4">碳足迹分布</div>
          <div className={`h-[280px] flex items-center justify-center ${data?.footprintBreakdown?.length ? 'chart-entrance' : ''}`}>
            {data?.footprintBreakdown?.length ? <Doughnut data={fd} options={donutOpts} /> : <span className="text-slate-400">...</span>}
          </div>
          <div className="mt-3 space-y-2">
            {data?.footprintBreakdown?.map((item:any,i:number)=>(
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm" style={{background:item.color}}></span>
                <span className="text-slate-600 flex-1">{item.stage} ({item.ratio}%)</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-sm font-semibold text-slate-800 mb-4">月度碳足迹趋势</div>
          <div className={`h-[280px] ${data?.monthlyFootprint?.length ? 'chart-entrance' : ''}`}>{data?.monthlyFootprint?.length ? <Line data={ml} options={lineOpts} /> : <div className="text-center text-slate-400 pt-20">加载中...</div>}</div>
        </div>
      </div>
    </div>
  </div></div>);
}
