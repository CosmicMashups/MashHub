import { useState, useEffect, useRef } from 'react';
import { extractImageColors, createGradientFromColors, FALLBACK_COLORS } from '../utils/imageColorExtractor';

// Cache for extracted colors by image URL
const colorCache = new Map<string, string[]>();

/**
 * Hook to extract colors from an image and create a gradient
 * 
 * @param imageUrl - URL of the image to extract colors from
 * @param enabled - Whether color extraction is enabled (default: true)
 * @returns Object with gradient string, loading state, and extracted colors
 */
export function useImageColors(imageUrl: string | null, enabled: boolean = true) {
  const [gradient, setGradient] = useState<string>('');
  const [colors, setColors] = useState<string[]>(FALLBACK_COLORS);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => 
    document.documentElement.classList.contains('dark')
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const idleCallbackRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  
  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Reset if disabled or no image URL
    if (!enabled || !imageUrl) {
      // Cancel any scheduled extraction work
      if (idleCallbackRef.current !== null) {
        // requestIdleCallback isn't available in all environments
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        if (typeof w.cancelIdleCallback === 'function') {
          w.cancelIdleCallback(idleCallbackRef.current);
        }
        idleCallbackRef.current = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Abort any in-flight extraction
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      setGradient('');
      setColors(FALLBACK_COLORS);
      setLoading(false);
      return;
    }

    // Check cache first
    const cachedColors = colorCache.get(imageUrl);
    if (cachedColors) {
      setColors(cachedColors);
      setGradient(createGradientFromColors(cachedColors, isDarkMode));
      setLoading(false);
      return;
    }

    // Extract colors
    setLoading(true);
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const extractColors = async () => {
      try {
        const extractedColors = await extractImageColors(imageUrl, 3, abortController.signal);
        
        // Check if aborted
        if (abortController.signal.aborted) {
          return;
        }

        // Cache the colors
        colorCache.set(imageUrl, extractedColors);
        
        // Update state
        setColors(extractedColors);
        setGradient(createGradientFromColors(extractedColors, isDarkMode));
        setLoading(false);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.warn('Failed to extract image colors:', error);
          setColors(FALLBACK_COLORS);
          setGradient(createGradientFromColors(FALLBACK_COLORS, isDarkMode));
          setLoading(false);
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    };

    // Defer expensive work off the critical interaction path so closing the dialog is instant.
    // Prefer requestIdleCallback when available; fall back to a short timeout.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
      idleCallbackRef.current = w.requestIdleCallback(() => {
        idleCallbackRef.current = null;
        void extractColors();
      }, { timeout: 1000 });
    } else {
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        void extractColors();
      }, 0);
    }

    // Cleanup
    return () => {
      if (idleCallbackRef.current !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ww = window as any;
        if (typeof ww.cancelIdleCallback === 'function') {
          ww.cancelIdleCallback(idleCallbackRef.current);
        }
        idleCallbackRef.current = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [imageUrl, enabled, isDarkMode]);

  return { gradient, colors, loading };
}
