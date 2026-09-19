'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, ArrowRight } from 'lucide-react';
import { CRMateSymbol } from '@/components/brand/crmate-logo';
import { useLanguage } from '@/lib/i18n/language-context';

export default function NotFound() {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="crm-card p-8 sm:p-12 max-w-lg w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-[#8FC2F0]/15 dark:bg-[#8FC2F0]/25 flex items-center justify-center shadow-xs">
            <CRMateSymbol size={48} />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] border border-[#8FC2F0]/30 inline-block font-urbanist">
            404 Error &bull; الصفحة غير موجودة
          </span>
          <h1 className="text-3xl font-extrabold text-[#292D32] dark:text-white tracking-tight font-urbanist">
            {isRTL ? 'الصفحة غير متوفرة' : 'Page Not Found'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {isRTL 
              ? 'عذراً، الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله.' 
              : 'Sorry, the page you are looking for does not exist or has been moved.'}
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link
            href="/"
            className="crm-pill-dark inline-flex items-center gap-2 px-6 py-3 text-xs font-bold shadow-xs cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#8FC2F0]" />
            <span>{isRTL ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</span>
            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Link>
        </div>
      </div>
    </div>
  );
}
