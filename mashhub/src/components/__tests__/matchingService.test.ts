import { describe, it, expect } from 'vitest';
import { MatchingService } from '../../services/matchingService';
import { mockSongs } from '../../test/testUtils';

describe('MatchingService', () => {
  describe('findMatches', () => {
    it('finds songs with matching BPM', () => {
      const criteria = {
        targetBpm: 120,
        bpmTolerance: 10
      };

      const matches = MatchingService.findMatches(mockSongs, criteria);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('00001');
    });

    it('finds songs with matching key', () => {
      const criteria = {
        targetKey: 'C Major',
        keyTolerance: 1
      };

      const matches = MatchingService.findMatches(mockSongs, criteria);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('00001');
    });

    it('finds songs with matching vocal status', () => {
      const criteria = {
        vocalStatus: 'Vocal'
      };

      const matches = MatchingService.findMatches(mockSongs, criteria);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('00001');
    });

    it('finds songs with multiple criteria', () => {
      const criteria = {
        targetBpm: 120,
        bpmTolerance: 10,
        vocalStatus: 'Vocal'
      };

      const matches = MatchingService.findMatches(mockSongs, criteria);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('00001');
    });

    it('returns empty array when no matches found', () => {
      const criteria = {
        targetBpm: 200,
        bpmTolerance: 5
      };

      const matches = MatchingService.findMatches(mockSongs, criteria);
      
      expect(matches).toHaveLength(0);
    });
  });

  describe('getQuickMatches', () => {
    it('finds harmonic matches for a target song', () => {
      const targetSong = mockSongs[0];
      const matches = MatchingService.getQuickMatches(mockSongs, targetSong);
      
      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
    });
  });
});