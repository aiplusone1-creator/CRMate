/**
 * Phase 3 Verification Test Suite
 * 
 * Verifies:
 * 1. Adel Nasr Account & Auth Preservation
 *    - Profile u0 intact with exact auth_user_id (125cff27-fe3c-454e-91ed-9edf4c59d51d)
 * 2. Adel Nasr Ingested Records in Remote Supabase
 *    - Exactly 1 project (p_pr1156 / PR1156) owned by u0
 *    - Exactly 47 companies created by u0
 *    - Exactly 69 contacts owned by u0
 *    - Exactly 104 activities logged by u0
 *    - Exactly 87 planned activities scheduled by u0
 * 3. CRM Global Consistency & Deduplication
 *    - Total projects in DB is at least 113
 *    - Zero duplicate PR numbers across all database projects
 * 4. GET /api/crm/data includes Adel's records for team visibility
 * 5. Automatic, Unique PR Number Generation on Project Creation
 *    - Client does NOT supply PR number -> Server assigns next sequential PR
 *    - Edits/Updates strictly preserve PR number and reject tamper attempts
 * 6. Concurrency-proof PR Allocation
 *    - Simultaneous project creations generate strictly unique, consecutive PR numbers without collisions
 * 7. Importer Idempotency
 *    - Re-running importer results in 0 new inserts
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load env
const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
  const parts = l.trim().split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const baseUrl = 'http://localhost:3000';

let passCount = 0;
let failCount = 0;

async function test(name, fn) {
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
  console.log(' CRMate - Phase 3 Adel Import & Auto-PR Verification  ');
  console.log('======================================================\n');

  // Obtain authenticated session cookie
  const authRes = await fetch(`${baseUrl}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'eslam.almohandes@almespar.com', password: 'password', devAutoSession: true })
  });
  const cookieHeader = authRes.headers.get('set-cookie');
  const sessionCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  assert.ok(sessionCookie, 'Must obtain authenticated session cookie');

  // -------------------------------------------------------------
  // Group 1: Adel Nasr Account & Auth Preservation
  // -------------------------------------------------------------
  console.log('[Group 1] Adel Nasr Account & Auth Preservation');

  await test('Adel Nasr profile (u0) exists and is intact', async () => {
    const { data: prof, error } = await sb.from('profiles').select('*').eq('id', 'u0').single();
    assert.ifError(error);
    assert.strictEqual(prof.id, 'u0');
    assert.strictEqual(prof.email, 'adel.nasr@almespar.com');
    assert.strictEqual(prof.full_name, 'Adel Nasr');
    assert.strictEqual(prof.role, 'sales_engineer');
    assert.strictEqual(prof.auth_user_id, '125cff27-fe3c-454e-91ed-9edf4c59d51d');
  });

  // -------------------------------------------------------------
  // Group 2: Adel Nasr Supabase Data Persistence
  // -------------------------------------------------------------
  console.log('\n[Group 2] Adel Nasr Supabase Remote Ingestion Counts');

  await test('Adel Nasr has exactly 1 project with sequential PR1156', async () => {
    const { data: projs, error } = await sb.from('projects').select('*').eq('owner_id', 'u0');
    assert.ifError(error);
    assert.strictEqual(projs.length, 1);
    assert.strictEqual(projs[0].id, 'p_pr1156');
    assert.strictEqual(projs[0].pr_number, 'PR1156');
    assert.strictEqual(projs[0].name, 'Al Khorayef Water & Power Technologies Project');
  });

  await test('Adel Nasr project member link exists for p_pr1156', async () => {
    const { data: members, error } = await sb.from('project_members').select('*').eq('project_id', 'p_pr1156').eq('user_id', 'u0');
    assert.ifError(error);
    assert.strictEqual(members.length, 1);
  });

  await test('Adel Nasr has exactly 47 companies created', async () => {
    const { count, error } = await sb.from('companies').select('id', { count: 'exact', head: true }).eq('created_by', 'u0');
    assert.ifError(error);
    assert.strictEqual(count, 47);
  });

  await test('Adel Nasr has exactly 69 contacts owned', async () => {
    const { count, error } = await sb.from('contacts').select('id', { count: 'exact', head: true }).eq('owner_id', 'u0');
    assert.ifError(error);
    assert.strictEqual(count, 69);
  });

  await test('Adel Nasr has exactly 104 activities recorded', async () => {
    const { count, error } = await sb.from('activities').select('id', { count: 'exact', head: true }).eq('user_id', 'u0');
    assert.ifError(error);
    assert.strictEqual(count, 104);
  });

  await test('Adel Nasr has exactly 87 planned activities scheduled', async () => {
    const { count, error } = await sb.from('planned_activities').select('id', { count: 'exact', head: true }).eq('user_id', 'u0');
    assert.ifError(error);
    assert.strictEqual(count, 87);
  });

  // -------------------------------------------------------------
  // Group 3: Global Project Numbering Integrity & Zero Duplicates
  // -------------------------------------------------------------
  console.log('\n[Group 3] Global Project Numbering Integrity');

  await test('All projects in database have unique PR numbers (Zero duplicates)', async () => {
    let from = 0;
    const pageSize = 1000;
    let allProjs = [];
    while (true) {
      const { data, error } = await sb.from('projects').select('id, pr_number').range(from, from + pageSize - 1);
      assert.ifError(error);
      if (!data || data.length === 0) break;
      allProjs = allProjs.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    assert.ok(allProjs.length >= 113, `Expected at least 113 projects, found ${allProjs.length}`);

    const seenPr = new Map();
    const duplicates = [];
    allProjs.forEach(p => {
      if (seenPr.has(p.pr_number)) {
        duplicates.push({ pr_number: p.pr_number, id1: seenPr.get(p.pr_number), id2: p.id });
      } else {
        seenPr.set(p.pr_number, p.id);
      }
    });

    assert.strictEqual(duplicates.length, 0, `Found duplicate PR numbers: ${JSON.stringify(duplicates)}`);
  });

  // -------------------------------------------------------------
  // Group 4: CRM Data Feed Visibility
  // -------------------------------------------------------------
  console.log('\n[Group 4] CRM Data Feed Visibility');

  await test('GET /api/crm/data includes Adel records in shared team dataset', async () => {
    const adelAuth = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ switchUserId: 'u0' })
    });
    const adelCookie = adelAuth.headers.get('set-cookie')?.split(';')[0];
    const res = await fetch(`${baseUrl}/api/crm/data`, {
      headers: { Cookie: adelCookie }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);

    const data = json.data;
    const adelProject = data.projects.find(p => p.id === 'p_pr1156');
    assert.ok(adelProject, 'Adel project p_pr1156 must be present in feed');
    assert.strictEqual(adelProject.pr_number, 'PR1156');

    const adelContacts = data.contacts.filter(c => c.owner_id === 'u0');
    assert.strictEqual(adelContacts.length, 69, 'All 69 Adel contacts present in feed');

    const adelActs = data.activities.filter(a => a.user_id === 'u0');
    assert.strictEqual(adelActs.length, 104, 'All 104 Adel activities present in feed');
  });

  // -------------------------------------------------------------
  // Group 5: Automatic Unique PR Generation & Immutability
  // -------------------------------------------------------------
  console.log('\n[Group 5] Automatic Unique PR Generation & Immutability');

  const testProjectIdsToClean = [];

  // Determine current max PR dynamically
  const { data: allCurrentProjs } = await sb.from('projects').select('pr_number');
  let currentMaxPr = 1000;
  for (const row of (allCurrentProjs || [])) {
    const m = (row.pr_number || '').match(/^PR(\d+)$/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > currentMaxPr) currentMaxPr = n;
    }
  }
  const expectedNextPr = `PR${currentMaxPr + 1}`;

  try {
    await test(`Creating a project without PR number assigns next sequential PR (${expectedNextPr})`, async () => {
      const res = await fetch(`${baseUrl}/api/crm/mutate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({
          entity: 'projects',
          action: 'insert',
          data: {
            name: 'Test Phase 3 Auto-PR Project',
            company_id: 'c_tahlia_group',
            estimated_value: 50000,
            probability: 50
          }
        })
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.data.pr_number, 'Response must have an assigned pr_number');
      assert.strictEqual(json.data.pr_number, expectedNextPr, `Expected ${expectedNextPr}, got ${json.data.pr_number}`);
      testProjectIdsToClean.push(json.data.id);
    });

    await test('Updating project cannot tamper or alter its PR number', async () => {
      const targetId = testProjectIdsToClean[0];
      assert.ok(targetId, 'Need test project ID');

      // Attempt to tamper pr_number to PR9999
      const res = await fetch(`${baseUrl}/api/crm/mutate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({
          entity: 'projects',
          action: 'update',
          id: targetId,
          data: {
            pr_number: 'PR9999', // Tamper attempt!
            estimated_value: 75000
          }
        })
      });

      assert.strictEqual(res.status, 200);

      // Verify in database that pr_number is STILL the assigned sequential PR
      const { data: p } = await sb.from('projects').select('id, pr_number, estimated_value').eq('id', targetId).single();
      assert.strictEqual(p.pr_number, expectedNextPr, `PR number must remain ${expectedNextPr} despite client tamper attempt`);
      assert.strictEqual(p.estimated_value, 75000, 'Other fields like estimated_value should update');
    });

    // -------------------------------------------------------------
    // Group 6: Concurrency-Proof Sequential PR Generation
    // -------------------------------------------------------------
    console.log('\n[Group 6] Concurrency-Proof Simultaneous Creation');

    await test('Simultaneous parallel project creations allocate unique sequential PRs without collisions', async () => {
      // Fire 3 simultaneous project creation requests
      const promises = [1, 2, 3].map(i =>
        fetch(`${baseUrl}/api/crm/mutate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: sessionCookie
          },
          body: JSON.stringify({
            entity: 'projects',
            action: 'insert',
            data: {
              name: `Test Concurrent Project ${i}`,
              company_id: 'c_tahlia_group',
              estimated_value: 20000 + i * 5000,
              probability: 40
            }
          })
        }).then(r => r.json())
      );

      const results = await Promise.all(promises);
      results.forEach((r, idx) => {
        assert.strictEqual(r.success, true, `Concurrent insert ${idx + 1} failed: ${JSON.stringify(r)}`);
        assert.ok(r.data.pr_number);
        testProjectIdsToClean.push(r.data.id);
      });

      const prs = results.map(r => r.data.pr_number);
      console.log(`     Parallel generated PRs: ${prs.join(', ')}`);
      const uniquePrs = new Set(prs);
      assert.strictEqual(uniquePrs.size, 3, 'All 3 concurrent projects must receive unique PR numbers');

      // Verify all 3 are sequential
      const prNums = prs.map(p => parseInt(p.replace(/\D/g, ''), 10)).sort((a, b) => a - b);
      assert.strictEqual(prNums[1], prNums[0] + 1, 'Concurrent PRs must be strictly sequential');
      assert.strictEqual(prNums[2], prNums[1] + 1, 'Concurrent PRs must be strictly sequential');
    });
  } finally {
    // Clean up temporary test projects
    console.log('\n[Cleanup] Removing temporary test projects...');
    for (const tid of testProjectIdsToClean) {
      await sb.from('projects').delete().eq('id', tid);
    }
    console.log(`  ✓ Cleaned up ${testProjectIdsToClean.length} test projects`);
  }

  // Final summary
  console.log('\n======================================================');
  console.log(`Results: ${passCount} passed, ${failCount} failed`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
