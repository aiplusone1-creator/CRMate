/**
 * CRMate - Safe Rollback Script for Adel Nasr Import
 * 
 * Usage:
 *   node scripts/rollback-adel-import.js <path-to-manifest.json>
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
const envLocalPath = path.resolve('.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

async function rollback() {
  const manifestPath = process.argv[2];
  if (!manifestPath || !fs.existsSync(manifestPath)) {
    console.error('Usage: node scripts/rollback-adel-import.js <path-to-adel_import_manifest.json>');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`Loaded import manifest: ${manifest.run_id} (${manifest.timestamp})`);

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Reverse FK order
  const order = ['planned_activities', 'activities', 'project_members', 'projects', 'contacts', 'companies'];

  for (const table of order) {
    const ids = manifest.tables[table]?.inserted || [];
    if (ids.length === 0) continue;

    console.log(`Deleting ${ids.length} newly inserted rows from '${table}'...`);
    const chunkSize = 200;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      if (table === 'project_members') {
        for (const item of chunk) {
          const [projectId, userId] = item.split('::');
          await sb.from(table).delete().match({ project_id: projectId, user_id: userId });
        }
      } else {
        const { error } = await sb.from(table).delete().in('id', chunk);
        if (error) console.error(`Error deleting from ${table}:`, error.message);
      }
    }
  }

  console.log('Rollback completed.');
}

rollback().catch(console.error);
