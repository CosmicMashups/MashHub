import {
  BPM_BUCKET_NO_BPM,
  BPM_BUCKET_OTHER,
  SUGGESTION_BPM_BUCKETS,
  type BpmBucket,
} from '../constants/bpmBuckets';
import type { SuggestionPaneSong } from './suggestionPaneSongs';

export type BpmBucketGroup = {
  bucket: BpmBucket;
  songs: SuggestionPaneSong[];
};

function songBpm(song: SuggestionPaneSong): number | null {
  const bpm = song.primaryBpm ?? song.bpms?.[0];
  return bpm != null && !Number.isNaN(bpm) ? bpm : null;
}

function findStandardBucket(bpm: number): BpmBucket | null {
  for (const bucket of SUGGESTION_BPM_BUCKETS) {
    if (bpm >= bucket.min && bpm <= bucket.max) return bucket;
  }
  return null;
}

function sortSongsInBucket(songs: SuggestionPaneSong[]): SuggestionPaneSong[] {
  return [...songs].sort((a, b) => {
    const bpmA = songBpm(a) ?? -1;
    const bpmB = songBpm(b) ?? -1;
    if (bpmA !== bpmB) return bpmA - bpmB;
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });
}

/**
 * Groups suggestion-pane songs into BPM buckets. Only returns non-empty groups.
 * Order: standard buckets (70–139.5), then Other BPM, then No BPM.
 */
export function groupSongsByBpmBucket(songs: SuggestionPaneSong[]): BpmBucketGroup[] {
  const byBucketId = new Map<string, SuggestionPaneSong[]>();

  for (const song of songs) {
    const bpm = songBpm(song);
    let bucket: BpmBucket;
    if (bpm == null) {
      bucket = BPM_BUCKET_NO_BPM;
    } else {
      const standard = findStandardBucket(bpm);
      bucket = standard ?? BPM_BUCKET_OTHER;
    }
    const list = byBucketId.get(bucket.id) ?? [];
    list.push(song);
    byBucketId.set(bucket.id, list);
  }

  const groups: BpmBucketGroup[] = [];

  for (const bucket of SUGGESTION_BPM_BUCKETS) {
    const list = byBucketId.get(bucket.id);
    if (list && list.length > 0) {
      groups.push({ bucket, songs: sortSongsInBucket(list) });
    }
  }

  const otherList = byBucketId.get(BPM_BUCKET_OTHER.id);
  if (otherList && otherList.length > 0) {
    groups.push({ bucket: BPM_BUCKET_OTHER, songs: sortSongsInBucket(otherList) });
  }

  const noBpmList = byBucketId.get(BPM_BUCKET_NO_BPM.id);
  if (noBpmList && noBpmList.length > 0) {
    groups.push({ bucket: BPM_BUCKET_NO_BPM, songs: sortSongsInBucket(noBpmList) });
  }

  return groups;
}
