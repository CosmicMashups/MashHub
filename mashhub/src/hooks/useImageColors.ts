import { useState, useEffect, useRef } from 'react';
import { extractImageColors, createGradientFromColors, FALLBACK_COLORS, blendWithTheme } from '../utils/imageColorExtractor';

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
        const extractedColors = await extractImageColors(imageUrl, 3);
        
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

    extractColors();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [imageUrl, enabled, isDarkMode]);

  return { gradient, colors, loading };
}
