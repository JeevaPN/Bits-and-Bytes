# Team workflow

## Feature ownership

- Admin frontend: `app/admin/`, `components/admin/`; guide: `docs/ADMIN_HANDOFF.md`.
- Neighbourhood frontend: `app/neighbourhood/`, `components/neighbourhood/`; guide: `docs/NEIGHBOURHOOD_HANDOFF.md`.
- Community Partners frontend: `app/community-partners/`, `components/community-partners/`; guide: `docs/COMMUNITY_PARTNERS_HANDOFF.md`.
- Shared owner: `lib/domain/`, `lib/validation/`, `lib/services/`, `lib/supabase/`, database migrations, global layouts/styles, and package/config files.

Public project/map/sponsorship pages and shared navigation may touch multiple areas. Coordinate ownership before editing them. Legacy `/people` and `/groups` routes redirect to the agreed role paths.

## Branches and integration

Use `feat/admin-<topic>`, `feat/neighbourhood-<topic>`, or `feat/community-partners-<topic>`. Start from the current main branch, keep commits focused, and open a PR with screenshots for UI work and a note for schema/API changes. Agree on shared types, statuses, schema, and service signatures before depending on them. The shared owner reviews migrations and resolves conflicts in global files; route teams should not edit shared layout or migrations in parallel.

## Local review

Run `npm run lint`, `npm run typecheck`, and `npm run build` before merging. Verify demo mode, empty/error states, mobile layout, and server-side authorization once auth-backed handlers are implemented. Never include real credentials in commits.
