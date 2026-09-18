# Al Mespar Sales CRM — Product Requirements Document (PRD)

## 1. Product Summary

**Working name:** Al Mespar Sales CRM

**Purpose:** Convert the current Excel-based sales follow-up workbook into a lightweight internal web CRM that keeps projects, companies, contacts, activities, weekly plans, follow-ups, quotations and management reporting in one place.

The product must feel faster than Excel, not like a complicated enterprise CRM.

### Core principle

> The salesperson should enter information once, in the smallest possible form, and the system should generate the weekly report, project cards, follow-up lists and management dashboard automatically.

---

## 2. Current Workbook Analysis

The current workbook contains these functional areas:

| Current Sheet | Current Purpose | CRM Replacement |
|---|---|---|
| Dashboard | KPI and management overview | Live CRM Dashboard |
| Projects Follow UP | Main project pipeline | Projects / Pipeline |
| Hot Leads | Contacts/leads needing follow-up | Contacts + filtered Hot Leads view |
| Master Plan (2) | Weekly planned activity | Weekly Planner |
| Master Report | Actual activity performed | Activity Log + Auto-generated Weekly Report |
| Search | Period/search analysis | Global Search + Filters + Reports |
| Won Deals | Closed deals | Won Projects / Quotation & Deal Reports |
| Data Validation | Dropdown source lists | CRM Settings / Master Data |

### Existing data volume observed

The workbook currently contains approximately:

- 22 active projects in the main project list.
- 16 projects marked `In Hand` and 6 marked `Tender`.
- Approximately SAR 73.9M in estimated project value in the current project sheet.
- 154 non-empty Hot Lead records.
- Hundreds of weekly-plan activity records.
- Nearly 1,000 actual activity/report rows.

### Important structural issue

The same customer/project/follow-up information is repeated across multiple sheets. The CRM must make the database relational so that:

**Company → Contacts → Projects → Activities → Follow-ups → Quotations**

are linked records instead of duplicated spreadsheet rows.

---

# 3. Problem Statement

The current Excel workflow creates unnecessary work because:

1. The same contact and project information is entered in multiple places.
2. `Master Plan` contains planned work while `Master Report` requires manual re-entry of what actually happened.
3. Follow-up dates are maintained in different places.
4. A project can have a company, contact, quotation and multiple activities, but they are stored as text fields rather than related records.
5. Management has to read tables instead of opening one project card and immediately understanding its status.
6. The workbook contains formula complexity and compatibility errors such as `#NAME?` and `#VALUE!`, which makes the system fragile.
7. Weekly planning takes too much manual work.

---

# 4. Product Goals

## Primary goals

### G1 — Make data entry extremely fast
A normal follow-up should take roughly 10–20 seconds to log.

### G2 — Eliminate duplicate entry
A planned activity should become an actual activity with one click. The user should not manually copy it into a separate weekly report.

### G3 — Create a single source of truth
Every company, contact, project and activity should exist once and be reused everywhere.

### G4 — Give management a live view
The manager should be able to understand:

- How many active projects exist.
- Which stage each project is in.
- Project values.
- Which projects are hot or stalled.
- Which follow-ups are due.
- How many activities were planned vs completed.
- What happened this week.
- Pipeline by location, stage, salesperson and project type.

### G5 — Keep the interface simple
The system must not feel like Salesforce.

### G6 — Preserve Excel as an import/export format
Excel remains useful for importing old data and exporting reports, but it is no longer the system of record.

---

# 5. Non-Goals for MVP

The first version should NOT attempt to become a full ERP or enterprise CRM.

Exclude from MVP:

- Full quotation-generation engine.
- Accounting or invoicing.
- Inventory.
- Procurement workflows.
- Complex email synchronization.
- WhatsApp API automation.
- Advanced AI forecasting.
- Complicated approval workflows.
- Huge customization frameworks.

These can be Phase 2/3 features.

---

# 6. Recommended CRM Data Model

## 6.1 Company / Account

Represents an organization such as:

- Alsaad Contracting
- Afrina ACUD
- Honeywell
- AlShamela
- IHCC
- MACC

### Fields

- Company ID
- Company Name
- Company Type
  - Contractor
  - Consultant
  - Developer
  - Client / Owner
  - MEP Contractor
  - Supplier / Vendor
  - Hotel
  - Hospital
  - Other
