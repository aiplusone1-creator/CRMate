'use client';

import React from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/language-context';
import { CRMateSymbol } from '@/components/brand/crmate-logo';

export function Sidebar() {
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  const navItems = [
    { label: t('navDashboard'), href: '/', icon: LayoutDashboard },
    { label: t('navProjects'), href: '/projects', icon: Briefcase },
    { label: t('navCompanies'), href: '/companies', icon: Building2 },
    { label: t('navContacts'), href: '/contacts', icon: Users },
    { label: t('navMyWeek'), href: '/my-week', icon: CalendarDays },
    { label: t('navMyDay'), href: '/my-day', icon: Sun },
    { label: t('navActivities'), href: '/activities', icon: History },
    { label: t('navReports'), href: '/reports', icon: BarChart3 },
    { label: t('navImport'), href: '/import', icon: FileSpreadsheet },
    { label: t('navSettings'), href: '/settings', icon: Settings },
  ];

  return (
    <aside className={cn(
      "w-20 glass-dock flex flex-col items-center py-5 h-screen fixed top-0 z-30 select-none overflow-y-auto overflow-x-hidden no-scrollbar transition-all duration-300",
      isRTL
        ? "right-0 border-l border-white/70 dark:border-[#8FC2F0]/10"
        : "left-0 border-r border-white/70 dark:border-[#8FC2F0]/10"
    )}>
      {/* Top: Brand Symbol + Nav */}
      <div className="flex flex-col items-center gap-6 w-full">

        {/* Logo */}
        <Link
          href="/"
          className="group relative flex flex-col items-center"
          title="CRMate"
        >
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
            "bg-white/90 dark:bg-[#1E2328]/90",
            "border border-white/90 dark:border-[#8FC2F0]/15",
            "shadow-[0_4px_12px_rgba(41,45,50,0.07)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]",
            "group-hover:border-[#8FC2F0]/60 dark:group-hover:border-[#8FC2F0]/40 group-hover:shadow-md"
          )}>
            <CRMateSymbol size={30} />
          </div>
          {/* Brand tooltip */}
          <div className={cn(
            "absolute top-2 px-3.5 py-2 text-white text-xs font-bold rounded-2xl shadow-2xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-50",
            "bg-[#292D32] dark:bg-[#1A1E24] border border-transparent dark:border-[#8FC2F0]/15",
            isRTL ? "right-16" : "left-16"
          )}>
            CRMate &bull; {t('appSubtitle')}
          </div>
        </Link>

        {/* Navigation Rail */}
        <nav className="flex flex-col items-center gap-1.5 w-full px-2.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <div key={item.href} className="relative group w-full flex justify-center">
                <Link
                  href={item.href}
                  className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative",
                    isActive
                      ? [
                          "bg-[#292D32] dark:bg-[#8FC2F0]",
                          "text-white dark:text-[#141820]",
                          "shadow-md shadow-[#292D32]/15 dark:shadow-[#8FC2F0]/20",
                          "scale-105"
                        ]
                      : [
                          "text-slate-400 dark:text-slate-400",
                          "hover:text-[#292D32] dark:hover:text-white",
                          "hover:bg-slate-100/90 dark:hover:bg-white/10"
                        ]
                  )}
                  title={item.label}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "stroke-[2.5]" : "stroke-[2]"
                  )} />

                  {/* Active dot indicator */}
                  {isActive && (
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full bg-[#77CE69] absolute",
                      isRTL ? "right-1.5" : "left-1.5"
                    )} />
                  )}
                </Link>

                {/* Tooltip */}
                <div className={cn(
                  "absolute top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-bold rounded-xl shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50",
                  "bg-[#292D32] dark:bg-[#1A1E24] text-white",
                  "border border-transparent dark:border-[#8FC2F0]/15",
                  isRTL ? "right-16" : "left-16"
                )}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
