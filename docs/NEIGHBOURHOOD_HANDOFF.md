# CivicSync Neighbourhood frontend handoff

This guide maps resident/public responsibilities to existing routes and files, describes intended account permissions, and marks preview-only behavior. The Neighbourhood area serves residents and individual or company sponsors. Sponsors are not a fourth role. Public browsing should work without an account. Actions that create, change, verify, flag, follow, confirm, or pledge may require an authenticated Neighbourhood account according to policy.

## Neighbourhood capabilities

Neighbourhood users use CivicSync to browse published public works and approved group pages, view public issue information, report what they personally observe, independently verify or challenge an issue, follow projects, understand known disruptions, review community group work, confirm/dispute group completion, and record a simulated sponsorship pledge.

Identity, private contact information, and original/private evidence should not be public by default. Verification means “I personally observed this,” not “this is proven true.” Community confirmation of group work is distinct from official inspection or issue resolution.

## Screen and action matrix

| Neighbourhood job | Screen / files | Intended user actions | Current state |
|---|---|---|---|
| Browse CivicSync and understand its purpose | `/` · `app/page.tsx` | View public overview and navigate to projects, map, reporting, groups, and support | Public landing page uses demo fixtures; counts are sample values |
| Browse public works | `/projects`, `/projects/[slug]` · `app/projects/page.tsx`, `app/projects/[slug]/page.tsx` | Open published project detail and timeline without sign-in; scan a stable project QR link | Demo projects and QR code render; QR uses `civicsync.example`, not configured production domain; no DB query/follow/update history |
| View public issue reports | Map and report-related public views · `/map` (`app/map/page.tsx`) | Distinguish citizen/external source and official status; open an issue’s public page | Map page is a static preview; there is not yet a dedicated `/issues/[id]` route or issue detail page |
| Search and filter information | Public projects/map (not fully implemented) | Search street, landmark, or project; filter by category, department, place, status, and date | No functional search or filter state yet |
| See projects and reports on a map | `/map` · `app/map/page.tsx` | Explore project/report markers and open records; view known closures when available | Static illustration with labelled demo records; not a Leaflet/OSM map; no routing or live closures |
| Submit a citizen report | `/neighbourhood/report` · `app/neighbourhood/report/page.tsx`, `components/neighbourhood/report-form.tsx` | Submit category, description, location, observation time, coordinates, and an optional photo | Browser form validates with shared Zod schema then displays a preview message; it does not persist or upload; no geolocation widget |
| Verify an issue personally observed | Issue detail action (not scaffolded yet); demo service at `lib/services/issues.ts` | Verify once per eligible account per issue and see count update separately from official review | No public verify control or authentication; in-memory helper only, resets on server restart and is not account-safe |
| Challenge an inaccurate/misleading report | Issue detail action (not scaffolded yet) | Submit a flag and reason for authorized review; do not automatically punish the reporter | Not implemented |
| Follow a project or location | Project detail/account settings (not scaffolded yet) | Follow/unfollow; eventually manage update preferences | `project_follows` table exists, but no UI/auth/action/notifications |
| Contact a nearby group | Group public page | Use the group’s approved public contact option about an issue | `/community-partners/[slug]` displays a demo email link; no contact form, routing, or abuse/rate control |
| Browse group history and work | `/community-partners`, `/community-partners/[slug]` · `app/community-partners/page.tsx`, `app/community-partners/[slug]/page.tsx` | Browse approved group profiles, adopted/ongoing/completed work, progress, evidence, and confirmations | Demo profiles and one illustrative task; no persisted task history or evidence |
| Confirm or dispute group completion | Group task/public issue view (not scaffolded yet) | Eligible independent Neighbourhood member confirms or disputes a submitted group completion claim | Placeholder confirm/dispute buttons are currently embedded in the Community Partners dashboard; not a genuine Neighbourhood screen, eligibility is not enforced, and state is local only |
| Make a simulated sponsorship pledge | `/sponsorship` · `app/sponsorship/page.tsx` | Choose a group/campaign and record a clearly simulated pledge; no money moves | Demo buttons change local page state only; no pledge is persisted; campaigns are fixture-driven |
| Register, sign in, and manage an account | Auth routes/settings (not scaffolded yet) | Create Neighbourhood account, recover access, sign out, manage privacy and notification preferences | Supabase clients exist, but no auth UI, profile provisioning, sessions, or settings |

## Permission model

- Anonymous visitors may browse public projects, issues, maps, and approved group profiles without creating an account.
- A signed-in Neighbourhood account may submit reports, make one personal verification per issue, flag content, follow projects, and make simulated pledges, subject to server validation and rate limits.
- Independent group-work confirmation must be made by an eligible Neighbourhood account that is not a member of the group claiming the work. It cannot be supplied by the group itself or treated as official inspection.
- Neighbourhood users cannot publish official projects, make government review decisions, grant Admin permissions, approve groups, or edit another person’s private data.
- Reporter identity/contact and private original evidence are never exposed merely because a report is public. Public evidence requires an explicit safe representation and authorization.
- UI visibility does not enforce permission. Every protected action must authenticate and authorize on the server and be constrained by RLS.

