# Projects Implementation Guide

This document describes how **projects** are implemented in MashHub: data model, storage, APIs, UI flows, and extension points. Use it as context when fixing, changing, or adding project-related features.

## Research Paper Mapping

To support academic writing, this guide maps directly to your required sections:
- **Introduction**: use `Overview` plus `App-Level Project State` for practical context.
- **Topic Research and Innovation**: use section-first project organization and compatibility-aware project sections.
- **Existing Application Analysis**: use `Known Limitations and Gaps` for baseline analysis.
- **Proposed System Design**: use `Data Model`, `Hooks and State`, and `UI Components`.
- **System Architecture**: use `Frontend Storage`, service methods, and handler wiring across App/components.
- **AI Model Description**: pair this guide with `FUZZY.md` for the fuzzy model details.
- **Testing and Evaluation**: derive integration/E2E scenarios from `UI Components`, `Export`, and section reordering workflows.
- **Conclusion and Future Enhancements**: use `Adding or Changing Features` and `Known Limitations and Gaps`.

For a complete narrative draft with all sections in paper form, see `docs/RESEARCH_PAPER_DRAFT.md`.

---

## 1. Overview

- **Projects** are named containers for organizing songs into sections (e.g., Intro, Main, Outro). Each project has a **type** (`seasonal` | `year-end` | `song-megamix` | `decade` | `other`) that controls behavior and metadata in project creation and workspace flows.
- Each project has **first-class sections** (ProjectSection); each section has a name, orderIndex, and optional target BPM/key (or ranges) used for compatibility scoring.
- Projects have **entries**: each entry links one **song** to one **section** (by sectionId), with orderIndex, locked, and notes.
- Project data operations run through `projectService` with a **Supabase-first + Dexie fallback** strategy via `withFallback`. In local mode, Dexie is the active backend; in Supabase mode, cloud-backed project tables are used.

---

## 2. Data Model

### 2.1 Backend and Storage Paths

Project persistence is implemented in two active paths:
- **Supabase path** (primary when available): `projects`, `project_sections`, `project_entries`.
- **Dexie path** (fallback/offline): mirrored project/section/entry stores in `src/services/database.ts`.

The legacy Node/Prisma backend still exists for song/import routes, but project workflows in the frontend rely on `projectService` (Supabase + fallback), not Express project CRUD routes.

**Project**

| Field      | Type     | Notes                          |
|-----------|----------|---------------------------------|
| id        | String   | PK, VarChar(50)                 |
| name      | String   | VarChar(255)                   |
| createdAt | DateTime | mapped to `created_at`         |
| updatedAt | DateTime | mapped to `updated_at`         |

Note: the current frontend project model includes fields beyond the old minimal schema, including `type`, optional time metadata, and optional `coverImage`.

**ProjectEntry**

| Field       | Type     | Notes                                      |
|------------|----------|--------------------------------------------|
| id         | String   | PK, VarChar(50)                            |
| projectId  | String   | FK to Project, mapped to `project_id`       |
| songId     | String   | FK to Song, mapped to `song_id`            |
| sectionId  | String?  | Optional FK to SongSection, `section_id`   |
| sectionName| String   | Display/logical section name, e.g. "Main"  |
| orderIndex | Int      | Sort order within the project, `order_index` |
| createdAt  | DateTime | `created_at`                                |

Relations:

- `Project` has many `ProjectEntry`.
- `ProjectEntry` belongs to `Project`, `Song`, and optionally `SongSection` (when `sectionId` is set).
- Deleting a project cascades to its entries. Deleting a song cascades its entries. Deleting a section sets `sectionId` to null on entries (SetNull).

The backend **does not expose** project CRUD routes. Projects are only touched during **full import**: `ImportController` clears `project_entries` and `projects` before re-importing songs and sections.

### 2.2 Frontend (TypeScript types)

In `src/types/index.ts`:

