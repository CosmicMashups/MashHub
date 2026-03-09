# OpenSpec: Supabase Integration & IndexedDB → Supabase Migration for MashHub

---

## CONTEXT

You are working inside **MashHub** (also branded MashFlow) — a music library management system for DJs. The current persistence layer is:

- **Frontend-only IndexedDB (Dexie)** for all project data (projects, projectSections, projectEntries)
- **CSV files** (`anime.csv` / `songs.csv` + `song_sections.csv`) as the source-of-truth for songs and song sections, loaded into IndexedDB on first boot
- **PostgreSQL via Prisma** on the Node backend — partially modeled but **not used** for projects; only songs and song sections are in the backend schema
- **No authentication, no real-time sync, no multi-device support**

The goal is to **replace all IndexedDB and CSV storage with Supabase** as a single backend-of-truth, while preserving all existing features and data flows.

---

## OBJECTIVE

Migrate MashHub's data layer from CSV + IndexedDB (Dexie) to **Supabase** (PostgreSQL + Auth + Realtime + Storage). This includes:

1. Provisioning Supabase project and environment config
2. Defining the full Supabase schema (DDL) covering all entities
3. Migrating the Prisma schema to Supabase-managed migrations
4. Replacing all Dexie service calls with Supabase client calls
5. Replacing CSV import/initial load with Supabase Storage + seeding
6. Adding Supabase Auth (email/password or magic link)
7. Enabling Realtime for collaborative project updates
8. Preserving all existing frontend types, hooks, and component contracts

---

## SPEC

### PHASE 1 — Supabase Project Setup

#### 1.1 Environment Config

