"""
Supabase UPSERT Script for Songs and Song Sections
This script reads CSV files and upserts data to Supabase tables.
"""

import os
import csv
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from project root
# Find the project root (where .env is located)
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
dotenv_path = os.path.join(project_root, ".env")

print(f"Loading .env from: {dotenv_path}")
load_dotenv(dotenv_path)

# Initialize Supabase client
# Try service role key first, fall back to anon key if service key is invalid
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
anon_key = os.getenv("VITE_SUPABASE_ANON_KEY")

# Use anon key if service key looks invalid (less than 100 characters)
if service_key and len(service_key) > 100:
    SUPABASE_KEY = service_key
    print(f"Using service_role key ({len(service_key)} characters)")
else:
    SUPABASE_KEY = anon_key
    print(f"Using anon key ({len(anon_key)} characters)")
    print("⚠️  Note: Using anon key - make sure RLS policies allow upsert operations")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("VITE_SUPABASE_URL and a valid API key must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def read_csv_file(file_path):
    """Read CSV file and return list of dictionaries."""
    data = []
    with open(file_path, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            data.append(row)
    return data


def clean_song_data(row):
    """Clean and transform song data for database insertion."""
    # Handle both numeric and string IDs (e.g., 1, K00001)
    song_id = row['ID']
    try:
        song_id = int(song_id)
    except (ValueError, TypeError):
        # Keep as string if not numeric
        pass
    
    # Convert year to integer (remove decimals)
    year_value = None
    if row['YEAR']:
        try:
            year_value = int(float(row['YEAR']))
        except (ValueError, TypeError):
            pass
    
    cleaned = {
        'id': song_id,
        'title': row['TITLE'],
        'artist': row['ARTIST'],
        'type': row['TYPE'],
        'origin': row['ORIGIN'],
        'season': row['SEASON'] if row['SEASON'] else 'N/A',  # Use 'N/A' for empty seasons
        'year': year_value,
        'notes': row['NOTES'] if row['NOTES'] else ''  # Use empty string instead of None
    }
    return cleaned


def clean_song_section_data(row):
    """Clean and transform song section data for database insertion."""
    # Handle both numeric and string IDs
    section_id = row['SECTION_ID']
    song_id = row['SONG_ID']
    
    try:
        section_id = int(section_id)
    except (ValueError, TypeError):
        pass
    
    try:
        song_id = int(song_id)
    except (ValueError, TypeError):
        pass
    
    cleaned = {
        'section_id': section_id,
        'song_id': song_id,
        'part': row['PART'],
        'bpm': float(row['BPM']) if row['BPM'] else None,
        'key': row['KEY'],
        'section_order': int(row['SECTION_ORDER'])
    }
    return cleaned


def upsert_songs(songs_data, batch_size=100):
    """Upsert songs data to Supabase in batches."""
    total = len(songs_data)
    print(f"Upserting {total} songs...")
    
    for i in range(0, total, batch_size):
        batch = songs_data[i:i + batch_size]
        try:
            response = supabase.table('songs').upsert(
                batch,
                on_conflict='id'
            ).execute()
            print(f"  Processed {min(i + batch_size, total)}/{total} songs")
        except Exception as e:
            print(f"  Error upserting songs batch {i}-{i+batch_size}: {e}")
            raise
    
    print("✓ Songs upsert completed successfully!")


def upsert_song_sections(sections_data, batch_size=100):
    """Upsert song sections data to Supabase in batches."""
    total = len(sections_data)
    print(f"Upserting {total} song sections...")
    
    for i in range(0, total, batch_size):
        batch = sections_data[i:i + batch_size]
        try:
            # Remove on_conflict parameter to use default primary key
            response = supabase.table('song_sections').upsert(batch).execute()
            print(f"  Processed {min(i + batch_size, total)}/{total} song sections")
        except Exception as e:
            print(f"  Error upserting song sections batch {i}-{i+batch_size}: {e}")
            raise
    
    print("✓ Song sections upsert completed successfully!")


def main():
    """Main function to execute the upsert operations."""
    # File paths - resolve relative to script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    songs_csv = os.path.join(script_dir, 'songs.csv')
    sections_csv = os.path.join(script_dir, 'song_sections.csv')
    
    print("=" * 60)
    print("Starting Supabase UPSERT Operations")
    print("=" * 60)
    print(f"\nScript location: {script_dir}")
    print(f"Songs CSV: {songs_csv}")
    print(f"Sections CSV: {sections_csv}")
    
    # Read and process songs
    print("\n1. Reading songs.csv...")
    songs_raw = read_csv_file(songs_csv)
    songs_data = [clean_song_data(row) for row in songs_raw]
    print(f"   Read {len(songs_data)} songs")
    
    # Read and process song sections
    print("\n2. Reading song_sections.csv...")
    sections_raw = read_csv_file(sections_csv)
    sections_data = [clean_song_section_data(row) for row in sections_raw]
    print(f"   Read {len(sections_data)} song sections")
    
    # Upsert songs first (since song_sections references songs)
    print("\n3. Upserting songs to Supabase...")
    upsert_songs(songs_data)
    
    # Upsert song sections
    print("\n4. Upserting song sections to Supabase...")
    upsert_song_sections(sections_data)
    
    print("\n" + "=" * 60)
    print("All operations completed successfully! ✓")
    print("=" * 60)


if __name__ == "__main__":
    main()
