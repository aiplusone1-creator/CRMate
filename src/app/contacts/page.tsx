'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Building2, 
  Flame, 
  MessageCircle, 
  Edit, 
  Trash2, 
  X,
  Calendar,
  MapPin,
  Bell
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { SAUDI_LOCATIONS } from '@/lib/constants';
import { Contact } from '@/types/crm';
import { formatDateString, normalizePhoneNumber, formatDisplayPhone } from '@/lib/utils';

export default function ContactsPage() {
  const { contacts, companies, projects, addContact, updateContact, deleteContact, currentRole, openFastLog, openReminder } = useCRM();

  const [searchTerm, setSearchTerm] = useState('');
  const [onlyHotLeads, setOnlyHotLeads] = useState(false);
  const [selectedCity, setSelectedCity] = useState('all');

  // Auto-sync search term from global search navigation
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('search');
      if (q) setSearchTerm(q);
    }
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Jeddah');
  const [isHotLead, setIsHotLead] = useState(false);
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingContact(null);
    setFullName('');
    setCompanyId(companies[0]?.id || '');
    setJobTitle('');
    setPhone('');
    setEmail('');
    setCity('Jeddah');
    setIsHotLead(false);
    setNextFollowUpAt('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (cnt: Contact) => {
    setEditingContact(cnt);
    setFullName(cnt.full_name);
    setCompanyId(cnt.company_id || '');
    setJobTitle(cnt.job_title || '');
    setPhone(cnt.phone || '');
    setEmail(cnt.email || '');
    setCity(cnt.city || 'Jeddah');
    setIsHotLead(cnt.is_hot_lead);
    setNextFollowUpAt(cnt.next_follow_up_at ? cnt.next_follow_up_at.split('T')[0] : '');
    setNotes(cnt.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const matchedComp = companies.find(c => c.id === companyId);
    const normalized = normalizePhoneNumber(phone);

    if (editingContact) {
      await updateContact(editingContact.id, {
        full_name: fullName,
        company_id: companyId || undefined,
        company_name: matchedComp?.name,
        job_title: jobTitle,
        phone,
        normalized_phone: normalized,
        email,
        city,
        is_hot_lead: isHotLead,
        next_follow_up_at: nextFollowUpAt || undefined,
        notes,
      });
    } else {
      await addContact({
        full_name: fullName,
        company_id: companyId || undefined,
        company_name: matchedComp?.name,
        job_title: jobTitle,
        phone,
        normalized_phone: normalized,
        email,
        city,
        is_hot_lead: isHotLead,
        next_follow_up_at: nextFollowUpAt || undefined,
        notes,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete contact "${name}"?`)) {
      await deleteContact(id);
    }
  };

  // Filter logic
  const filteredContacts = contacts.filter(cnt => {
    const matchesSearch = cnt.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (cnt.job_title && cnt.job_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (cnt.company_name && cnt.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (cnt.phone && cnt.phone.includes(searchTerm)) ||
                          (cnt.email && cnt.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (cnt.notes && cnt.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesHot = !onlyHotLeads || cnt.is_hot_lead;
    const matchesCity = selectedCity === 'all' || cnt.city === selectedCity;
    return matchesSearch && matchesHot && matchesCity;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Contacts & Key Decision Makers</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Engineers, procurement managers and client reps across Saudi projects ({contacts.length} total)
          </p>
        </div>

        {currentRole !== 'viewer' && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        )}
      </div>

      {/* Filter Bar with Hot Leads Toggle */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, company, phone, position..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Hot Leads Switch Toggle (Replaces separate Hot Leads sheet) */}
          <button
            onClick={() => setOnlyHotLeads(!onlyHotLeads)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              onlyHotLeads 
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Flame className={`w-4 h-4 ${onlyHotLeads ? 'text-white' : 'text-amber-500'}`} />
            <span>Hot Leads Only</span>
          </button>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="all">All Cities</option>
            {SAUDI_LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredContacts.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
            No contacts match the filter criteria.
          </div>
        ) : (
          filteredContacts.map(cnt => {
            const rawPhone = cnt.phone || '';
            const cleanPhone = normalizePhoneNumber(rawPhone);
            const displayPhone = formatDisplayPhone(rawPhone);
            const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;
            const linkedCompany = companies.find(c => c.id === cnt.company_id);
            const linkedProject = projects.find(p => p.primary_contact_id === cnt.id || p.company_id === cnt.company_id);

            return (
              <div 
                key={cnt.id} 
                className="glass-card-interactive p-6 rounded-3xl flex flex-col justify-between"
              >
                <div>
                  {/* 1. Full Name on Top & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-slate-900 text-lg leading-tight tracking-tight">
                          {cnt.full_name}
                        </h3>
                        {cnt.is_hot_lead && (
                          <span 
                            title="Hot Lead - Priority follow-up required"
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200"
                          >
                            <Flame className="w-3 h-3 fill-amber-500 text-amber-600" />
                            HOT LEAD
                          </span>
                        )}
                      </div>

                      {/* 2. Job Title */}
                      <div className="text-xs sm:text-sm font-bold text-blue-700 mt-1">
                        {cnt.job_title || 'Sales / Engineering Contact'}
                      </div>

                      {/* 3. Company Name */}
                      <div className="text-xs font-semibold text-slate-700 mt-1.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cnt.company_name || linkedCompany?.name || 'Independent / General'}</span>
                      </div>
                    </div>

                    {/* Edit & Delete */}
                    {currentRole !== 'viewer' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(cnt)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Contact"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cnt.id, cnt.full_name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 4. Notes / Context immediately under company name */}
                  {cnt.notes ? (
                    <div className="mt-3 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Notes / ملاحظات:
                      </span>
                      <p className="line-clamp-3 whitespace-pre-wrap">{cnt.notes}</p>
                    </div>
                  ) : null}

                  {/* Location & Follow Up Date */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 gap-2 flex-wrap">
                    {cnt.city && (
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {cnt.city}
                      </span>
                    )}
                    {cnt.next_follow_up_at && (
                      <span className="flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        Due: {formatDateString(cnt.next_follow_up_at)}
                      </span>
                    )}
                  </div>

                  {/* 5. Phone Number Box directly above Call button */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-blue-500" />
                        Direct Phone / رقم الجوال
                      </span>
                      {rawPhone && (
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                          Direct Line
                        </span>
                      )}
                    </div>

                    {rawPhone ? (
                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="font-mono text-sm font-extrabold text-slate-900 tracking-wider select-all">
                          {displayPhone}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">Saudi Mobile</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        No phone recorded
                      </div>
                    )}
                  </div>
                </div>

                {/* Fast Action Buttons: Call with number & WhatsApp */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    {rawPhone ? (
                      <>
                        {/* Call Button */}
                        <a
                          href={`tel:${cleanPhone || rawPhone}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
                          title={`Call ${cnt.full_name} (${displayPhone})`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>

                        {/* WhatsApp Button */}
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 active:scale-[0.98]"
                            title={`Chat with ${cnt.full_name} on WhatsApp`}
                          >
                            <MessageCircle className="w-4 h-4 fill-white" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic py-1.5">No phone number recorded</span>
                    )}

                    {/* Email Link */}
                    {cnt.email && (
                      <a
                        href={`mailto:${cnt.email}`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shrink-0"
                        title={`Email ${cnt.email}`}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}

                    {/* Reminder Shortcut */}
                    <button
                      onClick={() => openReminder({
                        entity_type: 'contact',
                        entity_id: cnt.id,
                        entity_name: cnt.full_name,
                        contact_id: cnt.id,
                        contact_name: cnt.full_name,
                      })}
                      className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl transition-colors shrink-0"
                      title="Set Reminder for this contact"
                    >
                      <Bell className="w-4 h-4" />
                    </button>

                    {/* Fast Log Shortcut */}
                    <button
                      onClick={() => openFastLog({ contactId: cnt.id, project: linkedProject || null })}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
                      title="Log interaction with this contact"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-slate-900 text-lg">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yasser Bahussin"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                  <select
                    value={companyId}
                    onChange={e => setCompanyId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Standalone Contact --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title / Position</label>
                  <input
                    type="text"
                    placeholder="e.g. Procurement Manager"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="9665XXXXXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SAUDI_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={nextFollowUpAt}
                    onChange={e => setNextFollowUpAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hotLeadCheckbox"
                  checked={isHotLead}
                  onChange={e => setIsHotLead(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="hotLeadCheckbox" className="text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Mark as Hot Lead (Active Inquiry / Priority Follow-up)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Arabic / English interaction background, preferences, project history..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  {editingContact ? 'Save Changes' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
