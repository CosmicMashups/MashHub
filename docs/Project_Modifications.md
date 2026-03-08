# MashHub — Cursor AI Implementation Prompt (OpenSpec v2)

> **Usage:** Paste this entire document into Cursor's AI composer, or save it as `OPENSPEC.md` at your project root and reference it with `@OPENSPEC.md`.
> This document supersedes the previous OpenSpec. It incorporates the full architectural refactor **plus** all UI/logic features from the original spec. Read it completely before writing any code.

---

## 0. Meta Instructions

You are implementing a comprehensive refactor and feature expansion of the **MashHub / MashFlow** React + TypeScript application.

**Stack:**
- React 19 + TypeScript + Vite
- Tailwind CSS (dark/light theme throughout)
- Dexie (IndexedDB) for local storage
- Framer Motion for animations
- @dnd-kit/core + @dnd-kit/sortable for drag-and-drop
- Fuse.js for fuzzy search
- Recharts for graphs (install if not present)
- Lucide React for icons
- React Router v6 for routing (install if not present)

**Non-negotiable rules — the AI must never violate these:**

1. **Never snap or round BPM values.** Always display and compute with the raw stored float.
2. **No Excel import.** Projects are created and managed entirely inside MashHub.
3. **Extend, don't replace.** Augment `projectService`, `matchingService`, `searchService`. Delete old code only when explicitly instructed.
4. **All DB changes use a new Dexie version** with an `.upgrade()` migration. Never modify existing version blocks.
5. **All new components export a typed props interface.**
6. **Unit tests** go in `src/__tests__/` for every new service or utility.
7. **Do not implement steps out of order.** The sequence in Section 20 is mandatory. Dependencies must exist before their consumers.

---

## PART 1 — ARCHITECTURAL REFACTORS
### (Complete all of Part 1 before writing any feature code)

---

## 1. Add React Router

Install `react-router-dom` if not already present.

In `src/main.tsx`, wrap the app in `<BrowserRouter>`.

In `src/App.tsx`, define routes:

```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/projects" element={<ProjectsPage />} />
  <Route path="/projects/:projectId" element={<ProjectWorkspacePage />} />
  <Route path="/phrases" element={<VocalPhraseIndexPage />} />
</Routes>
```

Update the main navigation bar to use `<Link>` for all nav items.

---

## 2. Move Projects From Modal to Full Page

**Remove** the `EnhancedProjectManager` dialog trigger from the header. Replace it with a nav link to `/projects`.

**New page:** `src/pages/ProjectsPage.tsx`

Layout:
```
┌─────────────────────────────────────────────────────────┐
│  Projects                              [+ New Project]  │
│─────────────────────────────────────────────────────────│
│  [Project Card]  [Project Card]  [Project Card]         │
│  Name, Type badge, song count, date                     │
└─────────────────────────────────────────────────────────┘
```

Each project card navigates to `/projects/:projectId` on click.

**New page:** `src/pages/ProjectWorkspacePage.tsx`

Layout:
```
┌──────────────────────────────────────────────────────────────┐
│  ← Projects  /  Summer Set 2025          [⊟ Compact] [⋮ ···] │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  [KanbanBoard or MegamixTimeline depending on project.type]  │
│                                                              │
│                              ← [SuggestionDrawer when open]  │
└──────────────────────────────────────────────────────────────┘
```

The `useParams()` hook reads `projectId`. The page loads the full project via `projectService.getProjectWithSections(projectId)`.

---

## 3. Refactor Sections Into First-Class Entities

Sections currently exist only as string keys in a `Record<string, Song[]>`. Replace this with a typed `ProjectSection` object stored in its own DB table.

### 3.1 New Type Definitions (`src/types/index.ts`)

