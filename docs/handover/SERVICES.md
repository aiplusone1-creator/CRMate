# External Services, APIs, and Dependencies

This document provides a complete inventory of every external service, API, account dependency, font, and third-party library utilized by **Al-Mespar CRM (CRMate)**, based strictly on the codebase.

---

## 1. Cloud & External Services Summary

| Service / Dependency | Type / Provider | Purpose in Application | Paid / Subscription? | Configuration / Env |
|---|---|---|---|---|
| **Supabase** | Backend-as-a-Service (PostgreSQL + Auth) | Cloud relational database persistence, Row Level Security, user authentication, and quotation version storage. Optional at runtime (app falls back to browser localStorage if omitted). | Free or Paid tier (depends on Supabase project plan) | `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY`<br>`SUPABASE_SERVICE_ROLE_KEY` |
| **Netlify** | Web Hosting & CI/CD Platform | Production hosting, automatic build pipeline, and edge proxying configured via `@netlify/plugin-nextjs`. | Free or Pro tier | Configured in `netlify.toml` |
| **Google Fonts** | Font Assets (`next/font/google`) | Typography for Latin and Arabic scripts: **Urbanist** (headings/numbers), **Outfit** (UI elements), and **Cairo** (Arabic text). Built into Next.js bundle at compile time. | Free (No external runtime calls to Google servers) | Configured in `src/app/layout.tsx` |
| **WhatsApp Direct Linking** | Deep Link Protocol (`wa.me`) | Quick B2B client follow-up messaging, quotation notifications, and site visit confirmations directly from contact and project cards. | Free (No Meta/Twilio WhatsApp Business API key required) | Invoked via `https://wa.me/{phone}?text=...` |
| **Google Maps Navigation** | Direct URL Links | Direct link navigation to contractor headquarters, job sites, and project locations. | Free (No Google Maps JavaScript API key or Google Cloud Billing account required) | Direct URL queries: `https://www.google.com/maps/search/?api=1&query=...` |
| **Browser Web Speech API** | Native Browser API | Real-time speech-to-text dictation in Arabic for logging daily site activities and meetings. Processed client-side via `SpeechRecognition` / `webkitSpeechRecognition`. | Free (Native browser API; no paid cloud speech service like Google Cloud Speech or Whisper) | Handled in `src/components/activities/voice-activity-modal.tsx` |
| **Browser Print Engine** | Native Print (`window.print`) | PDF generation for commercial quotation submittals and management reports via Tailwind `@media print` CSS stylesheet rules. | Free (Native browser print dialogue; no external paid PDF conversion API) | `src/components/modals/quotation-print-modal.tsx`, `src/components/reports/report-pdf-modal.tsx` |
| **Native Email Client** | Protocol (`mailto:`) | Direct email opening to client representatives and purchasing engineers. | Free (No third-party transactional email service like SendGrid, Resend, or Mailgun) | Links in `src/app/contacts/page.tsx`, `src/app/projects/[id]/page.tsx` |
| **Analytics Services** | None | The codebase does **not** integrate any external commercial analytics or telemetry trackers (e.g., Google Analytics, Mixpanel, PostHog, or Datadog). All pipeline analytics and KPIs are computed internally via `src/lib/logic/pipeline-analytics.ts`. | N/A | None |

---

## 2. Third-Party NPM Libraries & Licensing

Every NPM package declared in `package.json` is open-source (no proprietary paid commercial libraries):

| Package | Version | License | Primary Purpose in CRMate |
|---|---|---|---|
| `next` | `14.2.15` | MIT | Next.js App Router core framework, SSR, and API routing |
| `react` / `react-dom` | `^18.3.1` | MIT | Component view layer and state hydration |
| `@supabase/supabase-js` | `^2.45.4` | MIT | Official Supabase PostgreSQL client library |
| `@supabase/ssr` | `^0.5.1` | MIT | Supabase server-side rendering and browser client cookie adapter |
| `xlsx` | `^0.18.5` | Apache-2.0 | SheetJS library for parsing and generating `.xlsx` workbooks |
| `lucide-react` | `^0.453.0` | ISC | Vector icon set for UI interface controls |
| `date-fns` | `^3.6.0` | MIT | Date calculations, formatting, and week calendar manipulation |
| `zod` | `^3.23.8` | MIT | TypeScript schema definition and runtime payload validation |
| `clsx` / `tailwind-merge` | `^2.1.1` / `^2.5.4` | MIT | Conditional CSS class merging without class conflicts |
| `tailwindcss` / `postcss` | `^3.4.14` / `^8.4.47` | MIT | Utility-first CSS styling and compilation engine |
| `@playwright/test` | `^1.64.1` | Apache-2.0 | Automated end-to-end multi-role test suite |
| `typescript` | `^5.6.3` | Apache-2.0 | Static type checking and compiler |
