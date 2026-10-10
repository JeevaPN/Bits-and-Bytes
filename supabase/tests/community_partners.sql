-- Run with `supabase test db` after applying migrations. Requires Supabase auth,
-- storage schemas and pgTAP from the local Supabase stack.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(47);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('10000000-0000-4000-8000-000000000001','authenticated','authenticated','partner-owner@example.test','',now(),'{}','{"display_name":"Partner owner"}',now(),now()),
 ('10000000-0000-4000-8000-000000000002','authenticated','authenticated','other-owner@example.test','',now(),'{}','{"display_name":"Other owner"}',now(),now()),
 ('10000000-0000-4000-8000-000000000005','authenticated','authenticated','applicant@example.test','',now(),'{}','{"display_name":"Applicant"}',now(),now()),
 ('10000000-0000-4000-8000-000000000006','authenticated','authenticated','admin@example.test','',now(),'{}','{"display_name":"Admin"}',now(),now()),
 ('10000000-0000-4000-8000-000000000007','authenticated','authenticated','invitee@example.test','',now(),'{}','{"display_name":"Invitee"}',now(),now());
insert into public.profiles(id,display_name,primary_role)
values
 ('10000000-0000-4000-8000-000000000001','Partner owner','common'),
 ('10000000-0000-4000-8000-000000000002','Other owner','common'),
 ('10000000-0000-4000-8000-000000000005','Applicant','common'),
 ('10000000-0000-4000-8000-000000000006','Admin','admin'),
 ('10000000-0000-4000-8000-000000000007','Invitee','common')
on conflict(id) do update set display_name=excluded.display_name,primary_role=excluded.primary_role;

insert into public.social_groups(id,owner_id,name,slug,description,approval_status,location,service_area,contact_email,eligible_work)
values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Partner One','partner-one','A partner group for testing access controls.','approved','Test Ward','Test Ward','one@example.test',array['pothole']),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Partner Two','partner-two','A second partner group for testing claims.','approved','Test Ward','Test Ward','two@example.test',array['pothole']);
insert into public.issues(id,title,description,category,location,geom,observed_at,review_status)
values
 ('30000000-0000-4000-8000-000000000001','Test pothole','A pothole used to test partner task claims.','pothole','Test Ward',st_setsrid(st_makepoint(80.2,13.0),4326)::geography,now(),'unverified'),
 ('30000000-0000-4000-8000-000000000002','Remote pothole','Outside the partner service area.','pothole','Far Ward',st_setsrid(st_makepoint(80.3,13.0),4326)::geography,now(),'unverified');

select set_config('test.task_id','',true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select extensions.lives_ok(
  $$select public.accept_community_issue('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001')$$,
  'approved owner can accept eligible issue'
);
reset role;
select set_config('test.task_id',(select id::text from public.group_tasks where issue_id='30000000-0000-4000-8000-000000000001'),true);

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.accept_community_issue('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002')$$,
  '23505','Issue already has an active partner claim','competing partner claim is rejected atomically'
);
select extensions.is(public.can_manage_community_task_object(current_setting('test.task_id')),false,
  'another approved group cannot manage the claimed task evidence');
select extensions.throws_ok(
  $$select public.update_community_group_profile('20000000-0000-4000-8000-000000000001','Changed description for group profile.','Test Ward','changed@example.test',array['pothole'])$$,
  '42501','Approved group owner or editor permission required','members cannot edit another group profile'
);
select extensions.throws_ok(
  $$update public.social_groups set description='unauthorized direct update' where id='20000000-0000-4000-8000-000000000001'$$,
  '42501','permission denied for table social_groups','direct table writes are revoked'
);
select extensions.throws_ok(
  $$select public.create_community_sponsorship_campaign('20000000-0000-4000-8000-000000000001','Blocked campaign','Not owned by this group.',100,'test')$$,
  '42501','Approved group editor permission required','another group cannot create a campaign for this group'
);
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select extensions.is(public.can_manage_community_task_object(current_setting('test.task_id')),true,
  'task owner can manage its private evidence');
select extensions.lives_ok(
  $$select public.record_community_task_progress(current_setting('test.task_id')::uuid,'Crew inspected the site.',null)$$,
  'approved group owner can record task progress'
);
select extensions.is((select status::text from public.group_tasks where id=current_setting('test.task_id')::uuid),'in_progress',
  'progress moves the partner task into progress');
