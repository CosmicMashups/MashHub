import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ProjectSection } from '../types';
import { KEY_OPTIONS_ORDERED } from '../constants';

export interface SectionSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: ProjectSection | null;
  onSave: (section: ProjectSection) => Promise<void>;
}

export function SectionSettingsDialog({
  isOpen,
  onClose,
  section,
  onSave,
}: SectionSettingsDialogProps) {
  const [targetBpm, setTargetBpm] = useState<string>('');
  const [bpmRangeMin, setBpmRangeMin] = useState<string>('');
  const [bpmRangeMax, setBpmRangeMax] = useState<string>('');
  const [targetKey, setTargetKey] = useState<string>('');
  const [keyRangeCamelot, setKeyRangeCamelot] = useState<string>('');
  const [keyRange, setKeyRange] = useState<string[]>([]);

  useEffect(() => {
    if (section) {
      setTargetBpm(section.targetBpm != null ? String(section.targetBpm) : '');
      setBpmRangeMin(section.bpmRangeMin != null ? String(section.bpmRangeMin) : '');
      setBpmRangeMax(section.bpmRangeMax != null ? String(section.bpmRangeMax) : '');
      setTargetKey(section.targetKey ?? '');
      setKeyRangeCamelot(section.keyRangeCamelot != null ? String(section.keyRangeCamelot) : '');
      setKeyRange(section.keyRange ?? []);
    }
  }, [section]);

  const handleSave = async () => {
    if (!section) return;
    const next: ProjectSection = {
      ...section,
      targetBpm: targetBpm.trim() ? Number(targetBpm) : undefined,
      bpmRangeMin: bpmRangeMin.trim() ? Number(bpmRangeMin) : undefined,
      bpmRangeMax: bpmRangeMax.trim() ? Number(bpmRangeMax) : undefined,
      targetKey: targetKey.trim() || undefined,
      keyRangeCamelot: keyRange.length > 0 ? undefined : (keyRangeCamelot.trim() ? Number(keyRangeCamelot) : undefined),
      keyRange: keyRange.length > 0 ? [...keyRange] : undefined,
    };
    await onSave(next);
    onClose();
  };

  if (!isOpen || !section) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Section settings</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BPM target</label>
            <input
              type="number"
              min={1}
              max={300}
              value={targetBpm}
              onChange={(e) => setTargetBpm(e.target.value)}
              placeholder="e.g. 120"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BPM range min</label>
              <input
                type="number"
                min={1}
                max={300}
                value={bpmRangeMin}
                onChange={(e) => setBpmRangeMin(e.target.value)}
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BPM range max</label>
              <input
                type="number"
                min={1}
                max={300}
                value={bpmRangeMax}
                onChange={(e) => setBpmRangeMax(e.target.value)}
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key (target)</label>
            <select
              value={targetKey}
              onChange={(e) => setTargetKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Any</option>
              {KEY_OPTIONS_ORDERED.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Range</label>
            <div className="flex flex-wrap gap-2">
              {KEY_OPTIONS_ORDERED.map((k) => (
                <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keyRange.includes(k)}
                    onChange={(e) => {
                      if (e.target.checked) setKeyRange((prev) => [...prev, k]);
                      else setKeyRange((prev) => prev.filter((x) => x !== k));
                    }}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{k}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="button" onClick={() => void handleSave()} className="btn-primary">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
