import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEnvironmentDiagnostics } from "@/lib/config/environment";
import { logger } from "@/lib/observability/logger";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const environment = getEnvironmentDiagnostics();
  let database: "ok" | "unconfigured" | "error" = "unconfigured";
  const missingRelations: string[] = [];
  const relationErrors: Record<string, string> = {};
  const client = await createClient();
  if (client) {
    const { error } = await client.from("profiles").select("id", { head: true, count: "exact" });
    database = error ? "error" : "ok";
    if (error) logger.error("health database probe failed", { requestId, route: "/api/health", code: error.code || "DATABASE_ERROR" });
  }
  if (client) { const probes: Record<string, string> = { public_issue_feed: "id,title,location,review_status,source,urgent,latitude,longitude", public_project_map_feed: "id,slug,title,location,status,latitude,longitude", public_sponsorship_campaigns: "id,title,status,target_amount", public_community_groups: "id,name,slug,area,capabilities", coordination_cases: "id,title,project_ids,decision", restoration_inspections: "id,project_id,status,inspection_date" }; for (const [relation, fields] of Object.entries(probes)) { let error = null; for (let attempt = 0; attempt < 2; attempt += 1) { const result = await client.from(relation).select(fields, { head: true, count: "exact" }); error = result.error; if (!error || !["PGRST205", "PGRST204"].includes(error.code || "")) break; await new Promise((resolve) => setTimeout(resolve, 100)); } if (error) { relationErrors[relation] = `${error.code || "DATABASE_ERROR"}:${error.message || "No provider message returned"}`.slice(0, 220); if (error.code === "42P01" || error.code === "PGRST205") missingRelations.push(relation); } } }
  const healthy = environment.missingRequired.length === 0 && database === "ok" && missingRelations.length === 0 && Object.keys(relationErrors).length === 0;
  const components = {
    database: database === "ok" ? "ok" : database,
    privilegedActions: environment.missingPrivilegedActions.length === 0 ? "configured" : "not_configured",
    publicMapReadModel: relationErrors.public_project_map_feed ? "error" : missingRelations.includes("public_project_map_feed") ? "missing" : "ok",
    publicIssueReadModel: relationErrors.public_issue_feed ? "error" : missingRelations.includes("public_issue_feed") ? "missing" : "ok",
    sponsorshipReadModel: relationErrors.public_sponsorship_campaigns ? "error" : missingRelations.includes("public_sponsorship_campaigns") ? "missing" : "ok",
    applicationEmail: environment.optionalIntegrations.RESEND_API_KEY && environment.optionalIntegrations.RESEND_FROM_EMAIL ? "configured" : "not_configured",
    supabaseAuthEmail: "managed_by_supabase_auth_configuration",
  };
  return NextResponse.json({ ok: healthy, requestId, status: healthy ? "ok" : "degraded", database, components, missingRelations, relationErrors, environment }, { status: healthy ? 200 : 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
