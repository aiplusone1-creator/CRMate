'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Project, Contact, Company, Activity, PlannedActivity, 
  Quotation, SalesTarget, UserRole, Profile, ProjectHealth,
  Reminder, ReminderUrgency, ApprovalRequest, AppNotification
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
  addContact: (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => Promise<Contact>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  addCompany: (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => Promise<Company>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addPlannedActivity: (planned: Omit<PlannedActivity, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<PlannedActivity>;
  updatePlannedActivity: (id: string, updates: Partial<PlannedActivity>) => Promise<void>;
  deletePlannedActivity: (id: string) => Promise<void>;
  completePlannedActivity: (plannedId: string, activityData: Omit<Activity, 'id' | 'created_at' | 'planned_activity_id'>) => Promise<void>;
  updateSalesTarget: (id: string, newTargetValue: number) => Promise<void>;
  addQuotation: (quotation: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>) => Promise<Quotation>;
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
}

import migratedData from '@/lib/data/migrated_data.json';

// Authentic Western Region Dataset extracted via Safe Migration Pipeline (Phase 10)
const INITIAL_COMPANIES: Company[] = (migratedData.companies as unknown as Company[]) || [];
const INITIAL_CONTACTS: Contact[] = (migratedData.contacts as unknown as Contact[]) || [];

// Tag all existing 34 authentic projects strictly to Eslam Mohandes (Western Region Senior Sales Engineer)
const RAW_PROJECTS: Project[] = (migratedData.projects as unknown as Project[]) || [];
const INITIAL_PROJECTS: Project[] = RAW_PROJECTS.map(p => ({
  ...p,
  owner_id: p.owner_id || 'u1',
  owner_name: p.owner_name || 'Eslam Mohandes'
}));

const INITIAL_QUOTATIONS: Quotation[] = (migratedData.quotations as unknown as Quotation[]) || [];

const RAW_ACTIVITIES: Activity[] = (migratedData.activities as unknown as Activity[]) || [];
const INITIAL_ACTIVITIES: Activity[] = RAW_ACTIVITIES.map(a => ({
  ...a,
  user_id: a.user_id || 'u1',
  user_name: a.user_name || 'Eslam Mohandes'
}));

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

  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    if (typeof window !== 'undefined') {
      const authUser = authRepository.getCurrentUser();
      if (authUser) {
        return {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.name,
          role: authUser.role,
          phone: authUser.phone || '966500000000',
          territory: authUser.territory,
          title: authUser.title,
          avatar_url: authUser.avatar_url,
          avatar_initials: authUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
          created_at: authUser.created_at
        };
      }
      const saved = localStorage.getItem('crmate_auth_user');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return INITIAL_TEAM_MEMBERS[0]; // Defaults to Eslam Al-Mohandes
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const session = authRepository.getSession();
      if (session) return true;
      const saved = localStorage.getItem('crmate_is_authenticated');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(currentUser.role);
  const [selectedSalesFilter, setSelectedSalesFilter] = useState<string>('all');

  // Sync currentRole when user changes
  useEffect(() => {
    setCurrentRole(currentUser.role);
  }, [currentUser]);

  // Keep currentUser in sync if session changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authUser = authRepository.getCurrentUser();
      if (authUser && authUser.id !== currentUser.id) {
        const profile: Profile = {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.name,
          role: authUser.role,
          phone: authUser.phone || '966500000000',
          territory: authUser.territory,
          title: authUser.title,
          avatar_url: authUser.avatar_url,
          avatar_initials: authUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
          created_at: authUser.created_at
        };
        setCurrentUser(profile);
        setCurrentRole(authUser.role);
        setIsAuthenticated(true);
      }
    }
  }, [currentUser.id]);

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
          avatar_initials: user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
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
        avatar_initials: devUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
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
        try { list = JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return list.map(p => {
      const { health, daysOverdue } = computeProjectHealth(p);
      return { 
        ...p, 
        owner_id: p.owner_id || 'u1', 
        owner_name: p.owner_name || 'Eslam Mohandes',
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
  const [activities, setActivities] = useState<Activity[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('al_mespar_activities');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
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
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
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
    const newProj: Project = {
      ...projData,
      id: 'p_' + Date.now(),
      weighted_value: weighted,
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
      const updated = { ...p, ...updates, updated_at: new Date().toISOString() };
      const { health, daysOverdue } = computeProjectHealth(updated);
      return { ...updated, calculated_health: health, days_overdue: daysOverdue };
    }));
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
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const updateSalesTarget = async (id: string, newTargetValue: number) => {
    setSalesTargets(prev => prev.map(t => t.id === id ? { ...t, target_value: newTargetValue, updated_at: new Date().toISOString() } : t));
  };

  const addQuotation = async (qData: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>): Promise<Quotation> => {
    const newQuotation: Quotation = {
      ...qData,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setQuotations(prev => [newQuotation, ...prev]);
    return newQuotation;
  };

  const deleteQuotation = async (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
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
      companies,
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
      deleteProject,
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
