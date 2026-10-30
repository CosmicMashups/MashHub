import { useState, useEffect, useCallback, useMemo } from 'react';
import { lyricLinkService } from '../services/lyricLinkService';
import type { ProjectLyricLink } from '../types/lyrics';

export function useLyricLinks(projectId: string | undefined) {
  const [links, setLinks] = useState<ProjectLyricLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await lyricLinkService.getLinksForProject(projectId);
      setLinks(data);
    } catch (err) {
      console.warn('Error fetching lyric links:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const linksBySongId = useMemo(() => {
    const map = new Map<string, ProjectLyricLink[]>();
    for (const link of links) {
      for (const member of link.members) {
        if (!map.has(member.songId)) {
          map.set(member.songId, []);
        }
        map.get(member.songId)!.push(link);
      }
    }
    return map;
  }, [links]);

  const highlightedSongIds = useMemo(() => {
    if (!highlightedLinkId) return new Set<string>();
    const link = links.find((l) => l.id === highlightedLinkId);
    if (!link) return new Set<string>();
    return new Set(link.members.map((m) => m.songId));
  }, [highlightedLinkId, links]);

  const addLink = useCallback(
    async (linkData: Omit<ProjectLyricLink, 'id' | 'createdAt'>) => {
      const created = await lyricLinkService.createLink(linkData);
      setLinks((prev) => [...prev.filter((l) => l.groupKey !== created.groupKey), created]);
      return created;
    },
    []
  );

  const removeLink = useCallback(async (linkId: string) => {
    await lyricLinkService.deleteLink(linkId);
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
  }, []);

  return {
    links,
    loading,
    linksBySongId,
    highlightedLinkId,
    setHighlightedLinkId,
    highlightedSongIds,
    fetchLinks,
    addLink,
    removeLink,
  };
}
