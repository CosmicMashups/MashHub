import { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';

export interface EntryNotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
  initialValue: string;
  onSave: (notes: string) => void;
}

export function EntryNotesDialog({
  isOpen,
  onClose,
  songTitle,
  initialValue,
  onSave,
}: EntryNotesDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

  const handleSave = () => {
    onSave(value.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="bg-theme-surface-base border border-theme-border-default rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-theme-border-default">
          <h3 className="text-lg font-semibold text-theme-text-primary">Notes – {songTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-theme-text-muted hover:text-theme-text-secondary rounded"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add notes for this song in the section..."
            className="w-full px-3 py-2 border border-theme-border-default rounded-lg bg-theme-surface-base text-theme-text-primary placeholder-theme-text-muted min-h-[120px] resize-y focus:ring-2 focus:ring-theme-state-focus focus:border-transparent"
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-theme-border-default">
          <button type="button" onClick={onClose} className="btn-secondary inline-flex items-center gap-2">
            <RotateCcw size={16} className="text-gray-500" />
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="btn-primary inline-flex items-center gap-2">
            <Save size={16} className="text-white" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
