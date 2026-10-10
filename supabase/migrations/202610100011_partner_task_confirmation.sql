-- Make independent community confirmation a visible, atomic task transition.
-- The issue's official review state remains a separate lifecycle.

create or replace function public.respond_to_community_task_completion(
  p_task_id uuid,
  p_decision text,
  p_note text default null
)
returns table (
  id uuid,
  issue_id uuid,
  group_id uuid,
  status text,
  updated_at timestamptz,
  confirmation_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare task_row public.group_tasks;
begin
  if (select auth.uid()) is null or public.current_role() is distinct from 'common'::public.app_role then
    raise exception 'Signed-in Neighbour account required' using errcode='42501';
  end if;
  if coalesce(p_decision,'') not in ('confirmed','disputed') then
    raise exception 'Choose confirmed or disputed' using errcode='22023';
  end if;
  if p_decision='disputed' and length(trim(coalesce(p_note,'')))<10 then
    raise exception 'A meaningful dispute reason is required' using errcode='22023';
  end if;

  select * into task_row from public.group_tasks where group_tasks.id=p_task_id for update;
  if not found then raise exception 'Group task not found' using errcode='P0002'; end if;
  if task_row.status <> 'awaiting_confirmation' then
    raise exception 'This completion has already received a response' using errcode='22023';
  end if;
  if exists(select 1 from public.group_members gm where gm.group_id=task_row.group_id and gm.user_id=(select auth.uid())) then
    raise exception 'Partner group members cannot confirm their own work' using errcode='42501';
  end if;

  insert into public.group_task_confirmations(task_id,user_id,status,note)
  values(task_row.id,(select auth.uid()),p_decision::public.confirmation_status,nullif(trim(coalesce(p_note,'')),''));
  update public.group_tasks set status=p_decision::public.group_task_status,updated_at=now()
    where group_tasks.id=task_row.id returning * into task_row;
  insert into public.group_task_events(task_id,actor_id,event_type,note)
  values(task_row.id,(select auth.uid()),'community_'||p_decision,nullif(trim(coalesce(p_note,'')),''));

  return query select task_row.id,task_row.issue_id,task_row.group_id,task_row.status::text,task_row.updated_at,
    (select count(*)::integer from public.group_task_confirmations c where c.task_id=task_row.id);
end;
$$;

revoke all on function public.respond_to_community_task_completion(uuid,text,text) from public,anon;
grant execute on function public.respond_to_community_task_completion(uuid,text,text) to authenticated;
revoke insert on public.group_task_confirmations from anon,authenticated;
