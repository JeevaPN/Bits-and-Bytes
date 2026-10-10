import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checklist = fs.readFileSync(path.join(root, "docs", "FEATURE_CHECKLIST.md"), "utf8");
const rows = [];

for (const line of checklist.split(/\r?\n/)) {
  const match = line.match(/^\s*[-*]?\s*(CS-\d{3})\s*(?:\[([^\]]+)\])?\s*(.*)$/);
  if (!match) continue;
  const [, id, tags = "", description] = match;
  rows.push({ id, tags, description: description.trim() });
}

const evidence = new Map([
  ["CS-001", ["PASS", "app/page.tsx; app/layout.tsx", "e2e/public-discovery.spec.ts; npm run build", "Landing page builds and is browser-checked."]],
  ["CS-002", ["PARTIAL", "components/shared/header.tsx", "npm run typecheck", "Navigation links exist, but the complete responsive/navigation acceptance behavior is not independently browser-verified."]],
  ["CS-003", ["PARTIAL", "app/projects; app/map; app/neighbourhood", "e2e/public-discovery.spec.ts", "Public routes exist, but persisted Supabase verification requires configured infrastructure."]],
  ["CS-005", ["PARTIAL", "lib/validation; lib/services; components/map/osm-map.tsx", "tests/neighbourhood-api.test.ts; tests/map-coordinates.test.ts", "Validation tests cover mock/domain helpers, but complete persisted cross-domain action states are not verified."]],
  ["CS-014", ["PARTIAL", "lib/domain/types.ts; supabase/migrations/202610100001_core.sql", "tests/auth-integrations.test.ts", "The three role vocabulary is defined, but full live role/RLS behavior is unverified."]],
  ["CS-017", ["PARTIAL", "app/auth; middleware.ts; lib/supabase/server.ts", "tests/auth-integrations.test.ts", "Auth flows are implemented; live Supabase email/provider behavior is external."]],
  ["CS-018", ["PARTIAL", "lib/supabase/admin-auth.ts; lib/auth/authorization.ts; app/admin/layout.tsx", "tests/auth-integrations.test.ts; e2e/public-discovery.spec.ts", "Server gates exist; full database/RLS integration requires a test Supabase project."]],
  ["CS-021", ["PARTIAL", "lib/supabase/community-partners.ts; app/community-partners", "tests/auth-integrations.test.ts", "Partner application boundary exists; live RLS execution is unverified."]],
  ["CS-022", ["PARTIAL", "supabase/migrations/202610100006_admin_workflows.sql; app/admin/groups/actions.ts", "tests/auth-integrations.test.ts", "Review RPC boundary exists; live migration/RLS verification is unavailable locally."]],
  ["CS-036", ["PARTIAL", "app/projects/[slug]/page.tsx", "npm run typecheck; npm run build", "QR rendering exists, but the current project page still uses demo records and must be connected to the persisted project feed."]],
  ["CS-078", ["PARTIAL", "components/map/osm-map.tsx; lib/services/map-server.ts; app/api/map/route.ts", "tests/map-coordinates.test.ts; e2e/public-discovery.spec.ts", "Map is server-backed; a configured Supabase database is required for persisted records."]],
  ["CS-079", ["PARTIAL", "components/map/osm-map.tsx", "tests/map-coordinates.test.ts", "Distinct marker styling exists, but persisted source records and visual marker behavior are not verified against a live feed."]],
  ["CS-080", ["PARTIAL", "components/map/osm-map.tsx", "npm run typecheck; npm run test:e2e", "Marker links are implemented, but the no-credential E2E environment has no persisted markers to exercise."]],
  ["CS-081", ["PARTIAL", "components/map/osm-map.tsx", "npm run typecheck; npm run test:e2e", "Filtering code exists, but live persisted map records are not available in the deterministic E2E environment."]],
  ["CS-096", ["PARTIAL", "components/map/osm-map.tsx; lib/services/map-server.ts; supabase/migrations/202610100008_public_map_feed.sql", "tests/map-coordinates.test.ts", "Canonical public feed is implemented but not run against a live database here."]],
  ["CS-122", ["PARTIAL", "lib/services/neighbourhood-server.ts; app/api/neighbourhood/issues/[id]/challenge/route.ts", "tests/neighbourhood-api.test.ts", "Challenge mutation is server-authenticated; live persistence remains externally unverified."]],
  ["CS-179", ["PARTIAL", "lib/services/neighbourhood-server.ts; app/sponsorship", "tests/neighbourhood-api.test.ts", "Mock adapter tests cover simulated pledge semantics; live sponsorship persistence is unverified."]],
  ["CS-180", ["PARTIAL", "lib/services/neighbourhood-server.ts; app/sponsorship", "npm run typecheck", "The simulated flag exists, but full browser/payment-boundary behavior is not verified."]],
  ["CS-201", ["PARTIAL", "app/admin/page.tsx; lib/services/admin-server.ts", "npm run typecheck; npm run build", "Admin metrics now query persisted server data; live RLS data is not available locally."]],
  ["CS-220", ["PARTIAL", "lib/validation; lib/services; supabase/migrations", "tests/map-coordinates.test.ts; tests/neighbourhood-api.test.ts", "Several boundaries validate input; complete cross-domain coverage remains."]],
  ["CS-240", ["PARTIAL", "lib/services/neighbourhood-server.ts; app/api/neighbourhood/issues/route.ts", "tests/neighbourhood-api.test.ts", "Supabase-unconfigured failure is surfaced rather than replaced with fixtures."]],
]);

const output = [
  "# CivicSync feature traceability",
  "",
  "> Generated from docs/FEATURE_CHECKLIST.md. This is an evidence register, not a claim that the whole master scope is complete.",
  "> Run npm run generate:traceability after checklist changes, then npm run validate:traceability.",
  "",
  "| ID | Tags | Status | Implementation evidence | Test/verification evidence | Feature |",
  "|---|---|---|---|---|---|",
  ...rows.map((row) => { const item = evidence.get(row.id); return "| " + row.id + " | " + (row.tags || "—") + " | " + (item?.[0] ?? "NOT_IMPLEMENTED") + " | " + (item?.[1] ?? "—") + " | " + (item?.[2] ?? "—") + " | " + row.description + " |"; }),
  "",
];

fs.writeFileSync(path.join(root, "docs", "FEATURE_TRACEABILITY.md"), output.join("\n"), "utf8");
console.log("Generated traceability matrix for " + rows.length + " features.");
