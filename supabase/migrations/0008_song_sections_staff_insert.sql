-- Migration: 0008_song_sections_staff_insert.sql
-- Allow evaluators and admins to insert song sections when editing existing songs in the library.
-- Resolves RLS 42501 (403 Forbidden) when replaceSectionsInSupabase() re-inserts updated sections.

create policy "song_sections_staff_insert"
  on public.song_sections for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('evaluator', 'admin')
    )
  );
