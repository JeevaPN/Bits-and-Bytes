-- CivicSync deterministic development seed. These are labelled development records.
-- Auth users are intentionally not created; use Supabase Auth signup/test-user APIs.
insert into public.street_segments (id, name, area, geom) values
('10000000-0000-4000-8000-000000000001','Marina Service Road','Demo Ward North',st_setsrid(st_makeline(st_makepoint(80.2680,13.0500),st_makepoint(80.2750,13.0540)),4326)::geography),
('10000000-0000-4000-8000-000000000002','Market Street','Demo Ward South',st_setsrid(st_makeline(st_makepoint(80.2450,13.0350),st_makepoint(80.2520,13.0390)),4326)::geography)
on conflict (id) do update set name=excluded.name, area=excluded.area, geom=excluded.geom;

insert into public.projects (id,slug,title,description,work_type,department,contractor,location,geom,planned_start,original_expected_end,expected_end,status,budget,funding_source,is_published,updated_at) values
('20000000-0000-4000-8000-000000000001','marina-service-road-resurfacing','Marina service road resurfacing','Development fixture: resurfacing work with a public timeline.','Road resurfacing','Demo Roads Department','Development Contractor','Marina Service Road',st_setsrid(st_makepoint(80.2710,13.0520),4326)::geography,'2026-10-15','2026-11-15','2026-11-15','planned',250000,'Development fixture',true,now()),
('20000000-0000-4000-8000-000000000002','market-street-drainage-repair','Market Street drainage repair','Development fixture: drainage repair with a separate restoration inspection.','Drainage repair','Demo Public Works Department','Development Contractor','Market Street',st_setsrid(st_makepoint(80.2480,13.0370),4326)::geography,'2026-09-01','2026-10-01','2026-10-10','delayed',180000,'Development fixture',true,now())
on conflict (id) do update set title=excluded.title,description=excluded.description,status=excluded.status,expected_end=excluded.expected_end,is_published=excluded.is_published,updated_at=excluded.updated_at;

insert into public.project_segments(project_id,segment_id) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002') on conflict do nothing;

insert into public.project_events(id,project_id,event_type,details,public_visible) values
('21000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','development_seeded','{"message":"Development fixture record"}',true),
('21000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','development_seeded','{"message":"Development fixture record"}',true) on conflict(id) do nothing;

insert into public.issues(id,title,description,category,location,geom,observed_at,source,review_status,urgent) values
('30000000-0000-4000-8000-000000000001','Pothole near Marina service road','Development fixture: a pothole reported near the resurfacing project.','pothole','Marina Service Road',st_setsrid(st_makepoint(80.2720,13.0525),4326)::geography,'2026-10-08T08:00:00Z','citizen','unverified',false),
('30000000-0000-4000-8000-000000000002','Blocked footpath at Market Street','Development fixture: footpath access is blocked near the drainage works.','blocked_footpath','Market Street',st_setsrid(st_makepoint(80.2490,13.0375),4326)::geography,'2026-10-09T09:30:00Z','citizen','accepted',true)
on conflict(id) do update set title=excluded.title,description=excluded.description,review_status=excluded.review_status,urgent=excluded.urgent;
