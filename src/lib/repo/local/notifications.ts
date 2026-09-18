import { AppNotification } from '@/types/crm';
import { Repository } from '../repository';

export const STORAGE_KEY_NOTIFICATIONS = 'al_mespar_notifications';
const LEGACY_STORAGE_KEY_NOTIFICATIONS = 'crmate_notifications';

export class LocalNotificationsRepository implements Repository<AppNotification> {
  private key = STORAGE_KEY_NOTIFICATIONS;

  private readFromStorage(): AppNotification[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.key) || localStorage.getItem(LEGACY_STORAGE_KEY_NOTIFICATIONS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read notifications from storage', e);
      return [];
    }
  }

  private writeToStorage(items: AppNotification[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(items));
      localStorage.setItem(LEGACY_STORAGE_KEY_NOTIFICATIONS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to write notifications to storage', e);
    }
  }

  getAll(): AppNotification[] {
    return this.readFromStorage();
  }

  getById(id: string): AppNotification | null {
    const items = this.readFromStorage();
    return items.find(n => n.id === id) || null;
  }

  create(item: Omit<AppNotification, 'id'> & { id?: string }): AppNotification {
    const items = this.readFromStorage();
    const newNotif: AppNotification = {
      ...item,
      id: item.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      is_read: item.is_read ?? false,
      created_at: item.created_at || new Date().toISOString()
    } as AppNotification;

    const updated = [newNotif, ...items];
    this.writeToStorage(updated);
    return newNotif;
  }

  update(id: string, updates: Partial<AppNotification>): AppNotification | null {
    const items = this.readFromStorage();
    const idx = items.findIndex(n => n.id === id);
    if (idx === -1) return null;

    const updated: AppNotification = {
      ...items[idx],
      ...updates
    };

    items[idx] = updated;
    this.writeToStorage(items);
    return updated;
  }

  remove(id: string): boolean {
    const items = this.readFromStorage();
    const filtered = items.filter(n => n.id !== id);
    if (filtered.length === items.length) return false;
    this.writeToStorage(filtered);
    return true;
  }

  query(predicate: (item: AppNotification) => boolean): AppNotification[] {
    return this.readFromStorage().filter(predicate);
  }
}

export const notificationsRepository = new LocalNotificationsRepository();
