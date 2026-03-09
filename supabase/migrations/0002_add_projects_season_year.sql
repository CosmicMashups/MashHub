-- Add season, year, year range, and cover_image to projects (Suggest Songs filters + cover art)
alter table public.projects
  add column if not exists year integer,
  add column if not exists season text default '',
  add column if not exists year_range_min integer,
  add column if not exists year_range_max integer,
  add column if not exists cover_image text;

comment on column public.projects.year is 'Year filter for Year-End / Seasonal projects (Suggest Songs)';
comment on column public.projects.season is 'Season filter for Seasonal projects (Suggest Songs)';
comment on column public.projects.year_range_min is 'Year range min for Decade projects';
comment on column public.projects.year_range_max is 'Year range max for Decade projects';
comment on column public.projects.cover_image is 'Cover art as base64 data URL';
