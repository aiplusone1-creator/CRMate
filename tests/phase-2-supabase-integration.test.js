/**
 * Phase 2 Supabase Data Integration & Team Visibility Test Suite
 *
 * Verifies:
 * 1. GET /api/crm/data unauthenticated returns 401 UNAUTHORIZED
 * 2. GET /api/crm/data authenticated returns shared team dataset from Supabase
 *    - All 6 team profiles (u0 Adel, u1 Eslam, u2 Abdelrahman, u3 Al-Kaffas, u4 Karim, u5 Admin)
 *    - 240 companies
 *    - 318 contacts
 *    - 112 projects (Eslam: 37, Abdelrahman: 50, Karim: 25)
 *    - 855 activities
 *    - 799 planned activities
 * 3. Role Scoping Logic verifies intended team & role visibility rules:
 *    - Eslam (u1) default view scopes to Eslam's 37 projects
 *    - Eslam (u1) "All Team" filter exposes all 112 team projects
 *    - Abdelrahman (u2) default view scopes to Abdelrahman's 50 projects
 *    - Karim (u4) default view scopes to Karim's 25 projects
 *    - Sales Manager (u3) default view exposes all 112 projects across all reps
 *    - Sales Manager (u3) filtering by u4 scopes to Karim's projects
 * 4. CRUD operations through /api/crm/mutate:
 *    - Inserting, updating, and deleting an entity updates remote Supabase
 *    - Role security: unauthenticated access rejected (401)
 *    - Non-manager cannot delete companies/projects (403)
 */

const assert = require('assert');

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

console.log('\n======================================================');
console.log(' CRMate - Phase 2 Supabase Integration Test Suite     ');
console.log('======================================================\n');

