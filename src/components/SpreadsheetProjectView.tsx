import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

import type { Song, ProjectSection, ProjectWithSections } from '../types';

import { SpreadsheetSectionColumn } from './SpreadsheetSectionColumn';



export interface SpreadsheetProjectViewProps {

  project: ProjectWithSections;

  allSongs: Song[];

  compactMode?: boolean;

  onRequestAddSong: (projectId: string, sectionId: string) => void;

  onRemoveEntry: (entryId: string) => void;

  onReorderEntries: (sectionId: string, entryIds: string[]) => void;

  onReorderSections: (sectionIds: string[]) => void;

  onUpdateSection: (section: ProjectSection) => void | Promise<void>;

  onDeleteSection: (sectionId: string) => void | Promise<void>;

  onMoveToSection: (entryId: string, targetSectionId: string) => void;

  onToggleLock: (entryId: string) => void;

  onUpdateEntryMetadata?: (

    entryId: string,

    metadata: { performanceRole?: 'vocal' | 'instrumental' | 'both'; usedInMashup?: boolean }

  ) => void;

  onViewSong?: (song: Song) => void;

  onEditSong?: (song: Song) => void;

}



export function SpreadsheetProjectView({

  project,

  allSongs: _allSongs,

  compactMode: _compactMode,

  onRequestAddSong,

  onRemoveEntry,

  onReorderEntries,

  onReorderSections: _onReorderSections,

  onUpdateSection,

  onDeleteSection,

  onMoveToSection,

  onToggleLock,

  onUpdateEntryMetadata,

  onViewSong,

  onEditSong,

}: SpreadsheetProjectViewProps) {

  const sections = [...project.sections].sort((a, b) => a.orderIndex - b.orderIndex);

  const sectionIds = sections.map((s) => `section-${s.id}`);



  return (

    <div className="min-w-0 px-1">

      <SortableContext items={sectionIds} strategy={rectSortingStrategy}>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto min-w-0">

          {sections.map((section, index) => (

            <div

              key={section.id}

              className="spreadsheet-column-enter min-w-0 w-full"

              style={{ animationDelay: `${index * 40}ms` }}

            >

              <SpreadsheetSectionColumn

                section={section}

                projectId={project.id}

                onRequestAddSong={onRequestAddSong}

                onRemoveEntry={onRemoveEntry}

                onReorderEntries={onReorderEntries}

                onUpdateSection={onUpdateSection}

                onDeleteSection={onDeleteSection}

                onMoveToSection={onMoveToSection}

                onToggleLock={onToggleLock}

                onUpdateEntryMetadata={onUpdateEntryMetadata}

                onViewSong={onViewSong}

                onEditSong={onEditSong}

                otherSections={sections.filter((s) => s.id !== section.id)}

              />

            </div>

          ))}

        </div>

      </SortableContext>

    </div>

  );

}

