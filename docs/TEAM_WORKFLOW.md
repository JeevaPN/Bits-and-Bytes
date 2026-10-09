# Four-person parallel workflow

The team has four independent feature owners. Use [TEAM_CONTRACTS.md](TEAM_CONTRACTS.md) as the frozen API/DTO source and integration agreement; use the role handoff guides for feature scope and screens.

## Owners and handoffs

| Owner | Assignment | Main files |
|---|---|---|
| Aditya | Shared frontend, public site, contract/mock harness, final integration | `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/shared/`, `app/projects/`, `app/map/`, `app/sponsorship/`, `lib/contracts/v1.ts`, `lib/mock-api/state.ts`, `lib/mock-api/helpers.ts` |
| Jeeva | Admin | `app/admin/`, `components/admin/`, `lib/mock-api/admin.ts`, `docs/ADMIN_HANDOFF.md` |
| Vineel | Community Partners | `app/community-partners/`, `components/community-partners/`, `lib/mock-api/community-partners.ts`, `docs/COMMUNITY_PARTNERS_HANDOFF.md` |
| Shuvam | Neighbourhood | `app/neighbourhood/`, `components/neighbourhood/`, `lib/mock-api/neighbourhood.ts`, `docs/NEIGHBOURHOOD_HANDOFF.md` |

Role areas may proceed immediately against their mock adapter; they do not wait for each other’s UI or database integration. Aditya owns shared files and decides the integration order. No one edits another owner’s route or mock adapter. Contract changes require discussion with all affected owners before implementation.

## Branches and integration

Aditya creates `integration/civicsync-v1` from the agreed `main` baseline and merges the frozen contracts/mock harness first. Create work branches from that same baseline: `feat/shared-frontend`, `feat/admin-jeeva`, `feat/community-partners-vineel`, and `feat/neighbourhood-shuvam`. Each owner opens a focused PR into `integration/civicsync-v1`. Aditya integrates the shared shell/contracts first, then merges role PRs. Keep global styles, app root layout, shared components, contracts, mock shared state, and migrations single-owner to prevent conflicts.

Every PR should include the touched routes, screenshots, API methods used, loading/empty/error/success states, and any proposed contract adjustment. A proposed shared contract change lands first; dependent feature work then rebases on it. Use the stable IDs in `docs/TEAM_CONTRACTS.md` when linking records across role pages.

## Frozen/shared ownership

- Contract v1: `lib/contracts/v1.ts` (Aditya; frozen after the baseline).
- Shared fixture state/helpers: `lib/mock-api/state.ts`, `lib/mock-api/helpers.ts` (Aditya).
- Role mock adapters: one owner each as listed above.
- Domain schema, database migrations, and production auth/RLS: coordinate centrally; no parallel edits to the same migration.
- Public project/map/sponsorship routes and global layout/styles: Aditya; role teams request changes via PR or issue rather than editing those files directly.

Mocks are in-memory fixtures, not persistence or security. Production adapters must preserve the interface and put authorization, validation, audit history, and RLS on the server. See the mock/production boundary and integration checklist in `docs/TEAM_CONTRACTS.md`.

## Local integration review

Once dependencies are installed, Aditya runs `npm run lint`, `npm run typecheck`, and `npm run build` on the integrated branch. Each owner records a manual walkthrough for their route, including failure and empty states. Do not merge a UI claim that a demo write was saved to the database.
