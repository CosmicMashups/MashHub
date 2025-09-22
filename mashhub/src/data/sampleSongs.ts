import type { Song } from '../types';

export const sampleSongs: Song[] = [
  {
    id: '00001',
    title: 'Kyoukaisen',
    bpms: [93.5],
    keys: ['D Major'],
    part: 'Verse',
    artist: 'ArtistX',
    type: 'Anime',
    origin: 'Japan',
    year: 2020,
    season: 'Summer',
    vocalStatus: 'Vocal',
    primaryBpm: 93.5,
    primaryKey: 'D Major'
  },
  {
    id: '00002',
    title: 'Another Song',
    bpms: [120, 240],
    keys: ['C Major', 'A Minor'],
    part: 'Chorus',
    artist: 'ArtistY',
    type: 'Game',
    origin: 'USA',
    year: 2021,
    season: 'Spring',
    vocalStatus: 'Both',
    primaryBpm: 120,
    primaryKey: 'C Major'
  }
];