- City
- Website
- Google Maps URL
- General phone
- Notes
- Created by
- Created date
- Last activity

---

## 6.2 Contact

Represents an individual person.

### Fields

- Contact ID
- Full Name
- Company ID
- Job Title
- Mobile
- WhatsApp Mobile
- Email
- City
- LinkedIn URL (optional)
- Contact status
- Notes
- Source
- Owner
- Last contacted date
- Next follow-up date

A company can have many contacts.

A project can have multiple contacts.

---

## 6.3 Project / Opportunity

This becomes the core CRM record and the main item shown in the manager's pipeline.

### Required fields

- Project ID
- PR Number
- Project Name
- Company / Account
- Primary Contact
- Location
- Project Type
- Estimated Value SAR
- Owner / Sales Engineer
- Opportunity Type
- Pipeline Stage
- Project Status
- Priority
- Next Action
- Next Follow-up Date
- Last Activity Date
- Created Date

### Recommended additional fields

- Probability %
- Weighted Value
- Expected Award Date
- Client / Owner
- Consultant
- Main Contractor
- MEP Contractor
- System Package
- Brand / Vendor
- Source
- Lost Reason
- Hold Reason
- Internal Notes

---

# 7. Improved Project Classification

The current workbook mixes different concepts inside `Project Stage` and `Project Status`.

The CRM should separate them.

## Opportunity Type

- New Lead
- In Hand
- Tender
- Existing Account
- Upgrade / Retrofit
- Hunting / Potential

## Pipeline Stage

Recommended default sequence:

1. Lead
2. Qualification
3. Requirement / RFQ
4. Pricing
5. Quotation Sent
6. Technical Submission
7. Technically Approved
8. Negotiation
9. Award / Won
10. Lost
11. Hold

This keeps `In Hand` and `Tender` as classifications rather than pretending they are pipeline steps.

## Project Health

Calculated automatically:

- **Green:** has a future follow-up and recent activity.
- **Yellow:** no recent activity or follow-up is approaching.
- **Red:** follow-up overdue, or important project has no next action.

No manual health score is required.

---

# 8. Project Card

This is the most important UI component in the system.

Every project must have a compact card.

### Card layout

```text
┌────────────────────────────────────────────────────┐
│ PR1027   IMC Obhur Hospital                         │
│ Alsaad Contracting                    Jeddah       │
│                                                    │
│ Tender          ● Quotation Sent                   │
│                                                    │
│ Estimated Value                    SAR 9.61M       │
│                                                    │
│ Primary: Omar Alsaad                               │
│ Last Activity: 2 days ago                          │
│                                                    │
│ NEXT ACTION                                        │
│ Follow up with procurement                          │
│ Due: Sunday, 21 Sep                                │
│                                                    │
│ [Open Project] [Log Activity] [Call] [WhatsApp]   │
└────────────────────────────────────────────────────┘
```

### Card must show

- PR number
- Project name
- Company
- Location
- Opportunity type
- Pipeline stage
- Status badge
- Estimated value
- Owner
- Primary contact
- Last activity
- Next action
- Next follow-up date
- Health indicator

### Card actions

- Open
- Edit
- Log Activity
- Change Stage
- Reschedule Follow-up
- Call
- WhatsApp
- Email

---

# 9. Project Detail Page

Clicking a project opens a full project page.

## Header

- Project name
- PR number
- Company
- Estimated value
- Stage
- Status
- Health
- Owner

## Section 1 — Next Action

The first thing on the page should be:

**What needs to happen next?**

- Next action
- Due date
- Assigned person
- Quick Complete button
- Reschedule button

## Section 2 — Project Progress

Horizontal pipeline:

Lead → Qualification → RFQ → Pricing → Quotation → Technical → Negotiation → Won/Lost

## Section 3 — Contacts

List of people connected to the project.

## Section 4 — Activity Timeline

Example:

```text
Today
3:12 PM   Call with Omar
          Client requested revised quotation.
          Next: Send revision tomorrow.

Yesterday
11:30 AM  Quotation sent
          Q2032-726-BMS
          SAR 220,000

Monday
2:00 PM   F2F Meeting
          Met procurement team.
```

## Section 5 — Quotations

Multiple quotation records can belong to one project.

Columns:

- Quotation number
- Date
- Amount
- Version
- Status
- File

## Section 6 — Notes / Attachments

