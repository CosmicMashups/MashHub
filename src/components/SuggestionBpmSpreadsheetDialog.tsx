import { useMemo } from 'react';
import { X } from 'lucide-react';
import type { Song, SongSection } from '../types';
import type { ProjectWithSections } from '../types';
import type { MegamixConfig } from '../utils/megamixScoring';
import { resolveSuggestionPaneSongs } from '../utils/suggestionPaneSongs';
import { groupSongsByBpmBucket } from '../utils/groupSongsByBpmBucket';
import { SuggestionBpmBucketBlock } from './SuggestionBpmBucketBlock';

export interface SuggestionBpmSpreadsheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetSectionId: string | null;
  project: ProjectWithSections | null;
  allSongs: Song[];
  onAddSong: (projectId: string, songId: string, sectionId: string) => void;
  megamixConfig?: MegamixConfig;
  instrumentalSong?: Song;
  instrumentalSections?: SongSection[];
}

export function SuggestionBpmSpreadsheetDialog({
  isOpen,
  onClose,
  targetSectionId,
  project,
  allSongs,
  onAddSong,
  megamixConfig,
  instrumentalSong,
  instrumentalSections,
}: SuggestionBpmSpreadsheetDialogProps) {
  const paneSongs = useMemo(
    () =>
      resolveSuggestionPaneSongs({
        project,
        targetSectionId,
        allSongs,
        megamixConfig,
        instrumentalSong,
        instrumentalSections,
        includeAlreadyInProject: true,
      }),
    [
      project,
      targetSectionId,
      allSongs,
      megamixConfig,
      instrumentalSong,
      instrumentalSections,
    ]
  );

  const bucketGroups = useMemo(() => groupSongsByBpmBucket(paneSongs), [paneSongs]);

  const bucketRows = useMemo(() => {
    const rows: (typeof bucketGroups)[] = [];
    for (let i = 0; i < bucketGroups.length; i += 2) {
      rows.push(bucketGroups.slice(i, i + 2));
    }
    return rows;
  }, [bucketGroups]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggestion-bpm-dialog-title"
      onClick={onClose}
    >
      <div
        className="bg-theme-surface-base border border-theme-border-default rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 p-4 border-b border-theme-border-default flex-shrink-0">
          <div>
            <h2
              id="suggestion-bpm-dialog-title"
              className="text-lg font-semibold text-theme-text-primary"
            >
              View Songs
            </h2>
            {paneSongs.length > 0 && (
              <p className="text-xs text-theme-text-muted mt-0.5">
                {paneSongs.length} songs · {bucketGroups.length} BPM ranges
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-theme-text-muted hover:text-theme-text-secondary rounded"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-3">
          {!targetSectionId ? (
            <p className="text-sm text-theme-text-muted text-center py-8">
              Select a section in the project to load suggestions.
            </p>
          ) : bucketGroups.length === 0 ? (
            <p className="text-sm text-theme-text-muted text-center py-8">
              No songs match the current suggestion criteria.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {bucketRows.map((pair, rowIndex) => (
                <div
                  key={pair.map((g) => g.bucket.id).join('-') || rowIndex}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start"
                >
                  {pair.map(({ bucket, songs }) => (
                    <SuggestionBpmBucketBlock
                      key={bucket.id}
                      bucket={bucket}
                      songs={songs}
                      project={project}
                      targetSectionId={targetSectionId}
                      onAddSong={onAddSong}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end p-3 border-t border-theme-border-default flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary text-sm min-h-[40px] px-4">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
