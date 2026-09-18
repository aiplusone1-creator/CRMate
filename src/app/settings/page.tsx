'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Settings as SettingsIcon, 
  Target, 
  Shield, 
  User, 
  Save, 
  Check, 
  Sliders, 
  Bell, 
  MapPin, 
  Building2, 
  DollarSign, 
  Calendar,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { UserRole } from '@/types/crm';
import { formatCurrencySAR } from '@/lib/utils';

export default function SettingsPage() {
  const { 
    currentUser, 
    currentRole, 
    setCurrentRole, 
    salesTargets, 
    updateSalesTarget 
  } = useCRM();

  // Local editing state for targets
  const [editedTargets, setEditedTargets] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    salesTargets.forEach(t => {
      map[t.id] = t.target_value;
    });
    return map;
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTargetChange = (id: string, val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setEditedTargets(prev => ({ ...prev, [id]: num }));
    }
  };

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const [id, val] of Object.entries(editedTargets)) {
      await updateSalesTarget(id, val);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const roles: { value: UserRole; label: string; desc: string }[] = [
    { value: 'admin', label: 'Admin', desc: 'Full configuration, user management, and system rules' },
    { value: 'sales_manager', label: 'Sales Manager', desc: 'Review team weekly plans, configure targets, view all regional data' },
    { value: 'sales_engineer', label: 'Sales Engineer', desc: 'Manage assigned projects, contacts, log activities, and weekly plans' },
    { value: 'estimator', label: 'Estimator', desc: 'Manage RFQ pricing, BOQ, and quotation documents' },
    { value: 'viewer', label: 'Viewer', desc: 'Read-only access for executive monitoring' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200 font-urbanist">
      {/* Top Header */}
      <div className="glass-card p-6 rounded-3xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8FC2F0]/20 text-[#292D32] border border-[#8FC2F0]/30 flex items-center gap-1">
              <SettingsIcon className="w-3 h-3 text-[#292D32]" />
              <span>System &amp; Configuration</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#292D32] tracking-tight">CRM Settings &amp; Targets</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Configure sales engineer monthly quotas, security permissions, regional defaults, and parameters.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#77CE69]/20 text-[#292D32] border border-[#77CE69]/30 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4 text-[#77CE69]" />
            <span>Saved Successfully</span>
          </div>
        )}
      </div>

      {/* Section 1: Sales Target Quota Engine */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 text-[#292D32] flex items-center justify-center font-bold border border-[#8FC2F0]/30">
              <Target className="w-5 h-5 text-[#292D32]" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#292D32]">Configurable Sales Targets &amp; Quotas</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Dynamic goals for Western Region sales engineers &bull; Zero hardcoded numbers.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-[#292D32] bg-white/70 px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
            September 2026
          </span>
        </div>

        <form onSubmit={handleSaveTargets} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salesTargets.map(target => {
              const currentVal = editedTargets[target.id] ?? target.target_value;

              const metricLabels: Record<string, { label: string; unit: string; desc: string }> = {
                calls: { label: 'Monthly Phone Calls', unit: 'Calls', desc: 'Customer follow-up and cold call touches' },
                f2f_meetings: { label: 'Face-to-Face Meetings', unit: 'Meetings', desc: 'Direct client meetings at client office or headquarters' },
                hunting_visits: { label: 'Hunting & Site Visits', unit: 'Visits', desc: 'Unscheduled contractor or site reconnaissance visits' },
                quotations_sent: { label: 'Quotations Delivered', unit: 'Quotations', desc: 'Formal price proposals and technical submittals submitted' },
                won_value: { label: 'Closed Deal Value', unit: 'SAR', desc: 'Contract or PO awarded revenue target' },
              };

              const info = metricLabels[target.target_metric] || {
                label: target.target_metric.replace('_', ' '),
                unit: 'Qty',
                desc: 'Sales performance metric target'
              };

              return (
                <div key={target.id} className="glass-card-interactive p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#292D32]">{info.label}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{target.period_type}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{info.desc}</p>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={0}
                        value={currentVal}
                        onChange={(e) => handleTargetChange(target.id, e.target.value)}
                        className="w-full px-3 py-2 text-sm font-bold bg-white/80 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900"
                      />
                      <span className="text-xs font-bold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                        {info.unit}
                      </span>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 shrink-0">
                      <span>Current: </span>
                      <strong className="text-slate-700">{target.current_actual}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Changes will reflect instantly in dashboards and performance reports.</span>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#292D32] hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-xs transition-all"
            >
              <Save className="w-4 h-4 text-[#8FC2F0]" />
              <span>Save Sales Targets</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Role Switcher & Access Control Simulation */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 text-[#292D32] flex items-center justify-center font-bold border border-[#8FC2F0]/30">
            <Shield className="w-5 h-5 text-[#292D32]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#292D32]">User Role &amp; Permission Simulation</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Simulate granular RBAC security roles across the CRM.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles.map(r => {
            const isSelected = currentRole === r.value;
            return (
              <button
                key={r.value}
                onClick={() => setCurrentRole(r.value)}
                className={`p-4 rounded-2xl text-left transition-all flex items-start justify-between gap-3 ${
                  isSelected 
                    ? 'border-2 border-[#8FC2F0] bg-[#8FC2F0]/15 shadow-xs' 
                    : 'glass-card-interactive'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#292D32]">{r.label}</span>
                    {isSelected && (
                      <span className="text-[10px] font-black uppercase bg-[#292D32] text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{r.desc}</p>
                </div>

                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected ? 'border-[#292D32] bg-[#292D32] text-white' : 'border-slate-300 bg-white'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-[#8FC2F0]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: Profile & Regional Context */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#77CE69]/20 text-[#292D32] flex items-center justify-center font-bold border border-[#77CE69]/30">
            <User className="w-5 h-5 text-[#292D32]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#292D32]">User Profile &amp; Territory Defaults</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Assigned sales territory and organization info.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-white/70 rounded-2xl border border-slate-200/60 shadow-2xs">
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Engineer Name</span>
            <span className="text-[#292D32] font-black mt-1 block">{currentUser.full_name}</span>
          </div>

          <div className="p-4 bg-white/70 rounded-2xl border border-slate-200/60 shadow-2xs">
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Email Address</span>
            <span className="text-[#292D32] font-black mt-1 block">{currentUser.email}</span>
          </div>

          <div className="p-4 bg-white/70 rounded-2xl border border-slate-200/60 shadow-2xs">
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Primary Territory</span>
            <span className="text-[#292D32] font-black mt-1 block">Western Region (Jeddah, Makkah, Medina)</span>
          </div>
        </div>
      </div>

      {/* Section 4: Data Management & Excel Import */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 text-[#292D32] flex items-center justify-center font-bold border border-[#8FC2F0]/30 shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-[#292D32]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#292D32]">Excel Pipeline Data Importer</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Upload and sync multi-sheet sales workbooks (Projects Follow UP, Hot Leads, Master Report &amp; Won Deals).
            </p>
          </div>
        </div>

        <Link
          href="/import"
          className="px-4 py-2.5 rounded-2xl bg-[#292D32] hover:bg-black text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <span>Open Import Hub</span>
          <ArrowRight className="w-4 h-4 text-[#8FC2F0]" />
        </Link>
      </div>
    </div>
  );
}
