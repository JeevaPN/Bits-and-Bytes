-- Auth/profile provisioning and Neighbourhood challenge records.
-- Apply after 202610100001_core.sql. Never edit an already-applied migration.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, primary_role)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'CivicSync resident'), 'common')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.issue_challenges (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) >= 10),
  details text,
  created_at timestamptz not null default now(),
  unique(issue_id, actor_id)
);
alter table public.issue_challenges enable row level security;
create policy "common people challenge public issues" on public.issue_challenges
  for insert with check (auth.uid() = actor_id and public.current_role() = 'common');
create policy "admins review issue challenges" on public.issue_challenges
  for select using (public.current_role() = 'admin');

create or replace view public.public_issue_feed as
select i.id, i.title, i.description, i.category, i.location,
       st_y(i.geom::geometry) as latitude, st_x(i.geom::geometry) as longitude,
       i.observed_at, i.created_at, i.review_status, i.urgent, i.source,
       (select count(*)::integer from public.issue_verifications v where v.issue_id = i.id) as verification_count
from public.issues i;
grant select on public.public_issue_feed to anon, authenticated;

create or replace function public.is_approved_group_editor(target_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.group_members gm
    join public.social_groups g on g.id = gm.group_id
    where gm.group_id = target_group and gm.user_id = auth.uid()
      and gm.permission in ('owner','editor') and g.approval_status = 'approved'
  );
$$;
drop policy if exists "approved group editors update" on public.social_groups;
create policy "approved group editors update" on public.social_groups
  for update using (public.is_approved_group_editor(id))
  with check (public.is_approved_group_editor(id));
