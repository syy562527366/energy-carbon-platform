'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function CarbonAuditPage() {
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('list');
  const fetchData = useCallback(async () => { try { const r=await fetch('/api/carbon-audit');const d=await r.json();if(d.success)setData(d); }catch(e){console.error(e)}finally{setLoading(false)} },[]);
  useEffect(()=>{document.title='能碳管理平台 - F-09 碳核查支撑';fetchData()},[fetchData]);
  const s = data?.summary;

  const statusColors: Record<string,string> = {'已核查':'bg-green-50 text-green-600','待核查':'bg-amber-50 text-amber-600','有异议':'bg-red-50 text-red-600'};

  return (<div className="min-h-screen bg-slate-50"><Sidebar /><div className="ml-[260px]">
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/" className="hover:text-orange-500 transition-colors">能碳管理平台</Link></div>
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer">王</div>
    </header>
    <div className="px-8 pt-6 pb-4">
      <div className="flex items-start justify-between">
        <div><h1 className="text-[22px] font-bold text-slate-800 tracking-tight">碳核查支撑</h1><p className="text-[13px] text-slate-500 mt-1">核算过程数据溯源与原始凭证管理，支撑第三方核查</p></div>
      </div>
    </div>

    {/* KPI */}
    <div className="px-8 pb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{lb:'核算记录总数',val:s?.totalRecords||'—',un:'条',co:'bg-blue-50 text-blue-500'},{lb:'已核查通过',val:s?.verifiedRecords||'—',un:'条',co:'bg-green-50 text-green-500'},{lb:'待核查',val:s?.pendingReview||'—',un:'条',co:'bg-amber-50 text-amber-500'},{lb:'存异议项',val:s?.issuesFound||'—',un:'条',co:'bg-red-50 text-red-500'}].map((c,i)=>{
          const g=['from-blue-400 to-blue-300','from-green-400 to-emerald-300','from-amber-400 to-yellow-300','from-red-400 to-rose-300'];
          return (<div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${g[i]}`}></div>
            <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-slate-500">{c.lb}</span><div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.co}`}>
              {i===0&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              {i===1&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
              {i===2&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
              {i===3&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
            </div></div>
            <div className="flex items-baseline gap-1"><span className="text-[28px] font-bold text-slate-800 tracking-tight">{c.val}</span><span className="text-sm text-slate-400 ml-1">{c.un}</span></div>
          </div>);
        })}
      </div>
    </div>

    {/* Tab Switcher */}
    <div className="px-8 pb-4">
      <div className="flex gap-2">
        {[{id:'list',lb:'核查清单'},{id:'trace',lb:'数据溯源'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t.id?'bg-orange-500 text-white shadow-sm':'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{t.lb}</button>
        ))}
      </div>
    </div>

    {tab === 'list' && (<div className="px-8 pb-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200"><h3 className="text-sm font-semibold text-slate-800">核算数据核查清单</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-left">排放源</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-left">数据来源</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-right">核算值</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-center">状态</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-left">问题</th>
              <th className="px-4 py-3 text-[11px] font-medium text-slate-500 bg-slate-50/80 border-b border-slate-100 text-left">核查人</th>
            </tr></thead>
            <tbody>{loading ? <tr><td colSpan={6} className="text-center py-12 text-slate-400">加载中...</td></tr> : data?.auditItems?.map((item:any)=>(
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.source}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{item.dataSource}</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{item.dataValue}</td>
                <td className="px-4 py-3 text-sm text-center"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[item.status]||'bg-slate-50 text-slate-500'}`}>{item.status}</span></td>
                <td className="px-4 py-3 text-sm text-red-500 max-w-[200px]">{item.issue||<span className="text-slate-400">—</span>}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{item.verifier||<span className="text-slate-400">待分配</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>)}

    {tab === 'trace' && (<div className="px-8 pb-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-sm font-semibold text-slate-800 mb-4">数据溯源链条</div>
        <div className="relative">
          {data?.traceChain?.map((step:any, i:number)=>(
            <div key={i} className="flex gap-4 pb-6 relative">
              {i < (data?.traceChain?.length||0)-1 && <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200"></div>}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${i===0?'bg-orange-500':i===data?.traceChain?.length-1?'bg-green-500':'bg-blue-500'}`}>{i+1}</div>
              <div className="flex-1 bg-slate-50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-semibold text-slate-700">{step.action}</span>
                  <span className="text-[10px] text-slate-400">{step.time}</span>
                </div>
                <p className="text-xs text-slate-500 mb-1">来源: {step.source} | 操作人: {step.operator}</p>
                <p className="text-xs text-slate-600 font-mono bg-white rounded px-2 py-1 border border-slate-100">{step.data}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>)}
  </div></div>);
}
