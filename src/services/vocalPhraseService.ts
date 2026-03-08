import { db } from './database';
import type { VocalPhrase } from '../types';

export const vocalPhraseService = {
  async getAll(): Promise<VocalPhrase[]> {
    return await db.vocalPhrases.toArray();
  },

  async add(phrase: string, songId: string): Promise<number> {
    return await db.vocalPhrases.add({ phrase: phrase.trim(), songId });
  },

  async delete(id: number): Promise<void> {
    await db.vocalPhrases.delete(id);
  },

  async getPhrasesForSong(songId: string): Promise<VocalPhrase[]> {
    return await db.vocalPhrases.where('songId').equals(songId).toArray();
  },

  async searchPhrases(query: string): Promise<VocalPhrase[]> {
    if (!query.trim()) return this.getAll();
    const q = query.trim().toLowerCase();
    const all = await db.vocalPhrases.toArray();
    return all.filter((p) => p.phrase.toLowerCase().includes(q));
  },
};
