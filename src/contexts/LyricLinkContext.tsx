import React, { createContext, useContext } from 'react';
import type { ProjectLyricLink } from '../types/lyrics';

interface LyricLinkContextValue {
  links: ProjectLyricLink[];
  linksBySongId: Map<string, ProjectLyricLink[]>;
  highlightedLinkId: string | null;
  highlightedSongIds: Set<string>;
  setHighlightedLinkId: (id: string | null) => void;
}

const LyricLinkContext = createContext<LyricLinkContextValue>({
  links: [],
  linksBySongId: new Map(),
  highlightedLinkId: null,
  highlightedSongIds: new Set(),
  setHighlightedLinkId: () => {},
});

export const LyricLinkProvider: React.FC<{
  value: LyricLinkContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <LyricLinkContext.Provider value={value}>{children}</LyricLinkContext.Provider>;
};

export function useLyricLinkContext(): LyricLinkContextValue {
  return useContext(LyricLinkContext);
}
