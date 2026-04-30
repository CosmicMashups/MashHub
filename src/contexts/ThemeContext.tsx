import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { theme as themeTokens } from '../theme/colors';

export type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveInitialTheme(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeClass(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

function applyThemeVariables(mode: ThemeMode) {
  const tokens = themeTokens[mode];
  const root = document.documentElement.style;
  root.setProperty('--theme-bg-primary', tokens.background.primary);
  root.setProperty('--theme-bg-secondary', tokens.background.secondary);
  root.setProperty('--theme-bg-tertiary', tokens.background.tertiary);
  root.setProperty('--theme-surface-base', tokens.surface.base);
  root.setProperty('--theme-surface-elevated', tokens.surface.elevated);
  root.setProperty('--theme-surface-hover', tokens.surface.hover);
  root.setProperty('--theme-surface-selected', tokens.surface.selected);
  root.setProperty('--theme-overlay', tokens.surface.overlay);
  root.setProperty('--theme-text-primary', tokens.text.primary);
  root.setProperty('--theme-text-secondary', tokens.text.secondary);
  root.setProperty('--theme-text-muted', tokens.text.tertiary);
  root.setProperty('--theme-text-disabled', tokens.text.disabled);
  root.setProperty('--theme-text-inverse', tokens.text.inverse);
  root.setProperty('--theme-border-subtle', tokens.border.subtle);
  root.setProperty('--theme-border-default', tokens.border.default);
  root.setProperty('--theme-border-strong', tokens.border.strong);
  root.setProperty('--theme-border-focus', tokens.border.focus);
  root.setProperty('--theme-accent-primary', tokens.accent.primary);
  root.setProperty('--theme-accent-secondary', tokens.accent.soft);
  root.setProperty('--theme-accent-success', tokens.state.success);
  root.setProperty('--theme-accent-danger', tokens.state.danger);
  root.setProperty('--theme-accent-warning', tokens.state.warning);
  root.setProperty('--theme-accent-hover', tokens.accent.hover);
  root.setProperty('--theme-accent-soft', tokens.accent.soft);
  root.setProperty('--theme-accent-contrast', tokens.accent.contrast);
  root.setProperty('--theme-state-success', tokens.state.success);
  root.setProperty('--theme-state-warning', tokens.state.warning);
  root.setProperty('--theme-state-danger', tokens.state.danger);
  root.setProperty('--theme-state-info', tokens.state.info);
  root.setProperty('--theme-state-hover', tokens.state.hover);
  root.setProperty('--theme-state-active', tokens.state.active);
  root.setProperty('--theme-state-disabled', tokens.state.disabled);
  root.setProperty('--theme-focus-ring', tokens.fx.focusRing);
  root.setProperty('--theme-shadow-card', tokens.fx.cardShadow);
  root.setProperty('--theme-shadow-modal', tokens.fx.modalShadow);
  root.setProperty('--theme-glow-accent', tokens.fx.accentGlow);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => resolveInitialTheme());

  useEffect(() => {
    applyThemeClass(theme);
    applyThemeVariables(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
