import { User, AuthSession, AuthError } from '../../types/user';
import { SEEDED_USERS } from '../../constants/users';
import { verifyPassword } from '../../utils/hash';

export const STORAGE_KEY_SESSION = 'al_mespar_session';
export const STORAGE_KEY_USERS = 'al_mespar_users';

export class LocalAuthRepository {
  private sessionKey = STORAGE_KEY_SESSION;
  private usersKey = STORAGE_KEY_USERS;

  /**
   * Get all registered/seeded users from local storage
   */
  getUsers(): User[] {
    if (typeof window === 'undefined') return SEEDED_USERS;
    try {
      const saved = localStorage.getItem(this.usersKey);
      if (!saved) {
        localStorage.setItem(this.usersKey, JSON.stringify(SEEDED_USERS));
        return SEEDED_USERS;
      }
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load users from storage, falling back to seed', e);
      return SEEDED_USERS;
    }
  }

  /**
   * Save users list
   */
  saveUsers(users: User[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.usersKey, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to storage', e);
    }
  }

  /**
   * Look up a user by ID
   */
  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  /**
   * Look up a user by email (case-insensitive)
   */
  getUserByEmail(email: string): User | null {
    const normalized = email.trim().toLowerCase();
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === normalized) || null;
  }

  /**
   * Get the active session if valid and not expired
   */
  getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;

    try {
      // Check localStorage first (remember me) then sessionStorage (session-only)
      const raw = localStorage.getItem(this.sessionKey) || sessionStorage.getItem(this.sessionKey);
      if (!raw) return null;

      const session: AuthSession = JSON.parse(raw);
      const now = new Date();
      const expiresAt = new Date(session.expires_at);

      if (expiresAt <= now) {
        // Session expired, clear it
        this.logout();
        return null;
      }

      return session;
    } catch (e) {
      console.error('Failed to read auth session', e);
      this.logout();
      return null;
    }
  }

  /**
   * Get the currently logged-in User entity
   */
  getCurrentUser(): User | null {
    const session = this.getSession();
    if (!session) return null;
    return this.getUserById(session.user_id);
  }

  /**
   * Authenticate a user with email and password
   */
  async login(email: string, password: string, rememberMe = false): Promise<User> {
    const user = this.getUserByEmail(email);

    if (!user) {
      throw new AuthError('INVALID_EMAIL', 'البريد الإلكتروني غير مسجل في النظام / Email not registered');
    }

    if (!user.is_active) {
      throw new AuthError('INACTIVE_USER', 'هذا الحساب معطل، يرجى التواصل مع الإدارة / Account is deactivated');
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new AuthError('INVALID_PASSWORD', 'كلمة المرور غير صحيحة / Incorrect password');
    }

    // Generate random token
    let token = '';
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      token = crypto.randomUUID();
    } else {
      token = `token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }

    // Calculate expiry: +30 days if rememberMe, otherwise +7 days
    const daysToAdd = rememberMe ? 30 : 7;
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + daysToAdd);

    const session: AuthSession = {
      user_id: user.id,
      token,
      expires_at: expiresDate.toISOString(),
      remember_me: rememberMe
    };

    if (typeof window !== 'undefined') {
      const serialized = JSON.stringify(session);
      if (rememberMe) {
        localStorage.setItem(this.sessionKey, serialized);
        sessionStorage.removeItem(this.sessionKey);
      } else {
        // Session storage for session-only + localStorage backup marked non-remember
        localStorage.setItem(this.sessionKey, serialized);
        sessionStorage.setItem(this.sessionKey, serialized);
      }

      // Maintain legacy sync for any existing component references
      localStorage.setItem('crmate_is_authenticated', 'true');
      localStorage.setItem('crmate_auth_user', JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.name,
        name: user.name,
        role: user.role,
        avatar_initials: user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      }));
    }

    return user;
  }

  /**
   * Log out current user and purge session tokens
   */
  logout(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.sessionKey);
      sessionStorage.removeItem(this.sessionKey);
      localStorage.setItem('crmate_is_authenticated', 'false');
      localStorage.removeItem('crmate_auth_user');
    } catch (e) {
      console.error('Failed to clear session on logout', e);
    }
  }

  /**
   * Switch user helper (used in dev panel for u5 Admin testing)
   */
  switchUserDev(userId: string): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + 7);

    const session: AuthSession = {
      user_id: user.id,
      token: `dev_switch_${Date.now()}`,
      expires_at: expiresDate.toISOString(),
      remember_me: true
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.sessionKey, JSON.stringify(session));
      localStorage.setItem('crmate_is_authenticated', 'true');
      localStorage.setItem('crmate_auth_user', JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.name,
        name: user.name,
        role: user.role,
        avatar_initials: user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      }));
    }

    return user;
  }
}

export const authRepository = new LocalAuthRepository();
