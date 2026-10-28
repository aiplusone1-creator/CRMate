# User Roles and Screen-by-Screen Permission Matrix

This document details every user role implemented in **Al-Mespar CRM (CRMate)** and describes exactly what each role can see and do on every screen, based on `src/lib/types/user.ts`, `src/lib/logic/scope.ts`, `src/lib/hooks/useSalesScope.ts`, and `src/app/settings/page.tsx`.

---

## 1. Defined Roles

The CRM implements **5 distinct roles**:

1. **`admin` (System Administrator / Commercial Director)**
   - Unrestricted kingdom-wide access. Oversees all regions, users, quotas, discount approvals, and data management.
2. **`sales_manager` (Regional / Sales Manager)**
   - Full visibility across team pipelines, weekly plans, and quotations. Can approve or reject commercial discounts and configure sales quotas.
3. **`sales_engineer` (Regional Sales Engineer / Account Representative)**
   - Focused execution role. Manages assigned and referred projects, schedules weekly visits, records daily activities via voice/text, and submits commercial discount requests.
4. **`estimator` (Lead Cost Estimator / Technical Submittal Engineer)**
   - Technical pricing role. Reviews RFQ specifications, drafts BOQs, edits quotation line items, and maintains cost sheets.
5. **`viewer` (Executive / Auditor / Read-Only Observer)**
   - Read-only visibility across dashboards, projects, and reports for auditing and review without modification rights.

---

## 2. Global RBAC Permission Matrix

*As defined in `src/app/settings/page.tsx` (lines 1608–1668):*

| Role | Pipeline Projects | Sales Activities | Quotations & BOQ | Discount Approvals | Settings & Quotas |
|---|---|---|---|---|---|
| **Admin** | Full Access (All Projects) | Full Access (Team-wide) | Full Access | Approve / Reject | Full System Control & User Provisioning |
| **Sales Manager** | View All / Edit Team | Review All Team | View & Edit All | Approve / Reject | Configure Targets & Review Quotas |
| **Sales Engineer** | Manage Assigned / Referred | Log & Voice Dictate Own | Create & Upload | Submit Approval Requests | View Personal Targets (Read Only) |
| **Estimator** | View Active RFQs | Read-Only | Manage BOQ & Cost | No Access | No Access |
| **Viewer** | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only |

---

## 3. Screen-by-Screen Role Capabilities

### 3.1 Dashboard (`/`)
- **Admin & Sales Manager:**
  - View aggregate kingdom-wide KPIs (Total Pipeline Value, Won Value, Win Rate, Active Projects, Overdue Follow-ups).
  - Use the Salesperson Filter dropdown to switch view between the entire team or any specific sales engineer (`scopeProjects`, `scopeActivities`).
  - View all priority urgent actions across all team members.
  - View full Sales Leaderboard and stage distributions.
  - Reorder dashboard modules and toggle widget visibility.
- **Sales Engineer:**
  - KPIs reflect personal assigned/referred pipeline by default (or all projects if filter is changed to 'all').
  - Priority action widget surfaces urgent actions and follow-ups specific to their assigned opportunities.
  - Quick action shortcuts to log activities and schedule weekly visits.
- **Estimator & Viewer:**
  - Read-only display of KPI summaries and pipeline stages. Cannot create new projects or quick-log activities.

---

### 3.2 Projects Pipeline & Registry (`/projects`)
- **Admin & Sales Manager:**
  - View all projects across all territories in both Kanban Board and Data Table views.
  - Filter by any sales engineer, region, stage, or priority.
  - Drag-and-drop any project card across pipeline stages (automatically logs stage transition in history).
  - Create new projects, edit project details, or archive projects.
- **Sales Engineer:**
  - By default, views projects owned by or referred to them (`owner_id === user.id || referred_to_id === user.id`).
  - If they switch filter to "All", they can view project names across the team for territory awareness.
  - Can create new projects and drag-and-drop their assigned project cards to advance stages.
  - Cannot modify or reassign projects owned by other engineers.
- **Estimator:**
  - Can view projects currently in `'rfq_processing'`, `'pricing'`, or `'quotation_sent'` stages.
  - Read-only pipeline view (cannot move stages on behalf of sales).
- **Viewer:**
  - Read-only observation of Kanban board and table. Drag-and-drop stage movement is disabled.

---

### 3.3 Project Cockpit (`/projects/[id]`)
*Access check governed by `canUserAccessProjectCockpit` (`src/lib/logic/scope.ts`):*
- **Admin, Sales Manager, Estimator, Viewer:**
  - Can open and inspect the Cockpit for **any** project in the system.
- **Sales Engineer:**
  - Can only open the Cockpit if:
    1. They are the project owner (`owner_id === user.id`), OR
    2. The project was referred to them (`referred_to_id === user.id`), OR
    3. They are added as an authorized team member in `project_members`.
  - Attempts by unauthorized engineers to access other cockpits are blocked.
- **Inside the Cockpit:**
  - **Admin / Sales Manager:** Full edit access across project metadata, PO & Collection Tracking, quotations, team notes, and stage advancement.
  - **Sales Engineer (Owner/Member):** Can log activities, schedule follow-ups, update next actions, upload quotation revisions, request discount approvals, and use the WhatsApp quick composer.
  - **Estimator:** Can view specifications, add BOQ quotation revisions, and attach pricing files.
  - **Viewer:** Read-only viewing of all tabs (Overview, Quotations, Activity Log, Collaboration Chat).

---

