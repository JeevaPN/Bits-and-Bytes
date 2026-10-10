create or replace view public.admin_issue_review_queue
with (security_invoker = true)
as
select
  i.id,
  i.title,
  i.description,
  i.category,
  i.location,
  st_y(i.geom::geometry) as latitude,
  st_x(i.geom::geometry) as longitude,
  i.observed_at,
  i.created_at,
  i.source,
  i.review_status,
  i.urgent,
  i.canonical_issue_id,
  count(v.issue_id)::integer as verification_count,
  latest_review.reason as review_note,
  coalesce(i.canonical_issue_id, latest_review.canonical_issue_id) as duplicate_of
from public.issues i
left join public.issue_verifications v on v.issue_id = i.id
left join lateral (
  select r.reason, r.canonical_issue_id
  from public.official_reviews r
  where r.issue_id = i.id
  order by r.created_at desc
  limit 1
) latest_review on true
group by i.id, latest_review.reason, latest_review.canonical_issue_id;

grant select on public.admin_issue_review_queue to anon, authenticated;

create or replace function public.admin_review_issue(
  target_issue uuid,
  review_action text,
  review_reason text,
  canonical_issue uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_status public.issue_review_status;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if public.current_role() is distinct from 'admin' then
    raise exception 'Admin role required' using errcode = '42501';
  end if;
  if length(trim(coalesce(review_reason, ''))) < 3 then
    raise exception 'A decision reason of at least 3 characters is required' using errcode = '22023';
  end if;

  next_status := case review_action
    when 'accept' then 'accepted'::public.issue_review_status
    when 'reject' then 'rejected'::public.issue_review_status
    when 'refer' then 'referred'::public.issue_review_status
    when 'more_info' then 'more_info'::public.issue_review_status
    when 'duplicate' then 'duplicate'::public.issue_review_status
    else null
  end;
  if next_status is null then
    raise exception 'Unsupported review action' using errcode = '22023';
  end if;
  if review_action = 'duplicate' and (canonical_issue is null or canonical_issue = target_issue) then
    raise exception 'A different canonical issue is required for duplicate decisions' using errcode = '22023';
  end if;
  if review_action = 'duplicate' and not exists(select 1 from public.issues where id = canonical_issue) then
    raise exception 'Canonical issue not found' using errcode = '23503';
  end if;

  perform 1 from public.issues where id = target_issue for update;
  if not found then
    raise exception 'Issue not found' using errcode = 'P0002';
  end if;

  insert into public.official_reviews(issue_id, admin_id, action, reason, canonical_issue_id)
  values (target_issue, auth.uid(), review_action, trim(review_reason), case when review_action = 'duplicate' then canonical_issue else null end);

  update public.issues
  set review_status = next_status,
      canonical_issue_id = case when review_action = 'duplicate' then canonical_issue else null end
  where id = target_issue;
end;
$$;

revoke all on function public.admin_review_issue(uuid, text, text, uuid) from public, anon;
grant execute on function public.admin_review_issue(uuid, text, text, uuid) to authenticated;

create policy "admin records official reviews"
on public.official_reviews for insert
with check (admin_id = auth.uid() and public.current_role() = 'admin');

create policy "admin updates official issue status"
on public.issues for update
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');