select set_config('test.progress_event_id',(select id::text from public.group_task_events where task_id=current_setting('test.task_id')::uuid and event_type='progress' order by created_at desc limit 1),true);
select extensions.lives_ok(
  $$select public.publish_community_task_update(current_setting('test.task_id')::uuid,current_setting('test.progress_event_id')::uuid,'Crew began a cleanup at Test Ward.',null)$$,
  'group can publish a separate public summary for its work event'
);
select extensions.is((select count(*)::integer from public.public_community_task_history where group_slug='partner-one' and public_note='Crew began a cleanup at Test Ward.'),1,
  'public profile history contains explicitly published partner notes');
select extensions.lives_ok(
  $$select public.update_community_group_work_coverage('20000000-0000-4000-8000-000000000001',array['pothole'])$$,
  'approved group can record structured excluded work categories'
);
select extensions.throws_ok(
  $$select public.accept_community_issue('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001')$$,
  '22023','Issue category is outside the group’s approved work coverage','excluded work category is blocked'
);
select extensions.lives_ok(
  $$select public.update_community_group_work_coverage('20000000-0000-4000-8000-000000000001','{}')$$,
  'group can clear excluded work categories'
);
select extensions.throws_ok(
  $$select public.accept_community_issue('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001')$$,
  '22023','Issue is outside the group’s declared service area','work outside service area is blocked'
);
reset role;
select extensions.is((select review_status::text from public.issues where id='30000000-0000-4000-8000-000000000001'),'unverified',
  'partner task changes do not update official issue review status');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select extensions.lives_ok(
  $$select public.create_community_sponsorship_campaign('20000000-0000-4000-8000-000000000001','Test campaign','A simulated Community Partners campaign.',100,'test')$$,
  'approved group owner can create a campaign'
);
reset role;
select set_config('test.campaign_id',(select id::text from public.sponsorship_campaigns where group_id='20000000-0000-4000-8000-000000000001'),true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select extensions.lives_ok(
  $$select public.report_community_campaign_use(current_setting('test.campaign_id')::uuid,12.50,'Purchased cleanup supplies.',null)$$,
  'campaign owner can persist a use report'
);
select extensions.is((select count(*)::integer from public.my_community_campaign_updates(current_setting('test.campaign_id')::uuid)),1,
  'campaign owner can read persisted use reports');
reset role;
select extensions.is((select simulated from public.public_sponsorship_campaigns where id=current_setting('test.campaign_id')::uuid),true,
  'public campaign record is labelled simulated');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
set local role authenticated;
select extensions.lives_ok(
  $$select * from public.submit_community_group_application('Applicant Group','A local group applying for partner access.','Test Ward','applicant-group@example.test',array['pothole'],'No electrical or licensed contractor work.')$$,
  'authenticated common account can submit a Community Partner application'
);
select extensions.is((select approval_status from public.my_community_groups() where name='Applicant Group'),'pending','new application starts pending');
select set_config('test.application_id',(select id::text from public.my_community_groups() where name='Applicant Group'),true);
select extensions.throws_ok(
  $$select * from public.submit_community_group_application('Applicant Group Two','A second application from the same account.','Test Ward','second@example.test',array['pothole'],'')$$,
  '23505','You already have an application awaiting review','duplicate pending application is rejected'
);
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
set local role authenticated;
select extensions.throws_ok(
  $$select * from public.review_community_group_application('20000000-0000-4000-8000-000000000005','approve','Not an administrator')$$,
  '42501','Administrator permission required','partner applicant cannot review applications'
);
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000006',true);
set local role authenticated;
select extensions.is((select status from public.review_community_group_application(
  current_setting('test.application_id')::uuid,'more_info','Please clarify volunteer capacity.')),'more_info',
  'administrator can request more application information');
select extensions.is((select count(*)::integer from public.admin_list_community_group_applications('more_info')),1,
  'administrator can list applications by review status');
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
set local role authenticated;
select extensions.is((select status from public.resubmit_community_group_application(
  current_setting('test.application_id')::uuid,'Applicant Group','An updated description for this community partner.',
  'Test Ward','applicant-group@example.test',array['pothole'],'Updated limitations.')),'pending',
  'applicant can resubmit after providing more information');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select extensions.lives_ok(
  $$select public.manage_community_group_member('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','editor')$$,
  'approved group owner can add another user as editor'
);
select extensions.is((select permission from public.list_community_group_members('20000000-0000-4000-8000-000000000001') where user_id='10000000-0000-4000-8000-000000000002'),'editor',
  'group owner can read membership permissions');
select extensions.throws_ok(
  $$select public.list_community_group_members('20000000-0000-4000-8000-000000000002')$$,
  '42501','Approved group owner permission required','owner cannot inspect another group membership');
select extensions.lives_ok(
  $$select public.refer_community_issue_to('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Requires municipal equipment.','specialist',null)$$,
  'approved group can persist a task referral');
select extensions.is((select reason from public.my_community_task_referrals('20000000-0000-4000-8000-000000000001') limit 1),'Requires municipal equipment.',
  'referral history is available to its group');
select extensions.is((select target_type from public.my_community_task_referrals('20000000-0000-4000-8000-000000000001') limit 1),'specialist',
  'referral records its routing destination');
select extensions.is((select status::text from public.group_tasks where id=current_setting('test.task_id')::uuid),'referred',
  'referring active work releases the claim');
select set_config('test.invitation_id',public.create_community_group_invitation('20000000-0000-4000-8000-000000000001','invitee@example.test','viewer')::text,true);
select extensions.is((select count(*)::integer from public.list_community_group_invitations('20000000-0000-4000-8000-000000000001') where id=current_setting('test.invitation_id')::uuid),1,
  'group owner can view its pending member invitation');
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.accept_community_group_invitation(current_setting('test.invitation_id')::uuid)$$,
  '42501','Invitation is invalid, expired, or belongs to another account','another user cannot accept an email-bound invitation'
);
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000007',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.my_community_group_invitations() where id=current_setting('test.invitation_id')::uuid),1,
  'invitation is visible to the matching account email');
