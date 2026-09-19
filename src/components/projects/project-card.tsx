'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Calendar, MessageCircle, Phone, Clock, ArrowRight, Plus, GripVertical, Bell, ShieldCheck } from 'lucide-react';
import { Project } from '@/types/crm';
import { PIPELINE_STAGES } from '@/lib/constants';
import { formatCurrencySAR, formatDateString, normalizePhoneNumber } from '@/lib/utils';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';

interface ProjectCardProps {
  project: Project;
  onLogActivity?: (project: Project) => void;
  isDraggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function ProjectCard({ 
  project, 
  onLogActivity,
  isDraggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd
}: ProjectCardProps) {
  const { openFastLog, openReminder, requests, openRequestModal, openRequestDetail } = useCRM();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  const stageConfig = PIPELINE_STAGES.find(s => s.value === project.pipeline_stage);
  const pendingRequest = requests.find(r => r.project_id === project.id && r.status === 'pending');

  // Generate 2-letter initials
  const initials = project.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || 'PR';

  const cleanPhone = normalizePhoneNumber(project.primary_contact_phone);
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

  return (
    <div 
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`crm-card crm-card-interactive p-5 group flex flex-col justify-between ${
        isDragging 
          ? 'opacity-35 border-2 border-dashed border-[#8FC2F0] bg-white/40 shadow-none scale-[0.98]' 
          : ''
      } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="space-y-3.5">
        {/* Header: Drag Grip + Initials Avatar + Project Title + Company Name */}
        <div className="flex items-start gap-3">
          {isDraggable && (
            <div 
              className="text-slate-300 group-hover:text-[#8FC2F0] transition-colors pt-2 -ml-1 cursor-grab active:cursor-grabbing shrink-0" 
              title="Drag and drop to change pipeline stage"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          
          <div className="w-11 h-11 rounded-full bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] font-black text-sm flex items-center justify-center shrink-0 border border-[#8FC2F0]/30 shadow-xs font-urbanist">
            {initials}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <Link 
              href={`/projects/${project.id}`}
              draggable={false}
              className="text-sm font-extrabold text-[#292D32] dark:text-white hover:text-[#8FC2F0] dark:hover:text-[#8FC2F0] transition-colors block leading-snug break-words font-sans"
            >
              {project.name}
            </Link>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium break-words mt-0.5 leading-normal">
              {project.company_name || 'Organization'}
            </div>
          </div>
        </div>

        {/* Estimated Value & PR Number Badge */}
        <div className="crm-card-soft p-3 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5 font-urbanist">
              {t('estimatedValue')}
            </span>
            <span className="text-base font-extrabold text-[#292D32] dark:text-white tracking-tight block font-urbanist">
              {formatCurrencySAR(project.estimated_value)}
            </span>
          </div>

          <span className="text-xs font-urbanist font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#232A38] px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-700 shadow-2xs shrink-0">
            {project.pr_number}
          </span>
        </div>

        {/* Stage Badge & Health Status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${stageConfig?.badgeClass || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
            {isRTL ? stageConfig?.labelAr || stageConfig?.label : stageConfig?.label || project.pipeline_stage}
          </span>

          {pendingRequest && (
            <button
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openRequestDetail(pendingRequest.id);
              }}
              className={`text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all hover:scale-105 font-urbanist ${
                pendingRequest.urgency === 'urgent'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60'
              }`}
              title="Approval Request"
            >
              <span>⏳ {pendingRequest.type === 'discount' && pendingRequest.payload?.discount_pct ? `Discount ${pendingRequest.payload.discount_pct}%` : pendingRequest.type.replace('_', ' ')}</span>
              {pendingRequest.urgency === 'urgent' && (
                <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Urgent</span>
              )}
            </button>
          )}

          {project.calculated_health === 'red' && (
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5 shrink-0 font-urbanist">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {project.days_overdue ? `${project.days_overdue} ${t('daysLate')}` : t('urgentActionRequired')}
            </span>
          )}
          {project.calculated_health === 'yellow' && (
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/50 flex items-center gap-1.5 shrink-0 font-urbanist">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {t('dueSoon')}
            </span>
          )}
          {project.calculated_health === 'green' && (
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1.5 shrink-0 font-urbanist">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t('healthy')}
            </span>
          )}
        </div>

        {/* Next Action Snippet with Pure Localization */}
        {project.next_action && (
          <div className="crm-card-soft p-3 text-xs leading-relaxed break-words whitespace-normal">
            <span className="font-bold text-amber-600 dark:text-amber-400 block text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 font-urbanist">
              <span>{t('nextAction')}:</span>
            </span>
            <p className="font-medium text-slate-800 dark:text-slate-300 break-words leading-relaxed text-xs">
              {project.next_action}
            </p>
          </div>
        )}
      </div>

      {/* Footer: Date & Location + Quick Action Buttons with clear spacing */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium flex-wrap font-urbanist">
          <span className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDateString(project.next_follow_up_at || project.updated_at)}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{project.location}</span>
          </span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-xs"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          )}
          {project.primary_contact_phone && (
            <a
              href={`tel:${project.primary_contact_phone}`}
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-xs"
              title="Call Contact"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              openReminder({
                entity_type: 'project',
                entity_id: project.id,
                entity_name: project.name,
                project_id: project.id,
                project_name: project.name,
              });
            }}
            className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
            title="Set Reminder"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              openRequestModal(project);
            }}
            className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
            title="Request Approval (Discount, Technical, etc.)"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>
          <button
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              if (onLogActivity) {
                onLogActivity(project);
              } else {
                openFastLog({ project });
              }
            }}
            className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
            title="Fast Log Activity (<20s)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/projects/${project.id}`}
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#292D32] hover:text-white dark:hover:bg-white dark:hover:text-[#292D32] transition-all flex items-center justify-center shadow-xs cursor-pointer"
            title="View Details"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
