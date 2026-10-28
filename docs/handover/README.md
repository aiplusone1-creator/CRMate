# Al-Mespar CRM (CRMate) — Project Handover & System Overview

## 1. What the App Does

**CRMate** is a specialized, high-velocity internal B2B Sales CRM engineered specifically for **Al-Mespar Contracting** (Kingdom of Saudi Arabia). It transitions the contracting company's sales operations from fragile, formula-heavy Excel workbooks (`Saudi Projects Follow UP - Eslam Mohandes(1).xlsx`) into a relational, offline-first web application.

### Key Capabilities
- **Projects & Pipeline Management**: Full tracking of contracting tenders and in-hand opportunities (`PR` numbers, project stages from Lead to Won/Lost, financial estimations, probability weighting, and stage change auditing). Offers both an interactive Kanban stage board and a tabular registry.
- **Bi-Directional Live Excel Sync**: Preserves legacy workflows by syncing CRM projects directly into the live `Saudi Projects Follow UP - Eslam Mohandes(1).xlsx` workbook on disk (preserving existing spreadsheet formulas and formatting) while creating automated backups.
- **Weekly Action Planning (`/my-week`)**: Interactive 6-day Saudi work-week matrix (Saturday through Thursday) for scheduling visits, calls, and hunting trips with 1-click status conversion into logged activities.
- **Activity & Site Visit Logging (`/activities`)**: Activity audit log capturing interaction channels (call, site visit, f2f meeting, hunting, WhatsApp, email) and outcomes. Includes client-side Arabic voice dictation powered by the browser Web Speech API.
- **Quotation Engine & Version Control (`/quotations`)**: Full commercial lifecycle tracking with versioning (`v1`, `v2`, `v3`...), discount approval requests, VAT (15%) calculations, price change analysis, and print-ready formal quotation submittals.
- **Accounts & Contacts Directory (`/companies`, `/contacts`)**: Shared repository of contractors, consultants, and developers, with dedicated filtering for "Hot Leads", direct phone calls, email links, and WhatsApp quick-messaging deep links.
- **Management Intelligence & Analytics (`/reports`)**: Live KPIs, pipeline distribution by stage, planned vs. actual conversion rates, quota achievements, and printable executive PDF summaries.
- **Role-Based Access Control (RBAC)**: 5 distinct roles (`admin`, `sales_manager`, `sales_engineer`, `estimator`, `viewer`) controlling screen visibility, scoped access, and discount approvals.
- **Dual Architecture (Offline LocalStorage + Supabase PostgreSQL)**: Fully functional in standalone/offline mode using browser `localStorage` and disk synchronization, with optional Supabase PostgreSQL persistence and Row Level Security (RLS).

---

## 2. Node.js Version

- **Configured Version:** **`Node.js 20.x`**
- **Evidence in Codebase:**
  - `netlify.toml`: `NODE_VERSION = "20"` (under `[build.environment]`)
  - `DEPLOYMENT.md`: Prerequisites specify `"Node.js: Version 20.x or higher (configured in netlify.toml)"`
  - `package.json`: `"@types/node": "^20.16.11"`

---

## 3. Exact Commands

All commands are run from the project root directory (`D:\Al-Mespar-CRM`):

### 3.1 Install Dependencies
```bash
npm install
```
*(For strict, reproducible CI/CD builds matching `package-lock.json`, run `npm ci`)*

### 3.2 Run Locally (Development Server)
```bash
npm run dev
```
- Starts Next.js development server at: **`http://localhost:3000`**

### 3.3 Build for Production
```bash
npm run build
```
- Compiles the application via Next.js App Router, checks TypeScript types, optimizes assets, and outputs build artifacts to the `.next` directory.

### 3.4 Run Production Server Locally
```bash
npm run start
```
- Starts the production server listening on `http://localhost:3000` (requires `npm run build` first).

### 3.5 Additional Verification Commands
- **TypeScript Type Check:**
  ```bash
  npm run type-check
  ```
  *(Executes `tsc --noEmit`)*

- **Linting:**
  ```bash
  npm run lint
  ```
  *(Executes `next lint`)*

- **End-to-End Tests (Playwright):**
  ```bash
  npm run test:e2e
  ```
  *(Executes `playwright test`)*
