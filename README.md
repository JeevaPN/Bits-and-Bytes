# CivicSync

CivicSync gives residents a clear view of public works and local issues, helps approved community groups take on suitable work, and keeps civic responses visible. This starter implements a demo-first vertical slice with a Next.js App Router, TypeScript, Tailwind CSS, Supabase adapters, and a core Postgres/PostGIS migration.

## Setup

Requirements: Node.js 20.9+ and npm. Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Without Supabase environment values the public pages use clearly labelled in-memory demo data. Demo form, moderation, task, and pledge interactions are not persisted. Sponsorship is simulated; no real payment processing exists.

## Environment

Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from a Supabase project. `SUPABASE_SERVICE_ROLE_KEY` is server-only, must never use the `NEXT_PUBLIC_` prefix, and is not needed for the current UI. Do not commit environment files or real credentials.

## Database

In the Supabase SQL editor or CLI, apply `supabase/migrations/202610100001_core.sql`. The migration enables PostGIS and creates the core entities, indexes, constraints, and initial RLS policies. Before deployment, configure private/public evidence storage buckets and policies, validate policies in a test project, and implement authenticated server-side write handlers. Seed content currently comes from `lib/domain/demo-data.ts`; it is explicitly marked demo and is not a database seed.

## Local checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Vercel deployment

1. Import the repository into Vercel and keep the Next.js framework preset.
2. Set the public Supabase URL and anon key in the Vercel project environment. Add a service role key only if a reviewed server-only operation needs it.
3. Apply the database migration and set Supabase Auth redirect/site URLs for the deployed domain.
4. Configure storage buckets, RLS, backups, and monitoring before accepting real user reports.
5. Deploy a preview first, verify the public project URLs and QR destination on the intended domain, then promote to production.

## What's included and what's next

Included: public landing, project and group pages, QR codes, report form with photo selection and coordinate/category validation, demo map preview with separated source labels, Admin review queue, group opportunity ranking and task-state preview, simulated pledge interactions, role workspace routes, Supabase client adapters, and architecture/data/team documentation.

Still demo or incomplete: persistence and authentication, authorized Admin scopes, real server-side report/verification/review/task actions, file upload/storage, Leaflet basemap and geocoding, operational task and confirmation flow, live search/filter/follow, official API integrations, route suggestions, notifications, and real deployments. Detector data is not integrated. The D/P/A feature checklist in the project brief remains the product reference; the architecture documents identify initial integration limits.

After configuring Supabase, implement Auth provisioning and ownership-aware server handlers, then replace fixtures with typed queries. Ensure verified issue counts, official review, group completion, independent confirmation, project completion, and restoration inspections remain distinct throughout.
