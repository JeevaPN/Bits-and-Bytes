-- Authentication UI and profile provisioning are intentionally handled separately.
alter table public.projects add column if not exists ward text not null default 'Unassigned';
alter table public.projects add column if not exists known_closure text;

create table if not exists public.coordination_case_events (
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.coordination_cases(id) on delete cascade,
  actor_id uuid not null references public.profiles(id), event_type text not null check (event_type in ('created','proposal','accepted','rejected')),
  details jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.restoration_inspections (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id), inspection_date date not null,
  status text not null default 'inspection_due' check (status in ('inspection_due','passed','defect_found','remediation','reinspection_due')),
  inspector_id uuid references public.profiles(id), notes text, evidence_path text, reinspection_date date,
  created_by uuid not null references public.profiles(id), updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.restoration_inspection_events (
  id uuid primary key default gen_random_uuid(), inspection_id uuid not null references public.restoration_inspections(id) on delete cascade,
  actor_id uuid not null references public.profiles(id), event_type text not null, details jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.group_application_reviews (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.social_groups(id) on delete cascade,
  admin_id uuid not null references public.profiles(id), action text not null check (action in ('approve','reject','more_info','suspend')),
  reason text not null check (length(trim(reason)) >= 3), created_at timestamptz not null default now()
);

alter table public.coordination_case_events enable row level security;
alter table public.restoration_inspections enable row level security;
alter table public.restoration_inspection_events enable row level security;
alter table public.group_application_reviews enable row level security;
grant select on public.coordination_case_events, public.restoration_inspections, public.restoration_inspection_events, public.group_application_reviews to authenticated;
create policy "admins read coordination events" on public.coordination_case_events for select using (public.current_role() = 'admin');
create policy "admins review all groups" on public.social_groups for select using (public.current_role() = 'admin');
create policy "admins read restoration inspections" on public.restoration_inspections for select using (public.current_role() = 'admin');
create policy "admins read restoration events" on public.restoration_inspection_events for select using (public.current_role() = 'admin');
create policy "admins read group application reviews" on public.group_application_reviews for select using (public.current_role() = 'admin');
create policy "admins create projects" on public.projects for insert with check (public.current_role() = 'admin');
create policy "admins update projects" on public.projects for update using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admins delete projects" on public.projects for delete using (public.current_role() = 'admin');

create or replace function public.admin_create_project(
  project_slug text, project_title text, project_description text, project_work_type text,
  project_department text, project_ward text, project_contractor text, project_location text,
  project_latitude double precision, project_longitude double precision,
  project_start date, project_expected_end date, project_status public.project_status,
  project_budget numeric, project_known_closure text
) returns table(project_id uuid, saved_slug text)
language plpgsql security definer set search_path = public as $$
declare saved_id uuid;
begin
  if auth.uid() is null or public.current_role() is distinct from 'admin' then raise exception 'Signed-in Admin role required' using errcode = '42501'; end if;
  if length(trim(coalesce(project_title,''))) < 3 or length(trim(coalesce(project_description,''))) < 3 or length(trim(coalesce(project_department,''))) < 2 or length(trim(coalesce(project_ward,''))) < 2 or length(trim(coalesce(project_location,''))) < 2 then
    raise exception 'Required project details are missing' using errcode = '22023';
  end if;
  if project_latitude not between -90 and 90 or project_longitude not between -180 and 180 then raise exception 'Invalid project coordinates' using errcode = '22023'; end if;
  if project_expected_end < project_start then raise exception 'Expected end precedes planned start' using errcode = '22023'; end if;
  if project_budget is not null and project_budget < 0 then raise exception 'Budget must be nonnegative' using errcode = '22023'; end if;
  insert into public.projects(slug,title,description,work_type,department,ward,contractor,location,geom,planned_start,original_expected_end,expected_end,status,budget,known_closure,is_published,created_by)
  values(project_slug,trim(project_title),trim(project_description),nullif(trim(project_work_type),''),trim(project_department),trim(project_ward),nullif(trim(project_contractor),''),trim(project_location),
    st_setsrid(st_makepoint(project_longitude,project_latitude),4326)::geography,project_start,project_expected_end,project_expected_end,project_status,project_budget,nullif(trim(project_known_closure),''),true,auth.uid())
  returning id into saved_id;
  insert into public.project_events(project_id,actor_id,event_type,details,public_visible)
  values(saved_id,auth.uid(),'project_published',jsonb_build_object('title',trim(project_title),'department',trim(project_department),'ward',trim(project_ward)),true);
  return query select saved_id,project_slug;
end;
$$;
revoke all on function public.admin_create_project(text,text,text,text,text,text,text,text,double precision,double precision,date,date,public.project_status,numeric,text) from public,anon;
grant execute on function public.admin_create_project(text,text,text,text,text,text,text,text,double precision,double precision,date,date,public.project_status,numeric,text) to authenticated;

create or replace function public.admin_record_coordination(target_case uuid, operation text, operation_reason text, schedule_payload jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
declare case_row public.coordination_cases%rowtype;
begin
  if auth.uid() is null or public.current_role() is distinct from 'admin' then raise exception 'Signed-in Admin role required' using errcode = '42501'; end if;
  if length(trim(coalesce(operation_reason, ''))) < 3 then raise exception 'A reason is required' using errcode = '22023'; end if;
  select * into case_row from public.coordination_cases where id = target_case for update;
  if not found then raise exception 'Coordination case not found' using errcode = 'P0002'; end if;
  if operation = 'proposal' and schedule_payload is not null then
    update public.coordination_cases set proposed_schedule = schedule_payload, decision_reason = trim(operation_reason) where id = target_case;
  elsif operation in ('accepted','rejected') then
    update public.coordination_cases set decision = operation, decision_reason = trim(operation_reason) where id = target_case;
  else raise exception 'Invalid action or missing schedule' using errcode = '22023'; end if;
  insert into public.coordination_case_events(case_id,actor_id,event_type,details)
  values(target_case,auth.uid(),operation,jsonb_build_object('reason',trim(operation_reason),'schedule',schedule_payload));
end;
$$;
revoke all on function public.admin_record_coordination(uuid,text,text,jsonb) from public, anon;
grant execute on function public.admin_record_coordination(uuid,text,text,jsonb) to authenticated;

create or replace function public.admin_create_coordination(case_title text, linked_projects uuid[], linked_segments uuid[], conflict_reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare saved_id uuid;
begin
  if auth.uid() is null or public.current_role() is distinct from 'admin' then raise exception 'Signed-in Admin role required' using errcode = '42501'; end if;
  if length(trim(coalesce(case_title,''))) < 3 or length(trim(coalesce(conflict_reason,''))) < 3 or coalesce(cardinality(linked_projects),0)=0 then
    raise exception 'Title, at least one project, and a reason are required' using errcode = '22023';
  end if;
  if exists(select 1 from unnest(linked_projects) as x(project_id) where not exists(select 1 from public.projects p where p.id=x.project_id)) then raise exception 'Linked project not found' using errcode = '23503'; end if;
  if coalesce(cardinality(linked_segments),0)>0 and exists(select 1 from unnest(linked_segments) as x(segment_id) where not exists(select 1 from public.street_segments s where s.id=x.segment_id)) then raise exception 'Linked street segment not found' using errcode = '23503'; end if;
  insert into public.coordination_cases(title,project_ids,segment_ids,conflict_reason,created_by)
  values(trim(case_title),linked_projects,coalesce(linked_segments,'{}'),trim(conflict_reason),auth.uid()) returning id into saved_id;
  insert into public.coordination_case_events(case_id,actor_id,event_type,details)
  values(saved_id,auth.uid(),'created',jsonb_build_object('project_ids',linked_projects,'segment_ids',linked_segments,'reason',trim(conflict_reason)));
  return saved_id;
end;
$$;
revoke all on function public.admin_create_coordination(text,uuid[],uuid[],text) from public, anon;
grant execute on function public.admin_create_coordination(text,uuid[],uuid[],text) to authenticated;

create or replace function public.admin_record_restoration(target_inspection uuid, target_project uuid, inspection_day date, inspection_status text, inspection_notes text, followup_day date default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare saved_id uuid;
begin
  if auth.uid() is null or public.current_role() is distinct from 'admin' then raise exception 'Signed-in Admin role required' using errcode = '42501'; end if;
  if inspection_status not in ('inspection_due','passed','defect_found','remediation','reinspection_due') then raise exception 'Invalid inspection status' using errcode = '22023'; end if;
  if length(trim(coalesce(inspection_notes,''))) < 3 then raise exception 'Inspection notes are required' using errcode = '22023'; end if;
  if not exists(select 1 from public.projects where id=target_project) then raise exception 'Project not found' using errcode = '23503'; end if;
  if target_inspection is null then
    insert into public.restoration_inspections(project_id,inspection_date,status,inspector_id,notes,reinspection_date,created_by)
    values(target_project,inspection_day,inspection_status,auth.uid(),trim(inspection_notes),followup_day,auth.uid()) returning id into saved_id;
  else
    update public.restoration_inspections set inspection_date=inspection_day,status=inspection_status,inspector_id=auth.uid(),notes=trim(inspection_notes),reinspection_date=followup_day,updated_at=now()
    where id=target_inspection returning id into saved_id;
    if not found then raise exception 'Inspection not found' using errcode = 'P0002'; end if;
  end if;
  insert into public.restoration_inspection_events(inspection_id,actor_id,event_type,details)
  values(saved_id,auth.uid(),inspection_status,jsonb_build_object('inspection_date',inspection_day,'notes',trim(inspection_notes),'reinspection_date',followup_day));
  return saved_id;
end;
$$;
revoke all on function public.admin_record_restoration(uuid,uuid,date,text,text,date) from public, anon;
grant execute on function public.admin_record_restoration(uuid,uuid,date,text,text,date) to authenticated;

create or replace function public.admin_review_group_application(target_group uuid, review_action text, review_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare next_status public.group_approval_status;
begin
  if auth.uid() is null or public.current_role() is distinct from 'admin' then raise exception 'Signed-in Admin role required' using errcode = '42501'; end if;
  if length(trim(coalesce(review_reason,''))) < 3 then raise exception 'A decision reason is required' using errcode = '22023'; end if;
  next_status := case review_action when 'approve' then 'approved'::public.group_approval_status when 'reject' then 'rejected'::public.group_approval_status when 'more_info' then 'pending'::public.group_approval_status when 'suspend' then 'suspended'::public.group_approval_status else null end;
  if next_status is null then raise exception 'Invalid application action' using errcode = '22023'; end if;
  update public.social_groups set approval_status=next_status where id=target_group;
  if not found then raise exception 'Group application not found' using errcode = 'P0002'; end if;
  insert into public.group_application_reviews(group_id,admin_id,action,reason) values(target_group,auth.uid(),review_action,trim(review_reason));
end;
$$;
revoke all on function public.admin_review_group_application(uuid,text,text) from public, anon;
grant execute on function public.admin_review_group_application(uuid,text,text) to authenticated;
