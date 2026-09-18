import { 
  ApprovalRequest, 
  AppNotification, 
  RequestComment, 
  RequestStatus, 
  UserRole,
  Profile
} from '@/types/crm';
import { requestsRepository, STORAGE_KEY_REQUESTS } from '../repo/local/requests';
import { notificationsRepository, STORAGE_KEY_NOTIFICATIONS } from '../repo/local/notifications';

const STORAGE_REQUESTS_KEY = STORAGE_KEY_REQUESTS;
const LEGACY_STORAGE_REQUESTS_KEY = 'crmate_approval_requests';

const STORAGE_NOTIFICATIONS_KEY = STORAGE_KEY_NOTIFICATIONS;
const LEGACY_STORAGE_NOTIFICATIONS_KEY = 'crmate_notifications';

export const INITIAL_REQUESTS: ApprovalRequest[] = [
  {
    id: 'req_demo_001',
    project_id: 'PR-2026-0001',
    project_name: 'Red Sea Luxury Resort Phase 2 - Shura Island',
    company_name: 'Saudi Binladin Group (SBG)',
    quotation_id: 'q_demo_1',
    quotation_number: 'QT-2026-001',
    quotation_amount: 1500000,
    type: 'discount',
    requested_by: 'u1',
    requester_name: 'Eslam Mohandes',
    assigned_to: ['u0'],
    payload: {
      discount_pct: 12,
      reason: 'Procurement director confirmed immediate award of full HVAC & dampers package if 12% commercial discount is approved before Thursday.',
      requested_value: 1320000
    },
    urgency: 'urgent',
    status: 'pending',
    created_at: '2026-09-17T14:30:00.000Z',
    updated_at: '2026-09-17T14:30:00.000Z',
    comments: [
      {
        id: 'c_1',
        user_id: 'u1',
        user_name: 'Eslam Mohandes',
        body: 'Client also mentioned competitor offer from Zamil is 8% lower. 12% discount secures the deal 100%.',
        created_at: '2026-09-17T14:32:00.000Z'
      }
    ]
  },
  {
    id: 'req_demo_002',
    project_id: 'PR-2026-0004',
    project_name: 'NEOM Staff Accommodation Village C3',
    company_name: 'Nesma & Partners',
    quotation_id: 'q_demo_2',
    quotation_number: 'QT-2026-004',
    quotation_amount: 850000,
    type: 'discount',
    requested_by: 'u1',
    requester_name: 'Eslam Mohandes',
    assigned_to: ['u0'],
    payload: {
      discount_pct: 10,
      reason: 'Volume discount requested across 14 residential units.',
      requested_value: 765000
    },
    urgency: 'high',
    status: 'approved',
    resolution: {
      resolved_by: 'u0',
      resolver_name: 'Khaled Al-Otaibi',
      resolved_at: '2026-09-15T11:20:00.000Z',
      final_value: 775000
    },
    created_at: '2026-09-15T08:00:00.000Z',
    updated_at: '2026-09-15T11:20:00.000Z',
    comments: [
      {
        id: 'c_2_1',
        user_id: 'u0',
        user_name: 'Khaled Al-Otaibi',
        body: 'Approved at 8.8% discount (775,000 SAR) to maintain regional margin above 22%.',
        created_at: '2026-09-15T11:20:00.000Z'
      }
    ]
  },
  {
    id: 'req_demo_003',
    project_id: 'PR-2026-0007',
    project_name: 'Jeddah Central District Commercial Mall',
    company_name: 'Al-Bawani Co.',
    quotation_id: 'q_demo_3',
    quotation_number: 'QT-2026-007',
    quotation_amount: 2200000,
    type: 'discount',
    requested_by: 'u1',
    requester_name: 'Eslam Mohandes',
    assigned_to: ['u0'],
    payload: {
      discount_pct: 15,
      reason: 'Aggressive contractor request to beat local fabricator price.',
      requested_value: 1870000
    },
    urgency: 'normal',
    status: 'rejected',
    resolution: {
      resolved_by: 'u0',
      resolver_name: 'Khaled Al-Otaibi',
      resolved_at: '2026-09-12T16:00:00.000Z',
      reject_reason: 'Margin below minimum threshold of 18%. Advise offering extended warranty instead.'
    },
    created_at: '2026-09-12T09:30:00.000Z',
    updated_at: '2026-09-12T16:00:00.000Z',
    comments: []
  },
  {
    id: 'req_demo_004',
    project_id: 'PR-2026-0010',
    project_name: 'King Salman Park Cultural Complex',
    company_name: 'El-Seif Engineering Contracting',
    quotation_id: 'q_demo_4',
    quotation_number: 'QT-2026-010',
    quotation_amount: 980000,
    type: 'technical_review',
    requested_by: 'u1',
    requester_name: 'Eslam Mohandes',
    assigned_to: ['u0'],
    payload: {
      discount_pct: 0,
      reason: 'Acoustic attenuation submittal requires engineering sign-off on non-standard louvers.',
      notes: 'Consultant Buro Happold requested sound absorption curves.'
    },
    urgency: 'high',
    status: 'approved',
    resolution: {
      resolved_by: 'u0',
      resolver_name: 'Khaled Al-Otaibi',
      resolved_at: '2026-09-14T14:45:00.000Z',
      final_value: 980000
    },
    created_at: '2026-09-14T10:00:00.000Z',
    updated_at: '2026-09-14T14:45:00.000Z',
    comments: []
  },
  {
    id: 'req_demo_005',
    project_id: 'PR-2026-0014',
    project_name: 'Diriyah Gate Hotel & Residences',
    company_name: 'Shapoorji Pallonji Mideast',
    quotation_id: 'q_demo_5',
    quotation_number: 'QT-2026-014',
    quotation_amount: 1750000,
    type: 'discount',
    requested_by: 'u1',
    requester_name: 'Eslam Mohandes',
    assigned_to: ['u0'],
    payload: {
      discount_pct: 14,
      reason: 'Payment terms requested 120 days post-delivery with 14% discount.',
      requested_value: 1505000
    },
    urgency: 'high',
    status: 'rejected',
    resolution: {
      resolved_by: 'u0',
      resolver_name: 'Khaled Al-Otaibi',
      resolved_at: '2026-09-10T12:00:00.000Z',
      reject_reason: 'Payment terms exceeding 60 days not acceptable with discount exceeding 5%.'
    },
    created_at: '2026-09-09T15:00:00.000Z',
    updated_at: '2026-09-10T12:00:00.000Z',
    comments: []
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_demo_1',
    user_id: 'u0',
    type: 'request_created',
    reference_type: 'request',
    reference_id: 'req_demo_001',
    title: 'Urgent Discount Approval Needed',
    body: 'Eslam Mohandes requested a 12% discount on Red Sea Luxury Resort (QT-2026-001)',
    is_read: false,
    created_at: '2026-09-17T14:30:00.000Z',
    project_id: 'PR-2026-0001',
    project_name: 'Red Sea Luxury Resort Phase 2 - Shura Island'
  }
];