```ts
export type ProjectType = 'seasonal' | 'year-end' | 'song-megamix' | 'decade' | 'other';

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  year?: number;
  season?: string;
  yearRangeMin?: number;
  yearRangeMax?: number;
  coverImage?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ProjectSection {
  id: string;
  projectId: string;
  name: string;
  targetBpm?: number;
  bpmRangeMin?: number;
  bpmRangeMax?: number;
  targetKey?: string;
  keyRangeCamelot?: number;
  orderIndex: number;
}

export interface ProjectEntry {
  id: string;
  projectId: string;
  songId: string;
  sectionId: string;
  orderIndex: number;
  locked: boolean;
  notes?: string;
}
```

**Project “with sections”** (used in UI): `ProjectWithSections = Project & { sections: (ProjectSection & { songs: (Song & { entryId, locked, notes })[] })[] }`. Sections are first-class; each has id, name, orderIndex, and optional targetBpm/targetKey/bpmRangeMin/Max/keyRangeCamelot. Entries reference sections via sectionId.

---

## 3. Frontend Storage (IndexedDB / Dexie)

Database class: `src/services/database.ts` (`MashupDatabase`). Project tables remain the local fallback and draft workspace backing store. Current project type set includes `decade` in addition to `seasonal`, `year-end`, `song-megamix`, and `other`.

**Tables:**

- `projects`: `id, name, createdAt, type`
- `projectSections`: `id, projectId, orderIndex`, compound `[projectId+orderIndex]` (stores name, optional targetBpm, bpmRangeMin, bpmRangeMax, targetKey, keyRangeCamelot)
- `projectEntries`: `id, projectId, songId, sectionId, orderIndex`, compound `[projectId+sectionId+orderIndex]`; also locked, notes

**Project service** (`projectService` in the same file):

| Method | Behavior |
|--------|----------|
| `getAll()` | All projects, newest first by `createdAt`. |
| `getById(id)` | Single project by id. |
| `add(project)` | Insert project (type default `'other'`). |
| `update(project)` | Update by id (name, type, etc.). |
| `delete(id)` | Transaction: delete all entries and project sections for project, then project. |
| `getSectionsByProject(projectId)` | All ProjectSection for project, sorted by orderIndex. |
| `addSection(section)` | Add ProjectSection (id generated); returns section id. |
| `updateSection(section)` | Update ProjectSection by id (including targetBpm, targetKey, ranges). |
| `deleteSection(sectionId)` | Delete section and its entries. |
| `reorderSections(projectId, sectionIds)` | Set orderIndex by position in sectionIds. |
| `getEntriesForSection(sectionId)` | All ProjectEntry for that section, sorted by orderIndex. |
| `addSongToSection(projectId, songId, sectionId)` | Append new entry with next orderIndex, locked false, notes ''. |
| `removeEntry(entryId)` | Delete one project entry. |
| `reorderEntriesInSection(sectionId, entryIds)` | Set orderIndex by position in entryIds for that section. |
| `updateEntryNotes(entryId, notes)` | Update notes for entry. |
| `getProjectWithSections(projectId)` | Load project + projectSections + entries, enrich songs, return ProjectWithSections. |
| Legacy/helpers | `removeSongFromProject`, `reorderSongsInSection`, `moveSongToSection`, `updateEntryNotes(projectId, songId, sectionName, notes)` etc. may exist for compatibility; primary flow uses sectionId and entryId. |

---

## 4. Hooks and State

### 4.1 `useProjects` (`src/hooks/useProjects.ts`)

- **State:** `projects`, `loading`, `error`.
- **Load:** On mount calls `projectService.getAll()` and sets `projects`.
- **Actions:**  
  `addProject(name, type?)` (default type `'other'`),  
  `updateProject(project)`, `deleteProject(id)`,  
  `addSection`, … (and project-service-backed handlers used by App for entries/sections).  
  `refresh` (re-run `getAll`).

---

## 5. App-Level Project State and Handlers (`src/App.tsx`)

