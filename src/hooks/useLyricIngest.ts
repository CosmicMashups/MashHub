import { useState, useCallback, useRef } from 'react';
import { lyricsService, type IngestResponse } from '../services/lyricsService';
import { LYRIC_INGEST_CONCURRENCY, LYRIC_INGEST_MAX_RETRIES } from '../constants/lyrics';

export interface IngestItemStatus {
  songId: string;
  status: 'idle' | 'queued' | 'fetching' | 'found' | 'not_found' | 'instrumental' | 'error' | 'manual';
  error?: string;
  languages?: string[];
  lineCount?: number;
}

export function useLyricIngest() {
  const [statuses, setStatuses] = useState<Record<string, IngestItemStatus>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const queueRef = useRef<string[]>([]);
  const isCancelledRef = useRef(false);

  const updateStatus = useCallback((songId: string, partial: Partial<IngestItemStatus>) => {
    setStatuses((prev) => ({
      ...prev,
      [songId]: {
        ...(prev[songId] || { songId, status: 'idle' }),
        ...partial,
      },
    }));
  }, []);

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    queueRef.current = [];
    setIsProcessing(false);
  }, []);

  const queueSongs = useCallback(
    async (songIds: string[], force = false) => {
      isCancelledRef.current = false;
      const uniqueSongIds = Array.from(new Set(songIds));

      // Mark queued
      setStatuses((prev) => {
        const next = { ...prev };
        for (const id of uniqueSongIds) {
          if (!next[id] || next[id].status !== 'found') {
            next[id] = { songId: id, status: 'queued' };
          }
        }
        return next;
      });

      queueRef.current = [...uniqueSongIds];
      setIsProcessing(true);

      const processNext = async (): Promise<void> => {
        if (isCancelledRef.current || queueRef.current.length === 0) {
          return;
        }

        const songId = queueRef.current.shift();
        if (!songId) return;

        updateStatus(songId, { status: 'fetching' });

        let attempts = 0;
        let success = false;
        let response: IngestResponse | null = null;

        while (attempts <= LYRIC_INGEST_MAX_RETRIES && !success && !isCancelledRef.current) {
          try {
            response = await lyricsService.ingestSong(songId, { force });
            if (response.status !== 'error') {
              success = true;
            } else {
              attempts++;
              if (attempts <= LYRIC_INGEST_MAX_RETRIES) {
                await new Promise((r) => setTimeout(r, 1000 * attempts));
              }
            }
          } catch {
            attempts++;
            if (attempts <= LYRIC_INGEST_MAX_RETRIES) {
              await new Promise((r) => setTimeout(r, 1000 * attempts));
            }
          }
        }

        if (response) {
          updateStatus(songId, {
            status: response.status as any,
            error: response.error,
            languages: response.languages,
            lineCount: response.lineCount,
          });
        } else {
          updateStatus(songId, { status: 'error', error: 'Ingestion failed' });
        }

        // Keep pumping queue
        await processNext();
      };

      // Launch workers up to concurrency
      const workers = Array.from({ length: LYRIC_INGEST_CONCURRENCY }, () => processNext());
      await Promise.all(workers);
      setIsProcessing(false);
    },
    [updateStatus]
  );

  return {
    statuses,
    isProcessing,
    queueSongs,
    updateStatus,
    cancel,
  };
}
