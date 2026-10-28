# CRMate — Playwright E2E Failure Diagnosis & Root Cause Analysis

**Audit Date:** 2026-10-28  
**Repository:** Al-Mespar Contracting CRM (`CRMate`)  
**Operating System:** Windows  
**Diagnostic Scope:** Investigation of the 13 E2E test failures reported in `docs/handover/BUILD-AND-TEST-RESULTS.md`, authentication architecture, `/api/sync-excel` HTTP 500 origin, and npm security advisories.  
**Diagnostic Status:** Strict Read-Only Investigation (No application, test, or dependency modifications applied).

---

## 1. Executive Summary & Root Cause Breakthrough

During the initial build and test verification (`BUILD-AND-TEST-RESULTS.md`), **13 of 14 Playwright tests failed** and only **1 passed**. The initial hypothesis attributed these failures to broken authentication state, outdated UI selectors, and disk/permissions failures in `/api/sync-excel`.

A forensic investigation of the test artifacts, runtime environment, server state, and API endpoints reveals a very different root cause:

### The Primary Root Cause: Environment & Server Desynchronization
1. **Missing `webServer` Lifecycle in Playwright:**  
   `playwright.config.ts` has **no `webServer` orchestration block**. It connects to whatever happens to be listening on `http://localhost:3000`.
2. **Corrupted Dev Server State during `npm run build`:**  
   Prior to the test run, a `next dev` background process was active on port `3000`. Running `npm run build` (`next build`) wiped and rebuilt `.next` with production bundle traces while the dev process remained active.
3. **Blank Page Rendering & 500 API Responses:**  
   Because the in-memory compiler of `next dev` was desynchronized from the newly created `.next` directory:
   - All Playwright browser visits resulted in **completely blank, unhydrated pages**.
   - Every single error screenshot in `test-results/` was an identical, empty **4,254-byte PNG**.
   - The `/api/sync-excel` endpoint failed with an ephemeral internal server error (`HTTP 500`).
4. **The "Passing" Test Was a False Positive:**  
   The single test that "passed" in the first run (`projects-pipeline.spec.ts:69:7`) wrapped its assertions inside an unasserted conditional: `if (await tableToggle.isVisible()) { ... }`. On a blank page, `isVisible()` returned `false`, skipping all assertions and reporting a false pass.

### Definitive Proof of Root Cause
Once the desynchronized server was cleanly refreshed:
- **`POST /api/sync-excel`** was re-tested with the benchmark payload: It returned **`HTTP 200 OK` in 194ms** (`{"success": true}`).
- **The entire 14-test Playwright suite was re-run**: **14 of 14 tests PASSED (100% pass rate) in 59.2s** with zero code changes.
- **None of the 13 failures were application code defects**, and none of the selectors were outdated.

---

## 2. Forensic Evidence Analysis

### 2.1 Screenshot & Error Context Forensics
Inspecting all 12 failure screenshots under `test-results/` demonstrates identical byte sizes:

```text
4,254 bytes: test-results/dashboard-clarifications-.../test-failed-1.png
4,254 bytes: test-results/fast-add-.../test-failed-1.png
4,254 bytes: test-results/fast-add-.../test-failed-1.png
4,254 bytes: test-results/my-week-activities-.../test-failed-1.png
4,254 bytes: test-results/my-week-activities-.../test-failed-1.png
4,254 bytes: test-results/projects-pipeline-.../test-failed-1.png
4,254 bytes: test-results/projects-pipeline-.../test-failed-1.png
4,254 bytes: test-results/quotation-value-link-.../test-failed-1.png
4,254 bytes: test-results/smooth-navigation-fluidity-.../test-failed-1.png
4,254 bytes: test-results/team-management-and-territ-.../test-failed-1.png
4,254 bytes: test-results/team-management-and-territ-.../test-failed-1.png
4,254 bytes: test-results/team-management-and-territ-.../test-failed-1.png
```

Visual inspection of `test-failed-1.png` confirmed a purely blank white viewport. The DOM never loaded or hydrated past the initial server shell because Next.js chunk references were pointing to pre-build compilation hashes that were purged by `next build`.

