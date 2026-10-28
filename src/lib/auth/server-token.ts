import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { UserRole } from '@/lib/types/user';

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// In-memory runtime fallback secret for production when AUTH_SECRET is not explicitly set in env
let runtimeProductionSecret: string | null = null;

/**
 * Resolve the cryptographic secret for HMAC-SHA256 signing
 */
export function getAuthSecret(): string {
  const envSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (envSecret && envSecret.trim().length > 0) {
    return envSecret.trim();
  }

  // Safe deterministic secret for local development and automated testing environments
  if (process.env.NODE_ENV !== 'production') {
    return 'crmate-dev-hmac-auth-secret-key-2026-secure';
  }

  // In production, require an unguessable runtime secret if none was configured
  if (!runtimeProductionSecret) {
    runtimeProductionSecret = crypto.randomBytes(32).toString('hex');
    console.warn(
      '⚠️ SECURITY NOTICE: AUTH_SECRET environment variable is not defined. CRMate generated an ephemeral runtime secret for session validation.'
    );
  }
  return runtimeProductionSecret;
}

/**
 * Generate a cryptographically signed HMAC-SHA256 session token
 */
export function createSessionToken(
  user: { id: string; email: string; role: UserRole },
  expiresInDays: number = 7
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + Math.max(1, expiresInDays) * 86400;

  const payload: TokenPayload = {
    sub: user.id,
    email: user.email.toLowerCase().trim(),
    role: user.role,
    iat,
    exp
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = getAuthSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

export type VerifyResult =
  | { valid: true; user: SessionUser }
  | { valid: false; error: string; code: 'MISSING' | 'INVALID' | 'EXPIRED' | 'MALFORMED' };

/**
 * Verify HMAC-SHA256 session token integrity and expiration
 */
export function verifySessionToken(token?: string | null): VerifyResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Authentication token is required', code: 'MISSING' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed token format', code: 'MALFORMED' };
  }

  const [payloadB64, signature] = parts;
  const secret = getAuthSecret();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return { valid: false, error: 'Invalid or tampered token signature', code: 'INVALID' };
  }

  try {
    const rawPayload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: TokenPayload = JSON.parse(rawPayload);

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= now) {
      return { valid: false, error: 'Session token has expired', code: 'EXPIRED' };
    }

    const validRoles: UserRole[] = [
      'admin',
      'sales_manager',
      'sales_engineer',
      'estimator',
      'viewer'
    ];
    if (!validRoles.includes(payload.role)) {
      return { valid: false, error: 'Invalid role in token payload', code: 'INVALID' };
    }

    return {
      valid: true,
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role
      }
    };
  } catch (err) {
    return { valid: false, error: 'Failed to decode token payload', code: 'MALFORMED' };
  }
}

/**
 * Parse standard cookie header string into key-value map
 */
export function parseCookieHeader(cookieHeader?: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [name, ...values] = pair.trim().split('=');
    if (name) {
      result[name.trim()] = decodeURIComponent(values.join('='));
    }
  }
  return result;
}

export type AuthResult =
  | { success: true; user: SessionUser }
  | { success: false; response: NextResponse };

/**
 * Server-side route handler authorization check
 * Validates token from Authorization: Bearer <token> or crmate_session_token cookie,
 * checks expiration, validates roles, and prevents CSRF on state-mutating methods.
 */
export function authenticateRequest(
  req: Request,
  allowedRoles?: UserRole[]
): AuthResult {
  const authHeader = req.headers.get('authorization');
  const cookieHeader = req.headers.get('cookie');

  let token: string | null = null;
  let isFromCookie = false;

  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const cookies = parseCookieHeader(cookieHeader);
    if (cookies['crmate_session_token']) {
      token = cookies['crmate_session_token'];
      isFromCookie = true;
    }
  }

  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Authentication required', code: 'UNAUTHORIZED' },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      )
    };
  }

  const verifyResult = verifySessionToken(token);
  if (!verifyResult.valid) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error:
            verifyResult.code === 'EXPIRED'
              ? 'Unauthorized: Session expired'
              : 'Unauthorized: Invalid or tampered credentials',
          code: 'UNAUTHORIZED'
        },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      )
    };
  }

  // CSRF Protection for state-mutating HTTP methods when using cookie authentication
  if (isFromCookie && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method.toUpperCase())) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return {
            success: false,
            response: NextResponse.json(
              { error: 'Forbidden: Cross-origin request rejected', code: 'CSRF_REJECTED' },
              { status: 403 }
            )
          };
        }
      } catch {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Forbidden: Malformed request origin', code: 'CSRF_REJECTED' },
            { status: 403 }
          )
        };
      }
    }
  }

  // Role-based Access Control
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(verifyResult.user.role)) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Forbidden: Insufficient permissions for this resource',
            code: 'FORBIDDEN'
          },
          {
            status: 403,
            headers: {
              'Cache-Control': 'no-store, max-age=0',
              'X-Content-Type-Options': 'nosniff'
            }
          }
        )
      };
    }
  }

  return { success: true, user: verifyResult.user };
}
