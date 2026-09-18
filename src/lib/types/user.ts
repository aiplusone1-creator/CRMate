export type UserRole = 
  | 'admin' 
  | 'sales_manager' 
  | 'sales_engineer' 
  | 'estimator' 
  | 'viewer';

export interface User {
  id: string;
  name: string;
  name_ar: string;
  email: string;
  password_hash: string;
  role: UserRole;
  avatar_color: string;
  is_active: boolean;
  created_at: string;
  title?: string;
  territory?: string;
  phone?: string;
}

export interface AuthSession {
  user_id: string;
  token: string;
  expires_at: string;
  remember_me?: boolean;
}

export type AuthErrorCode = 
  | 'INVALID_EMAIL' 
  | 'INVALID_PASSWORD' 
  | 'INACTIVE_USER';

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}
