'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function CarbonAccountingPage() {
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true);
  const fetchData = useCallback(async () => { try { const r=await fetch('/api/carbon-accounting');const d=await r.json();if(d.success)setData(d); }catch(e){console.error(e)}finally{setLoading(false)} },[]);
  useEffect(()=>{document.title='能碳管理平台 - F-08 碳排放核算';fetchData()},[fetchData]);
  const s = data?.summary;

  const scopeData = { labels:['范围一(直接排放)','范围二(间接排放)'], datasets:[{data:[s?.scope1Total||0,s?.scope2Total||0], backgroundColor:['#F97316','#3B82F6'], borderWidth:0}]};
  const monthData = { labels:data?.monthlyEmission?.map((m:any)=>m.month)||[], datasets:[{label:'范围一(tCO₂)',data:data?.monthlyEmission?.map((m:any)=>m.scope1)||[], backgroundColor:'rgba(249,115,22,0.7)', borderRadius:3, barThickness:16},{label:'范围二(tCO₂)',data:data?.monthlyEmission?.map((m:any)=>m.scope2)||[], backgroundColor:'rgba(59,130,246,0.7)', borderRadius:3, barThickness:16}]};
  const lineData = { labels:data?.monthlyEmission?.map((m:any)=>m.month)||[], datasets:[{label:'总排放(tCO₂)',data:data?.monthlyEmission?.map((m:any)=>m.total)||[], borderColor:'#F97316', backgroundColor:'rgba(249,115,22,0.1)', fill:true, tension:0.4, pointRadius:5, pointBackgroundColor:'#F97316', pointBorderColor:'#fff', pointBorderWidth:2, borderWidth:2.5}]};

  const barOpts = { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom' as const,labels:{usePointStyle:true,padding:10,font:{size:10}}}}, scales:{x:{grid:{display:false},ticks:{font:{size:11}}},y:{grid:{color:'#F1F5F9'},ticks:{font:{size:11}}}}};
  const lineOpts = { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom' as const,labels:{usePointStyle:true,padding:10,font:{size:10}}}}, scales:{x:{grid:{display:false},ticks:{font:{size:11}}},y:{grid:{color:'#F1F5F9'},ticks:{font:{size:11}}}}};
  const donutOpts = { responsive:true, maintainAspectRatio:false, cutout:'60%' as const, plugins:{legend:{position:'bottom' as const,labels:{usePointStyle:true,padding:12,font:{size:11}}}}};

  return (<div className="min-h-screen bg-slate-50"><Sidebar /><div className="ml-[260px]">
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/" className="hover:text-orange-500 transition-colors">能碳管理平台</Link></div>
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer">王</div>
    </header>
    <div className="px-8 pt-6 pb-4">
      <div className="flex items-start justify-between">
        <div><h1 className="text-[22px] font-bold text-slate-800 tracking-tight">碳排放核算</h1><p className="text-[13px] text-slate-500 mt-1">按照GB/T 32151标准核算企业碳排放总量和强度</p></div>
      </div>
    </div>

    {/* KPI */}
    <div className="px-8 pb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{lb:'碳排放总量',val:`${(s?.totalEmission/10000).toFixed(2)||'—'}万`,un:'tCO₂',ch:s?.trend,cl:'同比'},{lb:'范围一排放',val:`${(s?.scope1Total/10000).toFixed(2)||'—'}万`,un:'tCO₂',ch:s?.scope1Change,cl:'同比'},{lb:'范围二排放',val:`${(s?.scope2Total/10000).toFixed(2)||'—'}万`,un:'tCO₂',ch:s?.scope2Change,cl:'同比'},{lb:'碳排放强度',val:s?.intensity||'—',un:s?.intensityUnit,ch:-2.8,cl:'同比'}].map((c,i)=>{
          const g=['from-orange-400 to-amber-300','from-blue-400 to-blue-300','from-green-400 to-emerald-300','from-purple-400 to-violet-300'];
          return (<div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${g[i]}`}></div>
            <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-slate-500">{c.lb}</span></div>
            <div className="flex items-baseline gap-1"><span className="text-[28px] font-bold text-slate-800 tracking-tight">{c.val}</span><span className="text-sm text-slate-400 ml-1">{c.un}</span></div>
            <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${c.ch>=0?'bg-green-50 text-green-600':'bg-red-50 text-red-600'}`}>{c.ch>=0?'↑':'↓'} {Math.abs(c.ch).toFixed(1)}% {c.cl}</div>
          </div>);
        })}
      </div>
    </div>

    {/* Scope Donut + Monthly Trend */}
    <div className="px-8 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-sm font-semibold text-slate-800 mb-4">排放结构</div>
          <div className="h-[260px] flex items-center justify-center">{s ? <Doughnut data={scopeData} options={donutOpts} /> : <span className="text-slate-400">...</span>}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-sm font-semibold text-slate-800 mb-4">月度排放趋势</div>
          <div className="h-[260px]">{data?.monthlyEmission?.length ? <Line data={lineData} options={lineOpts} /> : <div className="text-center text-slate-400 pt-20">加载中...</div>}</div>
        </div>
      </div>
    </div>

    {/* Emission Sources Table */}
    <div className="px-8 pb-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200"><h3 className="text-sm font-semibold text-slate-800">排放源清单</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-left">排放源</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-center">类别</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-center">范围</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-right">活动数据</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-right">排放因子</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-right">排放量(tCO₂)</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-center">数据来源</th>
            </tr></thead>
            <tbody>{loading ? <tr><td colSpan={7} className="text-center py-12 text-slate-400">加载中...</td></tr> : data?.emissionSources?.map((item:any)=>(
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.source}</td>
                <td className="px-4 py-3 text-sm text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">{item.category}</span></td>
                <td className="px-4 py-3 text-sm text-center"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.scope==='范围一'?'bg-orange-50 text-orange-600':'bg-blue-50 text-blue-600'}`}>{item.scope}</span></td>
                <td className="px-4 py-3 text-sm text-right font-mono">{item.activity.toLocaleString()} {item.unit}</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{item.factor}</td>
                <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-slate-700">{item.emission.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-center text-xs text-slate-500">{item.dataSource}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex justify-between text-xs text-slate-400">
          <span>共 {data?.emissionSources?.length||0} 个排放源</span>
          <span className="text-orange-600 font-medium">总排放: {(s?.totalEmission||0).toLocaleString()} tCO₂</span>
        </div>
      </div>
    </div>

    {/* Historical Verification */}
    <div className="px-8 pb-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-sm font-semibold text-slate-800 mb-4">历史核查记录</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data?.verificationRecords?.map((r:any)=>(
            <div key={r.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-slate-700">{r.year}年度</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">已核查 ✓</span>
              </div>
              <p className="text-xs text-slate-500 mb-1">排放量: <strong className="text-slate-700">{r.totalEmission.toLocaleString()} tCO₂</strong></p>
              <p className="text-xs text-slate-500">核查机构: {r.verifier}</p>
              <p className="text-xs text-slate-400 mt-1">报告编号: {r.reportNo}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div></div>);
}
