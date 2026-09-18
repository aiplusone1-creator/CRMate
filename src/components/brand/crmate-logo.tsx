import React from 'react';

interface CRMateSymbolProps {
  className?: string;
  size?: number;
  variant?: 'color' | 'monochrome' | 'white';
}

/**
 * Official CRMate Icon Symbol (Matching Brand Identity Guideline 1:1)
 * Hexagonal open C-bracket with Sky Blue (#8FC2F0), Charcoal (#292D32) and Vibrant Mint dot (#77CE69).
 */
export function CRMateSymbol({ 
  className = '', 
  size = 36, 
  variant = 'color' 
}: CRMateSymbolProps) {
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
          d="M 68 18 L 40 18 C 30 18 22 26 22 36 L 22 64 C 22 74 30 82 40 82 L 68 82"
          stroke="#FFFFFF"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="58" cy="50" r="11" fill="#FFFFFF" />
      </svg>
    );
  }

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
          d="M 68 18 L 40 18 C 30 18 22 26 22 36 L 22 64 C 22 74 30 82 40 82 L 68 82"
          stroke="#292D32"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="58" cy="50" r="11" fill="#292D32" />
      </svg>
    );
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Arm - Sky Blue */}
      <path
        d="M 68 18 L 40 18 C 30 18 22 26 22 36 L 22 45"
        stroke="#8FC2F0"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom Arm - Charcoal */}
      <path
        d="M 22 45 L 22 64 C 22 74 30 82 40 82 L 68 82"
        stroke="#292D32"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Growth Dot - Mint Green */}
      <circle cx="58" cy="50" r="11" fill="#77CE69" />
    </svg>
  );
}

/**
 * Official Full Horizontal Brand Logo (Symbol + Wordmark + Subtitle)
 */
export function CRMateHorizontalLogo({ 
  className = '', 
  symbolSize = 32,
  showSubtitle = true
}: { 
  className?: string; 
  symbolSize?: number;
  showSubtitle?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <CRMateSymbol size={symbolSize} />
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span className="font-urbanist font-black text-xl tracking-tight text-[#292D32]">
            CRM<span className="text-[#8FC2F0] font-bold">ate</span><span className="text-[#77CE69] text-2xl font-black ml-0.5 leading-none">.</span>
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[9px] font-urbanist font-extrabold uppercase tracking-[0.22em] text-[#292D32]/60 mt-0.5">
            Sales &amp; Pipeline CRM
          </span>
        )}
      </div>
    </div>
  );
}
