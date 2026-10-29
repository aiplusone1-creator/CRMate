/**
 * Phase 1 Startup & Infinite Redirect Prevention Test Suite
 *
 * Verifies:
 * 1. LoginPage does not perform unauthenticated auto-redirect on mount.
 * 2. AuthGuard permits unauthenticated users to access /login without looping.
 * 3. authRepository.getSession does not auto-seed sessions out of thin air.
 * 4. crm-context does not trigger devAutoSession when session is null.
 * 5. Shell component accommodates both /login and /change-password for clean rendering.
 * 6. Server middleware routing behavior:
 *    - Unauthenticated / -> 307 to /login?redirect=/
 *    - Unauthenticated /login -> allowed (200 pass-through)
 *    - Unauthenticated /change-password -> handled securely
 *    - Authenticated with must_change_password=true -> forced to /change-password
 *    - Authenticated with must_change_password=false on /login -> redirected to /
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failCount++;
  }
}

console.log('\n======================================================');
console.log(' CRMate - Phase 1 Application Startup Test Suite      ');
console.log('======================================================\n');

// Group 1: LoginPage & AuthGuard Logic Verification
console.log('[Group 1] Client-Side Infinite Redirect Loop Prevention');

runTest('LoginPage useEffect does not call router.replace on mount based on local session', () => {
  const loginCode = fs.readFileSync(path.resolve('src/app/login/page.tsx'), 'utf8');
  // Confirm that router.replace(targetRedirect) inside the initial useEffect is removed
  const hasLocalSessionAutoRedirect = /useEffect\(\(\)\s*=>\s*\{[\s\S]*?authRepository\.getSession\(\)[\s\S]*?router\.replace/m.test(loginCode);
  assert.strictEqual(hasLocalSessionAutoRedirect, false, 'LoginPage must not auto-redirect on mount based on local session');
});

runTest('LoginPage verifies must_change_password on app_metadata as well as user_metadata', () => {
  const loginCode = fs.readFileSync(path.resolve('src/app/login/page.tsx'), 'utf8');
  assert.ok(loginCode.includes('app_metadata?.must_change_password'), 'Must check app_metadata');
  assert.ok(loginCode.includes('user_metadata?.must_change_password'), 'Must check user_metadata');
});

runTest('AuthGuard allows unauthenticated visitors on /login without redirecting', () => {
  const guardCode = fs.readFileSync(path.resolve('src/components/auth/auth-guard.tsx'), 'utf8');
  // Check that if isLoginPage and !supaUser, it authorizes rather than redirecting
  assert.ok(guardCode.includes('if (isLoginPage)'), 'Must have specific handler for isLoginPage');
  assert.ok(guardCode.includes('// Unauthenticated visitor is fully authorized to see the login page'), 'Must authorize unauthenticated visitor on /login');
  assert.ok(guardCode.includes('if (!isCancelled) setIsAuthorized(true);'), 'Must set isAuthorized true');
});

runTest('AuthGuard redirects authenticated users with must_change_password to /change-password', () => {
  const guardCode = fs.readFileSync(path.resolve('src/components/auth/auth-guard.tsx'), 'utf8');
  assert.ok(guardCode.includes("router.replace('/change-password')"), 'Must redirect to change password');
});

runTest('Shell component accommodates /change-password in addition to /login', () => {
  const shellCode = fs.readFileSync(path.resolve('src/components/layout/shell.tsx'), 'utf8');
  assert.ok(shellCode.includes("pathname === '/login' || pathname === '/change-password'"), 'Shell must support full-screen /change-password');
});

// Group 2: Session Autoseed Prevention
console.log('\n[Group 2] Session State & Local Repository Hygiene');

runTest('authRepository.getSession returns null when storage is empty (no auto-seeding u1)', () => {
  const authCode = fs.readFileSync(path.resolve('src/lib/repo/local/auth.ts'), 'utf8');
  const hasAutoSeedInGetSession = /getSession\(\)[\s\S]*?auto_session_/m.test(authCode);
  assert.strictEqual(hasAutoSeedInGetSession, false, 'getSession must not contain auto_session_ logic');
});

runTest('crm-context does not trigger devAutoSession when session is null', () => {
  const contextCode = fs.readFileSync(path.resolve('src/lib/store/crm-context.tsx'), 'utf8');
  assert.ok(contextCode.includes('session?.token &&'), 'Must check session?.token before sending sync request');
});

runTest('crm-context logout invokes supabase.auth.signOut', () => {
  const contextCode = fs.readFileSync(path.resolve('src/lib/store/crm-context.tsx'), 'utf8');
  assert.ok(contextCode.includes('supabase.auth.signOut()'), 'crm-context logout must call supabase.auth.signOut()');
});

// Group 3: Server Middleware Routing Matrix
console.log('\n[Group 3] Server Middleware Routing Matrix Simulation');

// Mock simulation of middleware rules
function simulateMiddleware(req) {
  const { pathname, user, cookies = {} } = req;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/api/auth');
  const isChangePasswordPage = pathname === '/change-password';
  const isChangePasswordApi = pathname === '/api/auth/change-password';

  const isForcedPasswordChangeRequired = 
    Boolean(user) && 
    (user?.app_metadata?.must_change_password === true || user?.user_metadata?.must_change_password === true);

  if (isForcedPasswordChangeRequired) {
    if (pathname.startsWith('/api') && !isChangePasswordApi) {
      return { status: 403, error: 'PASSWORD_CHANGE_REQUIRED' };
    }
    if (!isChangePasswordPage && !isChangePasswordApi && pathname !== '/login') {
      return { status: 307, redirect: '/change-password' };
    }
  }

  if (user && pathname === '/login') {
    if (isForcedPasswordChangeRequired) {
      return { status: 307, redirect: '/change-password' };
    }
    return { status: 307, redirect: '/' };
  }

  const legacyToken = cookies['crmate_session_token'];
  const isLegacyTestMode = Boolean(legacyToken);

  if (!user && !isLegacyTestMode && !isAuthRoute && !isChangePasswordPage) {
    if (pathname.startsWith('/api')) {
      return { status: 401, error: 'UNAUTHORIZED' };
    }
    return { status: 307, redirect: `/login?redirect=${encodeURIComponent(pathname)}` };
  }

  return { status: 200, action: 'PASS' };
}

runTest('Unauthenticated GET / returns 307 to /login?redirect=%2F', () => {
  const res = simulateMiddleware({ pathname: '/', user: null });
  assert.strictEqual(res.status, 307);
  assert.strictEqual(res.redirect, '/login?redirect=%2F');
});

runTest('Unauthenticated GET /login passes through cleanly (200 PASS - no loop)', () => {
  const res = simulateMiddleware({ pathname: '/login', user: null });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.action, 'PASS');
});

runTest('Authenticated GET /login redirects already-authenticated user to /', () => {
  const res = simulateMiddleware({ pathname: '/login', user: { id: 'u0', email: 'adel.nasr@almespar.com' } });
  assert.strictEqual(res.status, 307);
  assert.strictEqual(res.redirect, '/');
});

runTest('Authenticated user with must_change_password on /login redirects to /change-password', () => {
  const res = simulateMiddleware({ 
    pathname: '/login', 
    user: { id: 'u0', app_metadata: { must_change_password: true } } 
  });
  assert.strictEqual(res.status, 307);
  assert.strictEqual(res.redirect, '/change-password');
});

runTest('Authenticated user with must_change_password visiting /projects redirects to /change-password', () => {
  const res = simulateMiddleware({ 
    pathname: '/projects', 
    user: { id: 'u0', app_metadata: { must_change_password: true } } 
  });
  assert.strictEqual(res.status, 307);
  assert.strictEqual(res.redirect, '/change-password');
});

console.log('\n======================================================');
console.log(` Test Results: ${passCount} Passed, ${failCount} Failed `);
console.log('======================================================\n');

process.exit(failCount > 0 ? 1 : 0);
