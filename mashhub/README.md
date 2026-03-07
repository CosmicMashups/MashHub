# MashHub

**Intelligent music library management** for DJs, producers, and mashup creators. Discover harmonically compatible songs with section-based matching, fuzzy search, and project organization.

[![GitHub](https://img.shields.io/badge/GitHub-CosmicMashups%2FMashHub-blue)](https://github.com/CosmicMashups/MashHub)

---

## Features

- **Section-based harmonic matching** — BPM and key per song section (Intro, Verse, Chorus, etc.) with distance-based key scoring
- **Quick Match** — Pick a song and get instant compatibility suggestions with affinity scores
- **Advanced filters** — Part-specific BPM/key filters, section normalization, and multi-block filters
- **Fuzzy search** — Typo-tolerant search (Fuse.js) across title, artist, type, origin
- **Project management** — Kanban and Megamix timeline views, sections with optional harmonic constraints, drag-and-drop
- **Import/export** — Two-file CSV (songs + sections), XLSX, JSON; bulk import and export
- **Offline-first** — IndexedDB (Dexie) for local storage; optional Node/PostgreSQL backend
- **PWA-ready** — Optional service worker and compression (Vite plugins)

---

## Tech Stack

| Layer      | Stack |
|-----------|--------|
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS, React Router 7 |
| UI        | Framer Motion, Lucide icons, Recharts, @dnd-kit |
| Data      | Dexie (IndexedDB), Fuse.js (search) |
| Backend   | Node.js, Express, PostgreSQL, Prisma *(see [backend/README.md](backend/README.md))* |
| Test      | Vitest, Playwright, Testing Library |

---

## Prerequisites

- **Node.js** 20+
- **npm** or **yarn**

For the optional backend: **PostgreSQL 15+** (see [backend/README.md](backend/README.md)).

---

## Getting Started

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

Open [http://localhost:5173](http://localhost:5173). The app runs with **IndexedDB only** by default; no backend required.

### 3. (Optional) Backend

To use the Node/PostgreSQL API for import and persistence:

```bash
cd backend
cp .env.example .env   # set DATABASE_URL and PORT
npm run db:migrate
npm run db:generate
npm run dev
```

See [backend/README.md](backend/README.md) for full setup and API details.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:ui` | Vitest UI |
| `npm run test:coverage` | Coverage report |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run deploy` | Build and deploy to GitHub Pages (gh-pages) |

---

## Validation (before commit/PR)

```bash
npm run lint
npm run typecheck
npm test
```

Optional hook-order check:

```bash
npm run hook-safety:check
```

---

## Project Structure

```
mashhub/
├── src/
│   ├── components/     # UI components (modals, filters, lists, etc.)
│   ├── contexts/       # React contexts (e.g. DragDrop)
│   ├── hooks/          # useSongs, useProjects, useTheme, etc.
│   ├── pages/          # ProjectsPage, ProjectWorkspacePage
│   ├── services/       # database (Dexie), matchingService, search, export, file
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # keyNormalization, bpmMatching, sectionNormalization, filterState
│   ├── App.tsx         # Main app and routes
│   └── main.tsx        # Entry, Router, ErrorBoundary
├── backend/            # Optional Node/Express/Prisma API (see backend/README.md)
├── public/
├── FEATURES.md         # Detailed feature documentation
├── LINKEDIN_DESCRIPTION.md
└── package.json
```

---

## Documentation

- **[FEATURES.md](FEATURES.md)** — Full feature list, data model, matching algorithms, and UI behavior
- **[backend/README.md](backend/README.md)** — Backend setup, API endpoints, and database schema
- **[LINKEDIN_DESCRIPTION.md](LINKEDIN_DESCRIPTION.md)** — Project descriptions for LinkedIn/portfolio

---

## License

Private. See repository for terms.
