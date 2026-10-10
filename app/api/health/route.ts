import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEnvironmentDiagnostics } from "@/lib/config/environment";
import { logger } from "@/lib/observability/logger";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const environment = getEnvironmentDiagnostics();
  let database: "ok" | "unconfigured" | "error" = "unconfigured";
  const client = await createClient();
  if (client) {
    const { error } = await client.from("profiles").select("id", { head: true, count: "exact" });
    database = error ? "error" : "ok";
    if (error) logger.error("health database probe failed", { requestId, route: "/api/health", code: error.code || "DATABASE_ERROR" });
  }
  const healthy = environment.missingRequired.length === 0 && database !== "error";
  return NextResponse.json({ ok: healthy, requestId, status: healthy ? "ok" : "degraded", database, environment }, { status: healthy ? 200 : 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
