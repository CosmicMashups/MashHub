"""
Append new rows from opm.csv to songs.csv and song_sections.csv.
Pure Python implementation with no external dependencies.
Only appends rows for song IDs that do not already exist in songs.csv.

Run from any directory or src/assets:
    python append_opm.py
"""

import csv
import os
import shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OPM_CSV = os.path.join(SCRIPT_DIR, "opm.csv")
SONGS_CSV = os.path.join(SCRIPT_DIR, "songs.csv")
SECTIONS_CSV = os.path.join(SCRIPT_DIR, "song_sections.csv")


def append_opm(dry_run=False):
    if not os.path.isfile(OPM_CSV):
        raise FileNotFoundError(f"Source file not found: {OPM_CSV}")

    # 1. Read OPM source
    with open(OPM_CSV, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        opm_rows = list(reader)

    # 2. Transform into songs and sections
    new_songs = []
    new_sections = []
    for r in opm_rows:
        song_id = r["ID"].strip()
        new_songs.append({
            "id": song_id,
            "title": r["TITLE"].strip(),
            "artist": r["ARTIST"].strip(),
            "type": r["TYPE"].strip() or "OPM",
            "origin": r["ORIGIN"].strip(),
            "season": r["SEASON"].strip(),
            "year": r["YEAR"].strip(),
            "notes": r["NOTES"].strip(),
        })

        bpm_raw = r["BPM"].strip()
        key_raw = r["KEY"].strip()
        part_raw = r["PART"].strip()

        bpm_list = [x.strip() for x in bpm_raw.split(",")] if "," in bpm_raw else [bpm_raw]
        key_list = [x.strip() for x in key_raw.split(",")] if "," in key_raw else [key_raw]
        if part_raw == "" or part_raw.lower() == "nan":
            part_list = ["Full Song"]
        else:
            part_list = [x.strip() for x in part_raw.split(",")] if "," in part_raw else [part_raw]

        for order, (part, bpm, key) in enumerate(zip(part_list, bpm_list, key_list), start=1):
            new_sections.append({
                "song_id": song_id,
                "part": part,
                "bpm": float(bpm),
                "key": key,
                "section_order": order,
            })

    # 3. Check existing songs.csv
    existing_song_ids = set()
    existing_songs_rows = []
    songs_header = ["id", "title", "artist", "type", "origin", "season", "year", "notes"]
    if os.path.exists(SONGS_CSV):
        with open(SONGS_CSV, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            songs_header = reader.fieldnames
            id_key = "id" if "id" in songs_header else "ID"
            for row in reader:
                existing_songs_rows.append(row)
                existing_song_ids.add(row[id_key].strip())

    # 4. Check existing song_sections.csv
    existing_sections_rows = []
    max_section_id = 0
    sections_header = ["section_id", "song_id", "part", "bpm", "key", "section_order"]
    if os.path.exists(SECTIONS_CSV):
        with open(SECTIONS_CSV, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            sections_header = reader.fieldnames
            sid_key = "section_id" if "section_id" in sections_header else "SECTION_ID"
            for row in reader:
                existing_sections_rows.append(row)
                val = row[sid_key].strip()
                if val.isdigit():
                    max_section_id = max(max_section_id, int(val))

    # 5. Filter for new songs
    id_key = "id" if "id" in songs_header else "ID"
    title_key = "title" if "title" in songs_header else "TITLE"
    artist_key = "artist" if "artist" in songs_header else "ARTIST"
    type_key = "type" if "type" in songs_header else "TYPE"
    origin_key = "origin" if "origin" in songs_header else "ORIGIN"
    season_key = "season" if "season" in songs_header else "SEASON"
    year_key = "year" if "year" in songs_header else "YEAR"
    notes_key = "notes" if "notes" in songs_header else "NOTES"

    songs_to_add = []
    added_song_ids = set()
    for s in new_songs:
        if s["id"] not in existing_song_ids:
            songs_to_add.append({
                id_key: s["id"],
                title_key: s["title"],
                artist_key: s["artist"],
                type_key: s["type"],
                origin_key: s["origin"],
                season_key: s["season"],
                year_key: s["year"],
                notes_key: s["notes"],
            })
            added_song_ids.add(s["id"])

    if not songs_to_add:
        print("All songs from opm.csv already exist in songs.csv.")
        return

    # 6. Assign sequential section_id continuing from max_section_id
    sid_key = "section_id" if "section_id" in sections_header else "SECTION_ID"
    songid_key = "song_id" if "song_id" in sections_header else "SONG_ID"
    part_key = "part" if "part" in sections_header else "PART"
    bpm_key = "bpm" if "bpm" in sections_header else "BPM"
    key_key = "key" if "key" in sections_header else "KEY"
    order_key = "section_order" if "section_order" in sections_header else "SECTION_ORDER"

    sections_to_add = []
    current_sid = max_section_id + 1
    for sec in new_sections:
        if sec["song_id"] in added_song_ids:
            sections_to_add.append({
                sid_key: current_sid,
                songid_key: sec["song_id"],
                part_key: sec["part"],
                bpm_key: sec["bpm"],
                key_key: sec["key"],
                order_key: sec["section_order"],
            })
            current_sid += 1

    print(f"Adding {len(songs_to_add)} songs and {len(sections_to_add)} sections (Section IDs: {max_section_id + 1} to {current_sid - 1}).")

    if dry_run:
        print("Dry run complete. No files modified.")
        return

    # Backup existing files
    shutil.copyfile(SONGS_CSV, SONGS_CSV + ".bak")
    shutil.copyfile(SECTIONS_CSV, SECTIONS_CSV + ".bak")

    # Write combined files
    all_songs = existing_songs_rows + songs_to_add
    with open(SONGS_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=songs_header)
        writer.writeheader()
        writer.writerows(all_songs)

    all_sections = existing_sections_rows + sections_to_add
    with open(SECTIONS_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=sections_header)
        writer.writeheader()
        writer.writerows(all_sections)

    print(f"Successfully appended! Total songs: {len(all_songs)}, Total sections: {len(all_sections)}.")


if __name__ == "__main__":
    append_opm(dry_run=False)
