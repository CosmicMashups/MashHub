-- Enable write operations for music library tables.
-- Existing schema only allows public SELECT on songs/song_sections,
-- which causes INSERT/UPDATE/DELETE to fail with RLS 42501.

-- Songs write policies
create policy "songs_public_insert" on public.songs
  for insert
  with check (true);

create policy "songs_public_update" on public.songs
  for update
  using (true)
  with check (true);

create policy "songs_public_delete" on public.songs
  for delete
  using (true);

-- Song sections write policies
create policy "song_sections_public_insert" on public.song_sections
  for insert
  with check (true);

create policy "song_sections_public_update" on public.song_sections
  for update
  using (true)
  with check (true);

create policy "song_sections_public_delete" on public.song_sections
  for delete
  using (true);
