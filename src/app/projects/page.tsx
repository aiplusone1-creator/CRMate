'use client';

import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Building2, 
  User, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Edit, 
  Trash2, 
  X,
  Calendar,
  Users,
  Users2,
  Kanban,
  Table as TableIcon,
  GripVertical,
  ArrowDown,
  Sparkles,
  Lock
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { 
  PIPELINE_STAGES, 
  OPPORTUNITY_TYPES, 
  PROJECT_PRIORITIES, 
  SAUDI_LOCATIONS,
  canEditCommercialValue
} from '@/lib/constants';
import { Project, OpportunityType, PipelineStage, ProjectPriority } from '@/types/crm';
import { formatCurrencySAR, formatDateString } from '@/lib/utils';
import { ProjectCard } from '@/components/projects/project-card';
import { scopeProjects } from '@/lib/logic/scope';

export default function ProjectsPage() {
  const { 
    projects, 
    companies, 
    contacts, 
    addProject, 
    updateProject, 
    deleteProject, 
    currentRole,
    currentUser,
    teamMembers,
    selectedSalesFilter,
    setSelectedSalesFilter
  } = useCRM();

  const isManager = currentUser.role === 'sales_manager' || currentUser.role === 'admin' || currentRole === 'sales_manager' || currentRole === 'admin';

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedHealth, setSelectedHealth] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Auto-sync search term from global search navigation
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('search');
      if (q) setSearchTerm(q);
    }
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Drag & Drop State (Odoo style)
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleStageDrop = async (projectId: string, targetStage: PipelineStage) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj || proj.pipeline_stage === targetStage) return;

    const targetLabel = kanbanStages.find(s => s.stage === targetStage)?.label || targetStage;
    await updateProject(projectId, { pipeline_stage: targetStage });
    setToastMessage(`Project ${proj.pr_number} moved to ${targetLabel}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Form State
  const [prNumber, setPrNumber] = useState('');
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [primaryContactId, setPrimaryContactId] = useState('');
  const [location, setLocation] = useState('Jeddah');
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('in_hand');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('quotation_sent');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [estimatedValue, setEstimatedValue] = useState<number>(100000);
  const [probability, setProbability] = useState<number>(60);
  const [nextAction, setNextAction] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [coEngineer, setCoEngineer] = useState('');

  const openCreateModal = () => {
    setEditingProject(null);
    const nextPr = `PR${1045 + projects.length}`;
    setPrNumber(nextPr);
    setName('');
    const firstComp = companies[0]?.id || '';
    setCompanyId(firstComp);
    const firstContact = contacts.find(c => c.company_id === firstComp)?.id || '';
    setPrimaryContactId(firstContact);
    setLocation('Jeddah');
    setOpportunityType('in_hand');
    setPipelineStage('quotation_sent');
    setPriority('medium');
    setEstimatedValue(150000);
    setProbability(60);
    setNextAction('');
    setNextFollowUpAt('');
    setCoEngineer('');
    setIsModalOpen(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setPrNumber(proj.pr_number);
    setName(proj.name);
    setCompanyId(proj.company_id);
    setPrimaryContactId(proj.primary_contact_id || '');
    setLocation(proj.location);
    setOpportunityType(proj.opportunity_type);
    setPipelineStage(proj.pipeline_stage);
    setPriority(proj.priority);
    setEstimatedValue(proj.estimated_value);
    setProbability(proj.probability);
    setNextAction(proj.next_action || '');
    setNextFollowUpAt(proj.next_follow_up_at ? proj.next_follow_up_at.split('T')[0] : '');
    setCoEngineer(proj.members?.[0]?.user_name || '');
    setIsModalOpen(true);
  };

  const handleCompanyChange = (newCompId: string) => {
    setCompanyId(newCompId);
    const matchingContact = contacts.find(c => c.company_id === newCompId);
    setPrimaryContactId(matchingContact?.id || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prNumber.trim()) return;

    const matchedComp = companies.find(c => c.id === companyId);
    const matchedContact = contacts.find(c => c.id === primaryContactId);

    const members = coEngineer.trim() ? [
      {
        project_id: editingProject?.id || '',
        user_id: 'u2',
        user_name: coEngineer.trim(),
        role: 'co_sales_engineer' as const,
        assigned_at: new Date().toISOString()
      }
    ] : [];

    if (editingProject) {
      await updateProject(editingProject.id, {
        pr_number: prNumber,
        name,
        company_id: companyId,
        company_name: matchedComp?.name,
        primary_contact_id: primaryContactId || undefined,
        primary_contact_name: matchedContact?.full_name,
        primary_contact_phone: matchedContact?.phone,
        location,
        opportunity_type: opportunityType,
        pipeline_stage: pipelineStage,
        priority,
        estimated_value: Number(estimatedValue),
        probability: Number(probability),
        weighted_value: (Number(estimatedValue) * Number(probability)) / 100,
        next_action: nextAction || undefined,
        next_follow_up_at: nextFollowUpAt || undefined,
        members,
      });
    } else {
      await addProject({
        pr_number: prNumber,
        name,
        company_id: companyId,
        company_name: matchedComp?.name,
        primary_contact_id: primaryContactId || undefined,
        primary_contact_name: matchedContact?.full_name,
        primary_contact_phone: matchedContact?.phone,
        location,
        opportunity_type: opportunityType,
        pipeline_stage: pipelineStage,
        priority,
        estimated_value: Number(estimatedValue),
        probability: Number(probability),
        next_action: nextAction || undefined,
        next_follow_up_at: nextFollowUpAt || undefined,
        owner_id: currentUser.id || 'u1',
        owner_name: currentUser.full_name || 'Eslam Mohandes',
        members,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete project "${name}"?`)) {
      await deleteProject(id);
    }
  };

  // Centralized Scoped Base Projects
  const scopedBaseProjects = useMemo(() => {
    return scopeProjects(projects, currentUser, selectedSalesFilter);
  }, [projects, currentUser, selectedSalesFilter]);

  // Filter logic
  const filteredProjects = scopedBaseProjects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.pr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.company_name && p.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.primary_contact_name && p.primary_contact_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStage = selectedStage === 'all' || p.pipeline_stage === selectedStage;
    const matchesType = selectedType === 'all' || p.opportunity_type === selectedType;
    const matchesHealth = selectedHealth === 'all' || p.calculated_health === selectedHealth;
    const matchesCity = selectedCity === 'all' || p.location === selectedCity;
    return matchesSearch && matchesStage && matchesType && matchesHealth && matchesCity;
  });

  // Kanban Stage Columns
  const kanbanStages: { stage: PipelineStage; label: string; headerColor: string }[] = [
    { stage: 'lead', label: 'Lead', headerColor: 'border-slate-400 text-slate-700 bg-slate-100' },
    { stage: 'rfq_processing', label: 'RFQ', headerColor: 'border-blue-500 text-blue-700 bg-blue-50' },
    { stage: 'pricing', label: 'Pricing', headerColor: 'border-teal-500 text-teal-700 bg-teal-50' },
    { stage: 'quotation_sent', label: 'Quotation', headerColor: 'border-indigo-500 text-indigo-700 bg-indigo-50' },
    { stage: 'technical_submission', label: 'Technical', headerColor: 'border-purple-500 text-purple-700 bg-purple-50' },
    { stage: 'negotiation', label: 'Negotiation', headerColor: 'border-amber-500 text-amber-700 bg-amber-50' },
    { stage: 'won', label: 'Won', headerColor: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
    { stage: 'lost', label: 'Lost', headerColor: 'border-rose-500 text-rose-700 bg-rose-50' },
  ];

  return (
    <div className="space-y-6 w-full mx-auto">
      {/* Header with View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#292D32] tracking-tight flex items-center gap-2.5 font-urbanist">
            <Briefcase className="w-7 h-7 text-[#8FC2F0]" />
            <span>Project Pipeline &amp; Deals</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium font-urbanist">
            Visual sales pipeline for Al Mespar Western Region ({filteredProjects.length} projects in scope)
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* View Toggle */}
          <div className="glass-card p-1 rounded-2xl flex items-center border border-white/80 shadow-2xs font-urbanist">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'kanban' 
                  ? 'bg-[#292D32] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table' 
                  ? 'bg-[#292D32] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {currentRole !== 'viewer' && currentRole !== 'estimator' && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#292D32] hover:bg-slate-800 rounded-2xl shadow-xs transition-colors font-urbanist"
            >
              <Plus className="w-4 h-4 text-[#8FC2F0]" />
              <span>Add Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-5 rounded-3xl space-y-3 font-urbanist">
        {/* Manager Scope Pill Bar */}
        {isManager && (
          <div className="flex items-center justify-between p-3 bg-purple-50/70 border border-purple-100 rounded-2xl flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-purple-900 font-urbanist flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                Sales Rep Scope (نطاق المندوب):
              </span>
              <span className="text-[11px] text-purple-700 font-medium">
                {selectedSalesFilter === 'all' 
                  ? `Viewing all projects (${projects.length} deals • Western Region)` 
                  : `Filtered to: ${teamMembers.find(m => m.id === selectedSalesFilter)?.full_name || 'Selected Rep'}`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedSalesFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSalesFilter === 'all'
                    ? 'bg-[#292D32] text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Sales Team ({projects.length})
              </button>

              {teamMembers.filter(m => m.role === 'sales_engineer').map(rep => {
                const repCount = projects.filter(p => p.owner_id === rep.id).length;
                return (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedSalesFilter(rep.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedSalesFilter === rep.id
                        ? 'bg-[#8FC2F0] text-[#292D32] shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{rep.full_name}</span>
                    <span className="text-[10px] opacity-75">
                      ({repCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by #PR, project name, contractor, contact..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white/70 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] focus:bg-white text-slate-900 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Health Filter */}
            <select
              value={selectedHealth}
              onChange={e => setSelectedHealth(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-white/70 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 cursor-pointer"
            >
              <option value="all">Health: All</option>
              <option value="red">🔴 Red (Attention)</option>
              <option value="yellow">🟡 Yellow (Approaching)</option>
              <option value="green">🟢 Green (Healthy)</option>
            </select>

            {/* Stage Filter */}
            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-white/70 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 cursor-pointer"
            >
              <option value="all">All Stages</option>
              {PIPELINE_STAGES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Opportunity Type */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-white/70 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 cursor-pointer"
            >
              <option value="all">All Types</option>
              {OPPORTUNITY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {/* City */}
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-white/70 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-700 cursor-pointer"
            >
              <option value="all">All Cities</option>
              {SAUDI_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: KANBAN PIPELINE BOARD (Matching reference image & Odoo drag & drop) */}
      {viewMode === 'kanban' && (
        <div className="space-y-2">
          {/* Odoo Style Drag & Drop Helper Badge */}
          {currentRole !== 'viewer' && (
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-urbanist">
              <span className="flex items-center gap-1.5 font-bold text-slate-600 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/80 shadow-2xs">
                <GripVertical className="w-3.5 h-3.5 text-[#8FC2F0]" />
                <span>Drag &amp; drop any card to instantly update its pipeline stage (مثل نظام Odoo)</span>
              </span>
              {draggedProjectId && (
                <span className="text-[#292D32] font-black animate-pulse text-[11px] bg-[#8FC2F0]/20 px-3 py-1 rounded-full border border-[#8FC2F0]/30">
                  Release card on any column to move
                </span>
              )}
            </div>
          )}

          <div className="overflow-x-auto pb-6">
            <div className="flex gap-5 min-w-[1700px]">
              {kanbanStages.map(col => {
                const stageProjects = filteredProjects.filter(p => p.pipeline_stage === col.stage);
                const stageValue = stageProjects.reduce((sum, p) => sum + p.estimated_value, 0);
                const isColumnTargeted = dragOverStage === col.stage;

                return (
                  <div 
                    key={col.stage}
                    onDragOver={(e) => {
                      if (currentRole === 'viewer') return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverStage !== col.stage) {
                        setDragOverStage(col.stage);
                      }
                    }}
                    onDragLeave={(e) => {
                      if (currentRole === 'viewer') return;
                      e.preventDefault();
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      if (dragOverStage === col.stage) {
                        setDragOverStage(null);
                      }
                    }}
                    onDrop={async (e) => {
                      if (currentRole === 'viewer') return;
                      e.preventDefault();
                      const projId = e.dataTransfer.getData('text/plain') || draggedProjectId;
                      if (projId) {
                        await handleStageDrop(projId, col.stage);
                      }
                      setDragOverStage(null);
                      setDraggedProjectId(null);
                    }}
                    className={`flex-1 min-w-[360px] rounded-3xl p-4 flex flex-col max-h-[84vh] transition-all duration-150 ${
                      isColumnTargeted
                        ? 'bg-[#8FC2F0]/20 border-[#8FC2F0] border-2 border-dashed ring-4 ring-[#8FC2F0]/20 shadow-md scale-[1.01]'
                        : 'glass-card'
                    }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3 px-1 font-urbanist">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#292D32] text-sm">{col.label}</span>
                        <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200/60 shadow-2xs">
                          {stageProjects.length}
                        </span>
                      </div>
                      <span className="text-xs font-black text-[#292D32]">
                        {formatCurrencySAR(stageValue)}
                      </span>
                    </div>

                    {/* Drop Target Indicator when dragging over this column */}
                    {isColumnTargeted && (
                      <div className="p-3 mb-2 rounded-xl border-2 border-dashed border-blue-500 bg-blue-100/60 text-blue-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse shadow-xs shrink-0">
                        <ArrowDown className="w-4 h-4 text-blue-600 animate-bounce" />
                        <span>Drop here to move to {col.label}</span>
                      </div>
                    )}

                    {/* Cards List */}
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      {stageProjects.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs italic bg-white/50 rounded-xl border border-dashed border-slate-200">
                          {col.stage === 'lost' ? 'No lost projects yet. Great job! 🥳' : 'No projects in this stage'}
                        </div>
                      ) : (
                        stageProjects.map(proj => (
                          <ProjectCard 
                            key={proj.id} 
                            project={proj}
                            isDraggable={currentRole !== 'viewer'}
                            isDragging={draggedProjectId === proj.id}
                            onDragStart={(e) => {
                              if (currentRole === 'viewer') return;
                              e.dataTransfer.setData('text/plain', proj.id);
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedProjectId(proj.id);
                            }}
                            onDragEnd={() => {
                              setDraggedProjectId(null);
                              setDragOverStage(null);
                            }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
                <tr>
                  <th className="py-3.5 px-4">#PR</th>
                  <th className="py-3.5 px-4">Project & Organization</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Pipeline Stage</th>
                  <th className="py-3.5 px-4">Health</th>
                  <th className="py-3.5 px-4 text-right">Est. Value</th>
                  <th className="py-3.5 px-4">Next Action</th>
                  <th className="py-3.5 px-4">Owner / Members</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                      No projects found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map(p => {
                    const stageConfig = PIPELINE_STAGES.find(s => s.value === p.pipeline_stage);
                    const typeConfig = OPPORTUNITY_TYPES.find(t => t.value === p.opportunity_type);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded border border-slate-200">
                            {p.pr_number}
                          </span>
                        </td>
                        <td className="py-4 px-4 min-w-[220px]">
                          <div className="font-semibold text-slate-900 leading-tight">
                            {p.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="text-blue-600 font-medium flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {p.company_name}
                            </span>
                            {p.primary_contact_name && (
                              <span className="text-slate-400">&bull; {p.primary_contact_name}</span>
                            )}
                            <span className="text-slate-400">&bull; {p.location}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {typeConfig?.label || p.opportunity_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${stageConfig?.badgeClass || 'bg-slate-100 text-slate-800'}`}>
                            {stageConfig?.label || p.pipeline_stage}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {p.calculated_health === 'red' && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                              <span className="text-xs font-semibold text-rose-700">
                                {p.days_overdue ? `${p.days_overdue}d late` : 'Needs Action'}
                              </span>
                            </div>
                          )}
                          {p.calculated_health === 'yellow' && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                              <span className="text-xs font-medium text-amber-700">Approaching</span>
                            </div>
                          )}
                          {p.calculated_health === 'green' && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                              <span className="text-xs font-medium text-emerald-700">Healthy</span>
                            </div>
                          )}
                          {p.calculated_health === 'neutral' && (
                            <span className="text-xs text-slate-400">Closed</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="font-bold text-slate-900">
                            {formatCurrencySAR(p.estimated_value)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Prob: {p.probability}% ({formatCurrencySAR(p.weighted_value)})
                          </div>
                        </td>
                        <td className="py-4 px-4 min-w-[200px]">
                          {p.next_action ? (
                            <div>
                              <div className="text-xs text-slate-800 font-medium line-clamp-1">
                                {p.next_action}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>Due: {formatDateString(p.next_follow_up_at)}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-rose-600 font-medium italic">
                              No next action set!
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="text-xs font-medium text-slate-800">
                            {p.owner_name || 'Eslam M.'}
                          </div>
                          {p.members && p.members.length > 0 && (
                            <div className="text-[11px] text-blue-600 flex items-center gap-1 mt-0.5">
                              <Users2 className="w-3 h-3" />
                              <span>+ {p.members[0].user_name}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          {currentRole !== 'viewer' && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Project"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {currentRole !== 'estimator' && (
                                <button
                                  onClick={() => handleDelete(p.id, p.name)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete Project"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="font-bold text-slate-900 text-lg">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">#PR Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="PR10XX"
                    value={prNumber}
                    onChange={e => setPrNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IMC Obhur Hospital"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Account *</label>
                  <select
                    required
                    value={companyId}
                    onChange={e => handleCompanyChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Contact</label>
                  <select
                    value={primaryContactId}
                    onChange={e => setPrimaryContactId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Contact --</option>
                    {contacts.filter(cnt => !companyId || cnt.company_id === companyId).map(cnt => (
                      <option key={cnt.id} value={cnt.id}>{cnt.full_name} ({cnt.job_title || 'Contact'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location (City)</label>
                  <select
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SAUDI_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Opportunity Type</label>
                  <select
                    value={opportunityType}
                    onChange={e => setOpportunityType(e.target.value as OpportunityType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {OPPORTUNITY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pipeline Stage</label>
                  <select
                    value={pipelineStage}
                    onChange={e => setPipelineStage(e.target.value as PipelineStage)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PIPELINE_STAGES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Estimated Value (SAR)</label>
                    {!canEditCommercialValue(pipelineStage) && (
                      <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      disabled={!canEditCommercialValue(pipelineStage)}
                      value={canEditCommercialValue(pipelineStage) ? estimatedValue : 0}
                      onChange={e => setEstimatedValue(Number(e.target.value))}
                      className={`w-full px-3 py-2 text-sm font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        canEditCommercialValue(pipelineStage)
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      placeholder={canEditCommercialValue(pipelineStage) ? "SAR Amount" : "Unlocked at Quotation"}
                    />
                    {!canEditCommercialValue(pipelineStage) && (
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {!canEditCommercialValue(pipelineStage) && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      ينشط السعر بمجرد وصول المشروع لمرحلة Quotation Sent
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={probability}
                    onChange={e => setProbability(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as ProjectPriority)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PROJECT_PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Co-Sales Engineer / Project Member */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Co-Sales Engineer / Project Member (Optional Collaboration)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Abdelrahman Al-Shibi"
                  value={coEngineer}
                  onChange={e => setCoEngineer(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Next Action & Date */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Next Action</label>
                  <input
                    type="text"
                    placeholder="e.g. Follow up on procurement revised BOQ"
                    value={nextAction}
                    onChange={e => setNextAction(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
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
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notification for drag and drop move */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-xs text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
