# CivicSync project structure

This is a Next.js App Router project. Folders under `app/` define URL routes; files named `page.tsx` render a route, while `layout.tsx` wraps a route subtree. The role-facing names are **Admin**, **Neighbourhood**, and **Community Partners**.

```text
Bits-and-Bytes/
├── app/                         # URL routes and page/layout entry points
│   ├── admin/                   # Admin dashboard and management routes
│   │   ├── layout.tsx           # Admin navigation/shell
│   │   ├── page.tsx             # Admin overview metrics and queue links
│   │   ├── projects/page.tsx    # Demo project register
│   │   ├── projects/new/page.tsx# Demo project draft form
│   │   ├── issues/page.tsx      # Demo official issue review queue
│   │   ├── coordination/page.tsx# Demo Dig-Once case list
│   │   ├── restoration/page.tsx # Demo street inspection list
│   │   └── groups/page.tsx      # Demo partner application review
│   ├── neighbourhood/           # Neighbourhood pages
│   │   ├── layout.tsx           # Neighbourhood navigation
│   │   ├── page.tsx             # Neighbourhood home
│   │   └── report/page.tsx      # New issue report
│   ├── community-partners/      # Partner public and workspace pages
│   │   ├── layout.tsx           # Partner navigation
│   │   ├── page.tsx             # Public partner directory
│   │   ├── [slug]/page.tsx      # Public profile/work history
│   │   └── dashboard/           # Opportunity list and task board
│   ├── projects/page.tsx        # Public project directory
│   ├── projects/[slug]/page.tsx # Public project detail and QR code
│   ├── map/page.tsx             # Static demo map preview
│   ├── sponsorship/page.tsx     # Simulated sponsorship preview
│   ├── page.tsx                 # CivicSync landing page at /
│   ├── layout.tsx               # Global HTML shell, header, footer, metadata
│   └── globals.css              # Global styles and design tokens
├── components/                  # Reusable UI grouped by feature owner
│   ├── admin/                   # Admin forms, badges, headings, demo actions
│   ├── neighbourhood/           # Neighbourhood report form
│   ├── community-partners/      # Reserved for partner-only components
│   └── shared/                  # Header and other site-wide UI
├── lib/                         # Shared logic and integrations
│   ├── domain/                  # Shared types, statuses, demo fixtures
│   │   ├── admin.ts             # Admin statuses and UI request contracts
│   │   ├── admin-demo-data.ts   # Admin fixture records derived from fixtures
│   │   ├── demo-data.ts         # In-memory project/issue/group examples
│   │   └── types.ts             # Shared role/project/issue/group/task types
│   ├── services/                # Business rules and demo service functions
│   │   └── issues.ts            # Demo issue ranking/verification helper
│   ├── contracts/v1.ts          # Frozen v1 role API interfaces and DTOs
│   ├── mock-api/                # In-memory adapters matching frozen API
│   │   ├── state.ts             # Shared seeded records for mock adapters
│   │   ├── helpers.ts           # Result, pagination, and search helpers
│   │   ├── admin.ts             # Jeeva-owned Admin API mock
│   │   ├── community-partners.ts # Vineel-owned partner API mock
│   │   └── neighbourhood.ts    # Shuvam-owned Neighbourhood API mock
│   ├── validation/              # Zod input schemas
│   │   └── issue.ts             # Issue-report field schema
│   └── supabase/                # Browser/server Supabase client adapters
│       ├── browser.ts           # Browser-safe anon client
│       └── server.ts            # Cookie-aware server client
├── supabase/migrations/         # PostgreSQL/PostGIS schema and initial RLS
├── docs/                        # Architecture, setup, role handoffs, guides
│   ├── ARCHITECTURE.md          # Layers, data flows, and integrations
│   ├── DATA_MODEL.md            # Entity and lifecycle notes
│   ├── ADMIN_HANDOFF.md         # Admin jobs, screens, permissions, gaps
│   ├── NEIGHBOURHOOD_HANDOFF.md # Neighbourhood jobs, screens, permissions, gaps
│   ├── COMMUNITY_PARTNERS_HANDOFF.md # Partner jobs, screens, permissions, gaps
│   ├── PROJECT_STRUCTURE.md     # This file: repository/file guide
│   ├── TEAM_WORKFLOW.md         # Four-person ownership and branch process
│   └── TEAM_CONTRACTS.md        # Frozen APIs, mock semantics, integration rules
├── public/                      # Static assets served as-is (add as needed)
├── .env.example                 # Environment-variable names; no credentials
├── package.json                 # Dependencies and npm scripts
├── tsconfig.json                # TypeScript settings and @/ import alias
├── next.config.ts               # Next.js configuration and legacy redirects
├── postcss.config.mjs           # Tailwind CSS processing
└── eslint.config.mjs            # Lint configuration
```

