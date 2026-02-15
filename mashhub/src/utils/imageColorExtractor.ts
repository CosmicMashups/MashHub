/**
 * Image Color Extractor Utility
 * 
 * Extracts dominant colors from images using Canvas API and ColorThief algorithm.
 * Handles CORS issues and provides fallback colors.
 */

// Fallback colors (neutral theme colors)
export const FALLBACK_COLORS = ['#6366f1', '#8b5cf6', '#a855f7']; // Indigo to purple gradient

/**
 * Extracts dominant colors from an image URL
 * @param imageUrl - URL of the image to analyze
 * @param colorCount - Number of colors to extract (default: 3)
 * @returns Promise resolving to array of hex color strings, or fallback colors on error
 */
export async function extractImageColors(
  imageUrl: string | null,
  colorCount: number = 3
): Promise<string[]> {
  if (!imageUrl) {
    return FALLBACK_COLORS;
  }

  try {
    // Load image with CORS handling
    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Create a promise to handle image loading
    const imageLoaded = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Image load timeout')), 5000);
      img.src = imageUrl;
    });

    await imageLoaded;

    // Extract colors using Canvas API
    const colors = extractColorsFromImage(img, colorCount);
    return colors.length > 0 ? colors : FALLBACK_COLORS;
  } catch (error) {
    console.warn('Failed to extract colors from image:', error);
    return FALLBACK_COLORS;
  }
}

/**
 * Extracts dominant colors from an image element using Canvas API
 * Implements a simplified ColorThief-like algorithm
 */
function extractColorsFromImage(img: HTMLImageElement, colorCount: number): string[] {
  try {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return FALLBACK_COLORS;
    }

    // Set canvas size (smaller for performance)
    const maxSize = 150;
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    // Draw image to canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Quantize colors using a simplified approach
    const colorMap = new Map<string, number>();
    const step = 4; // Sample every 4th pixel for performance

    for (let i = 0; i < pixels.length; i += step * 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      // Skip transparent pixels
      if (a < 128) continue;

      // Quantize to reduce color space (group similar colors)
      const quantizedR = Math.floor(r / 32) * 32;
      const quantizedG = Math.floor(g / 32) * 32;
      const quantizedB = Math.floor(b / 32) * 32;
      const key = `${quantizedR},${quantizedG},${quantizedB}`;

      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }

    // Sort by frequency and get top colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, colorCount)
      .map(([key]) => {
        const [r, g, b] = key.split(',').map(Number);
        return rgbToHex(r, g, b);
      });

    // Ensure we have enough colors (duplicate if needed)
    while (sortedColors.length < colorCount) {
      sortedColors.push(sortedColors[sortedColors.length - 1] || FALLBACK_COLORS[0]);
    }

    return sortedColors;
  } catch (error) {
    console.warn('Error extracting colors from canvas:', error);
    return FALLBACK_COLORS;
  }
}

/**
 * Converts RGB values to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Blends a color with theme background color
 * @param color - Hex color to blend
 * @param isDarkMode - Whether dark mode is active
 * @param blendRatio - Ratio of theme color (0-1, default 0.3 = 30% theme, 70% extracted)
 * @returns Blended hex color
 */
export function blendWithTheme(
  color: string,
  isDarkMode: boolean = false,
  blendRatio: number = 0.3
): string {
  // Theme background colors
  const themeLight = '#ffffff'; // white
  const themeDark = '#1e293b'; // gray-800
  
  const themeColor = isDarkMode ? themeDark : themeLight;
  
  // Parse hex colors to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };
  
  const colorRgb = hexToRgb(color);
  const themeRgb = hexToRgb(themeColor);
  
  if (!colorRgb || !themeRgb) return color;
  
  // Blend colors
  const r = Math.round(colorRgb.r * (1 - blendRatio) + themeRgb.r * blendRatio);
  const g = Math.round(colorRgb.g * (1 - blendRatio) + themeRgb.g * blendRatio);
  const b = Math.round(colorRgb.b * (1 - blendRatio) + themeRgb.b * blendRatio);
  
  return rgbToHex(r, g, b);
}

/**
 * Creates a CSS gradient string from color array, blended with theme colors
 */
export function createGradientFromColors(colors: string[], isDarkMode: boolean = false): string {
  if (colors.length === 0) {
    return `linear-gradient(135deg, ${FALLBACK_COLORS[0]}, ${FALLBACK_COLORS[1]})`;
  }

  // Blend colors with theme for better integration
  const blendedColors = colors.map(color => blendWithTheme(color, isDarkMode, 0.25));

  if (blendedColors.length === 1) {
    return `linear-gradient(135deg, ${blendedColors[0]}, ${blendedColors[0]})`;
  }

  // Create gradient with multiple color stops
  const gradientStops = blendedColors.map((color, index) => {
    const position = (index / (blendedColors.length - 1)) * 100;
    return `${color} ${position}%`;
  }).join(', ');

  return `linear-gradient(135deg, ${gradientStops})`;
}
