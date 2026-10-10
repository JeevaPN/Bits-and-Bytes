# Playwright E2E

The default suite uses no production credentials. It verifies public discovery, the honest unavailable state when Supabase is not configured, and Admin route protection.

Run from PowerShell:

```powershell
npx playwright install chromium
npm run test:e2e
```

Live multi-role journeys require an isolated Supabase test project and test accounts. Set the test-only Supabase variables in a local `.env.test`/process environment; never use production accounts.
