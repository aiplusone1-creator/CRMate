'use client';

import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  X, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  DollarSign, 
  Award,
  Zap,
  FileCheck
} from 'lucide-react';
import { Project } from '@/types/crm';
import { formatCurrencySAR } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/language-context';
import Link from 'next/link';

interface WonCelebrationModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
}

// Synthesize pleasant celebratory fanfare chime using Web Audio API
function playVictoryChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.2 }, // C5
      { freq: 659.25, time: 0.15, dur: 0.2 }, // E5
      { freq: 783.99, time: 0.3, dur: 0.25 }, // G5
      { freq: 1046.50, time: 0.5, dur: 0.6 } // C6 (long triumphant finish)
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);

      gain.gain.setValueAtTime(0, ctx.currentTime + note.time);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + note.time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.time + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + note.time);
      osc.stop(ctx.currentTime + note.time + note.dur + 0.05);
    });
  } catch {
    // Audio autoplay restrictions or unsupported context
  }
}

// Generate animated confetti particles
const CONFETTI_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EAB308'];

export function WonCelebrationModal({ isOpen, project, onClose }: WonCelebrationModalProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; size: number; color: string; duration: number }>>([]);

  useEffect(() => {
    if (isOpen && project) {
      playVictoryChime();

      // Generate 45 confetti particles
      const newParticles = Array.from({ length: 45 }, (_, i) => ({
        id: i,
        left: Math.random() * 96 + 2, // 2% to 98%
        delay: Math.random() * 1.5,
        size: Math.random() * 8 + 6, // 6px to 14px
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        duration: Math.random() * 2 + 2.5 // 2.5s to 4.5s
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Confetti Rain Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-sm animate-bounce"
            style={{
              left: `${p.left}%`,
              top: '-20px',
              width: `${p.size}px`,
              height: `${p.size * 1.5}px`,
              backgroundColor: p.color,
              animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
              transform: `rotate(${p.id * 35}deg)`,
              opacity: 0.9
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(50vh) rotate(180deg) scale(1.1);
          }
          100% {
            transform: translateY(105vh) rotate(360deg) scale(0.8);
            opacity: 0.2;
          }
        }
      `}</style>

      {/* Main Celebration Card */}
      <div className="relative glass-card max-w-lg w-full bg-white/95 dark:bg-[#1C2130]/95 rounded-3xl shadow-2xl border border-emerald-200/80 dark:border-emerald-500/30 overflow-hidden text-center p-6 sm:p-8 backdrop-blur-2xl animate-in zoom-in-95 duration-200 font-urbanist">
        
        {/* Glowing Ambient Halo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-emerald-400/25 via-amber-300/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy Icon Centerpiece */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-400 opacity-20 blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-400 p-0.5 shadow-xl flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-white dark:bg-[#181D2A] flex items-center justify-center">
              <Trophy className="w-12 h-12 text-amber-500 animate-bounce" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1C2130]">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Congratulations Titles */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>{isRTL ? 'إنجاز استثنائي جديد' : 'Milestone Unlocked'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Congratulations! 🎉
          </h2>
          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {isRTL ? 'ألف مبروك! تحقيق صفقة ناجحة وإغلاق البيع' : 'Deal Successfully Won & Closed!'}
          </p>
        </div>

        {/* Project Details Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#232A38]/70 border border-slate-200/80 dark:border-slate-700/60 text-left mb-6 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              {project.pr_number}
            </span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{project.company_name || 'Organization'}</span>
            </span>
          </div>

          <div className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">
            {project.name}
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isRTL ? 'قيمة الصفقة الإجمالية:' : 'Total Deal Value:'}
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-urbanist">
              {formatCurrencySAR(project.estimated_value || 0)}
            </span>
          </div>
        </div>

        {/* Next Step: Upload Purchase Order Callout */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 mb-5 text-start flex items-center justify-between gap-3 font-urbanist">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black text-slate-900 dark:text-white text-xs">
                {isRTL ? 'توثيق أمر الشراء (PO) والدفعات' : 'Purchase Order (PO) & Collections'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isRTL ? 'يمكنك الآن إرفاق مستند الـ PO وتتبع نسب ومبالغ التحصيل المالي' : 'Attach client PO and track payment collection milestones'}
              </p>
            </div>
          </div>
          <Link
            href={`/projects/${project.id}#po-collection-section`}
            onClick={onClose}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
          >
            {isRTL ? 'رفع الـ PO الآن ↗' : 'Upload PO ↗'}
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isRTL ? 'متابعة العمل ومواصلة الإنجاز' : 'Continue Working'}</span>
          </button>
          
          <Link
            href={`/projects/${project.id}`}
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#232A38] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <span>{isRTL ? 'فتح كارت المشروع' : 'View Project'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
