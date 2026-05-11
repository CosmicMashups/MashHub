-- MashHub: profiles + roles, moderation staging (new_songs / new_song_sections),
-- song attribution columns, tightened RLS on official library, SECURITY DEFINER RPCs.
-- CSV / full library replace: use admin_* RPCs only (see admin_bulk_upsert_library, admin_truncate_and_import_library).

-- ---------------------------------------------------------------------------
-- 1. Roles and profiles
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('user', 'evaluator', 'admin');

create type public.submission_status as enum (
  'pending',
  'approved',
  'rejected',
  'needs_revision'
);

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text not null,
  role       public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_profiles_username_lower on public.profiles (lower(username));

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Read usernames for moderation / display (authenticated app users only)
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (
    id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Inserts only via trigger (security definer)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 64),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Extend songs (attribution)
-- ---------------------------------------------------------------------------
alter table public.songs
  add column if not exists analysis_by_user_id uuid references auth.users (id) on delete set null,
  add column if not exists analysis_by_username text,
  add column if not exists confirmed_by_user_id uuid references auth.users (id) on delete set null,
  add column if not exists confirmed_by_username text;

comment on column public.songs.analysis_by_username is 'Denormalized snapshot at approval time';
comment on column public.songs.confirmed_by_username is 'Denormalized snapshot at approval time';

-- ---------------------------------------------------------------------------
-- 3. Moderation tables
-- ---------------------------------------------------------------------------
create table public.new_songs (
  id                      text primary key,
  title                   text not null,
  artist                  text not null default '',
  type                    text not null default '',
  origin                  text not null default '',
  season                  text not null default '',
  year                    integer,
  notes                   text not null default '',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  submitted_by_user_id    uuid references auth.users (id) on delete set null,
  submitted_by_username   text not null,
  status                  public.submission_status not null default 'pending',
  submitted_at            timestamptz not null default now(),
  reviewed_by_user_id     uuid references auth.users (id) on delete set null,
  reviewed_by_username    text,
  reviewed_at             timestamptz,
  rejection_reason        text,
  revision_notes          text,
  approved_song_id        text references public.songs (id) on delete set null
);

create index idx_new_songs_status_submitted on public.new_songs (status, submitted_at desc);
create index idx_new_songs_submitter on public.new_songs (submitted_by_user_id, submitted_at desc);
create index idx_new_songs_pending on public.new_songs (submitted_at desc)
  where status = 'pending';

create trigger trg_new_songs_updated_at
  before update on public.new_songs
  for each row execute function public.set_updated_at();

create table public.new_song_sections (
  section_id    text primary key,
  song_id       text not null references public.new_songs (id) on delete cascade,
  part          text not null default '',
  bpm           numeric(6,2),
  key           text not null default '',
  section_order integer not null default 1,
  created_at    timestamptz not null default now(),
  unique (song_id, section_order)
);

create index idx_new_song_sections_song on public.new_song_sections (song_id);

alter table public.new_songs enable row level security;
alter table public.new_song_sections enable row level security;

create policy "new_songs_select_own_or_staff"
  on public.new_songs for select
  to authenticated
  using (
    submitted_by_user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('evaluator', 'admin')
    )
  );

create policy "new_song_sections_select_via_parent"
  on public.new_song_sections for select
  to authenticated
  using (
    exists (
      select 1 from public.new_songs s
      where s.id = song_id
        and (
          s.submitted_by_user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('evaluator', 'admin')
          )
        )
    )
  );

-- Writes only through SECURITY DEFINER RPCs (no insert/update policies)

-- ---------------------------------------------------------------------------
-- 4. Replace permissive song / song_sections write policies
-- ---------------------------------------------------------------------------
drop policy if exists "songs_public_insert" on public.songs;
drop policy if exists "songs_public_update" on public.songs;
drop policy if exists "songs_public_delete" on public.songs;
drop policy if exists "song_sections_public_insert" on public.song_sections;
drop policy if exists "song_sections_public_update" on public.song_sections;
drop policy if exists "song_sections_public_delete" on public.song_sections;

-- Official library: public read, staff maintain, no direct client insert
create policy "songs_staff_update"
  on public.songs for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('evaluator', 'admin'))
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('evaluator', 'admin'))
  );

