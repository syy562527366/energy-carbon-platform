'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function CarbonAssetsPage() {
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true);
  const fetchData = useCallback(async () => { try { const r=await fetch('/api/carbon-assets');const d=await r.json();if(d.success)setData(d); }catch(e){console.error(e)}finally{setLoading(false)} },[]);
  useEffect(()=>{document.title='能碳管理平台 - F-12 碳资产管理';fetchData()},[fetchData]);
  const s = data?.summary;

  // Asset mix doughnut
  const quotaVal = s?.quotaAllocated||0; const ccerVal = s?.ccerHoldings||0; const greenVal = s?.greenCertCount||0;
  const ad = { labels:['碳配额','CCER','绿证'], datasets:[{data:[quotaVal,ccerVal,greenVal], backgroundColor:['#3B82F6','#10B981','#F97316'], borderWidth:0}]};
  // Price-volume line
  const pd = { labels:data?.monthlyPrice?.map((m:any)=>m.month)||[], datasets:[
    {label:'碳价(元/tCO₂)', data:data?.monthlyPrice?.map((m:any)=>m.price)||[], yAxisID:'y', borderColor:'#F97316', backgroundColor:'rgba(249,115,22,0.1)', fill:true, tension:0.4, pointRadius:5, pointBackgroundColor:'#F97316', pointBorderColor:'#fff', pointBorderWidth:2, borderWidth:2.5},
    {label:'成交量(手)', data:data?.monthlyPrice?.map((m:any)=>m.volume)||[], yAxisID:'y1', borderColor:'#3B82F6', backgroundColor:'rgba(59,130,246,0.05)', fill:false, tension:0.4, pointRadius:3, borderWidth:1.5, borderDash:[4,3]},
  ]};

  const donutOpts = { responsive:true, maintainAspectRatio:false, cutout:'60%' as const, plugins:{legend:{position:'bottom' as const,labels:{usePointStyle:true,padding:12,font:{size:11}}}}};
  const lineOpts = { responsive:true, maintainAspectRatio:false, interaction:{intersect:false,mode:'index' as const},
    plugins:{legend:{position:'bottom' as const,labels:{usePointStyle:true,padding:12,font:{size:11}}}},
    scales:{y:{type:'linear' as const,position:'left' as const,grid:{color:'#F1F5F9'},ticks:{font:{size:11},color:'#94A3B8',callback:(v:any)=>`${v} 元/tCO₂`}},
            y1:{type:'linear' as const,position:'right' as const,grid:{display:false},ticks:{font:{size:11},color:'#94A3B8',min:0,callback:(v:any)=>`${v} 手`}}}};

  return (<div className="min-h-screen bg-slate-50"><Sidebar /><div className="ml-[260px]">
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/" className="hover:text-orange-500 transition-colors">能碳管理平台</Link></div>
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer">王</div>
    </header>
    <div className="px-8 pt-6 pb-4">
      <div><h1 className="text-[22px] font-bold text-slate-800 tracking-tight">碳资产管理</h1><p className="text-[13px] text-slate-500 mt-1">碳配额、CCER、绿证等碳资产统一管理和履约跟踪</p></div>
    </div>

    {/* KPI */}
    <div className="px-8 pb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {lb:'碳资产总量',val:`${(s?.totalAssets/10000).toFixed(0)||'—'}万`,un:'tCO₂e'},
          {lb:'配额盈余',val:(s?.surplus||0).toLocaleString(),un:'tCO₂e'},
          {lb:'当前碳价',val:`¥${s?.carbonPrice?.toFixed(1)||'—'}`,un:'/tCO₂',ch:s?.priceChange,cl:'月涨幅'},
          {lb:'履约进度',val:s?.complianceProgress||'—',un:'%',cl:`截止 ${s?.complianceDeadline||'—'}`},
        ].map((c,i)=>{
          const g=['from-blue-400 to-blue-300','from-green-400 to-emerald-300','from-orange-400 to-amber-300','from-purple-400 to-violet-300'];
          return (<div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${g[i]}`}></div>
            <div className="text-xs font-medium text-slate-500 mb-3">{c.lb}</div>
            <div className="flex items-baseline gap-1"><span className="text-[28px] font-bold text-slate-800 tracking-tight">{c.val}</span><span className="text-sm text-slate-400">{c.un}</span></div>
            {c.ch && <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${c.ch>=0?'bg-red-50 text-red-600':'bg-green-50 text-green-600'}`}>{c.ch>=0?'↑':'↓'}{Math.abs(c.ch).toFixed(1)}% {c.cl}</div>}
            {c.cl && !c.ch && <div className="text-[10px] text-slate-400 mt-1">{c.cl}</div>}
          </div>);
        })}
      </div>
    </div>

    {/* Asset Mix + Price Trend */}
    <div className="px-8 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-sm font-semibold text-slate-800 mb-4">碳资产构成</div>
          <div className={`h-[240px] flex items-center justify-center ${s ? 'chart-entrance' : ''}`}>{s ? <Doughnut data={ad} options={donutOpts} /> : <span className="text-slate-400">...</span>}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-sm font-semibold text-slate-800 mb-4">碳价走势与成交量</div>
          <div className={`h-[240px] ${data?.monthlyPrice?.length ? 'chart-entrance' : ''}`}>{data?.monthlyPrice?.length ? <Line data={pd} options={lineOpts} /> : <div className="text-center text-slate-400 pt-16">加载中...</div>}</div>
        </div>
      </div>
    </div>

    {/* Asset Items Table */}
    <div className="px-8 pb-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200"><h3 className="text-sm font-semibold text-slate-800">碳资产明细</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-left">资产名称</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-center">类型</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-right">数量</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-left">来源</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-right">成本(元)</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-right">市值(元)</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-center">到期日</th>
            </tr></thead>
            <tbody>{loading ? <tr><td colSpan={7} className="text-center py-12 text-slate-400">加载中...</td></tr> : data?.assetItems?.map((item:any)=>(
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.name}</td>
                <td className="px-4 py-3 text-sm text-center"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.type==='碳配额'?'bg-blue-50 text-blue-600':item.type==='CCER'?'bg-green-50 text-green-600':'bg-orange-50 text-orange-600'}`}>{item.type}</span></td>
                <td className="px-4 py-3 text-sm text-right font-mono">{item.amount.toLocaleString()} <span className="text-[10px] text-slate-400">{item.unit}</span></td>
                <td className="px-4 py-3 text-sm text-slate-500">{item.source}</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{item.cost ? `¥${item.cost}` : <span className="text-slate-400">—</span>}</td>
                <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-green-600">¥{item.currentValue.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-center text-slate-500">{item.expiryDate}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Compliance Timeline */}
    <div className="px-8 pb-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-sm font-semibold text-slate-800 mb-4">履约进度时间线</div>
        <div className="flex items-start justify-between">
          {data?.complianceMilestones?.map((m:any,i:number)=>(
            <div key={i} className="flex-1 text-center relative">
              {i < (data?.complianceMilestones?.length||0)-1 && <div className="absolute top-3 left-[60%] right-0 h-0.5 bg-slate-200"></div>}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2 ${
                m.status==='已完成'?'bg-green-500 text-white':
                m.status==='进行中'?'bg-orange-500 text-white':
                'bg-slate-200 text-slate-500'
              }`}>
                {m.status==='已完成'?'✓':i+1}
              </div>
              <div className="text-[11px] font-medium text-slate-700">{m.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{m.targetDate}</div>
              <div className={`text-[10px] font-medium mt-0.5 ${
                m.status==='已完成'?'text-green-600':m.status==='进行中'?'text-orange-600':'text-slate-400'
              }`}>{m.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div></div>);
}
