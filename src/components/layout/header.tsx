'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Check, 
  ChevronDown, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Flame,
  Users,
  LogOut,
  MapPin,
  TrendingUp,
  Terminal,
  Shield,
  Briefcase,
  Award
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { formatDateString, formatCurrencySAR } from '@/lib/utils';
import { GlobalSearch } from './global-search';
import { SEEDED_USERS } from '@/lib/constants/users';
import { authRepository } from '@/lib/repo/local/auth';

export function Header() {
  const router = useRouter();
  const { 
    currentUser, 
    teamMembers,
    selectedSalesFilter,
    setSelectedSalesFilter,
    switchUser,
    logout,
    reminders, 
    toggleReminderCompleted, 
    deleteReminder, 
    openReminder,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    openRequestDetail
  } = useCRM();

  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'requests' | 'reminders'>('requests');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const teamFilterRef = useRef<HTMLDivElement>(null);
  const devMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (teamFilterRef.current && !teamFilterRef.current.contains(target)) {
        setIsTeamMenuOpen(false);
      }
      if (devMenuRef.current && !devMenuRef.current.contains(target)) {
        setIsDevMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Count due/overdue + not completed reminders
  const now = new Date();
  const dueReminders = reminders.filter(r => {
    if (r.is_completed) return false;
    const dueTime = new Date(`${r.reminder_date}T${r.reminder_time}:00`);
    return dueTime <= now;
  });
  const upcomingReminders = reminders.filter(r => {
    if (r.is_completed) return false;
    const dueTime = new Date(`${r.reminder_date}T${r.reminder_time}:00`);
    return dueTime > now;
  }).sort((a, b) => new Date(`${a.reminder_date}T${a.reminder_time}`).getTime() - new Date(`${b.reminder_date}T${b.reminder_time}`).getTime()).slice(0, 5);

  const isManagerOrAdmin = currentUser.role === 'sales_manager' || currentUser.role === 'admin';
  const isDevAdmin = currentUser.id === 'u5' || currentUser.role === 'admin';

  // Notifications for approval requests & system alerts
  const myNotifications = notifications.filter(n => !n.user_id || n.user_id === currentUser.id || isManagerOrAdmin);
  const unreadNotifs = myNotifications.filter(n => !n.is_read);

  const badgeCount = dueReminders.length + unreadNotifs.length;
  const allVisible = [...dueReminders, ...upcomingReminders];

  // Selected filter label
  const selectedMember = teamMembers.find(m => m.id === selectedSalesFilter);
  const filterLabel = selectedSalesFilter === 'all' 
    ? 'All Sales Team (الجميع)' 
    : selectedMember ? `${selectedMember.full_name} (${selectedMember.territory || 'مندوب'})` : 'Filter Rep';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin',
          labelAr: 'مدير النظام',
          badgeClass: 'bg-purple-100 text-purple-700 border-purple-200/80',
          dotColor: 'bg-purple-500'
        };
      case 'sales_manager':
        return {
          label: 'Sales Manager',
          labelAr: 'مدير مبيعات',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200/80',
          dotColor: 'bg-amber-500'
        };
      case 'sales_engineer':
        return {
          label: 'Sales Engineer',
          labelAr: 'مهندس مبيعات',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-200/80',
          dotColor: 'bg-[#8FC2F0]'
        };
      case 'estimator':
        return {
          label: 'Estimator',
          labelAr: 'مهندس تسعير',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200/80',
          dotColor: 'bg-[#77CE69]'
        };
      case 'viewer':
      default:
        return {
          label: 'Viewer',
          labelAr: 'مشاهد',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
          dotColor: 'bg-slate-400'
        };
    }
  };

  const roleBadge = getRoleBadge(currentUser.role);

  return (
    <header className="h-16 border-b border-white/60 bg-white/80 backdrop-blur-xl px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Official Horizontal Brand Wordmark + Working Global Search */}
      <div className="flex items-center gap-4 min-w-0">
        <span className="font-urbanist font-black text-xl tracking-tight text-[#292D32] select-none shrink-0">
          CRM<span className="text-[#8FC2F0]">ate</span><span className="text-[#77CE69] text-2xl font-black ml-0.5 leading-none">.</span>
        </span>

        {/* Global Interactive Live Search Bar */}
        <GlobalSearch />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Sales Manager Filter Pill (Visible to Sales Manager & Admin) */}
        {isManagerOrAdmin && (
          <div className="relative" ref={teamFilterRef}>
            <button
              onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-[#292D32] bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/90 transition-all shadow-xs font-urbanist cursor-pointer"
              title="فلترة خط المبيعات حسب المندوب"
            >
              <Users className="w-3.5 h-3.5 text-[#8FC2F0]" />
              <span className="hidden md:inline text-slate-500 font-medium">Viewing:</span>
              <span className="max-w-[140px] truncate">{filterLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isTeamMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-urbanist flex items-center justify-between">
                  <span>Sales Rep Scope (نطاق المبيعات)</span>
                  <span className="text-purple-600 font-black text-[9px]">MANAGER</span>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setSelectedSalesFilter('all');
                      setIsTeamMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      selectedSalesFilter === 'all' ? 'bg-[#EFF3F8] text-[#292D32] font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <div>
                        <div>All Sales Team (الجميع)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Team Overview &bull; All Deals</div>
                      </div>
                    </div>
                    {selectedSalesFilter === 'all' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>

                  {teamMembers.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedSalesFilter(m.id);
                        setIsTeamMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        selectedSalesFilter === m.id ? 'bg-[#EFF3F8] text-[#292D32] font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[#292D32] text-white text-[10px] font-bold flex items-center justify-center">
                          {m.avatar_initials}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate">{m.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate">
                            {m.territory || 'Sales Territory'} {m.id === 'u1' ? '(34 deals)' : '(0 deals)'}
                          </div>
                        </div>
                      </div>
                      {selectedSalesFilter === m.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DEV PANEL: Strictly visible to u5 Admin */}
        {isDevAdmin && (
          <div className="relative" ref={devMenuRef}>
            <button
              onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full border border-indigo-200/90 transition-all shadow-2xs font-mono cursor-pointer"
              title="Dev Panel: Quick switch test user accounts (u1 - u5)"
            >
              <Terminal className="w-3 h-3 text-indigo-600" />
              <span>Dev: Switch User</span>
              <ChevronDown className="w-3 h-3 text-indigo-400" />
            </button>

            {isDevMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 text-white rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 border border-slate-700">
                <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
                  <span>Dev Quick Switcher</span>
                  <span className="text-emerald-400 text-[9px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60 font-semibold">u5 ADMIN</span>
                </div>
                <div className="space-y-1">
                  {SEEDED_USERS.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        authRepository.switchUserDev(u.id);
                        switchUser(u.id);
                        setIsDevMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        currentUser.id === u.id ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div 
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-xs font-mono"
                          style={{ backgroundColor: u.avatar_color }}
                        >
                          {u.id.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate text-[12px] leading-tight">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate">
                            {u.role.replace('_', ' ')} &bull; {u.id === 'u1' ? '34 deals' : u.id === 'u3' ? 'Manager' : u.id === 'u5' ? 'Admin' : '0 deals'}
                          </div>
                        </div>
                      </div>
                      {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notification Bell with dynamic badge & popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {badgeCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
              {/* Popover Header with Tab Switcher */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3">
                <div className="flex items-center justify-between pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-300" />
                    <span className="font-bold text-sm">Notifications &amp; Alerts</span>
                  </div>
                  {notifTab === 'reminders' && (
                    <button
                      onClick={() => {
                        openReminder();
                        setIsNotifOpen(false);
                      }}
                      className="text-[11px] bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer"
                    >
                      + Add
                    </button>
                  )}
                  {notifTab === 'requests' && unreadNotifs.length > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="text-[11px] bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white/10 p-1 rounded-xl">
                  <button
                    onClick={() => setNotifTab('requests')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      notifTab === 'requests' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>Approvals</span>
                    {unreadNotifs.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">
                        {unreadNotifs.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setNotifTab('reminders')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      notifTab === 'reminders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>Reminders</span>
                    {dueReminders.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                        {dueReminders.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab 1: Approval System Notifications */}
              {notifTab === 'requests' && (
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {myNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                      <p className="text-xs font-semibold">No notifications right now</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Approval requests and updates will appear here</p>
                    </div>
                  ) : (
                    myNotifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.reference_id && n.reference_type === 'request') {
                            openRequestDetail(n.reference_id);
                            setIsNotifOpen(false);
                          }
                        }}
                        className={`p-3 transition-colors cursor-pointer flex items-start gap-3 ${
                          n.is_read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-800 truncate">{n.title}</span>
                            <span className="text-[9px] text-slate-400 shrink-0 font-mono">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.body}</p>
                        </div>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Reminders List */}
              {notifTab === 'reminders' && (
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {allVisible.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">No pending reminders</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">You are completely caught up!</p>
                    </div>
                  ) : (
                    allVisible.map(r => {
                      const isOverdue = dueReminders.some(d => d.id === r.id);
                      return (
                        <div 
                          key={r.id} 
                          className={`p-3 transition-colors flex items-start gap-3 ${
                            isOverdue ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <button
                            onClick={() => toggleReminderCompleted(r.id)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                            title="Mark completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                              <span className="text-xs font-bold text-slate-800 truncate">{r.title}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>{formatDateString(r.reminder_date)} at {r.reminder_time}</span>
                              {r.project_name && (
                                <span className="text-indigo-600 font-medium truncate">&bull; {r.project_name}</span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => deleteReminder(r.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile & Account Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200/80 hover:opacity-90 transition-opacity text-left cursor-pointer"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-[#292D32] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white font-urbanist">
                {currentUser.avatar_initials || 'EM'}
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#77CE69] border-2 border-white absolute -bottom-0.5 -right-0.5" />
            </div>

            <div className="text-left leading-tight hidden lg:block max-w-[170px]">
              <div className="text-xs font-bold text-[#292D32] flex items-center gap-1.5 font-urbanist truncate">
                <span className="truncate">{currentUser.full_name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-md border ${roleBadge.badgeClass}`}>
                  {roleBadge.label}
                </span>
              </div>
            </div>
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200/90 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Profile Card Summary */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#292D32] text-white flex items-center justify-center font-bold text-sm shadow-xs font-urbanist">
                    {currentUser.avatar_initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#292D32] truncate font-urbanist">
                      {currentUser.full_name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {currentUser.email}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-md border ${roleBadge.badgeClass}`}>
                        {roleBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-2.5">
                  <MapPin className="w-2.5 h-2.5 text-[#8FC2F0]" />
                  <span>{currentUser.territory || 'Western Region'}</span>
                </div>

                {currentUser.monthly_target_sar && (
                  <div className="mt-3 p-2 bg-[#EFF3F8] rounded-xl flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[#77CE69]" />
                      Monthly Target
                    </span>
                    <span className="font-bold text-[#292D32] font-mono">
                      {formatCurrencySAR(currentUser.monthly_target_sar)}
                    </span>
                  </div>
                )}
              </div>

              {/* Logout button */}
              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج (Log Out)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
