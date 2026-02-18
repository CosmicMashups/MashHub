import { useState, useEffect } from 'react';

/**
 * Hook to detect if a media query matches
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    
    // Set initial value
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [matches, query]);

  return matches;
}

/**
 * Hook to detect if the screen is mobile (≤640px)
 */
export const useIsMobile = () => useMediaQuery('(max-width: 640px)');

/**
 * Hook to detect if the screen is tablet (641px - 1023px)
 */
export const useIsTablet = () => useMediaQuery('(min-width: 641px) and (max-width: 1023px)');

/**
 * Hook to detect if the screen is desktop (≥1024px)
 */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
