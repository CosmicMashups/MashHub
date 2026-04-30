export const loadingDurations = {
  fast: 0.24,
  medium: 0.48,
  slow: 0.9,
  loop: 1.8,
} as const;

export const loadingEase = {
  smooth: [0.22, 1, 0.36, 1] as const,
  pulse: [0.4, 0, 0.2, 1] as const,
} as const;

export const loadingStagger = {
  tight: 0.06,
  relaxed: 0.12,
} as const;
