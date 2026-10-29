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

async function verifyAdel() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  const adel = users.find(u => u.email === 'adel.nasr@almespar.com');
  console.log('Adel Auth User Found:', Boolean(adel));
  if (adel) {
    console.log('User ID:', adel.id);
    console.log('App Metadata:', JSON.stringify(adel.app_metadata));
    console.log('User Metadata:', JSON.stringify(adel.user_metadata));
    console.log('Must Change Password in App Metadata:', adel.app_metadata?.must_change_password === true);
    console.log('Must Change Password in User Metadata:', adel.user_metadata?.must_change_password === true);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, auth_user_id')
    .eq('id', 'u0')
    .single();

  console.log('Profile u0 in public.profiles:', JSON.stringify(profile));
  console.log('Linked Auth User ID match:', profile?.auth_user_id === adel?.id);
}

verifyAdel().catch(console.error);
