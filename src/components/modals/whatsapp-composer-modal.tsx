'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Copy, 
  Check, 
  FileText, 
  Calendar, 
  Briefcase, 
  Sparkles 
} from 'lucide-react';
import { normalizePhoneNumber } from '@/lib/utils';

export interface WhatsAppComposerProps {
  isOpen: boolean;
  onClose: () => void;
  recipientPhone: string;
  recipientName: string;
  projectName?: string;
  quotationNumber?: string;
  engineerName?: string;
}

interface Template {
  id: string;
  title: string;
  category: 'quotation' | 'visit' | 'technical' | 'po';
  text: string;
}

export function WhatsAppComposerModal({
  isOpen,
  onClose,
  recipientPhone,
  recipientName,
  projectName = '',
  quotationNumber = '',
  engineerName = 'مهندس المبيعات'
}: WhatsAppComposerProps) {
  const cleanPhone = normalizePhoneNumber(recipientPhone);

  const templates: Template[] = [
    {
      id: 'quote_followup',
      title: 'متابعة عرض السعر / Quotation Follow-up',
      category: 'quotation',
      text: `السلام عليكم مهندس {name}، تحية طيبة من شركة المسفار للتجارة والمقاولات. نود المتابعة معكم بخصوص عرض السعر رقم {quote} لمشروع "{project}". هل لديكم أي استفسارات أو ملاحظات فنية بخصوص نطاق التوريد؟ يسعدنا التنسيق معكم دائماً.`
    },
    {
      id: 'visit_confirm',
      title: 'تأكيد موعد زيارة موقع / Site Visit Confirmation',
      category: 'visit',
      text: `مرحباً مهندس {name}، تأكيداً لموعد زيارة الموقع لمشروع "{project}" غداً لمراجعة المتطلبات الفنية والمطابقة على أرض الواقع. يسعدني لقاؤكم. - {engineer} | المسفار`
    },
    {
      id: 'technical_submittal',
      title: 'إرسال الاعتماد الفني / Technical Submittal',
      category: 'technical',
      text: `السلام عليكم مهندس {name}، يسعدنا مشاركتكم ملف المواصفات الفنية والاعتمادات المحدثة لمشروع "{project}" للاطلاع والاعتماد. في حال وجود أي متطلبات فنية إضافية نحن بالخدمة.`
    },
    {
      id: 'po_followup',
      title: 'متابعة التعميد وأمر التوريد / PO Follow-up',
      category: 'po',
      text: `السلام عليكم مهندس {name}، نود الاستفسار عن مستجدات أمر التوريد والتعميد لمشروع "{project}" لنتمكن من حجز الكميات وتأمين جدول التسليم بأعلى درجات الكفاءة. شاكرين لتعاونكم الدائم.`
    }
  ];

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0].id);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Replace tokens in template
  const applyTokens = (raw: string): string => {
    return raw
      .replace(/{name}/g, recipientName || 'الكريم')
      .replace(/{project}/g, projectName || 'المشروع')
      .replace(/{quote}/g, quotationNumber || 'المقدم')
      .replace(/{engineer}/g, engineerName || 'فريق المسفار');
  };

  useEffect(() => {
    if (isOpen) {
      const activeTpl = templates.find(t => t.id === selectedTemplateId) || templates[0];
      setCustomMessage(applyTokens(activeTpl.text));
      setCopied(false);
    }
  }, [isOpen, selectedTemplateId, recipientName, projectName, quotationNumber, engineerName]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!cleanPhone) return;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-urbanist animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">WhatsApp B2B Quick Composer</h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                To: <span className="font-bold">{recipientName}</span> ({cleanPhone ? `+${cleanPhone}` : 'No phone'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Template Selection */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Select Professional Template / اختر نموذج الرسالة:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-2.5 rounded-xl text-left transition-all text-xs font-bold border flex items-center gap-2 ${
                    selectedTemplateId === tpl.id
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{tpl.title.split('/')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Message Content / نص الرسالة:
              </label>
              <button
                onClick={handleCopy}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              dir="rtl"
              rows={5}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 leading-relaxed font-sans"
              placeholder="اكتب رسالتك هنا..."
            />
          </div>

          {/* Recipient Notice */}
          {!cleanPhone ? (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
              ⚠️ لا يوجد رقم هاتف مسجل لهذه الجهة. يمكنك نسخ النص وإرساله يدوياً.
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">
              سيتم فتح تطبيق واتساب مباشرة مع تجهيز النص كاملاً للاعتماد والإرسال.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendWhatsApp}
            disabled={!cleanPhone}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Open in WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
