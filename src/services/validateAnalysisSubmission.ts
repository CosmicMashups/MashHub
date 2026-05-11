/**
 * Single source of truth for analysis submission / approval validation.
 * Reuses key normalization (parseable keys) and section name normalization for sanity checks.
 */
import { normalizeKey } from '../utils/keyNormalization';

export type SectionInput = { part: string; bpm: number; key: string; sectionOrder?: number };

export interface SongAnalysisPayload {
  title: string;
  artist: string;
  type: string;
  origin: string;
  season: string;
  year: number;
  notes?: string;
  sections: SectionInput[];
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

function isKeyParseable(key: string): boolean {
  try {
    normalizeKey(key);
    return true;
  } catch {
    return false;
  }
}

export function validateAnalysisSubmission(payload: SongAnalysisPayload): ValidationResult {
  const errors: string[] = [];

  if (!payload.title?.trim()) errors.push('Title is required');
  if (!payload.artist?.trim()) errors.push('Artist is required');

  if (payload.year === 0 || Number.isNaN(payload.year)) {
    errors.push('Year is required');
  } else if (payload.year < 1900 || payload.year > new Date().getFullYear() + 1) {
    errors.push(`Year must be between 1900 and ${new Date().getFullYear() + 1}`);
  }

  const sections = payload.sections ?? [];
  if (sections.length === 0) {
    errors.push('At least one section is required');
  }

  const orders = new Set<number>();
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const order = s.sectionOrder ?? i + 1;
    if (!Number.isInteger(order) || order < 1) {
      errors.push(`Invalid section order at index ${i + 1}`);
    } else if (orders.has(order)) {
      errors.push(`Duplicate section order: ${order}`);
    } else {
      orders.add(order);
    }

    if (!s.part?.trim()) {
      errors.push(`Section ${i + 1}: part name is required`);
    }

    if (typeof s.bpm !== 'number' || Number.isNaN(s.bpm) || s.bpm <= 0 || s.bpm > 999.99) {
      errors.push(`Section ${i + 1}: BPM must be a positive number`);
    }

    if (!s.key?.trim()) {
      errors.push(`Section ${i + 1}: key is required`);
    } else if (!isKeyParseable(s.key.trim())) {
      errors.push(`Section ${i + 1}: key is not a supported chromatic key`);
    }
  }

  return { ok: errors.length === 0, errors };
}