## Frontend ownership and backend needs

Neighbourhood owns `app/neighbourhood/` and `components/neighbourhood/`; its API is the frozen `NeighbourhoodApi` in `lib/contracts/v1.ts`, implemented by `lib/mock-api/neighbourhood.ts`. Coordinate public project/map/sponsorship pages with their owners. Shared schema/services are in `lib/domain/`, `lib/validation/`, and `lib/services/` and need coordination with the shared owner.

Before real actions: implement Auth and trusted profile provisioning; validated issue creation and safe private/public evidence storage; unique issue/user verification with rate controls; report flags as review signals; project follows/preferences; independent group confirmation checks; simulated-only pledge persistence; public read models without private identity/evidence; and tests for authorization and duplicate verification. Never claim a report, verification, follow, confirmation, or pledge was saved until the server confirms it.

## Suggested frontend sequence

1. Add public issue list/detail routes and make map/list links navigate to them.
2. Complete report form UX: location selection, photo preview/removal, progress, and validation/error/success states.
3. Add sign-in prompts for protected actions while preserving anonymous browsing.
4. Add verify/flag controls with clear explanations of community count versus official status.
5. Add project follow controls and notification preferences.
6. Add independent group-work confirmation on the public task detail.
7. Complete group work history and simulated campaign/pledge detail.

## Implementation update — 2026-10-10

### Completed in the Neighbourhood boundary

The Neighbourhood UI now uses `neighbourhoodMockApi` for dashboard reads and resident mutations. These flows are implemented against the frozen v1 adapter and remain explicitly demo-only:

| Workflow | Files / API methods | Lifecycle and evidence |
|---|---|---|
| Dashboard and issue browsing | `components/neighbourhood/dashboard.tsx`, `issue-browser.tsx`; `listProjects`, `listIssues` | Public works and issue observation/review stay separate; search uses the API. |
| Citizen reporting | `report-form.tsx`; `createIssue` | Required coordinates, schema validation, pending/error/success states, and created-ID link. |
| Issue details, verification, challenge | `issue-detail.tsx`, `/neighbourhood/issues/[id]`; `getIssue`, `verifyIssue`, `flagIssue` | Public DTO only, not-found state, actor-aware duplicate guard, and no automatic review/resolution. |
| Project follow | `project-follow.tsx`; `setProjectFollow` | Resident-specific state with pending/error feedback; no false notification claim. |
| Approved group discovery | `group-directory.tsx`, `/neighbourhood/groups`; `listPartners` | Only approved public profiles are returned and rendered. |
| Task confirmation and simulated pledge integration | `task-confirmation.tsx`, `simulated-pledge.tsx`; `confirmGroupTask`, `createSimulatedPledge` | Confirmation, official resolution, restoration, and payment remain distinct. |

### Changed files

Changed Neighbourhood routes/components are listed above. `lib/mock-api/neighbourhood.ts` now validates location-bearing creates, records demo verification/follow/confirmation state per explicit demo actor, prevents duplicate confirmation, and preserves task lifecycle status while recording confirmation count.

### Identity and production boundary

The v1 `NeighbourhoodApi` signatures do not accept an actor/session parameter. The adapter therefore exposes `setNeighbourhoodDemoActor()` for demo context only; production must derive identity from the trusted authenticated session on the server. The shared contract was not changed, and the mock is not an authorization system.

### Feature traceability limitation

The complete canonical CS-001–CS-253 checklist is not present in this repository. No feature IDs are invented here; full ID-level traceability is `blocked` pending that checklist. The implementation is traced to the frozen Neighbourhood responsibilities and API methods instead.

### Verification performed

- `npm install` — completed.
- `npm run typecheck` — passed.
- `npm run lint` — passed with two pre-existing config warnings (`eslint.config.mjs`, `postcss.config.mjs`).
- `npm run build` — passed; all 20 App Router pages generated.
- No test runner exists in `package.json`, so automated unit/integration tests were not available to run.

### Remaining blockers and integration steps

- Supabase persistence, trusted authentication, server authorization/RLS, safe evidence upload, notifications, and real pledge persistence/payment remain outside this demo adapter.
- The shared `/sponsorship` and public project routes should integrate `SimulatedPledge` and `ProjectFollow` with canonical IDs rather than duplicating fixture state.
- Community Partners should render `TaskConfirmation` on the public completion-claim view, passing the canonical `GroupTask`; production must enforce authenticated resident and group-membership eligibility server-side.
- The shared platform owner should provide session identity to the Neighbourhood server boundary without changing public DTOs. Admin must continue treating verification, flags, task confirmation, official review, and restoration as separate records.

