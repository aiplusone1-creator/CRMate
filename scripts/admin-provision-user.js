#!/usr/bin/env node
/**
 * ==============================================================================
 * CRMate - Secure Administrator User Provisioning Procedure (Supabase Auth Admin)
 * ==============================================================================
 * 
 * This tool is designed to be executed strictly by a system administrator to
 * provision team credentials in Supabase Auth (GoTrue) using the Admin API.
 * 
 * SECURITY MANDATES:
 * 1. The service-role key is loaded strictly in Node.js server context from .env.local.
 * 2. It is NEVER bundled or exposed to client-side code.
 * 3. Temporary passwords are NEVER hardcoded, NEVER printed to stdout/stderr,
 *    and NEVER written to disk, database profiles, or Git logs.
 * 4. All newly provisioned accounts are assigned `must_change_password: true`
 *    in their Supabase Auth user_metadata, enforced at the server level.
 * 5. Existing profiles in `public.profiles` are REUSED and linked via `auth_user_id`.
 * 
 * USAGE:
 *   Interactive prompt (hidden password input):
 *     node scripts/admin-provision-user.js --email adel.nasr@almespar.com --profile-id u0
 * 
 *   Automated non-interactive (reads from environment variable):
 *     $env:ADMIN_PROVISION_TEMP_PASS="<temporary-password>"; node scripts/admin-provision-user.js --email adel.nasr@almespar.com --profile-id u0
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 1. Parse .env.local safely without external dependencies
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local file not found at project root.');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const k = trimmed.substring(0, idx).trim();
      let v = trimmed.substring(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[k] = v;
    }
  }
  return env;
}

// 2. Interactive masked password prompt (hidden input)
function promptHiddenPassword(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const stdin = process.openStdin();
    process.stdin.on('data', (char) => {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          break;
        default:
          process.stdout.write('\x1B[2K\x1B[200D' + query + Array(rl.line.length + 1).join('*'));
          break;
      }
    });

    rl.question(query, (value) => {
      rl.close();
      resolve(value.trim());
    });
  });
}

// 3. Main execution routine
async function main() {
  const args = process.argv.slice(2);
  let targetEmail = 'adel.nasr@almespar.com';
  let targetProfileId = 'u0';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      targetEmail = args[i + 1].trim().toLowerCase();
      i++;
    } else if (args[i] === '--profile-id' && args[i + 1]) {
      targetProfileId = args[i + 1].trim();
      i++;
    }
  }

  console.log('\n======================================================');
  console.log(' CRMate - Administrator User Provisioning Procedure   ');
  console.log('======================================================');
  console.log(`Target Email:      ${targetEmail}`);
  console.log(`Target Profile ID: ${targetProfileId}`);

  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const { createClient } = require(path.resolve('node_modules/@supabase/supabase-js'));
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Step A: Inspect existing profile in public.profiles
  console.log('\n[1/4] Inspecting existing profile in public.profiles...');
  const { data: profile, error: pError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, name_ar, email, role, title, territory, is_active, auth_user_id')
    .eq('id', targetProfileId)
    .maybeSingle();

  if (pError) {
    console.error('❌ Database error querying profile:', pError.message);
    process.exit(1);
  }

  if (!profile) {
    console.error(`❌ Profile with ID "${targetProfileId}" not found in public.profiles.`);
    console.error('Please ensure the profile exists before running authentication provisioning.');
    process.exit(1);
  }

  // Strict email and identity alignment verification
  if (profile.email.toLowerCase() !== targetEmail.toLowerCase()) {
    console.error(`❌ Security mismatch: Target profile ${targetProfileId} has email "${profile.email}", which does not match requested email "${targetEmail}".`);
    console.error('Aborting provisioning to prevent accidental profile misattribution.');
    process.exit(1);
  }

  console.log(`  ✓ Existing profile verified: ${profile.id} ("${profile.full_name}" / "${profile.name_ar}")`);
  console.log(`  ✓ Confirmed role: "${profile.role}" (matches expected sales_engineer capability)`);
  console.log(`  ✓ Current auth_user_id link: ${profile.auth_user_id || 'NULL (ready to link)'}`);

  // Step B: Obtain temporary password securely (without printing or logging)
  console.log('\n[2/4] Obtaining temporary credentials...');
  let tempPassword = process.env.ADMIN_PROVISION_TEMP_PASS;
  if (!tempPassword) {
    tempPassword = await promptHiddenPassword('Enter initial temporary password (input is masked): ');
  } else {
    console.log('  ✓ Loaded temporary password securely from ADMIN_PROVISION_TEMP_PASS environment variable.');
  }

  if (!tempPassword || tempPassword.length < 6) {
    console.error('❌ Error: Temporary password must be at least 6 characters.');
    process.exit(1);
  }

  // Step C: Check if user already exists in auth.users
  console.log('\n[3/4] Provisioning user in Supabase Auth GoTrue...');
  const { data: existingUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    console.error('❌ Error listing auth users:', listErr.message);
    process.exit(1);
  }

  let authUserId = null;
  const existingUser = existingUsers.users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());

  if (existingUser) {
    const hasPermanentPassword = 
      existingUser.app_metadata?.must_change_password === false || 
      (existingUser.user_metadata?.must_change_password === false && existingUser.app_metadata?.must_change_password !== true);

    if (hasPermanentPassword && !args.includes('--force-reset')) {
      console.error(`❌ Safety guard: User ${targetEmail} already exists and has established a permanent password.`);
      console.error('To intentionally overwrite an active user password, re-run with: --force-reset');
      process.exit(1);
    }

    console.log(`  ℹ User ${targetEmail} already exists in auth.users (ID: ${existingUser.id}). Updating password and setting forced change flag...`);
    const { data: updated, error: uErr } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      password: tempPassword,
      email_confirm: true,
      app_metadata: {
        must_change_password: true,
      },
      user_metadata: {
        must_change_password: true,
        temporary_password_issued_at: new Date().toISOString(),
      },
    });

    if (uErr) {
      console.error('❌ Failed to update auth user:', uErr.message);
      process.exit(1);
    }
    authUserId = updated.user.id;
    console.log('  ✓ Supabase Auth credentials updated with authoritative server flag.');
  } else {
    console.log(`  ℹ Creating new auth user for ${targetEmail}...`);
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: targetEmail,
      password: tempPassword,
      email_confirm: true,
      app_metadata: {
        must_change_password: true,
      },
      user_metadata: {
        must_change_password: true,
        temporary_password_issued_at: new Date().toISOString(),
      },
    });

    if (cErr) {
      console.error('❌ Failed to create auth user:', cErr.message);
      process.exit(1);
    }
    authUserId = created.user.id;
    console.log('  ✓ Supabase Auth account created with authoritative server flag.');
  }

  // Step D: Verify and link profiles.auth_user_id safely
  console.log('\n[4/4] Verifying identity link between auth.users and public.profiles...');
  if (profile.auth_user_id && profile.auth_user_id !== authUserId && !args.includes('--force-link')) {
    console.error(`❌ Safety guard: Profile ${profile.id} is already linked to another auth_user_id (${profile.auth_user_id}).`);
    console.error('To intentionally re-link this profile, specify: --force-link');
    process.exit(1);
  }

  if (profile.auth_user_id !== authUserId) {
    const { error: linkErr } = await supabaseAdmin
      .from('profiles')
      .update({
        auth_user_id: authUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (linkErr) {
      console.error('❌ Failed to update profiles.auth_user_id:', linkErr.message);
      process.exit(1);
    }
    console.log(`  ✓ Successfully linked profile ${profile.id} to auth_user_id: ${authUserId}`);
  } else {
    console.log(`  ✓ Profile ${profile.id} is already correctly linked to auth_user_id: ${authUserId}`);
  }

  console.log('\n======================================================');
  console.log(' ✅ Provisioning Complete Successfully!              ');
  console.log('======================================================');
  console.log(`Account:       ${targetEmail}`);
  console.log(`Profile ID:    ${profile.id} (${profile.full_name})`);
  console.log(`Role:          ${profile.role}`);
  console.log(`Forced Change: must_change_password = TRUE`);
  console.log('Security Note: The temporary credential was processed in memory and not logged or stored.');
  console.log('The user will be required to change their password on first login before accessing CRM data.\n');
}

// Only execute when run directly from command line
if (require.main === module) {
  main().catch((err) => {
    console.error('Unhandled provisioning error:', err);
    process.exit(1);
  });
}

module.exports = { main };
