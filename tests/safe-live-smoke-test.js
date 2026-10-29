/**
 * CRMate VIP - Safe Smoke Test Suite
 *
 * Verifies live system behavior:
 * 1. Authentication & session verification
 * 2. VIP data loading from live database
 * 3. Creating a clearly labeled test VIP item
 * 4. Refreshing/fetching data to verify remote persistence
 * 5. Role-based visibility (Sales Engineer isolation vs Manager team view)
 * 6. Safe cleanup of the temporary smoke test item
 */

const assert = require('assert');

async function runSmokeTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('\n================================================================');
  console.log(' CRMate VIP - Safe Live Smoke Tests                             ');
  console.log('================================================================\n');

  // 1. Authenticate as Eslam (u1)
  console.log('1. Authentication Smoke Test...');
  const authRes1 = await fetch(`${baseUrl}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ switchUserId: 'u1' })
  });
  assert.strictEqual(authRes1.status, 200, 'Must authenticate u1 successfully');
  const cookie1 = authRes1.headers.get('set-cookie');
  assert.ok(cookie1, 'Must receive session cookie');
  console.log('  ✓ PASS: Authentication and session cookie generated for Sales Engineer (u1)');

  // 2. VIP Loading Smoke Test
  console.log('\n2. VIP Data Loading Smoke Test...');
  const loadRes1 = await fetch(`${baseUrl}/api/crm/data`, {
    headers: { 'Cookie': cookie1 },
    cache: 'no-store'
  });
  assert.strictEqual(loadRes1.status, 200, 'Must load CRM data successfully');
  const loadJson1 = await loadRes1.json();
  assert.ok(loadJson1.success, 'Response must be success: true');
  assert.ok(Array.isArray(loadJson1.data.vipItems), 'Must return vipItems array');
  const initialVipCount = loadJson1.data.vipItems.length;
  console.log(`  ✓ PASS: VIP items loaded from live database (initial count: ${initialVipCount})`);

  // 3. Create Clearly Labeled Smoke Test VIP Item
  console.log('\n3. VIP Item Creation Smoke Test...');
  const smokeTestId = `vip_smoke_${Date.now()}`;
  const smokePayload = {
    id: smokeTestId,
    category: 'revisit_project',
    title: '[SMOKE-TEST] Live Deployment Verification Item',
    priority: 'high',
    status: 'pending',
    notes: 'Temporary automated smoke test item. Safe for cleanup.'
  };

  const createRes = await fetch(`${baseUrl}/api/crm/mutate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie1
    },
    body: JSON.stringify({
      entity: 'vip_items',
      action: 'insert',
      data: smokePayload
    })
  });
  assert.strictEqual(createRes.status, 200, 'Create mutation must return 200');
  const createJson = await createRes.json();
  assert.ok(createJson.success, 'Create mutation must succeed');
  assert.strictEqual(createJson.data.created_by, 'u1', 'Server must stamp created_by: u1');
  console.log('  ✓ PASS: Smoke test item created and saved to live database');

  // 4. Persistence Verification (Simulating Refresh/Reload)
  console.log('\n4. Refresh & Persistence Verification...');
  const refreshRes = await fetch(`${baseUrl}/api/crm/data`, {
    headers: { 'Cookie': cookie1 },
    cache: 'no-store'
  });
  assert.strictEqual(refreshRes.status, 200);
  const refreshJson = await refreshRes.json();
  const refreshedItem = refreshJson.data.vipItems.find(v => v.id === smokeTestId);
  assert.ok(refreshedItem, 'Persisted smoke test item must exist upon fresh server fetch');
  assert.strictEqual(refreshedItem.title, '[SMOKE-TEST] Live Deployment Verification Item');
  console.log('  ✓ PASS: Remote persistence verified on fresh server load');

  // 5. Role-Based Visibility Verification
  console.log('\n5. Role-Based Visibility Smoke Test...');
  // 5a. Authenticate as Abdelrahman (u2)
  const authRes2 = await fetch(`${baseUrl}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ switchUserId: 'u2' })
  });
  const cookie2 = authRes2.headers.get('set-cookie');
  const u2DataRes = await fetch(`${baseUrl}/api/crm/data`, {
    headers: { 'Cookie': cookie2 },
    cache: 'no-store'
  });
  const u2Data = await u2DataRes.json();
  const u2SeesItem = u2Data.data.vipItems.some(v => v.id === smokeTestId);
  assert.strictEqual(u2SeesItem, false, 'Other sales engineer (u2) must NOT see u1 smoke test item');
  console.log('  ✓ PASS: Isolated sales engineer (u2) cannot see u1 item');

  // 5b. Authenticate as Sales Manager (u3)
  const authRes3 = await fetch(`${baseUrl}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ switchUserId: 'u3' })
  });
  const cookie3 = authRes3.headers.get('set-cookie');
  const u3DataRes = await fetch(`${baseUrl}/api/crm/data`, {
    headers: { 'Cookie': cookie3 },
    cache: 'no-store'
  });
  const u3Data = await u3DataRes.json();
  const u3SeesItem = u3Data.data.vipItems.some(v => v.id === smokeTestId);
  assert.strictEqual(u3SeesItem, true, 'Sales Manager (u3) MUST see team smoke test item');
  console.log('  ✓ PASS: Sales Manager (u3) has team-wide visibility of VIP item');

  // 6. Safe Cleanup
  console.log('\n6. Safe Cleanup of Smoke Test Data...');
  const deleteRes = await fetch(`${baseUrl}/api/crm/mutate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie1
    },
    body: JSON.stringify({
      entity: 'vip_items',
      action: 'delete',
      id: smokeTestId
    })
  });
  assert.strictEqual(deleteRes.status, 200, 'Delete must succeed');
  const deleteJson = await deleteRes.json();
  assert.ok(deleteJson.success, 'Delete mutation must report success');

  // Final verification that item is gone
  const finalCheckRes = await fetch(`${baseUrl}/api/crm/data`, {
    headers: { 'Cookie': cookie1 },
    cache: 'no-store'
  });
  const finalCheckJson = await finalCheckRes.json();
  const finalFound = finalCheckJson.data.vipItems.some(v => v.id === smokeTestId);
  assert.strictEqual(finalFound, false, 'Smoke test item must be permanently removed');
  console.log('  ✓ PASS: Smoke test item cleanly deleted from live database (zero residue)');

  console.log('\n================================================================');
  console.log(' All Live Smoke Tests Completed Successfully! (6/6 PASS)        ');
  console.log('================================================================\n');
}

runSmokeTests().catch(err => {
  console.error('\n✗ FAIL in Safe Smoke Tests:', err);
  process.exit(1);
});
