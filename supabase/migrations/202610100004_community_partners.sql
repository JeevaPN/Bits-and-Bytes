-- Community Partners persistence and authorization.
-- Mutations go through narrowly scoped SECURITY DEFINER RPCs. The RPCs derive
-- the actor from auth.uid(); browser supplied IDs never establish authority.

alter table public.social_groups
  add column if not exists application_limitations text not null default '',
  add column if not exists application_review_note text not null default '',
  add column if not exists application_reviewed_at timestamptz,
  add column if not exists application_reviewed_by uuid references public.profiles(id);

insert into public.group_members(group_id,user_id,permission)
  select g.id,g.owner_id,'owner' from public.social_groups g
  on conflict(group_id,user_id) do nothing;
do $$
begin
  if exists (
    select 1 from public.social_groups
    where approval_status='pending'
    group by owner_id having count(*) > 1
  ) then
    raise exception 'Cannot create Community Partners application index: resolve existing duplicate pending applications per owner first';
  end if;
end;
$$;
create unique index if not exists social_groups_one_pending_application_per_owner
  on public.social_groups(owner_id) where approval_status='pending';
alter table public.sponsorship_campaigns
  add column if not exists is_simulated boolean not null default true check (is_simulated);

create table if not exists public.group_task_referrals (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  group_id uuid not null references public.social_groups(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  reason text not null check (length(trim(reason)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.sponsorship_campaign_updates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sponsorship_campaigns(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  note text not null check (length(trim(note)) > 0),
  evidence_path text,
  actor_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists group_task_referrals_group_created_idx
  on public.group_task_referrals(group_id, created_at desc);
create index if not exists sponsorship_campaign_updates_campaign_created_idx
  on public.sponsorship_campaign_updates(campaign_id, created_at desc);

-- Only one active group may hold an issue at a time, even under concurrent
-- requests. Referred/disputed/confirmed tasks release the claim.
do $$
begin
  if exists (
    select 1 from public.group_tasks
    where status in ('adopted','in_progress','awaiting_confirmation','reopened')
    group by issue_id having count(*) > 1
  ) then
    raise exception 'Cannot create Community Partners claim index: resolve existing competing active group_tasks first';
  end if;
end;
$$;
create unique index if not exists group_tasks_one_active_claim_per_issue
  on public.group_tasks(issue_id)
  where status in ('adopted','in_progress','awaiting_confirmation','reopened');

create or replace function public.add_group_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members(group_id,user_id,permission)
  values(new.id,new.owner_id,'owner')
  on conflict(group_id,user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_community_group_created_owner_member on public.social_groups;
create trigger on_community_group_created_owner_member
  after insert on public.social_groups
  for each row execute function public.add_group_owner_membership();

create or replace function public.can_manage_community_group(target_group uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members gm
    join public.social_groups g on g.id = gm.group_id
    where gm.group_id = target_group
      and gm.user_id = (select auth.uid())
      and gm.permission in ('owner','editor')
      and g.approval_status = 'approved'
  );
$$;

create or replace function public.can_manage_community_task_object(task_object text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_tasks t
    where t.id::text = task_object and public.can_manage_community_group(t.group_id)
  );
$$;

create or replace function public.can_manage_community_campaign_object(campaign_object text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.sponsorship_campaigns c
    where c.id::text = campaign_object and public.can_manage_community_group(c.group_id)
  );
$$;

create or replace function public.my_community_groups()
returns table (
  id uuid, slug text, name text, description text, area text,
  contact text, capabilities text[], approved boolean, approval_status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.slug, g.name, g.description, g.service_area,
    coalesce(g.contact_email, ''), g.eligible_work,
    g.approval_status = 'approved', g.approval_status::text
  from public.social_groups g
  join public.group_members gm on gm.group_id = g.id
  where gm.user_id = (select auth.uid());
$$;

create or replace function public.submit_community_group_application(
  p_name text,
  p_description text,
  p_service_area text,
  p_contact_email text,
  p_eligible_work text[],
  p_limitations text
)
returns table (application_id uuid, status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  new_group_id uuid;
  base_slug text;
begin
  if actor is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if public.current_role() is distinct from 'common'::public.app_role then
    raise exception 'Only common accounts may apply' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_name,''))) < 2 or length(p_name) > 100
     or length(trim(coalesce(p_description,''))) < 10 or length(p_description) > 1000
     or length(trim(coalesce(p_service_area,''))) < 2 or length(p_service_area) > 160
     or length(p_contact_email) > 254 or length(coalesce(p_limitations,'')) > 1000
     or trim(coalesce(p_contact_email,'')) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or coalesce(cardinality(p_eligible_work),0) = 0 or cardinality(p_eligible_work) > 9 then
    raise exception 'Complete the required application fields' using errcode = '22023';
  end if;
  if exists(select 1 from unnest(p_eligible_work) capability where capability is null or capability not in
      ('pothole','damaged_road','fallen_tree','streetlight','open_drain','leak','garbage','blocked_footpath','other')) then
    raise exception 'One or more work capabilities are invalid' using errcode = '22023';
  end if;
  if exists (select 1 from public.social_groups g where g.owner_id = actor and g.approval_status = 'pending') then
    raise exception 'You already have an application awaiting review' using errcode = '23505';
  end if;

  base_slug := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then base_slug := 'community-partner'; end if;
  insert into public.social_groups(
    owner_id, name, slug, description, approval_status, location,
    service_area, contact_email, eligible_work, application_limitations
  ) values (
    actor, trim(p_name), left(base_slug, 80) || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,8),
    trim(p_description), 'pending', trim(p_service_area), trim(p_service_area),
    lower(trim(p_contact_email)), p_eligible_work, trim(coalesce(p_limitations,''))
  ) returning id into new_group_id;
  return query select new_group_id, 'pending'::text;
end;
$$;

create or replace function public.resubmit_community_group_application(
  p_group_id uuid, p_name text, p_description text, p_service_area text,
  p_contact_email text, p_eligible_work text[], p_limitations text
)
returns table (application_id uuid, status text)
language plpgsql security definer set search_path = '' as $$
declare group_row public.social_groups;
begin
  select * into group_row from public.social_groups where id=p_group_id for update;
  if not found then raise exception 'Application not found' using errcode='P0002'; end if;
  if group_row.owner_id is distinct from (select auth.uid()) then
    raise exception 'Only the applicant may resubmit this application' using errcode='42501';
  end if;
  if group_row.approval_status::text <> 'more_info' then
    raise exception 'This application is not awaiting more information' using errcode='22023';
  end if;
  if length(trim(coalesce(p_name,'')))<2 or length(p_name)>100
     or length(trim(coalesce(p_description,'')))<10 or length(p_description)>1000
     or length(trim(coalesce(p_service_area,'')))<2 or length(p_service_area)>160
     or length(p_contact_email)>254 or length(coalesce(p_limitations,''))>1000
     or trim(coalesce(p_contact_email,'')) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or coalesce(cardinality(p_eligible_work),0)=0 or cardinality(p_eligible_work)>9 then
    raise exception 'Complete the required application fields' using errcode='22023';
  end if;
  if exists(select 1 from unnest(p_eligible_work) capability where capability is null or capability not in
      ('pothole','damaged_road','fallen_tree','streetlight','open_drain','leak','garbage','blocked_footpath','other')) then
    raise exception 'One or more work capabilities are invalid' using errcode='22023';
  end if;
  update public.social_groups set name=trim(p_name), description=trim(p_description),
    location=trim(p_service_area), service_area=trim(p_service_area), contact_email=lower(trim(p_contact_email)),
    eligible_work=p_eligible_work, application_limitations=trim(coalesce(p_limitations,'')),
    approval_status='pending', application_review_note='', application_reviewed_at=null,
    application_reviewed_by=null
    where id=p_group_id;
  return query select p_group_id, 'pending'::text;
end;
$$;

create or replace function public.review_community_group_application(
  p_group_id uuid, p_decision text, p_reason text
)
returns table (application_id uuid, status text)
language plpgsql security definer set search_path = '' as $$
declare new_status text;
begin
  if (select auth.uid()) is null or public.current_role() is distinct from 'admin'::public.app_role then
    raise exception 'Administrator permission required' using errcode='42501';
  end if;
  if p_decision not in ('approve','reject','more_info','suspend')
     or length(trim(coalesce(p_reason,'')))=0 or length(p_reason)>1000 then
    raise exception 'A valid decision and reason are required' using errcode='22023';
  end if;
  new_status := case p_decision when 'approve' then 'approved' when 'reject' then 'rejected'
    when 'more_info' then 'more_info' else 'suspended' end;
  update public.social_groups set approval_status=new_status::public.group_approval_status,
    application_review_note=trim(p_reason), application_reviewed_at=now(), application_reviewed_by=(select auth.uid())
    where id=p_group_id and approval_status::text in ('pending','approved','rejected','suspended','more_info')
    returning id, approval_status::text into application_id, status;
  if not found then raise exception 'Application not found' using errcode='P0002'; end if;
  return next;
end;
$$;

create or replace function public.my_community_application_feedback(p_group_id uuid)
returns table (status text, review_note text, reviewed_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select g.approval_status::text, g.application_review_note, g.application_reviewed_at
  from public.social_groups g
  where g.id=p_group_id and g.owner_id=(select auth.uid());
$$;

create or replace function public.manage_community_group_member(p_group_id uuid, p_user_id uuid, p_permission text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.social_groups g where g.id=p_group_id
      and g.owner_id=(select auth.uid()) and g.approval_status='approved') then
    raise exception 'Approved group owner permission required' using errcode='42501';
  end if;
  if p_user_id is null or p_user_id=(select auth.uid()) or p_permission not in ('editor','viewer') then
    raise exception 'Select another user and editor or viewer access' using errcode='22023';
  end if;
  insert into public.group_members(group_id,user_id,permission)
    values(p_group_id,p_user_id,p_permission)
    on conflict(group_id,user_id) do update set permission=excluded.permission
      where public.group_members.permission <> 'owner';
  if not found then raise exception 'The group owner role cannot be changed' using errcode='22023'; end if;
end;
$$;

create or replace function public.remove_community_group_member(p_group_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.social_groups g where g.id=p_group_id
      and g.owner_id=(select auth.uid()) and g.approval_status='approved') then
    raise exception 'Approved group owner permission required' using errcode='42501';
  end if;
  delete from public.group_members where group_id=p_group_id and user_id=p_user_id and permission <> 'owner';
end;
$$;

create or replace function public.list_community_group_members(p_group_id uuid)
returns table (user_id uuid, permission text, joined_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.social_groups g where g.id=p_group_id
      and g.owner_id=(select auth.uid()) and g.approval_status='approved') then
    raise exception 'Approved group owner permission required' using errcode='42501';
  end if;
  return query select gm.user_id,gm.permission,gm.created_at
    from public.group_members gm where gm.group_id=p_group_id order by gm.created_at;
end;
$$;

create or replace function public.admin_list_community_group_applications(p_status text default 'pending')
returns table (
  id uuid, owner_id uuid, name text, slug text, description text, status text,
  service_area text, contact_email text, eligible_work text[], limitations text,
  review_note text, created_at timestamptz, reviewed_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or public.current_role() is distinct from 'admin'::public.app_role then
    raise exception 'Administrator permission required' using errcode='42501';
  end if;
  if p_status not in ('pending','approved','rejected','more_info','suspended','all') then
    raise exception 'Invalid application status filter' using errcode='22023';
  end if;
  return query select g.id,g.owner_id,g.name,g.slug,g.description,g.approval_status::text,
    g.service_area,g.contact_email,g.eligible_work,g.application_limitations,
    g.application_review_note,g.created_at,g.application_reviewed_at
  from public.social_groups g
  where p_status='all' or g.approval_status::text=p_status
  order by g.created_at desc;
end;
$$;

create or replace function public.update_community_group_profile(
  p_group_id uuid,
  p_description text,
  p_service_area text,
  p_contact_email text,
  p_eligible_work text[]
)
returns setof public.social_groups
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_community_group(p_group_id) then
    raise exception 'Approved group owner or editor permission required' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_description,''))) < 10 or length(p_description) > 1000
     or length(trim(coalesce(p_service_area,''))) < 2 or length(p_service_area) > 160
     or length(p_contact_email) > 254 or trim(coalesce(p_contact_email,'')) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or coalesce(cardinality(p_eligible_work),0) = 0 or cardinality(p_eligible_work) > 9 then
    raise exception 'Complete the required profile fields' using errcode = '22023';
  end if;
  if exists(select 1 from unnest(p_eligible_work) capability where capability is null or capability not in
      ('pothole','damaged_road','fallen_tree','streetlight','open_drain','leak','garbage','blocked_footpath','other')) then
    raise exception 'One or more work capabilities are invalid' using errcode = '22023';
  end if;
  return query update public.social_groups g
    set description = trim(p_description), location = trim(p_service_area),
        service_area = trim(p_service_area), contact_email = lower(trim(p_contact_email)),
        eligible_work = p_eligible_work
    where g.id = p_group_id and g.approval_status = 'approved'
    returning g.*;
end;
$$;

create or replace function public.accept_community_issue(
  p_issue_id uuid,
  p_group_id uuid
)
returns public.group_tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  issue_row public.issues;
  task_row public.group_tasks;
begin
  if not public.can_manage_community_group(p_group_id) then
    raise exception 'Approved group owner or editor permission required' using errcode = '42501';
  end if;
  select * into issue_row from public.issues where id = p_issue_id for update;
  if not found then raise exception 'Issue not found' using errcode = 'P0002'; end if;
  if issue_row.review_status in ('rejected','duplicate') then
    raise exception 'This issue is not available for partner work' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.social_groups g
    where g.id = p_group_id and issue_row.category = any(g.eligible_work)
  ) then raise exception 'Issue category is outside this group’s capabilities' using errcode = '22023'; end if;
  if exists (select 1 from public.group_tasks t where t.issue_id = p_issue_id
    and t.status in ('adopted','in_progress','awaiting_confirmation','reopened')) then
    raise exception 'Issue already has an active partner claim' using errcode = '23505';
  end if;
  select * into task_row from public.group_tasks where issue_id=p_issue_id and group_id=p_group_id for update;
  if found then
    if task_row.status not in ('referred','disputed') then
      raise exception 'This group already has a task record for the issue' using errcode = '23505';
    end if;
    update public.group_tasks set status='adopted', accepted_by=(select auth.uid()),
      completion_evidence_path=null, updated_at=now() where id=task_row.id returning * into task_row;
  else
    insert into public.group_tasks(issue_id, group_id, accepted_by, status)
      values (p_issue_id, p_group_id, (select auth.uid()), 'adopted') returning * into task_row;
  end if;
  insert into public.group_task_events(task_id, actor_id, event_type, note)
    values (task_row.id, (select auth.uid()), 'accepted', 'Group accepted suitable work.');
  return task_row;
end;
$$;

create or replace function public.refer_community_issue(
  p_issue_id uuid,
  p_group_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_id uuid;
begin
  if not public.can_manage_community_group(p_group_id) then
    raise exception 'Approved group owner or editor permission required' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_reason,''))) = 0 or length(p_reason) > 1000 then raise exception 'Referral reason is required' using errcode = '22023'; end if;
  insert into public.group_task_referrals(issue_id, group_id, actor_id, reason)
    values (p_issue_id, p_group_id, (select auth.uid()), trim(p_reason)) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.record_community_task_progress(
  p_task_id uuid,
  p_note text,
  p_evidence_path text default null
)
returns public.group_tasks
language plpgsql
security definer
set search_path = ''
as $$
declare task_row public.group_tasks;
begin
  select * into task_row from public.group_tasks where id = p_task_id for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;
  if not public.can_manage_community_group(task_row.group_id) then raise exception 'Group editor permission required' using errcode = '42501'; end if;
  if task_row.status not in ('adopted','in_progress','reopened') then raise exception 'Task is not open for progress updates' using errcode = '22023'; end if;
  if length(trim(coalesce(p_note,''))) = 0 or length(p_note) > 1000 then raise exception 'Progress note is required' using errcode = '22023'; end if;
  if p_evidence_path is not null and (split_part(p_evidence_path,'/',1) <> p_task_id::text
      or not exists(select 1 from storage.objects o where o.bucket_id='partner-evidence' and o.name=p_evidence_path)) then
    raise exception 'Evidence object is invalid' using errcode = '22023';
  end if;
  update public.group_tasks set status='in_progress', updated_at=now() where id=p_task_id returning * into task_row;
  insert into public.group_task_events(task_id,actor_id,event_type,note,evidence_path)
    values(p_task_id,(select auth.uid()),'progress',trim(p_note),p_evidence_path);
  return task_row;