```ts
export type ProjectType = 'seasonal' | 'year-end' | 'song-megamix' | 'other';

export interface ProjectSection {
  id: string;              // nanoid or crypto.randomUUID()
  projectId: string;
  name: string;
  targetBpm?: number;      // raw float, never snapped
  bpmRangeMin?: number;
  bpmRangeMax?: number;
  targetKey?: string;      // e.g. "8A", "Am"
  keyRangeCamelot?: number; // Camelot steps tolerance, default 1
  orderIndex: number;
}

export interface ProjectEntry {
  id: string;
  projectId: string;
  songId: string;
  sectionId: string;       // FK to ProjectSection.id (required; no longer optional string label)
  orderIndex: number;
  locked: boolean;         // NEW — locked songs are skipped by suggestions
  notes?: string;          // NEW — per-entry annotation
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;       // NEW
  createdAt: Date;
  updatedAt?: Date;
}

export interface VocalPhrase {
  id?: number;
  phrase: string;
  songId: string;
}
```

Remove `sectionName: string` from `ProjectEntry`. The section name is now read from `ProjectSection.name`.

### 3.2 DB Migration (`src/services/database.ts`)

Add a new Dexie version (increment from current max):

```ts
.version(N + 1).stores({
  projects:        'id, name, createdAt, type',
  projectSections: 'id, projectId, orderIndex, &[projectId+orderIndex]',
  projectEntries:  'id, projectId, songId, sectionId, orderIndex, locked, &[projectId+sectionId+orderIndex]',
  vocalPhrases:    '++id, phrase, songId',
})
.upgrade(async tx => {
  // 1. Set type = 'other' on all existing projects
  await tx.table('projects').toCollection().modify({ type: 'other' });

  // 2. For each existing projectEntry that has a sectionName string,
  //    create a ProjectSection row and update the entry to use sectionId.
  //    This is a one-time migration; after it runs, sectionName is gone.
  const entries = await tx.table('projectEntries').toArray();
  const sectionMap = new Map<string, string>(); // "projectId|sectionName" → sectionId

  for (const entry of entries) {
    const key = `${entry.projectId}|${entry.sectionName ?? 'Default'}`;
    if (!sectionMap.has(key)) {
      const sectionId = crypto.randomUUID();
      sectionMap.set(key, sectionId);
      await tx.table('projectSections').add({
        id: sectionId,
        projectId: entry.projectId,
        name: entry.sectionName ?? 'Default',
        orderIndex: sectionMap.size,
      });
    }
    await tx.table('projectEntries').update(entry.id, {
      sectionId: sectionMap.get(key),
      locked: false,
      notes: entry.notes ?? '',
    });
  }
});
```

### 3.3 Update `projectService`

Add new methods to the service object in `src/services/database.ts`:

```ts
// Sections
getSectionsByProject(projectId: string): Promise<ProjectSection[]>
addSection(section: Omit<ProjectSection, 'id'>): Promise<string>
updateSection(section: ProjectSection): Promise<void>
deleteSection(sectionId: string): Promise<void>  // also removes all entries in that section
reorderSections(projectId: string, sectionIds: string[]): Promise<void>

// Entries
addSongToSection(projectId: string, songId: string, sectionId: string): Promise<string>
removeSongFromSection(entryId: string): Promise<void>
toggleLock(entryId: string): Promise<void>
updateEntryNotes(entryId: string, notes: string): Promise<void>
reorderEntriesInSection(sectionId: string, entryIds: string[]): Promise<void>
getEntriesForSection(sectionId: string): Promise<ProjectEntry[]>
```

Update `getProjectWithSections` to return:
```ts
Project & { sections: (ProjectSection & { songs: (Song & { entryId: string; locked: boolean; notes: string })[] })[] }
```

Sections sorted by `orderIndex`. Songs within each section sorted by `orderIndex`.

---

## PART 2 — CONSTANTS AND UTILITIES
### (Complete before any component work)

---

## 4. Camelot Wheel Constant (`src/constants/camelot.ts`)

Define the full 24-position Camelot wheel (12A–1A inner ring = minor, 12B–1B outer ring = major).

