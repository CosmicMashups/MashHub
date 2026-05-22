import type { BpmBucket } from '../constants/bpmBuckets';
import type { SuggestionPaneSong } from '../utils/suggestionPaneSongs';
import type { ProjectWithSections } from '../types';
import { SuggestionBpmSongRow } from './SuggestionBpmSongRow';

export interface SuggestionBpmBucketBlockProps {
  bucket: BpmBucket;
  songs: SuggestionPaneSong[];
  project: ProjectWithSections | null;
  targetSectionId: string | null;
  onAddSong: (projectId: string, songId: string, sectionId: string) => void;
}

export function SuggestionBpmBucketBlock({
  bucket,
  songs,
  project,
  targetSectionId,
  onAddSong,
}: SuggestionBpmBucketBlockProps) {
  return (
    <section
      role="region"
      aria-label={`${bucket.label}, ${songs.length} songs`}
      className="min-w-0 rounded-lg border border-theme-border-default overflow-hidden"
    >
      <div className="sticky top-0 z-[1] bg-theme-surface-elevated border-b border-theme-border-default">
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <h4 className="text-sm font-semibold text-theme-text-primary">{bucket.label}</h4>
          <span className="text-xs text-theme-text-muted tabular-nums">
            {songs.length} {songs.length === 1 ? 'song' : 'songs'}
          </span>
        </div>
        <div className="grid grid-cols-[48px_1fr_auto] gap-1 px-2 pb-1 text-xs text-theme-text-muted uppercase tracking-wide border-t border-theme-border-subtle">
          <span className="text-right tabular-nums">BPM</span>
          <span>Song title</span>
        </div>
      </div>
      <div>
        {songs.map((song) => (
          <SuggestionBpmSongRow
            key={song.id}
            song={song}
            project={project}
            targetSectionId={targetSectionId}
            onAddSong={onAddSong}
          />
        ))}
      </div>
    </section>
  );
}