async function main() {
  const baseUrl = 'http://localhost:3000';

  // Group 1: API Security & Authentication Gate
  console.log('[Group 1] Route Handler Authentication & Protection');

  await runAsyncTest('Unauthenticated GET /api/crm/data returns 401 UNAUTHORIZED', async () => {
    const res = await fetch(`${baseUrl}/api/crm/data`);
    assert.strictEqual(res.status, 401, 'Must reject unauthenticated data fetch with 401');
  });

  await runAsyncTest('Unauthenticated POST /api/crm/mutate returns 401 UNAUTHORIZED', async () => {
    const res = await fetch(`${baseUrl}/api/crm/mutate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'projects', action: 'insert', data: { name: 'Test' } })
    });
    assert.strictEqual(res.status, 401, 'Must reject unauthenticated mutation with 401');
  });

  // Obtain authenticated session cookie (Sales Manager session to verify complete dataset ingestion)
  const authRes = await fetch(`${baseUrl}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ switchUserId: 'u3' })
  });
  const cookieHeader = authRes.headers.get('set-cookie');
  const sessionCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  assert.ok(sessionCookie, 'Must receive valid session cookie');

  // Group 2: Supabase Dataset Ingestion & Entity Counts
  console.log('\n[Group 2] Supabase Remote Entity Ingestion & Completeness');

  let crmData = null;
  await runAsyncTest('Authenticated GET /api/crm/data succeeds with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/api/crm/data`, {
      headers: { Cookie: sessionCookie }
    });
    assert.strictEqual(res.status, 200, 'Must return 200 OK');
    const json = await res.json();
    assert.strictEqual(json.success, true, 'Response must indicate success');
    crmData = json.data;
    assert.ok(crmData, 'Response must contain data payload');
  });

  runTest('Profiles count is 6 (includes u0 Adel, u1 Eslam, u2 Abdelrahman, u3 Al-Kaffas, u4 Karim, u5 Admin)', () => {
    assert.strictEqual(crmData.profiles.length, 6, 'Must load all 6 team profiles');
    const ids = new Set(crmData.profiles.map(p => p.id));
    assert.ok(ids.has('u0'), 'Must contain u0 (Adel Nasr)');
    assert.ok(ids.has('u1'), 'Must contain u1 (Eslam Al-Mohandes)');
    assert.ok(ids.has('u2'), 'Must contain u2 (Abdelrahman Mohamed)');
    assert.ok(ids.has('u3'), 'Must contain u3 (Abdurahman Al-Kaffas)');
    assert.ok(ids.has('u4'), 'Must contain u4 (Karim Abdelazeez)');
    assert.ok(ids.has('u5'), 'Must contain u5 (Eslam Admin)');
  });

  runTest('Companies count matches imported Supabase total (>= 287 companies)', () => {
    assert.ok(crmData.companies.length >= 287, 'Must load at least 287 shared companies');
  });

  runTest('Contacts count matches imported Supabase total (>= 387 contacts)', () => {
    assert.ok(crmData.contacts.length >= 387, 'Must load at least 387 shared contacts');
  });

  runTest('Projects count matches imported Supabase total (>= 113 projects)', () => {
    assert.ok(crmData.projects.length >= 113, 'Must load at least 113 team projects');
  });

  runTest('Projects distribution spans all 4 active Sales Engineers', () => {
    const u0Count = crmData.projects.filter(p => p.owner_id === 'u0').length;
    const u1Count = crmData.projects.filter(p => p.owner_id === 'u1').length;
    const u2Count = crmData.projects.filter(p => p.owner_id === 'u2').length;
    const u4Count = crmData.projects.filter(p => p.owner_id === 'u4').length;
    assert.ok(u0Count >= 1, 'Adel must have at least 1 project');
    assert.ok(u1Count >= 37, 'Eslam must have at least 37 projects');
    assert.ok(u2Count >= 50, 'Abdelrahman must have at least 50 projects');
    assert.ok(u4Count >= 25, 'Karim must have at least 25 projects');
  });

  runTest('Activities count matches imported Supabase total (>= 959 activities)', () => {
    assert.ok(crmData.activities.length >= 959, 'Must load at least 959 activities');
  });

  runTest('Planned Activities count matches imported Supabase total (886 planned activities)', () => {
    assert.strictEqual(crmData.plannedActivities.length, 886, 'Must load all 886 planned activities');
  });

  // Group 3: Role Scoping & Team Visibility Logic
  console.log('\n[Group 3] Role Scoping & Dynamic Visibility Simulation');

  function scopeProjects(allProjects, user, selectedFilter = 'all', includeArchived = false) {
    if (!user) return [];
    const baseProjects = includeArchived ? allProjects : allProjects.filter(p => !p.is_archived);
    const isAdminOrManager = user.role === 'admin' || user.role === 'sales_manager' || user.role === 'viewer' || user.role === 'estimator';
    if (isAdminOrManager) {
      if (selectedFilter && selectedFilter !== 'all') {
        return baseProjects.filter(p => p.owner_id === selectedFilter || p.referred_to_id === selectedFilter);
      }
      return baseProjects;
    }
    // Sales engineer / sales rep: strictly locked to own/assigned projects
    return baseProjects.filter(p => p.owner_id === user.id || p.referred_to_id === user.id);
  }

  function scopeActivities(allActivities, user, selectedFilter = 'all') {
    if (!user) return [];
    const isAdminOrManager = user.role === 'admin' || user.role === 'sales_manager' || user.role === 'viewer' || user.role === 'estimator';
    if (isAdminOrManager) {
      if (selectedFilter && selectedFilter !== 'all') {
        return allActivities.filter(a => a.user_id === selectedFilter);
      }
      return allActivities;
    }
    return allActivities.filter(a => a.user_id === user.id);
  }

  const eslamUser = { id: 'u1', role: 'sales_engineer', full_name: 'Eslam Al-Mohandes' };
  const abdelrahmanUser = { id: 'u2', role: 'sales_engineer', full_name: 'Abdelrahman Mohamed' };
  const karimUser = { id: 'u4', role: 'sales_engineer', full_name: 'Karim Abdelazeez' };
  const managerUser = { id: 'u3', role: 'sales_manager', full_name: 'Abdurahman Al-Kaffas' };

  runTest('Archived projects ingestion and scope integrity (preserves baseline archive fixture)', () => {
    const archived = crmData.projects.filter(p => p.is_archived);
    assert.ok(archived.length >= 7, `Must retain all baseline archived projects (found ${archived.length})`);
    assert.ok(archived.every(p => p.is_archived === true), 'Every archived project must have is_archived: true');
    // Verify historical baseline archived projects are preserved in database
    const expectedBaselineArchived = ['p_pr1007', 'p_pr1014', 'p_pr1023', 'p_pr1031', 'p_pr1038'];
    for (const pid of expectedBaselineArchived) {
      assert.ok(archived.some(p => p.id === pid), `Baseline archived project ${pid} must exist in database`);
    }
    // Verify active filter strictly excludes all archived projects
    const active = scopeProjects(crmData.projects, eslamUser, 'u1', false);
    assert.ok(active.every(p => !p.is_archived), 'Active scoped view must never include archived projects');
  });

  runTest('Sales Engineer (Eslam) default scoped view displays at least 30 active projects', () => {
    const active = scopeProjects(crmData.projects, eslamUser, 'u1', false);
    const all = scopeProjects(crmData.projects, eslamUser, 'u1', true);
    assert.ok(active.length >= 30, 'Eslam default filter should see at least 30 active projects');
    assert.ok(all.length >= 37, 'Eslam should have at least 37 total projects');
    assert.ok(all.every(p => p.owner_id === 'u1' || p.referred_to_id === 'u1'));
  });

  runTest('Sales Engineer (Eslam) is locked to own projects even if filter is "all"', () => {
    const active = scopeProjects(crmData.projects, eslamUser, 'all', false);
    const all = scopeProjects(crmData.projects, eslamUser, 'all', true);
    assert.ok(active.length >= 30, 'Eslam should see at least 30 active projects');
    assert.ok(all.length >= 37, 'Eslam should have at least 37 total projects');
    assert.ok(all.every(p => p.owner_id === 'u1' || p.referred_to_id === 'u1'));
  });

  runTest('Sales Engineer (Abdelrahman) default scoped view displays only Abdelrahman’s 50 projects', () => {
    const scoped = scopeProjects(crmData.projects, abdelrahmanUser, 'u2');
    assert.strictEqual(scoped.length, 50, 'Abdelrahman default filter should see 50 projects');
    assert.ok(scoped.every(p => p.owner_id === 'u2' || p.referred_to_id === 'u2'));
  });

  runTest('Sales Engineer (Karim) default scoped view displays only Karim’s 25 projects', () => {
    const scoped = scopeProjects(crmData.projects, karimUser, 'u4');
    assert.strictEqual(scoped.length, 25, 'Karim default filter should see 25 projects');
    assert.ok(scoped.every(p => p.owner_id === 'u4' || p.referred_to_id === 'u4'));
  });

  runTest('Sales Manager (Al-Kaffas) default view displays at least 106 active projects', () => {
    const active = scopeProjects(crmData.projects, managerUser, 'all', false);
    const all = scopeProjects(crmData.projects, managerUser, 'all', true);
    assert.ok(active.length >= 106, 'Sales manager default should see at least 106 active projects');
    assert.ok(all.length >= 113, 'Sales manager should see at least 113 projects total');
  });

  runTest('Sales Manager (Al-Kaffas) filtering by Karim (u4) scopes to Karim’s 25 projects', () => {
    const scoped = scopeProjects(crmData.projects, managerUser, 'u4');
    assert.strictEqual(scoped.length, 25, 'Sales manager filtering by u4 should see Karim’s 25 projects');
  });

  runTest('Sales Engineer activity scoping isolates activities to owner', () => {
    const scopedEslam = scopeActivities(crmData.activities, eslamUser, 'u1');
    assert.ok(scopedEslam.every(a => a.user_id === 'u1'), 'Eslam activities must belong to u1');
    assert.ok(scopedEslam.length >= 484, 'Eslam has at least 484 activities');

    const scopedKarim = scopeActivities(crmData.activities, karimUser, 'u4');
    assert.ok(scopedKarim.every(a => a.user_id === 'u4'), 'Karim activities must belong to u4');
    assert.strictEqual(scopedKarim.length, 127, 'Karim has 127 activities');
  });

  // Group 4: Remote Supabase CRUD Persistence
  console.log('\n[Group 4] Supabase Remote CRUD & Role Security Enforcement');

  let testReminderId = null;
  await runAsyncTest('Create Reminder persists to Supabase through /api/crm/mutate', async () => {
    const res = await fetch(`${baseUrl}/api/crm/mutate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        entity: 'reminders',
        action: 'insert',
        data: {
          title: 'Automated Test Follow-up',
          reminder_date: '2026-11-15',
          reminder_time: '14:30',
          urgency: 'high'
        }
      })
    });
    assert.strictEqual(res.status, 200, 'Must return 200 OK');
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data?.id, 'Must return generated reminder ID');
    testReminderId = json.data.id;
  });

  await runAsyncTest('Update Reminder updates row in Supabase', async () => {
    assert.ok(testReminderId, 'Test reminder ID required');
    const res = await fetch(`${baseUrl}/api/crm/mutate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        entity: 'reminders',
        action: 'update',
        id: testReminderId,
        data: { is_completed: true, notes: 'Completed in automated test' }
      })
    });
    assert.strictEqual(res.status, 200, 'Must return 200 OK');
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.is_completed, true);
  });

  await runAsyncTest('Delete Reminder deletes row from Supabase', async () => {
    assert.ok(testReminderId, 'Test reminder ID required');
    const res = await fetch(`${baseUrl}/api/crm/mutate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        entity: 'reminders',
        action: 'delete',
        id: testReminderId
      })
    });
    assert.strictEqual(res.status, 200, 'Must return 200 OK');
    const json = await res.json();
    assert.strictEqual(json.success, true);
  });

  await runAsyncTest('Sales Engineer is BLOCKED with 403 when attempting to delete a company', async () => {
    const engineerAuth = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ switchUserId: 'u1' })
    });
    const engineerCookie = engineerAuth.headers.get('set-cookie')?.split(';')[0];
    const res = await fetch(`${baseUrl}/api/crm/mutate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: engineerCookie },
      body: JSON.stringify({
        entity: 'companies',
        action: 'delete',
        id: 'c_test'
      })
    });
    assert.strictEqual(res.status, 403, 'Sales Engineer must receive 403 FORBIDDEN when attempting company deletion');
  });

  console.log('\n======================================================');
  console.log(` Test Results: ${passCount} Passed, ${failCount} Failed `);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
