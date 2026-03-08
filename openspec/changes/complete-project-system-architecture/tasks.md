# Tasks: Complete Project System Architecture

## 1. Routing and project pages

- [x] 1.1 Add react-router-dom; wire Router in main.tsx/App with routes `/`, `/projects`, `/projects/:projectId`.
- [x] 1.2 Create ProjectsPage: project list; nav to project workspace.
- [x] 1.3 Create ProjectWorkspacePage: load project by id; render Kanban or Megamix, toolbar (Suggest Songs, BPM/Key graphs, Export), Section Settings; replace modal usage.
- [x] 1.4 Replace header "Projects" modal trigger with Link to `/projects`; keep other nav (songs, filters, etc.) working.

## 2. Section Settings UI

- [x] 2.1 Add Section Settings dialog: fields targetBpm, bpmRangeMin, bpmRangeMax, targetKey, keyRangeCamelot (key selector + Camelot distance).
- [x] 2.2 Open from section card menu: "Edit section" / "Section settings"; persist via projectService.updateSection.

## 3. Compatibility score

- [x] 3.1 Ensure project compatibility uses only BPM + key (compatibilityScore / calculateSectionCompatibility); no vocal, year, type, text in section/suggestion scoring.
- [x] 3.2 Smart Section Builder uses this simplified scoring and section constraints when section has targetBpm/targetKey.

## 4. Smart Section Builder per project type

- [x] 4.1 Song Megamix: prioritize BPM continuity and key transitions.
- [x] 4.2 Seasonal: prioritize same season and same origin.
- [x] 4.3 Year-End: prioritize same year.
- [x] 4.4 Other: generic harmonic compatibility.

## 5. BPM Flow Graph

- [x] 5.1 Use section-level BPM (from song sections); one point per song in project order (sections by orderIndex, then songs within section).
- [x] 5.2 Data source: song sections (primary or first section BPM per song in order).

## 6. Key Graph

- [x] 6.1 Use songSections.key; display keys along Camelot wheel; one point per song in project order.
- [x] 6.2 Follow project section and song order.

## 7. Move song to section

- [x] 7.1 Add projectService.moveSongToSection(entryId, targetSectionId): move entry to target section, append orderIndex.
- [x] 7.2 Song card menu: "Move to section" with dropdown of project sections; call service and refresh.

## 8. Locked entry UI

- [x] 8.1 Show lock icon when entry is locked; disable drag for locked entries (SortableSongItem / KanbanSectionCard).
- [x] 8.2 Song menu: "Lock position" / "Unlock position"; call projectService.toggleLock; refresh.

## 9. Suggestion drawer

- [x] 9.1 Ensure drawer is hidden by default; opens only when user clicks "Suggest Songs"; content separate from section lists (no mixing).

## 10. Vocal Phrase Index tooltip

- [x] 10.1 Ensure each phrase displays phrase text and source song in tooltip (e.g. "A-ha - Take On Me").

## 11. Verification

- [x] 11.1 TypeScript passes; routing works; section settings persist; compatibility formula correct; graphs use section-level data; suggestions and lock/move behave correctly.
- [x] 11.2 Update this checklist so all items are marked done.
