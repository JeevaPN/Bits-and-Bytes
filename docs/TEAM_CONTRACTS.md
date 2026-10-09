# Parallel team contract — CivicSync API v1

**Contract version: 1.0.0 · Status: frozen for parallel implementation.** This gives each teammate stable shared types, route ownership, API signatures, and fixture IDs. Feature work should not wait on another feature branch. If a contract must change, propose it in a small PR, explain the affected owners, and merge the contract change before dependent work; do not silently edit `lib/contracts/v1.ts` in feature branches.

## Four-person ownership

| Owner | Owns | May change independently | Coordinate before changing |
|---|---|---|---|
| **Aditya — Frontend / integration** | Global visual system and app shell: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/shared/`, public `app/projects/`, `app/map/`, `app/sponsorship/`; frozen contract and common mock state; integration/release branch | Landing/header, shared layout, common design tokens, public project/map/sponsorship surfaces, contract v1 and fixture/API harness | Feature pages in other owners’ route folders, domain contracts after freeze, migrations, route signatures |
| **Jeeva — Admin** | `app/admin/`, `components/admin/`, `lib/mock-api/admin.ts`; Admin section of `docs/ADMIN_HANDOFF.md` | Admin screen UI, Admin-only components, Admin mock adapter, Admin-owned fixture additions through agreed seed interface | Shared contracts, global CSS/layout, other route modules, SQL migrations, shared domain types |
| **Vineel — Community Partners** | `app/community-partners/`, `components/community-partners/`, `lib/mock-api/community-partners.ts`; partner section of `docs/COMMUNITY_PARTNERS_HANDOFF.md` | Partner directory/dashboard/profile/task UI, partner-only components, partner mock adapter | Shared contracts, global CSS/layout, Neighbourhood or Admin routes, SQL migrations, shared domain types |
| **Shuvam — Neighbourhood** | `app/neighbourhood/`, `components/neighbourhood/`, `lib/mock-api/neighbourhood.ts`; Neighbourhood section of `docs/NEIGHBOURHOOD_HANDOFF.md` | Resident/sponsor UI, report/issue/follow/confirmation UI, Neighbourhood-only components, Neighbourhood mock adapter | Shared contracts, global CSS/layout, partner/Admin routes, SQL migrations, shared domain types |

Aditya owns integration because global shell, public pages, contracts, and cross-feature wiring have a single owner. Each role owner may build against the mock adapter before the other role screens exist. No feature should import another teammate’s React component or internal fixture; cross-feature communication goes through the frozen DTO/API contracts.

## Frozen files and change rule

- `lib/contracts/v1.ts`: exported DTOs, enums, result envelope, and API interfaces. Frozen in v1.
- `lib/mock-api/state.ts`: deterministic in-memory fixture store shared by the three mock adapters. Aditya owns its shape and stable IDs. Feature owners should not import it directly.
- `lib/mock-api/helpers.ts`: pagination, result, and search helpers. Aditya owns this small harness.
- `lib/mock-api/admin.ts`: Jeeva-owned implementation of `AdminApi`.
- `lib/mock-api/community-partners.ts`: Vineel-owned implementation of `CommunityPartnersApi`.
- `lib/mock-api/neighbourhood.ts`: Shuvam-owned implementation of `NeighbourhoodApi`.

Call the interface, not the implementation details. Pages/components should receive the API as a prop/context or import their role adapter at a single feature boundary. Do not import mock state into page components. A later Supabase adapter must implement the same interface; swapping adapters should not require changing the page DTOs.

## Shared data vocabulary

Use the existing canonical domain types from `lib/domain/types.ts` and the Admin DTOs from `lib/domain/admin.ts`:

- Primary role values: `admin`, `common`, `group`; product labels are **Admin**, **Neighbourhood**, **Community Partners**. Sponsor remains Common (`common`), not a fourth role.
- Project status: `planned`, `active`, `delayed`, `completed`, `cancelled`.
- Official issue review: `unverified`, `accepted`, `rejected`, `referred`, `more_info`, `duplicate`.
- Group-task lifecycle: `adopted`, `in_progress`, `awaiting_confirmation`, `confirmed`, `disputed`, `reopened`, `referred`.
- Confirmation is a community action; it is not official issue closure or road restoration approval.
- Dates use ISO 8601 (`YYYY-MM-DD` for date-only values, RFC3339/ISO timestamp with zone for instants). Coordinates are decimal WGS84: latitude `[-90,90]`, longitude `[-180,180]`. Amounts use numeric INR rupees in the demo; never imply a simulated pledge is paid.
- List endpoints return `Page<T>` with `items`, `page`, `pageSize`, and `total`. Mutations return `ApiResult<T>` with either `{ok:true,data}` or `{ok:false,error:{code,message,fieldErrors?}}`.

## Mock API call contracts

The exact TypeScript signatures live in `lib/contracts/v1.ts`. Frozen interfaces expose these operations:

| Area | API adapter | Stable operations |
|---|---|---|
| Neighbourhood | `neighbourhoodMockApi` | `listProjects`, `getProject`, `listIssues`, `getIssue`, `listPartners`, `createIssue`, `verifyIssue`, `flagIssue`, `setProjectFollow`, `confirmGroupTask`, `createSimulatedPledge` |
| Community Partners | `communityPartnersMockApi` | `listOpportunities`, `listMyTasks`, `getPublicProfile`, `submitApplication`, `updateProfile`, `acceptTask`, `referTask`, `postProgress`, `submitCompletion`, `createCampaign`, `reportCampaignUse` |
| Admin | `adminMockApi` | `listProjects`, `createProject`, `updateProject`, `listIssues`, `decideIssue`, `decideProjectMatch`, `createCoordinationCase`, `listCoordinationCases`, `decideCoordinationCase`, `listRestorationInspections`, `recordRestoration`, `listGroupApplications`, `decideGroupApplication` |

Example usage:

```ts
import { neighbourhoodMockApi } from "@/lib/mock-api/neighbourhood";