select extensions.is(public.accept_community_group_invitation(current_setting('test.invitation_id')::uuid)::text,'20000000-0000-4000-8000-000000000001',
  'invited user can accept the membership');
reset role;
select extensions.is((select permission from public.group_members where group_id='20000000-0000-4000-8000-000000000001' and user_id='10000000-0000-4000-8000-000000000007'),'viewer',
  'accepted invitation persists the viewer role');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select set_config('test.collaboration_id',public.request_community_collaboration('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Please coordinate the cleanup schedule.')::text,true);
select extensions.is((select count(*)::integer from public.list_community_collaboration_requests('20000000-0000-4000-8000-000000000001') where id=current_setting('test.collaboration_id')::uuid),1,
  'requesting group can read its collaboration request');
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select extensions.is(public.respond_community_collaboration(current_setting('test.collaboration_id')::uuid,'accepted'),'accepted',
  'invited group can accept a collaboration request');
select extensions.is((select status from public.community_group_collaboration_requests where id=current_setting('test.collaboration_id')::uuid),'accepted',
  'collaboration response is persisted');
reset role;
select extensions.ok(
  exists(select 1 from storage.buckets b where b.id='partner-evidence' and not b.public)
  and exists(select 1 from pg_policies p where p.schemaname='storage' and p.tablename='objects'
    and p.policyname='partner evidence read authorized' and p.qual like '%can_manage_community_task_object%')
  and exists(select 1 from pg_policies p where p.schemaname='storage' and p.tablename='objects'
    and p.policyname='published partner evidence is publicly readable' and p.qual like '%is_published_community_evidence%')
  and exists(select 1 from pg_policies p where p.schemaname='storage' and p.tablename='objects'
    and p.policyname='partner evidence upload' and p.with_check like '%applications%'),
  'original evidence is private and only explicitly published copies can be read publicly'
);

update public.group_tasks set status='awaiting_confirmation',completion_evidence_path='test-task/evidence.webp'
where id=current_setting('test.task_id')::uuid;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.record_community_task_progress(current_setting('test.task_id')::uuid,'Late progress update',null)$$,
  '22023','Task is not open for progress updates','awaiting-confirmation task rejects progress updates'
);
reset role;

update public.group_tasks set status='awaiting_confirmation',completion_evidence_path='test-task/evidence.webp'
where id=current_setting('test.task_id')::uuid;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select extensions.is((select status::text from public.withdraw_community_task_completion(current_setting('test.task_id')::uuid,'Need to attach a clearer completion photo.')),'in_progress',
  'partner may withdraw its own completion claim');
select extensions.is((select event_type from public.group_task_events where task_id=current_setting('test.task_id')::uuid order by created_at desc limit 1),'completion_withdrawn',
  'withdrawal is persisted as a task history event');
reset role;
select extensions.is((select review_status::text from public.issues where id='30000000-0000-4000-8000-000000000001'),'unverified',
  'withdrawing partner completion does not alter official issue status');

select * from extensions.finish();
rollback;
