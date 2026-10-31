'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  Project, Contact, Company, Activity, PlannedActivity, 
  Quotation, QuotationStatus, SalesTarget, UserRole, Profile, ProjectHealth,
  Reminder, ReminderUrgency, ApprovalRequest, AppNotification, PipelineStage,
  ActivityChannel, VisitPurpose, ProjectPriority,
  ChatConversation, ChatMessage, ChatProjectCard, ChatPlanTaskCard, ChatAttachment, ProjectMember,
  VIPItem, VIPCategory, VIPStatus, VIPPriority
} from '@/types/crm';
import {
  getStoredConversations,
  saveStoredConversations,
  getStoredMessages,
  saveStoredMessages
} from '@/lib/logic/chat';
import { 
  getAllRequests, 
  saveRequests, 
  createApprovalRequest, 
  updateApprovalRequest, 
  resolveApprovalRequest, 
  addCommentToRequest,
  getAllNotifications,
  saveNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '@/lib/logic/requests';

export interface FastLogModalState {
  isOpen: boolean;
  project?: Project | null;
  contactId?: string;
  plannedActivityId?: string;
  defaultGoal?: string;
  initialDate?: string;
  initialTime?: string;
  defaultChannel?: ActivityChannel;
  defaultPurpose?: VisitPurpose;
  initialTargetMode?: 'existing_project' | 'custom_project' | 'area_hunting';
  initialCustomProjectName?: string;
  initialCompanyName?: string;
  initialLocationName?: string;
  initialGoogleMapsUrl?: string;
  initialPriority?: ProjectPriority;
}

export interface ReminderModalState {
  isOpen: boolean;
  defaultValues?: Partial<Reminder>;
}

interface CRMContextType {
  isDataLoading: boolean;
  dataLoadError: string | null;
  refreshData: () => Promise<void>;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: Profile;
  isAuthenticated: boolean;
  teamMembers: Profile[];
  selectedSalesFilter: string;
  setSelectedSalesFilter: (filter: string) => void;
  login: (emailOrUserId: string, password?: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateUserProfile: (userId: string, updates: Partial<Profile>) => void;
  addTeamMember: (member: Omit<Profile, 'id' | 'created_at'> & { id?: string }) => Promise<Profile>;
  deleteTeamMember: (userId: string) => Promise<void>;
  projects: Project[];
  teamProjects?: Project[];
  contacts: Contact[];
  companies: Company[];
  activities: Activity[];
  plannedActivities: PlannedActivity[];
  quotations: Quotation[];
  salesTargets: SalesTarget[];
  fastLogState: FastLogModalState;
  openFastLog: (options?: {
    project?: Project | null;
    contactId?: string;
    plannedActivityId?: string;
    defaultGoal?: string;
    initialDate?: string;
    initialTime?: string;
    defaultChannel?: ActivityChannel;
    defaultPurpose?: VisitPurpose;
    initialTargetMode?: 'existing_project' | 'custom_project' | 'area_hunting';
    initialCustomProjectName?: string;
    initialCompanyName?: string;
    initialLocationName?: string;
    initialGoogleMapsUrl?: string;
    initialPriority?: ProjectPriority;
  }) => void;
  closeFastLog: () => void;
  isNewProjectModalOpen: boolean;
  openNewProjectModal: () => void;
  closeNewProjectModal: () => void;
  isNewContactModalOpen: boolean;
  openNewContactModal: () => void;
  closeNewContactModal: () => void;
  addActivity: (activity: Omit<Activity, 'id' | 'created_at'>) => Promise<Activity>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'weighted_value' | 'pr_number'> & { created_at?: string; pr_number?: string }) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  referProject: (projectId: string, targetUserId: string) => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => Promise<Contact>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  addCompany: (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => Promise<Company>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  deleteProject: (id: string, reason?: string) => Promise<void>;
  archiveProject: (id: string, reason?: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  addPlannedActivity: (planned: Omit<PlannedActivity, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<PlannedActivity>;
  updatePlannedActivity: (id: string, updates: Partial<PlannedActivity>) => Promise<void>;
  deletePlannedActivity: (id: string) => Promise<void>;
  completePlannedActivity: (plannedId: string, activityData: Omit<Activity, 'id' | 'created_at' | 'planned_activity_id'>) => Promise<void>;
  updateSalesTarget: (id: string, newTargetValue: number) => Promise<void>;
  addQuotation: (quotation: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>) => Promise<Quotation>;
  createQuotationRevision: (parentQuotationId: string, revisionData: Partial<Quotation> & { revision_reason: string }) => Promise<Quotation>;
  updateQuotation: (id: string, updates: Partial<Quotation>) => Promise<void>;
  updateQuotationStatus: (id: string, newStatus: QuotationStatus) => Promise<void>;
  archiveQuotation: (id: string) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  // Reminder system
  reminders: Reminder[];
  reminderModalState: ReminderModalState;
  openReminder: (defaultValues?: Partial<Reminder>) => void;
  closeReminder: () => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'created_at' | 'is_completed'>) => Promise<Reminder>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminderCompleted: (id: string) => Promise<void>;
  completeAllReminders: () => Promise<void>;
  completeAllPastPlannedActivities: () => Promise<void>;
  // VIP Module (Isolated from Pipeline)
  vipItems: VIPItem[];
  addVIPItem: (item: Omit<VIPItem, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'status'> & { status?: VIPStatus; created_by?: string }) => Promise<VIPItem>;
  updateVIPItem: (id: string, updates: Partial<VIPItem>) => Promise<void>;
  deleteVIPItem: (id: string) => Promise<void>;
  completeVIPItem: (params: {
    vipId: string;
    channel: ActivityChannel;
    activityDate: string;
    activityTime?: string;
    completionNotes: string;
    nextAction?: string;
    nextFollowUpDate?: string;
    priority?: ProjectPriority;
  }) => Promise<{ activity: Activity; plannedActivity?: PlannedActivity; vipItem: VIPItem }>;
  // Import Sales Data
  importSalesData: (
    data: {
      projects: Project[];
      companies: Company[];
      contacts: Contact[];
      activities: Activity[];
      plannedActivities: PlannedActivity[];
      quotations: Quotation[];
    },
    targetUserId: string,
    options?: { mode?: 'merge' | 'replace' }
  ) => Promise<{
    projectsAdded: number;
    projectsUpdated: number;
    companiesAdded: number;
    contactsAdded: number;
    activitiesAdded: number;
    quotationsAdded: number;
  }>;
  // Approval Requests System (Phase A)
  requests: ApprovalRequest[];
  createRequest: (data: Omit<ApprovalRequest, 'id' | 'created_at' | 'updated_at' | 'comments' | 'status'>) => Promise<ApprovalRequest>;
  updateRequest: (id: string, updates: Partial<ApprovalRequest>) => Promise<void>;
  resolveRequest: (id: string, resolution: { resolved_by: string; resolver_name?: string; status: 'approved' | 'rejected'; final_value?: number; reject_reason?: string }) => Promise<void>;
  addRequestComment: (id: string, body: string) => Promise<void>;
  isRequestModalOpen: boolean;
  requestModalProject: Project | null;
  requestModalQuotationId?: string;
  openRequestModal: (project: Project, quotationId?: string) => void;
  closeRequestModal: () => void;
  selectedRequestIdForDetail: string | null;
  openRequestDetail: (requestId: string) => void;
  closeRequestDetail: () => void;
  // Notifications
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (ids?: string[]) => void;
  // Interactive Module Guide System
  isGuideOpen: boolean;
  activeGuideModuleId: string | null;
  openGuide: (moduleId?: string) => void;
  closeGuide: () => void;
  // Real-time Excel Synchronization
  isSyncingExcel: boolean;
  lastExcelSyncTime: string | null;
  syncExcelNow: (customProjects?: Project[]) => Promise<{ success: boolean; message: string }>;
  // Internal Team Chat & Collaboration System
  conversations: ChatConversation[];
  messages: ChatMessage[];
  isChatDrawerOpen: boolean;
  activeConversationId: string | null;
  chatUnreadCount: number;
  draftProjectCard: ChatProjectCard | null;
  setDraftProjectCard: (card: ChatProjectCard | null) => void;
  openChat: (conversationId?: string) => void;
  closeChat: () => void;
  setActiveConversationId: (conversationId: string | null) => void;
  sendMessage: (params: {
    conversationId: string;
    content: string;
    mentions?: string[];
    projectCard?: ChatProjectCard;
    planTaskCard?: ChatPlanTaskCard;
    attachments?: ChatAttachment[];
  }) => Promise<ChatMessage>;
  markConversationRead: (conversationId: string) => void;
  createChannel: (name: string, name_ar: string, description: string, participant_ids: string[]) => Promise<ChatConversation>;
  getOrCreateDM: (targetUserId: string) => ChatConversation;
  shareProjectToChat: (params: {
    projectId: string;
    conversationId?: string;
    comment?: string;
  }) => Promise<void>;
  grantProjectAccessFromChat: (params: {
    messageId: string;
    projectId: string;
    targetUserId: string;
    targetUserName: string;
    role?: 'co_sales_engineer' | 'lead_estimator' | 'technical_support' | 'executive_sponsor';
  }) => Promise<boolean>;
  sharePlanTaskToChat: (params: {
    taskId: string;
    targetUserId: string;
    comment: string;
    conversationId?: string;
  }) => Promise<void>;
  reschedulePlanTaskFromChat: (params: {
    messageId: string;
    taskId: string;
    daysToAdd?: number;
  }) => Promise<void>;
  acknowledgePlanTaskFromChat: (params: {
    messageId: string;
    taskId: string;
    note?: string;
  }) => Promise<void>;
  assignTaskFromChatToPlan: (params: {
    targetUserId: string;
    title: string;
    clientName?: string;
    projectId?: string;
    plannedDate: string;
    channel: ActivityChannel;
    purpose: VisitPurpose;
    notes?: string;
  }) => Promise<PlannedActivity>;
}

import migratedData from '@/lib/data/migrated_data.json';
import { quotationsService } from '@/lib/supabase/quotations-service';
import { crmService } from '@/lib/supabase/crm-service';

// Acceptance Example Project (Section 42): Al Tahlia Business Park
const SEED_TAHLIA_PROJECT: Project = {
  id: 'p_tahlia_business_park',
  pr_number: 'PR-2026-0018',
  name: 'Al Tahlia Business Park',
  company_id: 'c_tahlia_group',
  company_name: 'Al Tahlia Commercial Development',
  primary_contact_name: 'Eng. Fahad Al-Zahrani',
  primary_contact_phone: '+966551234567',
  location: 'Jeddah - Al Tahlia St.',
  opportunity_type: 'in_hand',
  closing_date: '2026-11-15',
  pipeline_stage: 'negotiation',
  priority: 'high',
  estimated_value: 5000000,
  probability: 80,
  weighted_value: 4000000,
  expected_award_date: '2026-10-15',
  owner_id: 'u1',
  owner_name: 'Eslam Mohandes',
  next_action: 'Negotiate final commercial terms on Quotation V4 with Executive Board',
  next_follow_up_at: '2026-09-25T10:00:00Z',
  last_activity_at: '2026-09-19T16:00:00Z',
  created_at: '2026-08-20T08:00:00Z',
  stage_entered_at: '2026-09-08T10:00:00Z',
  updated_at: '2026-09-19T16:00:00Z',
};

// Example Closed Won Project with Purchase Order (PO) and 50% Cash Collection
const SEED_WON_PROJECT: Project = {
  id: 'p_red_sea_mall_expansion',
  pr_number: 'PR-2026-0009',
  name: 'Red Sea Mall Expansion — HVAC & Chilled Water Package',
  company_id: 'c_red_sea_contracting',
  company_name: 'Red Sea Real Estate Development Co.',
  primary_contact_name: 'Eng. Tariq Mansour',
  primary_contact_phone: '+966504443322',
  location: 'Jeddah - King Abdulaziz Rd',
  opportunity_type: 'in_hand',
  closing_date: '2026-09-30',
  pipeline_stage: 'won',
  priority: 'high',
  estimated_value: 2400000,
  final_won_value: 2400000,
  probability: 100,
  weighted_value: 2400000,
  expected_award_date: '2026-08-30',
  owner_id: 'u1',
  owner_name: 'Eslam Mohandes',
  next_action: 'Follow up on second collection milestone (50% equipment delivery)',
  next_follow_up_at: '2026-10-05T09:00:00Z',
  last_activity_at: '2026-09-22T14:00:00Z',
  created_at: '2026-07-15T09:00:00Z',
  stage_entered_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-22T14:00:00Z',
  card_color: 'emerald',
  base_card_color: 'default',
  // Purchase Order & Collection Data
  po_number: 'PO-RSM-2026-4401',
  po_date: '2026-09-02',
  po_amount: 2400000,
  po_attachment_name: 'Official_PO_RedSeaMall_Expansion.pdf',
  po_attachment_url: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCg==',
  po_attachment_size: 482910,
  po_uploaded_at: '2026-09-02T11:30:00Z',
  po_uploaded_by: 'Eslam Mohandes',
  po_notes: '10% Advance payment received upon contract signing. 40% on first shipment delivery.',
  collected_amount: 1200000,
  collected_percentage: 50,
  collection_status: 'partially_collected',
  collection_records: [
    {
      id: 'pay_rs_01',
      amount: 240000,
      percentage: 10,
      payment_date: '2026-09-05',
      payment_method: 'bank_transfer',
      reference_number: 'TR-SNB-998812',
      notes: '10% Advance Payment against Bank Guarantee',
      recorded_by: 'Eslam Mohandes',
      created_at: '2026-09-05T12:00:00Z',
    },
    {
      id: 'pay_rs_02',
      amount: 960000,
      percentage: 40,
      payment_date: '2026-09-20',
      payment_method: 'bank_transfer',
      reference_number: 'TR-SNB-999430',
      notes: '40% Supply & Delivery Milestone Payment',
      recorded_by: 'Eslam Mohandes',
      created_at: '2026-09-20T15:30:00Z',
    }
  ]
};

const SEED_TAHLIA_QUOTATIONS: Quotation[] = [
  {
    id: 'q_tahlia_v1',
    project_id: 'p_tahlia_business_park',
    project_name: 'Al Tahlia Business Park',
    quotation_number: 'Q-2026-0018',
    version: 1,
    amount: 4250000,
    subtotal: 4250000,
    discount_amount: 0,
    discount_percentage: 0,
    tax_amount: 0,
    total_amount: 4250000,
    currency: 'SAR',
    vendor_brand: 'Belimo Valves & Actuators Package',
    status: 'submitted',
    quotation_date: '2026-09-01',
    sent_date: '2026-09-01',
    valid_until: '2026-09-30',
    notes: 'Initial formal commercial proposal based on tender drawings.',
    payment_terms: '10% Advance, 90% against delivery',
    delivery_terms: '4-6 Weeks from Official Purchase Order',
    warranty_terms: '2 Years Comprehensive Manufacturer Warranty',
    created_by: 'Eslam Mohandes',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'q_tahlia_v2',
    project_id: 'p_tahlia_business_park',
    project_name: 'Al Tahlia Business Park',
    quotation_number: 'Q-2026-0018',
    version: 2,
    amount: 4050000,
    subtotal: 4250000,
    discount_amount: 200000,
    discount_percentage: 4.71,
    tax_amount: 0,
    total_amount: 4050000,
    currency: 'SAR',
    vendor_brand: 'Belimo Valves & Actuators Package',
    status: 'revised',
    quotation_date: '2026-09-07',
    sent_date: '2026-09-07',
    valid_until: '2026-09-30',
    revision_reason: 'Scope reduction / descoped auxiliary sensors',
    notes: 'Revised BOQ omitting auxiliary room sensor modules as requested.',
    payment_terms: '10% Advance, 90% against delivery',
    delivery_terms: '4-6 Weeks from Official Purchase Order',
    warranty_terms: '2 Years Comprehensive Manufacturer Warranty',
    previous_version_id: 'q_tahlia_v1',
    created_by: 'Eslam Mohandes',
    created_at: '2026-09-07T14:30:00Z',
    updated_at: '2026-09-07T14:30:00Z',
  },
  {
    id: 'q_tahlia_v3',
    project_id: 'p_tahlia_business_park',
    project_name: 'Al Tahlia Business Park',
    quotation_number: 'Q-2026-0018',
    version: 3,
    amount: 3850000,
    subtotal: 4250000,
    discount_amount: 400000,
    discount_percentage: 9.41,
    tax_amount: 0,
    total_amount: 3850000,
    currency: 'SAR',
    vendor_brand: 'Belimo Valves & Actuators Package',
    status: 'revised',
    quotation_date: '2026-09-15',
    sent_date: '2026-09-15',
    valid_until: '2026-09-30',
    revision_reason: 'Competitive market pricing pressure',
    notes: 'Commercial discount applied to match contractor target pricing.',
    payment_terms: '10% Advance, 90% against delivery',
    delivery_terms: '4-6 Weeks from Official Purchase Order',
    warranty_terms: '2 Years Comprehensive Manufacturer Warranty',
    previous_version_id: 'q_tahlia_v2',
    created_by: 'Eslam Mohandes',
    created_at: '2026-09-15T11:00:00Z',
    updated_at: '2026-09-15T11:00:00Z',
  },
  {
    id: 'q_tahlia_v4',
    project_id: 'p_tahlia_business_park',
    project_name: 'Al Tahlia Business Park',
    quotation_number: 'Q-2026-0018',
    version: 4,
    amount: 3620000,
    subtotal: 4250000,
    discount_amount: 630000,
    discount_percentage: 14.82,
    tax_amount: 0,
    total_amount: 3620000,
    currency: 'SAR',
    vendor_brand: 'Belimo Valves & Actuators Package',
    status: 'negotiation',
    quotation_date: '2026-09-19',
    sent_date: '2026-09-19',
    valid_until: '2026-09-30',
    revision_reason: 'Customer requested commercial reduction.',
    notes: 'Final revised commercial submittal for client executive board signoff.',
    payment_terms: '10% Advance, 90% against delivery',
    delivery_terms: '4-6 Weeks from Official Purchase Order',
    warranty_terms: '2 Years Comprehensive Manufacturer Warranty',
    previous_version_id: 'q_tahlia_v3',
    created_by: 'Eslam Mohandes',
    created_at: '2026-09-19T16:00:00Z',
    updated_at: '2026-09-19T16:00:00Z',
  },
];

// Authentic Western Region Dataset extracted via Safe Migration Pipeline (Phase 10)
const INITIAL_COMPANIES: Company[] = (migratedData.companies as unknown as Company[]) || [];
const INITIAL_CONTACTS: Contact[] = (migratedData.contacts as unknown as Contact[]) || [];

// Tag all existing 34 authentic projects strictly to Eslam Mohandes (Western Region Senior Sales Engineer)
const RAW_PROJECTS: Project[] = (migratedData.projects as unknown as Project[]) || [];
const MAPPED_PROJECTS: Project[] = RAW_PROJECTS.map(p => ({
  ...p,
  owner_id: p.owner_id || 'u1',
  owner_name: p.owner_name || 'Eslam Mohandes'
}));
const INITIAL_PROJECTS: Project[] = [SEED_TAHLIA_PROJECT, SEED_WON_PROJECT, ...MAPPED_PROJECTS];

const MIGRATED_QUOTATIONS: Quotation[] = (migratedData.quotations as unknown as Quotation[]) || [];
const INITIAL_QUOTATIONS: Quotation[] = [...SEED_TAHLIA_QUOTATIONS, ...MIGRATED_QUOTATIONS];

const RAW_ACTIVITIES: Activity[] = (migratedData.activities as unknown as Activity[]) || [];
const MAPPED_ACTIVITIES: Activity[] = RAW_ACTIVITIES.map(a => ({
  ...a,
  user_id: a.user_id || 'u1',
  user_name: a.user_name || 'Eslam Mohandes'
}));

function extractDateOnly(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return null;
}

const SEED_CURRENT_WEEK_ACTIVITIES: Activity[] = [
  {
    id: 'act_curr_tahlia_followup',
    project_id: 'p_tahlia_business_park',
    project_name: 'Al Tahlia Business Park',
    company_id: 'c_tahlia_group',
    company_name: 'Al Tahlia Commercial Development',
    contact_id: 'ct_fahad_zahrani',
    contact_name: 'Eng. Fahad Al-Zahrani',
    channel: 'call',
    visit_purpose: 'follow_up',
    activity_date: '2026-10-20',
    activity_time: '11:00 AM',
    notes: 'تم الاتصال بالمهندس فهد لمراجعة التعديلات النهائية على تسعير الواجهات الزجاجية',
    outcome: 'connected',
    next_action: 'متابعة استلام أمر الشراء واعتماد الدفعة الأولى',
    next_follow_up_at: '2026-10-22',
    user_id: 'u1',
    user_name: 'Eslam Mohandes',
    created_at: '2026-10-20T11:00:00Z',
  },
  {
    id: 'act_tahlia_v4_submittal',
    project_id: 'p_tahlia_business_park',
    project_name: 'Al Tahlia Business Park',
    company_id: 'c_tahlia_group',
    company_name: 'Al Tahlia Commercial Development',
    contact_id: 'ct_fahad_zahrani',
    contact_name: 'Eng. Fahad Al-Zahrani',
    channel: 'meeting_f2f',
    visit_purpose: 'quotation_delivery',
    activity_date: '2026-09-19',
    activity_time: '16:00',
    notes: 'Delivered Quotation Revision V4 (SAR 3,620,000) directly to Eng. Fahad and discussed board approval milestones.',
    outcome: 'quotation_sent',
    next_action: 'Negotiate final commercial terms on Quotation V4 with Executive Board',
    next_follow_up_at: '2026-09-21',
    user_id: 'u1',
    user_name: 'Eslam Mohandes',
    created_at: '2026-09-19T16:00:00Z',
  },
  {
    id: 'act_tahlia_board_followup',
    project_id: 'p_tahlia_business_park',
    project_name: 'Al Tahlia Business Park',
    company_id: 'c_tahlia_group',
    company_name: 'Al Tahlia Commercial Development',
    contact_id: 'ct_fahad_zahrani',
    contact_name: 'Eng. Fahad Al-Zahrani',
    channel: 'call',
    visit_purpose: 'follow_up',
    activity_date: '2026-09-20',
    activity_time: '11:30',
    notes: 'Phone call to confirm receipt of submittal package by commercial director. Board review scheduled for Wednesday.',
    outcome: 'connected',
    next_action: 'Prepare technical comparison sheet before board meeting',
    next_follow_up_at: '2026-09-23',
    user_id: 'u1',
    user_name: 'Eslam Mohandes',
    created_at: '2026-09-20T11:30:00Z',
  }
];

const SEED_CURRENT_WEEK_PLANS: PlannedActivity[] = [
  {
    id: 'plan_fu_act_curr_tahlia_followup',
    weekly_plan_id: 'wp_2026-10',
    user_id: 'u1',
    user_name: 'Eslam Mohandes',
    project_id: 'p_tahlia_business_park',
    project_name: 'Al Tahlia Business Park',
    company_id: 'c_tahlia_group',
    company_name: 'Al Tahlia Commercial Development',
    contact_id: 'ct_fahad_zahrani',
    contact_name: 'Eng. Fahad Al-Zahrani',
    scheduled_date: '2026-10-22',
    time_slot: '11:00 AM',
    channel: 'call',
    visit_purpose: 'follow_up',
    goal: 'متابعة استلام أمر الشراء واعتماد الدفعة الأولى',
    priority: 'high',
    status: 'planned',
    is_follow_up: true,
    follow_up_from_activity_id: 'act_curr_tahlia_followup',
    created_at: '2026-10-20T11:00:00Z',
    updated_at: '2026-10-20T11:00:00Z',
  }
];

const INITIAL_ACTIVITIES: Activity[] = [...SEED_CURRENT_WEEK_ACTIVITIES, ...MAPPED_ACTIVITIES];

const INITIAL_PLANNED_ACTIVITIES: PlannedActivity[] = [
  ...SEED_CURRENT_WEEK_PLANS,
  ...((migratedData.plannedActivities as unknown as PlannedActivity[]) || [])
];

import { SEEDED_USERS } from '@/lib/constants/users';
import { authRepository } from '@/lib/repo/local/auth';
import { User } from '@/lib/types/user';
import { createClient } from '@/lib/supabase/client';

export const INITIAL_TEAM_MEMBERS: Profile[] = [
  {
    id: 'u0',
    email: 'adel.nasr@almespar.com',
    full_name: 'Adel Nasr',
    title: 'Sales Engineer',
    role: 'sales_engineer',
    phone: '966500000000',
    territory: 'Central Region (Riyadh)',
    monthly_target_sar: 450000,
    created_at: '2026-01-01',
    avatar_initials: 'AN'
  },
  {
    id: 'u1',
    email: 'eslam.almohandes@almespar.com',
    full_name: 'Eslam Al-Mohandes',
    title: 'Sales Engineer',
    role: 'sales_engineer',
    phone: '966500000001',
    territory: 'Western Region (Jeddah, Makkah, Medina)',
    monthly_target_sar: 500000,
    created_at: '2026-01-01',
    avatar_initials: 'EM'
  },
  {
    id: 'u2',
    email: 'abdelrahman.mohamed@almespar.com',
    full_name: 'Abdelrahman Mohamed',
    title: 'Sales Engineer',
    role: 'sales_engineer',
    phone: '966500000002',
    territory: 'Central Region (Riyadh)',
    monthly_target_sar: 400000,
    created_at: '2026-01-01',
    avatar_initials: 'AM'
  },
  {
    id: 'u3',
    email: 'ar.alkaffas@almespar.com',
    full_name: 'Abdelrahman El-Qaffas',
    title: 'Commercial Director & Managing Partner',
    role: 'admin',
    phone: '966500000003',
    territory: 'Kingdom-Wide (KSA)',
    monthly_target_sar: 2500000,
    created_at: '2026-01-01',
    avatar_initials: 'AQ'
  },
  {
    id: 'u4',
    email: 'karim.abdelazeez@almespar.com',
    full_name: 'Karim Abdelazeez',
    title: 'Sales Engineer',
    role: 'sales_engineer',
    phone: '966500000004',
    territory: 'Eastern Region (Dammam, Khobar)',
    monthly_target_sar: 450000,
    created_at: '2026-01-01',
    avatar_initials: 'KA'
  },
  {
    id: 'u5',
    email: 'ideslam0@gmail.com',
    full_name: 'Eslam',
    title: 'Executive System Administrator',
    role: 'admin',
    phone: '0125995614',
    territory: 'Kingdom of Saudi Arabia',
    monthly_target_sar: 5000000,
    created_at: '2026-01-01',
    avatar_initials: 'ES'
  },
  {
    id: 'u6',
    email: 'm.radwan@almespar.com',
    full_name: 'Mohamed Radwan',
    title: 'Sales Manager',
    role: 'sales_manager',
    phone: '966559209983',
    territory: 'Kingdom-Wide (KSA)',
    monthly_target_sar: 1500000,
    created_at: '2026-01-01',
    avatar_initials: 'MR'
  }
];

const INITIAL_TARGETS: SalesTarget[] = [
  { id: 't1', period_type: 'monthly', period_start: '2026-09-01', period_end: '2026-09-30', target_metric: 'calls', target_value: 80, current_actual: 65, created_at: '2026-09-01' },
  { id: 't2', period_type: 'monthly', period_start: '2026-09-01', period_end: '2026-09-30', target_metric: 'f2f_meetings', target_value: 20, current_actual: 18, created_at: '2026-09-01' },
  { id: 't3', period_type: 'monthly', period_start: '2026-09-01', period_end: '2026-09-30', target_metric: 'hunting_visits', target_value: 10, current_actual: 12, created_at: '2026-09-01' },
  { id: 't4', period_type: 'monthly', period_start: '2026-09-01', period_end: '2026-09-30', target_metric: 'quotations_sent', target_value: 15, current_actual: 11, created_at: '2026-09-01' },
  { id: 't5', period_type: 'monthly', period_start: '2026-09-01', period_end: '2026-09-30', target_metric: 'won_value', target_value: 500000, current_actual: 15962, created_at: '2026-09-01' },
];

import { computeProjectHealth } from '@/lib/utils';
export { computeProjectHealth };

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [teamMembers, setTeamMembers] = useState<Profile[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crmate_team_members');
      if (saved) {
        try { 
          const parsed: Profile[] = JSON.parse(saved);
          parsed.forEach(m => {
            if (m.id === 'u1') {
              m.role = 'sales_engineer';
              m.title = 'Sales Engineer';
              m.territory = 'Western Region (Jeddah, Makkah, Medina)';
            }
            if (m.id === 'u3') {
              m.full_name = 'Abdelrahman El-Qaffas';
              m.role = 'admin';
              m.title = 'Commercial Director & Managing Partner';
              m.territory = 'Kingdom-Wide (KSA)';
              m.avatar_initials = 'AQ';
            }
          });
          return parsed;
        } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_TEAM_MEMBERS;
  });

  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crmate_auth_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id) return parsed;
        } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_TEAM_MEMBERS[1] || INITIAL_TEAM_MEMBERS[0];
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('crmate_is_authenticated') === 'true' || Boolean(localStorage.getItem('al_mespar_session'));
    }
    return false;
  });
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crmate_auth_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.role) return parsed.role;
        } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_TEAM_MEMBERS[1]?.role || INITIAL_TEAM_MEMBERS[0].role;
  });
  const [selectedSalesFilter, setSelectedSalesFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crmate_auth_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.role === 'sales_engineer' || (parsed.role as string) === 'sales_rep')) {
            return parsed.id;
          }
        } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_TEAM_MEMBERS[1]?.id || 'all';
  });

  // Sync currentRole and default sales filter when user changes
  useEffect(() => {
    setCurrentRole(currentUser.role);
    if (currentUser.role === 'sales_engineer' || (currentUser.role as string) === 'sales_rep') {
      setSelectedSalesFilter(currentUser.id);
    } else {
      setSelectedSalesFilter('all');
    }
  }, [currentUser]);

  // Keep currentUser & session in sync on client mount and session change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = authRepository.getSession();
      const savedAuth = localStorage.getItem('crmate_is_authenticated');
      if (session || savedAuth === 'true') {
        setIsAuthenticated(true);
      }

      // Authoritative Supabase Auth session synchronization on mount
      const supabase = createClient();
      if (supabase) {
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user) {
            setIsAuthenticated(true);
            localStorage.setItem('crmate_is_authenticated', 'true');
            const userEmail = data.user.email?.toLowerCase();
            if (userEmail) {
              const matchedMember = teamMembers.find(m => m.email.toLowerCase() === userEmail) ||
                INITIAL_TEAM_MEMBERS.find(m => m.email.toLowerCase() === userEmail);
              if (matchedMember) {
                setCurrentUser(matchedMember);
                setCurrentRole(matchedMember.role);
                if (matchedMember.role === 'sales_engineer' || (matchedMember.role as string) === 'sales_rep') {
                  setSelectedSalesFilter(matchedMember.id);
                } else {
                  setSelectedSalesFilter('all');
                }
                localStorage.setItem('crmate_auth_user', JSON.stringify(matchedMember));
              }
            }
          }
        }).catch(() => {});
      }

      const authUser = authRepository.getCurrentUser();
      if (authUser) {
        const profile: Profile = {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.name,
          role: authUser.role,
          phone: authUser.phone || '966500000000',
          territory: authUser.territory,
          title: authUser.title,
          avatar_url: authUser.avatar_url,
          avatar_initials: (authUser.name || 'EM').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'EM',
          created_at: authUser.created_at
        };
        setCurrentUser(profile);
        setCurrentRole(authUser.role);
      } else {
        const saved = localStorage.getItem('crmate_auth_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCurrentUser(parsed);
            if (parsed.role) setCurrentRole(parsed.role);
          } catch (e) { /* fallback */ }
        }
      }
    }
  }, []);

  const login = async (emailOrUserId: string, password?: string): Promise<boolean> => {
    try {
      let user: User | null = null;
      if (password) {
        user = await authRepository.login(emailOrUserId, password);
      } else {
        user = authRepository.getUserById(emailOrUserId) || authRepository.getUserByEmail(emailOrUserId);
      }

      if (user) {
        const profile: Profile = {
          id: user.id,
          email: user.email,
          full_name: user.name,
          role: user.role,
          phone: user.phone || '966500000000',
          territory: user.territory,
          title: user.title,
          avatar_url: user.avatar_url,
          avatar_initials: (user.name || 'EM').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'EM',
          created_at: user.created_at
        };
        setCurrentUser(profile);
        setCurrentRole(profile.role);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login error in CRMContext', e);
      return false;
    }
  };

  const logout = () => {
    try {
      const supabase = createClient();
      if (supabase) {
        supabase.auth.signOut().catch(() => {});
      }
    } catch (e) {
      console.warn('Supabase signOut error:', e);
    }
    authRepository.logout();
    setIsAuthenticated(false);
  };

  const switchUser = (userId: string) => {
    const devUser = authRepository.switchUserDev(userId);
    if (typeof window !== 'undefined') {
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ switchUserId: userId })
      }).catch(() => {});
    }
    const member = teamMembers.find(m => m.id === userId);
    if (member) {
      setCurrentUser(member);
      setCurrentRole(member.role);
      if (member.role === 'sales_engineer' || (member.role as string) === 'sales_rep') {
        setSelectedSalesFilter(member.id);
      } else {
        setSelectedSalesFilter('all');
      }
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('crmate_auth_user', JSON.stringify(member));
        localStorage.setItem('crmate_is_authenticated', 'true');
      }
    } else if (devUser) {
      const profile: Profile = {
        id: devUser.id,
        email: devUser.email,
        full_name: devUser.name,
        role: devUser.role,
        phone: devUser.phone || '966500000000',
        territory: devUser.territory,
        title: devUser.title,
        avatar_url: devUser.avatar_url,
        avatar_initials: (devUser.name || 'EM').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'EM',
        created_at: devUser.created_at
      };
      setCurrentUser(profile);
      setCurrentRole(profile.role);
      if (profile.role === 'sales_engineer' || (profile.role as string) === 'sales_rep') {
        setSelectedSalesFilter(profile.id);
      } else {
        setSelectedSalesFilter('all');
      }
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('crmate_auth_user', JSON.stringify(profile));
        localStorage.setItem('crmate_is_authenticated', 'true');
      }
    }
  };

  const updateUserProfile = (userId: string, updates: Partial<Profile>) => {
    crmService.updateProfile(userId, updates).catch(console.warn);
    try {
      authRepository.updateProfile(userId, {
        ...(updates.full_name ? { name: updates.full_name } : {}),
        ...(updates.phone ? { phone: updates.phone } : {}),
        ...(updates.title ? { title: updates.title } : {}),
        ...(updates.territory ? { territory: updates.territory } : {}),
        ...(updates.avatar_url !== undefined ? { avatar_url: updates.avatar_url } : {}),
      });
    } catch (e) {
      console.error('Error updating auth profile:', e);
    }

    const updatedTeam = teamMembers.map(m => m.id === userId ? { ...m, ...updates } : m);
    setTeamMembers(updatedTeam);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crmate_team_members', JSON.stringify(updatedTeam));
    }

    if (currentUser.id === userId) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('crmate_auth_user', JSON.stringify({
          ...updatedUser,
          name: updatedUser.full_name
        }));
      }
    }
  };

  const addTeamMember = async (memberData: Omit<Profile, 'id' | 'created_at'> & { id?: string }): Promise<Profile> => {
    const newMember: Profile = {
      ...memberData,
      id: memberData.id || `u${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0]
    };
    const updated = [...teamMembers.filter(m => m.id !== newMember.id), newMember];
    setTeamMembers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crmate_team_members', JSON.stringify(updated));
    }
    return newMember;
  };

  const deleteTeamMember = async (userId: string): Promise<void> => {
    authRepository.deleteUser(userId);
    const updated = teamMembers.filter(m => m.id !== userId);
    setTeamMembers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crmate_team_members', JSON.stringify(updated));
    }
  };

  const [projects, setProjects] = useState<Project[]>(() => {
    let list = INITIAL_PROJECTS;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('al_mespar_projects');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            let next = parsed.some((p: any) => p.id === SEED_TAHLIA_PROJECT.id) 
              ? parsed 
              : [SEED_TAHLIA_PROJECT, ...parsed];
            if (!next.some((p: any) => p.id === SEED_WON_PROJECT.id)) {
              next = [SEED_WON_PROJECT, ...next];
            }
            list = next;
          }
        } catch (e) { /* fallback */ }
      }
    }
    return list.map(p => {
      const { health, daysOverdue } = computeProjectHealth(p);
      let card_color = p.card_color;
      let base_card_color = p.base_card_color;

      // Normalize stages: map pricing -> rfq_processing, technically_approved -> negotiation
      let pipeline_stage = p.pipeline_stage as string;
      if (pipeline_stage === 'pricing') pipeline_stage = 'rfq_processing';
      if (pipeline_stage === 'technically_approved') pipeline_stage = 'negotiation';

      if (pipeline_stage === 'won') {
        if (!base_card_color && card_color && card_color !== 'emerald' && card_color !== 'rose') {
          base_card_color = card_color;
        }
        card_color = 'emerald';
      } else if (pipeline_stage === 'lost') {
        if (!base_card_color && card_color && card_color !== 'emerald' && card_color !== 'rose') {
          base_card_color = card_color;
        }
        card_color = 'rose';
      } else {
        if (card_color === 'emerald' || card_color === 'rose') {
          card_color = base_card_color || 'default';
        }
      }

      // Default stage-specific workflow values
      const rfq_packages = p.rfq_packages || (pipeline_stage === 'rfq_processing' ? 'both' : undefined);
      const submittal_status = p.submittal_status || (pipeline_stage === 'technical_submission' ? 'under_approval' : pipeline_stage === 'negotiation' ? 'approved' : undefined);
      const client_target_price = p.client_target_price || (pipeline_stage === 'negotiation' ? Math.round((p.estimated_value || 100000) * 0.92) : undefined);
      const last_discount_pct = p.last_discount_pct ?? (pipeline_stage === 'negotiation' ? 8 : undefined);
      const systems = p.systems && p.systems.length > 0 
        ? p.systems 
        : (rfq_packages === 'lc' ? ['Lighting Control'] : rfq_packages === 'bms' ? ['BMS / BAS'] : rfq_packages === 'both' ? ['BMS / BAS', 'Lighting Control'] : []);

      const closing_date = p.closing_date || (p.opportunity_type === 'in_hand' ? (p.expected_award_date || '2026-11-30') : undefined);

      return { 
        ...p, 
        pipeline_stage: pipeline_stage as PipelineStage,
        closing_date,
        rfq_packages,
        systems,
        submittal_status,
        submittal_sent_at: p.submittal_sent_at || ((pipeline_stage === 'technical_submission' || pipeline_stage === 'technically_approved' || pipeline_stage === 'negotiation' || pipeline_stage === 'won') ? (p.stage_entered_at || p.updated_at || p.created_at) : undefined),
        client_target_price,
        last_discount_pct,
        contact_ids: p.contact_ids || (p.primary_contact_id ? [p.primary_contact_id] : []),
        card_color: card_color || 'default',
        base_card_color: base_card_color || (card_color !== 'emerald' && card_color !== 'rose' ? card_color : 'default'),
        owner_id: p.owner_id || 'u1', 
        owner_name: p.owner_name || 'Eslam Mohandes',
        stage_entered_at: p.stage_entered_at || p.updated_at || p.created_at,
        calculated_health: health, 
        days_overdue: daysOverdue 
      };
    });
  });

  const [teamProjects, setTeamProjects] = useState<Project[]>([]);

  const [isSyncingExcel, setIsSyncingExcel] = useState(false);
  const [lastExcelSyncTime, setLastExcelSyncTime] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('al_mespar_last_excel_sync');
    }
    return null;
  });

  const isSyncingExcelRef = React.useRef(false);
  const syncExcelNow = async (projectsToSync?: Project[]): Promise<{ success: boolean; message: string }> => {
    const list = projectsToSync || projects;
    if (!list || list.length === 0) {
      return { success: false, message: 'No projects to sync' };
    }
    if (isSyncingExcelRef.current) {
      return { success: false, message: 'Sync already in progress' };
    }
    isSyncingExcelRef.current = true;
    setIsSyncingExcel(true);
    try {
      const session = authRepository.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch('/api/sync-excel', {
        method: 'POST',
        headers,
        body: JSON.stringify({ projects: list })
      });
      const data = await res.json();
      if (res.status === 401) {
        return { success: false, message: 'Authentication required to sync Excel' };
      }
      if (res.status === 403) {
        return { success: false, message: 'Forbidden: Insufficient permissions to sync Excel' };
      }
      if (data.success) {
        const timeStr = data.displayTime || new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        setLastExcelSyncTime(timeStr);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('al_mespar_last_excel_sync', timeStr);
          } catch (e) {}
        }
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to sync with Excel' };
      }
    } catch (err: any) {
      console.error('Error syncing Excel:', err);
      return { success: false, message: err?.message || 'Network error' };
    } finally {
      isSyncingExcelRef.current = false;
      setIsSyncingExcel(false);
    }
  };

  // State refs for durable flush on page unload
  const projectsRef = React.useRef(projects);
  projectsRef.current = projects;
  const isInitialProjectsMount = React.useRef(true);

  // Synchronize server-side session in development/testing if token is legacy or absent
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const session = authRepository.getSession();
    const isExplicitlyLoggedOut = localStorage.getItem('crmate_explicit_logout') === 'true';
    if (!isExplicitlyLoggedOut && session?.token && (session.token.startsWith('auto_session_') || session.token.startsWith('token_'))) {
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devAutoSession: true })
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.token) {
          const current = authRepository.getSession();
          if (current) {
            current.token = data.token;
            localStorage.setItem('al_mespar_session', JSON.stringify(current));
          }
        }
      })
      .catch(() => {});
    }
  }, []);

  // Autosave to Excel on project changes (Debounced 2500ms) & Debounced localStorage batch
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Debounced localStorage write (350ms) to prevent micro-lag during drag & drop
    const lsTimer = setTimeout(() => {
      try {
        localStorage.setItem('al_mespar_projects', JSON.stringify(projects));
      } catch (e) {
        console.warn('LocalStorage save error for projects:', e);
      }
    }, 350);

    // Avoid autosaving to storage on initial mount
    if (isInitialProjectsMount.current) {
      isInitialProjectsMount.current = false;
      return () => clearTimeout(lsTimer);
    }

    return () => {
      clearTimeout(lsTimer);
    };
  }, [projects]);

  const [contacts, setContacts] = useState<Contact[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('al_mespar_contacts');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_CONTACTS;
  });

  const contactsRef = React.useRef(contacts);
  contactsRef.current = contacts;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('al_mespar_contacts', JSON.stringify(contacts));
      } catch (e) {}
    }, 350);
    return () => clearTimeout(timer);
  }, [contacts]);

  const [companies, setCompanies] = useState<Company[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('al_mespar_companies');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_COMPANIES;
  });

  const companiesRef = React.useRef(companies);
  companiesRef.current = companies;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('al_mespar_companies', JSON.stringify(companies));
      } catch (e) {}
    }, 350);
    return () => clearTimeout(timer);
  }, [companies]);

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => 
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true })
    );
  }, [companies]);

  const [activities, setActivities] = useState<Activity[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('al_mespar_activities');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const missingSeed = SEED_CURRENT_WEEK_ACTIVITIES.filter(s => !parsed.some((a: any) => a.id === s.id));
            return missingSeed.length > 0 ? [...missingSeed, ...parsed] : parsed;
          }
        } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_ACTIVITIES;
  });

  const activitiesRef = React.useRef(activities);
  activitiesRef.current = activities;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('al_mespar_activities', JSON.stringify(activities));
      } catch (e) {}
    }, 350);
    return () => clearTimeout(timer);
  }, [activities]);

  const [plannedActivities, setPlannedActivities] = useState<PlannedActivity[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('al_mespar_planned_activities');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const missingSeed = SEED_CURRENT_WEEK_PLANS.filter(s => !parsed.some((p: any) => p.id === s.id));
            return missingSeed.length > 0 ? [...missingSeed, ...parsed] : parsed;
          }
        } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_PLANNED_ACTIVITIES;
  });

  const plannedActivitiesRef = React.useRef(plannedActivities);
  plannedActivitiesRef.current = plannedActivities;

  // Synchronize follow-up planned activities from all activities on mount
  useEffect(() => {
    if (!activities || activities.length === 0) return;

    setPlannedActivities(prev => {
      let hasChanges = false;
      const currentPlans = [...prev];

      activities.forEach(act => {
        if (!act.next_action?.trim() || !act.next_follow_up_at?.trim()) return;
        const targetDate = extractDateOnly(act.next_follow_up_at);
        if (!targetDate) return;

        // Check if a planned activity already corresponds to this follow-up
        const matchIdx = currentPlans.findIndex(p => 
          p.follow_up_from_activity_id === act.id ||
          (p.scheduled_date === targetDate && (
            (act.project_id && p.project_id === act.project_id) ||
            (p.goal && p.goal.trim() === act.next_action?.trim())
          ))
        );

        if (matchIdx >= 0) {
          const existing = currentPlans[matchIdx];
          if (!existing.is_follow_up || existing.follow_up_from_activity_id !== act.id || existing.scheduled_date !== targetDate || existing.goal !== act.next_action.trim()) {
            currentPlans[matchIdx] = {
              ...existing,
              scheduled_date: targetDate,
              is_follow_up: true,
              follow_up_from_activity_id: act.id,
              goal: act.next_action.trim(),
              project_id: act.project_id || existing.project_id,
              project_name: act.project_name || existing.project_name,
              company_id: act.company_id || existing.company_id,
              company_name: act.company_name || existing.company_name,
              contact_id: act.contact_id || existing.contact_id,
              contact_name: act.contact_name || existing.contact_name,
            };
            hasChanges = true;
          }
        } else {
          currentPlans.unshift({
            id: 'plan_fu_' + act.id,
            weekly_plan_id: 'wp_' + targetDate.substring(0, 7),
            user_id: act.user_id || 'u1',
            user_name: act.user_name || 'Eslam Mohandes',
            project_id: act.project_id,
            project_name: act.project_name,
            company_id: act.company_id,
            company_name: act.company_name,
            contact_id: act.contact_id,
            contact_name: act.contact_name,
            location_name: act.location_name,
            google_maps_url: act.google_maps_url,
            scheduled_date: targetDate,
            time_slot: act.activity_time || '10:00 AM',
            channel: act.channel || 'call',
            visit_purpose: 'follow_up',
            goal: act.next_action.trim(),
            priority: (act.priority || 'high') as ProjectPriority,
            status: 'planned',
            is_follow_up: true,
            follow_up_from_activity_id: act.id,
            created_at: act.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          hasChanges = true;
        }
      });

      if (hasChanges) {
        if (typeof window !== 'undefined') {
          try { localStorage.setItem('al_mespar_planned_activities', JSON.stringify(currentPlans)); } catch (e) {}
        }
        return currentPlans;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('al_mespar_planned_activities', JSON.stringify(plannedActivities));
      } catch (e) {}
    }, 350);
    return () => clearTimeout(timer);
  }, [plannedActivities]);

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('al_mespar_quotations');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.some((q: any) => q.id === 'q_tahlia_v1')
              ? parsed
              : [...SEED_TAHLIA_QUOTATIONS, ...parsed];
          }
        } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_QUOTATIONS;
  });

  const quotationsRef = React.useRef(quotations);
  quotationsRef.current = quotations;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('al_mespar_quotations', JSON.stringify(quotations));
      } catch (e) {}
    }, 350);
    return () => clearTimeout(timer);
  }, [quotations]);

  const [salesTargets, setSalesTargets] = useState<SalesTarget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('al_mespar_sales_targets');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_TARGETS;
  });

  const salesTargetsRef = React.useRef(salesTargets);
  salesTargetsRef.current = salesTargets;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem('al_mespar_sales_targets', JSON.stringify(salesTargets));
        } catch (e) {}
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [salesTargets]);

  const [fastLogState, setFastLogState] = useState<FastLogModalState>({ isOpen: false });
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);

  // --- Reminder System State ---
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('al_mespar_reminders');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return [];
  });

  const remindersRef = React.useRef(reminders);
  remindersRef.current = reminders;

  // --- VIP Module State (Strictly Isolated from Pipeline) ---
  const [vipItems, setVipItems] = useState<VIPItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('al_mespar_vip_items');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return [];
  });

  const vipItemsRef = React.useRef(vipItems);
  vipItemsRef.current = vipItems;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem('al_mespar_vip_items', JSON.stringify(vipItems));
        } catch (e) {}
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [vipItems]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem('al_mespar_reminders', JSON.stringify(reminders));
        } catch (e) {}
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [reminders]);

  // Flush any pending updates immediately on tab close or background switch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const flushAllToLocalStorage = () => {
      try {
        if (projectsRef.current) localStorage.setItem('al_mespar_projects', JSON.stringify(projectsRef.current));
        if (contactsRef.current) localStorage.setItem('al_mespar_contacts', JSON.stringify(contactsRef.current));
        if (companiesRef.current) localStorage.setItem('al_mespar_companies', JSON.stringify(companiesRef.current));
        if (activitiesRef.current) localStorage.setItem('al_mespar_activities', JSON.stringify(activitiesRef.current));
        if (plannedActivitiesRef.current) localStorage.setItem('al_mespar_planned_activities', JSON.stringify(plannedActivitiesRef.current));
        if (quotationsRef.current) localStorage.setItem('al_mespar_quotations', JSON.stringify(quotationsRef.current));
        if (salesTargetsRef.current) localStorage.setItem('al_mespar_sales_targets', JSON.stringify(salesTargetsRef.current));
        if (remindersRef.current) localStorage.setItem('al_mespar_reminders', JSON.stringify(remindersRef.current));
        if (vipItemsRef.current) localStorage.setItem('al_mespar_vip_items', JSON.stringify(vipItemsRef.current));
      } catch (e) {
        console.warn('Failed to flush storage on unload:', e);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushAllToLocalStorage();
      }
    };

    window.addEventListener('beforeunload', flushAllToLocalStorage);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', flushAllToLocalStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const [reminderModalState, setReminderModalState] = useState<ReminderModalState>({ isOpen: false });

  const openReminder = (defaultValues?: Partial<Reminder>) => {
    setReminderModalState({ isOpen: true, defaultValues });
  };

  const closeReminder = () => {
    setReminderModalState(prev => ({ ...prev, isOpen: false }));
  };

  // Background checker: fires browser notifications for due reminders every 15s
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkReminders = () => {
      const now = new Date();
      setReminders(prev => {
        let changed = false;
        const updated = prev.map(r => {
          if (r.is_completed || r.notified) return r;
          const dueTime = new Date(`${r.reminder_date}T${r.reminder_time}:00`);
          if (dueTime <= now) {
            changed = true;
            // Fire browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              const urgencyTag = r.urgency === 'urgent' ? '🔴 URGENT' : r.urgency === 'high' ? '🟡 HIGH' : '🔔';
              new Notification(`${urgencyTag} ${r.title}`, {
                body: r.notes || (r.entity_name ? `Related to: ${r.entity_name}` : 'Reminder is due now'),
                icon: '/favicon.ico',
                tag: r.id,
              });
            }
            return { ...r, notified: true };
          }
          return r;
        });
        return changed ? updated : prev;
      });
    };

    checkReminders(); // Initial check
    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
  }, []);
  // --- End Reminder System State ---

  // Automated Follow-up Notifications for Quotation Sent Stage (3, 7, 10 Days)
  useEffect(() => {
    if (typeof window === 'undefined' || !projects.length) return;

    const checkQuotationFollowUps = () => {
      const existingNotifs = getAllNotifications();
      let hasNewNotif = false;
      const now = new Date().getTime();

      projects.forEach(p => {
        if (p.pipeline_stage !== 'quotation_sent' || p.is_archived) return;

        const enteredTime = new Date(p.stage_entered_at || p.updated_at || p.created_at).getTime();
        const daysElapsed = Math.max(0, Math.floor((now - enteredTime) / (1000 * 60 * 60 * 24)));

        let alertLevel: 3 | 7 | 10 | null = null;
        if (daysElapsed >= 10) alertLevel = 10;
        else if (daysElapsed >= 7) alertLevel = 7;
        else if (daysElapsed >= 3) alertLevel = 3;

        if (alertLevel !== null) {
          const notifId = `notif_quote_${alertLevel}d_${p.id}`;
          const alreadyExists = existingNotifs.some(n => n.id === notifId);
          if (!alreadyExists) {
            const title = alertLevel === 10
              ? `🚨 تنبيه حرج (10+ أيام): مشروع ${p.pr_number}`
              : alertLevel === 7
              ? `⚡ متابعة هامة (7 أيام): مشروع ${p.pr_number}`
              : `🔔 تذكير متابعة (3 أيام): مشروع ${p.pr_number}`;

            const body = alertLevel === 10
              ? `مرت 10 أيام أو أكثر على تقديم عرض السعر لمشروع "${p.name}" دون رد العميل (${p.company_name || ''}). يرجى المتابعة الفورية والتواصل مع ${p.primary_contact_name || 'مسؤول المشتريات'}.`
              : alertLevel === 7
              ? `مرت 7 أيام على إرسال عرض السعر لمشروع "${p.name}". ينصح بجدولة اتصال أو زيارة للمتابعة الفنية والتجارية.`
              : `مرت 3 أيام على إرسال عرض السعر لمشروع "${p.name}". يرجى التحقق من استلام العميل للعرض ومراجعته للشروط.`;

            createNotification({
              id: notifId,
              user_id: p.owner_id || 'u1',
              type: 'reminder_due',
              category: 'reminder',
              reference_type: 'reminder',
              reference_id: p.id,
              title,
              body,
              project_id: p.id,
              project_name: p.name,
            });
            hasNewNotif = true;
          }
        }
      });

      if (hasNewNotif) {
        setNotifications(getAllNotifications());
      }
    };

    checkQuotationFollowUps();
  }, [projects]);

  // --- Approval Requests System State ---
  const [requests, setRequests] = useState<ApprovalRequest[]>(() => getAllRequests());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getAllNotifications());
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestModalProject, setRequestModalProject] = useState<Project | null>(null);
  const [requestModalQuotationId, setRequestModalQuotationId] = useState<string | undefined>(undefined);
  const [selectedRequestIdForDetail, setSelectedRequestIdForDetail] = useState<string | null>(null);

  const openRequestModal = (project: Project, quotationId?: string) => {
    setRequestModalProject(project);
    setRequestModalQuotationId(quotationId);
    setIsRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    setRequestModalProject(null);
    setRequestModalQuotationId(undefined);
  };

  const openRequestDetail = (requestId: string) => {
    setSelectedRequestIdForDetail(requestId);
  };

  const closeRequestDetail = () => {
    setSelectedRequestIdForDetail(null);
  };

  // --- Interactive Module Guide System State ---
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeGuideModuleId, setActiveGuideModuleId] = useState<string | null>(null);

  const openGuide = (moduleId?: string) => {
    if (moduleId) {
      setActiveGuideModuleId(moduleId);
    }
    setIsGuideOpen(true);
  };

  const closeGuide = () => {
    setIsGuideOpen(false);
  };

  const createRequest = async (data: Omit<ApprovalRequest, 'id' | 'created_at' | 'updated_at' | 'comments' | 'status'>): Promise<ApprovalRequest> => {
    const { request: newReq } = createApprovalRequest(data);
    crmService.createApprovalRequest(newReq).catch(console.warn);
    setRequests(getAllRequests());
    setNotifications(getAllNotifications());
    return newReq;
  };

  const updateRequest = async (id: string, updates: Partial<ApprovalRequest>): Promise<void> => {
    crmService.updateApprovalRequest(id, updates).catch(console.warn);
    updateApprovalRequest(id, updates);
    setRequests(getAllRequests());
  };

  const resolveRequest = async (
    id: string, 
    resolution: { resolved_by: string; resolver_name?: string; status: 'approved' | 'rejected'; final_value?: number; reject_reason?: string }
  ): Promise<void> => {
    crmService.updateApprovalRequest(id, {
      status: resolution.status,
      resolution: {
        resolved_at: new Date().toISOString(),
        resolved_by: resolution.resolved_by,
        resolver_name: resolution.resolver_name || '',
        final_value: resolution.final_value,
        reject_reason: resolution.reject_reason
      }
    }).catch(console.warn);
    resolveApprovalRequest(id, resolution);
    setRequests(getAllRequests());
    setNotifications(getAllNotifications());
  };

  const addRequestComment = async (id: string, body: string): Promise<void> => {
    addCommentToRequest(id, {
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      body
    });
    setRequests(getAllRequests());
    setNotifications(getAllNotifications());
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    markNotificationAsRead(id);
    crmService.markNotificationRead(id).catch(console.warn);
  };

  const markAllNotificationsRead = (ids?: string[]) => {
    setNotifications(prev => prev.map(n => (!ids || ids.includes(n.id)) ? { ...n, is_read: true } : n));
    if (ids && ids.length > 0) {
      ids.forEach(id => markNotificationAsRead(id));
    } else {
      markAllNotificationsAsRead(currentUser.id);
    }
    crmService.markAllNotificationsRead(ids).catch(console.warn);
  };
  // --- End Approval Requests System State ---

  // --- Supabase Remote CRM Synchronization ---
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  const refreshData = React.useCallback(async () => {
    setIsDataLoading(true);
    setDataLoadError(null);
    try {
      const res = await crmService.fetchAllData();
      if (res.success && res.data) {
        const d = res.data;
        if (d.profiles && d.profiles.length > 0) {
          setTeamMembers(d.profiles);
          const currentMatch = d.profiles.find(
            p => p.id === currentUser.id || (currentUser.email && p.email.toLowerCase() === currentUser.email.toLowerCase())
          );
          if (currentMatch) {
            setCurrentUser(currentMatch);
            setCurrentRole(currentMatch.role);
            if (currentMatch.role === 'sales_engineer' || (currentMatch.role as string) === 'sales_rep') {
              setSelectedSalesFilter(currentMatch.id);
            }
            if (typeof window !== 'undefined') {
              localStorage.setItem('crmate_auth_user', JSON.stringify(currentMatch));
            }
          }
        }
        if (d.companies) setCompanies(d.companies);
        if (d.contacts) setContacts(d.contacts);
        if (d.projects) {
          const hydrated = d.projects.map(p => {
            const { health, daysOverdue } = computeProjectHealth(p);
            return {
              ...p,
              calculated_health: health,
              days_overdue: daysOverdue,
              card_color: p.card_color || 'default',
              base_card_color: p.base_card_color || 'default'
            };
          });
          setProjects(hydrated);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('al_mespar_projects', JSON.stringify(hydrated));
            } catch (e) { /* ignore */ }
          }
        }
        if (d.teamProjects) {
          const hydratedTeam = d.teamProjects.map(p => {
            const { health, daysOverdue } = computeProjectHealth(p);
            return {
              ...p,
              calculated_health: health,
              days_overdue: daysOverdue,
              card_color: p.card_color || 'default',
              base_card_color: p.base_card_color || 'default'
            };
          });
          setTeamProjects(hydratedTeam);
        }
        if (d.activities) setActivities(d.activities);
        if (d.plannedActivities) setPlannedActivities(d.plannedActivities);
        if (d.quotations) setQuotations(d.quotations);
        if (d.salesTargets) setSalesTargets(d.salesTargets);
        if (d.approvalRequests) setRequests(d.approvalRequests);
        if (d.reminders) setReminders(d.reminders);
        if (Array.isArray(d.vipItems)) setVipItems(d.vipItems);
        if (d.notifications) {
          setNotifications(d.notifications as unknown as AppNotification[]);
        }
      } else if (!res.success) {
        setDataLoadError(res.error);
      }
    } catch (err: any) {
      console.error('CRMate refreshData exception:', err);
      setDataLoadError(err?.message || 'Failed to load remote CRM data');
    } finally {
      setIsDataLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, refreshData]);
  // --- End Supabase Remote CRM Synchronization ---

  const openNewProjectModal = () => setIsNewProjectModalOpen(true);
  const closeNewProjectModal = () => setIsNewProjectModalOpen(false);
  const openNewContactModal = () => setIsNewContactModalOpen(true);
  const closeNewContactModal = () => setIsNewContactModalOpen(false);

  const openFastLog = (options?: {
    project?: Project | null;
    contactId?: string;
    plannedActivityId?: string;
    defaultGoal?: string;
    initialDate?: string;
    initialTime?: string;
    defaultChannel?: ActivityChannel;
    defaultPurpose?: VisitPurpose;
    initialTargetMode?: 'existing_project' | 'custom_project' | 'area_hunting';
    initialCustomProjectName?: string;
    initialCompanyName?: string;
    initialLocationName?: string;
    initialGoogleMapsUrl?: string;
    initialPriority?: ProjectPriority;
  }) => {
    setFastLogState({
      isOpen: true,
      project: options?.project,
      contactId: options?.contactId,
      plannedActivityId: options?.plannedActivityId,
      defaultGoal: options?.defaultGoal,
      initialDate: options?.initialDate,
      initialTime: options?.initialTime,
      defaultChannel: options?.defaultChannel,
      defaultPurpose: options?.defaultPurpose,
      initialTargetMode: options?.initialTargetMode,
      initialCustomProjectName: options?.initialCustomProjectName,
      initialCompanyName: options?.initialCompanyName,
      initialLocationName: options?.initialLocationName,
      initialGoogleMapsUrl: options?.initialGoogleMapsUrl,
      initialPriority: options?.initialPriority,
    });
  };

  const closeFastLog = () => {
    setFastLogState(prev => ({ ...prev, isOpen: false }));
  };

  // Re-calculate health periodically or on mount
  useEffect(() => {
    setProjects(prev => prev.map(p => {
      const { health, daysOverdue } = computeProjectHealth(p);
      return { ...p, calculated_health: health, days_overdue: daysOverdue };
    }));
  }, []);

  const addActivity = async (activityData: Omit<Activity, 'id' | 'created_at'>): Promise<Activity> => {
    const newActivity: Activity = {
      ...activityData,
      id: 'act_' + Date.now(),
      created_at: new Date().toISOString(),
    };

    setActivities(prev => [newActivity, ...prev]);
    crmService.createActivity(newActivity).catch(console.warn);

    // Update Project with Timestamp Integrity (Correction 1)
    if (newActivity.project_id) {
      setProjects(prev => prev.map(proj => {
        if (proj.id !== newActivity.project_id) return proj;

        const currentLastTime = proj.last_activity_at ? new Date(proj.last_activity_at).getTime() : 0;
        const activityTime = new Date(newActivity.activity_date + 'T' + (newActivity.activity_time || '12:00:00')).getTime();
        const isLatest = activityTime >= currentLastTime;

        const updatedProj: Project = {
          ...proj,
          last_activity_at: isLatest ? newActivity.activity_date : proj.last_activity_at,
          next_action: isLatest && newActivity.next_action ? newActivity.next_action : proj.next_action,
          next_follow_up_at: isLatest && newActivity.next_follow_up_at ? newActivity.next_follow_up_at : proj.next_follow_up_at,
          updated_at: new Date().toISOString(),
        };

        const { health, daysOverdue } = computeProjectHealth(updatedProj);
        return { ...updatedProj, calculated_health: health, days_overdue: daysOverdue };
      }));
    }

    // Update Contact with notes and last contacted date when activity is logged
    if (newActivity.contact_id) {
      setContacts(prev => prev.map(cnt => {
        if (cnt.id !== newActivity.contact_id) return cnt;
        
        // Append or update notes if new activity has notes
        const activityNote = newActivity.notes?.trim();
        let updatedNotes = cnt.notes || '';
        if (activityNote) {
          const dateHeader = `[${newActivity.activity_date} - ${newActivity.channel}]: ${activityNote}`;
          updatedNotes = updatedNotes 
            ? `${dateHeader}\n${updatedNotes}`
            : dateHeader;
        }

        return {
          ...cnt,
          notes: updatedNotes || cnt.notes,
          last_contacted_at: newActivity.activity_date,
          next_follow_up_at: newActivity.next_follow_up_at || cnt.next_follow_up_at,
          updated_at: new Date().toISOString()
        };
      }));
    }

    // Auto-schedule Follow-Up into Weekly Plan if next_action and next_follow_up_at exist
    if (newActivity.next_action?.trim() && newActivity.next_follow_up_at?.trim()) {
      const scheduledDate = extractDateOnly(newActivity.next_follow_up_at);
      if (scheduledDate) {
        const proj = projectsRef.current?.find(p => p.id === newActivity.project_id);
        const comp = companiesRef.current?.find(c => c.id === (newActivity.company_id || proj?.company_id));
        const contactId = newActivity.contact_id || proj?.primary_contact_id || proj?.contact_ids?.[0];
        const cont = contactsRef.current?.find(c => c.id === contactId);

        const followUpPlan: PlannedActivity = {
          id: 'plan_fu_' + newActivity.id,
          weekly_plan_id: 'wp_' + scheduledDate.substring(0, 7),
          user_id: newActivity.user_id || currentUser?.id || 'u1',
          user_name: newActivity.user_name || currentUser?.full_name || 'Eslam Mohandes',
          project_id: newActivity.project_id,
          project_name: newActivity.project_name || proj?.name,
          company_id: newActivity.company_id || proj?.company_id || comp?.id,
          company_name: newActivity.company_name || proj?.company_name || comp?.name,
          contact_id: contactId,
          contact_name: newActivity.contact_name || proj?.primary_contact_name || cont?.full_name,
          location_name: newActivity.location_name || proj?.location,
          google_maps_url: newActivity.google_maps_url,
          scheduled_date: scheduledDate,
          time_slot: newActivity.activity_time || '10:00 AM',
          channel: newActivity.channel || 'call',
          visit_purpose: 'follow_up',
          goal: newActivity.next_action.trim(),
          priority: (newActivity.priority || proj?.priority || 'high') as ProjectPriority,
          status: 'planned',
          is_follow_up: true,
          follow_up_from_activity_id: newActivity.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setPlannedActivities(prev => {
          const filtered = prev.filter(p => p.follow_up_from_activity_id !== newActivity.id);
          const updated = [followUpPlan, ...filtered];
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('al_mespar_planned_activities', JSON.stringify(updated)); } catch (e) {}
          }
          return updated;
        });
      }
    }

    return newActivity;
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    crmService.updateActivity(id, updates).catch(console.warn);
    let updatedAct: Activity | undefined;
    setActivities(prev => {
      const next = prev.map(a => {
        if (a.id === id) {
          updatedAct = { ...a, ...updates };
          return updatedAct;
        }
        return a;
      });
      return next;
    });

    setPlannedActivities(prev => {
      const act = updatedAct || activitiesRef.current?.find(a => a.id === id);
      const nextAction = (updates.next_action !== undefined ? updates.next_action : act?.next_action)?.trim();
      const rawDate = updates.next_follow_up_at !== undefined ? updates.next_follow_up_at : act?.next_follow_up_at;
      const scheduledDate = extractDateOnly(rawDate);

      const existingIdx = prev.findIndex(p => p.follow_up_from_activity_id === id);

      if (nextAction && scheduledDate) {
        const proj = projectsRef.current?.find(p => p.id === (updates.project_id || act?.project_id));
        const comp = companiesRef.current?.find(c => c.id === (updates.company_id || act?.company_id || proj?.company_id));
        const contactId = updates.contact_id || act?.contact_id || proj?.primary_contact_id || proj?.contact_ids?.[0];
        const cont = contactsRef.current?.find(c => c.id === contactId);

        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            goal: nextAction,
            scheduled_date: scheduledDate,
            is_follow_up: true,
            project_id: updates.project_id || act?.project_id || updated[existingIdx].project_id,
            project_name: updates.project_name || act?.project_name || proj?.name || updated[existingIdx].project_name,
            company_id: updates.company_id || act?.company_id || comp?.id || updated[existingIdx].company_id,
            company_name: updates.company_name || act?.company_name || comp?.name || updated[existingIdx].company_name,
            contact_id: contactId || updated[existingIdx].contact_id,
            contact_name: updates.contact_name || act?.contact_name || proj?.primary_contact_name || cont?.full_name || updated[existingIdx].contact_name,
            updated_at: new Date().toISOString(),
          };
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('al_mespar_planned_activities', JSON.stringify(updated)); } catch (e) {}
          }
          return updated;
        } else {
          const followUpPlan: PlannedActivity = {
            id: 'plan_fu_' + id,
            weekly_plan_id: 'wp_' + scheduledDate.substring(0, 7),
            user_id: act?.user_id || currentUser?.id || 'u1',
            user_name: act?.user_name || currentUser?.full_name || 'Eslam Mohandes',
            project_id: updates.project_id || act?.project_id,
            project_name: updates.project_name || act?.project_name || proj?.name,
            company_id: updates.company_id || act?.company_id || comp?.id,
            company_name: updates.company_name || act?.company_name || comp?.name,
            contact_id: contactId,
            contact_name: updates.contact_name || act?.contact_name || proj?.primary_contact_name || cont?.full_name,
            location_name: updates.location_name || act?.location_name || proj?.location,
            google_maps_url: updates.google_maps_url || act?.google_maps_url,
            scheduled_date: scheduledDate,
            time_slot: updates.activity_time || act?.activity_time || '10:00 AM',
            channel: updates.channel || act?.channel || 'call',
            visit_purpose: 'follow_up',
            goal: nextAction,
            priority: (updates.priority || act?.priority || proj?.priority || 'high') as ProjectPriority,
            status: 'planned',
            is_follow_up: true,
            follow_up_from_activity_id: id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const updated = [followUpPlan, ...prev];
          if (typeof window !== 'undefined') {
            try { localStorage.setItem('al_mespar_planned_activities', JSON.stringify(updated)); } catch (e) {}
          }
          return updated;
        }
      } else if (existingIdx >= 0 && (!nextAction || !scheduledDate)) {
        const updated = prev.filter(p => p.follow_up_from_activity_id !== id);
        if (typeof window !== 'undefined') {
          try { localStorage.setItem('al_mespar_planned_activities', JSON.stringify(updated)); } catch (e) {}
        }
        return updated;
      }
      return prev;
    });
  };

  const deleteActivity = async (id: string) => {
    crmService.deleteActivity(id).catch(console.warn);
    setActivities(prev => prev.filter(a => a.id !== id));
    setPlannedActivities(prev => {
      const updated = prev.filter(p => p.follow_up_from_activity_id !== id);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('al_mespar_planned_activities', JSON.stringify(updated)); } catch (e) {}
      }
      return updated;
    });
  };

  const addProject = async (projData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'weighted_value' | 'pr_number'> & { created_at?: string; pr_number?: string }): Promise<Project> => {
    const weighted = (projData.estimated_value * projData.probability) / 100;
    const stageColor = projData.pipeline_stage === 'won' ? 'emerald' : projData.pipeline_stage === 'lost' ? 'rose' : (projData.card_color || 'default');
    
    // Stage defaults
    const rfq_packages = projData.rfq_packages || (projData.pipeline_stage === 'rfq_processing' ? 'both' : undefined);
    const submittal_status = projData.submittal_status || (projData.pipeline_stage === 'technical_submission' ? 'under_approval' : projData.pipeline_stage === 'negotiation' ? 'approved' : undefined);
    const client_target_price = projData.client_target_price || (projData.pipeline_stage === 'negotiation' ? Math.round((projData.estimated_value || 100000) * 0.92) : undefined);
    const last_discount_pct = projData.last_discount_pct ?? (projData.pipeline_stage === 'negotiation' ? 8 : undefined);

    const nowIso = new Date().toISOString();
    let initialCreatedAt = nowIso;
    if (projData.created_at) {
      const parsed = new Date(projData.created_at);
      if (!isNaN(parsed.getTime())) {
        initialCreatedAt = parsed.toISOString();
      }
    }

    const newProj: Project = {
      ...projData,
      pr_number: projData.pr_number && projData.pr_number !== 'AUTO' ? projData.pr_number : 'PR...',
      rfq_packages,
      systems: projData.systems || (rfq_packages === 'lc' ? ['Lighting Control'] : rfq_packages === 'bms' ? ['BMS / BAS'] : rfq_packages === 'both' ? ['BMS / BAS', 'Lighting Control'] : []),
      submittal_status,
      submittal_sent_at: projData.submittal_sent_at || (projData.pipeline_stage === 'technical_submission' ? initialCreatedAt : undefined),
      client_target_price,
      last_discount_pct,
      card_color: stageColor,
      base_card_color: projData.base_card_color || (projData.card_color && projData.card_color !== 'emerald' && projData.card_color !== 'rose' ? projData.card_color : 'default'),
      id: 'p_' + Date.now(),
      weighted_value: weighted,
      stage_entered_at: initialCreatedAt,
      created_at: initialCreatedAt,
      updated_at: nowIso,
    };

    const persisted = await crmService.createProject(newProj);
    const targetProj = persisted || newProj;

    const { health, daysOverdue } = computeProjectHealth(targetProj);
    const hydrated = { ...targetProj, calculated_health: health, days_overdue: daysOverdue };
    setProjects(prev => [hydrated, ...prev]);

    // Bidirectional sync: link assigned contacts to this new project
    if (targetProj.contact_ids && targetProj.contact_ids.length > 0) {
      const assignedIds = new Set(targetProj.contact_ids);
      setContacts(prev => prev.map(c => {
        if (!assignedIds.has(c.id)) return c;
        const currentProjects = new Set(c.project_ids || []);
        currentProjects.add(hydrated.id);
        const nextIds = Array.from(currentProjects);
        crmService.updateContact(c.id, { project_ids: nextIds }).catch(console.warn);
        return { ...c, project_ids: nextIds };
      }));
    }

    return hydrated;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    crmService.updateProject(id, updates).catch(console.warn);
    setProjects(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p;
        const stageChanged = Boolean(updates.pipeline_stage && updates.pipeline_stage !== p.pipeline_stage);
        const stage_entered_at = stageChanged 
          ? new Date().toISOString() 
          : (updates.stage_entered_at || p.stage_entered_at || p.created_at);

        // Handle Automatic Card Color based on Won / Lost / Return:
        let newCardColor = updates.card_color ?? p.card_color;
        let newBaseCardColor = updates.base_card_color ?? p.base_card_color;
        const stageDefaults: Partial<Project> = {};

        if (stageChanged && updates.pipeline_stage) {
          const targetStage = updates.pipeline_stage;
          if (targetStage === 'won') {
            // If entering Won from an active stage, preserve the active stage color as base_card_color
            if (p.pipeline_stage !== 'won' && p.pipeline_stage !== 'lost') {
              newBaseCardColor = (p.card_color && p.card_color !== 'emerald' && p.card_color !== 'rose') 
                ? p.card_color 
                : (p.base_card_color || 'default');
            }
            newCardColor = 'emerald';
          } else if (targetStage === 'lost') {
            // If entering Lost from an active stage, preserve the active stage color as base_card_color
            if (p.pipeline_stage !== 'won' && p.pipeline_stage !== 'lost') {
              newBaseCardColor = (p.card_color && p.card_color !== 'emerald' && p.card_color !== 'rose') 
                ? p.card_color 
                : (p.base_card_color || 'default');
            }
            newCardColor = 'rose';
          } else {
            // Returning to any active/previous stage: restore original base card color!
            newCardColor = newBaseCardColor || 'default';
          }

          // Stage specific workflow defaults upon stage advancement:
          if (targetStage === 'rfq_processing') {
            if (!p.rfq_packages && !updates.rfq_packages) stageDefaults.rfq_packages = 'both';
          } else if (targetStage === 'technical_submission') {
            if (!p.submittal_status && !updates.submittal_status) stageDefaults.submittal_status = 'under_approval';
            if (!p.submittal_sent_at && !updates.submittal_sent_at) stageDefaults.submittal_sent_at = new Date().toISOString();
          } else if (targetStage === 'negotiation') {
            stageDefaults.submittal_status = 'approved';
            if (!p.client_target_price && !updates.client_target_price) {
              stageDefaults.client_target_price = Math.round((updates.estimated_value || p.estimated_value || 100000) * 0.92);
            }
            if (p.last_discount_pct === undefined && updates.last_discount_pct === undefined) {
              stageDefaults.last_discount_pct = 8;
            }
          }
        }

        const updated = { 
          ...p, 
          ...stageDefaults,
          ...updates, 
          card_color: newCardColor,
          base_card_color: newBaseCardColor,
          stage_entered_at,
          updated_at: new Date().toISOString() 
        };
        const { health, daysOverdue } = computeProjectHealth(updated);
        return { ...updated, calculated_health: health, days_overdue: daysOverdue };
      });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('al_mespar_projects', JSON.stringify(next));
        } catch (e) { /* ignore */ }
      }

      return next;
    });

    // Bidirectional sync with contacts if contact_ids was updated:
    if (updates.contact_ids !== undefined) {
      const newContactIds = new Set(updates.contact_ids);
      setContacts(prev => prev.map(c => {
        const hasContact = newContactIds.has(c.id);
        const currentProjects = new Set(c.project_ids || []);
        const hadProject = currentProjects.has(id);
        if (hasContact && !hadProject) {
          currentProjects.add(id);
          return { ...c, project_ids: Array.from(currentProjects) };
        } else if (!hasContact && hadProject) {
          currentProjects.delete(id);
          return { ...c, project_ids: Array.from(currentProjects) };
        }
        return c;
      }));
    }
  };

  const referProject = async (projectId: string, targetUserId: string) => {
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    const targetMember = teamMembers.find(m => m.id === targetUserId);
    if (!targetMember) return;

    const previousAssigneeId = targetProject.referred_to_id || targetProject.owner_id || 'u1';
    const previousAssignee = teamMembers.find(m => m.id === previousAssigneeId);
    const previousAssigneeName = targetProject.referred_to_name || targetProject.owner_name || previousAssignee?.full_name || 'مهندس المبيعات';

    const now = new Date().toISOString();
    const actorName = currentUser.full_name || 'المدير';
    const actorId = currentUser.id;

    // 1. Update project: CRITICAL - owner_id and owner_name are strictly PRESERVED as original creator!
    await updateProject(projectId, {
      referred_to_id: targetUserId,
      referred_to_name: targetMember.full_name,
      referred_at: now,
      referred_by_id: actorId,
      referred_by_name: actorName,
    });

    // 2. Notification to previous assignee (if not the target themselves)
    if (previousAssigneeId && previousAssigneeId !== targetUserId) {
      createNotification({
        user_id: previousAssigneeId,
        type: 'system_alert',
        category: 'system',
        reference_type: 'project',
        reference_id: targetProject.id,
        project_id: targetProject.id,
        project_name: targetProject.name,
        title: `🔄 إحالة مشروع: ${targetProject.name}`,
        body: `تمت إحالة مشروع "${targetProject.name}" (#${targetProject.pr_number}) منك إلى المهندس ${targetMember.full_name} بواسطة ${actorName}.`
      });
    }

    // 3. Notification to new assignee
    createNotification({
      user_id: targetUserId,
      type: 'system_alert',
      category: 'system',
      reference_type: 'project',
      reference_id: targetProject.id,
      project_id: targetProject.id,
      project_name: targetProject.name,
      title: `📥 تمت إحالة مشروع جديد إليك: ${targetProject.name}`,
      body: `تمت إحالة مشروع "${targetProject.name}" (#${targetProject.pr_number}) إليك من قبل ${actorName} (المشروع كان مع المهندس ${previousAssigneeName}).`
    });

    // 4. Record internal activity
    addActivity({
      project_id: targetProject.id,
      project_name: targetProject.name,
      user_id: actorId,
      user_name: actorName,
      activity_date: now.split('T')[0],
      activity_time: new Date().toTimeString().slice(0, 5),
      channel: 'office_work',
      visit_purpose: 'follow_up',
      outcome: 'connected',
      notes: `تمت إحالة المشروع من ${previousAssigneeName} إلى ${targetMember.full_name} بواسطة ${actorName}. المالك الأصلي: ${targetProject.owner_name || 'Eslam Mohandes'}.`,
    }).catch(console.warn);

    setNotifications(getAllNotifications());
  };

  const addContact = async (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> => {
    const newContact: Contact = {
      ...contactData,
      id: 'cnt_' + Date.now(),
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    crmService.createContact(newContact).catch(console.warn);
    setContacts(prev => [newContact, ...prev]);

    // Bidirectional sync: link assigned projects to this new contact
    if (contactData.project_ids && contactData.project_ids.length > 0) {
      const assignedProjectIds = new Set(contactData.project_ids);
      setProjects(prev => prev.map(p => {
        if (!assignedProjectIds.has(p.id)) return p;
        const currentContacts = new Set(p.contact_ids || (p.primary_contact_id ? [p.primary_contact_id] : []));
        currentContacts.add(newContact.id);
        const nextIds = Array.from(currentContacts);
        crmService.updateProject(p.id, { contact_ids: nextIds }).catch(console.warn);
        return { ...p, contact_ids: nextIds };
      }));
    }

    return newContact;
  };

  const addCompany = async (companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company> => {
    const newCompany: Company = {
      ...companyData,
      id: 'c_' + Date.now(),
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    crmService.createCompany(newCompany).catch(console.warn);
    setCompanies(prev => [newCompany, ...prev]);
    return newCompany;
  };

  const addPlannedActivity = async (planData: Omit<PlannedActivity, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<PlannedActivity> => {
    const newPlan: PlannedActivity = {
      ...planData,
      id: 'plan_' + Date.now(),
      status: 'planned',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    crmService.createPlannedActivity(newPlan).catch(console.warn);
    setPlannedActivities(prev => {
      const updated = [newPlan, ...prev];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('al_mespar_planned_activities', JSON.stringify(updated)); } catch (e) {}
      }
      return updated;
    });
    return newPlan;
  };

  const updatePlannedActivity = async (id: string, updates: Partial<PlannedActivity>) => {
    crmService.updatePlannedActivity(id, updates).catch(console.warn);
    setPlannedActivities(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('al_mespar_planned_activities', JSON.stringify(updated)); } catch (e) {}
      }
      return updated;
    });
  };

  const deletePlannedActivity = async (id: string) => {
    crmService.deletePlannedActivity(id).catch(console.warn);
    setPlannedActivities(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('al_mespar_planned_activities', JSON.stringify(updated)); } catch (e) {}
      }
      return updated;
    });
  };

  const completePlannedActivity = async (plannedId: string, activityData: Omit<Activity, 'id' | 'created_at' | 'planned_activity_id'>) => {
    const createdAct = await addActivity({
      ...activityData,
      planned_activity_id: plannedId,
    });

    crmService.updatePlannedActivity(plannedId, {
      status: 'completed',
      completed_activity_id: createdAct.id
    }).catch(console.warn);

    setPlannedActivities(prev => {
      const updated = prev.map(p => {
        if (p.id !== plannedId) return p;
        return {
          ...p,
          status: 'completed' as const,
          completed_activity_id: createdAct.id,
          updated_at: new Date().toISOString(),
        };
      });
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('al_mespar_planned_activities', JSON.stringify(updated)); } catch (e) {}
      }
      return updated;
    });
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    crmService.updateContact(id, updates).catch(console.warn);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));

    // Bidirectional sync with projects if project_ids was updated:
    if (updates.project_ids !== undefined) {
      const newProjectIds = new Set(updates.project_ids);
      setProjects(prev => prev.map(p => {
        const hasProject = newProjectIds.has(p.id);
        const currentContacts = new Set(p.contact_ids || (p.primary_contact_id ? [p.primary_contact_id] : []));
        const hadContact = currentContacts.has(id);
        if (hasProject && !hadContact) {
          currentContacts.add(id);
          return { ...p, contact_ids: Array.from(currentContacts) };
        } else if (!hasProject && hadContact) {
          currentContacts.delete(id);
          return { ...p, contact_ids: Array.from(currentContacts) };
        }
        return p;
      }));
    }
  };

  const deleteContact = async (id: string) => {
    crmService.deleteContact(id).catch(console.warn);
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    crmService.updateCompany(id, updates).catch(console.warn);
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
  };

  const deleteCompany = async (id: string) => {
    const isManagerOrAdmin = currentUser.role === 'admin' || currentUser.role === 'sales_manager';
    if (!isManagerOrAdmin) {
      console.warn('Unauthorized: Only sales_manager and admin can delete a company.');
      return;
    }
    crmService.deleteCompany(id).catch(console.warn);
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  const archiveProject = async (id: string, reason?: string) => {
    const targetProject = projects.find(p => p.id === id);
    if (!targetProject) return;

    crmService.archiveProject(id, reason).catch(console.warn);

    const now = new Date().toISOString();
    const actorName = currentUser.full_name || 'Sales Engineer';
    const actorId = currentUser.id || 'u1';

    // Soft delete: Mark project as archived
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        is_archived: true,
        archived_at: now,
        archived_by: actorId,
        archived_by_name: actorName,
        archive_reason: reason || '',
        updated_at: now
      };
    }));

    // Trigger in-app notifications for Manager, Admin, and Viewer
    const targetRoles: UserRole[] = ['sales_manager', 'admin', 'viewer'];
    const notifyMembers = teamMembers.filter(m => targetRoles.includes(m.role));

    notifyMembers.forEach(member => {
      createNotification({
        user_id: member.id,
        type: 'project_archived',
        category: 'system',
        reference_type: 'project',
        reference_id: targetProject.id,
        project_id: targetProject.id,
        project_name: targetProject.name,
        title: `📁 نقل مشروع للأرشيف: ${targetProject.name}`,
        body: `قام ${actorName} بنقل مشروع "${targetProject.name}" (#${targetProject.pr_number}) إلى الأرشيف${reason ? ` • السبب: "${reason}"` : ''}`
      });
    });

    setNotifications(getAllNotifications());
  };

  const restoreProject = async (id: string) => {
    const targetProject = projects.find(p => p.id === id);
    if (!targetProject) return;

    crmService.restoreProject(id).catch(console.warn);

    const now = new Date().toISOString();
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        is_archived: false,
        updated_at: now
      };
    }));
  };

  const deleteProject = async (id: string, reason?: string) => {
    crmService.deleteProject(id).catch(console.warn);
    await archiveProject(id, reason);
  };

  const updateSalesTarget = async (id: string, newTargetValue: number) => {
    crmService.updateSalesTarget(id, { target_value: newTargetValue }).catch(console.warn);
    setSalesTargets(prev => prev.map(t => t.id === id ? { ...t, target_value: newTargetValue, updated_at: new Date().toISOString() } : t));
  };

  const addQuotation = async (qData: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>): Promise<Quotation> => {
    // Determine database-safe next version if not explicitly provided
    const matchingQuotes = quotations.filter(
      q => q.project_id === qData.project_id && q.quotation_number === qData.quotation_number
    );
    const calculatedVersion = qData.version && qData.version > 0
      ? qData.version
      : matchingQuotes.length > 0
        ? Math.max(...matchingQuotes.map(q => q.version)) + 1
        : 1;

    const totalAmt = qData.total_amount ?? qData.amount;
    const newQuotation: Quotation = {
      ...qData,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      version: calculatedVersion,
      amount: totalAmt,
      total_amount: totalAmt,
      subtotal: qData.subtotal ?? totalAmt,
      discount_amount: qData.discount_amount ?? 0,
      discount_percentage: qData.discount_percentage ?? 0,
      tax_amount: qData.tax_amount ?? 0,
      currency: qData.currency || 'SAR',
      status: qData.status || 'submitted',
      quotation_date: qData.quotation_date || qData.sent_date || new Date().toISOString().split('T')[0],
      sent_date: qData.sent_date || qData.quotation_date || new Date().toISOString().split('T')[0],
      created_by: qData.created_by || currentUser.full_name || 'Eslam Mohandes',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setQuotations(prev => [newQuotation, ...prev]);

    // Background sync to Supabase
    quotationsService.insertQuotation(newQuotation).catch(console.warn);

    // Auto-log activity into project timeline
    addActivity({
      project_id: newQuotation.project_id,
      project_name: newQuotation.project_name || '',
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      activity_date: new Date().toISOString().split('T')[0],
      activity_time: new Date().toTimeString().slice(0, 5),
      channel: 'office_work',
      visit_purpose: 'quotation_delivery',
      outcome: 'quotation_sent',
      notes: `Quotation ${newQuotation.quotation_number} / V${newQuotation.version} recorded: SAR ${newQuotation.amount.toLocaleString()}.`,
    }).catch(console.warn);

    return newQuotation;
  };

  const createQuotationRevision = async (
    parentQuotationId: string, 
    revisionData: Partial<Quotation> & { revision_reason: string }
  ): Promise<Quotation> => {
    const parent = quotations.find(q => q.id === parentQuotationId);
    if (!parent) throw new Error('Parent quotation not found for revision.');

    const sameSeries = quotations.filter(
      q => q.project_id === parent.project_id && q.quotation_number === parent.quotation_number
    );
    const maxVersion = Math.max(...sameSeries.map(q => q.version), parent.version);
    const nextVersion = maxVersion + 1;

    const targetAmount = revisionData.amount ?? revisionData.total_amount ?? parent.amount;
    const newQuotation: Quotation = {
      ...parent,
      ...revisionData,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      version: nextVersion,
      amount: targetAmount,
      total_amount: targetAmount,
      previous_version_id: parentQuotationId,
      revision_reason: revisionData.revision_reason,
      status: revisionData.status || 'submitted',
      quotation_date: revisionData.quotation_date || new Date().toISOString().split('T')[0],
      sent_date: revisionData.sent_date || revisionData.quotation_date || new Date().toISOString().split('T')[0],
      created_by: currentUser.full_name || 'Eslam Mohandes',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Mark parent version as 'revised' if it was submitted / sent / under_review
    setQuotations(prev => {
      const updated = prev.map(q => {
        if (q.id === parentQuotationId && (q.status === 'sent' || q.status === 'submitted' || q.status === 'under_review')) {
          return { ...q, status: 'revised' as QuotationStatus, updated_at: new Date().toISOString() };
        }
        return q;
      });
      return [newQuotation, ...updated];
    });

    // Background sync to Supabase
    quotationsService.insertQuotation(newQuotation).catch(console.warn);
    quotationsService.updateStatus(parentQuotationId, 'revised').catch(console.warn);

    // Auto-log activity into project's timeline
    addActivity({
      project_id: newQuotation.project_id,
      project_name: newQuotation.project_name || '',
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      activity_date: new Date().toISOString().split('T')[0],
      activity_time: new Date().toTimeString().slice(0, 5),
      channel: 'office_work',
      visit_purpose: 'quotation_delivery',
      outcome: 'quotation_sent',
      notes: `Quotation Revision ${newQuotation.quotation_number} / V${newQuotation.version} issued: SAR ${newQuotation.amount.toLocaleString()} (Reason: ${newQuotation.revision_reason})`,
    }).catch(console.warn);

    return newQuotation;
  };

  const updateQuotationStatus = async (id: string, newStatus: QuotationStatus) => {
    const target = quotations.find(q => q.id === id);
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: newStatus, updated_at: new Date().toISOString() } : q));
    quotationsService.updateStatus(id, newStatus).catch(console.warn);

    if (target) {
      addActivity({
        project_id: target.project_id,
        project_name: target.project_name || '',
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        activity_date: new Date().toISOString().split('T')[0],
        activity_time: new Date().toTimeString().slice(0, 5),
        channel: 'office_work',
        visit_purpose: 'follow_up',
        outcome: newStatus === 'accepted' || newStatus === 'approved' ? 'won' : 'awaiting_feedback',
        notes: `Quotation ${target.quotation_number} / V${target.version} status updated to "${newStatus}".`,
      }).catch(console.warn);
    }
  };

  const archiveQuotation = async (id: string) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, is_archived: true, updated_at: new Date().toISOString() } : q));
    quotationsService.archiveQuotation(id).catch(console.warn);
  };

  const updateQuotation = async (id: string, updates: Partial<Quotation>) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updates, updated_at: new Date().toISOString() } : q));
    quotationsService.updateQuotation(id, updates).catch(console.warn);
  };

  const deleteQuotation = async (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
    quotationsService.deleteQuotation(id).catch(console.warn);
  };

  // --- Reminder CRUD Methods ---
  const addReminder = async (reminderData: Omit<Reminder, 'id' | 'created_at' | 'is_completed'>): Promise<Reminder> => {
    const newReminder: Reminder = {
      ...reminderData,
      id: 'rem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      is_completed: false,
      created_at: new Date().toISOString(),
    };
    crmService.createReminder(newReminder).catch(console.warn);
    setReminders(prev => [newReminder, ...prev]);

    // If manager/admin assigns a reminder to another user, trigger notification
    if (newReminder.user_id && newReminder.user_id !== currentUser.id) {
      createNotification({
        user_id: newReminder.user_id,
        type: 'reminder_due',
        category: 'reminder',
        reference_type: 'reminder',
        reference_id: newReminder.id,
        project_id: newReminder.project_id,
        project_name: newReminder.project_name,
        title: `⏰ تذكير جديد مسند إليك: ${newReminder.title}`,
        body: `قام ${currentUser.full_name} بإسناد تذكير ومتابعة لك بتاريخ ${newReminder.reminder_date} الساعة ${newReminder.reminder_time}.`
      });
      setNotifications(getAllNotifications());
    }

    return newReminder;
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    crmService.updateReminder(id, updates).catch(console.warn);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteReminder = async (id: string) => {
    crmService.deleteReminder(id).catch(console.warn);
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const toggleReminderCompleted = async (id: string) => {
    const target = reminders.find(r => r.id === id);
    if (target) {
      const nextCompleted = !target.is_completed;
      crmService.updateReminder(id, {
        is_completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : undefined
      }).catch(console.warn);
    }
    setReminders(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        is_completed: !r.is_completed,
        completed_at: !r.is_completed ? new Date().toISOString() : undefined,
      };
    }));
  };

  const completeAllReminders = async () => {
    setReminders(prev => prev.map(r => ({
      ...r,
      is_completed: true,
      completed_at: r.completed_at || new Date().toISOString(),
      notified: true
    })));
    // Also mark all reminder notifications as read in storage and state
    const allNotifs = getAllNotifications();
    const updated = allNotifs.map(n => {
      if (
        n.category === 'reminder' ||
        n.type === 'reminder_due' ||
        n.reference_type === 'reminder' ||
        n.id?.startsWith('notif_quote_')
      ) {
        return { ...n, is_read: true };
      }
      return n;
    });
    saveNotifications(updated);
    setNotifications(updated);
  };

  const completeAllPastPlannedActivities = async () => {
    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    setPlannedActivities(prev => {
      const updated = prev.map(p => {
        if (p.status === 'planned' && p.scheduled_date && p.scheduled_date < today) {
          return {
            ...p,
            status: 'completed' as const,
            completed_at: nowIso,
            updated_at: nowIso
          };
        }
        return p;
      });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('al_mespar_planned_activities', JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };
  // --- End Reminder CRUD Methods ---

  // ==========================================
  // VIP MODULE ACTIONS (PIPELINE-ISOLATED)
  // ==========================================
  const addVIPItem = async (
    itemData: Omit<VIPItem, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'status'> & {
      status?: VIPStatus;
      created_by?: string;
    }
  ): Promise<VIPItem> => {
    const tempId = 'vip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const candidateItem: VIPItem = {
      ...itemData,
      id: tempId,
      status: itemData.status || 'pending',
      created_by: itemData.created_by || currentUser.id || 'u1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Requirement 2: Supabase/API success is authoritative.
    // We await remote persistence BEFORE committing to in-memory state or localStorage.
    try {
      const persisted = await crmService.createVIPItem(candidateItem);
      const finalItem = persisted || candidateItem;

      // Commit to in-memory state only upon confirmed remote persistence
      setVipItems(prev => [finalItem, ...prev.filter(v => v.id !== finalItem.id)]);
      return finalItem;
    } catch (err: any) {
      console.error('Remote VIP creation failed:', err);
      throw new Error(err.message || 'فشل حفظ عنصر VIP في قاعدة البيانات السحابية');
    }
  };

  const updateVIPItem = async (id: string, updates: Partial<VIPItem>) => {
    const targetItem = vipItems.find(item => item.id === id);
    if (!targetItem) {
      throw new Error(`VIP item ${id} not found`);
    }

    // Capture exact previous state for reliable rollback
    const originalItem = { ...targetItem };

    // Apply optimistic update for smooth UI responsiveness
    setVipItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, ...updates, updated_at: new Date().toISOString() }
          : item
      )
    );

    try {
      const updated = await crmService.updateVIPItem(id, updates);
      if (updated) {
        // Reconcile with authoritative server state
        setVipItems(prev =>
          prev.map(item => (item.id === id ? updated : item))
        );
      }
    } catch (err: any) {
      // ROLLBACK: Revert strictly the affected item to its original state, preserving all other items
      setVipItems(prev =>
        prev.map(item => (item.id === id ? originalItem : item))
      );
      console.error('Remote VIP update failed, rolled back:', err);
      throw new Error(err.message || 'فشل تحديث عنصر VIP في قاعدة البيانات السحابية');
    }
  };

  const deleteVIPItem = async (id: string) => {
    // SAFEGUARD: Deleting a VIP item ONLY deletes from vipItems. NEVER deletes linked project, contact, or company.
    const itemToDelete = vipItems.find(item => item.id === id);
    if (!itemToDelete) return;

    // Apply optimistic deletion
    setVipItems(prev => prev.filter(item => item.id !== id));

    try {
      await crmService.deleteVIPItem(id);
    } catch (err: any) {
      // ROLLBACK: Restore the deleted item back into the state, preserving all other items
      setVipItems(prev => [itemToDelete, ...prev.filter(item => item.id !== id)]);
      console.error('Remote VIP deletion failed, rolled back:', err);
      throw new Error(err.message || 'فشل حذف عنصر VIP من قاعدة البيانات السحابية');
    }
  };

  const completeVIPItem = async (params: {
    vipId: string;
    channel: ActivityChannel;
    activityDate: string;
    activityTime?: string;
    completionNotes: string;
    nextAction?: string;
    nextFollowUpDate?: string;
    priority?: ProjectPriority;
  }): Promise<{ activity: Activity; plannedActivity?: PlannedActivity; vipItem: VIPItem }> => {
    const target = vipItems.find(v => v.id === params.vipId);
    if (!target) {
      throw new Error(`VIP item with id ${params.vipId} not found`);
    }

    // 1. If already completed with activity, return idempotent result immediately
    if (target.status === 'completed' && target.completed_activity_id) {
      const existingAct = activities.find(a => a.id === target.completed_activity_id);
      if (existingAct) {
        const existingPlan = target.completed_activity_id
          ? plannedActivities.find(p => p.follow_up_from_activity_id === target.completed_activity_id)
          : undefined;
        return { activity: existingAct, plannedActivity: existingPlan, vipItem: target };
      }
    }

    // Helper to resolve priority mapping
    const resolvePriority = (p?: ProjectPriority | VIPPriority): ProjectPriority => {
      if (p === 'normal') return 'medium';
      if (p === 'urgent' || p === 'high' || p === 'low' || p === 'medium') return p;
      return 'high';
    };

    // 2. Duplicate Activity Guard: Check if an activity was already created for this VIP item
    const expectedNotesPrefix = `[VIP ${target.category === 'revisit_project' ? 'Revisit' : 'Call'}: ${target.title}]`;
    let savedActivity: Activity | undefined = undefined;

    if (target.completed_activity_id) {
      savedActivity = activities.find(a => a.id === target.completed_activity_id);
    }
    if (!savedActivity) {
      savedActivity = activities.find(a => 
        a.user_id === (currentUser.id || 'u1') && 
        a.notes?.startsWith(expectedNotesPrefix)
      );
    }

    if (!savedActivity) {
      const activityPayload: Omit<Activity, 'id' | 'created_at'> = {
        user_id: currentUser.id || 'u1',
        user_name: currentUser.full_name || currentUser.email || 'Sales Engineer',
        activity_date: params.activityDate || new Date().toISOString().split('T')[0],
        activity_time: params.activityTime || '10:00',
        channel: params.channel,
        visit_purpose: target.category === 'revisit_project' ? 'follow_up' : 'customer_visit',
        outcome: 'connected',
        notes: `${expectedNotesPrefix} ${params.completionNotes}`,
        location_name: target.location_name,
        priority: resolvePriority(params.priority || target.priority),
        next_action: params.nextAction?.trim() || undefined,
        next_follow_up_at: params.nextFollowUpDate || undefined,
        project_id: target.project_id || undefined,
        project_name: target.project_name || (target.category === 'revisit_project' ? target.title : undefined),
        contact_id: target.contact_id || undefined,
        contact_name: target.contact_name || (target.category === 'vip_call' ? target.title : undefined),
        company_id: target.company_id || undefined,
        company_name: target.company_name || undefined,
      };

      savedActivity = await addActivity(activityPayload);
    }

    // 3. Duplicate Planned Activity Guard
    let savedPlan: PlannedActivity | undefined = undefined;
    if (params.nextAction?.trim() && params.nextFollowUpDate) {
      savedPlan = plannedActivities.find(p => 
        (savedActivity && p.follow_up_from_activity_id === savedActivity.id) ||
        (p.user_id === (currentUser.id || 'u1') && p.goal === params.nextAction!.trim() && p.scheduled_date === params.nextFollowUpDate)
      );

      if (!savedPlan) {
        const planPayload: Omit<PlannedActivity, 'id' | 'created_at' | 'updated_at' | 'status'> = {
          weekly_plan_id: 'wp_' + params.nextFollowUpDate.substring(0, 7).replace('-', '_'),
          user_id: currentUser.id || 'u1',
          user_name: currentUser.full_name || currentUser.email || 'Sales Engineer',
          scheduled_date: params.nextFollowUpDate,
          channel: params.channel,
          visit_purpose: 'follow_up',
          goal: params.nextAction.trim(),
          priority: resolvePriority(params.priority || target.priority),
          project_id: target.project_id || undefined,
          project_name: target.project_name || (target.category === 'revisit_project' ? target.title : undefined),
          contact_id: target.contact_id || undefined,
          contact_name: target.contact_name || (target.category === 'vip_call' ? target.title : undefined),
          company_id: target.company_id || undefined,
          company_name: target.company_name || undefined,
          location_name: target.location_name || undefined,
          follow_up_from_activity_id: savedActivity.id,
          is_follow_up: true,
        };
        savedPlan = await addPlannedActivity(planPayload);
      }
    }

    // 4. Update VIP item status to completed (with authoritative remote save & rollback)
    const completionUpdates: Partial<VIPItem> = {
      status: 'completed',
      completed_at: target.completed_at || new Date().toISOString(),
      completed_activity_id: savedActivity.id,
      completion_notes: params.completionNotes,
    };

    await updateVIPItem(target.id, completionUpdates);

    const updatedVip: VIPItem = {
      ...target,
      ...completionUpdates,
      updated_at: new Date().toISOString(),
    };

    return {
      activity: savedActivity,
      plannedActivity: savedPlan,
      vipItem: updatedVip,
    };
  };

  // --- Sales Data Importer & Merging Engine ---
  const importSalesData = async (
    data: {
      projects: Project[];
      companies: Company[];
      contacts: Contact[];
      activities: Activity[];
      plannedActivities: PlannedActivity[];
      quotations: Quotation[];
    },
    targetUserId: string,
    options: { mode?: 'merge' | 'replace' } = { mode: 'merge' }
  ): Promise<{
    projectsAdded: number;
    projectsUpdated: number;
    companiesAdded: number;
    contactsAdded: number;
    activitiesAdded: number;
    quotationsAdded: number;
  }> => {
    const targetMember = teamMembers.find(m => m.id === targetUserId) || currentUser;

    let pAdded = 0;
    let pUpdated = 0;
    let compAdded = 0;
    let cntAdded = 0;
    let actAdded = 0;
    let quoAdded = 0;

    // 1. Process Companies
    const nextCompanies = [...companies];
    data.companies.forEach(incComp => {
      const existingIdx = nextCompanies.findIndex(c => 
        c.normalized_name === incComp.normalized_name || 
        c.name.trim().toLowerCase() === incComp.name.trim().toLowerCase()
      );
      if (existingIdx >= 0) {
        const curr = nextCompanies[existingIdx];
        nextCompanies[existingIdx] = {
          ...curr,
          google_maps_url: curr.google_maps_url || incComp.google_maps_url,
          city: curr.city || incComp.city,
          phone: curr.phone || incComp.phone,
          notes: curr.notes || incComp.notes,
        };
      } else {
        nextCompanies.push(incComp);
        compAdded++;
      }
    });

    // 2. Process Contacts
    const nextContacts = [...contacts];
    data.contacts.forEach(incCnt => {
      const existingIdx = nextContacts.findIndex(c => {
        if (incCnt.phone && c.phone && c.phone === incCnt.phone) return true;
        return c.full_name.trim().toLowerCase() === incCnt.full_name.trim().toLowerCase();
      });
      if (existingIdx >= 0) {
        const curr = nextContacts[existingIdx];
        nextContacts[existingIdx] = {
          ...curr,
          is_hot_lead: curr.is_hot_lead || incCnt.is_hot_lead,
          job_title: curr.job_title || incCnt.job_title,
          email: curr.email || incCnt.email,
          city: curr.city || incCnt.city,
          notes: curr.notes ? `${curr.notes}\n${incCnt.notes || ''}`.trim() : incCnt.notes,
          next_follow_up_at: incCnt.next_follow_up_at || curr.next_follow_up_at,
          last_contacted_at: incCnt.last_contacted_at || curr.last_contacted_at,
        };
      } else {
        nextContacts.push(incCnt);
        cntAdded++;
      }
    });

    // 3. Process Projects
    const nextProjects = [...projects];
    data.projects.forEach(incProj => {
      const cleanPr = incProj.pr_number.toLowerCase().replace(/[^a-z0-9]/g, '');
      const existingIdx = nextProjects.findIndex(p => 
        p.pr_number.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanPr ||
        p.name.trim().toLowerCase() === incProj.name.trim().toLowerCase()
      );

      const targetProj: Project = {
        ...incProj,
        owner_id: targetMember.id,
        owner_name: targetMember.full_name,
      };

      if (existingIdx >= 0) {
        const curr = nextProjects[existingIdx];
        const merged: Project = {
          ...curr,
          ...targetProj,
          id: curr.id, // keep original ID
          estimated_value: targetProj.estimated_value || curr.estimated_value,
          weighted_value: targetProj.weighted_value || curr.weighted_value,
          updated_at: new Date().toISOString(),
        };
        const { health, daysOverdue } = computeProjectHealth(merged);
        merged.calculated_health = health;
        merged.days_overdue = daysOverdue;
        nextProjects[existingIdx] = merged;
        pUpdated++;
      } else {
        const { health, daysOverdue } = computeProjectHealth(targetProj);
        targetProj.calculated_health = health;
        targetProj.days_overdue = daysOverdue;
        nextProjects.unshift(targetProj);
        pAdded++;
      }
    });

    // 4. Process Activities
    const nextActivities = [...activities];
    data.activities.forEach(incAct => {
      const isDup = nextActivities.some(a => 
        a.activity_date === incAct.activity_date && 
        (a.notes === incAct.notes || (a.project_name && a.project_name === incAct.project_name))
      );
      if (!isDup) {
        nextActivities.unshift({
          ...incAct,
          user_id: targetMember.id,
          user_name: targetMember.full_name,
        });
        actAdded++;
      }
    });

    // 5. Process Planned Activities
    const nextPlanned = [...plannedActivities];
    data.plannedActivities.forEach(incPlan => {
      const isDup = nextPlanned.some(p => 
        p.scheduled_date === incPlan.scheduled_date && 
        p.goal === incPlan.goal
      );
      if (!isDup) {
        nextPlanned.push({
          ...incPlan,
          user_id: targetMember.id,
          user_name: targetMember.full_name,
        });
      }
    });

    // 6. Process Quotations
    const nextQuotations = [...quotations];
    data.quotations.forEach(incQ => {
      const existingIdx = nextQuotations.findIndex(q => q.quotation_number === incQ.quotation_number);
      if (existingIdx >= 0) {
        nextQuotations[existingIdx] = { ...nextQuotations[existingIdx], ...incQ };
      } else {
        nextQuotations.unshift(incQ);
        quoAdded++;
      }
    });

    // Save states
    setCompanies(nextCompanies);
    setContacts(nextContacts);
    setProjects(nextProjects);
    setActivities(nextActivities);
    setPlannedActivities(nextPlanned);
    setQuotations(nextQuotations);

    if (typeof window !== 'undefined') {
      localStorage.setItem('al_mespar_companies', JSON.stringify(nextCompanies));
      localStorage.setItem('al_mespar_contacts', JSON.stringify(nextContacts));
      localStorage.setItem('al_mespar_projects', JSON.stringify(nextProjects));
      localStorage.setItem('al_mespar_activities', JSON.stringify(nextActivities));
      localStorage.setItem('al_mespar_quotations', JSON.stringify(nextQuotations));
    }

    return {
      projectsAdded: pAdded,
      projectsUpdated: pUpdated,
      companiesAdded: compAdded,
      contactsAdded: cntAdded,
      activitiesAdded: actAdded,
      quotationsAdded: quoAdded,
    };
  };

  // ═══════════════════════════════════════════════════════════
  // INTERNAL CHAT & COLLABORATION SYSTEM
  // ═══════════════════════════════════════════════════════════
  const [conversations, setConversations] = useState<ChatConversation[]>(() => getStoredConversations());
  const [messages, setMessages] = useState<ChatMessage[]>(() => getStoredMessages());
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>('chan_west');
  const [draftProjectCard, setDraftProjectCard] = useState<ChatProjectCard | null>(null);

  // Independent Chat Unread Counter:
  // Strictly counts only unread messages where the current user is a participant and not the sender
  const chatUnreadCount = useMemo(() => {
    const userConversationIds = new Set(
      conversations.filter(c => c.participant_ids.includes(currentUser.id)).map(c => c.id)
    );
    return messages.filter(
      m => userConversationIds.has(m.conversation_id) &&
           m.sender_id !== currentUser.id &&
           (!m.read_by || !m.read_by.includes(currentUser.id))
    ).length;
  }, [conversations, messages, currentUser.id]);

  const markConversationRead = (conversationId: string) => {
    setMessages(prev => {
      let changed = false;
      const next = prev.map(m => {
        if (m.conversation_id === conversationId && (!m.read_by || !m.read_by.includes(currentUser.id))) {
          changed = true;
          return {
            ...m,
            read_by: [...(m.read_by || []), currentUser.id]
          };
        }
        return m;
      });
      if (changed) {
        saveStoredMessages(next);
      }
      return next;
    });
  };

  const openChat = (conversationId?: string) => {
    if (conversationId) {
      setActiveConversationId(conversationId);
      markConversationRead(conversationId);
    } else if (activeConversationId) {
      markConversationRead(activeConversationId);
    }
    setIsChatDrawerOpen(true);
  };

  const closeChat = () => {
    setIsChatDrawerOpen(false);
  };

  const getOrCreateDM = (targetUserId: string): ChatConversation => {
    const existing = conversations.find(
      c => c.type === 'direct' &&
           c.participant_ids.length === 2 &&
           c.participant_ids.includes(currentUser.id) &&
           c.participant_ids.includes(targetUserId)
    );
    if (existing) return existing;

    const sortedPair = [currentUser.id, targetUserId].sort();
    const newDmId = `dm_${sortedPair[0]}_${sortedPair[1]}`;
    
    const existingById = conversations.find(c => c.id === newDmId);
    if (existingById) return existingById;

    const newDm: ChatConversation = {
      id: newDmId,
      type: 'direct',
      participant_ids: [currentUser.id, targetUserId],
      last_message: '',
      last_message_at: new Date().toISOString(),
      last_sender_name: currentUser.full_name,
      created_at: new Date().toISOString(),
      created_by: currentUser.id
    };

    setConversations(prev => {
      const next = [newDm, ...prev];
      saveStoredConversations(next);
      return next;
    });
    return newDm;
  };

  const createChannel = async (name: string, name_ar: string, description: string, participant_ids: string[]): Promise<ChatConversation> => {
    const channelId = `chan_${Date.now()}`;
    const uniqueParticipants = Array.from(new Set([...participant_ids, currentUser.id]));
    const newChan: ChatConversation = {
      id: channelId,
      type: 'channel',
      name,
      name_ar,
      description,
      participant_ids: uniqueParticipants,
      last_message: 'تم تدشين القناة',
      last_message_at: new Date().toISOString(),
      last_sender_name: currentUser.full_name,
      created_at: new Date().toISOString(),
      created_by: currentUser.id
    };

    setConversations(prev => {
      const next = [newChan, ...prev];
      saveStoredConversations(next);
      return next;
    });
    return newChan;
  };

  const sendMessage = async (params: {
    conversationId: string;
    content: string;
    mentions?: string[];
    projectCard?: ChatProjectCard;
    planTaskCard?: ChatPlanTaskCard;
    attachments?: ChatAttachment[];
  }): Promise<ChatMessage> => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversation_id: params.conversationId,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      sender_role: currentUser.role,
      content: params.content,
      mentions: params.mentions || [],
      project_card: params.projectCard,
      plan_task_card: params.planTaskCard,
      attachments: params.attachments,
      created_at: new Date().toISOString(),
      read_by: [currentUser.id]
    };

    setMessages(prev => {
      const next = [...prev, newMsg];
      saveStoredMessages(next);
      return next;
    });

    let summary = params.content || '';
    if (!summary && params.projectCard) summary = `[مشروع: ${params.projectCard.name}]`;
    if (!summary && params.planTaskCard) summary = `[خطة: ${params.planTaskCard.title}]`;

    setConversations(prev => {
      const next = prev.map(c => {
        if (c.id === params.conversationId) {
          return {
            ...c,
            last_message: summary,
            last_message_at: newMsg.created_at,
            last_sender_name: currentUser.full_name
          };
        }
        return c;
      });
      saveStoredConversations(next);
      return next;
    });

    return newMsg;
  };

  const shareProjectToChat = async ({
    projectId,
    conversationId,
    comment
  }: {
    projectId: string;
    conversationId?: string;
    comment?: string;
  }) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const projectCard: ChatProjectCard = {
      project_id: proj.id,
      pr_number: proj.pr_number,
      name: proj.name,
      company_name: proj.company_name,
      estimated_value: proj.estimated_value,
      pipeline_stage: proj.pipeline_stage,
      opportunity_type: proj.opportunity_type,
      closing_date: proj.closing_date,
      owner_id: proj.owner_id,
      owner_name: proj.owner_name
    };

    // Attach as draft message without auto-sending ("كـ message من غير to")
    setDraftProjectCard(projectCard);
    setActiveConversationId(conversationId || null);
    setIsChatDrawerOpen(true);
  };

  const grantProjectAccessFromChat = async ({
    messageId,
    projectId,
    targetUserId,
    targetUserName,
    role = 'co_sales_engineer'
  }: {
    messageId: string;
    projectId: string;
    targetUserId: string;
    targetUserName: string;
    role?: 'co_sales_engineer' | 'lead_estimator' | 'technical_support' | 'executive_sponsor';
  }): Promise<boolean> => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return false;

    // Guard: Owner already has full control, cannot be added as a member to own project
    if (targetUserId === proj.owner_id) {
      return false;
    }

    const existingMembers = proj.members || [];
    const alreadyMember = existingMembers.some(m => m.user_id === targetUserId);
    if (!alreadyMember) {
      const newMember: ProjectMember = {
        project_id: projectId,
        user_id: targetUserId,
        role,
        user_name: targetUserName,
        assigned_at: new Date().toISOString()
      };
      const updatedMembers = [...existingMembers, newMember];
      await updateProject(projectId, { members: updatedMembers });
    }

    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      await sendMessage({
        conversationId: msg.conversation_id,
        content: `✅ تم منح صلاحية الوصول للمشروع "${proj.name}" إلى ${targetUserName} بنجاح.`
      });
    }

    return true;
  };

  const sharePlanTaskToChat = async ({
    taskId,
    targetUserId,
    comment,
    conversationId
  }: {
    taskId: string;
    targetUserId: string;
    comment: string;
    conversationId?: string;
  }) => {
    const task = plannedActivities.find(p => p.id === taskId);
    if (!task) return;

    // Strictly resolve the employee who owns/created the planned task
    const resolvedEmployeeId = targetUserId || task.user_id || (task as any).sales_rep_id || 'u1';
    const targetUser = teamMembers.find(t => t.id === resolvedEmployeeId);

    // Get or create DM strictly between current manager and this specific employee
    const dm = getOrCreateDM(resolvedEmployeeId);
    const targetConvId = conversationId || dm.id;

    const taskTitle = (task as any).goal || (task as any).title || 'مهمة ميدانية';
    const clientName = task.company_name || task.contact_name || task.custom_target || '';
    const taskDate = task.scheduled_date || (task as any).planned_date || new Date().toISOString().split('T')[0];

    const planCard: ChatPlanTaskCard = {
      task_id: task.id,
      title: taskTitle,
      client_name: clientName,
      project_id: task.project_id,
      planned_date: taskDate,
      channel: task.channel,
      assigned_to_id: resolvedEmployeeId,
      assigned_to_name: task.user_name || targetUser?.full_name || 'مهندس المبيعات',
      assigned_by_id: currentUser.id,
      assigned_by_name: currentUser.full_name,
      manager_comment: comment,
      status: 'pending'
    };

    await sendMessage({
      conversationId: targetConvId,
      content: comment ? `💬 توجيه إداري بخصوص الخطة الميدانية: ${comment}` : `مهمة الخطة الميدانية: ${taskTitle}`,
      planTaskCard: planCard
    });

    setActiveConversationId(targetConvId);
    openChat(targetConvId);
  };

  const reschedulePlanTaskFromChat = async ({
    messageId,
    taskId,
    daysToAdd = 7
  }: {
    messageId: string;
    taskId: string;
    daysToAdd?: number;
  }) => {
    const task = plannedActivities.find(p => p.id === taskId);
    const msg = messages.find(m => m.id === messageId);

    const baseDateStr = task?.scheduled_date || (task as any)?.planned_date || msg?.plan_task_card?.planned_date || new Date().toISOString().split('T')[0];
    const currentPlanDate = new Date(baseDateStr);
    currentPlanDate.setDate(currentPlanDate.getDate() + daysToAdd);
    const newDateStr = currentPlanDate.toISOString().split('T')[0];

    if (task) {
      await updatePlannedActivity(taskId, {
        scheduled_date: newDateStr,
        rescheduled_to_date: newDateStr,
        status: 'rescheduled'
      });
    }

    setMessages(prev => {
      const next = prev.map(m => {
        if (m.id === messageId && m.plan_task_card) {
          return {
            ...m,
            plan_task_card: {
              ...m.plan_task_card,
              status: 'rescheduled' as const,
              planned_date: newDateStr
            }
          };
        }
        return m;
      });
      saveStoredMessages(next);
      return next;
    });

    const taskTitle = task?.goal || msg?.plan_task_card?.title || 'المهمة';
    if (msg) {
      await sendMessage({
        conversationId: msg.conversation_id,
        content: `📅 تم تأجيل مهمة "${taskTitle}" بنجاح إلى تاريخ ${newDateStr}. الخطة الميدانية محدثة الآن.`
      });
    }
  };

  const acknowledgePlanTaskFromChat = async ({
    messageId,
    taskId,
    note
  }: {
    messageId: string;
    taskId: string;
    note?: string;
  }) => {
    setMessages(prev => {
      const next = prev.map(m => {
        if (m.id === messageId && m.plan_task_card) {
          return {
            ...m,
            plan_task_card: {
              ...m.plan_task_card,
              status: 'acknowledged' as const
            }
          };
        }
        return m;
      });
      saveStoredMessages(next);
      return next;
    });

    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      await sendMessage({
        conversationId: msg.conversation_id,
        content: `👍 تم تأكيد المهمة والاطلاع على الملاحظات.${note ? ` (${note})` : ''}`
      });
    }
  };

  const assignTaskFromChatToPlan = async (params: {
    targetUserId: string;
    title: string;
    clientName?: string;
    projectId?: string;
    plannedDate: string;
    channel: ActivityChannel;
    purpose: VisitPurpose;
    notes?: string;
  }): Promise<PlannedActivity> => {
    const targetUser = teamMembers.find(t => t.id === params.targetUserId);
    const newPlan = await addPlannedActivity({
      weekly_plan_id: `wp_${params.targetUserId}_${params.plannedDate.substring(0, 7)}`,
      user_id: params.targetUserId,
      user_name: targetUser?.full_name || 'مهندس المبيعات',
      scheduled_date: params.plannedDate,
      time_slot: '10:00 AM',
      goal: params.title,
      company_name: params.clientName,
      project_id: params.projectId,
      channel: params.channel,
      visit_purpose: params.purpose,
      priority: 'high',
      is_auto_suggested: false
    });

    const dm = getOrCreateDM(params.targetUserId);
    await sendMessage({
      conversationId: dm.id,
      content: `🎯 تم إدراج تكليف جديد في خطتك الميدانية: "${params.title}" بتاريخ ${params.plannedDate}.`,
      planTaskCard: {
        task_id: newPlan.id,
        title: newPlan.goal,
        client_name: newPlan.company_name,
        project_id: newPlan.project_id,
        planned_date: newPlan.scheduled_date,
        channel: newPlan.channel,
        assigned_to_id: params.targetUserId,
        assigned_to_name: targetUser?.full_name || '',
        assigned_by_id: currentUser.id,
        assigned_by_name: currentUser.full_name,
        manager_comment: params.notes,
        status: 'pending'
      }
    });

    return newPlan;
  };

  const contextValue = useMemo(() => ({
    isDataLoading,
    dataLoadError,
    refreshData,
    importSalesData,
    currentRole,
    setCurrentRole,
    currentUser,
    isAuthenticated,
    teamMembers,
    selectedSalesFilter,
    setSelectedSalesFilter,
    login,
    logout,
    switchUser,
    updateUserProfile,
    addTeamMember,
    deleteTeamMember,
    projects,
    teamProjects,
    contacts,
    companies: sortedCompanies,
    activities,
    plannedActivities,
    quotations,
    salesTargets,
    fastLogState,
    openFastLog,
    closeFastLog,
    isNewProjectModalOpen,
    openNewProjectModal,
    closeNewProjectModal,
    isNewContactModalOpen,
    openNewContactModal,
    closeNewContactModal,
    addActivity,
    updateActivity,
    deleteActivity,
    addProject,
    updateProject,
    referProject,
    deleteProject,
    archiveProject,
    restoreProject,
    addContact,
    updateContact,
    deleteContact,
    addCompany,
    updateCompany,
    deleteCompany,
    addPlannedActivity,
    updatePlannedActivity,
    deletePlannedActivity,
    completePlannedActivity,
    updateSalesTarget,
    addQuotation,
    createQuotationRevision,
    updateQuotation,
    updateQuotationStatus,
    archiveQuotation,
    deleteQuotation,
    // Reminder system
    reminders,
    reminderModalState,
    openReminder,
    closeReminder,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderCompleted,
    completeAllReminders,
    completeAllPastPlannedActivities,
    // VIP Module
    vipItems,
    addVIPItem,
    updateVIPItem,
    deleteVIPItem,
    completeVIPItem,
    // Approval Requests System
    requests,
    createRequest,
    updateRequest,
    resolveRequest,
    addRequestComment,
    isRequestModalOpen,
    requestModalProject,
    requestModalQuotationId,
    openRequestModal,
    closeRequestModal,
    selectedRequestIdForDetail,
    openRequestDetail,
    closeRequestDetail,
    // Notifications
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    // Interactive Module Guide System
    isGuideOpen,
    activeGuideModuleId,
    openGuide,
    closeGuide,
    // Real-time Excel Synchronization
    isSyncingExcel,
    lastExcelSyncTime,
    syncExcelNow,
    // Internal Team Chat & Collaboration System
    conversations,
    messages,
    isChatDrawerOpen,
    activeConversationId,
    chatUnreadCount,
    draftProjectCard,
    setDraftProjectCard,
    openChat,
    closeChat,
    setActiveConversationId,
    sendMessage,
    markConversationRead,
    createChannel,
    getOrCreateDM,
    shareProjectToChat,
    grantProjectAccessFromChat,
    sharePlanTaskToChat,
    reschedulePlanTaskFromChat,
    acknowledgePlanTaskFromChat,
    assignTaskFromChatToPlan,
  }), [
    isDataLoading,
    dataLoadError,
    refreshData,
    importSalesData,
    currentRole,
    setCurrentRole,
    currentUser,
    isAuthenticated,
    teamMembers,
    selectedSalesFilter,
    setSelectedSalesFilter,
    login,
    logout,
    switchUser,
    updateUserProfile,
    addTeamMember,
    deleteTeamMember,
    projects,
    teamProjects,
    contacts,
    sortedCompanies,
    activities,
    plannedActivities,
    quotations,
    salesTargets,
    fastLogState,
    openFastLog,
    closeFastLog,
    isNewProjectModalOpen,
    openNewProjectModal,
    closeNewProjectModal,
    isNewContactModalOpen,
    openNewContactModal,
    closeNewContactModal,
    addActivity,
    updateActivity,
    deleteActivity,
    addProject,
    updateProject,
    referProject,
    deleteProject,
    archiveProject,
    restoreProject,
    addContact,
    updateContact,
    deleteContact,
    addCompany,
    updateCompany,
    deleteCompany,
    addPlannedActivity,
    updatePlannedActivity,
    deletePlannedActivity,
    completePlannedActivity,
    updateSalesTarget,
    addQuotation,
    createQuotationRevision,
    updateQuotation,
    updateQuotationStatus,
    archiveQuotation,
    deleteQuotation,
    reminders,
    reminderModalState,
    openReminder,
    closeReminder,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderCompleted,
    completeAllReminders,
    completeAllPastPlannedActivities,
    vipItems,
    addVIPItem,
    updateVIPItem,
    deleteVIPItem,
    completeVIPItem,
    requests,
    createRequest,
    updateRequest,
    resolveRequest,
    addRequestComment,
    isRequestModalOpen,
    requestModalProject,
    requestModalQuotationId,
    openRequestModal,
    closeRequestModal,
    selectedRequestIdForDetail,
    openRequestDetail,
    closeRequestDetail,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    isGuideOpen,
    activeGuideModuleId,
    openGuide,
    closeGuide,
    isSyncingExcel,
    lastExcelSyncTime,
    syncExcelNow,
    conversations,
    messages,
    isChatDrawerOpen,
    activeConversationId,
    chatUnreadCount,
    draftProjectCard,
    setDraftProjectCard,
    openChat,
    closeChat,
    setActiveConversationId,
    sendMessage,
    markConversationRead,
    createChannel,
    getOrCreateDM,
    shareProjectToChat,
    grantProjectAccessFromChat,
    sharePlanTaskToChat,
    reschedulePlanTaskFromChat,
    acknowledgePlanTaskFromChat,
    assignTaskFromChatToPlan,
  ]);

  return (
    <CRMContext.Provider value={contextValue}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