- BOQ
- Quotation PDF
- Technical proposal
- Company profile
- Screenshots
- Emails converted to notes

---

# 10. Activity System

This replaces the manual `Master Report` process.

## Activity types

- Call
- F2F Meeting
- Online Meeting
- Visit
- Cold Call
- Follow-up
- Hunting
- Consultant Visit
- Event
- Office Work
- Email

## Activity outcome presets

To reduce typing, provide one-click outcome chips:

- Connected
- No Answer
- Meeting Booked
- Requirement Received
- RFQ Received
- Quotation Sent
- Awaiting Feedback
- Procurement Contact Needed
- Technical Feedback Needed
- Follow Up Later
- Lost
- Hold
- Won
- New Project Identified

The user can add free-text notes only when necessary.

---

# 11. Quick Activity Entry

This is a critical MVP feature.

Clicking **Log Activity** opens a small modal:

```text
Log Activity

Project / Contact: [ IMC Obhur Hospital ▼ ]
Type:              [ Call ▼ ]
Outcome:           [ Awaiting Feedback ▼ ]

Notes:
[ Client said final feedback expected Sunday ]

Next action:       [ Follow up with procurement ]
Next follow-up:    [ 21 Sep ]

[ Save Activity ]
```

### Fast-entry behavior

- Project can be pre-selected from the project card.
- Date/time defaults to current time.
- User can use keyboard shortcuts.
- The last-used activity type can be suggested.
- Outcome chips reduce typing.
- After saving, the project automatically updates its `Last Activity`, `Next Action`, and `Next Follow-up`.

Target: ordinary follow-up entered in under 20 seconds.

---

# 12. Weekly Plan

The current `Master Plan` should become a real weekly planning page.

## Primary workflow

Every week, open:

**My Week**

The system automatically suggests planned actions from:

1. Overdue follow-ups.
2. Follow-ups due this week.
3. Open projects with no future action.
4. High-value projects.
5. Projects with no activity for more than X days.
6. New leads needing first follow-up.
7. Manager-priority projects.
8. Hunting activities.
9. Consultant/client meetings.
10. Hotel/account visits.

The user clicks **Add to Week** instead of rewriting rows.

## Weekly planner view

```text
MON
09:00  Call — Alsalama Hospital
10:00  Visit — Honeywell
11:00  Follow-up — IMC

TUE
09:00  Call — Afrina
...

WED
...
```

Views:

- Week calendar
- List
- Daily schedule

## Quick planning action

`+ Add Activity`

Fields:

- Project/contact
- Activity type
- Date
- Time
- Goal

Everything else should be optional.

---

# 13. Planned vs Actual

This is the key replacement for `Master Plan` + `Master Report`.

Each planned activity has a status:

- Planned
- Completed
- Rescheduled
- Skipped
- Cancelled

When the salesperson completes it:

**Click Complete → Log Result → Save**

The system then creates the actual activity record.

No second report entry is required.

### Example

Planned:

> Call IMC — Get procurement feedback

Actual:

> Completed 3:20 PM
> Client requested revised quotation.
> Next follow-up Sunday.

The same information automatically appears in:

- Weekly report
- Project timeline
- Dashboard
- Manager report

---

# 14. Automatic Weekly Report

The system should generate what `Master Report` currently represents.

## Report filters

- Week
- Sales Engineer
- City
- Activity type
- Project
- Company

## Report metrics

- Total planned activities
- Total completed activities
- Completion rate
- Calls
- Meetings
- Visits
- Hunting visits
- New leads
- New projects
- Quotations sent
- Technical submissions
- Negotiations
- Won deals
- Lost deals
- Total quotation value
- Total pipeline value

## Activity table

```text
Date | Time | Project | Contact | Type | Outcome | Notes | Next Action | Follow-up
```

## Export

- Excel
- PDF

The manager does not need to ask the salesperson for a separate report file.

---

# 15. Dashboard — Management View

The dashboard should answer the manager's questions in less than 30 seconds.

## KPI row

1. Active Projects
2. Pipeline Value
3. Quotation Value
4. Won Value
5. Overdue Follow-ups
6. Activities Due Today
7. New Leads This Week
8. Planned vs Completed

## Pipeline summary

Visual stages:

- Lead
- Qualification
- RFQ
- Pricing
- Quotation Sent
- Technical
- Negotiation
- Won
- Lost

