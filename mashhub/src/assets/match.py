"""
Anime Theme Song Matcher (API-Compliant Version)

Works with the actual AnimeThemes API structure.
Uses search endpoint and fetches additional data as needed.
"""

import pandas as pd
import requests
import time
from pathlib import Path
from rapidfuzz import fuzz

# ==============================
# CONFIGURATION
# ==============================
SCRIPT_DIR = Path(__file__).parent
INPUT_FILE = SCRIPT_DIR / "anime.csv"
OUTPUT_FILE = SCRIPT_DIR / "anime_updated.csv"

SIMILARITY_THRESHOLD = 82
REQUEST_DELAY = 0.5
REQUEST_TIMEOUT = 20
MAX_RETRIES = 3

ANIMETHEMES_API_BASE = "https://api.animethemes.moe"


# ==============================
# STRING NORMALIZATION
# ==============================
def normalize_string(text):
    """Normalize text for fuzzy comparison."""
    if not isinstance(text, str):
        return ""
    return (
        text.lower()
        .replace("tv size", "")
        .replace("(tv)", "")
        .replace("ver.", "")
        .replace("version", "")
        .replace("-", " ")
        .replace("opening", "")
        .replace("ending", "")
        .replace("  ", " ")
        .strip()
    )


def compute_similarity(a, b):
    """Compute maximum similarity score using multiple strategies."""
    if not a or not b:
        return 0

    a_norm = normalize_string(a)
    b_norm = normalize_string(b)

    return max(
        fuzz.ratio(a_norm, b_norm),
        fuzz.partial_ratio(a_norm, b_norm),
        fuzz.token_sort_ratio(a_norm, b_norm),
        fuzz.token_set_ratio(a_norm, b_norm),
    )


# ==============================
# API REQUEST WITH RETRY
# ==============================
def make_api_request(url, params=None, retry_count=0):
    """Make API request with retry logic and exponential backoff."""
    try:
        response = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)

        # Handle rate limiting
        if response.status_code == 429:
            wait_time = 2 ** retry_count
            print(f"⚠️  Rate limit hit. Waiting {wait_time}s...")
            time.sleep(wait_time)

            if retry_count < MAX_RETRIES:
                return make_api_request(url, params, retry_count + 1)
            return None

        response.raise_for_status()
        return response.json()

    except requests.exceptions.Timeout:
        if retry_count < MAX_RETRIES:
            wait_time = 2 ** retry_count
            print(f"⏱️  Timeout. Retrying in {wait_time}s...")
            time.sleep(wait_time)
            return make_api_request(url, params, retry_count + 1)
        return None

    except requests.exceptions.RequestException as e:
        print(f"❌ API error: {e}")
        return None

    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None


# ==============================
# FETCH ANIME DETAILS
# ==============================
def fetch_anime_details(anime_slug):
    """Fetch detailed anime information including themes and songs."""
    url = f"{ANIMETHEMES_API_BASE}/anime/{anime_slug}"
    params = {"include": "animethemes.song.artists"}
    
    data = make_api_request(url, params)
    
    if not data or "anime" not in data:
        return None
    
    return data["anime"]


# ==============================
# SEARCH AND EXTRACT METADATA
# ==============================
def search_theme(song_title):
    """
    Search for theme and extract metadata.
    
    Strategy:
    1. Use search endpoint to find potential matches
    2. For best match, fetch full anime details if needed
    3. Extract and return metadata
    """
    # Step 1: Search for the song
    search_url = f"{ANIMETHEMES_API_BASE}/search"
    search_params = {"q": song_title}
    
    search_data = make_api_request(search_url, search_params)
    
    if not search_data or "search" not in search_data:
        return None
    
    search_results = search_data.get("search", [])
    
    if not search_results:
        return None
    
    # Step 2: Find best matching theme
    best_score = 0
    best_theme = None
    
    for result in search_results:
        # Extract song title from the result
        song_data = result.get("song", {})
        api_song_title = song_data.get("title", "")
        
        if not api_song_title:
            continue
        
        # Calculate similarity
        score = compute_similarity(song_title, api_song_title)
        
        if score > best_score:
            best_score = score
            best_theme = result
        
        # Early exit for very high confidence
        if best_score >= 95:
            break
    
    # Step 3: Check if match is good enough
    if best_score < SIMILARITY_THRESHOLD or not best_theme:
        return None
    
    # Step 4: Extract metadata from the theme
    try:
        # Try to get data from search result first
        anime_data = best_theme.get("anime", {})
        song_data = best_theme.get("song", {})
        
        # If anime data is incomplete, fetch full details
        anime_slug = anime_data.get("slug")
        if anime_slug and not anime_data.get("name"):
            full_anime = fetch_anime_details(anime_slug)
            if full_anime:
                anime_data = full_anime
                # Find matching theme in full data
                for theme in full_anime.get("animethemes", []):
                    theme_song = theme.get("song", {})
                    if theme_song.get("title") == song_data.get("title"):
                        song_data = theme_song
                        break
        
        # Extract anime information
        anime_name = anime_data.get("name")
        season = anime_data.get("season")
        year = anime_data.get("year")
        
        # Extract artist information
        artists = song_data.get("artists", [])
        artist_names = []
        
        for artist in artists:
            if isinstance(artist, dict):
                name = artist.get("name")
                if name:
                    artist_names.append(name)
        
        artist_str = ", ".join(artist_names) if artist_names else None
        
        # Capitalize season
        if season:
            season = str(season).capitalize()
        
        return {
            "origin": anime_name,
            "artist": artist_str,
            "season": season,
            "year": year
        }
    
    except Exception as e:
        print(f"⚠️  Error extracting metadata: {e}")
        return None


