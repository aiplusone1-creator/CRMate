'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ArrowLeft, Shield, Briefcase, Award } from 'lucide-react';
import { authRepository } from '@/lib/repo/local/auth';
import { User } from '@/lib/types/user';

interface WelcomeOverlayProps {
  currentUser?: { id: string; name?: string; role?: string; name_ar?: string } | null;
}

export function WelcomeOverlay({ currentUser }: WelcomeOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get current user from authRepository or props
    const user = authRepository.getCurrentUser();
    const userId = currentUser?.id || user?.id;

    if (!userId) return;

    const storageKey = `al_mespar_onboarded_${userId}`;
    const alreadyOnboarded = localStorage.getItem(storageKey);

    if (!alreadyOnboarded) {
      setActiveUser(user || (currentUser as unknown as User));
      setIsOpen(true);
    }
  }, [currentUser]);

  const handleDismiss = () => {
    if (activeUser?.id && typeof window !== 'undefined') {
      localStorage.setItem(`al_mespar_onboarded_${activeUser.id}`, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen || !activeUser) return null;

  const roleDetails = {
    sales_engineer: {
      titleAr: 'مهندس مبيعات (Sales Engineer)',
      icon: Briefcase,
      iconColor: 'text-[#8FC2F0] bg-[#8FC2F0]/10',
      tips: [
        'تابع مشاريعك وعروض أسعارك الخاصة في منطقتك بكل دقة.',
        'سجل أنشطتك اليومية ومكالماتك واجتماعاتك في أقل من 20 ثانية عبر الزر السريع.',
        'اطلب اعتماد الخصومات الخاصة مباشرة من مدير المبيعات داخل المشروع.'
      ]
    },
    sales_manager: {
      titleAr: 'مدير مبيعات إقليمي (Sales Manager)',
      icon: Award,
      iconColor: 'text-amber-500 bg-amber-500/10',
      tips: [
        'راقب خط أنابيب المبيعات وأداء المناديب وتوزيع الصفقات في جميع المناطق.',
        'اعتمد أو ارفض طلبات الخصم وعروض الأسعار المعلقة بضغطة زر مع تدوين الملاحظات.',
        'استخدم فلتر المندوبين في أعلى الشاشة لعزل ومراجعة صفقات كل مهندس على حدة.'
      ]
    },
    admin: {
      titleAr: 'مدير النظام التنفيذي (System Admin)',
      icon: Shield,
      iconColor: 'text-purple-600 bg-purple-600/10',
      tips: [
        'صلاحية وصول كاملة وغير مقيدة لكافة بيانات المنظومة والمناديب والمشاريع.',
        'لوحة المطور الخاصة (Dev Switcher) متاحة لك في القائمة العلوية لاختبار أي حساب فوراً.',
        'إدارة التكوينات والصلاحيات وإعدادات المنظومة الشاملة.'
      ]
    },
    estimator: {
      titleAr: 'مهندس تسعير (Estimator)',
      icon: Briefcase,
      iconColor: 'text-emerald-500 bg-emerald-500/10',
      tips: [
        'مراجعة وتدقيق عروض الأسعار والبنود والمواصفات الفنية للمشاريع.',
        'الاطلاع على وثائق المشاريع ومتطلبات التسعير.'
      ]
    },
    viewer: {
      titleAr: 'مشاهد (Viewer)',
      icon: Briefcase,
      iconColor: 'text-slate-500 bg-slate-500/10',
      tips: [
        'الاطلاع على التقارير ومؤشرات الأداء العامة دون تعديل.'
      ]
    }
  };

  const currentRoleInfo = roleDetails[activeUser.role as keyof typeof roleDetails] || roleDetails.sales_engineer;
  const RoleIcon = currentRoleInfo.icon;
  const displayName = activeUser.name_ar || activeUser.name || 'بك';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-right font-sans animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-l from-[#1E232A] via-[#292D32] to-[#16191D] p-6 text-white relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 rounded-full bg-[#8FC2F0]/20 blur-2xl pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 rounded-full bg-[#77CE69]/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#8FC2F0]">
              <Sparkles className="w-5 h-5 text-[#77CE69]" />
            </div>
            <div>
              <span className="font-urbanist font-black text-xl tracking-tight text-white select-none">
                CRM<span className="text-[#8FC2F0]">ate</span><span className="text-[#77CE69] text-2xl font-black mr-0.5 leading-none">.</span>
              </span>
              <p className="text-[11px] text-slate-300 font-cairo">منظومة إدارة المبيعات والمشاريع الهندسية الذكية</p>
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-black font-cairo text-white mt-4">
            أهلاً بك يا {displayName} في CRMate 👋
          </h2>
          <p className="text-xs text-slate-300 font-cairo mt-1">
            تم إعداد حسابك بنجاح. إليك ملخص سريع لصلاحياتك وميزاتك في النظام:
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* User Role Pill */}
          <div className="p-3.5 rounded-2xl bg-[#EFF3F8] flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${currentRoleInfo.iconColor}`}>
              <RoleIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-400 font-cairo">الدور الوظيفي المعتمد</div>
              <div className="text-sm font-black text-[#292D32] font-cairo truncate">{currentRoleInfo.titleAr}</div>
            </div>
          </div>

          {/* Quick Tips */}
          <div>
            <h4 className="text-xs font-black text-[#292D32] font-cairo mb-2.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8FC2F0]" />
              نصائح سريعة لبدء العمل:
            </h4>
            <ul className="space-y-2.5">
              {currentRoleInfo.tips.map((tip, idx) => (
                <li key={idx} className="text-xs text-slate-600 font-cairo flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-[#77CE69] shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Button */}
          <button
            onClick={handleDismiss}
            className="w-full py-3 px-4 bg-[#292D32] hover:bg-[#1E232A] text-white font-black text-sm rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer font-cairo"
          >
            <span>ابدأ العمل الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
