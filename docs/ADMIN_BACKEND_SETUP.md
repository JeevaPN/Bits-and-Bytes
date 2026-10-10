# Admin backend setup

Admin server actions use the current Supabase session and `profiles.primary_role`. The login UI and profile provisioning are intentionally not part of this change. The Admin writes return a sign-in-required error until that work is added. The service-role key is never used in browser code.

## Apply the database migrations

Run the SQL files in order in the Supabase SQL Editor (or with the Supabase CLI):

1. `supabase/migrations/202610100001_core.sql`
2. `supabase/migrations/202610100002_admin_review_backend.sql`
3. `supabase/migrations/202610100003_admin_workflows.sql`

The second migration adds the issue review read model and atomic decision function. The third adds project metadata, coordination and restoration records, partner review history, and Admin workflow functions/policies.

## Provision an Admin account

Create the staff user in Supabase Authentication. Since profile provisioning is deferred with the login flow, create/promote the trusted Admin profile through the Supabase SQL Editor:

```sql
insert into public.profiles(id, display_name, primary_role)
select id, coalesce(nullif(raw_user_meta_data ->> 'display_name',''), split_part(email, '@', 1), 'CivicSync Admin'), 'admin'
from auth.users
where email = 'approved-admin@example.com'
on conflict (id) do update set primary_role = 'admin';
```

Do not expose an Admin role choice in public sign-up. Database functions and write actions check that the active session belongs to an Admin profile. The sign-in screen and route gate will be added separately.

## Configure the app

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the local environment or deployment settings. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; the current Admin workflows do not need it.

## Current limits

Admin role checks are active, but the `admin_scopes` table is not yet enforced by these workflows; every account with the Admin role currently has global Admin access. Restoration evidence upload and project edit/history screens are not implemented. Public project listing merges published database rows with the existing demo examples.
