# Deploying MashHub to GitHub Pages

## Run deploy

From the repo root, run:

```bat
.\deploy.bat
```

The script will:

1. Build the app (`npm run build`)
2. Switch to `main`, pull from origin
3. Stage, commit, and push `main`
4. Create/update the `gh-pages` branch with the built `dist` output and push it

## GitHub Pages settings (required)

In the repo on GitHub: **Settings > Pages**

- **Source**: Deploy from a branch
- **Branch**: `gh-pages` / **Folder**: `/ (root)`

If this is set to `main` or to a `/docs` folder, the site will not serve the built app correctly.

## App URL

With `base: '/MashHub/'` in `vite.config.ts`, the app is served at:

`https://<owner>.github.io/MashHub/`

Example: `https://cosmicmashups.github.io/MashHub/`

## Branch "local"

The `local` branch is a backup of the app before Supabase (CSV + IndexedDB/Dexie only). The deploy script does not merge or push it. Keep your Supabase work on `main`; run `deploy.bat` from `main` when you want to publish.

## After deploy

- GitHub may take 1–2 minutes to update the site.
- If you still see an old version, hard refresh (`Ctrl+Shift+R`) or clear site data; the PWA service worker caches aggressively.