## Project value

- Total estimated pipeline
- Weighted pipeline
- Value by stage
- Value by city

## Activity performance

- Calls
- F2F meetings
- Online meetings
- Visits
- Hunting
- New leads

## Attention Center

This section should show only exceptions:

### Overdue
Projects where follow-up date has passed.

### No Next Action
Active projects without a next step.

### Stale Projects
No activity for X days.

### High Value At Risk
High-value projects with overdue actions.

---

# 16. Dashboard Filters

Global filters:

- Date range
- Week
- Salesperson
- City
- Opportunity type
- Pipeline stage
- Status
- Project value range

The dashboard should update without page reloads.

---

# 17. Hot Leads View

`Hot Leads` should NOT remain a separate duplicate database.

It should simply be a filtered view of contacts/projects.

### Hot Lead criteria

A contact/project appears automatically when one or more are true:

- Follow-up due in next 7 days.
- High project value.
- Recent project activity.
- New project identified.
- Manual `Hot` priority.

### Hot Lead card

- Name
- Company
- Position
- Phone
- Linked projects
- Last activity
- Next action
- Follow-up date
- Priority

---

# 18. Global Search

Replace the current Search sheet with one global search field.

Search by:

- Project name
- PR number
- Company
- Contact
- Phone
- Email
- Location
- Quotation number

Example:

Searching `Yasser` returns:

- Yasser Bahussin contact
- Alsalama Hospital project
- Related activity timeline
- Quotation(s)

---

# 19. Reports

## Standard reports

### Pipeline Report
Projects grouped by stage.

### Project Value Report
Value by project, city, company, stage.

### Activity Report
All actual sales activities.

### Weekly Sales Report
Planned vs completed.

### Follow-up Report
Due, overdue and upcoming.

### Won/Lost Report
Closed projects and values.

### Account Report
Companies with active projects and latest interactions.

### Salesperson Report
Performance by user.

---

# 20. Notifications

MVP:

- In-app notification for due today.
- In-app notification for overdue.
- Dashboard warning for projects without next action.

Phase 2:

- Email reminders.
- Daily summary email.
- WhatsApp reminders.
- Calendar integration.

---

# 21. User Roles

## Admin

- Full access.
- Manage users.
- Manage stages/statuses.
- Import data.
- Export data.
- View audit logs.

## Manager

- View all projects.
- View all activities.
- Edit project fields.
- Assign projects.
- Review weekly reports.
- Export reports.

## Sales Engineer

- Create/edit own contacts.
- Create/edit own projects.
- Log activities.
- Manage own weekly plan.
- View shared company accounts/projects according to policy.

## Viewer

- Read-only dashboard, projects and reports.

---

# 22. Database Schema

Recommended PostgreSQL/Supabase tables:

## Core tables

- `users`
- `companies`
- `contacts`
- `projects`
- `project_contacts`
- `activities`
- `tasks`
- `weekly_plans`
- `planned_activities`
- `quotations`
- `attachments`
- `project_stage_history`
- `audit_logs`
- `settings`

### Key relationships

```text
Company
 ├── Contacts
 ├── Projects
 │    ├── Project Contacts
 │    ├── Activities
 │    ├── Planned Activities
 │    ├── Quotations
 │    ├── Attachments
 │    └── Stage History
 └── Account Activity
```

---

# 23. Recommended Project Table Fields

```text
id
pr_number
name
company_id
location
opportunity_type
pipeline_stage
status
priority
estimated_value
probability
weighted_value
expected_award_date
owner_id
primary_contact_id
next_action
next_follow_up_at
last_activity_at
created_at
updated_at
lost_reason
hold_reason
notes
```

`weighted_value` should be calculated automatically:

`estimated_value × probability`

---

# 24. Recommended Activity Table Fields

```text
id
project_id nullable
company_id nullable
contact_id nullable
user_id
planned_activity_id nullable
activity_date
start_time
end_time
activity_type
outcome
notes
next_action
next_follow_up_at
created_at
```

The activity table is the source of truth for actual work performed.

---

# 25. Recommended Planned Activity Table

```text
id
weekly_plan_id
project_id nullable
company_id nullable
contact_id nullable
assigned_to
scheduled_date
scheduled_start
scheduled_end
activity_type
goal
priority
status
created_at
completed_activity_id nullable
```

---

# 26. Quotation Module

