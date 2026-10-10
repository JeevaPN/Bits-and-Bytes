-- Read-only CivicSync schema/read-model verification. Raises an error when
-- migration history and the actual database schema disagree.
do $$
declare
  missing text;
begin
  select string_agg(required.name, ', ' order by required.name)
    into missing
  from (values
    ('profiles'), ('projects'), ('issues'), ('street_segments'),
    ('public_issue_feed'), ('public_project_map_feed'),
    ('sponsorship_campaigns'), ('project_events')
  ) as required(name)
  left join pg_class relation on relation.relname = required.name
  left join pg_namespace namespace on namespace.oid = relation.relnamespace
    and namespace.nspname = 'public'
  where relation.oid is null or namespace.oid is null;

  if missing is not null then
    raise exception 'CivicSync schema/read-model verification failed; missing public relations: %', missing;
  end if;

  if not exists (
    select 1 from pg_proc function
    join pg_namespace namespace on namespace.oid = function.pronamespace
    where namespace.nspname = 'public' and function.proname = 'handle_new_user'
  ) then
    raise exception 'CivicSync schema verification failed; public.handle_new_user is missing';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects'
  ) then
    raise exception 'CivicSync security verification failed; projects has no RLS policy';
  end if;
end;
$$;