- **From useProjects:** `projects`, `addProject`, `updateProject`, `deleteProject`.
- **Local state:** `projectsWithSections`: array of `ProjectWithSections`, refreshed when `projects` or data changes.
- **Loading:** `loadProjectsWithSections()` runs `projectService.getProjectWithSections(project.id)` for each project and sets `projectsWithSections`.
- **Refresh:** `refreshProjectsWithSections()` is called after add/remove/reorder/notes/update-project so the project manager and export stay in sync.
- **Workspace save model (important):** in Supabase mode, workspace edits are staged locally (Dexie draft state) and synced to Supabase on explicit Save actions in workspace flow.

**Handlers passed to project manager and modals:**

- `handleCreateProject(name, type?)` → `addProject(name, type ?? 'other')`.
- `handleUpdateProject(project)` → `updateProject(project)` then `refreshProjectsWithSections()` (used by Edit project modal).
- `handleAddSongToProject(projectId, songId, sectionId)` → projectService add entry then refresh.
- `handleRemoveSongFromProject(projectId, songId)` → projectService remove all entries for that song then refresh.
- `handleRemoveEntry(entryId)` / section-scoped remove → projectService then refresh.
- `handleReorderEntries(sectionId, entryIds)` → projectService.reorderEntriesInSection then refresh.
- `handleNotesChange(entryId, notes)` → projectService.updateEntryNotes then refresh.

The UI uses **projectService** directly for section/entry operations and refresh; the hook’s `updateProject` is used for editing project name/type via the Settings modal.

---

## 6. UI Components

### 6.1 Entry points

- **Header “Projects”** button opens **EnhancedProjectManager**.
- **Header “Phrases”** button opens **VocalPhraseIndex** (separate from projects; see file reference).
- **Song list / search results / song details:** “Add to project” opens **AddToProjectModal** with the selected song.

### 6.2 EnhancedProjectManager (`src/components/EnhancedProjectManager.tsx`)

- **Props:**  
  `isOpen`, `onClose`, `projects` (with sections and entries), `allSongs`,  
  `onCreateProject(name, type?)`, `onDeleteProject`, `onUpdateProject(project)` (optional; for Edit project modal),  
  `onAddSongToSection`, `onRemoveSongFromProject`, `onRemoveEntry`, `onReorderEntries`, `onNotesChange`, `onEditSong`, `onRefresh`.
- **Behavior:**
  - Left: list of projects; create new with name input and **project type** selector (Seasonal, Year-End, Song Megamix, Decade, Other); type-specific metadata (year/season/range) is supported in current project flows.
  - **Settings** button: opens **Edit project** modal to change project attributes and refresh.
  - Right: for selected project, **toolbar** with “Suggest Songs” (opens SuggestionDrawer), Compact/Normal toggle (persisted in `localStorage` key `mashhub_compact_mode`), and **ProjectOptionsMenu** (View BPM Flow, View Key Graph, Export Set).
  - **View by project type:**
    - If `project.type === 'song-megamix'`: **MegamixTimeline** (horizontal scroll of song blocks, “+” add slot opens add-song modal).
    - Else: **KanbanBoard** (auto-wrapping grid of section cards).
  - “Add Section”: modal adds a new section (projectSection) and persists it; new section gets a section id.
  - “Add Song” (per section in Kanban, or “+” in Megamix): sets `targetSection`, opens internal “Add Song” modal; user picks a song → `onAddSongToSection(projectId, song.id, sectionId)` then `onRefresh()`.
  - **SuggestionDrawer**: opened by “Suggest Songs”; shows ranked suggestions; “+ Add” adds to the target section and refreshes.
- **Section BPM/Key:** ProjectSection supports targetBpm, targetKey, bpmRangeMin/Max, keyRangeCamelot/keyRange; these are editable in current UI via **SectionSettingsDialog**.
- **Default section names:** e.g. Intro, Main, Outro, Bridge, Chorus, Verse, Break, Drop, Build, Ending (used when creating sections).

### 6.3 KanbanBoard (`src/components/KanbanBoard.tsx`)

