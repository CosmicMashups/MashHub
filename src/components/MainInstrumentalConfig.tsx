import { useMemo, useState, useEffect } from 'react';
import type { Project, Song } from '../types';
import { InstrumentalSongSelector } from './InstrumentalSongSelector';
import { FloatingInput } from './inputs/FloatingInput';
import { GroupedKeyPicker } from './GroupedKeyPicker';

export interface MainInstrumentalConfigProps {
  songs: Song[];
  mainInstrumentalSongId?: string;
  mainInstrumentalSongName?: string;
  acceptedKeys?: string[];
  bpmRangeMin?: number;
  bpmRangeMax?: number;
  /** True when `mainInstrumentalSongId` is set but the song is not in `songs`. */
  instrumentalNotFound?: boolean;
  onChange: (
    patch: Partial<
      Pick<
        Project,
        | 'mainInstrumentalSongId'
        | 'mainInstrumentalSongName'
        | 'acceptedKeys'
        | 'bpmRangeMin'
        | 'bpmRangeMax'
      >
    >
  ) => void;
}

function parseOptionalPositiveInt(raw: string): number | undefined {
  const t = raw.trim();
  if (t === '') return undefined;
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n < 1 || n > 300) return undefined;
  return n;
}

export function MainInstrumentalConfig({
  songs,
  mainInstrumentalSongId,
  mainInstrumentalSongName,
  acceptedKeys,
  bpmRangeMin,
  bpmRangeMax,
  instrumentalNotFound,
  onChange,
}: MainInstrumentalConfigProps) {
  const [manualMode, setManualMode] = useState(() => Boolean(mainInstrumentalSongName && !mainInstrumentalSongId));

  useEffect(() => {
    if (mainInstrumentalSongId) setManualMode(false);
  }, [mainInstrumentalSongId]);

  const [bpmMinRaw, setBpmMinRaw] = useState(() => (bpmRangeMin != null ? String(bpmRangeMin) : ''));
  const [bpmMaxRaw, setBpmMaxRaw] = useState(() => (bpmRangeMax != null ? String(bpmRangeMax) : ''));

  useEffect(() => {
    setBpmMinRaw(bpmRangeMin != null ? String(bpmRangeMin) : '');
  }, [bpmRangeMin]);
  useEffect(() => {
    setBpmMaxRaw(bpmRangeMax != null ? String(bpmRangeMax) : '');
  }, [bpmRangeMax]);

  const bpmMinErr = useMemo(() => {
    const t = bpmMinRaw.trim();
    if (t === '') return null;
    const n = Number.parseInt(t, 10);
    if (!Number.isFinite(n) || n < 1) return 'BPM must be a positive value';
    if (n > 300) return 'BPM must be between 1 and 300';
    return null;
  }, [bpmMinRaw]);

  const bpmMaxErr = useMemo(() => {
    const t = bpmMaxRaw.trim();
    if (t === '') return null;
    const n = Number.parseInt(t, 10);
    if (!Number.isFinite(n) || n < 1) return 'BPM must be a positive value';
    if (n > 300) return 'BPM must be between 1 and 300';
    const minN = parseOptionalPositiveInt(bpmMinRaw);
    if (minN != null && n < minN) return 'BPM Max must be greater than or equal to BPM Min';
    return null;
  }, [bpmMaxRaw, bpmMinRaw]);

  const effectiveKeys = acceptedKeys && acceptedKeys.length > 0 ? acceptedKeys : undefined;

  const configured = useMemo(() => {
    return Boolean(
      mainInstrumentalSongName?.trim() ||
        mainInstrumentalSongId ||
        effectiveKeys ||
        bpmRangeMin != null ||
        bpmRangeMax != null
    );
  }, [mainInstrumentalSongId, mainInstrumentalSongName, effectiveKeys, bpmRangeMin, bpmRangeMax]);

  const summarySong =
    instrumentalNotFound && mainInstrumentalSongId
      ? 'Referenced instrumental not found in library'
      : mainInstrumentalSongName?.trim() || 'Any';
  const summaryKeys =
    effectiveKeys && effectiveKeys.length > 0 ? effectiveKeys.join(', ') : 'Any';
  const summaryBpm =
    bpmRangeMin != null && bpmRangeMax != null
      ? `${bpmRangeMin}–${bpmRangeMax}`
      : bpmRangeMin != null
        ? `${bpmRangeMin}+`
        : bpmRangeMax != null
          ? `up to ${bpmRangeMax}`
          : 'Any';

  const propagateBpmMin = (raw: string) => {
    setBpmMinRaw(raw);
    const t = raw.trim();
    if (t === '') {
      onChange({ bpmRangeMin: undefined });
      return;
    }
    const n = Number.parseInt(t, 10);
    if (!Number.isFinite(n) || n < 1 || n > 300) return;
    const maxN = parseOptionalPositiveInt(bpmMaxRaw);
    if (maxN != null && maxN < n) return;
    onChange({ bpmRangeMin: n });
  };

  const propagateBpmMax = (raw: string) => {
    setBpmMaxRaw(raw);
    const t = raw.trim();
    if (t === '') {
      onChange({ bpmRangeMax: undefined });
      return;
    }
    const n = Number.parseInt(t, 10);
    if (!Number.isFinite(n) || n < 1 || n > 300) return;
    const minN = parseOptionalPositiveInt(bpmMinRaw);
    if (minN != null && n < minN) return;
    onChange({ bpmRangeMax: n });
  };

  return (
    <div className="space-y-6 border border-gray-200 dark:border-gray-600 rounded-xl p-4 md:p-5 bg-white/50 dark:bg-gray-900/30">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Main Instrumental Configuration</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Define the harmonic profile of your megamix. Suggestions will be ranked by compatibility with this
          instrumental.
        </p>
      </div>

      {configured && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/80 px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
          <span className="font-medium">Summary: </span>
          {summarySong} • Keys: {summaryKeys} • BPM: {summaryBpm}
        </div>
      )}

      {instrumentalNotFound && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Referenced instrumental not found in library
        </p>
      )}

      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Main instrumental song</p>
        <InstrumentalSongSelector
          songs={songs}
          selectedSongId={mainInstrumentalSongId}
          selectedSongName={mainInstrumentalSongName}
          onSelect={(songId, songName) => {
            setManualMode(false);
            onChange({ mainInstrumentalSongId: songId, mainInstrumentalSongName: songName });
          }}
          onClearSelection={() => onChange({ mainInstrumentalSongId: undefined, mainInstrumentalSongName: undefined })}
          onManualEntry={(name) => onChange({ mainInstrumentalSongName: name, mainInstrumentalSongId: undefined })}
          isManualMode={manualMode}
          onToggleManualMode={() => {
            setManualMode((m) => !m);
            if (!manualMode) {
              onChange({ mainInstrumentalSongId: undefined });
            }
          }}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Accepted keys</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Leave none selected to allow any key (same as no filter).
        </p>
        <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 p-2">
          <GroupedKeyPicker
            value={acceptedKeys ?? []}
            onChange={(next) => onChange({ acceptedKeys: next.length > 0 ? next : undefined })}
            showEquivalentMajor={false}
          />
        </div>
        {effectiveKeys && (
          <button
            type="button"
            onClick={() => onChange({ acceptedKeys: undefined })}
            className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          >
            Clear all keys
          </button>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">BPM range</p>
        <div className="flex flex-wrap gap-4 items-start">
          <div className="min-w-[8rem] flex-1">
            <FloatingInput
              label="BPM Min"
              type="text"
              inputMode="numeric"
              value={bpmMinRaw}
              onChange={(e) => propagateBpmMin(e.target.value)}
            />
            {bpmMinErr && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{bpmMinErr}</p>}
          </div>
          <div className="min-w-[8rem] flex-1">
            <FloatingInput
              label="BPM Max"
              type="text"
              inputMode="numeric"
              value={bpmMaxRaw}
              onChange={(e) => propagateBpmMax(e.target.value)}
            />
            {bpmMaxErr && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{bpmMaxErr}</p>}
          </div>
        </div>
      </div>

      {!configured && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No instrumental configured. Suggestions will use section-level constraints only.
        </p>
      )}
    </div>
  );
}
