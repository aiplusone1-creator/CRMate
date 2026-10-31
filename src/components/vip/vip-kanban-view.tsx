'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Building2, 
  Phone, 
  Mail, 
  Briefcase, 
  Trash2, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { VIPItem, VIPStatus, VIPPriority } from '@/types/crm';
import { useLanguage } from '@/lib/i18n/language-context';
import { formatTelUri } from '@/lib/utils';

interface VIPKanbanViewProps {
  items: VIPItem[];
  onOpenCompleteModal: (item: VIPItem) => void;
  onUpdateStatus: (id: string, nextStatus: VIPStatus) => void;
  onDelete: (id: string) => void;
}

export function VIPKanbanView({
  items,
  onOpenCompleteModal,
  onUpdateStatus,
  onDelete,
}: VIPKanbanViewProps) {
  const { isRTL } = useLanguage();

  const columns: { id: VIPStatus; titleAr: string; titleEn: string; icon: any; color: string }[] = [
    { id: 'pending', titleAr: 'قيد الانتظار', titleEn: 'Pending Follow-up', icon: Clock, color: 'border-amber-400 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { id: 'in_progress', titleAr: 'جاري التنسيق والمتابعة', titleEn: 'In Progress', icon: Sparkles, color: 'border-blue-400 bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { id: 'completed', titleAr: 'تم الإنجاز والتوثيق', titleEn: 'Completed', icon: CheckCircle2, color: 'border-emerald-400 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  ];

  const getPriorityBadge = (priority: VIPPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">🔴 {isRTL ? 'عاجل جداً' : 'Urgent'}</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">🟠 {isRTL ? 'مهم' : 'High'}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">🔵 {isRTL ? 'عادي' : 'Normal'}</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {columns.map(col => {
        const colItems = items.filter(i => i.status === col.id);
        const Icon = col.icon;

        return (
          <div 
            key={col.id} 
            className="flex flex-col rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-3.5 min-h-[550px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${col.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {isRTL ? col.titleAr : col.titleEn}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                {colItems.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
              {colItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                  <p>{isRTL ? 'لا توجد عناصر هنا' : 'No items'}</p>
                </div>
              ) : (
                colItems.map(item => {
                  const isCompleted = item.status === 'completed';
                  return (
                    <div
                      key={item.id}
                      className={`group relative p-4 rounded-xl border bg-white dark:bg-[#1A1F2B] transition-all hover:shadow-md ${
                        isCompleted 
                          ? 'border-emerald-200 dark:border-emerald-900/40 opacity-85'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Badges Bar */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.project_id ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                              🏷️ {isRTL ? 'Pipeline' : 'Pipeline'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              ✨ {isRTL ? 'استكشافي' : 'Standalone'}
                            </span>
                          )}

                          {item.source_note && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 truncate max-w-[120px]">
                              {item.source_note}
                            </span>
                          )}
                        </div>

                        {getPriorityBadge(item.priority)}
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug mb-1">
                        {item.title}
                      </h4>

                      {/* Company & Location info */}
                      <div className="space-y-1 mb-3 text-xs text-slate-600 dark:text-slate-400">
                        {item.company_name && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{item.company_name}</span>
                          </div>
                        )}
                        {item.location_name && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{item.location_name}</span>
                          </div>
                        )}
                        {item.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <a href={`tel:${formatTelUri(item.phone)}`} className="hover:underline text-blue-600 dark:text-blue-400 font-mono">
                              {item.phone}
                            </a>
                          </div>
                        )}
                        {item.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <a href={`mailto:${item.email}`} className="hover:underline text-blue-600 dark:text-blue-400 truncate">
                              {item.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Notes snippet */}
                      {item.notes && (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                          {item.notes}
                        </div>
                      )}

                      {/* Completed Summary if Done */}
                      {isCompleted && item.completion_notes && (
                        <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 mb-3">
                          <span className="font-bold">{isRTL ? 'ما تم إنجازه: ' : 'Outcome: '}</span>
                          <span>{item.completion_notes}</span>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 gap-2">
                        {!isCompleted ? (
                          <button
                            type="button"
                            onClick={() => onOpenCompleteModal(item)}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isRTL ? 'تم الإنجاز (Done)' : 'Done'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isRTL ? 'مكتمل ومسجل بالأنشطة' : 'Completed'}</span>
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          {/* Quick status cycle button */}
                          {item.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(item.id, 'in_progress')}
                              title={isRTL ? 'نقل إلى جاري المتابعة' : 'Move to in progress'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {item.status === 'in_progress' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(item.id, 'pending')}
                              title={isRTL ? 'إرجاع إلى قيد الانتظار' : 'Move back to pending'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا العنصر من قائمة VIP؟' : 'Are you sure you want to remove this VIP item?')) {
                                onDelete(item.id);
                              }
                            }}
                            title={isRTL ? 'حذف من قائمة VIP' : 'Delete'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
