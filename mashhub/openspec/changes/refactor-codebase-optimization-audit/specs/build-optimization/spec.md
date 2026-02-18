## ADDED Requirements

### Requirement: Vendor Chunk Splitting
The Vite production build SHALL split vendor dependencies into named chunks so that changes to application code do not invalidate cached vendor bundles in users' browsers.

#### Scenario: Vendor chunks are separate files
- **WHEN** `npm run build` is executed
- **THEN** the `dist/assets/` directory contains separate chunk files named `vendor-react-*.js`, `vendor-dexie-*.js`, `vendor-fuse-*.js`, `vendor-exceljs-*.js`, `vendor-dnd-*.js`, `vendor-motion-*.js`, and `vendor-lucide-*.js`

#### Scenario: App code change does not invalidate vendor chunks
- **WHEN** a single line in `App.tsx` is changed and the app is rebuilt
- **THEN** the hash fingerprints of all `vendor-*.js` chunks remain unchanged

### Requirement: Asset Compression
The Vite build pipeline SHALL generate both gzip (`.gz`) and Brotli (`.br`) compressed versions of all JavaScript and CSS assets.

#### Scenario: Compressed files are generated
- **WHEN** `npm run build` completes
- **THEN** every `.js` and `.css` file in `dist/assets/` has a corresponding `.gz` and `.br` sibling file

#### Scenario: Brotli file is smaller than gzip
- **WHEN** both compressed variants are measured for the main app chunk
- **THEN** the `.br` file size is smaller than or equal to the `.gz` file size

### Requirement: Progressive Web App Support
The application SHALL register a service worker that caches static assets with a `CacheFirst` strategy and CSV data files with a `StaleWhileRevalidate` strategy, enabling offline operation after first load.

#### Scenario: App loads offline after first visit
- **WHEN** the service worker is installed and the network is disabled in DevTools
- **THEN** the application loads from cache and displays the song library without network access

#### Scenario: PWA manifest is valid
- **WHEN** `manifest.webmanifest` is validated against the W3C Web App Manifest schema
- **THEN** no required fields are missing (name, icons, start_url, display)

### Requirement: Pre-Bundled Dexie Dependency
Dexie SHALL be listed in `optimizeDeps.include` in `vite.config.ts` to ensure it is pre-bundled by Vite's dependency optimizer, preventing cold-start delays.

#### Scenario: Dexie is pre-bundled
- **WHEN** the Vite dev server starts
- **THEN** the Dexie module is listed in the `.vite/deps/` pre-bundle cache and does not trigger a browser reload on first use
