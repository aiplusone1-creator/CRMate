'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  Project, Contact, Company, Activity, PlannedActivity, 
  Quotation, QuotationStatus, SalesTarget, UserRole, Profile, ProjectHealth,
  Reminder, ReminderUrgency, ApprovalRequest, AppNotification, PipelineStage
} from '@/types/crm';
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
}

export interface ReminderModalState {
  isOpen: boolean;
  defaultValues?: Partial<Reminder>;
}

interface CRMContextType {
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
  addTeamMember: (member: Omit<Profile, 'id' | 'created_at'>) => Promise<Profile>;
  projects: Project[];
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
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'weighted_value'>) => Promise<Project>;
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
  markAllNotificationsRead: () => void;
  // Interactive Module Guide System
  isGuideOpen: boolean;
  activeGuideModuleId: string | null;
  openGuide: (moduleId?: string) => void;
  closeGuide: () => void;
}

import migratedData from '@/lib/data/migrated_data.json';
import { quotationsService } from '@/lib/supabase/quotations-service';

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

const SEED_CURRENT_WEEK_ACTIVITIES: Activity[] = [
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
    user_id: 'u1',
    user_name: 'Eslam Mohandes',
    created_at: '2026-09-20T11:30:00Z',
  }
];

const INITIAL_ACTIVITIES: Activity[] = [...SEED_CURRENT_WEEK_ACTIVITIES, ...MAPPED_ACTIVITIES];

const INITIAL_PLANNED_ACTIVITIES: PlannedActivity[] = (migratedData.plannedActivities as unknown as PlannedActivity[]) || [];

import { SEEDED_USERS } from '@/lib/constants/users';
import { authRepository } from '@/lib/repo/local/auth';
import { User } from '@/lib/types/user';

