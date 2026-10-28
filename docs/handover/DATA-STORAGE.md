# Data Storage, Browser Persistence, and Excel Sync Architecture

This document details all data storage mechanisms in **Al-Mespar CRM (CRMate)**, covering browser storage (localStorage and sessionStorage keys and schemas), filesystem Excel synchronization (file names, paths, triggers, backups), and external/seed storage.

---

## 1. Browser Storage (Client-Side Persistence)

The CRM utilizes an offline-first architecture where the client browser maintains complete local state.

### 1.1 `localStorage` Keys & Schemas

| Key Name | Type / Structure | Description & Contents |
|---|---|---|
| **`al_mespar_projects`** | Array of `Project` objects | Core project pipeline registry. Stores project ID, PR code, project name, company ID, primary contact ID, location, opportunity type (`tender` / `in_hand`), pipeline stage, priority, estimated value, probability %, final won value, next action, follow-up date, last activity date, and internal notes. |
| **`al_mespar_contacts`** | Array of `Contact` objects | Master contact directory. Stores contact ID, company ID, full name, job title, phone, normalized phone, email, city, LinkedIn URL, `is_hot_lead` boolean flag, owner ID, and follow-up timestamps. |
| **`al_mespar_companies`** | Array of `Company` objects | Master accounts and client directory. Stores company ID, company name, normalized name, type (`contractor`, `consultant`, `developer`, etc.), city, website URL, Google Maps URL, phone, and notes. |
| **`al_mespar_activities`** | Array of `Activity` objects | Chronological sales audit log. Stores activity ID, project ID, company ID, contact ID, author user ID, scheduled planned activity ID reference, activity date, time, channel (`call`, `visit`, `meeting`, `hunting`, `whatsapp`, `email`), visit purpose, outcome, and meeting notes. |
| **`al_mespar_planned_activities`** | Array of `PlannedActivity` objects | Weekly planner scheduled items. Stores task ID, weekly plan ID, project ID, company ID, contact ID, scheduled date, time slot, channel, visit purpose, goal/objective, priority, status (`planned`, `completed`, `rescheduled`, `skipped`), and linked completed activity ID. |
| **`al_mespar_quotations`** | Array of `Quotation` objects | Commercial quotations and versions. Stores quotation ID, project ID, quotation number, version integer (`1`, `2`, `3`...), status (`draft`, `sent`, `under_review`, `revised`, `accepted`, `rejected`), subtotal, discount amount, discount %, 15% VAT tax amount, total amount, currency (`SAR`), vendor brand, quotation date, validity date, payment/delivery/warranty terms, line items/BOQ, and file attachment metadata. |
| **`al_mespar_sales_targets`** | Array of `SalesTarget` objects | Performance targets and quotas. Stores target ID, user ID (or null for team target), period type (`monthly`, `quarterly`, `yearly`), period start date, period end date, target metric (`calls`, `visits`, `quotation_value`, `won_value`), and target numerical value. |
| **`al_mespar_reminders`** | Array of `Reminder` objects | User reminders and pending task alerts. Stores reminder ID, title, due date, assigned user ID, linked project ID, priority, and `is_completed` boolean flag. |
| **`al_mespar_requests`**<br>*(Legacy fallback: `crmate_approval_requests`)* | Array of `ApprovalRequest` objects | Workflow approval tickets (commercial discount approvals, stage change exceptions). Stores request ID, type, requested by user ID, assigned approver IDs, project ID, requested discount %, justification notes, status (`pending`, `approved`, `rejected`), reviewed by user ID, and review timestamp. |
| **`al_mespar_notifications`**<br>*(Legacy fallback: `crmate_notifications`)* | Array of `AppNotification` objects | In-app user notifications. Stores notification ID, recipient user ID, title, message body, action URL link, type (`reminder`, `approval`, `mention`, `system`), `is_read` boolean flag, and timestamp. |
| **`al_mespar_users`** | Array of `User` objects | Master user roster managed by `LocalAuthRepository`. Stores user ID, English name, Arabic name, email address, SHA-256 hashed password, role (`admin`, `sales_manager`, `sales_engineer`, `estimator`, `viewer`), avatar color, `is_active` status, job title, assigned territory, and phone. |
| **`al_mespar_session`** | Object: `{ user_id, token, expires_at, remember_me }` | Active authentication session managed by `LocalAuthRepository`. |
| **`crmate_auth_user`** | Object: `{ id, name, name_ar, email, role, avatar_initials }` | Cached active user profile used by CRMContext during hydration. |
| **`crmate_is_authenticated`** | String: `'true'` | Quick authentication flag for client-side route protection. |
| **`crmate_explicit_logout`** | String: `'true'` | Flag set when a user explicitly clicks "Logout". Prevents auto-login on subsequent browser reloads. Cleared upon successful login. |
| **`crmate_team_members`** | Array of team profile objects | Cached list of sales team members in `CRMContext`. |
| **`crmate_language`** | String: `'ar'` \| `'en'` | Active UI language preference managed by `LanguageProvider`. Default is `'ar'`. |
| **`crmate_theme`** | String: `'light'` \| `'dark'` \| `'system'` | Active UI theme appearance preference managed by `ThemeProvider`. Default is `'light'`. |
| **`al_mespar_sidebar_pinned`** | Boolean: `true` \| `false` | Tracks whether the left/right desktop navigation sidebar is pinned open or collapses on hover. |
| **`al_mespar_dashboard_visible_modules_v3`** | Object: `{ [moduleId]: boolean }` | User preference toggling visibility of dashboard widgets. |
| **`al_mespar_dashboard_module_order_v3`** | Array of string module IDs | Custom display ordering of dashboard widgets. |
| **`al_mespar_priority_actions_order`** | Array of string action IDs | Custom reordered sequence of urgent action items on the dashboard. |
| **`al_mespar_priority_actions_layout`** | String: `'compact'` \| `'expanded'` | Display density mode for the priority actions widget. |
| **`al_mespar_onboarded_${userId}`** | String: `'true'` | Per-user flag indicating that the user has completed or dismissed the welcome onboarding modal. |
| **`al_mespar_last_excel_sync`** | String: Timestamp (e.g. `'10:45 ص'`) | Display string recording the exact timestamp of the last successful live Excel file sync. |
| **`crmate_chat_conversations`** | Array of chat thread objects | Team collaboration chat conversations linked to projects. |
| **`crmate_chat_messages`** | Array of message objects | Collaborative messages exchanged within project chat channels. |
| **`crmate_dashboard_visible_modules`** | Legacy Object | Deprecated dashboard module visibility key, cleaned up on reset. |