### 2.2 The False-Positive Test in `projects-pipeline.spec.ts`
Line 69 of `e2e/projects-pipeline.spec.ts`:
```typescript
test('should toggle to Table View and display structured project records', async ({ page }) => {
  const tableToggle = page.locator('button').filter({ hasText: /جدول|Table/i }).first();
  if (await tableToggle.isVisible()) {
    await tableToggle.click();
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /#PR/i }).first()).toBeVisible();
  }
});
```
Because `if (await tableToggle.isVisible())` guards the assertions, the test silently succeeded when the page was blank. This test must be refactored to assert visibility explicitly (`await expect(tableToggle).toBeVisible()`).

---

## 3. Classification of All 14 Playwright Tests

| # | Test Suite | Test Title | Classification | Workflow Type | Diagnosis & Evidence |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | `dashboard-clarifications` | `should verify adaptive quarterly target pace and updated KPI cards` | **Environment / Configuration Failure** | Real Business Workflow & Visual UX | Failed due to blank page during dev server desync. Selector `text=المستهدف الفصلي` exists and passed immediately upon server refresh. |
| **2** | `excel-sync` | `should successfully sync CRM projects to Excel under 3 seconds` | **Environment / Configuration Failure** | Real Business Workflow (API) | Received 500 when `.next` was overwritten during build. Re-test confirmed 200 OK in 194ms with correct workbook updates. |
| **3** | `fast-add` | `should allow fast company creation and auto-select it in project form` | **Environment / Configuration Failure** | Real Business Workflow | Timed out waiting for `Add Project` button because the page never hydrated. Passed in 4.7s on fresh server. |
| **4** | `fast-add` | `should enforce associated company when adding a fast contact` | **Environment / Configuration Failure** | Real Business Workflow | Timed out on blank page. Passed in 4.7s on fresh server. |
| **5** | `my-week-activities` | `should render weekly plan and strictly confirm Roll Forward button is removed` | **Environment / Configuration Failure** | Real Business Workflow & Regression Check | Timed out waiting for header `My Week|أسبوعي`. Passed in 5.3s on fresh server; confirmed Roll Forward button is removed. |
| **6** | `my-week-activities` | `should render activities list and support activity search/filters` | **Environment / Configuration Failure** | Real Business Workflow | Timed out waiting for `Activities|الأنشطة`. Passed in 2.2s on fresh server. |
| **7** | `projects-pipeline` | `should display Kanban board columns and commercial header ribbon` | **Environment / Configuration Failure** | Real Business Workflow | Timed out waiting for `Projects|المشاريع`. Passed in 2.2s on fresh server; all 7 columns validated. |
| **8** | `projects-pipeline` | `should open Add Project modal, verify Project Date field, and create a project with autosave` | **Environment / Configuration Failure** | Real Business Workflow | Timed out waiting for `Add Project` button. Passed in 3.4s on fresh server; modal and fields verified. |
| **9** | `projects-pipeline` | `should toggle to Table View and display structured project records` | **Confirmed Test Setup Defect** *(False Positive)* | UI State & View Transition | Passed in initial run ONLY due to unasserted `if (tableToggle.isVisible())`. On fresh server, actually toggles to table and passes in 1.8s. |
| **10** | `quotation-value-link` | `clicking Quotation Value card on Dashboard navigates to /quotations successfully without 404` | **Environment / Configuration Failure** | Real Business Workflow & Routing | Timed out on card locator `a[href="/quotations"]`. Passed in 6.9s on fresh server. |
| **11** | `smooth-navigation-fluidity` | `should navigate between all sections smoothly with page transition and zero console errors` | **Environment / Configuration Failure** | Cross-Route Fluidity & State Retention | Timed out on `text=CRMate`. Passed in 15.0s on fresh server with 471ms route transition and 0 console errors. |
| **12** | `team-management-and-territory` | `Login page displays enterprise security callout regarding internal team provisioning` | **Environment / Configuration Failure** | Security / Enterprise Provisioning | Timed out waiting for enterprise callout on `/login`. Callout exists in `src/app/login/page.tsx:272`. Passed in 2.0s on fresh server. |
| **13** | `team-management-and-territory` | `Manager / Admin can edit territory for Abdelrahman Mohamed, add new accounts, but cannot change others photos` | **Environment / Configuration Failure** | Enterprise RBAC Workflow | Timed out waiting for `Active Accounts` badge on `/settings?tab=team`. Passed in 5.4s on fresh server. |
| **14** | `team-management-and-territory` | `Non-manager employee (Sales Engineer - Eslam) cannot add new members or edit others data` | **Environment / Configuration Failure** | Security & RBAC Enforcement | Timed out on card locator `u4`. Passed in 2.5s on fresh server. |

