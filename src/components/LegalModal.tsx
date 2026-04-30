import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  title: string;
  content: ReactNode;
  onClose: () => void;
}

export function LegalModal({ isOpen, title, content, onClose }: LegalModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-theme-border-default">
          <h2 className="text-lg font-semibold text-theme-text-primary">{title}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded hover:bg-theme-state-hover" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-theme-text-secondary">
          {content}
        </div>
      </div>
    </div>
  );
}
