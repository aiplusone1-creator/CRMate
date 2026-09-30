'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authRepository } from '@/lib/repo/local/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    setMounted(true);
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
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const redirectTarget = searchParams?.get('redirect') || '/';
        router.replace(redirectTarget);
        setIsAuthorized(false);
      } else {
        // Authenticated user on protected page
        setIsAuthorized(true);
      }
    }
  }, [pathname, router]);

  if (!mounted || (!isAuthorized && pathname !== '/login')) {
    return (
      <div className="min-h-screen bg-[#EFF3F8] dark:bg-[#141820] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#8FC2F0] border-t-[#292D32] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}
