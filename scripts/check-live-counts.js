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

async function check() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const tables = [
    'profiles', 'companies', 'contacts', 'projects', 'project_members',
    'quotations', 'activities', 'planned_activities', 'sales_targets',
    'approval_requests', 'notifications', 'reminders'
  ];

  console.log('Current Live Row Counts:');
  console.log('------------------------------------------------');
  for (const t of tables) {
    const { count, error } = await sb.from(t).select('id', { count: 'exact', head: true });
    if (error) {
      console.log(String(t).padEnd(20) + ' ERROR: ' + error.message);
    } else {
      console.log(String(t).padEnd(20) + String(count).padStart(10));
    }
  }
  console.log('------------------------------------------------');
}

check().catch(console.error);
