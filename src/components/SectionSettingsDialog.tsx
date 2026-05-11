import { useState, useEffect, useRef } from 'react';
import { X, Tag, Gauge, Music, Save, RotateCcw, Settings, ChevronDown } from 'lucide-react';
import type { ProjectSection } from '../types';
import { canonicalizeKeyString } from '../utils/keyNormalization';
import { FloatingInput } from './inputs';
import { GroupedKeyPicker, GroupedKeySelect } from './GroupedKeyPicker';

function loadKeyFromStorage(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  return canonicalizeKeyString(t) ?? t;
}

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
  const [sectionName, setSectionName] = useState<string>('');
  const [keyRangeOpen, setKeyRangeOpen] = useState(false);
  const keyRangeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (section) {
      setSectionName(section.name ?? '');
      setTargetBpm(section.targetBpm != null ? String(section.targetBpm) : '');
      setBpmRangeMin(section.bpmRangeMin != null ? String(section.bpmRangeMin) : '');
      setBpmRangeMax(section.bpmRangeMax != null ? String(section.bpmRangeMax) : '');
      setTargetKey(section.targetKey ? loadKeyFromStorage(section.targetKey) : '');
      setKeyRangeCamelot(section.keyRangeCamelot != null ? String(section.keyRangeCamelot) : '');
      setKeyRange((section.keyRange ?? []).map(loadKeyFromStorage));
    }
  }, [section]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (keyRangeDropdownRef.current && !keyRangeDropdownRef.current.contains(event.target as Node)) {
        setKeyRangeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const keyRangeDisplayText = keyRange.length === 0
    ? 'Select keys...'
    : keyRange.length === 1
      ? keyRange[0]
      : `${keyRange.length} keys selected`;

  const handleSave = async () => {
    if (!section) return;
    const next: ProjectSection = {
      ...section,
      name: sectionName.trim() || section.name,
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings size={20} className="text-violet-500" />
            Section: Settings
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <FloatingInput
              label="Section Name"
              type="text"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="e.g. Intro, Chorus"
              icon={<Tag size={14} className="text-amber-500" />}
            />
          </div>
          <div>
            <FloatingInput
              label="BPM"
              type="number"
              min={1}
              max={300}
              value={targetBpm}
              onChange={(e) => setTargetBpm(e.target.value)}
              placeholder="e.g. 120"
              icon={<Gauge size={14} className="text-blue-500" />}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FloatingInput
                label="BPM (Min.)"
                type="number"
                min={1}
                max={300}
                value={bpmRangeMin}
                onChange={(e) => setBpmRangeMin(e.target.value)}
                placeholder="Min"
                icon={<Gauge size={12} className="text-blue-400" />}
              />
            </div>
            <div>
              <FloatingInput
                label="BPM (Max.)"
                type="number"
                min={1}
                max={300}
                value={bpmRangeMax}
                onChange={(e) => setBpmRangeMax(e.target.value)}
                placeholder="Max"
                icon={<Gauge size={12} className="text-blue-400" />}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
              <Music size={14} className="text-emerald-500" />
              Key
            </label>
            <GroupedKeySelect
              value={targetKey}
              onChange={setTargetKey}
              allowEmptyOption
              emptyLabel="Any"
              className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
            />
          </div>
          <div className="relative" ref={keyRangeDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Key Range
            </label>
            <button
              type="button"
              onClick={() => setKeyRangeOpen(!keyRangeOpen)}
              className={`flex items-center justify-between gap-2 w-full px-3 py-2 border rounded-md text-sm font-medium transition-colors text-left ${
                keyRange.length > 0
                  ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-300'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              aria-expanded={keyRangeOpen}
              aria-haspopup="listbox"
            >
              <span>{keyRangeDisplayText}</span>
              <ChevronDown size={16} className={`shrink-0 ${keyRangeOpen ? 'rotate-180' : ''}`} />
            </button>
            {keyRangeOpen && (
              <div
                className="absolute z-50 mt-1 w-full max-h-[min(24rem,70vh)] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3"
                role="listbox"
              >
                <GroupedKeyPicker value={keyRange} onChange={setKeyRange} showEquivalentMajor />
                {keyRange.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setKeyRange([])}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary inline-flex items-center gap-2">
              <RotateCcw size={16} className="text-gray-500" />
              Cancel
            </button>
            <button type="button" onClick={() => void handleSave()} className="btn-primary inline-flex items-center gap-2">
              <Save size={16} className="text-white" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
