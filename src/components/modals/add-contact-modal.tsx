'use client';

import React, { useState } from 'react';
import { X, UserPlus, Flame } from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { SAUDI_LOCATIONS } from '@/lib/constants';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCompanyId?: string;
}

export function AddContactModal({ isOpen, onClose, defaultCompanyId }: AddContactModalProps) {
  const { companies, addContact } = useCRM();

  const [fullName, setFullName] = useState('');
  const [companyId, setCompanyId] = useState(defaultCompanyId || companies[0]?.id || '');

  React.useEffect(() => {
    if (defaultCompanyId) {
      setCompanyId(defaultCompanyId);
    } else if (companies[0]?.id && !companyId) {
      setCompanyId(companies[0]?.id);
    }
  }, [defaultCompanyId, companies, isOpen]);
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Jeddah');
  const [isHotLead, setIsHotLead] = useState(true);
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    const selectedCompany = companies.find(c => c.id === companyId);

    await addContact({
      company_id: companyId,
      company_name: selectedCompany?.name,
      full_name: fullName.trim(),
      job_title: jobTitle.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      city,
      is_hot_lead: isHotLead,
      notes: notes.trim() || undefined,
      next_follow_up_at: nextFollowUpDate || undefined,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="glass-card rounded-3xl max-w-lg w-full shadow-2xl border border-white/90 dark:border-[#8FC2F0]/20 overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl animate-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-slate-100/80 dark:border-slate-800 bg-white/40 dark:bg-[#232A38]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 border border-[#8FC2F0]/30 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center shadow-2xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-[#292D32] dark:text-white text-lg font-urbanist leading-tight">Add New Client Contact</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Direct Stakeholder &bull; Western Region Directory</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-[#292D32] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          <div>
            <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Eng. Khalid Al-Amri"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Company / Organization *</label>
              <select
                required
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-[#141820] dark:text-white">{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Job Title / Role</label>
              <input
                type="text"
                placeholder="e.g. Senior Procurement Eng."
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Phone / WhatsApp</label>
              <input
                type="tel"
                placeholder="+966 50 123 4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-mono font-bold text-slate-900 dark:text-white shadow-2xs"
              />
            </div>

            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="khalid@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">City</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] font-medium text-slate-900 dark:text-white shadow-2xs"
              >
                {SAUDI_LOCATIONS.map(loc => (
                  <option key={loc} value={loc} className="dark:bg-[#141820] dark:text-white">{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Follow-up Target</label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={e => setNextFollowUpDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white shadow-2xs font-medium"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <div>
                <span className="font-bold text-[#292D32] dark:text-amber-200 block text-xs">Flag as Hot Lead</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Pushed to top priority queue</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isHotLead}
              onChange={e => setIsHotLead(e.target.checked)}
              className="w-4 h-4 text-[#77CE69] rounded border-slate-300 dark:border-slate-700 focus:ring-[#77CE69] cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-bold text-[#292D32] dark:text-slate-200 mb-1.5">Interaction Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Background notes on projects handled by this contact..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/90 dark:bg-[#141820] border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-[#8FC2F0] text-slate-900 dark:text-white shadow-2xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#292D32] hover:bg-[#1E2124] dark:bg-[#8FC2F0] dark:hover:bg-[#7ab2e3] text-white dark:text-[#141820] font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer"
            >
              {isSubmitting ? 'Adding...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
