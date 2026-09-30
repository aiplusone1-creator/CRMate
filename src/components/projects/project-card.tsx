'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, Calendar, MessageCircle, Phone, Clock, ArrowRight, Plus, 
  GripVertical, Bell, ShieldCheck, Palette, Check, FileCheck, 
  Layers, Tag, Target, AlertTriangle, UserCheck, X, Lock 
} from 'lucide-react';
import { Project, OpportunityType, RFQPackage, SubmittalStatus } from '@/types/crm';
import { PIPELINE_STAGES, PROJECT_CARD_COLORS } from '@/lib/constants';
import { formatCurrencySAR, formatDateString, normalizePhoneNumber } from '@/lib/utils';
import { formatCompactSAR } from '@/lib/logic/quotation-pricing';
import { getStageAgingInfo } from '@/lib/logic/pipeline-analytics';
import { useCRM } from '@/lib/store/crm-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { ContextualHelp } from '@/components/guide/contextual-help';

interface ProjectCardProps {
  project: Project;
  onLogActivity?: (project: Project) => void;
  isDraggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isReadOnlyForSalesRep?: boolean;
}

export function ProjectCard({ 
  project, 
  onLogActivity,
  isDraggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  isReadOnlyForSalesRep = false
}: ProjectCardProps) {
  const { 
    openFastLog, 
    openReminder, 
    requests, 
    openRequestModal, 
    openRequestDetail, 
    updateProject, 
    quotations,
    currentUser,
    teamMembers,
    referProject
  } = useCRM();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin';
  const isCurrentAssignee = project.referred_to_id ? project.referred_to_id === currentUser.id : project.owner_id === currentUser.id;
  const canRefer = isManager || isCurrentAssignee;
  const isLockedForSales = isReadOnlyForSalesRep || (!isManager && !isCurrentAssignee);

  const [isReferOpen, setIsReferOpen] = useState(false);
  const [isReferring, setIsReferring] = useState(false);
  const referRef = useRef<HTMLDivElement>(null);

  const salesReps = teamMembers.filter(m => m.role === 'sales_engineer' || (m.role as string) === 'sales_rep');
  const currentAssigneeId = project.referred_to_id || project.owner_id;

  const handleReferTo = async (targetUserId: string) => {
    if (!targetUserId || targetUserId === currentAssigneeId) return;
    setIsReferring(true);
    try {
      await referProject(project.id, targetUserId);
      setIsReferOpen(false);
    } finally {
      setIsReferring(false);
    }
  };

  const latestQuote = quotations
    ?.filter(q => q.project_id === project.id && !q.is_archived)
    ?.sort((a, b) => b.version - a.version)[0];

  // Effective card color based on pipeline stage:
  // - Won stage -> always emerald (Green)
  // - Lost stage -> always rose (Red)
  // - Any previous / active stage -> returns to original base color
  const effectiveColorId = React.useMemo(() => {
    if (project.pipeline_stage === 'won') return 'emerald';
    if (project.pipeline_stage === 'lost') return 'rose';
    if (project.card_color === 'emerald' || project.card_color === 'rose') {
      return project.base_card_color || 'default';
    }
    return project.card_color || project.base_card_color || 'default';
  }, [project.pipeline_stage, project.card_color, project.base_card_color]);

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [selectedColor, setSelectedColor] = useState(effectiveColorId);

  useEffect(() => {
    setSelectedColor(effectiveColorId);
  }, [effectiveColorId]);

  useEffect(() => {
    if (!isColorPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isColorPickerOpen]);

  useEffect(() => {
    if (!isReferOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (referRef.current && !referRef.current.contains(e.target as Node)) {
        setIsReferOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isReferOpen]);

  const handleSelectColor = async (colorId: string) => {
    setSelectedColor(colorId);
    setIsColorPickerOpen(false);
    if (project.pipeline_stage !== 'won' && project.pipeline_stage !== 'lost') {
      await updateProject(project.id, { card_color: colorId, base_card_color: colorId });
    } else {
      // In won/lost, save as base_card_color so when the project ever leaves won/lost, it restores to this chosen color
      await updateProject(project.id, { base_card_color: colorId });
    }
  };

  const handleToggleOpportunityType = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextType: OpportunityType = project.opportunity_type === 'in_hand' ? 'tender' : 'in_hand';
    await updateProject(project.id, { opportunity_type: nextType });
  };

  const handleTogglePackage = async (e: React.MouseEvent, pkg: RFQPackage) => {
    e.preventDefault();
    e.stopPropagation();
    await updateProject(project.id, { rfq_packages: pkg });
  };

  const handleSetSubmittalStatus = async (e: React.MouseEvent, status: SubmittalStatus) => {
    e.preventDefault();
    e.stopPropagation();
    await updateProject(project.id, { submittal_status: status });
  };

  // Quotation Sent: Calculate days since quotation was sent (entered this stage)
  const quotationDaysElapsed = React.useMemo(() => {
    const entered = new Date(project.stage_entered_at || project.updated_at || project.created_at).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((now - entered) / (1000 * 60 * 60 * 24)));
  }, [project.stage_entered_at, project.updated_at, project.created_at]);

  // Negotiation: Latest Discount Sent
  const discountDisplay = React.useMemo(() => {
    if (project.last_discount_pct !== undefined && project.last_discount_pct > 0) {
      const discountVal = (project.estimated_value * project.last_discount_pct) / 100;
      return `${project.last_discount_pct}% (${formatCompactSAR(discountVal)})`;
    }
    if (latestQuote && latestQuote.discount_percentage && latestQuote.discount_percentage > 0) {
      return `${latestQuote.discount_percentage}% (${formatCompactSAR(latestQuote.discount_amount || 0)})`;
    }
    return isRTL ? '8% (تلقائي)' : '8% (standard)';
  }, [project.last_discount_pct, project.estimated_value, latestQuote, isRTL]);

  // Negotiation: Client Target Price
  const targetPriceDisplay = React.useMemo(() => {
    if (project.client_target_price) {
      return formatCurrencySAR(project.client_target_price);
    }
    const fallback = Math.round(project.estimated_value * 0.92);
    return formatCurrencySAR(fallback);
  }, [project.client_target_price, project.estimated_value]);

  const currentColorConfig = PROJECT_CARD_COLORS.find(c => c.id === effectiveColorId) || PROJECT_CARD_COLORS[0];
  const stageConfig = PIPELINE_STAGES.find(s => s.value === project.pipeline_stage);
  const pendingRequest = requests.find(r => r.project_id === project.id && r.status === 'pending');
  const aging = getStageAgingInfo(project);

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
      className={`crm-kanban-card p-5 group flex flex-col justify-between transition-all duration-200 ${currentColorConfig?.cardClass || ''} ${
        isDragging 
          ? 'opacity-35 border-2 border-dashed border-[#8FC2F0] bg-white/40 shadow-none scale-[0.98]' 
          : ''
      } ${isDraggable && !isLockedForSales ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="space-y-3.5">
        {/* Header: Drag Grip + Initials Avatar + Project Title + Company Name + Color Picker */}
        <div className="flex items-start gap-3">
          {isDraggable && !isLockedForSales && (
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
            {isLockedForSales ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-extrabold text-[#292D32] dark:text-white leading-snug break-words font-sans">
                  {project.name}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
                  <Lock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                  <span>{isRTL ? 'للاطلاع فقط' : 'View only'}</span>
                </span>
              </div>
            ) : (
              <Link 
                href={`/projects/${project.id}`} 
                draggable={false}
                className="text-sm font-extrabold text-[#292D32] dark:text-white hover:text-[#8FC2F0] dark:hover:text-[#8FC2F0] transition-colors block leading-snug break-words font-sans"
              >
                {project.name}
              </Link>
            )}
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium break-words mt-0.5 leading-normal">
              {project.company_name || 'Organization'}
            </div>

            {/* Owner & Referred To (exact same font & style as requested) */}
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium break-words mt-1 leading-normal font-sans space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'المالك:' : 'Owner:'}</span>
                <span className="text-slate-800 dark:text-slate-200">{project.owner_name || 'Eslam Mohandes'}</span>
              </div>
              {project.referred_to_name && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-blue-600 dark:text-[#8FC2F0]">{isRTL ? 'محال إلى:' : 'Referred To:'}</span>
                  <span className="text-blue-700 dark:text-blue-300 font-bold">{project.referred_to_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            {/* Refer Project Dropdown (Manager or Current Assignee) */}
            {!isLockedForSales && canRefer && (
              <div className="relative" ref={referRef}>
                <button
                  type="button"
                  draggable={false}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsReferOpen(!isReferOpen);
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isReferOpen 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-blue-600 dark:hover:text-[#8FC2F0] hover:bg-blue-50 dark:hover:bg-blue-950/40 opacity-70 group-hover:opacity-100'
                  }`}
                  title={isRTL ? "إحالة المشروع لمهندس آخر (Refer)" : "Refer Project to another sales rep"}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </button>

                {/* Floating Refer Dropdown Menu */}
                {isReferOpen && (
                  <div 
                    className={`absolute z-40 top-8 ${isRTL ? 'left-0' : 'right-0'} w-64 bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-3 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-[#8FC2F0]" />
                        <span>{isRTL ? 'إحالة المشروع (Refer)' : 'Refer Project'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsReferOpen(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">
                      {isRTL 
                        ? 'اختر مهندس المبيعات لنقل متابعة المشروع إليه (سيبقى المالك الأصلي كما هو):' 
                        : 'Select sales engineer to assign project follow-up (Original creator stays untouched):'}
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {salesReps.map(rep => {
                        const isCurrent = rep.id === currentAssigneeId;
                        return (
                          <button
                            key={rep.id}
                            type="button"
                            disabled={isCurrent || isReferring}
                            onClick={() => handleReferTo(rep.id)}
                            className={`w-full text-left rtl:text-right px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                              isCurrent 
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                : 'hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 cursor-pointer font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {rep.full_name?.charAt(0) || 'S'}
                              </span>
                              <span className="truncate">{rep.full_name}</span>
                            </div>
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-slate-400 shrink-0">
                                {isRTL ? 'الحالي' : 'Current'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Exterior Color Chooser */}
            {!isLockedForSales && (
              <div className="relative" ref={colorPickerRef}>
                <button
                  type="button"
                  draggable={false}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsColorPickerOpen(!isColorPickerOpen);
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all opacity-70 group-hover:opacity-100 cursor-pointer"
                  title={isRTL ? "تغيير لون كارت المشروع" : "Change card color"}
                >
                  <Palette className="w-3.5 h-3.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 transition-colors" />
                </button>

                {/* Floating Color Palette */}
                {isColorPickerOpen && (
                  <div 
                    className={`absolute z-30 top-8 ${isRTL ? 'left-0' : 'right-0'} bg-white dark:bg-[#1E2536] border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl p-2 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {PROJECT_CARD_COLORS.map(c => {
                      const isSelected = selectedColor === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectColor(c.id);
                          }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-115 cursor-pointer relative border ${c.dotClass} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900 scale-110' : 'hover:opacity-90'}`}
                          title={isRTL ? c.nameAr : c.name}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white drop-shadow-xs stroke-[3]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Estimated Value & Latest Quotation (Rule 19) & PR Number */}
        <div className="crm-card-soft p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5 font-urbanist">
                {t('estimatedValue')}
              </span>
              {!isLockedForSales ? (
                <span className="text-base font-extrabold text-[#292D32] dark:text-white tracking-tight block font-urbanist">
                  {formatCurrencySAR(project.estimated_value)}
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-tight flex items-center gap-1 font-urbanist py-0.5">
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>{isRTL ? 'القيمة محجوبة للمالك' : 'Value Hidden (Owner Only)'}</span>
                </span>
              )}
            </div>

            <span className="text-xs font-urbanist font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#232A38] px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-700 shadow-2xs shrink-0">
              {project.pr_number}
            </span>
          </div>

          {!isLockedForSales && latestQuote && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-urbanist">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-[#8FC2F0] flex items-center gap-1.5">
                <span>{isRTL ? 'أحدث عرض سعر:' : 'Latest Quote:'}</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-[9px] font-black">
                  V{latestQuote.version}
                </span>
              </span>
              <span className="font-black text-blue-700 dark:text-blue-300">
                {formatCompactSAR(latestQuote.amount)}
              </span>
            </div>
          )}
        </div>

        {/* Stage Badge & Stage Aging & Health Status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {!isLockedForSales ? (
              <>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${stageConfig?.badgeClass || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                  {isRTL ? stageConfig?.labelAr || stageConfig?.label : stageConfig?.label || project.pipeline_stage}
                </span>

                {project.pipeline_stage !== 'won' && project.pipeline_stage !== 'lost' && (
                  <span 
                    className={`text-[10px] px-2.5 py-0.5 rounded-full border flex items-center gap-1 font-urbanist ${aging.badgeClass}`}
                    title={isRTL ? `المشروع في هذه المرحلة منذ ${aging.daysInStage} يوماً (الحد المعياري للمرحلة: ${aging.slaDays} يوم)` : `Project in this stage for ${aging.daysInStage} days (Target SLA: ${aging.slaDays}d)`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{isRTL ? aging.labelAr : aging.labelEn}</span>
                  </span>
                )}
              </>
            ) : (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 flex items-center gap-1 font-urbanist">
                <Lock className="w-3 h-3 text-amber-500" />
                <span>{isRTL ? 'المرحلة محجوبة للمالك' : 'Stage Hidden'}</span>
              </span>
            )}
          </div>

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

        {/* Internal Commercial Details (Hidden for Unauthorized Sales Reps) */}
        {!isLockedForSales && (
          <>
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

        {/* Stage 2: RFQ Processing - Packages Being Priced (LC, BMS, or Both) */}
        {(project.pipeline_stage === 'rfq_processing' || (project.pipeline_stage as string) === 'pricing') && (
          <div className="p-2.5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/90 dark:border-sky-800/60 text-xs space-y-2 font-urbanist">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>{isRTL ? 'حزم وأنظمة التسعير (Pre-Sales):' : 'Pricing Packages:'}</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {isRTL ? 'اضغط للتبديل' : 'Click to select'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'lc', label: 'LC', sub: isRTL ? 'تيارات خفيفة' : 'Light Current', icon: '⚡' },
                { id: 'bms', label: 'BMS', sub: isRTL ? 'إدارة مباني' : 'Automation', icon: '🏢' },
                { id: 'both', label: 'LC + BMS', sub: isRTL ? 'كلا النظامين' : 'Combined', icon: '⚡🏢' },
              ].map(pkg => {
                const isSelected = (project.rfq_packages || 'both') === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleTogglePackage(e, pkg.id as RFQPackage)}
                    className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 font-black shadow-xs scale-[1.02]'
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700'
                    }`}
                    title={pkg.sub}
                  >
                    <div className="text-[11px] font-black leading-tight flex items-center justify-center gap-1">
                      <span>{pkg.icon}</span>
                      <span>{pkg.label}</span>
                    </div>
                    <div className={`text-[8px] truncate mt-0.5 ${isSelected ? 'text-sky-100 font-bold' : 'text-slate-400'}`}>
                      {pkg.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage 3: Quotation Sent - Follow-up Days Tracker (Alerts at 3, 7, 10 days) */}
        {project.pipeline_stage === 'quotation_sent' && (
          <div className={`p-2.5 rounded-2xl border text-xs space-y-1.5 font-urbanist transition-all ${
            quotationDaysElapsed >= 10
              ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
              : quotationDaysElapsed >= 7
              ? 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800'
              : quotationDaysElapsed >= 3
              ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
              : 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200/90 dark:border-blue-800'
          }`}>
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                quotationDaysElapsed >= 10 
                  ? 'text-rose-700 dark:text-rose-300' 
                  : quotationDaysElapsed >= 7 
                  ? 'text-orange-700 dark:text-orange-300' 
                  : quotationDaysElapsed >= 3 
                  ? 'text-amber-800 dark:text-amber-300' 
                  : 'text-blue-800 dark:text-blue-300'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{isRTL ? 'متابعة العرض والتواصل:' : 'Quote Follow-up Age:'}</span>
              </span>

              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono shadow-2xs ${
                quotationDaysElapsed >= 10
                  ? 'bg-rose-600 text-white animate-pulse'
                  : quotationDaysElapsed >= 7
                  ? 'bg-orange-600 text-white'
                  : quotationDaysElapsed >= 3
                  ? 'bg-amber-500 text-white'
                  : 'bg-blue-600 text-white'
              }`}>
                ⏱️ {quotationDaysElapsed} {isRTL ? (quotationDaysElapsed === 1 ? 'يوم مضى' : quotationDaysElapsed === 2 ? 'يومان' : 'أيام مضت') : (quotationDaysElapsed === 1 ? 'day ago' : 'days ago')}
              </span>
            </div>

            <div className={`text-[11px] font-bold leading-snug flex items-center gap-1.5 ${
              quotationDaysElapsed >= 10 
                ? 'text-rose-900 dark:text-rose-200' 
                : quotationDaysElapsed >= 7 
                ? 'text-orange-950 dark:text-orange-200' 
                : quotationDaysElapsed >= 3 
                ? 'text-amber-950 dark:text-amber-200' 
                : 'text-blue-950 dark:text-blue-200'
            }`}>
              {quotationDaysElapsed >= 10 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-bounce" />
                  <span>{isRTL ? '🚨 تنبيه حرج (10+ أيام): تواصل عاجل مع المشتريات لحسم الترسية!' : '🚨 Critical (10+ days): Urgent client contact needed!'}</span>
                </>
              ) : quotationDaysElapsed >= 7 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>{isRTL ? '⚡ تنبيه ثانٍ (7 أيام): ينصح بجدولة اتصال فوري لمناقشة العرض.' : '⚡ Warning (7 days): Follow up to review quote feedback.'}</span>
                </>
              ) : quotationDaysElapsed >= 3 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{isRTL ? '⚠️ تنبيه أول (3 أيام): يرجى تأكيد استلام العميل للمواصفات والأسعار.' : '⚠️ Alert (3 days): Verify customer quote receipt.'}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{isRTL ? 'العرض مرسل حديثاً - في الموعد المخطط للمتابعة.' : 'Recently submitted - within normal follow-up SLA.'}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Stage 4: Technical Submittal - Status Tracking */}
        {project.pipeline_stage === 'technical_submission' && (
          <div className="p-2.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/90 dark:border-purple-800/60 text-xs space-y-2 font-urbanist">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{isRTL ? 'حالة الاعتماد الفني (Submittal):' : 'Submittal Approval Status:'}</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {isRTL ? 'اضغط لتحديث الحالة' : 'Click to update'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {[
                { id: 'under_approval', label: isRTL ? 'قيد الاعتماد' : 'Under Approval', color: 'bg-amber-500 text-white border-amber-600' },
                { id: 'approved', label: isRTL ? 'معتمد (Approved)' : 'Approved', color: 'bg-emerald-600 text-white border-emerald-600' },
                { id: 'approved_with_comments', label: isRTL ? 'معتمد بملاحظات' : 'Appr. w/ Comments', color: 'bg-blue-600 text-white border-blue-600' },
                { id: 'rejected', label: isRTL ? 'مرفوض (Rejected)' : 'Rejected', color: 'bg-rose-600 text-white border-rose-600' },
              ].map(item => {
                const isCurrent = (project.submittal_status || 'under_approval') === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleSetSubmittalStatus(e, item.id as SubmittalStatus)}
                    className={`py-1 px-2 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isCurrent
                        ? `${item.color} font-black shadow-xs ring-2 ring-purple-400/50 scale-[1.02]`
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {isCurrent && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage 5: Negotiation - Technically Approved + Latest Discount + Target Price */}
        {(project.pipeline_stage === 'negotiation' || (project.pipeline_stage as string) === 'technically_approved') && (
          <div className="p-2.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 text-xs space-y-2 font-urbanist">
            {/* Guarantee Badge: Technical Approved */}
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="inline-flex items-center gap-1 font-black text-[10px] px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isRTL ? 'معتمد فنياً (Technical Approved) ✅' : 'Technical Approved ✅'}</span>
              </span>
              <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                {isRTL ? 'التفاوض المالي النهائي' : 'Final Commercial Negotiation'}
              </span>
            </div>

            {/* Outside Card Metrics: Latest Discount & Client Target Price */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-amber-200/70 dark:border-amber-900/40 space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5 text-rose-500" />
                  <span>{isRTL ? 'آخر خصم مرسل:' : 'Latest Discount:'}</span>
                </span>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400 block font-mono">
                  {discountDisplay}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-amber-200/70 dark:border-amber-900/40 space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-2.5 h-2.5 text-emerald-500" />
                  <span>{isRTL ? 'السعر المستهدف:' : 'Target Price:'}</span>
                </span>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 block font-mono">
                  {targetPriceDisplay}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Deal Lost Reason Display */}
        {project.pipeline_stage === 'lost' && project.lost_reason && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs leading-relaxed">
            <span className="font-bold text-rose-700 dark:text-rose-400 block text-[10px] uppercase tracking-wider mb-0.5 flex items-center gap-1 font-urbanist">
              <span>{isRTL ? 'سبب الخسارة' : 'Lost Reason'}:</span>
            </span>
            <p className="font-medium text-rose-900 dark:text-rose-200 text-xs line-clamp-2">
              {project.lost_reason}
            </p>
          </div>
        )}

        {/* Won Stage: PO & Cash Collection Summary Block */}
        {(project.pipeline_stage === 'won' || project.po_attachment_url || (project.collected_percentage || 0) > 0) && (
          <div className="p-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/60 text-xs space-y-2 font-urbanist">
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              {/* PO Status Badge */}
              {project.po_attachment_url || project.po_number ? (
                <span className="inline-flex items-center gap-1 font-mono font-bold text-[10px] px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                  <FileCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate max-w-[110px]">{project.po_number || (isRTL ? 'تم إرفاق الـ PO' : 'PO Attached')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>{isRTL ? 'بانتظار رفع الـ PO' : 'Awaiting PO'}</span>
                </span>
              )}

              {/* Collection Percentage Badge */}
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono ${
                (project.collected_percentage || 0) >= 100
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : (project.collected_percentage || 0) > 0
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                💰 {project.collected_percentage || 0}% {isRTL ? 'محصل' : 'Collected'}
              </span>
            </div>

            {/* Collection Progress Mini-Bar */}
            <div className="w-full h-1.5 bg-emerald-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  (project.collected_percentage || 0) >= 100
                    ? 'bg-emerald-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.max(4, project.collected_percentage || 0)}%` }}
              />
            </div>

            {/* Collected vs Total SAR */}
            <div className="flex items-center justify-between text-[10px] text-emerald-950 dark:text-emerald-200 font-bold">
              <span>{isRTL ? 'محصل:' : 'Collected:'} {formatCompactSAR(project.collected_amount || 0)}</span>
              <span className="text-slate-500 dark:text-slate-400 font-normal">
                {isRTL ? 'من إجمالي' : 'of'} {formatCompactSAR(project.po_amount || project.estimated_value || 0)}
              </span>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Footer: Opportunity Type (Tender / In Hand) + Date & Location + Quick Action Buttons */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium flex-wrap font-urbanist">
          {/* Opportunity Type Badge: Tender vs In Hand */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isLockedForSales}
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleToggleOpportunityType}
              title={isLockedForSales ? undefined : (isRTL ? "نوع المشروع (اضغط للتبديل السريع بين Tender و In Hand)" : "Opportunity Type (Click to quick-toggle Tender / In Hand)")}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-2xs transition-all ${
                isLockedForSales ? 'cursor-default opacity-85' : 'hover:scale-105 cursor-pointer'
              } ${
                project.opportunity_type === 'in_hand'
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                project.opportunity_type === 'in_hand' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'
              }`} />
              <span>
                {project.opportunity_type === 'in_hand' 
                  ? (isRTL ? 'In Hand (في اليد)' : 'In Hand') 
                  : (isRTL ? 'Tender (مناقصة)' : 'Tender')}
              </span>
            </button>
            <ContextualHelp
              title={project.opportunity_type === 'in_hand' ? (isRTL ? 'مشروع In Hand (في اليد)' : 'In Hand Project') : (isRTL ? 'مشروع Tender (مناقصة)' : 'Tender Project')}
              description={project.opportunity_type === 'in_hand'
                ? (isRTL ? 'مشروع مباشر تم التوافق عليه مع المقاول أو المالك ولديه احتمالية ترسية عالية جداً.' : 'Directly negotiated project with high closing confidence.')
                : (isRTL ? 'منافسة أو عطاء مفتوح بين مقاولين متعددين يتطلب تسعيراً تنافسياً ومتابعة دقيقة.' : 'Competitive tender or RFP requiring quotation benchmark analysis.')
              }
              tip={isRTL ? 'اضغط على الشارة للتبديل السريع بين Tender و In Hand دون الحاجة لفتح شاشة التعديل.' : 'Click the badge directly to quick-toggle between Tender and In Hand.'}
              moduleId="projects"
              size="xs"
            />
          </div>

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
        <div className="flex items-center gap-1.5 shrink-0 ml-auto flex-wrap">
          {isLockedForSales ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800/60 font-urbanist shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-[11px]">
                {isRTL 
                  ? `مسند للمهندس: ${project.referred_to_name || project.owner_name} (للاطلاع فقط)` 
                  : `Assigned to: ${project.referred_to_name || project.owner_name} (View only)`}
              </span>
            </div>
          ) : (
            <>
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
              {canRefer && (
                <button
                  draggable={false}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsReferOpen(true);
                  }}
                  className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8FC2F0] hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                  title={isRTL ? "إحالة المشروع لمهندس آخر (Refer)" : "Refer Project to another sales rep"}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <Link
                href={`/projects/${project.id}`}
                draggable={false}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#292D32] hover:text-white dark:hover:bg-white dark:hover:text-[#292D32] transition-all flex items-center justify-center shadow-xs cursor-pointer"
                title="View Details"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
