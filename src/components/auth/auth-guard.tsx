'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { authRepository } from '@/lib/repo/local/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Client-side session verification
    const session = authRepository.getSession();
    const isLoginPage = pathname === '/login';

    if (!session) {
      if (!isLoginPage) {
        // Unauthenticated access to protected route
        const redirectParam = encodeURIComponent(pathname);
        router.replace(`/login?redirect=${redirectParam}`);
        setIsAuthorized(false);
      } else {
        // Normal visit to login page
        setIsAuthorized(true);
      }
    } else {
      // Active valid session exists
      if (isLoginPage) {
        // Authenticated user visits login page -> redirect to target or home
        const redirectTarget = searchParams.get('redirect') || '/';
        router.replace(redirectTarget);
        setIsAuthorized(false);
      } else {
        // Authenticated user on protected page
        setIsAuthorized(true);
      }
    }

    setIsChecking(false);
  }, [pathname, router, searchParams]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#EFF3F8] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-[#8FC2F0] border-t-[#292D32] animate-spin" />
          <div className="flex items-center gap-1.5 font-urbanist font-black text-sm text-[#292D32]">
            <span>CRM<span className="text-[#8FC2F0]">ate</span></span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">&bull; Verifying Session</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized && pathname !== '/login') {
    return null; // Redirect in flight
  }

  return (
    <>
      {children}
    </>
  );
}