A project may have more than one quotation.

Example:

```text
Project: Al Tahliyah Business Park

Q1 — Honeywell — SAR xxx
Q2 — Bosch option — SAR xxx
Q3 — Revised — SAR xxx
```

Fields:

- Quotation number
- Version
- Date
- Amount
- Currency
- Vendor / Brand
- Status
- Sent date
- Valid until
- Attachment
- Notes

This is especially useful because the same project can go through several pricing versions.

---

# 27. Business Rules

## Rule 1 — Active project must have a next action
If an active project has no next action, show:

**Needs Attention**

## Rule 2 — Every active project should have a follow-up date
If no date exists, show it in Attention Center.

## Rule 3 — Completing a planned activity creates the actual activity
No duplicate entry.

## Rule 4 — Activity updates project automatically
On activity save:

- Last activity = current date/time.
- Next action = entered next action.
- Next follow-up = entered date.

## Rule 5 — Stage changes are tracked
Every change is written to `project_stage_history`.

## Rule 6 — Lost projects require a reason
Examples:

- Price
- Competitor
- Project Cancelled
- Lost to Contractor
- Lost to Vendor
- No Budget
- No Response
- Other

## Rule 7 — Hold projects require a reason
Examples:

- Client decision pending
- Budget pending
- Project delayed
- Awaiting design
- Awaiting procurement

---

# 28. Weekly Planning Automation

When a new week begins, the system creates a suggested plan from:

```text
OVERDUE FOLLOW-UPS
        ↓
DUE THIS WEEK
        ↓
HIGH-VALUE OPEN PROJECTS
        ↓
STALE PROJECTS
        ↓
HOT LEADS
        ↓
NEW HUNTING TARGETS
```

The salesperson then reviews the suggestions and clicks:

- Add
- Remove
- Reschedule

This should make weekly planning dramatically faster than entering every row manually.

---

# 29. Daily Workflow

## Morning

Open **My Day**.

See:

- Today's planned activities.
- Overdue follow-ups.
- High-priority projects.
- Quick actions.

## During the day

Complete activity → log outcome → set next action.

## End of day

Dashboard automatically shows:

- Planned
- Completed
- Pending
- Rescheduled

No manual daily report is needed.

---

# 30. Weekly Manager Workflow

Manager opens Dashboard.

### Step 1
Review pipeline value.

### Step 2
Check overdue follow-ups.

### Step 3
Check high-value projects.

### Step 4
Review planned vs completed activities.

### Step 5
Open selected project cards.

### Step 6
Open weekly report.

The system should answer the status questions without opening Excel.

---

# 31. UX / UI Requirements

## General style

- Clean B2B interface.
- Desktop-first but responsive.
- Fast page loads.
- Large click targets.
- Minimal forms.
- Avoid dense spreadsheet grids as the main interface.
- Use cards, filters and timelines.
- Tables remain available for detailed views.

## Main navigation

```text
Dashboard
My Week
Projects
Companies
Contacts
Activities
Reports
Settings
```

Global top bar:

```text
[ Search... ]                  [ + Quick Add ]
```

Quick Add menu:

- Project
- Contact
- Activity
- Weekly Plan Item
- Quotation

---

# 32. Responsive Requirements

Desktop is the primary environment.

Mobile must support:

- View dashboard.
- Open project.
- Call.
- WhatsApp.
- Log activity.
- Update follow-up.
- View today's plan.

The mobile experience does not need to reproduce every desktop report.

---

# 33. Importing the Existing Excel File

Create an **Excel Import Wizard**.

## Step 1 — Upload
Upload the current workbook.

## Step 2 — Detect sheets
Recognize:

- Projects Follow UP
- Hot Leads
- Master Plan
- Master Report
- Won Deals

## Step 3 — Preview
Show how rows will map to CRM entities.

## Step 4 — Deduplicate
Potential duplicates should be flagged using combinations such as:

- Company + Contact Phone
- Company + Contact Email
- Project Name + Company
- PR number

## Step 5 — Import
Import into relational tables.

## Step 6 — Validation report
Display:

- Imported rows
- Duplicates
- Missing contacts
- Missing project values
- Invalid dates
- Unmapped statuses

---

# 34. Migration Mapping

### Projects Follow UP

