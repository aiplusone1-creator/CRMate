'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  Database, 
  RotateCcw, 
  ShieldCheck, 
  Eye, 
  Check, 
  X, 
  Sparkles,
  Info,
  Filter
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { formatCurrencySAR } from '@/lib/utils';

interface StagedRow {
  id: string;
  sourceSheet: string;
  sourceRow: number;
  prCode: string;
  rawProjectName: string;
  rawClient: string;
  rawLocation: string;
  rawValue: number;
  matchStatus: 'exact' | 'fuzzy' | 'new_lead' | 'template_empty';
  suggestedMatchId?: string;
  suggestedMatchName?: string;
  confidenceScore: number;
  userDecision?: 'accept' | 'create_new' | 'skip';
}

export default function MigrationPage() {
  const { projects, companies, contacts } = useCRM();

  // Initial Staged Sample Rows from Workbook Analysis (Rows 5-26 vs Rows 27-139)
  const [stagedRows, setStagedRows] = useState<StagedRow[]>([
    {
      id: 'stg_1',
      sourceSheet: 'Projects Follow UP',
      sourceRow: 5,
      prCode: 'PR1007',
      rawProjectName: 'International Medical Center IMC Obhur Hospital Project',
      rawClient: 'Alsaad Contracting',
      rawLocation: 'Jeddah',
      rawValue: 9619000,
      matchStatus: 'exact',
      suggestedMatchId: 'p1',
      suggestedMatchName: 'International Medical Center IMC Obhur Hospital Project',
      confidenceScore: 100,
      userDecision: 'accept',
    },
    {
      id: 'stg_2',
      sourceSheet: 'Projects Follow UP',
      sourceRow: 6,
      prCode: 'PR1008',
      rawProjectName: 'Al Salama Hospital Expansion - Main Building',
      rawClient: 'Al Salama Hospital',
      rawLocation: 'Jeddah',
      rawValue: 3450000,
      matchStatus: 'fuzzy',
      suggestedMatchId: 'p2',
      suggestedMatchName: 'Alsalama Hospital Expansion',
      confidenceScore: 92,
      userDecision: undefined,
    },
    {
      id: 'stg_3',
      sourceSheet: 'Projects Follow UP',
      sourceRow: 7,
      prCode: 'PR1012',
      rawProjectName: 'KIX Futsal Arena Al-Naseem District',
      rawClient: 'Al Shamela MEP',
      rawLocation: 'Jeddah',
      rawValue: 850000,
      matchStatus: 'fuzzy',
      suggestedMatchId: 'p3',
      suggestedMatchName: 'KIX Futsal Arena Al-Naseem',
      confidenceScore: 89,
      userDecision: undefined,
    },
    {
      id: 'stg_4',
      sourceSheet: 'Hot Leads',
      sourceRow: 14,
      prCode: 'HL-014',
      rawProjectName: 'King Fahd Armed Forces Hospital Expansion',
      rawClient: 'Ministry of Defense',
      rawLocation: 'Jeddah',
      rawValue: 5200000,
      matchStatus: 'new_lead',
      confidenceScore: 0,
      userDecision: undefined,
    },
    {
      id: 'stg_5',
      sourceSheet: 'Projects Follow UP',
      sourceRow: 27,
      prCode: 'PR1041',
      rawProjectName: '',
      rawClient: '',
      rawLocation: '',
      rawValue: 0,
      matchStatus: 'template_empty',
      confidenceScore: 0,
      userDecision: 'skip',
    },
  ]);

  const [filterType, setFilterType] = useState<'all' | 'fuzzy' | 'new_lead' | 'template_empty'>('all');

  const handleDecision = (id: string, decision: 'accept' | 'create_new' | 'skip') => {
    setStagedRows(prev => prev.map(r => r.id === id ? { ...r, userDecision: decision } : r));
  };

  const filtered = stagedRows.filter(r => {
    if (filterType === 'all') return true;
    return r.matchStatus === filterType;
  });

  const pendingFuzzyCount = stagedRows.filter(r => r.matchStatus === 'fuzzy' && !r.userDecision).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span>Phase 9 &bull; Staging Review Wizard</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">Safe Dry-Run &bull; Zero source file mutation</span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Excel Migration Review Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Review fuzzy project name matches and dry-run import preview before executing database insertion.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Excel File Safe &bull; Read-Only</span>
          </div>
        </div>
      </div>

      {/* Safety Notice Card */}
      <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold block">Timestamp &amp; Health Integrity Safeguards:</span>
          <span>
            During historical migration, each activity&apos;s true historical timestamp (`activity_date + activity_time`) is preserved. 
            Older migrated activities will <strong>never</strong> overwrite current project follow-up dates or health metrics.
            Template rows (rows 27–139 with zero values) are automatically flagged for exclusion.
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`pb-3 px-3 font-bold transition-all border-b-2 ${
            filterType === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          All Staged ({stagedRows.length})
        </button>

        <button
          onClick={() => setFilterType('fuzzy')}
          className={`pb-3 px-3 font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            filterType === 'fuzzy' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Fuzzy Matches Requiring Review</span>
          {pendingFuzzyCount > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-extrabold">
              {pendingFuzzyCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilterType('new_lead')}
          className={`pb-3 px-3 font-bold transition-all border-b-2 ${
            filterType === 'new_lead' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          New Lead Candidates
        </button>

        <button
          onClick={() => setFilterType('template_empty')}
          className={`pb-3 px-3 font-bold transition-all border-b-2 ${
            filterType === 'template_empty' ? 'border-slate-600 text-slate-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Template Rows to Exclude
        </button>
      </div>

      {/* Review Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Source Row</th>
                <th className="py-3 px-4">PR Code</th>
                <th className="py-3 px-4">Raw Excel Project Name</th>
                <th className="py-3 px-4">Raw Client</th>
                <th className="py-3 px-4">Est. Value</th>
                <th className="py-3 px-4">Match Status</th>
                <th className="py-3 px-4">Suggested CRM Project</th>
                <th className="py-3 px-4 text-right">Engineer Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {row.sourceSheet}:L{row.sourceRow}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                    {row.prCode}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {row.rawProjectName || <span className="text-slate-300 italic">Empty cell</span>}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {row.rawClient || <span className="text-slate-300 italic">&ndash;</span>}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    {row.rawValue > 0 ? formatCurrencySAR(row.rawValue) : '&ndash;'}
                  </td>
                  <td className="py-3.5 px-4">
                    {row.matchStatus === 'exact' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        100% Match
                      </span>
                    )}
                    {row.matchStatus === 'fuzzy' && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span>Fuzzy ({row.confidenceScore}%)</span>
                      </span>
                    )}
                    {row.matchStatus === 'new_lead' && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        New Project
                      </span>
                    )}
                    {row.matchStatus === 'template_empty' && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Empty Row
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {row.suggestedMatchName ? (
                      <span className="font-semibold text-blue-600">{row.suggestedMatchName}</span>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {row.userDecision ? (
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                        row.userDecision === 'accept' ? 'bg-emerald-100 text-emerald-800' :
                        row.userDecision === 'create_new' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        Decision: {row.userDecision.replace('_', ' ').toUpperCase()}
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDecision(row.id, 'accept')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors"
                          title="Link to suggested project"
                        >
                          Accept Match
                        </button>
                        <button
                          onClick={() => handleDecision(row.id, 'create_new')}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] transition-colors"
                          title="Create as distinct new project"
                        >
                          Create New
                        </button>
                        <button
                          onClick={() => handleDecision(row.id, 'skip')}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] transition-colors"
                          title="Do not import this row"
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
