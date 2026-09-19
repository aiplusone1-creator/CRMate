'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/language-context';
import { useTheme } from '@/lib/theme/theme-context';

interface CRMateSymbolProps {
  className?: string;
  size?: number;
  variant?: 'color' | 'monochrome' | 'white' | 'auto';
}

/**
 * Official CRMate Brand Symbol
 * Flat Vector Geometry directly derived from official brand guide:
 *   - Hexagonal C-bracket chevron pointing left with uniform stroke & rounded corners
 *   - Upper wing / arm: Sky Blue (#8FC2F0)
 *   - Lower wing / arm: Sky Blue (#8FC2F0)
 *   - C-bracket chevron body: Charcoal (#292D32) in Light Mode / White (#FFFFFF) in Dark Mode
 *   - Center signature dot: Green (#77CE69)
 *   - Flat vector geometry: Zero artificial gradients, zero 3D effects, zero shadows.
 */
export function CRMateSymbol({
  className = '',
  size = 36,
  variant = 'auto',
}: CRMateSymbolProps) {
  const { isDark } = useTheme();

  // Pure White Monochrome (e.g. on dark badges, inversions)
  if (variant === 'white') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M 80 28 L 52 16 L 20 50 L 52 84 L 80 72"
          stroke="#FFFFFF"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="58" cy="50" r="9.5" fill="#FFFFFF" />
      </svg>
    );
  }

  // Pure Charcoal Monochrome (e.g. print, grayscale, subtle watermarks)
  if (variant === 'monochrome') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M 80 28 L 52 16 L 20 50 L 52 84 L 80 72"
          stroke="#292D32"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="58" cy="50" r="9.5" fill="#292D32" />
      </svg>
    );
  }

  // Official Full Color Flat Vector Symbol (Responsive to Light / Dark Mode)
  // Light Mode: Left C-body #292D32, Arms #8FC2F0, Dot #77CE69
  // Dark Mode: Left C-body #FFFFFF, Arms #8FC2F0, Dot #77CE69
  const chevronStroke = isDark ? '#FFFFFF' : '#292D32';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-colors duration-200 ${className}`}
    >
      {/* Top Accent Wing (Sky Blue) */}
      <path
        d="M 52 16 L 80 28"
        stroke="#8FC2F0"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom Accent Wing (Sky Blue) */}
      <path
        d="M 52 84 L 80 72"
        stroke="#8FC2F0"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* C-Bracket Chevron Body (Charcoal in Light / Pure White in Dark) */}
      <path
        d="M 52 16 L 20 50 L 52 84"
        stroke={chevronStroke}
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-200"
      />

      {/* Signature Center Dot (Green) */}
      <circle
        cx="58"
        cy="50"
        r="9.5"
        fill="#77CE69"
      />
    </svg>
  );
}

/**
 * Official Horizontal Brand Logo
 * Matches brand sheet Panel 01 & 02:
 * Flat Symbol + "CRMate." wordmark + letterspaced subtitle
 */
export function CRMateHorizontalLogo({
  className = '',
  symbolSize = 32,
  showSubtitle = true,
  theme,
}: {
  className?: string;
  symbolSize?: number;
  showSubtitle?: boolean;
  theme?: 'light' | 'dark';
}) {
  const { isDark: contextIsDark } = useTheme();
  const { isRTL } = useLanguage();
  const isDark = theme !== undefined ? theme === 'dark' : contextIsDark;

  return (
    <div dir="ltr" className={`flex items-center gap-3 select-none text-left ${className}`}>
      {/* Brand Flat Symbol */}
      <div className="shrink-0 flex items-center justify-center">
        <CRMateSymbol size={symbolSize} />
      </div>

      {/* Wordmark */}
      <div className="flex flex-col justify-center text-left" dir="ltr">
        <div className="flex items-baseline leading-none font-urbanist font-extrabold tracking-tight" dir="ltr">
          <span
            className={`text-2xl transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-[#292D32]'
            }`}
          >
            CRM
          </span>
          <span className="text-[#8FC2F0] text-2xl">
            ate
          </span>
          <span className="text-[#77CE69] text-3xl font-black ml-0.5 leading-none">
            .
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`text-[9px] font-bold uppercase tracking-[0.25em] mt-1 transition-colors duration-200 font-urbanist text-left ${
              isDark ? 'text-slate-400' : 'text-slate-400'
            }`}
          >
            {isRTL ? 'ذكاء المبيعات وإدارة الصفقات' : 'SALES & PIPELINE CRM'}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Centered Master Brand Lockup (Used in Splash / Login / Hero)
 */
export function CRMateMasterLockup({
  symbolSize = 58,
  className = '',
}: {
  symbolSize?: number;
  className?: string;
}) {
  const { isRTL } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* Symbol Card */}
      <div
        className={`relative w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 hover:scale-105 group ${
          isDark
            ? 'bg-[#1E2328] border border-[#8FC2F0]/20 shadow-[0_12px_32px_rgba(0,0,0,0.4)]'
            : 'bg-white border border-slate-200/80 shadow-[0_12px_32px_rgba(41,45,50,0.08)]'
        }`}
      >
        <CRMateSymbol size={symbolSize} />
      </div>

      {/* Wordmark */}
      <div dir="ltr" className="flex items-baseline justify-center leading-none font-urbanist font-black text-4xl sm:text-5xl tracking-tight">
        <span
          className={`transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-[#292D32]'
          }`}
        >
          CRM
        </span>
        <span className="text-[#8FC2F0]">
          ate
        </span>
        <span className="text-[#77CE69] text-5xl font-black ml-0.5 leading-none">
          .
        </span>
      </div>

      {/* Subtitle */}
      <span
        className={`text-[11px] font-extrabold uppercase tracking-[0.28em] mt-3 transition-colors duration-200 font-urbanist ${
          isDark ? 'text-slate-400' : 'text-slate-400'
        }`}
      >
        {isRTL ? 'نظام ذكاء المبيعات وإدارة الصفقات' : 'SALES & PIPELINE CRM'}
      </span>
      <span
        className={`text-xs font-semibold mt-1.5 transition-colors duration-200 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        {isRTL ? 'صفقات أسرع، نتائج أكبر، بجهد أقل' : 'High-Velocity Deals. Exceptional Growth.'}
      </span>
    </div>
  );
}
