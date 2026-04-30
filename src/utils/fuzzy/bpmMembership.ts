type Anchor = { x: number; y: number };

const BPM_ANCHORS: readonly Anchor[] = [
  { x: 0, y: 1.0 },
  { x: 5, y: 0.9 },
  { x: 10, y: 0.8 },
  { x: 12, y: 0.7 },
  { x: 20, y: 0.0 },
];

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Discrete BPM membership with linear interpolation between anchors.
 * Anchor rules: 0->1.0, 5->0.9, 10->0.8, 12->0.7, 20->0.0.
 */
export function getBpmMembership(diff: number): number {
  if (!Number.isFinite(diff)) return 0;
  const d = Math.max(0, diff);

  if (d <= BPM_ANCHORS[0].x) return BPM_ANCHORS[0].y;
  if (d >= BPM_ANCHORS[BPM_ANCHORS.length - 1].x) return 0;

  for (let i = 0; i < BPM_ANCHORS.length - 1; i++) {
    const a = BPM_ANCHORS[i];
    const b = BPM_ANCHORS[i + 1];
    if (d >= a.x && d <= b.x) {
      const dx = b.x - a.x;
      if (dx <= 0) return clamp01(a.y);
      const t = (d - a.x) / dx;
      return clamp01(a.y + t * (b.y - a.y));
    }
  }

  return 0;
}