end;
$$;

create or replace function public.submit_community_task_completion(
  p_task_id uuid,
  p_note text,
  p_evidence_path text
)
returns public.group_tasks
language plpgsql
security definer
set search_path = ''
as $$
declare task_row public.group_tasks;
begin
  select * into task_row from public.group_tasks where id = p_task_id for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;
  if not public.can_manage_community_group(task_row.group_id) then raise exception 'Group editor permission required' using errcode = '42501'; end if;
  if task_row.status not in ('adopted','in_progress') then raise exception 'Task is not ready for completion review' using errcode = '22023'; end if;
  if length(trim(coalesce(p_note,''))) = 0 or length(p_note) > 1000 or p_evidence_path is null
     or split_part(p_evidence_path,'/',1) <> p_task_id::text
     or not exists(select 1 from storage.objects o where o.bucket_id='partner-evidence' and o.name=p_evidence_path) then
    raise exception 'Completion note and uploaded evidence are required' using errcode = '22023';
  end if;
  update public.group_tasks set status='awaiting_confirmation', completion_evidence_path=p_evidence_path,
    updated_at=now() where id=p_task_id returning * into task_row;
  insert into public.group_task_events(task_id,actor_id,event_type,note,evidence_path)
    values(p_task_id,(select auth.uid()),'completion_submitted',trim(p_note),p_evidence_path);
  return task_row;
