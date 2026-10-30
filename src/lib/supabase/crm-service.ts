import { 
  Project, 
  Company, 
  Contact, 
  Activity, 
  PlannedActivity, 
  Quotation, 
  SalesTarget, 
  ApprovalRequest, 
  Reminder,
  AppNotification,
  Profile,
  VIPItem 
} from '@/types/crm';
import { createClient } from '@/lib/supabase/client';

export interface CRMDataSet {
  profiles: Profile[];
  companies: Company[];
  contacts: Contact[];
  projects: Project[];
  quotations: Quotation[];
  activities: Activity[];
  plannedActivities: PlannedActivity[];
  salesTargets: SalesTarget[];
  approvalRequests: ApprovalRequest[];
  notifications: AppNotification[];
  reminders: Reminder[];
  vipItems?: VIPItem[];
  teamProjects?: Project[];
}

export type FetchAllDataResult = 
  | { success: true; data: CRMDataSet }
  | { success: false; error: string; code?: string; status?: number };

/**
 * CRMate Client Data Service.
 * Communicates with authenticated server endpoints (/api/crm/data and /api/crm/mutate)
 * which enforce server-side validation and Supabase PostgreSQL persistence.
 */
export const crmService = {
  isConfigured(): boolean {
    return true;
  },

  /**
   * Fetch complete CRM shared team dataset from Supabase through authenticated server endpoint
   */
  async fetchAllData(): Promise<FetchAllDataResult> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      try {
        const supabase = createClient();
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.access_token) {
            headers['Authorization'] = `Bearer ${data.session.access_token}`;
          }
        }
      } catch (e) {
        // Fallback to cookie authentication
      }

      const res = await fetch(`/api/crm/data?t=${Date.now()}`, {
        method: 'GET',
        headers,
        cache: 'no-store'
      });

      if (!res.ok) {
        let errMessage = 'Failed to load CRM data';
        let code = 'ERROR';
        try {
          const errJson = await res.json();
          errMessage = errJson.error || errJson.details || errMessage;
          code = errJson.code || code;
        } catch { /* ignore */ }
        return { success: false, error: errMessage, code, status: res.status };
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        return { success: false, error: json.error || 'Invalid server response structure', code: 'INVALID_RESPONSE' };
      }

      return { success: true, data: json.data as CRMDataSet };
    } catch (e: any) {
      console.error('Network exception fetching CRM data:', e);
      return { success: false, error: e?.message || 'Network communication error', code: 'NETWORK_ERROR' };
    }
  },

  /**
   * Internal mutation helper
   */
  async mutate<T = any>(
    entity: string,
    action: 'insert' | 'update' | 'delete' | 'archive' | 'restore',
    payload?: { id?: string; data?: any }
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      try {
        const supabase = createClient();
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.access_token) {
            headers['Authorization'] = `Bearer ${data.session.access_token}`;
          }
        }
      } catch (e) {
        // Fallback to cookie authentication
      }

      const res = await fetch('/api/crm/mutate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entity,
          action,
          id: payload?.id,
          data: payload?.data
        })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        console.warn(`CRMate mutation error (${entity}.${action}):`, json.error);
        return { success: false, error: json.error || 'Server mutation rejected' };
      }

      return { success: true, data: json.data as T };
    } catch (e: any) {
      console.error(`Mutation exception (${entity}.${action}):`, e);
      return { success: false, error: e?.message || 'Network mutation failure' };
    }
  },

  // ==========================================
  // PROJECTS
  // ==========================================
  async createProject(project: Partial<Project>): Promise<Project | null> {
    const res = await this.mutate<Project>('projects', 'insert', { data: project });
    return res.success && res.data ? res.data : null;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const res = await this.mutate<Project>('projects', 'update', { id, data: updates });
    return res.success && res.data ? res.data : null;
  },

  async deleteProject(id: string): Promise<boolean> {
    const res = await this.mutate('projects', 'delete', { id });
    return res.success;
  },

  async archiveProject(id: string, reason?: string): Promise<Project | null> {
    const res = await this.mutate<Project>('projects', 'archive', { id, data: { archive_reason: reason } });
    return res.success && res.data ? res.data : null;
  },

  async restoreProject(id: string): Promise<Project | null> {
    const res = await this.mutate<Project>('projects', 'restore', { id });
    return res.success && res.data ? res.data : null;
  },

  // Legacy compatibility helpers
  async fetchProjects(): Promise<Project[] | null> {
    const all = await this.fetchAllData();
    return all.success ? all.data.projects : null;
  },

  async upsertProject(project: Partial<Project> & { id: string }): Promise<boolean> {
    const res = await this.updateProject(project.id, project);
    return Boolean(res);
  },

  // ==========================================
  // COMPANIES
  // ==========================================
  async createCompany(company: Partial<Company>): Promise<Company | null> {
    const res = await this.mutate<Company>('companies', 'insert', { data: company });
    return res.success && res.data ? res.data : null;
  },

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company | null> {
    const res = await this.mutate<Company>('companies', 'update', { id, data: updates });
    return res.success && res.data ? res.data : null;
  },

  async deleteCompany(id: string): Promise<boolean> {
    const res = await this.mutate('companies', 'delete', { id });
    return res.success;
  },

  async fetchCompanies(): Promise<Company[] | null> {
    const all = await this.fetchAllData();
    return all.success ? all.data.companies : null;
  },

  async upsertCompany(company: Partial<Company> & { id: string }): Promise<boolean> {
    const res = await this.updateCompany(company.id, company);
    return Boolean(res);
  },

  // ==========================================
  // CONTACTS
  // ==========================================
  async createContact(contact: Partial<Contact>): Promise<Contact | null> {
    const res = await this.mutate<Contact>('contacts', 'insert', { data: contact });
    return res.success && res.data ? res.data : null;
  },

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    const res = await this.mutate<Contact>('contacts', 'update', { id, data: updates });
    return res.success && res.data ? res.data : null;
  },

  async deleteContact(id: string): Promise<boolean> {
    const res = await this.mutate('contacts', 'delete', { id });
    return res.success;
  },

  async fetchContacts(): Promise<Contact[] | null> {
    const all = await this.fetchAllData();
    return all.success ? all.data.contacts : null;
  },

  async upsertContact(contact: Partial<Contact> & { id: string }): Promise<boolean> {
    const res = await this.updateContact(contact.id, contact);
    return Boolean(res);
  },

  // ==========================================
  // ACTIVITIES (LOGGED TIMELINE)
  // ==========================================
  async createActivity(activity: Partial<Activity>): Promise<Activity | null> {
    const res = await this.mutate<Activity>('activities', 'insert', { data: activity });
    return res.success && res.data ? res.data : null;
  },

  async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | null> {
    const res = await this.mutate<Activity>('activities', 'update', { id, data: updates });
    return res.success && res.data ? res.data : null;
  },

  async deleteActivity(id: string): Promise<boolean> {
    const res = await this.mutate('activities', 'delete', { id });
    return res.success;
  },

  async fetchActivities(): Promise<Activity[] | null> {
    const all = await this.fetchAllData();
    return all.success ? all.data.activities : null;
  },

  async upsertActivity(activity: Partial<Activity> & { id: string }): Promise<boolean> {
    const res = await this.updateActivity(activity.id, activity);
    return Boolean(res);
  },

  // ==========================================
  // PLANNED ACTIVITIES
  // ==========================================
  async createPlannedActivity(plan: Partial<PlannedActivity>): Promise<PlannedActivity | null> {
    const res = await this.mutate<PlannedActivity>('planned_activities', 'insert', { data: plan });
    return res.success && res.data ? res.data : null;
  },

  async updatePlannedActivity(id: string, updates: Partial<PlannedActivity>): Promise<PlannedActivity | null> {
    const res = await this.mutate<PlannedActivity>('planned_activities', 'update', { id, data: updates });
    return res.success && res.data ? res.data : null;
  },

  async deletePlannedActivity(id: string): Promise<boolean> {
    const res = await this.mutate('planned_activities', 'delete', { id });
    return res.success;
  },

  async fetchPlannedActivities(): Promise<PlannedActivity[] | null> {
    const all = await this.fetchAllData();
    return all.success ? all.data.plannedActivities : null;
  },

  async upsertPlannedActivity(plan: Partial<PlannedActivity> & { id: string }): Promise<boolean> {
    const res = await this.updatePlannedActivity(plan.id, plan);
    return Boolean(res);
  },

  // ==========================================
  // QUOTATIONS
  // ==========================================
  async createQuotation(quotation: Partial<Quotation>): Promise<Quotation | null> {
    const res = await this.mutate<Quotation>('quotations', 'insert', { data: quotation });
    return res.success && res.data ? res.data : null;
  },

  async updateQuotation(id: string, updates: Partial<Quotation>): Promise<Quotation | null> {
    const res = await this.mutate<Quotation>('quotations', 'update', { id, data: updates });
    return res.success && res.data ? res.data : null;
  },

  async deleteQuotation(id: string): Promise<boolean> {
    const res = await this.mutate('quotations', 'delete', { id });
    return res.success;
  },

  async fetchQuotations(): Promise<Quotation[] | null> {
    const all = await this.fetchAllData();
    return all.success ? all.data.quotations : null;
  },

  async upsertQuotation(quotation: Partial<Quotation> & { id: string }): Promise<boolean> {
    const res = await this.updateQuotation(quotation.id, quotation);
    return Boolean(res);
  },

  // ==========================================
  // SALES TARGETS
  // ==========================================
  async updateSalesTarget(id: string, updates: Partial<SalesTarget>): Promise<SalesTarget | null> {
    const res = await this.mutate<SalesTarget>('sales_targets', 'update', { id, data: updates });
    return res.success && res.data ? res.data : null;
  },

  async fetchSalesTargets(): Promise<SalesTarget[] | null> {
    const all = await this.fetchAllData();
    return all.success ? all.data.salesTargets : null;
  },

  async upsertSalesTarget(target: Partial<SalesTarget> & { id: string }): Promise<boolean> {
    const res = await this.updateSalesTarget(target.id, target);
    return Boolean(res);
  },

  // ==========================================
  // APPROVAL REQUESTS
  // ==========================================
  async createApprovalRequest(request: Partial<ApprovalRequest>): Promise<ApprovalRequest | null> {
    const res = await this.mutate<ApprovalRequest>('approval_requests', 'insert', { data: request });
    return res.success && res.data ? res.data : null;
  },

  async updateApprovalRequest(id: string, updates: Partial<ApprovalRequest>): Promise<ApprovalRequest | null> {
    const res = await this.mutate<ApprovalRequest>('approval_requests', 'update', { id, data: updates });
    return res.success && res.data ? res.data : null;
  },

  async fetchApprovalRequests(): Promise<ApprovalRequest[] | null> {
    const all = await this.fetchAllData();
    return all.success ? all.data.approvalRequests : null;
  },

  async upsertApprovalRequest(request: Partial<ApprovalRequest> & { id: string }): Promise<boolean> {
    const res = await this.updateApprovalRequest(request.id, request);
    return Boolean(res);
  },

  // ==========================================
  // REMINDERS
  // ==========================================
  async createReminder(reminder: Partial<Reminder>): Promise<Reminder | null> {
    const res = await this.mutate<Reminder>('reminders', 'insert', { data: reminder });
    return res.success && res.data ? res.data : null;
  },

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
    const res = await this.mutate<Reminder>('reminders', 'update', { id, data: updates });
    return res.success && res.data ? res.data : null;
  },

  async deleteReminder(id: string): Promise<boolean> {
    const res = await this.mutate('reminders', 'delete', { id });
    return res.success;
  },

  async fetchReminders(): Promise<Reminder[] | null> {
    const all = await this.fetchAllData();
    return all.success ? all.data.reminders : null;
  },

  async upsertReminder(reminder: Partial<Reminder> & { id: string }): Promise<boolean> {
    const res = await this.updateReminder(reminder.id, reminder);
    return Boolean(res);
  },

  // ==========================================
  // PROFILES (TEAM)
  // ==========================================
  async fetchProfiles(): Promise<Profile[] | null> {
    const all = await this.fetchAllData();
    return all.success ? all.data.profiles : null;
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const res = await this.mutate<Profile>('profiles', 'update', { id, data: updates });
    return res.success && res.data ? res.data : null;
  },

  // ==========================================
  // VIP ITEMS (Pipeline-Isolated)
  // ==========================================
  async createVIPItem(item: Partial<VIPItem>): Promise<VIPItem | null> {
    const res = await this.mutate<VIPItem>('vip_items', 'insert', { data: item });
    if (!res.success) {
      throw new Error(res.error || 'Failed to save VIP item to server');
    }
    return res.data || null;
  },

  async updateVIPItem(id: string, updates: Partial<VIPItem>): Promise<VIPItem | null> {
    const res = await this.mutate<VIPItem>('vip_items', 'update', { id, data: updates });
    if (!res.success) {
      throw new Error(res.error || 'Failed to update VIP item on server');
    }
    return res.data || null;
  },

  async deleteVIPItem(id: string): Promise<boolean> {
    const res = await this.mutate('vip_items', 'delete', { id });
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete VIP item from server');
    }
    return true;
  },

  async fetchVIPItems(): Promise<VIPItem[] | null> {
    const all = await this.fetchAllData();
    return all.success ? (all.data.vipItems || []) : null;
  }
};
