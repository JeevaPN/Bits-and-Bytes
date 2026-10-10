import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ApiResult } from "@/lib/contracts/v1";
import { validCoordinate } from "@/lib/map/coordinates";
import { logger } from "@/lib/observability/logger";

export type PublicMapRecord = {
  kind: "project" | "issue";
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  location: string;
  status: string;
  source?: string;
  urgent?: boolean;
  href: string;
};

const failure = (message: string): ApiResult<PublicMapRecord[]> => ({ ok: false, error: { code: "UNAVAILABLE", message } });

export async function listPublicMapRecords(): Promise<ApiResult<PublicMapRecord[]>> {
  const client = await createClient();
  if (!client) return failure("Supabase is not configured.");
  const projects = await client.from("public_project_map_feed").select("id,slug,title,location,status,latitude,longitude").limit(1000);
  if (projects.error) { logger.error("public project map read model unavailable", { route: "/api/map", operation: "read_public_project_map_feed", code: `${projects.error.code || "DATABASE_ERROR"}:${projects.error.message.slice(0, 180)}` }); return failure("Public project map data is unavailable. Check the public_project_map_feed view and PostgREST schema cache."); }
  const issues = await client.from("public_issue_feed").select("id,title,location,review_status,source,urgent,latitude,longitude").limit(1000);
  if (issues.error) { logger.error("public issue map read model unavailable", { route: "/api/map", operation: "read_public_issue_feed", code: `${issues.error.code || "DATABASE_ERROR"}:${issues.error.message.slice(0, 180)}` }); return failure("Public issue map data is unavailable. Check the public_issue_feed view and PostgREST schema cache."); }
  const records: PublicMapRecord[] = [];
  for (const row of projects.data ?? []) {
    const latitude = Number(row.latitude); const longitude = Number(row.longitude);
    if (validCoordinate(latitude, longitude)) records.push({ kind: "project", id: String(row.id), title: String(row.title), latitude, longitude, location: String(row.location), status: String(row.status), href: `/projects/${row.slug}` });
  }
  for (const row of issues.data ?? []) {
    const latitude = Number(row.latitude); const longitude = Number(row.longitude);
    if (validCoordinate(latitude, longitude)) records.push({ kind: "issue", id: String(row.id), title: String(row.title), latitude, longitude, location: String(row.location), status: String(row.review_status), source: String(row.source), urgent: Boolean(row.urgent), href: `/neighbourhood/issues/${row.id}` });
  }
  return { ok: true, data: records };
}
