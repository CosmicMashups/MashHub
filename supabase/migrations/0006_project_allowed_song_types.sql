-- Optional song origin/type filter for projects (Anime, Western, K-Pop, OPM)
alter table public.projects
  add column if not exists allowed_song_types text[];

comment on column public.projects.allowed_song_types is 'When set, Suggest Songs and add-song flows only include songs whose type matches one of these values';
