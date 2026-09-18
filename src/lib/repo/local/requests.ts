import { ApprovalRequest } from '@/types/crm';
import { Repository } from '../repository';

export const STORAGE_KEY_REQUESTS = 'al_mespar_requests';
const LEGACY_STORAGE_KEY_REQUESTS = 'crmate_approval_requests';

export class LocalRequestsRepository implements Repository<ApprovalRequest> {
  private key = STORAGE_KEY_REQUESTS;

  private readFromStorage(): ApprovalRequest[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.key) || localStorage.getItem(LEGACY_STORAGE_KEY_REQUESTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read requests from storage', e);
      return [];
    }
  }

  private writeToStorage(items: ApprovalRequest[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(items));
      // Keep legacy key in sync for backwards compatibility
      localStorage.setItem(LEGACY_STORAGE_KEY_REQUESTS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to write requests to storage', e);
    }
  }

  getAll(): ApprovalRequest[] {
    return this.readFromStorage();
  }

  getById(id: string): ApprovalRequest | null {
    const items = this.readFromStorage();
    return items.find(r => r.id === id) || null;
  }

  create(item: Omit<ApprovalRequest, 'id'> & { id?: string }): ApprovalRequest {
    const items = this.readFromStorage();
    const newRequest: ApprovalRequest = {
      ...item,
      id: item.id || `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    } as ApprovalRequest;

    const updated = [newRequest, ...items];
    this.writeToStorage(updated);
    return newRequest;
  }

  update(id: string, updates: Partial<ApprovalRequest>): ApprovalRequest | null {
    const items = this.readFromStorage();
    const idx = items.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const updated: ApprovalRequest = {
      ...items[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };

    items[idx] = updated;
    this.writeToStorage(items);
    return updated;
  }

  remove(id: string): boolean {
    const items = this.readFromStorage();
    const filtered = items.filter(r => r.id !== id);
    if (filtered.length === items.length) return false;
    this.writeToStorage(filtered);
    return true;
  }

  query(predicate: (item: ApprovalRequest) => boolean): ApprovalRequest[] {
    return this.readFromStorage().filter(predicate);
  }
}

export const requestsRepository = new LocalRequestsRepository();
