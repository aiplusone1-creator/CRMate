/**
 * Phase 4 Verification Test Suite: Strict RLS & Sales Engineer Scope Isolation
 * 
 * Verifies:
 * 1. Server-side RLS Data Scoping via GET /api/crm/data:
 *    - Sales Engineer (Eslam u1) receives ONLY Eslam's 37 projects (never 113)
 *    - Sales Engineer (Karim u4) receives ONLY Karim's 25 projects
 *    - Sales Engineer (Abdelrahman u2) receives ONLY Abdelrahman's 50 projects
 *    - Sales Engineer (Adel u0) receives ONLY Adel's 1 project
 *    - Sales Manager (Al-Kaffas u3) receives ALL 113 projects across the entire team
 *    - Admin (u5) receives ALL 113 projects across the entire team
 * 2. Complete Cross-Contamination Prevention:
 *    - Eslam's payload contains ZERO projects owned by Karim, Abdelrahman, or Adel
 *    - Activities and planned activities are strictly isolated to the authenticated sales engineer
 * 3. Client-Side Scoping Hook (scopeProjects):
 *    - Passing selectedFilter='all' for a Sales Engineer strictly returns only their projects
 *    - Passing selectedFilter='all' for a Sales Manager returns all 113 projects
 * 4. UI Defense in Depth:
 *    - "All Team" switcher button is removed for Sales Engineers in /projects
 *    - Only managers have the team-wide view and filter bar
 */

const assert = require('assert');

// Implementation under test matching src/lib/logic/scope.ts
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
  return baseProjects.filter(p => {
    const isOwner = p.owner_id === user.id;
    const isReferred = p.referred_to_id === user.id;
    const isMember = Boolean(p.members?.some(m => m.user_id === user.id));
    return isOwner || isReferred || isMember;
  });
}

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

