import React from 'react';
import type { LyricMatchKind } from '../../types/lyrics';
import { Sparkles, Type, FileText } from 'lucide-react';

interface LyricKindBadgeProps {
  kind: LyricMatchKind;
  similarity?: number;
  className?: string;
}

export const LyricKindBadge: React.FC<LyricKindBadgeProps> = ({ kind, similarity, className = '' }) => {
  if (kind === 'exact') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 ${className}`}
        title="Exact surface form match across all songs"
      >
        <Type className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        Same words
      </span>
    );
  }

  if (kind === 'lemma') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25 ${className}`}
        title="Same word in different grammatical forms (tense, plural, gerund)"
      >
        <FileText className="w-3 h-3 text-sky-600 dark:text-sky-400" />
        Word form
      </span>
    );
  }

  const pct = similarity ? Math.round(similarity * 100) : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-purple-500/10 dark:bg-gradient-to-r dark:from-purple-500/15 dark:to-indigo-500/15 text-purple-700 dark:text-purple-200 border border-purple-500/25 dark:border-purple-500/30 ${className}`}
      title="Semantic meaning similarity via sentence embeddings"
    >
      <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-300 animate-pulse" />
      Similar meaning {pct !== null ? `(${pct}%)` : ''}
    </span>
  );
};