- **Props:** `project` (ProjectWithSections), `onRequestAddSong(projectId, sectionId)`, `onAddSong`, `onRemoveEntry`, `onReorderEntries`, `onEditSong`, `onNotesChange`, `compactMode`, `projectType`.
- Responsive grid: `grid-cols-1 sm:2 md:3 lg:4 xl:5`, auto-rows. Each section is a **KanbanSectionCard** (receives full section object with id, name, songs).
- **Drag-and-drop:** Within-section reorder and cross-section drop (remove entry, add to target section, reorder) via @dnd-kit.

### 6.4 KanbanSectionCard (`src/components/KanbanSectionCard.tsx`)

- **Props:** `section` (ProjectSection & { songs }), `projectId`, `onRequestAddSong`, `onRemoveEntry`, `onReorderEntries`, `onEditSong`, `onNotesChange`, `compactMode`.
- Renders section title, **warning icon** (from `getWarningsForSection(songs)`) with tooltip, options menu, “+ Add Song”, and song list. Section settings include target BPM/key and range editing.
- Each song: **SortableSongItem** (desktop drag; mobile up/down buttons) and **ExpandableNotes** (collapsed preview; expand to edit, Save/Cancel; `onNotesChange` persists via projectService).
- **Compact mode:** single-line row per song (title, BPM, key). Normal mode: card with BPM, key, and expandable notes.
- Remove calls `onRemoveEntry(entryId)` (or section-scoped remove as wired from App).

### 6.5 MegamixTimeline (`src/components/MegamixTimeline.tsx`)

- **Props:** `project`, `onRequestAddSong(projectId, sectionId)` (opens add-song modal), `onAddSong`, `onRemoveEntry`, `onReorderEntries`, `onEditSong`, `onNotesChange`.
- Single section (e.g. Main); horizontal scroll of song blocks (title, BPM, compatibility dot vs adjacent). “+” button at end calls `onRequestAddSong(projectId, sectionId)` to open the add-song modal.
- Reorder via `reorderEntriesInSection` when drag-end fires (SortableContext horizontal).

### 6.6 Supporting components

- **ExpandableNotes** (`src/components/ExpandableNotes.tsx`): Collapsed/expanded notes with textarea, Save/Cancel, Framer Motion. Used inside KanbanSectionCard; `onSave` triggers `onNotesChange` from the card.
- **SuggestionDrawer** (`src/components/SuggestionDrawer.tsx`): Slide-in from right; suggestion list from `smartSectionBuilder.getSuggestions`; per-song “+ Add” or “Already Added”.
- **ProjectOptionsMenu** (`src/components/ProjectOptionsMenu.tsx`): Dropdown with View BPM Flow, View Key Graph, Export Set. Opens **BpmFlowGraph** and **KeyGraph** in modals (Recharts line charts; BPM raw, key via Camelot position).
- **ProjectSection** (`src/components/ProjectSection.tsx`): Legacy section block (droppable + sortable list). Still present but **not** used when KanbanBoard is shown; KanbanBoard uses KanbanSectionCard instead.

### 6.7 AddToProjectModal (`src/components/AddToProjectModal.tsx`)

- **Props:** `isOpen`, `onClose`, `song`, `projects` (with sections), `onCreateProject(name, type?)`, `onAddSongToProject`.
- User selects project (searchable list), then section (from that project’s sections). **Project type selector** when creating a new project inline (Seasonal, Year-End, Song Megamix, Other).
- “Add to Project” → `onAddSongToProject(selectedProject.id, song.id, selectedSection.id)` (or equivalent with sectionId).

---

## 7. Export

- **ExportService** (`src/services/exportService.ts`):
  - **exportProjectToXLSX(project with sections, filename?)**: Project info sheet + songs sheet grouped by section (section name, order, title, artist, BPM, key, type).
  - **exportProjectToJSON(project with sections, filename?)**: Serializes project (including `sections`) to JSON; dates to ISO string.

Enhanced Export modal uses `projectsWithSections` so exported projects match what the user sees in the manager.

---

## 8. Switching Songs and Sections (Mental Model)

