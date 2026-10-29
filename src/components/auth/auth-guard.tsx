'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authRepository } from '@/lib/repo/local/auth';
import { createClient } from '@/lib/supabase/client';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    setMounted(true);
    let isCancelled = false;

    async function checkAuth() {
      const isLoginPage = pathname === '/login';
      const isChangePasswordPage = pathname === '/change-password';

      // 1. Check Supabase Auth session first if configured
      const supabase = createClient();
      let supaUser = null;
      if (supabase) {
        try {
          const { data } = await supabase.auth.getUser();
          supaUser = data?.user || null;
        } catch {
          supaUser = null;
        }
      }

      const isPasswordChangeRequired = 
        Boolean(supaUser) && 
        (supaUser?.app_metadata?.must_change_password === true || supaUser?.user_metadata?.must_change_password === true);

      // Handle /login page specifically:
      // - If authenticated via Supabase, redirect to destination or /change-password
      // - If NOT authenticated, stay on /login (never redirect to / based on legacy localStorage)
      if (isLoginPage) {
        if (supaUser) {
          if (isPasswordChangeRequired) {
            router.replace('/change-password');
            if (!isCancelled) setIsAuthorized(false);
            return;
          }
          const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const rawTarget = searchParams?.get('redirect');
          const redirectTarget = rawTarget && rawTarget !== '/login' ? rawTarget : '/';
          router.replace(redirectTarget);
          if (!isCancelled) setIsAuthorized(false);
          return;
        }
        // Unauthenticated visitor is fully authorized to see the login page
        if (!isCancelled) setIsAuthorized(true);
        return;
      }

      // Handle /change-password page:
      if (isChangePasswordPage) {
        if (supaUser) {
          if (!isCancelled) setIsAuthorized(true);
          return;
        }
        // If unauthenticated, redirect to login
        router.replace('/login');
        if (!isCancelled) setIsAuthorized(false);
        return;
      }

      // Protected routes:
      if (supaUser) {
        if (isPasswordChangeRequired) {
          router.replace('/change-password');
          if (!isCancelled) setIsAuthorized(false);
          return;
        }
        if (!isCancelled) setIsAuthorized(true);
        return;
      }

      // Fallback for authenticated local session
      const localSession = authRepository.getSession();
      if (localSession?.user_id) {
        if (!isCancelled) setIsAuthorized(true);
        return;
      }

      // Unauthenticated access to protected route -> redirect to login
      const redirectParam = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${redirectParam}`);
      if (!isCancelled) setIsAuthorized(false);
    }

    checkAuth();

    return () => {
      isCancelled = true;
    };
  }, [pathname, router]);

  if (!mounted || (!isAuthorized && pathname !== '/login' && pathname !== '/change-password')) {
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
