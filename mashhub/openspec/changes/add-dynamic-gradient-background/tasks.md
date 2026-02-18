## 1. Research & Setup
- [x] 1.1 Research color extraction libraries (colorthief, node-vibrant, get-image-colors)
- [x] 1.2 Choose library (prefer lightweight, well-maintained) - Using custom Canvas API implementation
- [x] 1.3 Install chosen library via npm - Installed colorthief as backup, using custom implementation

## 2. Color Extraction Utility
- [x] 2.1 Create `src/utils/imageColorExtractor.ts` utility
- [x] 2.2 Implement function to extract dominant colors from image URL
- [x] 2.3 Handle CORS issues (use proxy or handle gracefully)
- [x] 2.4 Return array of 2-3 dominant colors in hex format
- [x] 2.5 Add error handling for failed extractions

## 3. Color Extraction Hook
- [x] 3.1 Create `src/hooks/useImageColors.ts` hook
- [x] 3.2 Hook should accept imageUrl and return gradient colors
- [x] 3.3 Implement caching to avoid re-extraction for same image
- [x] 3.4 Handle loading and error states
- [x] 3.5 Return fallback colors if extraction fails

## 4. Dialog Background Integration
- [x] 4.1 Update SongDetailsModal to use useImageColors hook
- [x] 4.2 Apply dynamic gradient background to dialog container
- [x] 4.3 Ensure gradient doesn't interfere with text readability
- [x] 4.4 Add opacity/overlay if needed for text contrast
- [x] 4.5 Test with both Jikan and Spotify images

## 5. Fallback & Error Handling
- [x] 5.1 Implement fallback to default theme colors
- [x] 5.2 Handle CORS errors gracefully
- [x] 5.3 Handle slow image loading
- [x] 5.4 Ensure dialog remains usable even if extraction fails

## 6. Performance Optimization
- [x] 6.1 Cache extracted colors by image URL
- [x] 6.2 Avoid re-extraction on dialog reopen
- [x] 6.3 Consider debouncing or lazy extraction
- [x] 6.4 Test performance with multiple rapid opens

## 7. Visual Polish
- [x] 7.1 Ensure gradient blends smoothly
- [x] 7.2 Verify text remains readable on all gradients
- [x] 7.3 Test with various image types (bright, dark, colorful, muted)
- [x] 7.4 Add smooth transition when gradient changes

## 8. Testing & Validation
- [x] 8.1 Test with Spotify album covers
- [x] 8.2 Test with Jikan anime posters
- [x] 8.3 Test with missing/failed images
- [x] 8.4 Test in both light and dark modes
- [x] 8.5 Verify no console errors or warnings