### Manual smoke test

Run `npm run dev`, open `/neighbourhood`, search for `market`, open the issue, verify once, and confirm a second attempt is rejected. On `/neighbourhood/report`, submit valid coordinates and follow the created-report link; confirm the new issue appears through the same client-side demo adapter. Open `/neighbourhood/groups` and confirm only approved public profiles are shown.

### Scripted backend-style verification

The repository now includes `tests/neighbourhood-api.test.ts` with 10 Vitest workflow tests and `scripts/verify-neighbourhood.ps1`, exposed as `npm run verify:neighbourhood`. The script runs typecheck, adapter tests, lint, and production build. `scripts/setup-neighbourhood.ps1` and `npm run setup:neighbourhood` install dependencies and create `.env.local` from `.env.example` without overwriting an existing environment unless `-OverwriteEnv` is supplied.

Environment seams are documented for Supabase Auth/database, Resend notification delivery, and server-only Cloudinary signed media storage. Credentials are intentionally not committed, and blank service values do not disable the local mock tests.

## Authentication, production services, and backend boundary update — 2026-10-10

### Implemented

- Supabase SSR session refresh in `middleware.ts`, plus server-side `getServerUser`, `requireServerUser`, profile lookup, and centralized role checks.
- Auth routes: `/auth/sign-up`, `/auth/sign-in`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/callback`, and `/auth/confirm`.
- Accessible server-action forms for email/password signup, signin, signout, recovery, and reset. Development signup does not require email OTP or confirmation; Auth error messages avoid account enumeration.
- Authenticated header state with signout; public pages remain accessible.
- Supabase production service boundary in `lib/services/neighbourhood-server.ts` for public issue reads, authenticated issue creation, verification, challenges, follows, task confirmations, and simulated pledges.
- API handlers under `app/api/neighbourhood/` for public issue reads, authenticated writes, verification, challenges, and signed evidence-upload authorization.
- Cloudinary server-only signature generation in `lib/media/cloudinary.ts`; the API secret never enters client output. MIME type and 10 MB size validation are enforced before signing.
- Resend server-only transactional seam in `lib/email/resend.ts`. Supabase Auth remains responsible for confirmation/recovery token generation; Resend should be configured as Supabase SMTP rather than duplicating auth email tokens.
- Ordered migration `supabase/migrations/202610100002_auth_neighbourhood_hardening.sql` adds idempotent profile provisioning from `auth.users`, challenge persistence/RLS, a safe public issue view, and editor-only group profile updates.

### Authentication configuration still required

1. In Supabase Auth, set the local site URL to `http://localhost:3000`, disable **Confirm email** for development, and add `/auth/callback` and `/auth/confirm` to the redirect allowlist. Set the production site URL and equivalent production redirects before deployment.
2. Keep password recovery configured; reconsider and re-enable email verification before public production launch.
3. Verify a Resend sending domain, publish its SPF/DKIM/DMARC records, and configure Resend SMTP in Supabase Auth. `RESEND_API_KEY` is only for non-auth transactional mail and must remain server-only.
4. Apply migrations in order, first `202610100001_core.sql`, then `202610100002_auth_neighbourhood_hardening.sql`, in a dedicated Supabase project. Do not run against production without review.
5. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` only where a reviewed server operation requires it, `NEXT_PUBLIC_SITE_URL`, and the Cloudinary variables from `.env.example`. Never commit `.env.local`.
6. Configure Cloudinary upload delivery/access rules for the `civicsync/evidence/<user-id>` folder. The signing endpoint authorizes a scoped upload, but report association and public evidence approval still require the production media workflow to be completed and reviewed.

### Automated checks

`tests/neighbourhood-api.test.ts` and `tests/auth-integrations.test.ts` now contain 13 passing unit/security-boundary tests. `scripts/verify-neighbourhood.ps1` runs typecheck, tests, lint, and a clean production build, and fails on any native command failure. Live Supabase RLS/Auth, Resend delivery, and Cloudinary upload tests were not run because no dedicated test project or service credentials were supplied.

### Remaining coordination and blockers

- The frozen v1 client contract has no actor argument or read-follow-state method. The production server functions derive actors from Supabase sessions, but integrating them into the frozen client adapter requires a coordinated adapter switch with Aditya.
- Community Partners must render `TaskConfirmation` only for canonical tasks at `awaiting_confirmation` and pass the canonical task ID; production RLS now requires a common user who is not a member of the claiming group.
- Admin must consume challenge records and preserve official review/resolution as a separate lifecycle.
- The shared sponsorship/project routes must integrate the reusable production boundary rather than continue using local fixture state.
- Cloudinary upload completion/cleanup and safe public transformation approval are not yet persisted to an issue because the frozen `CreateIssueInput` has no evidence-reference field; this is a documented contract/integration dependency, not a fabricated upload success.
- No CI workflow currently exists in the repository; CI setup remains an integration-owner task.

