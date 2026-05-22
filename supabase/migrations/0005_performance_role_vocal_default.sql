-- Default new project entries to vocal; migrate existing "both" to vocal.
alter table public.project_entries
  alter column performance_role set default 'vocal';

update public.project_entries
set performance_role = 'vocal'
where performance_role = 'both' or performance_role is null;