```ts
// Maps key name variants to Camelot position
export const KEY_TO_CAMELOT: Record<string, { position: number; mode: 'A' | 'B' }> = {
  'Am': { position: 8, mode: 'A' },
  'Em': { position: 9, mode: 'A' },
  'Bm': { position: 10, mode: 'A' },
  'F#m': { position: 11, mode: 'A' },
  'C#m': { position: 12, mode: 'A' },
  'G#m': { position: 1, mode: 'A' },
  'Ebm': { position: 2, mode: 'A' },
  'Bbm': { position: 3, mode: 'A' },
  'Fm':  { position: 4, mode: 'A' },
  'Cm':  { position: 5, mode: 'A' },
  'Gm':  { position: 6, mode: 'A' },
  'Dm':  { position: 7, mode: 'A' },
  'C':   { position: 8, mode: 'B' },
  'G':   { position: 9, mode: 'B' },
  'D':   { position: 10, mode: 'B' },
  'A':   { position: 11, mode: 'B' },
  'E':   { position: 12, mode: 'B' },
  'B':   { position: 1, mode: 'B' },
  'F#':  { position: 2, mode: 'B' },
  'Db':  { position: 3, mode: 'B' },
  'Ab':  { position: 4, mode: 'B' },
  'Eb':  { position: 5, mode: 'B' },
  'Bb':  { position: 6, mode: 'B' },
  'F':   { position: 7, mode: 'B' },
};

// Also accept "8A", "8B" notation directly
export function parseCamelotKey(key: string): { position: number; mode: 'A' | 'B' } | null

export function getCamelotDistance(keyA: string, keyB: string): number
// Returns 0–6 (circular distance on the 12-position wheel, ignoring mode difference)
// Mode difference (A vs B at same position) adds 1 to the distance

export function getCamelotPosition(key: string): number | null
// Returns 1–12 for use as Y-axis value in graphs
```

---

## 5. Compatibility Score (`src/utils/compatibilityScore.ts`)

Two overloaded variants:

### 5.1 Song-vs-Song (used by Suggestion Drawer)

```ts
export function calculateCompatibilityScore(
  songA: Song,
  songB: Song,
  toleranceBpm?: number   // default 10
): CompatibilityResult
```

Formula:
```
bpmDiff  = |songA.primaryBpm - songB.primaryBpm|
bpmScore = max(0, 1 - bpmDiff / toleranceBpm)

camelotDist = getCamelotDistance(songA.primaryKey, songB.primaryKey)
keyScore = camelotDist === 0 ? 1.0
         : camelotDist === 1 ? 0.8
         : camelotDist === 2 ? 0.6
         : 0.2

score = (bpmScore + keyScore) / 2
```

### 5.2 Song-vs-Section (used by cards and warnings)

```ts
export function calculateSectionCompatibility(
  song: Song,
  section: ProjectSection,
  toleranceBpm?: number   // default 10
): CompatibilityResult
```

Formula:
- If `section.targetBpm` is defined: use it as reference BPM, same formula as above.
- If `section.bpmRangeMin` / `section.bpmRangeMax` are defined: `bpmScore = 1.0` if song BPM is inside range, else `max(0, 1 - distance / toleranceBpm)`.
- If no section BPM metadata: `bpmScore = 1.0` (no opinion).
- Same logic for `targetKey` / `keyRangeCamelot`.

```ts
export interface CompatibilityResult {
  score: number;           // 0.0–1.0
  bpmScore: number;
  keyScore: number;
  label: 'High' | 'Medium' | 'Low';
  color: 'green' | 'yellow' | 'red';
  warnings: CompatibilityWarning[];
  percentage: number;      // Math.round(score * 100)
}

export type CompatibilityWarning =
  | 'bpm-mismatch'
  | 'key-clash'
  | 'bpm-outside-range'
  | 'key-outside-range'
  | 'duplicate-song';

// Thresholds
// score >= 0.7  → High / green
// score >= 0.4  → Medium / yellow
// else          → Low / red
```

---

## 6. Section Warnings (`src/utils/sectionWarnings.ts`)

