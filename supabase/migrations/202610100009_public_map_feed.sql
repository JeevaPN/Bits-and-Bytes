-- Public map read model. Keep private evidence, reporter identity, and admin notes out of map responses.
create or replace view public.public_project_map_feed
with (security_invoker = true)
as
select
  p.id,
  p.slug,
  p.title,
  p.location,
  p.status,
  st_y(p.geom::geometry) as latitude,
  st_x(p.geom::geometry) as longitude
from public.projects p
where p.is_published = true;

grant select on public.public_project_map_feed to anon, authenticated;