### 3.4 Quotation Engine (`/quotations` and `/quotations/new`)
- **Admin & Sales Manager:**
  - View all quotations across all projects.
  - Directly approve or reject discount approval requests submitted by sales engineers.
  - Create, revise, or archive quotations.
  - Open Quotation Comparison Modal and Price History Chart.
  - Print / Export official quotation PDFs.
- **Estimator:**
  - Create and edit quotation drafts, line items, pricing, submittals, and vendor brands.
  - Manage revisions (`v1` -> `v2` -> `v3`).
  - No authority to approve commercial discounts.
- **Sales Engineer:**
  - Create and view quotations for their own assigned projects.
  - If quotation discount exceeds default thresholds, can submit a formal discount approval request to management.
  - Print/export approved quotation sheets and send notifications via WhatsApp.
- **Viewer:**
  - View quotation list, price charts, and print previews in read-only mode.

---

### 3.5 Companies Directory (`/companies`)
- **All Authenticated Roles (`admin`, `sales_manager`, `sales_engineer`, `estimator`, `viewer`):**
  - Shared master repository. All users can search and view companies, company types, city, linked contacts, and active projects.
- **Admin, Sales Manager, Sales Engineer:**
  - Can create new companies and edit existing company information (name, city, address, website, Google Maps location).
- **Viewer:**
  - Read-only viewing.

---

### 3.6 Contacts & Hot Leads Directory (`/contacts`)
- **All Authenticated Roles:**
  - Search and filter all contacts, view phone numbers, email addresses, and designated "Hot Leads".
  - Click-to-call, click-to-email (`mailto:`), and click-to-WhatsApp (`wa.me`).
- **Admin, Sales Manager, Sales Engineer:**
  - Add new contacts, edit contact details, toggle "Hot Lead" status flag, and reassign contact ownership.
- **Viewer:**
  - Read-only contact directory.

---

### 3.7 Weekly Action Planner (`/my-week`)
- **Admin & Sales Manager:**
  - View the weekly schedule for any sales engineer by switching the user selector.
  - Review planned visits, meetings, and calls across all 6 work days (Saturday–Thursday).
  - Check completion rates and skipped/rescheduled visit notes.
- **Sales Engineer:**
  - Manages their personal weekly plan.
  - Schedules planned visits and appointments by day and time slot.
  - 1-click status conversion: clicking "Complete" prompts for meeting notes and instantly records it into the actual activity log.
- **Estimator & Viewer:**
  - Read-only inspection of planned schedules.

---

### 3.8 Activity Audit Log & Voice Dictation (`/activities`)
- **Admin & Sales Manager:**
  - View complete, chronologically sorted activity feed across the entire sales team.
  - Filter activities by channel (Call, Site Visit, Online Meeting, Hunting, WhatsApp, Email) or outcome.
- **Sales Engineer:**
  - Views their own logged activities.
  - Can log new activities manually via `AddActivityModal`.
  - Can dictate activities using the Arabic Speech Recognition modal (`VoiceActivityModal`), with automated client-side parsing into project, company, channel, and outcome.
- **Estimator & Viewer:**
  - Read-only view of activity history.

---

### 3.9 Reports & Analytics Intelligence (`/reports`)
- **Admin & Sales Manager:**
  - View full management analytics: Weekly Activity Summaries, Planned vs. Actual Conversion Rates, Pipeline Value by Stage, Sales Engineer Target vs. Actual Quotas, and Win/Loss Analysis.
  - Generate and print formal executive PDF reports (`ReportPdfModal`).
- **Sales Engineer:**
  - Views performance metrics scoped to their assigned opportunities and personal target quota progress.
- **Viewer:**
  - Read-only access to company-wide reports.

---

### 3.10 System Settings & Admin (`/settings`)
*Access divided across 4 tabs:*
- **Tab 1: Profile & Preferences (All Users):**
  - Any logged-in user can update their personal display name, change language (Arabic / English), and switch theme (Light / Dark / System).
- **Tab 2: Team Management:**
  - **Admin:** Can create new user accounts, assign roles (`sales_engineer`, `sales_manager`, `estimator`, `viewer`), assign regional territories, reset user passwords, and activate/deactivate accounts. Admin accounts are protected from non-admin modification.
  - **Sales Manager:** Can view team members and their contact information. Cannot provision new users or edit Admin accounts.
  - **Sales Engineer, Estimator, Viewer:** Read-only view of team member roster.
- **Tab 3: Sales Targets & Quotas:**
  - **Admin & Sales Manager:** Full authority to set, edit, or delete monthly/quarterly sales quotas and targets for each sales engineer.
  - **Sales Engineer:** Read-only viewing of their assigned target goals.
  - **Estimator & Viewer:** No access to edit targets.
- **Tab 4: Data Management & Backups:**
  - **Admin:** Full access to Export CRM JSON Backup, Restore from JSON, Inspect Live Excel Sync Status, and perform Factory Master Data Reset.
  - **Non-Admin Roles:** Can export JSON backups; Master Reset and user-management overrides are restricted.

---

### 3.11 Data Import (`/import`) & Migration (`/migration`)
- **Admin & Sales Manager:**
  - Upload external `.xlsx` workbooks, inspect parsed sheets (`Projects Follow UP`, `Hot Leads`, `Master Plan`, `Master Report`), assign imported records to any target sales engineer, resolve duplicates, and commit data to CRMContext.
  - Review migration staging queue and approve/reject matched records.
- **Sales Engineer:**
  - Can upload personal workbook and import data directly assigned to their own user profile.
