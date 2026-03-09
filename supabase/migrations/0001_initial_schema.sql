-- MashHub initial schema: songs, song_sections, projects, project_sections, project_entries
-- Use snake_case for all columns.

-- 2.1 songs
create table public.songs (
  id          text        primary key,
  title       text        not null,
  artist      text        not null default '',
  type        text        not null default '',
  origin      text        not null default '',
  season      text        not null default '',
  year        integer,
  notes       text        not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_songs_artist on public.songs (artist);
create index idx_songs_type   on public.songs (type);
create index idx_songs_year   on public.songs (year);

-- 2.2 song_sections
create table public.song_sections (
  section_id    text        primary key,
  song_id       text        not null references public.songs (id) on delete cascade,
  part          text        not null default '',
  bpm           numeric(6,2),
  key           text        not null default '',
  section_order integer     not null default 1,
  created_at    timestamptz not null default now()
);

create index idx_song_sections_song_id on public.song_sections (song_id);
create index idx_song_sections_bpm     on public.song_sections (bpm);
create index idx_song_sections_key     on public.song_sections (key);

-- 2.3 projects
create type project_type as enum ('seasonal', 'year-end', 'song-megamix', 'other');

create table public.projects (
  id          text         primary key default gen_random_uuid()::text,
  user_id     uuid         references auth.users (id) on delete cascade,
  name        text         not null,
  type        project_type not null default 'other',
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

create index idx_projects_user_id    on public.projects (user_id);
create index idx_projects_created_at on public.projects (created_at desc);

-- 2.4 project_sections
create table public.project_sections (
  id                text    primary key default gen_random_uuid()::text,
  project_id        text    not null references public.projects (id) on delete cascade,
  name              text    not null,
  order_index       integer not null default 0,
  target_bpm        numeric(6,2),
  bpm_range_min     numeric(6,2),
  bpm_range_max     numeric(6,2),
  target_key        text,
  key_range_camelot integer,
  key_range         text[],
  created_at        timestamptz not null default now()
);

create index idx_project_sections_project_id on public.project_sections (project_id);
create unique index idx_project_sections_order
  on public.project_sections (project_id, order_index);

-- 2.5 project_entries
create table public.project_entries (
  id          text    primary key default gen_random_uuid()::text,
  project_id  text    not null references public.projects (id) on delete cascade,
  song_id     text    not null references public.songs (id) on delete cascade,
  section_id  text    references public.project_sections (id) on delete set null,
  order_index integer not null default 0,
  locked      boolean not null default false,
  notes       text    not null default '',
  created_at  timestamptz not null default now()
);

create index idx_project_entries_project_id on public.project_entries (project_id);
create index idx_project_entries_section_id on public.project_entries (section_id);
create index idx_project_entries_song_id    on public.project_entries (song_id);
create unique index idx_project_entries_order
  on public.project_entries (section_id, order_index)
  where section_id is not null;

-- 2.6 updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_songs_updated_at
  before update on public.songs
  for each row execute function public.set_updated_at();

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- PHASE 3 — Row Level Security

-- Songs: public read
alter table public.songs enable row level security;
alter table public.song_sections enable row level security;

create policy "songs_public_read" on public.songs
  for select using (true);

create policy "song_sections_public_read" on public.song_sections
  for select using (true);

-- Projects: owner only (user_id = auth.uid())
alter table public.projects enable row level security;
alter table public.project_sections enable row level security;
alter table public.project_entries enable row level security;

create policy "projects_owner" on public.projects
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "project_sections_owner" on public.project_sections
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "project_entries_owner" on public.project_entries
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );
