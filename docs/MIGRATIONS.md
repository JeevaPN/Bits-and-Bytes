# Supabase migration procedure

Migration filenames now have one strictly increasing numeric version: `202610100001` through `202610100009`.

The duplicate `202610100002`/`202610100003` files were renamed into this ordered sequence in the repository. Because a remote Supabase project may already record the old filenames, do not rename rows in `supabase_migrations.schema_migrations` blindly. Before deploying this branch to an existing project, compare that table with the old filenames and either restore the historical names in a deployment-only reconciliation or apply the SQL through a reviewed forward-only migration. A clean project should use the filenames in `supabase/migrations` in lexical order.

Static check:

```powershell
npm run validate:migrations
```

This validates filename uniqueness/order and rejects empty migration files. It does not prove PostgreSQL execution, PostGIS availability, RLS behavior, or upgrade compatibility. Those require a local/remote Supabase database and are intentionally reported as unverified until run.
