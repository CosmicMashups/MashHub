import React, { useState } from 'react';
import type { LyricMatchGroup, LyricMatchMember } from '../../types/lyrics';
import { LyricKindBadge } from './LyricKindBadge';
import { Copy, Check, Clock, ChevronDown, ChevronUp, Layers, Music } from 'lucide-react';

interface LyricMatchSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  term: string;
  groups: LyricMatchGroup[];
}

export const LyricMatchSummaryDialog: React.FC<LyricMatchSummaryDialogProps> = ({
  isOpen,
  onClose,
  term,
  groups,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyLine = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const formatMs = (ms?: number) => {
    if (ms == null) return null;
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const renderHighlighted = (text: string, highlightWord: string) => {
    if (!highlightWord) return <span>{text}</span>;
    const escaped = highlightWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((p, i) =>
          p.toLowerCase() === highlightWord.toLowerCase() ? (
            <mark
              key={i}
              className="bg-amber-400/25 text-amber-800 dark:text-amber-200 font-semibold px-1 rounded border border-amber-400/35"
            >
              {p}
            </mark>
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </span>
    );
  };

  // Group members by song within each match group
  const getSongBuckets = (members: LyricMatchMember[]) => {
    const map = new Map<string, { title: string; artist: string; members: LyricMatchMember[] }>();
    for (const m of members) {
      let bucket = map.get(m.songId);
      if (!bucket) {
        bucket = { title: m.title, artist: m.artist, members: [] };
        map.set(m.songId, bucket);
      }
      bucket.members.push(m);
    }
    return Array.from(map.entries()).map(([songId, data]) => ({
      songId,
      ...data,
    }));
  };

  // Distinct song count across these groups
  const allSongIds = new Set<string>();
  let totalLines = 0;
  groups.forEach((g) => {
    g.members.forEach((m) => {
      allSongIds.add(m.songId);
      totalLines++;
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-theme-overlay backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-theme-surface-base border border-theme-border-default shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border-default bg-theme-background-secondary/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-theme-text-primary capitalize">
                  &ldquo;{term}&rdquo;
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-theme-surface-elevated text-theme-text-muted border border-theme-border-default font-medium">
                  {groups.length} {groups.length === 1 ? 'match variation' : 'match variations'}
                </span>
              </div>
              <p className="text-xs text-theme-text-muted mt-0.5">
                Found in {allSongIds.size} {allSongIds.size === 1 ? 'song' : 'songs'} ({totalLines} total occurrences)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover p-1.5 rounded-lg transition-colors text-sm font-medium"
          >
            ✕
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {groups.map((group) => {
            const buckets = getSongBuckets(group.members);
            return (
              <div
                key={group.id}
                className="rounded-xl p-4 bg-theme-background-secondary/50 border border-theme-border-default space-y-3"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-theme-border-default">
                  <div className="flex items-center gap-2">
                    <LyricKindBadge kind={group.kind} similarity={group.semanticSimilarity} />
                    <span className="text-xs text-theme-text-primary font-medium capitalize">
                      {group.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-theme-text-muted font-medium">
                    {buckets.length} {buckets.length === 1 ? 'song' : 'songs'} ({group.members.length} {group.members.length === 1 ? 'line' : 'lines'})
                  </span>
                </div>

                {/* Sub-grouped by song */}
                <div className="space-y-2.5">
                  {buckets.map((bucket) => (
                    <div
                      key={bucket.songId}
                      className="rounded-lg p-3 bg-theme-surface-base border border-theme-border-default space-y-2"
                    >
                      {/* Song header */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-theme-border-subtle">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1 rounded bg-primary-500/10 text-primary-600 dark:text-primary-400">
                            <Music className="w-3 h-3" />
                          </div>
                          <span className="font-semibold text-xs text-primary-600 dark:text-primary-300 truncate max-w-[220px]">
                            {bucket.title}
                          </span>
                          <span className="text-theme-text-muted text-xs">•</span>
                          <span className="text-theme-text-muted text-xs truncate max-w-[180px]">
                            {bucket.artist}
                          </span>
                        </div>
                        <span className="text-[10px] text-theme-text-muted font-medium">
                          {bucket.members.length} {bucket.members.length === 1 ? 'line' : 'lines'}
                        </span>
                      </div>

                      {/* Song lyric lines */}
                      <div className="space-y-1.5 pl-1">
                        {bucket.members.map((member) => {
                          const key = `${group.id}-${member.songId}-${member.lineId}`;
                          const timeFormatted = formatMs(member.startMs);
                          const isCopied = copiedKey === key;

                          return (
                            <div
                              key={key}
                              className="group/item flex items-start justify-between gap-3 p-2 rounded-md bg-theme-background-secondary/40 border border-theme-border-subtle text-xs hover:border-theme-border-strong transition-colors"
                            >
                              <div className="space-y-0.5 min-w-0 flex-1">
                                {timeFormatted && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-theme-text-muted font-mono">
                                    <Clock className="w-2.5 h-2.5" />
                                    {timeFormatted}
                                  </span>
                                )}
                                <p className="text-theme-text-secondary font-serif leading-relaxed italic">
                                  &ldquo;{renderHighlighted(member.lineText, term)}&rdquo;
                                </p>
                              </div>

                              <button
                                onClick={() => copyLine(key, member.lineText)}
                                className="text-theme-text-muted hover:text-theme-text-primary p-1 rounded hover:bg-theme-surface-hover transition-colors"
                                title="Copy lyric"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-theme-border-default bg-theme-background-secondary/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-theme-surface-elevated hover:bg-theme-surface-hover border border-theme-border-default text-theme-text-primary text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
