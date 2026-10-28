'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText,
  Building2, 
  Users, 
  CalendarDays, 
  History, 
  BarChart3, 
  Settings,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/language-context';
import { CRMateSymbol } from '@/components/brand/crmate-logo';

export function Sidebar() {
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('al_mespar_sidebar_pinned');
      if (saved !== null) {
        setIsPinned(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const togglePinned = () => {
    setIsPinned(prev => {
      const next = !prev;
      try {
        localStorage.setItem('al_mespar_sidebar_pinned', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isExpanded = isHovered || isPinned;

  const navItems = [
    { label: isRTL ? 'لوحة المؤشرات' : 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: isRTL ? 'المشاريع' : 'Projects', href: '/projects', icon: Briefcase },
    { label: isRTL ? 'عروض الأسعار' : 'Quotations', href: '/quotations', icon: FileText },
    { label: isRTL ? 'الشركات' : 'Companies', href: '/companies', icon: Building2 },
    { label: isRTL ? 'جهات الاتصال' : 'Contacts', href: '/contacts', icon: Users },
    { label: isRTL ? 'خطة الأسبوع' : 'Weekly Plan', href: '/my-week', icon: CalendarDays },
    { label: isRTL ? 'سجل الأنشطة' : 'Activities', href: '/activities', icon: History },
    { label: isRTL ? 'التقارير والتحليلات' : 'Reports', href: '/reports', icon: BarChart3 },
    { label: isRTL ? 'الإعدادات' : 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "h-screen fixed top-0 z-40 select-none overflow-y-auto overflow-x-hidden no-scrollbar transition-[width,box-shadow] duration-300 ease-in-out py-3 flex flex-col justify-between",
        "bg-white/95 dark:bg-[#141820]/95 backdrop-blur-xl border-slate-200/80 dark:border-[#8FC2F0]/10",
        isExpanded ? "w-56 shadow-2xl" : "w-16 md:w-18 shadow-sm",
        isRTL ? "right-0 border-l" : "left-0 border-r",
        "print:hidden"
      )}
    >
      {/* Top Section: Logo & Nav items */}
      <div className="flex flex-col w-full px-2.5">
        
        {/* Logo / Brand Header */}
        <Link
          href="/"
          prefetch={true}
          className="flex items-center gap-3 px-2 py-2 mb-3 rounded-2xl group transition-all"
          title="CRMate"
        >
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E2328] border border-slate-200/80 dark:border-[#8FC2F0]/20 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <CRMateSymbol size={26} />
          </div>
          <div className={cn(
            "transition-all duration-200 whitespace-nowrap overflow-hidden font-urbanist",
            isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 w-0 pointer-events-none"
          )}>
            <span className="text-lg font-black text-[#292D32] dark:text-white tracking-tight">
              CRMate<span className="text-[#0088FF]">.</span>
            </span>
          </div>
        </Link>

        {/* Navigation Rail */}
        <nav className="flex flex-col gap-1 w-full">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 relative group",
                  isActive
                    ? "bg-[#1E2536] text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5"
                )}
                title={item.label}
              >
                {/* Icon Container */}
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-110",
                  isActive 
                    ? "bg-[#0088FF] text-white shadow-xs" 
                    : "text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white"
                )}>
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>

                {/* Label (Slides and fades on hover/expand) */}
                <span className={cn(
                  "truncate transition-all duration-200",
                  isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 w-0 pointer-events-none"
                )}>
                  {item.label}
                </span>

                {/* Active indicator dot when collapsed */}
                {isActive && !isExpanded && (
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full bg-[#77CE69] absolute",
                    isRTL ? "right-1" : "left-1"
                  )} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Pin / Collapse Button */}
      <div className="flex flex-col gap-1.5 w-full px-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10 shrink-0">
        {/* Pin / Collapse Toggle Button */}
        <button
          type="button"
          onClick={togglePinned}
          className={cn(
            "flex items-center gap-3 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors cursor-pointer",
            !isExpanded && "justify-center px-0"
          )}
          title={isPinned ? (isRTL ? 'تصغير القائمة' : 'Collapse Sidebar') : (isRTL ? 'تثبيت القائمة مفتوحة' : 'Pin Sidebar Open')}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-slate-400 hover:text-slate-600">
            {isRTL ? (
              isPinned ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />
            ) : (
              isPinned ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />
            )}
          </div>
          <span className={cn(
            "transition-all duration-200 text-[11px] text-slate-400",
            isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 w-0 pointer-events-none"
          )}>
            {isPinned ? (isRTL ? 'إلغاء التثبيت' : 'Unpin') : (isRTL ? 'تثبيت الشريط' : 'Pin Open')}
          </span>
        </button>
      </div>
    </aside>
  );
}