- **“Switching songs”**: Selecting a different song in the list or in a modal (SongList, SearchResults, SongDetailsModal). There is no single “current project song” state; the project manager shows all sections and their songs.
- **Switching which project is shown:** User clicks a project in the left list of EnhancedProjectManager; `selectedProject` updates; the right panel shows either KanbanBoard or MegamixTimeline plus toolbar (Suggest Songs, Compact, ProjectOptionsMenu).
- **Moving a song between sections:** `projectService.moveSongToSection(projectId, songId, newSectionName)` exists but is **not** wired in the UI. Cross-section drag in Kanban removes from source and adds to target (two operations). Reorder is per-section via `reorderSongsInSection`.

---

## 9. Known Limitations and Gaps

1. **Dual backend complexity**: behavior can diverge between Supabase mode and local fallback if migrations/field mappings are not kept in sync.
2. **Draft/save workflow in Supabase mode**: users must explicitly save staged workspace changes; unsaved edits are guarded but still require clear UX messaging.
3. **Legacy backend mismatch**: Express/Prisma project APIs remain limited compared to active Supabase project path.
4. **Cross-device merge policy**: offline-local edits are not auto-merged into Supabase on reconnect.
5. **Service surface compatibility**: some legacy helper methods remain for backward compatibility and require periodic cleanup.

---

## 10. File Reference

| Purpose | Location |
|---------|----------|
| Prisma schema | `backend/prisma/schema.prisma` |
| Project types | `src/types/index.ts` (Project, ProjectSection, ProjectEntry, ProjectType) |
| DB + projectService | `src/services/database.ts` |
| useProjects | `src/hooks/useProjects.ts` |
| App state & handlers | `src/App.tsx` |
| Project manager UI | `src/components/EnhancedProjectManager.tsx` |
| Kanban grid | `src/components/KanbanBoard.tsx` |
| Section card (Kanban) | `src/components/KanbanSectionCard.tsx` |
| Megamix timeline | `src/components/MegamixTimeline.tsx` |
| Expandable notes | `src/components/ExpandableNotes.tsx` |
| Suggestion drawer | `src/components/SuggestionDrawer.tsx` |
| Project options + BPM/Key graphs | `src/components/ProjectOptionsMenu.tsx`, `BpmFlowGraph.tsx`, `KeyGraph.tsx` |
| Legacy section block | `src/components/ProjectSection.tsx` |
| Add song to project modal | `src/components/AddToProjectModal.tsx` |
| Project export | `src/services/exportService.ts` (exportProjectToXLSX, exportProjectToJSON) |
| Section warnings | `src/utils/sectionWarnings.ts` |
| Smart suggestions | `src/services/smartSectionBuilder.ts` |
| Vocal phrase index (Phrases nav) | `src/components/VocalPhraseIndex.tsx` |
| Backend import (clears projects) | `backend/src/controllers/importController.ts` |

---

## 11. Adding or Changing Features

- **New project fields (e.g. year/season):** Extend `Project` in `src/types/index.ts`, Dexie `projects` table (new schema version + migration), and projectService / useProjects / Edit project modal.
- **Edit project (name/type):** Already implemented; Settings button in EnhancedProjectManager opens Edit project modal; App passes `handleUpdateProject` as `onUpdateProject`.
- **Section target BPM/key or ranges:** Add a section-settings dialog (e.g. from KanbanSectionCard or section menu); call `projectService.updateSection(section)` with updated targetBpm, targetKey, bpmRangeMin/Max, keyRangeCamelot; then refresh project with sections.
- **Remove from one section:** Use `onRemoveEntry(entryId)` (or projectService.removeEntry); KanbanSectionCard and MegamixTimeline pass it from the board; App wires to a handler that calls projectService then refresh.
- **Entry notes:** Use `projectService.updateEntryNotes(entryId, notes)`; KanbanSectionCard passes `onNotesChange` from the board, which App wires to `handleNotesChange`.
- **Move between sections in UI:** Call projectService to update entry’s sectionId (or moveSongToSection if available) from a “Move to section” control; then refresh project with sections.

This document reflects the current project implementation and should give enough context to fix, refactor, or extend project creation and management in the codebase.
