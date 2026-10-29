import { NextResponse } from 'next/server';
import { SEEDED_USERS } from '@/lib/constants/users';
import { verifyPassword } from '@/lib/utils/hash';
import { 
  createSessionToken, 
  authenticateRequest, 
  getAuthSecret 
} from '@/lib/auth/server-token';
import { UserRole } from '@/lib/types/user';

export async function GET(req: Request) {
  const auth = authenticateRequest(req);
  if (!auth.success) {
    return auth.response;
  }

  const seeded = SEEDED_USERS.find(u => u.id === auth.user.id);

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        role: auth.user.role,
        name: seeded?.name || 'CRMate User'
      }
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const isProduction = process.env.NODE_ENV === 'production' && process.env.CRMATE_TEST_MODE !== 'true';

    // 1. Dev / Automated Testing Auto-Session
    if (body.devAutoSession) {
      if (isProduction) {
        return NextResponse.json(
          { error: 'Dev auto-session is strictly disabled in production' },
          { status: 403 }
        );
      }
      const defaultUser = SEEDED_USERS[0]; // u1 (Eslam Al-Mohandes, sales_engineer)
      const token = createSessionToken(
        { id: defaultUser.id, email: defaultUser.email, role: defaultUser.role },
        30
      );

      const response = NextResponse.json({
        success: true,
        token,
        user: {
          id: defaultUser.id,
          name: defaultUser.name,
          email: defaultUser.email,
          role: defaultUser.role
        }
      });

      response.cookies.set('crmate_session_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 86400
      });

      return response;
    }

    // 2. Dev Switch User (for dev panel testing of roles)
    if (body.switchUserId) {
      if (isProduction) {
        return NextResponse.json(
          { error: 'User switching is disabled in production' },
          { status: 403 }
        );
      }
      const targetUser = SEEDED_USERS.find(u => u.id === body.switchUserId);
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const token = createSessionToken(
        { id: targetUser.id, email: targetUser.email, role: targetUser.role },
        7
      );

      const response = NextResponse.json({
        success: true,
        token,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role
        }
      });

      response.cookies.set('crmate_session_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 86400
      });

      return response;
    }

    // 3. Automated Testing Role Token Generation (dev/test only)
    if (body.testRole) {
      if (isProduction) {
        return NextResponse.json(
          { error: 'Test role generation is disabled in production' },
          { status: 403 }
        );
      }
      const validRoles: UserRole[] = ['admin', 'sales_manager', 'sales_engineer', 'estimator', 'viewer'];
      if (!validRoles.includes(body.testRole)) {
        return NextResponse.json({ error: 'Invalid test role' }, { status: 400 });
      }

      const token = createSessionToken(
        { id: `test-${body.testRole}`, email: `test-${body.testRole}@test.almespar.com`, role: body.testRole },
        1
      );

      return NextResponse.json({
        success: true,
        token,
        role: body.testRole
      });
    }

    // 4. Standard Credential Login
    const { email, password, rememberMe } = body;
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = SEEDED_USERS.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    if (!user.password_hash) {
      return NextResponse.json({ error: 'Password authentication not configured for this account. Please use Supabase Auth.' }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const days = rememberMe ? 30 : 7;
    const token = createSessionToken(
      { id: user.id, email: user.email, role: user.role },
      days
    );

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    response.cookies.set('crmate_session_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: days * 86400
    });

    return response;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Failed to process authentication request' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('crmate_session_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0
  });
  return response;
}
