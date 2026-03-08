# MashHub

**Intelligent music library management** for DJs, producers, and mashup creators. Discover harmonically compatible songs with section-based matching, fuzzy search, and project organization.

[![GitHub](https://img.shields.io/badge/GitHub-CosmicMashups%2FMashHub-blue)](https://github.com/CosmicMashups/MashHub)

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Development workflow](#development-workflow)
- [Project structure](#project-structure)
- [Architecture notes](#architecture-notes)
- [Testing](#testing)
- [Configuration](#configuration)
- [Documentation](#documentation)
- [Maintenance & contributing](#maintenance--contributing)
- [License](#license)

---

## Overview

MashHub is a **frontend-first** web app. The UI runs entirely in the browser using **IndexedDB** (via Dexie) for persistence. An optional **Node.js + PostgreSQL** backend exists under `backend/` for API-driven import and future server features.

- **Default mode**: No backend required. Clone, `npm install`, `npm run dev` — data lives in the browser.
- **Deployment**: Static build (`npm run build`) can be served from any host; GitHub Pages is supported via `npm run deploy` (see [Configuration](#configuration)).

---

## Features

| Area | Description |
|------|--------------|
| **Harmonic matching** | Section-based BPM/key per song part (Intro, Verse, Chorus, etc.); distance-based key scoring and Quick Match suggestions |
| **Search** | Fuzzy, typo-tolerant search (Fuse.js) over title, artist, type, origin |
| **Filters** | Inline BPM/Key/Year filters; Advanced Filters dialog with part-specific harmonic blocks and Quick Match |
| **Projects** | Kanban (Seasonal/Year-End/Other) and Megamix timeline; sections with optional target BPM/key; Section Settings dialog; drag-and-drop |
| **Data** | Two-file CSV (songs + sections), XLSX, JSON import/export; offline-first IndexedDB |
| **PWA** | Optional service worker and pre-compressed assets (gzip/brotli) via Vite plugins |

---

## Tech stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS, React Router 7 |
| **UI** | Framer Motion, Lucide React, Recharts, @dnd-kit (drag-and-drop) |
| **Data** | Dexie (IndexedDB), Fuse.js (fuzzy search) |
| **Backend** | Node.js, Express, PostgreSQL, Prisma — see [backend/README.md](backend/README.md) |
| **Test** | Vitest (unit), Playwright (E2E), Testing Library |

---

## Prerequisites

- **Node.js** 20 or later  
- **npm** (or yarn)

For the optional backend: **PostgreSQL 15+** and a running instance. See [backend/README.md](backend/README.md).

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/CosmicMashups/MashHub.git
cd MashHub
npm install
```

### 2. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app works with **IndexedDB only**; no backend or environment variables are required.

### 3. (Optional) Backend

To run the Node/PostgreSQL API (e.g. for CSV import or future server features):

```bash
cd backend
cp .env.example .env   # set DATABASE_URL and PORT
npm install
npm run db:migrate
npm run db:generate
npm run dev
```

Full details: [backend/README.md](backend/README.md).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (HMR) |
| `npm run build` | Production build (`dist/`) |
| `npm run preview` | Serve `dist/` locally to verify build |
| `npm run typecheck` | TypeScript check (`tsc -b --noEmit`) |
| `npm run lint` | ESLint (ts/tsx, max-warnings 0) |
| `npm test` | Vitest unit tests (watch in dev) |
| `npm run test:ui` | Vitest browser UI |
| `npm run test:coverage` | Vitest coverage report |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run hook-safety:check` | ESLint rule for React hooks order (see [Development workflow](#development-workflow)) |
| `npm run deploy` | Build and push `dist/` to `gh-pages` branch |

---

## Development workflow

### Before commit or PR

Run the following; CI should mirror these checks:

```bash
npm run lint
npm run typecheck
npm test
```

Optional: enforce React hooks rules (no hooks inside conditions/loops):

```bash
npm run hook-safety:check
```

### Code conventions

- **TypeScript**: Strict mode; avoid `any`; types live under `src/types/`.
- **Constants**: Application-wide magic numbers and strings live in `src/constants/index.ts` (match weights, Fuse threshold, BPM/key tolerances, etc.). Use these instead of inline literals.
- **Hooks**: All hooks at top level, unconditionally. See [docs/HOOK_SAFETY_AUDIT.md](docs/HOOK_SAFETY_AUDIT.md) if you need to refactor hook usage.
- **Naming**: Components PascalCase; hooks `use*`; services and utils camelCase. Files match the primary export (e.g. `matchingService.ts` → `MatchingService`).

### Where to change behavior

| Concern | Location |
|---------|----------|
| Match scoring weights, Fuse/search constants | `src/constants/index.ts` |
| BPM/key matching logic | `src/services/matchingService.ts`, `src/utils/bpmMatching.ts`, `src/utils/keyNormalization.ts` |
| Section name normalization | `src/utils/sectionNormalization.ts` |
| Search (fuzzy text) | `src/services/searchService.ts` |
| IndexedDB schema and CRUD | `src/services/database.ts` |
| Routes | `src/main.tsx` (route list), `App.tsx` and `src/pages/*` |

---

## Project structure

```
mashhub/
├── src/
│   ├── components/       # React UI: modals, filters, lists, dialogs
│   ├── constants/       # Single source of truth for app constants (index.ts)
│   ├── contexts/        # React contexts (e.g. DragDrop)
│   ├── hooks/           # useSongs, useProjects, useTheme, etc.
│   ├── pages/           # Route-level views: ProjectsPage, ProjectWorkspacePage
│   ├── services/        # database (Dexie), matchingService, searchService, export, file
│   ├── types/           # TypeScript interfaces (Song, Project, FilterState, etc.)
│   ├── utils/           # Pure helpers: keyNormalization, bpmMatching, sectionNormalization, filterState
│   ├── App.tsx          # Root layout, main route, modals, filter state
│   ├── App.css          # Global and utility styles
│   ├── main.tsx         # Entry, Router, ErrorBoundary, orphan cleanup
│   └── index.css        # Tailwind entry
├── backend/             # Optional Node/Express/Prisma API (see backend/README.md)
├── docs/                # Feature docs, fuzzy logic, implementation notes
├── public/              # Static assets
├── index.html           # SPA entry
├── vite.config.ts       # Vite + PWA + compression
├── tailwind.config.js   # Tailwind theme and content paths
├── tsconfig.*.json      # TypeScript config
└── package.json
```

---

## Architecture notes

- **Data model**: Songs and **song sections** (part, BPM, key per section) are normalized in IndexedDB. Projects have **project sections** with optional target BPM/key; project entries link songs to those sections. See [docs/FEATURES.md](docs/FEATURES.md) for the full data model.
- **Matching**: The matching layer is a custom fuzzy inference system (fuzzification → rules → inference → defuzzification). Text search uses Fuse.js separately. See [docs/FUZZY_LOGIC_IMPLEMENTATION.md](docs/FUZZY_LOGIC_IMPLEMENTATION.md).
- **State**: Song and project data are loaded via `useSongs` and `useProjects`, which wrap Dexie services. Filter state is structured (`FilterState`) and converted to `MatchCriteria` for the matching service.
- **Routes**: `/` (library + search + filters), `/projects` (project list), `/projects/:projectId` (project workspace). Base path is set for GitHub Pages via `import.meta.env.BASE_URL`.

---

## Testing

- **Unit**: `npm test` runs Vitest. Tests live next to source (e.g. `*.test.ts`, `*.test.tsx`) or under `src/test/`. Use `fake-indexeddb` where IndexedDB is required.
- **E2E**: `npm run test:e2e` runs Playwright. Ensure the app is not already running on the configured port, or use Playwright’s built-in server.
- **Coverage**: `npm run test:coverage` writes reports; inspect for gaps in critical paths (matching, filters, project CRUD).

---

## Configuration

- **Vite**: `vite.config.ts` sets the base URL for GitHub Pages (`base: '/MashHub/'` or similar when deploying to a repo subpath). Adjust `base` for your host.
- **Environment**: Frontend does not require `.env` for normal development. Backend uses `backend/.env` (see [backend/README.md](backend/README.md)).
- **PWA**: Service worker and manifest are generated by `vite-plugin-pwa`; optional. Compression (gzip/brotli) is applied at build time via `vite-plugin-compression`.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/FEATURES.md](docs/FEATURES.md) | Feature list, data model, matching, filters, routes, DB schema |
| [docs/FUZZY_LOGIC_IMPLEMENTATION.md](docs/FUZZY_LOGIC_IMPLEMENTATION.md) | Matching-layer fuzzy logic vs Fuse.js; constants and rules |
| [backend/README.md](backend/README.md) | Backend setup, API, migrations, Prisma |
| [docs/HOOK_SAFETY_AUDIT.md](docs/HOOK_SAFETY_AUDIT.md) | React hooks rules and safe patterns |
| [docs/LINKEDIN_DESCRIPTION.md](docs/LINKEDIN_DESCRIPTION.md) | Project descriptions for portfolio/LinkedIn |

---

## Maintenance & contributing

- **Dependencies**: Keep Node 20+ and lockfile in sync; run `npm run typecheck` and `npm test` after upgrading React, Vite, or Dexie.
- **Schema changes**: IndexedDB schema is versioned in `src/services/database.ts`. Add a new version and an `upgrade` handler; avoid removing or renaming stores without a migration path.
- **Constants**: When adding new tunables (weights, thresholds), add them to `src/constants/index.ts` and document them in [docs/FUZZY_LOGIC_IMPLEMENTATION.md](docs/FUZZY_LOGIC_IMPLEMENTATION.md) if they affect matching or search.
- **New features**: For large changes, consider opening a short design or task list in `docs/` or `openspec/` so others can follow intent and scope.

---

## License

Private. See repository for terms.