| Excel | CRM |
|---|---|
| #PR | projects.pr_number |
| Opportunity | projects.name |
| Client Name | contacts |
| Client Phone Number | contacts.phone |
| Company Name | companies.name |
| Client Email | contacts.email |
| Project Stage | opportunity_type / mapping |
| Project Location | projects.location |
| Status | pipeline_stage / status mapping |
| Est. value | projects.estimated_value |
| Action Done | latest activity notes |
| Action Date | activity date |
| Follow Up | projects.next_action |
| Follow Up Date | projects.next_follow_up_at |

### Hot Leads

Convert to company/contact records and retain the latest action/follow-up as activity/task data.

### Master Plan

Convert each row to `planned_activities`.

### Master Report

Convert each row to `activities`.

### Won Deals

Convert to project/quotion/deal records and preserve quotation information.

---

# 35. Data Quality Improvements During Migration

The import should clean up:

- Multiple phone formats.
- Duplicate companies.
- `0` values used as empty cells.
- Inconsistent capitalization.
- Blank emails.
- Different spellings of the same company.
- Inconsistent city names.
- Duplicate contacts.
- Invalid or missing dates.
- `-` values used as status.

Do not destroy the original Excel file.

---

# 36. Audit Trail

For every important change, keep:

- Who changed it.
- What changed.
- Old value.
- New value.
- Date/time.

Track at minimum:

- Project stage changes.
- Project status changes.
- Estimated value changes.
- Ownership changes.
- Follow-up changes.
- Won/Lost changes.

---

# 37. Security

The system is internal company software.

Requirements:

- Authentication required.
- Role-based permissions.
- Database Row Level Security.
- No public project data.
- HTTPS only in production.
- Secure environment variables.
- Audit trail.
- Regular backups.

Supabase supports authentication and Postgres Row Level Security, making it suitable for this architecture. RLS should be enabled and configured for every exposed table before production. 

---

# 38. Recommended Technical Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Component library such as shadcn/ui

## Backend / Database

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage for attachments

## Hosting

- Vercel for the Next.js application
- Supabase for database/auth/storage

Next.js is a full-stack React framework, and Vercel provides a direct production deployment flow for Next.js applications. Supabase provides Postgres, Auth, Storage and related backend services in one platform. 

---

# 39. Recommended Production Architecture

```text
                        ┌──────────────────┐
                        │     Browser      │
                        │ Desktop / Mobile │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │     Vercel       │
                        │  Next.js App     │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │    Supabase      │
                        │                  │
                        │ PostgreSQL       │
                        │ Auth             │
                        │ Storage          │
                        │ Realtime         │
                        └──────────────────┘
```

Supabase documentation describes Postgres as the core database and also provides Auth, Storage, Realtime and other services around it. 

---

# 40. How to Put It Online

## Phase A — Build

1. Create the codebase in GitHub.
2. Build the Next.js CRM.
3. Create the Supabase project.
4. Create database tables.
5. Configure authentication.
6. Configure RLS policies.
7. Add the Excel import tool.
8. Import the existing workbook.

## Phase B — Deploy

1. Create a Vercel account.
2. Connect GitHub.
3. Import the Next.js repository.
4. Add Supabase environment variables.
5. Deploy.
6. Test authentication.
7. Test all CRM workflows.

Next.js documentation states that deployment to Vercel is a direct production path for Next.js applications. 

## Phase C — Custom domain

Example:

`crm.almespar.com`

Connect the domain DNS records to Vercel and configure the production URL in Supabase Auth.

## Phase D — Team access

Create user accounts for:

- Manager
- Sales Engineers
- Admin

Then assign roles.

---

# 41. Production Backup Strategy

Database backups must be part of production planning.

Supabase currently provides automated database backups on its paid production plans and supports point-in-time recovery as an additional option. Free-plan projects should not be treated as the only backup location for important company data. 

Recommended policy:

- Daily database backup.
- Periodic external export.
- Keep a backup copy outside the live database.
- Test restoration periodically.

---

# 42. MVP Pages

## P01 — Login

Email/password.

## P02 — Dashboard

Management overview.

## P03 — My Day

Today's work.

## P04 — My Week

Weekly planning.

## P05 — Projects

Table + Kanban + filters.

## P06 — Project Detail

Timeline + next action + quotations + contacts.

## P07 — Companies

Account list.

## P08 — Contacts

Contact list.

## P09 — Activities

Activity history.

## P10 — Reports

Weekly / pipeline / activity reports.

