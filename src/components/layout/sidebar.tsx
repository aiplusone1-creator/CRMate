'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Building2, 
  Users, 
  CalendarDays, 
  Sun, 
  History, 
  BarChart3, 
  Settings,
  Plus,
  FolderKanban,
  UserPlus,
  Activity as ActivityIcon,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCRM } from '@/lib/store/crm-context';

import { CRMateSymbol } from '@/components/brand/crmate-logo';

export function Sidebar() {
  const pathname = usePathname();
  const { openFastLog, openNewProjectModal, openNewContactModal, currentUser } = useCRM();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Re-ordered modules as requested by user:
  // Dashboard -> Projects -> Companies -> Contacts -> My Week -> My Day -> Activities -> Reports -> Import Data -> Settings
  const navItems = [
    { label: 'Dashboard', labelAr: 'لوحة المؤشرات', href: '/', icon: LayoutDashboard },
    { label: 'Projects', labelAr: 'المشاريع والفرص', href: '/projects', icon: Briefcase },
    { label: 'Companies', labelAr: 'الشركات والعملاء', href: '/companies', icon: Building2 },
    { label: 'Contacts', labelAr: 'جهات الاتصال', href: '/contacts', icon: Users },
    { label: 'My Week', labelAr: 'خطة الأسبوع', href: '/my-week', icon: CalendarDays },
    { label: 'My Day', labelAr: 'مهام اليوم', href: '/my-day', icon: Sun },
    { label: 'Activities', labelAr: 'سجل الأنشطة', href: '/activities', icon: History },
    { label: 'Reports', labelAr: 'التقارير التحليلية', href: '/reports', icon: BarChart3 },
    { label: 'Import Data', labelAr: 'استيراد البيانات', href: '/import', icon: FileSpreadsheet },
    { label: 'Settings', labelAr: 'الإعدادات', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-20 bg-white/95 backdrop-blur-md border-r border-slate-200/80 flex flex-col items-center py-5 h-screen fixed top-0 left-0 z-30 select-none shadow-[2px_0_15px_-4px_rgba(41,45,50,0.03)] justify-between">
      {/* Top: Official CRMate Brand Symbol */}
      <div className="flex flex-col items-center gap-6 w-full">
        <Link 
          href="/" 
          className="group relative flex flex-col items-center"
          title="CRMate."
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:shadow-md group-hover:border-[#8FC2F0]">
            <CRMateSymbol size={32} />
          </div>
          {/* Tooltip */}
          <div className="absolute left-16 top-2 px-3 py-1.5 bg-[#292D32] text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 font-urbanist">
            CRMate &bull; Sales &amp; Pipeline
          </div>
        </Link>

        {/* Navigation Items (Icon-Only Rail) */}
        <nav className="flex flex-col items-center gap-2 w-full px-2.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <div key={item.href} className="relative group w-full flex justify-center">
                <Link
                  href={item.href}
                  className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200",
                    isActive
                      ? "bg-[#292D32] text-white shadow-md shadow-[#292D32]/25 scale-100"
                      : "text-slate-400 hover:text-[#292D32] hover:bg-slate-100/80"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-slate-500")} />
                  {/* Subtle active glow dot */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#77CE69] absolute -right-0.5 top-1/2 -translate-y-1/2 shadow-xs" />
                  )}
                </Link>

                {/* Floating Modern Tooltip */}
                <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3.5 py-2 bg-[#292D32] text-white text-xs rounded-xl shadow-2xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 flex flex-col gap-0.5">
                  <span className="font-bold text-white leading-tight font-urbanist">{item.label}</span>
                  <span className="text-[10px] text-slate-300 font-arabic">{item.labelAr}</span>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Quick Add (+) & User Avatar */}
      <div className="flex flex-col items-center gap-3.5 w-full px-2.5">
        {/* Quick Add Button with popup menu */}
        <div className="relative">
          <button
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="w-11 h-11 rounded-2xl bg-[#8FC2F0]/20 hover:bg-[#8FC2F0]/30 text-[#292D32] border border-[#8FC2F0]/40 flex items-center justify-center shadow-xs transition-all duration-200 group"
            title="Quick Create &bull; إنشاء سريع"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200 text-[#292D32]" />
          </button>

          {isQuickAddOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsQuickAddOpen(false)} 
              />
              <div className="absolute left-14 bottom-0 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider font-urbanist">
                  Quick Create &bull; إنشاء سريع
                </div>
                <button
                  onClick={() => { openNewProjectModal(); setIsQuickAddOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <FolderKanban className="w-4 h-4 text-blue-500" />
                  <span>New Project</span>
                </button>
                <button
                  onClick={() => { openNewContactModal(); setIsQuickAddOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-emerald-500" />
                  <span>New Contact</span>
                </button>
                <button
                  onClick={() => { openFastLog(); setIsQuickAddOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <ActivityIcon className="w-4 h-4 text-amber-500" />
                  <span>Fast Log Activity</span>
                </button>
                <Link
                  href="/import"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors border-t border-slate-100 mt-1 pt-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#77CE69]" />
                  <span>Import Excel Sheet</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* User Avatar */}
        <div className="relative group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 border border-slate-300/80 flex items-center justify-center font-black text-xs text-[#292D32] shadow-2xs group-hover:ring-2 group-hover:ring-[#8FC2F0] transition-all cursor-pointer">
            EM
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#77CE69] border-2 border-white absolute -bottom-0.5 -right-0.5" />

          {/* User Tooltip */}
          <div className="absolute left-16 bottom-1 px-3 py-1.5 bg-[#292D32] text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50">
            {currentUser.full_name}
          </div>
        </div>
      </div>
    </aside>
  );
}
