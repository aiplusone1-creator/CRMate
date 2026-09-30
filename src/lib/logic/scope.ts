import { 
  Project, 
  Activity, 
  PlannedActivity, 
  Quotation, 
  SalesTarget, 
  Reminder, 
  ApprovalRequest, 
  Profile 
} from '@/types/crm';
import { User } from '@/lib/types/user';

export type ScopingUser = Profile | User | { id: string; role: string; full_name?: string; name?: string };

/**
 * Checks if a user is authorized to enter and view/edit the project cockpit page
 */
export function canUserAccessProjectCockpit(project: Project | null | undefined, user: ScopingUser | null | undefined): boolean {
  if (!project || !user) return false;

  const isAdminOrManager = user.role === 'admin' || user.role === 'sales_manager' || user.role === 'viewer' || user.role === 'estimator';
  if (isAdminOrManager) return true;

  // Sales engineer / sales rep: can only enter if project is assigned or referred to them
  const activeAssignee = project.referred_to_id || project.owner_id;
  return activeAssignee === user.id;
}

/**
 * Filter projects based on the logged-in user's role and active manager filter
 */
export function scopeProjects(
  allProjects: Project[], 
  user: ScopingUser, 
  selectedFilter: string = 'all',
  includeArchived: boolean = false
): Project[] {
  if (!user) return [];

  const baseProjects = includeArchived 
    ? allProjects 
    : allProjects.filter(p => !p.is_archived);

  const isAdminOrManager = user.role === 'admin' || user.role === 'sales_manager' || user.role === 'viewer' || user.role === 'estimator';

  if (isAdminOrManager) {
    if (selectedFilter && selectedFilter !== 'all') {
      return baseProjects.filter(p => {
        const activeRep = p.referred_to_id || p.owner_id;
        return activeRep === selectedFilter;
      });
    }
    return baseProjects;
  }

  // Sales engineer:
  // If they deliberately switch filter to 'all' ("لو شال الفلتر"), allow viewing all project names across team.
  // Otherwise (default / 'mine'), return only projects currently assigned/referred to them.
  if (selectedFilter === 'all') {
    return baseProjects;
  }

  return baseProjects.filter(p => {
    const activeAssignee = p.referred_to_id || p.owner_id;
    return activeAssignee === user.id;
  });
}

/**
 * Filter completed activities based on user role and active manager filter
 */
export function scopeActivities(
  allActivities: Activity[], 
  user: ScopingUser, 
  selectedFilter: string = 'all'
): Activity[] {
  if (!user) return [];

  const isAdminOrManager = user.role === 'admin' || user.role === 'sales_manager' || user.role === 'viewer' || user.role === 'estimator';

  if (isAdminOrManager) {
    if (selectedFilter && selectedFilter !== 'all') {
      return allActivities.filter(a => a.user_id === selectedFilter);
    }
    return allActivities;
  }

  return allActivities.filter(a => a.user_id === user.id);
}

/**
 * Filter planned future activities based on user role and active manager filter
 */
export function scopePlannedActivities(
  allPlanned: PlannedActivity[], 
  user: ScopingUser, 
  selectedFilter: string = 'all'
): PlannedActivity[] {
  if (!user) return [];

  const isAdminOrManager = user.role === 'admin' || user.role === 'sales_manager' || user.role === 'viewer' || user.role === 'estimator';

  if (isAdminOrManager) {
    if (selectedFilter && selectedFilter !== 'all') {
      return allPlanned.filter(p => p.user_id === selectedFilter);
    }
    return allPlanned;
  }

  return allPlanned.filter(p => p.user_id === user.id);
}

/**
 * Filter reminders for current user (personal or unassigned)
 */
export function scopeReminders(
  allReminders: Reminder[], 
  user: ScopingUser
): Reminder[] {
  if (!user) return [];
  // Admin and Sales Manager can view all reminders
  if (user.role === 'admin' || user.role === 'sales_manager') {
    return allReminders;
  }
  // Reminders belong to the specific user or unassigned
  return allReminders.filter(r => !r.user_id || r.user_id === user.id);
}

/**
 * Filter approval requests based on user role
 * - Admin: sees all requests
 * - Sales Manager: sees requests assigned to them (or all pending requests)
 * - Sales Engineer: sees only requests created by them
 */
export function scopeRequests(
  allRequests: ApprovalRequest[], 
  user: ScopingUser
): ApprovalRequest[] {
  if (!user) return [];

  if (user.role === 'admin') {
    return allRequests;
  }

  if (user.role === 'sales_manager') {
    return allRequests.filter(r => 
      !r.assigned_to || 
      r.assigned_to.length === 0 || 
      r.assigned_to.includes(user.id) || 
      r.status === 'pending'
    );
  }

  // Sales engineer sees their requested items
  return allRequests.filter(r => r.requested_by === user.id);
}

/**
 * Filter quotations belonging to scoped projects
 */
export function scopeQuotations(
  allQuotations: Quotation[], 
  user: ScopingUser, 
  scopedProjects: Project[]
): Quotation[] {
  if (!user) return [];

  const projectIds = new Set(scopedProjects.map(p => p.id));
  return allQuotations.filter(q => projectIds.has(q.project_id));
}

/**
 * Filter sales targets for user or team
 */
export function scopeTargets(
  allTargets: SalesTarget[], 
  user: ScopingUser
): SalesTarget[] {
  if (!user) return [];
  return allTargets;
}
