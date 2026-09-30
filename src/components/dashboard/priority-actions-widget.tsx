'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  CheckCircle2, 
  Phone, 
  ArrowRight, 
  ArrowLeft,
  Briefcase, 
  Building2, 
  User, 
  Plus, 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  LayoutGrid, 
  List, 
  RotateCcw
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { formatCurrencySAR } from '@/lib/utils';
import { Project } from '@/types/crm';

export interface ActionableItem {
  id: string;
  type: 'overdue_action' | 'closing_soon' | 'stale_deal' | 'hot_lead';
  title: string;
  project?: Project;
  contactName?: string;
  phone?: string;
  badgeText: string;
  badgeColor: string;
  dueText: string;
  actionType: 'call' | 'visit' | 'log';
}

const ORDER_STORAGE_KEY = 'al_mespar_priority_actions_order';
const LAYOUT_STORAGE_KEY = 'al_mespar_priority_actions_layout';

interface PriorityActionsWidgetProps {
  cardSpan?: 4 | 6 | 8 | 12;
}

export function PriorityActionsWidget({ cardSpan = 12 }: PriorityActionsWidgetProps) {
  const { 
    currentUser, 
    projects, 
    activities, 
    openFastLog,
    selectedSalesFilter
  } = useCRM();
  const { isRTL } = useLanguage();

  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [customItemOrder, setCustomItemOrder] = useState<string[]>([]);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Scoped to current rep (or filtered user in manager mode)
  const scopedProjects = useMemo(() => {
    if (selectedSalesFilter && selectedSalesFilter !== 'all') {
      return projects.filter(p => p.owner_id === selectedSalesFilter);
    }
    if (currentUser.role === 'sales_engineer') {
      return projects.filter(p => p.owner_id === currentUser.id);
    }
    return projects;
  }, [projects, currentUser, selectedSalesFilter]);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  // Load saved preferences
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (savedLayout === 'grid' || savedLayout === 'list') {
        setLayoutMode(savedLayout);
      }
      const savedOrder = localStorage.getItem(ORDER_STORAGE_KEY);
      if (savedOrder) {
        setCustomItemOrder(JSON.parse(savedOrder));
      }
    } catch (e) {
      console.warn('Failed to load priority actions preferences', e);
    }
  }, []);

  const handleSetLayout = (mode: 'grid' | 'list') => {
    setLayoutMode(mode);
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to save layout', e);
    }
  };

  // Stale deals (active but no touch in >= 14 days)
  const staleDeals = useMemo(() => {
    return scopedProjects.filter(p => {
      if (['won', 'lost', 'hold'].includes(p.pipeline_stage)) return false;
      if (!p.updated_at) return true;
      const diffDays = Math.floor((today.getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 14;
    });
  }, [scopedProjects, today]);

  // Compute Raw Actionable Items
  const rawItems = useMemo(() => {
    const list: ActionableItem[] = [];

    // 1. Projects with next_follow_up_at due or overdue
    scopedProjects.forEach(p => {
      if (['won', 'lost', 'hold'].includes(p.pipeline_stage)) return;
      if (p.next_follow_up_at && p.next_follow_up_at <= todayStr) {
        list.push({
          id: `overdue_${p.id}`,
          type: 'overdue_action',
          title: p.next_action || (isRTL ? 'متابعة استحقاق المشروع' : 'Project Follow-up Due'),
          project: p,
          contactName: p.primary_contact_name,
          phone: p.primary_contact_phone,
          badgeText: isRTL ? 'إجراء مستحق' : 'Due Action',
          badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-900/60',
          dueText: p.next_follow_up_at === todayStr 
            ? (isRTL ? 'اليوم' : 'Today') 
            : (isRTL ? 'متأخر' : 'Overdue'),
          actionType: 'call'
        });
      }
    });

    // 2. High probability deals in final closing stages
    scopedProjects.forEach(p => {
      if (['negotiation', 'technically_approved'].includes(p.pipeline_stage) && (p.estimated_value || 0) > 100000) {
        if (!list.some(item => item.project?.id === p.id)) {
          list.push({
            id: `closing_${p.id}`,
            type: 'closing_soon',
            title: isRTL ? `إغلاق صفقة ${p.name}` : `Push to Close: ${p.name}`,
            project: p,
            contactName: p.primary_contact_name,
            phone: p.primary_contact_phone,
            badgeText: isRTL ? 'صفقة قابلة للحسم' : 'Ready to Close',
            badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60',
            dueText: formatCurrencySAR(p.estimated_value || 0),
            actionType: 'log'
          });
        }
      }
    });

    // 3. Stale high-value deals
    staleDeals.slice(0, 3).forEach(p => {
      if (!list.some(item => item.project?.id === p.id)) {
        list.push({
          id: `stale_${p.id}`,
          type: 'stale_deal',
          title: isRTL ? `إنعاش التواصل لمشروع ${p.name}` : `Re-engage Dormant Project: ${p.name}`,
          project: p,
          contactName: p.primary_contact_name,
          phone: p.primary_contact_phone,
          badgeText: isRTL ? 'تواصل راكد' : 'Stale Touch',
          badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
          dueText: isRTL ? 'لم يُحدث منذ أسبوعين' : '14+ days idle',
          actionType: 'call'
        });
      }
    });

    return list.slice(0, 12);
  }, [scopedProjects, todayStr, staleDeals, isRTL]);

  // Apply Custom Order
  const sortedItems = useMemo(() => {
    if (customItemOrder.length === 0) return rawItems;
    const itemMap = new Map(rawItems.map(item => [item.id, item]));
    const ordered: ActionableItem[] = [];

    // Add in saved order
    customItemOrder.forEach(id => {
      const itm = itemMap.get(id);
      if (itm) {
        ordered.push(itm);
        itemMap.delete(id);
      }
    });

    // Add any remaining new items
    itemMap.forEach(itm => ordered.push(itm));
    return ordered;
  }, [rawItems, customItemOrder]);

  const saveOrder = (newOrder: string[]) => {
    setCustomItemOrder(newOrder);
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(newOrder));
    } catch (e) {
      console.warn('Failed to save order', e);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedItems.length) return;
    const newItems = [...sortedItems];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    saveOrder(newItems.map(i => i.id));
  };

  const resetOrder = () => {
    setCustomItemOrder([]);
    try {
      localStorage.removeItem(ORDER_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear order', e);
    }
  };

  // Determine grid columns based on card width and layout mode
  const isSingleColumn = cardSpan <= 6 || layoutMode === 'list';
  const effectiveGridCols = isSingleColumn
    ? 'grid-cols-1'
    : 'grid-cols-1 md:grid-cols-2';

  return (
    <div className="crm-card p-6 sm:p-7 relative overflow-hidden font-urbanist h-full flex flex-col justify-between">
      <div>
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center font-bold border border-rose-200 dark:border-rose-900/50 shadow-2xs">
              <Zap className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-[#292D32] dark:text-white tracking-tight">
                  {isRTL ? 'ما يجب فعله اليوم (المهام ذات الأولوية)' : 'What To Do Today (Priority Actions)'}
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {sortedItems.length}
                </span>
                {sortedItems.length > 2 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#141820] text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800">
                    <span>{isRTL ? `يبان 2 من ${sortedItems.length}` : `2 of ${sortedItems.length} visible`}</span>
                    <span className="text-blue-500 dark:text-[#8FC2F0] font-black">• {isRTL ? 'مرر لرؤية الباقي' : 'Scroll for more'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {isRTL 
                  ? 'مهام حاسمة مرتبة بالأولوية مع إمكانية التمرير داخلياً لإظهار المهام التالية' 
                  : 'Actionable steps auto-ranked. Scroll internally to reveal subsequent priorities.'}
              </p>
            </div>
          </div>

          {/* Action & Layout Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {customItemOrder.length > 0 && (
              <button
                type="button"
                onClick={resetOrder}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                title={isRTL ? 'استعادة الترتيب التلقائي' : 'Reset to auto order'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isRTL ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            )}

            {/* Layout Toggle (Grid vs List) if width allows */}
            {cardSpan > 6 && (
              <div className="rounded-full bg-slate-100 dark:bg-slate-800/90 p-1 flex items-center border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => handleSetLayout('grid')}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    layoutMode === 'grid' 
                      ? 'bg-white dark:bg-[#1C2130] text-[#292D32] dark:text-white shadow-2xs' 
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title={isRTL ? 'عرض عمودين' : 'Grid (2 Columns)'}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSetLayout('list')}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    layoutMode === 'list' 
                      ? 'bg-white dark:bg-[#1C2130] text-[#292D32] dark:text-white shadow-2xs' 
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title={isRTL ? 'عرض قائمة مفصلة' : 'List (1 Column)'}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <Link
              href="/my-week"
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#292D32] dark:text-[#8FC2F0] bg-slate-100 dark:bg-[#1C2130] hover:bg-slate-200 dark:hover:bg-[#232A38] transition-all flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-800"
            >
              <span>{isRTL ? 'أسبوعي' : 'My Week'}</span>
              {isRTL ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
            </Link>
          </div>
        </div>

        {/* Empty State */}
        {sortedItems.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 dark:bg-[#141820]/40 rounded-2xl border border-slate-100 dark:border-slate-800 my-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isRTL ? 'أنت على المسار الصحيح تماماً!' : 'All Caught Up!'}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {isRTL ? 'لا توجد مشاريع متأخرة أو إجراءات عالقة لليوم.' : 'No overdue follow-ups or pending actions today.'}
            </p>
          </div>
        ) : (
          /* Reorderable Items Container with Internal Scroll for showing 2 items at a time */
          <div className="relative">
            <div 
              id="priority-actions-scroll-box"
              className={`overflow-y-auto pr-1.5 -mr-1.5 custom-scrollbar scroll-smooth transition-all ${
                isSingleColumn ? 'max-h-[445px]' : 'max-h-[445px] md:max-h-[225px]'
              }`}
            >
              <div className={`grid ${effectiveGridCols} gap-3.5`}>
                {sortedItems.map((item, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === sortedItems.length - 1;
                  const isBeingDragged = draggedItemId === item.id;

                  return (
                    <div
                      key={item.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id);
                    setDraggedItemId(item.id);
                  }}
                  onDragEnd={() => setDraggedItemId(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedId = e.dataTransfer.getData('text/plain') || draggedItemId;
                    if (droppedId && droppedId !== item.id) {
                      const fromIndex = sortedItems.findIndex(i => i.id === droppedId);
                      const toIndex = idx;
                      if (fromIndex >= 0) {
                        const reordered = [...sortedItems];
                        const [moved] = reordered.splice(fromIndex, 1);
                        reordered.splice(toIndex, 0, moved);
                        saveOrder(reordered.map(i => i.id));
                      }
                    }
                    setDraggedItemId(null);
                  }}
                  className={`crm-card-soft p-4 sm:p-5 transition-all flex flex-col justify-between gap-3 group relative border border-slate-200/90 dark:border-slate-700/80 hover:border-[#8FC2F0] dark:hover:border-[#8FC2F0]/60 hover:shadow-md rounded-[20px] ${
                    isBeingDragged ? 'opacity-35 scale-[0.98] border-dashed border-[#8FC2F0]' : ''
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Bar: Reorder Grip & Controls + Badge & Due Text */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Drag Grip Handle */}
                        <div 
                          className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-[#8FC2F0] cursor-grab active:cursor-grabbing transition-colors -ml-1"
                          title={isRTL ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        {/* Order Index Pill */}
                        <span className="w-5 h-5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-[#292D32] dark:text-slate-200 text-[10px] font-black flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>

                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                          {item.badgeText}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Up / Down Move Quick Buttons */}
                        <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => moveItem(idx, 'up')}
                            disabled={isFirst}
                            className={`p-1 rounded-md transition-colors ${
                              isFirst ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                            }`}
                            title={isRTL ? 'تقديم للأعلى' : 'Move Up'}
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(idx, 'down')}
                            disabled={isLast}
                            className={`p-1 rounded-md transition-colors ${
                              isLast ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                            }`}
                            title={isRTL ? 'تأخير للأسفل' : 'Move Down'}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-400 pl-1">
                          {item.dueText}
                        </span>
                      </div>
                    </div>

                    {/* Project Name & PR Number */}
                    {item.project && (
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#8FC2F0]/15 dark:bg-[#8FC2F0]/20 flex items-center justify-center text-[#292D32] dark:text-[#8FC2F0] shrink-0 mt-0.5 font-bold shadow-2xs">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700">
                              {item.project.pr_number}
                            </span>
                            <Link 
                              href={`/projects/${item.project.id}`}
                              className="text-sm font-black text-[#292D32] dark:text-white hover:text-blue-600 dark:hover:text-[#8FC2F0] transition-colors line-clamp-1 font-sans"
                              title={item.project.name}
                            >
                              {item.project.name}
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Description */}
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 bg-white/80 dark:bg-[#141820]/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-[#8FC2F0] shrink-0">
                        {isRTL ? 'الإجراء المطلوب:' : 'Action:'}
                      </span>
                      <span className="truncate">{item.title}</span>
                    </div>

                    {/* Company & Commercial Value */}
                    {item.project && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">
                            {item.project.company_name || (isRTL ? 'العميل' : 'Client')}
                          </span>
                        </div>
                        <span className="font-black text-xs text-[#292D32] dark:text-white shrink-0 font-urbanist">
                          {formatCurrencySAR(item.project.estimated_value || 0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Footer */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {item.contactName 
                          ? `${isRTL ? 'المسؤول:' : 'Contact:'} ${item.contactName}` 
                          : (isRTL ? 'جهة اتصال غير محددة' : 'No contact specified')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.phone && (
                        <a
                          href={`tel:${item.phone}`}
                          className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-2xs"
                          title={isRTL ? `اتصال بـ ${item.contactName || ''}` : `Call ${item.contactName || ''}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={() => openFastLog({ project: item.project || null })}
                        className="px-3.5 py-1.5 text-xs font-bold text-white dark:text-[#141820] bg-[#292D32] hover:bg-black dark:bg-[#8FC2F0] dark:hover:bg-[#7ab2e3] rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isRTL ? 'تسجيل النشاط' : 'Log Action'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
              </div>
            </div>

            {/* Scroll Navigation / Indicator when there are more than 2 items */}
            {sortedItems.length > 2 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-3 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-sans">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8FC2F0] animate-pulse" />
                  <span>
                    {isRTL 
                      ? `عرض 2 من أصل ${sortedItems.length} مهام • اسحب أو استخدم الأسهم للتمرير` 
                      : `2 of ${sortedItems.length} shown • Scroll or use arrows to view more`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('priority-actions-scroll-box');
                      if (el) el.scrollBy({ top: isSingleColumn ? -220 : -225, behavior: 'smooth' });
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    title={isRTL ? 'السابق للأعلى' : 'Scroll Up'}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('priority-actions-scroll-box');
                      if (el) el.scrollBy({ top: isSingleColumn ? 220 : 225, behavior: 'smooth' });
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    title={isRTL ? 'التالي للأسفل' : 'Scroll Down'}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