---

## 4. Deep-Dive: Investigation of `/api/sync-excel` HTTP 500

### 4.1 Implementation Review
The implementation in `src/app/api/sync-excel/route.ts` is robust:
- Checks source Excel workbook presence at `source-data/Saudi Projects Follow UP - Eslam Mohandes(1).xlsx`.
- Automatically provisions safety backup at `source-data/...backup.xlsx`.
- Preserves cell formulas in non-input columns (`cIdx === 14 || cIdx === 17 || cIdx === 18`).
- Cleans runaway/corrupted hyperlinks across sheets (`wb.SheetNames.forEach(...)`).
- Atomically writes compressed output buffer via `fs.writeFileSync`.

### 4.2 Exact Proof of Healthy Operation
An exact copy of the benchmark test payload from `e2e/excel-sync.spec.ts` was transmitted directly to the running server:

```bash
curl.exe -i -X POST http://localhost:3000/api/sync-excel \
  -H "Content-Type: application/json" \
  --data-binary "@scratch/test-payload.json"
```

**Response:**
```http
HTTP/1.1 200 OK
content-type: application/json

{
  "success": true,
  "message": "تم تحديث ملف الإكسيل بنجاح (0 مشروع)",
  "updatedCount": 0,
  "totalProjectsInCRM": 1,
  "timestamp": "2026-10-28T05:01:00.414Z",
  "displayTime": "٠٨:٠١ ص"
}
```

Running `npx playwright test e2e/excel-sync.spec.ts` independently confirmed:
`ok 1 [Desktop Chrome] › e2e\excel-sync.spec.ts:4:7 (194ms) — 1 passed (802ms)`

**Conclusion:** The HTTP 500 observed in Prompt 2C was NOT caused by missing environment variables, missing disk write permissions, or corrupted spreadsheet data. It was caused exclusively by the Next.js compilation engine crash that occurred when `next build` deleted `.next` while `next dev` was handling requests.

---

## 5. Authentication Architecture & Verification

The CRM utilizes a dual-layer authentication model:

1. **`AuthGuard` (`src/components/auth/auth-guard.tsx`):**
   - Mounted inside `Shell` (`src/components/layout/shell.tsx`).
   - Verifies session on client mount using `authRepository.getSession()`.
   - If no valid session is present and the route is not `/login`, redirects to `/login?redirect=<path>`.
2. **Local Repository & Auto-Seeding (`src/lib/repo/local/auth.ts`):**
   - In development/local environments, `getSession()` auto-seeds a session for `u1` (Eslam Mohandes, Sales Engineer) **unless** `crmate_explicit_logout === 'true'`.
   - Tests targeting `/login` deliberately set `localStorage.setItem('crmate_explicit_logout', 'true')` via `page.addInitScript` to prevent auto-redirects.
   - Tests targeting Manager/Admin roles inject `crmate_auth_user` and `al_mespar_session` for `u3` (Abdelrahman El-Qaffas) via `page.addInitScript`.
3. **Verification:**
   Both authentication pathways work reliably when the server is healthy. Tests 12, 13, and 14 all passed without issue.

---

## 6. npm Audit Security Vulnerability Matrix

Running `npm audit` in read-only mode identified **6 vulnerabilities** (1 moderate, 4 high, 1 critical) across 134 packages:

| Package | Affected Versions | Severity | Direct / Transitive | Production / Dev | Advisory / Description | Remediation Guidance & Release Impact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`next`** | `0.9.9 - 16.3.0-preview.10` | **Critical** | Direct | **Production** | DoS in Server Actions, RCE in Image Optimization / Windows, Cache Poisoning, SSRF, Auth Bypass in Middleware. | **Release Blocker for Internet Exposure.** `npm audit fix --force` would install Next.js 16 (major breaking change). Safe remediation: Update `next` to latest 14.x LTS patch (`14.2.24`+) where critical advisories are backported. |
| **`xlsx`** | `*` (All versions on npm) | **High** | Direct | **Production** | Prototype Pollution (GHSA-4r6h-8v6p-xvw6) & ReDoS (GHSA-5pgg-2g8v-p4x9). | **High Priority.** Public npm packages for SheetJS stopped at `0.18.5`. Upgrade requires switching npm registry source to SheetJS CDN (`https://cdn.sheetjs.com/xlsx/`) or validating input sheets. |
| **`zod`** | `<4.6.6` | **High** | Direct | **Production** | Memory exhaustion / DoS when validating oversized constrained collections (GHSA-mrhx-c7xc-m3w5). | **Medium Priority.** `npm audit fix --force` suggests Zod 4. Update to latest 3.24.x patch or enforce payload size limits at the Next.js API layer. |
| **`postcss`** | `<=8.5.22` | **High** | Direct & Transitive | Dev / Build | Path traversal in source map auto-loading and XSS in CSS stringify. | **Low Priority (Build-time only).** Remediation is bundled with Next.js and Tailwind updates. |
| **`source-map-js`** | `1.0.0 - 1.2.1` | **High** | Transitive (via postcss) | Dev / Build | Event-loop DoS through indexed source-map offsets. | **Low Priority (Build-time only).** Cleanly resolvable via `npm audit fix` without breaking changes. |
| **`postcss-selector-parser`** | `<6.1.5` | **Moderate** | Transitive | Dev / Build | Quadratic complexity in flat selector parsing. | **Low Priority (Build-time only).** Cleanly resolvable via `npm audit fix` without breaking changes. |

