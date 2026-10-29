'use client';

import React, { useState, useMemo } from 'react';
import { 
  Crown, 
  Briefcase, 
  Phone, 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  Table as TableIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  Users2,
  Building2,
  CalendarDays,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { VIPItem, VIPCategory, VIPPriority, VIPStatus } from '@/types/crm';
import { scopeVIPItems } from '@/lib/logic/scope';
import { VIPKanbanView } from '@/components/vip/vip-kanban-view';
import { VIPTableView } from '@/components/vip/vip-table-view';
import { AddVIPModal } from '@/components/vip/add-vip-modal';
import { CompleteVIPModal } from '@/components/vip/complete-vip-modal';

export default function VIPPage() {
  const { 
    vipItems, 
    addVIPItem, 
    updateVIPItem, 
    deleteVIPItem, 
    completeVIPItem,
    projects,
    contacts,
    companies,
    currentUser,
    teamMembers,
    currentRole
  } = useCRM();

  const { isRTL, language } = useLanguage();

  // Active category tab: Revisit Projects vs VIP Calls
  const [activeCategory, setActiveCategory] = useState<VIPCategory>('revisit_project');

  // Display mode: Kanban vs Table
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | VIPPriority>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  // Manager Team Filter
  const [selectedSalesFilter, setSelectedSalesFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [completeTargetItem, setCompleteTargetItem] = useState<VIPItem | null>(null);

  // User Feedback Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleUpdateStatus = async (id: string, nextStatus: VIPStatus) => {
    try {
      await updateVIPItem(id, { status: nextStatus });
      showToast(isRTL ? 'تم تحديث حالة عنصر VIP بنجاح' : 'VIP item status updated successfully', 'success');
    } catch (err: any) {
      showToast(
        (isRTL ? 'فشل تحديث الحالة: ' : 'Failed to update status: ') + (err?.message || 'Error'),
        'error'
      );
    }
  };

  const handleDeleteVIP = async (id: string) => {
    try {
      await deleteVIPItem(id);
      showToast(isRTL ? 'تم حذف عنصر VIP بنجاح' : 'VIP item deleted successfully', 'success');
    } catch (err: any) {
      showToast(
        (isRTL ? 'فشل حذف عنصر VIP: ' : 'Failed to delete VIP item: ') + (err?.message || 'Error'),
        'error'
      );
    }
  };

  const isManagerOrAdmin = 
    currentRole === 'admin' || 
    currentRole === 'sales_manager' || 
    currentRole === 'viewer' || 
    currentRole === 'estimator';

  // 1. Role-scoped VIP items
  const scopedItems = useMemo(() => {
    return scopeVIPItems(vipItems, currentUser, selectedSalesFilter);
  }, [vipItems, currentUser, selectedSalesFilter]);

  // 2. Counts for tab badges
  const revisitCount = useMemo(() => {
    return scopedItems.filter(i => i.category === 'revisit_project' && i.status !== 'completed').length;
  }, [scopedItems]);

  const vipCallsCount = useMemo(() => {
    return scopedItems.filter(i => i.category === 'vip_call' && i.status !== 'completed').length;
  }, [scopedItems]);

  // 3. Filtered items for current view
  const displayItems = useMemo(() => {
    return scopedItems.filter(item => {
      // Category match
      if (item.category !== activeCategory) return false;

      // Status filter
      if (!showCompleted && item.status === 'completed') return false;

      // Priority filter
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const companyMatch = item.company_name?.toLowerCase().includes(query);
        const locationMatch = item.location_name?.toLowerCase().includes(query);
        const phoneMatch = item.phone?.includes(query);
        const notesMatch = item.notes?.toLowerCase().includes(query);
        if (!titleMatch && !companyMatch && !locationMatch && !phoneMatch && !notesMatch) {
          return false;
        }
      }

      return true;
    });
  }, [scopedItems, activeCategory, showCompleted, priorityFilter, searchQuery]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isRTL ? 'قائمة كبار العملاء والمتابعات الخاصة (VIP)' : 'VIP & Priority Tracking'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                {revisitCount + vipCallsCount} {isRTL ? 'قيد المتابعة' : 'Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                {isRTL 
                  ? 'مشاريع استكشافية ومكالمات هامة خارج الـ Pipeline الرسمي (لا تولّد أرقام PR ولا تُحتسب في الصفقات)'
                  : 'Isolated high-priority focus list (no PR generated, zero pipeline pollution)'}
              </span>
            </p>
          </div>
        </div>

        {/* Manager Filter & Add Action */}
        <div className="flex items-center gap-3 flex-wrap">
          {isManagerOrAdmin && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs shadow-sm">
              <Users2 className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedSalesFilter}
                onChange={e => setSelectedSalesFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">{isRTL ? 'جميع مهندسي المبيعات (All Team)' : 'All Sales Engineers'}</option>
                {teamMembers.filter(m => m.role === 'sales_engineer').map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeCategory === 'revisit_project' 
                ? (isRTL ? 'إضافة مشروع للمعاودة' : 'Add Revisit Project')
                : (isRTL ? 'إضافة اتصال VIP' : 'Add VIP Call')}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-200/60 dark:bg-slate-900 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveCategory('revisit_project')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === 'revisit_project'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4 text-amber-500" />
            <span>{isRTL ? 'Revisit These Projects (مشاريع للمعاودة)' : 'Revisit Projects'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700 font-bold">
              {revisitCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('vip_call')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === 'vip_call'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4 text-blue-500" />
            <span>{isRTL ? 'VIP Calls (مكالمات VIP)' : 'VIP Calls'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700 font-bold">
              {vipCallsCount}
            </span>
          </button>
        </div>

        {/* View Switcher, Search & Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute top-3 right-3 text-slate-400" />
            <input
              type="text"
              placeholder={isRTL ? 'بحث بالاسم، الشركة، المدينة...' : 'Search title, company...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none shadow-sm cursor-pointer"
          >
            <option value="all">{isRTL ? 'جميع الأولويات' : 'All Priorities'}</option>
            <option value="urgent">🔴 {isRTL ? 'عاجل جداً' : 'Urgent'}</option>
            <option value="high">🟠 {isRTL ? 'مهم' : 'High'}</option>
            <option value="normal">🔵 {isRTL ? 'عادي' : 'Normal'}</option>
          </select>

          {/* Show completed toggle */}
          <button
            type="button"
            onClick={() => setShowCompleted(prev => !prev)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5 ${
              showCompleted 
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isRTL ? 'إظهار المنجز' : 'Show Completed'}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-900 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={isRTL ? 'عرض كانبان' : 'Kanban View'}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={isRTL ? 'عرض جدول' : 'Table View'}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'kanban' ? (
        <VIPKanbanView
          items={displayItems}
          onOpenCompleteModal={item => setCompleteTargetItem(item)}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteVIP}
        />
      ) : (
        <VIPTableView
          items={displayItems}
          onOpenCompleteModal={item => setCompleteTargetItem(item)}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteVIP}
        />
      )}

      {/* Add Modal */}
      <AddVIPModal
        isOpen={isAddModalOpen}
        defaultCategory={activeCategory}
        projects={projects}
        contacts={contacts}
        companies={companies}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={async itemData => {
          await addVIPItem(itemData);
          showToast(isRTL ? 'تمت إضافة عنصر VIP وحفظه بنجاح' : 'VIP item added and saved successfully', 'success');
        }}
      />

      {/* Complete Mandatory Done Modal */}
      <CompleteVIPModal
        isOpen={Boolean(completeTargetItem)}
        item={completeTargetItem}
        onClose={() => setCompleteTargetItem(null)}
        onComplete={async params => {
          await completeVIPItem(params);
          showToast(isRTL ? 'تم تسجيل الإنجاز والنشاط بنجاح' : 'Action and activity completed successfully', 'success');
        }}
      />

      {/* User Toast Alert */}
      {toast && (
        <div 
          role="alert"
          aria-live="assertive"
          className={cn(
            "fixed bottom-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in fade-in slide-in-from-bottom-4 text-sm font-bold",
            isRTL ? "left-6" : "right-6",
            toast.type === 'error'
              ? "bg-rose-900/95 text-white border-rose-700 shadow-rose-950/40"
              : "bg-[#1E2536]/95 text-white border-slate-700/60 shadow-slate-950/40"
          )}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
