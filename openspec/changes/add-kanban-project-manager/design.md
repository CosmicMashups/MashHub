## Context

MashHub manages projects (DJ sets, mashups, megamixes) with sections and song entries. The change introduces a kanban-style board, compatibility scoring, suggestions, vocal phrases, and project-type-specific UIs. Existing services (projectService, matchingService, searchService) must be extended, not replaced. BPM values must never be snapped or rounded in the codebase.

## Goals / Non-Goals

- Goals: Auto-wrapping kanban grid; project type (dj-set, mashup, megamix); compatibility score and warnings; suggestion drawer; expandable entry notes; BPM/Key graphs; vocal phrase index; compact mode; megamix timeline.
- Non-Goals: Excel import for projects; replacing the existing matching or search pipelines; rounding BPM for display.

## Decisions

- **Project type and notes in Dexie**: Add `type` to `projects` and `notes` to `projectEntries` in a new schema version with an upgrade that sets `type = 'dj-set'` for all existing projects. No Prisma/backend change required for project CRUD (projects remain frontend-only).
- **Compatibility score**: Single source of truth in `src/utils/compatibilityScore.ts`. Used by smartSectionBuilder, sectionWarnings, and UI (suggestion cards, warning tooltips, timeline dots). BPM score = max(0, 1 - bpmDiff/tolerance). Key score from Camelot wheel distance (constant in `src/constants/camelot.ts`). Final score = (bpmScore + keyScore) / 2; label High/Medium/Low by thresholds.
- **Remove-from-section**: New method `projectService.removeSongFromSection(projectId, songId, sectionName)` that deletes only the ProjectEntry matching those three fields. UI passes sectionName from KanbanSectionCard so "Remove" removes from that section only.
- **Reorder fix**: When implementing reorder, filter entries by `projectId` and `sectionName` before assigning `orderIndex` so the same song in multiple sections is reordered correctly per section.
- **Kanban vs Timeline**: EnhancedProjectManager renders `<KanbanBoard>` when `project.type !== 'megamix'` and `<MegamixTimeline>` when `project.type === 'megamix'`. Both receive the same project-with-sections shape and compatible handlers.
- **Framer Motion and @dnd-kit**: Use existing stack (Framer Motion for drawer/expandable notes; @dnd-kit for sortable cards and cross-section/cross-timeline drops). Cross-section drop = remove from source section + add to target section + reorder target.

## Risks / Trade-offs

- **Schema version**: One Dexie upgrade must add type, notes, and vocalPhrases. If multiple changes land out of order, version numbering must be coordinated.
- **Recharts**: Add as dependency if not present; keep graph modals lazy-loaded to avoid impacting initial bundle.

## Migration Plan

1. Bump Dexie version in `database.ts`; add `type` to projects (upgrade set 'dj-set'), `notes` to projectEntries, `vocalPhrases` table.
2. TypeScript types and projectService/useProjects/App updated to pass type and notes.
3. New components and services added; EnhancedProjectManager wired to KanbanBoard/MegamixTimeline and new toolbar/drawer/menus.

## Open Questions

- None; implementation order and file list are specified in tasks.md and the user's section 15.
