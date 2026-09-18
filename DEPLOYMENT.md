# CRMate — Netlify Production Deployment Guide

This guide provides step-by-step instructions to deploy **CRMate** to **Netlify** (Free Tier or Pro) with zero configuration issues.

---

## 1. Prerequisites

- **Node.js**: Version `20.x` or higher (configured in `netlify.toml`).
- **Netlify Account**: Sign up at [netlify.com](https://www.netlify.com).
- **Git Repository**: GitHub, GitLab, or Bitbucket repository containing the codebase.
- **Package Manager**: `npm` (uses `package-lock.json` for deterministic dependency resolution).

---

## 2. Netlify Configuration Overview

The repository is pre-configured with `netlify.toml` at the project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

Next.js (`next.config.mjs`) is also optimized for Netlify:
- `images.unoptimized: true` (avoids Netlify image transformation bandwidth limits).
- `trailingSlash: false`.
- `reactStrictMode: true`.

---

## 3. Step-by-Step Deployment Instructions

### Method A: Deploy via Netlify Dashboard (Recommended)

1. **Push Code to Git**:
   Ensure your latest code is committed and pushed to your GitHub/GitLab repository:
   ```bash
   git add .
   git commit -m "chore: prepare for production Netlify deployment"
   git push origin main
   ```

2. **Import Site into Netlify**:
   - Log into [app.netlify.com](https://app.netlify.com).
   - Click **Add new site** > **Import an existing project**.
   - Select **GitHub** (or your Git provider) and authorize access.
   - Choose the `Al-Mespar-CRM` repository.

3. **Confirm Build Settings**:
   Netlify will automatically detect `netlify.toml` settings:
   - **Branch to deploy**: `main`
   - **Base directory**: *(leave blank for root)*
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

4. **Add Environment Variables**:
   Under **Site configuration** > **Environment variables**, click **Add a variable** (or **Import from .env**):
   - `NEXT_PUBLIC_APP_URL`: Your production Netlify URL (e.g. `https://crmate.netlify.app`)
   - `NEXT_PUBLIC_SUPABASE_URL`: *(Optional during current localStorage phase)*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: *(Optional during current localStorage phase)*
   - `SUPABASE_SERVICE_ROLE_KEY`: *(Optional during current localStorage phase)*

5. **Trigger Deploy**:
   - Click **Deploy site**.
   - Netlify will install dependencies, invoke `@netlify/plugin-nextjs`, and complete the Next.js production build.

---

### Method B: Deploy via Netlify CLI

1. Install Netlify CLI globally:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to your Netlify account:
   ```bash
   netlify login
   ```

3. Initialize and link the site:
   ```bash
   netlify init
   ```

4. Build and deploy directly to production:
   ```bash
   netlify deploy --build --prod
   ```

---

## 4. Default Seeded User Credentials for Testing

Once deployed, you can log in using any of the 5 authorized user accounts:

| User | Email | Password | Role | Access Scope |
|:---|:---|:---|:---|:---|
| **Eslam Al-Mohandes** | `eslam.almohandes@almespar.com` | `Es1234` | Sales Engineer | Western Region (34 Projects) |
| **Abdelrahman Mohamed** | `abdelrahman.mohamed@almespar.com` | `Ar1234` | Sales Engineer | Central Region (0 Projects) |
| **Abdurahman Al-Kaffas**| `ar.alkaffas@almespar.com` | `Kaffas1234` | Sales Manager | Regional Manager (All team deals & approvals) |
| **Karim Abdelazeez** | `karim.abdelazeez@almespar.com` | `Kr1234` | Sales Engineer | Eastern Region (0 Projects) |
| **Eslam** | `ideslam0@gmail.com` | `0125995614` | Admin | Executive Admin (Full system + Dev Switcher) |

---

## 5. Troubleshooting & Common Issues

### Issue 1: "Plugin @netlify/plugin-nextjs failed"
- **Cause**: Node version mismatch.
- **Solution**: Ensure Node version is set to `20` in `netlify.toml` (`NODE_VERSION = "20"`) or via Netlify Environment Variables.

### Issue 2: "Images failing to load or 402 Payment Required"
- **Cause**: Exceeded Netlify on-demand image optimization transformations.
- **Solution**: `next.config.mjs` already has `images: { unoptimized: true }` enabled to prevent this.

### Issue 3: "Page Refresh returns 404 on sub-routes"
- **Cause**: SPA routing misconfiguration.
- **Solution**: Netlify's Next.js plugin automatically handles App Router dynamic routing and rewrites via Serverless/Edge functions.

### Issue 4: "Hydration mismatch warning"
- **Cause**: Server-side vs client-side date/time or localStorage discrepancies.
- **Solution**: CRMate includes `isMounted` guards and `suppressHydrationWarning` on `RootLayout` to ensure zero hydration errors.
