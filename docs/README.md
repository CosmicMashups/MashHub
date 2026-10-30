# MashHub Documentation Directory

Welcome to the MashHub documentation index. All technical documentation, architectural specifications, runbooks, and research assets are organized systematically by functional domain.

---

## 📁 Directory Structure

```
docs/
├── architecture/         # System architecture, design tokens, data flow & algorithmic specifications
│   ├── design-system.md                 # UI design tokens, color palette, dark mode chassis & typography
│   ├── fuzzy-matching-and-search.md     # Consolidates Fuzzy inference system + Fuse.js search engine
│   ├── hook-safety.md                   # React hooks rules and determinism audit standards
│   ├── performance-optimization.md      # Large dataset loading, batching & IndexedDB optimizations
│   └── supabase-architecture.md         # Supabase data layer, schema, auth, RPCs & fallback strategy
│
├── features/             # Detailed functional specifications & product feature manuals
│   ├── features.md                      # Comprehensive feature list, data model & routing
│   ├── openspec-v2.md                   # OpenSpec v2 prompt and requirements
│   ├── projects-guide.md                # Project workspace, sections & entry management
│   └── spotify-api-feasibility.md       # Spotify API integration feasibility study
│
├── guides/               # Developer operations, setup manuals & workflows
│   ├── agents.md                        # AI agent instructions & OpenSpec workflow reference
│   ├── deploy.md                        # Vercel & GitHub Pages deployment guide
│   ├── python-venv.md                   # Python virtual environment setup on Windows
│   └── upsert-data.md                   # CSV batch synchronization to Supabase
│
├── troubleshooting/      # Diagnoses, post-mortems & resolution runbooks
│   ├── fix-sections-display-bug.md      # Post-mortem & fix for song sections display bug
│   └── supabase-troubleshooting.md      # Consolidates API key guides, connection diagnostics & RLS fixes
│
└── research/             # Academic write-ups, original project genesis & portfolio overviews
    ├── initial-prompt.txt               # Original project requirements prompt
    ├── linkedin-overview.md             # Professional executive project summary
    └── research-paper-draft.md          # Academic research paper draft on fuzzy musical inference
```

---

## 📑 Core Documentation Map

### Architecture & Engine
- **[Fuzzy Matching & Search](architecture/fuzzy-matching-and-search.md)**: Full breakdown of both fuzzy layers: the custom Sugeno-style fuzzy inference engine (BPM, Camelot keys, section compatibility) and the module-level Fuse.js search index.
- **[Supabase Architecture](architecture/supabase-architecture.md)**: Details the cloud backend schema, migrations, RLS, and the dual-backend fallback system (Supabase $\leftrightarrow$ IndexedDB / Dexie).
- **[Design System](architecture/design-system.md)**: Hardware-console aesthetics, dark-theme color tokens, typography, and UI surface standards.
- **[Hook Safety Standards](architecture/hook-safety.md)**: Mandatory rules for hook order, branchless layouts, and zero conditional hook calls.
- **[Performance Optimizations](architecture/performance-optimization.md)**: Batching strategies and main-thread protections for loading 20k+ tracks.

### Features & Product Specs
- **[Full Features Spec](features/features.md)**: Domain rules, quick-match mechanics, and filtering systems.
- **[Projects Guide](features/projects-guide.md)**: Multi-track mashup planning, project section ordering, and kanban entry statuses.
- **[OpenSpec v2](features/openspec-v2.md)**: Comprehensive project specification and non-negotiable engineering rules.
- **[Spotify API Feasibility](features/spotify-api-feasibility.md)**: Architecture analysis for metadata and preview audio integration.

### Guides & Workflows
- **[Deployment](guides/deploy.md)**: Vercel production deployment and auth redirect configuration.
- **[Upsert Data](guides/upsert-data.md)**: Running Python data-sync scripts to populate Supabase tables from CSVs.
- **[Python Virtual Environment](guides/python-venv.md)**: Environment setup for running analysis and sync scripts.
- **[AI Agent Instructions](guides/agents.md)**: Directives for AI code assistants working in the repository.

### Troubleshooting
- **[Supabase Troubleshooting Guide](troubleshooting/supabase-troubleshooting.md)**: Triage steps for offline fallback, API key classification (anon vs. service role), and RLS policy adjustments.
- **[Section Display Bug Fix](troubleshooting/fix-sections-display-bug.md)**: Root cause analysis and resolution for song sections data loading.

### Research & Genesis
- **[Academic Research Paper Draft](research/research-paper-draft.md)**: Formal research paper draft exploring section-level fuzzy decision support for harmonic mashup mixing.
- **[LinkedIn Summary](research/linkedin-overview.md)**: Executive portfolio summary.
- **[Initial Prompt](research/initial-prompt.txt)**: The prompt that started MashHub.
