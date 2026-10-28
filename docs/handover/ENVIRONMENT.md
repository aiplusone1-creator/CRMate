# Environment Variables Documentation

This document inventories every environment variable recognized, read, or referenced by the code and deployment configuration of **Al-Mespar CRM (CRMate)**.

---

## 1. Environment Variable Reference

| Variable Name | One-Line Description | Secret? | Files Using It |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | HTTPS project URL endpoint for Supabase PostgreSQL database, authentication, and REST queries. | **No** (Publicly exposed to browser via `NEXT_PUBLIC_`) | `src/lib/supabase/client.ts`, `.env.example`, `.env.local.example`, `DEPLOYMENT.md` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous API key used by browser clients to query Supabase with Row Level Security (RLS) enforcement. | **No** (Publicly exposed to browser via `NEXT_PUBLIC_`) | `src/lib/supabase/client.ts`, `.env.example`, `.env.local.example`, `DEPLOYMENT.md` |
| `SUPABASE_SERVICE_ROLE_KEY` | Elevated administrative Supabase secret key for server-side execution bypassing Row Level Security. | **Yes** (Strictly server-side secret; must NEVER be exposed to client) | `.env.local.example`, `DEPLOYMENT.md` |
| `NEXT_PUBLIC_APP_URL` | The canonical base URL of the hosted application (e.g., `http://localhost:3000` or production Netlify domain). | **No** (Publicly exposed to browser via `NEXT_PUBLIC_`) | `.env.local.example`, `DEPLOYMENT.md` |
| `NODE_ENV` | Runtime environment mode identifier (`development`, `production`, or `test`). | **No** | `.env.example`, `package.json` (injected automatically by Next.js / Node.js) |

---

## 2. Operating Modes & Fallbacks

- **Zero-Config Offline Mode (Default):**
  If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are empty or omitted, `createClient()` in `src/lib/supabase/client.ts` returns `null`. The CRM operates completely offline using `localStorage` caching and filesystem Excel sync (`/api/sync-excel`) without throwing errors.
- **Supabase Cloud Mode:**
  When valid Supabase credentials are provided, `quotationsService` in `src/lib/supabase/quotations-service.ts` connects to PostgreSQL and synchronizes quotation records with Row Level Security.
