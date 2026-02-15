/**
 * Section normalization utilities for hierarchical section grouping.
 * 
 * This module provides functions to normalize section names into base sections,
 * enabling musically logical matching between related section variations.
 * For example, "Verse A", "Verse B", and "Verse" all normalize to "Verse".
 */

/**
 * Base section types representing standard song structure sections.
 * All section name variations map to one of these base sections.
 */
export type BaseSection = "Intro" | "Verse" | "Prechorus" | "Chorus" | "Bridge" | "Other";

/**
 * Section grouping map defining hierarchical relationships.
 * Each base section maps to an array of section name variations that belong to it.
 * 
 * Grouping rules:
 * - Intro group: All intro-related sections (Intro, Intro 1, Intro Drop, etc.)
 * - Verse group: All verse-related sections (Verse, Verse A, Verse B, etc.)
 * - Prechorus group: All prechorus-related sections
 * - Chorus group: All chorus-related sections (Chorus, Last Chorus, Postchorus, etc.)
 * - Bridge group: Bridge sections
 * - Other: Any section not matching the above groups
 */
const SECTION_GROUPS: Record<BaseSection, string[]> = {
  Intro: [
    "Intro",
    "Intro 1",
    "Intro 2",
    "Intro Drop",
    "Intro Drop 1",
    "Intro Drop 2"
  ],
  Verse: [
    "Verse",
    "Verse A",
    "Verse B",
    "Verse C",
    "Verse 2"
  ],
  Prechorus: [
    "Prechorus",
    "Prechorus A",
    "Prechorus B",
    "Prechorus C"
  ],
  Chorus: [
    "Chorus",
    "Chorus A",
    "Chorus B",
    "Chorus 2",
    "Last Chorus",
    "Last Postchorus",
    "Postchorus"
  ],
  Bridge: [
    "Bridge"
  ],
  Other: [] // Empty - used as fallback for unmatched sections
};

/**
 * In-memory cache for normalized section names.
 * Maps original section name (lowercase, trimmed) to BaseSection.
 * This prevents repeated string operations and improves performance.
 */
const normalizationCache = new Map<string, BaseSection>();

/**
 * Normalizes a section name to its base section type.
 * 
 * This function groups related section name variations into logical base sections.
 * For example, "Verse A", "Verse B", and "Verse" all normalize to "Verse".
 * 
 * Normalization rules:
 * - Case-insensitive matching
 * - Whitespace is trimmed before matching
 * - Exact match against section group definitions
 * - Unknown sections normalize to "Other"
 * 
 * Performance:
 * - Uses in-memory cache to avoid repeated computations
 * - Cache key is lowercase, trimmed section name
 * 
 * @param section - The section name to normalize (e.g., "Verse A", "Intro Drop")
 * @returns The base section type (e.g., "Verse", "Intro", "Other")
 * 
 * @example
 * normalizeSectionName("Verse A") // Returns "Verse"
 * normalizeSectionName("Intro Drop") // Returns "Intro"
 * normalizeSectionName("Instrumental") // Returns "Other"
 * normalizeSectionName("  VERSE  ") // Returns "Verse" (case-insensitive, trimmed)
 */
export function normalizeSectionName(section: string | null | undefined): BaseSection {
  // Handle null/undefined/empty input
  if (!section || typeof section !== 'string') {
    return "Other";
  }

  // Trim whitespace and convert to lowercase for consistent matching
  const normalizedInput = section.trim().toLowerCase();
  
  // Handle empty string after trimming
  if (normalizedInput === '') {
    return "Other";
  }

  // Check cache first
  if (normalizationCache.has(normalizedInput)) {
    return normalizationCache.get(normalizedInput)!;
  }

  // Search through section groups to find a match
  // Iterate through each base section and its variations
  for (const [baseSection, variations] of Object.entries(SECTION_GROUPS)) {
    // Skip "Other" group (it's the fallback)
    if (baseSection === "Other") {
      continue;
    }

    // Check if input matches any variation in this group (case-insensitive)
    for (const variation of variations) {
      if (variation.toLowerCase() === normalizedInput) {
        // Cache the result
        normalizationCache.set(normalizedInput, baseSection as BaseSection);
        return baseSection as BaseSection;
      }
    }
  }

  // No match found - return "Other" and cache it
  normalizationCache.set(normalizedInput, "Other");
  return "Other";
}

/**
 * Clears the normalization cache.
 * Useful for testing or if section groups are updated dynamically.
 */
export function clearNormalizationCache(): void {
  normalizationCache.clear();
}

/**
 * Gets the section group variations for a given base section.
 * Useful for debugging or UI display of available section options.
 * 
 * @param baseSection - The base section type
 * @returns Array of section name variations for that base section
 */
export function getSectionGroupVariations(baseSection: BaseSection): string[] {
  return SECTION_GROUPS[baseSection] || [];
}

/**
 * Gets all base section types.
 * Useful for iterating over all possible base sections.
 * 
 * @returns Array of all base section types
 */
export function getAllBaseSections(): BaseSection[] {
  return Object.keys(SECTION_GROUPS) as BaseSection[];
}