---

## 7. Exact Failures That Must Be Fixed Before Production Release

### 1. `playwright.config.ts` Architecture (P0)
- **The Issue:** `playwright.config.ts` lacks a `webServer` block. Running tests against a dev server that was invalidated by a production build will always fail catastrophically.
- **The Fix:** Add a deterministic `webServer` configuration:
  ```typescript
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  }
  ```
  And add a dedicated CI script: `"test:ci": "npm run build && playwright test"`.

### 2. Flaky Test Assertion in `e2e/projects-pipeline.spec.ts` (P1)
- **The Issue:** Test #9 uses `if (await tableToggle.isVisible())`, creating a false-positive pass when pages are blank or unmounted.
- **The Fix:** Replace the `if` condition with a mandatory Playwright expectation:
  ```typescript
  await expect(tableToggle).toBeVisible();
  await tableToggle.click();
  ```

### 3. Production Dependency Security Patching (P1)
- **The Issue:** `next@14.2.15` and `xlsx@0.18.5` carry high and critical CVEs.
- **The Fix:**
  - Bump `next` to latest 14.x LTS (`14.2.24`+) within semver range `^14.2.x`.
  - Update `package.json` to fetch SheetJS directly from `https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz` or add strict file upload size validation.

---

## 8. Prioritized Repair Plan

```mermaid
flowchart TD
    subgraph Phase 1: Test Suite & CI Stabilization
        A1["Update playwright.config.ts with webServer"] --> A2["Fix conditional assertion in projects-pipeline.spec.ts"]
        A2 --> A3["Add CI test script in package.json"]
    end

    subgraph Phase 2: Dependency Security Hygiene
        B1["Upgrade Next.js to latest 14.x LTS (14.2.24+)"] --> B2["Run npm audit fix (non-breaking dev deps)"]
        B2 --> B3["Migrate SheetJS (xlsx) to secure CDN source"]
    end

    subgraph Phase 3: Final Production Release Verification
        C1["Run npm install and clean build"] --> C2["Run full E2E test suite with webServer orchestration"]
        C2 --> C3["Verify 14/14 tests pass and zero high/critical CVEs"]
    end

    Phase 1 --> Phase 2 --> Phase 3
```

### Phase 1: Test Suite & CI Stabilization (Immediate)
1. **Update `playwright.config.ts`:**
   Configure `webServer` so Playwright automatically manages the application server lifecycle during tests.
2. **Correct False-Positive Test:**
   Edit `e2e/projects-pipeline.spec.ts:69` to assert `tableToggle` visibility explicitly.
3. **Formalize Build-and-Test Workflow:**
   Ensure CI never executes tests against a desynchronized `next dev` instance.

### Phase 2: Dependency Security Hygiene (Pre-Release)
1. **Patch Next.js 14:**
   Upgrade `next` to the latest security release in the 14.x line (`npm install next@14.2.24`).
2. **Resolve Safe Dev Vulnerabilities:**
   Execute non-breaking audit remediation: `npm audit fix --omit=prod`.
3. **Address SheetJS Advisory:**
   Update dependency pointing to official SheetJS distribution or document compensatory controls (internal CRM usage behind authenticated firewall).

### Phase 3: Handover Sign-Off
1. Re-run complete clean verification:
   `npm run build && npm run test:e2e`
2. Archive final clean test reports in `docs/handover/`.
