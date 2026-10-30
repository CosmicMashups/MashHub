import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarAction {
  label: string;
  onClick: () => void;
}

export interface SnackbarOptions {
  type?: SnackbarType;
  duration?: number;
  action?: SnackbarAction;
}

export interface SnackbarItem {
  id: string;
  type: SnackbarType;
  message: React.ReactNode;
  action?: SnackbarAction;
  duration: number;
}

interface SnackbarContextValue {
  showSnackbar: (message: React.ReactNode, options?: SnackbarOptions) => string;
  showSuccess: (message: React.ReactNode, options?: Omit<SnackbarOptions, 'type'>) => string;
  showError: (message: React.ReactNode, options?: Omit<SnackbarOptions, 'type'>) => string;
  showWarning: (message: React.ReactNode, options?: Omit<SnackbarOptions, 'type'>) => string;
  showInfo: (message: React.ReactNode, options?: Omit<SnackbarOptions, 'type'>) => string;
  dismissSnackbar: (id: string) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const noopSnackbar: SnackbarContextValue = {
  showSnackbar: () => '',
  showSuccess: () => '',
  showError: () => '',
  showWarning: () => '',
  showInfo: () => '',
  dismissSnackbar: () => {},
};

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  return context || noopSnackbar;
}

const DEFAULT_DURATIONS: Record<SnackbarType, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6500,
};

const ICONS: Record<SnackbarType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
};

const BORDER_STYLES: Record<SnackbarType, string> = {
  success: 'border-emerald-500/30 dark:border-emerald-500/20 shadow-emerald-500/10',
  error: 'border-rose-500/30 dark:border-rose-500/20 shadow-rose-500/10',
  warning: 'border-amber-500/30 dark:border-amber-500/20 shadow-amber-500/10',
  info: 'border-sky-500/30 dark:border-sky-500/20 shadow-sky-500/10',
};

const ICON_BG_STYLES: Record<SnackbarType, string> = {
  success: 'bg-emerald-500/10 border-emerald-500/20',
  error: 'bg-rose-500/10 border-rose-500/20',
  warning: 'bg-amber-500/10 border-amber-500/20',
  info: 'bg-sky-500/10 border-sky-500/20',
};

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snackbars, setSnackbars] = useState<SnackbarItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissSnackbar = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setSnackbars((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showSnackbar = useCallback(
    (message: React.ReactNode, options?: SnackbarOptions): string => {
      const type = options?.type || 'info';
      const duration = options?.duration ?? DEFAULT_DURATIONS[type];
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const item: SnackbarItem = {
        id,
        type,
        message,
        action: options?.action,
        duration,
      };

      setSnackbars((prev) => [...prev.slice(-4), item]); // keep at most 5 snackbars

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissSnackbar(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismissSnackbar]
  );

  const showSuccess = useCallback(
    (message: React.ReactNode, options?: Omit<SnackbarOptions, 'type'>) =>
      showSnackbar(message, { ...options, type: 'success' }),
    [showSnackbar]
  );

  const showError = useCallback(
    (message: React.ReactNode, options?: Omit<SnackbarOptions, 'type'>) =>
      showSnackbar(message, { ...options, type: 'error' }),
    [showSnackbar]
  );

  const showWarning = useCallback(
    (message: React.ReactNode, options?: Omit<SnackbarOptions, 'type'>) =>
      showSnackbar(message, { ...options, type: 'warning' }),
    [showSnackbar]
  );

  const showInfo = useCallback(
    (message: React.ReactNode, options?: Omit<SnackbarOptions, 'type'>) =>
      showSnackbar(message, { ...options, type: 'info' }),
    [showSnackbar]
  );

  return (
    <SnackbarContext.Provider
      value={{
        showSnackbar,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        dismissSnackbar,
      }}
    >
      {children}
      {/* Floating Snackbar Container */}
      <aside
        aria-label="Notifications"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-md sm:w-full pointer-events-none"
      >
        {snackbars.map((item) => (
          <div
            key={item.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-theme-surface-elevated/95 dark:bg-[#121620]/95 backdrop-blur-md border shadow-xl text-theme-text-primary transition-all duration-200 animate-fade-in-up ${BORDER_STYLES[item.type]}`}
          >
            <div className={`p-1 rounded-lg border shrink-0 ${ICON_BG_STYLES[item.type]}`}>
              {ICONS[item.type]}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="text-xs sm:text-sm font-medium leading-relaxed break-words">
                {item.message}
              </div>

              {item.action && (
                <button
                  type="button"
                  onClick={() => {
                    item.action?.onClick();
                    dismissSnackbar(item.id);
                  }}
                  className="mt-2 text-xs font-semibold px-2.5 py-1 rounded-md bg-theme-accent-primary/10 hover:bg-theme-accent-primary/20 text-theme-accent-primary border border-theme-accent-primary/30 transition-colors"
                >
                  {item.action.label}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismissSnackbar(item.id)}
              className="p-1 rounded-md text-theme-text-muted hover:text-theme-text-secondary hover:bg-theme-bg-secondary transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </aside>
    </SnackbarContext.Provider>
  );
};
