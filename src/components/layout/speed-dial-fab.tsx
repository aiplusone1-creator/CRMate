'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Mic, 
  Zap, 
  Bell, 
  Briefcase, 
  X,
  Sparkles
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { VoiceActivityModal } from '@/components/activities/voice-activity-modal';

import { useLanguage } from '@/lib/i18n/language-context';

export function SpeedDialFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const { t, isRTL } = useLanguage();

  const { 
    openFastLog, 
    openNewProjectModal, 
    openReminder, 
    currentRole 
  } = useCRM();

  if (currentRole === 'viewer') return null;

  return (
    <>
      <div className="fixed bottom-6 ltr:right-6 rtl:left-6 z-40 font-urbanist print:hidden">
        {/* Expanded Actions Stack */}
        {isOpen && (
          <div className={`flex flex-col ${isRTL ? 'items-start' : 'items-end'} gap-2.5 mb-3 animate-in fade-in slide-in-from-bottom-3 duration-200`}>
            {/* 1. Voice Daily Activity Log */}
            <button
              onClick={() => {
                setIsOpen(false);
                setIsVoiceOpen(true);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all group scale-100 hover:scale-105 cursor-pointer"
            >
              <span className="text-xs font-bold whitespace-nowrap">{t('voiceDebrief')}</span>
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              </div>
            </button>

            {/* 2. Fast Activity Log (< 20s) */}
            <button
              onClick={() => {
                setIsOpen(false);
                openFastLog();
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl shadow-md hover:shadow-lg transition-all group scale-100 hover:scale-105 cursor-pointer"
            >
              <span className="text-xs font-bold whitespace-nowrap">{t('fastLogActivity')}</span>
              <div className="w-8 h-8 rounded-xl bg-[#8FC2F0]/20 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-[#292D32] group-hover:scale-110 transition-transform" />
              </div>
            </button>

            {/* 3. Schedule Reminder */}
            <button
              onClick={() => {
                setIsOpen(false);
                openReminder();
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl shadow-md hover:shadow-lg transition-all group scale-100 hover:scale-105 cursor-pointer"
            >
              <span className="text-xs font-bold whitespace-nowrap">
                {isRTL ? 'جدولة تذكير بالمتابعة' : 'Set Follow-up Reminder'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
            </button>

            {/* 4. New Project */}
            <button
              onClick={() => {
                setIsOpen(false);
                openNewProjectModal();
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl shadow-md hover:shadow-lg transition-all group scale-100 hover:scale-105 cursor-pointer"
            >
              <span className="text-xs font-bold whitespace-nowrap">
                {isRTL ? 'إضافة مشروع جديد' : 'Add New Project Lead'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#77CE69]/20 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-slate-900 group-hover:scale-110 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Quick Actions Menu"
          className={`w-14 h-14 rounded-3xl shadow-xl flex items-center justify-center transition-all duration-300 group border-2 ${
            isOpen
              ? 'bg-slate-900 border-slate-700 text-white rotate-45 scale-95'
              : 'bg-[#292D32] hover:bg-black border-[#8FC2F0] text-white hover:shadow-2xl hover:scale-105'
          }`}
        >
          <Plus className="w-6 h-6 text-[#8FC2F0] group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Standalone Voice Debrief Modal Triggered from SpeedDial */}
      <VoiceActivityModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />
    </>
  );
}
