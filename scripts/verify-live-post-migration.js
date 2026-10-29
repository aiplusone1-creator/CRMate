const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
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

async function verify() {
  const env = loadEnv();
  const sbUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const sb = createClient(sbUrl, sbKey);

  console.log('================================================================');
  console.log(' Live Remote Supabase Post-Migration Verification               ');
  console.log(' Target Project: ' + sbUrl);
  console.log('================================================================\n');

  // 1. Verify contacts.created_by column existence
  console.log('1. Checking contacts.created_by column on live remote DB...');
  const { data: testData, error: testErr } = await sb.from('contacts').select('id, full_name, created_by').limit(5);
  if (testErr) {
    console.error('❌ FAILED: Column contacts.created_by query error:', testErr.message);
    return;
  }
  console.log('✓ SUCCESS: contacts.created_by column EXISTS in live database!');
  console.log('Sample data:', testData);

  // 2. Fetch all contacts and inspect created_by distribution
  console.log('\n2. Fetching all contacts from live remote DB...');
  const { data: allContacts, error: contErr } = await sb.from('contacts').select('id, full_name, created_by');
  if (contErr || !allContacts) {
    console.error('❌ FAILED to fetch contacts:', contErr?.message);
    return;
  }

  const distribution = {};
  allContacts.forEach(c => {
    const key = c.created_by || 'NULL';
    distribution[key] = (distribution[key] || 0) + 1;
  });

  console.log('------------------------------------------------');
  console.log('Actual Live Contacts created_by Distribution:');
  console.log(distribution);
  console.log('Total Contacts count:', allContacts.length);
  console.log('------------------------------------------------');

  // Compare with expected counts:
  const expected = { u1: 158, u2: 81, u4: 77, u0: 69, NULL: 2 };
  console.log('Expected Distribution:', expected);

  let matchesExpected = true;
  for (const [k, v] of Object.entries(expected)) {
    if (distribution[k] !== v) {
      console.log(`❌ Discrepancy for ${k}: Actual=${distribution[k]}, Expected=${v}`);
      matchesExpected = false;
    } else {
      console.log(`✓ Exact Match for ${k}: ${v}`);
    }
  }

  // 3. Verify specific unassigned records: cnt_151 and ct_fahad_zahrani
  console.log('\n3. Checking intentionally unassigned records:');
  const { data: unassigned, error: unassignedErr } = await sb
    .from('contacts')
    .select('id, full_name, created_by')
    .in('id', ['cnt_151', 'ct_fahad_zahrani']);

  if (unassignedErr) {
    console.error('Error querying unassigned records:', unassignedErr.message);
  } else {
    unassigned.forEach(c => {
      const isNull = c.created_by === null;
      console.log(`  - [${c.id}] ${c.full_name}: created_by = ${c.created_by} (${isNull ? '✓ PASS: NULL' : '❌ FAIL: NOT NULL'})`);
    });
  }

  // 4. Verify companies table was NOT altered
  console.log('\n4. Checking companies created_by distribution (must remain untouched):');
  const { data: allCompanies, error: compErr } = await sb.from('companies').select('id, created_by');
  if (compErr) {
    console.error('Error querying companies:', compErr.message);
  } else {
    const compDist = {};
    allCompanies.forEach(c => {
      const key = c.created_by || 'NULL';
      compDist[key] = (compDist[key] || 0) + 1;
    });
    console.log('Actual Companies created_by Distribution:', compDist);
    console.log('Total Companies count:', allCompanies.length);
    const expectedCompDist = { u1: 131, u4: 61, u0: 47, u2: 42, NULL: 6 };
    console.log('Expected Companies Distribution:', expectedCompDist);
    let compMatches = true;
    for (const [k, v] of Object.entries(expectedCompDist)) {
      if (compDist[k] !== v) {
        console.log(`❌ Discrepancy in companies for ${k}: Actual=${compDist[k]}, Expected=${v}`);
        compMatches = false;
      }
    }
    if (compMatches) {
      console.log('✓ PASS: Company attribution distribution remains 100% intact and untouched!');
    }
  }
}

verify().catch(console.error);
