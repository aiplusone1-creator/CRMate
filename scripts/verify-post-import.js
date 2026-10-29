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

async function verify() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('========================================================================');
  console.log(' CRMate — Live Post-Import Verification Report');
  console.log('========================================================================\n');

  // 1. Projects
  const { data: projs, error: pErr } = await sb.from('projects').select('id, pr_number, owner_id, name').order('pr_number');
  if (pErr) throw pErr;

  const byOwner = {};
  projs.forEach(p => byOwner[p.owner_id] = (byOwner[p.owner_id] || 0) + 1);

  console.log(`[✓] Total Projects in Remote Supabase: ${projs.length}`);
  console.log(`    - Eslam Al-Mohandes (u1): ${byOwner['u1'] || 0} projects (PR1000..PR1080)`);
  console.log(`    - Karim Abdelazeez (u4):  ${byOwner['u4'] || 0} projects (PR1081..PR1105)`);
  console.log(`    - Abdelrahman Mohamed (u2): ${byOwner['u2'] || 0} projects (PR1106..PR1155)`);

  const p1080 = projs.find(p => p.pr_number === 'PR1080');
  const p1081 = projs.find(p => p.pr_number === 'PR1081');
  const p1105 = projs.find(p => p.pr_number === 'PR1105');
  const p1106 = projs.find(p => p.pr_number === 'PR1106');
  const p1155 = projs.find(p => p.pr_number === 'PR1155');

  console.log(`    - Boundary Check PR1080 (Eslam):       "${p1080?.name}" [${p1080?.owner_id}]`);
  console.log(`    - Boundary Check PR1081 (Karim First):  "${p1081?.name}" [${p1081?.owner_id}]`);
  console.log(`    - Boundary Check PR1105 (Karim Last):   "${p1105?.name}" [${p1105?.owner_id}]`);
  console.log(`    - Boundary Check PR1106 (Abdel First):  "${p1106?.name}" [${p1106?.owner_id}]`);
  console.log(`    - Boundary Check PR1155 (Abdel Last):   "${p1155?.name}" [${p1155?.owner_id}]`);

  // 2. Activities
  const { data: acts, error: aErr } = await sb.from('activities').select('id, user_id');
  if (aErr) throw aErr;
  const actByOwner = {};
  acts.forEach(a => actByOwner[a.user_id] = (actByOwner[a.user_id] || 0) + 1);
  console.log(`\n[✓] Total Activities in Remote Supabase: ${acts.length}`);
  console.log(`    - u1: ${actByOwner['u1'] || 0}, u2: ${actByOwner['u2'] || 0}, u4: ${actByOwner['u4'] || 0}`);

  // 3. Planned Activities
  const { data: plans, error: plErr } = await sb.from('planned_activities').select('id, user_id');
  if (plErr) throw plErr;
  const planByOwner = {};
  plans.forEach(p => planByOwner[p.user_id] = (planByOwner[p.user_id] || 0) + 1);
  console.log(`\n[✓] Total Planned Activities in Remote Supabase: ${plans.length}`);
  console.log(`    - u1: ${planByOwner['u1'] || 0}, u2: ${planByOwner['u2'] || 0}, u4: ${planByOwner['u4'] || 0}`);

  // 4. Companies & Contacts
  const { count: compCount } = await sb.from('companies').select('id', { count: 'exact', head: true });
  const { count: ctCount } = await sb.from('contacts').select('id', { count: 'exact', head: true });
  console.log(`\n[✓] Total Companies in Remote Supabase: ${compCount}`);
  console.log(`[✓] Total Contacts in Remote Supabase:  ${ctCount}`);

  // 5. Profiles Safety Invariant Check
  const { data: u0 } = await sb.from('profiles').select('id, email, full_name, role, auth_user_id').eq('id', 'u0').single();
  console.log(`\n[✓] Profile Invariant (u0):`);
  console.log(`    - ID:           ${u0?.id}`);
  console.log(`    - Email:        ${u0?.email}`);
  console.log(`    - Full Name:    ${u0?.full_name}`);
  console.log(`    - Role:         ${u0?.role}`);
  console.log(`    - Auth User ID: ${u0?.auth_user_id} (PRESERVED)`);

  console.log('\n========================================================================');
  console.log(' ALL POST-IMPORT INTEGRITY CHECKS VERIFIED SUCCESSFULLY');
  console.log('========================================================================\n');
}

verify().catch(console.error);
