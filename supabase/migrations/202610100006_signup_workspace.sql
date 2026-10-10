-- Provision signup profiles. The server action assigns the selected workspace
-- after signup; this trigger only reads the safe Neighbourhood/Partner values.
-- Raw user metadata is never trusted to grant the Admin role directly.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  requested_role public.app_role;
begin
  requested_role := case
    when new.raw_user_meta_data->>'requested_workspace' = 'group' then 'group'::public.app_role
    else 'common'::public.app_role
  end;

  insert into public.profiles (id, display_name, primary_role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'CivicSync resident'),
    requested_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
