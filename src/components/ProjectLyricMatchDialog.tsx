import React, { useState, useMemo } from 'react';
import type { ProjectWithSections, Song } from '../types';
import type { LyricMatchGroup } from '../types/lyrics';
import { useLyricIngest } from '../hooks/useLyricIngest';
import { useLyricLinks } from '../hooks/useLyricLinks';
import { lyricsService } from '../services/lyricsService';
import { matchLyrics, type RawLyricLine, type SongMetadataLookup } from '../services/lyricMatchEngine';
import { LyricKindBadge } from './lyrics/LyricKindBadge';
import { projectService } from '../services/projectService';
import {
  X,
  Sparkles,
  Link2,
  FileText,
  Check,
  RefreshCw,
  Layers,
  ChevronRight,
  ChevronDown,
  Clock,
} from 'lucide-react';

interface ProjectLyricMatchDialogProps {
  isOpen: boolean;
  project: ProjectWithSections;
  allSongs: Song[];
  onClose: () => void;
  onRefreshProject?: () => void;
}

type ScopeChoice = 'whole_project' | 'one_section' | 'section_plus_next';

export const ProjectLyricMatchDialog: React.FC<ProjectLyricMatchDialogProps> = ({
  isOpen,
  project,
  allSongs,
  onClose,
  onRefreshProject,
}) => {
  const [scopeChoice, setScopeChoice] = useState<ScopeChoice>('whole_project');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    project.sections[0]?.id || ''
  );

  const { statuses, isProcessing: isIngesting, queueSongs } = useLyricIngest();
  const { links, addLink, removeLink, fetchLinks } = useLyricLinks(project.id);

  const [isMatching, setIsMatching] = useState(false);
  const [matchedGroups, setMatchedGroups] = useState<LyricMatchGroup[]>([]);
  const [addedNoteGroupIds, setAddedNoteGroupIds] = useState<Set<string>>(new Set());

  // Derive songs in scope
  const songsInScope = useMemo<Song[]>(() => {
    let targetSectionIds: string[] = [];

    if (scopeChoice === 'whole_project') {
      targetSectionIds = project.sections.map((s) => s.id);
    } else if (scopeChoice === 'one_section') {
      targetSectionIds = [selectedSectionId];
    } else if (scopeChoice === 'section_plus_next') {
      const idx = project.sections.findIndex((s) => s.id === selectedSectionId);
      if (idx !== -1) {
        targetSectionIds = [project.sections[idx].id];
        if (idx + 1 < project.sections.length) {
          targetSectionIds.push(project.sections[idx + 1].id);
        }
      }
    }

    const songIdSet = new Set<string>();
    for (const sec of project.sections) {
      if (targetSectionIds.includes(sec.id)) {
        for (const entry of sec.entries) {
          songIdSet.add(entry.songId);
        }
      }
    }

    return allSongs.filter((s) => songIdSet.has(s.id));
  }, [project, scopeChoice, selectedSectionId, allSongs]);

  const songMetaMap = useMemo<SongMetadataLookup>(() => {
    const map: SongMetadataLookup = {};
    for (const s of allSongs) {
      map[s.id] = { title: s.title, artist: s.artist };
    }
    return map;
  }, [allSongs]);

  if (!isOpen) return null;

  const handleRunMatch = async () => {
    if (songsInScope.length < 2) return;
    setIsMatching(true);

    try {
      const songIds = songsInScope.map((s) => s.id);
      // Ingest any missing lyrics
      await queueSongs(songIds);

      // Fetch indexed lines
      const rawLines = await lyricsService.getLinesForSongs(songIds);

      // Run match engine
      const groups = matchLyrics(rawLines as RawLyricLine[], songMetaMap);
      setMatchedGroups(groups);
    } catch (err) {
      console.error('Error in project lyric matching:', err);
    } finally {
      setIsMatching(false);
    }
  };

  // Action 1: Add Note to entries (Section 9.4)
  const handleAddNote = async (group: LyricMatchGroup) => {
    const noteTag = `[Lyric link] ${group.label}`;
    const terms = group.sharedTerms.join(' / ');
    const memberLines = group.members
      .map((m) => `${m.title} - ${m.artist}: "${m.lineText}"`)
      .join(' ↔ ');
    const fullNoteLine = `[Lyric link: ${terms}] ${memberLines}`;

    const memberSongIds = new Set(group.members.map((m) => m.songId));

    for (const sec of project.sections) {
      for (const entry of sec.entries) {
        if (memberSongIds.has(entry.songId)) {
          const currentNotes = entry.notes || '';
          if (!currentNotes.includes(noteTag)) {
            const updated = currentNotes
              ? `${currentNotes}\n${fullNoteLine}`
              : fullNoteLine;
            await projectService.updateEntryNotes(entry.id, updated);
          }
        }
      }
    }

    setAddedNoteGroupIds((prev) => new Set([...prev, group.id]));
    onRefreshProject?.();
  };

  // Action 2: Link and highlight
  const handleToggleLink = async (group: LyricMatchGroup) => {
    const existing = links.find((l) => l.groupKey === group.id);
    if (existing) {
      await removeLink(existing.id);
    } else {
      await addLink({
        projectId: project.id,
        groupKey: group.id,
        lang: group.language,
        matchKind: group.kind,
        sharedTerms: group.sharedTerms,
        label: group.label,
        members: group.members.map((m) => ({
          linkId: '',
          songId: m.songId,
          lineId: m.lineId,
          lineText: m.lineText,
          lineIndex: m.lineIndex,
        })),
      });
    }
    fetchLinks();
  };

  const isLastSection =
    project.sections.findIndex((s) => s.id === selectedSectionId) ===
    project.sections.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Match Lyrics in Project: {project.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Analyze shared phrases and build persistent links across project sections.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope selector bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Scope:</span>
            <button
              type="button"
              onClick={() => setScopeChoice('whole_project')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                scopeChoice === 'whole_project'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Whole Project ({project.sections.reduce((acc, s) => acc + s.entries.length, 0)} songs)
            </button>
            <button
              type="button"
              onClick={() => setScopeChoice('one_section')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                scopeChoice === 'one_section'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              One Section
            </button>
            <button
              type="button"
              disabled={isLastSection && scopeChoice !== 'section_plus_next'}
              onClick={() => setScopeChoice('section_plus_next')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                scopeChoice === 'section_plus_next'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40'
              }`}
            >
              Section + Next Section
            </button>

            {scopeChoice !== 'whole_project' && (
              <div className="relative inline-flex items-center">
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="appearance-none bg-slate-800 border border-slate-700 rounded-lg pl-2.5 pr-7 py-1 text-slate-200 text-xs focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  {project.sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} ({sec.entries.length} songs)
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2 text-slate-400" aria-hidden />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleRunMatch}
            disabled={isMatching || isIngesting || songsInScope.length < 2}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white transition-all shadow-md shadow-primary-500/20"
          >
            {isMatching || isIngesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isMatching || isIngesting ? 'Analyzing Scope...' : 'Match Scope'}
          </button>
        </div>

        {/* Results Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isMatching || isIngesting ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 text-primary-400 animate-spin" />
              <p className="text-sm font-medium">Ingesting lyrics and computing phrase overlaps...</p>
            </div>
          ) : matchedGroups.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl">
              <p className="text-sm font-medium text-slate-300">No lyric matches in current scope</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "Match Scope" above to analyze the songs in the selected sections.
              </p>
            </div>
          ) : (
            matchedGroups.map((group) => {
              const isLinked = links.some((l) => l.groupKey === group.id);
              const noteAdded = addedNoteGroupIds.has(group.id);

              return (
                <div
                  key={group.id}
                  className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3"
                >
                  {/* Card Header & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <LyricKindBadge kind={group.kind} similarity={group.semanticSimilarity} />
                      <span className="text-sm font-semibold text-slate-100 capitalize">
                        {group.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Action 1: Add Note */}
                      <button
                        type="button"
                        onClick={() => handleAddNote(group)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          noteAdded
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        {noteAdded ? <Check className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {noteAdded ? 'Notes Added' : 'Add Note'}
                      </button>

                      {/* Action 2: Persistent Link */}
                      <button
                        type="button"
                        onClick={() => handleToggleLink(group)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          isLinked
                            ? 'bg-primary-500/15 text-primary-300 border-primary-500/40 shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        <Link2 className="w-3 h-3" />
                        {isLinked ? 'Linked' : 'Link & Highlight'}
                      </button>
                    </div>
                  </div>

                  {/* Lines list */}
                  <div className="space-y-2">
                    {group.members.map((member) => (
                      <div
                        key={`${member.songId}-${member.lineId}`}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary-400 truncate">
                              {member.title}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400 truncate">{member.artist}</span>
                          </div>
                          <p className="text-slate-200 italic font-sans leading-relaxed">
                            "{member.lineText}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            {links.length} active persistent {links.length === 1 ? 'link' : 'links'} in project
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
