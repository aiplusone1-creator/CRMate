/**
 * Phase 5 Verification Test Suite: Global Search Privacy & Stage/Value Confidentiality
 * 
 * Verifies:
 * 1. Sales Engineer Searching Experience:
 *    - When a sales engineer searches and matching projects appear:
 *      - If the project does NOT belong to the sales engineer (and user is not manager/admin):
 *        * The Estimated Value is STRICTLY masked ("القيمة محجوبة" / "Confidential")
 *        * The Pipeline Stage is STRICTLY masked ("المرحلة محجوبة" / "Stage locked")
 *        * Confidential notes/next actions do NOT match search queries for unauthorized projects
 *      - If the project DOES belong to the sales engineer:
 *        * The Estimated Value is visible
 *        * The Pipeline Stage badge is visible
 * 2. Sales Manager / Admin Searching Experience:
 *    - Managers and Admins have full visibility:
 *      * Estimated Value is visible across all team projects
 *      * Pipeline Stage is visible across all team projects
 * 3. Navigation & Detail Screen Protection:
 *    - If an unauthorized user navigates to /projects/[id], the project detail page
 *      renders the Access Restricted lock screen rather than the confidential commercial cockpit.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Reference logic from src/lib/logic/scope.ts
function canUserAccessProjectCockpit(project, user) {
  if (!project || !user) return false;

  const isAdminOrManager = user.role === 'admin' || user.role === 'sales_manager' || user.role === 'viewer' || user.role === 'estimator';
  if (isAdminOrManager) return true;

  const isOwner = project.owner_id === user.id;
  const isReferred = project.referred_to_id === user.id;
  const isMember = Boolean(project.members?.some(m => m.user_id === user.id));

  return isOwner || isReferred || isMember;
}

// Reference search filter logic from src/components/layout/global-search.tsx
function filterMatchingProjects(projects, currentUser, query) {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return [];

  return projects.filter(p => {
    const isAccessible = canUserAccessProjectCockpit(p, currentUser);
    const matchesPublic = 
      p.name.toLowerCase().includes(trimmedQuery) ||
      p.pr_number.toLowerCase().includes(trimmedQuery) ||
      (p.company_name && p.company_name.toLowerCase().includes(trimmedQuery)) ||
      (p.location && p.location.toLowerCase().includes(trimmedQuery));

    if (matchesPublic) return true;
    if (!isAccessible) return false;

    return (
      (p.internal_notes && p.internal_notes.toLowerCase().includes(trimmedQuery)) ||
      (p.next_action && p.next_action.toLowerCase().includes(trimmedQuery))
    );
  }).slice(0, 5);
}

// Simulated search result renderer output
function renderProjectSearchResult(p, currentUser, isRTL = true) {
  const isAccessible = canUserAccessProjectCockpit(p, currentUser);
  
  if (isAccessible) {
    return {
      pr_number: p.pr_number,
      name: p.name,
      company_name: p.company_name,
      location: p.location,
      isAccessible: true,
      displayedValue: `${p.estimated_value} SAR`,
      displayedStage: p.pipeline_stage,
      isStageLocked: false,
      isValueLocked: false
    };
  }

  return {
    pr_number: p.pr_number,
    name: p.name,
    company_name: p.company_name,
    location: p.location,
    isAccessible: false,
    displayedValue: isRTL ? 'القيمة محجوبة' : 'Confidential',
    displayedStage: isRTL ? 'المرحلة محجوبة' : 'Stage locked',
    isStageLocked: true,
    isValueLocked: true,
    badge: isRTL ? 'زميل آخر' : 'Other rep'
  };
}

let passCount = 0;
let failCount = 0;

function test(name, fn) {
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

async function main() {
  console.log('\n================================================================');
  console.log(' CRMate - Phase 5 Global Search Privacy & Confidentiality Test ');
  console.log('================================================================\n');

  // Test Fixtures
  const salesUserEslam = { id: 'u1', role: 'sales_engineer', full_name: 'Eslam Mohandes' };
  const salesUserKarim = { id: 'u4', role: 'sales_engineer', full_name: 'Karim' };
  const salesManager = { id: 'u3', role: 'sales_manager', full_name: 'Ahmed Al-Kaffas' };
  const adminUser = { id: 'u5', role: 'admin', full_name: 'System Admin' };

  const projectEslam = {
    id: 'p_eslam_1',
    pr_number: 'PR1010',
    name: 'Red Sea Coastal Resort Villa Phase 1',
    company_name: 'Saudi Oger Ltd',
    location: 'Jeddah',
    owner_id: 'u1',
    owner_name: 'Eslam Mohandes',
    pipeline_stage: 'rfq_processing',
    estimated_value: 3500000,
    internal_notes: 'Secret pricing strategy 15% discount for executive committee',
    next_action: 'Submit revised BOM by Sunday'
  };

  const projectKarim = {
    id: 'p_karim_1',
    pr_number: 'PR1020',
    name: 'Riyadh Metro Station Expansion Canopy',
    company_name: 'Al-Bawani Co.',
    location: 'Riyadh',
    owner_id: 'u4',
    owner_name: 'Karim',
    pipeline_stage: 'negotiation',
    estimated_value: 8200000,
    internal_notes: 'Confidential competitor counter-offer from Carrier',
    next_action: 'Board meeting final pricing on 25th'
  };

  const projectAdel = {
    id: 'p_adel_1',
    pr_number: 'PR1156',
    name: 'Dammam Petrochemical Warehouses',
    company_name: 'Aramco Services',
    location: 'Dammam',
    owner_id: 'u0',
    owner_name: 'Adel Nasr',
    pipeline_stage: 'in_hand',
    estimated_value: 12500000,
    internal_notes: 'Targeting 28% margin high spec submittal',
    next_action: 'Send technical data sheets'
  };

  const allProjects = [projectEslam, projectKarim, projectAdel];

  // -------------------------------------------------------------------------
  // Group 1: Search Scope & Access Rights Verification
  // -------------------------------------------------------------------------
  console.log('[Group 1] Cockpit Access Logic for Search Results');

  test('Sales Engineer (Eslam) has access ONLY to his own project', () => {
    assert.strictEqual(canUserAccessProjectCockpit(projectEslam, salesUserEslam), true);
    assert.strictEqual(canUserAccessProjectCockpit(projectKarim, salesUserEslam), false);
    assert.strictEqual(canUserAccessProjectCockpit(projectAdel, salesUserEslam), false);
  });

  test('Sales Engineer (Karim) has access ONLY to his own project', () => {
    assert.strictEqual(canUserAccessProjectCockpit(projectEslam, salesUserKarim), false);
    assert.strictEqual(canUserAccessProjectCockpit(projectKarim, salesUserKarim), true);
    assert.strictEqual(canUserAccessProjectCockpit(projectAdel, salesUserKarim), false);
  });

  test('Sales Manager (Al-Kaffas) has access to ALL team projects', () => {
    assert.strictEqual(canUserAccessProjectCockpit(projectEslam, salesManager), true);
    assert.strictEqual(canUserAccessProjectCockpit(projectKarim, salesManager), true);
    assert.strictEqual(canUserAccessProjectCockpit(projectAdel, salesManager), true);
  });

  test('Admin has access to ALL team projects', () => {
    assert.strictEqual(canUserAccessProjectCockpit(projectEslam, adminUser), true);
    assert.strictEqual(canUserAccessProjectCockpit(projectKarim, adminUser), true);
    assert.strictEqual(canUserAccessProjectCockpit(projectAdel, adminUser), true);
  });

  // -------------------------------------------------------------------------
  // Group 2: Masking of Stage & Value for Non-Owned Projects
  // -------------------------------------------------------------------------
  console.log('\n[Group 2] Stage & Value Masking in Global Search');

  test('When Eslam searches and sees his own project, Stage & Value are displayed', () => {
    const result = renderProjectSearchResult(projectEslam, salesUserEslam, true);
    assert.strictEqual(result.isAccessible, true);
    assert.strictEqual(result.displayedValue, '3500000 SAR');
    assert.strictEqual(result.displayedStage, 'rfq_processing');
    assert.strictEqual(result.isStageLocked, false);
    assert.strictEqual(result.isValueLocked, false);
  });

  test('When Eslam searches and sees Karim\'s project, Stage & Value are STRICTLY masked', () => {
    const result = renderProjectSearchResult(projectKarim, salesUserEslam, true);
    assert.strictEqual(result.isAccessible, false);
    // Value MUST NOT contain 8200000 or SAR
    assert.strictEqual(result.displayedValue, 'القيمة محجوبة');
    assert.strictEqual(result.isValueLocked, true);
    // Stage MUST NOT contain negotiation or any actual pipeline stage
    assert.strictEqual(result.displayedStage, 'المرحلة محجوبة');
    assert.strictEqual(result.isStageLocked, true);
    assert.strictEqual(result.badge, 'زميل آخر');
  });

  test('When Eslam searches and sees Adel\'s project, Stage & Value are STRICTLY masked', () => {
    const result = renderProjectSearchResult(projectAdel, salesUserEslam, true);
    assert.strictEqual(result.isAccessible, false);
    assert.strictEqual(result.displayedValue, 'القيمة محجوبة');
    assert.strictEqual(result.displayedStage, 'المرحلة محجوبة');
    assert.strictEqual(result.isStageLocked, true);
    assert.strictEqual(result.isValueLocked, true);
  });

  test('When Sales Manager searches, ALL projects show real Stage & Value', () => {
    for (const proj of allProjects) {
      const result = renderProjectSearchResult(proj, salesManager, true);
      assert.strictEqual(result.isAccessible, true);
      assert.strictEqual(result.isValueLocked, false);
      assert.strictEqual(result.isStageLocked, false);
      assert.strictEqual(result.displayedStage, proj.pipeline_stage);
      assert.strictEqual(result.displayedValue, `${proj.estimated_value} SAR`);
    }
  });

  // -------------------------------------------------------------------------
  // Group 3: Private Notes Search Query Isolation
  // -------------------------------------------------------------------------
  console.log('\n[Group 3] Search Query Matching & Notes Confidentiality');

  test('Public fields (PR number, Project Name, Contractor, City) match for all users', () => {
    // Eslam searches for PR1020 (Karim's project)
    const matchesPR = filterMatchingProjects(allProjects, salesUserEslam, 'PR1020');
    assert.strictEqual(matchesPR.length, 1);
    assert.strictEqual(matchesPR[0].id, 'p_karim_1');

    // Eslam searches for 'Riyadh Metro'
    const matchesName = filterMatchingProjects(allProjects, salesUserEslam, 'Riyadh Metro');
    assert.strictEqual(matchesName.length, 1);
    assert.strictEqual(matchesName[0].id, 'p_karim_1');

    // Eslam searches for 'Al-Bawani'
    const matchesCompany = filterMatchingProjects(allProjects, salesUserEslam, 'Al-Bawani');
    assert.strictEqual(matchesCompany.length, 1);
    assert.strictEqual(matchesCompany[0].id, 'p_karim_1');
  });

  test('Confidential internal notes do NOT match search queries for unauthorized sales reps', () => {
    // Karim's confidential note contains 'competitor counter-offer'
    // Eslam searches for 'counter-offer' -> MUST NOT return Karim's project
    const eslamSearchNote = filterMatchingProjects(allProjects, salesUserEslam, 'counter-offer');
    assert.strictEqual(eslamSearchNote.length, 0, 'Eslam must not discover Karim project by secret note query');

    // Karim searches for his own confidential note -> CAN find it
    const karimSearchOwnNote = filterMatchingProjects(allProjects, salesUserKarim, 'counter-offer');
    assert.strictEqual(karimSearchOwnNote.length, 1);
    assert.strictEqual(karimSearchOwnNote[0].id, 'p_karim_1');

    // Manager searches for confidential note -> CAN find it
    const managerSearchNote = filterMatchingProjects(allProjects, salesManager, 'counter-offer');
    assert.strictEqual(managerSearchNote.length, 1);
    assert.strictEqual(managerSearchNote[0].id, 'p_karim_1');
  });

  // -------------------------------------------------------------------------
  // Group 4: Source Code Inspection of global-search.tsx & projects/[id]/page.tsx
  // -------------------------------------------------------------------------
  console.log('\n[Group 4] Source Code Integrity Verification');

  test('src/components/layout/global-search.tsx properly imports canUserAccessProjectCockpit', () => {
    const fileContent = fs.readFileSync(path.resolve(__dirname, '../src/components/layout/global-search.tsx'), 'utf8');
    assert.ok(fileContent.includes("import { canUserAccessProjectCockpit } from '@/lib/logic/scope'"), 'Must import canUserAccessProjectCockpit');
    assert.ok(fileContent.includes("currentUser"), 'Must destructure currentUser from useCRM');
  });

  test('src/components/layout/global-search.tsx masks estimated_value and pipeline_stage for unauthorized projects', () => {
    const fileContent = fs.readFileSync(path.resolve(__dirname, '../src/components/layout/global-search.tsx'), 'utf8');
    assert.ok(fileContent.includes("const isAccessible = canUserAccessProjectCockpit(p, currentUser)"), 'Must check isAccessible for each matching project');
    assert.ok(fileContent.includes("القيمة محجوبة"), 'Must display Arabic masked value message');
    assert.ok(fileContent.includes("المرحلة محجوبة"), 'Must display Arabic masked stage message');
    assert.ok(fileContent.includes("Confidential"), 'Must display English masked value message');
    assert.ok(fileContent.includes("Stage locked"), 'Must display English masked stage message');
  });

  test('src/app/projects/[id]/page.tsx enforces access control before rendering project cockpit', () => {
    const fileContent = fs.readFileSync(path.resolve(__dirname, '../src/app/projects/[id]/page.tsx'), 'utf8');
    assert.ok(fileContent.includes("const canAccess = canUserAccessProjectCockpit(project, currentUser)"), 'Must check canUserAccessProjectCockpit');
    assert.ok(fileContent.includes("لا تملك صلاحية فتح كارت هذا المشروع"), 'Must render access restricted notice');
  });

  // -------------------------------------------------------------------------
  // Group 5: Live API Discovery & Server-Side Privacy Verification on GET /api/crm/data
  // -------------------------------------------------------------------------
  console.log('\n[Group 5] Live API Discovery & Server Privacy Verification');

  const baseUrl = 'http://localhost:3000';
  const eslamAuthRes = await fetch(`${baseUrl}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ switchUserId: 'u1' })
  });
  const eslamCookie = eslamAuthRes.headers.get('set-cookie')?.split(';')[0];

  const eslamDataRes = await fetch(`${baseUrl}/api/crm/data`, {
    headers: { Cookie: eslamCookie },
    cache: 'no-store'
  });
  const eslamDataJson = await eslamDataRes.json();
  const eslamApiData = eslamDataJson.data;

  test('Sales Engineer payload contains teamProjects with all team projects (>= 113)', () => {
    assert.ok(Array.isArray(eslamApiData.teamProjects), 'Must return teamProjects array');
    assert.ok(eslamApiData.teamProjects.length >= 113, `teamProjects must have at least 113 projects, got ${eslamApiData.teamProjects.length}`);
  });

  test('Sales Engineer can discover a teammate project in teamProjects by PR number', () => {
    const karimProject = eslamApiData.teamProjects.find(p => p.owner_id === 'u4');
    assert.ok(karimProject, 'Must find a project owned by Karim (u4)');
    // Public search fields must be intact
    assert.ok(karimProject.pr_number, 'PR number must be present');
    assert.ok(karimProject.name, 'Project name must be present');
    // Confidential commercial fields must be sanitized on the server
    assert.strictEqual(karimProject.estimated_value, 0, 'Commercial value must be 0 for teammate project over wire');
    assert.strictEqual(karimProject.pipeline_stage, 'stage_locked', 'Pipeline stage must be stage_locked over wire');
    assert.strictEqual(karimProject.internal_notes, null, 'Internal notes must be null over wire');
    assert.strictEqual(karimProject.next_action, null, 'Next action must be null over wire');
  });

  test('Global Search matching logic finds teammate project and masks stage and value', () => {
    const karimProject = eslamApiData.teamProjects.find(p => p.owner_id === 'u4');
    const searchMatches = filterMatchingProjects(eslamApiData.teamProjects, salesUserEslam, karimProject.pr_number);
    assert.strictEqual(searchMatches.length >= 1, true, 'Must find teammate project by PR number');

    const rendered = renderProjectSearchResult(searchMatches[0], salesUserEslam, true);
    assert.strictEqual(rendered.isAccessible, false);
    assert.strictEqual(rendered.displayedValue, 'القيمة محجوبة');
    assert.strictEqual(rendered.displayedStage, 'المرحلة محجوبة');
    assert.strictEqual(rendered.isValueLocked, true);
    assert.strictEqual(rendered.isStageLocked, true);
    assert.strictEqual(rendered.badge, 'زميل آخر');
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
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
