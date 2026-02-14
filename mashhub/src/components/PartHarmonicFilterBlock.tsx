import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import type { PartHarmonicFilterBlock, HarmonicMode } from '../types';
import { enforceBpmExclusivity, enforceKeyExclusivity, hasHarmonicValues, isFilterBlockComplete } from '../utils/filterState';
import { BPMFilterDropdown } from './BPMFilterDropdown';
import { KeyFilterDropdown } from './KeyFilterDropdown';

interface PartHarmonicFilterBlockProps {
  block: PartHarmonicFilterBlock;
  index: number;
  availableParts: string[];
  onChange: (block: PartHarmonicFilterBlock) => void;
  onDelete: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const COMMON_PARTS = ['Verse', 'Chorus', 'Bridge', 'Intro', 'Outro', 'Pre-Chorus'];

export function PartHarmonicFilterBlock({
  block,
  index,
  availableParts,
  onChange,
  onDelete,
  isCollapsed = false,
  onToggleCollapse
}: PartHarmonicFilterBlockProps) {
  const [localPart, setLocalPart] = useState(block.part || '');
  const [localBpm, setLocalBpm] = useState<HarmonicMode>(block.bpm || { mode: null });
  const [localKey, setLocalKey] = useState<HarmonicMode>(block.key || { mode: null });

  const allParts = [...new Set([...COMMON_PARTS, ...availableParts])].sort();
  const isComplete = isFilterBlockComplete({ part: localPart, bpm: localBpm, key: localKey });
  const hasAnyValue = localPart || hasHarmonicValues(localBpm) || hasHarmonicValues(localKey);

  const handlePartChange = (part: string) => {
    setLocalPart(part);
    onChange({ part, bpm: localBpm, key: localKey });
  };

  const handleBpmChange = (bpm: HarmonicMode) => {
    setLocalBpm(bpm);
    onChange({ part: localPart, bpm, key: localKey });
  };

  const handleKeyChange = (key: HarmonicMode) => {
    setLocalKey(key);
    onChange({ part: localPart, bpm: localBpm, key });
  };

  const handleBpmClear = () => {
    const cleared = { mode: null };
    setLocalBpm(cleared);
    onChange({ part: localPart, bpm: cleared, key: localKey });
  };

  const handleKeyClear = () => {
    const cleared = { mode: null };
    setLocalKey(cleared);
    onChange({ part: localPart, bpm: localBpm, key: cleared });
  };

  return (
    <div className={`border rounded-lg p-4 ${isComplete ? 'border-primary-300 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-900/10' : hasAnyValue ? 'border-yellow-300 bg-yellow-50/50 dark:border-yellow-700 dark:bg-yellow-900/10' : 'border-gray-300 dark:border-gray-600'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Filter Block {index + 1}
          </h4>
          {!isComplete && hasAnyValue && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">Incomplete</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            aria-label="Delete filter block"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-4">
          {/* PART Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              PART <span className="text-red-500">*</span>
            </label>
            <select
              value={localPart}
              onChange={(e) => handlePartChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300"
            >
              <option value="">Select PART...</option>
              {allParts.map(part => (
                <option key={part} value={part}>{part}</option>
              ))}
            </select>
          </div>

          {/* BPM Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              BPM Filter (Optional)
            </label>
            <BPMFilterDropdown
              value={localBpm}
              onChange={handleBpmChange}
              onClear={handleBpmClear}
            />
          </div>

          {/* Key Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Key Filter (Optional)
            </label>
            <KeyFilterDropdown
              value={localKey}
              onChange={handleKeyChange}
              onClear={handleKeyClear}
            />
          </div>

          {!isComplete && hasAnyValue && (
            <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
              Please select a PART and at least one harmonic constraint (BPM or Key).
            </div>
          )}
        </div>
      )}
    </div>
  );
}
