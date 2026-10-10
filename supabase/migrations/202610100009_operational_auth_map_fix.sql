-- Operational repair for environments where the core objects exist but Auth
-- or PostgREST retained stale trigger/schema metadata. Forward-only and safe
-- to apply more than once.

create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, primary_role)
  values (
    new.id,
    coalesce(nullif(left(trim(new.raw_user_meta_data->>'display_name'), 80), ''), 'CivicSync resident'),
    'common'::public.app_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Supabase-hosted PostgREST reloads its schema cache after this notification.
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception when insufficient_privilege then
  null;
end;
$$;
