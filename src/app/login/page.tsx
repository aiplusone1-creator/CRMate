'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  Building2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { authRepository } from '@/lib/repo/local/auth';
import { AuthError } from '@/lib/types/user';
import { useCRM } from '@/lib/store/crm-context';
import { CRMateMasterLockup } from '@/components/brand/crmate-logo';
import { useLanguage } from '@/lib/i18n/language-context';
import { LanguageToggle } from '@/components/common/language-toggle';
import { ThemeToggle } from '@/components/common/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const isExpired = searchParams.get('expired') === 'true';
  const { switchUser } = useCRM();
  const { language, t, isRTL } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // If already logged in, redirect away from /login
  useEffect(() => {
    const session = authRepository.getSession();
    if (session) {
      router.replace(redirectUrl);
    }
  }, [router, redirectUrl]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage(isRTL ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter your email and password');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await authRepository.login(email.trim(), password, rememberMe);
      switchUser(user.id);
      router.push(redirectUrl);
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        if (err.code === 'INVALID_EMAIL') {
          setErrorMessage(t.invalidEmail);
        } else if (err.code === 'INVALID_PASSWORD') {
          setErrorMessage(t.invalidPassword);
        } else if (err.code === 'INACTIVE_USER') {
          setErrorMessage(t.inactiveUser);
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage(t.generalLoginError);
      }
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#F4F7FB] dark:bg-[#0B0F14] text-slate-900 dark:text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 relative overflow-hidden selection:bg-[#8FC2F0]/30 selection:text-[#292D32] transition-colors duration-300 ${isRTL ? 'font-cairo' : 'font-urbanist'}`}>
      
      {/* 1. Subtle Executive Atmospheric Background Glows */}
      <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-gradient-to-b from-[#8FC2F0]/20 via-[#8FC2F0]/5 to-transparent blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-36 right-1/4 w-[500px] h-[300px] rounded-full bg-gradient-to-t from-[#77CE69]/15 to-transparent blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#292D32_0.5px,transparent_0.5px)] dark:bg-[radial-gradient(#8FC2F0_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#77CE69] animate-pulse" />
          <span className="text-[11px] font-bold text-[#292D32] dark:text-slate-200 uppercase tracking-wider font-urbanist">
            {t.ksaCloud}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
          <LanguageToggle />
        </div>
      </header>

      {/* Central Authentication Card */}
      <main className="w-full max-w-[430px] my-auto relative z-10 py-6">
        <div className="bg-white/95 dark:bg-[#15191E]/95 backdrop-blur-xl p-7 sm:p-9 rounded-[28px] shadow-[0_20px_60px_-15px_rgba(41,45,50,0.08),0_8px_20px_-4px_rgba(41,45,50,0.03)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border border-slate-200/80 dark:border-white/10">
          
          {/* Brand Master Lockup */}
          <div className="mb-6 flex flex-col items-center text-center">
            <CRMateMasterLockup symbolSize={46} />
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-4" />
            <h1 className="text-xl font-extrabold text-[#292D32] dark:text-white tracking-tight">
              {isRTL ? 'تسجيل الدخول إلى حسابك' : 'Sign in to your account'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
              {isRTL ? 'أدخل بيانات اعتمادك المهنية لمتابعة المبيعات' : 'Enter your corporate credentials to access workspace'}
            </p>
          </div>

          {/* Session Expired Banner */}
          {isExpired && !errorMessage && (
            <div className="mb-5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs font-medium shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="block font-bold">{t.sessionExpiredTitle}</span>
                <span className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 block">{t.sessionExpiredDesc}</span>
              </div>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className={`mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-start gap-2.5 text-rose-800 dark:text-rose-200 text-xs font-medium shadow-2xs ${isShaking ? 'animate-shake' : ''}`}>
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="block font-bold">{t.loginFailed}</span>
                <span className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 block">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLogin} className={`space-y-4 ${isShaking ? 'animate-shake' : ''}`}>
            
            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200 mb-1.5 px-0.5">
                {t.emailLabel}
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#8FC2F0] transition-colors`}>
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]/40 focus:border-[#8FC2F0] focus:bg-white dark:focus:bg-slate-900 transition-all shadow-2xs font-sans`}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <label className="block text-xs font-bold text-[#292D32] dark:text-slate-200">
                  {t.passwordLabel}
                </label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider">
                  SHA-256
                </span>
              </div>
              <div className="relative group">
                <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#8FC2F0] transition-colors`}>
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className={`w-full ${isRTL ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'} py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]/40 focus:border-[#8FC2F0] focus:bg-white dark:focus:bg-slate-900 transition-all shadow-2xs font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer`}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Security Status */}
            <div className="flex items-center justify-between pt-1 px-0.5 text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-[#292D32] dark:text-[#8FC2F0] focus:ring-[#8FC2F0] cursor-pointer"
                />
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {t.rememberMe}
                </span>
              </label>

              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>256-bit SSL</span>
              </span>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-5 bg-[#292D32] hover:bg-black active:scale-[0.99] text-white dark:bg-[#8FC2F0] dark:text-[#12161C] dark:hover:bg-white font-extrabold text-xs rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2 group"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  <span>{t.verifyingSession}</span>
                </>
              ) : (
                <>
                  <span>{t.signInButton}</span>
                  {isRTL ? (
                    <ArrowLeft className="w-4 h-4 text-[#8FC2F0] dark:text-[#12161C] group-hover:-translate-x-1 transition-transform" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-[#8FC2F0] dark:text-[#12161C] group-hover:translate-x-1 transition-transform" />
                  )}
                </>
              )}
            </button>
          </form>

          {/* Help Note Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{isRTL ? 'هل تحتاج مساعدة في الدخول؟ تواصل مع مسؤول النظام' : 'Need help or access? Contact system administrator'}</span>
            </p>
          </div>

        </div>
      </main>

      {/* Corporate Trust Footer */}
      <footer className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500 z-10 py-3 border-t border-slate-200/60 dark:border-slate-800/60 font-medium">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-[#8FC2F0]" />
          <span>{t.companyName}</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span>{isRTL ? 'الرياض • جدة • الخبر' : 'Riyadh • Jeddah • Khobar'}</span>
          <span>&bull;</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t.enterpriseRbac}
          </span>
        </div>
      </footer>
    </div>
  );
}
