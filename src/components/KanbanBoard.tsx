import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { KanbanSectionCard } from './KanbanSectionCard';
import type { Song } from '../types';
import type { ProjectWithSections, ProjectSection } from '../types';
import { GripVertical } from 'lucide-react';

export type ProjectType = 'seasonal' | 'year-end' | 'song-megamix' | 'decade' | 'other';

export interface KanbanBoardProps {
  project: ProjectWithSections;
  onRequestAddSong: (projectId: string, sectionId: string) => void;
  onAddSong: (projectId: string, songId: string, sectionId: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onReorderEntries: (sectionId: string, entryIds: string[]) => void;
  onReorderSections?: (sectionIds: string[]) => void;
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

function SortableSectionWrapper({
  section,
  projectId,
  onRequestAddSong,
  onRemoveEntry,
  onReorderEntries,
  onEditSong,
  onViewSong,
  onNotesChange,
  onUpdateSection,
  onDeleteSection,
  allSections,
  onMoveToSection,
  onToggleLock,
  compactMode,
}: {
  section: ProjectWithSections['sections'][number];
  projectId: string;
  onRequestAddSong: (projectId: string, sectionId: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onReorderEntries: (sectionId: string, entryIds: string[]) => void;
  onEditSong?: (song: Song) => void;
  onViewSong?: (song: Song) => void;
  onNotesChange: (entryId: string, notes: string) => void;
  onUpdateSection?: (section: ProjectSection) => Promise<void>;
  onDeleteSection?: (sectionId: string) => Promise<void>;
  allSections: ProjectWithSections['sections'];
  onMoveToSection?: (entryId: string, targetSectionId: string) => void;
  onToggleLock?: (entryId: string) => void;
  compactMode: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-${section.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 items-start min-w-0 w-full ${isDragging ? 'opacity-60 z-10' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="mt-5 p-1 rounded cursor-grab active:cursor-grabbing text-theme-text-muted hover:text-theme-text-secondary touch-none"
        aria-label="Drag to reorder section"
      >
        <GripVertical size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <KanbanSectionCard
          section={section}
          projectId={projectId}
          onRequestAddSong={onRequestAddSong}
          onRemoveEntry={onRemoveEntry}
          onReorderEntries={onReorderEntries}
          onEditSong={onEditSong}
          onViewSong={onViewSong}
          onNotesChange={onNotesChange}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          allSections={allSections}
          onMoveToSection={onMoveToSection}
          onToggleLock={onToggleLock}
          compactMode={compactMode}
        />
      </div>
    </div>
  );
}

export function KanbanBoard({
  project,
  onRequestAddSong,
  onAddSong: _onAddSong,
  onRemoveEntry,
  onReorderEntries,
  onReorderSections: _onReorderSections,
  onEditSong,
  onViewSong,
  onNotesChange,
  onUpdateSection,
  onDeleteSection,
  onMoveToSection,
  onToggleLock,
  compactMode,
}: KanbanBoardProps) {
  const sectionIds = project.sections.map((s) => `section-${s.id}`);
  return (
    <SortableContext items={sectionIds} strategy={rectSortingStrategy}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto min-w-0">
        {project.sections.map((section) => (
          <SortableSectionWrapper
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
    </SortableContext>
  );
}
