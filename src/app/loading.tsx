import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="w-12 h-12 rounded-full bg-[#8FC2F0]/20 dark:bg-[#8FC2F0]/30 flex items-center justify-center animate-pulse">
        <svg
          width="28"
          height="28"
          viewBox="0 0 100 100"
          fill="none"
          className="animate-spin"
          style={{ animationDuration: '3s' }}
        >
          <path
            d="M 72 24 L 50 12 L 20 28 L 20 50"
            stroke="#8FC2F0"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 20 50 L 20 72 L 50 88 L 72 76"
            stroke="#292D32"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="58" cy="50" r="10" fill="#77CE69" />
        </svg>
      </div>
      <div className="text-xs font-bold text-slate-400 font-urbanist tracking-wider uppercase animate-pulse">
        Loading CRMate...
      </div>
    </div>
  );
}
