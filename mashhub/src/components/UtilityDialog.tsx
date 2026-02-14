import { useEffect, useRef } from 'react';
import { X, Upload, Download, Database, Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface UtilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  songsCount: number;
  projectsCount: number;
  onImport: () => void;
  onExport: () => void;
  onReloadCsv: () => void;
}

export function UtilityDialog({
  isOpen,
  onClose,
  songsCount,
  projectsCount,
  onImport,
  onExport,
  onReloadCsv
}: UtilityDialogProps) {
  const { theme, toggleTheme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap - focus first focusable element when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="utility-dialog-title"
    >
      <div
        ref={modalRef}
        className="modal-content max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border-default">
          <h2 id="utility-dialog-title" className="text-xl font-semibold text-theme-text-primary">
            Utilities
          </h2>
          <button
            onClick={onClose}
            className="text-theme-text-muted hover:text-theme-text-secondary transition-colors"
            aria-label="Close utilities dialog"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Analytics Section */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 text-theme-text-secondary">
              Analytics
            </h3>
            <div className="bg-theme-bg-secondary rounded-lg p-4">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <Database size={16} className="text-music-electric" />
                  <span className="text-sm text-theme-text-secondary">{songsCount}</span>
                  <span className="text-xs text-theme-text-muted">songs</span>
                </div>
                <div className="w-px h-6 bg-theme-border-default"></div>
                <div className="flex items-center space-x-2">
                  <Activity size={16} className="text-music-wave" />
                  <span className="text-sm text-theme-text-secondary">{projectsCount}</span>
                  <span className="text-xs text-theme-text-muted">projects</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Management Section */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 text-theme-text-secondary">
              Data Management
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  onImport();
                  onClose();
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-theme-text-secondary hover:bg-theme-state-hover rounded-lg transition-colors"
              >
                <Upload size={16} className="mr-3" />
                Import
              </button>
              <button
                onClick={() => {
                  onExport();
                  onClose();
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-theme-text-secondary hover:bg-theme-state-hover rounded-lg transition-colors"
              >
                <Download size={16} className="mr-3" />
                Export
              </button>
              <button
                onClick={() => {
                  onReloadCsv();
                  onClose();
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-theme-text-secondary hover:bg-theme-state-hover rounded-lg transition-colors"
              >
                <Database size={16} className="mr-3" />
                Reload CSV
              </button>
            </div>
          </div>

          {/* Display Settings Section */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 text-theme-text-secondary">
              Display Settings
            </h3>
            <div className="bg-theme-bg-secondary rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {theme === 'light' ? (
                    <Sun size={16} className="text-theme-text-secondary" />
                  ) : (
                    <Moon size={16} className="text-theme-text-secondary" />
                  )}
                  <span className="text-sm text-theme-text-secondary">
                    {theme === 'light' ? 'Light' : 'Dark'} Mode
                  </span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="relative p-2 rounded-lg bg-theme-surface-base text-theme-text-secondary hover:bg-theme-state-hover border border-theme-border-default transition-all duration-200"
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  <div className="relative w-5 h-5">
                    <Sun
                      size={16}
                      className={`absolute inset-0 transition-all duration-300 ${
                        theme === 'light'
                          ? 'opacity-100 rotate-0 scale-100'
                          : 'opacity-0 rotate-90 scale-75'
                      }`}
                    />
                    <Moon
                      size={16}
                      className={`absolute inset-0 transition-all duration-300 ${
                        theme === 'dark'
                          ? 'opacity-100 rotate-0 scale-100'
                          : 'opacity-0 -rotate-90 scale-75'
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
