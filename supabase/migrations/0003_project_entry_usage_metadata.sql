alter table public.project_entries
  add column if not exists performance_role text not null default 'both',
  add column if not exists used_in_mashup boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_entries_performance_role_check'
  ) then
    alter table public.project_entries
      add constraint project_entries_performance_role_check
      check (performance_role in ('vocal', 'instrumental', 'both'));
  end if;
end $$;
