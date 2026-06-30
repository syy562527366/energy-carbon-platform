'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  icon: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: '能耗查询', icon: 'activity', href: '/', badge: '实时' },
  { label: '能源消费量和强度计算', icon: 'calculator', href: '/energy-intensity' },
  { label: '能源消费分析与用能策略推荐', icon: 'bar-chart', href: '/energy-analysis' },
  { label: '能效对标', icon: 'target', href: '/benchmarking' },
  { label: '能流分析', icon: 'radio', href: '/energy-flow' },
  { label: '能效平衡与优化', icon: 'sliders', href: '/efficiency-optimization' },
  { label: '用能与碳排放预算管理', icon: 'bell', href: '/budget-management', badge: '预警' },
  { label: '碳排放核算', icon: 'cloud', href: '/carbon-accounting' },
  { label: '碳核查支撑', icon: 'file-text', href: '/carbon-audit' },
  { label: '产品碳足迹核算', icon: 'compass', href: '/carbon-footprint' },
  { label: '供应链碳管理', icon: 'layers', href: '/supply-chain' },
  { label: '碳资产管理', icon: 'database', href: '/carbon-assets' },
];

function NavIcon({ type }: { type: string }) {
  const props: React.SVGProps<SVGSVGElement> = {
    width: 18, height: 18, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  switch (type) {
    case 'activity': return <svg {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    case 'calculator': return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    case 'bar-chart': return <svg {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/></svg>;
    case 'target': return <svg {...props}><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>;
    case 'radio': return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/><path d="m4.93 4.93 2.83 2.83m8.48 8.48 2.83 2.83m0-14.14-2.83 2.83m-8.48 8.48-2.83 2.83"/></svg>;
    case 'sliders': return <svg {...props}><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>;
    case 'bell': return <svg {...props}><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>;
    case 'cloud': return <svg {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    case 'file-text': return <svg {...props}><path d="M9 12h6"/><path d="M9 16h6"/><path d="M9 8h2"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
    case 'compass': return <svg {...props}><path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z"/><path d="M12 6v6l4 2"/></svg>;
    case 'layers': return <svg {...props}><path d="M3 3v18h18"/><path d="M7 9h10"/><path d="M7 12h7"/><path d="M7 15h4"/></svg>;
    case 'database': return <svg {...props}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>;
    default: return <svg {...props}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[260px] z-50 bg-[#0F172A] flex flex-col overflow-y-auto"
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-[18px] border-b border-white/10 flex-shrink-0">
        <img src="/carbon-logo.jpg" alt="碳启城" className="w-10 h-10 rounded-xl flex-shrink-0 bg-white p-0.5 object-contain" />
        <div>
          <div className="text-sm font-semibold text-white tracking-wide">碳启城能碳管理平台</div>
          <div className="text-[10px] text-white/40 font-medium">Carbon & Energy Manager</div>
        </div>
      </div>

      {/* Section */}
      <div className="px-4 pt-4 pb-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">
        核心功能
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 pb-6 space-y-0.5">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-sm font-medium transition-all duration-150 relative ${
                isActive
                  ? 'bg-orange-500/15 text-orange-400'
                  : 'text-white/65 hover:bg-white/5 hover:text-white/90'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-orange-500 rounded-r-sm"></span>
              )}
              <span className="flex-shrink-0 opacity-70"><NavIcon type={item.icon} /></span>
              <span className="leading-tight">{item.label}</span>
              {item.badge && (
                <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/40'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
