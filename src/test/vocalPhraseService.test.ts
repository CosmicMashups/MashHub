import { describe, it, expect, beforeEach } from 'vitest';
import { vocalPhraseService } from '../services/vocalPhraseService';
import { db } from '../services/database';

describe('vocalPhraseService', () => {
  beforeEach(async () => {
    await db.vocalPhrases.clear();
  });

  it('add and getAll', async () => {
    const id = await vocalPhraseService.add('Tonight we fly', 'song1');
    expect(typeof id).toBe('number');
    const all = await vocalPhraseService.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].phrase).toBe('Tonight we fly');
    expect(all[0].songId).toBe('song1');
  });

  it('getPhrasesForSong', async () => {
    await vocalPhraseService.add('Phrase A', 's1');
    await vocalPhraseService.add('Phrase B', 's1');
    await vocalPhraseService.add('Phrase C', 's2');
    const forS1 = await vocalPhraseService.getPhrasesForSong('s1');
    expect(forS1).toHaveLength(2);
  });

  it('searchPhrases', async () => {
    await vocalPhraseService.add('Feel the energy', 's1');
    await vocalPhraseService.add('Energy flow', 's2');
    const results = await vocalPhraseService.searchPhrases('energy');
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.every((p) => p.phrase.toLowerCase().includes('energy'))).toBe(true);
  });

  it('delete', async () => {
    const id = await vocalPhraseService.add('To delete', 's1');
    await vocalPhraseService.delete(id);
    const all = await vocalPhraseService.getAll();
    expect(all.find((p) => p.id === id)).toBeUndefined();
  });
});
