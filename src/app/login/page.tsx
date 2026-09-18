'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  TrendingUp, 
  Briefcase, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  Users
} from 'lucide-react';
import { authRepository } from '@/lib/repo/local/auth';
import { AuthError } from '@/lib/types/user';
import { SEEDED_USERS } from '@/lib/constants/users';
import { useCRM } from '@/lib/store/crm-context';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const isExpired = searchParams.get('expired') === 'true';
  const { switchUser } = useCRM();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showQuickFill, setShowQuickFill] = useState(false);

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
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور / Please enter both email and password');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await authRepository.login(email, password, rememberMe);
      // Synchronize CRM Context with session user
      switchUser(user.id);
      
      // Smooth transition to target route
      router.push(redirectUrl);
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        if (err.code === 'INVALID_EMAIL') {
          setErrorMessage('البريد الإلكتروني غير مسجل في النظام / Email is not registered');
        } else if (err.code === 'INVALID_PASSWORD') {
          setErrorMessage('كلمة المرور غير صحيحة، يرجى المحاولة مجدداً / Incorrect password');
        } else if (err.code === 'INACTIVE_USER') {
          setErrorMessage('هذا الحساب معطل، يرجى التواصل مع الإدارة / Account is deactivated');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('تعذر تسجيل الدخول، يرجى التحقق من الاتصال / Login failed, please try again');
      }
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill helper for testing the 5 seeded users
  const fillPreset = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#EFF3F8] flex font-sans selection:bg-[#8FC2F0]/30 selection:text-[#292D32]">
      {/* Left Column: Brand Showcase (Visible on Large Screens) */}
      <div className="hidden lg:flex lg:w-[48%] relative bg-gradient-to-br from-[#1E232A] via-[#292D32] to-[#16191D] p-12 xl:p-16 flex-col justify-between overflow-hidden text-white">
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#8FC2F0]/20 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#77CE69]/15 blur-[140px] pointer-events-none" />

        {/* Top: Logo & Platform Identity */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <span className="font-urbanist font-black text-2xl text-[#8FC2F0]">M</span>
            </div>
            <span className="font-urbanist font-black text-3xl tracking-tight text-white select-none">
              CRM<span className="text-[#8FC2F0]">ate</span><span className="text-[#77CE69] text-3xl font-black ml-0.5 leading-none">.</span>
            </span>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-[#8FC2F0] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#77CE69]" />
            <span>High-Velocity Engineering CRM &bull; المنظومة الذكية للمشاريع</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold mt-6 leading-tight font-urbanist text-slate-100 tracking-tight">
            Precision Pipeline Intelligence &amp; Commercial Governance
          </h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed font-cairo max-w-lg">
            منظومة متكاملة لإدارة مبيعات المشاريع الهندسية، متابعة عروض الأسعار، وتدفق الموافقات والخصومات التجارية في المملكة العربية السعودية.
          </p>
        </div>

        {/* Middle Feature Badges */}
        <div className="relative z-10 space-y-4 my-8">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#8FC2F0]/15 text-[#8FC2F0] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 font-urbanist uppercase tracking-wider">Multi-Role Architecture</h4>
              <p className="text-xs text-slate-400 mt-0.5 font-cairo">عزل وتخصيص صلاحيات كل مهندس مبيعات مع رقابة شاملة للمدير التنفيذي.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#77CE69]/15 text-[#77CE69] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 font-urbanist uppercase tracking-wider">Approval Requests Engine</h4>
              <p className="text-xs text-slate-400 mt-0.5 font-cairo">اعتماد الخصومات والمراجعات الفنية بنقرة واحدة وتوثيق كامل للقرارات.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 font-urbanist">
          <span>&copy; {new Date().getFullYear()} Al-Mespar Engineering CRM</span>
          <span className="text-[#8FC2F0] font-semibold">KSA Enterprise Edition</span>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20 overflow-y-auto">
        {/* Mobile Header Logo */}
        <div className="flex items-center justify-between mb-8 lg:mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#292D32] text-white flex items-center justify-center font-bold text-base shadow-sm">
              <span className="text-[#8FC2F0]">M</span>
            </div>
            <span className="font-urbanist font-black text-2xl tracking-tight text-[#292D32] select-none">
              CRM<span className="text-[#8FC2F0]">ate</span><span className="text-[#77CE69] text-2xl font-black ml-0.5 leading-none">.</span>
            </span>
          </div>

          {/* Quick Preset Toggle Button for Dev & Testing */}
          <button
            type="button"
            onClick={() => setShowQuickFill(!showQuickFill)}
            className="text-xs font-bold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#8FC2F0]" />
            <span>{showQuickFill ? 'Hide Seed Users' : 'Test Accounts (حسابات تجريبية)'}</span>
          </button>
        </div>

        {/* Form Container Card */}
        <div className="max-w-md w-full mx-auto my-auto py-4">
          {/* Quick Fill Testing Drawer */}
          {showQuickFill && (
            <div className="mb-6 p-4 rounded-2xl bg-white border border-blue-200/80 shadow-md animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-urbanist">
                  Click to prefill credentials
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                  5 Seeded Users
                </span>
              </div>
              <div className="space-y-1.5">
                {SEEDED_USERS.map((u) => {
                  const pass = u.id === 'u1' ? 'Es1234' : u.id === 'u2' ? 'Ar1234' : u.id === 'u3' ? 'Kaffas1234' : u.id === 'u4' ? 'Kr1234' : '0125995614';
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => fillPreset(u.email, pass)}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center justify-between text-xs cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 font-urbanist truncate">
                          {u.name} <span className="font-cairo font-medium text-slate-500">({u.name_ar})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">{u.email}</div>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        u.role === 'admin' ? 'bg-rose-100 text-rose-700' : u.role === 'sales_manager' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-[#292D32] tracking-tight font-urbanist">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 font-cairo">
              أدخل بيانات حسابك المعتمدة للوصول إلى خط المبيعات والمشاريع.
            </p>
          </div>

          {/* Expired Session Alert */}
          {isExpired && !errorMessage && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs font-medium shadow-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="block font-bold">انتهت الجلسة / Session Expired</span>
                <span className="text-[11px] text-amber-800 mt-0.5 block font-cairo">انتهت جلستك، يرجى تسجيل الدخول مجدداً للوصول إلى بياناتك.</span>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className={`mb-5 p-3.5 bg-rose-50 border border-rose-200/90 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-medium shadow-xs ${isShaking ? 'animate-shake' : ''}`}>
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="block font-bold">فشل تسجيل الدخول</span>
                <span className="text-[11px] text-rose-700 mt-0.5 block">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className={`space-y-4 ${isShaking ? 'animate-shake' : ''}`}>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-urbanist">
                Email Address &bull; البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@almespar.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]/50 focus:border-[#8FC2F0] transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 font-urbanist">
                  Password &bull; كلمة المرور
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]/50 focus:border-[#8FC2F0] transition-all shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600 font-urbanist">
                  Remember me <span className="font-cairo font-medium text-slate-400">(تذكرني لمدة 30 يوماً)</span>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 bg-[#292D32] hover:bg-slate-900 active:bg-black text-white font-extrabold text-xs rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2 font-urbanist"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to CRMate &bull; الدخول للنظام</span>
                  <ArrowRight className="w-4 h-4 text-[#8FC2F0]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom Security Note */}
        <div className="max-w-md w-full mx-auto pt-6 text-center">
          <p className="text-[11px] text-slate-400 font-medium font-cairo flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>اتصال مشفر وآمن عبر تشفير SHA-256 القياسي</span>
          </p>
        </div>
      </div>
    </div>
  );
}
