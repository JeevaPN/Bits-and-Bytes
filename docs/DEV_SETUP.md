# CivicSync development lifecycle

Keep `.env` and `.env.local` local. The setup script uses the pinned project-local Supabase CLI; it does not require Scoop, Chocolatey, or a global CLI. For local Supabase, Docker Desktop is the only external runtime required. Then run:

```powershell
npm run dev:setup
```

This targets local Supabase, applies migrations, runs the deterministic `supabase/seed.sql`, ensures the three demo Auth accounts exist, and starts Next.js. Configure `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` or `.env` for account provisioning; this secret stays server-side. The idempotent account step creates or restores the Admin, Neighbour, and Community Partner demo users and an approved demo partner group. It saves generated login details to the ignored `.cache/demo-accounts.json` file.

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

Reset is local-only and requires `-ConfirmReset`. Remote migration or seed operations require explicit PowerShell opt-ins. Remote reset is refused. The SQL seed contains labelled development projects, issues, and street segments with stable IDs; the separate account initialization step provisions the three explicitly named demo users through Supabase Auth.

For a dedicated hosted development project, set the non-secret project ref and explicit classification after verifying them in the Supabase dashboard. The one-command setup derives the ref from `NEXT_PUBLIC_SUPABASE_URL`, checks it matches, and uses the linked project; it never resets a hosted database:

The hosted-development one-command wrapper still requires an explicit classification:

```powershell
$env:CIVICSYNC_REMOTE_TARGET = 'development'
$env:CIVICSYNC_REMOTE_PROJECT_REF = '<verified-project-ref>'
npm run dev:setup:remote
```

The wrapper refuses to run when either identity check is absent or mismatched. A one-time `npx supabase login` and `npx supabase link --project-ref <verified-project-ref>` may be required; both use the project-local pinned CLI. It never provides a production bypass.