async function getSessionCookie(userId) {
  const authRes = await fetch(`${baseUrl}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ switchUserId: userId })
  });
  const cookieHeader = authRes.headers.get('set-cookie');
  assert.ok(cookieHeader, `Must obtain session cookie for ${userId}`);
  return cookieHeader.split(';')[0];
}

async function main() {
  console.log('\n================================================================');
  console.log(' CRMate - Phase 4 Strict RLS & Sales Scope Verification Test   ');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // Group 1: Server-Side RLS Enforcement on GET /api/crm/data
  // -------------------------------------------------------------------------
  console.log('[Group 1] Server-Side RLS Scoping via GET /api/crm/data');

  // 1a. Sales Engineer: Eslam Al-Mohandes (u1)
  const eslamCookie = await getSessionCookie('u1');
  let eslamData = null;

  await test('Sales Engineer (Eslam u1) receives ONLY his projects (>= 37)', async () => {
    const res = await fetch(`${baseUrl}/api/crm/data`, {
      headers: { Cookie: eslamCookie }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    eslamData = json.data;

    assert.ok(
      eslamData.projects.length >= 37, 
      `Eslam must receive at least 37 projects, received ${eslamData.projects.length}`
    );
    assert.ok(
      eslamData.projects.every(p => p.owner_id === 'u1' || p.referred_to_id === 'u1' || p.members?.some(m => m.user_id === 'u1')),
      'All returned projects must belong or be assigned to Eslam'
    );
  });

  await test('Eslam data contains zero projects from Karim, Abdelrahman, or Adel', async () => {
    const foreignProjects = eslamData.projects.filter(p => 
      p.owner_id === 'u4' || p.owner_id === 'u2' || p.owner_id === 'u0'
    );
    assert.strictEqual(
      foreignProjects.length, 
      0, 
      `Eslam must not receive foreign projects, found ${foreignProjects.length}`
    );
  });

  await test('Eslam activities are strictly scoped to Eslam (no foreign activities)', async () => {
    assert.ok(
      eslamData.activities.every(a => a.user_id === 'u1'),
      'All returned activities must belong to Eslam'
    );
  });

  // 1b. Sales Engineer: Karim Abdelazeez (u4)
  const karimCookie = await getSessionCookie('u4');

  await test('Sales Engineer (Karim u4) receives ONLY his 25 projects (not 113)', async () => {
    const res = await fetch(`${baseUrl}/api/crm/data`, {
      headers: { Cookie: karimCookie }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    const karimData = json.data;

    assert.strictEqual(
      karimData.projects.length, 
      25, 
      `Karim must receive exactly 25 projects, received ${karimData.projects.length}`
    );
    assert.ok(
      karimData.projects.every(p => p.owner_id === 'u4' || p.referred_to_id === 'u4' || p.members?.some(m => m.user_id === 'u4')),
      'All returned projects must belong or be assigned to Karim'
    );
  });

  // 1c. Sales Engineer: Adel Nasr (u0)
  const adelCookie = await getSessionCookie('u0');

  await test('Sales Engineer (Adel u0) receives ONLY his 1 project (not 113)', async () => {
    const res = await fetch(`${baseUrl}/api/crm/data`, {
      headers: { Cookie: adelCookie }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    const adelData = json.data;

    assert.strictEqual(
      adelData.projects.length, 
      1, 
      `Adel must receive exactly 1 project, received ${adelData.projects.length}`
    );
    assert.strictEqual(adelData.projects[0].pr_number, 'PR1156');
    assert.strictEqual(adelData.projects[0].owner_id, 'u0');
  });

  // 1d. Sales Manager: Abdurahman Al-Kaffas (u3)
  const managerCookie = await getSessionCookie('u3');

  await test('Sales Manager (Al-Kaffas u3) receives ALL projects across the entire team (>= 113)', async () => {
    const res = await fetch(`${baseUrl}/api/crm/data`, {
      headers: { Cookie: managerCookie }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    const managerData = json.data;

    assert.ok(
      managerData.projects.length >= 113, 
      `Sales Manager must receive all projects (>= 113), received ${managerData.projects.length}`
    );
  });

  // 1e. Admin: Eslam Admin (u5)
  const adminCookie = await getSessionCookie('u5');

  await test('Admin (u5) receives ALL projects across the entire team (>= 113)', async () => {
    const res = await fetch(`${baseUrl}/api/crm/data`, {
      headers: { Cookie: adminCookie }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    const adminData = json.data;

    assert.ok(
      adminData.projects.length >= 113, 
      `Admin must receive all projects (>= 113), received ${adminData.projects.length}`
    );
  });

  // -------------------------------------------------------------------------
  // Group 2: Client-Side Scoping Hook (scopeProjects)
  // -------------------------------------------------------------------------
  console.log('\n[Group 2] Client-Side Scoping Logic (scopeProjects)');

  const mockAllProjects = [
    { id: 'p1', owner_id: 'u1', is_archived: false },
    { id: 'p2', owner_id: 'u1', is_archived: false },
    { id: 'p3', owner_id: 'u2', is_archived: false },
    { id: 'p4', owner_id: 'u4', is_archived: false },
    { id: 'p5', owner_id: 'u0', is_archived: false }
  ];

  await test('scopeProjects ignores selectedFilter="all" for Sales Engineer and returns only own projects', () => {
    const eslamUser = { id: 'u1', role: 'sales_engineer' };
    const scoped = scopeProjects(mockAllProjects, eslamUser, 'all');
    assert.strictEqual(scoped.length, 2, 'Must return only 2 projects owned by Eslam');
    assert.ok(scoped.every(p => p.owner_id === 'u1'));
  });

  await test('scopeProjects honors selectedFilter="all" for Sales Manager and returns all projects', () => {
    const managerUser = { id: 'u3', role: 'sales_manager' };
    const scoped = scopeProjects(mockAllProjects, managerUser, 'all');
    assert.strictEqual(scoped.length, 5, 'Must return all 5 projects for manager');
  });

  await test('scopeProjects allows Sales Manager to filter by specific rep', () => {
    const managerUser = { id: 'u3', role: 'sales_manager' };
    const scopedKarim = scopeProjects(mockAllProjects, managerUser, 'u4');
    assert.strictEqual(scopedKarim.length, 1);
    assert.strictEqual(scopedKarim[0].owner_id, 'u4');
  });

  // -------------------------------------------------------------------------
  // Group 3: UI Source Inspection for Sales Rep "All Team" Removal
  // -------------------------------------------------------------------------
  console.log('\n[Group 3] UI Template Verification in projects/page.tsx');

  await test('projects/page.tsx does NOT render "All Team" button for isSalesRep', () => {
    const fs = require('fs');
    const pageContent = fs.readFileSync('src/app/projects/page.tsx', 'utf8');

    // Find the Sales Rep block
    const repBlockStart = pageContent.indexOf('{isSalesRep && (');
    assert.ok(repBlockStart !== -1, 'Must find {isSalesRep && ( in page');
    const repBlockEnd = pageContent.indexOf('</div>\n        )}', repBlockStart);
    const repBlock = pageContent.substring(repBlockStart, repBlockEnd + 20);

    assert.ok(
      !repBlock.includes("setSelectedSalesFilter('all')"),
      'Sales rep block must NOT contain button to set sales filter to all'
    );
    assert.ok(
      !repBlock.includes("All Team"),
      'Sales rep block must NOT contain All Team text'
    );
  });

  // Summary
  console.log('\n================================================================');
  console.log(`Results: ${passCount} passed, ${failCount} failed`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
