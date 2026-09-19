'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Briefcase, 
  Building2, 
  Users, 
  Flame, 
  History, 
  Trophy, 
  Check, 
  RefreshCw,
  UserCheck,
  Eye,
  FileCheck
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { parseExcelWorkbook, ParsedExcelResult } from '@/lib/excel/excel-importer';
import { formatCurrencySAR } from '@/lib/utils';

export default function ImportDataPage() {
  const { teamMembers, currentUser, importSalesData } = useCRM();

  // Target Sales Engineer
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id || 'u1');

  // File & Parsing State
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedExcelResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Commit / Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    projectsAdded: number;
    projectsUpdated: number;
    companiesAdded: number;
    contactsAdded: number;
    activitiesAdded: number;
    quotationsAdded: number;
  } | null>(null);

  // Active Preview Tab
  const [activeTab, setActiveTab] = useState<'projects' | 'contacts' | 'activities' | 'quotations'>('projects');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetMember = teamMembers.find(m => m.id === selectedUserId) || currentUser;

  // Handle file reading
  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);
    setImportResult(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const result = parseExcelWorkbook(buffer, {
        targetUserId: targetMember.id,
        targetUserName: targetMember.full_name,
        fileName: selectedFile.name,
      });

      if (!result.success) {
        setParseError('Failed to parse workbook. Please make sure the format matches the standard Excel template.');
      } else {
        setParsedData(result);
      }
    } catch (err: any) {
      console.error('Excel parse error:', err);
      setParseError(err?.message || 'Error processing Excel file. Please verify it is a valid .xlsx file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        processFile(droppedFile);
      } else {
        setParseError('Please upload an Excel workbook (.xlsx or .xls).');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Quick Demo: Load authentic template from source-data
  const handleLoadDemo = async () => {
    setIsParsing(true);
    setParseError(null);
    setImportResult(null);
    try {
      const res = await fetch('/api/load-sample-sheet');
      let buffer: ArrayBuffer;
      if (res.ok) {
        buffer = await res.arrayBuffer();
      } else {
        // Fallback: prompt user to pick the file
        setParseError('Sample sheet can be uploaded directly from: source-data/Saudi Projects Follow UP - Eslam Mohandes(1).xlsx');
        setIsParsing(false);
        return;
      }

      const result = parseExcelWorkbook(buffer, {
        targetUserId: targetMember.id,
        targetUserName: targetMember.full_name,
        fileName: 'Saudi Projects Follow UP - Eslam Mohandes(1).xlsx',
      });
      setParsedData(result);
    } catch (e: any) {
      setParseError('Please browse and select: source-data/Saudi Projects Follow UP - Eslam Mohandes(1).xlsx');
    } finally {
      setIsParsing(false);
    }
  };

  // Commit to CRM Store
  const handleExecuteImport = async () => {
    if (!parsedData) return;
    setIsImporting(true);
    try {
      const res = await importSalesData({
        projects: parsedData.projects,
        companies: parsedData.companies,
        contacts: parsedData.contacts,
        activities: parsedData.activities,
        plannedActivities: parsedData.plannedActivities,
        quotations: parsedData.quotations,
      }, targetMember.id, { mode: 'merge' });

      setImportResult(res);
    } catch (e: any) {
      setParseError('Import failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200 font-urbanist pb-12">
      {/* Top Banner */}
      <div className="glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#8FC2F0]/20 text-[#292D32] border border-[#8FC2F0]/30 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#292D32]" />
                <span>Excel Sync &amp; Migration Hub</span>
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#77CE69]/20 text-[#292D32] border border-[#77CE69]/30">
                Multi-Sheet Intelligence
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#292D32] tracking-tight">
              Excel Data Importer &amp; Rep Sync
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium max-w-2xl">
              Seamlessly import your sales pipeline spreadsheets (Follow UP, Hot Leads, Master Reports &amp; Won Deals). 
              Every sales engineer can sync their workbook directly into CRMate with zero data loss.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/projects" 
              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-xs"
            >
              <span>Back to Projects</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>

        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#8FC2F0]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Step 1: Rep Selection & Upload Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Rep Assignment */}
        <div className="glass-card p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#8FC2F0]/20 flex items-center justify-center text-[#292D32]">
                <UserCheck className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-[#292D32]">1. Select Sales Representative</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              All imported projects, contacts, and logged activities will be assigned directly to this engineer.
            </p>

            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Assigned Engineer / Representative:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#292D32] focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:border-transparent transition-all shadow-xs"
            >
              {teamMembers.filter(m => m.role === 'sales_engineer').map(member => (
                <option key={member.id} value={member.id}>
                  {member.full_name} ({member.title || member.role}) - {member.territory || 'National'}
                </option>
              ))}
            </select>

            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-[#292D32]">Selected Representative:</div>
              <div>Name: <span className="font-semibold text-slate-900">{targetMember.full_name}</span></div>
              <div>Email: <span className="font-semibold text-slate-900">{targetMember.email}</span></div>
              <div>Region: <span className="font-semibold text-slate-900">{targetMember.territory}</span></div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Supports exact sheets: Projects Follow UP, Hot Leads, Master Report, Won Deals.
          </div>
        </div>

        {/* Right: Drag & Drop Dropzone */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#77CE69]/20 flex items-center justify-center text-[#292D32]">
                  <UploadCloud className="w-4 h-4 text-[#292D32]" />
                </div>
                <h2 className="text-base font-black text-[#292D32]">2. Upload Excel Workbook (.xlsx)</h2>
              </div>
              {file && (
                <span className="text-xs font-bold text-[#292D32] px-2.5 py-1 rounded-xl bg-[#77CE69]/20 border border-[#77CE69]/30 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-[#77CE69]" />
                  <span>File Selected</span>
                </span>
              )}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                isDragging 
                  ? 'border-[#8FC2F0] bg-[#8FC2F0]/10 scale-[1.01]' 
                  : 'border-slate-300 hover:border-[#8FC2F0] hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileInputChange}
              />
              
              <div className="w-16 h-16 rounded-2xl bg-[#8FC2F0]/20 flex items-center justify-center text-[#292D32] mb-3 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-8 h-8 text-[#292D32]" />
              </div>
              
              <p className="text-sm font-bold text-[#292D32] text-center">
                Drag and drop your sales Excel workbook here
              </p>
              <p className="text-xs text-slate-400 mt-1 text-center">
                Supports .xlsx &amp; .xls (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">Saudi Projects Follow UP - Eslam Mohandes(1).xlsx</code>)
              </p>

              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-2xl bg-[#292D32] text-white text-xs font-bold hover:bg-black transition-all shadow-md flex items-center gap-2"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Browse Local Computer</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Helper */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Quick load authentic company workbook:</span>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="px-3 py-1.5 rounded-xl bg-[#8FC2F0]/20 hover:bg-[#8FC2F0]/30 text-[#292D32] border border-[#8FC2F0]/40 font-bold transition-all flex items-center gap-1.5 text-xs w-fit"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#292D32]" />
              <span>Load from <code className="text-[11px] font-mono font-normal">source-data/Saudi Projects...</code></span>
            </button>
          </div>
        </div>
      </div>

      {/* Parse Error Notification */}
      {parseError && (
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Parsing Spinner */}
      {isParsing && (
        <div className="glass-card p-12 rounded-3xl flex flex-col items-center justify-center gap-3 text-center">
          <RefreshCw className="w-8 h-8 text-[#8FC2F0] animate-spin" />
          <h3 className="text-base font-bold text-[#292D32]">Analyzing and Parsing Workbook...</h3>
          <p className="text-xs text-slate-400">Extracting projects, contacts, stage mappings, activities, and won deals</p>
        </div>
      )}

      {/* Success Commit Banner */}
      {importResult && (
        <div className="glass-card p-6 rounded-3xl bg-[#77CE69]/10 border border-[#77CE69]/30 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#77CE69]/20 flex items-center justify-center text-[#292D32] shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[#77CE69]" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#292D32]">Excel Data Successfully Synchronized!</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Imported and merged seamlessly into CRMate for engineer <strong>{targetMember.full_name}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/projects"
                className="px-4 py-2 rounded-2xl bg-[#292D32] text-white text-xs font-bold hover:bg-black transition-all shadow-md flex items-center gap-1.5"
              >
                <span>View Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/activities"
                className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
              >
                <span>Activity Log</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4 pt-4 border-t border-[#77CE69]/20">
            <div className="bg-white/80 p-2.5 rounded-2xl border border-slate-100 text-center">
              <div className="text-lg font-black text-[#292D32]">+{importResult.projectsAdded}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">New Projects</div>
            </div>
            <div className="bg-white/80 p-2.5 rounded-2xl border border-slate-100 text-center">
              <div className="text-lg font-black text-[#292D32]">~{importResult.projectsUpdated}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Updated Projects</div>
            </div>
            <div className="bg-white/80 p-2.5 rounded-2xl border border-slate-100 text-center">
              <div className="text-lg font-black text-[#292D32]">+{importResult.companiesAdded}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Companies</div>
            </div>
            <div className="bg-white/80 p-2.5 rounded-2xl border border-slate-100 text-center">
              <div className="text-lg font-black text-[#292D32]">+{importResult.contactsAdded}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Contacts</div>
            </div>
            <div className="bg-white/80 p-2.5 rounded-2xl border border-slate-100 text-center">
              <div className="text-lg font-black text-[#292D32]">+{importResult.activitiesAdded}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Activities</div>
            </div>
            <div className="bg-white/80 p-2.5 rounded-2xl border border-slate-100 text-center">
              <div className="text-lg font-black text-[#292D32]">+{importResult.quotationsAdded}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Won Deals</div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Parsed KPI Metrics & Preview Section */}
      {parsedData && (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            {/* Projects Card */}
            <div className="glass-card p-4 rounded-3xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Total Projects</span>
                <div className="w-7 h-7 rounded-xl bg-[#8FC2F0]/20 flex items-center justify-center text-[#292D32]">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#292D32]">{parsedData.summary.totalProjects}</div>
                <div className="text-[11px] font-bold text-[#292D32]/80 mt-0.5">
                  {formatCurrencySAR(parsedData.summary.totalEstimatedValueSAR)}
                </div>
              </div>
            </div>

            {/* Companies Card */}
            <div className="glass-card p-4 rounded-3xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Companies</span>
                <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-[#292D32]">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#292D32]">{parsedData.summary.totalCompanies}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Normalized accounts</div>
              </div>
            </div>

            {/* Hot Leads & Contacts Card */}
            <div className="glass-card p-4 rounded-3xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Contacts &amp; Leads</span>
                <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Flame className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#292D32]">{parsedData.summary.totalContacts}</div>
                <div className="text-[11px] font-bold text-amber-600 mt-0.5">
                  {parsedData.summary.totalHotLeads} Hot Leads
                </div>
              </div>
            </div>

            {/* Activities Card */}
            <div className="glass-card p-4 rounded-3xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Activities Log</span>
                <div className="w-7 h-7 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <History className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#292D32]">{parsedData.summary.totalActivities}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Historical touchpoints</div>
              </div>
            </div>

            {/* Won Deals Card */}
            <div className="glass-card p-4 rounded-3xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Won Deals</span>
                <div className="w-7 h-7 rounded-xl bg-[#77CE69]/20 flex items-center justify-center text-[#77CE69]">
                  <Trophy className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#77CE69]">{parsedData.summary.totalQuotations}</div>
                <div className="text-[11px] font-bold text-[#292D32] mt-0.5">
                  {formatCurrencySAR(parsedData.summary.totalWonValueSAR)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar: Commit Button */}
          <div className="glass-card p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-[#77CE69]" />
              <div className="text-xs">
                <span className="font-bold text-[#292D32]">Ready to commit: </span>
                <span className="text-slate-500">
                  Parsed {parsedData.summary.totalProjects} projects and {parsedData.summary.totalActivities} activities from {parsedData.summary.fileName}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isImporting}
              onClick={handleExecuteImport}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#292D32] hover:bg-black text-white text-xs font-bold transition-all shadow-lg shadow-[#292D32]/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#8FC2F0]" />
                  <span>Synchronizing into CRMate...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#77CE69]" />
                  <span>Commit &amp; Sync to CRMate ({targetMember.full_name})</span>
                </>
              )}
            </button>
          </div>

          {/* Tabbed Inspection Table */}
          <div className="glass-card rounded-3xl overflow-hidden">
            {/* Tabs Header */}
            <div className="flex items-center gap-2 p-3 bg-slate-50/80 border-b border-slate-200/80 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'projects'
                    ? 'bg-[#292D32] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Projects ({parsedData.projects.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('contacts')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'contacts'
                    ? 'bg-[#292D32] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Contacts &amp; Hot Leads ({parsedData.contacts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'activities'
                    ? 'bg-[#292D32] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Master Report Activities ({parsedData.activities.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quotations')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'quotations'
                    ? 'bg-[#292D32] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Won Deals ({parsedData.quotations.length})</span>
              </button>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto max-h-[500px]">
              {activeTab === 'projects' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-3.5">PR #</th>
                      <th className="p-3.5">Project Name</th>
                      <th className="p-3.5">Company</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5">Stage</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Est. Value (SAR)</th>
                      <th className="p-3.5">Next Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.projects.slice(0, 100).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 font-bold text-[#292D32] font-mono">{p.pr_number}</td>
                        <td className="p-3.5 font-bold text-slate-900 max-w-[220px] truncate" title={p.name}>
                          {p.name}
                        </td>
                        <td className="p-3.5 text-slate-700">{p.company_name}</td>
                        <td className="p-3.5 text-slate-600">{p.primary_contact_name}</td>
                        <td className="p-3.5 text-slate-600">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold">
                            {p.location}
                          </span>
                        </td>
                        <td className="p-3.5 capitalize font-medium">{p.opportunity_type}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.pipeline_stage === 'won' ? 'bg-[#77CE69]/20 text-[#292D32]' :
                            p.pipeline_stage === 'lost' ? 'bg-rose-100 text-rose-700' :
                            p.pipeline_stage === 'quotation_sent' ? 'bg-[#8FC2F0]/20 text-[#292D32]' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {p.pipeline_stage.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-[#292D32]">{formatCurrencySAR(p.estimated_value)}</td>
                        <td className="p-3.5 text-slate-500 max-w-[200px] truncate" title={p.next_action}>
                          {p.next_action || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'contacts' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-3.5">Name</th>
                      <th className="p-3.5">Company</th>
                      <th className="p-3.5">Job Title</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">City</th>
                      <th className="p-3.5">Hot Lead?</th>
                      <th className="p-3.5">Last Contact</th>
                      <th className="p-3.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.contacts.slice(0, 100).map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{c.full_name}</td>
                        <td className="p-3.5 text-slate-700">{c.company_name}</td>
                        <td className="p-3.5 text-slate-600">{c.job_title}</td>
                        <td className="p-3.5 text-slate-600 font-mono">{c.phone || '-'}</td>
                        <td className="p-3.5 text-slate-600">{c.city || '-'}</td>
                        <td className="p-3.5">
                          {c.is_hot_lead ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center gap-1 w-fit">
                              <Flame className="w-3 h-3 text-amber-600" />
                              <span>Hot</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-500">{c.last_contacted_at || '-'}</td>
                        <td className="p-3.5 text-slate-500 max-w-[250px] truncate" title={c.notes}>
                          {c.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'activities' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Channel</th>
                      <th className="p-3.5">Purpose</th>
                      <th className="p-3.5">Opportunity</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Action Log</th>
                      <th className="p-3.5">Next Step</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.activities.slice(0, 100).map((a, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 font-mono text-slate-700">{a.activity_date}</td>
                        <td className="p-3.5 capitalize font-medium">{a.channel.replace('_', ' ')}</td>
                        <td className="p-3.5 capitalize text-slate-600">{a.visit_purpose.replace('_', ' ')}</td>
                        <td className="p-3.5 font-bold text-slate-900 max-w-[180px] truncate" title={a.project_name}>
                          {a.project_name || '-'}
                        </td>
                        <td className="p-3.5 text-slate-700">{a.contact_name || '-'}</td>
                        <td className="p-3.5 text-slate-600 max-w-[280px] truncate" title={a.notes}>
                          {a.notes || '-'}
                        </td>
                        <td className="p-3.5 text-slate-500 max-w-[200px] truncate" title={a.next_action}>
                          {a.next_action || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'quotations' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-3.5">Quotation #</th>
                      <th className="p-3.5">Project / Description</th>
                      <th className="p-3.5">Amount (SAR)</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.quotations.map((q, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 font-bold text-[#292D32] font-mono">{q.quotation_number}</td>
                        <td className="p-3.5 text-slate-900 max-w-[300px] truncate" title={q.notes || q.project_name}>
                          {q.notes || q.project_name}
                        </td>
                        <td className="p-3.5 font-black text-[#77CE69]">{formatCurrencySAR(q.amount)}</td>
                        <td className="p-3.5 font-mono text-slate-600">{q.sent_date}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-[#77CE69]/20 text-[#292D32] font-bold text-[10px]">
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
