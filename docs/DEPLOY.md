# Deploying MashHub

## Vercel (recommended for production)

The repo includes `vercel.json` and sets Vite `base` to `/` when `VERCEL=1` during the build (no `/MashHub/` subpath).

**1. Import the project** in [Vercel](https://vercel.com): connect the GitHub repo, framework **Vite**, root directory `.`. `vercel.json` uses **pnpm** (`pnpm install`, `pnpm run build`) because the repo lockfile is `pnpm-lock.yaml`. Do not override the install command to `npm install` in the Vercel dashboard — that can break `vite-plugin-pwa` / `workbox-build` (e.g. missing `yallist`).

**2. Environment variables** (Project → Settings → Environment Variables). Apply to **Production** (and Preview if you use Supabase auth on previews):

| Variable | Example | Notes |
|----------|---------|--------|
| `VITE_SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` | From Supabase project settings |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Public anon key only |
| `VITE_SITE_URL` | `https://your-app.vercel.app` | Your deployment origin, no trailing slash. Optional: omit and rely on `window.location.origin` at runtime |

Do **not** set `SUPABASE_SERVICE_ROLE_KEY` on Vercel for the frontend project.

**3. Supabase Dashboard** — **Authentication → URL Configuration**:

- **Site URL**: `https://your-app.vercel.app` (or custom domain)
- **Redirect URLs**: add `https://your-app.vercel.app/auth/callback`, plus local dev URLs e.g. `http://localhost:5173/auth/callback`

**4. Deploy:** Push to the connected branch. Vercel runs `npm install` and `npm run build`. Client-side routes (`/projects`, `/auth/callback`, etc.) are handled by the SPA rewrite in `vercel.json`.

**Preview deployments:** Add the same Supabase redirect URLs for `https://*-*.vercel.app` patterns you use, or disable auth on previews.

**Custom domain:** Point DNS in Vercel, then update `VITE_SITE_URL` and Supabase Site URL / redirect URLs to the custom hostname.

---

## GitHub Pages

### GitHub Actions (recommended)

The repo uses **GitHub Actions** to build and deploy when you push to `main`.

**1. GitHub Pages source:** In the repo on GitHub go to **Settings > Pages**. Set **Source** to **GitHub Actions** (not "Deploy from a branch").

**2. Secrets:** Add repository secrets (**Settings > Secrets and variables > Actions**) so the build can connect to Supabase:
- `VITE_SUPABASE_URL` — from your `.env`
- `VITE_SUPABASE_ANON_KEY` — from your `.env` (public anon key)
- `VITE_SITE_URL` — production app **origin** including the repo subpath, e.g. `https://<owner>.github.io/MashHub` (no trailing slash). Do **not** use `http://localhost:5173` here; that bakes wrong links into the bundle and confirmation emails can point at localhost. You may omit this secret: the app falls back to `window.location.origin` at runtime, and also corrects localhost env when the site is opened from a non-local host.
- `NEXT_PUBLIC_SITE_URL` — same value as `VITE_SITE_URL` if you set it (optional compatibility alias)

For GitHub Pages with `base: '/MashHub/'`, the auth callback URL used in emails is:

- `https://<owner>.github.io/MashHub/auth/callback`

**3. Supabase Dashboard (hosted project)** — **Authentication → URL Configuration** (required so email confirmation and magic links are accepted):

- **Site URL**: set to your live app root, e.g. `https://<owner>.github.io/MashHub` (match how users open the app).
- **Redirect URLs**: add the exact callback URL above (`https://<owner>.github.io/MashHub/auth/callback`). Also keep local dev URLs if you use them, e.g. `http://localhost:5173/MashHub/auth/callback` and `http://127.0.0.1:5173/MashHub/auth/callback`.

If Site URL or redirect allow-list is wrong, Supabase may reject `emailRedirectTo` or fall back to an old localhost Site URL, and links in emails will not land on your deployed app.

**4. Deploy:** Push to `main`. The workflow `.github/workflows/pages.yml` builds, uploads `dist`, and deploys. Check the **Actions** tab for status.

---

## Optional: deploy.bat (branch-based)

If you use **Deploy from a branch** instead of Actions, run from the repo root:

```bat
.\deploy.bat
```

Then set **Settings > Pages** to **Source**: Deploy from a branch, **Branch**: `gh-pages`, **Folder**: `/ (root)`.

The script builds, pushes `main`, then updates and pushes the `gh-pages` branch with the contents of `dist`.

## App URL

GitHub Pages builds set `VITE_BASE_PATH=/MashHub/` in `.github/workflows/pages.yml`. The app is served at:

`https://<owner>.github.io/MashHub/`

Example: `https://cosmicmashups.github.io/MashHub/`

## Branch "local"

The `local` branch is a backup of the app before Supabase (CSV + IndexedDB/Dexie only). The deploy script does not merge or push it. Keep your Supabase work on `main`; run `deploy.bat` from `main` when you want to publish.

## After deploy

- GitHub may take 1–2 minutes to update the site.
- If you still see an old version, hard refresh (`Ctrl+Shift+R`) or clear site data; the PWA service worker caches aggressively.
