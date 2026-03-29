# Deploying MashHub to GitHub Pages

## GitHub Actions (recommended)

The repo uses **GitHub Actions** to build and deploy when you push to `main`.

**1. GitHub Pages source:** In the repo on GitHub go to **Settings > Pages**. Set **Source** to **GitHub Actions** (not "Deploy from a branch").

**2. Secrets:** Add repository secrets (**Settings > Secrets and variables > Actions**) so the build can connect to Supabase:
- `VITE_SUPABASE_URL` — from your `.env`
- `VITE_SUPABASE_ANON_KEY` — from your `.env` (public anon key)
- `VITE_SITE_URL` — production app URL (for this repo: `https://<owner>.github.io`)
- `NEXT_PUBLIC_SITE_URL` — same production URL (kept for cross-framework compatibility)

For GitHub Pages with `base: '/MashHub/'`, the app callback path resolves to:

- `https://<owner>.github.io/MashHub/auth/callback`

**3. Deploy:** Push to `main`. The workflow `.github/workflows/pages.yml` builds, uploads `dist`, and deploys. Check the **Actions** tab for status.

---

## Optional: deploy.bat (branch-based)

If you use **Deploy from a branch** instead of Actions, run from the repo root:

```bat
.\deploy.bat
```

Then set **Settings > Pages** to **Source**: Deploy from a branch, **Branch**: `gh-pages`, **Folder**: `/ (root)`.

The script builds, pushes `main`, then updates and pushes the `gh-pages` branch with the contents of `dist`.

## App URL

With `base: '/MashHub/'` in `vite.config.ts`, the app is served at:

`https://<owner>.github.io/MashHub/`

Example: `https://cosmicmashups.github.io/MashHub/`

## Branch "local"

The `local` branch is a backup of the app before Supabase (CSV + IndexedDB/Dexie only). The deploy script does not merge or push it. Keep your Supabase work on `main`; run `deploy.bat` from `main` when you want to publish.

## After deploy

- GitHub may take 1–2 minutes to update the site.
- If you still see an old version, hard refresh (`Ctrl+Shift+R`) or clear site data; the PWA service worker caches aggressively.
