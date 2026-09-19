'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { CRMateSymbol } from '@/components/brand/crmate-logo';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error('App Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="crm-card p-8 sm:p-12 max-w-lg w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-rose-500/15 dark:bg-rose-500/25 flex items-center justify-center shadow-xs">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
        </div>

        <div className="space-y-2 font-urbanist">
          <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 inline-block">
            System Notice &bull; تنبيه تقني
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292D32] dark:text-white tracking-tight">
            Something unexpected occurred
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            حدث خطأ غير متوقع أثناء معالجة الطلب. يمكنك محاولة إعادة التحميل أو العودة للوحة التحكم.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="crm-pill-dark inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 text-[#8FC2F0]" />
            <span>إعادة المحاولة &bull; Try Again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto"
          >
            <Home className="w-4 h-4" />
            <span>لوحة التحكم &bull; Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