Create or update `.env` (and `.env.example`) with:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # backend/scripts only
```

**Rules:**
- `VITE_` prefix on keys used in Vite/React frontend
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed to the frontend bundle
- Add `.env` to `.gitignore` if not already present

#### 1.2 Install Dependencies

```bash
npm install @supabase/supabase-js
```

Remove `dexie` and `dexie-react-hooks` from `package.json` only after all service replacements are complete (do it last).

#### 1.3 Supabase Client Singleton

Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types' // generated after schema push

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

### PHASE 2 — Database Schema (Supabase SQL Migrations)

Create `supabase/migrations/0001_initial_schema.sql`. Use **snake_case** for all column names.

#### 2.1 `songs`

```sql
create table public.songs (
  id          text        primary key,
  title       text        not null,
  artist      text        not null default '',
  type        text        not null default '',
  origin      text        not null default '',
  season      text        not null default '',
  year        integer,
  notes       text        not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_songs_artist on public.songs (artist);
create index idx_songs_type   on public.songs (type);
create index idx_songs_year   on public.songs (year);
```

#### 2.2 `song_sections`

```sql
create table public.song_sections (
  section_id    text        primary key,
  song_id       text        not null references public.songs (id) on delete cascade,
  part          text        not null default '',
  bpm           numeric(6,2),
  key           text        not null default '',
  section_order integer     not null default 1,
  created_at    timestamptz not null default now()
);

create index idx_song_sections_song_id on public.song_sections (song_id);
create index idx_song_sections_bpm     on public.song_sections (bpm);
create index idx_song_sections_key     on public.song_sections (key);
```

#### 2.3 `projects`

```sql
create type project_type as enum ('seasonal', 'year-end', 'song-megamix', 'other');

create table public.projects (
  id          text         primary key default gen_random_uuid()::text,
  user_id     uuid         references auth.users (id) on delete cascade,
  name        text         not null,
  type        project_type not null default 'other',
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

create index idx_projects_user_id    on public.projects (user_id);
create index idx_projects_created_at on public.projects (created_at desc);
```

#### 2.4 `project_sections`

```sql
create table public.project_sections (
  id                text    primary key default gen_random_uuid()::text,
  project_id        text    not null references public.projects (id) on delete cascade,
  name              text    not null,
  order_index       integer not null default 0,
  target_bpm        numeric(6,2),
  bpm_range_min     numeric(6,2),
  bpm_range_max     numeric(6,2),
  target_key        text,
  key_range_camelot integer,
  key_range         text[],
  created_at        timestamptz not null default now()
);

create index idx_project_sections_project_id on public.project_sections (project_id);
create unique index idx_project_sections_order
  on public.project_sections (project_id, order_index);
```

#### 2.5 `project_entries`

```sql
create table public.project_entries (
  id          text    primary key default gen_random_uuid()::text,
  project_id  text    not null references public.projects (id) on delete cascade,
  song_id     text    not null references public.songs (id) on delete cascade,
  section_id  text    references public.project_sections (id) on delete set null,
  order_index integer not null default 0,
  locked      boolean not null default false,
  notes       text    not null default '',
  created_at  timestamptz not null default now()
);

create index idx_project_entries_project_id on public.project_entries (project_id);
create index idx_project_entries_section_id on public.project_entries (section_id);
create index idx_project_entries_song_id    on public.project_entries (song_id);
create unique index idx_project_entries_order
  on public.project_entries (section_id, order_index)
  where section_id is not null;
```

#### 2.6 `updated_at` Trigger

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_songs_updated_at
  before update on public.songs
  for each row execute function public.set_updated_at();

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
```

---

### PHASE 3 — Row Level Security (RLS)

```sql
-- Songs: public read, no anon write
alter table public.songs enable row level security;
alter table public.song_sections enable row level security;

create policy "songs_public_read" on public.songs
  for select using (true);

create policy "song_sections_public_read" on public.song_sections
  for select using (true);

-- Projects: owner only (user_id = auth.uid())
alter table public.projects enable row level security;
alter table public.project_sections enable row level security;
alter table public.project_entries enable row level security;

create policy "projects_owner" on public.projects
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "project_sections_owner" on public.project_sections
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "project_entries_owner" on public.project_entries
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );
```

---

### PHASE 4 — TypeScript Types Generation

After pushing schema:

```bash
npx supabase gen types typescript \
  --project-id <project-ref> \
  --schema public \
  > src/lib/database.types.ts
```

Add as an npm script:

```json
"gen:types": "supabase gen types typescript --project-id <project-ref> --schema public > src/lib/database.types.ts"
```

Re-run after every schema migration. Never hand-edit `database.types.ts`.

---

### PHASE 5 — Service Layer Replacement

Replace `src/services/database.ts` (Dexie) with Supabase-backed services. Preserve all **public method signatures** so hooks and components need zero changes.

#### 5.1 `src/services/songService.ts`

Map Supabase snake_case rows → existing camelCase `Song` TypeScript type inside this file.

```ts
export const songService = {
  getAll(): Promise<Song[]>
  getById(id: string): Promise<Song | null>
  add(song: Omit<Song, 'id'>): Promise<Song>
  update(song: Song): Promise<void>
  delete(id: string): Promise<void>
  getSectionsBySong(songId: string): Promise<SongSection[]>
  addSection(section: SongSection): Promise<void>
  updateSection(section: SongSection): Promise<void>
  deleteSection(sectionId: string): Promise<void>
}
```

- Use `supabase.from('songs').select('*, song_sections(*)')` for enriched fetches
- `primaryBpm` and `primaryKey` remain **computed** from sections where `section_order = 1`; do NOT store as DB columns

#### 5.2 `src/services/projectService.ts`

Preserve all method signatures exactly:

```ts
export const projectService = {
  // Projects
  getAll(): Promise<Project[]>
  getById(id: string): Promise<Project | null>
  add(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project>
  update(project: Project): Promise<void>
  delete(id: string): Promise<void>

  // Project sections
  getSectionsByProject(projectId: string): Promise<ProjectSection[]>
  addSection(section: Omit<ProjectSection, 'id'>): Promise<string>
  updateSection(section: ProjectSection): Promise<void>
  deleteSection(sectionId: string): Promise<void>
  reorderSections(projectId: string, sectionIds: string[]): Promise<void>

  // Project entries
  getEntriesForSection(sectionId: string): Promise<ProjectEntry[]>
  addSongToSection(projectId: string, songId: string, sectionId: string): Promise<void>
  removeEntry(entryId: string): Promise<void>
  reorderEntriesInSection(sectionId: string, entryIds: string[]): Promise<void>
  updateEntryNotes(entryId: string, notes: string): Promise<void>

  // Enriched view
  getProjectWithSections(projectId: string): Promise<ProjectWithSections>
}
```

- `reorderSections` / `reorderEntriesInSection`: use `Promise.all` over `.update()` calls setting `order_index` per array position
- `getProjectWithSections`: project → sections (ordered by `order_index`) → entries per section → enrich each entry's song via `songService`
- Inject `user_id` from `supabase.auth.getUser()` when calling `add()` for a project

#### 5.3 `src/services/searchService.ts`

**No change.** Fuse.js operates on in-memory `Song[]`. Only the array source changes (from Dexie to `songService.getAll()`).

---

### PHASE 6 — Authentication

#### 6.1 Auth Service

Create `src/services/authService.ts`:

```ts
export const authService = {
  signUp(email: string, password: string): Promise<AuthResponse>
  signIn(email: string, password: string): Promise<AuthResponse>
  signInWithMagicLink(email: string): Promise<{ error: AuthError | null }>
  signOut(): Promise<void>
  getSession(): Promise<Session | null>
  onAuthStateChange(cb: (user: User | null) => void): { data: { subscription: Subscription } }
}
```

All methods are thin wrappers over `supabase.auth.*`.

#### 6.2 Auth Context

Create `src/contexts/AuthContext.tsx`:
- Provides `user`, `session`, `loading` via React context
- Subscribes to `supabase.auth.onAuthStateChange` on mount; unsubscribes on unmount
- Exposes `signIn`, `signUp`, `signOut`

#### 6.3 Auth Guard

Create `src/components/AuthGuard.tsx`:
- `loading` → full-page spinner
- No session → `<LoginPage />`
- Session present → `{children}`

Wrap the app root with `<AuthContext.Provider>` and `<AuthGuard>`.

#### 6.4 Login Page

Create `src/components/LoginPage.tsx` with:
- Email + password form
- Toggle to magic link mode
- Error display
- Calls `authService.signIn` or `authService.signInWithMagicLink`

---

### PHASE 7 — CSV → Supabase Storage + Seeding

#### 7.1 Storage Bucket

Create a `song-data` bucket with public read via the Supabase dashboard or CLI:

```bash
supabase storage create song-data --public
```

Upload `songs.csv` and `song_sections.csv` to `song-data`. These become the canonical source files.

#### 7.2 Seed Script

Create `scripts/seed.ts` (run with `tsx`):

```ts
// 1. Read songs.csv + song_sections.csv from disk
// 2. Parse using existing logic from src/services/fileService.ts
// 3. Init supabase client with SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
// 4. Upsert songs in batches of 100:
//    await supabase.from('songs').upsert(batch, { onConflict: 'id' })
// 5. Upsert song_sections in batches of 100:
//    await supabase.from('song_sections').upsert(batch, { onConflict: 'section_id' })
// 6. Log row counts and any errors
// Must be idempotent — running twice does not duplicate data.
```

Add npm script: `"seed": "tsx scripts/seed.ts"`

#### 7.3 Remove Dexie Initial-Load Logic

In `src/App.tsx` and related hooks:
- Remove `loadCsvIfEmpty()`, `checkCsvHash()`, and hash-based change detection
- Replace initial data load with `songService.getAll()`
- Delete `src/services/database.ts` only after full migration is verified

#### 7.4 CSV Import Modal (Admin Write Path)

User-uploaded CSV writes must go through a **Supabase Edge Function** (anon cannot write `songs` per RLS).

Create `supabase/functions/import-songs/index.ts`:
- Accepts `POST` with `{ songs, sections }` JSON body
- Upserts using the service role Supabase client
- Returns `{ inserted: number, errors: string[] }`

Update the Import Modal to `fetch('/functions/v1/import-songs', ...)` instead of writing to Dexie.

---

### PHASE 8 — Realtime Subscriptions

Subscribe to `project_entries` changes while a project workspace is open:

```ts
useEffect(() => {
  if (!projectId) return

  const channel = supabase
    .channel(`project-${projectId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'project_entries',
      filter: `project_id=eq.${projectId}`
    }, () => {
      refreshProjectsWithSections()
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [projectId])
```

**Rules:**
- Subscribe only when project is open; unsubscribe on unmount
- Debounce `refresh` calls at 300ms to avoid thrashing on rapid reorders
- Do not subscribe to `songs`/`song_sections` (read-heavy, rarely changes)

---

### PHASE 9 — Export Service

`src/services/exportService.ts` operates on in-memory `ProjectWithSections` objects — **no changes required**. Data now originates from `projectService.getProjectWithSections()` (Supabase) but the shape is identical to what Dexie returned.

---

### PHASE 10 — Prisma Removal (If Retiring Node Backend)

If the Node backend (`backend/`) is no longer needed:

1. Delete `backend/prisma/`
2. Delete `backend/src/controllers/importController.ts`
3. Remove backend scripts from root `package.json`
4. Update `README.md`

If the backend is kept, do NOT run Prisma migrations against Supabase. Manage all schema via Supabase CLI only.

---

## CONSTRAINTS & RULES

| # | Rule |
|---|------|
| 1 | **Never expose `SUPABASE_SERVICE_ROLE_KEY`** in Vite bundle or any frontend code. Use only in Node scripts or Edge Functions. |
| 2 | **Preserve all existing TypeScript interface shapes** — `Song`, `Project`, `ProjectSection`, `ProjectEntry`, `ProjectWithSections`, `SongSection`. Map DB snake_case → camelCase inside service files only. |
| 3 | **Do not delete `src/services/database.ts` (Dexie)** until all methods are migrated and verified. |
| 4 | **`primaryBpm` and `primaryKey` remain computed** from `song_sections` where `section_order = 1`. No new columns. |
| 5 | **RLS must be enabled** on all tables before production. Never disable RLS. |
| 6 | **Batch upserts at 100 rows max** to avoid Supabase request size limits during seeding. |
| 7 | **Fuse.js search is unchanged.** It receives `Song[]` in memory; only the source of that array changes. |
| 8 | **Auth required** to write projects. `user_id` must be set from `supabase.auth.getUser()` on project insert. |
| 9 | **Supabase CLI** is the sole migration tool. Do not use Prisma migrations for the Supabase DB. |
| 10 | **Re-run `npm run gen:types`** after every schema change. Never hand-edit `database.types.ts`. |

---

## ACCEPTANCE CRITERIA

- [ ] `supabase/migrations/0001_initial_schema.sql` applied via `npx supabase db push`
- [ ] `src/lib/database.types.ts` generated from schema and committed
- [ ] `scripts/seed.ts` seeds songs + song_sections from CSV; running twice is idempotent
- [ ] `src/services/songService.ts` — all CRUD methods work against Supabase; zero Dexie imports
- [ ] `src/services/projectService.ts` — all project/section/entry methods work against Supabase; zero Dexie imports
- [ ] `src/services/database.ts` (Dexie) deleted; `dexie` removed from `package.json`
- [ ] Auth: sign up / sign in / magic link / sign out work; unauthenticated users see login screen
- [ ] Projects are user-scoped: a user cannot read or write another user's projects
- [ ] All existing UI components work without modification
- [ ] CSV import routes through Supabase Edge Function; no service role key in browser
- [ ] Export to XLSX and JSON still works unchanged
- [ ] Realtime subscription reflects entry changes while a project is open
- [ ] `npm run type-check` passes with zero TypeScript errors
- [ ] Existing unit tests pass; Dexie mocks replaced with Supabase client stubs

---

## FILE MAP

| Action | Path |
|--------|------|
| CREATE | `supabase/migrations/0001_initial_schema.sql` |
| CREATE | `supabase/config.toml` (via `npx supabase init`) |
| CREATE | `src/lib/supabase.ts` |
| CREATE | `src/lib/database.types.ts` (generated — do not hand-edit) |
| CREATE | `src/services/songService.ts` |
| CREATE | `src/services/projectService.ts` |
| CREATE | `src/services/authService.ts` |
| CREATE | `src/contexts/AuthContext.tsx` |
| CREATE | `src/components/AuthGuard.tsx` |
| CREATE | `src/components/LoginPage.tsx` |
| CREATE | `scripts/seed.ts` |
| CREATE | `supabase/functions/import-songs/index.ts` |
| MODIFY | `src/App.tsx` — remove Dexie init, add AuthContext wrap, update service imports |
| MODIFY | `src/hooks/useProjects.ts` — swap Dexie → new projectService; add realtime hook |
| MODIFY | `.env` / `.env.example` — add Supabase env vars |
| MODIFY | `package.json` — add `@supabase/supabase-js`, `gen:types`, `seed` scripts; remove `dexie` |
| NO CHANGE | `src/services/exportService.ts` |
| NO CHANGE | `src/services/searchService.ts` |
| NO CHANGE | All components under `src/components/` |
| DELETE | `src/services/database.ts` (after full migration verified) |
| DELETE | `backend/prisma/` (if backend retired) |

---

# AMENDMENT: Supabase Fallback to IndexedDB + CSV with Status Dialog

## Overview

Do **not** remove IndexedDB (Dexie) or the CSV loading logic. Instead, implement a **dual-backend architecture** where every service call attempts Supabase first and automatically falls back to the Dexie/CSV layer if Supabase is unavailable or returns an error. A persistent, dismissible **ConnectionStatusDialog** is shown whenever the system is running in offline/fallback mode.

---

## A1. Connection Health Check

### A1.1 `src/lib/supabaseHealth.ts`

Create a lightweight health probe that runs on app startup and can be re-triggered at any time:

```ts
export type BackendMode = 'supabase' | 'local'

export interface HealthStatus {
  mode: BackendMode
  supabaseAvailable: boolean
  lastChecked: Date
  error?: string
}

const HEALTH_CHECK_TIMEOUT_MS = 5000

/**
 * Pings Supabase with a minimal query (select 1 row from songs, limit 1).
 * Returns true if the query succeeds within the timeout.
 */
export async function checkSupabaseHealth(): Promise<HealthStatus> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS)

    const { error } = await supabase
      .from('songs')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal)

    clearTimeout(timer)

    if (error) throw error

    return { mode: 'supabase', supabaseAvailable: true, lastChecked: new Date() }
  } catch (err) {
    return {
      mode: 'local',
      supabaseAvailable: false,
      lastChecked: new Date(),
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
```

**Rules:**
- The health check must complete within `HEALTH_CHECK_TIMEOUT_MS` (5 s). Use `AbortController` on the Supabase fetch.
- A network error, Supabase auth error, or timeout all count as "unavailable."
- Re-run the health check whenever the user explicitly retries from the dialog.

---

## A2. Backend Context

### A2.1 `src/contexts/BackendContext.tsx`

Create a React context that stores the current `HealthStatus` and exposes a `retry()` function:

```ts
interface BackendContextValue {
  status: HealthStatus
  isLocal: boolean          // true when mode === 'local'
  isChecking: boolean       // true while health check is in flight
  retry: () => Promise<void>
}
```

**Behavior:**
- On mount, call `checkSupabaseHealth()` and store the result.
- While checking, `isChecking = true`.
- After result, if `mode === 'local'`, set `isLocal = true` (triggers dialog render).
- `retry()` re-runs the health check; if Supabase comes back, `isLocal` flips to `false` and the dialog dismisses.
- Expose `status` for the dialog to display the error message and last-checked timestamp.

**Placement:** Wrap the entire app (outside `AuthGuard`) so the mode is known before any data fetch:

```tsx
<BackendContext.Provider>
  <AuthGuard>
    <App />
  </AuthGuard>
</BackendContext.Provider>
```

---

## A3. Resilient Service Layer

Replace direct `supabase.from(...)` calls in `songService.ts` and `projectService.ts` with a **try-Supabase, catch-fallback** wrapper pattern.

### A3.1 `src/lib/withFallback.ts`

```ts
import { getBackendMode } from '../contexts/BackendContext'  // module-level getter

/**
 * Tries the supabaseOp first.
 * If BackendMode is 'local' (already known offline), skips straight to localOp.
 * If supabaseOp throws or returns a Supabase error, marks mode as 'local' and runs localOp.
 */
export async function withFallback<T>(
  supabaseOp: () => Promise<T>,
  localOp: () => Promise<T>
): Promise<T> {
  if (getBackendMode() === 'local') {
    return localOp()
  }
  try {
    return await supabaseOp()
  } catch (err) {
    // Signal the BackendContext that Supabase just failed mid-session
    markSupabaseUnavailable(err)
    return localOp()
  }
}
```

- `getBackendMode()` reads the current mode from a module-level variable updated by `BackendContext`.
- `markSupabaseUnavailable(err)` sets the module-level variable to `'local'` and dispatches a custom DOM event (`supabase:unavailable`) that `BackendContext` listens for, triggering a re-render and showing the dialog.

### A3.2 Applying `withFallback` in `songService.ts`

Every public method wraps both backends:

```ts
export const songService = {
  async getAll(): Promise<Song[]> {
    return withFallback(
      () => fetchSongsFromSupabase(),   // supabase.from('songs').select(...)
      () => dexieDb.songs.toArray().then(mapDexieSongs)
    )
  },

  async add(song): Promise<Song> {
    return withFallback(
      () => insertSongToSupabase(song),
      () => dexieDb.songs.add(mapToLocal(song)).then(() => song)
    )
  },

  // ... same pattern for update, delete, getSectionsBySong, etc.
}
```

### A3.3 Applying `withFallback` in `projectService.ts`

Same pattern — every method has a Supabase path and a Dexie path:

```ts
export const projectService = {
  async getAll(): Promise<Project[]> {
    return withFallback(
      () => supabase.from('projects').select('*').then(mapProjects),
      () => dexieDb.projects.orderBy('createdAt').reverse().toArray()
    )
  },

  async add(project): Promise<Project> {
    return withFallback(
      () => insertProjectToSupabase(project),
      () => dexieDb.projects.add(project).then(() => project)
    )
  },

  // ... same for all 18 methods
}
```

**Rules:**
- The local fallback for `projectService` must call the existing Dexie `projectService` implementation (from `src/services/database.ts`) — do not rewrite it.
- The Supabase path for `projectService` must call the new Supabase implementation from Phase 5 of the main spec.
- Both implementations must return the same TypeScript shapes.

---

## A4. CSV Initial Load Fallback

### A4.1 Startup Sequence in `src/App.tsx`

Replace the simple `songService.getAll()` call with a mode-aware startup:

```ts
useEffect(() => {
  async function initialLoad() {
    const health = await checkSupabaseHealth()         // A1
    setBackendMode(health.mode)                        // updates BackendContext

    if (health.mode === 'supabase') {
      const songs = await songService.getAll()         // Supabase fetch
      setSongs(songs)
    } else {
      // Fallback: load from IndexedDB; if empty, seed from CSV
      const localSongs = await dexieDb.songs.toArray()
      if (localSongs.length === 0) {
        await loadSongsFromCsv()                       // existing CSV load logic
      }
      setSongs(await dexieDb.songs.toArray().then(mapDexieSongs))
    }
  }
  initialLoad()
}, [])
```

**Rules:**
- The CSV load path (`loadSongsFromCsv`) is the existing logic from `src/services/fileService.ts` — do not rewrite it.
- The CSV fallback only runs if IndexedDB is also empty (first-time offline use).
- Subsequent offline sessions serve from IndexedDB directly.

---

## A5. ConnectionStatusDialog Component

### A5.1 `src/components/ConnectionStatusDialog.tsx`

Render this dialog whenever `isLocal === true` in `BackendContext`. It is **not** a blocking modal — the user can dismiss it and continue working in local mode.

**Design requirements:**
- Fixed position: bottom-right corner (does not block main content)
- Warning-style visual: amber/yellow border and icon
- Content:
  - Heading: **"Working Offline"**
  - Body: `"Supabase is unavailable. Changes are being saved locally and will not sync across devices."`
  - Error detail (collapsed/expandable): shows `status.error` and `status.lastChecked`
  - **"Retry Connection"** button: calls `retry()` from `BackendContext`; shows spinner while `isChecking`
  - **"Dismiss"** button: hides the dialog for the current session (does NOT change the backend mode; fallback continues silently)
- If `retry()` succeeds (Supabase comes back), dismiss the dialog automatically and show a brief green **"Reconnected to Supabase"** toast (2 s auto-dismiss)

```tsx
// Pseudocode structure:
function ConnectionStatusDialog() {
  const { isLocal, isChecking, status, retry } = useBackendContext()
  const [dismissed, setDismissed] = useState(false)
  const [showError, setShowError] = useState(false)

  if (!isLocal || dismissed) return null

  return (
    <div role="alert" aria-live="polite" className="fixed bottom-4 right-4 z-50 ...">
      <WarningIcon />
      <h3>Working Offline</h3>
      <p>Supabase is unavailable. Changes are saved locally only.</p>
      <button onClick={() => setShowError(v => !v)}>
        {showError ? 'Hide details' : 'Show details'}
      </button>
      {showError && (
        <pre>{status.error}</pre>
        <small>Last checked: {status.lastChecked.toLocaleTimeString()}</small>
      )}
      <button onClick={retry} disabled={isChecking}>
        {isChecking ? <Spinner /> : 'Retry Connection'}
      </button>
      <button onClick={() => setDismissed(true)}>Dismiss</button>
    </div>
  )
}
```

**Placement:** Render `<ConnectionStatusDialog />` at the root layout level (e.g. in `main.tsx` or `App.tsx`), outside any scroll containers.

---

## A6. Mid-Session Failure Handling

Supabase may become unavailable **after** a successful startup (e.g. network drops). Handle this without crashing the UI:

- When `withFallback` catches a mid-session error, it calls `markSupabaseUnavailable(err)` which:
  1. Sets the module-level `backendMode` to `'local'`
  2. Fires a `supabase:unavailable` CustomEvent on `window`
- `BackendContext` listens for `supabase:unavailable` and updates its state, causing the `ConnectionStatusDialog` to appear
- From this point all subsequent service calls skip the Supabase path (already in `'local'` mode) until `retry()` succeeds

```ts
// In src/lib/withFallback.ts
let _mode: BackendMode = 'supabase'

export function getBackendMode(): BackendMode { return _mode }

export function markSupabaseUnavailable(err: unknown) {
  _mode = 'local'
  window.dispatchEvent(new CustomEvent('supabase:unavailable', { detail: err }))
}

export function markSupabaseAvailable() {
  _mode = 'supabase'
  window.dispatchEvent(new CustomEvent('supabase:available'))
}
```

```ts
// In BackendContext.tsx
useEffect(() => {
  const onUnavailable = (e: Event) => {
    setStatus(prev => ({ ...prev, mode: 'local', supabaseAvailable: false }))
  }
  const onAvailable = () => {
    setStatus(prev => ({ ...prev, mode: 'supabase', supabaseAvailable: true }))
  }
  window.addEventListener('supabase:unavailable', onUnavailable)
  window.addEventListener('supabase:available', onAvailable)
  return () => {
    window.removeEventListener('supabase:unavailable', onUnavailable)
    window.removeEventListener('supabase:available', onAvailable)
  }
}, [])
```

---

## A7. Retry and Reconnection

When the user clicks **"Retry Connection"**:

1. `BackendContext.retry()` calls `checkSupabaseHealth()` with `isChecking = true`
2. If health check succeeds:
   - Call `markSupabaseAvailable()` (flips module-level mode)
   - Update `BackendContext` status to `{ mode: 'supabase', supabaseAvailable: true }`
   - Dismiss dialog automatically
   - Show **"Reconnected to Supabase"** toast (2 s)
   - Trigger a full data refresh: `await refreshAll()` (re-runs `songService.getAll()` and `loadProjectsWithSections()`)
   - **Do not** auto-push local changes made during offline session to Supabase (conflict resolution is out of scope; note this limitation in a comment)
3. If health check fails again:
   - Keep `isLocal = true`
   - Update `status.lastChecked` and `status.error`
   - Show error details in the dialog

---

## A8. Auth Fallback Behavior

When in `'local'` mode, Supabase Auth is unavailable. Handle this gracefully:

- `AuthGuard` checks `isLocal` from `BackendContext` before attempting to verify a session
- If `isLocal === true`, skip the `supabase.auth.getSession()` call and render the app in **"guest local mode"** (no login required)
- Projects created in local mode are stored in Dexie without a `user_id`
- When reconnected, the user must log in; their Dexie projects are not automatically merged with their Supabase account (note this in a `// TODO` comment)

```ts
// In AuthGuard.tsx
function AuthGuard({ children }) {
  const { isLocal } = useBackendContext()
  const { session, loading } = useAuthContext()

  if (isLocal) return <>{children}</>  // bypass auth in offline mode
  if (loading) return <Spinner />
  if (!session) return <LoginPage />
  return <>{children}</>
}
```

---

## A9. Updated Constraints

These additions apply on top of the original 10 constraints:

| # | Rule |
|---|------|
| 11 | **Never delete `src/services/database.ts` (Dexie).** It is the permanent local fallback. Keep `dexie` in `package.json`. |
| 12 | **Never delete CSV load logic** in `src/services/fileService.ts`. It seeds IndexedDB on first offline boot. |
| 13 | **`withFallback` must be used for every public method** in `songService` and `projectService`. No bare `supabase.from(...)` calls outside the service layer. |
| 14 | **The dialog must not block the UI.** The user can dismiss it and work offline indefinitely. |
| 15 | **Do not auto-sync local changes to Supabase on reconnect.** Mark with a `// TODO: conflict resolution` comment. Notify the user in the dialog that offline changes will not sync. |
| 16 | **Auth is bypassed in local mode.** Projects in local mode have no `user_id`; RLS does not apply to Dexie. |
| 17 | **Health check timeout is 5 s.** Do not let a hanging Supabase connection block the app startup. |
| 18 | **Mid-session failures are handled silently** (no thrown errors reaching React components) — `withFallback` catches and reroutes; the dialog appears via the CustomEvent system. |

---

## A10. Updated Acceptance Criteria (Fallback-Specific)

- [ ] App starts and completes initial data load within 6 s whether Supabase is up or down
- [ ] When Supabase is unreachable at startup, `ConnectionStatusDialog` appears automatically without any user action
- [ ] Dialog is visible but non-blocking; the app is fully usable in local mode
- [ ] "Show details" expands the raw error message and last-checked timestamp
- [ ] "Retry Connection" re-runs the health check; spinner shows while in flight
- [ ] If retry succeeds: dialog dismisses, "Reconnected" toast appears, data refreshes from Supabase
- [ ] If retry fails: dialog stays, error and timestamp update
- [ ] "Dismiss" hides the dialog for the session; fallback mode continues silently
- [ ] All CRUD operations (songs, projects, sections, entries) work correctly in local mode via Dexie
- [ ] Mid-session Supabase failure (network drop after startup) triggers the dialog without crashing
- [ ] Auth is bypassed in local mode; user can access projects without logging in
- [ ] `dexie` and CSV load logic remain in `package.json` and codebase permanently
- [ ] No TypeScript errors (`npm run type-check` passes)
- [ ] Unit tests exist for `checkSupabaseHealth` (mock fetch success + failure), `withFallback` (Supabase success, Supabase throws, already-local mode), and `ConnectionStatusDialog` (renders when `isLocal`, hidden when dismissed)

---

## A11. Updated File Map (Fallback Addition)

| Action | Path |
|--------|------|
| CREATE | `src/lib/supabaseHealth.ts` |
| CREATE | `src/lib/withFallback.ts` |
| CREATE | `src/contexts/BackendContext.tsx` |
| CREATE | `src/components/ConnectionStatusDialog.tsx` |
| MODIFY | `src/services/songService.ts` — wrap all methods with `withFallback` |
| MODIFY | `src/services/projectService.ts` — wrap all methods with `withFallback` |
| MODIFY | `src/components/AuthGuard.tsx` — bypass auth when `isLocal` |
| MODIFY | `src/App.tsx` — mode-aware startup sequence; render `<ConnectionStatusDialog />` |
| MODIFY | `main.tsx` — wrap with `<BackendContext.Provider>` outside `<AuthGuard>` |
| NO CHANGE | `src/services/database.ts` (Dexie) — keep permanently as local backend |
| NO CHANGE | `src/services/fileService.ts` — keep CSV load logic permanently |
| NO CHANGE | All UI components — zero changes required |
