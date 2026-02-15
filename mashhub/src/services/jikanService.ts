/**
 * Jikan API Service
 * 
 * Provides functions to fetch anime cover/poster images from Jikan API (MyAnimeList API).
 * Jikan API is free and does not require authentication.
 * 
 * API Documentation: https://docs.api.jikan.moe/
 */

/**
 * Jikan API response types
 */
interface JikanAnimeImage {
  jpg: {
    image_url: string;
    small_image_url: string;
    large_image_url: string;
  };
  webp: {
    image_url: string;
    small_image_url: string;
    large_image_url: string;
  };
}

interface JikanAnime {
  mal_id: number;
  title: string;
  images: JikanAnimeImage;
}

interface JikanSearchResponse {
  data: JikanAnime[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
  };
}

/**
 * Fetches anime cover image URL from Jikan API based on anime title (origin).
 * 
 * @param origin - The anime title to search for (from song.origin field)
 * @returns Promise resolving to the large image URL or null if not found/error
 * 
 * @example
 * const imageUrl = await fetchAnimeCover("Attack on Titan");
 * // Returns: "https://cdn.myanimelist.net/images/anime/10/47347l.jpg" or null
 */
export async function fetchAnimeCover(origin: string): Promise<string | null> {
  if (!origin || typeof origin !== 'string') {
    return null;
  }

  // Trim whitespace and encode the search query
  const searchQuery = origin.trim();
  if (!searchQuery) {
    return null;
  }

  try {
    // Encode URI component to handle special characters
    const encodedQuery = encodeURIComponent(searchQuery);
    const apiUrl = `https://api.jikan.moe/v4/anime?q=${encodedQuery}&limit=1`;

    const response = await fetch(apiUrl);

    // Handle rate limiting (429 status)
    if (response.status === 429) {
      console.warn('Jikan API rate limit reached for query:', searchQuery);
      return null;
    }

    // Handle other HTTP errors
    if (!response.ok) {
      console.error('Jikan API error:', response.status, response.statusText);
      return null;
    }

    const data: JikanSearchResponse = await response.json();

    // Check if we have results
    if (!data.data || data.data.length === 0) {
      return null;
    }

    // Extract large_image_url from first result
    const firstAnime = data.data[0];
    if (firstAnime?.images?.jpg?.large_image_url) {
      return firstAnime.images.jpg.large_image_url;
    }

    return null;
  } catch (error) {
    // Handle network failures and other errors
    console.error('Error fetching anime cover from Jikan API:', error);
    return null;
  }
}
