/**
 * Typed client for the CSV Parser Web Worker.
 *
 * Usage:
 *   const { songs, sections, errors } = await parseAnimeCSVInWorker(url);
 *   const { songs, sections, errors } = await parseUserCSVInWorker(songsText, sectionsText);
 *
 * The worker is created lazily and reused across calls (singleton pattern).
 * Falls back to synchronous parsing if Workers are not available.
 */

import type { ParseResult } from './csvParser.worker';
import { parseSongsCSV, parseSongSectionsCSV, parseAnimeCSV } from '../data/animeDataLoader';

let worker: Worker | null = null;
let pendingRequests = new Map<string, {
  resolve: (result: ParseResult) => void;
  reject: (err: Error) => void;
}>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    worker = new Worker(new URL('./csvParser.worker.ts', import.meta.url), { type: 'module' });
    worker.addEventListener('message', (event: MessageEvent<ParseResult & { id: string }>) => {
      const { id, ...result } = event.data;
      const pending = pendingRequests.get(id);
      if (pending) {
        pendingRequests.delete(id);
        pending.resolve(result);
      }
    });
    worker.addEventListener('error', (err) => {
      console.error('[csvParser.worker] uncaught error:', err);
      // Reject all pending requests
      for (const [, pending] of pendingRequests) {
        pending.reject(new Error('Worker error'));
      }
      pendingRequests.clear();
      worker = null; // Allow recreation on next call
    });
  }
  return worker;
}

function sendToWorker(msg: Record<string, unknown>): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    if (!w) {
      reject(new Error('Web Workers not available'));
      return;
    }
    const id = Math.random().toString(36).slice(2);
    pendingRequests.set(id, { resolve, reject });
    w.postMessage({ ...msg, id });
  });
}

/**
 * Fetch and parse the bundled anime CSV seed file off the main thread.
 */
export async function parseAnimeCSVInWorker(url: string): Promise<ParseResult> {
  try {
    return await sendToWorker({ type: 'parseAnimeCSV', url });
  } catch {
    // Fallback: synchronous parse on main thread
    const response = await fetch(url);
    const csvText = await response.text();
    const songs = parseAnimeCSV(csvText);
    return { songs, sections: [], errors: [] };
  }
}

/**
 * Parse a user-uploaded songs + sections CSV pair off the main thread.
 */
export async function parseUserCSVInWorker(
  songsText: string,
  sectionsText: string
): Promise<ParseResult> {
  try {
    return await sendToWorker({ type: 'parseUserCSV', songsText, sectionsText });
  } catch {
    // Fallback: synchronous parse on main thread
    const songs = parseSongsCSV(songsText);
    const sections = parseSongSectionsCSV(sectionsText);
    return { songs, sections, errors: [] };
  }
}
