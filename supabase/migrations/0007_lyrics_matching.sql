-- Migration: 0007_lyrics_matching.sql
-- Implements Phase 1 of docs/features/lyric-matching.md

create extension if not exists vector with schema extensions;

-- 1. song_lyrics: full lyrics & status per song
create table if not exists public.song_lyrics (
  song_id            text primary key references public.songs(id) on delete cascade,
  status             text not null check (status in ('found','not_found','instrumental','error','manual')),
  source             text,                      -- 'lrclib' | 'lyricsovh' | 'manual'
  source_track_id    text,
  match_confidence   real,
  plain_lyrics       text,
  has_timestamps     boolean not null default false,
  language_summary   text[] not null default '{}',
  processed_version  int not null default 1,
  embedding_status   text not null default 'pending' check (embedding_status in ('pending','partial','done','skipped')),
  fetched_at         timestamptz not null default now(),
  error_detail       text
);

-- 2. lyric_lines: indexed lines, tokens, surface tokens, embeddings
create table if not exists public.lyric_lines (
  id               bigint generated always as identity primary key,
  song_id          text not null references public.songs(id) on delete cascade,
  line_index       int  not null,
  text             text not null,
  start_ms         int,
  section_hint     text,
  repeat_count     int  not null default 1,
  lang             text not null check (lang in ('en','ja','ko','tl','other')),
  tokens           text[] not null,
  surface_tokens   text[] not null,
  embedding        extensions.vector(384),
  embedding_model  text,
  unique (song_id, line_index)
);

create index if not exists lyric_lines_song_idx   on public.lyric_lines (song_id);
create index if not exists lyric_lines_tokens_gin on public.lyric_lines using gin (tokens);
create index if not exists lyric_lines_emb_hnsw   on public.lyric_lines using hnsw (embedding extensions.vector_cosine_ops) where embedding is not null;

-- 3. lyrics_fetch_log: server-side rate limiting log
create table if not exists public.lyrics_fetch_log (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  song_id text not null,
  at timestamptz not null default now()
);

create index if not exists lyrics_fetch_log_user_at on public.lyrics_fetch_log (user_id, at desc);

-- 4. project_lyric_links: persistent links within projects (project_id matches projects(id) type)
create table if not exists public.project_lyric_links (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null default auth.uid(),
  group_key   text not null,
  lang        text not null,
  match_kind  text not null check (match_kind in ('exact','lemma','semantic')),
  shared_terms text[] not null default '{}',
  label       text not null,
  created_at  timestamptz not null default now(),
  unique (project_id, group_key)
);

create index if not exists project_lyric_links_proj_idx on public.project_lyric_links (project_id);

-- 5. project_lyric_link_members: link member lines
create table if not exists public.project_lyric_link_members (
  link_id    uuid not null references public.project_lyric_links(id) on delete cascade,
  song_id    text not null,
  line_id    bigint,
  line_text  text not null,       -- snapshot, survives re-ingest
  line_index int,
  primary key (link_id, song_id, line_text)
);

create index if not exists project_lyric_link_members_song_idx on public.project_lyric_link_members (song_id);

-- ─── RLS Policies ────────────────────────────────────────────────────────────

alter table public.song_lyrics enable row level security;
alter table public.lyric_lines enable row level security;
alter table public.lyrics_fetch_log enable row level security;
alter table public.project_lyric_links enable row level security;
alter table public.project_lyric_link_members enable row level security;

-- Authenticated users have SELECT only on song_lyrics and lyric_lines (writes are service-role only)
create policy "Authenticated users can select song_lyrics"
  on public.song_lyrics for select
  to authenticated
  using (true);

create policy "Authenticated users can select lyric_lines"
  on public.lyric_lines for select
  to authenticated
  using (true);

-- lyrics_fetch_log: users can see their own log or service-role manages
create policy "Users can select own fetch log"
  on public.lyrics_fetch_log for select
  to authenticated
  using (user_id = auth.uid());

-- project_lyric_links: owner-only (user_id = auth.uid() or project owner)
create policy "Users can manage own project lyric links"
  on public.project_lyric_links for all
  to authenticated
  using (
    user_id = auth.uid() or
    exists (
      select 1 from public.projects p
      where p.id = project_lyric_links.project_id
        and (p.user_id = auth.uid() or p.user_id is null)
    )
  )
  with check (
    user_id = auth.uid() or
    exists (
      select 1 from public.projects p
      where p.id = project_lyric_links.project_id
        and (p.user_id = auth.uid() or p.user_id is null)
    )
  );