end;
$$;

create or replace function public.create_community_sponsorship_campaign(
  p_group_id uuid,
  p_title text,
  p_purpose text,
  p_target_amount numeric,
  p_activity text default null
)
returns public.sponsorship_campaigns
language plpgsql
security definer
set search_path = ''
as $$
declare campaign_row public.sponsorship_campaigns;
begin
  if not public.can_manage_community_group(p_group_id) then raise exception 'Approved group editor permission required' using errcode = '42501'; end if;
  if length(trim(coalesce(p_title,'')))=0 or length(p_title)>120 or length(trim(coalesce(p_purpose,'')))=0 or length(p_purpose)>1000 or length(coalesce(p_activity,''))>200 or p_target_amount is null or p_target_amount='NaN'::numeric or p_target_amount <= 0 then
    raise exception 'Campaign title, purpose, and positive target are required' using errcode = '22023';
  end if;
  insert into public.sponsorship_campaigns(group_id,title,purpose,target_amount,activity)
  values(p_group_id,trim(p_title),trim(p_purpose),p_target_amount,nullif(trim(coalesce(p_activity,'')),''))
    returning * into campaign_row;
  return campaign_row;
end;
$$;

create or replace function public.my_community_sponsorship_campaigns(p_group_id uuid)
returns table (id uuid, group_id uuid, title text, purpose text, target_amount numeric, activity text, status text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.group_id, c.title, c.purpose, c.target_amount, c.activity, c.status, c.created_at
  from public.sponsorship_campaigns c
  where c.group_id=p_group_id and public.can_manage_community_group(p_group_id)
  order by c.created_at desc;
$$;

create or replace function public.my_community_campaign_updates(p_campaign_id uuid)
returns table (id uuid, campaign_id uuid, amount numeric, note text, evidence_path text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.campaign_id, u.amount, u.note, u.evidence_path, u.created_at
  from public.sponsorship_campaign_updates u
  join public.sponsorship_campaigns c on c.id=u.campaign_id
  where u.campaign_id=p_campaign_id and public.can_manage_community_group(c.group_id)
  order by u.created_at desc;
$$;

create or replace function public.report_community_campaign_use(
  p_campaign_id uuid,
  p_amount numeric,
  p_note text,
  p_evidence_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare campaign_group uuid; update_id uuid;
begin
  select group_id into campaign_group from public.sponsorship_campaigns where id=p_campaign_id and status='active';
  if not found then raise exception 'Campaign not found' using errcode = 'P0002'; end if;
  if not public.can_manage_community_group(campaign_group) then raise exception 'Approved group editor permission required' using errcode = '42501'; end if;
  if p_amount is null or p_amount='NaN'::numeric or p_amount < 0 or length(trim(coalesce(p_note,'')))=0 or length(p_note)>1000 then raise exception 'A non-negative amount and note are required' using errcode = '22023'; end if;
  if p_evidence_path is not null and (split_part(p_evidence_path,'/',1) <> 'campaigns'
      or split_part(p_evidence_path,'/',2) <> p_campaign_id::text
      or not exists(select 1 from storage.objects o where o.bucket_id='partner-evidence' and o.name=p_evidence_path)) then
    raise exception 'Evidence object is invalid' using errcode = '22023';
  end if;
  insert into public.sponsorship_campaign_updates(campaign_id,amount,note,evidence_path,actor_id)
    values(p_campaign_id,p_amount,trim(p_note),p_evidence_path,(select auth.uid())) returning id into update_id;
  return update_id;
end;
$$;

-- Partner-facing history is returned through scoped RPCs so private evidence
-- paths and referral notes are never exposed by the public read views.
create or replace function public.my_community_task_referrals(p_group_id uuid)
returns table (id uuid, issue_id uuid, reason text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.id, r.issue_id, r.reason, r.created_at
  from public.group_task_referrals r
  where r.group_id=p_group_id and public.can_manage_community_group(p_group_id)
  order by r.created_at desc;
$$;

create or replace function public.my_community_task_evidence(p_task_id uuid)
returns table (id uuid, event_type text, note text, evidence_path text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select e.id, e.event_type, coalesce(e.note,''), e.evidence_path, e.created_at
  from public.group_task_events e
  join public.group_tasks t on t.id=e.task_id
  where t.id=p_task_id and public.can_manage_community_group(t.group_id)
    and e.evidence_path is not null
  order by e.created_at desc;
$$;

create or replace function public.withdraw_community_task_completion(p_task_id uuid, p_reason text)
returns public.group_tasks
language plpgsql security definer set search_path = '' as $$
declare task_row public.group_tasks;
begin
  select * into task_row from public.group_tasks where id=p_task_id for update;
  if not found then raise exception 'Task not found' using errcode='P0002'; end if;
  if not public.can_manage_community_group(task_row.group_id) then
    raise exception 'Approved group editor permission required' using errcode='42501';
  end if;
  if task_row.status <> 'awaiting_confirmation' then
    raise exception 'Only a submitted completion can be withdrawn' using errcode='22023';
  end if;
  if length(trim(coalesce(p_reason,'')))=0 or length(p_reason)>1000 then
    raise exception 'A withdrawal reason is required' using errcode='22023';
  end if;
  update public.group_tasks set status='in_progress', completion_evidence_path=null, updated_at=now()
    where id=p_task_id returning * into task_row;
  insert into public.group_task_events(task_id,actor_id,event_type,note,evidence_path)
    values(p_task_id,(select auth.uid()),'completion_withdrawn',trim(p_reason),null);
  return task_row;
end;
$$;

-- Safe public read models intentionally omit ownership IDs, private application
-- fields, member identities, and storage paths.
create or replace view public.public_community_groups as
  select id, slug, name, description, service_area as area, contact_email as contact,
         eligible_work as capabilities
  from public.social_groups where approval_status='approved';

create or replace view public.public_community_opportunities as
  select i.id, i.title, i.description, i.category, i.location,
         st_y(i.geom::geometry) as latitude, st_x(i.geom::geometry) as longitude,
         i.observed_at, i.created_at,
         (select count(*)::integer from public.issue_verifications v where v.issue_id=i.id) as verification_count,
         i.review_status, i.urgent, i.source
  from public.issues i where i.review_status not in ('rejected','duplicate');

create or replace view public.community_partner_tasks as
  select t.id, t.issue_id, t.group_id, t.status, t.updated_at,
         count(c.user_id)::integer as confirmation_count,
         i.title as issue_title, i.description as issue_description, i.category as issue_category,
         i.location as issue_location, i.observed_at, i.created_at as issue_created_at,
         i.review_status, i.urgent, i.source
  from public.group_tasks t
  join public.social_groups g on g.id=t.group_id and g.approval_status='approved'
  join public.issues i on i.id=t.issue_id
  left join public.group_task_confirmations c on c.task_id=t.id
  group by t.id, i.id;

create or replace view public.public_group_task_events as
  select e.id, e.task_id, e.event_type, e.note, e.created_at
  from public.group_task_events e
  join public.group_tasks t on t.id=e.task_id
  join public.social_groups g on g.id=t.group_id and g.approval_status='approved';

create or replace view public.public_sponsorship_campaign_updates as
  select u.id, u.campaign_id, u.amount, u.note, c.is_simulated as simulated, u.created_at
  from public.sponsorship_campaign_updates u
  join public.sponsorship_campaigns c on c.id=u.campaign_id and c.status='active'
  join public.social_groups g on g.id=c.group_id and g.approval_status='approved';

create or replace view public.public_sponsorship_campaigns as
  select c.id, g.slug as group_slug, g.name as group_name, c.activity, c.title, c.purpose,
         c.target_amount, c.status, c.is_simulated as simulated, c.created_at
  from public.sponsorship_campaigns c
  join public.social_groups g on g.id=c.group_id and g.approval_status='approved'
  where c.status='active';

alter table public.group_task_referrals enable row level security;
alter table public.sponsorship_campaign_updates enable row level security;

-- Remove broad mutations from the initial scaffold. RPCs below provide the
-- only authenticated mutation surface for partner records.
drop policy if exists "group owner applies" on public.social_groups;
drop policy if exists "approved group editors update" on public.social_groups;
drop policy if exists "approved group accepts task" on public.group_tasks;
drop policy if exists "approved group updates own task" on public.group_tasks;
drop policy if exists "group records task event" on public.group_task_events;
drop policy if exists "group manages campaigns" on public.sponsorship_campaigns;
drop policy if exists "public group task history" on public.group_task_events;
drop policy if exists "group member reads membership" on public.group_members;

create policy "members read their group profile" on public.social_groups
  for select using (owner_id=auth.uid() or public.is_approved_group_member(id));
create policy "approved members read task events" on public.group_task_events
  for select using (exists(select 1 from public.group_tasks t where t.id=task_id and public.is_approved_group_member(t.group_id)));
create policy "approved group members read referrals" on public.group_task_referrals
  for select using (public.can_manage_community_group(group_id));
create policy "group editors read campaign use updates" on public.sponsorship_campaign_updates
  for select using (exists(select 1 from public.sponsorship_campaigns c where c.id=campaign_id and public.can_manage_community_group(c.group_id)));
create policy "public active campaign use summaries" on public.sponsorship_campaign_updates
  for select using (exists(select 1 from public.sponsorship_campaigns c join public.social_groups g on g.id=c.group_id where c.id=campaign_id and c.status='active' and g.approval_status='approved'));
create policy "approved group members read own campaigns" on public.sponsorship_campaigns
  for select using (public.can_manage_community_group(group_id));

revoke select, insert, update, delete on public.social_groups from anon, authenticated;
revoke select, insert, update, delete on public.group_members from anon, authenticated;
revoke select, insert, update, delete on public.group_tasks from anon, authenticated;
revoke select, insert, update, delete on public.group_task_events from anon, authenticated;
revoke select, insert, update, delete on public.sponsorship_campaigns from anon, authenticated;
revoke select, insert, update, delete on public.group_task_referrals from anon, authenticated;
revoke select, insert, update, delete on public.sponsorship_campaign_updates from anon, authenticated;
grant select (id,name,slug,description,approval_status,location,service_area,eligible_work,created_at)
  on public.social_groups to anon, authenticated;
revoke select on public.group_members from anon, authenticated;
grant select (id,issue_id,group_id,status,created_at,updated_at)
  on public.group_tasks to anon, authenticated;
revoke select on public.group_task_events from anon, authenticated;
revoke select on public.sponsorship_campaign_updates from anon, authenticated;
revoke all on function public.can_manage_community_group(uuid) from public, anon;
revoke all on function public.can_manage_community_task_object(text) from public, anon;
revoke all on function public.can_manage_community_campaign_object(text) from public, anon;
revoke all on function public.add_group_owner_membership() from public, anon, authenticated;
revoke all on function public.my_community_groups() from public, anon;
revoke all on function public.submit_community_group_application(text,text,text,text,text[],text) from public, anon;
revoke all on function public.resubmit_community_group_application(uuid,text,text,text,text,text[],text) from public, anon;
revoke all on function public.review_community_group_application(uuid,text,text) from public, anon;
revoke all on function public.admin_list_community_group_applications(text) from public, anon;
revoke all on function public.my_community_application_feedback(uuid) from public, anon;
revoke all on function public.manage_community_group_member(uuid,uuid,text) from public, anon;
revoke all on function public.remove_community_group_member(uuid,uuid) from public, anon;
revoke all on function public.list_community_group_members(uuid) from public, anon;
revoke all on function public.update_community_group_profile(uuid,text,text,text,text[]) from public, anon;
revoke all on function public.accept_community_issue(uuid,uuid) from public, anon;
revoke all on function public.refer_community_issue(uuid,uuid,text) from public, anon;
revoke all on function public.record_community_task_progress(uuid,text,text) from public, anon;
revoke all on function public.submit_community_task_completion(uuid,text,text) from public, anon;
revoke all on function public.create_community_sponsorship_campaign(uuid,text,text,numeric,text) from public, anon;
revoke all on function public.my_community_sponsorship_campaigns(uuid) from public, anon;
revoke all on function public.my_community_campaign_updates(uuid) from public, anon;
revoke all on function public.report_community_campaign_use(uuid,numeric,text,text) from public, anon;
revoke all on function public.my_community_task_referrals(uuid) from public, anon;
revoke all on function public.my_community_task_evidence(uuid) from public, anon;
revoke all on function public.withdraw_community_task_completion(uuid,text) from public, anon;
grant execute on function public.can_manage_community_group(uuid) to authenticated;
grant execute on function public.can_manage_community_task_object(text) to authenticated;
grant execute on function public.can_manage_community_campaign_object(text) to authenticated;

grant select on public.public_community_groups to anon, authenticated;
grant select on public.public_community_opportunities to anon, authenticated;
grant select on public.community_partner_tasks to anon, authenticated;
grant select on public.public_group_task_events to anon, authenticated;
grant select on public.public_sponsorship_campaign_updates to anon, authenticated;
grant select on public.public_sponsorship_campaigns to anon, authenticated;

grant execute on function public.my_community_groups() to authenticated;
grant execute on function public.submit_community_group_application(text,text,text,text,text[],text) to authenticated;
grant execute on function public.resubmit_community_group_application(uuid,text,text,text,text,text[],text) to authenticated;
grant execute on function public.review_community_group_application(uuid,text,text) to authenticated;
grant execute on function public.admin_list_community_group_applications(text) to authenticated;
grant execute on function public.my_community_application_feedback(uuid) to authenticated;
grant execute on function public.manage_community_group_member(uuid,uuid,text) to authenticated;
grant execute on function public.remove_community_group_member(uuid,uuid) to authenticated;
grant execute on function public.list_community_group_members(uuid) to authenticated;
grant execute on function public.update_community_group_profile(uuid,text,text,text,text[]) to authenticated;
grant execute on function public.accept_community_issue(uuid,uuid) to authenticated;
grant execute on function public.refer_community_issue(uuid,uuid,text) to authenticated;
grant execute on function public.record_community_task_progress(uuid,text,text) to authenticated;
grant execute on function public.submit_community_task_completion(uuid,text,text) to authenticated;
grant execute on function public.create_community_sponsorship_campaign(uuid,text,text,numeric,text) to authenticated;
grant execute on function public.my_community_sponsorship_campaigns(uuid) to authenticated;
grant execute on function public.my_community_campaign_updates(uuid) to authenticated;
grant execute on function public.report_community_campaign_use(uuid,numeric,text,text) to authenticated;
grant execute on function public.my_community_task_referrals(uuid) to authenticated;
grant execute on function public.my_community_task_evidence(uuid) to authenticated;
grant execute on function public.withdraw_community_task_completion(uuid,text) to authenticated;

-- Private evidence bucket. Objects are scoped by task UUID or
-- campaigns/<campaign UUID>; never expose public URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('partner-evidence','partner-evidence',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "partner evidence upload" on storage.objects;
drop policy if exists "partner evidence read authorized" on storage.objects;
drop policy if exists "partner evidence delete authorized" on storage.objects;
create policy "partner evidence upload" on storage.objects
  for insert to authenticated with check (
    bucket_id='partner-evidence' and (
      (array_length(storage.foldername(name),1)=1
        and public.can_manage_community_task_object((storage.foldername(name))[1]))
      or (array_length(storage.foldername(name),1)=2 and (storage.foldername(name))[1]='campaigns'
        and public.can_manage_community_campaign_object((storage.foldername(name))[2]))
    )
  );
create policy "partner evidence read authorized" on storage.objects
  for select to authenticated using (
    bucket_id='partner-evidence' and (
      (array_length(storage.foldername(name),1)=1
        and public.can_manage_community_task_object((storage.foldername(name))[1]))
      or (array_length(storage.foldername(name),1)=2 and (storage.foldername(name))[1]='campaigns'
        and public.can_manage_community_campaign_object((storage.foldername(name))[2]))
    )
  );
create policy "partner evidence delete authorized" on storage.objects
  for delete to authenticated using (
    bucket_id='partner-evidence' and (
      (array_length(storage.foldername(name),1)=1
        and public.can_manage_community_task_object((storage.foldername(name))[1]))
      or (array_length(storage.foldername(name),1)=2 and (storage.foldername(name))[1]='campaigns'
        and public.can_manage_community_campaign_object((storage.foldername(name))[2]))
    )
  );