export function getAllRequests(): ApprovalRequest[] {
  if (typeof window === 'undefined') return INITIAL_REQUESTS;
  const saved = localStorage.getItem(STORAGE_REQUESTS_KEY) || localStorage.getItem(LEGACY_STORAGE_REQUESTS_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(INITIAL_REQUESTS));
    localStorage.setItem(LEGACY_STORAGE_REQUESTS_KEY, JSON.stringify(INITIAL_REQUESTS));
    return INITIAL_REQUESTS;
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse approval requests from storage', e);
    return INITIAL_REQUESTS;
  }
}

export function saveRequests(requests: ApprovalRequest[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
  localStorage.setItem(LEGACY_STORAGE_REQUESTS_KEY, JSON.stringify(requests));
}

export function createApprovalRequest(
  data: Omit<ApprovalRequest, 'id' | 'created_at' | 'updated_at' | 'comments' | 'status'>
): { request: ApprovalRequest; notifications: AppNotification[] } {
  const all = getAllRequests();
  const now = new Date().toISOString();
  
  const newRequest: ApprovalRequest = {
    ...data,
    id: `req_${Date.now()}`,
    status: 'pending',
    created_at: now,
    updated_at: now,
    comments: []
  };

  const updatedRequests = [newRequest, ...all];
  saveRequests(updatedRequests);

  const newNotifications: AppNotification[] = [];
  data.assigned_to.forEach(assignedUserId => {
    const notif = createNotification({
      user_id: assignedUserId,
      type: 'request_created',
      reference_type: 'request',
      reference_id: newRequest.id,
      title: `${newRequest.urgency === 'urgent' ? '🔴 URGENT: ' : ''}Approval Request: ${newRequest.type.toUpperCase()}`,
      body: `${newRequest.requester_name || 'A team member'} requested ${newRequest.type === 'discount' ? `${newRequest.payload.discount_pct}% discount` : newRequest.type.replace('_', ' ')} on ${newRequest.project_name || 'Project'}`,
      project_id: newRequest.project_id,
      project_name: newRequest.project_name
    });
    newNotifications.push(notif);
  });

  return { request: newRequest, notifications: newNotifications };
}

export function updateApprovalRequest(
  id: string, 
  updates: Partial<ApprovalRequest>
): ApprovalRequest | null {
  const all = getAllRequests();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return null;

  const updated: ApprovalRequest = {
    ...all[idx],
    ...updates,
    updated_at: new Date().toISOString()
  };

  all[idx] = updated;
  saveRequests(all);
  return updated;
}

export function resolveApprovalRequest(
  id: string,
  resolution: {
    resolved_by: string;
    resolver_name?: string;
    status: 'approved' | 'rejected';
    final_value?: number;
    reject_reason?: string;
  }
): { request: ApprovalRequest; notification: AppNotification } | null {
  const all = getAllRequests();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return null;

  const current = all[idx];
  const now = new Date().toISOString();

  const updated: ApprovalRequest = {
    ...current,
    status: resolution.status,
    resolution: {
      resolved_by: resolution.resolved_by,
      resolver_name: resolution.resolver_name,
      resolved_at: now,
      final_value: resolution.final_value,
      reject_reason: resolution.reject_reason
    },
    updated_at: now
  };

  all[idx] = updated;
  saveRequests(all);

  const isApproved = resolution.status === 'approved';
  const notification = createNotification({
    user_id: current.requested_by,
    type: isApproved ? 'request_approved' : 'request_rejected',
    reference_type: 'request',
    reference_id: current.id,
    title: isApproved ? '✅ Request Approved' : '❌ Request Rejected',
    body: isApproved 
      ? `Your ${current.type} request on ${current.project_name || 'Project'} has been APPROVED by ${resolution.resolver_name || 'Manager'}${resolution.final_value ? ` (Final Value: ${resolution.final_value} SAR)` : ''}.`
      : `Your ${current.type} request on ${current.project_name || 'Project'} was REJECTED: ${resolution.reject_reason || 'See details'}.`,
    project_id: current.project_id,
    project_name: current.project_name
  });

  return { request: updated, notification };
}

export function addCommentToRequest(
  id: string,
  commentData: { user_id: string; user_name: string; body: string }
): { request: ApprovalRequest; comment: RequestComment } | null {
  const all = getAllRequests();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return null;

  const current = all[idx];
  const now = new Date().toISOString();

  const newComment: RequestComment = {
    id: `c_${Date.now()}`,
    user_id: commentData.user_id,
    user_name: commentData.user_name,
    body: commentData.body.trim(),
    created_at: now
  };

  const updated: ApprovalRequest = {
    ...current,
    comments: [...current.comments, newComment],
    updated_at: now
  };

  all[idx] = updated;
  saveRequests(all);

  const targetUserIds = new Set<string>();
  if (commentData.user_id === current.requested_by) {
    current.assigned_to.forEach(u => targetUserIds.add(u));
  } else {
    targetUserIds.add(current.requested_by);
  }

  targetUserIds.forEach(targetId => {
    createNotification({
      user_id: targetId,
      type: 'request_comment',
      reference_type: 'request',
      reference_id: current.id,
      title: `💬 New Comment on Approval Request`,
      body: `${commentData.user_name}: "${commentData.body.slice(0, 60)}${commentData.body.length > 60 ? '...' : ''}"`,
      project_id: current.project_id,
      project_name: current.project_name
    });
  });

  return { request: updated, comment: newComment };
}

export function getProjectOpenRequest(
  requests: ApprovalRequest[], 
  projectId: string
): ApprovalRequest | undefined {
  return requests.find(r => r.project_id === projectId && r.status === 'pending');
}

export function getAllNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
  const saved = localStorage.getItem(STORAGE_NOTIFICATIONS_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse notifications from storage', e);
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

export function createNotification(
  data: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>
): AppNotification {
  const all = getAllNotifications();
  const newNotif: AppNotification = {
    ...data,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    is_read: false,
    created_at: new Date().toISOString()
  };

  const updated = [newNotif, ...all];
  saveNotifications(updated);
  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const all = getAllNotifications();
  const updated = all.map(n => n.id === id ? { ...n, is_read: true } : n);
  saveNotifications(updated);
}

export function markAllNotificationsAsRead(userId: string): void {
  const all = getAllNotifications();
  const updated = all.map(n => n.user_id === userId ? { ...n, is_read: true } : n);
  saveNotifications(updated);
}

export function getNotificationsForUser(
  notifications: AppNotification[], 
  userId: string
): AppNotification[] {
  return notifications.filter(n => n.user_id === userId);
}

export function getPendingForUser(userId: string): ApprovalRequest[] {
  const all = getAllRequests();
  return all.filter(r => r.status === 'pending' && r.assigned_to.includes(userId));
}

export function getOpenByUser(userId: string): ApprovalRequest[] {
  const all = getAllRequests();
  return all.filter(r => r.status === 'pending' && r.requested_by === userId);
}

export function addComment(
  requestId: string,
  userId: string,
  body: string,
  userName?: string
): { request: ApprovalRequest; comment: RequestComment } | null {
  return addCommentToRequest(requestId, {
    user_id: userId,
    user_name: userName || 'Team Member',
    body
  });
}

export const createRequest = createApprovalRequest;
export const resolveRequest = resolveApprovalRequest;