## File-by-file purpose

| File | Why it exists / current functionality |
|---|---|
| `app/layout.tsx` | Wraps every route in HTML, metadata, global header/footer, and styles. |
| `app/page.tsx` | Landing page; links to public projects, map, Neighbourhood reporting, and Community Partners. |
| `app/globals.css` | Shared colors, typography, controls, cards, and basic responsive navigation styles. |
| `app/admin/layout.tsx` | Admin section navigation and persistent scope/demo notice. |
| `app/admin/page.tsx` | Demo metrics and links to review queues. |
| `app/admin/projects/page.tsx` | Demo official project list. |
| `app/admin/projects/new/page.tsx` | Entry route for creating a project draft. |
| `app/admin/issues/page.tsx` | Demo issue review cards and placeholder decision actions. |
| `app/admin/coordination/page.tsx` | Demo Dig-Once warning/case card. |
| `app/admin/restoration/page.tsx` | Demo inspection and remediation preview. |
| `app/admin/groups/page.tsx` | Demo Community Partner application decisions. |
| `app/neighbourhood/layout.tsx` | Neighbourhood-local navigation. |
| `app/neighbourhood/page.tsx` | Resident/sponsor workspace entry and snapshot. |
| `app/neighbourhood/report/page.tsx` | Report explanation and report form route. |
| `app/community-partners/layout.tsx` | Partner directory/dashboard navigation. |
| `app/community-partners/page.tsx` | Public directory of approved demo partners. |
| `app/community-partners/[slug]/page.tsx` | Public profile and illustrative work history for a selected slug. |
| `app/community-partners/dashboard/page.tsx` | Ranked demo work opportunities with alert-only actions. |
| `app/community-partners/dashboard/tasks/page.tsx` | Local-state task lifecycle preview, including completion evidence picker. |
| `app/projects/page.tsx` | Public project directory. |
| `app/projects/[slug]/page.tsx` | Stable public project destination and generated QR code. |
| `app/map/page.tsx` | Static map-like preview with distinguishable demo project/report markers; not a live map. |
| `app/sponsorship/page.tsx` | Simulated pledge preview; no payment or persistence. |
| `components/shared/header.tsx` | Global navigation using the agreed role labels. |
| `components/admin/demo-action.tsx` | Alert-only Admin action placeholder. |
| `components/admin/project-form.tsx` | Browser-only project form preview using the Admin input type. |
| `components/admin/section-heading.tsx` | Shared heading pattern for Admin sections. |
| `components/admin/status-badge.tsx` | Shared visual status labels for Admin lists. |
| `components/neighbourhood/report-form.tsx` | Client form parses fields with Zod and displays a demo-only result. |
| `lib/domain/types.ts` | Shared role, project, issue, group, and task vocabulary. |
| `lib/domain/admin.ts` | Admin statuses and future form/decision request contracts. |
| `lib/domain/demo-data.ts` | Sample projects, reports, and partners used by pages; not a seed script. |
| `lib/domain/admin-demo-data.ts` | Admin-shaped sample projects/issues/cases/inspections/applications. |
| `lib/services/issues.ts` | In-memory opportunity sorting and one-process demo verification helper. |
| `lib/contracts/v1.ts` | Frozen request/response DTOs and API interfaces that feature branches share. |
| `lib/mock-api/state.ts` | Stable shared demo records and temporary mutation state used by adapters. |
| `lib/mock-api/helpers.ts` | Standard result envelope, pagination/search helpers, and explicit public mappers that strip admin-only fields. |
| `lib/mock-api/admin.ts` | Mock implementation of the frozen Admin API; Jeeva owns it. |
| `lib/mock-api/community-partners.ts` | Mock implementation of the frozen Community Partners API; Vineel owns it. |
| `lib/mock-api/neighbourhood.ts` | Mock implementation of the frozen Neighbourhood API; Shuvam owns it. |
| `lib/validation/issue.ts` | Zod validation constraints for report fields. |
| `lib/supabase/browser.ts` | Creates the Supabase JS browser client with local-storage session persistence. |
| `supabase/migrations/202610100001_core.sql` | Initial Postgres/PostGIS entities, indexes, constraints, and RLS policies. |
| `.env.example` | Lists Supabase environment variable names without credentials. |
| `package.json` | Defines framework/dependencies and lint/typecheck/build commands. |
| `tsconfig.json` | TypeScript strictness and `@/` path alias. |
| `next.config.ts` | Next configuration and redirects from legacy role paths. |
| `postcss.config.mjs` | Enables Tailwind CSS processing. |
| `eslint.config.mjs` | ESLint Next.js and TypeScript rules. |
| `.gitignore` | Prevents environment files, dependencies, and build output from being committed. |
| `README.md` | Setup, environment, database, local checks, Vercel deployment, and scope. |
| `docs/TEAM_CONTRACTS.md` | Frozen v1 contracts, stable cross-feature IDs, API methods, ownership, and merge plan. |

