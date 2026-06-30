'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function SupplyChainPage() {
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState('');
  const fetchData = useCallback(async () => { try { const r=await fetch('/api/supply-chain');const d=await r.json();if(d.success)setData(d); }catch(e){console.error(e)}finally{setLoading(false)} },[]);
  useEffect(()=>{document.title='能碳管理平台 - F-11 供应链碳管理';fetchData()},[fetchData]);
  const s = data?.summary;
  const filtered = (data?.suppliers||[]).filter((x:any)=>!filterTier||x.tier===filterTier);

  // Category donut
  const cd = { labels:data?.emissionByCategory?.map((c:any)=>c.name)||[], datasets:[{data:data?.emissionByCategory?.map((c:any)=>c.value)||[], backgroundColor:data?.emissionByCategory?.map((c:any)=>c.color)||[], borderWidth:0}]};
  const donutOpts = { responsive:true, maintainAspectRatio:false, cutout:'55%' as const, plugins:{legend:{position:'bottom' as const,labels:{usePointStyle:true,padding:10,font:{size:10}}}}};

  return (<div className="min-h-screen bg-slate-50"><Sidebar /><div className="ml-[260px]">
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/" className="hover:text-orange-500 transition-colors">能碳管理平台</Link></div>
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer">王</div>
    </header>
    <div className="px-8 pt-6 pb-4">
      <div><h1 className="text-[22px] font-bold text-slate-800 tracking-tight">供应链碳管理</h1><p className="text-[13px] text-slate-500 mt-1">供应商碳排放数据采集、碳绩效评估与供应链碳热力图</p></div>
    </div>

    {/* KPI */}
    <div className="px-8 pb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {lb:'供应商总数',val:s?.totalSuppliers||'—',un:'家'},
          {lb:'数据采集率',val:s?.dataCollectedRate?.toFixed(0)||'—',un:'%'},
          {lb:'平均碳绩效分',val:s?.avgCarbonScore?.toFixed(0)||'—',un:'分'},
          {lb:'高风险供应商',val:s?.highRiskCount||'—',un:'家',co:'text-red-500'},
        ].map((c,i)=>{
          const g=['from-blue-400 to-blue-300','from-green-400 to-emerald-300','from-purple-400 to-violet-300','from-red-400 to-rose-300'];
          return (<div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${g[i]}`}></div>
            <div className="text-xs font-medium text-slate-500 mb-3">{c.lb}</div>
            <div className="flex items-baseline gap-1"><span className={`text-[28px] font-bold tracking-tight ${c.co||'text-slate-800'}`}>{c.val}</span><span className="text-sm text-slate-400">{c.un}</span></div>
          </div>);
        })}
      </div>
    </div>

    {/* Category Doughnut + Supplier Table */}
    <div className="px-8 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-sm font-semibold text-slate-800 mb-4">供应链排放分布</div>
          <div className={`h-[240px] flex items-center justify-center ${data?.emissionByCategory?.length ? 'chart-entrance' : ''}`}>{data?.emissionByCategory?.length ? <Doughnut data={cd} options={donutOpts} /> : <span className="text-slate-400">...</span>}</div>
          <div className="text-xs text-slate-400 text-center mt-3">总排放: {(s?.totalSupplyChainEmission||0).toLocaleString()} tCO₂</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">供应商碳数据</h3>
            <div className="flex gap-1.5">
              {['','一级','二级'].map(t=>
                <button key={t} onClick={()=>setFilterTier(filterTier===t?'':t)} className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${filterTier===t?'bg-orange-50 border-orange-200 text-orange-600':'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{t||'全部'}</button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full">
              <thead><tr className="sticky top-0">
                <th className="px-3 py-2.5 text-[10px] font-medium text-slate-500 bg-slate-50 border-b border-slate-100 text-left">供应商</th>
                <th className="px-3 py-2.5 text-[10px] font-medium text-slate-500 bg-slate-50 border-b border-slate-100 text-center">层级</th>
                <th className="px-3 py-2.5 text-[10px] font-medium text-slate-500 bg-slate-50 border-b border-slate-100 text-center">分类</th>
                <th className="px-3 py-2.5 text-[10px] font-medium text-slate-500 bg-slate-50 border-b border-slate-100 text-right">年排放(tCO₂)</th>
                <th className="px-3 py-2.5 text-[10px] font-medium text-slate-500 bg-slate-50 border-b border-slate-100 text-center">碳绩效</th>
                <th className="px-3 py-2.5 text-[10px] font-medium text-slate-500 bg-slate-50 border-b border-slate-100 text-center">数据状态</th>
                <th className="px-3 py-2.5 text-[10px] font-medium text-slate-500 bg-slate-50 border-b border-slate-100 text-center">风险</th>
              </tr></thead>
              <tbody>{loading ? <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-xs">加载中...</td></tr> : filtered.map((item:any)=>(
                <tr key={item.id} className="hover:bg-slate-50 transition-colors text-xs">
                  <td className="px-3 py-2.5 font-medium text-slate-700">{item.name}</td>
                  <td className="px-3 py-2.5 text-center"><span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${item.tier==='一级'?'bg-blue-50 text-blue-600':'bg-slate-50 text-slate-500'}`}>{item.tier}</span></td>
                  <td className="px-3 py-2.5 text-center text-slate-500">{item.category}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold">{item.annualEmission.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="inline-flex items-center gap-1">
                      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${item.carbonScore}%`,background:item.carbonScore>=80?'#22C55E':item.carbonScore>=65?'#F59E0B':'#EF4444'}}></div></div>
                      <span className={`text-[10px] font-semibold ${item.carbonScore>=80?'text-green-600':item.carbonScore>=65?'text-amber-600':'text-red-600'}`}>{item.carbonScore}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center"><span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    item.dataStatus==='已提交'?'bg-green-50 text-green-600':item.dataStatus==='待提交'?'bg-amber-50 text-amber-600':'bg-red-50 text-red-600'
                  }`}>{item.dataStatus}</span></td>
                  <td className="px-3 py-2.5 text-center"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    item.riskLevel==='低'?'bg-green-50 text-green-600':item.riskLevel==='中'?'bg-amber-50 text-amber-600':'bg-red-50 text-red-600'
                  }`}>{item.riskLevel}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    {/* Collection Rate */}
    <div className="px-8 pb-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-sm font-semibold text-slate-800 mb-2">数据采集进度（月度）</div>
        <div className="flex items-center gap-6">
          {data?.monthlyCollectionRate?.map((m:any,i:number)=>(
            <div key={i} className="flex-1 text-center">
              <div className="text-xs text-slate-500 mb-1">{m.month}</div>
              <div className="h-20 flex items-end justify-center">
                <div className="w-6 rounded-t-md transition-all duration-500" style={{height:`${m.rate}%`, background:m.rate>=75?'#22C55E':m.rate>=70?'#F59E0B':'#94A3B8', opacity:0.8}}></div>
              </div>
              <div className="text-[10px] font-semibold text-slate-600 mt-1">{m.rate}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div></div>);
}
