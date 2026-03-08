import pandas as pd

# Load anime.csv
df = pd.read_csv("anime.csv")

songs_rows = []
sections_rows = []
section_id_counter = 1

for _, row in df.iterrows():
    song_id = row["ID"]

    # --- Add to songs.csv ---
    songs_rows.append({
        "ID": song_id,
        "TITLE": row["TITLE"],
        "ARTIST": row["ARTIST"],
        "TYPE": row["TYPE"],
        "ORIGIN": row["ORIGIN"],
        "SEASON": row["SEASON"],
        "YEAR": row["YEAR"],
        "NOTES": row["NOTES"]
    })

    # --- Parse BPM / KEY / PART ---
    bpm_raw = str(row["BPM"]).strip()
    key_raw = str(row["KEY"]).strip()
    part_raw = str(row["PART"]).strip()

    bpm_list = [x.strip() for x in bpm_raw.split(",")] if "," in bpm_raw else [bpm_raw]
    key_list = [x.strip() for x in key_raw.split(",")] if "," in key_raw else [key_raw]

    # If PART empty → uniform song
    if part_raw == "" or part_raw.lower() == "nan":
        part_list = ["Full Song"]
    else:
        part_list = [x.strip() for x in part_raw.split(",")] if "," in part_raw else [part_raw]

    # Validate structural integrity
    if not (len(bpm_list) == len(key_list) == len(part_list)):
        raise ValueError(f"Length mismatch in song ID {song_id}")

    # --- Create section rows ---
    for order, (part, bpm, key) in enumerate(zip(part_list, bpm_list, key_list), start=1):
        sections_rows.append({
            "SECTION_ID": section_id_counter,
            "SONG_ID": song_id,
            "PART": part,
            "BPM": float(bpm),
            "KEY": key,
            "SECTION_ORDER": order
        })
        section_id_counter += 1

# Remove duplicate song entries
songs_df = pd.DataFrame(songs_rows).drop_duplicates(subset=["ID"])
sections_df = pd.DataFrame(sections_rows)

songs_df.to_csv("songs.csv", index=False)
sections_df.to_csv("song_sections.csv", index=False)

print("Migration from anime.csv completed successfully.")