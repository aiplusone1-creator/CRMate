'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Calendar, MessageCircle, Phone, Clock, ArrowRight, Plus, GripVertical, Bell, ShieldCheck } from 'lucide-react';
import { Project } from '@/types/crm';
import { PIPELINE_STAGES } from '@/lib/constants';
import { formatCurrencySAR, formatDateString, normalizePhoneNumber } from '@/lib/utils';
import { useCRM } from '@/lib/store/crm-context';

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
      className={`glass-card-interactive rounded-3xl p-5 group flex flex-col justify-between ${
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
              className="text-slate-300 group-hover:text-blue-500 transition-colors pt-1.5 -ml-1 cursor-grab active:cursor-grabbing shrink-0" 
              title="Drag and drop to change pipeline stage"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 font-extrabold text-sm flex items-center justify-center shrink-0 border border-blue-200/70 shadow-xs ring-2 ring-white">
            {initials}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <Link 
              href={`/projects/${project.id}`}
              draggable={false}
              className="text-sm font-extrabold text-slate-900 hover:text-blue-600 transition-colors block leading-snug break-words"
            >
              {project.name}
            </Link>
            <div className="text-xs text-slate-500 font-medium break-words mt-1 leading-normal">
              {project.company_name || 'Organization'}
            </div>
          </div>
        </div>

        {/* Estimated Value & PR Number Badge */}
        <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/70 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
              Estimated Value
            </span>
            <span className="text-base font-black text-slate-900 tracking-tight block">
              {formatCurrencySAR(project.estimated_value)}
            </span>
          </div>

          <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs shrink-0">
            {project.pr_number}
          </span>
        </div>

        {/* Stage Badge & Health Status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-xl border ${stageConfig?.badgeClass || 'bg-slate-100 text-slate-700'}`}>
            {stageConfig?.label || project.pipeline_stage}
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
              className={`text-[11px] font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all hover:scale-105 ${
                pendingRequest.urgency === 'urgent'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
              title="Click to view Approval Request details"
            >
              <span>⏳ Pending {pendingRequest.type === 'discount' && pendingRequest.payload?.discount_pct ? `Discount ${pendingRequest.payload.discount_pct}%` : pendingRequest.type.replace('_', ' ')}</span>
              {pendingRequest.urgency === 'urgent' && (
                <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Urgent</span>
              )}
            </button>
          )}

          {project.calculated_health === 'red' && (
            <span className="text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {project.days_overdue ? `${project.days_overdue}d late` : 'Needs Action'}
            </span>
          )}
          {project.calculated_health === 'yellow' && (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Due Soon
            </span>
          )}
          {project.calculated_health === 'green' && (
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Healthy
            </span>
          )}
        </div>

        {/* Next Action Snippet with Generous Padding & Full Wrap */}
        {project.next_action && (
          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-950 leading-relaxed break-words whitespace-normal shadow-2xs">
            <span className="font-extrabold text-amber-900 block text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>Next Action &bull; الإجراء القادم:</span>
            </span>
            <p className="font-semibold text-slate-800 break-words leading-relaxed text-xs">
              {project.next_action}
            </p>
          </div>
        )}
      </div>

      {/* Footer: Date & Location + Quick Action Buttons with clear spacing */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-medium flex-wrap">
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
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
          {project.primary_contact_phone && (
            <a
              href={`tel:${project.primary_contact_phone}`}
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-2xs"
              title="Call Contact"
            >
              <Phone className="w-4 h-4" />
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
            className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-2xs"
            title="Set Reminder"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              openRequestModal(project);
            }}
            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-2xs"
            title="Request Approval (Discount, Technical, etc.)"
          >
            <ShieldCheck className="w-4 h-4" />
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
            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white transition-all shadow-2xs"
            title="Fast Log Activity (<20s)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <Link
            href={`/projects/${project.id}`}
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-800 hover:text-white transition-all shadow-2xs"
            title="View Details"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
