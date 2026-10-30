import { db } from './database';
import { supabase } from '../lib/supabase';
import { withFallback } from '../lib/withFallback';
import type { ProjectLyricLink, ProjectLyricLinkMember } from '../types/lyrics';

class LyricLinkService {
  /**
   * Retrieves all lyric links for a given project.
   */
  async getLinksForProject(projectId: string): Promise<ProjectLyricLink[]> {
    return withFallback<ProjectLyricLink[]>({
      operation: 'getLinksForProject',
      supabaseCall: async () => {
        if (!supabase) return [];
        const { data: links, error: linkErr } = await supabase
          .from('project_lyric_links')
          .select('*')
          .eq('project_id', projectId);

        if (linkErr || !links) {
          console.warn('Error fetching project lyric links from Supabase:', linkErr);
          return [];
        }

        if (links.length === 0) return [];

        const linkIds = links.map((l) => l.id);
        const { data: members, error: memErr } = await supabase
          .from('project_lyric_link_members')
          .select('*')
          .in('link_id', linkIds);

        if (memErr) {
          console.warn('Error fetching project lyric link members:', memErr);
        }

        const membersByLink = new Map<string, ProjectLyricLinkMember[]>();
        for (const m of members || []) {
          if (!membersByLink.has(m.link_id)) {
            membersByLink.set(m.link_id, []);
          }
          membersByLink.get(m.link_id)!.push({
            linkId: m.link_id,
            songId: m.song_id,
            lineId: m.line_id,
            lineText: m.line_text,
            lineIndex: m.line_index,
          });
        }

        return links.map((l) => ({
          id: l.id,
          projectId: l.project_id,
          userId: l.user_id,
          groupKey: l.group_key,
          lang: l.lang,
          matchKind: l.match_kind,
          sharedTerms: l.shared_terms || [],
          label: l.label,
          createdAt: l.created_at,
          members: membersByLink.get(l.id) || [],
        }));
      },
      dexieCall: async () => {
        return db.projectLyricLinks.where('projectId').equals(projectId).toArray();
      },
    });
  }

  /**
   * Creates or persists a project lyric link.
   */
  async createLink(link: Omit<ProjectLyricLink, 'id' | 'createdAt'>): Promise<ProjectLyricLink> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const fullLink: ProjectLyricLink = {
      ...link,
      id,
      createdAt,
    };

    return withFallback<ProjectLyricLink>({
      operation: 'createLyricLink',
      supabaseCall: async () => {
        if (!supabase) return fullLink;
        const { error: linkErr } = await supabase.from('project_lyric_links').insert({
          id: fullLink.id,
          project_id: fullLink.projectId,
          group_key: fullLink.groupKey,
          lang: fullLink.lang,
          match_kind: fullLink.matchKind,
          shared_terms: fullLink.sharedTerms,
          label: fullLink.label,
          created_at: fullLink.createdAt,
        });

        if (linkErr) throw linkErr;

        if (fullLink.members.length > 0) {
          const membersToInsert = fullLink.members.map((m) => ({
            link_id: fullLink.id,
            song_id: m.songId,
            line_id: m.lineId,
            line_text: m.lineText,
            line_index: m.lineIndex,
          }));
          const { error: memErr } = await supabase
            .from('project_lyric_link_members')
            .insert(membersToInsert);
          if (memErr) throw memErr;
        }

        // Also write to Dexie for local sync
        await db.projectLyricLinks.put(fullLink);
        return fullLink;
      },
      dexieCall: async () => {
        await db.projectLyricLinks.put(fullLink);
        return fullLink;
      },
    });
  }

  /**
   * Deletes a project lyric link.
   */
  async deleteLink(linkId: string): Promise<void> {
    return withFallback<void>({
      operation: 'deleteLyricLink',
      supabaseCall: async () => {
        if (supabase) {
          await supabase.from('project_lyric_links').delete().eq('id', linkId);
        }
        await db.projectLyricLinks.delete(linkId);
      },
      dexieCall: async () => {
        await db.projectLyricLinks.delete(linkId);
      },
    });
  }
}

export const lyricLinkService = new LyricLinkService();