### 1.2 `sessionStorage` Usage
- **Key: `al_mespar_session`**
  - When a user logs in with the **"Remember me" checkbox unchecked**, the session token is stored in `sessionStorage` (in addition to being mirrored in `localStorage` marked non-permanent). Closing the browser tab terminates the session.

### 1.3 In-Memory Buffering & Durable Flush
- In `src/lib/store/crm-context.tsx`, state changes to `projects`, `contacts`, `companies`, etc., write to `localStorage` with a **350ms debounce** to prevent UI stutter during rapid user operations (e.g., drag-and-drop Kanban moves).
- On `window.beforeunload`, `CRMContext` executes `flushAllToLocalStorage()`, immediately writing all active in-memory references (`projectsRef.current`, `contactsRef.current`, etc.) synchronously to `localStorage` before the page unloads.

---

## 2. Excel File Synchronization Architecture

The CRM maintains bi-directional synchronization with the company's master Excel spreadsheet located on the server filesystem.

### 2.1 File Names and Folder Paths
- **Folder Location**: `source-data/` in the project root (`path.join(process.cwd(), 'source-data')`).
- **Live Master File**: `Saudi Projects Follow UP - Eslam Mohandes(1).xlsx`
- **Safety Backup File**: `Saudi Projects Follow UP - Eslam Mohandes(1).backup.xlsx`

### 2.2 When the File is Read
1. **Inspection (`GET /api/sync-excel`)**:
   - Checks if the file exists on disk.
   - Reads the workbook buffer using SheetJS (`XLSX.read`).
   - Parses the sheet `'Projects Follow UP'`.
   - Counts all non-empty opportunity rows (starting from row index 5 downwards).
   - Reads file stats (`mtime`, `size`) and backup file presence.
2. **Download Sample (`GET /api/load-sample-sheet`)**:
   - Reads `source-data/Saudi Projects Follow UP - Eslam Mohandes(1).xlsx` from disk and streams it as a binary download.
