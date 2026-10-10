-- Additional Community Partners workflows: suitability, routing, invitations,
-- group collaboration, and explicit public copies of work updates/evidence.

alter table public.social_groups add column if not exists excluded_work text[] not null default '{}';
create table public.community_group_application_evidence (
  id uuid primary key default gen_random_uuid(),group_id uuid not null references public.social_groups(id) on delete cascade,
  object_path text not null unique,uploaded_by uuid not null references public.profiles(id),created_at timestamptz not null default now()
);
alter table public.group_task_referrals
  add column if not exists task_id uuid references public.group_tasks(id) on delete set null,
  add column if not exists target_type text not null default 'official',
  add column if not exists target_group_id uuid references public.social_groups(id) on delete set null;
alter table public.group_task_referrals add constraint group_task_referrals_target_type_check
  check (target_type in ('official','specialist','community_partner'));
alter table public.group_task_referrals add constraint group_task_referrals_target_group_check
  check ((target_type='community_partner')=(target_group_id is not null));

create table public.community_group_invitations (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.social_groups(id) on delete cascade,
  email text not null, permission text not null check(permission in ('editor','viewer')),
  invited_by uuid not null references public.profiles(id), status text not null default 'pending'
    check(status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null default now()+interval '14 days', accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index community_group_one_pending_invite_per_email
  on public.community_group_invitations(group_id,lower(email)) where status='pending';

create table public.community_group_collaboration_requests (
  id uuid primary key default gen_random_uuid(), issue_id uuid not null references public.issues(id) on delete cascade,
  requesting_group_id uuid not null references public.social_groups(id) on delete cascade,
  invited_group_id uuid not null references public.social_groups(id) on delete cascade,
  note text not null check(length(trim(note))>0),
  status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
  created_by uuid not null references public.profiles(id), responded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), responded_at timestamptz,
  check(requesting_group_id<>invited_group_id)
);
create unique index community_group_one_pending_collaboration
  on public.community_group_collaboration_requests(issue_id,requesting_group_id,invited_group_id) where status='pending';

create table public.community_public_task_updates (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.group_tasks(id) on delete cascade,
  source_event_id uuid not null unique references public.group_task_events(id) on delete cascade,
  public_note text not null check(length(trim(public_note))>0 and length(public_note)<=600),
  evidence_path text, published_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create or replace function public.community_issue_in_service_area(target_group uuid,target_issue uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.social_groups g cross join public.issues i
    where g.id=target_group and i.id=target_issue and exists(
      select 1 from regexp_split_to_table(g.service_area,'[,;]|[[:space:]]+and[[:space:]]+') a(token)
      where length(trim(a.token))>=2 and lower(i.location) like '%'||lower(trim(a.token))||'%'));
$$;

create or replace function public.can_publish_community_task_object(group_object text,task_object text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.group_tasks t where t.id::text=task_object
    and t.group_id::text=group_object and public.can_manage_community_group(t.group_id));
$$;

create or replace function public.update_community_group_work_coverage(p_group_id uuid,p_excluded_work text[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_manage_community_group(p_group_id) then raise exception 'Approved group editor permission required' using errcode='42501'; end if;
  if coalesce(cardinality(p_excluded_work),0)>9 or exists(select 1 from unnest(coalesce(p_excluded_work,'{}')) x
    where x is null or x not in ('pothole','damaged_road','fallen_tree','streetlight','open_drain','leak','garbage','blocked_footpath','other')) then
    raise exception 'Excluded work category is invalid' using errcode='22023';
  end if;
  update public.social_groups set excluded_work=p_excluded_work where id=p_group_id;
end;
$$;
create or replace function public.get_community_group_work_coverage(p_group_id uuid)
returns table(service_area text,eligible_work text[],excluded_work text[],limitations text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_manage_community_group(p_group_id) then raise exception 'Approved group member permission required' using errcode='42501'; end if;
  return query select g.service_area,g.eligible_work,g.excluded_work,g.application_limitations from public.social_groups g where g.id=p_group_id;
end;
$$;

create or replace function public.attach_community_application_evidence(p_group_id uuid,p_object_paths text[])
returns integer language plpgsql security definer set search_path = '' as $$
declare attached_count integer;
begin
  if not exists(select 1 from public.social_groups g where g.id=p_group_id and g.owner_id=(select auth.uid())
    and g.approval_status in ('pending','more_info')) then
    raise exception 'Only the applicant may attach application evidence' using errcode='42501';
  end if;
  if coalesce(cardinality(p_object_paths),0)>5 or exists(select 1 from unnest(coalesce(p_object_paths,'{}')) p(path)
      where split_part(p.path,'/',1)<>'applications' or split_part(p.path,'/',2)<>(select auth.uid())::text
        or not exists(select 1 from storage.objects o where o.bucket_id='partner-evidence' and o.name=p.path)) then
    raise exception 'Application evidence objects are invalid' using errcode='22023';
  end if;
  insert into public.community_group_application_evidence(group_id,object_path,uploaded_by)
    select p_group_id,p.path,(select auth.uid()) from unnest(coalesce(p_object_paths,'{}')) p(path)
    on conflict(object_path) do nothing;
  get diagnostics attached_count=row_count;
  return attached_count;
end;
$$;
create or replace function public.my_community_application_evidence(p_group_id uuid)
returns table(id uuid,object_path text,created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.social_groups g where g.id=p_group_id and
      (g.owner_id=(select auth.uid()) or public.current_role()='admin')) then
    raise exception 'Applicant or administrator access required' using errcode='42501';
  end if;
  return query select e.id,e.object_path,e.created_at from public.community_group_application_evidence e where e.group_id=p_group_id order by e.created_at;
end;
$$;

create or replace function public.enforce_community_task_coverage()
returns trigger language plpgsql security definer set search_path = '' as $$
declare issue_row public.issues; group_row public.social_groups;
begin
  if new.status='adopted' and (tg_op='INSERT' or old.status is distinct from new.status) then
    select * into group_row from public.social_groups where id=new.group_id;
    select * into issue_row from public.issues where id=new.issue_id;
    if group_row.approval_status<>'approved' then raise exception 'Only approved groups may accept work' using errcode='42501'; end if;
    if not (issue_row.category=any(group_row.eligible_work)) or issue_row.category=any(group_row.excluded_work) then
      raise exception 'Issue category is outside the group’s approved work coverage' using errcode='22023';
    end if;
    if not public.community_issue_in_service_area(new.group_id,new.issue_id) then
      raise exception 'Issue is outside the group’s declared service area' using errcode='22023';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists community_task_coverage_guard on public.group_tasks;
create trigger community_task_coverage_guard before insert or update of status on public.group_tasks
for each row execute function public.enforce_community_task_coverage();

create or replace function public.refer_community_issue_to(p_issue_id uuid,p_group_id uuid,p_reason text,p_target_type text,p_target_group_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare t public.group_tasks; new_referral uuid;
begin
  if not public.can_manage_community_group(p_group_id) then raise exception 'Approved group editor permission required' using errcode='42501'; end if;
  if length(trim(coalesce(p_reason,'')))=0 or length(p_reason)>1000 or coalesce(p_target_type,'') not in ('official','specialist','community_partner')
     or ((p_target_type='community_partner')<>(p_target_group_id is not null)) then
    raise exception 'A reason and valid referral destination are required' using errcode='22023';
  end if;
  if not exists(select 1 from public.issues where id=p_issue_id) then raise exception 'Issue not found' using errcode='P0002'; end if;
  if p_target_group_id is not null and not exists(select 1 from public.social_groups where id=p_target_group_id
      and approval_status='approved' and id<>p_group_id) then raise exception 'Referral partner must be another approved group' using errcode='22023'; end if;
  if p_target_group_id is not null and not exists(select 1 from public.social_groups g join public.issues i on i.id=p_issue_id
      where g.id=p_target_group_id and i.category=any(g.eligible_work) and not (i.category=any(g.excluded_work))
        and public.community_issue_in_service_area(g.id,p_issue_id)) then
    raise exception 'Referral partner is not suitable for this issue' using errcode='22023';
  end if;
  select * into t from public.group_tasks where issue_id=p_issue_id and group_id=p_group_id for update;
  if found then
    if t.status not in ('adopted','in_progress','reopened','referred') then raise exception 'Task cannot be referred in its current state' using errcode='22023'; end if;
    if t.status<>'referred' then
      update public.group_tasks set status='referred',updated_at=now() where id=t.id returning * into t;
      insert into public.group_task_events(task_id,actor_id,event_type,note) values(t.id,(select auth.uid()),'referred',trim(p_reason));
    end if;
  else
    insert into public.group_tasks(issue_id,group_id,accepted_by,status) values(p_issue_id,p_group_id,(select auth.uid()),'referred') returning * into t;
    insert into public.group_task_events(task_id,actor_id,event_type,note) values(t.id,(select auth.uid()),'referred',trim(p_reason));
  end if;
  insert into public.group_task_referrals(issue_id,group_id,actor_id,reason,task_id,target_type,target_group_id)
    values(p_issue_id,p_group_id,(select auth.uid()),trim(p_reason),t.id,p_target_type,p_target_group_id) returning id into new_referral;
  return new_referral;
end;
$$;
create or replace function public.refer_community_issue(p_issue_id uuid,p_group_id uuid,p_reason text)
returns uuid language sql security definer set search_path = '' as $$
  select public.refer_community_issue_to(p_issue_id,p_group_id,p_reason,'official',null);
$$;
drop function if exists public.my_community_task_referrals(uuid);
create or replace function public.my_community_task_referrals(p_group_id uuid)
returns table(id uuid,issue_id uuid,reason text,target_type text,target_group_id uuid,created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_manage_community_group(p_group_id) then raise exception 'Approved group member permission required' using errcode='42501'; end if;
  return query select r.id,r.issue_id,r.reason,r.target_type,r.target_group_id,r.created_at
    from public.group_task_referrals r where r.group_id=p_group_id or r.target_group_id=p_group_id order by r.created_at desc;
end;
$$;

create or replace function public.create_community_group_invitation(p_group_id uuid,p_email text,p_permission text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invite_id uuid;
begin
  if not exists(select 1 from public.social_groups g where g.id=p_group_id and g.owner_id=(select auth.uid()) and g.approval_status='approved') then
    raise exception 'Approved group owner permission required' using errcode='42501';
  end if;
  if trim(coalesce(p_email,'')) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or coalesce(p_permission,'') not in ('editor','viewer') then
    raise exception 'A valid email and editor or viewer permission are required' using errcode='22023';
  end if;
  insert into public.community_group_invitations(group_id,email,permission,invited_by)
    values(p_group_id,lower(trim(p_email)),p_permission,(select auth.uid()))
    on conflict(group_id,lower(email)) where status='pending' do update set permission=excluded.permission,
      invited_by=excluded.invited_by,expires_at=now()+interval '14 days',created_at=now() returning id into invite_id;
  return invite_id;
end;
$$;
create or replace function public.list_community_group_invitations(p_group_id uuid)
returns table(id uuid,email text,permission text,status text,expires_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.social_groups g where g.id=p_group_id and g.owner_id=(select auth.uid()) and g.approval_status='approved') then
    raise exception 'Approved group owner permission required' using errcode='42501';
  end if;
  return query select i.id,i.email,i.permission,i.status,i.expires_at from public.community_group_invitations i
    where i.group_id=p_group_id order by i.created_at desc;
end;
$$;
create or replace function public.my_community_group_invitations()
returns table(id uuid,group_id uuid,group_name text,permission text,expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select i.id,i.group_id,g.name,i.permission,i.expires_at from public.community_group_invitations i
  join public.social_groups g on g.id=i.group_id and g.approval_status='approved'
  join auth.users u on u.id=(select auth.uid()) and lower(u.email)=lower(i.email)
  where i.status='pending' and i.expires_at>now();
$$;
create or replace function public.accept_community_group_invitation(p_invitation_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invite public.community_group_invitations; account_email text;
begin
  select lower(email) into account_email from auth.users where id=(select auth.uid());
  select * into invite from public.community_group_invitations where id=p_invitation_id for update;
  if not found or invite.status<>'pending' or invite.expires_at<=now() or lower(invite.email)<>account_email then
    raise exception 'Invitation is invalid, expired, or belongs to another account' using errcode='42501';
  end if;
  if not exists(select 1 from public.social_groups where id=invite.group_id and approval_status='approved') then raise exception 'Group is no longer approved' using errcode='22023'; end if;
  insert into public.group_members(group_id,user_id,permission) values(invite.group_id,(select auth.uid()),invite.permission)
    on conflict(group_id,user_id) do update set permission=excluded.permission where public.group_members.permission<>'owner';
  update public.community_group_invitations set status='accepted',accepted_at=now() where id=invite.id;
  return invite.group_id;
end;
$$;
create or replace function public.revoke_community_group_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.community_group_invitations i set status='revoked' from public.social_groups g
  where i.id=p_invitation_id and g.id=i.group_id and g.owner_id=(select auth.uid()) and g.approval_status='approved' and i.status='pending';
  if not found then raise exception 'Pending invitation not found or owner permission required' using errcode='42501'; end if;
end;
$$;

create or replace function public.request_community_collaboration(p_issue_id uuid,p_requesting_group_id uuid,p_invited_group_id uuid,p_note text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare issue_row public.issues; request_id uuid;
begin
  if not public.can_manage_community_group(p_requesting_group_id) then raise exception 'Approved requesting group editor permission required' using errcode='42501'; end if;
  if p_requesting_group_id=p_invited_group_id or length(trim(coalesce(p_note,'')))=0 or length(p_note)>1000 then
    raise exception 'Choose another group and provide a collaboration note' using errcode='22023';
  end if;
  select * into issue_row from public.issues where id=p_issue_id;
  if not found then raise exception 'Issue not found' using errcode='P0002'; end if;
  if issue_row.review_status in ('rejected','duplicate') then raise exception 'Issue is not available for collaboration' using errcode='22023'; end if;
  if not exists(select 1 from public.social_groups g where g.id=p_invited_group_id and g.approval_status='approved'
      and issue_row.category=any(g.eligible_work) and not (issue_row.category=any(g.excluded_work))) then
    raise exception 'Invited group is not approved for this work category' using errcode='22023';
  end if;
  if not public.community_issue_in_service_area(p_invited_group_id,p_issue_id) then raise exception 'Issue is outside invited group’s service area' using errcode='22023'; end if;
  insert into public.community_group_collaboration_requests(issue_id,requesting_group_id,invited_group_id,note,created_by)
    values(p_issue_id,p_requesting_group_id,p_invited_group_id,trim(p_note),(select auth.uid())) returning id into request_id;
  return request_id;
end;
$$;
create or replace function public.list_community_collaboration_requests(p_group_id uuid)
returns table(id uuid,issue_id uuid,requesting_group_id uuid,invited_group_id uuid,note text,status text,created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_manage_community_group(p_group_id) then raise exception 'Approved group member permission required' using errcode='42501'; end if;
  return query select r.id,r.issue_id,r.requesting_group_id,r.invited_group_id,r.note,r.status,r.created_at
    from public.community_group_collaboration_requests r where r.requesting_group_id=p_group_id or r.invited_group_id=p_group_id
    order by r.created_at desc;
end;
$$;
create or replace function public.respond_community_collaboration(p_request_id uuid,p_decision text)
returns text language plpgsql security definer set search_path = '' as $$
declare request_row public.community_group_collaboration_requests;
begin
  select * into request_row from public.community_group_collaboration_requests where id=p_request_id for update;
  if not found then raise exception 'Collaboration request not found' using errcode='P0002'; end if;
  if not public.can_manage_community_group(request_row.invited_group_id) then raise exception 'Only invited group may respond' using errcode='42501'; end if;
  if request_row.status<>'pending' or coalesce(p_decision,'') not in ('accepted','declined') then raise exception 'Request cannot be answered' using errcode='22023'; end if;
  update public.community_group_collaboration_requests set status=p_decision,responded_by=(select auth.uid()),responded_at=now() where id=p_request_id;
  return p_decision;
end;
$$;

create or replace function public.publish_community_task_update(p_task_id uuid,p_event_id uuid,p_public_note text,p_public_evidence_path text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare task_group uuid; update_id uuid;
begin
  select group_id into task_group from public.group_tasks where id=p_task_id;
  if not found then raise exception 'Task not found' using errcode='P0002'; end if;
  if not public.can_manage_community_group(task_group) then raise exception 'Approved group editor permission required' using errcode='42501'; end if;
  if length(trim(coalesce(p_public_note,'')))=0 or length(p_public_note)>600 or not exists(
    select 1 from public.group_task_events where id=p_event_id and task_id=p_task_id) then
    raise exception 'Public note and matching event are required' using errcode='22023';
  end if;
  if p_public_evidence_path is not null and (split_part(p_public_evidence_path,'/',1)<>'public-evidence'
      or split_part(p_public_evidence_path,'/',2)<>task_group::text
      or split_part(p_public_evidence_path,'/',3)<>p_task_id::text
      or not exists(select 1 from storage.objects where bucket_id='partner-evidence' and name=p_public_evidence_path)) then
    raise exception 'Public evidence object is invalid' using errcode='22023';
  end if;
  insert into public.community_public_task_updates(task_id,source_event_id,public_note,evidence_path,published_by)
    values(p_task_id,p_event_id,trim(p_public_note),p_public_evidence_path,(select auth.uid()))
    on conflict(source_event_id) do update set public_note=excluded.public_note,evidence_path=excluded.evidence_path,
      published_by=excluded.published_by,updated_at=now() returning id into update_id;
  return update_id;
end;
$$;
create or replace function public.unpublish_community_task_update(p_update_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare task_group uuid;
begin
  select t.group_id into task_group from public.community_public_task_updates u join public.group_tasks t on t.id=u.task_id where u.id=p_update_id;
  if not found or not public.can_manage_community_group(task_group) then raise exception 'Update not found or group permission required' using errcode='42501'; end if;
  delete from public.community_public_task_updates where id=p_update_id;
end;
$$;
create or replace function public.my_community_public_task_updates(p_task_id uuid)
returns table(id uuid,source_event_id uuid,public_note text,evidence_path text,created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.group_tasks t where t.id=p_task_id and public.can_manage_community_group(t.group_id)) then
    raise exception 'Approved group member permission required' using errcode='42501';
  end if;
  return query select u.id,u.source_event_id,u.public_note,u.evidence_path,u.created_at
    from public.community_public_task_updates u where u.task_id=p_task_id order by u.created_at desc;
end;
$$;
create or replace function public.my_community_public_task_update_path(p_update_id uuid)
returns text language plpgsql stable security definer set search_path = '' as $$
declare path text; task_group uuid;
begin
  select t.group_id,u.evidence_path into task_group,path from public.community_public_task_updates u
    join public.group_tasks t on t.id=u.task_id where u.id=p_update_id;
  if not found or not public.can_manage_community_group(task_group) then raise exception 'Update not found or group permission required' using errcode='42501'; end if;
  return path;
end;
$$;

create or replace view public.public_community_task_history as
  select g.slug as group_slug,g.name as group_name,t.id as task_id,t.issue_id,i.title as issue_title,
    i.category as issue_category,i.location as issue_location,t.status::text as task_status,
    u.id as update_id,u.public_note,u.created_at as update_created_at,u.evidence_path,t.updated_at as task_updated_at
  from public.social_groups g join public.group_tasks t on t.group_id=g.id join public.issues i on i.id=t.issue_id
  left join public.community_public_task_updates u on u.task_id=t.id
  where g.approval_status='approved' and t.status in ('adopted','in_progress','awaiting_confirmation','confirmed','disputed','reopened');

create or replace function public.is_published_community_evidence(object_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.community_public_task_updates u join public.group_tasks t on t.id=u.task_id
    join public.social_groups g on g.id=t.group_id where u.evidence_path=object_path and g.approval_status='approved');
$$;

create or replace function public.my_community_task_events(p_task_id uuid)
returns table(id uuid,task_id uuid,event_type text,note text,evidence_path text,created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.group_tasks t where t.id=p_task_id and public.can_manage_community_group(t.group_id)) then
    raise exception 'Approved group member permission required' using errcode='42501';
  end if;
  return query select e.id,e.task_id,e.event_type,coalesce(e.note,''),e.evidence_path,e.created_at
    from public.group_task_events e where e.task_id=p_task_id order by e.created_at;
end;
$$;

create or replace view public.public_group_task_events as
  select u.source_event_id as id,u.task_id,'public_update'::text as event_type,u.public_note as note,u.created_at
  from public.community_public_task_updates u
  join public.group_tasks t on t.id=u.task_id
  join public.social_groups g on g.id=t.group_id and g.approval_status='approved';

alter table public.community_group_invitations enable row level security;
alter table public.community_group_collaboration_requests enable row level security;
alter table public.community_public_task_updates enable row level security;
alter table public.community_group_application_evidence enable row level security;
revoke all on public.community_group_invitations,public.community_group_collaboration_requests,public.community_public_task_updates,public.community_group_application_evidence from public,anon,authenticated;
drop policy if exists "partner public evidence upload" on storage.objects;
create policy "partner public evidence upload" on storage.objects for insert to authenticated with check(
  bucket_id='partner-evidence' and array_length(storage.foldername(name),1)=3
  and (storage.foldername(name))[1]='public-evidence'
  and public.can_publish_community_task_object((storage.foldername(name))[2],(storage.foldername(name))[3]));
drop policy if exists "partner evidence upload" on storage.objects;
create policy "partner evidence upload" on storage.objects for insert to authenticated with check(
  bucket_id='partner-evidence' and (
    (array_length(storage.foldername(name),1)=1 and public.can_manage_community_task_object((storage.foldername(name))[1]))
    or (array_length(storage.foldername(name),1)=2 and (storage.foldername(name))[1]='campaigns'
      and public.can_manage_community_campaign_object((storage.foldername(name))[2]))
    or (array_length(storage.foldername(name),1)=2 and (storage.foldername(name))[1]='applications'
      and (storage.foldername(name))[2]=(select auth.uid())::text)
    or (array_length(storage.foldername(name),1)=3 and (storage.foldername(name))[1]='public-evidence'
      and public.can_publish_community_task_object((storage.foldername(name))[2],(storage.foldername(name))[3]))
  ));
drop policy if exists "partner evidence read authorized" on storage.objects;
create policy "partner evidence read authorized" on storage.objects for select to authenticated using(
  bucket_id='partner-evidence' and (
    (array_length(storage.foldername(name),1)=1 and public.can_manage_community_task_object((storage.foldername(name))[1]))
    or (array_length(storage.foldername(name),1)=2 and (storage.foldername(name))[1]='campaigns'
      and public.can_manage_community_campaign_object((storage.foldername(name))[2]))
    or (array_length(storage.foldername(name),1)=2 and (storage.foldername(name))[1]='applications'
      and ((storage.foldername(name))[2]=(select auth.uid())::text or public.current_role()='admin'))
    or (array_length(storage.foldername(name),1)=3 and (storage.foldername(name))[1]='public-evidence'
      and public.can_publish_community_task_object((storage.foldername(name))[2],(storage.foldername(name))[3]))
  ));
drop policy if exists "published partner evidence is publicly readable" on storage.objects;
create policy "published partner evidence is publicly readable" on storage.objects for select to anon,authenticated using(
  bucket_id='partner-evidence' and array_length(storage.foldername(name),1)=3
  and (storage.foldername(name))[1]='public-evidence' and public.is_published_community_evidence(name));
drop policy if exists "partner evidence delete authorized" on storage.objects;
create policy "partner evidence delete authorized" on storage.objects for delete to authenticated using(
  bucket_id='partner-evidence' and (
    (array_length(storage.foldername(name),1)=1 and public.can_manage_community_task_object((storage.foldername(name))[1]))
    or (array_length(storage.foldername(name),1)=2 and (storage.foldername(name))[1]='campaigns'
      and public.can_manage_community_campaign_object((storage.foldername(name))[2]))
    or (array_length(storage.foldername(name),1)=2 and (storage.foldername(name))[1]='applications'
      and ((storage.foldername(name))[2]=(select auth.uid())::text or public.current_role()='admin'))
    or (array_length(storage.foldername(name),1)=3 and (storage.foldername(name))[1]='public-evidence'
      and public.can_publish_community_task_object((storage.foldername(name))[2],(storage.foldername(name))[3]))
  ));

revoke all on function public.community_issue_in_service_area(uuid,uuid) from public,anon;
revoke all on function public.can_publish_community_task_object(text,text) from public,anon;
revoke all on function public.is_published_community_evidence(text) from public;
revoke all on function public.update_community_group_work_coverage(uuid,text[]) from public,anon;
revoke all on function public.get_community_group_work_coverage(uuid) from public,anon;
revoke all on function public.my_community_task_events(uuid) from public,anon;
revoke all on function public.attach_community_application_evidence(uuid,text[]) from public,anon;
revoke all on function public.my_community_application_evidence(uuid) from public,anon;
revoke all on function public.refer_community_issue_to(uuid,uuid,text,text,uuid) from public,anon;
revoke all on function public.my_community_task_referrals(uuid) from public,anon;
revoke all on function public.create_community_group_invitation(uuid,text,text) from public,anon;
revoke all on function public.list_community_group_invitations(uuid) from public,anon;
revoke all on function public.my_community_group_invitations() from public,anon;
revoke all on function public.accept_community_group_invitation(uuid) from public,anon;
revoke all on function public.revoke_community_group_invitation(uuid) from public,anon;
revoke all on function public.request_community_collaboration(uuid,uuid,uuid,text) from public,anon;
revoke all on function public.list_community_collaboration_requests(uuid) from public,anon;
revoke all on function public.respond_community_collaboration(uuid,text) from public,anon;
revoke all on function public.publish_community_task_update(uuid,uuid,text,text) from public,anon;
revoke all on function public.unpublish_community_task_update(uuid) from public,anon;
revoke all on function public.my_community_public_task_updates(uuid) from public,anon;
revoke all on function public.my_community_public_task_update_path(uuid) from public,anon;
grant execute on function public.update_community_group_work_coverage(uuid,text[]) to authenticated;
grant execute on function public.get_community_group_work_coverage(uuid) to authenticated;
grant execute on function public.my_community_task_events(uuid) to authenticated;
grant execute on function public.attach_community_application_evidence(uuid,text[]) to authenticated;
grant execute on function public.my_community_application_evidence(uuid) to authenticated;
grant execute on function public.refer_community_issue_to(uuid,uuid,text,text,uuid) to authenticated;
grant execute on function public.my_community_task_referrals(uuid) to authenticated;
grant execute on function public.create_community_group_invitation(uuid,text,text) to authenticated;
grant execute on function public.list_community_group_invitations(uuid) to authenticated;
grant execute on function public.my_community_group_invitations() to authenticated;
grant execute on function public.accept_community_group_invitation(uuid) to authenticated;
grant execute on function public.revoke_community_group_invitation(uuid) to authenticated;
grant execute on function public.request_community_collaboration(uuid,uuid,uuid,text) to authenticated;
grant execute on function public.list_community_collaboration_requests(uuid) to authenticated;
grant execute on function public.respond_community_collaboration(uuid,text) to authenticated;
grant execute on function public.publish_community_task_update(uuid,uuid,text,text) to authenticated;
grant execute on function public.unpublish_community_task_update(uuid) to authenticated;
grant execute on function public.my_community_public_task_updates(uuid) to authenticated;
grant execute on function public.my_community_public_task_update_path(uuid) to authenticated;
grant select on public.public_community_task_history to anon,authenticated;
grant execute on function public.can_publish_community_task_object(text,text) to authenticated;
grant execute on function public.is_published_community_evidence(text) to anon,authenticated;
