import { User, AuthSession, AuthError, UserRole } from '../../types/user';
import { SEEDED_USERS } from '../../constants/users';
import { hashPassword, verifyPassword } from '../../utils/hash';

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
      const parsed: User[] = JSON.parse(saved);
      let changed = false;
      parsed.forEach(u => {
        if (u.id === 'u1' && (u.role !== 'sales_engineer' || u.title !== 'Sales Engineer')) {
          u.role = 'sales_engineer';
          u.title = 'Sales Engineer';
          u.territory = 'Western Region (Jeddah, Makkah, Medina)';
          changed = true;
        }
        if (u.id === 'u3' && (u.role !== 'admin' || u.title !== 'Commercial Director & Managing Partner')) {
          u.name = 'Abdelrahman El-Qaffas';
          u.name_ar = 'عبدالرحمن القفاص';
          u.role = 'admin';
          u.title = 'Commercial Director & Managing Partner';
          u.territory = 'Kingdom-Wide (KSA)';
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(this.usersKey, JSON.stringify(parsed));
      }
      return parsed;
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
      if (!raw) {
        return null;
      }

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
      throw new AuthError('INVALID_EMAIL', 'Email not registered in system');
    }

    if (!user.is_active) {
      throw new AuthError('INACTIVE_USER', 'Account is deactivated, please contact administrator');
    }

    if (!user.password_hash) {
      throw new AuthError('INVALID_PASSWORD', 'Local password verification not available for this account. Please authenticate via Supabase Auth.');
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new AuthError('INVALID_PASSWORD', 'Incorrect password');
    }

    // Attempt to obtain cryptographically verifiable server session token
    let token = '';
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, password, rememberMe })
        });
        if (res.ok) {
          const authData = await res.json();
          if (authData.token) {
            token = authData.token;
          }
        }
      } catch (e) {
        console.warn('Could not contact /api/auth/session during local auth:', e);
      }
    }

    // Fallback token if server session route unavailable
    if (!token) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        token = crypto.randomUUID();
      } else {
        token = `token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      }
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
      localStorage.removeItem('crmate_explicit_logout');
      localStorage.setItem('crmate_auth_user', JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.name,
        name: user.name,
        role: user.role,
        avatar_initials: (user.name || 'User').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
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
      fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
      localStorage.removeItem(this.sessionKey);
      sessionStorage.removeItem(this.sessionKey);
      localStorage.setItem('crmate_is_authenticated', 'false');
      localStorage.removeItem('crmate_auth_user');
      localStorage.setItem('crmate_explicit_logout', 'true');
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
      localStorage.removeItem('crmate_explicit_logout');
      localStorage.setItem('crmate_auth_user', JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.name,
        name: user.name,
        role: user.role,
        avatar_initials: (user.name || 'User').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
      }));

      // In dev environment, request updated verifiable server token for the switched role
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ switchUserId: userId })
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.token) {
          const current = localStorage.getItem(this.sessionKey);
          if (current) {
            try {
              const parsed = JSON.parse(current);
              parsed.token = data.token;
              localStorage.setItem(this.sessionKey, JSON.stringify(parsed));
            } catch {}
          }
        }
      })
      .catch(() => {});
    }

    return user;
  }

  /**
   * Change user password after verifying old password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new AuthError('USER_NOT_FOUND', 'User not found');
    }

    const user = users[userIndex];
    if (!user.password_hash) {
      throw new AuthError('INVALID_PASSWORD', 'Current password is not stored locally.');
    }
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      throw new AuthError('INVALID_PASSWORD', 'Current password is incorrect');
    }

    const newHash = await hashPassword(newPassword);
    users[userIndex] = {
      ...user,
      password_hash: newHash
    };
    this.saveUsers(users);
    return true;
  }

  /**
   * Admin-level reset password (does not require old password)
   */
  async adminResetPassword(userId: string, newPassword: string): Promise<boolean> {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new AuthError('USER_NOT_FOUND', 'User not found');
    }

    const newHash = await hashPassword(newPassword);
    users[userIndex] = {
      ...users[userIndex],
      password_hash: newHash
    };
    this.saveUsers(users);
    return true;
  }

  /**
   * Update profile fields for a user
   */
  updateProfile(userId: string, updates: Partial<Pick<User, 'name' | 'name_ar' | 'phone' | 'title' | 'territory' | 'avatar_url'>>): User {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new AuthError('USER_NOT_FOUND', 'المستخدم غير موجود / User not found');
    }

    const updatedUser: User = {
      ...users[userIndex],
      ...updates
    };
    users[userIndex] = updatedUser;
    this.saveUsers(users);

    // If currently logged in, update session cache as well
    const session = this.getSession();
    if (session && session.user_id === userId && typeof window !== 'undefined') {
      const cached = localStorage.getItem('crmate_auth_user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          localStorage.setItem('crmate_auth_user', JSON.stringify({
            ...parsed,
            full_name: updatedUser.name,
            name: updatedUser.name,
            avatar_url: updatedUser.avatar_url
          }));
        } catch (e) {
          // ignore cache sync error
        }
      }
    }

    return updatedUser;
  }

  /**
   * Create a new user account (for admin / team onboarding)
   */
  async createUser(userData: {
    name: string;
    name_ar?: string;
    email: string;
    password: string;
    role: UserRole;
    title?: string;
    territory?: string;
    phone?: string;
    avatar_color?: string;
  }): Promise<User> {
    const existing = this.getUserByEmail(userData.email);
    if (existing) {
      throw new AuthError('EMAIL_EXISTS', 'البريد الإلكتروني مسجل بالفعل لمستخدم آخر / Email is already registered');
    }

    const password_hash = await hashPassword(userData.password);
    const users = this.getUsers();
    const newUser: User = {
      id: `u_${Date.now()}`,
      name: userData.name.trim(),
      name_ar: userData.name_ar?.trim() || userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      password_hash,
      role: userData.role,
      avatar_color: userData.avatar_color || '#8FC2F0',
      is_active: true,
      created_at: new Date().toISOString(),
      title: userData.title?.trim() || 'Sales Engineer',
      territory: userData.territory?.trim() || 'Western Region',
      phone: userData.phone?.trim() || ''
    };

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  /**
   * Update full user details by ID (including role, territory, title, phone, email, etc.)
   */
  async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'password_hash'>> & { newPassword?: string }): Promise<User> {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new AuthError('USER_NOT_FOUND', 'المستخدم غير موجود / User not found');
    }

    let password_hash = users[userIndex].password_hash;
    if (updates.newPassword && updates.newPassword.trim()) {
      password_hash = await hashPassword(updates.newPassword.trim());
    }

    const { newPassword, ...restUpdates } = updates;
    const updatedUser: User = {
      ...users[userIndex],
      ...restUpdates,
      password_hash
    };

    users[userIndex] = updatedUser;
    this.saveUsers(users);

    // If currently logged in, update session cache as well
    const session = this.getSession();
    if (session && session.user_id === userId && typeof window !== 'undefined') {
      const cached = localStorage.getItem('crmate_auth_user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          localStorage.setItem('crmate_auth_user', JSON.stringify({
            ...parsed,
            full_name: updatedUser.name,
            name: updatedUser.name,
            role: updatedUser.role,
            avatar_url: updatedUser.avatar_url
          }));
        } catch (e) {
          // ignore cache sync error
        }
      }
    }

    return updatedUser;
  }

  /**
   * Delete user account by ID
   */
  deleteUser(userId: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    if (filtered.length === users.length) return false;
    this.saveUsers(filtered);
    return true;
  }
}

export const authRepository = new LocalAuthRepository();
