'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { CRMateMasterLockup } from '@/components/brand/crmate-logo';
import { useLanguage } from '@/lib/i18n/language-context';
import { LanguageToggle } from '@/components/common/language-toggle';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { createClient } from '@/lib/supabase/client';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { language, isRTL } = useLanguage();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasLetter && hasNumber && isMatching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrorMessage(
        isRTL 
          ? 'يرجى استيفاء جميع شروط كلمة المرور وتأكيد التطابق' 
          : 'Please satisfy all password criteria and confirm they match'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || (isRTL ? 'فشل تحديث كلمة المرور' : 'Failed to update password'));
        return;
      }

      setSuccessMessage(
        isRTL 
          ? 'تم تحديث كلمة المرور بنجاح! جاري تحويلك إلى لوحة التحكم...' 
          : 'Password successfully updated! Redirecting to CRM cockpit...'
      );

      // Re-authenticate client-side session with the new password to guarantee fresh cookies and tokens
      const supabase = createClient();
      if (supabase && data?.user?.email) {
        try {
          await supabase.auth.signInWithPassword({
            email: data.user.email,
            password: newPassword,
          });
        } catch (signInErr) {
          console.warn('Could not re-authenticate after password change:', signInErr);
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('crmate_is_authenticated', 'true');
      }

      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        } else {
          router.push('/');
        }
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || (isRTL ? 'حدث خطأ في الاتصال' : 'Connection error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#F4F7FB] dark:bg-[#0B0F14] text-slate-900 dark:text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 relative overflow-hidden transition-colors duration-300 ${isRTL ? 'font-cairo' : 'font-urbanist'}`}>
      
      {/* Subtle Background Glow */}
      <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-gradient-to-b from-[#8FC2F0]/20 via-[#8FC2F0]/5 to-transparent blur-[90px] pointer-events-none" />

      {/* Top Header / Brand Nav */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 py-2">
        <CRMateMasterLockup />
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Card Container */}
      <main className="w-full max-w-md my-auto z-10 py-6">
        <div className="bg-white/90 dark:bg-[#141820]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/40">
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isRTL ? 'تغيير كلمة المرور المؤقتة' : 'Set New Secure Password'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRTL 
                  ? 'يتطلب النظام الأمني تعيين كلمة مرور شخصية جديدة قبل الدخول' 
                  : 'Security policy requires setting a personal password before continuing'}
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* New Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <div className="relative">
                <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} text-slate-400`}>
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder={isRTL ? 'أدخل 8 خانات على الأقل' : 'At least 8 characters'}
                  className={`w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/80 rounded-xl py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-transparent transition-all ${isRTL ? 'pr-9 pl-10' : 'pl-9 pr-10'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                {isRTL ? 'تأكيد كلمة المرور' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} text-slate-400`}>
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Re-enter your password'}
                  className={`w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/80 rounded-xl py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-transparent transition-all ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                />
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-xs space-y-1.5">
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'شروط كلمة المرور:' : 'Password Requirements:'}
              </div>
              <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isRTL ? '8 أحرف أو أكثر' : 'At least 8 characters'}</span>
              </div>
              <div className={`flex items-center gap-2 ${hasLetter ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isRTL ? 'تحتوي على أحرف' : 'Contains letters (a-z, A-Z)'}</span>
              </div>
              <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isRTL ? 'تحتوي على أرقام (0-9)' : 'Contains numbers (0-9)'}</span>
              </div>
              <div className={`flex items-center gap-2 ${isMatching ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isRTL ? 'تطابق كلمتي المرور' : 'Passwords match exactly'}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full py-3 px-4 bg-[#292D32] hover:bg-[#1E2226] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRTL ? 'حفظ كلمة المرور والدخول' : 'Save Password & Enter CRM'}</span>
                  {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 py-4 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{isRTL ? 'CRMate حماية الجلسة والبيانات بنظام Supabase Auth' : 'CRMate Session & Data Protection via Supabase Auth'}</span>
        </div>
      </footer>
    </div>
  );
}
