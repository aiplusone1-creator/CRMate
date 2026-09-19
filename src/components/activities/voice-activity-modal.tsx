'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Phone, 
  Users, 
  MapPin, 
  Mail, 
  Video, 
  Building2, 
  Briefcase, 
  X,
  ArrowRight,
  RotateCcw,
  Clock,
  ExternalLink,
  Volume2,
  Copy,
  Check
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { 
  ActivityChannel, 
  ActivityOutcome, 
  VisitPurpose,
  Project 
} from '@/types/crm';
import { 
  parseDayNarration, 
  ParsedActivityDraft 
} from '@/lib/logic/voice-activity-parser';
import { ACTIVITY_CHANNELS, ACTIVITY_OUTCOMES } from '@/lib/constants';

interface VoiceActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate?: string; // YYYY-MM-DD
  dayLabel?: string; // e.g. "الأربعاء 17 سبتمبر"
  onSaveActivities?: (activities: ParsedActivityDraft[]) => void;
}

export function VoiceActivityModal({
  isOpen,
  onClose,
  targetDate = new Date().toISOString().split('T')[0],
  dayLabel,
  onSaveActivities
}: VoiceActivityModalProps) {
  const { projects, contacts, companies, addActivity, currentUser } = useCRM();

  // Mode: 'record' -> 'review'
  const [step, setStep] = useState<'record' | 'review'>('record');

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState<'ar-SA' | 'en-US'>('ar-SA');
  const [recordDuration, setRecordDuration] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isNetworkBlocked, setIsNetworkBlocked] = useState(false);
  const [copiedBraveUrl, setCopiedBraveUrl] = useState(false);

  // Audio recording state (Local MediaRecorder fallback)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Parsed Drafts for Review
  const [drafts, setDrafts] = useState<ParsedActivityDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Recognition ref
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize SpeechRecognition support check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Timer while recording
  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('record');
      setTranscript('');
      setDrafts([]);
      setIsRecording(false);
      setRecordDuration(0);
      setSpeechError(null);
      setIsNetworkBlocked(false);
      setRecordedAudioUrl(null);
    } else {
      stopRecording();
    }
  }, [isOpen]);

  const startRecording = async () => {
    setSpeechError(null);
    setIsNetworkBlocked(false);
    if (typeof window === 'undefined') return;

    // 1. Start local audio MediaRecorder (works offline, locally in all browsers)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
          // Release mic tracks
          stream.getTracks().forEach(t => t.stop());
        };

        recorder.start(250);
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.warn('Microphone access denied or error:', err);
      }
    }

    // 2. Attempt SpeechRecognition for real-time text transcription
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setSpeechError('خاصية التعرف على الصوت غير مدعومة في هذا المتصفح. يمكنك كتابة النص أو استخدام النماذج الجاهزة.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let fullText = '';
        for (let i = 0; i < event.results.length; i++) {
          fullText += event.results[i][0].transcript + ' ';
        }
        setTranscript(fullText.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'network') {
          setIsNetworkBlocked(true);
          setSpeechError('متصفح Brave (أو القيود الشبكية) يحجب خدمة Google للتعرف على الصوت افتراضياً لحماية الخصوصية.');
        } else if (event.error === 'not-allowed') {
          setSpeechError('يرجى السماح بالوصول إلى الميكروفون في المتصفح لتسجيل الصوت.');
        } else if (event.error === 'no-speech') {
          // Normal timeout if user was silent, continue
        } else {
          setSpeechError(`تنبيه: ${event.error}. يمكنك الكتابة يدوياً.`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error('Failed to start speech recognition', e);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        /* ignore */
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        /* ignore */
      }
    }

    setIsRecording(false);
  };

  const handleParseNarration = () => {
    stopRecording();
    if (!transcript.trim()) {
      setSpeechError('يرجى التحدث أو كتابة ما تم إنجازه خلال اليوم أولاً.');
      return;
    }

    const parsed = parseDayNarration(transcript, {
      projects,
      contacts,
      companies,
      defaultDate: targetDate,
      currentUser
    });

    if (parsed.length === 0) {
      setDrafts([{
        id: `draft_${Date.now()}`,
        channel: 'call',
        visit_purpose: 'customer_visit',
        outcome: 'connected',
        notes: transcript,
        activity_date: targetDate
      }]);
    } else {
      setDrafts(parsed);
    }

    setStep('review');
  };

  const handleUpdateDraft = (id: string, updates: Partial<ParsedActivityDraft>) => {
    setDrafts(prev => prev.map(d => {
      if (d.id === id) {
        const next = { ...d, ...updates };
        if (updates.project_id !== undefined) {
          const selectedProj = projects.find(p => p.id === updates.project_id);
          if (selectedProj) {
            next.project_name = selectedProj.name;
            next.company_id = selectedProj.company_id;
            next.company_name = selectedProj.company_name;
            next.contact_id = selectedProj.primary_contact_id;
            next.contact_name = selectedProj.primary_contact_name;
          } else {
            next.project_name = undefined;
          }
        }
        return next;
      }
      return d;
    }));
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const handleAddManualDraft = () => {
    const newDraft: ParsedActivityDraft = {
      id: `draft_${Date.now()}`,
      channel: 'call',
      visit_purpose: 'customer_visit',
      outcome: 'connected',
      notes: '',
      activity_date: targetDate
    };
    setDrafts(prev => [...prev, newDraft]);
  };

  const handleAcceptAndSave = async () => {
    if (drafts.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      for (const draft of drafts) {
        await addActivity({
          project_id: draft.project_id,
          project_name: draft.project_name,
          company_id: draft.company_id,
          company_name: draft.company_name,
          contact_id: draft.contact_id,
          contact_name: draft.contact_name,
          user_id: currentUser?.id || 'u1',
          user_name: currentUser?.full_name || 'Eslam Al-Mohandes',
          channel: draft.channel,
          visit_purpose: draft.visit_purpose || 'customer_visit',
          outcome: draft.outcome || 'connected',
          notes: draft.notes,
          activity_date: draft.activity_date || targetDate
        });
      }

      if (onSaveActivities) {
        onSaveActivities(drafts);
      }

      onClose();
    } catch (e) {
      console.error('Failed to save activities from voice modal', e);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Sample presets for quick testing
  const samplePresets = [
    {
      title: 'مكالمة وزيارة وإيميل تسعير',
      text: 'النهاردة الصبح كلمت البشمهندس أحمد في مشروع برج الجوهرة وقالي إنه هيدرس عرض السعر، وبعد الظهر عملت زيارة لشركة اتحاد المقاولين وسلمتهم الكتالوج الفني، وقبل نهاية الدوام بعت إيميل بتحديث التسعير لمشروع مستشفى سليمان فقيه'
    },
    {
      title: 'مكالمة متابعة واجتماع قادم',
      text: 'تواصلت هاتفياً مع شركة المباني بخصوص مشروع فندق هيلتون الكورنيش وحددنا اجتماع يوم الثلاثاء القادم لمراجعة عروض الأسعار والمواصفات'
    },
    {
      title: 'زيارة موقع وملاحظات فنية',
      text: 'نزلت زيارة ميدانية لموقع مشروع برج الجوهرة وقابلت المهندس الاستشاري في الموقع وطلبوا تعديل بعض بنود التسعير وإرسال كتالوجات المضخات'
    }
  ];

  const copyBraveSettings = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('brave://settings/system');
      setCopiedBraveUrl(true);
      setTimeout(() => setCopiedBraveUrl(false), 3000);
    }
  };

  if (!isOpen) return null;

  const getChannelIcon = (ch: ActivityChannel) => {
    switch (ch) {
      case 'call': return Phone;
      case 'meeting_f2f': return Users;
      case 'visit': return MapPin;
      case 'meeting_online': return Video;
      case 'email': return Mail;
      default: return Briefcase;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl glass-card rounded-3xl shadow-2xl border border-white/20 dark:border-[#8FC2F0]/25 overflow-hidden text-right font-sans flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-[#1E232A] via-[#292D32] to-[#16191D] p-5 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 rounded-full bg-[#8FC2F0]/20 blur-2xl pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 rounded-full bg-[#77CE69]/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner ${
              isRecording ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' : 'bg-white/10 text-[#8FC2F0] border border-white/20'
            }`}>
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cairo font-black text-lg text-white">
                تسجيل الأنشطة اليومية بالصوت 🎙️
              </h3>
              <p className="text-xs text-slate-300 font-cairo">
                {dayLabel ? dayLabel : targetDate} &bull; احكِ ما حدث وسيقوم الذكاء الاصطناعي بتقسيم الأنشطة تلقائياً
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            {step === 'record' && (
              <button
                type="button"
                onClick={() => setLanguage(l => l === 'ar-SA' ? 'en-US' : 'ar-SA')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 transition-colors font-mono cursor-pointer"
                title="تغيير لغة الصوت"
              >
                {language === 'ar-SA' ? '🇸🇦 العربية' : '🇺🇸 English'}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: VOICE RECORDING & TRANSCRIPT EDIT */}
        {/* ========================================================================= */}
        {step === 'record' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Brave / Network Blocked Guidance Card */}
            {isNetworkBlocked ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 rounded-2xl space-y-2.5 font-cairo text-amber-950 dark:text-amber-200 animate-in fade-in">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-black text-xs text-amber-900 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>متصفح Brave يحجب خدمة التعرف الصوتي السحابية افتراضياً (network error)</span>
                  </div>
                </div>

                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  لتفعيل الإملاء الصوتي المباشر في Brave خلال ثوانٍ:
                  <br />
                  1. انسخ هذا الرابط وافتحه في تبويب جديد:
                </p>

                <div className="flex items-center gap-2">
                  <input 
                    readOnly 
                    value="brave://settings/system" 
                    className="flex-1 bg-white dark:bg-[#141820] border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-slate-800 dark:text-white select-all"
                  />
                  <button
                    type="button"
                    onClick={copyBraveSettings}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold font-cairo flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedBraveUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBraveUrl ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  2. فعّل الخيار: <strong>"Use Google services for speech recognition"</strong> ثم أعد تحميل الصفحة.
                  <br />
                  💡 <strong>أو يمكنك فوراً تجربة النماذج الجاهزة أدناه أو الكتابة مباشرة في الحقل.</strong>
                </p>
              </div>
            ) : speechError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 font-cairo">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{speechError}</span>
              </div>
            )}

            {/* Central Microphone Recording Button */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative">
                {isRecording && (
                  <>
                    <span className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
                    <span className="absolute -inset-6 rounded-full bg-[#8FC2F0]/20 animate-pulse pointer-events-none" />
                  </>
                )}

                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative w-22 h-22 rounded-full flex flex-col items-center justify-center transition-all shadow-xl cursor-pointer ${
                    isRecording 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white scale-105 shadow-rose-500/30' 
                      : 'bg-[#292D32] dark:bg-[#8FC2F0] hover:bg-[#1E232A] dark:hover:bg-[#7eb5e6] text-white dark:text-[#141820] hover:scale-105 shadow-slate-900/20'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-7 h-7 fill-current mb-0.5" />
                      <span className="text-[10px] font-black font-cairo">إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-7 h-7 mb-0.5 text-[#8FC2F0] dark:text-[#141820]" />
                      <span className="text-[10px] font-black font-cairo">ابدأ الحديث</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status / Timer Indicator */}
              <div className="mt-3 text-center">
                {isRecording ? (
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-mono font-black text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>جاري الاستماع والتسجيل... {formatTimer(recordDuration)}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo font-medium">
                    اضغط وتحدث بحرية، أو اختر أحد النماذج التجريبية أدناه لاختبار الذكاء الاصطناعي فوراً.
                  </p>
                )}
              </div>
            </div>

            {/* Quick 1-Click Testing Presets */}
            <div>
              <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 font-cairo mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#77CE69]" />
                <span>نماذج سريعة لتجربة التقسيم الذكي بنقرة واحدة:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {samplePresets.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      setTranscript(preset.text);
                      setSpeechError(null);
                    }}
                    className="p-2.5 bg-slate-50 dark:bg-[#141820] hover:bg-[#EFF3F8] dark:hover:bg-[#232A38] border border-slate-200/80 dark:border-slate-800 hover:border-[#8FC2F0] dark:hover:border-[#8FC2F0] rounded-xl text-right transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-[#292D32] dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#8FC2F0] font-cairo">
                      ⚡ {preset.title}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-400 font-cairo mt-0.5 line-clamp-1">
                      {preset.text}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Spoken Narration Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-[#292D32] dark:text-white font-cairo flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8FC2F0]" />
                  <span>تفريغ الصوت / نص اليوم (يمكنك التعديل أو الكتابة هنا):</span>
                </label>
                {transcript && (
                  <button
                    type="button"
                    onClick={() => setTranscript('')}
                    className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-cairo cursor-pointer"
                  >
                    مسح النص
                  </button>
                )}
              </div>

              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={4}
                dir="auto"
                placeholder="مثال: كلمت البشمهندس أحمد في مشروع برج الجوهرة وقالي هيدرسوا العرض، وبعدين زرت شركة المباني وسلمتهم الكتالوج الفني، واخر اليوم بعت ايميل تسعير لمشروع مستشفى سليمان فقيه..."
                className="w-full p-3.5 bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#141820] focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-transparent font-cairo leading-relaxed resize-none shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Parse Action Button */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-cairo cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleParseNarration}
                disabled={!transcript.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 font-cairo shadow-md cursor-pointer ${
                  transcript.trim()
                    ? 'bg-[#292D32] dark:bg-[#8FC2F0] hover:bg-[#1E232A] dark:hover:bg-[#7eb5e6] text-white dark:text-[#141820] shadow-slate-900/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                }`}
              >
                <span>تحليل وتقسيم الأنشطة ⚡</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: REVIEW & ACCEPT EXTRACTED ACTIVITIES */}
        {/* ========================================================================= */}
        {step === 'review' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Top Review Notice */}
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between text-xs font-cairo">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>تم استخراج {drafts.length} أنشطة بنجاح! راجع البيانات أدناه واعتمد حفظها.</span>
              </div>
              <button
                type="button"
                onClick={() => setStep('record')}
                className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 font-black flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>العودة للتسجيل</span>
              </button>
            </div>

            {/* List of Parsed Draft Cards */}
            <div className="space-y-4">
              {drafts.map((draft, idx) => {
                const ChannelIcon = getChannelIcon(draft.channel);

                return (
                  <div 
                    key={draft.id}
                    className="p-4 bg-slate-50/70 dark:bg-[#141820] border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-3 hover:border-[#8FC2F0] transition-colors"
                  >
                    {/* Card Top: Index, Channel, Outcome, Delete */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800 font-urbanist">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#141820] text-[10px] font-black flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>

                        {/* Channel selector buttons */}
                        <div className="flex items-center gap-1 bg-white dark:bg-[#232A38] p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          {(['call', 'meeting_f2f', 'visit', 'email'] as ActivityChannel[]).map((ch) => {
                            const Icon = getChannelIcon(ch);
                            return (
                              <button
                                key={ch}
                                type="button"
                                onClick={() => handleUpdateDraft(draft.id, { channel: ch })}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  draft.channel === ch
                                    ? 'bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] font-bold shadow-2xs'
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                                title={ch}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Outcome Selector */}
                        <select
                          value={draft.outcome}
                          onChange={(e) => handleUpdateDraft(draft.id, { outcome: e.target.value as ActivityOutcome })}
                          className="bg-white dark:bg-[#232A38] border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none font-cairo cursor-pointer"
                        >
                          {ACTIVITY_OUTCOMES.map(o => (
                            <option key={o.value} value={o.value} className="dark:bg-[#141820] dark:text-white">{o.label}</option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="حذف هذا النشاط"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Project & Company Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 font-cairo">
                          المشروع المرتبط:
                        </label>
                        <select
                          value={draft.project_id || ''}
                          onChange={(e) => handleUpdateDraft(draft.id, { project_id: e.target.value || undefined })}
                          className="w-full bg-white dark:bg-[#232A38] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-semibold text-[#292D32] dark:text-white focus:outline-none font-cairo truncate cursor-pointer"
                        >
                          <option value="" className="dark:bg-[#141820] dark:text-white">-- غير مرتبط بمشروع محدد --</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id} className="dark:bg-[#141820] dark:text-white">
                              {p.name} {p.company_name ? `(${p.company_name})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 font-cairo">
                          الجهة / العميل:
                        </label>
                        <input
                          type="text"
                          value={draft.company_name || ''}
                          onChange={(e) => handleUpdateDraft(draft.id, { company_name: e.target.value })}
                          placeholder="اسم الشركة أو العميل..."
                          className="w-full bg-white dark:bg-[#232A38] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-semibold text-[#292D32] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-cairo"
                        />
                      </div>
                    </div>

                    {/* Notes Field */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 font-cairo">
                        تفاصيل النشاط والملاحظات:
                      </label>
                      <textarea
                        value={draft.notes}
                        onChange={(e) => handleUpdateDraft(draft.id, { notes: e.target.value })}
                        rows={2}
                        dir="auto"
                        placeholder="ما تم مناقشته أو الاتفاق عليه..."
                        className="w-full bg-white dark:bg-[#232A38] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#8FC2F0] font-cairo resize-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Extra Manual Activity */}
            <button
              type="button"
              onClick={handleAddManualDraft}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#8FC2F0] rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#292D32] dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors font-cairo cursor-pointer bg-white dark:bg-[#141820]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة نشاط آخر لهذا اليوم</span>
            </button>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('record')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-cairo cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>العودة للتسجيل</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-cairo cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAndSave}
                  disabled={isSaving || drafts.length === 0}
                  className="px-6 py-2.5 bg-[#292D32] dark:bg-[#8FC2F0] hover:bg-[#1E232A] dark:hover:bg-[#7eb5e6] text-white dark:text-[#141820] text-xs font-black rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-cairo cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#77CE69] dark:text-[#141820]" />
                  <span>
                    {isSaving ? 'جاري الحفظ...' : `اعتماد وحفظ ${drafts.length} أنشطة`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