create policy "songs_staff_delete"
  on public.songs for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('evaluator', 'admin'))
  );

create policy "song_sections_staff_update"
  on public.song_sections for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('evaluator', 'admin'))
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('evaluator', 'admin'))
  );

create policy "song_sections_staff_delete"
  on public.song_sections for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('evaluator', 'admin'))
  );

-- No INSERT policies on songs / song_sections: inserts only via RPC (bypass RLS) or service_role

-- ---------------------------------------------------------------------------
-- 5. Helpers (SECURITY DEFINER for consistent checks inside RPCs)
-- ---------------------------------------------------------------------------
create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role in ('evaluator', 'admin')
  );
$$;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 6. RPC: submit analysis
-- ---------------------------------------------------------------------------
create or replace function public.submit_new_song_analysis(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_uname text;
  v_sid text;
  sec jsonb;
  i int := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select username into v_uname from public.profiles where id = v_uid;
  if v_uname is null then
    raise exception 'profile_missing' using errcode = 'P0001';
  end if;

  v_sid := 'ns_' || replace(gen_random_uuid()::text, '-', '');

  insert into public.new_songs (
    id, title, artist, type, origin, season, year, notes,
    submitted_by_user_id, submitted_by_username, status, submitted_at
  )
  values (
    v_sid,
    coalesce(p_payload->>'title', ''),
    coalesce(p_payload->>'artist', ''),
    coalesce(p_payload->>'type', ''),
    coalesce(p_payload->>'origin', ''),
    coalesce(p_payload->>'season', ''),
    nullif(p_payload->>'year', '')::integer,
    coalesce(p_payload->>'notes', ''),
    v_uid,
    v_uname,
    'pending',
    now()
  );

  for sec in select * from jsonb_array_elements(coalesce(p_payload->'sections', '[]'::jsonb))
  loop
    i := i + 1;
    insert into public.new_song_sections (section_id, song_id, part, bpm, key, section_order)
    values (
      v_sid || '_sec_' || i::text,
      v_sid,
      coalesce(sec->>'part', ''),
      (sec->>'bpm')::numeric,
      coalesce(sec->>'key', ''),
      coalesce((sec->>'section_order')::int, i)
    );
  end loop;

  return jsonb_build_object('submission_id', v_sid);
end;
$$;

grant execute on function public.submit_new_song_analysis(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. RPC: update own submission (rejected / needs_revision)
-- ---------------------------------------------------------------------------
create or replace function public.update_own_submission(p_submission_id text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r public.new_songs%rowtype;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into r from public.new_songs where id = p_submission_id for update;
  if not found then
    raise exception 'submission_not_found' using errcode = 'P0002';
  end if;

  if r.submitted_by_user_id is distinct from v_uid then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if r.status not in ('rejected', 'needs_revision') then
    raise exception 'invalid_status_for_edit' using errcode = 'P0001';
  end if;

  update public.new_songs set
    title = coalesce(p_payload->>'title', title),
    artist = coalesce(p_payload->>'artist', artist),
    type = coalesce(p_payload->>'type', type),
    origin = coalesce(p_payload->>'origin', origin),
    season = coalesce(p_payload->>'season', season),
    year = case when p_payload ? 'year' then nullif(p_payload->>'year', '')::integer else year end,
    notes = coalesce(p_payload->>'notes', notes),
    updated_at = now()
  where id = p_submission_id;

  delete from public.new_song_sections where song_id = p_submission_id;

  insert into public.new_song_sections (section_id, song_id, part, bpm, key, section_order)
  select
    p_submission_id || '_sec_' || ord::text,
    p_submission_id,
    coalesce(x.elem->>'part', ''),
    (x.elem->>'bpm')::numeric,
    coalesce(x.elem->>'key', ''),
    coalesce((x.elem->>'section_order')::int, ord)
  from jsonb_array_elements(coalesce(p_payload->'sections', '[]'::jsonb)) with ordinality as x(elem, ord);

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.update_own_submission(text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. RPC: resubmit
-- ---------------------------------------------------------------------------
create or replace function public.resubmit_new_song(p_submission_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r public.new_songs%rowtype;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into r from public.new_songs where id = p_submission_id for update;
  if not found then
    raise exception 'submission_not_found' using errcode = 'P0002';
  end if;

  if r.submitted_by_user_id is distinct from v_uid then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if r.status not in ('rejected', 'needs_revision') then
    raise exception 'invalid_status_for_resubmit' using errcode = 'P0001';
  end if;

  update public.new_songs set
    status = 'pending',
    reviewed_by_user_id = null,
    reviewed_by_username = null,
    reviewed_at = null,
    rejection_reason = null,
    revision_notes = null,
    submitted_at = now(),
    updated_at = now()
  where id = p_submission_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.resubmit_new_song(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. RPC: approve (atomic)
-- ---------------------------------------------------------------------------
create or replace function public.approve_new_song(p_submission_id text, p_overrides jsonb default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r public.new_songs%rowtype;
  v_eval_uname text;
  v_new_id text;
  v_max int;
  v_title text;
  v_artist text;
  v_type text;
  v_origin text;
  v_season text;
  v_year int;
  v_notes text;
  ord int := 0;
  v_use jsonb;
  v_sections jsonb;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not public.is_staff(v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select username into v_eval_uname from public.profiles where id = v_uid;

  select * into r from public.new_songs where id = p_submission_id for update;
  if not found then
    raise exception 'submission_not_found' using errcode = 'P0002';
  end if;

  if r.status not in ('pending', 'needs_revision') then
    raise exception 'already_processed' using errcode = 'P0001';
  end if;

  v_title := coalesce(p_overrides->>'title', r.title);
  v_artist := coalesce(p_overrides->>'artist', r.artist);
  v_type := coalesce(p_overrides->>'type', r.type);
  v_origin := coalesce(p_overrides->>'origin', r.origin);
  v_season := coalesce(p_overrides->>'season', r.season);
  v_year := case
    when p_overrides ? 'year' then nullif(p_overrides->>'year', '')::integer
    else r.year
  end;
  v_notes := coalesce(p_overrides->>'notes', r.notes);

  if p_overrides is not null and jsonb_typeof(p_overrides->'sections') = 'array'
     and jsonb_array_length(p_overrides->'sections') > 0 then
    v_sections := p_overrides->'sections';
  else
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'part', s.part,
        'bpm', s.bpm,
        'key', s.key,
        'section_order', s.section_order
      ) order by s.section_order
    ), '[]'::jsonb)
    into v_sections
    from public.new_song_sections s
    where s.song_id = p_submission_id;
  end if;

  if v_sections is null or jsonb_array_length(v_sections) = 0 then
    raise exception 'empty_sections' using errcode = 'P0001';
  end if;

  select coalesce(max(id::int), 0) into v_max
  from public.songs
  where id ~ '^[0-9]{5}$';

  v_new_id := lpad((v_max + 1)::text, 5, '0');

  insert into public.songs (
    id, title, artist, type, origin, season, year, notes,
    analysis_by_user_id, analysis_by_username,
    confirmed_by_user_id, confirmed_by_username
  ) values (
    v_new_id,
    v_title,
    v_artist,
    v_type,
    v_origin,
    v_season,
    v_year,
    v_notes,
    r.submitted_by_user_id,
    r.submitted_by_username,
    v_uid,
    coalesce(v_eval_uname, '')
  );

  for v_use in select * from jsonb_array_elements(v_sections)
  loop
    ord := ord + 1;
    insert into public.song_sections (section_id, song_id, part, bpm, key, section_order)
    values (
      v_new_id || '_section_' || ord::text || '_' || substr(md5(random()::text), 1, 6),
      v_new_id,
      coalesce(v_use->>'part', ''),
      (v_use->>'bpm')::numeric,
      coalesce(v_use->>'key', ''),
      coalesce((v_use->>'section_order')::int, ord)
    );
  end loop;

  update public.new_songs set
    status = 'approved',
    reviewed_by_user_id = v_uid,
    reviewed_by_username = coalesce(v_eval_uname, ''),
    reviewed_at = now(),
    approved_song_id = v_new_id,
    updated_at = now()
  where id = p_submission_id;

  return jsonb_build_object('song_id', v_new_id);
end;
$$;

grant execute on function public.approve_new_song(text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 10. RPC: reject or needs_revision
-- ---------------------------------------------------------------------------
create or replace function public.moderator_decline_submission(
  p_submission_id text,
  p_new_status public.submission_status,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_uname text;
  r public.new_songs%rowtype;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not public.is_staff(v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_new_status not in ('rejected', 'needs_revision') then
    raise exception 'invalid_decline_status' using errcode = 'P0001';
  end if;

  select username into v_uname from public.profiles where id = v_uid;

  select * into r from public.new_songs where id = p_submission_id for update;
  if not found then
    raise exception 'submission_not_found' using errcode = 'P0002';
  end if;

  if r.status not in ('pending', 'needs_revision') then
    raise exception 'already_processed' using errcode = 'P0001';
  end if;

  if p_new_status = 'rejected' then
    update public.new_songs set
      status = 'rejected',
      rejection_reason = p_message,
      revision_notes = null,
      reviewed_by_user_id = v_uid,
      reviewed_by_username = coalesce(v_uname, ''),
      reviewed_at = now(),
      updated_at = now()
    where id = p_submission_id;
  else
    update public.new_songs set
      status = 'needs_revision',
      revision_notes = p_message,
      rejection_reason = null,
      reviewed_by_user_id = v_uid,
      reviewed_by_username = coalesce(v_uname, ''),
      reviewed_at = now(),
      updated_at = now()
    where id = p_submission_id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.moderator_decline_submission(text, public.submission_status, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 11. RPC: admin bulk upsert (import modal)
-- ---------------------------------------------------------------------------
create or replace function public.admin_bulk_upsert_library(p_songs jsonb, p_sections jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  s jsonb;
  sec jsonb;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not public.is_admin(v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  for s in select * from jsonb_array_elements(coalesce(p_songs, '[]'::jsonb))
  loop
    insert into public.songs (id, title, artist, type, origin, season, year, notes)
    values (
      s->>'id',
      coalesce(s->>'title', ''),
      coalesce(s->>'artist', ''),
      coalesce(s->>'type', ''),
      coalesce(s->>'origin', ''),
      coalesce(s->>'season', ''),
      nullif(s->>'year', '')::integer,
      coalesce(s->>'notes', '')
    )
    on conflict (id) do update set
      title = excluded.title,
      artist = excluded.artist,
      type = excluded.type,
      origin = excluded.origin,
      season = excluded.season,
      year = excluded.year,
      notes = excluded.notes,
      updated_at = now();
  end loop;

  for sec in select * from jsonb_array_elements(coalesce(p_sections, '[]'::jsonb))
  loop
    insert into public.song_sections (section_id, song_id, part, bpm, key, section_order)
    values (
      sec->>'section_id',
      sec->>'song_id',
      coalesce(sec->>'part', ''),
      (sec->>'bpm')::numeric,
      coalesce(sec->>'key', ''),
      coalesce((sec->>'section_order')::int, 1)
    )
    on conflict (section_id) do update set
      song_id = excluded.song_id,
      part = excluded.part,
      bpm = excluded.bpm,
      key = excluded.key,
      section_order = excluded.section_order;
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.admin_bulk_upsert_library(jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 12. RPC: admin truncate + import (reload CSV)
-- ---------------------------------------------------------------------------
create or replace function public.admin_truncate_and_import_library(p_songs jsonb, p_sections jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not public.is_admin(v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  delete from public.song_sections where true;
  delete from public.songs where true;

  return public.admin_bulk_upsert_library(p_songs, p_sections);
end;
$$;

grant execute on function public.admin_truncate_and_import_library(jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 13. RPC: admin override submission status (optional escape hatch)
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_submission_status(
  p_submission_id text,
  p_status public.submission_status
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not public.is_admin(v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.new_songs set status = p_status, updated_at = now() where id = p_submission_id;
  if not found then
    raise exception 'submission_not_found' using errcode = 'P0002';
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.admin_set_submission_status(text, public.submission_status) to authenticated;

-- ---------------------------------------------------------------------------
-- 14. Backfill profiles for existing auth users (trigger only runs on INSERT)
-- ---------------------------------------------------------------------------
insert into public.profiles (id, username, role)
select
  u.id,
  left(coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)), 64),
  'user'::public.user_role
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
