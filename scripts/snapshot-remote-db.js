/**
 * CRMate — Remote Database Snapshot Utility
 *
 * Takes a comprehensive, read-only snapshot of all 14 public tables in Supabase
 * before any data import.
 *
 * Output: backups/supabase_snapshot_<ISO_TIMESTAMP>.json
 * Safety:
 * - 100% READ-ONLY (SELECT only, zero writes)
 * - Excludes any credentials/keys from output
 * - Paginates safely across large tables
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to load env safely without printing
function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found');
  }
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

const ALL_TABLES = [
  'profiles',
  'companies',
  'contacts',
  'projects',
  'project_members',
  'quotations',
  'activities',
  'planned_activities',
  'sales_targets',
  'approval_requests',
  'notifications',
  'reminders',
  'chat_conversations',
  'chat_messages',
];

async function fetchAllRows(supabase, table) {
  const pageSize = 1000;
  let from = 0;
  let allRows = [];

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Error fetching from table '${table}': ${error.message}`);
    }

    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

async function main() {
  console.log('========================================================================');
  console.log(' CRMate — Remote Supabase Snapshot Utility');
  console.log('========================================================================\n');

  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupsDir = path.resolve('backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const snapshotFile = path.join(backupsDir, `supabase_snapshot_${timestamp}.json`);
  const snapshotData = {
    metadata: {
      timestamp: new Date().toISOString(),
      supabase_project_ref: supabaseUrl.replace(/https?:\/\/([^.]+).*/, '$1'),
      tables_count: ALL_TABLES.length,
      tables: {},
    },
    tables: {},
  };

  console.log(`Snapshot target: ${snapshotFile}\n`);
  console.log('Fetching table data...');
  console.log('------------------------------------------------------------------------');
  console.log(String('Table Name').padEnd(25) + String('Row Count').padStart(12) + String('Status').padStart(15));
  console.log('------------------------------------------------------------------------');

  let totalRows = 0;

  for (const table of ALL_TABLES) {
    try {
      const rows = await fetchAllRows(supabase, table);
      snapshotData.tables[table] = rows;
      snapshotData.metadata.tables[table] = rows.length;
      totalRows += rows.length;
      console.log(
        String(table).padEnd(25) +
        String(rows.length).padStart(12) +
        String('OK').padStart(15)
      );
    } catch (err) {
      console.log(
        String(table).padEnd(25) +
        String('ERROR').padStart(12) +
        String(err.message).padStart(30)
      );
      snapshotData.metadata.tables[table] = { error: err.message };
    }
  }

  console.log('------------------------------------------------------------------------');
  console.log(String('TOTAL ROWS').padEnd(25) + String(totalRows).padStart(12));
  console.log('------------------------------------------------------------------------\n');

  // Write snapshot file safely
  fs.writeFileSync(snapshotFile, JSON.stringify(snapshotData, null, 2), 'utf8');
  const fileStat = fs.statSync(snapshotFile);
  const sizeMb = (fileStat.size / (1024 * 1024)).toFixed(2);

  console.log(`[SUCCESS] Remote snapshot created safely!`);
  console.log(`  File: ${snapshotFile}`);
  console.log(`  Size: ${sizeMb} MB (${fileStat.size} bytes)`);
  console.log(`  Total Tables: ${ALL_TABLES.length}`);
  console.log(`  Total Rows Captured: ${totalRows}\n`);
}

main().catch(err => {
  console.error('Snapshot failed:', err);
  process.exit(1);
});
