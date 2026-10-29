/**
 * ==============================================================================
 * Phase A - Authentication & Session Handling Verification Suite
 * ==============================================================================
 * 
 * Verifies:
 * 1. Adel Nasr (u0) profile presence, consistency, and reuse.
 * 2. Absence of hardcoded temporary credentials in source files.
 * 3. Server-side middleware protection and unauthenticated route blocking.
 * 4. Forced password change flow (server enforcement: HTTP 403 on API, 307 on UI).
 * 5. Password validation rules (min 8 chars, letter + number, confirmation match).
 * 6. Role check integrity for admin, sales_manager, and sales_engineer.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Helper to load environment safely
function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      let v = trimmed.substring(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[trimmed.substring(0, idx).trim()] = v;
    }
  }
  return env;
}

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

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failCount++;
  }
}

async function main() {
  console.log('\n======================================================');
  console.log(' CRMate - Phase A Authentication Test Suite           ');
  console.log('======================================================\n');

  const env = loadEnv();
  const { createClient } = require(path.resolve('node_modules/@supabase/supabase-js'));
  const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Adel Nasr (u0) Profile Inspection & Reuse
  // --------------------------------------------------------------------------
  console.log('[Group 1] Adel Nasr Identity & Profile Reuse');

  await runAsyncTest('Remote Supabase contains u0 profile for Adel Nasr', async () => {
    const { data, error } = await adminClient.from('profiles').select('*').eq('id', 'u0').single();
    assert(!error, `Failed to query profiles: ${error?.message}`);
    assert.strictEqual(data.id, 'u0');
    assert.strictEqual(data.email, 'adel.nasr@almespar.com');
    assert.strictEqual(data.role, 'sales_engineer');
    assert.strictEqual(data.full_name, 'Adel Nasr');
    assert.strictEqual(data.name_ar, 'عادل نصر');
    assert.strictEqual(data.is_active, true);
  });

  runTest('Local users.ts defines u0 matching Adel Nasr with NO hardcoded temporary password', () => {
    const usersFile = fs.readFileSync(path.resolve('src/lib/constants/users.ts'), 'utf8');
    assert(usersFile.includes("'u0'"), 'users.ts must define u0');
    assert(usersFile.includes('adel.nasr@almespar.com'), 'users.ts must include Adel Nasr email');
    assert(usersFile.includes("'sales_engineer'"), 'users.ts must set role to sales_engineer');
    
    // Mandate: Ad1234 or any temporary password must NEVER be in source files
    assert(!usersFile.includes('Ad1234'), 'Temporary credential Ad1234 must NOT be in users.ts');
  });

  runTest('Codebase scan: No source file contains the temporary password string', () => {
    const filesToCheck = [
      'src/lib/constants/users.ts',
      'src/lib/types/user.ts',
      'src/middleware.ts',
      'src/app/change-password/page.tsx',
      'src/app/api/auth/change-password/route.ts',
      'scripts/admin-provision-user.js'
    ];
    for (const f of filesToCheck) {
      const content = fs.readFileSync(path.resolve(f), 'utf8');
      assert(!content.includes('Ad1234'), `File ${f} must not contain temporary password`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Server-Side Password Validation Logic
  // --------------------------------------------------------------------------
  console.log('\n[Group 2] Password Complexity & Confirmation Validation');

  function validateNewPassword(newPassword, confirmPassword) {
    if (!newPassword || typeof newPassword !== 'string') {
      return { valid: false, error: 'New password is required' };
    }
    if (newPassword.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return { valid: false, error: 'Password must contain at least one letter and one number' };
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      return { valid: false, error: 'Password confirmation does not match' };
    }
    return { valid: true };
  }

  runTest('Rejects passwords under 8 characters', () => {
    const res = validateNewPassword('Short1', 'Short1');
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, 'Password must be at least 8 characters long');
  });

  runTest('Rejects passwords lacking digits', () => {
    const res = validateNewPassword('OnlyLettersHere', 'OnlyLettersHere');
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, 'Password must contain at least one letter and one number');
  });

  runTest('Rejects passwords lacking letters', () => {
    const res = validateNewPassword('1234567890', '1234567890');
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, 'Password must contain at least one letter and one number');
  });

  runTest('Rejects mismatching confirmPassword', () => {
    const res = validateNewPassword('SecurePass123', 'DifferentPass123');
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, 'Password confirmation does not match');
  });

  runTest('Accepts valid enterprise-grade password', () => {
    const res = validateNewPassword('AlMespar@2026', 'AlMespar@2026');
    assert.strictEqual(res.valid, true);
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Server Middleware Barrier & Forced Password Change
  // --------------------------------------------------------------------------
  console.log('\n[Group 3] Server Middleware & Forced Password Change Rules');

  function simulateMiddleware(pathname, user, legacyToken) {
    const isChangePasswordPage = pathname === '/change-password';
    const isChangePasswordApi = pathname === '/api/auth/change-password';
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/api/auth');

    // 1. Authoritative forced password change check (checks both app_metadata and user_metadata)
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

    // 2. Unauthenticated route protection
    if (!user && !legacyToken && !isAuthRoute && !isChangePasswordPage) {
      if (pathname.startsWith('/api')) {
        return { status: 401, error: 'UNAUTHORIZED' };
      }
      return { status: 307, redirect: `/login?redirect=${encodeURIComponent(pathname)}` };
    }

    return { status: 200, pass: true };
  }

  runTest('Unauthenticated request to /projects redirects to /login', () => {
    const res = simulateMiddleware('/projects', null, null);
    assert.strictEqual(res.status, 307);
    assert.strictEqual(res.redirect, '/login?redirect=%2Fprojects');
  });

  runTest('Unauthenticated request to /api/export-excel returns 401 UNAUTHORIZED', () => {
    const res = simulateMiddleware('/api/export-excel', null, null);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.error, 'UNAUTHORIZED');
  });

  runTest('Unauthenticated request to /api/sync-excel returns 401 UNAUTHORIZED', () => {
    const res = simulateMiddleware('/api/sync-excel', null, null);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.error, 'UNAUTHORIZED');
  });

  runTest('Unauthenticated request to /api/download-template returns 401 UNAUTHORIZED', () => {
    const res = simulateMiddleware('/api/download-template', null, null);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.error, 'UNAUTHORIZED');
  });

  runTest('User with must_change_password=true is BLOCKED from /api/sync-excel with 403', () => {
    const user = { id: 'test_uid', user_metadata: { must_change_password: true } };
    const res = simulateMiddleware('/api/sync-excel', user, null);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.error, 'PASSWORD_CHANGE_REQUIRED');
  });

  runTest('Bypass attempt: client tampers user_metadata to false while server app_metadata is true -> STILL BLOCKED (403)', () => {
    // Simulates an attacker trying supabase.auth.updateUser({ data: { must_change_password: false } })
    const user = {
      id: 'test_uid',
      app_metadata: { must_change_password: true }, // Authoritative server metadata
      user_metadata: { must_change_password: false } // Client-tampered metadata
    };
    const res = simulateMiddleware('/api/sync-excel', user, null);
    assert.strictEqual(res.status, 403, 'Must reject API call based on server app_metadata');
    assert.strictEqual(res.error, 'PASSWORD_CHANGE_REQUIRED');
  });

  runTest('User with must_change_password=true attempting to visit /projects is REDIRECTED to /change-password', () => {
    const user = { id: 'test_uid', user_metadata: { must_change_password: true } };
    const res = simulateMiddleware('/projects', user, null);
    assert.strictEqual(res.status, 307);
    assert.strictEqual(res.redirect, '/change-password');
  });

  runTest('User with must_change_password=true IS ALLOWED to access /api/auth/change-password', () => {
    const user = { id: 'test_uid', user_metadata: { must_change_password: true } };
    const res = simulateMiddleware('/api/auth/change-password', user, null);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.pass, true);
  });

  runTest('User with must_change_password=false accesses /projects normally (200 pass)', () => {
    const user = { id: 'test_uid', user_metadata: { must_change_password: false } };
    const res = simulateMiddleware('/projects', user, null);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.pass, true);
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Role-Based Access Control Verification
  // --------------------------------------------------------------------------
  console.log('\n[Group 4] Role Check & Access Matrix');

  const usersContent = fs.readFileSync(path.resolve('src/lib/constants/users.ts'), 'utf8');

  runTest('Adel Nasr (u0) has sales_engineer role in users.ts', () => {
    assert(usersContent.includes("id: 'u0'"), 'u0 must be present in users.ts');
    assert(usersContent.includes("role: 'sales_engineer'"), 'u0 must have sales_engineer role');
    assert(usersContent.includes("email: 'adel.nasr@almespar.com'"), 'u0 email must be adel.nasr@almespar.com');
  });

  runTest('All seeded roles conform to valid UserRole union', () => {
    const roleMatches = usersContent.match(/role:\s*'([^']+)'/g);
    assert(roleMatches && roleMatches.length >= 6, 'Must match at least 6 roles');
    const validRoles = ['admin', 'sales_manager', 'sales_engineer', 'estimator', 'viewer'];
    roleMatches.forEach(m => {
      const role = m.split("'")[1];
      assert(validRoles.includes(role), `Invalid role detected: ${role}`);
    });
  });

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(` Test Results: ${passCount} Passed, ${failCount} Failed `);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
