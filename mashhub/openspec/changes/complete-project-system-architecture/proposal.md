# Complete MashHub Project System Architecture

## Why

Several architectural pieces of the project system are incomplete or partially implemented: projects open in a modal instead of a dedicated workspace, section compatibility settings have no UI, compatibility scoring may include non-harmonic factors, graphs use song-level rather than section-level metadata, and move/lock/suggestion behaviors need to be completed.

## What Changes

- Convert project manager from modal to full-page routes: `/projects`, `/projects/:projectId`.
- Add Section Settings UI (dialog) to edit targetBpm, bpmRangeMin/Max, targetKey, keyRangeCamelot per project section.
- Restrict project compatibility score to BPM similarity + key distance only (no vocal, year, type, text).
- Smart Section Builder: different prioritization per project type (Song Megamix, Seasonal, Year-End, Other).
- BPM Flow Graph: use section-level BPM from song sections; follow project section and song order.
- Key Graph: use songSections.key; Camelot wheel; follow project order.
- Add "Move to section" menu option on song cards; implement moveSongToSection(entryId, targetSectionId).
- Locked entry UI: lock icon, no drag when locked, Lock/Unlock in menu.
- Suggestion drawer: hidden by default; open only on "Suggest Songs"; keep separate from section lists.
- Vocal Phrase Index: ensure phrase text and source song tooltip (e.g. "A-ha - Take On Me").

## Impact

- Affected specs: project-management, filtering/matching (compatibility), ui-components.
- Affected code: App.tsx (routing, nav), new pages (ProjectsPage, ProjectWorkspacePage), EnhancedProjectManager, KanbanSectionCard, SortableSongItem, BpmFlowGraph, KeyGraph, smartSectionBuilder, compatibilityScore, projectService, VocalPhraseIndex, SuggestionDrawer.
