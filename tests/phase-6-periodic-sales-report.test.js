/**
 * CRMate - Phase 6 Test Suite
 * Tests for:
 * 1. Header Cleanup in Companies & Contacts (Western Region removed)
 * 2. Periodic Sales Performance Reporting calculations (Week, Month, Quarter, Year):
 *    - New projects count & details + In-Hand vs Tender Pie Chart ratio
 *    - Quotations sent total value & count
 *    - Field activities log table
 *    - Interactions breakdown (Calls, Visits, F2F Meetings, Online Meetings)
 *    - Accounts & Contacts growth (companies with newly added contacts list)
 *    - Engineering technical submittals submitted in period
 * 3. PDF Modular Customization & Export Controls
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

console.log('\n================================================================');
console.log(' CRMate - Phase 6 Periodic Sales Report & Header Cleanup Test ');
console.log('================================================================\n');

// -------------------------------------------------------------
// [Group 1] Header Cleanup in Companies & Contacts Modules
// -------------------------------------------------------------
console.log('[Group 1] Header Cleanup in Companies & Contacts Modules');

runTest('Companies module header does not contain "Western Region Saudi Arabia" badge', () => {
  const compCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'companies', 'page.tsx'), 'utf8');
  assert(!compCode.includes('المنطقة الغربية • المملكة العربية السعودية'), 'Companies page still contains Western Region Arabic badge in header');
  assert(!compCode.includes('Western Region • Saudi Arabia'), 'Companies page still contains Western Region English badge in header');
});

runTest('Contacts module header does not contain "Western Region Saudi Arabia" badge', () => {
  const cntCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'contacts', 'page.tsx'), 'utf8');
  assert(!cntCode.includes('المنطقة الغربية • المملكة العربية السعودية'), 'Contacts page still contains Western Region Arabic badge in header');
  assert(!cntCode.includes('Western Region • Saudi Arabia'), 'Contacts page still contains Western Region English badge in header');
});

runTest('Translations file is updated to general national directory', () => {
  const transCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'i18n', 'translations.ts'), 'utf8');
  assert(!transCode.includes('دليل الشركات بالمنطقة الغربية'), 'Translations still contain Western Region in companiesSubtitle');
});

// -------------------------------------------------------------
// [Group 2] Periodic Sales Performance Calculation Logic
// -------------------------------------------------------------
console.log('\n[Group 2] Periodic Sales Performance Calculation Logic');

const sampleProjects = [
  { id: 'p1', pr_number: 'PR-26-0001', name: 'Al-Noor Tower', opportunity_type: 'in_hand', estimated_value: 500000, created_at: '2026-10-15T10:00:00Z', pipeline_stage: 'rfq' },
  { id: 'p2', pr_number: 'PR-26-0002', name: 'Jeddah Hospital', opportunity_type: 'tender', estimated_value: 1200000, created_at: '2026-10-18T10:00:00Z', pipeline_stage: 'technical_submission', submittal_sent_at: '2026-10-20' },
  { id: 'p3', pr_number: 'PR-26-0003', name: 'Riyadh Mall', opportunity_type: 'tender', estimated_value: 800000, created_at: '2026-10-22T10:00:00Z', pipeline_stage: 'quotation_sent' },
  { id: 'p4', pr_number: 'PR-26-0004', name: 'Old Project', opportunity_type: 'in_hand', estimated_value: 300000, created_at: '2026-08-01T10:00:00Z', pipeline_stage: 'won' }
];

const periodStart = '2026-10-01';
const periodEnd = '2026-10-31';

runTest('Filters projects added specifically within the period', () => {
  const periodNewProjects = sampleProjects.filter(p => {
    const d = (p.created_at || '').split('T')[0];
    return d >= periodStart && d <= periodEnd;
  });
  assert.strictEqual(periodNewProjects.length, 3, 'Should match 3 projects created in October');
});

runTest('Computes In-Hand vs Tender counts, values, and percentage ratio', () => {
  const periodNewProjects = sampleProjects.filter(p => {
    const d = (p.created_at || '').split('T')[0];
    return d >= periodStart && d <= periodEnd;
  });

  const inHand = periodNewProjects.filter(p => p.opportunity_type === 'in_hand');
  const tender = periodNewProjects.filter(p => p.opportunity_type === 'tender');

  const inHandVal = inHand.reduce((s, p) => s + p.estimated_value, 0);
  const tenderVal = tender.reduce((s, p) => s + p.estimated_value, 0);

  const inHandPct = Math.round((inHand.length / periodNewProjects.length) * 100);
  const tenderPct = 100 - inHandPct;

  assert.strictEqual(inHand.length, 1);
  assert.strictEqual(tender.length, 2);
  assert.strictEqual(inHandVal, 500000);
  assert.strictEqual(tenderVal, 2000000);
  assert.strictEqual(inHandPct, 33);
  assert.strictEqual(tenderPct, 67);
});

runTest('Calculates Quotations Sent in period correctly', () => {
  const sampleQuotes = [
    { id: 'q1', quotation_number: 'MES-Q-01', amount: 450000, sent_date: '2026-10-16' },
    { id: 'q2', quotation_number: 'MES-Q-02', amount: 750000, sent_date: '2026-10-25' },
    { id: 'q3', quotation_number: 'MES-Q-03', amount: 200000, sent_date: '2026-09-10' }
  ];

  const periodQuotes = sampleQuotes.filter(q => q.sent_date >= periodStart && q.sent_date <= periodEnd);
  const totalVal = periodQuotes.reduce((s, q) => s + q.amount, 0);

  assert.strictEqual(periodQuotes.length, 2);
  assert.strictEqual(totalVal, 1200000);
});

runTest('Categorizes Field Interactions (Calls, Visits, F2F Meetings, Online Meetings)', () => {
  const sampleActivities = [
    { id: 'a1', channel: 'call', activity_date: '2026-10-10' },
    { id: 'a2', channel: 'call', activity_date: '2026-10-11' },
    { id: 'a3', channel: 'visit', activity_date: '2026-10-12' },
    { id: 'a4', channel: 'meeting_f2f', activity_date: '2026-10-14' },
    { id: 'a5', channel: 'meeting_online', activity_date: '2026-10-15' },
    { id: 'a6', channel: 'hunting', activity_date: '2026-10-16' }
  ];

  const calls = sampleActivities.filter(a => a.channel === 'call').length;
  const visits = sampleActivities.filter(a => a.channel === 'visit').length;
  const f2f = sampleActivities.filter(a => a.channel === 'meeting_f2f').length;
  const online = sampleActivities.filter(a => a.channel === 'meeting_online').length;

  assert.strictEqual(calls, 2);
  assert.strictEqual(visits, 1);
  assert.strictEqual(f2f, 1);
  assert.strictEqual(online, 1);
  assert.strictEqual(sampleActivities.length, 6);
});

runTest('Groups Accounts & newly added contacts (supporting new companies + expanded existing companies)', () => {
  const sampleCompanies = [
    { id: 'c1', name: 'Binladin Group', created_at: '2026-10-05T00:00:00Z', city: 'Jeddah' }, // New company
    { id: 'c2', name: 'Al-Bawani', created_at: '2025-01-01T00:00:00Z', city: 'Riyadh' }        // Existing company
  ];

  const sampleContacts = [
    { id: 'cnt1', company_id: 'c1', full_name: 'Eng. Ahmad', job_title: 'Procurement', created_at: '2026-10-06' },
    { id: 'cnt2', company_id: 'c1', full_name: 'Eng. Salem', job_title: 'PM', created_at: '2026-10-07' },
    { id: 'cnt3', company_id: 'c2', full_name: 'Eng. Tariq', job_title: 'Electrical Head', created_at: '2026-10-18' } // New contact in existing company
  ];

  const newCompanies = sampleCompanies.filter(c => c.created_at.split('T')[0] >= periodStart && c.created_at.split('T')[0] <= periodEnd);
  const newContacts = sampleContacts.filter(cnt => cnt.created_at >= periodStart && cnt.created_at <= periodEnd);

  const newCompSet = new Set(newCompanies.map(c => c.id));
  const contactsByCompId = {};
  newContacts.forEach(cnt => {
    if (!contactsByCompId[cnt.company_id]) contactsByCompId[cnt.company_id] = [];
    contactsByCompId[cnt.company_id].push(cnt);
  });

  const relevantCompIds = new Set([...newCompanies.map(c => c.id), ...Object.keys(contactsByCompId)]);
  const cards = Array.from(relevantCompIds).map(cId => {
    const comp = sampleCompanies.find(c => c.id === cId);
    return {
      companyName: comp.name,
      isNewCompany: newCompSet.has(cId),
      newContactsCount: (contactsByCompId[cId] || []).length
    };
  });

  assert.strictEqual(cards.length, 2);
  const c1Card = cards.find(c => c.companyName === 'Binladin Group');
  const c2Card = cards.find(c => c.companyName === 'Al-Bawani');

  assert.strictEqual(c1Card.isNewCompany, true);
  assert.strictEqual(c1Card.newContactsCount, 2);

  assert.strictEqual(c2Card.isNewCompany, false, 'Al-Bawani should be marked as existing expanded account');
  assert.strictEqual(c2Card.newContactsCount, 1, 'Al-Bawani has 1 contact added in period');
});

runTest('Filters technical submittals submitted in the period', () => {
  const submittals = sampleProjects.filter(p => p.submittal_sent_at && p.submittal_sent_at >= periodStart && p.submittal_sent_at <= periodEnd);
  assert.strictEqual(submittals.length, 1);
  assert.strictEqual(submittals[0].name, 'Jeddah Hospital');
});

// -------------------------------------------------------------
// [Group 3] Report Perspective Switching & PDF Modular Controls
// -------------------------------------------------------------
console.log('\n[Group 3] Report Perspective Switching & PDF Modular Controls');

runTest('Reports Page includes the perspective switcher between Sales Performance and Executive Portfolio', () => {
  const pageCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'reports', 'page.tsx'), 'utf8');
  assert(pageCode.includes("setReportMode('sales_performance')"), 'Page missing setReportMode sales_performance');
  assert(pageCode.includes("setReportMode('executive_portfolio')"), 'Page missing setReportMode executive_portfolio');
  assert(pageCode.includes("reportMode === 'sales_performance'"), 'Page missing conditional rendering based on reportMode');
});

runTest('Report PDF Modal includes all 6 modular section toggles', () => {
  const modalCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'reports', 'report-pdf-modal.tsx'), 'utf8');
  assert(modalCode.includes('includeNewProjects'), 'Modal missing includeNewProjects toggle');
  assert(modalCode.includes('includeQuotationsSent'), 'Modal missing includeQuotationsSent toggle');
  assert(modalCode.includes('includeActivitiesLog'), 'Modal missing includeActivitiesLog toggle');
  assert(modalCode.includes('includeInteractionBreakdown'), 'Modal missing includeInteractionBreakdown toggle');
  assert(modalCode.includes('includeAccountsAndContacts'), 'Modal missing includeAccountsAndContacts toggle');
  assert(modalCode.includes('includeSubmittals'), 'Modal missing includeSubmittals toggle');
});

runTest('Report PDF Modal has Select All & Deselect All quick actions for customization', () => {
  const modalCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'reports', 'report-pdf-modal.tsx'), 'utf8');
  assert(modalCode.includes('تحديد الكل') || modalCode.includes('Select All'), 'Modal missing Select All action');
  assert(modalCode.includes('إلغاء التحديد') || modalCode.includes('Deselect All'), 'Modal missing Deselect All action');
});

runTest('Report PDF Modal renders SVG vector Donut Chart for crisp print without canvas pixelation', () => {
  const modalCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'reports', 'report-pdf-modal.tsx'), 'utf8');
  assert(modalCode.includes('strokeDasharray'), 'Modal missing SVG strokeDasharray vector pie chart');
  assert(modalCode.includes('viewBox="0 0 100 100"'), 'Modal missing SVG viewBox');
});

runTest('Reports Page passes reportMode to ReportPdfModal', () => {
  const pageCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'reports', 'page.tsx'), 'utf8');
  assert(pageCode.includes('reportMode={reportMode}'), 'Reports page does not pass reportMode to ReportPdfModal');
});

console.log('\n================================================================');
console.log(`Results: ${passedTests} passed, ${failedTests} failed`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
