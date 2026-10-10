# CivicSync development lifecycle

Install Docker Desktop and the Supabase CLI, keep `.env` and `.env.local` local, then run:

```powershell
npm run dev:setup
```

This targets local Supabase, applies migrations, runs the deterministic `supabase/seed.sql`, and starts Next.js. It does not create Auth users.

Daily startup without data changes:

```powershell
npm run dev
```

Explicit operations:

```powershell
npm run db:migrate
npm run dev:seed
npm run dev:verify
npm run dev:reset -- -ConfirmReset
```

Reset is local-only and requires `-ConfirmReset`. Remote migration or seed operations require explicit PowerShell opt-ins. Remote reset is refused. The seed contains labelled development projects, issues, and street segments with stable IDs; it does not fabricate Auth users, official decisions, payments, or real people.

For a dedicated remote development project, use `-Target remote-dev` with `CIVICSYNC_ALLOW_REMOTE_DEV_MIGRATIONS=1`; seeding additionally requires `CIVICSYNC_ALLOW_REMOTE_DEV_SEED=1`. Never set these for production.

The hosted-development one-command wrapper still requires an explicit classification:

```powershell
$env:CIVICSYNC_REMOTE_TARGET = 'development'
npm run dev:setup:remote
```

The wrapper refuses to run when that classification is absent. It never provides a production bypass.
