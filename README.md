### MashFlow Monorepo

Unified workspace containing a React application:

- **mashhub**: Vite + React + TypeScript app with Tailwind, Vitest, and Playwright.

Install, run, test, and build from its own directory.

---

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm 9+

On first clone, install dependencies inside each app directory.

---

## Project Structure

```
root/
  mashhub/   # Vite + React + TS app (Tailwind, Vitest, Playwright)
```

Key folders inside `mashhub/src`:
- `components/` UI components and modals
- `hooks/` custom React hooks
- `services/` app services (e.g., IndexedDB via Dexie, search/export utilities)
- `utils/` matching and normalization helpers
- `types/` shared TypeScript types
- `test/` e2e setup and tests (`Playwright`)

---

## mashhub (Vite + React + TypeScript)

Location: `mashhub/`

### Install

```bash
cd mashhub
npm install
```

### Develop

```bash
npm run dev
```

Starts Vite dev server (default `http://localhost:5173`).

### Lint

```bash
npm run lint
```

### Test (Unit/UI)

```bash
npm run test           # Vitest (watch)
npm run test:ui        # Vitest UI
npm run test:coverage  # Coverage
```

### E2E Tests (Playwright)

```bash
# One-time after install
npx playwright install --with-deps

# Run tests
npm run test:e2e
```

### Build & Preview

```bash
npm run build    # Type-check + Vite build
npm run preview  # Preview production build
```

---

## Data & Assets

- `mashhub/public/anime.csv`: sample dataset for search/matching demos.
- `mashhub/src/services/database.ts`: IndexedDB (Dexie) persistence.
- `mashhub/src/services/exportService.ts`: export to Excel/CSV (`exceljs`).

---

## Common Issues

- If ports are in use, set a new port via env (e.g., `PORT=5174 npm run dev` for Vite) or stop the conflicting process.
- On first Playwright run, ensure browsers are installed: `npx playwright install`.

---

## Scripts Overview

Within `mashhub/`:
- `npm run dev`: start Vite dev server
- `npm run build`: type-check and build
- `npm run preview`: preview production build
- `npm run lint`: ESLint
- `npm run test`, `npm run test:ui`, `npm run test:coverage`: Vitest
- `npm run test:e2e`: Playwright e2e

---

## Development Notes

- This repo targets React 19 in both apps. Ensure compatible Node/npm.
- `mashhub` uses Tailwind CSS (see `tailwind.config.js` and `src/index.css`).
- TypeScript config for `mashhub` lives in `tsconfig.*.json` files.

---

## License

Add your preferred license here (e.g., MIT) if distributing.


