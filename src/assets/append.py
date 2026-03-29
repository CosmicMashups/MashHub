"""
Append new rows from western.csv to songs.csv and song_sections.csv.
Uses the same transformation logic as sep.py. Only appends rows for song IDs
that do not already exist in songs.csv.

Run from the directory containing the CSV files (e.g. src/assets):
    python append_western.py
"""

import pandas as pd
import os

# Paths relative to script directory so it works from any cwd
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WESTERN_CSV = os.path.join(SCRIPT_DIR, "western.csv")
SONGS_CSV = os.path.join(SCRIPT_DIR, "songs.csv")
SECTIONS_CSV = os.path.join(SCRIPT_DIR, "song_sections.csv")


def transform_source_to_rows(df):
    """
    Same logic as sep.py: turn a source CSV (anime/western format) into
    lists of song rows and section rows. Returns (songs_rows, sections_rows)
    with section_id_counter starting at 1 (caller will offset if appending).
    """
    songs_rows = []
    sections_rows = []
    section_id_counter = 1

    for _, row in df.iterrows():
        song_id = row["ID"]

        songs_rows.append({
            "ID": song_id,
            "TITLE": row["TITLE"],
            "ARTIST": row["ARTIST"],
            "TYPE": row["TYPE"],
            "ORIGIN": row["ORIGIN"],
            "SEASON": row["SEASON"],
            "YEAR": row["YEAR"],
            "NOTES": row["NOTES"],
        })

        bpm_raw = str(row["BPM"]).strip()
        key_raw = str(row["KEY"]).strip()
        part_raw = str(row["PART"]).strip()

        bpm_list = [x.strip() for x in bpm_raw.split(",")] if "," in bpm_raw else [bpm_raw]
        key_list = [x.strip() for x in key_raw.split(",")] if "," in key_raw else [key_raw]

        if part_raw == "" or part_raw.lower() == "nan":
            part_list = ["Full Song"]
        else:
            part_list = [x.strip() for x in part_raw.split(",")] if "," in part_raw else [part_raw]

        if not (len(bpm_list) == len(key_list) == len(part_list)):
            raise ValueError(f"Length mismatch in song ID {song_id}")

        for order, (part, bpm, key) in enumerate(zip(part_list, bpm_list, key_list), start=1):
            sections_rows.append({
                "SECTION_ID": section_id_counter,
                "SONG_ID": song_id,
                "PART": part,
                "BPM": float(bpm),
                "KEY": key,
                "SECTION_ORDER": order,
            })
            section_id_counter += 1

    return songs_rows, sections_rows


def main():
    if not os.path.isfile(WESTERN_CSV):
        raise FileNotFoundError(f"Source file not found: {WESTERN_CSV}")

    # Load western.csv and transform using same logic as sep.py
    df = pd.read_csv(WESTERN_CSV)
    new_songs_rows, new_sections_rows = transform_source_to_rows(df)

    # Normalize song IDs to string for comparison (western uses W00001 etc.)
    new_songs_df = pd.DataFrame(new_songs_rows).drop_duplicates(subset=["ID"])
    new_song_ids = set(new_songs_df["ID"].astype(str))

    # Load existing files if they exist
    if os.path.isfile(SONGS_CSV):
        existing_songs_df = pd.read_csv(SONGS_CSV)
        existing_song_ids = set(existing_songs_df["ID"].astype(str))
    else:
        existing_songs_df = pd.DataFrame()
        existing_song_ids = set()

    if os.path.isfile(SECTIONS_CSV):
        existing_sections_df = pd.read_csv(SECTIONS_CSV)
        next_section_id = int(existing_sections_df["SECTION_ID"].max()) + 1
    else:
        existing_sections_df = pd.DataFrame()
        next_section_id = 1

    # Keep only new songs (IDs not already in existing songs)
    added_ids = new_song_ids - existing_song_ids
    if not added_ids:
        print("No new rows to append: all song IDs from western.csv already exist in songs.csv.")
        return

    new_songs_to_append = new_songs_df[new_songs_df["ID"].astype(str).isin(added_ids)]

    # Build section rows only for newly added songs, with SECTION_ID continuing from existing
    new_sections_df = pd.DataFrame(new_sections_rows)
    new_sections_to_append = new_sections_df[new_sections_df["SONG_ID"].astype(str).isin(added_ids)].copy()
    new_sections_to_append["SECTION_ID"] = range(
        next_section_id,
        next_section_id + len(new_sections_to_append),
    )

    # Append and write
    combined_songs = pd.concat([existing_songs_df, new_songs_to_append], ignore_index=True)
    combined_sections = pd.concat([existing_sections_df, new_sections_to_append], ignore_index=True)

    combined_songs.to_csv(SONGS_CSV, index=False)
    combined_sections.to_csv(SECTIONS_CSV, index=False)

    print(
        f"Appended {len(new_songs_to_append)} new songs and {len(new_sections_to_append)} new sections "
        f"from western.csv to songs.csv and song_sections.csv."
    )


if __name__ == "__main__":
    main()
