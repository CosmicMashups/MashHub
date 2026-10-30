import React, { useState, useEffect, useMemo } from 'react';
import type { LyricMatchGroup, LyricMatchMember } from '../../types/lyrics';
import { LyricKindBadge } from './LyricKindBadge';
import { Copy, Check, Clock, ChevronDown, ChevronUp, Music } from 'lucide-react';

interface LyricMatchGroupCardProps {
  group: LyricMatchGroup;
  compact?: boolean;
}

export const LyricMatchGroupCard: React.FC<LyricMatchGroupCardProps> = ({ group, compact = false }) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Sync state if compact prop changes
  useEffect(() => {
    setIsExpanded(!compact);
  }, [compact]);

  // Group members by song
  const songBuckets = useMemo(() => {
    const map = new Map<string, { title: string; artist: string; members: LyricMatchMember[] }>();
    for (const m of group.members) {
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
  }, [group.members]);

  const copyLine = async (lineId: number, text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(lineId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  const formatMs = (ms?: number) => {
    if (ms == null) return null;
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const renderHighlightedLine = (text: string, terms: string[]) => {
    if (!terms || terms.length === 0) return <span>{text}</span>;

    const escapedTerms = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => {
          const isMatch = terms.some((t) => t.toLowerCase() === part.toLowerCase());
          return isMatch ? (
            <mark
              key={i}
              className="bg-amber-400/25 text-amber-800 dark:text-amber-200 font-semibold px-1.5 py-0.5 rounded-md border border-amber-400/35 shadow-xs"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="relative group/card rounded-[1.25rem] p-1 bg-gradient-to-b from-theme-border-default/70 to-theme-border-subtle/30 border border-theme-border-default shadow-xs dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] hover:border-primary-500/40 transition-all duration-300">
      <div className="rounded-[calc(1.25rem-4px)] p-5 bg-theme-surface-base border border-theme-border-subtle space-y-4">
        {/* Header */}
        <div
          onClick={() => compact && setIsExpanded(!isExpanded)}
          className={`flex flex-wrap items-center justify-between gap-3 ${
            isExpanded ? 'pb-3 border-b border-theme-border-default' : ''
          } ${compact ? 'cursor-pointer select-none' : ''}`}
        >
          <div className="flex items-center gap-2.5">
            <LyricKindBadge kind={group.kind} similarity={group.semanticSimilarity} />
            <span className="text-sm font-semibold text-theme-text-primary tracking-wide capitalize">
              {group.label}
            </span>
            {group.isCommonWord && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-theme-background-secondary text-theme-text-muted border border-theme-border-default font-medium">
                Common word
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-theme-text-muted font-medium tabular-nums">
              {songBuckets.length} {songBuckets.length === 1 ? 'song' : 'songs'} ({group.members.length} {group.members.length === 1 ? 'line' : 'lines'})
            </span>
            {compact && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1 rounded-md text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover transition-colors"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Grouped by Song */}
        {isExpanded && (
          <div className="space-y-3">
            {songBuckets.map((bucket) => (
              <div
                key={bucket.songId}
                className="rounded-xl p-3.5 bg-theme-background-secondary/50 border border-theme-border-default space-y-2.5"
              >
                {/* Song header badge */}
                <div className="flex items-center justify-between pb-2 border-b border-theme-border-default">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                      <Music className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-300 truncate max-w-[240px]">
                      {bucket.title}
                    </span>
                    <span className="text-xs text-theme-text-muted">•</span>
                    <span className="text-xs text-theme-text-muted truncate max-w-[200px]">
                      {bucket.artist}
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-theme-surface-elevated text-theme-text-muted border border-theme-border-default font-medium shrink-0">
                    {bucket.members.length} {bucket.members.length === 1 ? 'line' : 'lines'}
                  </span>
                </div>

                {/* Song's matched lines */}
                <div className="space-y-2 pl-1">
                  {bucket.members.map((member) => {
                    const timeFormatted = formatMs(member.startMs);
                    return (
                      <div
                        key={`${member.songId}-${member.lineId}`}
                        className="group/item flex items-start justify-between gap-3 p-2.5 rounded-lg bg-theme-surface-base border border-theme-border-subtle hover:border-primary-500/30 hover:bg-theme-surface-hover transition-all duration-200"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          {timeFormatted && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-theme-text-muted font-mono mb-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {timeFormatted}
                            </span>
                          )}
                          <p className="text-xs sm:text-sm text-theme-text-secondary font-sans leading-relaxed break-words">
                            "{renderHighlightedLine(member.lineText, member.highlightTerms)}"
                          </p>
                        </div>

                        {/* Copy line button */}
                        <button
                          type="button"
                          onClick={() => copyLine(member.lineId, member.lineText)}
                          title="Copy whole lyric line"
                          className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover active:scale-95 transition-all self-center"
                        >
                          {copiedId === member.lineId ? (
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
        )}
      </div>
    </div>
  );
};
