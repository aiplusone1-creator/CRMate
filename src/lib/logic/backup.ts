/**
 * CRMate Enterprise Backup & Disaster Recovery Engine
 * Exports all CRM entities and configuration to a verifiable JSON bundle
 * Imports and restores datasets with integrity validation.
 */

export interface CRMateBackupBundle {
  meta: {
    app: 'CRMate';
    version: '2.0';
    exported_at: string;
    exported_by?: string;
    entity_counts: Record<string, number>;
  };
  data: {
    projects: any[];
    contacts: any[];
    companies: any[];
    activities: any[];
    planned_activities: any[];
    quotations: any[];
    sales_targets: any[];
    reminders: any[];
    requests: any[];
    notifications: any[];
    users?: any[];
  };
}

const STORAGE_KEYS = {
  projects: 'al_mespar_projects',
  contacts: 'al_mespar_contacts',
  companies: 'al_mespar_companies',
  activities: 'al_mespar_activities',
  planned_activities: 'al_mespar_planned_activities',
  quotations: 'al_mespar_quotations',
  sales_targets: 'al_mespar_sales_targets',
  reminders: 'al_mespar_reminders',
  requests: 'al_mespar_requests',
  notifications: 'al_mespar_notifications',
  users: 'al_mespar_users'
} as const;

function safeGetArray(key: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`Failed to read key: ${key}`, e);
    return [];
  }
}

/**
 * Generate full backup bundle object from local storage
 */
export function generateBackupBundle(exporterName?: string): CRMateBackupBundle {
  const data = {
    projects: safeGetArray(STORAGE_KEYS.projects),
    contacts: safeGetArray(STORAGE_KEYS.contacts),
    companies: safeGetArray(STORAGE_KEYS.companies),
    activities: safeGetArray(STORAGE_KEYS.activities),
    planned_activities: safeGetArray(STORAGE_KEYS.planned_activities),
    quotations: safeGetArray(STORAGE_KEYS.quotations),
    sales_targets: safeGetArray(STORAGE_KEYS.sales_targets),
    reminders: safeGetArray(STORAGE_KEYS.reminders),
    requests: safeGetArray(STORAGE_KEYS.requests),
    notifications: safeGetArray(STORAGE_KEYS.notifications),
    users: safeGetArray(STORAGE_KEYS.users)
  };

  const counts: Record<string, number> = {};
  for (const [key, val] of Object.entries(data)) {
    counts[key] = val.length;
  }

  return {
    meta: {
      app: 'CRMate',
      version: '2.0',
      exported_at: new Date().toISOString(),
      exported_by: exporterName || 'CRMate User',
      entity_counts: counts
    },
    data
  };
}

/**
 * Trigger client-side browser file download for the backup JSON
 */
export function downloadBackupFile(exporterName?: string): void {
  if (typeof window === 'undefined') return;

  const bundle = generateBackupBundle(exporterName);
  const jsonStr = JSON.stringify(bundle, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '');
  const fileName = `CRMate_Database_Backup_${dateStr}_${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Restore CRMate database from a JSON backup file content
 */
export function restoreBackupFile(jsonString: string): {
  success: boolean;
  message: string;
  counts?: Record<string, number>;
} {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Restore must run in browser environment' };
  }

  try {
    const bundle: CRMateBackupBundle = JSON.parse(jsonString);

    const isEn = typeof window !== 'undefined' && localStorage.getItem('crmate_language') === 'en';

    if (!bundle || typeof bundle !== 'object' || !bundle.data) {
      return { 
        success: false, 
        message: isEn ? 'Invalid CRMate backup format' : 'الملف غير صالح: لا يحتوي على بيانات CRMate صحيحة' 
      };
    }

    const { data } = bundle;
    const counts: Record<string, number> = {};

    if (Array.isArray(data.projects)) {
      localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(data.projects));
      counts.projects = data.projects.length;
    }
    if (Array.isArray(data.contacts)) {
      localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(data.contacts));
      counts.contacts = data.contacts.length;
    }
    if (Array.isArray(data.companies)) {
      localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(data.companies));
      counts.companies = data.companies.length;
    }
    if (Array.isArray(data.activities)) {
      localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(data.activities));
      counts.activities = data.activities.length;
    }
    if (Array.isArray(data.planned_activities)) {
      localStorage.setItem(STORAGE_KEYS.planned_activities, JSON.stringify(data.planned_activities));
      counts.planned_activities = data.planned_activities.length;
    }
    if (Array.isArray(data.quotations)) {
      localStorage.setItem(STORAGE_KEYS.quotations, JSON.stringify(data.quotations));
      counts.quotations = data.quotations.length;
    }
    if (Array.isArray(data.sales_targets)) {
      localStorage.setItem(STORAGE_KEYS.sales_targets, JSON.stringify(data.sales_targets));
      counts.sales_targets = data.sales_targets.length;
    }
    if (Array.isArray(data.reminders)) {
      localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(data.reminders));
      counts.reminders = data.reminders.length;
    }
    if (Array.isArray(data.requests)) {
      localStorage.setItem(STORAGE_KEYS.requests, JSON.stringify(data.requests));
      counts.requests = data.requests.length;
    }
    if (Array.isArray(data.notifications)) {
      localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(data.notifications));
      counts.notifications = data.notifications.length;
    }
    if (Array.isArray(data.users)) {
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(data.users));
      counts.users = data.users.length;
    }

    return {
      success: true,
      message: isEn ? 'Database restored successfully!' : 'تمت استعادة قاعدة البيانات بنجاح!',
      counts
    };
  } catch (err: any) {
    console.error('Backup restore failed', err);
    const isEn = typeof window !== 'undefined' && localStorage.getItem('crmate_language') === 'en';
    return {
      success: false,
      message: isEn 
        ? `Failed to read backup file: ${err?.message || 'Unsupported format'}` 
        : `فشل قراءة ملف النسخة الاحتياطية: ${err?.message || 'تنسيق غير مدعوم'}`
    };
  }
}

/**
 * Reset database to factory initial state
 */
export function resetToFactoryDefaults(): void {
  if (typeof window === 'undefined') return;
  
  Object.values(STORAGE_KEYS).forEach(k => {
    localStorage.removeItem(k);
  });
  localStorage.removeItem('crmate_team_members');
  localStorage.removeItem('crmate_dashboard_visible_modules');
}