# ==============================
# MAIN PROCESSING LOOP
# ==============================
def main():
    """Process CSV file and populate anime metadata."""
    
    if not INPUT_FILE.exists():
        print(f"❌ Input file not found: {INPUT_FILE}")
        return

    print(f"📂 Loading: {INPUT_FILE}")
    df = pd.read_csv(INPUT_FILE)

    # Ensure required columns exist
    required_columns = ["ORIGIN", "ARTIST", "SEASON", "YEAR"]
    for col in required_columns:
        if col not in df.columns:
            df[col] = ""

    # Initialize cache
    cache = {}
    
    # Statistics
    total = 0
    matched = 0
    skipped = 0
    api_errors = 0

    print(f"\n🔍 Processing {len(df)} rows...\n")

    for index, row in df.iterrows():
        title = row.get("TITLE")

        if not isinstance(title, str) or not title.strip():
            continue

        # Skip if ORIGIN already populated
        if pd.notna(row.get("ORIGIN")) and str(row["ORIGIN"]).strip():
            skipped += 1
            continue

        total += 1

        # Check cache first
        if title in cache:
            result = cache[title]
            if result == "ERROR":
                api_errors += 1
                print(f"⚠️  [{total}] Skipping (previous error): {title}\n")
                continue
        else:
            print(f"🎵 [{total}] Searching: {title}")
            
            try:
                result = search_theme(title)
                cache[title] = result if result else "ERROR"
                time.sleep(REQUEST_DELAY)
            except Exception as e:
                print(f"❌ Processing error: {e}")
                cache[title] = "ERROR"
                api_errors += 1
                result = None

        if result and result != "ERROR":
            # Populate only empty fields
            if not row.get("ORIGIN") or not str(row.get("ORIGIN")).strip():
                df.at[index, "ORIGIN"] = result.get("origin", "")

            if not row.get("ARTIST") or not str(row.get("ARTIST")).strip():
                df.at[index, "ARTIST"] = result.get("artist", "")

            if not row.get("SEASON") or not str(row.get("SEASON")).strip():
                df.at[index, "SEASON"] = result.get("season", "")

            if not row.get("YEAR") or not str(row.get("YEAR")).strip():
                df.at[index, "YEAR"] = result.get("year", "")

            matched += 1
            print(
                f"✅ Matched → {result.get('origin', 'N/A')} | "
                f"{result.get('artist', 'N/A')} | "
                f"{result.get('season', 'N/A')} {result.get('year', 'N/A')}"
            )
        else:
            print("⚠️  No confident match found.")
        
        print()

    # Save results
    df.to_csv(OUTPUT_FILE, index=False)
    
    print(f"\n{'='*60}")
    print(f"✅ Processing complete!")
    print(f"{'='*60}")
    print(f"📊 Statistics:")
    print(f"   • Total processed: {total}")
    print(f"   • Successfully matched: {matched} ({(matched/total*100) if total > 0 else 0:.1f}%)")
    print(f"   • No match found: {total - matched - api_errors}")
    print(f"   • API errors: {api_errors}")
    print(f"   • Already populated (skipped): {skipped}")
    print(f"\n💾 Saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()