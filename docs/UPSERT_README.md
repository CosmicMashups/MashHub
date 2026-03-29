# Supabase UPSERT Script

This Python script performs UPSERT operations to sync CSV data with Supabase tables.

## Prerequisites

1. **Python 3.7+** installed
2. **Supabase project** set up with the following tables:
   - `songs` (with primary key: `id`)
   - `song_sections` (with primary key: `section_id`)

## Installation

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables in `.env` file:
   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
   ```
   
   **Note:** The script uses the service role key for write operations to bypass RLS (Row Level Security) policies.

## Database Schema

### Songs Table
```sql
CREATE TABLE songs (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  type TEXT,
  origin TEXT,
  season TEXT,
  year NUMERIC,
  notes TEXT
);
```

### Song Sections Table
```sql
CREATE TABLE song_sections (
  section_id BIGINT PRIMARY KEY,
  song_id BIGINT REFERENCES songs(id),
  part TEXT NOT NULL,
  bpm NUMERIC,
  key TEXT,
  section_order INTEGER
);
```

## Usage

Run the script from the project root directory:

```bash
python upsert_to_supabase.py
```

The script will:
1. Read `src/assets/songs.csv`
2. Read `src/assets/song_sections.csv`
3. Upsert data to the `songs` table (in batches of 100)
4. Upsert data to the `song_sections` table (in batches of 100)

## Features

- **UPSERT operation**: Inserts new records and updates existing ones based on primary key
- **Batch processing**: Processes data in batches to handle large datasets efficiently
- **Error handling**: Provides clear error messages if something goes wrong
- **Progress tracking**: Shows progress for each batch operation
- **Data cleaning**: Automatically handles empty values and type conversions

## CSV Format

### songs.csv
Columns: `ID`, `TITLE`, `ARTIST`, `TYPE`, `ORIGIN`, `SEASON`, `YEAR`, `NOTES`

### song_sections.csv
Columns: `SECTION_ID`, `SONG_ID`, `PART`, `BPM`, `KEY`, `SECTION_ORDER`

## Troubleshooting

- **Authentication error**: Make sure your `SUPABASE_SERVICE_ROLE_KEY` has permission to write to the tables
- **Foreign key constraint**: The script upserts songs first, then song sections (to respect the foreign key relationship)
- **RLS policies**: The script uses the service role key which bypasses Row Level Security

## Notes

- The script uses `on_conflict` parameter to specify which column should be used for the upsert operation
- Empty CSV values are converted to `None` (NULL in database)
- Numeric columns are properly converted from strings to numbers
