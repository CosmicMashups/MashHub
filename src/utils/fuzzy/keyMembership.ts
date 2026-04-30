type Anchor = { x: number; y: number };

const KEY_ANCHORS: readonly Anchor[] = [
  { x: 0, y: 1.0 },
  { x: 1, y: 0.95 },
  { x: 2, y: 0.9 },
  { x: 3, y: 0.8 },
  { x: 6, y: 0.0 },
];

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Discrete key-distance membership with linear interpolation between anchors.
 * Anchor rules: 0->1.0, 1->0.95, 2->0.9, 3->0.8, 6->0.0.
 */
export function getKeyMembership(distance: number): number {
  if (!Number.isFinite(distance)) return 0;
  const d = Math.max(0, distance);

  if (d <= KEY_ANCHORS[0].x) return KEY_ANCHORS[0].y;
  if (d >= KEY_ANCHORS[KEY_ANCHORS.length - 1].x) return 0;

  for (let i = 0; i < KEY_ANCHORS.length - 1; i++) {
    const a = KEY_ANCHORS[i];
    const b = KEY_ANCHORS[i + 1];
    if (d >= a.x && d <= b.x) {
      const dx = b.x - a.x;
      if (dx <= 0) return clamp01(a.y);
      const t = (d - a.x) / dx;
      return clamp01(a.y + t * (b.y - a.y));
    }
  }

  return 0;
}