```ts
export interface SectionWarning {
  type: CompatibilityWarning;
  label: string;
  songIds: [string, string];
}

export function getWarningsForSection(
  songs: (Song & { entryId: string; locked: boolean })[],
  section: ProjectSection
): SectionWarning[]
```

Logic:
1. For each song, call `calculateSectionCompatibility(song, section)` and collect `bpm-outside-range` / `key-outside-range` warnings.
2. For consecutive song pairs, call `calculateCompatibilityScore(songA, songB)` and collect `bpm-mismatch` / `key-clash`.
3. Scan for duplicate `song.id` across the entire section and emit `duplicate-song`.

---

## PART 3 — UI COMPONENTS

---

## 7. Section Parameter Dialog (`src/components/SectionParamsDialog.tsx`)

Props:
```ts
interface SectionParamsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: ProjectSection;
  onSave: (updated: ProjectSection) => void;
}
```

Form fields:
```
Section Name:   [____________]

Target BPM:     [______]   (raw float input, no rounding)
BPM Tolerance:  ± [___] BPM

Target Key:     [dropdown — all Camelot keys]
Key Range:      ± [_] Camelot steps
```

On save: call `projectService.updateSection(updated)` then `onSave(updated)`.

Trigger: gear icon `⚙` on each section card header.

---

## 8. Expandable Notes Editor (`src/components/ExpandableNotes.tsx`)