-- project_lyric_link_members: access through parent link
create policy "Users can manage own project lyric link members"
  on public.project_lyric_link_members for all
  to authenticated
  using (
    exists (
      select 1 from public.project_lyric_links pl
      where pl.id = project_lyric_link_members.link_id
        and (
          pl.user_id = auth.uid() or
          exists (
            select 1 from public.projects p
            where p.id = pl.project_id
              and (p.user_id = auth.uid() or p.user_id is null)
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.project_lyric_links pl
      where pl.id = project_lyric_link_members.link_id
        and (
          pl.user_id = auth.uid() or
          exists (
            select 1 from public.projects p
            where p.id = pl.project_id
              and (p.user_id = auth.uid() or p.user_id is null)
          )
        )
    )
  );

-- ─── RPCs (security invoker) ────────────────────────────────────────────────

-- 1. lyric_lines_for_songs
create or replace function public.lyric_lines_for_songs(p_song_ids text[])
returns table (
  id bigint,
  song_id text,
  line_index int,
  text text,
  start_ms int,
  section_hint text,
  repeat_count int,
  lang text,
  tokens text[],
  surface_tokens text[]
)
language sql
stable
security invoker
as $$
  select
    ll.id,
    ll.song_id,
    ll.line_index,
    ll.text,
    ll.start_ms,
    ll.section_hint,
    ll.repeat_count,
    ll.lang,
    ll.tokens,
    ll.surface_tokens
  from public.lyric_lines ll
  where ll.song_id = any(p_song_ids)
  order by ll.song_id, ll.line_index;
$$;

-- 2. lyric_candidates_for_song: lines of other songs sharing any token in the same language
create or replace function public.lyric_candidates_for_song(p_song_id text, p_limit int default 500)
returns table (
  id bigint,
  song_id text,
  line_index int,
  text text,
  start_ms int,
  section_hint text,
  repeat_count int,
  lang text,
  tokens text[],
  surface_tokens text[]
)
language sql
stable
security invoker
as $$
  with target_lines as (
    select distinct lang, unnest(tokens) as token
    from public.lyric_lines
    where song_id = p_song_id
  )
  select distinct on (ll.id)
    ll.id,
    ll.song_id,
    ll.line_index,
    ll.text,
    ll.start_ms,
    ll.section_hint,
    ll.repeat_count,
    ll.lang,
    ll.tokens,
    ll.surface_tokens
  from public.lyric_lines ll
  inner join target_lines tl
    on ll.lang = tl.lang
   and tl.token = any(ll.tokens)
  where ll.song_id != p_song_id
  limit p_limit;
$$;

-- 3. lyric_semantic_pairs: cross-song same-language pairs above threshold
create or replace function public.lyric_semantic_pairs(
  p_song_ids text[],
  p_threshold real default 0.82,
  p_limit int default 100
)
returns table (
  line_id_1 bigint,
  song_id_1 text,
  text_1 text,
  line_id_2 bigint,
  song_id_2 text,
  text_2 text,
  lang text,
  similarity real
)
language sql
stable
security invoker
as $$
  select
    l1.id as line_id_1,
    l1.song_id as song_id_1,
    l1.text as text_1,
    l2.id as line_id_2,
    l2.song_id as song_id_2,
    l2.text as text_2,
    l1.lang,
    round((1 - (l1.embedding <=> l2.embedding))::numeric, 4)::real as similarity
  from public.lyric_lines l1
  join public.lyric_lines l2
    on l1.lang = l2.lang
   and l1.song_id < l2.song_id
   and l1.embedding_model = l2.embedding_model
  where l1.song_id = any(p_song_ids)
    and l2.song_id = any(p_song_ids)
    and l1.embedding is not null
    and l2.embedding is not null
    and (1 - (l1.embedding <=> l2.embedding)) >= p_threshold
  order by similarity desc
  limit p_limit;
$$;

-- 4. lyric_term_df: document frequency for tokens
create or replace function public.lyric_term_df(p_lang text, p_lemmas text[])
returns table (
  lemma text,
  df bigint
)
language sql
stable
security invoker
as $$
  select
    elem.lemma,
    count(distinct ll.song_id) as df
  from unnest(p_lemmas) as elem(lemma)
  left join public.lyric_lines ll
    on ll.lang = p_lang
   and elem.lemma = any(ll.tokens)
  group by elem.lemma;
$$;

-- 5. lyric_indexed_song_count: distinct indexed songs in language
create or replace function public.lyric_indexed_song_count(p_lang text)
returns bigint
language sql
stable
security invoker
as $$
  select count(distinct song_id)
  from public.lyric_lines
  where lang = p_lang;
$$;

-- 6. lyric_coverage: songs with lyrics vs total songs
create or replace function public.lyric_coverage()
returns table (
  songs_with_lyrics bigint,
  total_songs bigint
)
language sql
stable
security invoker
as $$
  select
    (select count(distinct song_id) from public.song_lyrics where status in ('found','manual')) as songs_with_lyrics,
    (select count(*) from public.songs) as total_songs;
$$;