## Checklist coverage reality

**This structure does not mean all requested features are implemented.** It is a demo foundation with representative screens. The product checklist includes much more. Present in some demo form: landing/navigation, sample project listing/detail/QR, issue report form validation, review/task/pledge placeholders, role dashboards, initial schema, architecture and setup docs. Not yet functional end-to-end: Auth/RBAC/scopes, database-backed queries/actions, evidence upload, issue detail/verify/flag flow, real map/OSM, project editing/publication/history, conflict detection, restoration inspection persistence, group application/profile/membership, independent completion confirmation, campaign records, search/filters/follows, notification delivery, import/export, analytics, and production monitoring/security operations. See each role handoff for the exact screen-by-screen gaps.

## Is this structure right?

Yes, it is a reasonable **small modular-monolith starting structure** for Next.js App Router: routes are separated by role, reusable UI is in `components/`, domain rules/types are centralized in `lib/`, and Supabase schema is under `supabase/migrations/`. It keeps Admin, Neighbourhood, and Community Partners pages separately owned while sharing public projects/map and core domain contracts.

Before growing functionality, add `app/actions/` or route-local `actions.ts` for server mutations, `lib/services/projects.ts`, `lib/services/groups.ts`, `lib/services/sponsorship.ts`, `lib/services/authorization.ts`, typed Supabase DB schema, storage policies, and tests. Keep role checks and data ownership on the server/RLS. Don’t add empty folders just to represent unbuilt features; create them when their code is ready.

## Route examples

- `/admin/projects/new` is rendered by `app/admin/projects/new/page.tsx`.
- `/neighbourhood/report` is rendered by `app/neighbourhood/report/page.tsx`.
- `/community-partners/lakeview-neighbourhood-action` is rendered by `app/community-partners/[slug]/page.tsx`; `[slug]` is a dynamic URL segment.
- `/projects/lakeview-road-renewal` is rendered by `app/projects/[slug]/page.tsx` and is the public-project/QR destination pattern.

## Important distinctions

- `app/` is the singular Next.js routing directory; there is no `apps/` monorepo folder.
- Page files compose UI from `components/`. Keep reusable UI out of route modules when it will be shared or independently owned.
- `lib/domain/demo-data.ts` is in-memory example data, not a database seed. Demo UI actions do not persist.
- `lib/supabase/` creates clients; real mutations still need server actions/route handlers, authorization, validation, and RLS.
- `supabase/migrations/` changes are shared-owner work because a schema change affects all three areas.
- `docs/ADMIN_HANDOFF.md`, `docs/NEIGHBOURHOOD_HANDOFF.md`, and `docs/COMMUNITY_PARTNERS_HANDOFF.md` map each role’s jobs to its UI and permissions.
- Old `/people` and `/groups` URLs redirect through `next.config.ts` for compatibility; new code and links should use `/neighbourhood` and `/community-partners`.
