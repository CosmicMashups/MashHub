export type BpmBucket = { id: string; label: string; min: number; max: number };

export const SUGGESTION_BPM_BUCKETS: BpmBucket[] = [
  { id: '70-74.5', label: '70 – 74.5 BPM', min: 70, max: 74.5 },
  { id: '75-79.5', label: '75 – 79.5 BPM', min: 75, max: 79.5 },
  { id: '80-84.5', label: '80 – 84.5 BPM', min: 80, max: 84.5 },
  { id: '85-89.5', label: '85 – 89.5 BPM', min: 85, max: 89.5 },
  { id: '90-94.5', label: '90 – 94.5 BPM', min: 90, max: 94.5 },
  { id: '95-99.5', label: '95 – 99.5 BPM', min: 95, max: 99.5 },
  { id: '100-104.5', label: '100 – 104.5 BPM', min: 100, max: 104.5 },
  { id: '105-109.5', label: '105 – 109.5 BPM', min: 105, max: 109.5 },
  { id: '110-119.5', label: '110 – 119.5 BPM', min: 110, max: 119.5 },
  { id: '120-124.5', label: '120 – 124.5 BPM', min: 120, max: 124.5 },
  { id: '125-129.5', label: '125 – 129.5 BPM', min: 125, max: 129.5 },
  { id: '130-134.5', label: '130 – 134.5 BPM', min: 130, max: 134.5 },
  { id: '135-139.5', label: '135 – 139.5 BPM', min: 135, max: 139.5 },
];

export const BPM_BUCKET_NO_BPM: BpmBucket = {
  id: 'no-bpm',
  label: 'No BPM',
  min: -Infinity,
  max: -Infinity,
};

export const BPM_BUCKET_OTHER: BpmBucket = {
  id: 'other-bpm',
  label: 'Other BPM',
  min: Infinity,
  max: Infinity,
};
