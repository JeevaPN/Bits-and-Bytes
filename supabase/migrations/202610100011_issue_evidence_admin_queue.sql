-- Forward-only addition: expose only evidence presence in the review queue.
-- The private Cloudinary public_id is retrieved through the Admin-only proxy.
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
  coalesce(i.canonical_issue_id, latest_review.canonical_issue_id) as duplicate_of,
  (i.evidence_path is not null and i.evidence_path <> '') as has_evidence
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