3. **Pre-Sync Pass (`POST /api/sync-excel`)**:
   - Reads the full workbook buffer with flags:
     - `cellFormula: true` (retains calculated formulas)
     - `cellStyles: true` (retains font, border, and fill styles)
     - `cellDates: true` (retains native date formats)

### 2.3 When the File is Written
1. **Automated Debounced Sync (`CRMContext`)**:
   - In `src/lib/store/crm-context.tsx`, an automated `useEffect` monitors the `projects` state array.
   - After the initial mount, any modification to projects (adding a project, editing value, dragging to a new stage, changing next action) triggers a **2500ms debounced** call to `/api/sync-excel`.
2. **Manual User Sync**:
   - Clicking "Sync with Excel" (in the dashboard, header, or settings) triggers `syncExcelNow(projects)`.
3. **Direct Export / Save (`POST /api/export-excel`)**:
   - When exporting or saving via the export engine, `buildCompleteLiveExcelWorkbook(body)` compiles the updated workbook and writes directly to `source-data/Saudi Projects Follow UP - Eslam Mohandes(1).xlsx`.

### 2.4 Backup and Mutation Logic
Before any write operation in `POST /api/sync-excel`:
1. **Safety Backup**:
   - Checks if `Saudi Projects Follow UP - Eslam Mohandes(1).backup.xlsx` exists in `source-data/`.
   - If missing, or if the request specifies `forceBackup: true`, it creates an exact binary duplicate using `fs.copyFileSync(filePath, backupPath)`.
2. **Formula Preservation**:
   - Cells containing formulas in columns `14`, `17`, and `18` (weighted values, calculated commissions, and status formulas) are protected; the updater strictly preserves `existing.f` and skips overwriting them with raw values.
3. **Row Matching & Field Mapping**:
   - **First Pass (Existing Rows 5–139)**: Matches CRM projects against existing Excel rows by normalized `PR` number or project name. Updates columns:
     - Col 1 (B): Opportunity Name
     - Col 2 (C): Client Name
     - Col 3 (D): Client Phone
     - Col 4 (E): Company Name
     - Col 5 (F): Client Email
     - Col 6 (G): Project Stage (`In Hand` vs `Tender`)
     - Col 7 (H): Location
     - Col 8 (I): Status (`Gather Info.`, `RFQ Processing`, `Send to Client`, `Technical Submittal`, `Negotiation`, `Won`, `Lost`)
     - Col 9 (J): Estimated Value
     - Col 10 (K): Action Done / Notes
     - Col 11 (L): Action Date (converted to Excel date serial)
     - Col 12 (M): Follow Up / Next Action
     - Col 13 (N): Follow Up Date (converted to Excel date serial)
     - Col 15 (P): Referral flag
   - **Second Pass (New CRM Projects)**: Unmatched projects created in CRM are placed into empty template rows (rows where Opportunity Name is empty or `'0'`).
4. **Hyperlink Sanitization**:
   - Scans all sheets to truncate or sanitize runaway URL strings or invalid encoding before saving.
5. **Atomic Write**:
   - Generates the compressed buffer (`bookType: 'xlsx', compression: true`) and writes back synchronously to disk using `fs.writeFileSync`.
   - Records the completion time in `localStorage.setItem('al_mespar_last_excel_sync', timeStr)`.

---

## 3. Data Saved Anywhere Else

1. **Static Initial Seed File (`src/lib/data/migrated_data.json`)**:
   - 17,000+ line JSON database seed containing the extracted historical data from the original Excel workbook. Loaded as fallback when `localStorage` is empty.
2. **Component Backup Snapshots (`.backups/apple-audit-baseline-2026-10-19/`)**:
   - Historical code backup of baseline pages and modals created prior to the Apple HIG visual styling alignment.
3. **Root Filesystem Exports**:
   - `Al-Mespar-CRM-Standard-Template.xlsx`: Clean reference CRM template stored in root.
   - `Saudi_Projects_Follow_UP_Live_Updated.xlsx`: Root export snapshot of the synchronized live workbook.
4. **Supabase Cloud PostgreSQL Database (Optional / Connected Mode)**:
   - When configured with environment credentials, all tables (`profiles`, `companies`, `contacts`, `projects`, `quotations`, `activities`, `weekly_plans`, `sales_targets`, `project_stage_history`) are stored in Supabase cloud PostgreSQL with Row Level Security.