export const INITIAL_TEAM_MEMBERS: Profile[] = [
  {
    id: 'u1',
    email: 'eslam.almohandes@almespar.com',
    full_name: 'Eslam Al-Mohandes',
    title: 'Senior Sales Engineer',
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
    full_name: 'Abdurahman Al-Kaffas',
    title: 'Regional Sales Manager',
    role: 'sales_manager',
    phone: '966500000003',
    territory: 'Kingdom-Wide (KSA)',
    monthly_target_sar: 2500000,
    created_at: '2026-01-01',
    avatar_initials: 'AK'
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
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_TEAM_MEMBERS;
  });

  const [currentUser, setCurrentUser] = useState<Profile>(INITIAL_TEAM_MEMBERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>(INITIAL_TEAM_MEMBERS[0].role);
  const [selectedSalesFilter, setSelectedSalesFilter] = useState<string>(() => {
    return (INITIAL_TEAM_MEMBERS[0].role === 'sales_engineer' || (INITIAL_TEAM_MEMBERS[0].role as string) === 'sales_rep')
      ? INITIAL_TEAM_MEMBERS[0].id
      : 'all';
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
    authRepository.logout();
    setIsAuthenticated(false);
  };

  const switchUser = (userId: string) => {
    const devUser = authRepository.switchUserDev(userId);
    const member = teamMembers.find(m => m.id === userId);
    if (member) {
      setCurrentUser(member);
      setCurrentRole(member.role);
      setIsAuthenticated(true);
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
      setIsAuthenticated(true);
    }
  };

  const updateUserProfile = (userId: string, updates: Partial<Profile>) => {
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

  const addTeamMember = async (memberData: Omit<Profile, 'id' | 'created_at'>): Promise<Profile> => {
    const newMember: Profile = {
      ...memberData,
      id: `u${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0]
    };
    const updated = [...teamMembers, newMember];
    setTeamMembers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crmate_team_members', JSON.stringify(updated));
    }
    return newMember;
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

      return { 
        ...p, 
        pipeline_stage: pipeline_stage as PipelineStage,
        rfq_packages,
        submittal_status,
        client_target_price,
        last_discount_pct,
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('al_mespar_projects', JSON.stringify(projects));
    }
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('al_mespar_contacts', JSON.stringify(contacts));
    }
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('al_mespar_companies', JSON.stringify(companies));
    }
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
            const hasTahliaAct = parsed.some((a: any) => a.id === 'act_tahlia_v4_submittal');
            return hasTahliaAct ? parsed : [...SEED_CURRENT_WEEK_ACTIVITIES, ...parsed];
          }
        } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_ACTIVITIES;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('al_mespar_activities', JSON.stringify(activities));
    }
  }, [activities]);

  const [plannedActivities, setPlannedActivities] = useState<PlannedActivity[]>(INITIAL_PLANNED_ACTIVITIES);
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('al_mespar_quotations', JSON.stringify(quotations));
    }
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('al_mespar_sales_targets', JSON.stringify(salesTargets));
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('al_mespar_reminders', JSON.stringify(reminders));
    }
  }, [reminders]);

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
    setRequests(getAllRequests());
    setNotifications(getAllNotifications());
    return newReq;
  };

  const updateRequest = async (id: string, updates: Partial<ApprovalRequest>): Promise<void> => {
    updateApprovalRequest(id, updates);
    setRequests(getAllRequests());
  };

  const resolveRequest = async (
    id: string, 
    resolution: { resolved_by: string; resolver_name?: string; status: 'approved' | 'rejected'; final_value?: number; reject_reason?: string }
  ): Promise<void> => {
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
    markNotificationAsRead(id);
    setNotifications(getAllNotifications());
  };

  const markAllNotificationsRead = () => {
    markAllNotificationsAsRead(currentUser.id);
    setNotifications(getAllNotifications());
  };
  // --- End Approval Requests System State ---

  const openNewProjectModal = () => setIsNewProjectModalOpen(true);
  const closeNewProjectModal = () => setIsNewProjectModalOpen(false);
  const openNewContactModal = () => setIsNewContactModalOpen(true);
  const closeNewContactModal = () => setIsNewContactModalOpen(false);

  const openFastLog = (options?: {
    project?: Project | null;
    contactId?: string;
    plannedActivityId?: string;
    defaultGoal?: string;
  }) => {
    setFastLogState({
      isOpen: true,
      project: options?.project,
      contactId: options?.contactId,
      plannedActivityId: options?.plannedActivityId,
      defaultGoal: options?.defaultGoal,
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

    return newActivity;
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteActivity = async (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const addProject = async (projData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'weighted_value'>): Promise<Project> => {
    const weighted = (projData.estimated_value * projData.probability) / 100;
    const stageColor = projData.pipeline_stage === 'won' ? 'emerald' : projData.pipeline_stage === 'lost' ? 'rose' : (projData.card_color || 'default');
    
    // Stage defaults
    const rfq_packages = projData.rfq_packages || (projData.pipeline_stage === 'rfq_processing' ? 'both' : undefined);
    const submittal_status = projData.submittal_status || (projData.pipeline_stage === 'technical_submission' ? 'under_approval' : projData.pipeline_stage === 'negotiation' ? 'approved' : undefined);
    const client_target_price = projData.client_target_price || (projData.pipeline_stage === 'negotiation' ? Math.round((projData.estimated_value || 100000) * 0.92) : undefined);
    const last_discount_pct = projData.last_discount_pct ?? (projData.pipeline_stage === 'negotiation' ? 8 : undefined);

    const newProj: Project = {
      ...projData,
      rfq_packages,
      submittal_status,
      client_target_price,
      last_discount_pct,
      card_color: stageColor,
      base_card_color: projData.base_card_color || (projData.card_color && projData.card_color !== 'emerald' && projData.card_color !== 'rose' ? projData.card_color : 'default'),
      id: 'p_' + Date.now(),
      weighted_value: weighted,
      stage_entered_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { health, daysOverdue } = computeProjectHealth(newProj);
    const hydrated = { ...newProj, calculated_health: health, days_overdue: daysOverdue };
    setProjects(prev => [hydrated, ...prev]);
    return hydrated;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => {
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
    }));
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setContacts(prev => [newContact, ...prev]);
    return newContact;
  };

  const addCompany = async (companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company> => {
    const newCompany: Company = {
      ...companyData,
      id: 'c_' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
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
    setPlannedActivities(prev => [newPlan, ...prev]);
    return newPlan;
  };

  const updatePlannedActivity = async (id: string, updates: Partial<PlannedActivity>) => {
    setPlannedActivities(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
  };

  const deletePlannedActivity = async (id: string) => {
    setPlannedActivities(prev => prev.filter(p => p.id !== id));
  };

  const completePlannedActivity = async (plannedId: string, activityData: Omit<Activity, 'id' | 'created_at' | 'planned_activity_id'>) => {
    const createdAct = await addActivity({
      ...activityData,
      planned_activity_id: plannedId,
    });

    setPlannedActivities(prev => prev.map(p => {
      if (p.id !== plannedId) return p;
      return {
        ...p,
        status: 'completed',
        completed_activity_id: createdAct.id,
        updated_at: new Date().toISOString(),
      };
    }));
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
  };

  const deleteContact = async (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
  };

  const deleteCompany = async (id: string) => {
    const isManagerOrAdmin = currentUser.role === 'admin' || currentUser.role === 'sales_manager';
    if (!isManagerOrAdmin) {
      console.warn('Unauthorized: Only sales_manager and admin can delete a company.');
      return;
    }
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  const archiveProject = async (id: string, reason?: string) => {
    const targetProject = projects.find(p => p.id === id);
    if (!targetProject) return;

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
    await archiveProject(id, reason);
  };

  const updateSalesTarget = async (id: string, newTargetValue: number) => {
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
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteReminder = async (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const toggleReminderCompleted = async (id: string) => {
    setReminders(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        is_completed: !r.is_completed,
        completed_at: !r.is_completed ? new Date().toISOString() : undefined,
      };
    }));
  };
  // --- End Reminder CRUD Methods ---

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

  return (
    <CRMContext.Provider value={{
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
      projects,
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
    }}>
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
