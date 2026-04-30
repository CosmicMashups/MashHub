import { AlertTriangle, X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Sheet, SheetContent } from './Sheet';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isMobile = useIsMobile();
  if (!isOpen) return null;

  const content = (
    <>
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-theme-border-default">
        <h3 className="text-lg font-semibold text-theme-text-primary flex items-center gap-2">
          <AlertTriangle size={18} className={destructive ? 'text-red-500' : 'text-amber-500'} />
          {title}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-md text-theme-text-muted hover:text-theme-text-secondary hover:bg-theme-state-hover"
          aria-label="Close confirmation dialog"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-4 md:p-6">
        <p className="text-sm text-theme-text-secondary">{message}</p>
      </div>
      <div className="flex justify-end gap-2 p-4 md:p-6 border-t border-theme-border-default bg-theme-bg-secondary">
        <button type="button" onClick={onCancel} className="btn-secondary">
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={destructive ? 'px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors' : 'btn-primary'}
        >
          {confirmText}
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => (!open ? onCancel() : undefined)}>
        <SheetContent side="bottom" className="p-0">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
}