const result = await neighbourhoodMockApi.listProjects({ page: 1, pageSize: 10, status: "active" });
if (!result.ok) {
  // Render result.error.message and any fieldErrors.
} else {
  // Render result.data.items; result.data.total is the filtered total.
}
```

## Stable cross-feature demo IDs

Use these IDs/slugs when a UI links into another feature. Do not invent a second copy for the same record:

| Entity | Stable demo ID | Public slug / notes |
|---|---|---|
| Lakeview Road Renewal | `prj-001` | `lakeview-road-renewal` |
| North Ward Streetlight Upgrade | `prj-002` | `north-ward-streetlights` |
| Market-crossing pothole | `iss-001` | urgent; unverified; linked suggestion `prj-001` |
| Library blocked footpath | `iss-002` | more-info review; partner task fixture `task-demo-001` |
| Lakeview Neighbourhood Action | `grp-001` | `lakeview-neighbourhood-action`; approved |
| Green Streets Collective | `grp-002` | `green-streets-collective`; approved |
| Lakeview cleanup campaign | `campaign-grp-001` | simulated target ₹25,000 |
| North Ward planting campaign | `campaign-grp-002` | simulated target ₹30,000 |

IDs generated by mock mutations use obvious prefixes like `iss-mock-`, `task-mock-`, and `pledge-mock-`; never hard-code those generated IDs in another feature.

## Mock semantics and production boundary

Mocks provide consistent DTOs, realistic list/mutation behavior, basic validation, and predictable statuses so each frontend can be completed independently. Use the mutable adapters from client-side prototype code; do not expose their module state as a server endpoint. State is JavaScript process/module memory only: it resets on refresh/restart/deploy, can differ between browser/server instances, and is not a database. It is not an authorization system, audit log, secure upload service, or payment system. The mock adapters intentionally do not establish a user identity; all production auth, role/scope/ownership checks, transactions, rate limits, file validation, and RLS remain mandatory on the server.

The `File` values in inputs are UI contract placeholders. The mock never stores the file bytes or exposes a public URL. A real adapter must validate file size/type, store private originals, create safe public evidence only when authorized, and return a storage reference in an agreed response extension.

## Parallel branch and merge process

1. Aditya creates `integration/civicsync-v1` from the agreed `main` baseline and merges the frozen contract/mock harness there first. The four work branches start from that baseline: `feat/shared-frontend`, `feat/admin-jeeva`, `feat/community-partners-vineel`, and `feat/neighbourhood-shuvam`.
2. Each feature owner changes only their owned route/components/mock adapter and handoff section. Shared `lib/contracts/v1.ts` and fixture IDs stay frozen.
3. Feature branches can progress in parallel because each screen consumes its role API and common DTOs. Use adapter-based data rather than importing another feature’s component/state.
4. Open PRs into `integration/civicsync-v1`. Aditya merges the shared shell/contracts first, then each role PR independently. If role work lands out of order, merge/rebase the latest integration branch and resolve only files owned by that feature.
5. Feature PRs include changed routes, screenshot(s), API methods used, empty/loading/error behavior, and any requested contract change. A contract change must name all affected owners and land before the code relying on it.
6. Once UI branches are integrated, assign production adapter implementation: each role owner replaces their mock adapter with server-backed behavior for that role while retaining v1 DTOs; Aditya owns shared auth/client wiring and release integration. Database migration/RLS edits are coordinated centrally and reviewed before any real user data.
7. Integration is complete only when role routes work together against one adapter set and lifecycle boundaries remain intact: issue review is separate from verification, task completion is separate from issue closure, and project completion is separate from restoration approval.

## Completion checklist for each feature PR

- [ ] Uses only the frozen v1 API interface and shared status strings.
- [ ] Does not edit another owner’s route/component or shared contract silently.
- [ ] Includes loading, empty, failure, validation, and success UI states for touched workflows.
- [ ] Treats mock success as demo-only and clearly labels simulated data/actions.
- [ ] Does not claim that mock data persists or that mock permission checks secure production.
- [ ] Shows dates, coordinates, source, official status, community count, and task status with their distinct meanings.
- [ ] Includes a short manual verification note; the integrated branch owner runs the repository checks when dependencies are available.
