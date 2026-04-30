import { useEffect, useState } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';

export function useTheme() {
  return useThemeContext();
}

/**
 * Returns whether the app is in dark mode (based on document.documentElement class).
 * Updates when the theme is toggled (class change).
 */
export function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return true;
    if (document.documentElement.classList.contains('dark')) return true;
    if (document.documentElement.classList.contains('light')) return false;
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}