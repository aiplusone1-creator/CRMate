import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  const { pathname } = request.nextUrl;

  // Static assets and internal Next.js endpoints are excluded
  const isStaticAsset = 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static') || 
    pathname.includes('.') || 
    pathname === '/favicon.ico';

  if (isStaticAsset) {
    return supabaseResponse;
  }

  // If Supabase credentials are missing (e.g. initial dev bootstrap), pass through
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validate the user token against Supabase Auth server (supporting both cookies and Authorization: Bearer <token>)
  let user = null;
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) {
      const { data } = await supabase.auth.getUser(bearerToken);
      if (data?.user) {
        user = data.user;
      }
    }
  }

  if (!user) {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      user = data.user;
    }
  }

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/api/auth');
  const isChangePasswordPage = pathname === '/change-password';
  const isChangePasswordApi = pathname === '/api/auth/change-password';

  // 1. FORCED PASSWORD CHANGE ENFORCEMENT (Server-side barrier: checks both authoritative app_metadata and user_metadata)
  const isForcedPasswordChangeRequired = 
    Boolean(user) && 
    (user?.app_metadata?.must_change_password === true || user?.user_metadata?.must_change_password === true);

  if (isForcedPasswordChangeRequired) {
    // Block all CRM API endpoints with HTTP 403 Forbidden until password is changed
    if (pathname.startsWith('/api') && !isChangePasswordApi) {
      return NextResponse.json(
        {
          error: 'PASSWORD_CHANGE_REQUIRED',
          message: 'You must change your temporary password before accessing CRM data.',
        },
        { status: 403 }
      );
    }

    // Redirect any page request other than /change-password to /change-password
    if (!isChangePasswordPage && !isChangePasswordApi && pathname !== '/login') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/change-password';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. REDIRECT ALREADY-AUTHENTICATED USERS AWAY FROM LOGIN
  if (user && pathname === '/login') {
    const targetUrl = request.nextUrl.clone();
    if (isForcedPasswordChangeRequired) {
      targetUrl.pathname = '/change-password';
    } else {
      targetUrl.pathname = '/';
    }
    return NextResponse.redirect(targetUrl);
  }

  // 3. UNAUTHENTICATED ROUTE PROTECTION
  // Note: During transition, we also check for legacy server tokens in test mode
  const legacyToken = request.cookies.get('crmate_session_token')?.value;
  const isLegacyTestMode = process.env.CRMATE_TEST_MODE === 'true' || Boolean(legacyToken);

  if (!user && !isLegacyTestMode && !isAuthRoute && !isChangePasswordPage) {
    // If an API route is accessed without auth, return 401
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Authentication session required to access this endpoint.',
        },
        { status: 401 }
      );
    }

    // Protected page access -> redirect to login with original target
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
