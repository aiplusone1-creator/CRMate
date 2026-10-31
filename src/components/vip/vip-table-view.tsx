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
  ArrowUpDown
} from 'lucide-react';
import { VIPItem, VIPStatus, VIPPriority } from '@/types/crm';
import { useLanguage } from '@/lib/i18n/language-context';
import { formatTelUri } from '@/lib/utils';

interface VIPTableViewProps {
  items: VIPItem[];
  onOpenCompleteModal: (item: VIPItem) => void;
  onUpdateStatus: (id: string, nextStatus: VIPStatus) => void;
  onDelete: (id: string) => void;
}

export function VIPTableView({
  items,
  onOpenCompleteModal,
  onUpdateStatus,
  onDelete,
}: VIPTableViewProps) {
  const { isRTL } = useLanguage();

  const getPriorityBadge = (priority: VIPPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">🔴 {isRTL ? 'عاجل' : 'Urgent'}</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">🟠 {isRTL ? 'مهم' : 'High'}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">🔵 {isRTL ? 'عادي' : 'Normal'}</span>;
    }
  };

  const getStatusBadge = (status: VIPStatus) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"><CheckCircle2 className="w-3 h-3" /> {isRTL ? 'مكتمل' : 'Done'}</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"><Sparkles className="w-3 h-3" /> {isRTL ? 'متابعة' : 'In Progress'}</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"><Clock className="w-3 h-3" /> {isRTL ? 'انتظار' : 'Pending'}</span>;
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#1A1F2B] border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
        <p>{isRTL ? 'لا توجد عناصر مطابقة في هذا العرض' : 'No matching VIP items found'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#1A1F2B] shadow-sm" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
            <tr>
              <th className="py-3 px-4">{isRTL ? 'الحالة' : 'Status'}</th>
              <th className="py-3 px-4">{isRTL ? 'الاسم / الهدف' : 'Title / Target'}</th>
              <th className="py-3 px-4">{isRTL ? 'النوع والمصدر' : 'Type & Source'}</th>
              <th className="py-3 px-4">{isRTL ? 'الشركة / الموقع' : 'Company / Location'}</th>
              <th className="py-3 px-4">{isRTL ? 'بيانات الاتصال' : 'Contact Details'}</th>
              <th className="py-3 px-4">{isRTL ? 'الأولوية' : 'Priority'}</th>
              <th className="py-3 px-4">{isRTL ? 'الملاحظات' : 'Notes'}</th>
              <th className="py-3 px-4 text-center">{isRTL ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {items.map(item => {
              const isCompleted = item.status === 'completed';
              return (
                <tr 
                  key={item.id} 
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                    isCompleted ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''
                  }`}
                >
                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>

                  {/* Title & Category icon */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                        {item.category === 'revisit_project' ? <Briefcase className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {item.title}
                        </div>
                        {item.created_at && (
                          <div className="text-[10px] text-slate-400">
                            {new Date(item.created_at).toLocaleDateString('en-GB')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type & Source */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      {item.project_id ? (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          🏷️ {isRTL ? 'مشروع مسجل' : 'Pipeline Project'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          ✨ {isRTL ? 'رصد استكشافي' : 'Standalone'}
                        </span>
                      )}
                      {item.source_note && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {item.source_note}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Company & Location */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      {item.company_name && (
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.company_name}</span>
                        </div>
                      )}
                      {item.location_name && (
                        <div className="flex items-center gap-1 text-slate-500 text-[11px] truncate max-w-[150px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location_name}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Phone & Email */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="space-y-0.5">
                      {item.phone && (
                        <div>
                          <a href={`tel:${formatTelUri(item.phone)}`} className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-[11px]">
                            {item.phone}
                          </a>
                        </div>
                      )}
                      {item.email && (
                        <div>
                          <a href={`mailto:${item.email}`} className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] truncate max-w-[140px] block">
                            {item.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getPriorityBadge(item.priority)}
                  </td>

                  {/* Notes / Completion */}
                  <td className="py-3 px-4 max-w-[180px]">
                    {isCompleted && item.completion_notes ? (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium truncate" title={item.completion_notes}>
                        <span className="font-bold">{isRTL ? 'تم: ' : 'Done: '}</span>
                        {item.completion_notes}
                      </div>
                    ) : item.notes ? (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate" title={item.notes}>
                        {item.notes}
                      </div>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {!isCompleted ? (
                        <button
                          type="button"
                          onClick={() => onOpenCompleteModal(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isRTL ? 'إنجاز' : 'Done'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
                          ✓ {isRTL ? 'مكتمل' : 'Done'}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا العنصر من قائمة VIP؟' : 'Delete this VIP item?')) {
                            onDelete(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title={isRTL ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
