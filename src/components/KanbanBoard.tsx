import { useCallback } from 'react';
import { KanbanSectionCard } from './KanbanSectionCard';
import type { Song } from '../types';
import type { ProjectWithSections, ProjectSection } from '../types';

export type ProjectType = 'seasonal' | 'year-end' | 'song-megamix' | 'decade' | 'other';

export interface KanbanBoardProps {
  project: ProjectWithSections;
  onRequestAddSong: (projectId: string, sectionId: string) => void;
  onAddSong: (projectId: string, songId: string, sectionId: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onReorderEntries: (sectionId: string, entryIds: string[]) => void;
  onEditSong?: (song: Song) => void;
  onViewSong?: (song: Song) => void;
  onNotesChange: (entryId: string, notes: string) => void;
  onUpdateSection?: (section: ProjectSection) => Promise<void>;
  onDeleteSection?: (sectionId: string) => Promise<void>;
  onMoveToSection?: (entryId: string, targetSectionId: string) => void;
  onToggleLock?: (entryId: string) => void;
  compactMode: boolean;
  projectType: ProjectType;
}

export function KanbanBoard({
  project,
  onRequestAddSong,
  onAddSong,
  onRemoveEntry,
  onReorderEntries,
  onEditSong,
  onViewSong,
  onNotesChange,
  onUpdateSection,
  onDeleteSection,
  onMoveToSection,
  onToggleLock,
  compactMode,
}: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto min-w-0">
        {project.sections.map((section) => (
          <KanbanSectionCard
            key={section.id}
            section={section}
            projectId={project.id}
            onRequestAddSong={onRequestAddSong}
            onRemoveEntry={onRemoveEntry}
            onReorderEntries={onReorderEntries}
            onEditSong={onEditSong}
            onViewSong={onViewSong}
            onNotesChange={onNotesChange}
            onUpdateSection={onUpdateSection}
            onDeleteSection={onDeleteSection}
            allSections={project.sections}
            onMoveToSection={onMoveToSection}
            onToggleLock={onToggleLock}
            compactMode={compactMode}
          />
        ))}
    </div>
  );
}