## P11 — Import

Excel migration.

## P12 — Settings

Users, stages, statuses, locations and configuration.

---

# 43. MVP Acceptance Criteria

The MVP is considered complete when:

### Projects

- A user can create a project in under 30 seconds.
- A project card shows current stage, value and next action.
- A project can have multiple contacts.
- Project stage changes are recorded.

### Activities

- A user can log a normal follow-up in under 20 seconds.
- Saving an activity updates the project automatically.
- No manual Master Report entry is required.

### Weekly planning

- The system suggests due and overdue activities automatically.
- User can add/remove/reschedule items.
- Completing a planned item creates the actual activity.

### Dashboard

- Pipeline counts update automatically.
- Pipeline value updates automatically.
- Due and overdue follow-ups appear automatically.
- Planned vs completed activities are visible.

### Reports

- Weekly report can be filtered by date/user/project.
- Report can be exported to Excel.

### Security

- Login is required.
- Role-based access is enforced.
- RLS policies protect database data.

### Migration

- Current workbook can be imported.
- Duplicates are flagged.
- Existing projects, contacts, plans and reports are preserved.

---

# 44. Phase 2 Features

Once the MVP is stable:

- Email integration.
- Google Calendar / Outlook Calendar.
- WhatsApp integration.
- Automated daily manager digest.
- AI-generated activity summaries.
- AI next-action suggestions.
- Automatic project deduplication.
- Voice-to-activity entry.
- Mobile PWA improvements.
- Quotation management.
- Document attachments and previews.
- Advanced sales forecasting.

---

# 45. The Most Important UX Decision

Do NOT build a CRM that asks the salesperson to fill 15 fields after every call.

The system should work around this rule:

### Minimum required during a normal follow-up

```text
Project / Contact
Activity type
Outcome
Next action
Next date
```

Everything else should be remembered by the database or optional.

---

# 46. Final Product Vision

The finished system should make the current workflow feel like this:

### Before

```text
Master Plan
      ↓
Do the work
      ↓
Master Report
      ↓
Update Projects Follow UP
      ↓
Update Hot Leads
      ↓
Check Dashboard
```

### After

```text
My Week
   ↓
Do the activity
   ↓
[Complete + Log Result]
   ↓
CRM updates automatically
   ├── Project
   ├── Contact
   ├── Next Follow-up
   ├── Timeline
   ├── Weekly Report
   └── Dashboard
```

That is the main transformation this product should deliver.

---

# 47. Recommended Implementation Order

## Sprint 1 — Foundation

- Auth
- Database
- Companies
- Contacts
- Projects
- Roles

## Sprint 2 — Sales Workflow

- Project cards
- Pipeline
- Activity logging
- Follow-ups
- Timeline

## Sprint 3 — Weekly Management

- My Day
- My Week
- Planned vs actual
- Dashboard
- Weekly reports

## Sprint 4 — Migration

- Excel importer
- Data cleanup
- Duplicate detection
- Existing workbook migration

## Sprint 5 — Production

- Permissions review
- RLS tests
- Backup strategy
- Domain
- Vercel deployment
- User onboarding

---

# 48. Recommended First Version Screen Flow

```text
LOGIN
  ↓
DASHBOARD
  ├── My Day
  ├── My Week
  ├── Projects
  │     └── Project Card
  │            └── Project Detail
  │                    ├── Timeline
  │                    ├── Contacts
  │                    ├── Quotations
  │                    └── Attachments
  ├── Companies
  ├── Contacts
  ├── Activities
  └── Reports
```

---

# 49. Success Metrics

The CRM should be measured by workflow efficiency rather than number of features.

Target outcomes:

- Weekly planning takes minutes, not hours.
- Normal follow-up logging takes under 20 seconds.
- No manual duplication between Plan and Report.
- Manager can identify overdue actions immediately.
- Every active project has a visible next step.
- Project status can be understood from the project card without opening Excel.
- Weekly sales reporting is generated automatically.

---

# 50. Final Recommendation

Build this as a **lightweight sales operating system**, not as a generic CRM clone.

The database should be the source of truth, while the interface should provide three extremely fast workflows:

1. **Plan the week.**
2. **Log what actually happened.**
3. **See what needs attention next.**

Everything else — dashboards, weekly reports, hot leads, search results, follow-up lists and management summaries — should be generated from those records.