```ts
interface ExpandableNotesProps {
  initialValue: string;
  onSave: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

States:
- **Collapsed:** `Notes: Crowd warmup ▸` — click anywhere to expand.
- **Expanded:** `<textarea>` (auto-resize via `field-sizing: content`), `[Save]` `[Cancel]` buttons.

Framer Motion `AnimatePresence` for expand/collapse. Locked entries pass `disabled={true}` and show a `🔒` icon instead of the edit affordance.

---

## 9. Auto-Wrapping Kanban Board (`src/components/KanbanBoard.tsx`)

```ts
interface KanbanBoardProps {
  project: ProjectWithSections;
  allSongs: Song[];
  onAddSong: (projectId: string, songId: string, sectionId: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onReorderEntries: (sectionId: string, entryIds: string[]) => void;
  onReorderSections: (projectId: string, sectionIds: string[]) => void;
  onAddSection: (name: string) => void;
  onUpdateSection: (section: ProjectSection) => void;
  onDeleteSection: (sectionId: string) => void;
  onToggleLock: (entryId: string) => void;
  onNotesChange: (entryId: string, notes: string) => void;
  onEditSong: (song: Song) => void;
  compactMode: boolean;
}
```

Grid layout:
```
grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-auto
```

Sections are `DndContext` droppables. Songs within sections are `SortableContext` sortables.

A `[+ Add Section]` button appended after all cards opens a name-input popover.

---

## 10. Kanban Section Card (`src/components/KanbanSectionCard.tsx`)

**Normal mode:**
```
┌────────────────────────────┐
│ Intro              ⚠  ⚙  ⋮ │  ← name | warnings | params | menu
│────────────────────────────│
│ 🟢 Night Drive             │  ← compatibility color dot
│    BPM: 127.6   Key: Am    │
│    Notes: Crowd warmup ▸   │  ← ExpandableNotes
│    🔓                      │  ← lock toggle
├────────────────────────────┤
│ [+ Add Song]               │
└────────────────────────────┘
```

**Compact mode** (when `compactMode === true`):
```
Intro | Night Drive | 127.6 | Am | 🟢 | 🔓
```
Each song is a single `<li>`. Warning icon `⚠` still shown in section header.

**Compatibility dot:** Color from `calculateSectionCompatibility(song, section).color`. No text score on the card itself — color only.

**Warning icon `⚠`:** Shown in header if `getWarningsForSection(songs, section).length > 0`. On hover, tooltip lists each warning message.

**Lock icon:** `🔓` (unlocked) or `🔒` (locked). Clicking calls `onToggleLock(entry.entryId)`. Locked songs show a subtle opacity change.

**Options menu `⋮`:** Contains: Edit Section Params, Delete Section, Collapse/Expand.

---

## 11. Suggestion Drawer (`src/components/SuggestionDrawer.tsx`)

```ts
interface SuggestionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetSectionId: string | null;
  project: ProjectWithSections;
  allSongs: Song[];
  onAddSong: (projectId: string, songId: string, sectionId: string) => void;
}
```

Triggered by `[✦ Suggest Songs]` button in the workspace toolbar. When a section card is focused/selected, `targetSectionId` is set automatically to that section.

Renders as a Framer Motion drawer sliding from the right (`x: '100%' → 0`), `w-80`, full viewport height, `z-50`.

Each suggestion card:
```
Song Title — Artist
BPM: 127.6   Key: Am
Compatibility: 86%          ← numeric % here (suggestion context only)
[🟢 High]  [+ Add]
```

Songs already in the project: disabled `[Already Added]` badge.
Locked songs: not excluded from suggestions (locked only protects from *removal*).

Suggestions sourced from `smartSectionBuilder.getSuggestions(...)` — see Section 15.

---

## 12. Megamix Timeline (`src/components/MegamixTimeline.tsx`)

Rendered instead of `KanbanBoard` when `project.type === 'song-megamix'`.

```ts
interface MegamixTimelineProps {
  project: ProjectWithSections;
  allSongs: Song[];
  onAddSong: (projectId: string, songId: string, sectionId: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onReorderEntries: (sectionId: string, entryIds: string[]) => void;
  onToggleLock: (entryId: string) => void;
  onEditSong: (song: Song) => void;
}
```

Layout: horizontally scrollable row of blocks, one block per song entry across all sections in order.

```
| Intro | Song1 | Song2 | ··· | Song47 | Outro |
```

Each block `w-28 h-20 flex-shrink-0`:
- Song title (truncated, 2 lines max)
- BPM (raw)
- Section label in smaller text
- Compatibility dot (color) vs adjacent block using `calculateCompatibilityScore`
- `🔒` indicator if locked

Drag-and-drop to reorder horizontally (within the same section's entries). Cross-section move is handled by a "Move to section" context menu.

`[+ Add Slot]` button at end of row opens song picker.

---

## 13. Project Options Menu (`src/components/ProjectOptionsMenu.tsx`)

Dropdown `⋮` in the workspace page header. Items:

```
View BPM Flow Graph
View Key Flow Graph
View BPM Distribution
View Key Wheel
──────────────────
Export as PDF
Export as CSV
Export as JSON
──────────────────
Edit Project Settings
```

Each "View" item opens the corresponding modal (Sections 16–19). Each "Export" item calls the export service (Section 21).

---

## PART 4 — VISUALIZATIONS

---

## 14. BPM Flow Graph (`src/components/BpmFlowGraph.tsx`)

Opens in a modal dialog (`max-w-3xl`).

Data: For each section in `orderIndex` order, compute reference BPM:
- If `section.targetBpm` is defined → use it.
- Else → average `primaryBpm` of all songs in the section (raw, no rounding).
- Empty sections with no targetBpm → skip (show gap in line).

Recharts `LineChart`:
- X-axis: section names (tick angle −30° if > 6 sections)
- Y-axis: BPM value, domain `[min − 5, max + 5]`
- `<Line type="monotone">` with dots
- Tooltip: `"Section — BPM: 127.6"`
- Reference area highlighting sections outside ±8 BPM of the previous section (indicates large energy jump)

---

## 15. Key Flow Graph (`src/components/KeyGraph.tsx`)

Opens in a modal dialog.

Data: For each section in order:
- If `section.targetKey` → use it.
- Else → most common `primaryKey` among songs in the section.
- Map key to Camelot position (1–12) via `getCamelotPosition`.

Recharts `LineChart`:
- X-axis: section names
- Y-axis: 1–12 (Camelot position), custom tick formatter showing key names
- Tooltip: `"Section — Key: Am (8A)"`
- Color segments: green for adjacent steps (distance ≤ 1), yellow for 2 steps, red for 3+

---

## 16. BPM Distribution (`src/components/BpmDistribution.tsx`)

Opens in a modal dialog.

Data: All songs across all sections. Group into BPM buckets of width 2 (e.g. 126–128, 128–130).

Recharts `BarChart` (histogram):
- X-axis: BPM range labels
- Y-axis: count of songs
- Bars colored by bucket's distance from median BPM (gradient green → yellow → red)
- Tooltip: `"BPM 126–128: 4 songs"`

---

## 17. Key Wheel Visualization (`src/components/KeyWheelViz.tsx`)

Opens in a modal dialog.

Render a Camelot wheel SVG (24 segments: 12 inner minor + 12 outer major).

- Each segment labeled with Camelot notation (1A–12A, 1B–12B) and key name.
- Segments containing at least one song in the project are **highlighted** (filled with `bg-blue-500` equivalent).
- Dominant key (most songs) highlighted with a stronger color.
- Hovering a segment shows a tooltip: key name + list of songs at that position.

Implement as a pure SVG component using polar geometry. No external chart library needed.

```ts
interface KeyWheelVizProps {
  songs: Song[];
}
```

Helper: `getCamelotSegmentCounts(songs: Song[]): Map<string, Song[]>` — groups songs by their Camelot key string (e.g. `"8A"`).

---

## PART 5 — SERVICES

---

## 18. Smart Section Builder (`src/services/smartSectionBuilder.ts`)

```ts
export interface SuggestionResult {
  song: Song;
  compatibilityScore: number;
  bpmScore: number;
  keyScore: number;
  percentage: number;
  label: 'High' | 'Medium' | 'Low';
  reasons: string[];
}

export const smartSectionBuilder = {
  getSuggestions(
    project: ProjectWithSections,
    targetSectionId: string | null,
    allSongs: Song[],
    limit?: number       // default 20
  ): SuggestionResult[]
}
```

**Candidate pool:** All songs NOT already in `targetSection` (by `songId`). Locked songs in other sections are NOT excluded from suggestions.

**Scoring strategy — driven by `project.type`:**

| Type | Strategy |
|---|---|
| `seasonal` | Score song-vs-section using `calculateSectionCompatibility`. Sort by score desc. |
| `year-end` | Same as seasonal, additionally boost songs with matching `year` or `season` metadata. |
| `song-megamix` | Apply usage-frequency penalty: songs already used in the project score × 0.5. Prefer unused songs. Score using section metadata if available, else song-vs-last-song. |
| `other` | Score song-vs-section. No additional heuristics. |

**Reference song for song-vs-song fallback:** Last song in the target section by `orderIndex`. If section is empty, use any song in the project with the highest frequency at a compatible BPM.

**Reason strings** (human-readable):
- `"BPM 127.6 within ±4 of target 126"`
- `"Key Am (8A) — 1 Camelot step from section key"`
- `"Already used 2× in project"` (megamix penalty)

---

## 19. Vocal Phrase Service (`src/services/vocalPhraseService.ts`)

```ts
export const vocalPhraseService = {
  getAll(): Promise<VocalPhrase[]>
  add(phrase: string, songId: string): Promise<number>
  delete(id: number): Promise<void>
  getPhrasesForSong(songId: string): Promise<VocalPhrase[]>
  search(query: string): Promise<VocalPhrase[]>  // case-insensitive includes
}
```

---

## 20. Vocal Phrase Index Page (`src/pages/VocalPhraseIndexPage.tsx`)

Full page at `/phrases`.

```
Vocal Phrase Index                    [+ Add Phrase]  [🔍 Search]
─────────────────────────────────────────────────────────────────
"Tonight we fly"
"Let the bass drop"
"Feel the energy"
```

Each row: phrase text + `[⋮]` menu (Delete). Hover shows tooltip:
```
Source:
Skyline Dreams — DJ Aurora
```

Tooltip fetches song by `songId` from `allSongs` context.

Add Phrase modal: text input + searchable song selector (Fuse.js via existing `searchService`).

---

## 21. Export Service (`src/services/exportService.ts`) — Update

Add three new methods:

```ts
exportProjectToPDF(project: ProjectWithSections, filename?: string): Promise<void>
exportProjectToCSV(project: ProjectWithSections, filename?: string): void
exportProjectToJSON(project: ProjectWithSections, filename?: string): void
```

**PDF format** (use existing PDF skill — `jsPDF` or `pdfmake`):
```
MashHub — [Project Name]
Type: Song Megamix  |  Created: 2025-06-01
────────────────────────────────────────
SECTION: Intro
  1. Night Drive — DJ Aurora  | BPM: 127.6 | Key: Am | 🔒
     Notes: Use echo transition

SECTION: Build Up
  1. Solar Winds — Neon Echo  | BPM: 128.0 | Key: Em
```

**CSV format:** One row per entry. Columns: `section_name, order, title, artist, bpm, key, locked, notes`.

**JSON format:** Full `ProjectWithSections` serialized, dates as ISO strings.

---

## PART 6 — PAGE WIRING

---

## 22. Project Workspace Page (`src/pages/ProjectWorkspacePage.tsx`)

This is the main composition file. Wire all components together.

```tsx
const ProjectWorkspacePage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState<ProjectWithSections | null>(null);
  const [compactMode, setCompactMode] = useLocalStorage('mashhub_compact_mode', false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<
    null | 'bpm-flow' | 'key-flow' | 'bpm-dist' | 'key-wheel'
  >(null);
  const { allSongs } = useSongs();

  // Load project, handle not found
  // Render ProjectOptionsMenu, toolbar (compact toggle, Suggest Songs button)
  // Render KanbanBoard or MegamixTimeline based on project.type
  // Render SuggestionDrawer
  // Render visualization modals
}
```

---

## PART 7 — PROJECT TYPE SYSTEM

---

## 23. Project Types

Replace all previous `'dj-set' | 'mashup' | 'megamix'` references with:

```ts
export type ProjectType = 'seasonal' | 'year-end' | 'song-megamix' | 'other';
```

**Layout selection:**
- `'song-megamix'` → `MegamixTimeline`
- All other types → `KanbanBoard`

**Project creation modal:** Segmented control or radio group:
```
○ Seasonal   ○ Year-End   ○ Song Megamix   ○ Other
```

**Backward compatibility:** The DB migration in Step 3.2 sets all existing projects to `'other'`. This is the safe default.

---

## PART 8 — IMPLEMENTATION ORDER

Complete steps in this exact sequence. Do not jump ahead.

```
1.  src/constants/camelot.ts              (no deps)
2.  src/utils/compatibilityScore.ts       (needs camelot)
3.  src/utils/sectionWarnings.ts          (needs compatibilityScore)
4.  DB migration in database.ts           (ProjectSection table, entries refactor)
5.  Type updates in src/types/index.ts    (ProjectSection, updated ProjectEntry, ProjectType)
6.  projectService updates                (new section methods, getProjectWithSections update)
7.  useProjects hook updates              (addProject accepts type)
8.  React Router setup in main.tsx        (BrowserRouter)
9.  Route definitions in App.tsx          (projects, projects/:id, phrases)
10. src/pages/ProjectsPage.tsx            (project list page)
11. src/services/vocalPhraseService.ts    (new table CRUD)
12. src/services/smartSectionBuilder.ts   (needs types, compatibilityScore)
13. src/components/ExpandableNotes.tsx    (standalone)
14. src/components/SectionParamsDialog.tsx (needs ProjectSection type)
15. src/components/KanbanSectionCard.tsx  (needs warnings, ExpandableNotes, SectionParamsDialog)
16. src/components/KanbanBoard.tsx        (needs KanbanSectionCard, dnd-kit)
17. src/components/MegamixTimeline.tsx    (needs compatibilityScore)
18. src/components/SuggestionDrawer.tsx   (needs smartSectionBuilder)
19. src/components/BpmFlowGraph.tsx       (Recharts)
20. src/components/KeyGraph.tsx           (Recharts, needs camelot)
21. src/components/BpmDistribution.tsx    (Recharts)
22. src/components/KeyWheelViz.tsx        (SVG, needs camelot)
23. src/components/ProjectOptionsMenu.tsx  (needs visualization components)
24. src/services/exportService.ts update  (new PDF/CSV/JSON methods)
25. src/pages/VocalPhraseIndexPage.tsx    (needs vocalPhraseService)
26. src/pages/ProjectWorkspacePage.tsx    (final composition — needs everything)
27. Navigation bar updates               (remove modal trigger, add /projects and /phrases links)
28. src/__tests__/ — unit tests          (see Section 24)
```

---

## PART 9 — TESTING

---

## 24. Required Unit Tests (`src/__tests__/`)

**`camelot.test.ts`**
- `getCamelotDistance('Am', 'Em')` → 1
- `getCamelotDistance('Am', 'Am')` → 0
- `getCamelotDistance('C', 'F#')` → 6
- `getCamelotDistance('Am', 'A')` → 1 (same position, different mode)
- `parseCamelotKey('8A')` → `{ position: 8, mode: 'A' }`

**`compatibilityScore.test.ts`**
- Same key, same BPM → score 1.0, label 'High', color 'green'
- 15 BPM apart (tolerance 10) → `bpmScore = 0`, final ≤ 0.5
- Camelot distance 3 → `keyScore = 0.2`
- Duplicate songId → warning `duplicate-song`
- Song BPM inside section range → `bpmScore = 1.0`
- Song BPM outside section range → `bpm-outside-range` warning

**`sectionWarnings.test.ts`**
- Two consecutive songs 20 BPM apart → `bpm-mismatch`
- Same song twice in section → `duplicate-song`
- All songs inside section BPM range → no warnings
- Song outside section key range → `key-outside-range`

**`smartSectionBuilder.test.ts`**
- `seasonal`: song matching section targetBpm ranked above one that doesn't
- `song-megamix`: already-used song ranked below unused song
- Songs in target section excluded from results
- `limit` param respected

---

## PART 10 — DESIGN SYSTEM

---

## 25. Tokens & Style Guide

Follow the existing Tailwind dark/light pattern throughout.

| Element | Classes |
|---|---|
| Section card | `bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700` |
| Compatibility green | `bg-green-500` / `text-green-600` |
| Compatibility yellow | `bg-yellow-400` / `text-yellow-600` |
| Compatibility red | `bg-red-500` / `text-red-600` |
| Warning icon | `text-amber-500` |
| Locked song row | `opacity-60` |
| Suggestion drawer | `bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700` |
| Compact row | `text-sm font-mono text-gray-700 dark:text-gray-300 py-1 border-b` |
| Graph modals | Existing modal shell with `max-w-3xl` |
| Timeline block | `bg-gray-100 dark:bg-gray-700 rounded-lg border` |

Animations: Framer Motion. Use `initial`, `animate`, `exit` patterns consistent with existing components.

Icons: Lucide React throughout. Key icons to use: `Lock`, `Unlock`, `Settings`, `ChevronRight`, `ChevronDown`, `AlertTriangle`, `TrendingUp`, `Music`, `Sliders`.

---

## 26. Backward Compatibility

- All existing projects migrated to `type: 'other'` — they open in KanbanBoard layout.
- Old `sectionName` strings on entries migrated to real `ProjectSection` rows — existing sections preserved by name.
- No data loss permitted. The upgrade function must be idempotent (safe to run twice).
- If `primaryBpm` or `primaryKey` is null/undefined on a song, all compatibility checks treat it as "no opinion" (score 1.0 for that dimension, no warning).

---

*End of OpenSpec v2. All 26 sections must be implemented before the feature set is considered complete.*
