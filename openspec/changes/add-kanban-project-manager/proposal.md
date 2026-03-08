## Why

The current project manager uses a vertical list of sections with no auto-wrapping layout, no song suggestions, no compatibility feedback, and no project-type-specific behavior. Users need a responsive kanban-style board, compatibility scoring (BPM/key) with warnings, a suggestion drawer, expandable per-entry notes, BPM/key flow graphs, vocal phrase indexing, compact mode, and a megamix timeline mode. This change adds those features without replacing the existing project or matching services.

## What Changes

- **Project type field**: Add `type: 'dj-set' | 'mashup' | 'megamix'` to Project (Dexie + types). Default existing projects to `'dj-set'`. Expose type selector on create and in project header.
- **ProjectEntry notes**: Add optional `notes` field to ProjectEntry (Dexie schema version bump + migration). Persist and display via expandable notes in the board.
- **Kanban board**: New auto-wrapping grid (`KanbanBoard`, `KanbanSectionCard`) replacing the current section list in the project manager. Responsive columns (1–5 by breakpoint), no horizontal scroll.
- **Remove-from-section**: Support removing a song from a single section (not entire project). Backend/service: delete only the ProjectEntry for that project + section + song.
- **Suggestion drawer**: Side drawer with "Suggest Songs" trigger; uses new `smartSectionBuilder.getSuggestions()`; shows compatibility score; excludes songs already in target section.
- **Compatibility scoring**: New `compatibilityScore` utility (BPM + Camelot key distance); used by suggestions, section warnings, and flow indicators. No BPM rounding anywhere.
- **Section warnings**: Utility `getWarningsForSection(songs)`; warning icon on section cards when consecutive pairs have bpm-mismatch, key-clash, or duplicate-song.
- **Vocal phrase index**: New Dexie table `vocalPhrases`; service CRUD + search; "Phrases" nav panel with hover tooltips showing source song.
- **Expandable notes**: Inline expand/collapse notes editor on each song card; save persists to ProjectEntry.notes via projectService.
- **BPM flow graph and Key graph**: Recharts line charts in modals; opened from project options menu ("View BPM Flow", "View Key Graph").
- **Project options menu**: Dropdown on project header with View BPM Flow, View Key Graph, Export Set.
- **Compact mode**: Toolbar toggle; persist to localStorage `mashhub_compact_mode`; single-line song rows when enabled.
- **Megamix timeline**: For projects with `type === 'megamix'`, render horizontal timeline (`MegamixTimeline`) instead of Kanban; drag-and-drop blocks; compatibility dots between adjacent slots.

## Impact

- Affected specs: project-management (modified), project-ui (new), compatibility-scoring (new), suggestion-service (new), vocal-phrase-index (new)
- Affected code:
  - `src/services/database.ts` — new Dexie version, `projects.type`, `projectEntries.notes`, `vocalPhrases` table; projectService methods for notes and remove-from-section
  - `src/types/index.ts` — Project.type, ProjectEntry.notes, VocalPhrase, ProjectType
  - `src/components/EnhancedProjectManager.tsx` — replace section list with KanbanBoard or MegamixTimeline; toolbar; SuggestionDrawer; ProjectOptionsMenu; compact mode; pass onNotesChange
  - `src/hooks/useProjects.ts` — addProject(name, type); optional removeSongFromSection(projectId, songId, sectionName)
  - `src/App.tsx` — handleCreateProject(name, type); "Phrases" nav button; onNotesChange handler
  - New: KanbanBoard, KanbanSectionCard, SuggestionDrawer, ExpandableNotes, BpmFlowGraph, KeyGraph, ProjectOptionsMenu, MegamixTimeline, VocalPhraseIndex, smartSectionBuilder, vocalPhraseService, compatibilityScore, sectionWarnings, constants/camelot
