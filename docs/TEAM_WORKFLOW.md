# Team workflow

## Ownership

- Teammate 1: `app/admin/`, `components/admin/`
- Teammate 2: public/Common People routes and `components/people/`
- Teammate 3: `app/groups/`, `components/groups/`
- Shared owner: `lib/domain/`, `lib/validation/`, `lib/services/`, `lib/supabase/`, database migrations, global layouts/styles, package/config files.

## Branches and integration

Use `feat/admin-<topic>`, `feat/people-<topic>`, or `feat/groups-<topic>`. Start from the current main branch, keep commits focused, and open a PR with screenshots for UI work and a note for schema/API changes. Agree on shared types, statuses, schema and service signatures before depending on them. The shared owner reviews migrations and resolves conflicts in global files; route teams should not edit shared layout or migrations in parallel.

## Local review

Run `npm run lint`, `npm run typecheck`, and `npm run build` before merging. Verify demo mode, empty/error states, mobile layout, and role/ownership on the server once auth-backed handlers are implemented. Never include real credentials in commits.
