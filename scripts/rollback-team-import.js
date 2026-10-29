/**
 * CRMate — Safe Rollback Utility for Team Data Import
 *
 * Deletes ONLY the exact records recorded in a specific import manifest file.
 * Requires: --manifest <path_to_manifest_file>
 *
 * Safety:
 * - Broad pattern queries and wildcard matching are PERMANENTLY DISABLED.
 * - Profiles table is NEVER modified or deleted.
 * - Pre-existing records are NEVER deleted.
 * - Deletes strictly in reverse foreign-key dependency order by exact primary key chunks.
 * - Dry-run preview by default; requires --confirm-rollback to execute.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf8');
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

async function runRollback() {
  const isConfirmed = process.argv.includes('--confirm-rollback');
  const manifestIdx = process.argv.indexOf('--manifest');

  console.log('========================================================================');
  console.log(' CRMate — Safe Rollback Utility for Team-Data Import');
  console.log('========================================================================\n');

  if (manifestIdx === -1 || !process.argv[manifestIdx + 1]) {
    console.error('FATAL: --manifest <path_to_manifest_file> is required.');
    console.error('Broad wildcard pattern matching and ID prefix heuristics are prohibited.');
    console.error('\nUsage:');
    console.error('  node scripts/rollback-team-import.js --manifest backups/import_manifest_<timestamp>.json');
    console.error('  node scripts/rollback-team-import.js --manifest backups/import_manifest_<timestamp>.json --confirm-rollback\n');
    process.exit(1);
  }

  const manifestPath = path.resolve(process.argv[manifestIdx + 1]);
  if (!fs.existsSync(manifestPath)) {
    console.error(`FATAL: Manifest file not found at: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`[✓] Loaded Manifest: ${path.basename(manifestPath)}`);
  console.log(`[✓] Import Run ID:   ${manifest.import_run_id}`);
  console.log(`[✓] Timestamp:       ${manifest.timestamp}`);
  console.log(`[✓] Mode:            ${manifest.mode}\n`);

  if (!manifest.tables || typeof manifest.tables !== 'object') {
    console.error('FATAL: Invalid manifest format (missing tables object).');
    process.exit(1);
  }

  // Safety assertion: profiles must never be in deletion list
  if (manifest.tables.profiles && manifest.tables.profiles.inserted_ids && manifest.tables.profiles.inserted_ids.length > 0) {
    console.error('FATAL: Manifest illegally lists profiles for deletion. Aborting for safety.');
    process.exit(1);
  }

  // Strict reverse foreign-key dependency order
  const ROLLBACK_ORDER = [
    'planned_activities',
    'activities',
    'projects',
    'contacts',
    'companies'
  ];

  console.log('Manifest Target Records by Table:');
  console.log('------------------------------------------------------------------------');
  let totalTargets = 0;
  for (const table of ROLLBACK_ORDER) {
    const ids = manifest.tables[table]?.inserted_ids || [];
    totalTargets += ids.length;
    console.log(String(table).padEnd(25) + String(ids.length).padStart(10) + ' records to delete');
  }
  console.log('------------------------------------------------------------------------');
  console.log(String('TOTAL TO DELETE').padEnd(25) + String(totalTargets).padStart(10));
  console.log('------------------------------------------------------------------------\n');

  if (!isConfirmed) {
    console.log('[INFO] DRY-RUN / PREVIEW ONLY: Zero remote records modified or deleted.');
    console.log('To execute this exact manifest rollback against remote Supabase, re-run with:');
    console.log(`  node scripts/rollback-team-import.js --manifest "${process.argv[manifestIdx + 1]}" --confirm-rollback\n`);
    return;
  }

  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('Executing exact ID deletions in reverse dependency order...');
  for (const table of ROLLBACK_ORDER) {
    const ids = manifest.tables[table]?.inserted_ids || [];
    if (ids.length === 0) continue;

    console.log(`Deleting ${ids.length} records from '${table}' by exact primary key...`);
    const chunkSize = 100;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const { error } = await supabase.from(table).delete().in('id', chunk);
      if (error) {
        throw new Error(`Rollback failed on table '${table}' chunk ${i}: ${error.message}`);
      }
    }
    console.log(`  [✓] Successfully deleted ${ids.length} records from '${table}'.`);
  }

  console.log('\n[SUCCESS] Exact rollback completed successfully!');
  console.log('Pre-existing records, profiles, and unlisted entities remain 100% untouched.\n');
}

runRollback().catch(err => {
  console.error('\n[ROLLBACK ERROR]:', err.message);
  process.exit(1);
});
