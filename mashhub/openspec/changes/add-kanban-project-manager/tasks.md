## 1. Foundation (no React)

- [x] 1.1 Add `src/constants/camelot.ts` with Camelot wheel mapping and `getCamelotDistance(keyA, keyB)` (and `getCamelotPosition` for Key graph).
- [x] 1.2 Add `src/utils/compatibilityScore.ts`: `calculateCompatibilityScore(songA, songB, toleranceBpm?)`, `CompatibilityResult`, `CompatibilityWarning`; BPM raw, key from Camelot; label and warnings per spec.
- [x] 1.3 Add unit tests in `src/__tests__/compatibilityScore.test.ts` and `src/__tests__/camelot.test.ts`.

## 2. Database and types

- [x] 2.1 Bump Dexie schema version in `src/services/database.ts`: add `type` to projects, `notes` to projectEntries, new table `vocalPhrases` ('++id, phrase, songId'); upgrade sets existing projects `type = 'dj-set'`.
- [x] 2.2 Update `src/types/index.ts`: `Project.type: ProjectType`, `ProjectEntry.notes?: string`, `VocalPhrase` interface.
- [x] 2.3 Extend `projectService`: persist/read `type` and `notes`; add `removeSongFromSection(projectId, songId, sectionName)`; fix `reorderSongsInSection` to filter by sectionName.
- [x] 2.4 Add `src/services/vocalPhraseService.ts` (getAll, add, delete, getPhrasesForSong, searchPhrases) and tests in `src/__tests__/vocalPhraseService.test.ts`.

## 3. Project type and notes plumbing

- [x] 3.1 `useProjects.addProject(name, type)` and ensure project list/create flows pass type; default new projects to 'dj-set' if omitted.
- [x] 3.2 App.tsx: `handleCreateProject(name, type)`; project creation modal: add project type selector (DJ Set / Mashup / Song Megamix).
- [x] 3.3 Project header in EnhancedProjectManager: show and allow changing project type when needed (or only on create per product decision).

## 4. Section warnings and notes UI

- [x] 4.1 Add `src/utils/sectionWarnings.ts`: `getWarningsForSection(songs): SectionWarning[]` using `calculateCompatibilityScore` and duplicate-song check; unit tests in `src/__tests__/sectionWarnings.test.ts`.
- [x] 4.2 Add `src/components/ExpandableNotes.tsx`: collapsed/expanded states, textarea, Save/Cancel, Framer Motion; props `initialValue`, `onSave`, `placeholder`.
- [x] 4.3 Integrate ExpandableNotes into section song cards; onSave call `onNotesChange(projectId, sectionName, songId, value)` which persists via projectService.

## 5. Kanban board and section card

- [x] 5.1 Add `src/components/KanbanSectionCard.tsx`: section name, warning icon (from sectionWarnings) with tooltip, options menu; song list with ExpandableNotes; "[+ Add Song]"; normal vs compact (single-line) mode via prop.
- [x] 5.2 Add `src/components/KanbanBoard.tsx`: grid layout per spec (grid-cols-1 sm:2 md:3 lg:4 xl:5), props for project, onAddSong, onRemoveSong, onReorderSongs, onEditSong, onNotesChange, compactMode, projectType; use @dnd-kit for sortable and cross-section drop (on drop: remove from source section, add to target, reorder target).
- [x] 5.3 Ensure onRemoveSong is called with sectionName so only that section's entry is removed (use removeSongFromSection in handler).

## 6. Smart suggestions and drawer

- [x] 6.1 Add `src/services/smartSectionBuilder.ts`: `getSuggestions(project, targetSectionName, allSongs, projectType, limit?)` returning `SuggestionResult[]`; per-type ranking (dj-set: BPM then key; mashup: key then BPM; megamix: not-yet-used bonus, section variety); exclude songs already in target section; use `calculateCompatibilityScore` against last/first song in section; unit tests in `src/__tests__/smartSectionBuilder.test.ts`.
- [x] 6.2 Add `src/components/SuggestionDrawer.tsx`: isOpen, onClose, targetSection, project, allSongs, projectType, onAddSong; "[Suggest Songs]" trigger; drawer from right (Framer Motion); list of suggestion cards (title, artist, BPM raw, key, compatibility XX%, [+ Add]); disable "Already Added" when song in project; w-80, full height, backdrop on mobile.

## 7. BPM and Key graphs

- [x] 7.1 Add Recharts dependency if missing.
- [x] 7.2 Add `src/components/BpmFlowGraph.tsx`: props project (with sections); data = first song primaryBpm per section (order preserved); Recharts LineChart, X = section names, Y = BPM (raw); tooltip Section: BPM; open in modal.
- [x] 7.3 Add `src/components/KeyGraph.tsx`: same structure; Y = Camelot position from `getCamelotPosition`; tooltip shows key name; modal.
- [x] 7.4 Add `src/components/ProjectOptionsMenu.tsx`: dropdown "[View BPM Flow]" "[View Key Graph]" "[Export Set]"; open BpmFlowGraph/KeyGraph in existing modal pattern.

## 8. Megamix timeline and compact mode

- [x] 8.1 Add `src/components/MegamixTimeline.tsx`: horizontal scroll row of blocks (song slots), w-32 h-20 min; title truncated, BPM raw, compatibility dot vs adjacent; @dnd-kit reorder; "[+]" add slot at end; props project, onAddSong, onRemoveSong, onReorderSongs, onEditSong.
- [x] 8.2 In EnhancedProjectManager: if `project.type === 'megamix'` render MegamixTimeline else KanbanBoard.
- [x] 8.3 Compact mode: useState in EnhancedProjectManager; persist to localStorage `mashhub_compact_mode`; toolbar toggle "[Compact] / [Normal]"; pass compactMode to KanbanBoard and KanbanSectionCard.

## 9. Vocal phrase index

- [x] 9.1 Add `src/components/VocalPhraseIndex.tsx`: isOpen, onClose, allSongs; list of phrases with hover tooltip (source song: title — artist); "[+ Add Phrase]" and "[Search]"; add-phrase modal: phrase input + searchable song selector (Fuse.js); open from nav "Phrases" button.
- [x] 9.2 App.tsx: add "Phrases" nav button; render VocalPhraseIndex modal.

## 10. Wire-up and validation

- [x] 10.1 EnhancedProjectManager: import KanbanBoard, MegamixTimeline, SuggestionDrawer, ProjectOptionsMenu; state for suggestion drawer open, targetSection; pass compactMode, projectType, onNotesChange; ensure refresh after add/remove/reorder/notes.
- [x] 10.2 Run existing project/song tests; add or extend tests for new projectService methods and compatibility/suggestion/warnings per section 16.
