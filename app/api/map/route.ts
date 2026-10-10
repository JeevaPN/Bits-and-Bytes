import { NextResponse } from "next/server";
import { listPublicMapRecords } from "@/lib/services/map-server";
import { logger } from "@/lib/observability/logger";

export async function GET() {
  const result = await listPublicMapRecords();
  if (!result.ok) logger.error("public map query failed", { route: "/api/map", operation: "list_public_map", code: result.error.code });
  return NextResponse.json(result, { status: result.ok ? 200 : 503, headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}
