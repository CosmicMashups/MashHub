/**
 * CSV Parser Web Worker
 *
 * Offloads CSV parsing to a dedicated Web Worker to avoid blocking the main thread
 * during large file operations (seed data load, user import).
 *
 * Exposed via the browser's native Worker + postMessage API.
 * The worker accepts a message with a `type` field and responds with the result.
 *
 * Message protocol:
 *   Request  → { id, type: 'parseAnimeCSV',  url: string }
 *            → { id, type: 'parseUserCSV',   songsText: string; sectionsText: string }
 *   Response → { id, songs, sections, errors }
 */

import type { Song, SongSection } from '../types';
import { parseSongsCSV, parseSongSectionsCSV, parseAnimeCSV } from '../data/animeDataLoader';

export interface ParseError {
  row: number;
  message: string;
}

export interface ParseResult {
  songs: Song[];
  sections: SongSection[];
  errors: ParseError[];
}

type WorkerRequest =
  | { id: string; type: 'parseAnimeCSV'; url: string }
  | { id: string; type: 'parseUserCSV'; songsText: string; sectionsText: string };

type WorkerResponse = { id: string } & ParseResult;

self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;

  try {
    let result: ParseResult;

    if (req.type === 'parseAnimeCSV') {
      const response = await fetch(req.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
      }
      const csvText = await response.text();
      const songs = parseAnimeCSV(csvText);
      result = { songs, sections: [], errors: [] };

    } else if (req.type === 'parseUserCSV') {
      const songs = parseSongsCSV(req.songsText);
      const sections = parseSongSectionsCSV(req.sectionsText);

      const songIdSet = new Set(songs.map((s) => s.id));
      const errors: ParseError[] = [];
      const validSections: SongSection[] = [];

      sections.forEach((section, i) => {
        if (!songIdSet.has(section.songId)) {
          errors.push({ row: i + 2, message: `Section ${section.sectionId} references unknown song ${section.songId}` });
        } else {
          validSections.push(section);
        }
      });

      result = { songs, sections: validSections, errors };

    } else {
      throw new Error(`Unknown worker message type`);
    }

    const response: WorkerResponse = { id: req.id, ...result };
    self.postMessage(response);

  } catch (err) {
    const response: WorkerResponse = {
      id: req.id,
      songs: [],
      sections: [],
      errors: [{ row: 0, message: err instanceof Error ? err.message : String(err) }],
    };
    self.postMessage(response);
  }
});
