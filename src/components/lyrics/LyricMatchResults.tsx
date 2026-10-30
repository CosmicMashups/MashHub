import React, { useState, useMemo } from 'react';
import type { LyricMatchGroup, LyricMatchKind, LyricLanguage } from '../../types/lyrics';
import { LyricMatchGroupCard } from './LyricMatchGroupCard';
import { LyricMatchSummaryDialog } from './LyricMatchSummaryDialog';
import {
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Type,
  FileText,
  Rows3,
  LayoutList,
  Tags,
  Layers,
} from 'lucide-react';

interface LyricMatchResultsProps {
  groups: LyricMatchGroup[];
  isLoading?: boolean;
}

export const LyricMatchResults: React.FC<LyricMatchResultsProps> = ({ groups, isLoading }) => {
  const [kindFilter, setKindFilter] = useState<LyricMatchKind | 'all'>('all');
  const [langFilter, setLangFilter] = useState<LyricLanguage | 'all'>('all');
  const [showCommonWords, setShowCommonWords] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Dialog state for clicked summary phrase/word
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (kindFilter !== 'all' && g.kind !== kindFilter) return false;
      if (langFilter !== 'all' && g.language !== langFilter) return false;
      if (!showCommonWords && g.isCommonWord) return false;
      return true;
    });
  }, [groups, kindFilter, langFilter, showCommonWords]);

  const commonCount = useMemo(() => groups.filter((g) => g.isCommonWord).length, [groups]);

  // Aggregated phrases & words for the summary banner
  const phraseSummary = useMemo(() => {
    const termMap = new Map<
      string,
      {
        term: string;
        groups: LyricMatchGroup[];
        totalSongs: Set<string>;
        totalOccurrences: number;
        hasExact: boolean;
      }
    >();

    for (const group of filteredGroups) {
      const key = group.label.trim().toLowerCase();
      if (!key) continue;

      let entry = termMap.get(key);
      if (!entry) {
        entry = {
          term: group.label.trim(),
          groups: [],
          totalSongs: new Set<string>(),
          totalOccurrences: 0,
          hasExact: false,
        };
        termMap.set(key, entry);
      }

      entry.groups.push(group);
      if (group.kind === 'exact') entry.hasExact = true;
      for (const m of group.members) {
        entry.totalSongs.add(m.songId);
        entry.totalOccurrences++;
      }
    }

    return Array.from(termMap.values()).sort((a, b) => {
      // Sort by number of songs linked, then occurrences, then exact match priority
      if (b.totalSongs.size !== a.totalSongs.size) {
        return b.totalSongs.size - a.totalSongs.size;
      }
      return b.totalOccurrences - a.totalOccurrences;
    });
  }, [filteredGroups]);

  const selectedTermGroups = useMemo(() => {
    if (!selectedTerm) return [];
    return filteredGroups.filter(
      (g) => g.label.trim().toLowerCase() === selectedTerm.toLowerCase()
    );
  }, [filteredGroups, selectedTerm]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-theme-text-muted gap-3">
        <Sparkles className="w-8 h-8 text-primary-500 dark:text-primary-400 animate-pulse" />
        <p className="text-sm font-medium">Finding lyric connections across songs...</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-theme-surface-base border border-theme-border-default rounded-2xl shadow-xs">
        <p className="text-sm font-medium text-theme-text-primary">No shared lyrics found</p>
        <p className="text-xs text-theme-text-muted mt-1 max-w-sm mx-auto">
          Try adding more songs or choosing tracks with vocal overlap.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Summary of Matched Words & Phrases */}
      {phraseSummary.length > 0 && (
        <div className="p-4 rounded-2xl bg-theme-surface-base border border-theme-border-default shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                <Tags className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold text-theme-text-primary uppercase tracking-wider">
                Matched Terms Summary
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-theme-background-secondary text-theme-text-muted font-medium border border-theme-border-subtle">
                {phraseSummary.length} {phraseSummary.length === 1 ? 'term' : 'terms'}
              </span>
            </div>
            <span className="text-[11px] text-theme-text-muted font-medium">
              Click any word or phrase to view its lyrics
            </span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {phraseSummary.map((item) => {
              const songCount = item.totalSongs.size;
              return (
                <button
                  key={item.term}
                  type="button"
                  onClick={() => setSelectedTerm(item.term)}
                  className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                    item.hasExact
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border-emerald-500/25 hover:border-emerald-500/40 shadow-xs'
                      : 'bg-theme-surface-elevated hover:bg-theme-surface-hover text-theme-text-secondary border-theme-border-default hover:border-theme-border-strong shadow-2xs'
                  }`}
                >
                  <span className="font-semibold tracking-tight">{item.term}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                      item.hasExact
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-theme-background-secondary text-theme-text-muted'
                    }`}
                  >
                    {songCount} {songCount === 1 ? 'song' : 'songs'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-theme-surface-base border border-theme-border-default rounded-xl text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-theme-text-muted font-medium flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>

          {/* Kind filters */}
          <button
            onClick={() => setKindFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors border ${
              kindFilter === 'all'
                ? 'bg-primary-600 dark:bg-primary-500 text-white border-primary-600 dark:border-primary-500 shadow-xs'
                : 'bg-theme-surface-elevated text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover border-theme-border-default'
            }`}
          >
            All matches ({groups.length})
          </button>
          <button
            onClick={() => setKindFilter('exact')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors border ${
              kindFilter === 'exact'
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-theme-surface-elevated text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover border-theme-border-default'
            }`}
          >
            <Type className="w-3 h-3" />
            Same words
          </button>
          <button
            onClick={() => setKindFilter('lemma')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors border ${
              kindFilter === 'lemma'
                ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40 shadow-xs'
                : 'bg-theme-surface-elevated text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover border-theme-border-default'
            }`}
          >
            <FileText className="w-3 h-3" />
            Word form
          </button>
          <button
            onClick={() => setKindFilter('semantic')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors border ${
              kindFilter === 'semantic'
                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40 shadow-xs'
                : 'bg-theme-surface-elevated text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover border-theme-border-default'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Similar meaning
          </button>
        </div>

        {/* View toggles & Common words */}
        <div className="flex items-center gap-2">
          {/* Compact vs Detailed Toggle */}
          <button
            type="button"
            onClick={() => setIsCompact(!isCompact)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors border ${
              isCompact
                ? 'bg-primary-500/15 text-primary-700 dark:text-primary-300 border-primary-500/30'
                : 'bg-theme-surface-elevated text-theme-text-secondary border-theme-border-default hover:bg-theme-surface-hover'
            }`}
            title={isCompact ? 'Switch to Detailed View' : 'Switch to Compact View'}
          >
            {isCompact ? <Rows3 className="w-3.5 h-3.5" /> : <LayoutList className="w-3.5 h-3.5" />}
            {isCompact ? 'Compact view' : 'Detailed view'}
          </button>

          {/* Common words toggle */}
          {commonCount > 0 && (
            <button
              type="button"
              onClick={() => setShowCommonWords(!showCommonWords)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-theme-surface-elevated hover:bg-theme-surface-hover border border-theme-border-default text-theme-text-secondary transition-colors"
            >
              {showCommonWords ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showCommonWords ? 'Hide common words' : `Show ${commonCount} common words`}
            </button>
          )}
        </div>
      </div>

      {/* 3. Cards list */}
      <div className={isCompact ? 'space-y-2' : 'space-y-4'}>
        {filteredGroups.map((group) => (
          <LyricMatchGroupCard key={group.id} group={group} compact={isCompact} />
        ))}
      </div>

      {/* 4. Term Summary Dialog */}
      {selectedTerm && (
        <LyricMatchSummaryDialog
          isOpen={Boolean(selectedTerm)}
          onClose={() => setSelectedTerm(null)}
          term={selectedTerm}
          groups={selectedTermGroups}
        />
      )}
    </div>
  );
};
