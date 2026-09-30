'use client';

import React, { useState } from 'react';
import { Quotation } from '@/types/crm';
import { 
  formatCompactSAR, 
  calculateDifference, 
  PriceDifference 
} from '@/lib/logic/quotation-pricing';
import { formatDateString, formatCurrencySAR } from '@/lib/utils';
import { TrendingDown, TrendingUp, Calendar, ArrowRight, ArrowDown } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface PriceHistoryChartProps {
  quotations: Quotation[];
  onSelectQuotation?: (q: Quotation) => void;
}

export function PriceHistoryChart({ quotations, onSelectQuotation }: PriceHistoryChartProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter out archived, sort ascending by version
  const activeQuotes = quotations
    .filter(q => !q.is_archived)
    .sort((a, b) => a.version - b.version);

  if (activeQuotes.length === 0) {
    return (
      <div className="py-8 px-4 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        {isRTL ? 'لا توجد عروض أسعار مسجلة لرسم مسار الأسعار بعد.' : 'No quotations recorded yet to trace price history.'}
      </div>
    );
  }

  // Pre-calculate differences for each step
  const trajectoryData = activeQuotes.map((q, idx) => {
    let diff: PriceDifference | null = null;
    if (idx > 0) {
      diff = calculateDifference(q.amount, activeQuotes[idx - 1].amount);
    }
    return {
      quote: q,
      diff,
    };
  });

  // If only 1 version exists: show clean single-point milestone
  if (activeQuotes.length === 1) {
    const single = activeQuotes[0];
    return (
      <div className="p-5 bg-gradient-to-br from-blue-50/60 to-slate-50 dark:from-blue-950/20 dark:to-slate-900/40 rounded-2xl border border-blue-100 dark:border-blue-900/40">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="font-extrabold text-slate-900 dark:text-white text-sm font-urbanist">
                {isRTL ? 'الإصدار المبدئي الأساسي' : 'Baseline Initial Submission'} &bull; V1
              </span>
              <span className="font-mono text-xs text-slate-500 font-bold px-2 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                {single.quotation_number}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isRTL 
                ? 'تم تسجيل العرض المبدئي. عند إضافة إصدارات معدلة، سيتم تتبع ورسم منحنى الأسعار ونسب الخصم تلقائياً هنا.'
                : 'Initial quotation recorded. As new revisions are created, CRMate will automatically trace price drops and discount trajectories here.'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider font-urbanist">
              {isRTL ? 'قيمة العرض المبدئي' : 'Initial Quotation Value'}
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-[#8FC2F0] font-urbanist">
              {formatCurrencySAR(single.amount)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- SVG Dimensions & Scaling for 2+ versions ---
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 60;
  const paddingY = 40;

  const amounts = activeQuotes.map(q => q.amount);
  const minAmt = Math.min(...amounts);
  const maxAmt = Math.max(...amounts);
  const range = maxAmt - minAmt || 1;

  // Add 15% breathing room on Y axis
  const yMin = Math.max(0, minAmt - range * 0.15);
  const yMax = maxAmt + range * 0.15;
  const yRange = yMax - yMin || 1;

  const points = activeQuotes.map((q, idx) => {
    const x = paddingX + (idx / (activeQuotes.length - 1)) * (svgWidth - paddingX * 2);
    // Invert Y so highest price is at top
    const y = svgHeight - paddingY - ((q.amount - yMin) / yRange) * (svgHeight - paddingY * 2);
    return { x, y, quote: q, idx };
  });

  // SVG path definitions
  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  // Fill area under path
  const areaD = `${pathD} L ${points[points.length - 1].x},${svgHeight - paddingY + 15} L ${points[0].x},${svgHeight - paddingY + 15} Z`;

  return (
    <div className="space-y-4">
      {/* 1. Step-by-Step Flow Badges (Prompt Section 13 Format: V1 -> V2 (-4.71%) -> V3 (-4.94%) -> V4 (-5.97%)) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {trajectoryData.map((item, idx) => {
          const isLatest = idx === trajectoryData.length - 1;
          const isHovered = hoveredIndex === idx;

          return (
            <React.Fragment key={item.quote.id}>
              {idx > 0 && (
                <ArrowRight className={`w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
              )}
              <div 
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectQuotation?.(item.quote)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  isLatest
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-2xs'
                    : isHovered
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded font-urbanist ${
                    isLatest 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    V{item.quote.version}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {formatDateString(item.quote.quotation_date || item.quote.sent_date || item.quote.created_at)}
                  </span>
                </div>

                <div className="font-black text-xs text-slate-900 dark:text-white font-urbanist">
                  {formatCompactSAR(item.quote.amount)}
                </div>

                {item.diff ? (
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <TrendingDown className="w-3 h-3" />
                    <span>{item.diff.formattedPercentage}</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {isRTL ? 'الأساس' : 'Base'}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 2. Interactive SVG Price Trajectory Chart */}
      <div className="relative bg-white dark:bg-[#1C2130] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 font-urbanist">
            <TrendingDown className="w-4 h-4 text-blue-600" />
            <span>{isRTL ? 'منحنى تدرج سعر العرض عبر الإصدارات (SAR)' : 'Quotation Price Trajectory across Revisions (SAR)'}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {activeQuotes.length} {isRTL ? 'إصدارات مسجلة' : 'Recorded Versions'}
          </span>
        </div>

        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full h-44 sm:h-52 overflow-visible select-none"
        >
          <defs>
            {/* Area gradient under line */}
            <linearGradient id="quotationChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8FC2F0" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#8FC2F0" stopOpacity="0.02" />
            </linearGradient>

            {/* Line gradient */}
            <linearGradient id="quotationLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8FC2F0" />
            </linearGradient>

            {/* Glowing filter for nodes */}
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background horizontal gridlines */}
          {[0.2, 0.5, 0.8].map((ratio, i) => {
            const y = paddingY + ratio * (svgHeight - paddingY * 2);
            const val = yMax - ratio * yRange;
            return (
              <g key={i}>
                <line 
                  x1={paddingX - 10} 
                  y1={y} 
                  x2={svgWidth - paddingX + 10} 
                  y2={y} 
                  stroke="currentColor" 
                  className="text-slate-100 dark:text-slate-800" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingX - 15} 
                  y={y + 3} 
                  textAnchor="end" 
                  className="text-[9px] fill-slate-400 dark:fill-slate-500 font-mono font-medium"
                >
                  {formatCompactSAR(val)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#quotationChartGradient)" />

          {/* Trajectory Stroke Line */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="url(#quotationLineGradient)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Step Percentage Badges between nodes */}
          {points.map((pt, idx) => {
            if (idx === 0) return null;
            const prevPt = points[idx - 1];
            const midX = (prevPt.x + pt.x) / 2;
            const midY = (prevPt.y + pt.y) / 2 - 12;
            const diff = calculateDifference(pt.quote.amount, prevPt.quote.amount);

            return (
              <g key={`badge-${idx}`}>
                <rect 
                  x={midX - 26} 
                  y={midY - 9} 
                  width="52" 
                  height="18" 
                  rx="9" 
                  className="fill-emerald-50 dark:fill-emerald-950/80 stroke-emerald-200 dark:stroke-emerald-800" 
                  strokeWidth="1"
                />
                <text 
                  x={midX} 
                  y={midY + 3.5} 
                  textAnchor="middle" 
                  className="text-[9px] font-black fill-emerald-700 dark:fill-emerald-300 font-urbanist"
                >
                  {diff.formattedPercentage}
                </text>
              </g>
            );
          })}

          {/* Nodes for each version */}
          {points.map((pt) => {
            const isHovered = hoveredIndex === pt.idx;
            const isLatest = pt.idx === points.length - 1;

            return (
              <g 
                key={pt.quote.id} 
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredIndex(pt.idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectQuotation?.(pt.quote)}
              >
                {/* Node halo ring */}
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={isHovered ? 11 : isLatest ? 8 : 6} 
                  className={
                    isLatest 
                      ? 'fill-blue-500/20 stroke-blue-500 stroke-2 animate-pulse' 
                      : isHovered 
                        ? 'fill-blue-500/30 stroke-blue-400 stroke-2' 
                        : 'fill-white dark:fill-slate-900 stroke-blue-500 stroke-2'
                  }
                />
                {/* Node center point */}
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={isLatest ? 4.5 : 3.5} 
                  className={isLatest ? 'fill-blue-600' : 'fill-blue-500'} 
                />

                {/* Node Label: Version & Price */}
                <text 
                  x={pt.x} 
                  y={pt.y - 14} 
                  textAnchor="middle" 
                  className={`text-[11px] font-black font-urbanist ${
                    isLatest 
                      ? 'fill-blue-600 dark:fill-[#8FC2F0]' 
                      : 'fill-slate-800 dark:fill-slate-200'
                  }`}
                >
                  V{pt.quote.version}
                </text>
                <text 
                  x={pt.x} 
                  y={svgHeight - paddingY + 12} 
                  textAnchor="middle" 
                  className="text-[10px] font-extrabold fill-slate-700 dark:fill-slate-300 font-urbanist"
                >
                  {formatCompactSAR(pt.quote.amount)}
                </text>
                <text 
                  x={pt.x} 
                  y={svgHeight - paddingY + 24} 
                  textAnchor="middle" 
                  className="text-[9px] fill-slate-400 dark:fill-slate-500 font-medium"
                >
                  {formatDateString(pt.quote.quotation_date || pt.quote.sent_date || pt.quote.created_at)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div 
            className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-3.5 py-2 rounded-xl text-xs shadow-xl backdrop-blur-md border border-slate-700 pointer-events-none z-20 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-100"
          >
            <div>
              <div className="font-mono text-[10px] text-blue-300 font-bold">
                {points[hoveredIndex].quote.quotation_number} &bull; V{points[hoveredIndex].quote.version}
              </div>
              <div className="font-extrabold text-sm font-urbanist">
                {formatCurrencySAR(points[hoveredIndex].quote.amount)}
              </div>
            </div>
            {points[hoveredIndex].quote.revision_reason && (
              <div className="border-l border-slate-700 pl-3 max-w-[200px]">
                <span className="text-[10px] text-slate-400 block">{isRTL ? 'السبب:' : 'Reason:'}</span>
                <span className="text-[11px] text-slate-200 line-clamp-2">
                  {points[hoveredIndex].quote.revision_reason}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
